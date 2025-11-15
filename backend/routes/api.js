/**
 * 后端 API 路由统一导出
 * 集成所有 API 路由到主应用，使用控制器进行业务逻辑处理
 * Phase 4B 实现：后端 API 集成和数据持久化
 */

const express = require('express')
const router = express.Router()
const { getControllers } = require('../services/dataService')
const { eventBridge } = require('../services/eventBridge')
const aiRouter = require('./ai')
const communityRouter = require('./community')

// ==================== 工具函数 ====================

/**
 * 安全获取整数参数
 */
function safeParseInt(value) {
  const parsed = parseInt(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * 处理异步路由错误
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// ==================== 中间件 ====================

/**
 * 认证中间件
 * 从 Authorization header 中提取 token 并设置 req.user
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Missing authentication token'
    })
  }

  try {
    // 简化版实现：直接使用 token 作为用户 ID
    // 生产环境应该验证 JWT
    const userId = parseInt(token) || 1
    req.user = { id: userId }
    req.token = token
    next()
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: 'Invalid token',
      error: error.message
    })
  }
}

/**
 * 权限检查中间件工厂
 * @param {string} requiredPermission - 所需的权限
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const controllers = getControllers()
      const channelId = req.params.channelId ? parseInt(req.params.channelId) : null

      // 某些端点不需要频道权限
      if (!channelId) {
        return next()
      }

      // 检查用户是否有权限
      const hasPermission = controllers.permission.hasPermission(
        req.user.id,
        channelId,
        requiredPermission
      )

      if (!hasPermission) {
        return res.status(403).json({
          code: 403,
          message: `Permission denied: ${requiredPermission} not allowed`
        })
      }

      next()
    } catch (error) {
      console.error('[Permission Check Error]', error)
      next(error)
    }
  }
}

// ==================== 频道 API ====================

/**
 * GET /channels - 获取用户所有频道
 */
router.get('/channels', auth, (req, res) => {
  try {
    const controllers = getControllers()
    const channels = controllers.channel.getUserChannels(req.user.id)

    res.json({
      code: 200,
      message: 'Channels retrieved successfully',
      data: {
        channels,
        total: channels.length
      }
    })
  } catch (error) {
    console.error('[GET /channels] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve channels',
      error: error.message
    })
  }
})

/**
 * POST /channels - 创建频道
 */
router.post('/channels', auth, (req, res) => {
  try {
    const { name, description, isPrivate } = req.body

    // 验证
    if (!name || name.trim().length === 0 || name.length > 50) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel name. Length must be 1-50 characters'
      })
    }

    const controllers = getControllers()
    const channel = controllers.channel.createChannel({
      name: name.trim(),
      description: description?.trim() || '',
      isPrivate: isPrivate || false,
      creatorId: req.user.id
    })

    res.status(201).json({
      code: 201,
      message: 'Channel created successfully',
      data: { channel }
    })
  } catch (error) {
    console.error('[POST /channels] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to create channel',
      error: error.message
    })
  }
})

/**
 * GET /channels/:channelId - 获取频道详情
 */
router.get('/channels/:channelId', auth, (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    if (!channelId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID'
      })
    }

    const controllers = getControllers()
    const channel = controllers.channel.getChannel(channelId)

    if (!channel) {
      return res.status(404).json({
        code: 404,
        message: 'Channel not found'
      })
    }

    res.json({
      code: 200,
      message: 'Channel retrieved successfully',
      data: { channel }
    })
  } catch (error) {
    console.error('[GET /channels/:id] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve channel',
      error: error.message
    })
  }
})

/**
 * PUT /channels/:channelId - 编辑频道
 */
router.put('/channels/:channelId', auth, checkPermission('edit_channel'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    if (!channelId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID'
      })
    }

    const { name, description } = req.body
    const controllers = getControllers()
    const channel = controllers.channel.updateChannel(channelId, { name, description })

    if (!channel) {
      return res.status(404).json({
        code: 404,
        message: 'Channel not found'
      })
    }

    res.json({
      code: 200,
      message: 'Channel updated successfully',
      data: { channel }
    })
  } catch (error) {
    console.error('[PUT /channels/:id] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to update channel',
      error: error.message
    })
  }
})

