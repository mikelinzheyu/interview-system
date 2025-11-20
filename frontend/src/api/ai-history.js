/**
 * AI 对话历史 API 服务层
 * 处理与后端 AI 历史相关的所有 HTTP 请求
 */

import axios from 'axios'

// 在开发环境使用相对路径，生产环境使用完整 URL
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    // 开发环境：使用相对路径，让 Vite 代理处理
    return ''
  }
  // 生产环境：使用完整 URL
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
}

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: `${getBaseURL()}/api/ai-history`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(
  (config) => {
    // 尝试多个可能的token存储位置
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('[AI-History] 添加认证令牌')
    } else {
      console.warn('[AI-History] 未找到认证令牌 - authToken 和 token 都为空')
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[AI-History API] 请求失败:', error.message)
    return Promise.reject(error)
  }
)

/**
 * 获取用户在某篇文章的所有对话历史
 * @param {Object} params - 查询参数
 * @param {string} params.postId - 文章 ID
 * @returns {Promise<Object>} { code, data: [...conversations], message }
 */
export const getConversations = (params) => {
  return apiClient.get('/conversations', { params })
}

/**
 * 获取某个对话的完整消息历史
 * @param {string} conversationId - 对话 ID
 * @returns {Promise<Object>} { code, data: [...messages], message }
 */
export const getConversationMessages = (conversationId) => {
  return apiClient.get(`/conversations/${conversationId}/messages`)
}

/**
 * 保存对话消息
 * @param {string} conversationId - 对话 ID
 * @param {string} role - 消息角色 ('user' 或 'assistant')
 * @param {string} content - 消息内容
 * @param {string} postId - 文章 ID
 * @returns {Promise<Object>} { code, message, data }
 */
export const saveMessage = (conversationId, role, content, postId) => {
  return apiClient.post(`/conversations/${conversationId}/messages`, {
    role,
    content,
    postId
  })
}

/**
 * 删除对话（软删除）
 * @param {string} conversationId - 对话 ID
 * @returns {Promise<Object>} { code, message }
 */
export const deleteConversation = (conversationId) => {
  return apiClient.delete(`/conversations/${conversationId}`)
}

/**
 * 获取对话统计信息
 * @param {string} conversationId - 对话 ID
 * @returns {Promise<Object>} { code, data: {...stats}, message }
 */
export const getConversationStats = (conversationId) => {
  return apiClient.get(`/conversations/${conversationId}/stats`)
}

export default {
  getConversations,
  getConversationMessages,
  saveMessage,
  deleteConversation,
  getConversationStats
}
