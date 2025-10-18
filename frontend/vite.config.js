import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const DEFAULT_PROXY_TARGET = 'http://localhost:3001'

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = resolveProxyTarget(env)

  console.log(`[VITE] API proxy target: ${proxyTarget}`)

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0', // 监听所有网络接口
      port: 5174, // 修正为日志中显示的端口
      open: false,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          // 不需要重写路径，直接转发到后端的/api
          rewrite: (path) => {
            const timestamp = new Date().toISOString()
            console.log(`[${timestamp}] [PROXY] 转发: ${path} -> ${path}`)
            return path
          },
          configure: (proxy, options) => {
            // 统一日志格式
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
