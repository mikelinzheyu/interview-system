import axios from 'axios'

// EventEmitter polyfill for browser
class EventEmitter {
  constructor() {
    this.events = {}
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
    return this
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args)
      this.off(event, onceWrapper)
    }
    return this.on(event, onceWrapper)
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return this
    this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove)
    return this
  }

  emit(event, ...args) {
    if (!this.events[event]) return false
    this.events[event].forEach(listener => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
    return true
  }
}

/**
 * 弹性会话管理服务
 * 提供断线重连、状态恢复、AI服务降级等能力
 */
export class ResilientSessionService extends EventEmitter {
  constructor() {
    super()

    this.sessionState = {
      id: null,
      status: 'idle', // idle, active, paused, completed, reconnecting
      startTime: null,
      currentQuestionIndex: 0,
      answers: [],
      metadata: {},
      connectionQuality: 'good'
    }

    this.resilience = {
      heartbeat: {
        interval: 30000,
        timeout: 5000,
        failureCount: 0,
        maxFailures: 3
      },
      stateSnapshot: {
        frequency: 'onQuestionComplete',
        lastSnapshot: null,
        autoSaveInterval: 60000
      },
      recoveryStrategy: 'smartResume',
      offlineMode: {
        enableLocalStorage: true,
        syncOnReconnect: true,
        queuedOperations: []
      }
    }

    this.aiServiceFallback = {
      questionGeneration: {
        primary: 'smartQuestionGenerator',
        secondary: 'templateQuestionPool',
        tertiary: 'staticQuestionBank',
        currentService: 'primary'
      },
      answerAnalysis: {
        primary: 'fiveDimensionAnalyzer',
        secondary: 'basicScoreCalculator',
        tertiary: 'manualReview',
        currentService: 'primary'
      }
    }

    this.livePreview = {
      speechRecognition: {
        showConfidence: true,
        allowCorrection: true,
        realtimeDisplay: true,
        confidenceThreshold: 0.7
      },
      userGuidance: {
        speakingPaceIndicator: true,
        volumeLevelMeter: true,
        timeRemaining: true,
        optimalPaceRange: [120, 180] // words per minute
      }
    }

    this.adaptiveQuestionFlow = {
      difficultyAdaptation: {
        algorithm: 'bayesian',
        adjustmentTriggers: [
          'consecutiveCorrectAnswers',
          'responseTime',
          'confidenceLevel'
        ],
        personalizationWeight: 0.7,
        currentDifficulty: 50
      },
      multiPathFlow: {
        technicalTrack: { weight: 0.6, minQuestions: 3, completed: 0 },
        behavioralTrack: { weight: 0.3, minQuestions: 2, completed: 0 },
        projectTrack: { weight: 0.1, minQuestions: 1, completed: 0 }
      }
    }

    this.initializeService()
  }

  /**
   * 初始化服务
   */
  initializeService() {
    this.setupHeartbeat()
    this.setupAutoSave()
    this.setupConnectionMonitoring()
    this.loadSessionFromStorage()
  }

  /**
   * 创建新的面试会话
   */
  async createSession(config) {
    try {
      const sessionData = {
        position: config.position,
        level: config.level,
        skills: config.skills,
        duration: config.duration || 30,
        timestamp: Date.now()
      }

      // 尝试创建后端会话
      const response = await this.callWithFallback(
        'primary',
        () => axios.post('/api/interview/sessions', sessionData)
      )

      this.sessionState = {
        id: response?.data?.id || `local_${Date.now()}`,
        status: 'active',
        startTime: new Date(),
        currentQuestionIndex: 0,
        answers: [],
        metadata: sessionData,
        connectionQuality: 'good'
      }

      // 保存初始状态
      this.saveStateSnapshot()
      this.emit('sessionCreated', this.sessionState)

      return this.sessionState

    } catch (error) {
      console.error('创建会话失败:', error)
      // 离线模式创建会话
      return this.createOfflineSession(config)
    }
  }

  /**
   * 智能问题生成
   */
  async generateQuestion(previousQuestions = []) {
    const requestData = {
      position: this.sessionState.metadata.position,
      level: this.adjustDifficultyLevel(),
      skills: this.sessionState.metadata.skills,
      previousQuestions,
      adaptiveParams: this.getAdaptiveParams()
    }

    try {
      // 主服务：智能问题生成
      if (this.aiServiceFallback.questionGeneration.currentService === 'primary') {
        const response = await axios.post('/api/interview/generate-question-smart', requestData)
        if (response.data) {
          this.updateAdaptiveParams(response.data)
          return response.data
        }
      }

      // 降级到次要服务
      return await this.fallbackQuestionGeneration(requestData)

    } catch (error) {
      console.error('问题生成失败:', error)
      return this.handleQuestionGenerationFailure(error, requestData)
    }
  }

