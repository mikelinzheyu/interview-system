import axios from 'axios'

/**
 * 智能系统检测服务
 * 多维度检测矩阵：设备、网络、浏览器、用户配置
 */
export class SystemCheckService {
  constructor() {
    this.checkMatrix = {
      deviceLayer: {
        cameraDevices: [],
        audioDevices: [],
        deviceQuality: 0,
        performanceScore: 0
      },
      networkLayer: {
        bandwidth: 0,
        latency: 0,
        stability: 0,
        apiConnectivity: {}
      },
      browserLayer: {
        webSpeechSupport: false,
        mediaDevicesSupport: false,
        webRTCSupport: false,
        recommendedBrowser: ''
      },
      profileLayer: {
        completeness: 0,
        skillsValidation: [],
        preferenceSetup: {}
      }
    }

    this.errorHandlingEngine = {
      autoRepair: {
        networkRetry: { attempts: 3, backoff: 'exponential' },
        deviceReconnect: { timeout: 10000 },
        cacheRefresh: { strategy: 'smart' }
      },
      errorKnowledgeBase: {
        'CAMERA_PERMISSION_DENIED': {
          severity: 'critical',
          solutions: [
            '点击地址栏的摄像头图标允许权限',
            '在浏览器设置中启用摄像头权限',
            '重新加载页面后再试'
          ],
          helpLink: '/help/camera-permissions',
          autoActions: ['showPermissionGuide', 'retryAfterDelay']
        },
        'LOW_BANDWIDTH': {
          severity: 'warning',
          solutions: ['建议关闭其他占用网络的应用', '切换到更稳定的网络'],
          autoFallback: 'reduce-quality-mode'
        },
        'MICROPHONE_NOT_FOUND': {
          severity: 'critical',
          solutions: [
            '检查麦克风是否正确连接',
            '在系统设置中启用麦克风',
            '尝试使用其他麦克风设备'
          ],
          autoActions: ['detectAlternativeDevices']
        },
        'BROWSER_NOT_SUPPORTED': {
          severity: 'critical',
          solutions: [
            '请使用 Chrome 89+ 或 Firefox 87+ 版本',
            '启用浏览器的实验性Web功能',
            '更新到最新浏览器版本'
          ],
          recommendedBrowser: 'Chrome'
        }
      }
    }
  }

  /**
   * 执行全面系统检查
   */
  async performFullSystemCheck(progressCallback) {
    const results = {
      overall: { status: 'checking', score: 0 },
      layers: {},
      errors: [],
      warnings: [],
      recommendations: []
    }

    try {
      // 1. 设备层检测
      progressCallback?.({ stage: 'device', progress: 0, message: '检测摄像头和麦克风设备...' })
      results.layers.device = await this.checkDeviceLayer()

      // 2. 网络层检测
      progressCallback?.({ stage: 'network', progress: 25, message: '测试网络连接和带宽...' })
      results.layers.network = await this.checkNetworkLayer()

      // 3. 浏览器兼容性检测
      progressCallback?.({ stage: 'browser', progress: 50, message: '检查浏览器兼容性...' })
      results.layers.browser = await this.checkBrowserLayer()

      // 4. 用户配置层检测
      progressCallback?.({ stage: 'profile', progress: 75, message: '验证用户配置信息...' })
      results.layers.profile = await this.checkProfileLayer()

      // 5. 综合评估
      progressCallback?.({ stage: 'analysis', progress: 90, message: '生成检测报告...' })
      results.overall = this.generateOverallAssessment(results.layers)

      progressCallback?.({ stage: 'complete', progress: 100, message: '系统检查完成' })
      return results

    } catch (error) {
      console.error('系统检查失败:', error)
      return this.handleSystemCheckError(error, results)
    }
  }

  /**
   * 设备层检测
   */
  async checkDeviceLayer() {
    const deviceResult = {
      status: 'checking',
      cameraDevices: [],
      audioDevices: [],
      selectedCamera: null,
      selectedAudio: null,
      deviceQuality: 0,
      performanceScore: 0,
      issues: []
    }

    try {
      // 检测媒体设备权限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      // 获取可用设备列表
      const devices = await navigator.mediaDevices.enumerateDevices()

      deviceResult.cameraDevices = devices.filter(device => device.kind === 'videoinput')
      deviceResult.audioDevices = devices.filter(device => device.kind === 'audioinput')

      // 设备质量评估
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0]
        const audioTrack = stream.getAudioTracks()[0]

        if (videoTrack) {
          const settings = videoTrack.getSettings()
          deviceResult.deviceQuality = this.assessVideoQuality(settings)
          deviceResult.selectedCamera = videoTrack.label
        }

        if (audioTrack) {
          deviceResult.selectedAudio = audioTrack.label
        }

        // 停止测试流
        stream.getTracks().forEach(track => track.stop())
      }

