/**
 * 性能优化工具集
 * 包含缓存、防抖、节流等优化策略
 */

// ==================== 智能缓存 ====================

class SmartCache {
  constructor(ttl = 5000) {
    this.cache = new Map()
    this.timers = new Map()
    this.ttl = ttl
  }

  set(key, value, ttl = this.ttl) {
    // 清除旧的计时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // 设置新计时器
    const timer = setTimeout(() => {
      this.cache.delete(key)
      this.timers.delete(key)
    }, ttl)

    this.cache.set(key, value)
    this.timers.set(key, timer)
  }

  get(key) {
    return this.cache.get(key)
  }

  has(key) {
    return this.cache.has(key)
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    this.cache.delete(key)
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.cache.clear()
    this.timers.clear()
  }

  size() {
    return this.cache.size
  }
}

// ==================== 防抖函数 ====================

function debounce(func, wait, options = {}) {
  let timeout
  let previous = 0
  const { leading = false, trailing = true, maxWait } = options

  return function executedFunction(...args) {
    const now = Date.now()
    const callNow = leading && !previous
    let maxWaitTimeout

    if (!previous) previous = now
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > maxWait || maxWait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      return func.apply(this, args)
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

// ==================== 节流函数 ====================

function throttle(func, limit) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ==================== 请求合并 ====================

class RequestBatcher {
  constructor(batchSize = 20, batchWait = 50) {
    this.queue = []
    this.batchSize = batchSize
    this.batchWait = batchWait
    this.timeout = null
  }

  add(item) {
    this.queue.push(item)

    if (this.queue.length >= this.batchSize) {
      return this.flush()
    }

    // 设置延迟批处理
    if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.batchWait)
    }

    return Promise.resolve()
  }

  flush() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    if (this.queue.length === 0) {
      return Promise.resolve([])
    }

    const batch = this.queue.splice(0, this.queue.length)
    return Promise.resolve(batch)
  }

  clear() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    this.queue = []
  }
}

// ==================== 内存池 ====================

class ObjectPool {
  constructor(factory, maxSize = 100) {
    this.factory = factory
    this.maxSize = maxSize
    this.pool = []
    this.inUse = new Set()
  }

  acquire() {
    let obj
    if (this.pool.length > 0) {
      obj = this.pool.pop()
    } else {
      obj = this.factory()
    }
    this.inUse.add(obj)
    return obj
  }

  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj)
      if (this.pool.length < this.maxSize) {
        // 重置对象
        if (obj.reset) obj.reset()
        this.pool.push(obj)
      }
    }
  }

  clear() {
    this.pool = []
    this.inUse.clear()
  }

  size() {
    return {
      pooled: this.pool.length,
      inUse: this.inUse.size
    }
  }
}

// ==================== 延迟加载 ====================

class LazyLoader {
  constructor(loader) {
    this.loader = loader
    this.value = null
    this.loading = false
    this.error = null
  }

  async load() {
    if (this.value !== null || this.loading) {
      return this.value
    }

    this.loading = true
    try {
      this.value = await this.loader()
      return this.value
    } catch (error) {
      this.error = error
      throw error
    } finally {
      this.loading = false
    }
  }

  get() {
    return this.value
  }

  isLoaded() {
    return this.value !== null
  }

  reset() {
    this.value = null
    this.loading = false
    this.error = null
  }
}

// ==================== 性能监控 ====================

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.samples = new Map()
  }

  mark(name) {
    performance.mark(name)
  }

  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name)[0]
    this.recordMetric(name, measure.duration)
    return measure.duration
  }

  recordMetric(name, value) {
    if (!this.samples.has(name)) {
      this.samples.set(name, [])
    }
    this.samples.get(name).push(value)
  }

  getMetrics(name) {
    const samples = this.samples.get(name) || []
    if (samples.length === 0) return null

    return {
      count: samples.length,
      avg: samples.reduce((a, b) => a + b) / samples.length,
      min: Math.min(...samples),
      max: Math.max(...samples),
      median: samples.sort((a, b) => a - b)[Math.floor(samples.length / 2)]
    }
  }

  getAllMetrics() {
    const result = {}
    for (const [name, _] of this.samples) {
      result[name] = this.getMetrics(name)
    }
    return result
  }

  clear() {
    this.metrics.clear()
    this.samples.clear()
  }
}

// ==================== 虚拟滚动优化 ====================

class VirtualScrollOptimizer {
  constructor(containerHeight, itemHeight) {
    this.containerHeight = containerHeight
    this.itemHeight = itemHeight
    this.bufferSize = 5 // 缓冲项数
  }

  getVisibleRange(scrollTop, totalItems) {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight)

    let startIndex = Math.floor(scrollTop / this.itemHeight) - this.bufferSize
    startIndex = Math.max(0, startIndex)

    let endIndex = startIndex + visibleCount + this.bufferSize * 2
    endIndex = Math.min(totalItems, endIndex)

    return {
      startIndex,
      endIndex,
      visibleCount,
      offset: startIndex * this.itemHeight
    }
  }

  getVisibleItems(items, scrollTop) {
    const range = this.getVisibleRange(scrollTop, items.length)
    return items.slice(range.startIndex, range.endIndex)
  }
}

// ==================== 批量操作优化 ====================

class BatchOperator {
  constructor(executor, batchSize = 50, delay = 100) {
    this.executor = executor
    this.batchSize = batchSize
    this.delay = delay
    this.queue = []
    this.timeout = null
  }

  async add(operation) {
    this.queue.push(operation)

    if (this.queue.length >= this.batchSize) {
      return this.execute()
    }

    if (!this.timeout) {
      this.timeout = setTimeout(() => this.execute(), this.delay)
    }

    return Promise.resolve()
  }

  async execute() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    if (this.queue.length === 0) {
      return []
    }

    const batch = this.queue.splice(0, this.queue.length)
    return this.executor(batch)
  }

  clear() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    this.queue = []
  }
}

// ==================== 导出 ====================

export {
  SmartCache,
  debounce,
  throttle,
  RequestBatcher,
  ObjectPool,
  LazyLoader,
  PerformanceMonitor,
  VirtualScrollOptimizer,
  BatchOperator
}
