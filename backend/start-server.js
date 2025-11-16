#!/usr/bin/env node

/**
 * 启动后端服务器 - 包含私信功能
 */

const { createBackendServer } = require('./server')

const PORT = process.env.PORT || 3001

try {
  console.log('🚀 正在启动后端服务器...')
  const { server, io, eventBridge } = createBackendServer(PORT)

  // 优雅关闭处理
  process.on('SIGTERM', () => {
    console.log('\n收到 SIGTERM 信号，准备关闭服务器...')
    server.close(() => {
      console.log('✅ 服务器已关闭')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信号，准备关闭服务器...')
    server.close(() => {
      console.log('✅ 服务器已关闭')
      process.exit(0)
    })
  })

} catch (error) {
  console.error('❌ 启动服务器失败:', error)
  process.exit(1)
}
