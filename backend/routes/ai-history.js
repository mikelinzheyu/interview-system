/**
 * AI 对话历史 API 路由 - FIX: 直接使用 Sequelize ORM
 * 处理对话历史的保存、查询、删除等操作
 * CRITICAL FIX: 绕过 database.js 查询包装层,直接使用 Sequelize
 */

console.log('[AI-History Module] Loading ai-history.js router module...')

const express = require('express')
const router = express.Router()
const { AIConversation, AIMessage } = require('../models')

console.log('[AI-History Module] ✅ Module loaded, router created')

// 认证中间件
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    console.warn(`[Auth] ❌ 未提供令牌`)
    return res.status(401).json({
      code: 401,
      message: 'Missing authentication token'
    })
  }

  try {
    const userIdFromQuery = req.query.userId || req.body?.userId
    const parsedInt = parseInt(token)
    const userId = userIdFromQuery || (isNaN(parsedInt) ? token : parsedInt)

    req.user = { id: userId }
    req.token = token

    console.log(`[Auth] ✅ Token: "${token}", UserId: "${userId}" (类型: ${typeof userId}), 方法: ${req.method}, 路径: ${req.path}`)
    next()
  } catch (error) {
    console.error(`[Auth] ❌ 错误:`, error.message)
    return res.status(401).json({
      code: 401,
      message: 'Invalid token',
      error: error.message
    })
  }
}

// 获取用户在某篇文章的所有对话历史
router.get('/conversations', auth, async (req, res) => {
  try {
    const { postId } = req.query
    const userId = req.user?.id

    console.log(`[AI-History] GET conversations: postId=${postId}, userId=${userId}`)

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'postId 是必需的'
      })
    }

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '需要认证'
      })
    }

    // 直接使用 Sequelize ORM 查询
    const conversations = await AIConversation.findAll({
      where: {
        postId: String(postId),
        userId: String(userId),
        isActive: true
      },
      order: [['updatedAt', 'DESC']],
      limit: 50,
      attributes: ['id', 'title', 'messageCount', 'createdAt', 'updatedAt']
    })

    console.log(`[AI-History] 找到 ${conversations.length} 个对话`)

    // 转换为 snake_case 响应格式
    const data = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      message_count: conv.messageCount,
      created_at: conv.createdAt,
      updated_at: conv.updatedAt
    }))

    res.json({
      code: 200,
      data: data,
      message: '获取对话历史成功'
    })
  } catch (error) {
    console.error('[AI-History] 获取对话历史失败:', error.message)
    res.status(500).json({
      code: 500,
      message: '获取对话历史失败',
      error: error.message
    })
  }
})

// 获取某个对话的完整消息历史
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user?.id

    if (!conversationId) {
      return res.status(400).json({
        code: 400,
        message: 'conversationId 是必需的'
      })
    }

    // 验证用户权限
    const conv = await AIConversation.findByPk(conversationId)

    if (!conv || String(conv.userId) !== String(userId)) {
      return res.status(403).json({
        code: 403,
        message: '没有权限访问此对话'
      })
    }

    // 获取所有消息
    const messages = await AIMessage.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'role', 'content', 'createdAt']
    })

    console.log(`[AI-History] 加载对话 ${conversationId} 的消息：${messages.length} 条`)

    // 转换为 snake_case 响应格式
    const data = messages.map(msg => ({
      id: msg.id,
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      created_at: msg.createdAt
    }))

    res.json({
      code: 200,
      data: data,
      message: '获取对话消息成功'
    })
  } catch (error) {
    console.error('[AI-History] 获取对话消息失败:', error.message)
    res.status(500).json({
      code: 500,
      message: '获取对话消息失败',
      error: error.message
    })
  }
})

