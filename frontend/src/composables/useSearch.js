/**
 * useSearch - 搜索系统管理
 *
 * 功能：
 * - 全文搜索（帖子、用户、标签）
 * - 高级搜索（日期范围、作者、标签、内容类型）
 * - 搜索历史记录
 * - 搜索建议和热门搜索
 * - 结果排序和过滤
 */

import { ref, computed, reactive, watch } from 'vue'
import communityAPI from '@/api/communityWithCache'
import { useDebounce } from './useDebounce'

export function useSearch() {
  // 搜索关键词和结果
  const searchKeyword = ref('')
  const searchResults = ref([])
  const searchHistory = ref([])
  const trendingSearches = ref([])

  // 搜索状态
  const loading = ref(false)
  const error = ref(null)
  const hasSearched = ref(false)

  // 分页
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalResults = ref(0)

  // 搜索过滤
  const filters = reactive({
    type: 'all',           // all|post|user|tag
    sortBy: 'relevance',   // relevance|latest|hot|views
    startDate: null,
    endDate: null,
    author: null,
    tags: [],
    forumId: null
  })

  // 搜索建议
  const suggestions = ref([])
  const showSuggestions = ref(false)

  /**
   * 去抖动搜索
   */
  const { useDebounce: debounceFn } = useDebounce()
  const debouncedSearch = debounceFn(async () => {
    if (searchKeyword.value.trim()) {
      await performSearch()
    }
  }, 300)

  /**
   * 执行搜索
   */
  const performSearch = async (page = 1) => {
    if (!searchKeyword.value.trim()) {
      searchResults.value = []
      hasSearched.value = false
      return
    }

    loading.value = true
    error.value = null
    hasSearched.value = true

    try {
      const response = await communityAPI.search(searchKeyword.value, {
        page,
        pageSize: pageSize.value,
        ...filters
      })

      if (response.data) {
        searchResults.value = response.data.results || []
        totalResults.value = response.data.total || 0
        currentPage.value = page

        // 保存搜索历史（仅保存成功且有结果的搜索）
        if (response.data.total > 0) {
          addToSearchHistory(searchKeyword.value)
        }
      }
    } catch (err) {
      error.value = err.message || '搜索失败'
      console.error('Search failed:', err)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 监听搜索关键词变化（自动搜索）
   */
  watch(searchKeyword, () => {
    currentPage.value = 1
    if (searchKeyword.value.trim()) {
      debouncedSearch()
      // 显示搜索建议
      fetchSuggestions(searchKeyword.value)
    } else {
      searchResults.value = []
      hasSearched.value = false
      showSuggestions.value = false
    }
  })

  /**
   * 获取搜索建议
   */
  const fetchSuggestions = async (keyword) => {
    if (!keyword || keyword.length < 1) {
      suggestions.value = []
      return
    }

    try {
      const response = await communityAPI.getSearchSuggestions(keyword)
      if (response.data) {
        suggestions.value = response.data
        showSuggestions.value = true
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    }
  }

  /**
   * 选择建议
   */
  const selectSuggestion = (suggestion) => {
    searchKeyword.value = suggestion.text || suggestion.name
    showSuggestions.value = false
    performSearch(1)
  }

  /**
   * 添加到搜索历史
   */
  const addToSearchHistory = async (keyword) => {
    try {
      // 本地保存到 localStorage
      let history = JSON.parse(localStorage.getItem('search_history') || '[]')

      // 去重
      history = history.filter(h => h.keyword !== keyword)

      // 添加新的搜索
      history.unshift({
        keyword,
        timestamp: new Date().toISOString(),
        resultCount: totalResults.value
      })

      // 只保留最近 30 条
      history = history.slice(0, 30)

      localStorage.setItem('search_history', JSON.stringify(history))
      searchHistory.value = history

      // 同步到后端（可选）
      await communityAPI.recordSearchHistory(keyword).catch(() => {
        // 后端失败不影响本地历史
      })
    } catch (err) {
      console.error('Failed to save search history:', err)
    }
  }

  /**
   * 获取搜索历史
   */
  const fetchSearchHistory = async () => {
    try {
      // 优先从 localStorage 读取
      const history = JSON.parse(localStorage.getItem('search_history') || '[]')
      searchHistory.value = history

      // 同时从后端同步
      const response = await communityAPI.getSearchHistory()
      if (response.data) {
        searchHistory.value = response.data
        localStorage.setItem('search_history', JSON.stringify(response.data))
      }
    } catch (err) {
      console.error('Failed to fetch search history:', err)
    }
  }

  /**
   * 获取热门搜索
   */
  const fetchTrendingSearches = async () => {
    try {
      const response = await communityAPI.getTrendingSearches()
      if (response.data) {
        trendingSearches.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch trending searches:', err)
    }
  }

  /**
   * 清空搜索历史
   */
  const clearSearchHistory = async () => {
    try {
      localStorage.removeItem('search_history')
      searchHistory.value = []

      // 同步到后端
      await communityAPI.clearSearchHistory().catch(() => {
        // 后端失败不影响本地清空
      })
    } catch (err) {
      console.error('Failed to clear search history:', err)
    }
  }

  /**
   * 删除单条历史记录
   */
  const removeFromHistory = (index) => {
    searchHistory.value.splice(index, 1)
    localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
  }

  /**
   * 改变搜索过滤
   */
  const changeFilter = async (filterName, value) => {
    filters[filterName] = value
    currentPage.value = 1
    await performSearch(1)
  }

  /**
   * 改变排序方式
   */
  const changeSortBy = async (sortBy) => {
    filters.sortBy = sortBy
    currentPage.value = 1
    await performSearch(1)
  }

  /**
   * 改变分页
   */
  const changePage = async (page) => {
    currentPage.value = page
    await performSearch(page)
  }

  /**
   * 改变每页数量
   */
  const changePageSize = async (size) => {
    pageSize.value = size
    currentPage.value = 1
    await performSearch(1)
  }

  /**
   * 重置搜索
   */
  const resetSearch = () => {
    searchKeyword.value = ''
    searchResults.value = []
    currentPage.value = 1
    hasSearched.value = false
    error.value = null
    filters.type = 'all'
    filters.sortBy = 'relevance'
    filters.startDate = null
    filters.endDate = null
    filters.author = null
    filters.tags = []
    filters.forumId = null
  }

  /**
   * 初始化：获取历史和热门搜索
   */
  const initialize = async () => {
    await Promise.all([
      fetchSearchHistory(),
      fetchTrendingSearches()
    ])
  }

  /**
   * 计算属性：排序选项
   */
  const sortOptions = computed(() => [
    { label: '相关度', value: 'relevance' },
    { label: '最新', value: 'latest' },
    { label: '最热', value: 'hot' },
    { label: '浏览量', value: 'views' }
  ])

  /**
   * 计算属性：搜索类型选项
   */
  const typeOptions = computed(() => [
    { label: '全部', value: 'all' },
    { label: '帖子', value: 'post' },
    { label: '用户', value: 'user' },
    { label: '标签', value: 'tag' }
  ])

  /**
   * 计算属性：分页信息
   */
  const pageInfo = computed(() => {
    const total = totalResults.value
    const pages = Math.ceil(total / pageSize.value)

    return {
      total,
      pages,
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      hasNextPage: currentPage.value < pages,
      hasPrevPage: currentPage.value > 1,
      startIndex: (currentPage.value - 1) * pageSize.value + 1,
      endIndex: Math.min(currentPage.value * pageSize.value, total)
    }
  })

  /**
   * 计算属性：是否显示空结果提示
   */
  const showNoResults = computed(() => hasSearched.value && searchResults.value.length === 0 && !loading.value)

  /**
   * 计算属性：结果统计文本
   */
  const resultStats = computed(() => {
    if (!hasSearched.value) return ''
    if (loading.value) return '搜索中...'
    if (error.value) return '搜索出错'
    return `找到 ${totalResults.value} 个结果`
  })

  return {
    // 数据
    searchKeyword,
    searchResults,
    searchHistory,
    trendingSearches,
    suggestions,
    loading,
    error,
    hasSearched,
    showSuggestions,
    currentPage,
    pageSize,
    totalResults,
    filters,

    // 计算属性
    pageInfo,
    sortOptions,
    typeOptions,
    showNoResults,
    resultStats,

    // 方法
    performSearch,
    selectSuggestion,
    fetchSearchHistory,
    fetchTrendingSearches,
    clearSearchHistory,
    removeFromHistory,
    changeFilter,
    changeSortBy,
    changePage,
    changePageSize,
    resetSearch,
    initialize
  }
}
