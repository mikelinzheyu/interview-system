/**
 * 性能监控和缓存优化系统
 * 监控应用性能、管理缓存策略、优化用户体验
 */
import { ElNotification } from 'element-plus'

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  constructor() {
    this.isMonitoring = false
    this.metrics = new Map()
    this.thresholds = {
      fcp: 1800, // First Contentful Paint (ms)
      lcp: 2500, // Largest Contentful Paint (ms)
      fid: 100,  // First Input Delay (ms)
      cls: 0.1,  // Cumulative Layout Shift
      ttfb: 800  // Time to First Byte (ms)
    }
    this.observers = []
    this.measurements = []
  }

  /**
   * 开始性能监控
   */
  start() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('📊 性能监控已启动')

    this.initializeCoreWebVitals()
    this.initializeCustomMetrics()
    this.startPeriodicReporting()

    // 页面加载完成后的初始报告
    if (document.readyState === 'complete') {
      this.generateInitialReport()
    } else {
      window.addEventListener('load', () => {
        this.generateInitialReport()
      })
    }
  }

  /**
   * 停止性能监控
   */
  stop() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    this.observers.forEach(observer => {
      if (observer.disconnect) observer.disconnect()
    })
    this.observers = []

    console.log('📊 性能监控已停止')
  }

  /**
   * 初始化核心Web性能指标
   */
  initializeCoreWebVitals() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric('LCP', lastEntry.startTime)
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (error) {
        console.warn('LCP监控不支持:', error)
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime)
        })
      })

      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (error) {
        console.warn('FID监控不支持:', error)
      }

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0
        entryList.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.recordMetric('CLS', clsValue)
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (error) {
        console.warn('CLS监控不支持:', error)
      }
    }

    // First Contentful Paint (通过Navigation Timing API)
    this.measureFCP()
  }

  /**
   * 测量First Contentful Paint
   */
  measureFCP() {
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime)
          }
        })
      })

      try {
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(fcpObserver)
      } catch (error) {
        console.warn('FCP监控不支持:', error)
      }
    }
  }

  /**
   * 初始化自定义性能指标
   */
  initializeCustomMetrics() {
    // 监控API响应时间
    this.initializeAPIPerformanceMonitoring()

    // 监控组件渲染性能
    this.initializeComponentPerformanceMonitoring()

    // 监控内存使用
    this.initializeMemoryMonitoring()

    // 监控网络质量
    this.initializeNetworkMonitoring()
  }

  /**
   * 初始化API性能监控
   */
  initializeAPIPerformanceMonitoring() {
    // 拦截fetch请求
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = args[0]

      try {
        const response = await originalFetch.apply(window, args)
        const endTime = performance.now()
        const duration = endTime - startTime

        this.recordAPIMetric(url, {
          duration,
          status: response.status,
          size: response.headers.get('content-length') || 0,
          cached: response.headers.get('x-cache') === 'HIT'
        })

        return response
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime

        this.recordAPIMetric(url, {
          duration,
          status: 0,
          error: error.message
        })

        throw error
      }
    }
  }

  /**
   * 初始化组件性能监控
   */
  initializeComponentPerformanceMonitoring() {
    // 监控Vue组件渲染时间
    if (window.__VUE__) {
      this.initializeVuePerformanceMonitoring()
    }

    // 监控DOM操作性能
    this.initializeDOMPerformanceMonitoring()
  }

  /**
   * 初始化Vue性能监控
   */
  initializeVuePerformanceMonitoring() {
    // 这里可以集成Vue Devtools的性能监控
    // 暂时使用MutationObserver来监控DOM变化
    if ('MutationObserver' in window) {
      let mutationCount = 0
      let lastMutationTime = Date.now()

      const mutationObserver = new MutationObserver((mutations) => {
        mutationCount += mutations.length
        const now = Date.now()

        if (now - lastMutationTime > 1000) {
          this.recordMetric('DOM_MUTATIONS_PER_SECOND', mutationCount)
          mutationCount = 0
          lastMutationTime = now
        }
      })

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      })

      this.observers.push(mutationObserver)
    }
  }

  /**
   * 初始化DOM性能监控
   */
  initializeDOMPerformanceMonitoring() {
    // 监控DOM查询性能
    const originalQuerySelector = Document.prototype.querySelector
    const originalQuerySelectorAll = Document.prototype.querySelectorAll

    let queryCount = 0
    let totalQueryTime = 0

    Document.prototype.querySelector = function(...args) {
      const startTime = performance.now()
      const result = originalQuerySelector.apply(this, args)
      const endTime = performance.now()

      queryCount++
      totalQueryTime += (endTime - startTime)

      return result
    }

    Document.prototype.querySelectorAll = function(...args) {
      const startTime = performance.now()
      const result = originalQuerySelectorAll.apply(this, args)
      const endTime = performance.now()

      queryCount++
      totalQueryTime += (endTime - startTime)

      return result
    }

    // 每10秒报告一次DOM查询性能
    setInterval(() => {
      if (queryCount > 0) {
        this.recordMetric('DOM_QUERY_AVERAGE', totalQueryTime / queryCount)
        this.recordMetric('DOM_QUERY_COUNT', queryCount)
        queryCount = 0
        totalQueryTime = 0
      }
    }, 10000)
  }

  /**
   * 初始化内存监控
   */
  initializeMemoryMonitoring() {
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory
        this.recordMetric('MEMORY_USED', memory.usedJSHeapSize)
        this.recordMetric('MEMORY_TOTAL', memory.totalJSHeapSize)
        this.recordMetric('MEMORY_LIMIT', memory.jsHeapSizeLimit)

        // 内存使用率警告
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        if (usage > 0.8) {
          this.triggerPerformanceAlert('high_memory_usage', {
            usage: Math.round(usage * 100),
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
          })
        }
      }, 30000) // 每30秒检查一次
    }
  }

  /**
   * 初始化网络监控
   */
  initializeNetworkMonitoring() {
    if (navigator.connection) {
      const updateNetworkInfo = () => {
        const connection = navigator.connection
        this.recordMetric('NETWORK_DOWNLINK', connection.downlink)
        this.recordMetric('NETWORK_RTT', connection.rtt)
        this.recordMetric('NETWORK_TYPE', connection.effectiveType)
      }

      updateNetworkInfo()
      navigator.connection.addEventListener('change', updateNetworkInfo)
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    }

    // 存储到内存
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name).push(metric)

    // 保持最新100条记录
    const metrics = this.metrics.get(name)
    if (metrics.length > 100) {
      metrics.shift()
    }

    // 检查性能阈值
    this.checkPerformanceThreshold(name, value, metadata)

    // 记录到测量数组
    this.measurements.push(metric)
    if (this.measurements.length > 1000) {
      this.measurements.splice(0, 500)
    }
  }

  /**
   * 记录API性能指标
   */
  recordAPIMetric(url, data) {
    const apiName = this.extractAPIName(url)
    this.recordMetric(`API_${apiName}`, data.duration, {
      url,
      status: data.status,
      size: data.size,
      cached: data.cached,
      error: data.error
    })

    // API响应时间过长警告
    if (data.duration > 5000 && !data.error) {
      this.triggerPerformanceAlert('slow_api', {
        api: apiName,
        duration: Math.round(data.duration),
        url
      })
    }
  }

  /**
   * 提取API名称
   */
  extractAPIName(url) {
    try {
      const urlObj = new URL(url, window.location.href)
      const path = urlObj.pathname
      const segments = path.split('/').filter(s => s)

      if (segments.includes('api')) {
        const apiIndex = segments.indexOf('api')
        return segments.slice(apiIndex + 1).join('_').toUpperCase()
      }

      return segments.slice(-2).join('_').toUpperCase() || 'UNKNOWN'
    } catch (error) {
      return 'UNKNOWN'
    }
  }

  /**
   * 检查性能阈值
   */
  checkPerformanceThreshold(name, value, metadata) {
    let threshold = null
    let message = null

    switch (name) {
      case 'FCP':
        threshold = this.thresholds.fcp
        message = `首次内容绘制时间过长: ${Math.round(value)}ms`
        break
      case 'LCP':
        threshold = this.thresholds.lcp
        message = `最大内容绘制时间过长: ${Math.round(value)}ms`
        break
      case 'FID':
        threshold = this.thresholds.fid
        message = `首次输入延迟过长: ${Math.round(value)}ms`
        break
      case 'CLS':
        threshold = this.thresholds.cls
        message = `累积布局偏移过大: ${value.toFixed(3)}`
        break
    }

    if (threshold && value > threshold) {
      this.triggerPerformanceAlert('performance_threshold', {
        metric: name,
        value: typeof value === 'number' ? Math.round(value) : value,
        threshold,
        message
      })
    }
  }

  /**
   * 触发性能警告
   */
  triggerPerformanceAlert(type, data) {
    const alertKey = `${type}_${Date.now()}`

    // 防止重复警告
    const recentAlerts = this.getRecentAlerts()
    if (recentAlerts.some(alert => alert.type === type && Date.now() - alert.timestamp < 60000)) {
      return
    }

    const alert = {
      type,
      data,
      timestamp: Date.now()
    }

    // 保存警告历史
    this.saveAlert(alert)

    // 显示通知
    if (import.meta.env.DEV) {
      ElNotification.warning({
        title: '性能警告',
        message: data.message || this.getAlertMessage(type, data),
        duration: 8000
      })
    }

    console.warn(`🚨 性能警告 [${type}]:`, data)
  }

  /**
   * 获取警告消息
   */
  getAlertMessage(type, data) {
    switch (type) {
      case 'high_memory_usage':
        return `内存使用率过高: ${data.usage}% (${data.used}MB/${data.total}MB)`
      case 'slow_api':
        return `API响应缓慢: ${data.api} (${data.duration}ms)`
      case 'performance_threshold':
        return data.message
      default:
        return '性能指标异常'
    }
  }

  /**
   * 开始周期性报告
   */
  startPeriodicReporting() {
    // 每5分钟生成一次性能报告
    setInterval(() => {
      this.generatePerformanceReport()
    }, 5 * 60 * 1000)

    // 每小时清理一次数据
    setInterval(() => {
      this.cleanupOldData()
    }, 60 * 60 * 1000)
  }

  /**
   * 生成初始报告
   */
  generateInitialReport() {
    const navigation = performance.getEntriesByType('navigation')[0]
    if (navigation) {
      this.recordMetric('PAGE_LOAD_TIME', navigation.loadEventEnd - navigation.navigationStart)
      this.recordMetric('DOM_READY_TIME', navigation.domContentLoadedEventEnd - navigation.navigationStart)
      this.recordMetric('TTFB', navigation.responseStart - navigation.requestStart)
    }

    console.log('📊 页面性能初始报告已生成')
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      metrics: this.getMetricsSummary(),
      alerts: this.getRecentAlerts(),
      recommendations: this.generateRecommendations()
    }

    // 保存报告
    this.saveReport(report)

    if (import.meta.env.DEV) {
      console.group('📊 性能报告')
      console.table(report.metrics)
      if (report.alerts.length > 0) {
        console.warn('近期警告:', report.alerts)
      }
      if (report.recommendations.length > 0) {
        console.log('优化建议:', report.recommendations)
      }
      console.groupEnd()
    }

    return report
  }

  /**
   * 获取指标摘要
   */
  getMetricsSummary() {
    const summary = {}

    for (const [name, values] of this.metrics) {
      if (values.length === 0) continue

      const recentValues = values.slice(-10).map(v => typeof v.value === 'number' ? v.value : 0)
      const numericValues = recentValues.filter(v => typeof v === 'number')

      if (numericValues.length > 0) {
        summary[name] = {
          current: recentValues[recentValues.length - 1],
          average: numericValues.reduce((a, b) => a + b) / numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          count: values.length
        }
      }
    }

    return summary
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const recommendations = []
    const summary = this.getMetricsSummary()

    // FCP优化建议
    if (summary.FCP && summary.FCP.average > this.thresholds.fcp) {
      recommendations.push({
        type: 'fcp',
        priority: 'high',
        message: '首次内容绘制时间过长，建议优化关键渲染路径',
        actions: [
          '减少阻塞渲染的CSS和JavaScript',
          '使用preload预加载关键资源',
          '优化服务器响应时间'
        ]
      })
    }

    // 内存使用建议
    if (summary.MEMORY_USED && summary.MEMORY_LIMIT) {
      const usage = summary.MEMORY_USED.average / summary.MEMORY_LIMIT.average
      if (usage > 0.7) {
        recommendations.push({
          type: 'memory',
          priority: 'medium',
          message: '内存使用率较高，建议优化内存管理',
          actions: [
            '清理未使用的变量和事件监听器',
            '优化大型对象的处理',
            '使用对象池减少垃圾回收'
          ]
        })
      }
    }

    // API性能建议
    const slowAPIs = Object.entries(summary)
      .filter(([name, data]) => name.startsWith('API_') && data.average > 3000)

    if (slowAPIs.length > 0) {
      recommendations.push({
        type: 'api',
        priority: 'high',
        message: '部分API响应较慢，建议优化',
        actions: [
          '实现API响应缓存',
          '优化数据库查询',
          '使用CDN加速',
          '实现请求合并和批处理'
        ]
      })
    }

    return recommendations
  }

  /**
   * 获取近期警告
   */
  getRecentAlerts() {
    try {
      const alerts = JSON.parse(localStorage.getItem('performance_alerts') || '[]')
      const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24小时
      return alerts.filter(alert => alert.timestamp > cutoff)
    } catch (error) {
      return []
    }
  }

  /**
   * 保存警告
   */
  saveAlert(alert) {
    try {
      const alerts = this.getRecentAlerts()
      alerts.push(alert)

      // 保持最新50条警告
      if (alerts.length > 50) {
        alerts.splice(0, alerts.length - 50)
      }

      localStorage.setItem('performance_alerts', JSON.stringify(alerts))
    } catch (error) {
      console.warn('保存性能警告失败:', error)
    }
  }

  /**
   * 保存报告
   */
  saveReport(report) {
    try {
      const reportKey = `performance_report_${Date.now()}`
      localStorage.setItem(reportKey, JSON.stringify(report))

      // 清理旧报告
      this.cleanupOldReports()
    } catch (error) {
      console.warn('保存性能报告失败:', error)
    }
  }

  /**
   * 清理旧数据
   */
  cleanupOldData() {
    const cutoff = Date.now() - (2 * 60 * 60 * 1000) // 2小时前

    // 清理指标数据
    for (const [name, values] of this.metrics) {
      const filtered = values.filter(v => v.timestamp > cutoff)
      this.metrics.set(name, filtered)
    }

    // 清理测量数据
    this.measurements = this.measurements.filter(m => m.timestamp > cutoff)

    console.log('🧹 性能监控数据已清理')
  }

  /**
   * 清理旧报告
   */
  cleanupOldReports() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7天前

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('performance_report_')) {
        try {
          const timestamp = parseInt(key.split('_')[2])
          if (timestamp < cutoff) {
            localStorage.removeItem(key)
          }
        } catch (error) {
          // 清理无效的报告键
          localStorage.removeItem(key)
        }
      }
    })
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    return this.generatePerformanceReport()
  }

  /**
   * 手动标记性能关键点
   */
  mark(name) {
    performance.mark(name)
    this.recordMetric(`MARK_${name}`, performance.now())
  }

  /**
   * 测量两个标记点之间的时间
   */
  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name, 'measure')[0]
      if (measure) {
        this.recordMetric(`MEASURE_${name}`, measure.duration)
      }
    } catch (error) {
      console.warn(`性能测量失败 ${name}:`, error)
    }
  }
}

