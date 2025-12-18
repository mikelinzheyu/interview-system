/**
 * 私信 API 调用层
 */

import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

// 使用当前登录用户的 ID（从 localStorage 或 store 获取）
const getCurrentUserId = () => {
  // 这里需要从你的认证系统获取当前用户 ID
  // 临时使用 localStorage
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return user.id
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e)
    }
  }
  return '1' // 默认值
}

const messagingAPI = {
  /**
   * 获取对话列表
   */
  getConversations(page = 1, limit = 20) {
    return axios.get(`${baseURL}/messages/conversations`, {
      params: { page, limit },
      headers: {
        'x-user-id': getCurrentUserId()
      }
    })
  },

  /**
   * 获取或创建对话
   */
  getOrCreateConversation(otherUserId) {
    return axios.post(`${baseURL}/messages/conversations`, {
      otherUserId
    }, {
      headers: {
        'x-user-id': getCurrentUserId()
      }
    })
  },

  /**
   * 获取对话详情和消息
   */
  getConversation(conversationId, page = 1, limit = 50) {
    return axios.get(`${baseURL}/messages/conversations/${conversationId}`, {
      params: { page, limit },
      headers: {
        'x-user-id': getCurrentUserId()
      }
    })
  },

  /**
   * 获取对话中的消息
   */
  getMessages(conversationId, page = 1, limit = 50) {
    return axios.get(`${baseURL}/messages/conversations/${conversationId}/messages`, {
      params: { page, limit },
      headers: {
        'x-user-id': getCurrentUserId()
      }
    })
  },

  /**
   * 发送私信
   */
  sendMessage(conversationId, { content, type = 'text' }) {
    return axios.post(
      `${baseURL}/messages/conversations/${conversationId}/messages`,
      { content, type },
      {
        headers: {
          'x-user-id': getCurrentUserId()
        }
      }
    )
  },

  /**
   * 标记消息已读
   */
  markAsRead(messageId) {
    return axios.post(
      `${baseURL}/messages/${messageId}/read`,
      {},
      {
        headers: {
          'x-user-id': getCurrentUserId()
        }
      }
    )
  },

  /**
   * 标记对话中的所有消息已读
   */
  markConversationAsRead(conversationId) {
    return axios.post(
      `${baseURL}/messages/conversations/${conversationId}/read`,
      {},
      {
        headers: {
          'x-user-id': getCurrentUserId()
        }
      }
    )
  },

  /**
   * 搜索消息
   */
  searchMessages(conversationId, keyword) {
    return axios.get(
      `${baseURL}/messages/conversations/${conversationId}/search`,
      {
        params: { keyword },
        headers: {
          'x-user-id': getCurrentUserId()
        }
      }
    )
  },

  /**
   * 清空对话记录
   */
  clearConversation(conversationId) {
    return axios.delete(
      `${baseURL}/messages/conversations/${conversationId}/clear`,
      {
        headers: {
          'x-user-id': getCurrentUserId()
        }
      }
    )
  },

  /**
   * 删除对话
   */
  deleteConversation(conversationId) {
    return axios.delete(
      `${baseURL}/messages/conversations/${conversationId}`,
      {
        headers: {
          'x-user-id': getCurrentUserId()
        }
      }
    )
  },

  /**
   * 获取用户信息
   */
  getUserInfo(userId) {
    return axios.get(`${baseURL}/users/${userId}`, {
      headers: {
        'x-user-id': getCurrentUserId()
      }
    })
  },

  /**
   * 创建新对话并发送第一条消息
   */
  createConversation({ recipientId, content, type = 'text' }) {
    return axios.post(
      `${baseURL}/messages/conversations/create`,
      { recipientId, content, type },
      {
        headers: {
          'x-user-id': getCurrentUserId()
        }
      }
    )
  }
}

export default messagingAPI
