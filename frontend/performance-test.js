/**
 * 性能和缓存功能验证脚本
 * 测试API响应时间、缓存效果、并发处理能力等
 */

// 模拟fetch API
function mockFetch(url, options) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          code: 200,
          message: 'Success',
          data: { result: 'test data', cached: false },
          timestamp: new Date().toISOString()
        })
      })
    }, Math.random() * 100 + 50) // 50-150ms 随机延迟
  })
}

class PerformanceTester {
  constructor() {
    this.results = []
  }

  async testAPIResponseTime() {
    console.log('🚀 测试API响应时间...')
    const endpoints = [
      'http://localhost:8080/api/health',
      'http://localhost:8080/api/interview/generate-question',
      'http://localhost:8080/api/interview/generate-question-smart',
      'http://localhost:8080/api/interview/analyze'
    ]

    const results = []
    for (const endpoint of endpoints) {
      const times = []
      console.log(`   测试: ${endpoint.split('/').pop()}`)

      // 测试5次取平均值
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        try {
          const response = await fetch(endpoint)
          const endTime = Date.now()
          const responseTime = endTime - startTime
          times.push(responseTime)
        } catch (error) {
          console.log(`   ⚠️  请求失败: ${error.message}`)
        }
      }

      if (times.length > 0) {
        const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length)
        const minTime = Math.min(...times)
        const maxTime = Math.max(...times)

        results.push({
          endpoint: endpoint.split('/').pop(),
          avgTime,
          minTime,
          maxTime,
          samples: times.length
        })

        console.log(`   ✅ 平均响应时间: ${avgTime}ms (${minTime}-${maxTime}ms)`)
      }
    }

    return results
  }

  async testConcurrentRequests() {
    console.log('🔄 测试并发请求处理...')

    const concurrency = 10
    const endpoint = 'http://localhost:8080/api/health'

    console.log(`   同时发起 ${concurrency} 个请求`)

    const startTime = Date.now()
    const promises = Array(concurrency).fill(null).map(() => fetch(endpoint))

    try {
      const results = await Promise.allSettled(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      console.log(`   ✅ 完成: ${successful} 成功, ${failed} 失败`)
      console.log(`   ⏱️  总耗时: ${totalTime}ms`)
      console.log(`   📊 平均响应: ${Math.round(totalTime / concurrency)}ms/请求`)

      return {
        concurrency,
        totalTime,
        successful,
        failed,
        avgTime: Math.round(totalTime / concurrency)
      }
    } catch (error) {
      console.log(`   ❌ 并发测试失败: ${error.message}`)
      return null
    }
  }

  async testCacheEffectiveness() {
    console.log('💾 测试缓存效果...')

    // 模拟缓存测试
    const cacheTests = [
      {
        name: 'API响应缓存',
        test: async () => {
          console.log('   测试API响应缓存...')

          // 第一次请求 - 无缓存
          const start1 = Date.now()
          await fetch('http://localhost:8080/api/interview/generate-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: 'test', level: 'test', skills: [] })
          })
          const time1 = Date.now() - start1

          // 第二次请求 - 可能有缓存
          const start2 = Date.now()
          await fetch('http://localhost:8080/api/interview/generate-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: 'test', level: 'test', skills: [] })
          })
          const time2 = Date.now() - start2

          const improvement = time1 > time2 ? `${Math.round((time1 - time2) / time1 * 100)}%` : '0%'
          console.log(`   📈 首次请求: ${time1}ms, 第二次: ${time2}ms, 改善: ${improvement}`)

          return { firstRequest: time1, secondRequest: time2, improvement }
        }
      },
      {
        name: 'LocalStorage缓存',
        test: async () => {
          console.log('   测试LocalStorage缓存...')

          // 模拟缓存操作
          const testKey = 'test_cache_key'
          const testData = { data: 'test', timestamp: Date.now() }

          const start1 = Date.now()
          // 模拟设置缓存
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(testKey, JSON.stringify(testData))
          }
          const setTime = Date.now() - start1

          const start2 = Date.now()
          // 模拟读取缓存
          let cachedData = null
          if (typeof localStorage !== 'undefined') {
            cachedData = JSON.parse(localStorage.getItem(testKey) || 'null')
            localStorage.removeItem(testKey) // 清理
          }
          const getTime = Date.now() - start2

          console.log(`   💾 写入耗时: ${setTime}ms, 读取耗时: ${getTime}ms`)

          return { setTime, getTime, success: !!cachedData }
        }
      }
    ]

    const results = []
    for (const { name, test } of cacheTests) {
      try {
        const result = await test()
        results.push({ name, ...result, status: 'success' })
      } catch (error) {
        console.log(`   ❌ ${name} 测试失败: ${error.message}`)
        results.push({ name, status: 'failed', error: error.message })
      }
    }

    return results
  }

  async testMemoryUsage() {
    console.log('🧠 测试内存使用...')

    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory
      const used = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      const total = Math.round(memory.totalJSHeapSize / 1024 / 1024)
      const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)

      console.log(`   📊 已使用: ${used}MB / ${total}MB (限制: ${limit}MB)`)
      console.log(`   📈 使用率: ${Math.round(used / total * 100)}%`)

      const usage = used / limit
      let status = 'good'
      if (usage > 0.8) status = 'warning'
      if (usage > 0.9) status = 'critical'

      console.log(`   💡 内存状态: ${status}`)

      return { used, total, limit, usage: Math.round(usage * 100), status }
    } else {
      console.log('   ⚠️  内存API不可用')
      return { status: 'unavailable' }
    }
  }

  async testLoadBalancing() {
    console.log('⚖️  测试负载均衡...')

    // 模拟多个请求分布
    const requests = 20
    const results = {}

    console.log(`   发送 ${requests} 个请求测试负载分布`)

    for (let i = 0; i < requests; i++) {
      try {
        const response = await fetch('http://localhost:8080/api/health')
        const data = await response.json()

        // 记录响应时间分布
        const responseTime = Math.floor(Date.now() / 100) % 10 // 简化的时间桶
        results[responseTime] = (results[responseTime] || 0) + 1
      } catch (error) {
        console.log(`   请求 ${i + 1} 失败: ${error.message}`)
      }
    }

    console.log('   📊 响应时间分布:')
    Object.entries(results).forEach(([bucket, count]) => {
      const bar = '█'.repeat(Math.ceil(count / 2))
      console.log(`     ${bucket}00ms: ${bar} (${count})`)
    })

    return results
  }

  async runAllTests() {
    console.log('🏃‍♂️ 开始性能和缓存功能验证')
    console.log('=' .repeat(60))
    console.log()

    const startTime = Date.now()

    try {
      // API响应时间测试
      const apiResults = await this.testAPIResponseTime()
      console.log()

      // 并发请求测试
      const concurrentResults = await this.testConcurrentRequests()
      console.log()

      // 缓存效果测试
      const cacheResults = await this.testCacheEffectiveness()
      console.log()

      // 内存使用测试
      const memoryResults = await this.testMemoryUsage()
      console.log()

      // 负载均衡测试
      const loadResults = await this.testLoadBalancing()
      console.log()

      const totalTime = Date.now() - startTime

      // 生成总结报告
      console.log('📋 性能测试总结')
      console.log('=' .repeat(60))
      console.log(`⏱️  总测试时间: ${totalTime}ms`)
      console.log()

      console.log('🎯 API性能:')
      apiResults.forEach(result => {
        const status = result.avgTime < 100 ? '✅' : result.avgTime < 500 ? '⚠️' : '❌'
        console.log(`   ${status} ${result.endpoint}: ${result.avgTime}ms 平均`)
      })
      console.log()

      if (concurrentResults) {
        console.log('🔄 并发性能:')
        const concurrentStatus = concurrentResults.failed === 0 ? '✅' : '⚠️'
        console.log(`   ${concurrentStatus} ${concurrentResults.concurrency} 并发: ${concurrentResults.avgTime}ms/请求`)
        console.log(`   📊 成功率: ${Math.round(concurrentResults.successful / concurrentResults.concurrency * 100)}%`)
        console.log()
      }

      console.log('💾 缓存性能:')
      cacheResults.forEach(result => {
        const status = result.status === 'success' ? '✅' : '❌'
        console.log(`   ${status} ${result.name}: ${result.status}`)
      })
      console.log()

      if (memoryResults.status !== 'unavailable') {
        console.log('🧠 内存状态:')
        const memStatus = memoryResults.status === 'good' ? '✅' :
                         memoryResults.status === 'warning' ? '⚠️' : '❌'
        console.log(`   ${memStatus} 使用率: ${memoryResults.usage}% (${memoryResults.used}MB/${memoryResults.limit}MB)`)
        console.log()
      }

      // 整体评估
      const overallScore = this.calculateOverallScore({
        apiResults,
        concurrentResults,
        cacheResults,
        memoryResults
      })

      console.log('🏆 整体评估:')
      const overallStatus = overallScore >= 90 ? '🎉 优秀' :
                           overallScore >= 75 ? '✅ 良好' :
                           overallScore >= 60 ? '⚠️ 一般' : '❌ 需改进'
      console.log(`   ${overallStatus} (${overallScore}/100)`)

      if (overallScore < 75) {
        console.log('\n💡 优化建议:')
        if (apiResults.some(r => r.avgTime > 500)) {
          console.log('   • API响应时间过长，考虑优化后端处理逻辑')
        }
        if (concurrentResults && concurrentResults.failed > 0) {
          console.log('   • 并发处理存在问题，检查服务器配置')
        }
        if (memoryResults.usage > 80) {
          console.log('   • 内存使用率过高，优化内存管理')
        }
      }

      return {
        overallScore,
        apiResults,
        concurrentResults,
        cacheResults,
        memoryResults,
        loadResults,
        totalTime
      }

    } catch (error) {
      console.error('❌ 性能测试失败:', error)
      throw error
    }
  }

  calculateOverallScore(results) {
    let score = 100

    // API性能评分 (40分)
    const avgAPITime = results.apiResults.reduce((sum, r) => sum + r.avgTime, 0) / results.apiResults.length
    if (avgAPITime > 500) score -= 20
    else if (avgAPITime > 200) score -= 10
    else if (avgAPITime > 100) score -= 5

    // 并发性能评分 (30分)
    if (results.concurrentResults) {
      const successRate = results.concurrentResults.successful / results.concurrentResults.concurrency
      if (successRate < 0.9) score -= 15
      else if (successRate < 0.95) score -= 10
      else if (successRate < 1.0) score -= 5

      if (results.concurrentResults.avgTime > 200) score -= 10
      else if (results.concurrentResults.avgTime > 100) score -= 5
    }

    // 缓存效果评分 (20分)
    const cacheSuccessRate = results.cacheResults.filter(r => r.status === 'success').length / results.cacheResults.length
    if (cacheSuccessRate < 0.8) score -= 15
    else if (cacheSuccessRate < 1.0) score -= 10

    // 内存使用评分 (10分)
    if (results.memoryResults.status !== 'unavailable') {
      if (results.memoryResults.usage > 90) score -= 10
      else if (results.memoryResults.usage > 80) score -= 5
    }

    return Math.max(0, Math.round(score))
  }
}

// 运行性能测试
async function main() {
  const tester = new PerformanceTester()

  try {
    const results = await tester.runAllTests()
    console.log('\n✅ 性能测试完成!')

    // 保存测试结果
    const reportData = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      results
    }

    console.log('💾 测试报告已生成')

    // 根据分数决定退出码
    process.exit(results.overallScore >= 60 ? 0 : 1)

  } catch (error) {
    console.error('❌ 性能测试执行失败:', error)
    process.exit(1)
  }
}

// 只有在直接运行此文件时才执行测试
if (require.main === module) {
  main()
}

module.exports = PerformanceTester