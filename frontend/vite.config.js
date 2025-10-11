import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
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
        target: 'http://localhost:3001', // Mock服务器地址
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
})