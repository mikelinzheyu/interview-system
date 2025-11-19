/**
 * Sequelize 数据库服务层
 * 使用真实 MySQL 数据库替代内存存储
 */

const { AIConversation, AIMessage } = require('../models')
const { Op } = require('sequelize')

/**
 * 创建或更新对话
 */
async function saveConversation(conversationId, postId, userId, title) {
  try {
    console.log(`[DB] 📝 保存对话:`)
    console.log(`     - convId: ${conversationId}`)
    console.log(`     - postId: ${postId}`)
    console.log(`     - userId: ${userId}`)
    console.log(`     - title: ${title}`)

    // 使用 Sequelize 的 findOrCreate 而不是依赖 ON DUPLICATE KEY
    const [conversation, created] = await AIConversation.findOrCreate({
      where: { id: conversationId },
      defaults: {
        postId: String(postId),  // 确保是字符串
        userId: String(userId),  // 确保是字符串
        title: title || 'Untitled',
        messageCount: 0,
        isActive: true  // 显式设置为 true
      }
    })

    if (!created) {
      // 更新现有对话的标题（如果提供了新标题）
      if (title && title !== conversation.title) {
        await conversation.update({ title })
      }
      console.log(`[DB] ✅ 更新了现有对话`)
    } else {
      console.log(`[DB] ✅ 创建了新对话`)
    }

    // 验证数据已保存
    const saved = await AIConversation.findByPk(conversationId)
    if (saved) {
      console.log(`[DB] ✅ 验证: 对话已保存到数据库`)
      console.log(`     - postId: ${saved.postId}, userId: ${saved.userId}, isActive: ${saved.isActive}`)
    } else {
      console.log(`[DB] ❌ 验证失败: 对话未在数据库中找到`)
    }

    return { affectedRows: 1 }
  } catch (error) {
    console.error(`[DB] ❌ 保存对话失败:`, error.message)
    console.error(error.stack)
    throw error
  }
}

/**
 * 保存消息
 */
async function saveMessage(conversationId, role, content, metadata = null) {
  try {
    console.log(`[DB] 📝 保存消息:`)
    console.log(`     - conversationId: ${conversationId}`)
    console.log(`     - role: ${role}`)
    console.log(`     - content: ${content.substring(0, 50)}...`)

    // 首先检查对话是否存在
    const conversation = await AIConversation.findByPk(conversationId)
    if (!conversation) {
      console.error(`[DB] ❌ 对话不存在: ${conversationId}`)
      throw new Error(`Conversation ${conversationId} not found`)
    }
    console.log(`[DB] ✅ 确认对话存在`)

    // 创建消息
    const message = await AIMessage.create({
      conversationId,
      role,
      content,
      metadata
    })

    console.log(`[DB] ✅ 消息已创建 (ID: ${message.id})`)

    // 更新对话的消息计数
    await conversation.increment('messageCount')
    console.log(`[DB] ✅ 对话消息计数已更新`)

    // 验证消息已保存
    const saved = await AIMessage.findByPk(message.id)
    if (saved) {
      console.log(`[DB] ✅ 验证: 消息已保存到数据库`)
    } else {
      console.log(`[DB] ❌ 验证失败: 消息未在数据库中找到`)
    }

    return { affectedRows: 1 }
  } catch (error) {
    console.error(`[DB] ❌ 保存消息失败:`, error.message)
    console.error(error.stack)
    throw error
  }
}

/**
 * 获取对话列表
 */
