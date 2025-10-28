import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import StatisticsService from '@/services/statisticsService'
import healthChecker from '@/utils/healthCheck'

export const useStatisticsStore = defineStore('statistics', () => {
  // 状态定义
  const userStats = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(null)

  // 趋势数据
  const trends = ref([])
  const achievements = ref([])
  const recommendations = ref([])

  // 排行榜数据
  const leaderboard = ref([])
  const leaderboardLoading = ref(false)

  // 详细数据
  const timeSeriesData = ref([])
  const categoryBreakdown = ref({})

  // 成就详情数据
  const achievementMetadata = ref([])
  const achievementCategories = ref([])
  const userAchievementProgress = ref({})
  const achievementLoadingStates = ref({
    overview: false,
    categories: false,
    details: false,
    progress: false
  })
  const currentAchievementDetail = ref(null)

  // 计算属性
  const isDataStale = computed(() => {
    if (!lastUpdated.value) return true
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() - lastUpdated.value > fiveMinutes
  })

  const formattedStats = computed(() => {
    if (!userStats.value?.formatted) {
      return {
        interviewCount: { value: 0, formatted: '0次', trend: 'stable' },
        practiceTime: { value: 0, formatted: '0分钟', trend: 'stable' },
        averageScore: { value: 0, formatted: '0.0分', trend: 'stable' },
        rank: { level: 'N/A', formatted: 'N/A', trend: 'stable' }
      }
    }

    const formatted = userStats.value.formatted
    const trendData = userStats.value.trends || {}

    return {
      interviewCount: {
        ...formatted.interviewCount,
        trend: trendData.activityTrend || 'stable',
        trendText: trendData.activityChangeText || '',
        color: getTrendColor(trendData.activityTrend),
        icon: getTrendIcon(trendData.activityTrend)
      },
      practiceTime: {
        ...formatted.practiceTime,
        trend: trendData.activityTrend || 'stable',
        trendText: trendData.activityChangeText || '',
        color: getTrendColor(trendData.activityTrend),
        icon: getTrendIcon(trendData.activityTrend)
      },
      averageScore: {
        ...formatted.averageScore,
        trend: trendData.scoreTrend || 'stable',
        trendText: trendData.scoreChangeText || '',
        color: getTrendColor(trendData.scoreTrend),
        icon: getTrendIcon(trendData.scoreTrend)
      },
      rank: {
        ...formatted.rank,
        trend: 'stable', // 排名趋势需要更复杂的计算
        trendText: '',
        color: getRankColor(formatted.rank.level),
        icon: 'Trophy'
      }
    }
  })

  const hasAchievements = computed(() => {
    return achievements.value && achievements.value.length > 0
  })

  const unlockedAchievements = computed(() => {
    return achievements.value.filter(achievement => achievement.unlocked)
  })

  const highPriorityRecommendations = computed(() => {
    return recommendations.value.filter(rec => rec.priority === 'high')
  })

  // 成就相关计算属性
  const achievementStats = computed(() => {
    const total = achievementMetadata.value.length
    const unlocked = Object.values(userAchievementProgress.value).filter(progress => progress.unlocked).length
    const unlockedRate = total > 0 ? Math.round((unlocked / total) * 100) : 0

    return {
      total,
      unlocked,
      locked: total - unlocked,
      unlockedRate,
      formatted: {
        total: `${total}个`,
        unlocked: `${unlocked}个`,
        unlockedRate: `${unlockedRate}%`
      }
    }
  })

  const achievementsByCategory = computed(() => {
    const grouped = {}
    achievementMetadata.value.forEach(achievement => {
      const category = achievement.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push({
        ...achievement,
        progress: userAchievementProgress.value[achievement.id] || {
          unlocked: false,
          progress: 0,
          unlockedAt: null
        }
      })
    })
    return grouped
  })

  const recentUnlockedAchievements = computed(() => {
    return Object.values(userAchievementProgress.value)
      .filter(progress => progress.unlocked && progress.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, 5)
      .map(progress => {
        const metadata = achievementMetadata.value.find(a => a.id === progress.achievementId)
        return { ...metadata, ...progress }
      })
  })

  // Actions

  /**
   * 获取用户统计数据
   */
  const fetchUserStatistics = async (options = {}) => {
    const {
      timeRange = 'all',
      detail = true,
      forceRefresh = false,
      silent = false
    } = options

    // 如果数据新鲜且不强制刷新，直接返回
    if (!forceRefresh && !isDataStale.value && userStats.value) {
      return { success: true, data: userStats.value, fromCache: true }
    }

    if (!silent) {
      loading.value = true
    }
    error.value = null

    try {
      const result = await StatisticsService.getUserStatistics({
        timeRange,
        detail,
        forceRefresh
      })

      if (result.success) {
        userStats.value = result.data
        trends.value = result.data.trends || {}
        achievements.value = result.data.achievements || []
        recommendations.value = result.data.recommendations || []
        timeSeriesData.value = result.data.timeSeriesData || []
        categoryBreakdown.value = result.data.categoryBreakdown || {}
        lastUpdated.value = Date.now()

        // 检查新成就
        checkNewAchievements(result.data.achievements || [])

        return result
      } else {
        throw new Error(result.error?.message || '获取统计数据失败')
      }
    } catch (err) {
      error.value = err.message
      console.error('获取统计数据失败:', err)

      if (!silent) {
        ElMessage.error('获取统计数据失败: ' + err.message)
      }

      // 返回降级数据
      return {
        success: false,
        error: err.message,
        data: StatisticsService.getFallbackData()
      }
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  /**
   * 面试完成后更新统计
   */
  const updateAfterInterview = async (sessionData) => {
    try {
      console.log('面试完成，更新统计数据:', sessionData)

      // 乐观更新本地数据
      if (userStats.value?.summary) {
        userStats.value.summary.interviewCount = (userStats.value.summary.interviewCount || 0) + 1
        userStats.value.summary.totalPracticeTime = (userStats.value.summary.totalPracticeTime || 0) + (sessionData.duration || 0)

        // 更新格式化数据
        if (userStats.value.formatted) {
          userStats.value.formatted.interviewCount = {
            value: userStats.value.summary.interviewCount,
            formatted: `${userStats.value.summary.interviewCount}次`
          }
          userStats.value.formatted.practiceTime = {
            value: userStats.value.summary.totalPracticeTime,
            formatted: StatisticsService.formatTime(userStats.value.summary.totalPracticeTime)
          }
        }
      }

      // 发送更新请求到服务器
      const result = await StatisticsService.updateAfterInterview(sessionData)

      // 延迟获取最新数据（包含新的排名和分数）
      setTimeout(() => {
        fetchUserStatistics({ forceRefresh: true, silent: true })
      }, 2000)

      return result
    } catch (error) {
      console.error('更新面试统计失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取排行榜数据
   */
  const fetchLeaderboard = async (options = {}) => {
    leaderboardLoading.value = true

    try {
      const result = await StatisticsService.getLeaderboard(options)

      if (result.success) {
        leaderboard.value = result.data
      }

      return result
    } catch (error) {
      console.error('获取排行榜失败:', error)
      ElMessage.error('获取排行榜失败')
      return { success: false, error: error.message }
    } finally {
      leaderboardLoading.value = false
    }
  }

  /**
   * 获取用户趋势数据
   */
  const fetchUserTrends = async (timeRange = 'monthly') => {
    try {
      const result = await StatisticsService.getUserTrends(timeRange)

      if (result.success) {
        timeSeriesData.value = result.data.trends || []
        return result
      }

      throw new Error(result.error?.message || '获取趋势数据失败')
    } catch (error) {
      console.error('获取趋势数据失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取成就元数据
   */
  const fetchAchievementMetadata = async (forceRefresh = false) => {
    if (!forceRefresh && achievementMetadata.value.length > 0) {
      return { success: true, data: achievementMetadata.value, fromCache: true }
    }

    achievementLoadingStates.value.overview = true

    try {
      // 模拟 API 调用
      const mockAchievements = [
        {
          id: 'first_interview',
          title: '初次体验',
          description: '完成人生第一次AI面试',
          category: 'interview',
          icon: 'VideoCamera',
          requirement: 1,
          type: 'count',
          rarity: 'common'
        },
        {
          id: 'interview_master',
          title: '面试达人',
          description: '累计完成50次面试',
          category: 'interview',
          icon: 'Trophy',
          requirement: 50,
          type: 'count',
          rarity: 'epic'
        },
        {
          id: 'time_warrior',
          title: '时间勇士',
          description: '累计练习时长达到100小时',
          category: 'time',
          icon: 'Clock',
          requirement: 360000,
          type: 'time',
          rarity: 'rare'
        },
        {
          id: 'score_perfectionist',
          title: '完美主义者',
          description: '获得一次满20分的面试成绩',
          category: 'score',
          icon: 'Star',
          requirement: 95,
          type: 'single_score',
          rarity: 'legendary'
        },
        {
          id: 'weekly_streak',
          title: '坚持不懈',
          description: '连续7天进行面试练习',
          category: 'special',
          icon: 'Calendar',
          requirement: 7,
          type: 'streak',
          rarity: 'rare'
        }
      ]

      achievementMetadata.value = mockAchievements

      return { success: true, data: mockAchievements }
    } catch (error) {
      console.error('获取成就元数据失败:', error)
      return { success: false, error: error.message }
    } finally {
      achievementLoadingStates.value.overview = false
    }
  }

  /**
   * 获取用户成就进度
   */
  const fetchUserAchievementProgress = async (forceRefresh = false) => {
    if (!forceRefresh && Object.keys(userAchievementProgress.value).length > 0) {
      return { success: true, data: userAchievementProgress.value, fromCache: true }
    }

    achievementLoadingStates.value.progress = true

    try {
      // 模拟用户进度数据
      const mockProgress = {
        'first_interview': {
          achievementId: 'first_interview',
          unlocked: true,
          progress: 1,
          unlockedAt: '2025-09-20T10:30:00Z'
        },
        'interview_master': {
          achievementId: 'interview_master',
          unlocked: false,
          progress: 8,
          unlockedAt: null
        },
        'time_warrior': {
          achievementId: 'time_warrior',
          unlocked: false,
          progress: 180000,
          unlockedAt: null
        },
        'score_perfectionist': {
          achievementId: 'score_perfectionist',
          unlocked: false,
          progress: 88,
          unlockedAt: null
        },
        'weekly_streak': {
          achievementId: 'weekly_streak',
          unlocked: false,
          progress: 3,
          unlockedAt: null
        }
      }

      userAchievementProgress.value = mockProgress

      return { success: true, data: mockProgress }
    } catch (error) {
      console.error('获取用户成就进度失败:', error)
      return { success: false, error: error.message }
    } finally {
      achievementLoadingStates.value.progress = false
    }
  }

  /**
   * 获取成就分类
   */
  const fetchAchievementCategories = async () => {
    if (achievementCategories.value.length > 0) {
      return { success: true, data: achievementCategories.value, fromCache: true }
    }

    achievementLoadingStates.value.categories = true

    try {
      const mockCategories = [
        {
          id: 'interview',
          name: '面试成就',
          description: '与面试次数和表现相关的成就',
          icon: 'VideoCamera',
          color: '#409eff',
          count: 0
        },
        {
          id: 'time',
          name: '时间成就',
          description: '与练习时长相关的成就',
          icon: 'Clock',
          color: '#67c23a',
          count: 0
        },
        {
          id: 'score',
          name: '分数成就',
          description: '与面试分数相关的成就',
          icon: 'Star',
          color: '#e6a23c',
          count: 0
        },
        {
          id: 'special',
          name: '特殊成就',
          description: '特殊行为和里程碑成就',
          icon: 'Award',
          color: '#f56c6c',
          count: 0
        }
      ]

      achievementCategories.value = mockCategories

      return { success: true, data: mockCategories }
    } catch (error) {
      console.error('获取成就分类失败:', error)
      return { success: false, error: error.message }
    } finally {
      achievementLoadingStates.value.categories = false
    }
  }

  /**
   * 获取单个成就详情
   */
  const fetchAchievementDetail = async (achievementId) => {
    achievementLoadingStates.value.details = true

    try {
      const metadata = achievementMetadata.value.find(a => a.id === achievementId)
      const progress = userAchievementProgress.value[achievementId]

      if (!metadata) {
        throw new Error('成就不存在')
      }

      const detail = {
        ...metadata,
        progress: progress || {
          unlocked: false,
          progress: 0,
          unlockedAt: null
        },
        progressPercentage: Math.min(100, Math.round((progress?.progress || 0) / metadata.requirement * 100)),
        remainingProgress: Math.max(0, metadata.requirement - (progress?.progress || 0))
      }

      currentAchievementDetail.value = detail

      return { success: true, data: detail }
    } catch (error) {
      console.error('获取成就详情失败:', error)
      return { success: false, error: error.message }
    } finally {
      achievementLoadingStates.value.details = false
    }
  }

  /**
   * 更新成就进度
   */
  const updateAchievementProgress = (achievementId, newProgress) => {
    if (!userAchievementProgress.value[achievementId]) {
      userAchievementProgress.value[achievementId] = {
        achievementId,
        unlocked: false,
        progress: 0,
        unlockedAt: null
      }
    }

    const current = userAchievementProgress.value[achievementId]
    const metadata = achievementMetadata.value.find(a => a.id === achievementId)

    if (metadata) {
      current.progress = newProgress

      // 检查是否解锁
      if (!current.unlocked && newProgress >= metadata.requirement) {
        current.unlocked = true
        current.unlockedAt = new Date().toISOString()

        // 显示解锁通知
        ElNotification({
          title: '🏆 成就解锁！',
          message: `${metadata.title}: ${metadata.description}`,
          type: 'success',
          duration: 5000,
          position: 'top-right'
        })
      }
    }
  }

  /**
   * 刷新所有数据
   */
  const refreshAllData = async () => {
    loading.value = true

    try {
      const promises = [
        fetchUserStatistics({ forceRefresh: true, silent: true }),
        fetchLeaderboard({ limit: 10 }),
        fetchUserTrends('monthly')
      ]

      const results = await Promise.allSettled(promises)

      // 检查是否有失败的请求
      const failures = results.filter(result => result.status === 'rejected')
      if (failures.length > 0) {
        console.warn('部分数据刷新失败:', failures)
      }

      ElMessage.success('数据刷新完成')
      return true
    } catch (error) {
      console.error('刷新数据失败:', error)
      ElMessage.error('数据刷新失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查新成就
   */
  const checkNewAchievements = (newAchievements) => {
    if (!Array.isArray(newAchievements)) return

    const previousAchievements = achievements.value || []
    const newUnlocked = newAchievements.filter(achievement =>
      achievement.unlocked &&
      !previousAchievements.some(prev => prev.id === achievement.id && prev.unlocked)
    )

    // 显示新成就通知
    newUnlocked.forEach(achievement => {
      ElNotification({
        title: '🎉 新成就解锁！',
        message: `${achievement.title}: ${achievement.description}`,
        type: 'success',
        duration: 5000,
        position: 'top-right'
      })
    })
  }

  /**
   * 清除缓存和重置状态
   */
  const resetStatistics = () => {
    userStats.value = null
    trends.value = []
    achievements.value = []
    recommendations.value = []
    leaderboard.value = []
    timeSeriesData.value = []
    categoryBreakdown.value = {}
    lastUpdated.value = null
    error.value = null

    // 重置成就数据
    achievementMetadata.value = []
    achievementCategories.value = []
    userAchievementProgress.value = {}
    currentAchievementDetail.value = null
    achievementLoadingStates.value = {
      overview: false,
      categories: false,
      details: false,
      progress: false
    }
  }

  // 工具函数
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#67c23a'
      case 'down': return '#f56c6c'
      case 'stable': return '#909399'
      default: return '#909399'
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return 'TrendCharts'
      case 'down': return 'TrendCharts'
      case 'stable': return 'Minus'
      default: return 'Minus'
    }
  }

  const getRankColor = (level) => {
    const rankColors = {
      'S+': '#ff6b6b',
      'S': '#ff8e8e',
      'A+': '#4ecdc4',
      'A': '#45b7aa',
      'A-': '#45b7aa',
      'B+': '#f9ca24',
      'B': '#f0932b',
      'B-': '#f0932b',
      'C+': '#6c5ce7',
      'C': '#a29bfe',
      'C-': '#a29bfe',
      'D': '#636e72'
    }
    return rankColors[level] || '#909399'
  }

  // 自动初始化
  const initialize = async () => {
    // 启动健康检查
    healthChecker.startPeriodicCheck()

    await Promise.all([
      fetchUserStatistics({ silent: true }),
      fetchAchievementMetadata(),
      fetchUserAchievementProgress(),
      fetchAchievementCategories()
    ])
  }

  // 获取健康状态
  const getHealthStatus = () => {
    return healthChecker.getHealthReport()
  }

  // 检查服务健康状态
  const checkServiceHealth = async () => {
    return await healthChecker.checkHealth()
  }

  return {
    // 状态
    userStats,
    loading,
    error,
    lastUpdated,
    trends,
    achievements,
    recommendations,
    leaderboard,
    leaderboardLoading,
    timeSeriesData,
    categoryBreakdown,

    // 计算属性
    isDataStale,
    formattedStats,
    hasAchievements,
    unlockedAchievements,
    highPriorityRecommendations,

    // 方法
    fetchUserStatistics,
    updateAfterInterview,
    fetchLeaderboard,
    fetchUserTrends,
    refreshAllData,
    resetStatistics,
    initialize,

    // 成就相关方法
    fetchAchievementMetadata,
    fetchUserAchievementProgress,
    fetchAchievementCategories,
    fetchAchievementDetail,
    updateAchievementProgress,

    // 成就状态
    achievementMetadata,
    achievementCategories,
    userAchievementProgress,
    achievementLoadingStates,
    currentAchievementDetail,
    achievementStats,
    achievementsByCategory,
    recentUnlockedAchievements,

    // 工具函数
    getTrendColor,
    getTrendIcon,
    getRankColor,

    // 健康检查
    getHealthStatus,
    checkServiceHealth
  }
})