  /**
   * 弹性答案分析
   */
  async analyzeAnswer(question, answer, metadata = {}) {
    const analysisData = {
      question,
      answer,
      interviewId: this.sessionState.id,
      metadata: {
        ...metadata,
        responseTime: metadata.responseTime,
        confidence: metadata.confidence,
        wordCount: answer.split(' ').length
      }
    }

    try {
      // 主服务：五维度分析
      if (this.aiServiceFallback.answerAnalysis.currentService === 'primary') {
        const response = await axios.post('/api/interview/analyze-advanced', analysisData)
        if (response.data) {
          this.updateAnswerHistory(question, answer, response.data)
          return response.data
        }
      }

      // 降级到次要服务
      return await this.fallbackAnswerAnalysis(analysisData)

    } catch (error) {
      console.error('答案分析失败:', error)
      return this.handleAnalysisFailure(error, analysisData)
    }
  }

  /**
   * 实时语音识别处理
   */
  processLiveSpeechRecognition(recognitionResult) {
    const processedResult = {
      transcript: recognitionResult.transcript,
      confidence: recognitionResult.confidence,
      timestamp: Date.now(),
      wordCount: recognitionResult.transcript.split(' ').length,
      speakingPace: this.calculateSpeakingPace(recognitionResult),
      volumeLevel: recognitionResult.volume || 0.5
    }

    // 实时用户指导
    const guidance = this.generateRealtimeGuidance(processedResult)

    this.emit('speechProcessed', {
      result: processedResult,
      guidance
    })

    return processedResult
  }

  /**
   * 连接监控和自动重连
   */
  setupConnectionMonitoring() {
    // 监听网络状态变化
    window.addEventListener('online', this.handleConnectionRestore.bind(this))
    window.addEventListener('offline', this.handleConnectionLoss.bind(this))

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }

