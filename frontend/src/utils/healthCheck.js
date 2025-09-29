/**
 * API健康检查工具
 */
class HealthChecker {
  constructor() {
    this.endpoints = [
      { name: 'Mock API', url: '/api/health', critical: true },
      { name: 'Statistics API', url: '/api/users/statistics', critical: true },
      { name: 'Trends API', url: '/api/users/trends', critical: false }
    ]
    this.checkInterval = 30000 // 30秒
    this.status = {
      overall: 'unknown',
      services: {},
      lastCheck: null
    }
  }

  /**
   * 执行健康检查
   */
  async checkHealth() {
    console.log('开始API健康检查...')
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

        console.log(`✅ ${endpoint.name}: 正常 (${Math.round(responseTime)}ms)`)
      } catch (error) {
        const isHealthy = false
        results[endpoint.name] = {
          status: 'unhealthy',
          error: error.message,
          url: endpoint.url,
          critical: endpoint.critical,
          details: error.response?.data || null
        }

        console.error(`❌ ${endpoint.name}: 异常 - ${error.message}`)

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
   * 发起API请求
   */
  async makeRequest(url) {
    const fullUrl = url.startsWith('/') ? `http://localhost:3001${url}` : url

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000 // 5秒超时
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return this.status
  }

  /**
   * 检查特定服务是否健康
   */
  isServiceHealthy(serviceName) {
    return this.status.services[serviceName]?.status === 'healthy'
  }

  /**
   * 检查整体服务是否健康
   */
  isOverallHealthy() {
    return this.status.overall === 'healthy'
  }

  /**
   * 启动定期健康检查
   */
  startPeriodicCheck() {
    console.log(`启动定期健康检查，间隔: ${this.checkInterval / 1000}秒`)

    // 立即执行一次
    this.checkHealth()

    // 设置定期检查
    setInterval(() => {
      this.checkHealth()
    }, this.checkInterval)
  }

  /**
   * 获取健康检查报告
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

// 创建全局实例
const healthChecker = new HealthChecker()

export default healthChecker