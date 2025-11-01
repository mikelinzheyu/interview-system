/**
 * 错题数据分析组合式函数 - Wrong Answers Analytics Composable
 * 提供本地分析、推荐和统计功能
 */

import { ref, computed } from 'vue'
import messageAIRecommendationService from '@/services/messageAIRecommendationService'

export const useWrongAnswersAnalytics = () => {
  // 状态
  const recommendations = ref([])
  const weaknessAnalysis = ref(null)
  const performanceMetrics = ref(null)
  const loading = ref(false)

  /**
   * 生成分析报告
   * @param {Array<Object>} wrongAnswers - 错题数据
   * @returns {Object}
   */
  const generateAnalysisReport = (wrongAnswers) => {
    if (!wrongAnswers || wrongAnswers.length === 0) {
      return null
    }

    const report = {
      timestamp: new Date().toISOString(),
      totalRecords: wrongAnswers.length,
      summary: generateSummary(wrongAnswers),
      recommendations: generateRecommendations(wrongAnswers),
      weaknesses: analyzeWeaknesses(wrongAnswers),
      metrics: calculatePerformanceMetrics(wrongAnswers),
      distributions: analyzeDistributions(wrongAnswers),
      timeline: generateTimeline(wrongAnswers)
    }

    return report
  }

  /**
   * 生成摘要统计
   * @param {Array<Object>} wrongAnswers
   * @returns {Object}
   */
  const generateSummary = (wrongAnswers) => {
    const total = wrongAnswers.length
    const mastered = wrongAnswers.filter(w => w.reviewStatus === 'mastered').length
    const reviewing = wrongAnswers.filter(w => w.reviewStatus === 'reviewing').length
    const unreviewed = wrongAnswers.filter(w => w.reviewStatus === 'unreveiwed').length

    return {
      totalWrongAnswers: total,
      masteredCount: mastered,
      reviewingCount: reviewing,
      unreviewedCount: unreviewed,
      masteryRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
      avgWrongCount: total > 0 ? (wrongAnswers.reduce((sum, w) => sum + (w.wrongCount || 0), 0) / total).toFixed(2) : 0,
      avgCorrectCount: total > 0 ? (wrongAnswers.reduce((sum, w) => sum + (w.correctCount || 0), 0) / total).toFixed(2) : 0,
      totalWrongAttempts: wrongAnswers.reduce((sum, w) => sum + (w.wrongCount || 0), 0),
      totalCorrectAttempts: wrongAnswers.reduce((sum, w) => sum + (w.correctCount || 0), 0)
    }
  }

  /**
   * 生成推荐列表
   * @param {Array<Object>} wrongAnswers
   * @returns {Array<Object>}
   */
  const generateRecommendations = (wrongAnswers) => {
    return messageAIRecommendationService.generateLocalRecommendations(wrongAnswers, 10).map((rec, idx) => ({
      ...rec,
      recommendationScore: calculateRecommendationScore(rec),
      reason: getRecommendationReason(rec),
      actionItems: generateActionItems(rec)
    }))
  }

  /**
   * 计算推荐分数
   * @param {Object} record
   * @returns {number}
   */
  const calculateRecommendationScore = (record) => {
    let score = 0
    score += (record.wrongCount || 0) * 2
    if (record.reviewStatus === 'unreveiwed') score += 5
    else if (record.reviewStatus === 'reviewing') score += 3
    if (record.difficulty === 'hard') score += 3
    else if (record.difficulty === 'medium') score += 1
    if (record.nextReviewTime && new Date(record.nextReviewTime) <= new Date()) {
      score += 10
    }
    score += (record.reviewPriority || 0) / 10
    return Math.round(score)
  }

  /**
   * 获取推荐原因
   * @param {Object} record
   * @returns {Array<string>}
   */
  const getRecommendationReason = (record) => {
    const reasons = []
    if (record.reviewStatus === 'unreveiwed') reasons.push('新错题')
    if (record.nextReviewTime && new Date(record.nextReviewTime) <= new Date()) reasons.push('应复习')
    if (record.wrongCount >= 3) reasons.push('重点题')
    if (record.difficulty === 'hard') reasons.push('难题')
    return reasons.length > 0 ? reasons : ['推荐']
  }

  /**
   * 生成行动项
   * @param {Object} record
   * @returns {Array<string>}
   */
  const generateActionItems = (record) => {
    const items = []
    if (record.reviewStatus === 'unreveiwed') {
      items.push('这是你的一个新错题，建议立即复习')
    }
    if (record.wrongCount >= 3) {
      items.push(`你已经在这道题上出错${record.wrongCount}次，需要重点关注`)
    }
    if (record.difficulty === 'hard') {
      items.push('这是一道难题，理解清楚它会显著提升你的能力')
    }
    if (record.correctCount === 0) {
      items.push('你还没有正确答对过这道题，建议深入学习')
    }
    return items
  }

  /**
   * 分析弱点
   * @param {Array<Object>} wrongAnswers
   * @returns {Object}
   */
  const analyzeWeaknesses = (wrongAnswers) => {
    const weaknessData = messageAIRecommendationService.analyzeLocalWeaknesses(wrongAnswers)
    return {
      ...weaknessData,
      criticalAreasCount: weaknessData.criticalAreas.length,
      improvementPotential: calculateImprovementPotential(weaknessData),
      studyPriorities: generateStudyPriorities(weaknessData)
    }
  }

  /**
   * 计算改进潜力
   * @param {Object} weaknessData
   * @returns {number}
   */
  const calculateImprovementPotential = (weaknessData) => {
    if (weaknessData.topWeaknesses.length === 0) return 0
    const avgImprovement = weaknessData.topWeaknesses.reduce((sum, w) => sum + (100 - w.masteryRate), 0) / weaknessData.topWeaknesses.length
    return Math.round(avgImprovement)
  }

  /**
   * 生成学习优先级
   * @param {Object} weaknessData
   * @returns {Array<Object>}
   */
  const generateStudyPriorities = (weaknessData) => {
    return weaknessData.criticalAreas.slice(0, 5).map((area, idx) => ({
      priority: idx + 1,
      name: area.name,
      masteryRate: area.masteryRate,
      gap: 100 - area.masteryRate,
      recommendedStudyHours: estimateStudyHours(100 - area.masteryRate),
      urgency: getUrgencyLevel(idx)
    }))
  }

  /**
   * 预估学习时间
   * @param {number} gap
   * @returns {number}
   */
  const estimateStudyHours = (gap) => {
    if (gap < 20) return 1
    if (gap < 40) return 2
    if (gap < 60) return 4
    if (gap < 80) return 6
    return 10
  }

  /**
   * 获取紧急级别
   * @param {number} index
   * @returns {string}
   */
  const getUrgencyLevel = (index) => {
    if (index === 0) return '紧急'
    if (index === 1) return '高'
    if (index === 2) return '中'
    return '低'
  }

  /**
   * 计算性能指标
   * @param {Array<Object>} wrongAnswers
   * @returns {Object}
   */
  const calculatePerformanceMetrics = (wrongAnswers) => {
    const total = wrongAnswers.length
    if (total === 0) return null

    const totalAttempts = wrongAnswers.reduce((sum, w) => sum + (w.wrongCount || 0) + (w.correctCount || 0), 0)
    const correctAttempts = wrongAnswers.reduce((sum, w) => sum + (w.correctCount || 0), 0)
    const masteredCount = wrongAnswers.filter(w => w.reviewStatus === 'mastered').length

    return {
      learningEfficiency: totalAttempts > 0 ? Math.round((masteredCount / (totalAttempts / 10)) * 100) : 0,
      completionRate: Math.round((wrongAnswers.filter(w => w.reviewStatus !== 'unreveiwed').length / total) * 100),
      retentionRate: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      avgReviewCycle: estimateAverageReviewCycle(wrongAnswers),
      consistencyScore: calculateConsistencyScore(wrongAnswers),
      progressTrend: calculateProgressTrend(wrongAnswers)
    }
  }

  /**
   * 预估平均复习周期
   * @param {Array<Object>} wrongAnswers
   * @returns {number}
   */
  const estimateAverageReviewCycle = (wrongAnswers) => {
    const reviewed = wrongAnswers.filter(w => w.reviewStatus !== 'unreveiwed')
    if (reviewed.length === 0) return 0

    const avgCycle = reviewed.reduce((sum, w) => {
      const attempts = (w.wrongCount || 0) + (w.correctCount || 0)
      return sum + (attempts > 0 ? 30 / attempts : 7)
    }, 0) / reviewed.length

    return Math.round(avgCycle)
  }

  /**
   * 计算一致性分数
   * @param {Array<Object>} wrongAnswers
   * @returns {number}
   */
  const calculateConsistencyScore = (wrongAnswers) => {
    const daysDifference = (wrongAnswers[0]?.updatedAt ? new Date(wrongAnswers[0].updatedAt) : new Date()) -
                          (wrongAnswers[wrongAnswers.length - 1]?.updatedAt ? new Date(wrongAnswers[wrongAnswers.length - 1].updatedAt) : new Date())
    const days = Math.ceil(daysDifference / (1000 * 60 * 60 * 24)) || 1

    // 复习频率：复习数 / 天数
    const reviewFrequency = wrongAnswers.reduce((sum, w) => sum + ((w.wrongCount || 0) + (w.correctCount || 0)), 0) / days

    // 分数：每天的复习数越多，一致性越高
    if (reviewFrequency >= 5) return 100
    if (reviewFrequency >= 3) return 80
    if (reviewFrequency >= 1) return 60
    return 40
  }

  /**
   * 计算进度趋势
   * @param {Array<Object>} wrongAnswers
   * @returns {string}
   */
  const calculateProgressTrend = (wrongAnswers) => {
    const recent = wrongAnswers.slice(0, Math.ceil(wrongAnswers.length / 3))
    const older = wrongAnswers.slice(-Math.ceil(wrongAnswers.length / 3))

    const recentMasteryRate = recent.filter(w => w.reviewStatus === 'mastered').length / recent.length
    const olderMasteryRate = older.filter(w => w.reviewStatus === 'mastered').length / older.length

    const improvement = recentMasteryRate - olderMasteryRate
    if (improvement > 0.1) return '快速上升'
    if (improvement > 0) return '稳步提升'
    if (improvement > -0.1) return '基本稳定'
    return '有所下降'
  }

  /**
   * 分析分布
   * @param {Array<Object>} wrongAnswers
   * @returns {Object}
   */
  const analyzeDistributions = (wrongAnswers) => {
    const sourceDistribution = {}
    const difficultyDistribution = {}
    const statusDistribution = {}

    wrongAnswers.forEach(w => {
      // 来源分布
      sourceDistribution[w.source] = (sourceDistribution[w.source] || 0) + 1
      // 难度分布
      difficultyDistribution[w.difficulty] = (difficultyDistribution[w.difficulty] || 0) + 1
      // 状态分布
      statusDistribution[w.reviewStatus] = (statusDistribution[w.reviewStatus] || 0) + 1
    })

    return {
      source: sourceDistribution,
      difficulty: difficultyDistribution,
      status: statusDistribution
    }
  }

  /**
   * 生成时间轴
   * @param {Array<Object>} wrongAnswers
   * @returns {Array<Object>}
   */
  const generateTimeline = (wrongAnswers) => {
    const sorted = [...wrongAnswers].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    return sorted.slice(0, 10).map(w => ({
      date: new Date(w.updatedAt).toLocaleDateString('zh-CN'),
      question: w.questionTitle,
      action: w.reviewStatus === 'mastered' ? '已掌握' : w.reviewStatus === 'reviewing' ? '复习中' : '新增',
      status: w.reviewStatus
    }))
  }

  return {
    // 状态
    recommendations,
    weaknessAnalysis,
    performanceMetrics,
    loading,

    // 方法
    generateAnalysisReport,
    generateSummary,
    generateRecommendations,
    analyzeWeaknesses,
    calculatePerformanceMetrics,
    analyzeDistributions,
    generateTimeline
  }
}

export default useWrongAnswersAnalytics
