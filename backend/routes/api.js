/**
 * 后端 API 路由统一导出
 * 集成所有 API 路由到主应用，使用控制器进行业务逻辑处理
 * Phase 4B 实现：后端 API 集成和数据持久化
 */

const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { getControllers } = require('../services/dataService')
const { eventBridge } = require('../services/eventBridge')
const { updateUserAvatar, getUserById, updateUserProfile } = require('../services/userDbService')
const { getUserAbilityProfile, userAbilityProfiles } = require('../data/abilityProfiles')
const authRouter = require('./auth')
const aiRouter = require('./ai')
const aiHistoryRouter = require('./ai-history')
const communityRouter = require('./community')
const messagesRouter = require('./messages')
const contributionsRouter = require('./contributions')
const wrongAnswersRouter = require('./wrongAnswers')
const recommendationsRouter = require('./recommendations')
const hierarchicalDomains = require('../data/mock-domains-hierarchical.json')
const contributionsData = require('../data/contributions-data.json')

const questionCatalog = Array.isArray(contributionsData.questions) ? contributionsData.questions : []

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

function paginate(list, page = 1, size = 20) {
  const currentPage = Math.max(parseInt(page, 10) || 1, 1)
  const pageSize = Math.max(parseInt(size, 10) || 20, 1)
  const start = (currentPage - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return {
    items,
    page: currentPage,
    size: pageSize,
    total: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / pageSize))
  }
}

