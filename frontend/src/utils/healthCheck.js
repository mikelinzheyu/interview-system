import { buildApiUrl } from './networkConfig'

/**
 * API鍋ュ悍妫€鏌ュ伐鍏?
 */
class HealthChecker {
  constructor() {
    this.endpoints = [
      { name: 'Mock API', url: '/api/health', critical: true },
      { name: 'Statistics API', url: '/api/users/statistics', critical: true },
      { name: 'Trends API', url: '/api/users/trends', critical: false }
    ]
    this.checkInterval = 30000 // 30绉?
    this.status = {
      overall: 'unknown',
      services: {},
      lastCheck: null
    }
  }

  /**
   * 鎵ц鍋ュ悍妫€鏌?
   */
  async checkHealth() {
    console.log('寮€濮婣PI鍋ュ悍妫€鏌?..')
    const results = {}
    let allCriticalServicesHealthy = true

    for (const endpoint of this.endpoints) {
      try {
        const startTime = performance.now()
        const response = await this.makeRequest(endpoint.url)
        const responseTime = performance.now() - startTime

        results[endpoint.name] = {
          status: 'healthy',
          responseTime: Math.round(responseTime),
          url: endpoint.url,
          critical: endpoint.critical,
          details: response.data || response
        }

        console.log(`鉁?${endpoint.name}: 姝ｅ父 (${Math.round(responseTime)}ms)`)
      } catch (error) {
        results[endpoint.name] = {
          status: 'unhealthy',
          error: error.message,
          url: endpoint.url,
          critical: endpoint.critical,
          details: error.response?.data || null
        }

        console.error(`鉂?${endpoint.name}: 寮傚父 - ${error.message}`)

        if (endpoint.critical) {
          allCriticalServicesHealthy = false
        }
      }
    }

    this.status = {
      overall: allCriticalServicesHealthy ? 'healthy' : 'unhealthy',
      services: results,
      lastCheck: new Date().toISOString()
    }

    return this.status
  }

  /**
   * 鍙戣捣API璇锋眰
   */
  async makeRequest(url) {
    const fullUrl = buildApiUrl(url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 鑾峰彇褰撳墠鐘舵€?
   */
  getStatus() {
    return this.status
  }

  /**
   * 妫€鏌ョ壒瀹氭湇鍔℃槸鍚﹀仴搴?
   */
  isServiceHealthy(serviceName) {
    return this.status.services[serviceName]?.status === 'healthy'
  }

  /**
   * 妫€鏌ユ暣浣撴湇鍔℃槸鍚﹀仴搴?
   */
  isOverallHealthy() {
    return this.status.overall === 'healthy'
  }

  /**
   * 鍚姩瀹氭湡鍋ュ悍妫€鏌?
   */
  startPeriodicCheck() {
    console.log(`鍚姩瀹氭湡鍋ュ悍妫€鏌ワ紝闂撮殧: ${this.checkInterval / 1000}绉抈)

    // 绔嬪嵆鎵ц涓€娆?
    this.checkHealth()

    // 璁剧疆瀹氭湡妫€鏌?
    setInterval(() => {
      this.checkHealth()
    }, this.checkInterval)
  }

  /**
   * 鑾峰彇鍋ュ悍妫€鏌ユ姤鍛?
   */
  getHealthReport() {
    const { overall, services, lastCheck } = this.status

    const healthyCount = Object.values(services).filter(s => s.status === 'healthy').length
    const totalCount = Object.keys(services).length

    return {
      overall,
      healthyCount,
      totalCount,
      lastCheck,
      services: Object.entries(services).map(([name, details]) => ({
        name,
        ...details
      }))
    }
  }
}

// 鍒涘缓鍏ㄥ眬瀹炰緥
const healthChecker = new HealthChecker()

export default healthChecker
