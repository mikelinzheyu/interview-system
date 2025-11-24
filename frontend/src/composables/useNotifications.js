/**
 * useNotifications - 通知系统管理
 *
 * 功能：
 * - 获取通知列表（分页）
 * - 实时 WebSocket 通知推送
 * - 标记为已读
 * - 删除通知
 * - 未读计数
 * - 通知分组和过滤
 * - 通知偏好设置
 */

import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import communityAPI from '@/api/communityWithCache'

export function useNotifications() {
  // 通知数据
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref(null)

  // 分页
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalNotifications = ref(0)

  // WebSocket 连接
  let webSocket = null
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  // 过滤
  const filters = reactive({
    type: 'all',        // all|comment|reply|like|mention|follow|system
    read: 'all'         // all|read|unread
  })

  // 通知偏好
  const preferences = reactive({
    commentNotifications: true,
    replyNotifications: true,
    likeNotifications: true,
    mentionNotifications: true,
    followNotifications: true,
    systemNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    desktopNotifications: true
  })

  /**
   * 获取通知列表
   */
  const fetchNotifications = async (page = 1) => {
    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.getNotifications({
        page,
        pageSize: pageSize.value,
        type: filters.type,
        read: filters.read
      })

      if (response.data) {
        notifications.value = response.data
        totalNotifications.value = response.total || 0
        currentPage.value = page
      }
    } catch (err) {
      // 降级处理：如果API不可用，使用本地存储的通知
      console.warn('[Notifications] API 不可用，使用本地降级:', err.message)
      const localNotifications = localStorage.getItem('__notifications__')
      if (localNotifications) {
        try {
          notifications.value = JSON.parse(localNotifications)
        } catch (e) {
          notifications.value = []
        }
      } else {
        notifications.value = []
      }
      // 不设置error，让UI显示空状态而不是错误
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取未读计数
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await communityAPI.getUnreadNotificationCount()
      if (response.data) {
        unreadCount.value = response.data.count || 0
      }
    } catch (err) {
      // 降级处理：API不可用时保持当前未读计数
      console.warn('[Notifications] 获取未读计数失败，使用本地值:', err.message)
      unreadCount.value = 0
    }
  }

  /**
   * 标记单个通知为已读
   */
  const markAsRead = async (notificationId) => {
    try {
      await communityAPI.markNotificationAsRead(notificationId)

      // 更新本地状态
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  /**
   * 标记全部为已读
   */
  const markAllAsRead = async () => {
    try {
      await communityAPI.markAllNotificationsAsRead()

      // 更新本地状态
      notifications.value.forEach(n => {
        n.read = true
      })
      unreadCount.value = 0
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  /**
   * 删除单个通知
   */
  const deleteNotification = async (notificationId) => {
    try {
      await communityAPI.deleteNotification(notificationId)

      // 更新本地状态
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        const notification = notifications.value[index]
        if (!notification.read) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  /**
   * 清空所有通知
   */
  const clearAllNotifications = async () => {
    try {
      await communityAPI.clearAllNotifications()
      notifications.value = []
      unreadCount.value = 0
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    }
  }

  /**
   * 初始化 WebSocket 连接
   */
  const initializeWebSocket = () => {
    // 检查环境变量是否启用了 WebSocket
    const wsEnabled = import.meta.env.VITE_NOTIFICATIONS_WS_ENABLED !== 'false'

    if (!wsEnabled) {
      console.log('[Notifications] WebSocket 已禁用（设置 VITE_NOTIFICATIONS_WS_ENABLED=true 启用）')
      return
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//localhost:3001/notifications`

    try {
      webSocket = new WebSocket(wsUrl)

      webSocket.onopen = () => {
        console.log('[Notifications] WebSocket connected')
        isConnected.value = true
        reconnectAttempts.value = 0
      }

      webSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleNotificationMessage(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      webSocket.onerror = (error) => {
        console.warn('[Notifications] WebSocket error (已禁用):', error.type)
        isConnected.value = false
      }

      webSocket.onclose = () => {
        console.log('[Notifications] WebSocket disconnected')
        isConnected.value = false
        attemptReconnect()
      }
    } catch (err) {
      console.warn('[Notifications] WebSocket initialization failed:', err.message)
      attemptReconnect()
    }
  }

  /**
   * 处理 WebSocket 消息
   */
  const handleNotificationMessage = (message) => {
    if (message.type === 'notification') {
      // 新通知
      const notification = message.data

      // 添加到列表
      notifications.value.unshift(notification)
      unreadCount.value++

      // 触发通知偏好检查
      if (shouldShowNotification(notification)) {
        showNotification(notification)
      }
    } else if (message.type === 'unread_count') {
      // 未读计数同步
      unreadCount.value = message.data.count
    }
  }

  /**
   * 检查是否应该显示通知
   */
  const shouldShowNotification = (notification) => {
    const typeKey = `${notification.type}Notifications`
    return preferences[typeKey] !== false
  }

  /**
   * 显示通知（音频/振动/桌面通知）
   */
  const showNotification = (notification) => {
    // 播放声音
    if (preferences.soundEnabled) {
      playNotificationSound()
    }

    // 振动反馈
    if (preferences.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    // 桌面通知
    if (preferences.desktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.content.title, {
          body: notification.content.body,
          icon: '/logo.png',
          tag: `notification-${notification.id}`
        })
      }
    }
  }

  /**
   * 播放通知声音
   */
  const playNotificationSound = () => {
    // 使用 Web Audio API 或预加载的音频文件
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {
      // 浏览器可能禁止自动播放
    })
  }

  /**
   * 尝试重新连接 WebSocket
   */
  const attemptReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.warn('[Notifications] Max reconnect attempts reached')
      return
    }

    reconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value - 1), 30000)

    console.log(`[Notifications] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.value})`)
    setTimeout(() => {
      initializeWebSocket()
    }, delay)
  }

  /**
   * 请求桌面通知权限
   */
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (err) {
      console.error('Failed to request notification permission:', err)
      return false
    }
  }

  /**
   * 更新通知偏好
   */
  const updatePreferences = async (newPreferences) => {
    try {
      await communityAPI.updateNotificationPreferences(newPreferences)

      // 更新本地状态
      Object.assign(preferences, newPreferences)
    } catch (err) {
      console.error('Failed to update preferences:', err)
    }
  }

  /**
   * 改变过滤器
   */
  const changeFilter = async (filterName, value) => {
    filters[filterName] = value
    currentPage.value = 1
    await fetchNotifications(1)
  }

  /**
   * 改变分页
   */
  const changePage = async (page) => {
    currentPage.value = page
    await fetchNotifications(page)
  }

  /**
   * 改变每页数量
   */
  const changePageSize = async (size) => {
    pageSize.value = size
    currentPage.value = 1
    await fetchNotifications(1)
  }

  /**
   * 刷新通知
   */
  const refresh = async () => {
    await Promise.all([
      fetchNotifications(currentPage.value),
      fetchUnreadCount()
    ])
  }

  /**
   * 关闭 WebSocket 连接
   */
  const closeWebSocket = () => {
    if (webSocket) {
      webSocket.close()
      webSocket = null
    }
    isConnected.value = false
  }

  /**
   * 计算属性：分页信息
   */
  const pageInfo = computed(() => {
    const total = totalNotifications.value
    const pages = Math.ceil(total / pageSize.value)

    return {
      total,
      pages,
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      hasNextPage: currentPage.value < pages,
      hasPrevPage: currentPage.value > 1
    }
  })

  /**
   * 计算属性：通知类型选项
   */
  const typeOptions = computed(() => [
    { label: '全部', value: 'all' },
    { label: '评论', value: 'comment' },
    { label: '回复', value: 'reply' },
    { label: '点赞', value: 'like' },
    { label: '提及', value: 'mention' },
    { label: '关注', value: 'follow' },
    { label: '系统', value: 'system' }
  ])

  /**
   * 计算属性：已读状态选项
   */
  const readOptions = computed(() => [
    { label: '全部', value: 'all' },
    { label: '已读', value: 'read' },
    { label: '未读', value: 'unread' }
  ])

  /**
   * 计算属性：分组通知
   */
  const groupedNotifications = computed(() => {
    const grouped = {}

    notifications.value.forEach(notification => {
      const date = new Date(notification.createdAt).toLocaleDateString('zh-CN')
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(notification)
    })

    return grouped
  })

  /**
   * 生命周期
   */
  onMounted(() => {
    // 初始化：获取通知和未读计数
    Promise.all([
      fetchNotifications(1),
      fetchUnreadCount()
    ])

    // 初始化 WebSocket
    initializeWebSocket()

    // 请求桌面通知权限
    requestNotificationPermission()
  })

  onUnmounted(() => {
    closeWebSocket()
  })

  return {
    // 数据
    notifications,
    unreadCount,
    loading,
    error,
    currentPage,
    pageSize,
    totalNotifications,
    filters,
    preferences,
    isConnected,
    groupedNotifications,

    // 计算属性
    pageInfo,
    typeOptions,
    readOptions,

    // 方法
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    changeFilter,
    changePage,
    changePageSize,
    refresh,
    updatePreferences,
    closeWebSocket
  }
}