function buildQuestionFacets(list) {
  const difficulties = {}
  const categories = {}
  const tags = {}

  list.forEach((q) => {
    const diffKey = (q.difficulty || 'unknown').toString()
    difficulties[diffKey] = (difficulties[diffKey] || 0) + 1

    const catKey = (q.category || '未分类').toString()
    categories[catKey] = (categories[catKey] || 0) + 1

    ;(q.tags || []).forEach((tag) => {
      const key = tag.toString()
      tags[key] = (tags[key] || 0) + 1
    })
  })

  return {
    difficulties: Object.keys(difficulties).map((key) => ({
      id: key,
      key,
      label: key,
      count: difficulties[key]
    })),
    categories: Object.keys(categories).map((key) => ({
      id: key,
      name: key,
      count: categories[key]
    })),
    tags: Object.keys(tags).map((key) => ({
      id: key,
      name: key,
      tag: key,
      count: tags[key]
    }))
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
// 获取当前登录用户信息
router.get('/users/me', auth, async (req, res) => {
  try {
    const userId = req.user.id

    // 1. 优先从数据库读取完整用户信息（包括 avatar、username 等）
    let user = null
    try {
      user = await getUserById(userId)
    } catch (dbError) {
      console.error('[GET /users/me] DB error:', dbError.message)
    }

    // 2. 如果数据库中不存在该用户，则回退到内存 mock 用户
    if (!user) {
      const controllers = getControllers()
      user = controllers.user.getUser(userId)
    }

    res.json({
      code: 200,
      message: 'Current user retrieved successfully',
      data: user
    })
  } catch (error) {
    console.error('[GET /users/me] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve current user',
      error: error.message
    })
  }
})

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
   * POST /users/avatar - 上传并更新当前用户头像
   *
   * 设计目标：在开发 / 测试环境下，即使数据库不可用或出现异常，
   * 也不要让前端看到 500，而是优雅降级为“仅内存更新”的成功响应。
   */
  router.post('/users/avatar', auth, async (req, res) => {
    const userId = req.user.id
    const avatarUrl = `https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png?t=${Date.now()}`

    try {
      const controllers = getControllers()
      const user = controllers.user.getUser(userId)

      if (user) {
        user.avatar = avatarUrl
      }

      // 持久化到数据库失败时只记录日志，不影响整体流程
      try {
        await updateUserAvatar(userId, avatarUrl)
      } catch (dbError) {
        console.error('[POST /users/avatar] DB persist error:', dbError.message)
      }

      res.json({
        code: 200,
        message: 'Avatar uploaded successfully',
        data: { url: avatarUrl }
      })
    } catch (error) {
      console.error('[POST /users/avatar] Error (fallback to in-memory avatar):', error)
      // 即便发生异常也返回成功，确保前端不会看到 500
      res.json({
        code: 200,
        message: 'Avatar uploaded successfully (fallback)',
        data: { url: avatarUrl }
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

  // ==================== Ability API ====================

  /**
   * GET /ability/profile/:userId - 获取用户能力画像
   */
  router.get('/ability/profile/:userId', auth, (req, res) => {
    try {
      const userId = safeParseInt(req.params.userId)

      if (!userId) {
        return res.status(400).json({
          code: 400,
          message: 'Invalid user ID'
        })
      }

      const profile = getUserAbilityProfile(userId)

      if (!profile) {
        return res.status(404).json({
          code: 404,
          message: 'Ability profile not found'
        })
      }

      res.json({
        code: 200,
        message: 'Ability profile retrieved successfully',
        data: profile
      })
    } catch (error) {
      console.error('[GET /ability/profile/:userId] Error:', error)
      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve ability profile',
        error: error.message
      })
    }
  })

  /**
   * GET /ability/radar/:userId - 获取雷达图数据
   */
  router.get('/ability/radar/:userId', auth, (req, res) => {
    try {
      const userId = safeParseInt(req.params.userId)

      if (!userId) {
        return res.status(400).json({
          code: 400,
          message: 'Invalid user ID'
        })
      }

      const profile = getUserAbilityProfile(userId)

      if (!profile) {
        return res.status(404).json({
          code: 404,
          message: 'Ability profile not found'
        })
      }

      const domains = []
      const scores = []
      const percentiles = []

      Object.values(profile.domainScores || {}).forEach((domain) => {
        domains.push(domain.domainName)
        scores.push(domain.totalScore)
        percentiles.push(domain.accuracy)
      })

      res.json({
        code: 200,
        message: 'Radar data retrieved successfully',
        data: {
          domains,
          scores,
          maxScore: 1000,
          percentiles
        }
      })
    } catch (error) {
      console.error('[GET /ability/radar/:userId] Error:', error)
      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve radar data',
        error: error.message
      })
    }
  })

  /**
   * GET /ability/t-shape-leaderboard - 获取 T 型指数排行榜
   */
  router.get('/ability/t-shape-leaderboard', auth, (req, res) => {
    try {
      const limit = safeParseInt(req.query.limit) || 20

      const profiles = (userAbilityProfiles || [])
        .slice()
        .sort((a, b) => (b.tShapeAnalysis?.index || 0) - (a.tShapeAnalysis?.index || 0))
        .slice(0, limit)

      const items = profiles.map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        username: `user_${profile.userId}`,
        tShapeIndex: profile.tShapeAnalysis?.index || 0,
        primaryDomain: profile.primaryDomain?.domainName || '',
        depthScore: profile.tShapeAnalysis?.depthScore || 0,
        breadthScore: profile.tShapeAnalysis?.breadthScore || 0
      }))

      res.json({
        code: 200,
        message: 'T-shape leaderboard retrieved successfully',
        data: { items }
      })
    } catch (error) {
      console.error('[GET /ability/t-shape-leaderboard] Error:', error)
      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve T-shape leaderboard',
        error: error.message
      })
    }
  })

  /**
   * GET /ability/cross-domain-recommendations/:userId - 获取跨专业推荐
   */
  router.get('/ability/cross-domain-recommendations/:userId', auth, (req, res) => {
    try {
      const userId = safeParseInt(req.params.userId)

      if (!userId) {
        return res.status(400).json({
          code: 400,
          message: 'Invalid user ID'
        })
      }

      const profile = getUserAbilityProfile(userId)

      if (!profile) {
        return res.status(404).json({
          code: 404,
          message: 'Ability profile not found'
        })
      }

      const recommendations = profile.recommendations || []

      res.json({
        code: 200,
        message: 'Cross-domain recommendations retrieved successfully',
        data: {
          recommendations,
          questions: [],
          learningPaths: []
        }
      })
    } catch (error) {
      console.error('[GET /ability/cross-domain-recommendations/:userId] Error:', error)
      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve cross-domain recommendations',
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
  // Legacy inline handler disabled
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
 * 挂载认证路由
 * 提供登录、注册、token刷新等功能
 */
router.use('/auth', authRouter)

/**
 * 挂载社区贡献路由
 * 提供题库贡献、讨论、收藏等功能
 */
router.use('/contributions', contributionsRouter)
/**
 * 快捷路由：直接访问 /api/questions 等同于 /api/contributions/questions
 */
// router.use('/questions', contributionsRouter)

/**
 * 挂载社区路由
 * 提供社区功能：帖子、文章、评论、点赞等
 */
router.use('/community', communityRouter)

/**
 * 挂载私信路由
 * 提供一对一私信功能：对话列表、消息发送、消息已读等
 */
router.use('/messages', messagesRouter)

/**
 * 挂载 AI 路由
 * 提供 Dify 集成的 AI 功能：摘要、关键点、SEO关键词、流式对话
 */
router.use('/ai', aiRouter)

/**
 * 挂载 AI 历史路由
 * 提供对话历史的持久化、查询、删除等功能
 */
router.use('/ai-history', aiHistoryRouter)

// ==================== 领域/分类 API ====================

/**
 * GET /domains/hierarchical - 获取分层领域树数据
 */
router.get('/domains/hierarchical', (req, res) => {
  try {
    const payload = Array.isArray(hierarchicalDomains) ? hierarchicalDomains : []

    res.json({
      code: 200,
      message: 'Hierarchical domains retrieved successfully',
      data: payload
    })
  } catch (error) {
    console.error('[GET /domains/hierarchical] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load hierarchical domains',
      error: error.message
    })
  }
})

// ==================== 错误处理 ====================

/**
 * 404 处理
 */
/**
 * PUT /users/profile - 更新当前登录用户基础资料
 */
router.put('/users/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const profile = req.body || {}

    // 1. 更新数据库中的基础信息
    const updatedUser = await updateUserProfile(userId, profile)

    // 2. 同步内存 mock 用户，保证其他模块读取到最新昵称/头像等
    const controllers = getControllers()
    const mockUser = controllers.user.getUser(userId)

    if (updatedUser) {
      if (updatedUser.username !== undefined) mockUser.username = updatedUser.username
      if (updatedUser.realName !== undefined) mockUser.realName = updatedUser.realName
      if (updatedUser.avatar !== undefined) mockUser.avatar = updatedUser.avatar
      if (updatedUser.bio !== undefined) mockUser.bio = updatedUser.bio
      if (updatedUser.phone !== undefined) mockUser.phone = updatedUser.phone
    }

    res.json({
      code: 200,
      message: 'User profile updated successfully',
      data: updatedUser || mockUser
    })
  } catch (error) {
    console.error('[PUT /users/profile] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to update user profile',
      error: error.message
    })
  }
})