/**
 * DELETE /channels/:channelId - 删除频道
 */
router.delete('/channels/:channelId', auth, checkPermission('edit_channel'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    if (!channelId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID'
      })
    }

    const controllers = getControllers()
    const success = controllers.channel.deleteChannel(channelId)

    if (!success) {
      return res.status(404).json({
        code: 404,
        message: 'Channel not found'
      })
    }

    res.json({
      code: 200,
      message: 'Channel deleted successfully'
    })
  } catch (error) {
    console.error('[DELETE /channels/:id] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to delete channel',
      error: error.message
    })
  }
})

/**
 * GET /channels/:channelId/members - 获取频道成员
 */
router.get('/channels/:channelId/members', auth, (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    if (!channelId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID'
      })
    }

    const controllers = getControllers()
    const members = controllers.channel.getChannelMembers(channelId)

    res.json({
      code: 200,
      message: 'Members retrieved successfully',
      data: { members }
    })
  } catch (error) {
    console.error('[GET /channels/:id/members] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve members',
      error: error.message
    })
  }
})

/**
 * POST /channels/:channelId/members - 邀请成员加入频道
 */
router.post('/channels/:channelId/members', auth, checkPermission('manage_members'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const userId = safeParseInt(req.body.userId)

    if (!channelId || !userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID or user ID'
      })
    }

    const controllers = getControllers()
    const success = controllers.channel.addChannelMember(channelId, userId)

    if (!success) {
      return res.status(404).json({
        code: 404,
        message: 'Channel not found'
      })
    }

    res.status(201).json({
      code: 201,
      message: 'Member added to channel'
    })
  } catch (error) {
    console.error('[POST /channels/:id/members] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to add member',
      error: error.message
    })
  }
})

/**
 * DELETE /channels/:channelId/members/:userId - 移除频道成员
 */
router.delete('/channels/:channelId/members/:userId', auth, checkPermission('manage_members'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const userId = safeParseInt(req.params.userId)

    if (!channelId || !userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID or user ID'
      })
    }

    const controllers = getControllers()
    const success = controllers.channel.removeChannelMember(channelId, userId)

    if (!success) {
      return res.status(404).json({
        code: 404,
        message: 'Channel not found'
      })
    }

    res.json({
      code: 200,
      message: 'Member removed from channel'
    })
  } catch (error) {
    console.error('[DELETE /channels/:id/members/:userId] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to remove member',
      error: error.message
    })
  }
})

// ==================== 消息 API ====================

/**
 * GET /channels/:channelId/messages - 获取频道消息
 */
router.get('/channels/:channelId/messages', auth, (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const skip = safeParseInt(req.query.skip) || 0
    const limit = safeParseInt(req.query.limit) || 50

    if (!channelId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID'
      })
    }

    const controllers = getControllers()
    const result = controllers.message.getChannelMessages(channelId, skip, limit)

    res.json({
      code: 200,
      message: 'Messages retrieved successfully',
      data: result
    })
  } catch (error) {
    console.error('[GET /channels/:id/messages] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve messages',
      error: error.message
    })
  }
})

/**
 * POST /channels/:channelId/messages - 发送消息
 */
router.post('/channels/:channelId/messages', auth, checkPermission('send_message'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const { content, type, replyTo, encryptedContent, encryptionKeyId } = req.body

    if (!channelId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID'
      })
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Message content cannot be empty'
      })
    }

    const controllers = getControllers()
    const message = controllers.message.sendMessage({
      channelId,
      senderId: req.user.id,
      senderName: `user_${req.user.id}`,
      content: content.trim(),
      type: type || 'text',
      replyTo: replyTo ? safeParseInt(replyTo) : null,
      encryptedContent,
      encryptionKeyId
    })

    res.status(201).json({
      code: 201,
      message: 'Message sent successfully',
      data: { message }
    })
  } catch (error) {
    console.error('[POST /channels/:id/messages] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to send message',
      error: error.message
    })
  }
})

