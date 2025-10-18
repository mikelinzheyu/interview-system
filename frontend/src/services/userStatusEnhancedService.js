/**
 * 用户状态增强服务
 * 支持自定义状态、持久化、实时同步等高级功能
 */

// 用户状态配置
const USER_STATUS_CONFIG = {
  STATUS_TYPES: {
    online: { label: '在线', icon: '🟢', priority: 1 },
    away: { label: '离开', icon: '🟡', priority: 2 },
    busy: { label: '忙碌', icon: '🔴', priority: 3 },
    offline: { label: '离线', icon: '⚫', priority: 4 }
  },
  STATUS_TIMEOUT: 5 * 60 * 1000, // 5分钟无活动自动改为离开
  AUTO_OFFLINE: 30 * 60 * 1000, // 30分钟无活动自动离线
  SYNC_INTERVAL: 30 * 1000, // 30秒同步一次状态
  STORAGE_KEY: 'user_status_custom'
}

// 用户状态管理
class UserStatusManager {
  constructor() {
    this.currentStatus = 'online'
    this.customStatus = null
    this.lastActivityTime = Date.now()
    this.statusHistory = []
    this.statusChangeCallbacks = []
    this.syncTimer = null
    this.autoOfflineTimer = null

    this.initAutoStatusManagement()
  }

  /**
   * 初始化自动状态管理
   */
  initAutoStatusManagement() {
    // 监听用户活动
    this.setupActivityListeners()
    // 启动状态同步
    this.startStatusSync()
  }

  /**
   * 监听用户活动
   */
  setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'touchstart', 'click']

    events.forEach(event => {
      document.addEventListener(
        event,
        () => {
          this.lastActivityTime = Date.now()
          // 如果状态是离开，恢复为在线
          if (this.currentStatus === 'away') {
            this.setStatus('online')
          }
        },
        { passive: true }
      )
    })

    // 定期检查是否应该自动改为离开
    setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivityTime
      if (
        inactiveTime > USER_STATUS_CONFIG.STATUS_TIMEOUT &&
        this.currentStatus === 'online'
      ) {
        this.setStatus('away')
      }

      if (
        inactiveTime > USER_STATUS_CONFIG.AUTO_OFFLINE &&
        this.currentStatus !== 'offline'
      ) {
        this.setStatus('offline')
      }
    }, 60000) // 每分钟检查一次
  }

  /**
   * 设置用户状态
   */
  setStatus(status, customMessage = null) {
    if (!USER_STATUS_CONFIG.STATUS_TYPES[status]) {
      console.error(`Invalid status: ${status}`)
      return false
    }

    const oldStatus = this.currentStatus

    this.currentStatus = status
    if (customMessage) {
      this.customStatus = customMessage
    }

    // 记录状态变化
    this.recordStatusChange(oldStatus, status, customMessage)

    // 触发回调
    this.notifyStatusChange({
      oldStatus,
      newStatus: status,
      customMessage,
      timestamp: new Date().toISOString()
    })

    // 持久化状态
    this.persistStatus()

    return true
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      status: this.currentStatus,
      customStatus: this.customStatus,
      statusInfo: USER_STATUS_CONFIG.STATUS_TYPES[this.currentStatus],
      lastActivityTime: this.lastActivityTime,
      inactiveTime: Date.now() - this.lastActivityTime
    }
  }

  /**
   * 设置自定义消息
   */
  setCustomMessage(message) {
    if (message && message.length > 50) {
      return false // 限制消息长度
    }

    this.customStatus = message
    this.persistStatus()

    return true
  }

  /**
   * 获取自定义消息
   */
  getCustomMessage() {
    return this.customStatus
  }

  /**
   * 格式化状态显示
   */
  formatStatus() {
    const info = USER_STATUS_CONFIG.STATUS_TYPES[this.currentStatus]
    let text = info.label

    if (this.customStatus) {
      text += ` - ${this.customStatus}`
    }

    return {
      icon: info.icon,
      text,
      status: this.currentStatus,
      fullText: `${info.icon} ${text}`
    }
  }

  /**
   * 记录状态变化
   */
  recordStatusChange(oldStatus, newStatus, message) {
    this.statusHistory.push({
      from: oldStatus,
      to: newStatus,
      message,
      timestamp: new Date().toISOString(),
      inactiveTime: Date.now() - this.lastActivityTime
    })

    // 限制历史记录数量
    if (this.statusHistory.length > 100) {
      this.statusHistory.shift()
    }
  }

  /**
   * 获取状态历史
   */
  getStatusHistory(limit = 20) {
    return this.statusHistory.slice(-limit).reverse()
  }

  /**
   * 注册状态变化回调
   */
  onStatusChange(callback) {
    if (typeof callback === 'function') {
      this.statusChangeCallbacks.push(callback)
    }
  }

  /**
   * 取消注册状态变化回调
   */
  offStatusChange(callback) {
    const index = this.statusChangeCallbacks.indexOf(callback)
    if (index > -1) {
      this.statusChangeCallbacks.splice(index, 1)
    }
  }

  /**
   * 触发状态变化回调
   */
  notifyStatusChange(data) {
    this.statusChangeCallbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in status change callback:', error)
      }
    })
  }

  /**
   * 启动状态同步
   */
  startStatusSync() {
    this.syncTimer = setInterval(() => {
      this.syncStatusToServer()
    }, USER_STATUS_CONFIG.SYNC_INTERVAL)
  }

  /**
   * 停止状态同步
   */
  stopStatusSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  /**
   * 同步状态到服务器
   */
  async syncStatusToServer() {
    try {
      const statusData = this.getStatus()
      // TODO: 调用API同步状态
      // await api.put('/chat/users/me/status', statusData)
    } catch (error) {
      console.error('Failed to sync status:', error)
    }
  }

  /**
   * 持久化状态
   */
  persistStatus() {
    const data = {
      status: this.currentStatus,
      customStatus: this.customStatus,
      lastUpdateTime: new Date().toISOString()
    }

    localStorage.setItem(USER_STATUS_CONFIG.STORAGE_KEY, JSON.stringify(data))
  }

  /**
   * 恢复持久化的状态
   */
  restoreStatus() {
    try {
      const data = localStorage.getItem(USER_STATUS_CONFIG.STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        this.currentStatus = parsed.status || 'online'
        this.customStatus = parsed.customStatus || null

        // 如果保存的状态是离线，恢复为在线
        if (this.currentStatus === 'offline') {
          this.currentStatus = 'online'
        }
      }
    } catch (error) {
      console.error('Failed to restore status:', error)
    }
  }

  /**
   * 获取所有可用状态
   */
  getAvailableStatuses() {
    return Object.entries(USER_STATUS_CONFIG.STATUS_TYPES).map(([key, value]) => ({
      value: key,
      ...value
    }))
  }

  /**
   * 清除数据
   */
  clear() {
    this.currentStatus = 'online'
    this.customStatus = null
    this.lastActivityTime = Date.now()
    this.statusHistory = []
    this.stopStatusSync()
    localStorage.removeItem(USER_STATUS_CONFIG.STORAGE_KEY)
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.stopStatusSync()
    this.statusChangeCallbacks = []
  }
}