// ==================== 全局数据端点 ====================

// GET /api/domains - 获取所有学科域
router.get('/domains', (req, res) => {
  const domains = [
    { id: 1, name: '计算机科学', description: '计算机科学基础与应用' },
    { id: 2, name: '前端开发', description: 'Web前端技术' },
    { id: 3, name: '后端开发', description: '后端服务开发' },
    { id: 4, name: '移动开发', description: '移动应用开发' },
    { id: 5, name: '数据科学', description: '数据分析与机器学习' },
    { id: 6, name: '云计算与DevOps', description: '云平台与运维技术' }
  ]
  res.json({
    code: 200,
    message: 'Domains retrieved successfully',
    data: domains
  })
})

// GET /api/domains/recommended - 获取推荐学科
router.get('/domains/recommended', (req, res) => {
  const recommended = [
    { id: 1, name: '计算机科学', score: 95 },
    { id: 2, name: '前端开发', score: 87 },
    { id: 3, name: '后端开发', score: 82 }
  ]
  res.json({
    code: 200,
    message: 'Recommended domains retrieved',
    data: recommended
  })
})

// GET /api/categories - 获取分类
router.get('/categories', (req, res) => {
  const type = req.query.type
  const categories = [
    { id: 1, name: '技术基础', type: 'domain' },
    { id: 2, name: '算法与数据结构', type: 'domain' },
    { id: 3, name: '系统设计', type: 'domain' },
    { id: 4, name: '数据库', type: 'domain' },
    { id: 5, name: '前端框架', type: 'domain' },
    { id: 6, name: '后端框架', type: 'domain' }
  ]

  if (type) {
    res.json({
      code: 200,
      message: 'Categories retrieved',
      data: categories.filter(c => c.type === type)
    })
  } else {
    res.json({
      code: 200,
      message: 'Categories retrieved',
      data: categories
    })
  }
})

