// EventEmitter polyfill for browser
class EventEmitter {
  constructor() {
    this.events = {}
    this._maxListeners = 10
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

  removeListener(event, listener) {
    return this.off(event, listener)
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

  setMaxListeners(max) {
    this._maxListeners = max
    return this
  }

  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0
  }
}

/**
 * 事件驱动总线
 * 实现松耦合的微服务化事件通信架构
 */
export class EventDrivenBus extends EventEmitter {
  constructor() {
    super()

    this.eventHistory = []
    this.subscribers = new Map()
    this.middleware = []
    this.retryQueue = []

    // 事件优先级定义
    this.eventPriorities = {
      'system.critical': 10,
      'system.check.failed': 9,
      'interview.started': 8,
      'interview.ended': 8,
      'analysis.completed': 7,
      'question.answered': 6,
      'connection.lost': 5,
      'connection.restored': 4,
      'ui.update': 3,
      'cache.updated': 2,
      'log.info': 1
    }

    // 事件路由配置
    this.eventRoutes = new Map([
      // 系统检查事件流
      ['system.check.started', ['ui.showProgress', 'analytics.track']],
      ['system.check.device.success', ['system.check.network.start', 'ui.updateProgress']],
      ['system.check.network.success', ['system.check.browser.start', 'ui.updateProgress']],
      ['system.check.browser.success', ['system.check.profile.start', 'ui.updateProgress']],
      ['system.check.completed', ['interview.config.prepare', 'ui.showReady', 'cache.warmup']],
      ['system.check.failed', ['ui.showError', 'recovery.suggest', 'analytics.error']],

      // 面试流程事件
      ['interview.config.ready', ['interview.enable.start', 'ui.updateButton']],
      ['interview.started', ['timer.start', 'recording.init', 'session.create', 'analytics.start']],
      ['interview.paused', ['timer.pause', 'state.snapshot', 'recovery.prepare']],
      ['interview.resumed', ['timer.resume', 'state.restore', 'recording.resume']],
      ['interview.ended', ['timer.stop', 'session.complete', 'analysis.trigger']],

      // 问答交互事件
      ['question.generated', ['ui.displayQuestion', 'timer.questionStart', 'cache.update']],
      ['question.answered', ['analysis.trigger', 'question.next.prepare', 'progress.update']],
      ['answer.analyzed', ['ui.showAnalysis', 'progress.increment', 'recommendations.generate']],

      // 连接状态事件
      ['connection.lost', ['offline.mode.enable', 'sync.queue.start', 'ui.showOffline']],
      ['connection.restored', ['offline.mode.disable', 'sync.queue.process', 'ui.showOnline']],
      ['heartbeat.failed', ['connection.check', 'retry.schedule']],

      // 分析完成事件流
      ['analysis.completed', ['results.display', 'report.generate', 'feedback.prepare']],
      ['report.generated', ['export.enable', 'share.prepare', 'storage.save']],
      ['report.exported', ['session.cleanup', 'feedback.request', 'analytics.complete']],

      // 错误处理事件
      ['error.occurred', ['error.log', 'error.display', 'recovery.attempt']],
      ['recovery.attempted', ['error.resolve', 'fallback.activate']],
      ['fallback.activated', ['service.degrade', 'user.notify']]
    ])

    // 微服务注册表
    this.microservices = new Map([
      ['device-service', {
        events: ['system.check.device.*', 'camera.*', 'microphone.*'],
        status: 'active',
        health: 100
      }],
      ['network-service', {
        events: ['system.check.network.*', 'connection.*', 'heartbeat.*'],
        status: 'active',
        health: 100
      }],
      ['session-service', {
        events: ['interview.*', 'session.*', 'timer.*'],
        status: 'active',
        health: 100
      }],
      ['analysis-service', {
        events: ['question.*', 'answer.*', 'analysis.*'],
        status: 'active',
        health: 100
      }],
      ['report-service', {
        events: ['report.*', 'export.*', 'visualization.*'],
        status: 'active',
        health: 100
      }],
      ['ui-service', {
        events: ['ui.*', 'display.*', 'interaction.*'],
        status: 'active',
        health: 100
      }]
    ])

    this.initializeEventBus()
  }

