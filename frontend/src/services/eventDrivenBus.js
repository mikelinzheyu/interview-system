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
 * 浜嬩欢椹卞姩鎬荤嚎
 * 瀹炵幇鏉捐€﹀悎鐨勫井鏈嶅姟鍖栦簨浠堕€氫俊鏋舵瀯
 */
export class EventDrivenBus extends EventEmitter {
  constructor() {
    super()

    this.eventHistory = []
    this.subscribers = new Map()
    this.middleware = []
    this.retryQueue = []

    // 浜嬩欢浼樺厛绾у畾涔?
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

    // 浜嬩欢璺敱閰嶇疆
    this.eventRoutes = new Map([
      // 绯荤粺妫€鏌ヤ簨浠舵祦
      ['system.check.started', ['ui.showProgress', 'analytics.track']],
      ['system.check.device.success', ['system.check.network.start', 'ui.updateProgress']],
      ['system.check.network.success', ['system.check.browser.start', 'ui.updateProgress']],
      ['system.check.browser.success', ['system.check.profile.start', 'ui.updateProgress']],
      ['system.check.completed', ['interview.config.prepare', 'ui.showReady', 'cache.warmup']],
      ['system.check.failed', ['ui.showError', 'recovery.suggest', 'analytics.error']],

      // 闈㈣瘯娴佺▼浜嬩欢
      ['interview.config.ready', ['interview.enable.start', 'ui.updateButton']],
      ['interview.started', ['timer.start', 'recording.init', 'session.create', 'analytics.start']],
      ['interview.paused', ['timer.pause', 'state.snapshot', 'recovery.prepare']],
      ['interview.resumed', ['timer.resume', 'state.restore', 'recording.resume']],
      ['interview.ended', ['timer.stop', 'session.complete', 'analysis.trigger']],

      // 闂瓟浜や簰浜嬩欢
      ['question.generated', ['ui.displayQuestion', 'timer.questionStart', 'cache.update']],
      ['question.answered', ['analysis.trigger', 'question.next.prepare', 'progress.update']],
      ['answer.analyzed', ['ui.showAnalysis', 'progress.increment', 'recommendations.generate']],

      // 杩炴帴鐘舵€佷簨浠?
      ['connection.lost', ['offline.mode.enable', 'sync.queue.start', 'ui.showOffline']],
      ['connection.restored', ['offline.mode.disable', 'sync.queue.process', 'ui.showOnline']],
      ['heartbeat.failed', ['connection.check', 'retry.schedule']],

      // 鍒嗘瀽瀹屾垚浜嬩欢娴?
      ['analysis.completed', ['results.display', 'report.generate', 'feedback.prepare']],
      ['report.generated', ['export.enable', 'share.prepare', 'storage.save']],
      ['report.exported', ['session.cleanup', 'feedback.request', 'analytics.complete']],

      // 閿欒澶勭悊浜嬩欢
      ['error.occurred', ['error.log', 'error.display', 'recovery.attempt']],
      ['recovery.attempted', ['error.resolve', 'fallback.activate']],
      ['fallback.activated', ['service.degrade', 'user.notify']]
    ])

    // 寰湇鍔℃敞鍐岃〃
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
   * 鍒濆鍖栦簨浠舵€荤嚎
   */
  initializeEventBus() {
    // 璁剧疆鏈€澶х洃鍚櫒鏁伴噺
    this.setMaxListeners(100)

    // 娉ㄥ唽鏍稿績涓棿浠?
    this.use(this.loggingMiddleware)
    this.use(this.priorityMiddleware)
    this.use(this.retryMiddleware)
    this.use(this.analyticsMiddleware)

    // 鍚姩浜嬩欢澶勭悊鍣?
    this.setupEventHandlers()
    this.startHealthMonitoring()
    this.startRetryProcessor()
  }

  /**
   * 鍙戝竷浜嬩欢锛堟敮鎸佷紭鍏堢骇鍜岃矾鐢憋級
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
        ttl: options.ttl || 30000 // 30绉掕繃鏈?
      }
    }

    // 璁板綍浜嬩欢鍘嗗彶
    this.recordEvent(eventData)

    // 鎵ц涓棿浠?
    return this.executeMiddleware(eventData)
      .then(() => {
        // 瑙﹀彂鐩存帴鐩戝惉鍣?
        this.emit(eventName, eventData.payload, eventData.options)

        // 澶勭悊浜嬩欢璺敱
        this.processEventRoutes(eventName, eventData)

        return { success: true, eventId: eventData.options.id }
      })
      .catch(error => {
        console.error(`浜嬩欢鍙戝竷澶辫触: ${eventName}`, error)

        // 鍔犲叆閲嶈瘯闃熷垪
        if (eventData.options.retryable) {
          this.addToRetryQueue(eventData, error)
        }

        return { success: false, error: error.message, eventId: eventData.options.id }
      })
  }

  /**
   * 璁㈤槄浜嬩欢锛堟敮鎸佹ā寮忓尮閰嶏級
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

    // 澶勭悊閫氶厤绗︽ā寮?
    if (eventPattern.includes('*')) {
      this.addPatternSubscription(subscription)
    } else {
      this.addDirectSubscription(subscription)
    }

    // 璁板綍璁㈤槄
    this.subscribers.set(subscription.id, subscription)

    return subscription.id
  }

  /**
   * 鍙栨秷璁㈤槄
   */
  unsubscribe(subscriptionId) {
    const subscription = this.subscribers.get(subscriptionId)
    if (!subscription) return false

    // 绉婚櫎鐩戝惉鍣?
    this.removeListener(subscription.pattern, subscription.handler)
    this.subscribers.delete(subscriptionId)

    return true
  }

  /**
   * 寰湇鍔℃敞鍐?
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

    // 涓烘湇鍔′簨浠跺垱寤轰唬鐞?
    this.createServiceProxy(serviceName, serviceConfig)

    this.publish('microservice.registered', {
      serviceName,
      config: serviceConfig
    })
  }

  /**
   * 寰湇鍔℃敞閿€
   */
  unregisterMicroservice(serviceName) {
    const service = this.microservices.get(serviceName)
    if (!service) return false

    // 鏇存柊鏈嶅姟鐘舵€?
    service.status = 'inactive'

    // 鍙戝竷鏈嶅姟娉ㄩ攢浜嬩欢
    this.publish('microservice.unregistered', { serviceName })

    // 寤惰繜绉婚櫎锛堝厑璁告竻鐞嗭級
    setTimeout(() => {
      this.microservices.delete(serviceName)
    }, 5000)

    return true
  }

  /**
   * 鏈嶅姟鍋ュ悍妫€鏌?
   */
  async checkServiceHealth(serviceName) {
    const service = this.microservices.get(serviceName)
    if (!service) return { healthy: false, reason: 'Service not found' }

    try {
      // 鍙戦€佸仴搴锋鏌ヤ簨浠?
      const healthResult = await this.publishAndWait(
        `${serviceName}.health.check`,
        {},
        { timeout: 5000 }
      )

      // 鏇存柊鍋ュ悍鐘舵€?
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
   * 鍙戝竷骞剁瓑寰呭搷搴?
   */
  async publishAndWait(eventName, payload, options = {}) {
    const timeout = options.timeout || 10000
    const responseEvent = options.responseEvent || `${eventName}.response`

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(responseEvent, responseHandler)
        reject(new Error(`绛夊緟鍝嶅簲瓒呮椂: ${eventName}`))
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
   * 鎵归噺浜嬩欢鍙戝竷
   */
  async publishBatch(events) {
    const results = []

    // 鎸変紭鍏堢骇鎺掑簭
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
   * 浜嬩欢閲嶆斁
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
      // 閲嶆柊鍙戝竷浜嬩欢锛堟爣璁颁负閲嶆斁锛?
      return this.publish(eventData.name, eventData.payload, {
        ...eventData.options,
        isReplay: true,
        originalTimestamp: eventData.options.timestamp
      })
    })
  }

  /**
   * 鑾峰彇鏈嶅姟鐘舵€?
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
   * 鑾峰彇浜嬩欢缁熻
   */
  getEventStats() {
    const stats = {
      totalEvents: this.eventHistory.length,
      subscriberCount: this.subscribers.size,
      retryQueueSize: this.retryQueue.length,
      eventTypes: {},
      recentEvents: this.eventHistory.slice(-10)
    }

    // 缁熻浜嬩欢绫诲瀷
    this.eventHistory.forEach(event => {
      stats.eventTypes[event.name] = (stats.eventTypes[event.name] || 0) + 1
    })

    return stats
  }

  // 涓棿浠剁郴缁?

  /**
   * 娣诲姞涓棿浠?
   */
  use(middleware) {
    this.middleware.push(middleware)
  }

  /**
   * 鏃ュ織涓棿浠?
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
   * 浼樺厛绾т腑闂翠欢
   */
  priorityMiddleware = async (eventData, next) => {
    if (eventData.options.priority >= 8) {
      // 楂樹紭鍏堢骇浜嬩欢绔嬪嵆澶勭悊
      return next()
    } else {
      // 浣庝紭鍏堢骇浜嬩欢寤惰繜澶勭悊
      return new Promise(resolve => {
        setTimeout(async () => {
          await next()
          resolve()
        }, 10)
      })
    }
  }

  /**
   * 閲嶈瘯涓棿浠?
   */
  retryMiddleware = async (eventData, next) => {
    const maxRetries = 3
    let retryCount = eventData.options.retryCount || 0

    try {
      return await next()
    } catch (error) {
      if (eventData.options.retryable && retryCount < maxRetries) {
        eventData.options.retryCount = retryCount + 1
        console.warn(`浜嬩欢閲嶈瘯 ${retryCount + 1}/${maxRetries}: ${eventData.name}`)

        // 鎸囨暟閫€閬?
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))

        return this.retryMiddleware(eventData, next)
      }
      throw error
    }
  }

