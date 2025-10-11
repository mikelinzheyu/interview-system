import * as aiApi from '@/api/ai'
import logger, { apiLogger } from '@/utils/logger'

/**
 * Dify工作流服务
 * 集成Dify AI工作流API，实现智能题目生成和答案分析
 * 通过后端代理调用 Dify API，避免 CORS 问题
 */
export class DifyService {
  constructor() {
    // 不再直接调用 Dify API，而是通过后端代理
    this.workflowUrl = 'https://udify.app/workflow/u4Pzho5oyj5HIOn8'
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
    const startTime = Date.now()

    try {
      const {
        level = '中级',
        count = 1,
        excludeQuestions = []
      } = options

      apiLogger.info('开始Dify工作流题目生成:', { profession, level, count })

      // 通过后端代理调用 Dify 工作流
      const response = await aiApi.callDifyWorkflow({
        requestType: 'generate_questions',
        jobTitle: profession
      })

      if (response.code === 200 && response.data) {
        const questions = response.data.generated_questions || []

        // 随机选择一道题目
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

        return {
          success: true,
          data: {
            question: randomQuestion || '请描述一下你在' + profession + '方面的经验',
            expectedAnswer: '这是一道开放性问题,主要考察候选人的实际经验和表达能力。',
            keywords: this.extractKeywords(profession),
            category: profession,
            difficulty: level,
            generatedBy: 'dify_workflow',
            confidenceScore: 0.95,
            smartGeneration: true,
            searchSource: 'dify_rag',
            sourceUrls: [],
            sessionId: response.data.session_id // 保存 session_id 供后续评分使用
          },
          metadata: {
            workflowId: response.data.metadata?.workflowId,
            processingTime: Date.now() - startTime,
            sessionId: response.data.session_id
          }
        }
      } else {
        throw new Error(response.message || '生成题目失败')
      }

    } catch (error) {
      logger.error('Dify题目生成失败:', error)

      return {
        success: false,
        error: error.message || '调用 Dify 失败',
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
   * @param {string} data.sessionId 会话ID (从题目生成时获取)
   * @returns {Promise<Object>}
   */
  async analyzeAnswerWithDify(data) {
    const startTime = Date.now()

    try {
      const { question, answer, profession = '通用', sessionId = '' } = data

      // 数据验证
      if (!question || !answer) {
        throw new Error('问题和答案不能为空')
      }

      apiLogger.info('开始Dify工作流答案分析:', { question, answer, profession, sessionId })

      // 通过后端代理调用 Dify 工作流
      const response = await aiApi.callDifyWorkflow({
        requestType: 'score_answer',
        sessionId: sessionId,
        question: question,
        candidateAnswer: answer
      })

      if (response.code === 200 && response.data) {
        return {
          success: true,
          source: 'dify_workflow',
          processingTime: Date.now() - startTime,
          data: {
            overallScore: response.data.overall_score || 75,
            summary: response.data.comprehensive_evaluation || '回答完成',
            suggestions: this.extractSuggestions(response.data.comprehensive_evaluation),

            // 简化评分
            technicalAccuracy: Math.floor((response.data.overall_score || 75) * 0.9),
            fluency: Math.floor((response.data.overall_score || 75) * 1.05),
            logicClarity: Math.floor((response.data.overall_score || 75) * 1.1),

            strengths: ['AI综合评价已完成'],
            weaknesses: ['请参考评价内容']
          },
          overallScore: response.data.overall_score || 75,
          summary: response.data.comprehensive_evaluation || '回答完成'
        }
      } else {
        throw new Error(response.message || 'Dify 分析失败')
      }

    } catch (error) {
      logger.error('Dify答案分析失败:', error)

      return {
        success: false,
        error: {
          code: 'DIFY_ANALYSIS_ERROR',
          message: error.message || 'Dify 分析失败'
        },
        fallbackAvailable: true
      }
    }
  }

  /**
   * 提取关键词
   */
  extractKeywords(profession) {
    const keywordMap = {
      'Python后端开发工程师': ['Python', 'Django', 'Flask', 'FastAPI', 'RESTful API'],
      '前端开发工程师': ['JavaScript', 'Vue.js', 'React', 'HTML', 'CSS'],
      'Java开发工程师': ['Java', 'Spring', 'SpringBoot', 'MyBatis', 'JVM'],
      '数据分析师': ['Python', 'SQL', 'Pandas', '数据可视化', '统计分析'],
      '算法工程师': ['机器学习', '深度学习', 'Python', 'TensorFlow', 'PyTorch']
    }

    return keywordMap[profession] || [profession]
  }

  /**
   * 从评价文本中提取建议
   */
  extractSuggestions(evaluation) {
    if (!evaluation) return []

    // 简单的建议提取逻辑
    const suggestions = []
    if (evaluation.includes('建议') || evaluation.includes('改进')) {
      const lines = evaluation.split(/[。\n]/)
      lines.forEach(line => {
        if (line.includes('建议') || line.includes('改进') || line.includes('可以')) {
          suggestions.push(line.trim())
        }
      })
    }

    return suggestions.length > 0 ? suggestions : ['请参考综合评价内容']
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