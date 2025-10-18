/**
 * 通知系统 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getWebSocketBaseUrl } from '@/utils/networkConfig'

export const useNotificationsStore = defineStore('notifications', () => {
  // 通知列表
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)

  // WebSocket 连接
  let ws = null
  let reconnectTimer = null
  const wsConnected = ref(false)

  // 获取未读数量
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read)
  })

  /**
   * 连接 WebSocket
   */
  const connectWebSocket = (userId) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // 生产环境应使用实际的 WebSocket 地址
      const wsUrl = `${getWebSocketBaseUrl()}/ws/notifications?userId=${userId}`
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket 连接成功')
        wsConnected.value = true
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          handleNewNotification(notification)
        } catch (error) {
          console.error('解析通知消息失败:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error)
        wsConnected.value = false
      }

      ws.onclose = () => {
        console.log('WebSocket 连接关闭')
        wsConnected.value = false
        // 自动重连
        reconnectTimer = setTimeout(() => {
          console.log('尝试重新连接 WebSocket...')
          connectWebSocket(userId)
        }, 5000)
      }
    } catch (error) {
      console.error('WebSocket 连接失败:', error)
    }
  }

  /**
   * 断开 WebSocket
   */
  const disconnectWebSocket = () => {
    if (ws) {
      ws.close()
      ws = null
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    wsConnected.value = false
  }

  /**
   * 处理新通知
   */
  const handleNewNotification = (notification) => {
    // 添加到列表开头
    notifications.value.unshift({
      id: notification.id || Date.now(),
      type: notification.type || 'info',
      title: notification.title,
      content: notification.content,
      link: notification.link,
      read: false,
      createdAt: notification.createdAt || new Date().toISOString()
    })

    // 更新未读数量
    unreadCount.value++

    // 显示浏览器通知（如果用户允许）
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.content,
        icon: '/logo.png'
      })
    }
  }

  /**
   * 加载通知列表
   */
  const fetchNotifications = async () => {
    loading.value = true
    try {
      // 这里应该调用实际的 API
      // const response = await api.get('/notifications')
      // 模拟数据
      const mockData = [
        {
          id: 1,
          type: 'comment',
          title: '新评论',
          content: '张三评论了你的题目《实现防抖函数》',
          link: '/contributions/question/1',
          read: false,
          createdAt: '2分钟前'
        },
        {
          id: 2,
          type: 'like',
          title: '点赞通知',
          content: '李四赞了你的讨论',
          link: '/contributions/question/2',
          read: false,
          createdAt: '10分钟前'
        },
        {
          id: 3,
          type: 'follow',
          title: '新粉丝',
          content: '王五关注了你',
          link: '/contributions/profile/3',
          read: true,
          createdAt: '1小时前'
        },
        {
          id: 4,
          type: 'system',
          title: '系统通知',
          content: '你的题目《Vue3 响应式原理》已通过审核',
          link: '/contributions/my-submissions',
          read: true,
          createdAt: '3小时前'
        }
      ]

      notifications.value = mockData
      unreadCount.value = mockData.filter(n => !n.read).length
    } catch (error) {
      console.error('加载通知失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 标记为已读
   */
  const markAsRead = async (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      unreadCount.value--

      // 调用 API 更新服务器
      // await api.put(`/notifications/${notificationId}/read`)
    }
  }

  /**
   * 全部标记为已读
   */
  const markAllAsRead = async () => {
    notifications.value.forEach(n => {
      n.read = true
    })
    unreadCount.value = 0

    // 调用 API
    // await api.put('/notifications/read-all')
  }

  /**
   * 删除通知
   */
  const deleteNotification = async (notificationId) => {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index > -1) {
      const notification = notifications.value[index]
      if (!notification.read) {
        unreadCount.value--
      }
      notifications.value.splice(index, 1)

      // 调用 API
      // await api.delete(`/notifications/${notificationId}`)
    }
  }

  /**
   * 清空所有通知
   */
  const clearAll = async () => {
    notifications.value = []
    unreadCount.value = 0

    // 调用 API
    // await api.delete('/notifications/clear')
  }

  /**
   * 请求浏览器通知权限
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }

  return {
    notifications,
    unreadCount,
    loading,
    wsConnected,
    unreadNotifications,
    connectWebSocket,
    disconnectWebSocket,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestNotificationPermission
  }
})