/**
 * PUT /messages/:messageId - 编辑消息
 */
router.put('/messages/:messageId', auth, checkPermission('edit_message'), (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)
    const { content } = req.body

    if (!messageId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID'
      })
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Message content cannot be empty'
      })
    }

    const controllers = getControllers()
    const message = controllers.message.updateMessage(messageId, {
      content: content.trim()
    })

    if (!message) {
      return res.status(404).json({
        code: 404,
        message: 'Message not found'
      })
    }

    res.json({
      code: 200,
      message: 'Message updated successfully',
      data: { message }
    })
  } catch (error) {
    console.error('[PUT /messages/:id] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to update message',
      error: error.message
    })
  }
})

/**
 * DELETE /messages/:messageId - 删除消息
 */
router.delete('/messages/:messageId', auth, checkPermission('delete_message'), (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)

    if (!messageId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID'
      })
    }

    const controllers = getControllers()
    const success = controllers.message.deleteMessage(messageId)

    if (!success) {
      return res.status(404).json({
        code: 404,
        message: 'Message not found'
      })
    }

    res.json({
      code: 200,
      message: 'Message deleted successfully'
    })
  } catch (error) {
    console.error('[DELETE /messages/:id] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to delete message',
      error: error.message
    })
  }
})

/**
 * GET /messages/:messageId/replies - 获取消息线程/回复
 */
router.get('/messages/:messageId/replies', auth, (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)

    if (!messageId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID'
      })
    }

    const controllers = getControllers()
    const replies = controllers.message.getMessageReplies(messageId)

    res.json({
      code: 200,
      message: 'Replies retrieved successfully',
      data: { replies, total: replies.length }
    })
  } catch (error) {
    console.error('[GET /messages/:id/replies] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve replies',
      error: error.message
    })
  }
})

/**
 * POST /messages/:messageId/replies - 回复消息
 */
router.post('/messages/:messageId/replies', auth, checkPermission('send_message'), (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)
    const { content, channelId } = req.body

    if (!messageId || !content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID or empty content'
      })
    }

    const controllers = getControllers()
    const reply = controllers.message.addReply(messageId, {
      channelId,
      senderId: req.user.id,
      senderName: `user_${req.user.id}`,
      content: content.trim()
    })

    res.status(201).json({
      code: 201,
      message: 'Reply posted successfully',
      data: { reply }
    })
  } catch (error) {
    console.error('[POST /messages/:id/replies] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to post reply',
      error: error.message
    })
  }
})

// ==================== 表情反应 API ====================

/**
 * GET /messages/:messageId/reactions - 获取消息反应
 */
router.get('/messages/:messageId/reactions', auth, (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)

    if (!messageId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID'
      })
    }

    const controllers = getControllers()
    const reactions = controllers.message.getMessageReactions(messageId)

    res.json({
      code: 200,
      message: 'Reactions retrieved successfully',
      data: { reactions }
    })
  } catch (error) {
    console.error('[GET /messages/:id/reactions] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve reactions',
      error: error.message
    })
  }
})

/**
 * POST /messages/:messageId/reactions - 添加反应
 */
router.post('/messages/:messageId/reactions', auth, checkPermission('send_message'), (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)
    const { emoji } = req.body

    if (!messageId || !emoji) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID or emoji'
      })
    }

    const controllers = getControllers()
    const reactions = controllers.message.addReaction(messageId, req.user.id, emoji)

    if (!reactions) {
      return res.status(404).json({
        code: 404,
        message: 'Message not found'
      })
    }

    res.status(201).json({
      code: 201,
      message: 'Reaction added',
      data: { reactions }
    })
  } catch (error) {
    console.error('[POST /messages/:id/reactions] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to add reaction',
      error: error.message
    })
  }
})

