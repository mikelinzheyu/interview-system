/**
 * useRecommendations - 推荐系统组合式函数
 * 提供个性化推荐的论坛帖子
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import communityAPI from '@/api/communityWithCache'

export function useRecommendations(userId) {
  const recommendedPosts = ref([])
  const loading = ref(false)
  const error = ref(null)
  let refreshTimer = null

  /**
   * 获取推荐帖子
   */
  const fetchRecommendations = async () => {
    if (!userId) return

    loading.value = true
    error.value = null
    try {
      const res = await communityAPI.getRecommendedPosts(userId)
      recommendedPosts.value = res.data || []
    } catch (err) {
      error.value = err.message
      console.error('获取推荐帖子失败', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 记录帖子浏览（用于推荐算法）
   */
  const trackPostView = async (postId, viewTime = 1000) => {
    try {
      await communityAPI.trackPostView(postId, viewTime)
    } catch (error) {
      console.warn('记录浏览失败', error)
    }
  }

  /**
   * 刷新推荐
   */
  const refreshRecommendations = async () => {
    communityAPI.invalidateCache(`posts:recommended:${userId}`)
    return fetchRecommendations()
  }

  /**
   * 启动自动刷新（每小时）
   */
  const startAutoRefresh = (interval = 60 * 60 * 1000) => {
    fetchRecommendations()
    refreshTimer = setInterval(() => {
      fetchRecommendations()
    }, interval)
  }

  /**
   * 停止自动刷新
   */
  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  onMounted(() => {
    if (userId) {
      startAutoRefresh()
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // 状态
    recommendedPosts,
    loading,
    error,

    // 方法
    fetchRecommendations,
    trackPostView,
    refreshRecommendations,
    startAutoRefresh,
    stopAutoRefresh
  }
}
