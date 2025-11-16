/**
 * WebSocket 连接和管理 (基于 Socket.IO)
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import { useUserStore } from '@/stores/user'
import { useMessagingStore } from '@/stores/messagingStore'

let socket = null

/**
 * WebSocket 连接管理（Socket.IO）
 */
export const useWebSocket = () => {
  const userStore = useUserStore()
  const messagingStore = useMessagingStore()

  const connected = ref(false)
  const connecting = ref(false)

  /**
   * 连接到 WebSocket 服务器
   */
  const connect = () => {
    if (!userStore.user?.id) {
      console.warn('[WebSocket] User not authenticated, skipping connection')
      return
    }

    if (socket && socket.connected) {
      console.log('[WebSocket] Already connected')
      return
    }

    connecting.value = true

    try {
      // 获取用户令牌和ID
      const token = localStorage.getItem('token') || userStore.user.id
      const userId = userStore.user.id

      // 使用环境变量中的 WebSocket 基础 URL（例如：http://localhost:3001）
      // 转换为 WebSocket URL (http -> ws, https -> wss)
      const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:3001'
      const protocol = baseUrl.startsWith('https') ? 'wss:' : 'ws:'
      const host = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
      const url = `${protocol}//${host}`

      console.log('[WebSocket] Connecting to:', url)

      // 创建 Socket.IO 连接
      socket = io(url, {
        auth: {
          token,
          userId
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })

      // 连接成功
      socket.on('connect', () => {
        console.log('[WebSocket] Connected successfully')
        connected.value = true
        connecting.value = false

        // 发送初始握手消息
        socket.emit('ping', { userId })
      })

      // 接收消息
      socket.on('private-message', (message) => {
        console.log('[WebSocket] New private message:', message)
        messagingStore.addMessageFromSocket(message)
      })

      // 消息已读
      socket.on('message-read', (data) => {
        console.log('[WebSocket] Message read:', data)
        const { messageId, readBy, readAt } = data
        const message = messagingStore.messages.find(m => m.id === messageId)
        if (message) {
          message.status = 'read'
          message.readBy = readBy
          message.readAt = readAt
        }
      })

      // 对话已读
      socket.on('conversation-read', (data) => {
        console.log('[WebSocket] Conversation read:', data)
        const { conversationId } = data
        if (messagingStore.currentConversation?.id === conversationId) {
          messagingStore.messages.forEach(m => {
            if (m.status !== 'read') {
              m.status = 'read'
            }
          })
        }
      })

      // 用户输入指示
      socket.on('user-typing', (data) => {
        console.log('[WebSocket] User typing:', data)
        // TODO: 显示"正在输入..."指示符
      })

      // 用户在线状态
      socket.on('user-online-status', (data) => {
        console.log('[WebSocket] Online status update:', data)
        const { userId: statusUserId, isOnline } = data
        if (messagingStore.currentConversation?.otherUser?.id === statusUserId) {
          messagingStore.currentConversation.otherUser.isOnline = isOnline
        }
      })

      // Pong 响应
      socket.on('pong', (data) => {
        console.log('[WebSocket] Pong received:', data)
      })

      // 错误处理
      socket.on('error', (error) => {
        console.error('[WebSocket] Connection error:', error)
        connected.value = false
        connecting.value = false
      })

      // 断开连接
      socket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected')
        connected.value = false
        connecting.value = false
      })

      // 重新连接
      socket.on('reconnect', () => {
        console.log('[WebSocket] Reconnected')
        connected.value = true
        connecting.value = false
      })

      socket.on('reconnect_attempt', () => {
        console.log('[WebSocket] Attempting to reconnect...')
      })
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
      connecting.value = false
    }
  }

  /**
   * 发送消息到服务器
   */
  const sendMessage = (type, payload) => {
    if (!socket || !socket.connected) {
      console.warn('[WebSocket] Not connected, cannot send message')
      return false
    }

    try {
      socket.emit(type, payload)
      console.log('[WebSocket] Message sent:', type)
      return true
    } catch (error) {
      console.error('[WebSocket] Send error:', error)
      return false
    }
  }

  /**
   * 加入对话房间
   */
  const joinConversation = (conversationId) => {
    return sendMessage('join-conversation', {
      conversationId
    })
  }

  /**
   * 离开对话房间
   */
  const leaveConversation = (conversationId) => {
    return sendMessage('leave-conversation', {
      conversationId
    })
  }

  /**
   * 发送私信
   */
  const sendPrivateMessage = (conversationId, content, messageId) => {
    return sendMessage('send-private-message', {
      conversationId,
      content,
      messageId
    })
  }

  /**
   * 发送正在输入指示
   */
  const sendTypingIndicator = (conversationId, isTyping = true) => {
    return sendMessage('typing-indicator', {
      conversationId,
      isTyping
    })
  }

  /**
   * 标记消息已读
   */
  const markMessageAsRead = (conversationId, messageId) => {
    return sendMessage('mark-message-read', {
      conversationId,
      messageId
    })
  }

  /**
   * 标记对话已读
   */
  const markConversationAsRead = (conversationId) => {
    return sendMessage('mark-conversation-read', {
      conversationId
    })
  }

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (socket) {
      console.log('[WebSocket] Closing connection')
      socket.disconnect()
      socket = null
    }
    connected.value = false
  }

  /**
   * 重新连接
   */
  const reconnect = () => {
    disconnect()
    connect()
  }

  // 组件挂载时连接
  onMounted(() => {
    connect()
  })

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connecting,
    connect,
    disconnect,
    reconnect,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendPrivateMessage,
    sendTypingIndicator,
    markMessageAsRead,
    markConversationAsRead
  }
}