/**
 * DELETE /messages/:messageId/reactions/:emoji - 移除反应
 */
router.delete('/messages/:messageId/reactions/:emoji', auth, (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)
    const { emoji } = req.params

    if (!messageId || !emoji) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID or emoji'
      })
    }

    const controllers = getControllers()
    const reactions = controllers.message.removeReaction(messageId, req.user.id, emoji)

    if (!reactions) {
      return res.status(404).json({
        code: 404,
        message: 'Message not found'
      })
    }

    res.json({
      code: 200,
      message: 'Reaction removed',
      data: { reactions }
    })
  } catch (error) {
    console.error('[DELETE /messages/:id/reactions/:emoji] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to remove reaction',
      error: error.message
    })
  }
})

// ==================== 已读回执 API ====================

/**
 * POST /messages/:messageId/read - 标记消息已读
 */
router.post('/messages/:messageId/read', auth, (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)
    const { readAt } = req.body

    if (!messageId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID'
      })
    }

    // TODO: 保存已读回执到数据库
    res.json({
      code: 200,
      message: 'Message marked as read',
      data: {
        messageId,
        userId: req.user.id,
        readAt: readAt || new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[POST /messages/:id/read] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to mark message as read',
      error: error.message
    })
  }
})

/**
 * GET /messages/:messageId/read-receipts - 获取消息已读状态
 */
router.get('/messages/:messageId/read-receipts', auth, (req, res) => {
  try {
    const messageId = safeParseInt(req.params.messageId)

    if (!messageId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid message ID'
      })
    }

    // TODO: 从数据库获取已读回执
    res.json({
      code: 200,
      message: 'Read receipts retrieved successfully',
      data: {
        messageId,
        receipts: []
      }
    })
  } catch (error) {
    console.error('[GET /messages/:id/read-receipts] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve read receipts',
      error: error.message
    })
  }
})

// ==================== 用户 API ====================

/**
 * GET /users/:userId - 获取用户信息
 */
router.get('/users/:userId', auth, (req, res) => {
  try {
    const userId = safeParseInt(req.params.userId)

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid user ID'
      })
    }

    const controllers = getControllers()
    const user = controllers.user.getUser(userId)

    res.json({
      code: 200,
      message: 'User retrieved successfully',
      data: { user }
    })
  } catch (error) {
    console.error('[GET /users/:id] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve user',
      error: error.message
    })
  }
})

/**
 * PUT /users/status - 更新用户状态
 */
router.put('/users/status', auth, (req, res) => {
  try {
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        code: 400,
        message: 'Status is required'
      })
    }

    const controllers = getControllers()
    const result = controllers.user.updateUserStatus(req.user.id, status)

    res.json({
      code: 200,
      message: 'Status updated',
      data: result
    })
  } catch (error) {
    console.error('[PUT /users/status] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to update status',
      error: error.message
    })
  }
})

/**
 * GET /users/:userId/status - 获取用户在线状态
 */
router.get('/users/:userId/status', auth, (req, res) => {
  try {
    const userId = safeParseInt(req.params.userId)

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid user ID'
      })
    }

    // TODO: 从缓存获取用户状态
    res.json({
      code: 200,
      message: 'User status retrieved successfully',
      data: {
        userId,
        status: 'online',
        lastSeen: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[GET /users/:id/status] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve user status',
      error: error.message
    })
  }
})

/**
 * GET /users/search - 搜索用户
 */
router.get('/users/search', auth, (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.length === 0) {
      return res.json({
        code: 200,
        message: 'Search results',
        data: { users: [] }
      })
    }

    const controllers = getControllers()
    const users = controllers.user.searchUsers(q)

    res.json({
      code: 200,
      message: 'Search results',
      data: { users }
    })
  } catch (error) {
    console.error('[GET /users/search] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to search users',
      error: error.message
    })
  }
})

// ==================== 权限 API ====================

/**
 * GET /channels/:channelId/permissions/:userId - 获取用户权限
 */
