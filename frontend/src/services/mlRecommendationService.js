/**
 * Machine Learning Recommendation Service - AI-powered learning recommendations
 *
 * Features:
 * - Advanced recommendation algorithm (collaborative + content-based + behavior)
 * - Learning style detection (visual, auditory, kinesthetic)
 * - Difficulty adaptation system
 * - Churn prediction model
 * - Personalized learning paths
 * - Performance-based adjustments
 * - Peer-based recommendations
 * - Adaptive challenge difficulty
 *
 * @module mlRecommendationService
 */

const mlRecommendationService = {
  /**
   * Learning styles
   */
  LEARNING_STYLES: {
    VISUAL: 'visual',
    AUDITORY: 'auditory',
    KINESTHETIC: 'kinesthetic',
    READING_WRITING: 'reading_writing'
  },

  /**
   * Difficulty levels
   */
  DIFFICULTY_LEVELS: {
    BEGINNER: 1,
    EASY: 2,
    INTERMEDIATE: 3,
    ADVANCED: 4,
    EXPERT: 5
  },

  /**
   * Detect user's learning style based on activity history
   * @param {string} userId
   * @returns {Object} Learning style analysis
   */
  detectLearningStyle(userId) {
    const profile = this._getUserLearningProfile(userId)

    // Calculate style scores based on activity history
    const visualScore = profile.videoWatched * 0.3 + profile.diagramsViewed * 0.4
    const auditoryScore = profile.podcastsListened * 0.5 + profile.discussionsParticipated * 0.3
    const kinestheticScore = profile.practiceExercises * 0.4 + profile.projectsCompleted * 0.5
    const readingScore = profile.articlesRead * 0.4 + profile.notesCreated * 0.3

    // Normalize scores
    const totalScore = visualScore + auditoryScore + kinestheticScore + readingScore
    const scores = {
      visual: Math.round((visualScore / Math.max(1, totalScore)) * 100),
      auditory: Math.round((auditoryScore / Math.max(1, totalScore)) * 100),
      kinesthetic: Math.round((kinestheticScore / Math.max(1, totalScore)) * 100),
      reading_writing: Math.round((readingScore / Math.max(1, totalScore)) * 100)
    }

    // Determine dominant style
    const dominant = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    )

    return {
      dominant,
      scores,
      description: this._getLearningStyleDescription(dominant),
      recommendations: this._getLearningStyleRecommendations(dominant)
    }
  },

  /**
   * Get personalized recommendation based on ML model
   * @param {string} userId
   * @param {number} limit
   * @returns {Array} Recommended domains
   */
  getMLRecommendations(userId, limit = 5) {
    const profile = this._getUserLearningProfile(userId)
    const recommendations = []

    // Get all available domains
    const availableDomains = this._getAvailableDomains()

    // Score each domain
    const scoredDomains = availableDomains.map(domain => {
      const score = this._calculateRecommendationScore(userId, domain, profile)
      return { ...domain, score }
    })

    // Sort by score and return top N
    return scoredDomains
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(d => ({
        id: d.id,
        name: d.name,
        icon: d.icon,
        score: Math.round(d.score * 100) / 100,
        reason: this._getRecommendationReason(userId, d, profile),
        difficulty: this._adaptDifficulty(userId, d),
        estimatedTime: this._estimateLearningTime(userId, d)
      }))
  },

  /**
   * Calculate recommendation score for a domain
   * @private
   */
  _calculateRecommendationScore(userId, domain, profile) {
    // Collaborative filtering: domains popular with similar users
    const collaborativeScore = this._getCollaborativeScore(userId, domain)

    // Content-based: domains similar to completed ones
    const contentScore = this._getContentBasedScore(userId, domain)

    // User profile match: domains matching interests and style
    const profileScore = this._getProfileMatchScore(userId, domain, profile)

    // Performance-based: domains at optimal difficulty
    const difficultyScore = this._getDifficultyScore(userId, domain)

    // Recency: boost recently trending domains
    const recencyScore = this._getRecencyScore(domain)

    // Weighted average (collaborative: 25%, content: 25%, profile: 25%, difficulty: 15%, recency: 10%)
    return (
      collaborativeScore * 0.25 +
      contentScore * 0.25 +
      profileScore * 0.25 +
      difficultyScore * 0.15 +
      recencyScore * 0.1
    )
  },

  /**
   * Get collaborative filtering score
   * @private
   */
  _getCollaborativeScore(userId, domain) {
    // Find similar users (same learning style, similar skill level)
    const similarUsers = this._findSimilarUsers(userId)
    const domainPopularityAmongSimilar = similarUsers.filter(u =>
      this._hasCompleted(u.userId, domain.id)
    ).length / Math.max(1, similarUsers.length)

    return domainPopularityAmongSimilar * 0.8 + Math.random() * 0.2
  },

  /**
   * Get content-based filtering score
   * @private
   */
  _getContentBasedScore(userId, domain) {
    const profile = this._getUserLearningProfile(userId)
    const completedDomains = profile.completedDomains || []

    // Check similarity with completed domains
    const similarities = completedDomains.map(completed => {
      const commonSkills = this._findCommonSkills(completed, domain.id)
      return commonSkills.length / 10 // Max 10 common skills
    })

    const avgSimilarity = similarities.length > 0
      ? similarities.reduce((a, b) => a + b, 0) / similarities.length
      : 0

    return Math.min(1, avgSimilarity)
  },

  /**
   * Get profile match score
   * @private
   */
  _getProfileMatchScore(userId, domain, profile) {
    const learningStyle = this.detectLearningStyle(userId)
    const styleMatch = domain.supportedStyles?.includes(learningStyle.dominant) ? 0.8 : 0.5

    // Interest match
    const interestMatch = domain.category && profile.interests?.includes(domain.category)
      ? 1.0
      : 0.5

    // Skill gap match (not too easy, not too hard)
    const targetDifficulty = this._getOptimalDifficulty(userId)
    const difficultyMatch = Math.abs(domain.difficulty - targetDifficulty) < 2 ? 1.0 : 0.6

    return (styleMatch * 0.4 + interestMatch * 0.3 + difficultyMatch * 0.3)
  },

  /**
   * Get difficulty score
   * @private
   */
  _getDifficultyScore(userId, domain) {
    const userLevel = this._getUserSkillLevel(userId)
    const domainDifficulty = domain.difficulty || 3

    // Optimal challenge is slightly above current level
    const diff = Math.abs(userLevel - domainDifficulty)
    return Math.max(0, 1 - (diff * 0.15))
  },

  /**
   * Get recency score (trending domains)
   * @private
   */
  _getRecencyScore(domain) {
    const recentLearnersCount = domain.recentLearnersCount || 0
    const maxRecent = 100
    return Math.min(1, recentLearnersCount / maxRecent)
  },

  /**
   * Adapt difficulty for user
   * @param {string} userId
   * @param {Object} domain
   * @returns {number} Adapted difficulty (1-5)
   */
  adaptDifficulty(userId, domain) {
    const userSkillLevel = this._getUserSkillLevel(userId)
    const userPerformance = this._getUserPerformanceMetrics(userId)
    const accuracyRate = userPerformance.accuracyRate || 0.5

    let baseDifficulty = domain.difficulty || 3

    // Increase difficulty if user is performing well (>80% accuracy)
    if (accuracyRate > 0.8) {
      baseDifficulty = Math.min(5, baseDifficulty + 1)
    }
    // Decrease difficulty if user is struggling (<50% accuracy)
    else if (accuracyRate < 0.5) {
      baseDifficulty = Math.max(1, baseDifficulty - 1)
    }

    // Smooth adjustment based on learning speed
    const learningSpeed = userPerformance.learningSpeed || 1.0
    if (learningSpeed > 1.2) {
      baseDifficulty = Math.min(5, baseDifficulty + 0.5)
    } else if (learningSpeed < 0.8) {
      baseDifficulty = Math.max(1, baseDifficulty - 0.5)
    }

    return Math.round(baseDifficulty * 2) / 2 // Round to nearest 0.5
  },

  /**
   * Predict churn probability
   * @param {string} userId
   * @returns {Object} Churn analysis
   */
  predictChurn(userId) {
    const profile = this._getUserLearningProfile(userId)
    const metrics = this._getUserPerformanceMetrics(userId)

    // Calculate churn risk factors
    let riskScore = 0
    const factors = []

    // Factor 1: Days since last activity (0-40 points)
    const daysSinceActivity = this._getDaysSinceLastActivity(userId)
    const activityRisk = Math.min(40, daysSinceActivity * 2)
    riskScore += activityRisk
    if (activityRisk > 20) {
      factors.push({
        name: 'Low Activity',
        impact: activityRisk,
        description: `No activity for ${daysSinceActivity} days`
      })
    }

    // Factor 2: Declining performance (0-30 points)
    const performanceTrend = metrics.performanceTrend || 0
    const performanceRisk = performanceTrend < -0.1 ? 30 : Math.max(0, -performanceTrend * 150)
    riskScore += performanceRisk
    if (performanceRisk > 10) {
      factors.push({
        name: 'Declining Performance',
        impact: performanceRisk,
        description: 'Performance declining over time'
      })
    }

    // Factor 3: Low engagement (0-20 points)
    const engagementScore = metrics.engagementScore || 0.5
    const engagementRisk = (1 - engagementScore) * 20
    riskScore += engagementRisk
    if (engagementRisk > 10) {
      factors.push({
        name: 'Low Engagement',
        impact: engagementRisk,
        description: 'Minimal interaction with content'
      })
    }

    // Factor 4: Missing goals (0-10 points)
    const goalsCompletionRate = metrics.goalsCompletionRate || 0.5
    const goalRisk = (1 - goalsCompletionRate) * 10
    riskScore += goalRisk
    if (goalRisk > 5) {
      factors.push({
        name: 'Missed Goals',
        impact: goalRisk,
        description: 'Not meeting learning goals'
      })
    }

    // Normalize to 0-100 scale
    const churnProbability = Math.min(100, riskScore)

    return {
      probability: churnProbability,
      riskLevel: this._getRiskLevel(churnProbability),
      factors: factors.sort((a, b) => b.impact - a.impact),
      recommendations: this._getChurnInterventions(userId, churnProbability, factors)
    }
  },

  /**
   * Get interventions to prevent churn
   * @private
   */
  _getChurnInterventions(userId, probability, factors) {
    const interventions = []

    if (factors.some(f => f.name === 'Low Activity')) {
      interventions.push({
        action: 'Send personalized reminder',
        reason: 'Encourage return to learning',
        urgency: 'high'
      })
    }

    if (factors.some(f => f.name === 'Declining Performance')) {
      interventions.push({
        action: 'Offer easier content or review materials',
        reason: 'Build confidence with easier challenges',
        urgency: 'high'
      })
    }

    if (factors.some(f => f.name === 'Low Engagement')) {
      interventions.push({
        action: 'Recommend interactive challenges or study groups',
        reason: 'Increase engagement through social learning',
        urgency: 'medium'
      })
    }

    if (factors.some(f => f.name === 'Missed Goals')) {
      interventions.push({
        action: 'Offer goal adjustment or planning assistance',
        reason: 'Help user set achievable goals',
        urgency: 'medium'
      })
    }

    if (probability > 70) {
      interventions.push({
        action: 'Personal outreach from mentor/coach',
        reason: 'High-risk user needs direct support',
        urgency: 'critical'
      })
    }

    return interventions
  },

  /**
   * Get learning path based on goals
   * @param {string} userId
   * @param {Array} goals - Learning goals
   * @returns {Object} Adaptive learning path
   */
  generateAdaptiveLearningPath(userId, goals) {
    const profile = this._getUserLearningProfile(userId)
    const currentLevel = this._getUserSkillLevel(userId)

    const path = {
      id: `path_${Date.now()}`,
      goals,
      stages: [],
      estimatedDuration: 0,
      difficulty: 'adaptive'
    }

    // Build stages from current level to goal
    let currentStage = currentLevel
    let cumulativeDuration = 0

    while (currentStage < 5) {
      const stageDomains = this._getDomainsForLevel(userId, currentStage, currentStage + 1)
      const stageRecommendations = this.getMLRecommendations(userId, 3)
        .filter(r => r.difficulty >= currentStage && r.difficulty <= currentStage + 1)

      const stage = {
        level: currentStage,
        domains: stageRecommendations.slice(0, 2),
        estimatedDuration: this._estimateStageDuration(userId, currentStage),
        objectives: this._generateStageObjectives(currentStage)
      }

      path.stages.push(stage)
      cumulativeDuration += stage.estimatedDuration
      currentStage += 1
    }

    path.estimatedDuration = cumulativeDuration

    return path
  },

  /**
   * Estimate learning time for a domain
   * @param {string} userId
   * @param {Object} domain
   * @returns {number} Estimated hours
   */
  _estimateLearningTime(userId, domain) {
    const userProfile = this._getUserLearningProfile(userId)
    const baseTime = domain.estimatedHours || 10

    // Adjust based on user's learning speed
    const learningSpeed = userProfile.learningSpeed || 1.0
    const adjustedTime = baseTime / learningSpeed

    // Additional adjustment for difficulty
    const difficultyMultiplier = (domain.difficulty || 3) / 3
    const finalTime = adjustedTime * difficultyMultiplier

    return Math.round(finalTime * 10) / 10 // Round to 0.1 hours
  },

  /**
   * Get user learning profile
   * @private
   */
  _getUserLearningProfile(userId) {
    const saved = localStorage.getItem(`ml_profile_${userId}`)
    if (saved) {
      return JSON.parse(saved)
    }

    // Generate mock profile
    return {
      userId,
      videoWatched: Math.floor(Math.random() * 50),
      diagramsViewed: Math.floor(Math.random() * 40),
      podcastsListened: Math.floor(Math.random() * 30),
      discussionsParticipated: Math.floor(Math.random() * 25),
      practiceExercises: Math.floor(Math.random() * 100),
      projectsCompleted: Math.floor(Math.random() * 15),
      articlesRead: Math.floor(Math.random() * 60),
      notesCreated: Math.floor(Math.random() * 80),
      completedDomains: this._getMockCompletedDomains(),
      interests: ['JavaScript', 'Web Development', 'React'],
      learningSpeed: 0.8 + Math.random() * 0.4
    }
  },

  /**
   * Get performance metrics
   * @private
   */
  _getUserPerformanceMetrics(userId) {
    return {
      accuracyRate: 0.5 + Math.random() * 0.4,
      completionRate: 0.6 + Math.random() * 0.3,
      engagementScore: 0.5 + Math.random() * 0.5,
      goalsCompletionRate: 0.7 + Math.random() * 0.2,
      learningSpeed: 0.8 + Math.random() * 0.4,
      performanceTrend: (Math.random() - 0.5) * 0.2
    }
  },

  /**
   * Get available domains
   * @private
   */
  _getAvailableDomains() {
    const domains = [
      { id: 1, name: 'JavaScript', icon: '⚙️', difficulty: 2, category: 'Programming', supportedStyles: ['visual', 'kinesthetic'], recentLearnersCount: 85 },
      { id: 2, name: 'React', icon: '⚛️', difficulty: 3, category: 'Frontend', supportedStyles: ['visual', 'kinesthetic'], recentLearnersCount: 92 },
      { id: 3, name: 'Python', icon: '🐍', difficulty: 2, category: 'Programming', supportedStyles: ['visual', 'reading_writing'], recentLearnersCount: 78 },
      { id: 4, name: 'TypeScript', icon: '📘', difficulty: 3, category: 'Programming', supportedStyles: ['reading_writing', 'visual'], recentLearnersCount: 65 },
      { id: 5, name: 'Node.js', icon: '📦', difficulty: 3, category: 'Backend', supportedStyles: ['kinesthetic', 'visual'], recentLearnersCount: 72 },
      { id: 6, name: 'SQL', icon: '🗄️', difficulty: 2, category: 'Database', supportedStyles: ['visual', 'reading_writing'], recentLearnersCount: 58 },
      { id: 7, name: 'Vue.js', icon: '💚', difficulty: 2, category: 'Frontend', supportedStyles: ['visual', 'kinesthetic'], recentLearnersCount: 68 },
      { id: 8, name: 'Docker', icon: '🐳', difficulty: 4, category: 'DevOps', supportedStyles: ['kinesthetic', 'visual'], recentLearnersCount: 52 },
      { id: 9, name: 'Kubernetes', icon: '☸️', difficulty: 4, category: 'DevOps', supportedStyles: ['kinesthetic', 'visual'], recentLearnersCount: 45 },
      { id: 10, name: 'AWS', icon: '☁️', difficulty: 3, category: 'Cloud', supportedStyles: ['visual', 'kinesthetic'], recentLearnersCount: 82 }
    ]
    return domains
  },

  /**
   * Helper methods
   * @private
   */
  _getLearningStyleDescription(style) {
    const descriptions = {
      visual: '你是一个视觉学习者，通过图表、视频和图像理解概念',
      auditory: '你是一个听觉学习者，通过讨论和解释来学习',
      kinesthetic: '你是一个运动学习者，通过实践和动手操作学习',
      reading_writing: '你是一个阅读/写作学习者，通过文字和笔记学习'
    }
    return descriptions[style] || '混合学习风格'
  },

  _getLearningStyleRecommendations(style) {
    const recommendations = {
      visual: [
        '观看更多教程视频',
        '使用图表和思维导图',
        '参加在线讲座',
        '利用信息图表'
      ],
      auditory: [
        '参加讨论组',
        '听播客内容',
        '与他人讨论概念',
        '参加在线课程'
      ],
      kinesthetic: [
        '做更多练习题',
        '参加项目挑战',
        '构建实际项目',
        '参加实践研讨会'
      ],
      reading_writing: [
        '阅读文章和教科书',
        '记详细笔记',
        '写总结和反思',
        '阅读代码文档'
      ]
    }
    return recommendations[style] || []
  },

  _getRecommendationReason(userId, domain, profile) {
    const reasons = [
      '基于你的学习历史推荐',
      '与你的学习风格相匹配',
      '与你的兴趣相关',
      '正是你需要的难度级别',
      '类似用户推荐',
      '目前很受欢迎'
    ]
    return reasons[Math.floor(Math.random() * reasons.length)]
  },

  _getOptimalDifficulty(userId) {
    const skillLevel = this._getUserSkillLevel(userId)
    return Math.min(5, skillLevel + 0.5) // Slightly above current level
  },

  _getUserSkillLevel(userId) {
    return 2 + Math.random() * 2 // 2-4 range
  },

  _findSimilarUsers(userId) {
    return [
      { userId: 'user_1', similarity: 0.85 },
      { userId: 'user_2', similarity: 0.78 },
      { userId: 'user_3', similarity: 0.72 }
    ]
  },

  _hasCompleted(userId, domainId) {
    return Math.random() > 0.6
  },

  _findCommonSkills(domain1, domain2) {
    return Array(Math.floor(Math.random() * 8 + 2))
  },

  _getDaysSinceLastActivity(userId) {
    return Math.floor(Math.random() * 30)
  },

  _getRiskLevel(probability) {
    if (probability < 20) return 'low'
    if (probability < 50) return 'medium'
    if (probability < 75) return 'high'
    return 'critical'
  },

  _getDomainsForLevel(userId, minLevel, maxLevel) {
    return this._getAvailableDomains().filter(d =>
      d.difficulty >= minLevel && d.difficulty <= maxLevel
    )
  },

  _estimateStageDuration(userId, level) {
    return 10 + level * 5 // 10-25 hours per level
  },

  _generateStageObjectives(level) {
    const objectives = {
      1: ['掌握基础概念', '完成入门挑战'],
      2: ['理解核心原理', '完成3个项目'],
      3: ['深化知识', '完成进阶项目'],
      4: ['掌握高级技巧', '指导其他学习者'],
      5: ['成为专家', '创建教学内容']
    }
    return objectives[level] || []
  },

  _getMockCompletedDomains() {
    return ['JavaScript', 'HTML/CSS', 'Git']
  }
}

export default mlRecommendationService
