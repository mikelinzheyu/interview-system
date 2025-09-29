import axios from 'axios'
import logger, { apiLogger } from '@/utils/logger'

/**
 * Dify工作流服务
 * 集成Dify AI工作流API，实现智能题目生成和答案分析
 */
export class DifyService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://api.dify.ai/v1',
      timeout: 60000, // 增加超时时间，因为Dify工作流可能需要更长时间
      headers: {
        'Authorization': 'Bearer app-vZlc0w5Dio2gnrTkdlblcPXG',
        'Content-Type': 'application/json'
      }
    })

    this.workflowUrl = 'https://udify.app/workflow/u4Pzho5oyj5HIOn8'
    this.setupInterceptors()
  }

  /**
   * 设置请求拦截器
   */
  setupInterceptors() {
    this.apiClient.interceptors.request.use(
      config => {
        apiLogger.info('Dify API请求:', {
          url: config.url,
          method: config.method,
          data: config.data
        })
        return config
      },
      error => {
        apiLogger.error('Dify API请求失败:', error)
        return Promise.reject(error)
      }
    )

    this.apiClient.interceptors.response.use(
      response => {
        apiLogger.info('Dify API响应:', {
          status: response.status,
          data: response.data
        })
        return response
      },
      error => {
        apiLogger.error('Dify API响应错误:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        })
        return Promise.reject(error)
      }
    )
  }

  /**
   * 根据专业生成智能面试题目
   * @param {string} profession 专业名称
   * @param {Object} options 可选参数
   * @param {string} options.level 难度级别 (初级/中级/高级)
   * @param {number} options.count 题目数量
   * @param {Array} options.excludeQuestions 排除的题目ID列表
   * @returns {Promise<Object>}
   */
  async generateQuestionByProfession(profession, options = {}) {
    try {
      const {
        level = '中级',
        count = 1,
        excludeQuestions = []
      } = options

      apiLogger.info('开始Dify工作流题目生成:', { profession, level, count })

      const response = await this.apiClient.post('/workflows/runs', {
        inputs: {
          profession: profession,
          difficulty_level: level,
          question_count: count,
          exclude_questions: excludeQuestions.join(','),
          search_keywords: `${profession} 面试题 技术问题`,
          output_format: 'structured'
        },
        response_mode: 'blocking',
        user: `interview_user_${Date.now()}`
      })

      const workflowData = response.data.data

      if (workflowData.status === 'succeeded') {
        const outputs = workflowData.outputs

        // 解析Dify工作流返回的结构化数据
        const questionData = this.parseQuestionOutput(outputs)

        return {
          success: true,
          data: questionData,
          metadata: {
            workflowId: workflowData.workflow_run_id,
            processingTime: workflowData.elapsed_time,
            source: 'dify_workflow',
            profession: profession,
            level: level
          }
        }
      } else {
        throw new Error(`工作流执行失败: ${workflowData.status}`)
      }

    } catch (error) {
      logger.error('Dify题目生成失败:', error)

      // 如果Dify API失败，返回错误但提供降级选项
      return {
        success: false,
        error: this.handleDifyError(error),
        fallbackAvailable: true,
        profession: profession
      }
    }
  }

  /**
   * 使用Dify工作流分析面试答案
   * @param {Object} data 分析数据
   * @param {string} data.question 面试问题
   * @param {string} data.answer 用户回答
   * @param {string} data.profession 专业领域
   * @returns {Promise<Object>}
   */
  async analyzeAnswerWithDify(data) {
    try {
      const { question, answer, profession = '通用' } = data

      // 数据验证
      if (!question || !answer) {
        throw new Error('问题和答案不能为空')
      }

      apiLogger.info('开始Dify工作流答案分析:', { question, answer, profession })

      const response = await this.apiClient.post('/workflows/runs', {
        inputs: {
          interview_question: question,
          candidate_answer: answer,
          profession_context: profession,
          analysis_mode: 'comprehensive',
          evaluation_criteria: '准确性,完整性,逻辑性,专业性,表达能力'
        },
        response_mode: 'blocking',
        user: `interview_analysis_${Date.now()}`
      })

      const workflowData = response.data.data

      if (workflowData.status === 'succeeded') {
        const outputs = workflowData.outputs

        // 解析分析结果
        const analysisResult = this.parseAnalysisOutput(outputs)

        return {
          success: true,
          data: analysisResult,
          processingTime: workflowData.elapsed_time,
          source: 'dify_workflow'
        }
      } else {
        throw new Error(`答案分析工作流失败: ${workflowData.status}`)
      }

    } catch (error) {
      logger.error('Dify答案分析失败:', error)

      return {
        success: false,
        error: this.handleDifyError(error),
        fallbackAvailable: true
      }
    }
  }

  /**
   * 解析Dify工作流返回的题目数据
   * @param {Object} outputs Dify工作流输出
   * @returns {Object}
   */
  parseQuestionOutput(outputs) {
    try {
      // 假设Dify工作流返回的数据结构
      const questionText = outputs.generated_question || outputs.question || ''
      const category = outputs.question_category || outputs.category || '技术面试'
      const difficulty = outputs.difficulty_level || outputs.level || '中级'
      const keywords = outputs.keywords || outputs.tags || []
      const expectedAnswer = outputs.expected_answer || outputs.reference_answer || ''
      const searchSource = outputs.search_source || 'google_search'

      return {
        question: questionText,
        category: category,
        difficulty: difficulty,
        keywords: Array.isArray(keywords) ? keywords : keywords.split(','),
        expectedAnswer: expectedAnswer,
        generatedBy: 'dify_workflow',
        smartGeneration: true,
        confidenceScore: outputs.confidence_score || 0.9,
        searchSource: searchSource,
        sourceUrls: outputs.source_urls || [],
        professionalContext: outputs.profession_context || ''
      }
    } catch (error) {
      logger.error('解析Dify题目输出失败:', error)

      // 返回默认结构
      return {
        question: '请简单介绍一下您在该专业领域的经验和技能。',
        category: '通用面试',
        difficulty: '中级',
        keywords: ['经验', '技能', '专业能力'],
        expectedAnswer: '候选人应该能够清晰地描述自己的专业背景、技能水平和相关经验。',
        generatedBy: 'dify_fallback',
        smartGeneration: false,
        confidenceScore: 0.6
      }
    }
  }

  /**
   * 解析Dify工作流返回的分析结果
   * @param {Object} outputs Dify工作流输出
   * @returns {Object}
   */
  parseAnalysisOutput(outputs) {
    try {
      // 解析Dify工作流返回的分析数据
      const overallScore = parseInt(outputs.overall_score || outputs.total_score || 75)
      const summary = outputs.analysis_summary || outputs.summary || '回答基本符合要求。'
      const suggestions = outputs.improvement_suggestions || outputs.suggestions || []

      return {
        overallScore: overallScore,
        summary: summary,
        suggestions: Array.isArray(suggestions) ? suggestions : suggestions.split('\n').filter(s => s.trim()),

        // 详细评分项
        technicalAccuracy: parseInt(outputs.technical_score || overallScore * 0.9),
        completeness: parseInt(outputs.completeness_score || overallScore * 0.95),
        logicClarity: parseInt(outputs.logic_score || overallScore * 1.1),
        professionalTerms: parseInt(outputs.professional_score || overallScore * 0.85),
        fluency: parseInt(outputs.fluency_score || overallScore * 1.05),

        // 元数据
        analysisEngine: 'dify_workflow',
        difyAnalysis: true,
        strengths: outputs.strengths || ['回答较为完整'],
        weaknesses: outputs.weaknesses || ['可以更加深入'],
        keywordMatching: outputs.keyword_matching || 0.8,
        responseLength: outputs.response_length || 0,
        confidenceLevel: outputs.confidence_level || 'medium'
      }
    } catch (error) {
      logger.error('解析Dify分析输出失败:', error)

      // 返回默认分析结果
      return {
        overallScore: 70,
        summary: '回答基本符合要求，建议可以更加详细和深入。',
        suggestions: ['建议提供更多具体实例', '可以深入解释技术细节'],
        technicalAccuracy: 68,
        completeness: 72,
        logicClarity: 75,
        professionalTerms: 65,
        fluency: 73,
        analysisEngine: 'dify_fallback',
        difyAnalysis: false
      }
    }
  }

  /**
   * 获取推荐专业列表
   * @returns {Array}
   */
  getRecommendedProfessions() {
    return [
      { value: '前端开发', label: '前端开发', icon: '🌐' },
      { value: '后端开发', label: '后端开发', icon: '⚙️' },
      { value: '全栈开发', label: '全栈开发', icon: '🔧' },
      { value: '移动开发', label: '移动开发', icon: '📱' },
      { value: '数据科学', label: '数据科学', icon: '📊' },
      { value: '机器学习', label: '机器学习', icon: '🤖' },
      { value: '人工智能', label: '人工智能', icon: '🧠' },
      { value: '云计算', label: '云计算', icon: '☁️' },
      { value: '网络安全', label: '网络安全', icon: '🔒' },
      { value: '区块链', label: '区块链', icon: '⛓️' },
      { value: 'DevOps', label: 'DevOps', icon: '🔄' },
      { value: '测试工程师', label: '测试工程师', icon: '🧪' },
      { value: '产品经理', label: '产品经理', icon: '📋' },
      { value: '项目管理', label: '项目管理', icon: '📈' },
      { value: 'UI/UX设计', label: 'UI/UX设计', icon: '🎨' }
    ]
  }

  /**
   * 处理Dify API错误
   * @param {Error} error 错误对象
   * @returns {Object}
   */
  handleDifyError(error) {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 401:
          return {
            code: 'DIFY_AUTH_ERROR',
            message: 'Dify API认证失败',
            details: 'API密钥可能已过期或无效',
            suggestion: '请检查Dify API密钥配置'
          }
        case 403:
          return {
            code: 'DIFY_PERMISSION_ERROR',
            message: 'Dify API权限不足',
            details: '当前API密钥没有访问该工作流的权限',
            suggestion: '请检查工作流访问权限设置'
          }
        case 429:
          return {
            code: 'DIFY_RATE_LIMIT',
            message: 'Dify API请求频率超限',
            details: '请求过于频繁',
            suggestion: '请稍后重试，建议间隔30秒'
          }
        case 500:
          return {
            code: 'DIFY_SERVER_ERROR',
            message: 'Dify服务器内部错误',
            details: data.message || '工作流执行失败',
            suggestion: '请稍后重试或联系Dify技术支持'
          }
        default:
          return {
            code: 'DIFY_API_ERROR',
            message: `Dify API错误 (${status})`,
            details: data.message || error.message,
            suggestion: '请检查网络连接或Dify服务状态'
          }
      }
    } else if (error.request) {
      return {
        code: 'DIFY_NETWORK_ERROR',
        message: 'Dify API网络连接失败',
        details: 'Unable to reach Dify API server',
        suggestion: '请检查网络连接或防火墙设置'
      }
    } else {
      return {
        code: 'DIFY_UNKNOWN_ERROR',
        message: 'Dify集成未知错误',
        details: error.message,
        suggestion: '请刷新页面重试'
      }
    }
  }

  /**
   * 测试Dify连接
   * @returns {Promise<Object>}
   */
  async testConnection() {
    try {
      // 发送一个简单的测试请求
      const response = await this.apiClient.get('/apps')

      return {
        success: true,
        message: 'Dify API连接正常',
        status: response.status
      }
    } catch (error) {
      return {
        success: false,
        error: this.handleDifyError(error)
      }
    }
  }

  /**
   * 获取工作流状态
   * @param {string} workflowRunId 工作流运行ID
   * @returns {Promise<Object>}
   */
  async getWorkflowStatus(workflowRunId) {
    try {
      const response = await this.apiClient.get(`/workflows/runs/${workflowRunId}`)

      return {
        success: true,
        data: response.data.data
      }
    } catch (error) {
      return {
        success: false,
        error: this.handleDifyError(error)
      }
    }
  }
}

export default new DifyService()