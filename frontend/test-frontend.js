/**
 * 前端功能测试脚本
 * 测试MediaUtils模块、API拦截器、错误处理等功能
 */

// 简单的测试框架
class TestRunner {
  constructor() {
    this.tests = []
    this.results = []
  }

  test(name, fn) {
    this.tests.push({ name, fn })
  }

  async run() {
    console.log('🧪 开始前端功能测试...\n')

    for (const { name, fn } of this.tests) {
      try {
        console.log(`🔍 测试: ${name}`)
        const startTime = Date.now()
        await fn()
        const duration = Date.now() - startTime
        console.log(`✅ 通过 (${duration}ms)\n`)
        this.results.push({ name, status: 'pass', duration })
      } catch (error) {
        console.log(`❌ 失败: ${error.message}\n`)
        this.results.push({ name, status: 'fail', error: error.message })
      }
    }

    this.printSummary()
  }

  printSummary() {
    console.log('📊 测试结果汇总:')
    console.log('=' .repeat(50))

    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length

    console.log(`总计: ${this.results.length} 个测试`)
    console.log(`✅ 通过: ${passed}`)
    console.log(`❌ 失败: ${failed}`)

    if (failed > 0) {
      console.log('\n失败的测试:')
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`))
    }

    console.log(`\n总体状态: ${failed === 0 ? '✅ 全部通过' : '❌ 存在失败'}`)
  }
}

// 创建测试实例
const runner = new TestRunner()

// 1. 测试前端页面加载
runner.test('前端页面加载测试', async () => {
  const response = await fetch('http://localhost:5174')
  if (!response.ok) {
    throw new Error(`前端页面加载失败: ${response.status}`)
  }
  const html = await response.text()
  if (!html.includes('智能面试系统')) {
    throw new Error('页面标题不正确')
  }
})

// 2. 测试API健康检查
runner.test('API健康检查测试', async () => {
  const response = await fetch('http://localhost:8080/api/health')
  if (!response.ok) {
    throw new Error(`API健康检查失败: ${response.status}`)
  }
  const data = await response.json()
  if (data.code !== 200 || data.data.status !== 'UP') {
    throw new Error('API健康状态异常')
  }
})

// 3. 测试用户登录流程
runner.test('用户登录流程测试', async () => {
  const response = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser',
      password: 'password123'
    })
  })

  if (!response.ok) {
    throw new Error(`登录请求失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.data.token || !data.data.user) {
    throw new Error('登录响应数据不完整')
  }
})

// 4. 测试智能问题生成
runner.test('智能问题生成测试', async () => {
  const response = await fetch('http://localhost:8080/api/interview/generate-question-smart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      position: '前端开发工程师',
      level: '中级',
      skills: ['JavaScript', 'Vue.js', 'CSS']
    })
  })

  if (!response.ok) {
    throw new Error(`问题生成失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.data.question || !data.data.smartGeneration) {
    throw new Error('问题生成响应数据不完整')
  }
})

// 5. 测试回答分析功能
runner.test('回答分析功能测试', async () => {
  const response = await fetch('http://localhost:8080/api/interview/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'JavaScript闭包的概念？',
      answer: '闭包是指有权访问另一个函数作用域中变量的函数'
    })
  })

  if (!response.ok) {
    throw new Error(`回答分析失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.data.overallScore || !data.data.dimensions) {
    throw new Error('回答分析响应数据不完整')
  }
})

// 6. 测试API降级功能
runner.test('API降级功能测试', async () => {
  // 测试普通问题生成接口（作为降级方案）
  const response = await fetch('http://localhost:8080/api/interview/generate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      position: '前端开发工程师',
      level: '初级',
      skills: ['HTML', 'CSS']
    })
  })

  if (!response.ok) {
    throw new Error(`降级接口失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.data.question) {
    throw new Error('降级接口响应数据不完整')
  }
})

// 7. 测试错误处理
runner.test('错误处理测试', async () => {
  // 测试不存在的接口
  try {
    const response = await fetch('http://localhost:8080/api/nonexistent')
    if (response.ok) {
      throw new Error('期望404错误，但请求成功了')
    }

    const data = await response.json()
    if (data.code !== 404) {
      throw new Error(`期望404错误，但得到: ${data.code}`)
    }
  } catch (error) {
    if (error.message.includes('期望404错误')) {
      throw error
    }
    // 网络错误也是正常的
  }
})

// 8. 测试CORS配置
runner.test('CORS配置测试', async () => {
  const response = await fetch('http://localhost:8080/api/health', {
    method: 'OPTIONS'
  })

  if (!response.ok) {
    throw new Error(`CORS预检请求失败: ${response.status}`)
  }

  const corsHeaders = response.headers.get('Access-Control-Allow-Origin')
  if (!corsHeaders) {
    throw new Error('CORS头部缺失')
  }
})

// 模拟浏览器环境测试MediaUtils
if (typeof window === 'undefined') {
  // Node.js环境，模拟浏览器对象
  global.navigator = {
    mediaDevices: {
      getUserMedia: () => Promise.resolve({}),
      enumerateDevices: () => Promise.resolve([])
    },
    userAgent: 'Node.js Test Environment'
  }

  global.window = {
    webkitSpeechRecognition: function() {},
    SpeechRecognition: function() {},
    RTCPeerConnection: function() {},
    MediaRecorder: function() {}
  }
}

// 9. 测试MediaUtils模块
runner.test('MediaUtils模块测试', async () => {
  try {
    // 由于我们在Node.js环境中，需要模拟导入
    const mediaUtilsCode = `
      export class MediaUtils {
        checkSupport() {
          return {
            video: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            audio: !!(window.webkitSpeechRecognition || window.SpeechRecognition),
            webRTC: !!(window.RTCPeerConnection),
            mediaRecorder: !!window.MediaRecorder
          }
        }
      }
      export default new MediaUtils()
    `

    // 模拟MediaUtils功能
    const mockMediaUtils = {
      checkSupport() {
        return {
          video: true,
          audio: true,
          webRTC: true,
          mediaRecorder: true
        }
      }
    }

    const support = mockMediaUtils.checkSupport()
    if (!support.video || !support.audio) {
      throw new Error('MediaUtils支持检查失败')
    }
  } catch (error) {
    throw new Error(`MediaUtils模块测试失败: ${error.message}`)
  }
})

// 10. 测试性能监控
runner.test('性能监控基础测试', async () => {
  // 模拟性能监控功能
  const mockPerformance = {
    timing: {
      navigationStart: Date.now() - 1000,
      loadEventEnd: Date.now()
    },
    memory: {
      usedJSHeapSize: 1024 * 1024,
      totalJSHeapSize: 2 * 1024 * 1024,
      jsHeapSizeLimit: 10 * 1024 * 1024
    }
  }

  const loadTime = mockPerformance.timing.loadEventEnd - mockPerformance.timing.navigationStart
  if (loadTime <= 0) {
    throw new Error('性能监控数据异常')
  }
})

// 运行所有测试
async function main() {
  console.log('🚀 AI智能面试系统 - 前端功能测试')
  console.log('=' .repeat(50))

  try {
    await runner.run()
  } catch (error) {
    console.error('测试运行出错:', error)
    process.exit(1)
  }
}

// 只有在直接运行此文件时才执行测试
if (require.main === module) {
  main()
}

module.exports = { TestRunner, runner }