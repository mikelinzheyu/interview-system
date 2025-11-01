/**
 * Analytics Service - Learning progress tracking and insights
 *
 * Features:
 * - Track user activities (questions, time spent, performance)
 * - Calculate progress metrics (completion, accuracy, velocity)
 * - Predict completion dates
 * - Generate learning insights
 * - Track streaks and milestones
 * - Identify weaknesses and strengths
 *
 * @module analyticsService
 */

/**
 * Activity Record
 * @typedef {Object} Activity
 * @property {number} domainId - Domain ID
 * @property {string} activityType - 'question_attempted' | 'question_completed' | 'domain_started' | 'domain_completed'
 * @property {Date} timestamp - When activity occurred
 * @property {Object} metrics - Activity-specific metrics
 * @property {number} timeSpent - Minutes spent on activity
 */

/**
 * Progress Metrics
 * @typedef {Object} ProgressMetrics
 * @property {number} domainId - Domain ID
 * @property {number} totalQuestions - Total questions attempted
 * @property {number} correctAnswers - Number correct
 * @property {number} accuracy - Percentage correct
 * @property {number} completionPercentage - % of domain complete
 * @property {number} timeSpent - Total hours
 * @property {Date} startedAt - When user started
 * @property {Date} lastActivityAt - Most recent activity
 * @property {number} streak - Current day streak
 * @property {number} longestStreak - Best streak ever
 */

/**
 * Learning Velocity
 * @typedef {Object} LearningVelocity
 * @property {number} questionsPerDay - Average questions per day
 * @property {number} accuracyTrend - Accuracy improvement (percentage points/week)
 * @property {number} timePerQuestion - Average minutes per question
 * @property {number} completionRate - Estimated days to complete domain
 */

/**
 * Learning Insight
 * @typedef {Object} LearningInsight
 * @property {string} type - 'strength' | 'weakness' | 'recommendation' | 'milestone'
 * @property {string} title - Title of insight
 * @property {string} description - Detailed description
 * @property {string} icon - Icon/emoji
 * @property {number} priority - 0-100 priority score
 */

