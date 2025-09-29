import axios from 'axios'
import logger, { apiLogger } from '@/utils/logger'

/**
 * AI分析服务
 * 处理语音转文本、回答质量评估等AI相关功能
 */
export class AIAnalysisService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  /**
   * 设置请求拦截器
   */
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
      response => response,
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
   * 分析面试回答
   * @param {Object} data 分析数据
   * @param {string} data.question 面试问题
   * @param {string} data.answer 用户回答
   * @param {string} data.audioUrl 音频文件URL（可选）
   * @param {number} data.interviewId 面试ID
   * @returns {Promise<Object>}
   */
  async analyzeAnswer(data) {
    try {
      const response = await this.apiClient.post('/interview/analyze', {
        question: data.question,
        answer: data.answer,
        audioUrl: data.audioUrl,
        interviewId: data.interviewId,
        timestamp: Date.now()
      })

      // Mock服务器返回格式: {code: 200, message: "...", data: {...}}
      const apiData = response.data.data || response.data

      return {
        success: true,
        data: this.formatAnalysisResult(apiData)
      }
    } catch (error) {
      console.error('回答分析失败:', error)
      return {
        success: false,
        error: this.handleAnalysisError(error)
      }
    }
  }

  /**
   * 实时语音转文本
   * @param {Blob} audioBlob 音频数据
   * @returns {Promise<Object>}
   */
  async speechToText(audioBlob) {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await this.apiClient.post('/speech/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return {
        success: true,
        transcript: response.data.transcript,
        confidence: response.data.confidence
      }
    } catch (error) {
      console.error('语音转文本失败:', error)
      return {
        success: false,
        error: this.handleSpeechError(error)
      }
    }
  }

  /**
   * 获取AI面试反馈
   * @param {number} interviewId 面试ID
   * @returns {Promise<Object>}
   */
  async getInterviewFeedback(interviewId) {
    try {
      const response = await this.apiClient.get(`/interview/${interviewId}/feedback`)

      return {
        success: true,
        feedback: this.formatFeedback(response.data)
      }
    } catch (error) {
      console.error('获取面试反馈失败:', error)
      return {
        success: false,
        error: this.handleAnalysisError(error)
      }
    }
  }

  /**
   * 生成面试问题
   * @param {Object} params 参数
   * @param {string} params.position 职位
   * @param {string} params.level 级别
   * @param {Array} params.skills 技能要求
   * @returns {Promise<Object>}
   */
  async generateQuestion(params) {
    try {
      const response = await this.apiClient.post('/interview/generate-question', {
        position: params.position,
        level: params.level,
        skills: params.skills,
        previousQuestions: params.previousQuestions || []
      })

      // Mock服务器返回格式: {code: 200, message: "...", data: {...}}
      const apiData = response.data.data || response.data

      return {
        success: true,
        data: apiData,
        question: apiData.question,
        expectedAnswer: apiData.expectedAnswer || apiData.answer,
        keywords: apiData.keywords || apiData.skills || []
      }
    } catch (error) {
      console.error('生成问题失败:', error)
      return {
        success: false,
        error: this.handleAnalysisError(error)
      }
    }
  }

  /**
   * 五维度AI回答分析 (增强版)
   * @param {Object} data 分析数据
   * @param {string} data.question 面试问题
   * @param {string} data.answer 用户回答
   * @param {number} data.interviewId 面试ID
   * @param {boolean} data.includeDetailAnalysis 是否包含详细分析
   * @param {boolean} data.includeSuggestions 是否包含建议
   * @param {string} data.analysisMode 分析模式
   * @returns {Promise<Object>}
   */
  async analyzeAnswerAdvanced(data) {
    try {
      // 数据验证
      const validationErrors = this.validateAnalysisData(data)
      if (validationErrors.length > 0) {
        console.warn('五维度分析数据验证失败:', validationErrors)
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '输入数据验证失败',
            details: validationErrors,
            suggestion: '请检查输入的问题、回答和面试ID是否完整'
          }
        }
      }

      apiLogger.info('发起五维度分析请求', data)

      const response = await this.apiClient.post('/interview/analyze-advanced', {
        question: data.question,
        answer: data.answer,
        interviewId: data.interviewId,
        includeDetailAnalysis: data.includeDetailAnalysis !== false,
        includeSuggestions: data.includeSuggestions !== false,
        analysisMode: data.analysisMode || 'comprehensive'
      })

      console.log('五维度分析API响应:', response.data)

      // Mock服务器返回格式: {code: 200, message: "...", data: {...}}
      const apiData = response.data.data || response.data

      return {
        success: true,
        data: apiData,
        // 五维度评分
        technicalAccuracy: apiData.technicalAccuracy || apiData.dimensions?.technical,
        completeness: apiData.completeness,
        logicClarity: apiData.logicClarity,
        professionalTerms: apiData.professionalTerms,
        fluency: apiData.fluency,
        overallScore: apiData.overallScore,
        // 详细分析
        detailAnalysis: apiData.detailAnalysis,
        suggestions: apiData.suggestions,
        processingTime: apiData.processingTime,
        // 兼容旧版本字段
        ...this.formatAnalysisResult(apiData)
      }
    } catch (error) {
      logger.apiError('POST', '/interview/analyze-advanced', error, data)

      // 检查是否应该降级到基础分析
      if (this.shouldFallbackToBasicAnalysis(error)) {
        apiLogger.warn('五维度分析失败，尝试降级到基础分析')
        return await this.fallbackToBasicAnalysis(data)
      }

      return {
        success: false,
        error: this.handleAnalysisError(error)
      }
    }
  }

  /**
   * 智能问题生成 (增强版)
   * @param {Object} params 生成参数
   * @param {string} params.position 职位
   * @param {string} params.level 难度级别
   * @param {Array} params.skills 技能列表
   * @param {Array} params.previousQuestions 之前的问题
   * @param {boolean} params.includeMetadata 是否包含元数据
   * @param {boolean} params.includeDifficulty 是否包含难度信息
   * @returns {Promise<Object>}
   */
  async generateQuestionSmart(params) {
    try {
      console.log('发起智能问题生成API请求:', params)

      const response = await this.apiClient.post('/interview/generate-question-smart', {
        position: params.position,
        level: params.level,
        skills: params.skills,
        previousQuestions: params.previousQuestions || [],
        includeMetadata: params.includeMetadata !== false,
        includeDifficulty: params.includeDifficulty !== false,
        count: params.count || 1,
        category: params.category
      })

      console.log('智能问题生成API响应:', response.data)

      // Mock服务器返回格式: {code: 200, message: "...", data: {...}}
      const apiData = response.data.data || response.data

      return {
        success: true,
        data: apiData,
        // 兼容旧版本字段
        question: apiData.question,
        expectedAnswer: apiData.answer,
        keywords: apiData.skills || []
      }
    } catch (error) {
      console.error('智能问题生成失败:', error)
      return {
        success: false,
        error: this.handleAnalysisError(error)
      }
    }
  }

  /**
   * 格式化分析结果
   * @param {Object} rawData 原始数据
   * @returns {Object}
   */
  formatAnalysisResult(rawData) {
    return {
      overall: {
        score: rawData.overallScore || 0,
        grade: this.getGrade(rawData.overallScore),
        summary: rawData.summary || ''
      },
      dimensions: {
        technical: {
          score: rawData.technicalScore || 0,
          feedback: rawData.technicalFeedback || '',
          strengths: rawData.technicalStrengths || [],
          improvements: rawData.technicalImprovements || []
        },
        communication: {
          score: rawData.communicationScore || 0,
          feedback: rawData.communicationFeedback || '',
          clarity: rawData.clarity || 0,
          fluency: rawData.fluency || 0
        },
        logical: {
          score: rawData.logicalScore || 0,
          feedback: rawData.logicalFeedback || '',
          structure: rawData.structure || 0,
          coherence: rawData.coherence || 0
        }
      },
      keywords: {
        mentioned: rawData.mentionedKeywords || [],
        missing: rawData.missingKeywords || [],
        relevance: rawData.keywordRelevance || 0
      },
      suggestions: rawData.suggestions || [],
      nextQuestion: rawData.nextQuestion || null
    }
  }

  /**
   * 格式化反馈结果
   * @param {Object} rawData 原始数据
   * @returns {Object}
   */
  formatFeedback(rawData) {
    return {
      overallPerformance: {
        score: rawData.overallScore || 0,
        grade: this.getGrade(rawData.overallScore),
        summary: rawData.summary || '',
        strengths: rawData.strengths || [],
        weaknesses: rawData.weaknesses || []
      },
      questionAnalysis: rawData.questions?.map(q => ({
        question: q.question,
        answer: q.answer,
        score: q.score,
        analysis: q.analysis,
        expectedPoints: q.expectedPoints || [],
        mentionedPoints: q.mentionedPoints || []
      })) || [],
      recommendations: rawData.recommendations || [],
      skillGaps: rawData.skillGaps || [],
      nextSteps: rawData.nextSteps || []
    }
  }

  /**
   * 根据分数获取等级
   * @param {number} score 分数
   * @returns {string}
   */
  getGrade(score) {
    if (score >= 90) return 'A+'
    if (score >= 85) return 'A'
    if (score >= 80) return 'A-'
    if (score >= 75) return 'B+'
    if (score >= 70) return 'B'
    if (score >= 65) return 'B-'
    if (score >= 60) return 'C+'
    if (score >= 55) return 'C'
    if (score >= 50) return 'C-'
    return 'D'
  }

  /**
   * 判断是否应该降级到基础分析
   * @param {Error} error 错误对象
   * @returns {boolean}
   */
  shouldFallbackToBasicAnalysis(error) {
    // 404错误或服务不可用时降级
    return error.response?.status === 404 ||
           error.response?.status === 503 ||
           error.code === 'ECONNREFUSED' ||
           error.code === 'NETWORK_ERROR'
  }

  /**
   * 降级到基础分析
   * @param {Object} data 原始分析数据
   * @returns {Promise<Object>}
   */
  async fallbackToBasicAnalysis(data) {
    try {
      console.log('执行基础分析降级:', data)

      // 调用基础分析接口
      const result = await this.analyzeAnswer({
        question: data.question,
        answer: data.answer,
        interviewId: data.interviewId
      })

      if (result.success) {
        // 将基础分析结果转换为五维度格式
        return {
          success: true,
          data: {
            ...result.data,
            // 模拟五维度评分（基于总分）
            dimensions: this.generateFiveDimensionsFromScore(result.data.overallScore || 75),
            detailAnalysis: {
              strengths: result.data.strengths || ['回答基本完整'],
              weaknesses: result.data.weaknesses || ['可以更详细一些'],
              improvements: result.data.suggestions || ['建议补充更多细节']
            },
            fallbackMode: true, // 标记为降级模式
            fallbackReason: '五维度分析服务不可用，已自动切换到基础分析'
          },
          // 兼容五维度字段
          technicalAccuracy: Math.floor((result.data.overallScore || 75) * 0.9),
          completeness: Math.floor((result.data.overallScore || 75) * 0.95),
          logicClarity: Math.floor((result.data.overallScore || 75) * 1.1),
          professionalTerms: Math.floor((result.data.overallScore || 75) * 0.85),
          fluency: Math.floor((result.data.overallScore || 75) * 1.05),
          overallScore: result.data.overallScore || 75
        }
      } else {
        throw new Error('基础分析也失败了')
      }
    } catch (fallbackError) {
      console.error('基础分析降级也失败:', fallbackError)
      return {
        success: false,
        error: {
          code: 'FALLBACK_FAILED',
          message: '分析服务完全不可用',
          details: fallbackError.message,
          suggestion: '请稍后重试或联系技术支持'
        }
      }
    }
  }

  /**
   * 基于总分生成五维度评分
   * @param {number} totalScore 总分
   * @returns {Object}
   */
  generateFiveDimensionsFromScore(totalScore) {
    const base = Math.max(0, Math.min(100, totalScore))
    const variance = 10 // 各维度间的差异范围

    return {
      technical: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance)),
      communication: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance)),
      logic: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance)),
      comprehensive: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance)),
      innovation: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance))
    }
  }

  /**
   * 验证分析数据
   * @param {Object} data 分析数据
   * @returns {Array} 验证错误列表
   */
  validateAnalysisData(data) {
    const errors = []

    // 检查必需字段
    if (!data.question || typeof data.question !== 'string' || data.question.trim() === '') {
      errors.push({ field: 'question', message: '面试问题不能为空' })
    }

    if (!data.answer || typeof data.answer !== 'string' || data.answer.trim() === '') {
      errors.push({ field: 'answer', message: '面试回答不能为空' })
    }

    if (!data.interviewId || typeof data.interviewId !== 'number') {
      errors.push({ field: 'interviewId', message: '面试ID必须为有效数字' })
    }

    // 检查数据长度限制
    if (data.question && data.question.length > 2000) {
      errors.push({ field: 'question', message: '问题内容过长（最大2000字符）' })
    }

    if (data.answer && data.answer.length > 5000) {
      errors.push({ field: 'answer', message: '回答内容过长（最大5000字符）' })
    }

    // 检查数据质量
    if (data.answer && data.answer.trim().length < 10) {
      errors.push({ field: 'answer', message: '回答内容过短，无法进行有效分析' })
    }

    return errors
  }

  /**
   * 处理分析错误
   * @param {Error} error 错误对象
   * @returns {Object}
   */
  handleAnalysisError(error) {
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || error.message

      switch (status) {
        case 400:
          return {
            code: 'INVALID_INPUT',
            message: '输入数据无效',
            details: error.response.data,
            suggestion: '请检查输入的问题和回答是否完整'
          }
        case 404:
          return {
            code: 'API_NOT_FOUND',
            message: 'AI分析接口不可用',
            details: { url: error.config?.url, method: error.config?.method },
            suggestion: '请检查后端服务是否启动，或使用基础分析功能'
          }
        case 429:
          return {
            code: 'RATE_LIMIT',
            message: 'AI分析请求过于频繁，请稍后再试',
            suggestion: '建议等待30秒后重试'
          }
        case 503:
          return {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'AI服务暂时不可用',
            suggestion: '请稍后重试或联系技术支持'
          }
        default:
          return {
            code: 'ANALYSIS_ERROR',
            message: message,
            status,
            details: error.response.data
          }
      }
    } else if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: '网络连接失败',
        details: { timeout: error.code === 'ECONNABORTED' },
        suggestion: '请检查网络连接或后端服务状态'
      }
    } else {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || '未知错误',
        details: { originalError: error.toString() },
        suggestion: '请刷新页面重试或联系技术支持'
      }
    }
  }

  /**
   * 处理语音识别错误
   * @param {Error} error 错误对象
   * @returns {Object}
   */
  handleSpeechError(error) {
    if (error.response?.status === 413) {
      return { code: 'FILE_TOO_LARGE', message: '音频文件过大' }
    }
    if (error.response?.status === 415) {
      return { code: 'UNSUPPORTED_FORMAT', message: '不支持的音频格式' }
    }
    return this.handleAnalysisError(error)
  }

  /**
   * 本地存储分析结果
   * @param {number} interviewId 面试ID
   * @param {Object} result 分析结果
   */
  saveAnalysisResult(interviewId, result) {
    try {
      const key = `interview_analysis_${interviewId}`
      const data = {
        ...result,
        timestamp: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('保存分析结果到本地失败:', error)
    }
  }

  /**
   * 获取本地存储的分析结果
   * @param {number} interviewId 面试ID
   * @returns {Object|null}
   */
  getLocalAnalysisResult(interviewId) {
    try {
      const key = `interview_analysis_${interviewId}`
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('获取本地分析结果失败:', error)
      return null
    }
  }
}

export default new AIAnalysisService()