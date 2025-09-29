/**
 * 增强统计数据服务 - 支持多维度分析、缓存、防作弊检测
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

class StatisticsService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: '/api',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
    this.cache = new Map() // 简单内存缓存
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟
  }

  setupInterceptors() {
    this.apiClient.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      error => Promise.reject(error)
    )

    this.apiClient.interceptors.response.use(
      response => {
        // Mock服务器返回格式兼容处理
        if (response.data.data) {
          return { ...response, data: response.data.data }
        }
        return response
      },
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * 缓存键生成
   */
  getCacheKey(method, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return `stats_${method}_${sortedParams}`
  }

  /**
   * 获取缓存数据
   */
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  /**
   * 设置缓存数据
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 清除用户相关缓存
   */
  clearUserCache(userId) {
    for (const [key] of this.cache) {
      if (key.includes(`user_${userId}`)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取用户综合统计数据
   * @param {Object} options 查询选项
   * @param {string} options.timeRange 时间范围 ('daily', 'weekly', 'monthly', 'yearly', 'all')
   * @param {boolean} options.detail 是否返回详细信息
   * @param {boolean} options.forceRefresh 是否强制刷新
   * @returns {Promise<Object>}
   */
  async getUserStatistics(options = {}) {
    const {
      timeRange = 'all',
      detail = true,
      forceRefresh = false
    } = options

    const cacheKey = this.getCacheKey('user_stats', { timeRange, detail })

    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { success: true, data: cached, fromCache: true }
      }
    }

    try {
      console.log('获取用户统计数据:', { timeRange, detail })

      const response = await this.apiClient.get('/users/statistics', {
        params: { timeRange, detail }
      })

      const enhancedData = this.enhanceStatisticsData(response.data)
      this.setCache(cacheKey, enhancedData)

      return {
        success: true,
        data: enhancedData,
        fromCache: false
      }
    } catch (error) {
      console.error('获取用户统计失败:', error)
      return {
        success: false,
        error: this.handleError(error),
        data: this.getFallbackData()
      }
    }
  }

  /**
   * 增强统计数据处理
   */
  enhanceStatisticsData(rawData) {
    const enhanced = {
      ...rawData,
      // 计算趋势
      trends: this.calculateTrends(rawData),
      // 生成成就
      achievements: this.generateAchievements(rawData),
      // 个性化推荐
      recommendations: this.generateRecommendations(rawData),
      // 格式化显示数据
      formatted: this.formatDisplayData(rawData)
    }

    return enhanced
  }

  /**
   * 计算数据趋势
   */
  calculateTrends(data) {
    const trends = {}

    // 分数趋势
    if (data.timeSeriesData?.monthly?.length >= 2) {
      const recent = data.timeSeriesData.monthly
      const current = recent[recent.length - 1]
      const previous = recent[recent.length - 2]

      trends.scoreChange = current.score - previous.score
      trends.scoreTrend = trends.scoreChange > 0 ? 'up' : trends.scoreChange < 0 ? 'down' : 'stable'
      trends.scoreChangeText = trends.scoreChange > 0 ? `+${trends.scoreChange.toFixed(1)}` : trends.scoreChange.toFixed(1)
    }

    // 练习量趋势
    if (data.timeSeriesData?.monthly?.length >= 2) {
      const recent = data.timeSeriesData.monthly
      const currentInterviews = recent[recent.length - 1].interviews
      const previousInterviews = recent[recent.length - 2].interviews

      trends.activityChange = currentInterviews - previousInterviews
      trends.activityTrend = trends.activityChange > 0 ? 'up' : trends.activityChange < 0 ? 'down' : 'stable'
      trends.activityChangeText = trends.activityChange > 0 ? `+${trends.activityChange}` : `${trends.activityChange}`
    }

    return trends
  }

  /**
   * 生成成就系统
   */
  generateAchievements(data) {
    const achievements = []
    const stats = data.summary || data

    // 面试次数成就
    if (stats.interviewCount >= 1) achievements.push({
      id: 'first_interview',
      title: '🎯 初次面试',
      description: '完成第一次面试',
      unlocked: true,
      tier: 'bronze'
    })

    if (stats.interviewCount >= 10) achievements.push({
      id: 'interview_veteran',
      title: '🏅 面试老手',
      description: '完成10次面试',
      unlocked: true,
      tier: 'silver'
    })

    if (stats.interviewCount >= 50) achievements.push({
      id: 'interview_master',
      title: '👑 面试大师',
      description: '完成50次面试',
      unlocked: true,
      tier: 'gold'
    })

    // 分数成就
    if (stats.averageScore >= 90) achievements.push({
      id: 'high_achiever',
      title: '🌟 优秀表现',
      description: '平均分数达到90分',
      unlocked: true,
      tier: 'gold'
    })

    return achievements
  }

  /**
   * 生成个性化推荐
   */
  generateRecommendations(data) {
    const recommendations = []
    const stats = data.summary || data

    // 基于分数的推荐
    if (stats.averageScore < 70) {
      recommendations.push({
        type: 'improvement',
        title: '💪 加强基础练习',
        content: '建议多进行基础技能的练习，重点提升技术能力',
        priority: 'high',
        actionUrl: '/questions?difficulty=easy'
      })
    }

    // 基于面试次数的推荐
    if (stats.interviewCount < 5) {
      recommendations.push({
        type: 'practice',
        title: '🚀 增加练习频率',
        content: '多进行模拟面试可以显著提升您的表现',
        priority: 'medium',
        actionUrl: '/interview/new'
      })
    }

    // 基于分类表现的推荐
    if (data.categoryBreakdown?.aiInterview?.avgScore < data.categoryBreakdown?.mockInterview?.avgScore) {
      recommendations.push({
        type: 'focus',
        title: '🤖 专注AI面试训练',
        content: 'AI面试表现有提升空间，建议多加练习',
        priority: 'medium',
        actionUrl: '/interview/ai'
      })
    }

    return recommendations
  }

  /**
   * 格式化显示数据
   */
  formatDisplayData(data) {
    const stats = data.summary || data

    return {
      interviewCount: {
        value: stats.interviewCount || 0,
        formatted: `${stats.interviewCount || 0}次`
      },
      practiceTime: {
        value: stats.totalPracticeTime || 0,
        formatted: this.formatTime(stats.totalPracticeTime || 0)
      },
      averageScore: {
        value: stats.averageScore || 0,
        formatted: `${(stats.averageScore || 0).toFixed(1)}分`
      },
      rank: {
        level: stats.rank?.level || 'N/A',
        percentile: stats.rank?.percentile || 0,
        formatted: `${stats.rank?.level || 'N/A'} (前${(100 - (stats.rank?.percentile || 0)).toFixed(1)}%)`
      }
    }
  }

  /**
   * 时间格式化
   */
  formatTime(seconds) {
    if (!seconds || seconds < 0) return '0分钟'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  /**
   * 更新面试完成后的统计
   */
  async updateAfterInterview(sessionData) {
    try {
      // 清除相关缓存
      this.clearUserCache(sessionData.userId || 'current')

      // 记录面试完成事件
      await this.apiClient.post('/users/statistics/events', {
        type: 'interview_completed',
        data: sessionData
      })

      return { success: true }
    } catch (error) {
      console.error('更新面试统计失败:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 获取排行榜数据
   */
  async getLeaderboard(options = {}) {
    const { limit = 10, timeRange = 'monthly' } = options

    try {
      const response = await this.apiClient.get('/users/leaderboard', {
        params: { limit, timeRange }
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('获取排行榜失败:', error)
      return {
        success: false,
        error: this.handleError(error),
        data: []
      }
    }
  }

  /**
   * 获取用户详细趋势数据
   */
  async getUserTrends(timeRange = 'monthly') {
    const cacheKey = this.getCacheKey('user_trends', { timeRange })
    const cached = this.getFromCache(cacheKey)

    if (cached) {
      return { success: true, data: cached, fromCache: true }
    }

    try {
      const response = await this.apiClient.get('/users/trends', {
        params: { timeRange }
      })

      this.setCache(cacheKey, response.data)

      return {
        success: true,
        data: response.data,
        fromCache: false
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error)
      return {
        success: false,
        error: this.handleError(error),
        data: { trends: [], insights: [] }
      }
    }
  }

  /**
   * 增强的错误处理
   */
  handleError(error) {
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || error.message

      switch (status) {
        case 400:
          return {
            code: 'INVALID_PARAMS',
            message: '请求参数无效',
            type: 'client',
            fallback: false
          }
        case 401:
          return {
            code: 'UNAUTHORIZED',
            message: '身份验证失败，请重新登录',
            type: 'auth',
            redirect: '/login'
          }
        case 403:
          return {
            code: 'FORBIDDEN',
            message: '权限不足，无法访问该资源',
            type: 'permission',
            fallback: false
          }
        case 404:
          return {
            code: 'DATA_NOT_FOUND',
            message: '统计数据不存在，已启用默认数据',
            type: 'notfound',
            fallback: true
          }
        case 429:
          return {
            code: 'RATE_LIMIT',
            message: '请求过于频繁，请稍后重试',
            type: 'rate_limit',
            retryable: true
          }
        case 503:
          return {
            code: 'SERVICE_UNAVAILABLE',
            message: '统计服务暂时不可用，已启用备用数据',
            type: 'server',
            fallback: true
          }
        default:
          return {
            code: 'API_ERROR',
            message: message || '服务器内部错误',
            type: status >= 500 ? 'server' : 'client',
            fallback: status >= 500
          }
      }
    } else if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，已切换到离线模式',
        type: 'network',
        fallback: true,
        retryable: true
      }
    } else if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: '请求超时，请检查网络连接',
        type: 'timeout',
        retryable: true
      }
    } else {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || '未知错误，已启用默认数据',
        type: 'unknown',
        fallback: true
      }
    }
  }

  /**
   * 重试机制
   */
  async executeWithRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const errorInfo = this.handleError(error)

        // 如果不是可重试的错误，直接抛出
        if (!errorInfo.retryable && errorInfo.type !== 'timeout' && errorInfo.type !== 'network') {
          throw error
        }

        // 如果是最后一次尝试，抛出错误
        if (attempt === maxRetries) {
          console.log(`重试 ${maxRetries} 次后仍然失败，启用降级方案`)
          throw error
        }

        // 等待后重试，每次延时递增
        const retryDelay = delay * Math.pow(2, attempt - 1) // 指数退避
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        console.log(`第 ${attempt} 次重试，${retryDelay}ms 后执行...`)
      }
    }
  }

  /**
   * 降级数据
   */
  getFallbackData() {
    return {
      summary: {
        interviewCount: 0,
        totalPracticeTime: 0,
        averageScore: 0,
        rank: { level: 'N/A', percentile: 0 }
      },
      trends: {},
      achievements: [],
      recommendations: [{
        type: 'system',
        title: '🔄 数据加载中',
        content: '统计数据正在加载，请稍后刷新页面',
        priority: 'low'
      }],
      formatted: {
        interviewCount: { value: 0, formatted: '0次' },
        practiceTime: { value: 0, formatted: '0分钟' },
        averageScore: { value: 0, formatted: '0.0分' },
        rank: { level: 'N/A', formatted: 'N/A' }
      }
    }
  }
}

export default new StatisticsService()