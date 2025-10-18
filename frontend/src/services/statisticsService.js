/**
 * 澧炲己缁熻鏁版嵁鏈嶅姟 - 鏀寔澶氱淮搴﹀垎鏋愩€佺紦瀛樸€侀槻浣滃紛妫€娴?
 */
import axios from 'axios'

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
    this.cache = new Map() // 绠€鍗曞唴瀛樼紦瀛?
    this.cacheTimeout = 5 * 60 * 1000 // 5鍒嗛挓
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
        // Mock鏈嶅姟鍣ㄨ繑鍥炴牸寮忓吋瀹瑰鐞?
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
   * 缂撳瓨閿敓鎴?
   */
  getCacheKey(method, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return `stats_${method}_${sortedParams}`
  }

  /**
   * 鑾峰彇缂撳瓨鏁版嵁
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
   * 璁剧疆缂撳瓨鏁版嵁
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 娓呴櫎鐢ㄦ埛鐩稿叧缂撳瓨
   */
  clearUserCache(userId) {
    for (const [key] of this.cache) {
      if (key.includes(`user_${userId}`)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 鑾峰彇鐢ㄦ埛缁煎悎缁熻鏁版嵁
   * @param {Object} options 鏌ヨ閫夐」
   * @param {string} options.timeRange 鏃堕棿鑼冨洿 ('daily', 'weekly', 'monthly', 'yearly', 'all')
   * @param {boolean} options.detail 鏄惁杩斿洖璇︾粏淇℃伅
   * @param {boolean} options.forceRefresh 鏄惁寮哄埗鍒锋柊
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
      console.log('鑾峰彇鐢ㄦ埛缁熻鏁版嵁:', { timeRange, detail })

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
      console.error('鑾峰彇鐢ㄦ埛缁熻澶辫触:', error)
      return {
        success: false,
        error: this.handleError(error),
        data: this.getFallbackData()
      }
    }
  }

  /**
   * 澧炲己缁熻鏁版嵁澶勭悊
   */
  enhanceStatisticsData(rawData) {
    const enhanced = {
      ...rawData,
      // 璁＄畻瓒嬪娍
      trends: this.calculateTrends(rawData),
      // 鐢熸垚鎴愬氨
      achievements: this.generateAchievements(rawData),
      // 涓€у寲鎺ㄨ崘
      recommendations: this.generateRecommendations(rawData),
      // 鏍煎紡鍖栨樉绀烘暟鎹?
      formatted: this.formatDisplayData(rawData)
    }

    return enhanced
  }

  /**
   * 璁＄畻鏁版嵁瓒嬪娍
   */
  calculateTrends(data) {
    const trends = {}

    // 鍒嗘暟瓒嬪娍
    if (data.timeSeriesData?.monthly?.length >= 2) {
      const recent = data.timeSeriesData.monthly
      const current = recent[recent.length - 1]
      const previous = recent[recent.length - 2]

      trends.scoreChange = current.score - previous.score
      trends.scoreTrend = trends.scoreChange > 0 ? 'up' : trends.scoreChange < 0 ? 'down' : 'stable'
      trends.scoreChangeText = trends.scoreChange > 0 ? `+${trends.scoreChange.toFixed(1)}` : trends.scoreChange.toFixed(1)
    }

    // 缁冧範閲忚秼鍔?
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
   * 鐢熸垚鎴愬氨绯荤粺
   */
  generateAchievements(data) {
    const achievements = []
    const stats = data.summary || data

    // 闈㈣瘯娆℃暟鎴愬氨
    if (stats.interviewCount >= 1) achievements.push({
      id: 'first_interview',
      title: '馃幆 鍒濇闈㈣瘯',
      description: '瀹屾垚绗竴娆￠潰璇?,
      unlocked: true,
      tier: 'bronze'
    })

    if (stats.interviewCount >= 10) achievements.push({
      id: 'interview_veteran',
      title: '馃弲 闈㈣瘯鑰佹墜',
      description: '瀹屾垚10娆￠潰璇?,
      unlocked: true,
      tier: 'silver'
    })

    if (stats.interviewCount >= 50) achievements.push({
      id: 'interview_master',
      title: '馃憫 闈㈣瘯澶у笀',
      description: '瀹屾垚50娆￠潰璇?,
      unlocked: true,
      tier: 'gold'
    })

    // 鍒嗘暟鎴愬氨
    if (stats.averageScore >= 90) achievements.push({
      id: 'high_achiever',
      title: '馃専 浼樼琛ㄧ幇',
      description: '骞冲潎鍒嗘暟杈惧埌90鍒?,
      unlocked: true,
      tier: 'gold'
    })

    return achievements
  }

  /**
   * 鐢熸垚涓€у寲鎺ㄨ崘
   */
  generateRecommendations(data) {
    const recommendations = []
    const stats = data.summary || data

    // 鍩轰簬鍒嗘暟鐨勬帹鑽?
    if (stats.averageScore < 70) {
      recommendations.push({
        type: 'improvement',
        title: '馃挭 鍔犲己鍩虹缁冧範',
        content: '寤鸿澶氳繘琛屽熀纭€鎶€鑳界殑缁冧範锛岄噸鐐规彁鍗囨妧鏈兘鍔?,
        priority: 'high',
        actionUrl: '/questions?difficulty=easy'
      })
    }

    // 鍩轰簬闈㈣瘯娆℃暟鐨勬帹鑽?
    if (stats.interviewCount < 5) {
      recommendations.push({
        type: 'practice',
        title: '馃殌 澧炲姞缁冧範棰戠巼',
        content: '澶氳繘琛屾ā鎷熼潰璇曞彲浠ユ樉钁楁彁鍗囨偍鐨勮〃鐜?,
        priority: 'medium',
        actionUrl: '/interview/new'
      })
    }

    // 鍩轰簬鍒嗙被琛ㄧ幇鐨勬帹鑽?
    if (data.categoryBreakdown?.aiInterview?.avgScore < data.categoryBreakdown?.mockInterview?.avgScore) {
      recommendations.push({
        type: 'focus',
        title: '馃 涓撴敞AI闈㈣瘯璁粌',
        content: 'AI闈㈣瘯琛ㄧ幇鏈夋彁鍗囩┖闂达紝寤鸿澶氬姞缁冧範',
        priority: 'medium',
        actionUrl: '/interview/ai'
      })
    }

    return recommendations
  }

  /**
   * 鏍煎紡鍖栨樉绀烘暟鎹?
   */
  formatDisplayData(data) {
    const stats = data.summary || data

    return {
      interviewCount: {
        value: stats.interviewCount || 0,
        formatted: `${stats.interviewCount || 0}娆
      },
      practiceTime: {
        value: stats.totalPracticeTime || 0,
        formatted: this.formatTime(stats.totalPracticeTime || 0)
      },
      averageScore: {
        value: stats.averageScore || 0,
        formatted: `${(stats.averageScore || 0).toFixed(1)}鍒哷
      },
      rank: {
        level: stats.rank?.level || 'N/A',
        percentile: stats.rank?.percentile || 0,
        formatted: `${stats.rank?.level || 'N/A'} (鍓?{(100 - (stats.rank?.percentile || 0)).toFixed(1)}%)`
      }
    }
  }

  /**
   * 鏃堕棿鏍煎紡鍖?
   */
  formatTime(seconds) {
    if (!seconds || seconds < 0) return '0鍒嗛挓'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}灏忔椂${minutes}鍒嗛挓`
    } else {
      return `${minutes}鍒嗛挓`
    }
  }

  /**
   * 鏇存柊闈㈣瘯瀹屾垚鍚庣殑缁熻
   */
  async updateAfterInterview(sessionData) {
    try {
      // 娓呴櫎鐩稿叧缂撳瓨
      this.clearUserCache(sessionData.userId || 'current')

      // 璁板綍闈㈣瘯瀹屾垚浜嬩欢
      await this.apiClient.post('/users/statistics/events', {
        type: 'interview_completed',
        data: sessionData
      })

      return { success: true }
    } catch (error) {
      console.error('鏇存柊闈㈣瘯缁熻澶辫触:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 鑾峰彇鎺掕姒滄暟鎹?
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
      console.error('鑾峰彇鎺掕姒滃け璐?', error)
      return {
        success: false,
        error: this.handleError(error),
        data: []
      }
    }
  }

  /**
   * 鑾峰彇鐢ㄦ埛璇︾粏瓒嬪娍鏁版嵁
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
      console.error('鑾峰彇瓒嬪娍鏁版嵁澶辫触:', error)
      return {
        success: false,
        error: this.handleError(error),
        data: { trends: [], insights: [] }
      }
    }
  }

  /**
   * 澧炲己鐨勯敊璇鐞?
   */
  handleError(error) {
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || error.message

      switch (status) {
        case 400:
          return {
            code: 'INVALID_PARAMS',
            message: '璇锋眰鍙傛暟鏃犳晥',
            type: 'client',
            fallback: false
          }
        case 401:
          return {
            code: 'UNAUTHORIZED',
            message: '韬唤楠岃瘉澶辫触锛岃閲嶆柊鐧诲綍',
            type: 'auth',
            redirect: '/login'
          }
        case 403:
          return {
            code: 'FORBIDDEN',
            message: '鏉冮檺涓嶈冻锛屾棤娉曡闂璧勬簮',
            type: 'permission',
            fallback: false
          }
        case 404:
          return {
            code: 'DATA_NOT_FOUND',
            message: '缁熻鏁版嵁涓嶅瓨鍦紝宸插惎鐢ㄩ粯璁ゆ暟鎹?,
            type: 'notfound',
            fallback: true
          }
        case 429:
          return {
            code: 'RATE_LIMIT',
            message: '璇锋眰杩囦簬棰戠箒锛岃绋嶅悗閲嶈瘯',
            type: 'rate_limit',
            retryable: true
          }
        case 503:
          return {
            code: 'SERVICE_UNAVAILABLE',
            message: '缁熻鏈嶅姟鏆傛椂涓嶅彲鐢紝宸插惎鐢ㄥ鐢ㄦ暟鎹?,
            type: 'server',
            fallback: true
          }
        default:
          return {
            code: 'API_ERROR',
            message: message || '鏈嶅姟鍣ㄥ唴閮ㄩ敊璇?,
            type: status >= 500 ? 'server' : 'client',
            fallback: status >= 500
          }
      }
    } else if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: '缃戠粶杩炴帴澶辫触锛屽凡鍒囨崲鍒扮绾挎ā寮?,
        type: 'network',
        fallback: true,
        retryable: true
      }
    } else if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: '璇锋眰瓒呮椂锛岃妫€鏌ョ綉缁滆繛鎺?,
        type: 'timeout',
        retryable: true
      }
    } else {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || '鏈煡閿欒锛屽凡鍚敤榛樿鏁版嵁',
        type: 'unknown',
        fallback: true
      }
    }
  }

  /**
   * 閲嶈瘯鏈哄埗
   */
  async executeWithRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const errorInfo = this.handleError(error)

        // 濡傛灉涓嶆槸鍙噸璇曠殑閿欒锛岀洿鎺ユ姏鍑?
        if (!errorInfo.retryable && errorInfo.type !== 'timeout' && errorInfo.type !== 'network') {
          throw error
        }

        // 濡傛灉鏄渶鍚庝竴娆″皾璇曪紝鎶涘嚭閿欒
        if (attempt === maxRetries) {
          console.log(`閲嶈瘯 ${maxRetries} 娆″悗浠嶇劧澶辫触锛屽惎鐢ㄩ檷绾ф柟妗坄)
          throw error
        }

        // 绛夊緟鍚庨噸璇曪紝姣忔寤舵椂閫掑
        const retryDelay = delay * Math.pow(2, attempt - 1) // 鎸囨暟閫€閬?
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        console.log(`绗?${attempt} 娆￠噸璇曪紝${retryDelay}ms 鍚庢墽琛?..`)
      }
    }
  }

  /**
   * 闄嶇骇鏁版嵁
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
        title: '馃攧 鏁版嵁鍔犺浇涓?,
        content: '缁熻鏁版嵁姝ｅ湪鍔犺浇锛岃绋嶅悗鍒锋柊椤甸潰',
        priority: 'low'
      }],
      formatted: {
        interviewCount: { value: 0, formatted: '0次'次'娆? },
        practiceTime: { value: 0, formatted: '0次'次'鍒嗛挓' },
        averageScore: { value: 0, formatted: '0次'次'.0鍒? },
        rank: { level: 'N/A', formatted: 'N/A' }
      }
    }
  }
}

export default new StatisticsService()