router.get('/channels/:channelId/permissions/:userId', auth, checkPermission('manage_members'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const userId = safeParseInt(req.params.userId)

    if (!channelId || !userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID or user ID'
      })
    }

    const controllers = getControllers()
    const permission = controllers.permission.getUserPermission(userId, channelId)

    res.json({
      code: 200,
      message: 'Permission retrieved successfully',
      data: permission
    })
  } catch (error) {
    console.error('[GET /channels/:id/permissions/:userId] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve permission',
      error: error.message
    })
  }
})

/**
 * PUT /channels/:channelId/permissions/:userId/role - 设置用户角色
 */
router.put('/channels/:channelId/permissions/:userId/role', auth, checkPermission('manage_members'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const userId = safeParseInt(req.params.userId)
    const { role } = req.body

    if (!channelId || !userId || !role) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid parameters'
      })
    }

    const controllers = getControllers()
    const permission = controllers.permission.setUserRole(userId, channelId, role)

    res.json({
      code: 200,
      message: 'Role updated successfully',
      data: permission
    })
  } catch (error) {
    console.error('[PUT /channels/:id/permissions/:userId/role] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to update role',
      error: error.message
    })
  }
})

/**
 * POST /channels/:channelId/permissions/:userId/mute - 禁言用户
 */
router.post('/channels/:channelId/permissions/:userId/mute', auth, checkPermission('manage_members'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const userId = safeParseInt(req.params.userId)
    const { duration } = req.body

    if (!channelId || !userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID or user ID'
      })
    }

    const controllers = getControllers()
    const permission = controllers.permission.muteUser(userId, channelId, duration)

    res.json({
      code: 200,
      message: 'User muted successfully',
      data: permission
    })
  } catch (error) {
    console.error('[POST /channels/:id/permissions/:userId/mute] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to mute user',
      error: error.message
    })
  }
})

/**
 * POST /channels/:channelId/permissions/:userId/kick - 踢出用户
 */
router.post('/channels/:channelId/permissions/:userId/kick', auth, checkPermission('manage_members'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const userId = safeParseInt(req.params.userId)

    if (!channelId || !userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID or user ID'
      })
    }

    const controllers = getControllers()
    const permission = controllers.permission.kickUser(userId, channelId)

    res.json({
      code: 200,
      message: 'User kicked from channel',
      data: permission
    })
  } catch (error) {
    console.error('[POST /channels/:id/permissions/:userId/kick] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to kick user',
      error: error.message
    })
  }
})

/**
 * POST /channels/:channelId/permissions/:userId/ban - 封禁用户
 */
router.post('/channels/:channelId/permissions/:userId/ban', auth, checkPermission('manage_members'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const userId = safeParseInt(req.params.userId)
    const { duration } = req.body

    if (!channelId || !userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid channel ID or user ID'
      })
    }

    const controllers = getControllers()
    const permission = controllers.permission.banUser(userId, channelId, duration)

    res.json({
      code: 200,
      message: 'User banned successfully',
      data: permission
    })
  } catch (error) {
    console.error('[POST /channels/:id/permissions/:userId/ban] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to ban user',
      error: error.message
    })
  }
})

/**
 * DELETE /channels/:channelId/permissions/:userId/restrictions/:type - 解除限制
 */
router.delete('/channels/:channelId/permissions/:userId/restrictions/:type', auth, checkPermission('manage_members'), (req, res) => {
  try {
    const channelId = safeParseInt(req.params.channelId)
    const userId = safeParseInt(req.params.userId)
    const { type } = req.params

    if (!channelId || !userId || !type) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid parameters'
      })
    }

    const controllers = getControllers()
    const permission = controllers.permission.removeRestriction(userId, channelId, type)

    if (!permission) {
      return res.status(404).json({
        code: 404,
        message: 'User or restriction not found'
      })
    }

    res.json({
      code: 200,
      message: `${type} restriction removed`,
      data: permission
    })
  } catch (error) {
    console.error('[DELETE /channels/:id/permissions/:userId/restrictions/:type] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to remove restriction',
      error: error.message
    })
  }
})

