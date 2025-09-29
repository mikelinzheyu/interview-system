/**
 * 实时问题诊断系统
 * 基于日志文件分析的智能问题诊断和解决方案推荐
 */
import { ElNotification, ElMessage } from 'element-plus'
import systemHealthMonitor from './SystemHealthMonitor.js'
import fallbackManager from '@/utils/fallback.js'

/**
 * 问题模式库
 */
const DIAGNOSTIC_PATTERNS = {
  // MediaUtils相关错误
  MEDIA_UTILS_ERROR: {
    patterns: [
      /MediaUtils\.checkSupport is not a function/i,
      /MediaUtils.*not defined/i,
      /Cannot read properties of undefined.*MediaUtils/i
    ],
    category: 'media',
    severity: 'high',
    title: 'MediaUtils模块错误',
    description: '媒体设备工具模块调用失败',
    solutions: [
      '检查MediaUtils模块导入是否正确',
      '确认方法调用方式：实例方法而非静态方法',
      '验证mediaUtils.js文件完整性',
      '检查浏览器媒体API支持情况'
    ]
  },

  // API接口404错误
  API_404_ERROR: {
    patterns: [
      /POST.*generate-question-smart.*404/i,
      /404.*Not Found.*api\/interview/i,
      /Request failed with status code 404/i
    ],
    category: 'api',
    severity: 'critical',
    title: 'API接口404错误',
    description: 'API接口路径不存在或后端服务未启动',
    solutions: [
      '检查后端服务是否正常运行',
      '验证接口路径配置是否正确',
      '确认vite.config.js代理配置',
      '检查后端接口是否已实现',
      '验证端口配置是否一致'
    ]
  },

  // 网络连接错误
  NETWORK_ERROR: {
    patterns: [
      /Network Error/i,
      /ECONNREFUSED/i,
      /ERR_CONNECTION_REFUSED/i,
      /fetch.*failed/i,
      /Connection timeout/i
    ],
    category: 'network',
    severity: 'critical',
    title: '网络连接错误',
    description: '无法连接到后端服务',
    solutions: [
      '检查网络连接状态',
      '确认后端服务器是否启动',
      '验证防火墙设置',
      '检查代理配置',
      '确认服务器地址和端口'
    ]
  },

  // 权限错误
  PERMISSION_ERROR: {
    patterns: [
      /Permission denied/i,
      /NotAllowedError/i,
      /User denied.*permission/i,
      /Camera access denied/i,
      /Microphone access denied/i
    ],
    category: 'permission',
    severity: 'medium',
    title: '设备权限错误',
    description: '用户拒绝或无法获取设备权限',
    solutions: [
      '引导用户手动授权摄像头和麦克风',
      '检查浏览器权限设置',
      '使用HTTPS协议访问',
      '提供权限设置指南',
      '启用降级模式（纯文字面试）'
    ]
  },

  // 设备不可用错误
  DEVICE_ERROR: {
    patterns: [
      /NotFoundError.*camera/i,
      /NotReadableError.*microphone/i,
      /Device not found/i,
      /Media device.*busy/i,
      /Camera.*occupied/i
    ],
    category: 'device',
    severity: 'medium',
    title: '设备访问错误',
    description: '摄像头或麦克风设备不可用',
    solutions: [
      '检查设备连接状态',
      '关闭其他占用设备的应用',
      '重新插拔设备',
      '检查设备驱动程序',
      '切换到其他可用设备'
    ]
  },

  // 浏览器兼容性错误
  BROWSER_COMPATIBILITY: {
    patterns: [
      /webkitSpeechRecognition.*not defined/i,
      /getUserMedia.*not supported/i,
      /WebRTC.*not available/i,
      /Browser does not support/i
    ],
    category: 'compatibility',
    severity: 'medium',
    title: '浏览器兼容性问题',
    description: '浏览器不支持所需功能',
    solutions: [
      '升级浏览器到最新版本',
      '使用现代浏览器（Chrome、Firefox、Edge）',
      '启用浏览器实验性功能',
      '使用兼容性降级方案',
      '提供浏览器升级指导'
    ]
  },

  // 性能相关错误
  PERFORMANCE_ERROR: {
    patterns: [
      /Memory.*exceeded/i,
      /Script.*timeout/i,
      /Page.*unresponsive/i,
      /Too many requests/i,
      /Rate limit exceeded/i
    ],
    category: 'performance',
    severity: 'medium',
    title: '性能问题',
    description: '系统性能异常或资源不足',
    solutions: [
      '刷新页面释放内存',
      '关闭不必要的浏览器标签',
      '清理浏览器缓存',
      '降低视频质量设置',
      '联系管理员检查服务器负载'
    ]
  }
}