/**
 * 智能缓存管理器
 */
export class CacheManager {
  constructor() {
    this.caches = new Map()
    this.strategies = new Map()
    this.maxSize = 50 * 1024 * 1024 // 50MB
    this.cleanupInterval = null
  }

  /**
   * 初始化缓存管理
   */
  initialize() {
    this.setupDefaultStrategies()
    this.startCleanupTimer()
    this.loadPersistedCaches()
    console.log('💾 缓存管理器已初始化')
  }

  /**
   * 设置默认缓存策略
   */
  setupDefaultStrategies() {
    // API响应缓存策略
    this.addStrategy('api', {
      maxAge: 10 * 60 * 1000, // 10分钟
      maxSize: 100,
      storageType: 'memory',
      compression: true
    })

    // 问题缓存策略
    this.addStrategy('questions', {
      maxAge: 30 * 60 * 1000, // 30分钟
      maxSize: 50,
      storageType: 'localStorage',
      compression: false
    })

    // 媒体资源缓存策略
    this.addStrategy('media', {
      maxAge: 60 * 60 * 1000, // 1小时
      maxSize: 20,
      storageType: 'memory',
      compression: false
    })

    // 用户数据缓存策略
    this.addStrategy('userData', {
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      maxSize: 10,
      storageType: 'localStorage',
      compression: true
    })
  }

