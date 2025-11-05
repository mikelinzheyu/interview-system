/**
 * 系统健康监控服务
 * 实时监控系统状态、性能指标和健康状况
 */
import { ElNotification } from 'element-plus'
import fallbackManager from '@/utils/fallback.js'
// 环境变量控制通知行为
const HEALTH_NOTIFY_AUTO_CLOSE = (import.meta.env?.VITE_HEALTH_NOTIFY_AUTO_CLOSE ?? 'true') === 'true'
const HEALTH_NOTIFY_DURATION = Number.parseInt(import.meta.env?.VITE_HEALTH_NOTIFY_DURATION ?? '8000', 10)

/**
 * 系统健康监控器
 */
export class SystemHealthMonitor {
  constructor() {
    this.checks = new Map()
    this.history = []
    this.alerts = new Map()
    this.monitorInterval = null
    this.isMonitoring = false

    // 初始化检查项
    this.initializeChecks()

    // 绑定事件监听
    this.bindEventListeners()
  }

  /**
   * 初始化健康检查项
   */
  initializeChecks() {
    this.checks.set('mediaSupport', {
      name: '媒体设备支持',
      critical: true,
      check: this.checkMediaSupport.bind(this),
      interval: 30000 // 30秒检查一次
    })

    this.checks.set('apiConnectivity', {
      name: 'API连接性',
      critical: true,
      check: this.checkAPIConnectivity.bind(this),
      interval: 15000 // 15秒检查一次
    })

    this.checks.set('networkStatus', {
      name: '网络状态',
      critical: true,
      check: this.checkNetworkStatus.bind(this),
      interval: 10000 // 10秒检查一次
    })

    this.checks.set('browserCompatibility', {
      name: '浏览器兼容性',
      critical: false,
      check: this.checkBrowserCompatibility.bind(this),
      interval: 60000 // 1分钟检查一次
    })

    this.checks.set('localStorage', {
      name: '本地存储',
      critical: false,
      check: this.checkLocalStorage.bind(this),
      interval: 60000 // 1分钟检查一次
    })

    this.checks.set('performance', {
      name: '性能指标',
      critical: false,
      check: this.checkPerformance.bind(this),
      interval: 20000 // 20秒检查一次
    })
  }