  /**
   * 心跳检测
   */
  setupHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.sendHeartbeat()
        this.resilience.heartbeat.failureCount = 0
        this.updateConnectionQuality('good')
      } catch (error) {
        this.resilience.heartbeat.failureCount++
        if (this.resilience.heartbeat.failureCount >= this.resilience.heartbeat.maxFailures) {
          this.handleConnectionFailure()
        } else {
          this.updateConnectionQuality('poor')
        }
      }
    }, this.resilience.heartbeat.interval)
  }

  /**
   * 自动保存机制
   */
  setupAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      this.saveStateSnapshot()
    }, this.resilience.stateSnapshot.autoSaveInterval)
  }

  /**
   * 状态快照保存
   */
  saveStateSnapshot() {
    const snapshot = {
      ...this.sessionState,
      timestamp: Date.now(),
      version: '2.0'
    }

    if (this.resilience.offlineMode.enableLocalStorage) {
      localStorage.setItem(`interview_session_${this.sessionState.id}`, JSON.stringify(snapshot))
    }

    this.resilience.stateSnapshot.lastSnapshot = snapshot
    this.emit('stateSaved', snapshot)
  }

  /**
   * 智能会话恢复
   */
  async recoverSession(sessionId) {
    try {
      // 尝试从服务器恢复
      const serverSession = await this.recoverFromServer(sessionId)
      if (serverSession) {
        return this.resumeSession(serverSession)
      }

      // 从本地存储恢复
      const localSession = this.recoverFromLocalStorage(sessionId)
      if (localSession) {
        return this.resumeSession(localSession)
      }

      throw new Error('无法恢复会话数据')

    } catch (error) {
      console.error('会话恢复失败:', error)
      return this.createRecoverySession()
    }
  }

  /**
   * 服务降级处理
   */
  async handleServiceDegradation(service, error) {
    const fallbackConfig = this.aiServiceFallback[service]

    if (fallbackConfig.currentService === 'primary') {
      console.warn(`${service}主服务失败，降级到次要服务`)
      fallbackConfig.currentService = 'secondary'
    } else if (fallbackConfig.currentService === 'secondary') {
      console.warn(`${service}次要服务失败，降级到备用服务`)
      fallbackConfig.currentService = 'tertiary'
    } else {
      console.error(`${service}所有服务均不可用`)
      this.emit('serviceUnavailable', { service, error })
    }

    // 记录降级事件
    this.logServiceEvent(service, 'degradation', error)
  }

  /**
   * 自适应难度调整
   */
  adjustDifficultyLevel() {
    const { difficultyAdaptation } = this.adaptiveQuestionFlow
    const recentAnswers = this.sessionState.answers.slice(-3)

    if (recentAnswers.length < 2) return difficultyAdaptation.currentDifficulty

    // 基于最近答案质量调整难度
    const avgScore = recentAnswers.reduce((sum, answer) => sum + (answer.score || 50), 0) / recentAnswers.length
    const avgResponseTime = recentAnswers.reduce((sum, answer) => sum + (answer.responseTime || 60000), 0) / recentAnswers.length

    let adjustment = 0

    // 根据答案质量调整
    if (avgScore > 80) adjustment += 10
    else if (avgScore < 50) adjustment -= 10

    // 根据响应时间调整
    if (avgResponseTime < 30000) adjustment += 5 // 快速回答，增加难度
    else if (avgResponseTime > 120000) adjustment -= 5 // 慢速回答，降低难度

    difficultyAdaptation.currentDifficulty = Math.max(10, Math.min(90,
      difficultyAdaptation.currentDifficulty + adjustment
    ))

    return difficultyAdaptation.currentDifficulty
  }

  /**
   * 实时用户指导生成
   */
  generateRealtimeGuidance(speechResult) {
    const guidance = {
      speakingPace: 'normal',
      volumeLevel: 'good',
      suggestions: []
    }

    // 语速分析
    if (speechResult.speakingPace < this.livePreview.userGuidance.optimalPaceRange[0]) {
      guidance.speakingPace = 'too_slow'
      guidance.suggestions.push('建议适当加快语速')
    } else if (speechResult.speakingPace > this.livePreview.userGuidance.optimalPaceRange[1]) {
      guidance.speakingPace = 'too_fast'
      guidance.suggestions.push('建议适当放慢语速')
    }

    // 音量分析
    if (speechResult.volumeLevel < 0.3) {
      guidance.volumeLevel = 'too_low'
      guidance.suggestions.push('请提高音量')
    } else if (speechResult.volumeLevel > 0.8) {
      guidance.volumeLevel = 'too_high'
      guidance.suggestions.push('请适当降低音量')
    }

    // 置信度分析
    if (speechResult.confidence < this.livePreview.speechRecognition.confidenceThreshold) {
      guidance.suggestions.push('语音识别置信度较低，建议重新回答')
    }

    return guidance
  }

  /**
   * 连接质量更新
   */
  updateConnectionQuality(quality) {
    if (this.sessionState.connectionQuality !== quality) {
      this.sessionState.connectionQuality = quality
      this.emit('connectionQualityChanged', quality)
    }
  }

  /**
   * 处理连接失败
   */
  handleConnectionFailure() {
    console.warn('连接失败，启动离线模式')
    this.sessionState.status = 'reconnecting'
    this.updateConnectionQuality('offline')

    // 启动重连尝试
    this.startReconnectionAttempts()

    this.emit('connectionLost')
  }

  /**
   * 处理连接恢复
   */
  async handleConnectionRestore() {
    console.info('网络连接已恢复')

    try {
      // 同步离线期间的操作
      await this.syncOfflineOperations()

      // 恢复心跳
      this.resilience.heartbeat.failureCount = 0
      this.updateConnectionQuality('good')

      // 更新会话状态
      if (this.sessionState.status === 'reconnecting') {
        this.sessionState.status = 'active'
      }

      this.emit('connectionRestored')

    } catch (error) {
      console.error('连接恢复处理失败:', error)
    }
  }

  /**
   * 同步离线操作
   */
  async syncOfflineOperations() {
    const { queuedOperations } = this.resilience.offlineMode

    for (const operation of queuedOperations) {
      try {
        await this.executeQueuedOperation(operation)
      } catch (error) {
        console.error('同步离线操作失败:', operation, error)
      }
    }

    // 清空队列
    this.resilience.offlineMode.queuedOperations = []
  }

  /**
   * 计算语速
   */
  calculateSpeakingPace(recognitionResult) {
    const wordCount = recognitionResult.transcript.split(' ').length
    const duration = recognitionResult.duration || 60000 // 默认1分钟
    return (wordCount / duration) * 60000 // 每分钟词数
  }

  /**
   * 服务调用带降级
   */
  async callWithFallback(serviceType, operation) {
    try {
      return await operation()
    } catch (error) {
      await this.handleServiceDegradation(serviceType, error)
      throw error
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer)
    }

    // 最终保存状态
    this.saveStateSnapshot()
  }

  // 辅助方法
  async sendHeartbeat() {
    return axios.post('/api/interview/heartbeat', {
      sessionId: this.sessionState.id,
      timestamp: Date.now()
    })
  }

  logServiceEvent(service, event, error) {
    const logEntry = {
      service,
      event,
      error: error?.message,
      timestamp: Date.now(),
      sessionId: this.sessionState.id
    }

    console.log('Service Event:', logEntry)
    // 可以发送到日志服务
  }

  createOfflineSession(config) {
    return {
      id: `offline_${Date.now()}`,
      status: 'active',
      startTime: new Date(),
      currentQuestionIndex: 0,
      answers: [],
      metadata: config,
      connectionQuality: 'offline',
      isOffline: true
    }
  }
}

export default new ResilientSessionService()