  /**
   * 初始化事件总线
   */
  initializeEventBus() {
    // 设置最大监听器数量
    this.setMaxListeners(100)

    // 注册核心中间件
    this.use(this.loggingMiddleware)
    this.use(this.priorityMiddleware)
    this.use(this.retryMiddleware)
    this.use(this.analyticsMiddleware)

    // 启动事件处理器
    this.setupEventHandlers()
    this.startHealthMonitoring()
    this.startRetryProcessor()
  }

  /**
   * 发布事件（支持优先级和路由）
   */
  publish(eventName, payload = {}, options = {}) {
    const eventData = {
      name: eventName,
      payload,
      options: {
        priority: options.priority || this.eventPriorities[eventName] || 5,
        timestamp: Date.now(),
        id: this.generateEventId(),
        source: options.source || 'unknown',
        target: options.target || 'broadcast',
        retryable: options.retryable !== false,
        ttl: options.ttl || 30000 // 30秒过期
      }
    }

    // 记录事件历史
    this.recordEvent(eventData)

    // 执行中间件
    return this.executeMiddleware(eventData)
      .then(() => {
        // 触发直接监听器
        this.emit(eventName, eventData.payload, eventData.options)

        // 处理事件路由
        this.processEventRoutes(eventName, eventData)

        return { success: true, eventId: eventData.options.id }
      })
      .catch(error => {
        console.error(`事件发布失败: ${eventName}`, error)

        // 加入重试队列
        if (eventData.options.retryable) {
          this.addToRetryQueue(eventData, error)
        }

        return { success: false, error: error.message, eventId: eventData.options.id }
      })
  }

  /**
   * 订阅事件（支持模式匹配）
   */
  subscribe(eventPattern, handler, options = {}) {
    const subscription = {
      pattern: eventPattern,
      handler,
      options: {
        once: options.once || false,
        priority: options.priority || 5,
        timeout: options.timeout || null,
        filter: options.filter || null,
        transform: options.transform || null
      },
      id: this.generateSubscriptionId(),
      created: Date.now(),
      callCount: 0
    }

    // 处理通配符模式
    if (eventPattern.includes('*')) {
      this.addPatternSubscription(subscription)
    } else {
      this.addDirectSubscription(subscription)
    }

    // 记录订阅
    this.subscribers.set(subscription.id, subscription)

    return subscription.id
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId) {
    const subscription = this.subscribers.get(subscriptionId)
    if (!subscription) return false

    // 移除监听器
    this.removeListener(subscription.pattern, subscription.handler)
    this.subscribers.delete(subscriptionId)

    return true
  }

  /**
   * 微服务注册
   */
  registerMicroservice(serviceName, config) {
    const serviceConfig = {
      events: config.events || [],
      status: 'active',
      health: 100,
      registered: Date.now(),
      instance: config.instance || null,
      metadata: config.metadata || {}
    }

    this.microservices.set(serviceName, serviceConfig)

    // 为服务事件创建代理
    this.createServiceProxy(serviceName, serviceConfig)

    this.publish('microservice.registered', {
      serviceName,
      config: serviceConfig
    })
  }

  /**
   * 微服务注销
   */
  unregisterMicroservice(serviceName) {
    const service = this.microservices.get(serviceName)
    if (!service) return false

    // 更新服务状态
    service.status = 'inactive'

    // 发布服务注销事件
    this.publish('microservice.unregistered', { serviceName })

    // 延迟移除（允许清理）
    setTimeout(() => {
      this.microservices.delete(serviceName)
    }, 5000)

    return true
  }

  /**
   * 服务健康检查
   */
  async checkServiceHealth(serviceName) {
    const service = this.microservices.get(serviceName)
    if (!service) return { healthy: false, reason: 'Service not found' }

    try {
      // 发送健康检查事件
      const healthResult = await this.publishAndWait(
        `${serviceName}.health.check`,
        {},
        { timeout: 5000 }
      )

      // 更新健康状态
      service.health = healthResult.healthy ? 100 : 0
      service.lastHealthCheck = Date.now()

      return healthResult

    } catch (error) {
      service.health = 0
      service.status = 'unhealthy'
      return { healthy: false, reason: error.message }
    }
  }

  /**
   * 发布并等待响应
   */
  async publishAndWait(eventName, payload, options = {}) {
    const timeout = options.timeout || 10000
    const responseEvent = options.responseEvent || `${eventName}.response`

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(responseEvent, responseHandler)
        reject(new Error(`等待响应超时: ${eventName}`))
      }, timeout)