  /**
   * 添加缓存策略
   */
  addStrategy(name, config) {
    this.strategies.set(name, {
      maxAge: config.maxAge || 30 * 60 * 1000,
      maxSize: config.maxSize || 100,
      storageType: config.storageType || 'memory',
      compression: config.compression || false,
      onEvict: config.onEvict || null
    })
  }

  /**
   * 设置缓存
   */
  async set(category, key, value, options = {}) {
    const strategy = this.strategies.get(category) || this.strategies.get('api')
    const cache = this.getOrCreateCache(category)

    const item = {
      key,
      value: strategy.compression ? await this.compress(value) : value,
      timestamp: Date.now(),
      compressed: strategy.compression,
      size: this.calculateSize(value),
      ttl: options.ttl || strategy.maxAge,
      metadata: options.metadata || {}
    }

    cache.set(key, item)

    // 检查缓存大小限制
    await this.enforceCacheSize(category)

    // 持久化到存储
    if (strategy.storageType === 'localStorage') {
      this.persistToStorage(category, key, item)
    }

    return true
  }

  /**
   * 获取缓存
   */
  async get(category, key) {
    const cache = this.caches.get(category)
    if (!cache) return null

    const item = cache.get(key)
    if (!item) return null

    // 检查过期
    if (Date.now() - item.timestamp > item.ttl) {
      cache.delete(key)
      this.removeFromStorage(category, key)
      return null
    }

    // 更新访问时间
    item.lastAccessed = Date.now()

    // 解压缩
    const value = item.compressed ? await this.decompress(item.value) : item.value

    return {
      value,
      metadata: item.metadata,
      cached: true,
      age: Date.now() - item.timestamp
    }
  }

