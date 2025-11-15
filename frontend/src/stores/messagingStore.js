/**
 * 私信状态管理 Store
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import messagingAPI from '@/api/messagingAPI'
import { useUserStore } from './user'

export const useMessagingStore = defineStore('messaging', () => {
  // ==================== 状态 ====================

  const conversations = ref([])                // 对话列表
  const currentConversation = ref(null)        // 当前对话
  const messages = ref([])                     // 当前聊天消息
  const loading = ref(false)                   // 加载状态
  const sendingMessage = ref(null)             // 正在发送的消息ID
  const error = ref(null)                      // 错误信息
  const unreadCount = ref(0)                   // 总未读数

  // ==================== 计算属性 ====================

  const hasUnreadMessages = computed(() => unreadCount.value > 0)

  const totalUnreadCount = computed(() => {
    return conversations.value.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
  })

  // ==================== 方法 ====================

  /**
   * 获取对话列表
   */
  const fetchConversations = async (page = 1, limit = 20) => {
    loading.value = true
    error.value = null
    try {
      const response = await messagingAPI.getConversations(page, limit)
      conversations.value = response.data.data || []
      unreadCount.value = totalUnreadCount.value
      return response.data
    } catch (err) {
      error.value = err.message || '获取对话列表失败'
      console.error('[MessagingStore] fetchConversations error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 打开或创建对话
   */
  const openConversation = async (otherUserId) => {
    loading.value = true
    error.value = null
    try {
      // 首先创建或获取对话
      const convResponse = await messagingAPI.getOrCreateConversation(otherUserId)
      const conversation = convResponse.data.data

      // 然后获取对话详情和消息
      const detailResponse = await messagingAPI.getConversation(conversation.id)
      const detailData = detailResponse.data.data

      currentConversation.value = detailData.conversation
      messages.value = detailData.messages || []

      // 更新对话列表中的该对话
      const index = conversations.value.findIndex(c => c.id === conversation.id)
      if (index !== -1) {
        conversations.value[index] = {
          ...conversations.value[index],
          ...detailData.conversation,
          unreadCount: 0
        }
      } else {
        conversations.value.unshift({
          ...detailData.conversation,
          unreadCount: 0
        })
      }

      // 标记为已读
      await messagingAPI.markConversationAsRead(conversation.id)

      return detailData
    } catch (err) {
      error.value = err.message || '打开对话失败'
      console.error('[MessagingStore] openConversation error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 发送消息
   */
  const sendMessage = async (content) => {
    if (!currentConversation.value) {
      error.value = '没有选择对话'
      return
    }

    if (!content || !content.trim()) {
      error.value = '消息内容不能为空'
      return
    }

    if (content.length > 500) {
      error.value = '消息长度不能超过 500 字符'
      return
    }

    const userStore = useUserStore()
    const currentUserId = userStore.user?.id

    // 创建本地消息（乐观更新）
    const localMessage = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      senderId: currentUserId,
      status: 'sending',
      createdAt: new Date(),
      senderAvatar: userStore.user?.avatar
    }

    messages.value.push(localMessage)
    sendingMessage.value = localMessage.id

    try {
      const response = await messagingAPI.sendMessage(currentConversation.value.id, {
        content: content.trim(),
        type: 'text'
      })

      // 用服务器返回的消息替换本地消息
      const serverMessage = response.data.data
      const index = messages.value.findIndex(m => m.id === localMessage.id)
      if (index !== -1) {
        messages.value[index] = serverMessage
      } else {
        messages.value.push(serverMessage)
      }

      // 更新对话的最后消息
      if (currentConversation.value) {
        currentConversation.value.lastMessage = content.substring(0, 50)
        currentConversation.value.lastMessageTime = new Date()

        // 更新对话列表
        const convIndex = conversations.value.findIndex(c => c.id === currentConversation.value.id)
        if (convIndex !== -1) {
          conversations.value[convIndex] = {
            ...conversations.value[convIndex],
            ...currentConversation.value
          }
        }
      }

      return serverMessage
    } catch (err) {
      // 标记为发送失败
      const message = messages.value.find(m => m.id === localMessage.id)
      if (message) {
        message.status = 'failed'
      }
      error.value = err.message || '发送失败'
      console.error('[MessagingStore] sendMessage error:', err)
      throw err
    } finally {
      sendingMessage.value = null
    }
  }

  /**
   * 添加来自 WebSocket 的消息
   */
  const addMessageFromSocket = (message) => {
    if (currentConversation.value?.id === message.conversationId) {
      // 检查消息是否已存在（避免重复）
      if (!messages.value.find(m => m.id === message.id)) {
        messages.value.push(message)
      }
    }

    // 更新对话列表中的未读数
    const conv = conversations.value.find(c => c.id === message.conversationId)
    if (conv) {
      conv.lastMessage = message.content
      conv.lastMessageTime = message.createdAt

      // 如果不是当前对话的消息，增加未读数
      if (message.conversationId !== currentConversation.value?.id) {
        conv.unreadCount = (conv.unreadCount || 0) + 1
      }
    }
  }

  /**
   * 标记消息已读
   */
  const markAsRead = async (messageId) => {
    try {
      const message = messages.value.find(m => m.id === messageId)
      if (message && message.status !== 'read') {
        message.status = 'read'
        await messagingAPI.markAsRead(messageId)
      }
    } catch (err) {
      console.error('[MessagingStore] markAsRead error:', err)
    }
  }

  /**
   * 标记对话中的所有消息已读
   */
  const markConversationAsRead = async () => {
    if (!currentConversation.value) return

    try {
      await messagingAPI.markConversationAsRead(currentConversation.value.id)

      // 更新本地状态
      messages.value.forEach(msg => {
        if (msg.status !== 'read') {
          msg.status = 'read'
        }
      })

      // 更新对话的未读数
      if (currentConversation.value) {
        currentConversation.value.unreadCount = 0
      }

      const index = conversations.value.findIndex(c => c.id === currentConversation.value.id)
      if (index !== -1) {
        conversations.value[index].unreadCount = 0
      }
    } catch (err) {
      console.error('[MessagingStore] markConversationAsRead error:', err)
    }
  }

  /**
   * 清空对话记录
   */
  const clearConversation = async () => {
    if (!currentConversation.value) return

    try {
      await messagingAPI.clearConversation(currentConversation.value.id)
      messages.value = []
      currentConversation.value.lastMessage = null
      currentConversation.value.lastMessageTime = null
    } catch (err) {
      error.value = err.message || '清空对话失败'
      console.error('[MessagingStore] clearConversation error:', err)
      throw err
    }
  }

  /**
   * 删除对话
   */
  const deleteConversation = async (conversationId) => {
    try {
      await messagingAPI.deleteConversation(conversationId)

      // 从列表中移除
      const index = conversations.value.findIndex(c => c.id === conversationId)
      if (index !== -1) {
        conversations.value.splice(index, 1)
      }

      // 如果是当前对话，清空
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value = null
        messages.value = []
      }

      return true
    } catch (err) {
      error.value = err.message || '删除对话失败'
      console.error('[MessagingStore] deleteConversation error:', err)
      throw err
    }
  }

  /**
   * 搜索消息
   */
  const searchMessages = async (keyword) => {
    if (!currentConversation.value) return []

    try {
      const response = await messagingAPI.searchMessages(currentConversation.value.id, keyword)
      return response.data.data || []
    } catch (err) {
      console.error('[MessagingStore] searchMessages error:', err)
      return []
    }
  }

  /**
   * 关闭对话
   */
  const closeConversation = () => {
    currentConversation.value = null
    messages.value = []
    error.value = null
  }

  /**
   * 重置错误状态
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    conversations,
    currentConversation,
    messages,
    loading,
    sendingMessage,
    error,
    unreadCount,

    // 计算属性
    hasUnreadMessages,
    totalUnreadCount,

    // 方法
    fetchConversations,
    openConversation,
    sendMessage,
    addMessageFromSocket,
    markAsRead,
    markConversationAsRead,
    clearConversation,
    deleteConversation,
    searchMessages,
    closeConversation,
    clearError
  }
})