// GET /api/disciplines - 获取学科
router.get('/disciplines', (req, res) => {
  const disciplines = [
    { id: 1, name: '编程语言', count: 156 },
    { id: 2, name: '数据结构', count: 134 },
    { id: 3, name: '算法设计', count: 98 },
    { id: 4, name: '数据库原理', count: 87 },
    { id: 5, name: 'Web框架', count: 76 },
    { id: 6, name: '分布式系统', count: 65 }
  ]
  res.json({
    code: 200,
    message: 'Disciplines retrieved successfully',
    data: disciplines
  })
})

// ==================== 题库 / 问题相关 API ====================

// GET /api/questions - 获取题库列表
router.get('/questions', (req, res) => {
  try {
    const {
      page = 1,
      size = 20,
      difficulty,
      type,
      tags,
      keyword,
      sort = 'recent'
    } = req.query

    let list = [...questionCatalog]

    if (difficulty) {
      const difficultySet = String(difficulty)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      if (difficultySet.length) {
        list = list.filter((q) => difficultySet.includes(q.difficulty))
      }
    }

    if (type) {
      const typeSet = String(type)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      if (typeSet.length) {
        list = list.filter((q) => typeSet.includes(q.type))
      }
    }

    if (tags) {
      const tagSet = String(tags)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      if (tagSet.length) {
        list = list.filter((q) =>
          Array.isArray(q.tags) && tagSet.every((tag) => q.tags.includes(tag))
        )
      }
    }

    if (keyword) {
      const kw = String(keyword).toLowerCase().trim()
      if (kw) {
        list = list.filter((q) => {
          const title = (q.title || '').toLowerCase()
          const content = (q.content || '').toLowerCase()
          return title.includes(kw) || content.includes(kw)
        })
      }
    }

    if (sort === 'popular') {
      list.sort(
        (a, b) =>
          (b.views || 0) + (b.favorites || 0) - ((a.views || 0) + (a.favorites || 0))
      )
    } else {
      list.sort((a, b) => {
        const aTime = new Date(a.publishedAt || 0).getTime()
        const bTime = new Date(b.publishedAt || 0).getTime()
        return bTime - aTime
      })
    }

    const paged = paginate(list, page, size)
    const facets = buildQuestionFacets(list)

    res.json({
      code: 200,
      message: 'Questions retrieved successfully',
      data: {
        items: paged.items,
        page: paged.page,
        size: paged.size,
        total: paged.total,
        totalPages: paged.totalPages,
        summary: {
          total: paged.total,
          page: paged.page,
          size: paged.size,
          totalPages: paged.totalPages
        },
        facets
      }
    })
  } catch (error) {
    console.error('[GET /questions] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load questions',
      error: error.message
    })
  }
})

// GET /api/questions/categories - 获取题库分类树
router.get('/questions/categories', (req, res) => {
  try {
    const byCategory = {}
    questionCatalog.forEach((q) => {
      const name = q.category || '未分类'
      if (!byCategory[name]) {
        byCategory[name] = []
      }
      byCategory[name].push(q)
    })

    const tree = Object.keys(byCategory).map((name) => ({
      id: name,
      name,
      children: byCategory[name].map((q) => ({
        id: q.id,
        name: q.title
      }))
    }))

    res.json({
      code: 200,
      message: 'Question categories retrieved',
      data: {
        tree,
        flat: tree.map((node) => ({ id: node.id, name: node.name, parentId: null }))
      }
    })
  } catch (error) {
    console.error('[GET /questions/categories] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load question categories',
      error: error.message
    })
  }
})

