
/**
 * 鏅鸿兘绯荤粺妫€娴嬫湇鍔?
 * 澶氱淮搴︽娴嬬煩闃碉細璁惧銆佺綉缁溿€佹祻瑙堝櫒銆佺敤鎴烽厤缃?
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
        CAMERA_PERMISSION_DENIED: {
          severity: 'critical',
          solutions: [
            'Allow camera access from the browser address bar prompt',
            'Enable camera permissions in browser settings',
            'Reload the page and try again'
          ],
          helpLink: '/help/camera-permissions',
          autoActions: ['showPermissionGuide', 'retryAfterDelay']
        },
        LOW_BANDWIDTH: {
          severity: 'warning',
          solutions: [
            'Close other high-bandwidth applications',
            'Switch to a more stable network connection'
          ],
          autoFallback: 'reduce-quality-mode'
        },
        MICROPHONE_NOT_FOUND: {
          severity: 'critical',
          solutions: [
            'Check that the microphone is connected properly',
            'Enable microphone access in system settings',
            'Try an alternative microphone device'
          ],
          autoActions: ['detectAlternativeDevices']
        },
        BROWSER_NOT_SUPPORTED: {
          severity: 'critical',
          solutions: [
            'Use Chrome 89+ or Firefox 87+ versions',
            'Enable experimental Web features in the browser',
            'Update to the latest browser version'
          ],
          recommendedBrowser: 'Chrome'
        }
      }
    }

    return repairResults
  }

  /**
   * 鐢熸垚淇寤鸿
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

  // 杈呭姪鏂规硶
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
    if (deviceResult.cameraDevices.length > 1) score += 15 // 澶氳澶囧姞鍒?
    if (deviceResult.audioDevices.length > 1) score += 10

    return Math.min(score, 100)
  }

  async testBandwidth() {
    // 绠€鍖栫殑甯﹀娴嬭瘯
    const startTime = performance.now()
    try {
      await fetch('/api/bandwidth-test', { method: 'HEAD' })
      const endTime = performance.now()
      const responseTime = endTime - startTime

      // 鍩轰簬鍝嶅簲鏃堕棿浼扮畻甯﹀
      let downloadSpeed = 0
      if (responseTime < 100) downloadSpeed = 100 // 楂橀€?
      else if (responseTime < 300) downloadSpeed = 50 // 涓€?
      else downloadSpeed = 10 // 浣庨€?

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
        await fetch(api.url, { method: 'HEAD' })
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
    // 澶氭娴嬭瘯缃戠粶绋冲畾鎬?
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

    // API杩為€氭€ц瘎鍒?
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
      return `${browser} ${version} (鎺ㄨ崘)`
    } else {
      return 'Chrome 89+ (鎺ㄨ崘鍗囩骇)'
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

    // 娴忚鍣ㄧ増鏈瘎鍒?
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
      confidence: Math.random() * 0.3 + 0.7 // 妯℃嫙缃俊搴?
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
      readiness: status === 'ready' ? '绯荤粺灏辩华锛屽彲浠ュ紑濮嬮潰璇? : '闇€瑕佽В鍐抽儴鍒嗛棶棰樺悗鍐嶅紑濮嬮潰璇?
    }
  }

  handleDeviceError(error) {
    if (error.name === 'NotAllowedError') {
      return { code: 'CAMERA_PERMISSION_DENIED', message: '鎽勫儚澶存潈闄愯鎷掔粷', error }
    } else if (error.name === 'NotFoundError') {
      return { code: 'MICROPHONE_NOT_FOUND', message: '鏈壘鍒板彲鐢ㄧ殑楹﹀厠椋庤澶?, error }
    } else {
      return { code: 'DEVICE_ERROR', message: '璁惧璁块棶澶辫触', error }
    }
  }

  handleNetworkError(error) {
    return { code: 'NETWORK_ERROR', message: '缃戠粶杩炴帴娴嬭瘯澶辫触', error }
  }

  handleBrowserError(error) {
    return { code: 'BROWSER_ERROR', message: '娴忚鍣ㄥ吋瀹规€ф娴嬪け璐?, error }
  }

  handleProfileError(error) {
    return { code: 'PROFILE_ERROR', message: '鐢ㄦ埛閰嶇疆楠岃瘉澶辫触', error }
  }

  handleSystemCheckError(error, partialResults) {
    return {
      overall: { status: 'error', score: 0, error: error.message },
      layers: partialResults.layers || {},
      errors: [error.message],
      warnings: ['绯荤粺妫€鏌ユ湭瀹屾垚锛岃閲嶈瘯'],
      recommendations: ['妫€鏌ョ綉缁滆繛鎺?, '鍒锋柊椤甸潰閲嶈瘯', '鑱旂郴鎶€鏈敮鎸?]
    }
  }
}

export default new SystemCheckService()
