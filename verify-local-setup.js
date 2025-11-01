/**
 * 本地前后端联调环境验证 - 简化版
 */

const http = require('http')

const tests = [
  {
    name: '后端健康检查',
    url: 'http://127.0.0.1:3001/api/health',
    checkStatus: 200,
    checkBody: (body) => body.data?.status === 'UP'
  },
  {
    name: '前端服务检查',
    url: 'http://127.0.0.1:5174/',
    checkStatus: 200,
    checkBody: (body) => body.includes('<!DOCTYPE html>')
  },
  {
    name: '前端代理后端API',
    url: 'http://127.0.0.1:5174/api/health',
    checkStatus: 200,
    checkBody: (body) => body.data?.status === 'UP'
  }
]

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
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
  })
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║    AI面试系统 - 本地联调环境验证           ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      const result = await makeRequest(test.url)

      let isValid = result.status === test.checkStatus

      if (isValid && test.checkBody) {
        if (typeof result.body === 'string') {
          isValid = test.checkBody(result.raw)
        } else {
          isValid = test.checkBody(result.body)
        }
      }

      if (isValid) {
        console.log(`✓ ${test.name}`)
        passed++
      } else {
        console.log(`✗ ${test.name} (状态码: ${result.status})`)
        failed++
      }
    } catch (error) {
      console.log(`✗ ${test.name} (${error.message})`)
      failed++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✓ 通过: ${passed}/${tests.length}`)
  if (failed > 0) console.log(`✗ 失败: ${failed}/${tests.length}`)

  console.log(`\n📋 服务地址:`)
  console.log(`  后端: http://127.0.0.1:3001`)
  console.log(`  前端: http://127.0.0.1:5174`)

  console.log(`\n💡 提示:`)
  console.log(`  • 在浏览器打开: http://127.0.0.1:5174`)
  console.log(`  • 前端会自动代理请求到后端 /api`)
  console.log(`  • 可以在浏览器F12查看Network标签监控请求\n`)

  if (failed === 0) {
    console.log('✅ 所有测试通过! 可以开始联调\n')
    process.exit(0)
  } else {
    console.log(`⚠️  有${failed}个测试失败\n`)
    process.exit(1)
  }
}

run().catch(err => {
  console.error('\n❌ 错误:', err.message, '\n')
  process.exit(1)
})
