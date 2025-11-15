/**
 * 数据服务层 - 管理模型数据和控制器
 * 为所有后端业务逻辑提供统一的数据管理接口
 */

const {
  ChannelController,
  MessageController,
  PermissionController,
  UserController,
  CryptoController,
  CommunityController
} = require('../controllers/index')

// ============ 全局 MockData 对象 ============
// 在生产环境中，这些数据应该存储在数据库中
const mockData = {
  channels: [],
  messages: [],
  permissions: [],
  users: [],
  userCryptoKeys: new Map(),
  messageIdCounter: 100,
  channelIdCounter: 1
}

// ============ 控制器单例 ============
let controllers = null

/**
 * 初始化所有控制器
 */
function initializeControllers() {
  if (controllers) {
    return controllers
  }

  controllers = {
    channel: new ChannelController(mockData),
    message: new MessageController(mockData),
    permission: new PermissionController(mockData),
    user: new UserController(mockData),
    crypto: new CryptoController(mockData),
    community: new CommunityController(mockData)
  }

  console.log('[DataService] 所有控制器已初始化')
  return controllers
}

/**
 * 获取控制器实例
 */
function getControllers() {
  if (!controllers) {
    initializeControllers()
  }
  return controllers
}

/**
 * 获取 mockData 对象（用于直接访问）
 */
function getMockData() {
  return mockData
}

/**
 * 重置所有数据（仅用于测试）
 */
function resetData() {
  mockData.channels = []
  mockData.messages = []
  mockData.permissions = []
  mockData.users = []
  mockData.userCryptoKeys = new Map()
  mockData.messageIdCounter = 100
  mockData.channelIdCounter = 1

  // 重新初始化控制器以应用默认数据
  controllers = null
  initializeControllers()

  console.log('[DataService] 所有数据已重置')
}

/**
 * 获取系统统计信息
 */
function getStats() {
  return {
    totalChannels: mockData.channels.length,
    totalMessages: mockData.messages.length,
    totalUsers: mockData.users.length,
    totalPermissions: mockData.permissions.length,
    totalEncryptedKeys: mockData.userCryptoKeys.size
  }
}

/**
 * 健康检查
 */
function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      channel: true,
      message: true,
      permission: true,
      user: true,
      crypto: true
    }
  }
}

module.exports = {
  initializeControllers,
  getControllers,
  getMockData,
  resetData,
  getStats,
  healthCheck
}
