#!/usr/bin/env node

/**
 * 服务检查脚本
 * 检查前后端服务是否正常运行
 */

const http = require('http')
const https = require('https')

class ServiceChecker {
  constructor() {
    this.services = [
      // Node Mock Backend (used in dev)
      {
        name: 'API Mock Server',
        url: 'http://localhost:3001/api/health',
        critical: true,
        timeout: 5000
      },
      // Optional Spring Boot backend (if running)
      {
        name: 'Spring Boot API (optional)',
        url: 'http://localhost:8080/api/v1/actuator/health',
        critical: false,
        timeout: 5000
      },
      {
        name: 'Frontend Dev Server',
        url: 'http://localhost:5174',
        critical: false,
        timeout: 3000
      },
      {
        name: 'Basic Analysis API',
        url: 'http://localhost:3001/api/interview/analyze',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: '测试问题',
          answer: '测试回答',
          interviewId: 999
        }),
        critical: true,
        timeout: 8000
      },
      {
        name: 'Advanced Analysis API',
        url: 'http://localhost:3001/api/interview/analyze-advanced',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: '测试问题',
          answer: '测试回答',
          interviewId: 999
        }),
        critical: false, // 非关键，可以降级
        timeout: 8000
      }
    ]
    this.results = []
  }

  /**
   * 检查单个服务
   */
  checkService(service) {
    return new Promise((resolve) => {
      const url = new URL(service.url)
      const client = url.protocol === 'https:' ? https : http
      const startTime = Date.now()

      const options = {
        method: service.method || 'GET',
        timeout: service.timeout,
        headers: service.headers || {}
      }

      const req = client.request(service.url, options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          const result = {
            name: service.name,
            url: service.url,
            method: options.method,
            status: res.statusCode >= 200 && res.statusCode < 400 ? 'healthy' : 'unhealthy',
            statusCode: res.statusCode,
            critical: service.critical,
            responseTime: Date.now() - startTime
          }

          // 尝试解析响应数据
          try {
            if (data) {
              result.responseData = JSON.parse(data)
            }
          } catch (e) {
            // 忽略JSON解析错误
          }

          resolve(result)
        })
      })

      req.on('error', (error) => {
        resolve({
          name: service.name,
          url: service.url,
          method: options.method,
          status: 'error',
          error: error.message,
          critical: service.critical,
          responseTime: Date.now() - startTime
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          name: service.name,
          url: service.url,
          method: options.method,
          status: 'timeout',
          error: 'Request timeout',
          critical: service.critical,
          responseTime: service.timeout
        })
      })

      // 如果是POST请求，发送body数据
      if (service.method === 'POST' && service.body) {
        req.write(service.body)
      }

      req.end()
    })
  }

  /**
   * 检查所有服务
   */
  async checkAllServices() {
    console.log('🔍 开始检查服务状态...\n')

    const promises = this.services.map(service => this.checkService(service))
    this.results = await Promise.all(promises)

    return this.results
  }

  /**
   * 打印检查结果
   */
  printResults() {
    let hasErrors = false
    let hasCriticalErrors = false

    console.log('📊 服务状态检查结果:')
    console.log('=' .repeat(60))

    this.results.forEach(result => {
      const statusIcon = this.getStatusIcon(result.status)
      const responseTime = result.responseTime ? `(${result.responseTime}ms)` : ''

      console.log(`${statusIcon} ${result.name}`)
      console.log(`   URL: ${result.url}`)
      console.log(`   状态: ${result.status} ${responseTime}`)

      if (result.statusCode) {
        console.log(`   状态码: ${result.statusCode}`)
      }

      if (result.error) {
        console.log(`   错误: ${result.error}`)
      }

      if (result.status !== 'healthy') {
        hasErrors = true
        if (result.critical) {
          hasCriticalErrors = true
        }
      }

      console.log('')
    })

    console.log('=' .repeat(60))

    if (hasCriticalErrors) {
      console.log('❌ 关键服务异常，无法启动开发环境')
      this.printSuggestions()
      process.exit(1)
    } else if (hasErrors) {
      console.log('⚠️  存在服务异常，但可以继续启动')
      this.printSuggestions()
      process.exit(0)
    } else {
      console.log('✅ 所有服务正常，可以启动开发环境')
      process.exit(0)
    }
  }

  /**
   * 获取状态图标
   */
  getStatusIcon(status) {
    switch (status) {
      case 'healthy': return '✅'
      case 'unhealthy': return '⚠️ '
      case 'error': return '❌'
      case 'timeout': return '⏰'
      default: return '❓'
    }
  }

  /**
   * 打印解决建议
   */
  printSuggestions() {
    console.log('\n💡 解决建议:')

    this.results.forEach(result => {
      if (result.status !== 'healthy') {
        console.log(`\n🔧 ${result.name}:`)

        if (result.name.includes('Backend')) {
          console.log('   • 检查后端服务是否启动: npm run backend:start')
          console.log('   • 检查端口8080是否被占用: netstat -ano | findstr :8080')
          console.log('   • 检查数据库连接是否正常')
          console.log('   • 查看后端日志: 检查Spring Boot启动日志')
        }

        if (result.name.includes('Frontend')) {
          console.log('   • 检查前端开发服务器是否启动: npm run dev')
          console.log('   • 检查端口5174是否被占用: netstat -ano | findstr :5174')
          console.log('   • 检查Node.js版本是否兼容')
        }

        if (result.error && result.error.includes('ECONNREFUSED')) {
          console.log('   • 服务未启动或端口配置错误')
        }

        if (result.status === 'timeout') {
          console.log('   • 服务响应缓慢，检查性能问题')
          console.log('   • 网络连接问题，检查防火墙设置')
        }
      }
    })

    console.log('\n📚 更多帮助:')
    console.log('   • 运行健康检查: npm run health:check')
    console.log('   • 查看完整启动日志: npm run dev:debug')
    console.log('   • 重置开发环境: npm run reset')
  }
}

/**
 * 主函数
 */
async function main() {
  const checker = new ServiceChecker()

  try {
    await checker.checkAllServices()
    checker.printResults()
  } catch (error) {
    console.error('❌ 服务检查过程中发生错误:', error.message)
    process.exit(1)
  }
}

// 运行检查
if (require.main === module) {
  main()
}

module.exports = ServiceChecker
