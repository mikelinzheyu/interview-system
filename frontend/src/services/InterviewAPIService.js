/**
 * AI智能面试系统 - API服务生态系统
 * 统一的API调用、错误处理、重试机制和降级策略
 */
import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'

/**
 * API重试管理器
 */
class APIRetryManager {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      retryableStatuses: [408, 429, 500, 502, 503, 504]
    }
  }

  /**
   * 执行带重试的API调用
   * @param {Function} apiCall API调用函数
   * @param {Object} options 重试选项
   * @returns {Promise}
   */
  async executeWithRetry(apiCall, options = {}) {
    const config = { ...this.retryConfig, ...options }
    let lastError

    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        const result = await apiCall()
        if (attempt > 0) {
          ElNotification.success({
            title: '重试成功',
            message: `第${attempt + 1}次尝试成功`,
            duration: 3000
          })
        }
        return result
      } catch (error) {
        lastError = error

        // 检查是否应该重试
        if (!this.shouldRetry(error, attempt, config)) {
          throw error
        }

        // 计算延迟时间（指数退避）
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        )

        console.log(`API调用失败，${delay}ms后重试 (${attempt + 1}/${config.maxRetries})`)

        if (attempt < config.maxRetries - 1) {
          ElMessage.warning(`请求失败，${delay/1000}秒后重试...`)
          await this.delay(delay)
        }
      }
    }

    throw lastError
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(error, attempt, config) {
    if (attempt >= config.maxRetries - 1) return false

    if (error.response) {
      return config.retryableStatuses.includes(error.response.status)
    }

    // 网络错误或超时也应重试
    return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT'
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 智能降级策略执行
   * @param {Function} primary 主要API
   * @param {Function} fallback 降级API
   * @returns {Promise}
   */
  async executeWithFallback(primary, fallback) {
    try {
      return await this.executeWithRetry(primary)
    } catch (error) {
      console.warn('主要API失败，启用降级方案', error)
      ElNotification.warning({
        title: '服务降级',
        message: '智能服务暂时不可用，已切换到基础模式',
        duration: 5000
      })

      try {
        return await this.executeWithRetry(fallback)
      } catch (fallbackError) {
        console.error('降级方案也失败了', fallbackError)
        throw fallbackError
      }
    }
  }
}

/**
 * 统一API服务层
 */
class InterviewAPIService {
  constructor() {
    this.retryManager = new APIRetryManager()
    this.setupAxiosInstance()
    this.setupInterceptors()
  }

  /**
   * 设置Axios实例
   */
  setupAxiosInstance() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 30000, // 增加超时时间
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * 设置拦截器生态系统
   */
  setupInterceptors() {
    // 请求拦截器增强版
    this.api.interceptors.request.use(
      config => {
        // JWT token自动注入
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求ID用于追踪
        config.metadata = {
          requestId: this.generateRequestId(),
          startTime: Date.now()
        }

        // 请求日志
        console.log(`[${config.metadata.requestId}] 发起请求:`, config.method.toUpperCase(), config.url)

        // 加载状态管理
        this.showLoading(config)

        return config
      },
      error => {
        console.error('请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器增强版
    this.api.interceptors.response.use(
      response => {
        const { config } = response
        const duration = Date.now() - config.metadata.startTime

        // 响应日志
        console.log(`[${config.metadata.requestId}] 请求完成:`, response.status, `${duration}ms`)

        // 隐藏加载状态
        this.hideLoading()

        // 统一数据格式处理
        const res = response.data
        if (res.code !== undefined && res.code !== 200) {
          ElMessage.error(res.message || '请求失败')
          return Promise.reject(new Error(res.message || '请求失败'))
        }

        return res
      },
      error => {
        const { config } = error
        if (config?.metadata) {
          const duration = Date.now() - config.metadata.startTime
          console.error(`[${config.metadata.requestId}] 请求失败:`, error.message, `${duration}ms`)
          this.hideLoading()
        }

        return this.handleResponseError(error)
      }
    )
  }

  /**
   * 智能错误处理
   */
  handleResponseError(error) {
    if (error.response) {
      const { status, data, config } = error.response

      // 特定接口的特殊处理
      if (status === 404 && config.url.includes('generate-question-smart')) {
        return this.fallbackToBasicGeneration(config)
      }

      // 通用错误处理
      switch (status) {
        case 401:
          this.handleUnauthorized()
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 429:
          ElMessage.error('请求过于频繁，请稍后再试')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        case 502:
        case 503:
        case 504:
          ElMessage.error('服务暂时不可用，请稍后再试')
          break
        default:
          ElMessage.error(data?.message || '网络错误')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  }

  /**
   * 处理未授权错误
   */
  handleUnauthorized() {
    ElMessage.error('登录已过期，请重新登录')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  }

  /**
   * 降级到基础问题生成
   */
  async fallbackToBasicGeneration(originalConfig) {
    console.log('智能问题生成失败，降级到基础生成')

    const fallbackConfig = {
      ...originalConfig,
      url: originalConfig.url.replace('generate-question-smart', 'generate-question')
    }

    try {
      const response = await this.api.request(fallbackConfig)

      // 标记为降级响应
      if (response.data) {
        response.data.fallbackUsed = true
        response.data.originalEndpoint = 'generate-question-smart'
      }

      return response
    } catch (fallbackError) {
      console.error('降级方案也失败了:', fallbackError)
      throw fallbackError
    }
  }

  /**
   * 生成请求ID
   */
  generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 显示加载状态
   */
  showLoading(config) {
    // 可以在这里集成全局loading状态
    if (config.showLoading !== false) {
      // 显示loading
    }
  }

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    // 隐藏loading
  }

  /**
   * 智能问题生成 (带重试和降级)
   */
  async generateQuestionSmart(params) {
    const primaryCall = () => this.api.post('/interview/generate-question-smart', params)
    const fallbackCall = () => this.api.post('/interview/generate-question', params)

    return this.retryManager.executeWithFallback(primaryCall, fallbackCall)
  }

  /**
   * 基础问题生成
   */
  async generateQuestion(params) {
    const apiCall = () => this.api.post('/interview/generate-question', params)
    return this.retryManager.executeWithRetry(apiCall)
  }

  /**
   * 回答分析 (带重试)
   */
  async analyzeAnswer(params) {
    const apiCall = () => this.api.post('/interview/analyze', params)
    return this.retryManager.executeWithRetry(apiCall)
  }

  /**
   * 五维度高级分析 (带重试和降级)
   */
  async analyzeAnswerAdvanced(params) {
    const primaryCall = () => this.api.post('/interview/analyze-advanced', params)
    const fallbackCall = () => this.api.post('/interview/analyze', params)

    return this.retryManager.executeWithFallback(primaryCall, fallbackCall)
  }

  /**
   * 语音转文字
   */
  async transcribeSpeech(audioData) {
    const apiCall = () => this.api.post('/interview/speech/transcribe', { audio: audioData })
    return this.retryManager.executeWithRetry(apiCall, { maxRetries: 2 })
  }

  /**
   * 获取API实例 (供其他服务使用)
   */
  getAPI() {
    return this.api
  }
}

// 创建单例实例
const interviewAPIService = new InterviewAPIService()

// 导出服务实例和工具类
export default interviewAPIService
export { InterviewAPIService, APIRetryManager }