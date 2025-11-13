/**
 * WebSocket 服务封装
 * 基于 Socket.IO Client
 */
import { io } from 'socket.io-client'
import { ElNotification } from 'element-plus'
import { getWebSocketBaseUrl } from '@/utils/networkConfig'

const DEFAULT_WS_URL = 'ws://localhost:3001'

const normalizeSocketUrl = (value) => {
  if (!value || typeof value !== 'string') return ''
  return value.trim()
}

const resolveWebSocketUrl = (candidate) => {
  const direct = normalizeSocketUrl(candidate)
  if (direct) return direct

  const envResolved = normalizeSocketUrl(getWebSocketBaseUrl())
  if (envResolved) return envResolved

  console.warn('[Socket] 未解析到 WebSocket 地址，回退到默认 ws://localhost:3001')
  return DEFAULT_WS_URL
}

class SocketService {
  constructor() {
    this.socket = null
    this.socketUrl = DEFAULT_WS_URL
    this.connected = false
    this.connecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000 // 3s
    this.listeners = new Map() // 存储事件监听器
  }

  /**
   * 连接到 WebSocket 服务器
   * @param {string} token - JWT token
   * @param {string} url - WebSocket 服务器地址
   */
  connect(token, url) {
    if (this.connected || this.connecting || (this.socket && this.socket.connected)) {
      console.log('[Socket] 已在连接中或已连接，跳过重复连接')
      return
    }

    const targetUrl = resolveWebSocketUrl(url)
    this.socketUrl = targetUrl
    this.connecting = true

    console.log('[Socket] 正在连接 WebSocket 服务...', targetUrl)

    this.socket = io(targetUrl, {
      auth: { token: token || '1' }, // 传入 JWT token
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    })

    // 连接成功
    this.socket.on('connect', () => {
      this.connected = true
      this.connecting = false
      this.reconnectAttempts = 0
      console.log('[Socket] WebSocket 已连接', this.socket.id, '->', this.socketUrl)

      ElNotification({
        title: '实时通信已连接',
        message: '您现在可以实时接收消息和通知',
        type: 'success',
        duration: 2000
      })

      // 重新注册所有监听器
      this.reRegisterListeners()
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] 连接错误 ->', this.socketUrl, error)
      this.connected = false
      this.connecting = false

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`[Socket] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts}) -> ${this.socketUrl}`)
      } else {
        ElNotification({
          title: '连接失败',
          message: '无法连接到实时通信服务器，请检查网络连接',
          type: 'error',
          duration: 3000
        })
      }
    })

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      this.connected = false
      this.connecting = false
      console.log('[Socket] 连接已断开:', reason, '->', this.socketUrl)

      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        this.socket.connect()
      }
    })

    // 在线用户数更新
    this.socket.on('online-users-updated', (data) => {
      console.log('[Socket] 在线用户数', data.count)
    })

    return this.socket
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.socketUrl = DEFAULT_WS_URL
      this.connected = false
      this.listeners.clear()
      console.log('[Socket] 已断开连接')
    }
  }

  /**
   * 监听事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('[Socket] 尚未连接，无法监听事件')
      return
    }

    // 存储监听器以便重连后恢复
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(callback)

    this.socket.on(event, callback)
    console.log(`[Socket] 已监听事件 ${event}`)
  }

  /**
   * 取消监听事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数（可选）
   */
  off(event, callback) {
    if (!this.socket) return

    if (callback) {
      this.socket.off(event, callback)
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) callbacks.splice(index, 1)
      }
    } else {
      this.socket.off(event)
      this.listeners.delete(event)
    }

    console.log(`[Socket] 已取消监听事件 ${event}`)
  }

  /**
   * 发送事件
   * @param {string} event - 事件名称
   * @param {Object} data - 数据
   */
  emit(event, data) {
    if (!this.socket || !this.connected) {
      console.warn('[Socket] 未连接，无法发送事件')
      return
    }

    this.socket.emit(event, data)
    console.log(`[Socket] 已发送事件 ${event}`, data)
  }

  /**
   * 重新注册所有监听器（用于重连后）
   */
  reRegisterListeners() {
    if (!this.socket) return
    console.log('[Socket] 重新注册监听器...')
    for (const [event, callbacks] of this.listeners.entries()) {
      callbacks.forEach(callback => this.socket.on(event, callback))
    }
  }

  // ==================== 聊天室相关方法 ====================

  /**
   * 加入聊天室
   * @param {number} roomId - 聊天室ID
   */
  joinRoom(roomId) {
    this.emit('join-room', { roomId })
  }

  /**
   * 离开聊天室
   * @param {number} roomId - 聊天室ID
   */
  leaveRoom(roomId) {
    this.emit('leave-room', { roomId })
  }

  /**
   * 发送消息
   * @param {number} roomId - 聊天室ID
   * @param {string} content - 消息内容
   * @param {number} replyTo - 回复的消息ID（可选）
   */
  sendMessage(roomId, content, replyTo = null) {
    this.emit('send-message', { roomId, content, replyTo })
  }

  /**
   * 发送输入状态
   * @param {number} roomId - 聊天室ID
   * @param {boolean} isTyping - 是否正在输入
   */
  sendTypingStatus(roomId, isTyping) {
    this.emit('typing', { roomId, isTyping })
  }

  /**
   * 监听新消息
   * @param {Function} callback - 回调函数
   */
  onNewMessage(callback) {
    this.on('new-message', callback)
  }

  /**
   * 监听用户加入
   * @param {Function} callback - 回调函数
   */
  onUserJoined(callback) {
    this.on('user-joined', callback)
  }

  /**
   * 监听用户离开
   * @param {Function} callback - 回调函数
   */
  onUserLeft(callback) {
    this.on('user-left', callback)
  }

  /**
   * 监听用户输入状态
   * @param {Function} callback - 回调函数
   */
  onUserTyping(callback) {
    this.on('user-typing', callback)
  }

  // ==================== 通知相关方法 ====================

  /**
   * 监听通知
   * @param {Function} callback - 回调函数
   */
  onNotification(callback) {
    this.on('notification', callback)
  }

  /**
   * 发送通知给指定用户（管理员功能）
   * @param {number} targetUserId - 目标用户 ID
   * @param {Object} notification - 通知对象
   */
  sendNotification(targetUserId, notification) {
    this.emit('send-notification', { targetUserId, notification })
  }

  // ==================== 帖子实时更新 ====================

  /**
   * 通知帖子被点赞
   * @param {number} postId - 帖子 ID
   * @param {number} likeCount - 点赞数
   */
  notifyPostLiked(postId, likeCount) {
    this.emit('post-liked', { postId, likeCount })
  }

  /**
   * 监听帖子点赞更新
   * @param {Function} callback - 回调函数
   */
  onPostLikeUpdated(callback) {
    this.on('post-like-updated', callback)
  }

  /**
   * 通知新评论
   * @param {number} postId - 帖子 ID
   * @param {Object} comment - 评论对象
   */
  notifyNewComment(postId, comment) {
    this.emit('new-comment', { postId, comment })
  }

  /**
   * 监听评论添加
   * @param {Function} callback - 回调函数
   */
  onCommentAdded(callback) {
    this.on('comment-added', callback)
  }

  /**
   * 获取连接状态
   */
  isConnected() {
    return this.connected
  }

  /**
   * 获取 Socket ID
   */
  getSocketId() {
    return this.socket ? this.socket.id : null
  }

  // ==================== Phase 4: 消息实时同步 ====================

  /**
   * 同步消息到服务器
   * @param {number} roomId - 聊天室ID
   * @param {Object} message - 消息对象
   */
  syncMessage(roomId, message) {
    this.emit('message:sync', {
      roomId,
      message: {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
        type: message.type || 'text',
        replyTo: message.replyTo || null,
        encryptedContent: message.encryptedContent || null,
        encryptionKeyId: message.encryptionKeyId || null
      }
    })
  }

  /**
   * 监听消息实时同步
   * @param {Function} callback - 回调函数
   */
  onMessageSync(callback) {
    this.on('message:sync', callback)
  }

  /**
   * 发送消息已读回执
   * @param {number} messageId - 消息ID
   * @param {number} roomId - 聊天室ID
   */
  sendReadReceipt(messageId, roomId) {
    this.emit('message:read', {
      messageId,
      roomId,
      readBy: this.socket?.userId,
      readAt: new Date().toISOString()
    })
  }

  /**
   * 监听消息已读状态更新
   * @param {Function} callback - 回调函数
   */
  onMessageRead(callback) {
    this.on('message:read', callback)
  }

  // ==================== Phase 4: 用户状态管理 ====================

  /**
   * 更新用户在线状态
   * @param {string} status - 状态: online, away, busy, dnd
   */
  updateUserStatus(status) {
    this.emit('user:status:changed', {
      userId: this.socket?.userId,
      status,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 监听用户状态变化
   * @param {Function} callback - 回调函数
   */
  onUserStatusChanged(callback) {
    this.on('user:status:changed', callback)
  }

  /**
   * 监听用户在线状态更新
   * @param {Function} callback - 回调函数
   */
  onUserPresenceUpdated(callback) {
    this.on('user-presence-updated', callback)
  }

  /**
   * 订阅用户的状态变化
   * @param {number} userId - 用户ID
   */
  subscribeToUser(userId) {
    this.emit('subscribe:user', { userId })
  }

  /**
   * 取消订阅用户的状态变化
   * @param {number} userId - 用户ID
   */
  unsubscribeFromUser(userId) {
    this.emit('unsubscribe:user', { userId })
  }

  // ==================== Phase 4: 频道管理事件 ====================

  /**
   * 监听频道创建
   * @param {Function} callback - 回调函数
   */
  onChannelCreated(callback) {
    this.on('channel:created', callback)
  }

  /**
   * 监听频道更新
   * @param {Function} callback - 回调函数
   */
  onChannelUpdated(callback) {
    this.on('channel:updated', callback)
  }

  /**
   * 监听频道删除
   * @param {Function} callback - 回调函数
   */
  onChannelDeleted(callback) {
    this.on('channel:deleted', callback)
  }

  /**
   * 订阅频道更新
   * @param {number} channelId - 频道ID
   */
  subscribeToChannel(channelId) {
    this.emit('subscribe:channel', { channelId })
  }

  /**
   * 取消订阅频道更新
   * @param {number} channelId - 频道ID
   */
  unsubscribeFromChannel(channelId) {
    this.emit('unsubscribe:channel', { channelId })
  }

  // ==================== Phase 4: 表情反应实时更新 ====================

  /**
   * 监听表情反应添加
   * @param {Function} callback - 回调函数
   */
  onReactionAdded(callback) {
    this.on('reaction:added', callback)
  }

  /**
   * 监听表情反应移除
   * @param {Function} callback - 回调函数
   */
  onReactionRemoved(callback) {
    this.on('reaction:removed', callback)
  }

  /**
   * 发送表情反应
   * @param {number} messageId - 消息ID
   * @param {number} roomId - 聊天室ID
   * @param {string} emoji - 表情符号
   */
  addReaction(messageId, roomId, emoji) {
    this.emit('reaction:add', {
      messageId,
      roomId,
      emoji,
      userId: this.socket?.userId,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 移除表情反应
   * @param {number} messageId - 消息ID
   * @param {number} roomId - 聊天室ID
   * @param {string} emoji - 表情符号
   */
  removeReaction(messageId, roomId, emoji) {
    this.emit('reaction:remove', {
      messageId,
      roomId,
      emoji,
      userId: this.socket?.userId,
      timestamp: new Date().toISOString()
    })
  }

  // ==================== Phase 4: 线程回复实时通知 ====================

  /**
   * 监听新的线程回复
   * @param {Function} callback - 回调函数
   */
  onThreadReply(callback) {
    this.on('thread:reply', callback)
  }

  /**
   * 订阅线程更新
   * @param {number} messageId - 原消息ID
   * @param {number} roomId - 聊天室ID
   */
  subscribeToThread(messageId, roomId) {
    this.emit('subscribe:thread', { messageId, roomId })
  }

  /**
   * 取消订阅线程更新
   * @param {number} messageId - 原消息ID
   * @param {number} roomId - 聊天室ID
   */
  unsubscribeFromThread(messageId, roomId) {
    this.emit('unsubscribe:thread', { messageId, roomId })
  }

  // ==================== Phase 4: 输入状态增强 ====================

  /**
   * 发送输入状态（增强版）
   * @param {number} roomId - 聊天室ID
   * @param {boolean} isTyping - 是否正在输入
   * @param {string} draft - 草稿内容（可选）
   */
  sendTypingStatusEnhanced(roomId, isTyping, draft = null) {
    this.emit('typing:status', {
      roomId,
      userId: this.socket?.userId,
      isTyping,
      draft,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 监听草稿内容更新
   * @param {Function} callback - 回调函数
   */
  onDraftUpdated(callback) {
    this.on('draft:updated', callback)
  }

  // ==================== Phase 4: 通知和更新 ====================

  /**
   * 监听一般通知
   * @param {Function} callback - 回调函数
   */
  onGeneralNotification(callback) {
    this.on('notification:general', callback)
  }

  /**
   * 发送系统消息给特定用户
   * @param {number} targetUserId - 目标用户ID
   * @param {Object} message - 消息内容
   */
  sendSystemMessage(targetUserId, message) {
    this.emit('system:message', {
      targetUserId,
      message,
      sentBy: this.socket?.userId,
      timestamp: new Date().toISOString()
    })
  }

  // ==================== 工具方法 ====================

  /**
   * 获取连接统计信息
   */
  getConnectionStats() {
    return {
      connected: this.connected,
      socketId: this.getSocketId(),
      socketUrl: this.socketUrl,
      listenersCount: this.listeners.size,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  /**
   * 清除所有监听器（用于页面卸载）
   */
  clearAllListeners() {
    console.log('[Socket] 清除所有监听器...')
    for (const [event] of this.listeners.entries()) {
      this.off(event)
    }
  }
}

// 导出单例
export const socketService = new SocketService()
export default socketService

