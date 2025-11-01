/**
 * AI推荐系统服务 - AI Recommendation Service
 * 使用AI技术为用户推荐应该复习的问题和学习计划
 */

const API_BASE = '/api/v1/wrong-answers'

export const messageAIRecommendationService = {
  /**
   * 获取AI推荐的复习计划
   * @returns {Promise<Object>}
   */
  async getAIReviewPlan() {
    try {
      const response = await fetch(`${API_BASE}/ai/review-plan`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to get AI review plan')
      }

      return await response.json()
    } catch (error) {
      console.error('Get AI review plan error:', error)
      throw error
    }
  },

  /**
   * 获取推荐的学习路径
   * @param {string} learningGoal - 学习目标 (e.g., "javascript", "react", "database")
   * @returns {Promise<Object>}
   */
  async getRecommendedLearningPath(learningGoal) {
    try {
      const response = await fetch(`${API_BASE}/ai/learning-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          goal: learningGoal,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get recommended learning path')
      }

      return await response.json()
    } catch (error) {
      console.error('Get recommended learning path error:', error)
      throw error
    }
  },

  /**
   * 获取相似问题推荐
   * @param {number} recordId - 记录ID
   * @param {number} limit - 返回数量限制
   * @returns {Promise<Array>}
   */
  async getSimilarQuestions(recordId, limit = 5) {
    try {
      const response = await fetch(
        `${API_BASE}/${recordId}/similar-questions?limit=${limit}`,
        { method: 'GET' }
      )

      if (!response.ok) {
        throw new Error('Failed to get similar questions')
      }

      return await response.json()
    } catch (error) {
      console.error('Get similar questions error:', error)
      throw error
    }
  },

  /**
   * 获取弱点分析
   * @returns {Promise<Object>}
   */
  async analyzeWeaknesses() {
    try {
      const response = await fetch(`${API_BASE}/ai/weakness-analysis`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to analyze weaknesses')
      }

      return await response.json()
    } catch (error) {
      console.error('Analyze weaknesses error:', error)
      throw error
    }
  },

  /**
   * 获取个性化复习建议
   * @returns {Promise<Array>}
   */
  async getPersonalizedRecommendations() {
    try {
      const response = await fetch(`${API_BASE}/ai/personalized-recommendations`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to get personalized recommendations')
      }

      return await response.json()
    } catch (error) {
      console.error('Get personalized recommendations error:', error)
      throw error
    }
  },

  /**
   * 预测学习进度
   * @param {number} days - 预测天数
   * @returns {Promise<Object>}
   */
  async predictLearningProgress(days = 30) {
    try {
      const response = await fetch(`${API_BASE}/ai/predict-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          days,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to predict learning progress')
      }

      return await response.json()
    } catch (error) {
      console.error('Predict learning progress error:', error)
      throw error
    }
  },

  /**
   * 获取最优复习时间
   * @returns {Promise<Array>}
   */
  async getOptimalReviewTimes() {
    try {
      const response = await fetch(`${API_BASE}/ai/optimal-review-times`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to get optimal review times')
      }

      return await response.json()
    } catch (error) {
      console.error('Get optimal review times error:', error)
      throw error
    }
  },

  /**
   * 获取知识点难度预测
   * @param {Array<string>} knowledgePoints - 知识点列表
   * @returns {Promise<Array>}
   */
  async predictDifficulty(knowledgePoints) {
    try {
      const response = await fetch(`${API_BASE}/ai/predict-difficulty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          knowledgePoints,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to predict difficulty')
      }

      return await response.json()
    } catch (error) {
      console.error('Predict difficulty error:', error)
      throw error
    }
  },

  /**
   * 获取优化的复习计划
   * @param {Object} preferences - 用户偏好 {dailyMinutes, focusAreas, targetDate}
   * @returns {Promise<Object>}
   */
  async getOptimizedReviewPlan(preferences = {}) {
    try {
      const response = await fetch(`${API_BASE}/ai/optimized-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get optimized review plan')
      }

      return await response.json()
    } catch (error) {
      console.error('Get optimized review plan error:', error)
      throw error
    }
  },

  /**
   * 获取学习风格分析
   * @returns {Promise<Object>}
   */
  async analyzeLearningStyle() {
    try {
      const response = await fetch(`${API_BASE}/ai/learning-style`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('Failed to analyze learning style')
      }

      return await response.json()
    } catch (error) {
      console.error('Analyze learning style error:', error)
      throw error
    }
  },

  /**
   * 本地推荐算法 - 基于本地数据生成推荐
   * @param {Array<Object>} wrongAnswers - 错题数据
   * @param {number} topN - 返回前N条推荐
   * @returns {Array<Object>}
   */
  generateLocalRecommendations(wrongAnswers, topN = 5) {
    if (!wrongAnswers || wrongAnswers.length === 0) {
      return []
    }

    // 计算每个问题的优先级分数
    const scoredAnswers = wrongAnswers.map(answer => {
      let score = 0

      // 根据错题次数加权 (更多错误 = 更高优先级)
      score += (answer.wrongCount || 0) * 2

      // 根据复习状态加权
      if (answer.reviewStatus === 'unreveiwed') {
        score += 5
      } else if (answer.reviewStatus === 'reviewing') {
        score += 3
      }

      // 根据难度加权
      if (answer.difficulty === 'hard') {
        score += 3
      } else if (answer.difficulty === 'medium') {
        score += 1
      }

      // 根据下次复习时间加权 (越早应该复习 = 越高优先级)
      if (answer.nextReviewTime) {
        const daysUntilReview = Math.ceil(
          (new Date(answer.nextReviewTime) - new Date()) / (1000 * 60 * 60 * 24)
        )
        if (daysUntilReview <= 0) {
          score += 10 // 应该立即复习
        } else if (daysUntilReview <= 3) {
          score += 5
        }
      }

      // 根据优先级加权
      score += (answer.reviewPriority || 0) / 10

      return {
        ...answer,
        recommendationScore: score
      }
    })

    // 按分数降序排序并返回前N条
    return scoredAnswers
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, topN)
      .map(({ recommendationScore, ...rest }) => rest)
  },

  /**
   * 本地弱点分析 - 基于本地数据分析用户弱点
   * @param {Array<Object>} wrongAnswers - 错题数据
   * @returns {Object}
   */
  analyzeLocalWeaknesses(wrongAnswers) {
    if (!wrongAnswers || wrongAnswers.length === 0) {
      return {
        topWeaknesses: [],
        averageMasteryRate: 0,
        criticalAreas: []
      }
    }

    // 按知识点聚合
    const weaknessByKnowledge = {}

    wrongAnswers.forEach(answer => {
      const points = answer.knowledgePoints || []
      points.forEach(point => {
        if (!weaknessByKnowledge[point]) {
          weaknessByKnowledge[point] = {
            name: point,
            wrongCount: 0,
            correctCount: 0,
            totalAttempts: 0,
            difficulty: []
          }
        }

        const wp = weaknessByKnowledge[point]
        wp.wrongCount += answer.wrongCount || 0
        wp.correctCount += answer.correctCount || 0
        wp.totalAttempts += (answer.wrongCount || 0) + (answer.correctCount || 0)
        if (answer.difficulty) {
          wp.difficulty.push(answer.difficulty)
        }
      })
    })

    // 计算掌握率并排序
    const weaknesses = Object.values(weaknessByKnowledge)
      .map(w => ({
        ...w,
        masteryRate: w.totalAttempts > 0 ? Math.round((w.correctCount / w.totalAttempts) * 100) : 0,
        avgDifficulty: w.difficulty.length > 0 ? w.difficulty[0] : 'medium'
      }))
      .sort((a, b) => a.masteryRate - b.masteryRate)

    // 找出关键领域 (掌握率 < 40%)
    const criticalAreas = weaknesses
      .filter(w => w.masteryRate < 40)
      .slice(0, 5)

    // 计算整体掌握率
    const totalWrong = wrongAnswers.reduce((sum, a) => sum + (a.wrongCount || 0), 0)
    const totalCorrect = wrongAnswers.reduce((sum, a) => sum + (a.correctCount || 0), 0)
    const averageMasteryRate =
      totalWrong + totalCorrect > 0
        ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
        : 0

    return {
      topWeaknesses: weaknesses.slice(0, 10),
      criticalAreas,
      averageMasteryRate,
      totalWeaknessAreas: weaknesses.length
    }
  }
}

export default messageAIRecommendationService
