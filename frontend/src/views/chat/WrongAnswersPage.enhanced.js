/**
 * WrongAnswersPage.vue 增强脚本
 * 整合SpacedRepetitionService和优先级显示
 *
 * 在WrongAnswersPage.vue的script setup中添加以下内容
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { useWrongAnswersEnhanced } from '@/composables/useWrongAnswersEnhanced'
import SpacedRepetitionService from '@/services/spacedRepetitionService'
import ReviewPlanService from '@/services/reviewPlanService'
import AIAnalysisService from '@/services/aiAnalysisService'

export const createEnhancedWrongAnswersPage = () => {
  const router = useRouter()
  const store = useWrongAnswersStore()
  const enhanced = useWrongAnswersEnhanced()

  // 额外状态
  const sortByPriority = ref(false)
  const showPriorityInfo = ref(false)
  const selectedAnswerForAnalysis = ref(null)
  const analysisLoading = ref(false)

  // 增强的统计数据 - 包含优先级信息
  const enhancedStats = computed(() => {
    const baseStats = enhanced.enhancedStats
    return {
      ...baseStats,
      overduePercentage: baseStats.total > 0 
        ? Math.round((baseStats.overdueCount / baseStats.total) * 100) 
        : 0,
      averageMasteryLabel: getMasteryLabel(baseStats.averageMastery)
    }
  })

  // 增强的错题列表 - 添加优先级和颜色
  const enhancedWrongAnswersWithPriority = computed(() => {
    let items = enhanced.enhancedWrongAnswers.map(item => ({
      ...item,
      priority: SpacedRepetitionService.calculatePriority(item),
      mastery: SpacedRepetitionService.calculateMasteryScore(item),
      masteryStatus: SpacedRepetitionService.getMasteryStatus(
        SpacedRepetitionService.calculateMasteryScore(item)
      ),
      needsReviewToday: SpacedRepetitionService.needsReviewToday(item),
      priorityLabel: getPriorityLabel(
        SpacedRepetitionService.calculatePriority(item)
      ),
      priorityColor: getPriorityColor(
        SpacedRepetitionService.calculatePriority(item)
      )
    }))

    // 如果启用优先级排序，应用排序
    if (sortByPriority.value) {
      items = items.sort((a, b) => b.priority - a.priority)
    }

    return items
  })

  // 获取优先级标签
  const getPriorityLabel = (priority) => {
    const level = SpacedRepetitionService.getPriorityLevel(priority)
    const labels = {
      CRITICAL: '🔴 必须复习',
      HIGH: '🟡 应该复习',
      MEDIUM: '🔵 建议复习',
      LOW: '🟢 可选复习'
    }
    return labels[level] || '未知'
  }

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    const level = SpacedRepetitionService.getPriorityLevel(priority)
    const colors = {
      CRITICAL: '#f56c6c',
      HIGH: '#e6a23c',
      MEDIUM: '#409eff',
      LOW: '#67c23a'
    }
    return colors[level] || '#909399'
  }

  // 获取掌握度标签
  const getMasteryLabel = (score) => {
    if (score >= 85) return '已掌握'
    if (score >= 60) return '复习中'
    return '未掌握'
  }

  // 切换优先级排序
  const togglePrioritySorting = () => {
    sortByPriority.value = !sortByPriority.value
  }

  // 生成AI复习计划
  const generateAIPlan = async () => {
    try {
      const plan = await ReviewPlanService.generateReviewPlan(
        enhanced.wrongAnswers.value,
        {
          hoursPerDay: 2,
          daysAvailable: 30
        }
      )
      store.reviewPlan = plan
      router.push({
        name: 'ReviewMode',
        query: { planId: plan.planId }
      })
    } catch (error) {
      console.error('Failed to generate AI plan:', error)
    }
  }

  // 分析单个错题
  const analyzeWrongAnswer = async (wrongAnswer) => {
    selectedAnswerForAnalysis.value = wrongAnswer
    analysisLoading.value = true
    try {
      const analysis = await AIAnalysisService.analyzeWrongAnswer(wrongAnswer)
      selectedAnswerForAnalysis.value = {
        ...wrongAnswer,
        analysis
      }
    } catch (error) {
      console.error('Failed to analyze:', error)
    } finally {
      analysisLoading.value = false
    }
  }

  // 获取今日任务
  const getTodayTasksCount = computed(() => {
    return enhanced.todayTasks.value.length
  })

  // 获取逾期项目
  const getOverdueAnswers = computed(() => {
    return enhanced.overdueItems.value
  })

  // 推荐每日复习数
  const getRecommendedDailyCount = computed(() => {
    return enhanced.getRecommendedDailyCount(2)
  })

  return {
    // Computed
    enhancedStats,
    enhancedWrongAnswersWithPriority,
    getTodayTasksCount,
    getOverdueAnswers,
    getRecommendedDailyCount,

    // State
    sortByPriority,
    showPriorityInfo,
    selectedAnswerForAnalysis,
    analysisLoading,

    // Methods
    togglePrioritySorting,
    generateAIPlan,
    analyzeWrongAnswer,
    getPriorityLabel,
    getPriorityColor,
    getMasteryLabel
  }
}

export default {
  install(app) {
    // 可作为Vue插件安装
  }
}
