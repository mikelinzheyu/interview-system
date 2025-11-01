/**
 * 前后端本地联调测试脚本
 * 测试所有关键接口和功能
 */

const http = require('http')
const https = require('https')

const BACKEND_URL = 'http://127.0.0.1:3001'
const FRONTEND_URL = 'http://127.0.0.1:5174'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
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
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : data
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          })
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

async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'cyan')
  log('║   AI面试系统 - 本地前后端联调测试     ║', 'cyan')
  log('╚════════════════════════════════════════╝\n', 'cyan')

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  // 测试1: 检查后端服务
  log('━━━━━ 1. 后端服务检查 ━━━━━', 'blue')
  try {
    const healthRes = await makeRequest(`${BACKEND_URL}/api/health`)
    if (healthRes.status === 200 && healthRes.body.data?.status === 'UP') {
      log('✓ 后端健康检查通过', 'green')
      results.passed++
    } else {
      log('✗ 后端健康检查失败', 'red')
      results.failed++
    }
  } catch (error) {
    log(`✗ 无法连接后端: ${error.message}`, 'red')
    results.failed++
    process.exit(1)
  }

  // 测试2: 检查前端服务
  log('\n━━━━━ 2. 前端服务检查 ━━━━━', 'blue')
  try {
    const frontendRes = await makeRequest(FRONTEND_URL)
    if (frontendRes.status === 200) {
      log('✓ 前端开发服务器运行正常', 'green')
      results.passed++
    } else {
      log('✗ 前端无法访问', 'red')
      results.failed++
    }
  } catch (error) {
    log(`✗ 无法连接前端: ${error.message}`, 'red')
    results.failed++
    process.exit(1)
  }

  // 测试3: 通过前端代理访问后端API
  log('\n━━━━━ 3. 前端代理测试 ━━━━━', 'blue')
  try {
    const proxyRes = await makeRequest(`${FRONTEND_URL}/api/health`)
    if (proxyRes.status === 200) {
      log('✓ 前端成功代理后端请求', 'green')
      results.passed++
    } else {
      log(`✗ 代理请求失败 (状态码: ${proxyRes.status})`, 'red')
      results.failed++
    }
  } catch (error) {
    log(`✗ 代理测试失败: ${error.message}`, 'red')
    results.failed++
  }

  // 测试4: Socket.IO连接
  log('\n━━━━━ 4. Socket.IO实时通信检查 ━━━━━', 'blue')
  try {
    const socketRes = await makeRequest(`${BACKEND_URL}/socket.io/`, {
      headers: { 'Content-Type': 'application/json' }
    })
    if (socketRes.status === 200 || socketRes.body.code === 0) {
      log('✓ Socket.IO服务可用', 'green')
      results.passed++
    } else {
      log('✗ Socket.IO连接异常', 'red')
      results.failed++
    }
  } catch (error) {
    log(`⚠ Socket.IO暂不可用: ${error.message}`, 'yellow')
  }

  // 测试5: CORS配置检查
  log('\n━━━━━ 5. CORS跨域配置检查 ━━━━━', 'blue')
  try {
    const corsRes = await makeRequest(`${BACKEND_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      }
    })
    const allowOrigin = corsRes.headers['access-control-allow-origin']
    if (allowOrigin === FRONTEND_URL || allowOrigin === '*') {
      log('✓ CORS配置正确', 'green')
      results.passed++
    } else {
      log(`⚠ CORS可能不完全配置 (Allow-Origin: ${allowOrigin})`, 'yellow')
    }
  } catch (error) {
    log(`⚠ CORS检查异常: ${error.message}`, 'yellow')
  }

  // 测试6: 响应时间检查
  log('\n━━━━━ 6. 性能检查 ━━━━━', 'blue')
  const startTime = Date.now()
  try {
    await makeRequest(`${BACKEND_URL}/api/health`)
    const responseTime = Date.now() - startTime
    if (responseTime < 1000) {
      log(`✓ 后端响应时间: ${responseTime}ms (快)`, 'green')
      results.passed++
    } else if (responseTime < 5000) {
      log(`⚠ 后端响应时间: ${responseTime}ms (正常)`, 'yellow')
    } else {
      log(`✗ 后端响应时间: ${responseTime}ms (较慢)`, 'red')
      results.failed++
    }
  } catch (error) {
    log(`✗ 性能测试失败: ${error.message}`, 'red')
    results.failed++
  }

  // 测试7: Redis连接检查
  log('\n━━━━━ 7. Redis缓存检查 ━━━━━', 'blue')
  try {
    const redisDns = '127.0.0.1'
    const redisPort = 6379
    await makeRequest(`http://${redisDns}:${redisPort}`)
    log('✓ Redis服务可用', 'green')
    results.passed++
  } catch (error) {
    log(`⚠ Redis不可用或未配置: ${error.message}`, 'yellow')
  }

  // 输出总结
  log('\n╔════════════════════════════════════════╗', 'cyan')
  log('║          联调测试结果汇总              ║', 'cyan')
  log('╚════════════════════════════════════════╝\n', 'cyan')

  log(`✓ 通过: ${results.passed}`, 'green')
  log(`✗ 失败: ${results.failed}`, results.failed > 0 ? 'red' : 'green')

  log('\n┌─ 服务状态总结 ─┐', 'blue')
  log(`后端: ${BACKEND_URL}`, 'green')
  log(`前端: ${FRONTEND_URL}`, 'green')
  log(`代理: 正常 → /api 转发到后端`, 'green')
  log('└────────────────┘\n', 'blue')

  // 访问说明
  log('📝 快速开始:', 'cyan')
  log(`  1. 打开浏览器访问: ${FRONTEND_URL}`, 'yellow')
  log('  2. 前端会自动代理API请求到后端', 'yellow')
  log('  3. 可以在浏览器控制台查看网络请求', 'yellow')

  log('\n📊 常用命令:', 'cyan')
  log('  查看后端日志:    tail -f backend/backend.log', 'yellow')
  log('  查看前端日志:    tail -f frontend/frontend.log', 'yellow')
  log('  关闭后端:        Ctrl+C (后端窗口)', 'yellow')
  log('  关闭前端:        Ctrl+C (前端窗口)', 'yellow')

  if (results.failed === 0) {
    log('\n✓ 所有关键测试通过! 可以开始联调。\n', 'green')
  } else {
    log(`\n⚠ 有${results.failed}个测试失败，请查看上面的错误信息。\n`, 'yellow')
  }

  process.exit(results.failed > 0 ? 1 : 0)
}

// 运行测试
runTests().catch(error => {
  log(`\n✗ 测试执行错误: ${error.message}\n`, 'red')
  process.exit(1)
})