      // 性能评分
      deviceResult.performanceScore = this.calculateDevicePerformance(deviceResult)
      deviceResult.status = deviceResult.performanceScore > 70 ? 'success' : 'warning'

      return deviceResult

    } catch (error) {
      deviceResult.status = 'error'
      deviceResult.issues.push(this.handleDeviceError(error))
      return deviceResult
    }
  }

  /**
   * 网络层检测
   */
  async checkNetworkLayer() {
    const networkResult = {
      status: 'checking',
      bandwidth: 0,
      latency: 0,
      stability: 0,
      apiConnectivity: {},
      issues: []
    }

    try {
      // 带宽测试
      const bandwidthResult = await this.testBandwidth()
      networkResult.bandwidth = bandwidthResult.downloadSpeed

      // 延迟测试
      networkResult.latency = await this.testLatency()

      // API连通性测试
      networkResult.apiConnectivity = await this.testAPIConnectivity()

      // 连接稳定性评估
      networkResult.stability = await this.assessNetworkStability()

      // 综合网络评分
      const networkScore = this.calculateNetworkScore(networkResult)
      networkResult.status = networkScore > 70 ? 'success' : 'warning'

      return networkResult

    } catch (error) {
      networkResult.status = 'error'
      networkResult.issues.push(this.handleNetworkError(error))
      return networkResult
    }
  }

  /**
   * 浏览器兼容性检测
   */
  async checkBrowserLayer() {
    const browserResult = {
      status: 'checking',
      webSpeechSupport: false,
      mediaDevicesSupport: false,
      webRTCSupport: false,
      browserInfo: {},
      recommendedBrowser: '',
      issues: []
    }

    try {
      // 检测浏览器信息
      browserResult.browserInfo = this.detectBrowserInfo()

      // Web Speech API支持
      browserResult.webSpeechSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window

      // MediaDevices API支持
      browserResult.mediaDevicesSupport = !!navigator.mediaDevices?.getUserMedia

      // WebRTC支持
      browserResult.webRTCSupport = !!window.RTCPeerConnection

      // 确定推荐浏览器
      browserResult.recommendedBrowser = this.getRecommendedBrowser(browserResult)

      // 兼容性评分
      const compatibilityScore = this.calculateBrowserCompatibility(browserResult)
      browserResult.status = compatibilityScore > 80 ? 'success' : 'warning'

      return browserResult

    } catch (error) {
      browserResult.status = 'error'
      browserResult.issues.push(this.handleBrowserError(error))
      return browserResult
    }
  }

  /**
   * 用户配置层检测
   */
  async checkProfileLayer() {
    const profileResult = {
      status: 'checking',
      completeness: 0,
      skillsValidation: [],
      preferenceSetup: {},
      missingFields: [],
      issues: []
    }

    try {
      // 获取用户配置
      const userProfile = this.getUserProfile()

      // 配置完整性检查
      profileResult.completeness = this.calculateProfileCompleteness(userProfile)

      // 技能验证
      profileResult.skillsValidation = this.validateUserSkills(userProfile.skills)

      // 偏好设置检查
      profileResult.preferenceSetup = this.checkUserPreferences(userProfile)

      // 缺失字段检测
      profileResult.missingFields = this.detectMissingFields(userProfile)

      profileResult.status = profileResult.completeness > 80 ? 'success' : 'warning'

      return profileResult

    } catch (error) {
      profileResult.status = 'error'
      profileResult.issues.push(this.handleProfileError(error))
      return profileResult
    }
  }

  /**
   * 自动修复机制
   */
  async autoRepairSystem(issues) {
    const repairResults = []

    for (const issue of issues) {
      const repairConfig = this.errorHandlingEngine.autoRepair[issue.type]
      if (!repairConfig) continue

      try {
        switch (issue.type) {
          case 'networkRetry':
            const retryResult = await this.retryWithBackoff(issue.action, repairConfig)
            repairResults.push({ issue: issue.code, result: retryResult })
            break

          case 'deviceReconnect':
            const reconnectResult = await this.reconnectDevice(issue.deviceId, repairConfig.timeout)
            repairResults.push({ issue: issue.code, result: reconnectResult })
            break

          case 'cacheRefresh':
            await this.refreshCache(repairConfig.strategy)
            repairResults.push({ issue: issue.code, result: 'success' })
            break
        }
      } catch (error) {
        repairResults.push({ issue: issue.code, result: 'failed', error: error.message })
      }
    }

    return repairResults
  }

  /**
   * 生成修复建议
   */
  generateRepairSuggestions(checkResults) {
    const suggestions = []

    Object.values(checkResults.layers).forEach(layer => {
      layer.issues?.forEach(issue => {
        const knowledge = this.errorHandlingEngine.errorKnowledgeBase[issue.code]
        if (knowledge) {
          suggestions.push({
            severity: knowledge.severity,
            problem: issue.message,
            solutions: knowledge.solutions,
            helpLink: knowledge.helpLink,
            autoActions: knowledge.autoActions
          })
        }
      })
    })

    return suggestions
  }

  // 辅助方法
  assessVideoQuality(settings) {
    const { width, height, frameRate } = settings
    let quality = 0

    if (width >= 1920 && height >= 1080) quality += 40
    else if (width >= 1280 && height >= 720) quality += 30
    else if (width >= 640 && height >= 480) quality += 20
    else quality += 10

    if (frameRate >= 30) quality += 30
    else if (frameRate >= 24) quality += 20
    else quality += 10

    return Math.min(quality, 100)
  }

  calculateDevicePerformance(deviceResult) {
    let score = 0

    if (deviceResult.cameraDevices.length > 0) score += 25
    if (deviceResult.audioDevices.length > 0) score += 25
    if (deviceResult.deviceQuality > 50) score += 25
    if (deviceResult.cameraDevices.length > 1) score += 15 // 多设备加分
    if (deviceResult.audioDevices.length > 1) score += 10

    return Math.min(score, 100)
  }

  async testBandwidth() {
    // 简化的带宽测试
    const startTime = performance.now()
    try {
      const response = await fetch('/api/bandwidth-test', { method: 'HEAD' })
      const endTime = performance.now()
      const responseTime = endTime - startTime

      // 基于响应时间估算带宽
      let downloadSpeed = 0
      if (responseTime < 100) downloadSpeed = 100 // 高速
      else if (responseTime < 300) downloadSpeed = 50 // 中速
      else downloadSpeed = 10 // 低速

      return { downloadSpeed, responseTime }
    } catch (error) {
      return { downloadSpeed: 0, responseTime: 9999 }
    }
  }

  async testLatency() {
    const startTime = performance.now()
    try {
      await fetch('/api/ping', { method: 'HEAD' })
      return performance.now() - startTime
    } catch (error) {
      return 9999
    }
  }

  async testAPIConnectivity() {
    const apis = [
      { name: 'interview', url: '/api/interview/health' },
      { name: 'analysis', url: '/api/interview/analyze' },
      { name: 'cache', url: '/api/interview/cache/stats' }
    ]

    const connectivity = {}

    for (const api of apis) {
      try {
        const response = await fetch(api.url, { method: 'HEAD' })
        connectivity[api.name] = {
          status: response.ok ? 'connected' : 'error',
          responseTime: performance.now()
        }
      } catch (error) {
        connectivity[api.name] = {
          status: 'disconnected',
          error: error.message
        }
      }
    }

    return connectivity
  }

  async assessNetworkStability() {
    // 多次测试网络稳定性
    const tests = []
    for (let i = 0; i < 3; i++) {
      const latency = await this.testLatency()
      tests.push(latency)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const avgLatency = tests.reduce((sum, val) => sum + val, 0) / tests.length
    const variance = tests.reduce((sum, val) => sum + Math.pow(val - avgLatency, 2), 0) / tests.length

    return Math.max(0, 100 - variance / 10)
  }

  calculateNetworkScore(networkResult) {
    let score = 0

    if (networkResult.bandwidth > 50) score += 30
    else if (networkResult.bandwidth > 20) score += 20
    else score += 10

    if (networkResult.latency < 100) score += 25
    else if (networkResult.latency < 300) score += 15
    else score += 5

    if (networkResult.stability > 80) score += 25
    else if (networkResult.stability > 60) score += 15
    else score += 5

    // API连通性评分
    const connectedApis = Object.values(networkResult.apiConnectivity).filter(api => api.status === 'connected').length
    score += connectedApis * 5

    return Math.min(score, 100)
  }

  detectBrowserInfo() {
    const ua = navigator.userAgent
    let browser = 'unknown'
    let version = 'unknown'

    if (ua.includes('Chrome')) {
      browser = 'Chrome'
      version = ua.match(/Chrome\/([0-9]+)/)?.[1] || 'unknown'
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox'
      version = ua.match(/Firefox\/([0-9]+)/)?.[1] || 'unknown'
    } else if (ua.includes('Safari')) {
      browser = 'Safari'
      version = ua.match(/Safari\/([0-9]+)/)?.[1] || 'unknown'
    } else if (ua.includes('Edge')) {
      browser = 'Edge'
      version = ua.match(/Edge\/([0-9]+)/)?.[1] || 'unknown'
    }

    return { browser, version, userAgent: ua }
  }

  getRecommendedBrowser(browserResult) {
    const { browserInfo } = browserResult
    const { browser, version } = browserInfo

    const minVersions = {
      Chrome: 89,
      Firefox: 87,
      Safari: 14,
      Edge: 89
    }

    const currentVersion = parseInt(version)
    const minVersion = minVersions[browser]

    if (minVersion && currentVersion >= minVersion) {
      return `${browser} ${version} (推荐)`
    } else {
      return 'Chrome 89+ (推荐升级)'
    }
  }

  calculateBrowserCompatibility(browserResult) {
    let score = 0

    if (browserResult.webSpeechSupport) score += 30
    if (browserResult.mediaDevicesSupport) score += 30
    if (browserResult.webRTCSupport) score += 25

    const { browserInfo } = browserResult
    const { browser, version } = browserInfo
    const currentVersion = parseInt(version)

    // 浏览器版本评分
    if (browser === 'Chrome' && currentVersion >= 89) score += 15
    else if (browser === 'Firefox' && currentVersion >= 87) score += 15
    else if (browser === 'Safari' && currentVersion >= 14) score += 15
    else if (browser === 'Edge' && currentVersion >= 89) score += 15
    else score += 5

    return Math.min(score, 100)
  }

  getUserProfile() {
    return {
      position: localStorage.getItem('userPosition') || '',
      level: localStorage.getItem('userLevel') || '',
      skills: JSON.parse(localStorage.getItem('userSkills') || '[]'),
      preferences: JSON.parse(localStorage.getItem('userPreferences') || '{}')
    }
  }

  calculateProfileCompleteness(userProfile) {
    let completeness = 0

    if (userProfile.position) completeness += 30
    if (userProfile.level) completeness += 25
    if (userProfile.skills?.length > 0) completeness += 30
    if (Object.keys(userProfile.preferences).length > 0) completeness += 15

    return completeness
  }

  validateUserSkills(skills) {
    const validSkills = [
      'JavaScript', 'TypeScript', 'Vue.js', 'React', 'Angular',
      'Node.js', 'Python', 'Java', 'Spring Boot', 'MySQL'
    ]

    return skills?.map(skill => ({
      skill,
      isValid: validSkills.includes(skill),
      confidence: Math.random() * 0.3 + 0.7 // 模拟置信度
    })) || []
  }

  generateOverallAssessment(layers) {
    const layerScores = Object.values(layers).map(layer => {
      if (layer.status === 'success') return 85
      if (layer.status === 'warning') return 60
      return 30
    })

    const averageScore = layerScores.reduce((sum, score) => sum + score, 0) / layerScores.length

    let status = 'ready'
    if (averageScore < 50) status = 'critical'
    else if (averageScore < 75) status = 'warning'

    return {
      status,
      score: Math.round(averageScore),
      readiness: status === 'ready' ? '系统就绪，可以开始面试' : '需要解决部分问题后再开始面试'
    }
  }

  handleDeviceError(error) {
    if (error.name === 'NotAllowedError') {
      return { code: 'CAMERA_PERMISSION_DENIED', message: '摄像头权限被拒绝', error }
    } else if (error.name === 'NotFoundError') {
      return { code: 'MICROPHONE_NOT_FOUND', message: '未找到可用的麦克风设备', error }
    } else {
      return { code: 'DEVICE_ERROR', message: '设备访问失败', error }
    }
  }

  handleNetworkError(error) {
    return { code: 'NETWORK_ERROR', message: '网络连接测试失败', error }
  }

  handleBrowserError(error) {
    return { code: 'BROWSER_ERROR', message: '浏览器兼容性检测失败', error }
  }

  handleProfileError(error) {
    return { code: 'PROFILE_ERROR', message: '用户配置验证失败', error }
  }

  handleSystemCheckError(error, partialResults) {
    return {
      overall: { status: 'error', score: 0, error: error.message },
      layers: partialResults.layers || {},
      errors: [error.message],
      warnings: ['系统检查未完成，请重试'],
      recommendations: ['检查网络连接', '刷新页面重试', '联系技术支持']
    }
  }
}

export default new SystemCheckService()