  /**
   * 绑定系统事件监听
   */
  bindEventListeners() {
    // 网络状态变化
    window.addEventListener('online', () => {
      this.handleNetworkChange(true)
    })

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false)
    })

    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseMonitoring()
      } else {
        this.resumeMonitoring()
      }
    })

    // 窗口焦点变化
    window.addEventListener('focus', () => {
      this.resumeMonitoring()
    })

    window.addEventListener('blur', () => {
      this.pauseMonitoring()
    })
  }

  /**
   * 开始健康监控
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('健康监控已在运行')
      return
    }

    this.isMonitoring = true
    console.log('开始系统健康监控')

    // 立即执行一次全面检查
    this.performFullHealthCheck().then(results => {
      console.log('初始健康检查完成:', results)
    })

    // 设置定期检查
    this.scheduleChecks()
  }

  /**
   * 停止健康监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }

    console.log('系统健康监控已停止')
  }

  /**
   * 暂停监控
   */
  pauseMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
  }

  /**
   * 恢复监控
   */
  resumeMonitoring() {
    if (this.isMonitoring && !this.monitorInterval) {
      this.scheduleChecks()
    }
  }

  /**
   * 安排定期检查
   */
  scheduleChecks() {
    this.monitorInterval = setInterval(() => {
      this.performScheduledChecks()
    }, 5000) // 每5秒执行一次调度
  }

  /**
   * 执行调度检查
   */
  async performScheduledChecks() {
    const now = Date.now()
    const promises = []

    for (const [key, config] of this.checks) {
      const lastCheck = this.getLastCheckTime(key)
      if (now - lastCheck >= config.interval) {
        promises.push(this.performSingleCheck(key, config))
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  }

  /**
   * 执行全面健康检查
   */
  async performFullHealthCheck() {
    const results = {}
    const promises = []

    for (const [key, config] of this.checks) {
      promises.push(
        this.performSingleCheck(key, config).then(result => {
          results[key] = result
        })
      )
    }

    await Promise.allSettled(promises)
    this.recordHealthSnapshot(results)
    return results
  }

  /**
   * 执行单个检查
   */
  async performSingleCheck(key, config) {
    const startTime = Date.now()

    try {
      const result = await config.check()
      const endTime = Date.now()

      const checkResult = {
        key,
        name: config.name,
        status: result.status || 'healthy',
        data: result.data || {},
        message: result.message || '正常',
        duration: endTime - startTime,
        timestamp: endTime,
        critical: config.critical
      }

      this.updateCheckHistory(key, checkResult)
      this.evaluateAlert(key, checkResult)

      return checkResult
    } catch (error) {
      const errorResult = {
        key,
        name: config.name,
        status: 'error',
        data: {},
        message: error.message,
        error: error,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        critical: config.critical
      }

      this.updateCheckHistory(key, errorResult)
      this.evaluateAlert(key, errorResult)

      return errorResult
    }
  }

  /**
   * 媒体设备支持检查
   */
  async checkMediaSupport() {
    try {
      // 动态导入MediaUtils以避免循环依赖
      const MediaUtils = (await import('@/utils/mediaUtils.js')).default
      const support = MediaUtils.checkSupport()

      const issues = []
      if (!support.video) issues.push('视频不支持')
      if (!support.audio) issues.push('音频不支持')
      if (!support.webRTC) issues.push('WebRTC不支持')

      return {
        status: issues.length === 0 ? 'healthy' : 'warning',
        data: support,
        message: issues.length === 0 ? '媒体设备支持正常' : `存在问题: ${issues.join(', ')}`
      }
    } catch (error) {
      return {
        status: 'error',
        data: {},
        message: '媒体设备检查失败: ' + error.message
      }
    }
  }

  /**
   * API连接性检查
   */
  async checkAPIConnectivity() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('/api/health', {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return {
          status: 'healthy',
          data: {
            status: response.status,
            responseTime: Date.now()
          },
          message: 'API连接正常'
        }
      } else {
        return {
          status: 'warning',
          data: {
            status: response.status,
            statusText: response.statusText
          },
          message: `API返回非正常状态: ${response.status}`
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          status: 'error',
          data: {},
          message: 'API连接超时'
        }
      }

      return {
        status: 'error',
        data: {},
        message: 'API连接失败: ' + error.message
      }
    }
  }

  /**
   * 网络状态检查
   */
  async checkNetworkStatus() {
    const networkStatus = {
      online: navigator.onLine,
      connection: navigator.connection || {},
      timestamp: Date.now()
    }

    const status = networkStatus.online ? 'healthy' : 'error'
    const message = networkStatus.online ? '网络连接正常' : '网络连接断开'

    return {
      status,
      data: networkStatus,
      message
    }
  }

  /**
   * 浏览器兼容性检查
   */
  async checkBrowserCompatibility() {
    const userAgent = navigator.userAgent
    const compatibility = {
      es6: typeof Symbol !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      promise: typeof Promise !== 'undefined',
      webWorker: typeof Worker !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      websocket: typeof WebSocket !== 'undefined'
    }

    const unsupportedFeatures = Object.entries(compatibility)
      .filter(([, supported]) => !supported)
      .map(([key]) => key)

    return {
      status: unsupportedFeatures.length === 0 ? 'healthy' : 'warning',
      data: {
        userAgent,
        compatibility,
        unsupportedFeatures
      },
      message: unsupportedFeatures.length === 0
        ? '浏览器兼容性良好'
        : `不支持的特性: ${unsupportedFeatures.join(', ')}`
    }
  }

  /**
   * 本地存储检查
   */
  async checkLocalStorage() {
    try {
      const testKey = '__health_check__'
      const testValue = Date.now().toString()

      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)

      if (retrieved === testValue) {
        // 检查存储使用情况
        const usage = this.estimateLocalStorageUsage()

        return {
          status: usage.percentage > 90 ? 'warning' : 'healthy',
          data: usage,
          message: usage.percentage > 90
            ? `本地存储使用率过高: ${usage.percentage}%`
            : '本地存储正常'
        }
      } else {
        return {
          status: 'error',
          data: {},
          message: '本地存储读写异常'
        }
      }
    } catch (error) {
      return {
        status: 'error',
        data: {},
        message: '本地存储不可用: ' + error.message
      }
    }
  }

  /**
   * 性能指标检查
   */
  async checkPerformance() {
    const performance = window.performance

    if (!performance) {
      return {
        status: 'warning',
        data: {},
        message: '性能API不支持'
      }
    }

    const timing = performance.timing
    const memory = performance.memory

    const metrics = {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaintTime(),
      memory: memory ? {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      } : null
    }

    const issues = []
    if (metrics.loadTime > 5000) issues.push('页面加载缓慢')
    if (metrics.memory && metrics.memory.used / metrics.memory.total > 0.9) {
      issues.push('内存使用率过高')
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      data: metrics,
      message: issues.length === 0 ? '性能指标正常' : issues.join(', ')
    }
  }

  /**
   * 获取首次绘制时间
   */
  getFirstPaintTime() {
    try {
      const entries = performance.getEntriesByType('paint')
      const firstPaint = entries.find(entry => entry.name === 'first-paint')
      return firstPaint ? firstPaint.startTime : null
    } catch (error) {
      return null
    }
  }

  /**
   * 估算本地存储使用情况
   */
  estimateLocalStorageUsage() {
    let totalSize = 0
    let itemCount = 0

    for (let key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        totalSize += localStorage.getItem(key).length + key.length
        itemCount++
      }
    }

    // 估算最大容量为5MB
    const maxSize = 5 * 1024 * 1024
    const percentage = Math.round((totalSize / maxSize) * 100)

    return {
      used: totalSize,
      max: maxSize,
      percentage,
      itemCount
    }
  }

  /**
   * 网络状态变化处理
   */
  handleNetworkChange(isOnline) {
    const message = isOnline ? '网络连接已恢复' : '网络连接已断开'
    const type = isOnline ? 'success' : 'error'

    ElNotification({
      title: '网络状态变化',
      message,
      type,
      duration: HEALTH_NOTIFY_AUTO_CLOSE ? HEALTH_NOTIFY_DURATION : 0,
      showClose: true
    })

    // 网络恢复时执行健康检查
    if (isOnline && this.isMonitoring) {
      setTimeout(() => {
        this.performFullHealthCheck()
      }, 1000)
    }
  }

  /**
   * 更新检查历史
   */
  updateCheckHistory(key, result) {
    if (!this.history) {
      this.history = []
    }

    this.history.push({
      ...result,
      timestamp: Date.now()
    })

    // 保持历史记录在合理范围内
    if (this.history.length > 1000) {
      this.history.splice(0, 500)
    }
  }

  /**
   * 评估警告
   */
  evaluateAlert(key, result) {
    const alertKey = `${key}_${result.status}`

    if (result.status === 'error' || (result.status === 'warning' && result.critical)) {
      if (!this.alerts.has(alertKey)) {
        this.alerts.set(alertKey, {
          key,
          status: result.status,
          message: result.message,
          firstOccurrence: Date.now(),
          count: 1
        })

        this.showAlert(result)
      } else {
        const alert = this.alerts.get(alertKey)
        alert.count++
      }
    } else if (result.status === 'healthy') {
      // 清除相关的错误和警告
      this.alerts.delete(`${key}_error`)
      this.alerts.delete(`${key}_warning`)
    }
  }

  /**
   * 显示警告
   */
  showAlert(result) {
    const type = result.status === 'error' ? 'error' : 'warning'

    ElNotification({
      title: `${result.name}${result.status === 'error' ? '异常' : '警告'}`,
      message: result.message,
      type,
      duration: result.critical ? 0 : 8000, // 关键错误不自动关闭
      showClose: true
    })
  }

  /**
   * 获取最后检查时间
   */
  getLastCheckTime(key) {
    const lastCheck = this.history
      .filter(h => h.key === key)
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    return lastCheck ? lastCheck.timestamp : 0
  }

  /**
   * 记录健康快照
   */
  recordHealthSnapshot(results) {
    const snapshot = {
      timestamp: Date.now(),
      overall: this.calculateOverallHealth(results),
      results,
      capabilities: fallbackManager.getSystemCapabilities(),
      recommendedMode: fallbackManager.getRecommendedMode()
    }

    // 保存到localStorage
    try {
      const snapshots = JSON.parse(localStorage.getItem('health_snapshots') || '[]')
      snapshots.push(snapshot)

      // 保持最新的50个快照
      if (snapshots.length > 50) {
        snapshots.splice(0, snapshots.length - 50)
      }

      localStorage.setItem('health_snapshots', JSON.stringify(snapshots))
    } catch (error) {
      console.error('保存健康快照失败:', error)
    }
  }

  /**
   * 计算整体健康状态
   */
  calculateOverallHealth(results) {
    let warningCount = 0
    let errorCount = 0
    let criticalErrorCount = 0

    Object.values(results).forEach(result => {
      switch (result.status) {
        case 'healthy':
          break
        case 'warning':
          warningCount++
          break
        case 'error':
          errorCount++
          if (result.critical) {
            criticalErrorCount++
          }
          break
      }
    })

    if (criticalErrorCount > 0) {
      return 'critical'
    } else if (errorCount > 0) {
      return 'error'
    } else if (warningCount > 0) {
      return 'warning'
    } else {
      return 'healthy'
    }
  }

  /**
   * 获取当前健康状态
   */
  async getCurrentHealthStatus() {
    if (!this.isMonitoring) {
      await this.startMonitoring()
    }

    return this.performFullHealthCheck()
  }

  /**
   * 获取健康历史
   */
  getHealthHistory(timeRange = 3600000) { // 默认1小时
    const cutoff = Date.now() - timeRange
    return this.history.filter(h => h.timestamp > cutoff)
  }

  /**
   * 获取当前警告
   */
  getCurrentAlerts() {
    return Array.from(this.alerts.values())
  }

  /**
   * 清除警告
   */
  clearAlert(key) {
    this.alerts.delete(key)
  }

  /**
   * 获取系统诊断报告
   */
  async getDiagnosticReport() {
    const healthStatus = await this.getCurrentHealthStatus()
    const capabilities = fallbackManager.getSystemCapabilities()
    const recommendedMode = fallbackManager.getRecommendedMode()
    const alerts = this.getCurrentAlerts()

    return {
      timestamp: Date.now(),
      health: healthStatus,
      capabilities,
      recommendedMode,
      alerts,
      history: this.getHealthHistory(),
      summary: {
        overall: this.calculateOverallHealth(healthStatus),
        criticalIssues: Object.values(healthStatus).filter(r => r.critical && r.status !== 'healthy').length,
        totalIssues: Object.values(healthStatus).filter(r => r.status !== 'healthy').length,
        monitoringActive: this.isMonitoring
      }
    }
  }
}

// 创建全局健康监控实例
const systemHealthMonitor = new SystemHealthMonitor()

export default systemHealthMonitor
