import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

// 默认代理目标，使用localhost而不是Docker主机名
const DEFAULT_PROXY_TARGET = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:3001'

const ensureTrimmed = (value) => value ? value.trim() : ''

const resolveProxyTarget = (env) => {
  const apiBase = ensureTrimmed(env.VITE_API_BASE_URL)
  const explicitProxy = ensureTrimmed(env.VITE_DEV_PROXY_TARGET)

  if (apiBase) {
    if (/^https?:\/\//i.test(apiBase)) {
      try {
        return new URL(apiBase).origin
      } catch (error) {
        console.warn('[VITE] Failed to parse VITE_API_BASE_URL, falling back to default proxy target:', error.message)
      }
    } else if (apiBase.includes('://')) {
      try {
        return new URL(apiBase).origin
      } catch (error) {
        console.warn('[VITE] Failed to parse VITE_API_BASE_URL, falling back to default proxy target:', error.message)
      }
    } else if (apiBase.startsWith('/')) {
      return explicitProxy || DEFAULT_PROXY_TARGET
    } else {
      try {
        return new URL(`http://${apiBase}`).origin
      } catch (error) {
        console.warn('[VITE] Failed to parse VITE_API_BASE_URL, falling back to default proxy target:', error.message)
      }
    }
  }

  if (explicitProxy) {
    return explicitProxy
  }

  return DEFAULT_PROXY_TARGET
}

// SPA fallback plugin
const spaFallbackPlugin = {
  name: 'spa-fallback',
  apply: 'serve',
  enforce: 'post',
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        // 只处理GET请求
        if (req.method !== 'GET') {
          return next()
        }

        // 排除API和资源请求
        const url = req.url || '/'
        if (url.startsWith('/api') ||
            url.startsWith('/@') ||  // Vite internal requests
            url.startsWith('/node_modules') ||
            url.match(/\.(js|css|json|wasm|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)($|\?)/)) {
          return next()
        }

        // 如果URL以/src/开头，让Vite处理模块
        if (url.startsWith('/src/')) {
          return next()
        }

        // 所有其他GET请求返回index.html
        try {
          const indexPath = resolve(__dirname, 'index.html')
          const html = fs.readFileSync(indexPath, 'utf-8')
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
        } catch (error) {
          console.error('[VITE SPA] Error serving index.html:', error.message)
          next()
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  // Load envs relative to the frontend directory regardless of CWD
  const env = loadEnv(mode, __dirname, '')

  // 对于本地开发，始终使用localhost
  const proxyTarget = 'http://localhost:3001'

  console.log(`[VITE] API proxy target: ${proxyTarget}`)

  return {
    // Ensure Vite resolves paths relative to the frontend directory
    root: __dirname,
    publicDir: resolve(__dirname, 'public'),
    plugins: [vue(), spaFallbackPlugin],
    optimizeDeps: {
      include: ['canvg']
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      open: false,
      middlewareMode: false,
      hmr: {
        host: 'localhost',
        port: 5174,
        protocol: 'ws'
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const timestamp = new Date().toISOString()
            console.log(`[${timestamp}] [PROXY] 转发: ${path} -> ${path}`)
            return path
          },
          configure: (proxy, options) => {
            const formatLog = (level, type, message) => {
              const timestamp = new Date().toISOString()
              return `[${timestamp}] [${level}] [${type}] ${message}`
            }

            proxy.on('error', (err, req, res) => {
              console.error(formatLog('ERROR', 'PROXY', `${req.method} ${req.url} -> ${err.message}`))
            })

            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(formatLog('INFO', 'PROXY', `${req.method} ${req.url} -> ${options.target}${proxyReq.path}`))
            })

            proxy.on('proxyRes', (proxyRes, req, res) => {
              const status = proxyRes.statusCode
              const level = status >= 400 ? 'WARN' : 'INFO'
              console.log(formatLog(level, 'PROXY', `${req.method} ${req.url} <- ${status}`))
            })
          }
        }
      }
    }
  }
})
