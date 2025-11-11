/**
 * useForumNotifications - WebSocket 实时通知组合式函数
 * 用于接收论坛的实时通知（新帖子、评论、点赞等）
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'

export function useForumNotifications(userId) {
  const notifications = ref([])
  const isConnected = ref(false)
  const unreadCount = ref(0)
  let ws = null

  /**
   * 连接 WebSocket
   */
  const connect = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/community?userId=${userId}`

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        isConnected.value = true
      }

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          handleNotification(notification)
        } catch (error) {
          console.error('Failed to parse notification:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        isConnected.value = false
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        isConnected.value = false
        // 3秒后自动重连
        setTimeout(connect, 3000)
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      isConnected.value = false
    }
  }

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (ws) {
      ws.close()
      ws = null
    }
  }

  /**
   * 处理通知
   */
  const handleNotification = (notification) => {
    notifications.value.unshift(notification)
    unreadCount.value++

    // 显示系统通知
    showNotification(notification)

    // 保留最近 50 条通知
    if (notifications.value.length > 50) {
      notifications.value.pop()
    }
  }

  /**
   * 显示系统通知
   */
  const showNotification = (notification) => {
    const {
      type = 'info',
      title = '论坛通知',
      message = '',
      autoClose = true
    } = notification

    ElNotification({
      title,
      message,
      type,
      duration: autoClose ? 4000 : 0,
      position: 'top-right',
      onClick: () => {
        // 可以添加点击后的跳转逻辑
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl
        }
      }
    })
  }

  /**
   * 标记为已读
   */
  const markAsRead = (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  /**
   * 标记全部为已读
   */
  const markAllAsRead = () => {
    notifications.value.forEach(n => {
      n.read = true
    })
    unreadCount.value = 0
  }

  /**
   * 清空通知
   */
  const clearNotifications = () => {
    notifications.value = []
    unreadCount.value = 0
  }

  /**
   * 获取未读通知
   */
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read)
  })

  /**
   * 发送消息到服务器
   */
  const send = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  onMounted(() => {
    if (userId) {
      connect()
    }
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    // 状态
    notifications,
    isConnected,
    unreadCount,
    unreadNotifications,

    // 方法
    connect,
    disconnect,
    send,
    markAsRead,
    markAllAsRead,
    clearNotifications
  }
}