      const responseHandler = (response) => {
        clearTimeout(timeoutId)
        resolve(response)
      }

      this.once(responseEvent, responseHandler)
      this.publish(eventName, payload, options)
    })
  }

  /**
   * 批量事件发布
   */
  async publishBatch(events) {
    const results = []

    // 按优先级排序
    const sortedEvents = events.sort((a, b) =>
      (b.options?.priority || 5) - (a.options?.priority || 5)
    )

    for (const event of sortedEvents) {
      try {
        const result = await this.publish(event.name, event.payload, event.options)
        results.push(result)
      } catch (error) {
        results.push({ success: false, error: error.message, eventName: event.name })
      }
    }

    return results
  }

  /**
   * 事件重放
   */
  replayEvents(filter = null, fromTimestamp = null) {
    let eventsToReplay = this.eventHistory

    if (fromTimestamp) {
      eventsToReplay = eventsToReplay.filter(event =>
        event.options.timestamp >= fromTimestamp
      )
    }

    if (filter) {
      eventsToReplay = eventsToReplay.filter(filter)
    }

    return eventsToReplay.map(eventData => {
      // 重新发布事件（标记为重放）
      return this.publish(eventData.name, eventData.payload, {
        ...eventData.options,
        isReplay: true,
        originalTimestamp: eventData.options.timestamp
      })
    })
  }

  /**
   * 获取服务状态
   */
  getServicesStatus() {
    const status = {}

    this.microservices.forEach((service, name) => {
      status[name] = {
        status: service.status,
        health: service.health,
        registered: service.registered,
        lastHealthCheck: service.lastHealthCheck,
        events: service.events.length
      }
    })

    return status
  }

  /**
   * 获取事件统计
   */
  getEventStats() {
    const stats = {
      totalEvents: this.eventHistory.length,
      subscriberCount: this.subscribers.size,
      retryQueueSize: this.retryQueue.length,
      eventTypes: {},
      recentEvents: this.eventHistory.slice(-10)
    }

    // 统计事件类型
    this.eventHistory.forEach(event => {
      stats.eventTypes[event.name] = (stats.eventTypes[event.name] || 0) + 1
    })

    return stats
  }

  // 中间件系统

  /**
   * 添加中间件
   */
  use(middleware) {
    this.middleware.push(middleware)
  }

  /**
   * 日志中间件
   */
  loggingMiddleware = async (eventData, next) => {
    console.log(`[EventBus] ${eventData.name}`, {
      payload: eventData.payload,
      source: eventData.options.source,
      priority: eventData.options.priority
    })
    return next()
  }

  /**
   * 优先级中间件
   */
  priorityMiddleware = async (eventData, next) => {
    if (eventData.options.priority >= 8) {
      // 高优先级事件立即处理
      return next()
    } else {
      // 低优先级事件延迟处理
      return new Promise(resolve => {
        setTimeout(async () => {
          await next()
          resolve()
        }, 10)
      })
    }
  }

  /**
   * 重试中间件
   */
  retryMiddleware = async (eventData, next) => {
    const maxRetries = 3
    let retryCount = eventData.options.retryCount || 0

    try {
      return await next()
    } catch (error) {
      if (eventData.options.retryable && retryCount < maxRetries) {
        eventData.options.retryCount = retryCount + 1
        console.warn(`事件重试 ${retryCount + 1}/${maxRetries}: ${eventData.name}`)

        // 指数退避
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))

        return this.retryMiddleware(eventData, next)
      }
      throw error
    }
  }

  /**
   * 分析中间件
   */
  analyticsMiddleware = async (eventData, next) => {
    const startTime = performance.now()

    try {
      const result = await next()
      const duration = performance.now() - startTime

      // 记录性能指标
      this.recordPerformanceMetric(eventData.name, duration, true)

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordPerformanceMetric(eventData.name, duration, false)
      throw error
    }
  }

  // 私有方法

  executeMiddleware(eventData) {
    let index = 0

    const next = () => {
      if (index >= this.middleware.length) {
        return Promise.resolve()
      }

      const middleware = this.middleware[index++]
      return middleware(eventData, next)
    }

    return next()
  }

  processEventRoutes(eventName, eventData) {
    const routes = this.eventRoutes.get(eventName)
    if (!routes) return

    routes.forEach(targetEvent => {
      // 延迟触发路由事件，避免同步执行
      setTimeout(() => {
        this.publish(targetEvent, eventData.payload, {
          ...eventData.options,
          source: `route:${eventName}`,
          isRouted: true
        })
      }, 0)
    })
  }

  setupEventHandlers() {
    // 设置系统级事件处理器
    this.on('error', (error) => {
      console.error('EventBus错误:', error)
    })

    this.on('newListener', (eventName, listener) => {
      console.debug(`新监听器: ${eventName}`)
    })

    this.on('removeListener', (eventName, listener) => {
      console.debug(`移除监听器: ${eventName}`)
    })
  }

  startHealthMonitoring() {
    setInterval(() => {
      this.microservices.forEach(async (service, name) => {
        if (service.status === 'active') {
          await this.checkServiceHealth(name)
        }
      })
    }, 30000) // 30秒检查一次
  }

  startRetryProcessor() {
    setInterval(() => {
      this.processRetryQueue()
    }, 5000) // 5秒处理一次重试队列
  }

  processRetryQueue() {
    const now = Date.now()
    const readyToRetry = []

    this.retryQueue = this.retryQueue.filter(item => {
      if (now >= item.nextRetry) {
        readyToRetry.push(item)
        return false
      }
      return item.event.options.timestamp + item.event.options.ttl > now
    })

    readyToRetry.forEach(item => {
      this.publish(item.event.name, item.event.payload, item.event.options)
    })
  }

  recordEvent(eventData) {
    this.eventHistory.push(eventData)

    // 限制历史记录大小
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500)
    }
  }

  recordPerformanceMetric(eventName, duration, success) {
    // 简化的性能指标记录
    console.debug(`[Performance] ${eventName}: ${duration.toFixed(2)}ms ${success ? '✓' : '✗'}`)
  }

  addToRetryQueue(eventData, error) {
    const retryItem = {
      event: eventData,
      error,
      attempts: 1,
      nextRetry: Date.now() + 5000, // 5秒后重试
      maxRetries: 3
    }

    this.retryQueue.push(retryItem)
  }

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  addPatternSubscription(subscription) {
    // 简化的模式匹配实现
    const regex = new RegExp(subscription.pattern.replace(/\*/g, '.*'))

    const wrappedHandler = (payload, options) => {
      if (subscription.options.filter && !subscription.options.filter(payload, options)) {
        return
      }

      let processedPayload = payload
      if (subscription.options.transform) {
        processedPayload = subscription.options.transform(payload, options)
      }

      subscription.callCount++
      subscription.handler(processedPayload, options)

      if (subscription.options.once) {
        this.unsubscribe(subscription.id)
      }
    }

    // 这里需要更复杂的模式匹配逻辑
    // 简化实现：直接注册到具体事件
    this.on(subscription.pattern.replace(/\*/g, ''), wrappedHandler)
  }

  addDirectSubscription(subscription) {
    const wrappedHandler = (payload, options) => {
      if (subscription.options.filter && !subscription.options.filter(payload, options)) {
        return
      }

      let processedPayload = payload
      if (subscription.options.transform) {
        processedPayload = subscription.options.transform(payload, options)
      }

      subscription.callCount++

      if (subscription.options.timeout) {
        const timeoutId = setTimeout(() => {
          console.warn(`事件处理超时: ${subscription.pattern}`)
        }, subscription.options.timeout)

        Promise.resolve(subscription.handler(processedPayload, options))
          .finally(() => clearTimeout(timeoutId))
      } else {
        subscription.handler(processedPayload, options)
      }

      if (subscription.options.once) {
        this.unsubscribe(subscription.id)
      }
    }

    if (subscription.options.once) {
      this.once(subscription.pattern, wrappedHandler)
    } else {
      this.on(subscription.pattern, wrappedHandler)
    }
  }

  createServiceProxy(serviceName, serviceConfig) {
    // 为服务创建事件代理
    serviceConfig.events.forEach(eventPattern => {
      this.subscribe(eventPattern, (payload, options) => {
        // 转发到具体服务实例
        if (serviceConfig.instance && typeof serviceConfig.instance.handleEvent === 'function') {
          serviceConfig.instance.handleEvent(options.eventName || eventPattern, payload, options)
        }
      }, {
        transform: (payload, options) => ({ ...payload, serviceName }),
        filter: (payload, options) => !options.isRouted || options.target === serviceName
      })
    })
  }
}

export default new EventDrivenBus()