/**
 * 实时诊断系统
 */
export class DiagnosticSystem {
  constructor() {
    this.isActive = false
    this.diagnosticHistory = []
    this.activeIssues = new Map()
    this.patterns = DIAGNOSTIC_PATTERNS
    this.observers = []

    // 绑定错误监听
    this.bindErrorListeners()
  }

  /**
   * 启动诊断系统
   */
  start() {
    if (this.isActive) return

    this.isActive = true
    console.log('🔍 实时诊断系统已启动')

    // 启动健康监控集成
    this.integrateHealthMonitor()

    // 定期清理历史记录
    this.startHistoryCleanup()

    ElNotification.info({
      title: '诊断系统',
      message: '实时问题诊断系统已启动',
      duration: 3000
    })
  }

  /**
   * 停止诊断系统
   */
  stop() {
    if (!this.isActive) return

    this.isActive = false
    this.observers.forEach(observer => observer.disconnect?.())
    this.observers = []

    console.log('🔍 实时诊断系统已停止')
  }

  /**
   * 绑定错误监听器
   */
  bindErrorListeners() {
    // 全局错误监听
    window.addEventListener('error', (event) => {
      this.analyzeError({
        type: 'javascript',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        timestamp: Date.now()
      })
    })

    // Promise错误监听
    window.addEventListener('unhandledrejection', (event) => {
      this.analyzeError({
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        error: event.reason,
        timestamp: Date.now()
      })
    })

    // 控制台错误监听
    this.interceptConsoleErrors()

    // 网络错误监听
    this.interceptNetworkErrors()
  }

  /**
   * 拦截控制台错误
   */
  interceptConsoleErrors() {
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args) => {
      originalError.apply(console, args)
      this.analyzeError({
        type: 'console_error',
        message: args.join(' '),
        timestamp: Date.now()
      })
    }