  /**
   * 删除缓存
   */
  delete(category, key) {
    const cache = this.caches.get(category)
    if (cache) {
      cache.delete(key)
      this.removeFromStorage(category, key)
    }
  }

  /**
   * 清空分类缓存
   */
  clear(category) {
    const cache = this.caches.get(category)
    if (cache) {
      cache.clear()
      this.clearStorageCategory(category)
    }
  }

  /**
   * 获取或创建缓存
   */
  getOrCreateCache(category) {
    if (!this.caches.has(category)) {
      this.caches.set(category, new Map())
    }
    return this.caches.get(category)
  }

  /**
   * 强制执行缓存大小限制
   */
  async enforceCacheSize(category) {
    const strategy = this.strategies.get(category)
    const cache = this.caches.get(category)

    if (cache.size > strategy.maxSize) {
      // LRU驱逐策略
      const items = Array.from(cache.entries())
      items.sort((a, b) => (a[1].lastAccessed || a[1].timestamp) - (b[1].lastAccessed || b[1].timestamp))

      const itemsToRemove = items.slice(0, cache.size - strategy.maxSize)
      itemsToRemove.forEach(([key, item]) => {
        cache.delete(key)
        this.removeFromStorage(category, key)

        // 触发驱逐回调
        if (strategy.onEvict) {
          strategy.onEvict(key, item)
        }
      })
    }
  }

