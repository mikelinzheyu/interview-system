/**
 * Backend 服务器启动器 - 集成 Express API 和 WebSocket
 * 在 mock-server.js 中使用此模块来初始化所有服务
 */

const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const { initializeWebSocket } = require('./websocket-server')
const apiRouter = require('./routes/api')
const { initializeControllers } = require('./services/dataService')
const { eventBridge } = require('./services/eventBridge')

// 导入数据库和模型，用于自动同步
const sequelize = require('./config/database')
const { AIConversation, AIMessage } = require('./models')

/**
 * 创建和配置后端服务器
 * 支持 Express API 和 WebSocket
 */
function createBackendServer(PORT = 3001) {
  // 创建 Express 应用
  const apiApp = express()

  // 配置中间件
  apiApp.use((req, res, next) => {
    const timestamp = new Date().toISOString()
    const method = req.method.padEnd(6)
    console.log(`[${timestamp}] ${method} ${req.path}`)
    next()
  })

  apiApp.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
  }))

  apiApp.use(bodyParser.json({ limit: '50mb' }))
  apiApp.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

  // 静态提供用户上传的资源（头像等）
  apiApp.use('/api/uploads', express.static(path.join(__dirname, 'uploads')))

  // 初始化数据和控制器
  console.log('[Init] 正在初始化数据层...')
  initializeControllers()

  // 注册路由
  apiApp.get('/', (req, res) => {
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

  apiApp.get('/health', (req, res) => {
    res.json({
      code: 200,
      message: 'API server is running',
      timestamp: new Date().toISOString()
    })
  })

  // 挂载 API 路由
  apiApp.use('/api', apiRouter)

  // 404 处理
  apiApp.use((req, res) => {
    res.status(404).json({
      code: 404,
      message: 'Route not found',
      path: req.path
    })
  })

  // 全局错误处理
  apiApp.use((err, req, res, next) => {
    console.error('[API Error]', err.message)
    res.status(err.statusCode || 500).json({
      code: err.statusCode || 500,
      message: err.message || 'Internal server error'
    })
  })

  // 创建 HTTP 服务器
  const server = http.createServer(apiApp)

  // 初始化 WebSocket
  console.log('[Init] 正在初始化 WebSocket...')
  const io = initializeWebSocket(server)

  // 初始化事件桥接 - 将 REST API 事件连接到 WebSocket
  console.log('[Init] 正在初始化事件桥接...')
  eventBridge.initialize(io)

  // 同步数据库表
  console.log('[Init] 正在同步数据库表...')
  sequelize.sync({ alter: true })
    .then(() => {
      console.log('✅ 数据库表同步成功')

      // 启动服务器
      server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          🚀 Backend Server 已启动                          ║
╠════════════════════════════════════════════════════════════╣
║  HTTP API  : http://localhost:${PORT}/api                    ║
║  WebSocket : ws://localhost:${PORT}                         ║
║  Health    : http://localhost:${PORT}/health                ║
║                                                            ║
║  API 端点数: 41 个                                         ║
║  支持功能:                                                ║
║  ✓ 频道管理 (8 个端点)                                     ║
║  ✓ 消息操作 (10 个端点)                                    ║
║  ✓ 表情反应 (3 个端点)                                     ║
║  ✓ 已读回执 (2 个端点)                                     ║
║  ✓ 用户管理 (4 个端点)                                     ║
║  ✓ 权限管理 (7 个端点)                                     ║
║  ✓ 加密密钥 (2 个端点)                                     ║
║  ✓ DM 消息 (5 个端点)                                      ║
║  ✓ WebSocket 实时同步 (20+ 个事件)                         ║
║  ✓ REST ↔ WebSocket 事件桥接 ✅                           ║
╚════════════════════════════════════════════════════════════╝
      `)
      })
    })
    .catch((err) => {
      console.error('❌ 数据库同步失败:', err.message)
      console.error(err)
      process.exit(1)
    })

  return { server, io, eventBridge }
}

module.exports = {
  createBackendServer
}
