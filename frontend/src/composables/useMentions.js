/**
 * useMentions - @ 提及系统管理
 *
 * 功能：
 * - 获取用户提及列表
 * - 搜索可提及的用户
 * - 处理提及通知
 * - 提及历史记录
 */

import { ref, computed, reactive } from 'vue'
import communityAPI from '@/api/communityWithCache'
import { useDebounce } from './useDebounce'

export function useMentions() {
  // 提及数据
  const mentionedUsers = ref([])
  const mentionHistory = ref([])
  const suggestedUsers = ref([])

  // 搜索状态
  const searchQuery = ref('')
  const loading = ref(false)
  const error = ref(null)

  // 去抖动搜索
  const { useDebounce: debounceFn } = useDebounce()
  const debouncedSearch = debounceFn(async () => {
    if (searchQuery.value.trim()) {
      await searchUsers()
    } else {
      suggestedUsers.value = []
    }
  }, 200)

  /**
   * 搜索可提及的用户
   */
  const searchUsers = async () => {
    if (!searchQuery.value.trim()) {
      suggestedUsers.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.searchMentionableUsers(searchQuery.value)
      if (response.data) {
        suggestedUsers.value = response.data
      }
    } catch (err) {
      error.value = err.message || '搜索用户失败'
      console.error('Failed to search users:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 监听搜索查询变化
   */
  watch(searchQuery, () => {
    debouncedSearch()
  })

  /**
   * 获取用户的被提及列表
   */
  const fetchMentionedUsers = async () => {
    try {
      const response = await communityAPI.getMentionedUsers()
      if (response.data) {
        mentionedUsers.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch mentioned users:', err)
    }
  }

  /**
   * 获取提及历史（当前用户提及过的人）
   */
  const fetchMentionHistory = async () => {
    try {
      const response = await communityAPI.getMentionHistory()
      if (response.data) {
        mentionHistory.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch mention history:', err)
    }
  }

  /**
   * 获取推荐提及的用户（基于最近交互）
   */
  const getRecommendedMentions = computed(() => {
    // 优先级：最近提及 > 粉丝 > 活跃用户
    const recommended = []

    // 添加最近提及的用户（去重）
    mentionHistory.value.slice(0, 5).forEach(item => {
      if (!recommended.find(u => u.id === item.userId)) {
        recommended.push(item.user)
      }
    })

    return recommended
  })

  /**
   * 清空搜索
   */
  const clearSearch = () => {
    searchQuery.value = ''
    suggestedUsers.value = []
  }

  /**
   * 初始化
   */
  const initialize = async () => {
    await Promise.all([
      fetchMentionedUsers(),
      fetchMentionHistory()
    ])
  }

  return {
    // 数据
    mentionedUsers,
    mentionHistory,
    suggestedUsers,
    searchQuery,
    loading,
    error,

    // 计算属性
    getRecommendedMentions,

    // 方法
    searchUsers,
    fetchMentionedUsers,
    fetchMentionHistory,
    clearSearch,
    initialize
  }
}
