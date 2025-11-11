/**
 * useForumList - 论坛列表组合式函数
 * 封装论坛列表数据获取和状态管理
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import communityAPI from '@/api/communityWithCache'

export function useForumList() {
  const forums = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastFetchTime = ref(null)

  // 计算属性
  const totalPosts = computed(() =>
    forums.value.reduce((sum, f) => sum + (f.postCount || 0), 0)
  )

  const activeForums = computed(() =>
    forums.value.filter(f => f.active !== false).length
  )

  const forumsByActivity = computed(() => {
    return [...forums.value].sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
  })

  /**
   * 获取论坛列表
   */
  const fetchForums = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await communityAPI.getForums()
      forums.value = res.data || []
      lastFetchTime.value = new Date()
    } catch (err) {
      error.value = err.message
      ElMessage.error('获取论坛列表失败: ' + (err.message || '请检查网络连接'))
      console.error('fetchForums error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新论坛列表（清除缓存）
   */
  const refreshForums = async () => {
    communityAPI.invalidateCache('forums')
    return fetchForums()
  }

  /**
   * 按 ID 查找论坛
   */
  const getForumById = (id) => {
    return forums.value.find(f => f.id === id)
  }

  /**
   * 按 slug 查找论坛
   */
  const getForumBySlug = (slug) => {
    return forums.value.find(f => f.slug === slug)
  }

  /**
   * 初始化
   */
  onMounted(() => {
    fetchForums()
  })

  return {
    // 状态
    forums,
    loading,
    error,
    lastFetchTime,

    // 计算属性
    totalPosts,
    activeForums,
    forumsByActivity,

    // 方法
    fetchForums,
    refreshForums,
    getForumById,
    getForumBySlug
  }
}
