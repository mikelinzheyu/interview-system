/**
 * Express 应用配置
 * 集成所有中间件、路由和WebSocket功能
 */

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const apiRouter = require('./routes/api')
const { initializeControllers } = require('./services/dataService')

// 创建 Express 应用
const app = express()

// ==================== 全局中间件 ====================

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
})

// CORS 中间件 - 允许来自任何域的跨域请求
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}))

// 请求体解析中间件
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态提供用户上传的资源（头像等）
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')))

// 根路径端点
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'AI Interview System API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: '/api/health'
    }
  })
})

// 健康检查端点（在所有其他路由之前）
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'API server is healthy',
    timestamp: new Date().toISOString()
  })
})

// ==================== API 路由 ====================

// 初始化控制器和数据
initializeControllers()

// 挂载 API 路由到 /api 前缀
app.use('/api', apiRouter)

// ==================== 错误处理中间件 ====================

// 404 处理
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path}`)
  res.status(404).json({
    code: 404,
    message: 'Route not found',
    path: req.path
  })
})

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('[Error]', err)

  res.status(err.statusCode || 500).json({
    code: err.statusCode || 500,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// ==================== 服务器启动配置 ====================

/**
 * 为 HTTP 服务器配置 Express 应用
 * @param {http.Server} httpServer - Node.js HTTP 服务器实例
 */
function configureExpressApp(httpServer) {
  // 将 Express 应用与 HTTP 服务器关联
  httpServer.on('request', app)

  console.log('[Express] Express 应用已配置到 HTTP 服务器')
  console.log('[API] 所有路由已挂载到 /api 前缀')
  console.log('[API] 支持的端点数: 41 个 (频道、消息、用户、权限、加密、DM)')
}

module.exports = {
  app,
  configureExpressApp
}
