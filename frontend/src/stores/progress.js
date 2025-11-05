import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 学习进度追踪 Store
 * 记录用户的学习进度、完成度、学习统计
 */
export const useProgressStore = defineStore('progress', () => {
  // ============ 状态 ============
  const learningRecords = ref([]) // 学习记录
  const completedMajors = ref([]) // 已完成的专业
  const majorProgress = ref({}) // 每个专业的进度
  const dailyStats = ref({}) // 每日统计

  // ============ 初始化 ============
  function initProgress() {
    try {
      const saved = localStorage.getItem('learningProgress')
      if (saved) {
        const parsed = JSON.parse(saved)
        learningRecords.value = parsed.records || []
        completedMajors.value = parsed.completed || []
        majorProgress.value = parsed.progress || {}
        dailyStats.value = parsed.daily || {}
      }
    } catch (err) {
      console.error('Failed to load progress:', err)
    }
  }

  // ============ 保存进度 ============
  function saveProgress() {
    try {
      localStorage.setItem(
        'learningProgress',
        JSON.stringify({
          records: learningRecords.value,
          completed: completedMajors.value,
          progress: majorProgress.value,
          daily: dailyStats.value
        })
      )
    } catch (err) {
      console.error('Failed to save progress:', err)
    }
  }

  // ============ 记录学习 ============
  /**
   * 记录一次学习活动
   */
  function recordLearningActivity(majorId, majorName, spentMinutes, topics = []) {
    const record = {
      id: `${majorId}-${Date.now()}`,
      majorId,
      majorName,
      topics,
      spentMinutes,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    }

    learningRecords.value.unshift(record)

    // 更新每日统计
    const date = record.date
    if (!dailyStats.value[date]) {
      dailyStats.value[date] = {
        totalMinutes: 0,
        activitiesCount: 0,
        majorsStudied: new Set()
      }
    }
    dailyStats.value[date].totalMinutes += spentMinutes
    dailyStats.value[date].activitiesCount += 1
    dailyStats.value[date].majorsStudied.add(majorId)

    // 更新专业进度
    if (!majorProgress.value[majorId]) {
      majorProgress.value[majorId] = {
        majorId,
        majorName,
        totalMinutes: 0,
        activitiesCount: 0,
        progress: 0,
        completedTopics: [],
        lastStudiedAt: null
      }
    }
    majorProgress.value[majorId].totalMinutes += spentMinutes
    majorProgress.value[majorId].activitiesCount += 1
    majorProgress.value[majorId].lastStudiedAt = record.timestamp

    // 更新已学习的主题
    topics.forEach(topic => {
      if (!majorProgress.value[majorId].completedTopics.includes(topic)) {
        majorProgress.value[majorId].completedTopics.push(topic)
      }
    })

    saveProgress()
    return record
  }

  // ============ 标记完成 ============
  /**
   * 标记一个专业为已完成
   */
  function completeMajor(majorId, majorName) {
    if (!completedMajors.value.includes(majorId)) {
      completedMajors.value.push(majorId)

      if (majorProgress.value[majorId]) {
        majorProgress.value[majorId].progress = 100
        majorProgress.value[majorId].completedAt = new Date().toISOString()
      }

      saveProgress()
    }
  }

  // ============ 查询函数 ============
  /**
   * 获取特定专业的进度
   */
  function getMajorProgress(majorId) {
    return majorProgress.value[majorId] || null
  }

  /**
   * 获取指定日期范围的学习记录
   */
  function getRecordsByDateRange(startDate, endDate) {
    return learningRecords.value.filter(record => {
      const date = record.date
      return date >= startDate && date <= endDate
    })
  }

  /**
   * 获取特定日期的统计信息
   */
  function getDailyStats(date) {
    return dailyStats.value[date] || null
  }

  /**
   * 获取过去 N 天的统计
   */
  function getRecentDaysStats(days = 7) {
    const stats = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      stats.push({
        date: dateStr,
        ...dailyStats.value[dateStr]
      })
    }
    return stats
  }

  // ============ 统计计算 ============
  /**
   * 计算学习时间趋势
   */
  const learningTrend = computed(() => {
    const trend = getRecentDaysStats(7)
    return trend.map(item => ({
      date: item.date,
      minutes: item.totalMinutes || 0,
      hours: ((item.totalMinutes || 0) / 60).toFixed(1)
    }))
  })

  /**
   * 总学习时间（分钟）
   */
  const totalLearningMinutes = computed(() => {
    return learningRecords.value.reduce((sum, record) => sum + record.spentMinutes, 0)
  })

  /**
   * 总学习时间（小时）
   */
  const totalLearningHours = computed(() => {
    return (totalLearningMinutes.value / 60).toFixed(1)
  })

  /**
   * 学习天数
   */
  const learningDays = computed(() => {
    return Object.keys(dailyStats.value).length
  })

  /**
   * 平均每天学习时间
   */
  const averageDailyMinutes = computed(() => {
    return learningDays.value > 0
      ? Math.round(totalLearningMinutes.value / learningDays.value)
      : 0
  })

  /**
   * 学过的专业数
   */
  const studiedMajorsCount = computed(() => {
    return Object.keys(majorProgress.value).length
  })

  /**
   * 完成的专业数
   */
  const completedMajorsCount = computed(() => {
    return completedMajors.value.length
  })

  /**
   * 学习进度（0-100%）
   */
  const overallProgress = computed(() => {
    if (studiedMajorsCount.value === 0) return 0
    const avgProgress = Object.values(majorProgress.value).reduce(
      (sum, major) => sum + (major.progress || 0),
      0
    ) / studiedMajorsCount.value
    return Math.round(avgProgress)
  })

  /**
   * 最近 7 天学习统计
   */
  const recentWeekStats = computed(() => {
    const stats = getRecentDaysStats(7)
    return {
      totalMinutes: stats.reduce((sum, item) => sum + (item.totalMinutes || 0), 0),
      totalActivities: stats.reduce((sum, item) => sum + (item.activitiesCount || 0), 0),
      activeDays: stats.filter(item => item.totalMinutes > 0).length,
      avgDailyMinutes: Math.round(
        stats.reduce((sum, item) => sum + (item.totalMinutes || 0), 0) / 7
      )
    }
  })

  /**
   * 学习排行（按学习时间）
   */
  const majorRanking = computed(() => {
    return Object.values(majorProgress.value)
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 10)
  })

  /**
   * 学习速度（每周完成专业数）
   */
  const completionRate = computed(() => {
    if (learningDays.value === 0) return 0
    const weeks = learningDays.value / 7
    return (completedMajorsCount.value / weeks).toFixed(2)
  })

  // ============ 成就系统 ============
  const achievements = computed(() => {
    const list = []

    if (totalLearningHours.value >= 1) list.push({ id: 'first-hour', name: '初学者', icon: '🌱' })
    if (totalLearningHours.value >= 10) list.push({ id: 'ten-hours', name: '坚持者', icon: '💪' })
    if (totalLearningHours.value >= 50) list.push({ id: 'fifty-hours', name: '学习狂', icon: '🔥' })
    if (learningDays.value >= 7) list.push({ id: 'week-streak', name: '周学习者', icon: '📅' })
    if (learningDays.value >= 30) list.push({ id: 'month-learner', name: '月度坚持', icon: '🏆' })
    if (completedMajorsCount.value >= 1) list.push({ id: 'first-major', name: '首个完成', icon: '✅' })
    if (completedMajorsCount.value >= 5) list.push({ id: 'five-majors', name: '五星学者', icon: '⭐' })

    return list
  })

  // ============ 导出 ============
  return {
    // 状态
    learningRecords,
    completedMajors,
    majorProgress,
    dailyStats,

    // 计算属性
    learningTrend,
    totalLearningMinutes,
    totalLearningHours,
    learningDays,
    averageDailyMinutes,
    studiedMajorsCount,
    completedMajorsCount,
    overallProgress,
    recentWeekStats,
    majorRanking,
    completionRate,
    achievements,

    // 初始化
    initProgress,

    // 操作
    recordLearningActivity,
    completeMajor,

    // 查询
    getMajorProgress,
    getRecordsByDateRange,
    getDailyStats,
    getRecentDaysStats
  }
})
