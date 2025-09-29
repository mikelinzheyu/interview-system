/**
 * 系统降级和容错工具
 * 提供各种场景下的降级方案
 */

/**
 * 问题生成降级管理
 */
export class QuestionFallbackManager {
  constructor() {
    this.fallbackQuestions = this.initFallbackQuestions()
    this.usedQuestions = new Set()
  }

  /**
   * 初始化本地降级问题库
   */
  initFallbackQuestions() {
    return {
      '前端开发工程师': {
        '初级': [
          {
            question: 'HTML5有哪些新特性？请举例说明。',
            skills: ['HTML5', 'Web标准'],
            difficulty: '初级',
            answer: 'HTML5新增了语义化标签、Canvas、本地存储、WebSocket等特性...'
          },
          {
            question: '解释CSS盒模型的概念。',
            skills: ['CSS', '布局'],
            difficulty: '初级',
            answer: 'CSS盒模型包括margin、border、padding和content四个部分...'
          },
          {
            question: 'JavaScript的基本数据类型有哪些？',
            skills: ['JavaScript', '基础语法'],
            difficulty: '初级',
            answer: 'JavaScript有7种基本数据类型：number、string、boolean、null、undefined、symbol、bigint...'
          }
        ],
        '中级': [
          {
            question: '解释JavaScript闭包的概念及其应用场景。',
            skills: ['JavaScript', '闭包', '作用域'],
            difficulty: '中级',
            answer: '闭包是指有权访问另一个函数作用域中变量的函数...'
          },
          {
            question: 'Vue.js的响应式原理是什么？',
            skills: ['Vue.js', '响应式', 'MVVM'],
            difficulty: '中级',
            answer: 'Vue.js使用数据劫持结合发布者-订阅者模式的方式...'
          },
          {
            question: '如何优化网页的加载性能？',
            skills: ['性能优化', 'Web优化'],
            difficulty: '中级',
            answer: '可以从减少HTTP请求、压缩资源、使用CDN、缓存策略等方面优化...'
          }
        ],
        '高级': [
          {
            question: '设计一个前端微服务架构方案。',
            skills: ['微前端', '架构设计', '工程化'],
            difficulty: '高级',
            answer: '微前端架构需要考虑应用拆分、路由管理、状态共享、构建部署等...'
          },
          {
            question: '如何设计一个高可用的前端监控系统？',
            skills: ['监控系统', '性能分析', '错误收集'],
            difficulty: '高级',
            answer: '监控系统需要包括性能监控、错误监控、用户行为分析等模块...'
          }
        ]
      },
      '后端开发工程师': {
        '初级': [
          {
            question: 'Java中String、StringBuilder和StringBuffer的区别？',
            skills: ['Java', '字符串处理'],
            difficulty: '初级',
            answer: 'String是不可变的，StringBuilder和StringBuffer是可变的...'
          },
          {
            question: '什么是RESTful API？请说明其设计原则。',
            skills: ['REST', 'API设计'],
            difficulty: '初级',
            answer: 'RESTful API是一种基于REST架构风格的Web服务接口设计...'
          }
        ],
        '中级': [
          {
            question: 'Spring Boot的自动配置原理是什么？',
            skills: ['Spring Boot', '自动配置'],
            difficulty: '中级',
            answer: 'Spring Boot通过@EnableAutoConfiguration注解和条件注解实现自动配置...'
          },
          {
            question: '如何解决数据库的高并发问题？',
            skills: ['数据库', '高并发', '性能优化'],
            difficulty: '中级',
            answer: '可以通过读写分离、分库分表、缓存、连接池等方式解决...'
          }
        ]
      }
    }
  }

  /**
   * 获取降级问题
   * @param {string} position 职位
   * @param {string} level 级别
   * @param {Array} skills 技能
   * @returns {Object}
   */
  getFallbackQuestion(position = '前端开发工程师', level = '中级', skills = []) {
    const positionQuestions = this.fallbackQuestions[position]
    if (!positionQuestions) {
      position = '前端开发工程师' // 默认职位
    }

    const levelQuestions = this.fallbackQuestions[position]?.[level] ||
                          this.fallbackQuestions[position]?.['中级'] ||
                          this.fallbackQuestions['前端开发工程师']['中级']

    // 过滤已使用的问题
    const availableQuestions = levelQuestions.filter(q =>
      !this.usedQuestions.has(q.question)
    )

    if (availableQuestions.length === 0) {
      // 重置使用记录
      this.usedQuestions.clear()
      return levelQuestions[0]
    }

    // 优先选择技能匹配的问题
    const matchedQuestions = availableQuestions.filter(q =>
      skills.some(skill => q.skills.some(s =>
        s.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(s.toLowerCase())
      ))
    )

    const selectedQuestion = matchedQuestions.length > 0
      ? matchedQuestions[Math.floor(Math.random() * matchedQuestions.length)]
      : availableQuestions[Math.floor(Math.random() * availableQuestions.length)]

    this.usedQuestions.add(selectedQuestion.question)

    return {
      question: selectedQuestion.question,
      skills: selectedQuestion.skills,
      difficulty: selectedQuestion.difficulty,
      answer: selectedQuestion.answer,
      fallback: true,
      source: 'local_cache'
    }
  }
}

