/**
 * useForumStats - 论坛统计组合式函数
 * 管理论坛的实时统计数据（今日新帖、在线用户等）
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import communityAPI from '@/api/communityWithCache'

export function useForumStats() {
  const todayStats = ref({
    postsCount: 0,
    onlineUsers: 0,
    activeUsers: 0,
    newUsers: 0
  })

  const loading = ref(false)
  const error = ref(null)
  let statsTimer = null

  /**
   * 获取今日统计
   */
  const fetchTodayStats = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await communityAPI.getTodayStats()
      todayStats.value = res.data || {
        postsCount: 0,
        onlineUsers: 0,
        activeUsers: 0,
        newUsers: 0
      }
    } catch (err) {
      error.value = err.message
      console.error('fetchTodayStats error:', err)
      // 失败时使用本地数据，不显示错误提示
    } finally {
      loading.value = false
    }
  }

  /**
   * 启动自动刷新（每30秒）
   */
  const startAutoRefresh = (interval = 30000) => {
    // 首次立即加载
    fetchTodayStats()

    // 定时刷新
    statsTimer = setInterval(() => {
      fetchTodayStats()
    }, interval)
  }

  /**
   * 停止自动刷新
   */
  const stopAutoRefresh = () => {
    if (statsTimer) {
      clearInterval(statsTimer)
      statsTimer = null
    }
  }

  /**
   * 手动刷新
   */
  const refreshStats = () => {
    communityAPI.invalidateCache('stats:today')
    return fetchTodayStats()
  }

  onMounted(() => {
    startAutoRefresh()
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // 状态
    todayStats,
    loading,
    error,

    // 方法
    fetchTodayStats,
    refreshStats,
    startAutoRefresh,
    stopAutoRefresh
  }
}