  /**
   * 鍒嗘瀽涓棿浠?
   */
  analyticsMiddleware = async (eventData, next) => {
    const startTime = performance.now()

    try {
      const result = await next()
      const duration = performance.now() - startTime

      // 璁板綍鎬ц兘鎸囨爣
      this.recordPerformanceMetric(eventData.name, duration, true)

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordPerformanceMetric(eventData.name, duration, false)
      throw error
    }
  }

  // 绉佹湁鏂规硶

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
      // 寤惰繜瑙﹀彂璺敱浜嬩欢锛岄伩鍏嶅悓姝ユ墽琛?
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
    // 璁剧疆绯荤粺绾т簨浠跺鐞嗗櫒
    this.on('error', (error) => {
      console.error('EventBus閿欒:', error)
    })

    this.on('newListener', (eventName, _listener) => {
    console.debug([Performance] : ms )
    })

    this.on('removeListener', (eventName, _listener) => {
      console.debug(`绉婚櫎鐩戝惉鍣? ${eventName}`)
    })
  }

  startHealthMonitoring() {
    setInterval(() => {
      this.microservices.forEach(async (service, name) => {
        if (service.status === 'active') {
          await this.checkServiceHealth(name)
        }
      })
    }, 30000) // 30绉掓鏌ヤ竴娆?
  }

  startRetryProcessor() {
    setInterval(() => {
      this.processRetryQueue()
    }, 5000) // 5绉掑鐞嗕竴娆￠噸璇曢槦鍒?
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

    // 闄愬埗鍘嗗彶璁板綍澶у皬
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500)
    }
  }

  recordPerformanceMetric(eventName, duration, success) {
    console.debug(`[Performance] ${eventName}: ${duration.toFixed(2)}ms ${success ? 'success' : 'fail'}`)
  }

  addToRetryQueue(eventData, error) {
    const retryItem = {
      event: eventData,
      error,
      attempts: 1,
      nextRetry: Date.now() + 5000, // 5绉掑悗閲嶈瘯
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
    // 绠€鍖栫殑妯″紡鍖归厤瀹炵幇

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

    // 杩欓噷闇€瑕佹洿澶嶆潅鐨勬ā寮忓尮閰嶉€昏緫
    // 绠€鍖栧疄鐜帮細鐩存帴娉ㄥ唽鍒板叿浣撲簨浠?
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
          console.warn(`浜嬩欢澶勭悊瓒呮椂: ${subscription.pattern}`)
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
    // 涓烘湇鍔″垱寤轰簨浠朵唬鐞?
    serviceConfig.events.forEach(eventPattern => {
      this.subscribe(eventPattern, (payload, options) => {
        // 杞彂鍒板叿浣撴湇鍔″疄渚?
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