const analyticsService = {
  /**
   * Track user activity
   * @param {number} domainId - Domain ID
   * @param {string} activityType - Type of activity
   * @param {Object} metrics - Activity metrics
   * @returns {Activity} Activity record
   */
  trackActivity(domainId, activityType, metrics = {}) {
    return {
      domainId,
      activityType,
      timestamp: new Date(),
      metrics: {
        questionsAttempted: metrics.questionsAttempted || 0,
        questionsCorrect: metrics.questionsCorrect || 0,
        timeSpent: metrics.timeSpent || 0, // minutes
        difficulty: metrics.difficulty || 'medium',
        ...metrics
      },
      timeSpent: metrics.timeSpent || 0
    }
  },

  /**
   * Calculate progress metrics for a domain
   * @param {number} domainId - Domain ID
   * @param {Activity[]} activities - User activities
   * @param {Date} startedAt - When user started
   * @returns {ProgressMetrics} Progress metrics
   */
  calculateProgressMetrics(domainId, activities, startedAt) {
    const domainActivities = activities.filter(a => a.domainId === domainId)

    let totalQuestions = 0
    let correctAnswers = 0
    let totalTimeSpent = 0

    domainActivities.forEach(activity => {
      if (activity.metrics.questionsAttempted) {
        totalQuestions += activity.metrics.questionsAttempted
      }
      if (activity.metrics.questionsCorrect) {
        correctAnswers += activity.metrics.questionsCorrect
      }
      if (activity.metrics.timeSpent) {
        totalTimeSpent += activity.metrics.timeSpent
      }
    })

    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const lastActivity = domainActivities.length > 0
      ? domainActivities[domainActivities.length - 1].timestamp
      : startedAt

    // Calculate streak
    const streak = this._calculateStreak(domainActivities)
    const longestStreak = this._calculateLongestStreak(domainActivities)

    // Estimate completion (assumes 100 questions for 100% completion)
    const completionPercentage = Math.min(100, Math.round((totalQuestions / 100) * 100))

    return {
      domainId,
      totalQuestions,
      correctAnswers,
      accuracy,
      completionPercentage,
      timeSpent: Math.round(totalTimeSpent / 60 * 10) / 10, // Convert to hours
      startedAt,
      lastActivityAt: lastActivity,
      streak,
      longestStreak
    }
  },

  /**
   * Calculate learning velocity
   * @param {ProgressMetrics} metrics - Progress metrics
   * @param {Activity[]} activities - User activities
   * @returns {LearningVelocity} Velocity metrics
   */
  calculateLearningVelocity(metrics, activities) {
    const domainActivities = activities.filter(a => a.domainId === metrics.domainId)

    // Questions per day
    const daysActive = this._getDaysActive(metrics.startedAt, metrics.lastActivityAt)
    const questionsPerDay = daysActive > 0
      ? Math.round((metrics.totalQuestions / daysActive) * 10) / 10
      : 0

    // Accuracy trend (improvement per week)
    const accuracyTrend = this._calculateAccuracyTrend(domainActivities)

    // Time per question
    const timePerQuestion = metrics.totalQuestions > 0
      ? Math.round((metrics.timeSpent * 60) / metrics.totalQuestions * 10) / 10
      : 0

    // Estimated days to complete (assuming 100 questions for 100%)
    const remainingQuestions = Math.max(0, 100 - metrics.totalQuestions)
    const completionRate = questionsPerDay > 0
      ? Math.ceil(remainingQuestions / questionsPerDay)
      : 0

    return {
      questionsPerDay,
      accuracyTrend,
      timePerQuestion,
      completionRate
    }
  },

  /**
   * Predict completion date
   * @param {ProgressMetrics} metrics - Progress metrics
   * @param {LearningVelocity} velocity - Learning velocity
   * @returns {Object} Completion prediction
   */
  predictCompletionDate(metrics, velocity) {
    const today = new Date()
    const currentDate = new Date(today)

    // Optimistic: assuming consistent high velocity
    const optimisticDays = Math.ceil(velocity.completionRate * 0.7)
    const optimisticDate = new Date(currentDate)
    optimisticDate.setDate(optimisticDate.getDate() + optimisticDays)

    // Realistic: based on current pace
    const realisticDate = new Date(currentDate)
    realisticDate.setDate(realisticDate.getDate() + velocity.completionRate)

    // Pessimistic: assuming slower pace
    const pessimisticDays = Math.ceil(velocity.completionRate * 1.5)
    const pessimisticDate = new Date(currentDate)
    pessimisticDate.setDate(pessimisticDate.getDate() + pessimisticDays)

    return {
      optimisticDate,
      realisticDate,
      pessimisticDate,
      optimisticDays,
      realisticDays: velocity.completionRate,
      pessimisticDays,
      completionPercentage: metrics.completionPercentage,
      remainingQuestions: Math.max(0, 100 - metrics.totalQuestions)
    }
  },

  /**
   * Generate learning insights
   * @param {ProgressMetrics} metrics - Progress metrics
   * @param {LearningVelocity} velocity - Learning velocity
   * @returns {LearningInsight[]} Array of insights
   */
  generateInsights(metrics, velocity) {
    const insights = []

    // Strength: High accuracy
    if (metrics.accuracy >= 85) {
      insights.push({
        type: 'strength',
        title: '🌟 优秀表现',
        description: `你在此学科中的正确率为 ${metrics.accuracy}%，表现优秀！`,
        icon: '⭐',
        priority: 100
      })
    }

    // Weakness: Low accuracy
    if (metrics.accuracy < 50 && metrics.totalQuestions >= 20) {
      insights.push({
        type: 'weakness',
        title: '📉 需要改进',
        description: `你的正确率较低（${metrics.accuracy}%），建议复习基础概念`,
        icon: '💡',
        priority: 90
      })
    }

    // Recommendation: Improve pace
    if (velocity.questionsPerDay < 2 && metrics.completionPercentage < 50) {
      insights.push({
        type: 'recommendation',
        title: '⚡ 加快学习进度',
        description: `目前每天平均 ${velocity.questionsPerDay} 道题，建议增加每日学习时间`,
        icon: '🚀',
        priority: 80
      })
    }

    // Recommendation: Maintain streak
    if (metrics.streak >= 7) {
      insights.push({
        type: 'milestone',
        title: '🔥 保持连续学习',
        description: `已连续学习 ${metrics.streak} 天，坚持就是胜利！`,
        icon: '🎯',
        priority: 70
      })
    }

    // Strength: Quick learner
    if (velocity.timePerQuestion < 2) {
      insights.push({
        type: 'strength',
        title: '⚡ 学习效率高',
        description: `平均每题 ${velocity.timePerQuestion} 分钟，效率很高！`,
        icon: '✨',
        priority: 60
      })
    }

    // Recommendation: Complete domain
    if (metrics.completionPercentage >= 80 && metrics.completionPercentage < 100) {
      insights.push({
        type: 'recommendation',
        title: '🎯 即将完成',
        description: `只剩 ${Math.max(0, 100 - metrics.totalQuestions)} 道题，冲刺吧！`,
        icon: '🏁',
        priority: 85
      })
    }

    // Milestone: Accuracy improvement
    if (velocity.accuracyTrend > 5) {
      insights.push({
        type: 'milestone',
        title: '📈 进步明显',
        description: `最近准确率提升 ${Math.round(velocity.accuracyTrend)}% 每周，继续努力！`,
        icon: '📊',
        priority: 65
      })
    }

    // Recommendation: Review weak areas
    if (metrics.accuracy < 70 && metrics.accuracy > 0 && metrics.totalQuestions >= 30) {
      insights.push({
        type: 'recommendation',
        title: '🔍 针对性复习',
        description: '建议集中复习易错题，加深理解',
        icon: '📚',
        priority: 75
      })
    }

    return insights.sort((a, b) => b.priority - a.priority).slice(0, 5)
  },

  /**
   * Get domain statistics summary
   * @param {ProgressMetrics[]} allMetrics - All domain metrics
   * @returns {Object} Summary statistics
   */
  getDomainStatisticsSummary(allMetrics) {
    const totalDomains = allMetrics.length
    const completedDomains = allMetrics.filter(m => m.completionPercentage === 100).length
    const totalQuestions = allMetrics.reduce((sum, m) => sum + m.totalQuestions, 0)
    const totalCorrect = allMetrics.reduce((sum, m) => sum + m.correctAnswers, 0)
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    const totalHours = Math.round(allMetrics.reduce((sum, m) => sum + m.timeSpent, 0) * 10) / 10

    const averageCompletion = totalDomains > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + m.completionPercentage, 0) / totalDomains)
      : 0

    const maxStreak = Math.max(...allMetrics.map(m => m.streak), 0)
    const totalStreak = allMetrics.reduce((sum, m) => sum + m.streak, 0)

    return {
      totalDomains,
      completedDomains,
      completionRate: totalDomains > 0 ? Math.round((completedDomains / totalDomains) * 100) : 0,
      totalQuestions,
      totalCorrect,
      overallAccuracy,
      totalHours,
      averageCompletion,
      maxStreak,
      averageStreak: allMetrics.length > 0 ? Math.round(totalStreak / allMetrics.length) : 0
    }
  },

  /**
   * Calculate weekly statistics
   * @param {Activity[]} activities - User activities
   * @param {number} weeks - Number of weeks to analyze
   * @returns {Object[]} Weekly data
   */
  calculateWeeklyStats(activities, weeks = 4) {
    const weeklyData = []
    const today = new Date()

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - (7 * i + 6))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekActivities = activities.filter(a => {
        const aDate = new Date(a.timestamp)
        return aDate >= weekStart && aDate <= weekEnd
      })

      const questionsAttempted = weekActivities.reduce((sum, a) => sum + (a.metrics.questionsAttempted || 0), 0)
      const questionsCorrect = weekActivities.reduce((sum, a) => sum + (a.metrics.questionsCorrect || 0), 0)
      const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0
      const timeSpent = Math.round(weekActivities.reduce((sum, a) => sum + (a.metrics.timeSpent || 0), 0) / 60 * 10) / 10

      weeklyData.push({
        week: `第 ${weeks - i} 周`,
        startDate: weekStart,
        questionsAttempted,
        questionsCorrect,
        accuracy,
        timeSpent // hours
      })
    }

    return weeklyData
  },

  /**
   * Get top performing domains
   * @param {ProgressMetrics[]} allMetrics - All metrics
   * @param {number} count - Number to return
   * @returns {ProgressMetrics[]} Top domains
   */
  getTopPerformingDomains(allMetrics, count = 5) {
    return [...allMetrics]
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, count)
  },

  /**
   * Get domains needing attention
   * @param {ProgressMetrics[]} allMetrics - All metrics
   * @param {number} count - Number to return
   * @returns {ProgressMetrics[]} Domains needing work
   */
  getDomainsNeedingAttention(allMetrics, count = 5) {
    return [...allMetrics]
      .filter(m => m.totalQuestions > 0 && m.completionPercentage < 100)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, count)
  },

  /**
   * Calculate streak
   * @private
   */
  _calculateStreak(activities) {
    if (activities.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    const activityDates = new Set()
    sortedActivities.forEach(a => {
      const date = new Date(a.timestamp)
      date.setHours(0, 0, 0, 0)
      activityDates.add(date.getTime())
    })

    let streak = 0
    let currentDate = new Date(today)

    while (activityDates.has(currentDate.getTime())) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  },

  /**
   * Calculate longest streak
   * @private
   */
  _calculateLongestStreak(activities) {
    if (activities.length === 0) return 0

    const activityDates = new Set()
    activities.forEach(a => {
      const date = new Date(a.timestamp)
      date.setHours(0, 0, 0, 0)
      activityDates.add(date.getTime())
    })

    const sortedDates = Array.from(activityDates).sort((a, b) => a - b)

    let longestStreak = 1
    let currentStreak = 1

    for (let i = 1; i < sortedDates.length; i++) {
      const dayDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24)
      if (dayDiff === 1) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }

    return longestStreak
  },

  /**
   * Calculate days active
   * @private
   */
  _getDaysActive(startDate, lastDate) {
    const start = new Date(startDate)
    const last = new Date(lastDate)
    const diffTime = Math.abs(last - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDays)
  },

  /**
   * Calculate accuracy trend
   * @private
   */
  _calculateAccuracyTrend(activities) {
    if (activities.length < 2) return 0

    const sortedActivities = [...activities].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    const midPoint = Math.floor(sortedActivities.length / 2)
    const firstHalf = sortedActivities.slice(0, midPoint)
    const secondHalf = sortedActivities.slice(midPoint)

    const calculateAccuracy = (acts) => {
      let total = 0
      let correct = 0
      acts.forEach(a => {
        total += a.metrics.questionsAttempted || 0
        correct += a.metrics.questionsCorrect || 0
      })
      return total > 0 ? (correct / total) * 100 : 0
    }

    const firstAccuracy = calculateAccuracy(firstHalf)
    const secondAccuracy = calculateAccuracy(secondHalf)

    const trend = secondAccuracy - firstAccuracy
    return Math.round(trend * 10) / 10
  }
}

export default analyticsService