// ==================== 加密 API ====================

/**
 * POST /crypto/public-key - 上传公钥
 */
router.post('/crypto/public-key', auth, (req, res) => {
  try {
    const { publicKey } = req.body

    if (!publicKey) {
      return res.status(400).json({
        code: 400,
        message: 'Public key is required'
      })
    }

    const controllers = getControllers()
    const result = controllers.crypto.storePublicKey(req.user.id, publicKey)

    res.json({
      code: 200,
      message: 'Public key stored successfully',
      data: result
    })
  } catch (error) {
    console.error('[POST /crypto/public-key] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to store public key',
      error: error.message
    })
  }
})

/**
 * GET /crypto/public-key/:userId - 获取用户公钥
 */
router.get('/crypto/public-key/:userId', auth, (req, res) => {
  try {
    const userId = safeParseInt(req.params.userId)

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid user ID'
      })
    }

    const controllers = getControllers()
    const publicKey = controllers.crypto.getPublicKey(userId)

    if (!publicKey) {
      return res.status(404).json({
        code: 404,
        message: 'Public key not found'
      })
    }

    res.json({
      code: 200,
      message: 'Public key retrieved successfully',
      data: publicKey
    })
  } catch (error) {
    console.error('[GET /crypto/public-key/:userId] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve public key',
      error: error.message
    })
  }
})

// ==================== 健康检查 ====================

/**
 * GET /health - 健康检查端点
 */
router.get('/health', (req, res) => {
  try {
    const { healthCheck } = require('../services/dataService')
    const status = healthCheck()

    res.json({
      code: 200,
      message: 'API server is running',
      data: status
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Health check failed',
      error: error.message
    })
  }
})

// ==================== DM API ====================
// DM (Direct Message) 功能需要单独的数据模型
// 这里仅提供端点框架

/**
 * GET /dms - 获取所有 DM 对话
 */
router.get('/dms', auth, (req, res) => {
  // TODO: 从数据库获取用户的所有 DM 对话
  res.json({
    code: 200,
    message: 'DM conversations retrieved',
    data: {
      dms: []
    }
  })
})

/**
 * POST /dms - 创建 DM 对话
 */
router.post('/dms', auth, (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: 'User ID is required'
      })
    }

    res.status(201).json({
      code: 201,
      message: 'DM conversation created',
      data: {
        dm: {
          id: Date.now(),
          participantId: userId,
          participantName: `user_${userId}`,
          createdAt: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Failed to create DM conversation',
      error: error.message
    })
  }
})

/**
 * GET /dms/:dmId/messages - 获取 DM 消息
 */
router.get('/dms/:dmId/messages', auth, (req, res) => {
  // TODO: 从数据库获取 DM 消息
  res.json({
    code: 200,
    message: 'DM messages retrieved',
    data: {
      messages: []
    }
  })
})

/**
 * POST /dms/:dmId/messages - 发送 DM 消息
 */
router.post('/dms/:dmId/messages', auth, (req, res) => {
  try {
    const { content } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Message content cannot be empty'
      })
    }

    res.status(201).json({
      code: 201,
      message: 'Message sent',
      data: {
        message: {
          id: Date.now(),
          dmId: parseInt(req.params.dmId),
          senderId: req.user.id,
          content: content.trim(),
          createdAt: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Failed to send DM',
      error: error.message
    })
  }
})

// ==================== AI 工作流 API ====================

/**
 * 挂载社区路由
 * 提供社区功能：帖子、文章、评论、点赞等
 */
router.use('/community', communityRouter)

/**
 * 挂载 AI 路由
 * 提供 Dify 集成的 AI 功能：摘要、关键点、SEO关键词、流式对话
 */
router.use('/ai', aiRouter)

// ==================== 错误处理 ====================

/**
 * 404 处理
 */
router.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API endpoint not found',
    path: req.path
  })
})

module.exports = router
