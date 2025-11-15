/**
 * useMentions - @ 提及用户功能
 *
 * 功能：
 * - 在评论中提及其他用户
 * - 可搜索的用户列表
 * - @ 提及时自动通知用户
 * - 用户信息显示（头像、用户名、简介）
 */

import { ref, computed, watch } from 'vue'
import { useDebounce } from './useDebounce'

/**
 * 模拟用户数据（实际应该从API获取）
 */
const mockUsers = [
  { id: 1, username: '张三', avatar: 'https://via.placeholder.com/32', bio: '前端开发' },
  { id: 2, username: '李四', avatar: 'https://via.placeholder.com/32', bio: 'UI设计师' },
  { id: 3, username: '王五', avatar: 'https://via.placeholder.com/32', bio: '产品经理' },
  { id: 4, username: '赵六', avatar: 'https://via.placeholder.com/32', bio: '测试工程师' },
  { id: 5, username: '孙七', avatar: 'https://via.placeholder.com/32', bio: 'DevOps工程师' },
  { id: 6, username: '周八', avatar: 'https://via.placeholder.com/32', bio: '项目经理' },
  { id: 7, username: '吴九', avatar: 'https://via.placeholder.com/32', bio: '数据分析师' },
  { id: 8, username: '郑十', avatar: 'https://via.placeholder.com/32', bio: '后端开发' },
]

export function useMentions() {
  // 状态
  const mentionQuery = ref('')
  const mentionedUsers = ref([])
  const loading = ref(false)
  const showMentionList = ref(false)
  const selectedMentions = ref(new Set()) // 已经提及的用户ID
  const mentionStartPos = ref(null) // @ 符号的位置
  const mentionHistory = ref([])
  const suggestedUsers = ref([])
  const searchQuery = ref('')
  const error = ref(null)

  // 防抖搜索
  const debouncedSearch = useDebounce((query) => {
    searchUsers(query)
  }, 300)

  /**
   * 搜索用户（模拟API调用）
   */
  const searchUsers = async (query = '') => {
    const searchText = query || searchQuery.value

    if (!searchText.trim() || searchText.length < 1) {
      mentionedUsers.value = []
      suggestedUsers.value = []
      showMentionList.value = false
      return
    }

    loading.value = true
    error.value = null

    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 200))

      // 过滤用户
      const filtered = mockUsers.filter(user =>
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.bio.toLowerCase().includes(searchText.toLowerCase())
      )

      // 如果是从输入框输入，则更新 mentionedUsers；否则更新 suggestedUsers
      if (query !== undefined) {
        mentionedUsers.value = filtered
      } else {
        suggestedUsers.value = filtered
      }
      showMentionList.value = true

      console.log(`[useMentions] Found ${filtered.length} users for query: ${searchText}`)
    } catch (err) {
      error.value = err.message || '搜索用户失败'
      console.error('Failed to search users:', err)
      mentionedUsers.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理输入，检测 @ 符号
   */
  const handleInput = (text, cursorPos) => {
    // 找到最后一个 @ 符号
    const lastAtIndex = text.lastIndexOf('@')

    if (lastAtIndex === -1) {
      showMentionList.value = false
      mentionQuery.value = ''
      return
    }

    // 从 @ 后开始提取查询文本
    const query = text.substring(lastAtIndex + 1)

    // 如果 @ 后面有空格或换行，认为用户已经完成提及
    if (query.includes(' ') || query.includes('\n')) {
      showMentionList.value = false
      return
    }

    mentionQuery.value = query
    mentionStartPos.value = lastAtIndex
    debouncedSearch(query)
  }

  /**
   * 选择要提及的用户
   */
  const selectMention = (user, text) => {
    // 检查是否已经提及过
    if (selectedMentions.value.has(user.id)) {
      return text // 不重复提及
    }

    selectedMentions.value.add(user.id)

    // 替换 @ 后的内容为用户提及
    const lastAtIndex = text.lastIndexOf('@')
    const beforeAt = text.substring(0, lastAtIndex)
    const mention = `@${user.username}`

    const result = beforeAt + mention + ' '

    // 隐藏提及列表
    showMentionList.value = false
    mentionQuery.value = ''

    return result
  }

  /**
   * 获取已提及的用户ID列表
   */
  const getMentionedUserIds = () => {
    return Array.from(selectedMentions.value)
  }

  /**
   * 清空已提及的用户列表
   */
  const clearMentions = () => {
    selectedMentions.value.clear()
    mentionedUsers.value = []
    showMentionList.value = false
    mentionQuery.value = ''
  }

  /**
   * 计算过滤后的用户列表
   */
  const filteredUsers = computed(() => {
    // 不显示已经提及过的用户
    return mentionedUsers.value.filter(user => !selectedMentions.value.has(user.id))
  })

  /**
   * 获取推荐提及的用户（基于最近交互）
   */
  const getRecommendedMentions = computed(() => {
    return suggestedUsers.value.filter(user => !selectedMentions.value.has(user.id)).slice(0, 5)
  })

  /**
   * 监听搜索查询变化
   */
  watch(searchQuery, () => {
    debouncedSearch(searchQuery.value)
  })

  return {
    // 状态
    mentionQuery,
    mentionedUsers: filteredUsers,
    loading,
    showMentionList,
    selectedMentions,
    mentionStartPos,
    mentionHistory,
    suggestedUsers,
    searchQuery,
    error,

    // 计算属性
    getRecommendedMentions,

    // 方法
    handleInput,
    selectMention,
    getMentionedUserIds,
    clearMentions,
    searchUsers
  }
}