    console.warn = (...args) => {
      originalWarn.apply(console, args)
      this.analyzeError({
        type: 'console_warning',
        message: args.join(' '),
        timestamp: Date.now(),
        severity: 'low'
      })
    }
  }

  /**
   * 拦截网络错误
   */
  interceptNetworkErrors() {
    // 拦截fetch错误
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(window, args)

        if (!response.ok) {
          this.analyzeError({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0],
            status: response.status,
            timestamp: Date.now()
          })
        }

        return response
      } catch (error) {
        this.analyzeError({
          type: 'network',
          message: error.message,
          url: args[0],
          error: error,
          timestamp: Date.now()
        })
        throw error
      }
    }
  }

  /**
   * 集成健康监控
   */
  integrateHealthMonitor() {
    if (systemHealthMonitor.isMonitoring) {
      // 监听健康状态变化
      const originalShowAlert = systemHealthMonitor.showAlert
      systemHealthMonitor.showAlert = (result) => {
        // 调用原始方法
        originalShowAlert.call(systemHealthMonitor, result)

        // 分析健康监控警告
        this.analyzeHealthAlert(result)
      }
    }
  }

  /**
   * 分析健康监控警告
   */
  analyzeHealthAlert(healthResult) {
    this.analyzeError({
      type: 'health_monitor',
      message: healthResult.message,
      category: this.mapHealthToCategory(healthResult.key),
      severity: healthResult.critical ? 'critical' : 'medium',
      healthData: healthResult,
      timestamp: Date.now()
    })
  }

  /**
   * 映射健康检查到分类
   */
  mapHealthToCategory(healthKey) {
    const mapping = {
      'mediaSupport': 'media',
      'apiConnectivity': 'api',
      'networkStatus': 'network',
      'browserCompatibility': 'compatibility',
      'performance': 'performance'
    }
    return mapping[healthKey] || 'general'
  }

  /**
   * 分析错误并生成诊断
   */
  analyzeError(errorData) {
    if (!this.isActive) return

    const diagnosis = this.performDiagnosis(errorData)

    if (diagnosis) {
      this.recordDiagnosis(diagnosis)
      this.handleDiagnosis(diagnosis)
    }
  }

  /**
   * 执行诊断分析
   */
  performDiagnosis(errorData) {
    const message = errorData.message || ''
    let matchedPattern = null
    let confidence = 0

    // 模式匹配
    for (const [key, pattern] of Object.entries(this.patterns)) {
      for (const regex of pattern.patterns) {
        if (regex.test(message)) {
          const currentConfidence = this.calculateConfidence(message, pattern)
          if (currentConfidence > confidence) {
            matchedPattern = { key, ...pattern }
            confidence = currentConfidence
          }
        }
      }
    }

    if (!matchedPattern) {
      // 未匹配到模式，生成通用诊断
      matchedPattern = this.generateGenericDiagnosis(errorData)
      confidence = 0.3
    }

    return {
      id: this.generateDiagnosisId(),
      timestamp: Date.now(),
      errorData,
      pattern: matchedPattern,
      confidence,
      status: 'new',
      contextData: this.gatherContextData()
    }
  }

  /**
   * 计算匹配置信度
   */
  calculateConfidence(message, pattern) {
    let confidence = 0.5 // 基础置信度

    // 基于关键词数量调整
    const keywords = pattern.patterns.flatMap(p => p.source.split('|'))
    const matchedKeywords = keywords.filter(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase().replace(/[\\.*+?^${}()|[\]]/g, ''))
    )

    confidence += matchedKeywords.length * 0.1

    // 基于严重级别调整
    if (pattern.severity === 'critical') confidence += 0.2
    else if (pattern.severity === 'high') confidence += 0.1

    return Math.min(confidence, 1.0)
  }

  /**
   * 生成通用诊断
   */
  generateGenericDiagnosis(errorData) {
    return {
      key: 'GENERIC_ERROR',
      category: 'general',
      severity: errorData.severity || 'medium',
      title: '未知错误',
      description: '系统检测到未知错误',
      solutions: [
        '刷新页面重试',
        '检查网络连接',
        '清除浏览器缓存',
        '联系技术支持'
      ]
    }
  }

  /**
   * 收集上下文数据
   */
  gatherContextData() {
    const context = {
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 200),
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      online: navigator.onLine
    }

    // 获取系统能力
    try {
      context.capabilities = fallbackManager.getSystemCapabilities()
    } catch (error) {
      context.capabilities = null
    }

    // 获取健康状态
    try {
      const alerts = systemHealthMonitor.getCurrentAlerts()
      context.healthAlerts = alerts.length
    } catch (error) {
      context.healthAlerts = 0
    }

    return context
  }

  /**
   * 记录诊断结果
   */
  recordDiagnosis(diagnosis) {
    this.diagnosticHistory.push(diagnosis)
    this.activeIssues.set(diagnosis.id, diagnosis)

    // 保持历史记录在合理范围
    if (this.diagnosticHistory.length > 500) {
      this.diagnosticHistory.splice(0, 100)
    }

    // 保存到本地存储
    this.saveDiagnosticData(diagnosis)
  }

  /**
   * 处理诊断结果
   */
  handleDiagnosis(diagnosis) {
    const { pattern, confidence, errorData } = diagnosis

    // 高置信度的严重错误立即通知
    if (confidence > 0.7 && (pattern.severity === 'critical' || pattern.severity === 'high')) {
      this.showImmediateNotification(diagnosis)
    }

    // 更新错误统计
    this.updateErrorStatistics(pattern.category)

    // 触发自动修复（如果可用）
    this.attemptAutoFix(diagnosis)

    // 记录到控制台（开发模式）
    if (import.meta.env.DEV) {
      console.group(`🔍 诊断报告: ${pattern.title}`)
      console.log('错误详情:', errorData)
      console.log('匹配模式:', pattern.key)
      console.log('置信度:', `${Math.round(confidence * 100)}%`)
      console.log('解决方案:', pattern.solutions)
      console.groupEnd()
    }
  }

  /**
   * 显示即时通知
   */
  showImmediateNotification(diagnosis) {
    const { pattern, confidence } = diagnosis

    ElNotification({
      title: `🚨 ${pattern.title}`,
      message: pattern.description,
      type: pattern.severity === 'critical' ? 'error' : 'warning',
      duration: pattern.severity === 'critical' ? 0 : 8000,
      showClose: true,
      onClick: () => {
        this.showDetailedDiagnosis(diagnosis)
      }
    })
  }

  /**
   * 显示详细诊断
   */
  showDetailedDiagnosis(diagnosis) {
    // 这里可以打开一个详细的诊断弹窗
    // 或者跳转到诊断页面
    console.log('显示详细诊断:', diagnosis)
  }

  /**
   * 尝试自动修复
   */
  attemptAutoFix(diagnosis) {
    const { pattern } = diagnosis

    switch (pattern.key) {
      case 'MEDIA_UTILS_ERROR':
        this.autoFixMediaUtils()
        break
      case 'PERMISSION_ERROR':
        this.autoFixPermissions()
        break
      case 'API_404_ERROR':
        this.autoFixAPI404()
        break
      default:
        // 无自动修复方案
        break
    }
  }

  /**
   * 自动修复MediaUtils错误
   */
  async autoFixMediaUtils() {
    try {
      // 尝试重新导入模块
      const MediaUtils = (await import('@/utils/mediaUtils.js')).default
      if (MediaUtils && typeof MediaUtils.checkSupport === 'function') {
        ElMessage.success('MediaUtils模块已自动修复')
        this.markIssueResolved('MEDIA_UTILS_ERROR')
      }
    } catch (error) {
      console.log('自动修复MediaUtils失败:', error)
    }
  }

  /**
   * 自动修复权限问题
   */
  async autoFixPermissions() {
    try {
      // 尝试重新请求权限
      const MediaUtils = (await import('@/utils/mediaUtils.js')).default
      const permissions = await MediaUtils.requestPermissions()

      if (permissions.camera && permissions.microphone) {
        ElMessage.success('设备权限已获取')
        this.markIssueResolved('PERMISSION_ERROR')
      }
    } catch (error) {
      console.log('自动修复权限失败:', error)
    }
  }

  /**
   * 自动修复API 404错误
   */
  async autoFixAPI404() {
    // 检查后端服务状态
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        timeout: 5000
      })

      if (response.ok) {
        ElMessage.success('后端服务连接已恢复')
        this.markIssueResolved('API_404_ERROR')
      }
    } catch (error) {
      // 建议用户检查后端服务
      ElNotification.warning({
        title: '后端服务检查',
        message: '请确认后端服务是否正常运行',
        duration: 10000
      })
    }
  }

  /**
   * 标记问题已解决
   */
  markIssueResolved(patternKey) {
    for (const [id, issue] of this.activeIssues) {
      if (issue.pattern.key === patternKey) {
        issue.status = 'resolved'
        issue.resolvedAt = Date.now()
      }
    }
  }

  /**
   * 更新错误统计
   */
  updateErrorStatistics(category) {
    const stats = this.getErrorStatistics()
    stats[category] = (stats[category] || 0) + 1
    stats.total = (stats.total || 0) + 1
    stats.lastUpdate = Date.now()

    localStorage.setItem('diagnostic_stats', JSON.stringify(stats))
  }

  /**
   * 获取错误统计
   */
  getErrorStatistics() {
    try {
      return JSON.parse(localStorage.getItem('diagnostic_stats') || '{}')
    } catch (error) {
      return {}
    }
  }

  /**
   * 保存诊断数据
   */
  saveDiagnosticData(diagnosis) {
    try {
      const key = `diagnostic_${Date.now()}_${diagnosis.id}`
      const data = {
        ...diagnosis,
        saved: true
      }

      localStorage.setItem(key, JSON.stringify(data))

      // 清理过期数据
      this.cleanupOldDiagnosticData()
    } catch (error) {
      console.warn('保存诊断数据失败:', error)
    }
  }

  /**
   * 清理过期诊断数据
   */
  cleanupOldDiagnosticData() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7天前

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('diagnostic_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          if (data.timestamp < cutoff) {
            localStorage.removeItem(key)
          }
        } catch (error) {
          // 清理损坏的数据
          localStorage.removeItem(key)
        }
      }
    })
  }

  /**
   * 开始历史记录清理
   */
  startHistoryCleanup() {
    setInterval(() => {
      this.cleanupHistory()
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }

  /**
   * 清理历史记录
   */
  cleanupHistory() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24小时前

    // 清理诊断历史
    this.diagnosticHistory = this.diagnosticHistory.filter(d => d.timestamp > cutoff)

    // 清理活跃问题
    for (const [id, issue] of this.activeIssues) {
      if (issue.timestamp < cutoff || issue.status === 'resolved') {
        this.activeIssues.delete(id)
      }
    }
  }

  /**
   * 生成诊断ID
   */
  generateDiagnosisId() {
    return 'diag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 获取诊断报告
   */
  getDiagnosticReport() {
    return {
      timestamp: Date.now(),
      active: this.isActive,
      totalIssues: this.diagnosticHistory.length,
      activeIssues: Array.from(this.activeIssues.values()),
      statistics: this.getErrorStatistics(),
      recentHistory: this.diagnosticHistory.slice(-10)
    }
  }

  /**
   * 手动触发诊断
   */
  async triggerManualDiagnosis() {
    ElNotification.info({
      title: '诊断系统',
      message: '正在执行系统诊断...',
      duration: 3000
    })

    // 执行健康检查
    const healthReport = await systemHealthMonitor.getCurrentHealthStatus()

    // 分析健康状态
    Object.values(healthReport).forEach(result => {
      if (result.status !== 'healthy') {
        this.analyzeHealthAlert(result)
      }
    })

    // 检查系统能力
    const capabilities = fallbackManager.getSystemCapabilities()
    this.analyzeSystemCapabilities(capabilities)

    ElMessage.success('系统诊断完成')
  }

  /**
   * 分析系统能力
   */
  analyzeSystemCapabilities(capabilities) {
    if (!capabilities.speech) {
      this.analyzeError({
        type: 'capability',
        message: '浏览器不支持语音识别功能',
        category: 'compatibility',
        timestamp: Date.now()
      })
    }

    if (!capabilities.video) {
      this.analyzeError({
        type: 'capability',
        message: '浏览器不支持视频设备访问',
        category: 'compatibility',
        timestamp: Date.now()
      })
    }

    if (!capabilities.network.online) {
      this.analyzeError({
        type: 'capability',
        message: '网络连接已断开',
        category: 'network',
        timestamp: Date.now()
      })
    }
  }
}

// 创建全局诊断系统实例
const diagnosticSystem = new DiagnosticSystem()

// 自动启动（在开发环境）
if (import.meta.env.DEV) {
  diagnosticSystem.start()
}

export default diagnosticSystem