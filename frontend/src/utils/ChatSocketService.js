/**
 * 改进的 ChatSocket 服务
 * 提供完整的 WebSocket 连接管理和消息处理
 */

import { reactive, ref } from 'vue'
import { ElNotification } from 'element-plus'

export class ChatSocketService {
  constructor() {
    this.socket = null
    this.userId = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.heartbeatInterval = null
    this.messageQueue = []
    this.listeners = new Map()

    // 连接状态
    this.connectionState = reactive({
      isConnecting: false,
      isConnected: false,
      connectionError: null,
      lastConnectAttempt: null,
      reconnectCount: 0,
      maxReconnectAttempts: 5
    })

    // 用户在线状态
    this.onlineUsers = reactive({})

    // 本地缓存的消息状态
    this.messageStatus = reactive({})
  }

  /**
   * 连接到 WebSocket 服务器
   */
  async connect(userId, wsUrl = null) {
    if (this.connectionState.isConnected) {
      console.log('[ChatSocket] Already connected')
      return Promise.resolve()
    }

    if (this.connectionState.isConnecting) {
      console.log('[ChatSocket] Connection in progress')
      return Promise.resolve()
    }

    this.userId = userId
    this.connectionState.isConnecting = true
    this.connectionState.lastConnectAttempt = new Date()

    return new Promise((resolve, reject) => {
      try {
        const url = wsUrl || `ws://localhost:3001/ws/chat?userId=${userId}&token=${this.getAuthToken()}`

        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
          console.log('[ChatSocket] Connected successfully')
          this.connectionState.isConnecting = false
          this.connectionState.isConnected = true
          this.connectionState.connectionError = null
          this.reconnectAttempts = 0
          this.connectionState.reconnectCount = 0

          // 启动心跳
          this.startHeartbeat()

          // 处理离线消息队列
          this.flushMessageQueue()

          // 发出连接事件
          this.emit('connected')

          resolve()
        }

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.socket.onerror = (error) => {
          console.error('[ChatSocket] Error:', error)
          this.connectionState.connectionError = error.message || '连接错误'
          reject(error)
        }

        this.socket.onclose = () => {
          console.log('[ChatSocket] Disconnected')
          this.handleDisconnect()
        }
      } catch (error) {
        console.error('[ChatSocket] Connection failed:', error)
        this.connectionState.isConnecting = false
        this.connectionState.connectionError = error.message
        reject(error)
      }
    })
  }

  /**
   * 发送消息
   */
  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // 连接未开启，存入队列
      console.log('[ChatSocket] Message queued (not connected)')
      this.messageQueue.push(message)
      return false
    }

    try {
      this.socket.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('[ChatSocket] Failed to send message:', error)
      this.messageQueue.push(message)
      return false
    }
  }

  /**
   * 发送聊天消息
   */
  sendChatMessage(receiverId, content, options = {}) {
    const message = {
      type: 'message:send',
      payload: {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: this.userId,
        receiverId,
        content,
        timestamp: Date.now(),
        ...options
      }
    }
    return this.send(message)
  }

  /**
   * 发送群组消息
   */
  sendGroupMessage(groupId, content, options = {}) {
    const message = {
      type: 'group-message:send',
      payload: {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: this.userId,
        groupId,
        content,
        timestamp: Date.now(),
        ...options
      }
    }
    return this.send(message)
  }

  /**
   * 发送消息已读状态
   */
  sendMessageRead(roomId, messageIds) {
    const message = {
      type: 'message:read',
      payload: {
        roomId,
        messageIds,
        readAt: Date.now()
      }
    }
    return this.send(message)
  }

  /**
   * 发送输入中状态
   */
  sendTypingStatus(roomId, isTyping) {
    const message = {
      type: 'user:typing',
      payload: {
        roomId,
        isTyping,
        userId: this.userId
      }
    }
    return this.send(message)
  }

  /**
   * 加入房间
   */
  joinRoom(roomId) {
    const message = {
      type: 'room:join',
      payload: { roomId }
    }
    return this.send(message)
  }

  /**
   * 离开房间
   */
  leaveRoom(roomId) {
    const message = {
      type: 'room:leave',
      payload: { roomId }
    }
    return this.send(message)
  }

  /**
   * 处理接收到的消息
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data)
      const { type, payload } = message

      console.log('[ChatSocket] Message received:', type)

      // 处理消息状态更新
      if (type === 'message:status') {
        this.updateMessageStatus(payload)
      }

      // 处理离线消息
      if (type === 'message:offline') {
        this.handleOfflineMessages(payload)
      }

      // 处理用户在线状态
      if (type === 'user:online' || type === 'user:offline') {
        this.updateUserStatus(payload)
      }

      // 触发对应的监听器
      const callbacks = this.listeners.get(type) || []
      callbacks.forEach(cb => {
        try {
          cb(payload)
        } catch (error) {
          console.error('[ChatSocket] Listener error:', error)
        }
      })
    } catch (error) {
      console.error('[ChatSocket] Failed to handle message:', error)
    }
  }

  /**
   * 更新消息状态
   */
  updateMessageStatus(payload) {
    const { messageId, status } = payload
    if (messageId) {
      this.messageStatus[messageId] = status
    }
  }

  /**
   * 处理离线消息
   */
  handleOfflineMessages(offlineMessages) {
    console.log(`[ChatSocket] Received ${offlineMessages.length} offline messages`)

    const callbacks = this.listeners.get('message:offline') || []
    callbacks.forEach(cb => {
      try {
        cb(offlineMessages)
      } catch (error) {
        console.error('[ChatSocket] Offline message handler error:', error)
      }
    })
  }

  /**
   * 更新用户在线状态
   */
  updateUserStatus(payload) {
    const { userId, status } = payload
    if (userId) {
      this.onlineUsers[userId] = status
    }
  }

  /**
   * 处理断开连接
   */
  handleDisconnect() {
    this.connectionState.isConnected = false
    this.stopHeartbeat()

    // 尝试重新连接
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
      this.reconnectAttempts++
      this.connectionState.reconnectCount = this.reconnectAttempts

      console.log(`[ChatSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId).catch(error => {
            console.error('[ChatSocket] Reconnection failed:', error)
          })
        }
      }, delay)
    } else {
      console.error('[ChatSocket] Max reconnection attempts reached')
      this.connectionState.connectionError = '连接失败，请刷新重试'
      ElNotification.error({
        title: '连接失败',
        message: '无法连接到服务器，请检查网络连接'
      })
    }

    // 发出断开连接事件
    this.emit('disconnected')
  }

  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        const heartbeat = {
          type: 'ping',
          timestamp: Date.now()
        }
        try {
          this.socket.send(JSON.stringify(heartbeat))
        } catch (error) {
          console.warn('[ChatSocket] Heartbeat failed:', error)
        }
      }
    }, 30000) // 每 30 秒发送一次
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 处理消息队列
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      try {
        this.socket.send(JSON.stringify(message))
      } catch (error) {
        console.error('[ChatSocket] Failed to flush message:', error)
        this.messageQueue.unshift(message) // 放回队列
        break
      }
    }
  }

  /**
   * 监听事件
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除监听
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => {
      try {
        cb(data)
      } catch (error) {
        console.error(`[ChatSocket] Emit error for ${event}:`, error)
      }
    })
  }

  /**
   * 关闭连接
   */
  close() {
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.connectionState.isConnected = false
  }

  /**
   * 是否已连接
   */
  isConnected() {
    return this.connectionState.isConnected
  }

  /**
   * 获取认证 Token
   */
  getAuthToken() {
    // 从 localStorage 或会话存储获取
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''
  }

  /**
   * 获取连接状态
   */
  getConnectionState() {
    return { ...this.connectionState }
  }
}

// 导出单例
export default new ChatSocketService()
