/**
 * WebSocket 服务器 - 实时通信
 * 基于 Socket.IO
 * Phase 4 增强：完整的实时同步功能
 */
const { Server } = require('socket.io')

// 在线用户映射 userId -> socketId
const onlineUsers = new Map()

// 聊天室成员映射 roomId -> Set<socketId>
const roomMembers = new Map()

// Phase 4: 用户状态映射 userId -> status
const userStatusMap = new Map()

// Phase 4: 频道订阅映射 channelId -> Set<socketId>
const channelSubscriptions = new Map()

// Phase 4: 用户订阅映射 userId -> Set<socketId>
const userSubscriptions = new Map()

// Phase 4: 线程订阅映射 messageId -> Set<socketId>
const threadSubscriptions = new Map()

/**
 * 初始化 WebSocket 服务器
 * @param {http.Server} httpServer - HTTP 服务器实例
 * @param {Object} mockData - Mock 数据引用
 */
function initializeWebSocket(httpServer, mockData) {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000', '*'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingInterval: 25000,
    pingTimeout: 20000
  })

  // JWT 鉴权中间件（简化版）
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    // 在生产环境应验证 JWT token
    // 这里简化处理，假设 token 就是 userId
    if (token) {
      socket.userId = parseInt(token) || 1
      next()
    } else {
      socket.userId = 1 // 默认用户
      next()
    }
  })

  io.on('connection', (socket) => {
    console.log(`[WebSocket] 用户 ${socket.userId} 已连接 (${socket.id})`)

    // 记录在线用户
    onlineUsers.set(socket.userId, socket.id)
    userStatusMap.set(socket.userId, 'online')

    // 广播在线用户数更新
    io.emit('online-users-updated', { count: onlineUsers.size })

    // ==================== 聊天室事件 ====================

    // 加入聊天室
    socket.on('join-room', (data) => {
      const { roomId } = data
      socket.join(`room-${roomId}`)

      // 记录房间成员
      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set())
      }
      roomMembers.get(roomId).add(socket.id)

      console.log(`[WebSocket] 用户 ${socket.userId} 加入房间 ${roomId}`)

      // 通知房间其他成员
      socket.to(`room-${roomId}`).emit('user-joined', {
        userId: socket.userId,
        roomId,
        timestamp: new Date().toISOString()
      })
    })

    // 离开聊天室
    socket.on('leave-room', (data) => {
      const { roomId } = data
      socket.leave(`room-${roomId}`)

      if (roomMembers.has(roomId)) {
        roomMembers.get(roomId).delete(socket.id)
      }

      console.log(`[WebSocket] 用户 ${socket.userId} 离开房间 ${roomId}`)

      socket.to(`room-${roomId}`).emit('user-left', {
        userId: socket.userId,
        roomId,
        timestamp: new Date().toISOString()
      })
    })

    // 发送消息
    socket.on('send-message', (data) => {
      const { roomId, content, replyTo } = data

      // 创建消息对象
      const message = {
        id: mockData.messageIdCounter++,
        roomId,
        senderId: socket.userId,
        senderName: 'testuser', // 从用户数据获取
        senderAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        content,
        messageType: 'text',
        replyTo: replyTo || null,
        status: 'sent',
        createdAt: new Date().toISOString()
      }

      // 保存消息到数据库
      mockData.messages.push(message)

      // 广播给房间所有成员
      io.to(`room-${roomId}`).emit('new-message', message)

      console.log(`[WebSocket] 用户 ${socket.userId} 在房间 ${roomId} 发送消息`)
    })

    // 输入状态
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data
      socket.to(`room-${roomId}`).emit('user-typing', {
        userId: socket.userId,
        roomId,
        isTyping
      })
    })

    // ==================== Phase 4: 消息实时同步 ====================

    socket.on('message:sync', (data) => {
      const { roomId, message } = data
      console.log(`[WebSocket] 消息同步 - 用户 ${socket.userId} 在房间 ${roomId}`)

      // 保存消息
      if (mockData.messages) {
        mockData.messages.push(message)
      }

      // 广播给房间内所有成员（包括发送者）
      io.to(`room-${roomId}`).emit('message:sync', {
        roomId,
        message,
        syncedAt: new Date().toISOString()
      })
    })

    socket.on('message:read', (data) => {
      const { messageId, roomId, readBy, readAt } = data
      console.log(`[WebSocket] 消息 ${messageId} 已被用户 ${readBy} 读取`)

      // 广播已读状态给房间内所有成员
      io.to(`room-${roomId}`).emit('message:read', {
        messageId,
        readBy,
        readAt
      })
    })

    // ==================== Phase 4: 用户状态管理 ====================

    socket.on('user:status:changed', (data) => {
      const { userId, status, timestamp } = data
      console.log(`[WebSocket] 用户 ${userId} 状态变化: ${status}`)

      // 更新用户状态
      userStatusMap.set(userId, status)

      // 广播给所有在线用户
      io.emit('user-presence-updated', {
        userId,
        status,
        timestamp
      })

      // 通知订阅该用户的所有客户端
      if (userSubscriptions.has(userId)) {
        userSubscriptions.get(userId).forEach(subscriberSocket => {
          io.to(subscriberSocket).emit('user:status:changed', {
            userId,
            status,
            timestamp
          })
        })
      }
    })

    // ==================== Phase 4: 频道管理事件 ====================

    socket.on('subscribe:channel', (data) => {
      const { channelId } = data
      console.log(`[WebSocket] 用户 ${socket.userId} 订阅频道 ${channelId}`)

      if (!channelSubscriptions.has(channelId)) {
        channelSubscriptions.set(channelId, new Set())
      }
      channelSubscriptions.get(channelId).add(socket.id)
    })

    socket.on('unsubscribe:channel', (data) => {
      const { channelId } = data
      console.log(`[WebSocket] 用户 ${socket.userId} 取消订阅频道 ${channelId}`)

      if (channelSubscriptions.has(channelId)) {
        channelSubscriptions.get(channelId).delete(socket.id)
      }
    })

    // ==================== Phase 4: 用户订阅 ====================

    socket.on('subscribe:user', (data) => {
      const { userId } = data
      console.log(`[WebSocket] 用户 ${socket.userId} 订阅用户 ${userId}`)

      if (!userSubscriptions.has(userId)) {
        userSubscriptions.set(userId, new Set())
      }
      userSubscriptions.get(userId).add(socket.id)
    })

    socket.on('unsubscribe:user', (data) => {
      const { userId } = data
      console.log(`[WebSocket] 用户 ${socket.userId} 取消订阅用户 ${userId}`)

      if (userSubscriptions.has(userId)) {
        userSubscriptions.get(userId).delete(socket.id)
      }
    })

    // ==================== Phase 4: 表情反应 ====================

    socket.on('reaction:add', (data) => {
      const { messageId, roomId, emoji, userId, timestamp } = data
      console.log(`[WebSocket] 用户 ${userId} 对消息 ${messageId} 添加表情 ${emoji}`)

      // 广播给房间内所有成员
      io.to(`room-${roomId}`).emit('reaction:added', {
        messageId,
        emoji,
        userId,
        timestamp
      })
    })

    socket.on('reaction:remove', (data) => {
      const { messageId, roomId, emoji, userId, timestamp } = data
      console.log(`[WebSocket] 用户 ${userId} 对消息 ${messageId} 移除表情 ${emoji}`)

      // 广播给房间内所有成员
      io.to(`room-${roomId}`).emit('reaction:removed', {
        messageId,
        emoji,
        userId,
        timestamp
      })
    })

    // ==================== Phase 4: 线程回复 ====================

    socket.on('subscribe:thread', (data) => {
      const { messageId, roomId } = data
      const threadKey = `thread-${messageId}`
      console.log(`[WebSocket] 用户 ${socket.userId} 订阅线程 ${threadKey}`)

      if (!threadSubscriptions.has(threadKey)) {
        threadSubscriptions.set(threadKey, new Set())
      }
      threadSubscriptions.get(threadKey).add(socket.id)
    })

    socket.on('unsubscribe:thread', (data) => {
      const { messageId, roomId } = data
      const threadKey = `thread-${messageId}`
      console.log(`[WebSocket] 用户 ${socket.userId} 取消订阅线程 ${threadKey}`)

      if (threadSubscriptions.has(threadKey)) {
        threadSubscriptions.get(threadKey).delete(socket.id)
      }
    })

    // ==================== Phase 4: 输入状态增强 ====================

    socket.on('typing:status', (data) => {
      const { roomId, userId, isTyping, draft, timestamp } = data
      console.log(`[WebSocket] 用户 ${userId} 在房间 ${roomId} 输入状态: ${isTyping}`)

      // 广播给房间其他成员
      socket.to(`room-${roomId}`).emit('user:typing:status', {
        userId,
        isTyping,
        draft,
        timestamp
      })
    })

    // ==================== Phase 4: 系统消息 ====================

    socket.on('system:message', (data) => {
      const { targetUserId, message, sentBy, timestamp } = data
      const targetSocket = onlineUsers.get(targetUserId)

      if (targetSocket) {
        console.log(`[WebSocket] 系统消息从 ${sentBy} 发送给用户 ${targetUserId}`)
        io.to(targetSocket).emit('system:message', {
          message,
          sentBy,
          timestamp
        })
      }
    })

    // ==================== 通知事件 ====================

    // 发送通知给特定用户
    socket.on('send-notification', (data) => {
      const { targetUserId, notification } = data
      const targetSocketId = onlineUsers.get(targetUserId)

      if (targetSocketId) {
        io.to(targetSocketId).emit('notification', notification)
        console.log(`[WebSocket] 通知已发送给用户 ${targetUserId}`)
      }
    })

    // ==================== 帖子实时更新 ====================

    // 帖子被点赞
    socket.on('post-liked', (data) => {
      const { postId, likeCount } = data
      // 广播给所有在线用户
      io.emit('post-like-updated', { postId, likeCount })
    })

    // 新评论
    socket.on('new-comment', (data) => {
      const { postId, comment } = data
      // 通知帖子作者
      io.emit('comment-added', { postId, comment })
    })

    // ==================== 私信功能 ====================

    // 加入私信对话房间
    socket.on('join-conversation', (data) => {
      const { conversationId } = data
      socket.join(`conversation-${conversationId}`)
      console.log(`[WebSocket] 用户 ${socket.userId} 加入对话 ${conversationId}`)

      // 发送在线状态给对话中的其他用户
      socket.to(`conversation-${conversationId}`).emit('user-online-status', {
        userId: socket.userId,
        isOnline: true,
        timestamp: new Date().toISOString()
      })
    })

    // 离开私信对话房间
    socket.on('leave-conversation', (data) => {
      const { conversationId } = data
      socket.leave(`conversation-${conversationId}`)
      console.log(`[WebSocket] 用户 ${socket.userId} 离开对话 ${conversationId}`)

      // 发送离线状态给对话中的其他用户
      socket.to(`conversation-${conversationId}`).emit('user-online-status', {
        userId: socket.userId,
        isOnline: false,
        timestamp: new Date().toISOString()
      })
    })

    // 发送私信
    socket.on('send-private-message', (data) => {
      const { conversationId, content, messageId } = data
      const message = {
        id: messageId,
        conversationId,
        senderId: socket.userId,
        content,
        type: 'text',
        status: 'delivered',
        createdAt: new Date().toISOString()
      }

      // 广播给对话中的所有用户
      io.to(`conversation-${conversationId}`).emit('private-message', message)
      console.log(`[WebSocket] 用户 ${socket.userId} 在对话 ${conversationId} 发送私信`)
    })

    // 标记消息已读
    socket.on('mark-message-read', (data) => {
      const { conversationId, messageId } = data

      // 广播已读状态给对话中的所有用户
      io.to(`conversation-${conversationId}`).emit('message-read', {
        messageId,
        readBy: socket.userId,
        readAt: new Date().toISOString()
      })
      console.log(`[WebSocket] 用户 ${socket.userId} 标记消息 ${messageId} 为已读`)
    })

    // 正在输入指示符
    socket.on('typing-indicator', (data) => {
      const { conversationId, isTyping } = data

      // 发送给对话中的其他用户（不包括发送者）
      socket.to(`conversation-${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping,
        timestamp: new Date().toISOString()
      })
      console.log(`[WebSocket] 用户 ${socket.userId} 在对话 ${conversationId} 输入状态: ${isTyping}`)
    })

    // 标记整个对话已读
    socket.on('mark-conversation-read', (data) => {
      const { conversationId } = data

      // 广播给对话中的所有用户
      io.to(`conversation-${conversationId}`).emit('conversation-read', {
        conversationId,
        readBy: socket.userId,
        readAt: new Date().toISOString()
      })
      console.log(`[WebSocket] 用户 ${socket.userId} 标记对话 ${conversationId} 为已读`)
    })

    // ==================== 断开连接 ====================

    socket.on('disconnect', () => {
      console.log(`[WebSocket] 用户 ${socket.userId} 已断开连接`)

      // 移除在线用户
      onlineUsers.delete(socket.userId)
      userStatusMap.delete(socket.userId)

      // 移除房间成员
      for (const [roomId, members] of roomMembers.entries()) {
        members.delete(socket.id)
      }

      // 移除所有订阅
      for (const [channelId, subs] of channelSubscriptions.entries()) {
        subs.delete(socket.id)
      }
      for (const [userId, subs] of userSubscriptions.entries()) {
        subs.delete(socket.id)
      }
      for (const [threadId, subs] of threadSubscriptions.entries()) {
        subs.delete(socket.id)
      }

      // 广播用户离线事件
      io.emit('user-presence-updated', {
        userId: socket.userId,
        status: 'offline'
      })

      // 广播在线用户数更新
      io.emit('online-users-updated', { count: onlineUsers.size })
    })
  })

  console.log('✅ WebSocket 服务器已初始化（Phase 4 增强）')
  console.log('✅ 已启用以下功能:')
  console.log('   - 消息实时同步')
  console.log('   - 用户状态管理')
  console.log('   - 频道订阅')
  console.log('   - 用户订阅')
  console.log('   - 线程回复')
  console.log('   - 表情反应')
  console.log('   - 输入状态')
  console.log('   - 系统消息')

  return io
}

module.exports = { initializeWebSocket, onlineUsers }

