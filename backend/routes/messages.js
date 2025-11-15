/**
 * 私信 API 路由
 */

const express = require('express')
const router = express.Router()
const { getControllers } = require('../services/dataService')

/**
 * 获取用户的对话列表
 * GET /api/messages/conversations
 */
router.get('/conversations', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const userId = parseInt(req.headers['x-user-id'] || '1')

    const controller = getControllers().privateMessage
    const result = controller.getConversations(userId, parseInt(page), parseInt(limit))

    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 获取或创建对话
 * POST /api/messages/conversations
 */
router.post('/conversations', (req, res) => {
  try {
    const { otherUserId } = req.body
    const userId = parseInt(req.headers['x-user-id'] || '1')

    if (!otherUserId) {
      return res.status(400).json({
        code: 400,
        message: 'otherUserId is required'
      })
    }

    const controller = getControllers().privateMessage
    const result = controller.getOrCreateConversation(userId, parseInt(otherUserId))

    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 获取对话详情
 * GET /api/messages/conversations/:conversationId
 */
router.get('/conversations/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 50 } = req.query
    const userId = parseInt(req.headers['x-user-id'] || '1')

    const controller = getControllers().privateMessage
    const conversation = getControllers().getMockData().conversations.find(c => c.id === conversationId)

    if (!conversation) {
      return res.status(404).json({
        code: 404,
        message: '对话不存在'
      })
    }

    if (!conversation.participantIds.includes(userId)) {
      return res.status(403).json({
        code: 403,
        message: '你没有权限查看此对话'
      })
    }

    // 标记对话中的消息为已读
    controller.markConversationAsRead(conversationId, userId)

    const messagesResult = controller.getMessages(conversationId, parseInt(page), parseInt(limit))

    // 获取其他参与者的信息
    const otherUserId = conversation.participantIds.find(id => id !== userId)
    const otherUser = getControllers().getMockData().users?.find(u => u.id === otherUserId)

    res.json({
      code: 200,
      data: {
        conversation: {
          ...conversation,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            avatar: otherUser.avatar,
            isOnline: otherUser.isOnline || false
          } : null
        },
        messages: messagesResult.data,
        pagination: {
          page: messagesResult.page,
          limit: messagesResult.limit,
          total: messagesResult.total,
          hasMore: messagesResult.hasMore
        }
      }
    })
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 获取消息列表
 * GET /api/messages/conversations/:conversationId/messages
 */
router.get('/conversations/:conversationId/messages', (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 50 } = req.query
    const userId = parseInt(req.headers['x-user-id'] || '1')

    const controller = getControllers().privateMessage
    const conversation = getControllers().getMockData().conversations.find(c => c.id === conversationId)

    if (!conversation) {
      return res.status(404).json({
        code: 404,
        message: '对话不存在'
      })
    }

    if (!conversation.participantIds.includes(userId)) {
      return res.status(403).json({
        code: 403,
        message: '你没有权限查看此对话'
      })
    }

    const result = controller.getMessages(conversationId, parseInt(page), parseInt(limit))
    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 发送私信
 * POST /api/messages/conversations/:conversationId/messages
 */
router.post('/conversations/:conversationId/messages', (req, res) => {
  try {
    const { conversationId } = req.params
    const { content, type = 'text' } = req.body
    const userId = parseInt(req.headers['x-user-id'] || '1')

    if (!content || !content.trim()) {
      return res.status(400).json({
        code: 400,
        message: '消息内容不能为空'
      })
    }

    const controller = getControllers().privateMessage
    const result = controller.sendMessage(conversationId, userId, content, type)

    if (result.code !== 200) {
      return res.status(result.code || 400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 标记消息已读
 * POST /api/messages/:messageId/read
 */
router.post('/:messageId/read', (req, res) => {
  try {
    const { messageId } = req.params
    const userId = parseInt(req.headers['x-user-id'] || '1')

    const controller = getControllers().privateMessage
    const result = controller.markAsRead(messageId, userId)

    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 标记对话中的所有消息已读
 * POST /api/messages/conversations/:conversationId/read
 */
router.post('/conversations/:conversationId/read', (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = parseInt(req.headers['x-user-id'] || '1')

    const controller = getControllers().privateMessage
    const result = controller.markConversationAsRead(conversationId, userId)

    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 搜索对话中的消息
 * GET /api/messages/conversations/:conversationId/search
 */
router.get('/conversations/:conversationId/search', (req, res) => {
  try {
    const { conversationId } = req.params
    const { keyword } = req.query
    const userId = parseInt(req.headers['x-user-id'] || '1')

    if (!keyword) {
      return res.status(400).json({
        code: 400,
        message: 'keyword is required'
      })
    }

    const controller = getControllers().privateMessage
    const result = controller.searchMessages(conversationId, keyword, userId)

    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 清空对话记录
 * DELETE /api/messages/conversations/:conversationId/clear
 */
router.delete('/conversations/:conversationId/clear', (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = parseInt(req.headers['x-user-id'] || '1')

    const controller = getControllers().privateMessage
    const result = controller.clearConversationMessages(conversationId, userId)

    if (result.code !== 200) {
      return res.status(result.code || 400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * 删除对话
 * DELETE /api/messages/conversations/:conversationId
 */
router.delete('/conversations/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = parseInt(req.headers['x-user-id'] || '1')

    const controller = getControllers().privateMessage
    const result = controller.deleteConversation(conversationId, userId)

    if (result.code !== 200) {
      return res.status(result.code || 400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('[Messages API] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
})

module.exports = router
