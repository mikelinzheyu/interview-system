/**
 * Enhanced Wrong Answers Composable
 * Integrates all services for wrong answer management
 */

import { ref, computed } from 'vue'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import SpacedRepetitionService from '@/services/spacedRepetitionService'
import AIAnalysisService from '@/services/aiAnalysisService'
import ReviewPlanService from '@/services/reviewPlanService'

export function useWrongAnswersEnhanced() {
  const store = useWrongAnswersStore()

  // State
  const wrongAnswers = ref([])
  const statistics = ref(null)
  const reviewPlan = ref(null)
  const loading = ref(false)
  const sortBy = ref('priority')
  const filterStatus = ref('')

  // Computed - 增强的列表
  const enhancedWrongAnswers = computed(() => {
    let result = [...wrongAnswers.value]

    // 应用过滤
    if (filterStatus.value) {
      result = result.filter(item => item.reviewStatus === filterStatus.value)
    }

    // 应用排序
    switch (sortBy.value) {
      case 'priority':
        result = SpacedRepetitionService.sortByPriority(result)
        break
      case 'recent':
        result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        break
      case 'difficulty':
        result.sort((a, b) => {
          const scores = { easy: 1, medium: 2, hard: 3 }
          return (scores[b.difficulty] || 0) - (scores[a.difficulty] || 0)
        })
        break
      case 'nextReview':
        result.sort((a, b) => new Date(a.nextReviewTime) - new Date(b.nextReviewTime))
        break
    }

    return result
  })

  // Computed - 统计数据
  const enhancedStats = computed(() => {
    if (!wrongAnswers.value || wrongAnswers.value.length === 0) {
      return {}
    }
    return SpacedRepetitionService.generateStatistics(wrongAnswers.value)
  })

  // Computed - 今日任务
  const todayTasks = computed(() => {
    if (!reviewPlan.value) return []
    return ReviewPlanService.getTodayTasks(reviewPlan.value)
  })

  // Computed - 逾期项目
  const overdueItems = computed(() => {
    return enhancedWrongAnswers.value.filter(item => {
      const priority = SpacedRepetitionService.calculatePriority(item)
      return priority >= SpacedRepetitionService.PRIORITY_LEVELS.CRITICAL
    })
  })

  // Methods
  const loadWrongAnswers = async () => {
    loading.value = true
    try {
      wrongAnswers.value = await store.fetchWrongAnswers()
      statistics.value = await store.fetchStatistics()
      return wrongAnswers.value
    } finally {
      loading.value = false
    }
  }

  const generateReviewPlan = async (preferences = {}) => {
    loading.value = true
    try {
      reviewPlan.value = await ReviewPlanService.generateReviewPlan(
        wrongAnswers.value,
        preferences
      )
      return reviewPlan.value
    } finally {
      loading.value = false
    }
  }

  const getItemPriority = (item) => {
    return SpacedRepetitionService.calculatePriority(item)
  }

  const getPriorityLabel = (item) => {
    const priority = getItemPriority(item)
    return SpacedRepetitionService.getPriorityLevel(priority)
  }

  const getMasteryScore = (item) => {
    return SpacedRepetitionService.calculateMasteryScore(item)
  }

  const analyzeWrongAnswer = async (wrongAnswer) => {
    return AIAnalysisService.analyzeWrongAnswer(wrongAnswer)
  }

  const getRecommendedDailyCount = (hoursPerDay = 1) => {
    if (!enhancedStats.value || !enhancedStats.value.total) return 10
    return SpacedRepetitionService.getRecommendedDailyCount(
      enhancedStats.value,
      hoursPerDay
    )
  }

  const getDueForReview = (beforeDate = new Date()) => {
    return SpacedRepetitionService.getDueForReview(wrongAnswers.value, beforeDate)
  }

  const setSort = (sortOption) => {
    sortBy.value = sortOption
  }

  const setFilter = (status) => {
    filterStatus.value = status
  }

  return {
    // State
    wrongAnswers,
    statistics,
    reviewPlan,
    loading,
    sortBy,
    filterStatus,

    // Computed
    enhancedWrongAnswers,
    enhancedStats,
    todayTasks,
    overdueItems,

    // Methods
    loadWrongAnswers,
    generateReviewPlan,
    getItemPriority,
    getPriorityLabel,
    getMasteryScore,
    analyzeWrongAnswer,
    getRecommendedDailyCount,
    getDueForReview,
    setSort,
    setFilter
  }
}
