/**
 * 私信控制器 - 处理用户之间的一对一消息通信
 */

class PrivateMessageController {
  constructor(mockData) {
    this.mockData = mockData

    // 初始化数据结构
    if (!mockData.conversations) {
      mockData.conversations = []
    }
    if (!mockData.privateMessages) {
      mockData.privateMessages = []
    }
    if (!mockData.conversationIdCounter === undefined) {
      mockData.conversationIdCounter = 1
    }
    if (!mockData.privateMessageIdCounter === undefined) {
      mockData.privateMessageIdCounter = 1
    }
  }

  /**
   * 获取用户的所有对话
   */
  getConversations(userId, page = 1, limit = 20) {
    const conversations = this.mockData.conversations.filter(conv =>
      conv.participantIds.includes(userId)
    )

    // 按最后消息时间排序
    conversations.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
      return timeB - timeA
    })

    // 分页
    const start = (page - 1) * limit
    const paginatedConversations = conversations.slice(start, start + limit)

    // 为每个对话添加另一个参与者的信息
    const enrichedConversations = paginatedConversations.map(conv => {
      const otherUserId = conv.participantIds.find(id => id !== userId)
      const otherUser = this.mockData.users?.find(u => u.id === otherUserId)

      return {
        ...conv,
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          isOnline: otherUser.isOnline || false
        } : null,
        unreadCount: conv.unreadCount?.[userId] || 0
      }
    })

    return {
      code: 200,
      data: enrichedConversations,
      total: conversations.length,
      page,
      limit,
      hasMore: start + limit < conversations.length
    }
  }

  /**
   * 获取或创建对话
   */
  getOrCreateConversation(userId, otherUserId) {
    if (userId === otherUserId) {
      return {
        code: 400,
        message: '不能与自己进行对话'
      }
    }

    // 查找现有对话
    let conversation = this.mockData.conversations.find(conv => {
      const participants = conv.participantIds
      return (
        (participants.includes(userId) && participants.includes(otherUserId))
      )
    })

    // 如果不存在，创建新对话
    if (!conversation) {
      conversation = {
        id: `conv-${this.mockData.conversationIdCounter++}`,
        participantIds: [userId, otherUserId],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: {}
      }
      this.mockData.conversations.push(conversation)
    }

    // 获取另一个参与者的信息
    const otherUser = this.mockData.users?.find(u => u.id === otherUserId)

    return {
      code: 200,
      data: {
        ...conversation,
        otherUser: otherUser ? {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          isOnline: otherUser.isOnline || false
        } : null,
        unreadCount: conversation.unreadCount?.[userId] || 0
      }
    }
  }

  /**
   * 获取对话中的消息
   */
  getMessages(conversationId, page = 1, limit = 50) {
    const messages = this.mockData.privateMessages.filter(msg =>
      msg.conversationId === conversationId
    )

    // 按创建时间排序（从旧到新）
    messages.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    // 分页（从末尾开始）
    const start = Math.max(0, messages.length - page * limit)
    const paginatedMessages = messages.slice(start, start + limit)

    return {
      code: 200,
      data: paginatedMessages,
      total: messages.length,
      page,
      limit,
      hasMore: start > 0
    }
  }

  /**
   * 发送私信
   */
  sendMessage(conversationId, senderId, content, type = 'text') {
    // 验证消息内容
    if (!content || !content.trim()) {
      return {
        code: 400,
        message: '消息内容不能为空'
      }
    }

    if (content.length > 500) {
      return {
        code: 400,
        message: '消息长度不能超过 500 字符'
      }
    }

    // 查找对话
    const conversation = this.mockData.conversations.find(c => c.id === conversationId)
    if (!conversation) {
      return {
        code: 404,
        message: '对话不存在'
      }
    }

    // 验证发送者是对话的参与者
    if (!conversation.participantIds.includes(senderId)) {
      return {
        code: 403,
        message: '你没有权限在此对话中发送消息'
      }
    }

    // 创建消息
    const message = {
      id: `msg-${this.mockData.privateMessageIdCounter++}`,
      conversationId,
      senderId,
      content: content.trim(),
      type,
      status: 'sent',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.mockData.privateMessages.push(message)

    // 更新对话
    conversation.lastMessage = content.substring(0, 50)
    conversation.lastMessageTime = new Date()
    conversation.updatedAt = new Date()

    // 为接收者标记未读
    const receiverId = conversation.participantIds.find(id => id !== senderId)
    if (!conversation.unreadCount) {
      conversation.unreadCount = {}
    }
    if (!conversation.unreadCount[receiverId]) {
      conversation.unreadCount[receiverId] = 0
    }
    conversation.unreadCount[receiverId]++

    return {
      code: 200,
      data: message,
      message: '消息发送成功'
    }
  }

  /**
   * 标记消息已读
   */
  markAsRead(messageId, userId) {
    const message = this.mockData.privateMessages.find(m => m.id === messageId)
    if (!message) {
      return {
        code: 404,
        message: '消息不存在'
      }
    }

    message.status = 'read'
    message.readBy = userId
    message.readAt = new Date()

    return {
      code: 200,
      data: message,
      message: '消息已标记为已读'
    }
  }

  /**
   * 标记对话中的所有消息为已读
   */
  markConversationAsRead(conversationId, userId) {
    const conversation = this.mockData.conversations.find(c => c.id === conversationId)
    if (!conversation) {
      return {
        code: 404,
        message: '对话不存在'
      }
    }

    // 标记所有未读消息为已读
    const messages = this.mockData.privateMessages.filter(msg =>
      msg.conversationId === conversationId &&
      msg.senderId !== userId &&
      msg.status !== 'read'
    )

    messages.forEach(msg => {
      msg.status = 'read'
      msg.readBy = userId
      msg.readAt = new Date()
    })

    // 重置未读计数
    if (!conversation.unreadCount) {
      conversation.unreadCount = {}
    }
    conversation.unreadCount[userId] = 0

    return {
      code: 200,
      data: {
        conversationId,
        markedCount: messages.length
      },
      message: `已标记 ${messages.length} 条消息为已读`
    }
  }

  /**
   * 删除对话
   */
  deleteConversation(conversationId, userId) {
    const conversationIndex = this.mockData.conversations.findIndex(c => c.id === conversationId)
    if (conversationIndex === -1) {
      return {
        code: 404,
        message: '对话不存在'
      }
    }

    const conversation = this.mockData.conversations[conversationIndex]
    if (!conversation.participantIds.includes(userId)) {
      return {
        code: 403,
        message: '你没有权限删除此对话'
      }
    }

    // 删除对话
    this.mockData.conversations.splice(conversationIndex, 1)

    // 删除相关消息
    this.mockData.privateMessages = this.mockData.privateMessages.filter(
      msg => msg.conversationId !== conversationId
    )

    return {
      code: 200,
      message: '对话已删除'
    }
  }

  /**
   * 清空对话中的消息记录
   */
  clearConversationMessages(conversationId, userId) {
    const conversation = this.mockData.conversations.find(c => c.id === conversationId)
    if (!conversation) {
      return {
        code: 404,
        message: '对话不存在'
      }
    }

    if (!conversation.participantIds.includes(userId)) {
      return {
        code: 403,
        message: '你没有权限清空此对话'
      }
    }

    // 删除消息
    const deletedCount = this.mockData.privateMessages.filter(
      msg => msg.conversationId === conversationId
    ).length

    this.mockData.privateMessages = this.mockData.privateMessages.filter(
      msg => msg.conversationId !== conversationId
    )

    // 重置对话
    conversation.lastMessage = null
    conversation.lastMessageTime = null
    conversation.unreadCount = {}

    return {
      code: 200,
      data: {
        conversationId,
        clearedCount: deletedCount
      },
      message: `已清空 ${deletedCount} 条消息`
    }
  }

  /**
   * 搜索对话中的消息
   */
  searchMessages(conversationId, keyword, userId) {
    const conversation = this.mockData.conversations.find(c => c.id === conversationId)
    if (!conversation) {
      return {
        code: 404,
        message: '对话不存在'
      }
    }

    if (!conversation.participantIds.includes(userId)) {
      return {
        code: 403,
        message: '你没有权限查看此对话'
      }
    }

    const results = this.mockData.privateMessages.filter(msg =>
      msg.conversationId === conversationId &&
      msg.content.toLowerCase().includes(keyword.toLowerCase())
    )

    return {
      code: 200,
      data: results,
      total: results.length,
      keyword
    }
  }
}

module.exports = PrivateMessageController