async function getConversations(postId, userId) {
  try {
    console.log(`[DB] 🔍 查询对话列表:`)
    console.log(`     - postId: ${postId}`)
    console.log(`     - userId: ${userId}`)

    const conversations = await AIConversation.findAll({
      where: {
        postId,
        userId,
        isActive: true
      },
      order: [['updatedAt', 'DESC']],
      include: {
        model: AIMessage,
        as: 'messages',
        attributes: ['id', 'role', 'content', 'createdAt']
      }
    })

    console.log(`[DB] ✅ 找到 ${conversations.length} 个对话`)

    // 规范化为snake_case以兼容旧API
    return conversations.map(conv => ({
      id: conv.id,
      post_id: conv.postId,
      user_id: conv.userId,
      title: conv.title,
      message_count: conv.messageCount,
      created_at: conv.createdAt,
      updated_at: conv.updatedAt,
      is_active: conv.isActive
    }))
  } catch (error) {
    console.error(`[DB] ❌ 查询对话列表失败:`, error.message)
    throw error
  }
}

/**
 * 获取单个对话
 */
async function getConversation(conversationId) {
  try {
    const conversation = await AIConversation.findByPk(conversationId, {
      include: {
        model: AIMessage,
        as: 'messages',
        order: [['createdAt', 'ASC']]
      }
    })

    if (!conversation) return []

    // 规范化为snake_case以兼容旧API
    return [{
      id: conversation.id,
      post_id: conversation.postId,
      user_id: conversation.userId,
      title: conversation.title,
      message_count: conversation.messageCount,
      created_at: conversation.createdAt,
      updated_at: conversation.updatedAt,
      is_active: conversation.isActive,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversationId,
        role: msg.role,
        content: msg.content,
        created_at: msg.createdAt
      }))
    }]
  } catch (error) {
    console.error(`[DB] ❌ 查询对话失败:`, error.message)
    throw error
  }
}

/**
 * 获取消息列表
 */
async function getMessages(conversationId) {
  try {
    console.log(`[DB] 🔍 查询消息列表: conversationId=${conversationId}`)

    const messages = await AIMessage.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']]
    })

    console.log(`[DB] ✅ 找到 ${messages.length} 条消息`)

    // 规范化为snake_case以兼容旧API
    return messages.map(msg => ({
      id: msg.id,
      conversation_id: msg.conversationId,
      role: msg.role,
      content: msg.content,
      created_at: msg.createdAt
    }))
  } catch (error) {
    console.error(`[DB] ❌ 查询消息列表失败:`, error.message)
    throw error
  }
}

/**
 * 获取消息计数
 */
async function getMessageCount(conversationId, role = null) {
  try {
    const where = { conversationId }
    if (role) {
      where.role = role
    }

    const count = await AIMessage.count({ where })
    return [{ count }]
  } catch (error) {
    console.error(`[DB] ❌ 获取消息计数失败:`, error.message)
    throw error
  }
}

/**
 * 删除对话（软删除）
 */
async function deleteConversation(conversationId) {
  try {
    console.log(`[DB] 🗑️ 删除对话: ${conversationId}`)

    await AIConversation.update(
      { isActive: false },
      { where: { id: conversationId } }
    )

    console.log(`[DB] ✅ 对话已删除`)
    return { affectedRows: 1 }
  } catch (error) {
    console.error(`[DB] ❌ 删除对话失败:`, error.message)
    throw error
  }
}

/**
 * 兼容旧 API 的查询方法
 */
