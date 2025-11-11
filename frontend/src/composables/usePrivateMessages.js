/**
 * usePrivateMessages - 私信系统管理
 *
 * 功能：
 * - 获取会话列表
 * - 获取会话消息
 * - 发送私信
 * - 删除会话
 * - 标记为已读
 * - 搜索会话
 */

import { ref, computed, reactive, watch } from 'vue'
import communityAPI from '@/api/communityWithCache'
import { useDebounce } from './useDebounce'

export function usePrivateMessages() {
  // 会话数据
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref([])

  // 状态
  const loading = ref(false)
  const error = ref(null)
  const sending = ref(false)

  // 分页
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalMessages = ref(0)

  // 搜索
  const searchQuery = ref('')
  const filteredConversations = ref([])

  // 去抖动搜索
  const { useDebounce: debounceFn } = useDebounce()
  const debouncedSearch = debounceFn(async () => {
    await searchConversations()
  }, 300)

  /**
   * 获取会话列表
   */
  const fetchConversations = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.getConversations()
      if (response.data) {
        conversations.value = response.data
        filteredConversations.value = response.data
      }
    } catch (err) {
      error.value = err.message || '获取会话列表失败'
      console.error('Failed to fetch conversations:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索会话
   */
  const searchConversations = async () => {
    if (!searchQuery.value.trim()) {
      filteredConversations.value = conversations.value
      return
    }

    try {
      const response = await communityAPI.searchConversations(searchQuery.value)
      if (response.data) {
        filteredConversations.value = response.data
      }
    } catch (err) {
      console.error('Failed to search conversations:', err)
    }
  }

  /**
   * 监听搜索查询
   */
  watch(searchQuery, () => {
    debouncedSearch()
  })

  /**
   * 打开会话
   */
  const openConversation = async (conversationId) => {
    try {
      const response = await communityAPI.getConversation(conversationId)
      if (response.data) {
        currentConversation.value = response.data
        messages.value = response.data.messages || []
        totalMessages.value = response.data.total || 0
        currentPage.value = 1

        // 标记会话为已读
        await markConversationAsRead(conversationId)
      }
    } catch (err) {
      error.value = err.message || '打开会话失败'
      console.error('Failed to open conversation:', err)
    }
  }

  /**
   * 发送私信
   */
  const sendMessage = async (recipientId, content) => {
    if (!content.trim()) {
      error.value = '消息内容不能为空'
      return false
    }

    sending.value = true
    error.value = null

    try {
      const response = await communityAPI.sendPrivateMessage(recipientId, {
        content: content.trim()
      })

      if (response.data) {
        // 乐观更新：立即添加到消息列表
        const newMessage = {
          id: response.data.id,
          sender: response.data.sender,
          content: response.data.content,
          createdAt: new Date().toISOString(),
          read: true,
          isOwn: true
        }

        messages.value.push(newMessage)

        // 更新会话列表
        const conversationIndex = conversations.value.findIndex(
          c => c.id === response.data.conversationId
        )
        if (conversationIndex !== -1) {
          conversations.value[conversationIndex].lastMessage = content
          conversations.value[conversationIndex].lastMessageTime = newMessage.createdAt

          // 移到顶部
          const conversation = conversations.value.splice(conversationIndex, 1)[0]
          conversations.value.unshift(conversation)
        }

        return true
      }
    } catch (err) {
      error.value = err.message || '发送失败'
      console.error('Failed to send message:', err)
      return false
    } finally {
      sending.value = false
    }
  }

  /**
   * 加载更多消息
   */
  const loadMoreMessages = async (page) => {
    if (!currentConversation.value) return

    try {
      const response = await communityAPI.getConversationMessages(
        currentConversation.value.id,
        {
          page,
          pageSize: pageSize.value
        }
      )

      if (response.data) {
        // 往顶部插入消息（为了保持原有消息位置）
        messages.value.unshift(...response.data)
        currentPage.value = page
      }
    } catch (err) {
      console.error('Failed to load more messages:', err)
    }
  }

  /**
   * 标记会话为已读
   */
  const markConversationAsRead = async (conversationId) => {
    try {
      await communityAPI.markConversationAsRead(conversationId)

      // 更新本地状态
      const conversation = conversations.value.find(c => c.id === conversationId)
      if (conversation) {
        conversation.unreadCount = 0
      }
    } catch (err) {
      console.error('Failed to mark conversation as read:', err)
    }
  }

  /**
   * 删除会话
   */
  const deleteConversation = async (conversationId) => {
    try {
      await communityAPI.deleteConversation(conversationId)

      // 从列表中移除
      conversations.value = conversations.value.filter(c => c.id !== conversationId)
      filteredConversations.value = filteredConversations.value.filter(c => c.id !== conversationId)

      // 如果是当前会话，关闭
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value = null
        messages.value = []
      }

      return true
    } catch (err) {
      error.value = err.message || '删除失败'
      console.error('Failed to delete conversation:', err)
      return false
    }
  }

  /**
   * 创建新会话
   */
  const startConversation = async (userId) => {
    try {
      const response = await communityAPI.startConversation(userId)
      if (response.data) {
        const conversation = response.data
        currentConversation.value = conversation
        messages.value = []
        totalMessages.value = 0
        currentPage.value = 1

        // 添加到会话列表顶部
        conversations.value.unshift(conversation)
        filteredConversations.value.unshift(conversation)

        return conversation
      }
    } catch (err) {
      error.value = err.message || '创建会话失败'
      console.error('Failed to start conversation:', err)
      return null
    }
  }

  /**
   * 清空搜索
   */
  const clearSearch = () => {
    searchQuery.value = ''
    filteredConversations.value = conversations.value
  }

  /**
   * 计算属性：未读消息计数
   */
  const unreadCount = computed(() => {
    return conversations.value.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
  })

  /**
   * 初始化
   */
  const initialize = async () => {
    await fetchConversations()
  }

  return {
    // 数据
    conversations,
    currentConversation,
    messages,
    filteredConversations,
    loading,
    error,
    sending,
    currentPage,
    pageSize,
    totalMessages,
    searchQuery,
    unreadCount,

    // 方法
    fetchConversations,
    searchConversations,
    openConversation,
    sendMessage,
    loadMoreMessages,
    markConversationAsRead,
    deleteConversation,
    startConversation,
    clearSearch,
    initialize
  }
}