  /**
   * 计算值的大小
   */
  calculateSize(value) {
    try {
      return new Blob([JSON.stringify(value)]).size
    } catch (error) {
      return 0
    }
  }

  /**
   * 压缩数据
   */
  async compress(data) {
    try {
      const jsonString = JSON.stringify(data)
      const stream = new CompressionStream('gzip')
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()

      writer.write(new TextEncoder().encode(jsonString))
      writer.close()

      const chunks = []
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) chunks.push(value)
      }

      return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
    } catch (error) {
      console.warn('压缩失败，使用原始数据:', error)
      return data
    }
  }

  /**
   * 解压缩数据
   */
  async decompress(compressedData) {
    try {
      const stream = new DecompressionStream('gzip')
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()

      writer.write(compressedData)
      writer.close()

      const chunks = []
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) chunks.push(value)
      }

      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
      const jsonString = new TextDecoder().decode(decompressed)
      return JSON.parse(jsonString)
    } catch (error) {
      console.warn('解压缩失败，返回原始数据:', error)
      return compressedData
    }
  }

  /**
   * 持久化到存储
   */
  persistToStorage(category, key, item) {
    try {
      const storageKey = `cache_${category}_${key}`
      localStorage.setItem(storageKey, JSON.stringify(item))
    } catch (error) {
      console.warn('缓存持久化失败:', error)
    }
  }

  /**
   * 从存储中移除
   */
  removeFromStorage(category, key) {
    try {
      const storageKey = `cache_${category}_${key}`
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn('移除存储缓存失败:', error)
    }
  }

  /**
   * 清空存储分类
   */
  clearStorageCategory(category) {
    try {
      const prefix = `cache_${category}_`
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('清空存储分类失败:', error)
    }
  }

  /**
   * 从存储中加载缓存
   */
  loadPersistedCaches() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          const parts = key.split('_')
          if (parts.length >= 3) {
            const category = parts[1]
            const cacheKey = parts.slice(2).join('_')

            try {
              const item = JSON.parse(localStorage.getItem(key))

              // 检查是否过期
              if (Date.now() - item.timestamp <= item.ttl) {
                const cache = this.getOrCreateCache(category)
                cache.set(cacheKey, item)
              } else {
                localStorage.removeItem(key)
              }
            } catch (error) {
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (error) {
      console.warn('加载持久化缓存失败:', error)
    }
  }

  /**
   * 开始清理定时器
   */
  startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, 15 * 60 * 1000) // 每15分钟清理一次
  }

  /**
   * 执行清理
   */
  performCleanup() {
    const now = Date.now()
    let cleanedCount = 0

    for (const [category, cache] of this.caches) {
      const itemsToDelete = []

      for (const [key, item] of cache) {
        if (now - item.timestamp > item.ttl) {
          itemsToDelete.push(key)
        }
      }

      itemsToDelete.forEach(key => {
        cache.delete(key)
        this.removeFromStorage(category, key)
        cleanedCount++
      })
    }

    if (cleanedCount > 0) {
      console.log(`🧹 缓存清理完成，清理了 ${cleanedCount} 个过期项目`)
    }
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    const stats = {
      categories: {},
      totalItems: 0,
      totalSize: 0,
      hitRate: 0
    }

    for (const [category, cache] of this.caches) {
      let categorySize = 0
      let categoryItems = cache.size

      for (const [key, item] of cache) {
        categorySize += item.size || 0
      }

      stats.categories[category] = {
        items: categoryItems,
        size: categorySize,
        strategy: this.strategies.get(category)
      }

      stats.totalItems += categoryItems
      stats.totalSize += categorySize
    }

    return stats
  }

  /**
   * 销毁缓存管理器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.caches.clear()
    this.strategies.clear()
    console.log('💾 缓存管理器已销毁')
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor()
export const cacheManager = new CacheManager()

// 自动初始化
if (typeof window !== 'undefined') {
  performanceMonitor.start()
  cacheManager.initialize()
}

export default { performanceMonitor, cacheManager }