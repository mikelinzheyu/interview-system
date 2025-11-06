import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { UserProfile, RecommendationEngine } from '@/utils/recommendationAlgorithm'
import disciplinesData from '@/data/disciplines-complete.json'

export const useRecommendationStore = defineStore('recommendations', () => {
  // 状态
  const userProfile = ref(null)
  const recommendations = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const engine = new RecommendationEngine(disciplinesData)

  // 用户兴趣评估表数据
  const assessmentForm = ref({
    disciplines: {
      philosophy: 0,
      economics: 0,
      law: 0,
      education: 0,
      literature: 0,
      history: 0,
      science: 0,
      engineering: 0,
      agriculture: 0,
      medicine: 0,
      military: 0,
      management: 0,
      art: 0
    },
    abilities: {
      analytical: 0,
      creative: 0,
      communication: 0,
      practical: 0,
      learning: 0
    },
    careerGoals: {
      highSalary: false,
      techExpert: false,
      management: false,
      entrepreneurship: false,
      socialContribution: false
    },
    preferences: {
      region: '',
      minSalary: 15000,
      workLife: '平衡'
    }
  })

  // 计算属性
  const hasRecommendations = computed(() => recommendations.value.length > 0)
  const topRecommendation = computed(() => recommendations.value[0] || null)
  const recommendationStats = computed(() => ({
    total: recommendations.value.length,
    averageScore: recommendations.value.length > 0
      ? Math.round((recommendations.value.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.value.length) * 100) / 100
      : 0
  }))

  /**
   * 执行推荐
   */
  function performRecommendation(formData) {
    isLoading.value = true
    error.value = null

    try {
      // 创建用户数据，只提交已选择的职业目标
      const careerGoals = {}
      Object.keys(formData.careerGoals).forEach(goal => {
        if (formData.careerGoals[goal]) {
          careerGoals[goal] = true
        }
      })

      const userData = {
        userId: `user_${Date.now()}`,
        disciplines: formData.disciplines,
        abilities: formData.abilities,
        careerGoals: careerGoals,
        preferences: formData.preferences
      }

      // 创建用户档案
      userProfile.value = new UserProfile(userData)

      // 执行推荐
      recommendations.value = engine.recommend(userProfile.value)

      // 添加推荐理由
      recommendations.value.forEach(rec => {
        rec.reasons = engine.getRecommendationReasons(userProfile.value, rec)
      })

      isLoading.value = false
    } catch (err) {
      error.value = err.message
      isLoading.value = false
    }
  }

  /**
   * 获取推荐详情
   */
  function getRecommendationDetails(majorCode) {
    if (!userProfile.value) return null

    const allMajors = engine.getAllMajors()
    const major = allMajors.find(m => m.code === majorCode)

    if (!major) return null

    return {
      ...major,
      matchScore: engine.calculateMatchScore(userProfile.value, major),
      matchDetails: engine.getMatchDetails(userProfile.value, major),
      reasons: engine.getRecommendationReasons(userProfile.value, major)
    }
  }

  /**
   * 对比两个专业
   */
  function compareSpecialties(major1Code, major2Code) {
    if (!userProfile.value) return null

    try {
      return engine.compareSpecialties(userProfile.value, major1Code, major2Code)
    } catch (err) {
      error.value = err.message
      return null
    }
  }

  /**
   * 重置推荐
   */
  function resetRecommendation() {
    userProfile.value = null
    recommendations.value = []
    error.value = null

    // 重置表单
    assessmentForm.value = {
      disciplines: {
        philosophy: 0,
        economics: 0,
        law: 0,
        education: 0,
        literature: 0,
        history: 0,
        science: 0,
        engineering: 0,
        agriculture: 0,
        medicine: 0,
        military: 0,
        management: 0,
        art: 0
      },
      abilities: {
        analytical: 0,
        creative: 0,
        communication: 0,
        practical: 0,
        learning: 0
      },
      careerGoals: {
        highSalary: false,
        techExpert: false,
        management: false,
        entrepreneurship: false,
        socialContribution: false
      },
      preferences: {
        region: '',
        minSalary: 15000,
        workLife: '平衡'
      }
    }
  }

  /**
   * 保存推荐结果
   */
  function saveRecommendations() {
    if (!userProfile.value || !recommendations.value.length) return

    const result = {
      timestamp: new Date().toISOString(),
      userProfile: userProfile.value,
      recommendations: recommendations.value.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        matchScore: r.matchScore,
        reasons: r.reasons
      }))
    }

    // 保存到localStorage
    localStorage.setItem('recommendations_history', JSON.stringify(result))
  }

  /**
   * 获取保存的推荐历史
   */
  function getSavedRecommendations() {
    const saved = localStorage.getItem('recommendations_history')
    return saved ? JSON.parse(saved) : null
  }

  /**
   * 分享推荐结果
   */
  function shareRecommendations(platform) {
    if (!topRecommendation.value) return

    const text = `我根据兴趣和能力测评，得到最佳专业推荐：${topRecommendation.value.name}（匹配度：${(topRecommendation.value.matchScore * 100).toFixed(0)}%）`

    const shareLinks = {
      wechat: `weixin://`,
      qq: `mqqapi://`,
      weibo: `sinaweibo://`
    }

    // 实际分享逻辑
    console.log(`分享到${platform}: ${text}`)
  }

  /**
   * 导出推荐结果为PDF
   */
  function exportAsPDF() {
    if (!recommendations.value.length) return

    // 调用PDF导出库
    console.log('导出推荐报告为PDF...')
  }

  return {
    // 状态
    userProfile,
    recommendations,
    isLoading,
    error,
    assessmentForm,

    // 计算属性
    hasRecommendations,
    topRecommendation,
    recommendationStats,

    // 方法
    performRecommendation,
    getRecommendationDetails,
    compareSpecialties,
    resetRecommendation,
    saveRecommendations,
    getSavedRecommendations,
    shareRecommendations,
    exportAsPDF
  }
})
