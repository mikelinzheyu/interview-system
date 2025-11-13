/**
 * usePostList - 帖子列表组合式函数
 * 封装帖子列表的数据获取、排序、搜索、分页等逻辑
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import communityAPI from '@/api/communityWithCache'

export function usePostList(options = {}) {
  const route = useRoute()
  const {
    defaultPageSize = 20,
    onError = () => {},
    autoFetch = true
  } = options

  // 基础状态
  const posts = ref([])
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)
  const total = ref(0)
  const sortBy = ref(route.query.sortBy || 'latest')
  const initialSearch = route.query.search || route.query.keyword || route.query.q || ''
  const searchKeyword = ref(initialSearch)
  const selectedForumSlug = ref(route.params.slug || null)
  const selectedTag = ref(route.query.tag || null)

  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  const isEmpty = computed(() => !loading.value && posts.value.length === 0)

  const hasMore = computed(() => currentPage.value < totalPages.value)

  const startIndex = computed(() => (currentPage.value - 1) * pageSize.value + 1)

  const endIndex = computed(() => Math.min(currentPage.value * pageSize.value, total.value))

  /**
   * 构建查询参数
   */
  const buildQueryParams = () => {
    return {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      search: searchKeyword.value,
      tag: selectedTag.value,
      forumSlug: selectedForumSlug.value
    }
  }

  /**
   * 获取帖子列表
   */
  const fetchPosts = async (resetPage = false) => {
    if (resetPage) {
      currentPage.value = 1
    }

    loading.value = true
    try {
      const params = buildQueryParams()

      let res
      if (selectedForumSlug.value) {
        // 获取特定板块的帖子
        res = await communityAPI.getForumPosts(selectedForumSlug.value, params)
      } else {
        // 获取所有帖子
        res = await communityAPI.getPosts(params)
      }

      posts.value = res.data || []
      total.value = res.total || 0
    } catch (error) {
      ElMessage.error('获取帖子列表失败: ' + (error.message || '请重试'))
      onError(error)
      console.error('fetchPosts error:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    fetchPosts(true) // 重置为第一页
  }

  /**
   * 处理排序变更
   */
  const handleSortChange = () => {
    fetchPosts(true)
  }

  /**
   * 处理分页变更
   */
  const handlePageChange = (page) => {
    currentPage.value = page
    fetchPosts()
    // 平滑滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * 处理页面大小变更
   */
  const handlePageSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchPosts()
  }

  /**
   * 清空搜索
   */
  const clearSearch = () => {
    searchKeyword.value = ''
    handleSearch()
  }

  /**
   * 刷新列表
   */
  const refreshPosts = async () => {
    // 清除缓存
    if (selectedForumSlug.value) {
      communityAPI.invalidateCache(`forums:posts:${selectedForumSlug.value}`)
    } else {
      communityAPI.invalidateCache('posts:list')
    }
    return fetchPosts(true)
  }

  /**
   * 更新单个帖子（本地）
   */
  const updatePost = (postId, updates) => {
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      Object.assign(post, updates)
    }
  }

  /**
   * 删除单个帖子（本地）
   */
  const removePost = (postId) => {
    const index = posts.value.findIndex(p => p.id === postId)
    if (index > -1) {
      posts.value.splice(index, 1)
      total.value--
    }
  }

  /**
   * 监听路由变更
   */
  watch(
    () => [route.params.slug, route.query.tag, route.query.sortBy, route.query.search, route.query.keyword, route.query.q],
    () => {
      selectedForumSlug.value = route.params.slug || null
      selectedTag.value = route.query.tag || null
      sortBy.value = route.query.sortBy || 'latest'
      searchKeyword.value = route.query.search || route.query.keyword || route.query.q || ''
      fetchPosts(true)
    }
  )

  /**
   * 初始化
   */
  onMounted(() => {
    if (autoFetch) {
      fetchPosts()
    }
  })

  return {
    // 状态
    posts,
    loading,
    currentPage,
    pageSize,
    total,
    sortBy,
    searchKeyword,
    selectedForumSlug,
    selectedTag,

    // 计算属性
    totalPages,
    isEmpty,
    hasMore,
    startIndex,
    endIndex,

    // 方法
    fetchPosts,
    handleSearch,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    clearSearch,
    refreshPosts,
    updatePost,
    removePost,
    buildQueryParams
  }
}