// 全局实例
let statusManager = null

/**
 * 获取或创建用户状态管理器
 */
export function getStatusManager() {
  if (!statusManager) {
    statusManager = new UserStatusManager()
    statusManager.restoreStatus()
  }
  return statusManager
}

/**
 * 设置用户状态
 */
export function setUserStatus(status, message = null) {
  const manager = getStatusManager()
  return manager.setStatus(status, message)
}

/**
 * 获取当前用户状态
 */
export function getCurrentUserStatus() {
  const manager = getStatusManager()
  return manager.getStatus()
}

/**
 * 设置自定义消息
 */
export function setStatusMessage(message) {
  const manager = getStatusManager()
  return manager.setCustomMessage(message)
}

/**
 * 获取格式化的状态显示
 */
export function getFormattedStatus() {
  const manager = getStatusManager()
  return manager.formatStatus()
}

/**
 * 注册状态变化监听
 */
export function onStatusChange(callback) {
  const manager = getStatusManager()
  manager.onStatusChange(callback)
}

/**
 * 获取状态历史
 */
export function getStatusHistory(limit = 20) {
  const manager = getStatusManager()
  return manager.getStatusHistory(limit)
}

/**
 * 获取可用状态列表
 */
export function getAvailableStatuses() {
  const manager = getStatusManager()
  return manager.getAvailableStatuses()
}

/**
 * 获取用户配置
 */
export function getStatusConfig() {
  return USER_STATUS_CONFIG
}

export default {
  getStatusManager,
  setUserStatus,
  getCurrentUserStatus,
  setStatusMessage,
  getFormattedStatus,
  onStatusChange,
  getStatusHistory,
  getAvailableStatuses,
  getStatusConfig,
  USER_STATUS_CONFIG
}
