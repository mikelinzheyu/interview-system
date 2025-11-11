/**
 * useUserRecommendations - 用户推荐系统
 *
 * 功能：
 * - 基于兴趣推荐用户
 * - 基于活动推荐用户
 * - 基于粉丝互动推荐用户
 * - 热门创作者推荐
 */

import { ref, computed } from 'vue'
import communityAPI from '@/api/communityWithCache'

export function useUserRecommendations() {
  // 推荐数据
  const recommendedUsers = ref([])
  const trendingCreators = ref([])
  const similarUsers = ref([])

  // 状态
  const loading = ref(false)
  const error = ref(null)

  // 推荐类型
  const recommendationType = ref('all')  // all|similar|trending|active

  /**
   * 获取推荐用户
   */
  const fetchRecommendedUsers = async (type = 'all', limit = 10) => {
    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.getRecommendedUsers({
        type,
        limit
      })

      if (response.data) {
        recommendedUsers.value = response.data
      }
    } catch (err) {
      error.value = err.message || '获取推荐用户失败'
      console.error('Failed to fetch recommended users:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取热门创作者
   */
  const fetchTrendingCreators = async (period = 'week', limit = 10) => {
    try {
      const response = await communityAPI.getTrendingCreators({
        period,  // day|week|month|all
        limit
      })

      if (response.data) {
        trendingCreators.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch trending creators:', err)
    }
  }

  /**
   * 获取相似用户（基于关注的人和兴趣）
   */
  const fetchSimilarUsers = async (limit = 10) => {
    try {
      const response = await communityAPI.getSimilarUsers({
        limit
      })

      if (response.data) {
        similarUsers.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch similar users:', err)
    }
  }

  /**
   * 改变推荐类型
   */
  const changeRecommendationType = async (type) => {
    recommendationType.value = type
    await fetchRecommendedUsers(type)
  }

  /**
   * 初始化：加载所有推荐数据
   */
  const initialize = async () => {
    await Promise.all([
      fetchRecommendedUsers('all'),
      fetchTrendingCreators('week'),
      fetchSimilarUsers()
    ])
  }

  /**
   * 刷新推荐
   */
  const refresh = async () => {
    await initialize()
  }

  /**
   * 计算属性：推荐类型选项
   */
  const typeOptions = computed(() => [
    { label: '全部', value: 'all' },
    { label: '相似用户', value: 'similar' },
    { label: '热门创作者', value: 'trending' },
    { label: '活跃用户', value: 'active' }
  ])

  return {
    // 数据
    recommendedUsers,
    trendingCreators,
    similarUsers,
    loading,
    error,
    recommendationType,

    // 计算属性
    typeOptions,

    // 方法
    fetchRecommendedUsers,
    fetchTrendingCreators,
    fetchSimilarUsers,
    changeRecommendationType,
    initialize,
    refresh
  }
}