// 保存对话消息 (在每次 AI 回复后调用)
console.log('[AI-History] 📍 Registering POST /conversations/:conversationId/messages route')
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { role, content, postId } = req.body
    const userId = req.user?.id

    console.log(`\n[AI-History] ========== POST message START ==========`)
    console.log(`[AI-History] convId=${conversationId}, userId=${userId}, role=${role}, postId=${postId}`)

    if (!conversationId || !role || !content || !userId) {
      console.error(`[AI-History] ❌ 验证失败: convId=${conversationId}, role=${role}, userId=${userId}, hasContent=${!!content}`)
      return res.status(400).json({
        code: 400,
        message: 'conversationId、role、content 是必需的，userId 从认证令牌获取'
      })
    }

    if (!postId) {
      console.error(`[AI-History] ❌ 验证失败: postId 是必需的`)
      return res.status(400).json({
        code: 400,
        message: 'postId 是必需的'
      })
    }

    if (!['user', 'assistant'].includes(role)) {
      console.error(`[AI-History] ❌ 验证失败: role=${role} 不是有效值`)
      return res.status(400).json({
        code: 400,
        message: 'role 必须是 user 或 assistant'
      })
    }

    const titlePreview = content.substring(0, 100)

    // 确保对话记录存在
    console.log(`[AI-History] 📝 Step1: 创建或更新对话 ${conversationId}...`)
    const [conversation, created] = await AIConversation.findOrCreate({
      where: { id: conversationId },
      defaults: {
        postId: String(postId),
        userId: String(userId),
        title: titlePreview,
        messageCount: 0,
        isActive: true
      }
    })
    console.log(`[AI-History] ✅ Step1 完成: 对话 ${created ? '已创建' : '已存在'}, ID=${conversation.id}`)
    console.log(`[AI-History]    对话数据: postId=${conversation.postId}, userId=${conversation.userId}, title=${conversation.title}, isActive=${conversation.isActive}`)

    if (!created && conversation.title === 'Untitled') {
      console.log(`[AI-History] 📝 Step1.5: 更新对话标题...`)
      await conversation.update({ title: titlePreview })
      console.log(`[AI-History] ✅ Step1.5 完成: 标题已更新`)
    }

    // 保存消息
    console.log(`[AI-History] 📝 Step2: 保存消息 (role=${role})...`)
    const message = await AIMessage.create({
      conversationId,
      role,
      content
    })
    console.log(`[AI-History] ✅ Step2 完成: 消息已创建, ID=${message.id}`)

    // 更新消息计数
    console.log(`[AI-History] 📝 Step3: 计算消息总数...`)
    const count = await AIMessage.count({ where: { conversationId } })
    console.log(`[AI-History] ✅ Step3 完成: 共有 ${count} 条消息`)

    console.log(`[AI-History] 📝 Step4: 更新对话的消息计数...`)
    await conversation.update({ messageCount: count })
    console.log(`[AI-History] ✅ Step4 完成: messageCount 已更新为 ${count}`)

    // 验证数据确实被保存了
    console.log(`[AI-History] 📝 Step5: 验证数据已保存到数据库...`)
    const savedConv = await AIConversation.findByPk(conversationId)
    const savedMessages = await AIMessage.findAll({ where: { conversationId } })
    console.log(`[AI-History] ✅ Step5 完成: 验证成功`)
    console.log(`[AI-History]    数据库中对话: ${savedConv ? '存在✅' : '不存在❌'}, ID=${savedConv?.id}`)
    console.log(`[AI-History]    数据库中消息: ${savedMessages.length} 条`)

    console.log(`[AI-History] ========== POST message SUCCESS ==========\n`)

    res.json({
      code: 200,
      message: '消息已保存',
      data: {
        conversationId,
        messageCount: count,
        _source: 'ai-history-route-verified'
      }
    })
  } catch (error) {
    console.error(`\n[AI-History] ========== POST message ERROR ==========`)
    console.error(`[AI-History] ❌ 保存消息失败: ${error.message}`)
    console.error(`[AI-History] 详细错误:`)
    console.error(error.stack)
    console.error(`[AI-History] ========== ERROR END ==========\n`)

    res.status(500).json({
      code: 500,
      message: '保存消息失败',
      error: error.message
    })
  }
})

// 删除对话（软删除）
router.delete('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user?.id

    if (!conversationId) {
      return res.status(400).json({
        code: 400,
        message: 'conversationId 是必需的'
      })
    }

    // 验证权限
    const conv = await AIConversation.findByPk(conversationId)

    if (!conv || String(conv.userId) !== String(userId)) {
      return res.status(403).json({
        code: 403,
        message: '没有权限删除此对话'
      })
    }

    // 软删除
    await conv.update({ isActive: false })

    console.log(`[AI-History] 删除对话 - ID: ${conversationId}, 用户: ${userId}`)

    res.json({
      code: 200,
      message: '对话已删除'
    })
  } catch (error) {
    console.error('[AI-History] 删除对话失败:', error.message)
    res.status(500).json({
      code: 500,
      message: '删除对话失败',
      error: error.message
    })
  }
})

// 获取对话统计信息
router.get('/conversations/:conversationId/stats', auth, async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user?.id

    // 验证权限
    const conv = await AIConversation.findByPk(conversationId)

    if (!conv || String(conv.userId) !== String(userId)) {
      return res.status(403).json({
        code: 403,
        message: '没有权限访问此对话'
      })
    }

    // 统计消息
    const userMessageCount = await AIMessage.count({
      where: { conversationId, role: 'user' }
    })

    const assistantMessageCount = await AIMessage.count({
      where: { conversationId, role: 'assistant' }
    })

    const stats = {
      conversationId,
      totalMessages: conv.messageCount,
      userMessages: userMessageCount,
      assistantMessages: assistantMessageCount,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      title: conv.title
    }

    res.json({
      code: 200,
      data: stats,
      message: '获取对话统计成功'
    })
  } catch (error) {
    console.error('[AI-History] 获取对话统计失败:', error.message)
    res.status(500).json({
      code: 500,
      message: '获取对话统计失败',
      error: error.message
    })
  }
})

module.exports = router
