/**
 * AI conversation history API service.
 */

import axios from 'axios'
import { buildApiUrl } from '@/utils/networkConfig'

const apiClient = axios.create({
  baseURL: buildApiUrl('/ai-history'),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[AI-History API] Request failed:', error.message)
    return Promise.reject(error)
  }
)

export const getConversations = (params) => apiClient.get('/conversations', { params })

export const getConversationMessages = (conversationId) =>
  apiClient.get(`/conversations/${conversationId}/messages`)

export const saveMessage = (conversationId, role, content, postId) =>
  apiClient.post(`/conversations/${conversationId}/messages`, {
    role,
    content,
    postId
  })

export const deleteConversation = (conversationId) =>
  apiClient.delete(`/conversations/${conversationId}`)

export const getConversationStats = (conversationId) =>
  apiClient.get(`/conversations/${conversationId}/stats`)

export default {
  getConversations,
  getConversationMessages,
  saveMessage,
  deleteConversation,
  getConversationStats
}
