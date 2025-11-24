import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardService } from '@/services/dashboard'

interface DashboardData {
  stats: any[]
  historyData: any[]
  activities: any[]
  wrongAnswers: any[]
  chartData: any[]
  skillDistribution: any[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  // 状态
  const data = ref<DashboardData>({
    stats: [],
    historyData: [],
    activities: [],
    wrongAnswers: [],
    chartData: [],
    skillDistribution: []
  })

  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 计算属性
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const isEmpty = computed(() => {
    return (
      data.value.stats.length === 0 &&
      data.value.historyData.length === 0 &&
      data.value.activities.length === 0
    )
  })

  // 方法 - 获取所有仪表板数据
  const fetchDashboardData = async (forceRefresh = false) => {
    // 如果最近更新过且不是强制刷新，则跳过
    if (lastUpdated.value && !forceRefresh) {
      const timeSinceUpdate = Date.now() - lastUpdated.value.getTime()
      if (timeSinceUpdate < 5 * 60 * 1000) { // 5 分钟内不重复请求
        return
      }
    }

    try {
      loading.value = true
      error.value = null

      // 并行获取所有数据
      const [
        statsRes,
        historyRes,
        activitiesRes,
        wrongAnswersRes,
        chartRes,
        skillRes
      ] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getInterviewHistory(),
        dashboardService.getActivities(),
        dashboardService.getWrongAnswers(),
        dashboardService.getChartData(),
        dashboardService.getSkillDistribution()
      ])

      // 处理结果
      data.value.stats = statsRes.status === 'fulfilled' ? statsRes.value : []
      data.value.historyData = historyRes.status === 'fulfilled' ? historyRes.value : []
      data.value.activities = activitiesRes.status === 'fulfilled' ? activitiesRes.value : []
      data.value.wrongAnswers = wrongAnswersRes.status === 'fulfilled' ? wrongAnswersRes.value : []
      data.value.chartData = chartRes.status === 'fulfilled' ? chartRes.value : []
      data.value.skillDistribution = skillRes.status === 'fulfilled' ? skillRes.value : []

      lastUpdated.value = new Date()
    } catch (err: any) {
      error.value = err.message || '加载数据失败'
      console.error('Dashboard data fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  // 方法 - 获取统计数据
  const fetchStats = async () => {
    try {
      loading.value = true
      data.value.stats = await dashboardService.getStats()
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 方法 - 获取面试历史
  const fetchHistory = async () => {
    try {
      loading.value = true
      data.value.historyData = await dashboardService.getInterviewHistory()
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 方法 - 获取活动
  const fetchActivities = async () => {
    try {
      data.value.activities = await dashboardService.getActivities()
    } catch (err: any) {
      error.value = err.message
    }
  }

  // 方法 - 获取错题
  const fetchWrongAnswers = async () => {
    try {
      data.value.wrongAnswers = await dashboardService.getWrongAnswers()
    } catch (err: any) {
      error.value = err.message
    }
  }

  // 方法 - 收藏/取消收藏
  const toggleFavorite = (id: number) => {
    const item = data.value.historyData.find((h: any) => h.id === id)
    if (item) {
      item.isFavorite = !item.isFavorite
    }
  }

  // 方法 - 清除错误
  const clearError = () => {
    error.value = null
  }

  // 方法 - 重置状态
  const reset = () => {
    data.value = {
      stats: [],
      historyData: [],
      activities: [],
      wrongAnswers: [],
      chartData: [],
      skillDistribution: []
    }
    loading.value = false
    error.value = null
    lastUpdated.value = null
  }

  return {
    // 状态
    data,
    loading,
    error,
    lastUpdated,

    // 计算属性
    isLoading,
    hasError,
    isEmpty,

    // 方法
    fetchDashboardData,
    fetchStats,
    fetchHistory,
    fetchActivities,
    fetchWrongAnswers,
    toggleFavorite,
    clearError,
    reset
  }
})