async function query(sql, params = []) {
  // 最关键的日志 - 记录到文件和控制台
  const timestamp = new Date().toISOString()
  const shortSql = sql.substring(0, 100).replace(/\n/g, ' ')
  console.log(`\n[${timestamp}] [Database Query] ⚡⚡⚡ ENTRY CALLED ⚡⚡⚡`)
  console.log(`  SQL (200 chars): ${sql.substring(0, 200).replace(/\n/g, ' ')}`)
  console.log(`  Params: ${JSON.stringify(params)}`)
  console.log(`  Checks: INSERT_CONV=${sql.includes('INSERT INTO ai_conversations')} | DUPLICATE=${sql.includes('ON DUPLICATE KEY UPDATE')} | INSERT_MSG=${sql.includes('INSERT INTO ai_conversation_messages')} | COUNT=${sql.includes('COUNT')}`)

  try {
    console.log(`[Database Query] Matching patterns...`)

    // INSERT INTO ai_conversations
    if (sql.includes('INSERT INTO ai_conversations') && sql.includes('ON DUPLICATE KEY UPDATE')) {
      console.log(`[Database Query] ✓ MATCHED: INSERT INTO ai_conversations`)
      console.log(`  Calling saveConversation with ${params.length} params`)
      const result = await saveConversation(...params)
      console.log(`[Database Query] saveConversation returned:`, result)
      return result
    }

    // INSERT INTO ai_conversation_messages
    if (sql.includes('INSERT INTO ai_conversation_messages')) {
      console.log(`[Database Query] ✓ MATCHED: INSERT INTO ai_conversation_messages`)
      console.log(`  Calling saveMessage with ${params.length} params`)
      const result = await saveMessage(...params)
      console.log(`[Database Query] saveMessage returned:`, result)
      return result
    }

    // UPDATE ai_conversations SET message_count
    if (sql.includes('UPDATE ai_conversations SET message_count')) {
      console.log(`[Database Query] ✓ MATCHED: UPDATE message_count`)
      const [messageCount, conversationId] = params
      const result = await AIConversation.update(
        { messageCount },
        { where: { id: conversationId } }
      )
      console.log(`[Database Query] Message count updated:`, result)
      return { affectedRows: 1 }
    }

    // SELECT FROM ai_conversations BY ID
    if (sql.includes('SELECT') && sql.includes('FROM ai_conversations') && sql.includes('WHERE id')) {
      console.log(`[Database Query] ✓ MATCHED: SELECT ai_conversations BY ID`)
      const [conversationId] = params
      const result = await getConversation(conversationId)
      console.log(`[Database Query] Found ${result.length} conversations`)
      return result
    }

    // SELECT FROM ai_conversations BY post_id
    if (sql.includes('SELECT') && sql.includes('FROM ai_conversations') && sql.includes('WHERE post_id')) {
      console.log(`[Database Query] ✓ MATCHED: SELECT ai_conversations BY post_id`)
      const [postId, userId] = params
      console.log(`  Querying: postId=${postId}, userId=${userId}`)
      const result = await getConversations(postId, userId)
      console.log(`[Database Query] Found ${result.length} conversations`)
      return result
    }

    // SELECT FROM ai_conversation_messages
    if (sql.includes('SELECT') && sql.includes('FROM ai_conversation_messages')) {
      console.log(`[Database Query] ✓ MATCHED: SELECT ai_conversation_messages`)
      const [conversationId] = params
      if (sql.includes('COUNT')) {
        const result = await getMessageCount(conversationId)
        console.log(`[Database Query] Message count:`, result)
        return result
      }
      const result = await getMessages(conversationId)
      console.log(`[Database Query] Found ${result.length} messages`)
      return result
    }

    // UPDATE ai_conversations SET is_active = false
    if (sql.includes('UPDATE ai_conversations SET is_active = false')) {
      console.log(`[Database Query] ✓ MATCHED: DELETE (soft delete) conversation`)
      const [conversationId] = params
      const result = await deleteConversation(conversationId)
      console.log(`[Database Query] Delete returned:`, result)
      return result
    }

    // No pattern matched - this is bad
    console.warn(`\n[Database Query] ⚠️ ⚠️ ⚠️ UNHANDLED SQL PATTERN ⚠️ ⚠️ ⚠️`)
    console.warn(`  Full SQL: ${sql}`)
    console.warn(`  Params: ${JSON.stringify(params)}`)
    return []
  } catch (error) {
    console.error(`\n[Database Query] ❌ ERROR AT ENTRY POINT`)
    console.error(`  Message: ${error.message}`)
    console.error(`  Stack: ${error.stack}`)
    throw error
  }
}

module.exports = {
  query,
  saveConversation,
  saveMessage,
  getConversations,
  getConversation,
  getMessages,
  getMessageCount,
  deleteConversation
}
