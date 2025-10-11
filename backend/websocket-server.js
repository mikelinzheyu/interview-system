/**
 * WebSocket 服务器 - 实时通信
 * 基于 Socket.IO
 */
const { Server } = require('socket.io')

// 在线用户映射 userId -> socketId
const onlineUsers = new Map()

// 聊天室成员映射 roomId -> Set<socketId>
const roomMembers = new Map()

/**
 * 初始化 WebSocket 服务器
 * @param {http.Server} httpServer - HTTP 服务器实例
 * @param {Object} mockData - Mock 数据引用
 */
function initializeWebSocket(httpServer, mockData) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
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

    // ==================== 断开连接 ====================

    socket.on('disconnect', () => {
      console.log(`[WebSocket] 用户 ${socket.userId} 已断开连接`)

      // 移除在线用户
      onlineUsers.delete(socket.userId)

      // 移除房间成员
      for (const [roomId, members] of roomMembers.entries()) {
        members.delete(socket.id)
      }

      // 广播在线用户数更新
      io.emit('online-users-updated', { count: onlineUsers.size })
    })
  })

  console.log('✅ WebSocket 服务器已初始化')
  return io
}

module.exports = { initializeWebSocket, onlineUsers }
