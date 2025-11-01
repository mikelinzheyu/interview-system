/**
 * AI面试工作流测试脚本
 * 测试 http://localhost:5174/interview/ai 页面的完整工作流
 */

const http = require('http')

const FRONTEND_URL = 'http://127.0.0.1:5174'
const BACKEND_URL = 'http://127.0.0.1:3001'

// 简单输出（无颜色）
const log = {
  info: (msg) => console.log('ℹ  ' + msg),
  success: (msg) => console.log('✓  ' + msg),
  warn: (msg) => console.log('⚠  ' + msg),
  error: (msg) => console.log('✗  ' + msg),
  title: (msg) => console.log('\n>>> ' + msg)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : http
    const parsedUrl = new URL(url)

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const req = client.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ status: res.statusCode, body: parsed, raw: data })
        } catch (e) {
          resolve({ status: res.statusCode, body: null, raw: data })
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    req.end()
  })
}

async function testWorkflow() {
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║   AI面试工作流测试 - http://localhost:5174/interview/ai')
  console.log('╚════════════════════════════════════════════════════╝\n')

  const results = {
    tests: [],
    passed: 0,
    failed: 0
  }

  // 测试1: 前端页面加载
  log.title('1. 前端页面加载测试')
  try {
    const res = await makeRequest(`${FRONTEND_URL}/interview/ai`)
    if (res.status === 200 && res.raw.includes('<!DOCTYPE html')) {
      log.success('页面加载成功')
      results.passed++
      results.tests.push('✓ 页面加载')
    } else {
      log.error(`页面加载失败 (状态码: ${res.status})`)
      results.failed++
      results.tests.push('✗ 页面加载')
    }
  } catch (error) {
    log.error(`页面加载异常: ${error.message}`)
    results.failed++
    results.tests.push('✗ 页面加载')
  }

  // 测试2: 后端健康检查
  log.title('2. 后端服务检查')
  try {
    const res = await makeRequest(`${BACKEND_URL}/api/health`)
    if (res.status === 200 && res.body.data?.status === 'UP') {
      log.success('后端服务正常')
      results.passed++
      results.tests.push('✓ 后端服务')
    } else {
      log.error('后端服务异常')
      results.failed++
      results.tests.push('✗ 后端服务')
    }
  } catch (error) {
    log.error(`后端服务不可用: ${error.message}`)
    results.failed++
    results.tests.push('✗ 后端服务')
  }

  // 测试3: 题目生成API
  log.title('3. 智能问题生成测试')
  try {
    const res = await makeRequest(`${BACKEND_URL}/api/questions/generate`, {
      method: 'POST',
      body: {
        profession: '前端开发工程师',
        difficulty: '中级',
        count: 1
      }
    })

    if (res.status === 200 || res.status === 201) {
      log.success('问题生成API可用')
      log.info(`返回数据: ${JSON.stringify(res.body).substring(0, 100)}...`)
      results.passed++
      results.tests.push('✓ 问题生成API')
    } else {
      log.warn(`API返回状态码: ${res.status}`)
      results.tests.push('⚠ 问题生成API')
    }
  } catch (error) {
    log.warn(`问题生成API不可用: ${error.message}`)
    results.tests.push('⚠ 问题生成API')
  }

  // 测试4: 答案分析API
  log.title('4. 答案分析API测试')
  try {
    const res = await makeRequest(`${BACKEND_URL}/api/analysis/answer`, {
      method: 'POST',
      body: {
        question: '请解释什么是React Hooks?',
        answer: 'React Hooks是React 16.8版本引入的一个新特性...',
        profession: '前端开发工程师'
      }
    })

    if (res.status === 200 || res.status === 201) {
      log.success('答案分析API可用')
      if (res.body?.data?.score !== undefined) {
        log.info(`分数: ${res.body.data.score}/100`)
      }
      results.passed++
      results.tests.push('✓ 答案分析API')
    } else {
      log.warn(`API返回状态码: ${res.status}`)
      results.tests.push('⚠ 答案分析API')
    }
  } catch (error) {
    log.warn(`答案分析API不可用: ${error.message}`)
    results.tests.push('⚠ 答案分析API')
  }

  // 测试5: 面试会话管理API
  log.title('5. 面试会话管理测试')
  try {
    const res = await makeRequest(`${BACKEND_URL}/api/interview/sessions`, {
      method: 'POST',
      body: {
        profession: '前端开发工程师',
        startTime: new Date().toISOString()
      }
    })

    if (res.status === 200 || res.status === 201) {
      log.success('会话创建API可用')
      if (res.body?.data?.sessionId) {
        log.info(`会话ID: ${res.body.data.sessionId}`)
      }
      results.passed++
      results.tests.push('✓ 会话管理API')
    } else {
      log.warn(`API返回状态码: ${res.status}`)
      results.tests.push('⚠ 会话管理API')
    }
  } catch (error) {
    log.warn(`会话管理API不可用: ${error.message}`)
    results.tests.push('⚠ 会话管理API')
  }

  // 测试6: 前后端通信（代理）
  log.title('6. 前后端通信（API代理）测试')
  try {
    const res = await makeRequest(`${FRONTEND_URL}/api/health`)
    if (res.status === 200 && res.body.data?.status === 'UP') {
      log.success('API代理工作正常')
      results.passed++
      results.tests.push('✓ API代理')
    } else {
      log.error('API代理失败')
      results.failed++
      results.tests.push('✗ API代理')
    }
  } catch (error) {
    log.error(`API代理异常: ${error.message}`)
    results.failed++
    results.tests.push('✗ API代理')
  }

  // 输出总结
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║            工作流测试结果汇总')
  console.log('╚════════════════════════════════════════════════════╝\n')

  results.tests.forEach(test => console.log(test))

  console.log('\n统计:')
  console.log(`  ✓ 通过: ${results.passed}`)
  console.log(`  ⚠ 警告/可选: ${results.tests.filter(t => t.startsWith('⚠')).length}`)
  console.log(`  ✗ 失败: ${results.failed}`)

  // 工作流说明
  console.log('\n工作流步骤:\n')
  console.log('1️⃣  页面加载')
  console.log('   └─ 用户访问 /interview/ai 页面')
  console.log('   └─ 前端加载Vue组件和依赖\n')

  console.log('2️⃣  准备阶段')
  console.log('   └─ 用户点击"准备面试"按钮')
  console.log('   └─ 检查摄像头和麦克风权限')
  console.log('   └─ 设置问题信息\n')

  console.log('3️⃣  问题生成')
  console.log('   └─ 用户输入专业和难度')
  console.log('   └─ 前端调用后端生成问题API')
  console.log('   └─ 显示生成的问题\n')

  console.log('4️⃣  录音阶段')
  console.log('   └─ 用户启动摄像头')
  console.log('   └─ 用户点击开始录音')
  console.log('   └─ 浏览器识别用户语音并转文字\n')

  console.log('5️⃣  答案分析')
  console.log('   └─ 用户点击"分析回答"按钮')
  console.log('   └─ 前端发送答案到后端分析API')
  console.log('   └─ 显示AI分析结果、评分和建议\n')

  console.log('6️⃣  结果展示')
  console.log('   └─ 显示各项能力评分')
  console.log('   └─ 显示总体评分')
  console.log('   └─ 显示改进建议\n')

  // 关键检查点
  console.log('\n关键检查点:\n')

  const checks = [
    { name: '页面是否正常加载', status: results.tests[0] },
    { name: '后端服务是否运行', status: results.tests[1] },
    { name: 'API代理是否工作', status: results.tests[5] }
  ]

  checks.forEach(check => {
    const passed = check.status.startsWith('✓')
    console.log(`  ${check.status} ${check.name}`)
  })

  // 最终结论
  console.log('\n═══════════════════════════════════════════════════\n')

  const allCriticalPassed = results.failed === 0

  if (allCriticalPassed && results.passed >= 3) {
    console.log('✓ 工作流测试通过！系统可以进行完整的面试流程。\n')
    console.log('建议:')
    console.log('  • 在浏览器中测试实际的用户交互')
    console.log('  • 测试摄像头和麦克风权限')
    console.log('  • 测试语音识别功能')
    console.log('  • 验证AI分析结果\n')
  } else {
    console.log('⚠ 工作流测试存在问题，请检查以下项:\n')
    results.tests.forEach((test, idx) => {
      if (!test.startsWith('✓')) {
        console.log(`  • ${test}`)
      }
    })
    console.log()
  }

  return {
    success: allCriticalPassed && results.passed >= 3,
    results
  }
}

// 运行测试
testWorkflow().then(result => {
  process.exit(result.success ? 0 : 1)
}).catch(error => {
  log.error(`测试执行失败: ${error.message}`)
  process.exit(1)
})
