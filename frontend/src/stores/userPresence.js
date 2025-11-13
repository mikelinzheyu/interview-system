import { defineStore } from 'pinia'
import { reactive, ref, computed } from 'vue'

/**
 * 用户状态存储
 * 管理用户在线状态、状态消息、最后活动时间等信息
 */
export const useUserPresenceStore = defineStore('user-presence', () => {
  // 用户状态映射
  const userStatus = reactive({})  // { userId: { status, message, updatedAt, lastSeen } }

  // 状态类型常量
  const STATUS_TYPES = {
    ONLINE: 'online',        // 在线
    AWAY: 'away',           // 离开
    BUSY: 'busy',           // 忙碌
    DND: 'dnd',             // 勿扰模式
    OFFLINE: 'offline'      // 离线
  }

  // 状态展示配置
  const STATUS_CONFIG = {
    online: {
      label: '在线',
      color: '#67c23a',
      icon: '●',
      description: '正在线'
    },
    away: {
      label: '离开',
      color: '#e6a23c',
      icon: '●',
      description: '暂时离开'
    },
    busy: {
      label: '忙碌',
      color: '#f56c6c',
      icon: '●',
      description: '忙碌中'
    },
    dnd: {
      label: '勿扰',
      color: '#909399',
      icon: '●',
      description: '勿扰模式'
    },
    offline: {
      label: '离线',
      color: '#ccc',
      icon: '●',
      description: '已离线'
    }
  }

  const currentUserId = ref(null)
  const currentUserStatus = ref(STATUS_TYPES.ONLINE)
  const currentUserMessage = ref('')

  /**
   * 获取用户状态
   */
  function getUserStatus(userId) {
    return userStatus[userId] || {
      status: STATUS_TYPES.OFFLINE,
      message: '',
      updatedAt: null,
      lastSeen: null
    }
  }

  /**
   * 获取用户状态标签
   */
  function getStatusLabel(status) {
    return STATUS_CONFIG[status]?.label || '未知'
  }

  /**
   * 获取用户状态颜色
   */
  function getStatusColor(status) {
    return STATUS_CONFIG[status]?.color || '#ccc'
  }

  /**
   * 获取用户状态配置
   */
  function getStatusConfig(status) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.offline
  }

  /**
   * 设置当前用户状态
   */
  function setCurrentUserStatus(status, message = '') {
    if (!currentUserId.value) return

    currentUserStatus.value = status
    currentUserMessage.value = message

    const now = new Date().toISOString()
    userStatus[currentUserId.value] = {
      status,
      message,
      updatedAt: now,
      lastSeen: now,
      userId: currentUserId.value
    }

    // 触发 WebSocket 事件来通知其他客户端
    // ChatSocketService.emit('user.status.changed', {
    //   userId: currentUserId.value,
    //   status,
    //   message,
    //   updatedAt: now
    // })
  }

  /**
   * 更新用户状态 (通常来自服务器)
   */
  function updateUserStatus(userId, status, extra = {}) {
    if (!userId) return

    const now = new Date().toISOString()
    userStatus[userId] = {
      userId,
      status: status || STATUS_TYPES.OFFLINE,
      message: extra.message || '',
      updatedAt: now,
      lastSeen: extra.lastSeen || now,
      ...extra
    }
  }

  /**
   * 批量更新用户状态
   */
  function batchUpdateUserStatus(statusUpdates = []) {
    statusUpdates.forEach(update => {
      if (update.userId) {
        updateUserStatus(update.userId, update.status, {
          message: update.message,
          lastSeen: update.lastSeen
        })
      }
    })
  }

  /**
   * 设置当前用户ID
   */
  function setCurrentUserId(userId) {
    currentUserId.value = userId
    if (!userStatus[userId]) {
      userStatus[userId] = {
        userId,
        status: STATUS_TYPES.ONLINE,
        message: '',
        updatedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      }
    }
  }

  /**
   * 获取在线用户列表
   */
  const onlineUsers = computed(() => {
    return Object.values(userStatus).filter(u => u.status === STATUS_TYPES.ONLINE)
  })

  /**
   * 获取离线用户列表
   */
  const offlineUsers = computed(() => {
    return Object.values(userStatus).filter(u => u.status === STATUS_TYPES.OFFLINE)
  })

  /**
   * 获取忙碌用户列表
   */
  const busyUsers = computed(() => {
    return Object.values(userStatus).filter(u => u.status === STATUS_TYPES.BUSY)
  })

  /**
   * 获取在离开状态的用户列表
   */
  const awayUsers = computed(() => {
    return Object.values(userStatus).filter(u => u.status === STATUS_TYPES.AWAY)
  })

  /**
   * 获取所有用户状态 (按状态分类)
   */
  const allUsersGrouped = computed(() => {
    return {
      online: onlineUsers.value,
      away: awayUsers.value,
      busy: busyUsers.value,
      offline: offlineUsers.value
    }
  })

  /**
   * 获取用户最后看到的时间文本
   */
  function getLastSeenText(userId) {
    const user = userStatus[userId]
    if (!user || !user.lastSeen) return '未知'

    const lastSeen = new Date(user.lastSeen)
    const now = new Date()
    const diffMs = now - lastSeen
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`

    return lastSeen.toLocaleDateString('zh-CN')
  }

  /**
   * 清除用户状态
   */
  function clearUserStatus(userId) {
    if (userStatus[userId]) {
      delete userStatus[userId]
    }
  }

  /**
   * 清除所有状态 (登出时)
   */
  function clearAllStatus() {
    Object.keys(userStatus).forEach(userId => {
      delete userStatus[userId]
    })
    currentUserId.value = null
    currentUserStatus.value = STATUS_TYPES.OFFLINE
    currentUserMessage.value = ''
  }

  return {
    // 状态
    userStatus,
    currentUserId,
    currentUserStatus,
    currentUserMessage,

    // 常量
    STATUS_TYPES,
    STATUS_CONFIG,

    // 计算属性
    onlineUsers,
    offlineUsers,
    busyUsers,
    awayUsers,
    allUsersGrouped,

    // 方法
    getUserStatus,
    getStatusLabel,
    getStatusColor,
    getStatusConfig,
    setCurrentUserStatus,
    updateUserStatus,
    batchUpdateUserStatus,
    setCurrentUserId,
    getLastSeenText,
    clearUserStatus,
    clearAllStatus
  }
})

export default useUserPresenceStore
