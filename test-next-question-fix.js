#!/usr/bin/env node
/**
 * 测试"下一题"按钮修复
 * 验证API返回的数据格式是否正确
 */

const http = require('http')

const BACKEND_URL = 'http://localhost:3001'

console.log('\n╔═══════════════════════════════════════════════════╗')
console.log('║  "下一题"按钮修复验证测试                        ║')
console.log('╚═══════════════════════════════════════════════════╝\n')

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : http
    const parsedUrl = new URL(url)

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 3001,
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
          resolve({ status: res.statusCode, body: parsed })
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
      const jsonBody = JSON.stringify(options.body)
      req.write(jsonBody)
    }
    req.end()
  })
}

async function testNextQuestionFix() {
  const results = {
    passed: 0,
    failed: 0,
    checks: []
  }

  // 测试1: 调用生成问题API
  console.log('📝 测试1: 调用智能问题生成API')
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/interview/generate-question-smart`, {
      method: 'POST',
      body: {
        position: '前端开发工程师',
        level: '中级',
        skills: ['React', 'Vue'],
        previousQuestions: []
      }
    })

    if (response.status === 200) {
      console.log('✅ API 返回 200 状态码\n')
      results.passed++
    } else {
      console.log(`❌ API 返回 ${response.status} 状态码\n`)
      results.failed++
    }

    const data = response.body.data
    console.log('📋 检查返回的字段:\n')

    // 检查必需字段
    const requiredFields = {
      'questionId': 'ID (对应前端的questionData.questionId)',
      'question': '题目文本',
      'expectedAnswer': '标准答案',
      'keywords': '关键词',
      'category': '分类',
      'difficulty': '难度',
      'generatedBy': '生成源',
      'confidenceScore': '置信度',
      'sessionId': '会话ID',
      'hasAnswer': '是否有答案',
      'allQuestions': '所有题目列表'
    }

    for (const [field, desc] of Object.entries(requiredFields)) {
      const hasField = field in data
      const value = data[field]
      const status = hasField ? '✅' : '❌'
      const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : value
      console.log(`${status} ${field.padEnd(20)} - ${desc}`)
      console.log(`   值: ${displayValue}\n`)

      if (hasField) {
        results.passed++
        results.checks.push(`✓ ${field}`)
      } else {
        results.failed++
        results.checks.push(`✗ ${field} (缺失)`)
      }
    }

  } catch (error) {
    console.log(`❌ API 调用失败: ${error.message}\n`)
    results.failed++
  }

  // 输出总结
  console.log('═══════════════════════════════════════════════════\n')
  console.log('📊 测试结果:\n')

  results.checks.forEach(check => {
    console.log(`  ${check}`)
  })

  console.log(`\n统计:`)
  console.log(`  ✓ 通过: ${results.passed}`)
  console.log(`  ✗ 失败: ${results.failed}`)

  // 评估
  console.log('\n═══════════════════════════════════════════════════\n')

  if (results.failed === 0) {
    console.log('✅ 所有测试通过!')
    console.log('\n修复情况:')
    console.log('  ✓ 后端API返回格式已标准化')
    console.log('  ✓ 前端可以正确识别所有字段')
    console.log('  ✓ "下一题"功能应该可以正常工作\n')
    return 0
  } else {
    console.log('❌ 部分测试失败')
    console.log(`\n请检查以下字段的返回格式:`)
    results.checks.forEach(check => {
      if (check.startsWith('✗')) {
        console.log(`  • ${check}`)
      }
    })
    console.log()
    return 1
  }
}

testNextQuestionFix().then(code => {
  process.exit(code)
}).catch(error => {
  console.error('❌ 测试执行失败:', error.message)
  process.exit(1)
})