// GET /api/questions/tags - 获取题库标签
router.get('/questions/tags', (req, res) => {
  try {
    const tagCount = {}
    questionCatalog.forEach((q) => {
      ;(q.tags || []).forEach((tag) => {
        const key = tag.toString()
        tagCount[key] = (tagCount[key] || 0) + 1
      })
    })

    const items = Object.keys(tagCount).map((key) => ({
      id: key,
      name: key,
      tag: key,
      count: tagCount[key]
    }))

    res.json({
      code: 200,
      message: 'Question tags retrieved',
      data: {
        items
      }
    })
  } catch (error) {
    console.error('[GET /questions/tags] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load question tags',
      error: error.message
    })
  }
})

// GET /api/questions/facets - 获取题库条件概览
router.get('/questions/facets', (req, res) => {
  try {
    const facets = buildQuestionFacets(questionCatalog)
    res.json({
      code: 200,
      message: 'Question facets retrieved',
      data: facets
    })
  } catch (error) {
    console.error('[GET /questions/facets] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load question facets',
      error: error.message
    })
  }
})

// GET /api/questions/trending - 热门题目
router.get('/questions/trending', (req, res) => {
  try {
    const size = parseInt(req.query.size, 10) || 10
    const sorted = [...questionCatalog].sort(
      (a, b) =>
        (b.views || 0) + (b.favorites || 0) - ((a.views || 0) + (a.favorites || 0))
    )
    const items = sorted.slice(0, size)

    res.json({
      code: 200,
      message: 'Trending questions retrieved',
      data: {
        items
      }
    })
  } catch (error) {
    console.error('[GET /questions/trending] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load trending questions',
      error: error.message
    })
  }
})

// GET /api/questions/recommendations - 题库推荐
router.get('/questions/recommendations', (req, res) => {
  try {
    const items = Array.isArray(contributionsData.recommendations)
      ? contributionsData.recommendations
      : []
    res.json({
      code: 200,
      message: 'Question recommendations retrieved',
      data: {
        items
      }
    })
  } catch (error) {
    console.error('[GET /questions/recommendations] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load question recommendations',
      error: error.message
    })
  }
})

// GET /api/questions/:id - 单题详情
router.get('/questions/:id', (req, res) => {
  try {
    const id = req.params.id
    const question = questionCatalog.find((q) => String(q.id) === String(id))
    if (!question) {
      return res.status(404).json({
        code: 404,
        message: 'Question not found'
      })
    }

    res.json({
      code: 200,
      message: 'Question retrieved',
      data: question
    })
  } catch (error) {
    console.error('[GET /questions/:id] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load question detail',
      error: error.message
    })
  }
})

// POST /api/questions/:id/submit - 提交答案（简化版）
router.post('/questions/:id/submit', (req, res) => {
  try {
    const id = req.params.id
    const question = questionCatalog.find((q) => String(q.id) === String(id))
    if (!question) {
      return res.status(404).json({
        code: 404,
        message: 'Question not found'
      })
    }

    const payload = req.body || {}

    res.json({
      code: 200,
      message: 'Answer submitted',
      data: {
        questionId: question.id,
        receivedAt: new Date().toISOString(),
        payload
      }
    })
  } catch (error) {
    console.error('[POST /questions/:id/submit] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to submit answer',
      error: error.message
    })
  }
})

// GET /api/questions/:id/practice-records - 获取简单的练习记录
router.get('/questions/:id/practice-records', (req, res) => {
  try {
    const id = req.params.id
    const question = questionCatalog.find((q) => String(q.id) === String(id))
    if (!question) {
      return res.status(404).json({
        code: 404,
        message: 'Question not found'
      })
    }

    res.json({
      code: 200,
      message: 'Practice records retrieved',
      data: {
        items: [],
        total: 0
      }
    })
  } catch (error) {
    console.error('[GET /questions/:id/practice-records] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to load practice records',
      error: error.message
    })
  }
})

// NOTE: 404 handler moved to top-level server (backend/server.js),
// so this router-level catch-all is removed to avoid shadowing later routes.

// ==================== 会话管理端点 ====================

// GET /api/sessions - 获取所有会话
router.get('/sessions', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: []
  })
})

// ==================== 错题本路由挂载 ====================

router.get('/sessions', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: []
  })
})

router.use('/', wrongAnswersRouter)

module.exports = router
