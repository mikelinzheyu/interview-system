/**
 * WebSocket-REST API 集成桥接
 * 当 REST API 执行操作时，广播相应的 WebSocket 事件
 */

class EventBridge {
  constructor() {
    this.io = null
  }

  /**
   * 初始化事件桥接
   * @param {SocketIO} ioInstance - Socket.IO 实例
   */
  initialize(ioInstance) {
    this.io = ioInstance
    console.log('[EventBridge] 初始化完成，准备转发 REST API 事件到 WebSocket')
  }

  // ==================== 频道事件 ====================

  /**
   * 广播频道创建事件
   */
  broadcastChannelCreated(channel) {
    if (!this.io) return
    this.io.emit('channel:created', {
      channel,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 频道创建 #${channel.id} - ${channel.name}`)
  }

  /**
   * 广播频道更新事件
   */
  broadcastChannelUpdated(channel) {
    if (!this.io) return
    this.io.emit('channel:updated', {
      channel,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 频道更新 #${channel.id}`)
  }

  /**
   * 广播频道删除事件
   */
  broadcastChannelDeleted(channelId) {
    if (!this.io) return
    this.io.emit('channel:deleted', {
      channelId,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 频道删除 #${channelId}`)
  }

  /**
   * 广播成员添加事件
   */
  broadcastMemberAdded(channelId, userId) {
    if (!this.io) return
    this.io.emit('channel:member:added', {
      channelId,
      userId,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 成员加入 - 频道 #${channelId}, 用户 ${userId}`)
  }

  /**
   * 广播成员移除事件
   */
  broadcastMemberRemoved(channelId, userId) {
    if (!this.io) return
    this.io.emit('channel:member:removed', {
      channelId,
      userId,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 成员移除 - 频道 #${channelId}, 用户 ${userId}`)
  }

  // ==================== 消息事件 ====================

  /**
   * 广播消息发送事件
   */
  broadcastMessageSent(message) {
    if (!this.io) return
    // 发送到特定频道的所有客户端
    this.io.to(`channel:${message.channelId}`).emit('message:sync', {
      message,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 消息发送 - 频道 #${message.channelId}, 消息 ID ${message.id}`)
  }

  /**
   * 广播消息更新事件
   */
  broadcastMessageUpdated(message) {
    if (!this.io) return
    this.io.to(`channel:${message.channelId}`).emit('message:updated', {
      message,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 消息更新 - 消息 ID ${message.id}`)
  }

  /**
   * 广播消息删除事件
   */
  broadcastMessageDeleted(messageId, channelId) {
    if (!this.io) return
    this.io.to(`channel:${channelId}`).emit('message:deleted', {
      messageId,
      channelId,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 消息删除 - 消息 ID ${messageId}`)
  }

  // ==================== 反应事件 ====================

  /**
   * 广播反应添加事件
   */
  broadcastReactionAdded(messageId, channelId, emoji, reactions) {
    if (!this.io) return
    this.io.to(`channel:${channelId}`).emit('reaction:added', {
      messageId,
      channelId,
      emoji,
      reactions,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 表情反应 - 消息 ID ${messageId}, 表情 ${emoji}`)
  }

  /**
   * 广播反应移除事件
   */
  broadcastReactionRemoved(messageId, channelId, emoji, reactions) {
    if (!this.io) return
    this.io.to(`channel:${channelId}`).emit('reaction:removed', {
      messageId,
      channelId,
      emoji,
      reactions,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 移除表情 - 消息 ID ${messageId}, 表情 ${emoji}`)
  }

  // ==================== 权限事件 ====================

  /**
   * 广播权限变更事件
   */
  broadcastPermissionChanged(channelId, userId, permission) {
    if (!this.io) return
    this.io.to(`channel:${channelId}`).emit('permission:changed', {
      channelId,
      userId,
      permission,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 权限变更 - 频道 #${channelId}, 用户 ${userId}, 角色 ${permission.role}`)
  }

  /**
   * 广播用户被禁言
   */
  broadcastUserMuted(channelId, userId, duration) {
    if (!this.io) return
    this.io.to(`channel:${channelId}`).emit('user:muted', {
      channelId,
      userId,
      duration,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 禁言用户 - 频道 #${channelId}, 用户 ${userId}`)
  }

  /**
   * 广播用户被踢出
   */
  broadcastUserKicked(channelId, userId) {
    if (!this.io) return
    this.io.to(`channel:${channelId}`).emit('user:kicked', {
      channelId,
      userId,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 踢出用户 - 频道 #${channelId}, 用户 ${userId}`)
  }

  /**
   * 广播用户被封禁
   */
  broadcastUserBanned(channelId, userId, duration) {
    if (!this.io) return
    this.io.to(`channel:${channelId}`).emit('user:banned', {
      channelId,
      userId,
      duration,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 封禁用户 - 频道 #${channelId}, 用户 ${userId}`)
  }

  // ==================== 已读回执事件 ====================

  /**
   * 广播消息已读
   */
  broadcastMessageRead(messageId, channelId, userId) {
    if (!this.io) return
    this.io.to(`channel:${channelId}`).emit('message:read', {
      messageId,
      channelId,
      userId,
      readAt: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 消息已读 - 消息 ID ${messageId}, 用户 ${userId}`)
  }

  // ==================== 加密事件 ====================

  /**
   * 广播公钥更新
   */
  broadcastPublicKeyUpdated(userId, publicKey) {
    if (!this.io) return
    this.io.emit('crypto:public-key:updated', {
      userId,
      publicKey,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 公钥更新 - 用户 ${userId}`)
  }

  // ==================== 私信事件 ====================

  /**
   * 广播私信消息
   */
  broadcastPrivateMessage(conversationId, message) {
    if (!this.io) return
    this.io.to(`conversation-${conversationId}`).emit('private-message', {
      ...message,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 私信发送 - 对话 ${conversationId}, 消息 ID ${message.id}`)
  }

  /**
   * 广播消息已读状态
   */
  broadcastPrivateMessageRead(conversationId, messageId, userId) {
    if (!this.io) return
    this.io.to(`conversation-${conversationId}`).emit('message-read', {
      messageId,
      conversationId,
      readBy: userId,
      readAt: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 私信已读 - 对话 ${conversationId}, 消息 ID ${messageId}`)
  }

  /**
   * 广播对话已读状态
   */
  broadcastConversationRead(conversationId, userId) {
    if (!this.io) return
    this.io.to(`conversation-${conversationId}`).emit('conversation-read', {
      conversationId,
      readBy: userId,
      readAt: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 对话已读 - 对话 ${conversationId}, 用户 ${userId}`)
  }

  /**
   * 广播用户输入状态
   */
  broadcastUserTyping(conversationId, userId, isTyping) {
    if (!this.io) return
    this.io.to(`conversation-${conversationId}`).emit('user-typing', {
      userId,
      isTyping,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 用户输入 - 对话 ${conversationId}, 用户 ${userId}, 状态 ${isTyping}`)
  }

  /**
   * 广播用户在线状态
   */
  broadcastUserOnlineStatus(conversationId, userId, isOnline) {
    if (!this.io) return
    this.io.to(`conversation-${conversationId}`).emit('user-online-status', {
      userId,
      isOnline,
      timestamp: new Date().toISOString()
    })
    console.log(`[EventBridge] 广播: 用户在线状态 - 对话 ${conversationId}, 用户 ${userId}, 在线 ${isOnline}`)
  }

  // ==================== 工具方法 ====================

  /**
   * 获取当前连接统计
   */
  getStats() {
    if (!this.io) return null

    return {
      totalConnections: this.io.engine.clientsCount,
      rooms: Object.keys(this.io.sockets.adapter.rooms).length,
      timestamp: new Date().toISOString()
    }
  }
}

// 创建全局事件桥接实例
const eventBridge = new EventBridge()

module.exports = {
  eventBridge,
  EventBridge
}