/**
 * 语音识别降级管理
 */
export class SpeechFallbackManager {
  constructor() {
    this.isWebSpeechSupported = this.checkWebSpeechSupport()
    this.fallbackMethods = ['manual_input', 'voice_upload']
  }

  /**
   * 检查Web Speech API支持
   */
  checkWebSpeechSupport() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  /**
   * 获取降级方案
   */
  getFallbackOptions() {
    const options = []

    if (this.isWebSpeechSupported) {
      options.push({
        type: 'web_speech',
        name: '浏览器语音识别',
        description: '使用浏览器内置的语音识别功能',
        reliability: 'high'
      })
    }

    options.push({
      type: 'manual_input',
      name: '手动输入',
      description: '直接输入文字回答',
      reliability: 'high'
    })

    options.push({
      type: 'voice_upload',
      name: '录音上传',
      description: '录制语音文件后上传处理',
      reliability: 'medium'
    })

    return options
  }
}

/**
 * 视频监控降级管理
 */
export class VideoFallbackManager {
  constructor() {
    this.isVideoSupported = this.checkVideoSupport()
  }

  /**
   * 检查视频支持
   */
  checkVideoSupport() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  /**
   * 获取降级选项
   */
  getFallbackOptions() {
    const options = []

    if (this.isVideoSupported) {
      options.push({
        type: 'camera_on',
        name: '开启摄像头',
        description: '正常的视频面试模式'
      })
    }

    options.push({
      type: 'camera_off',
      name: '关闭摄像头',
      description: '纯音频面试模式'
    })

    options.push({
      type: 'text_only',
      name: '纯文字模式',
      description: '仅通过文字进行面试'
    })

    return options
  }
}

/**
 * 网络连接降级管理
 */
export class NetworkFallbackManager {
  constructor() {
    this.connectionStatus = this.getConnectionStatus()
    this.offlineData = this.loadOfflineData()
  }

  /**
   * 获取网络连接状态
   */
  getConnectionStatus() {
    return {
      online: navigator.onLine,
      speed: this.getConnectionSpeed(),
      type: this.getConnectionType()
    }
  }

  /**
   * 获取连接速度评估
   */
  getConnectionSpeed() {
    // 简单的连接速度评估
    if (navigator.connection) {
      const effectiveType = navigator.connection.effectiveType
      const speedMap = {
        'slow-2g': 'very_slow',
        '2g': 'slow',
        '3g': 'medium',
        '4g': 'fast'
      }
      return speedMap[effectiveType] || 'unknown'
    }
    return 'unknown'
  }

  /**
   * 获取连接类型
   */
  getConnectionType() {
    return navigator.connection?.type || 'unknown'
  }

  /**
   * 加载离线数据
   */
  loadOfflineData() {
    try {
      const data = localStorage.getItem('interview_offline_data')
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('加载离线数据失败:', error)
      return null
    }
  }

  /**
   * 保存离线数据
   */
  saveOfflineData(data) {
    try {
      localStorage.setItem('interview_offline_data', JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      }))
    } catch (error) {
      console.error('保存离线数据失败:', error)
    }
  }

  /**
   * 获取离线模式选项
   */
  getOfflineOptions() {
    return {
      questions: this.offlineData?.questions || [],
      analysis: this.offlineData?.analysis || {},
      settings: this.offlineData?.settings || {},
      canContinue: !!this.offlineData
    }
  }
}

/**
 * 主降级管理器
 */
export class FallbackManager {
  constructor() {
    this.questionManager = new QuestionFallbackManager()
    this.speechManager = new SpeechFallbackManager()
    this.videoManager = new VideoFallbackManager()
    this.networkManager = new NetworkFallbackManager()
  }

  /**
   * 获取系统能力评估
   */
  getSystemCapabilities() {
    return {
      speech: this.speechManager.isWebSpeechSupported,
      video: this.videoManager.isVideoSupported,
      network: this.networkManager.connectionStatus,
      localStorage: this.checkLocalStorageSupport(),
      webWorker: !!window.Worker,
      timestamp: Date.now()
    }
  }

  /**
   * 检查localStorage支持
   */
  checkLocalStorageSupport() {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 获取推荐的运行模式
   */
  getRecommendedMode() {
    const capabilities = this.getSystemCapabilities()

    if (!capabilities.network.online) {
      return {
        mode: 'offline',
        reason: '网络离线',
        features: ['local_questions', 'basic_analysis']
      }
    }

    if (capabilities.network.speed === 'very_slow' || capabilities.network.speed === 'slow') {
      return {
        mode: 'low_bandwidth',
        reason: '网络较慢',
        features: ['text_only', 'compressed_data']
      }
    }

    if (!capabilities.video && !capabilities.speech) {
      return {
        mode: 'text_only',
        reason: '媒体设备不支持',
        features: ['text_input', 'basic_interaction']
      }
    }

    return {
      mode: 'full',
      reason: '全功能可用',
      features: ['video', 'speech', 'ai_analysis', 'real_time']
    }
  }
}

// 创建全局实例
export const fallbackManager = new FallbackManager()
export default fallbackManager