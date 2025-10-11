/**
 * Phase 3 前端集成测试
 * 测试所有 Phase 3 页面路由和 API 连接
 */

const http = require('http')

const BASE_URL = 'http://localhost:3001'

// 测试计数器
let testsTotal = 0
let testsPassed = 0
let testsFailed = 0

// 辅助函数：发送 HTTP 请求
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        try {
          const response = JSON.parse(body)
          resolve(response)
        } catch (e) {
          resolve({ code: res.statusCode, body })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// 测试函数
async function testPhase3Frontend() {
  console.log('🧪 开始测试 Phase 3 前端集成')
  console.log('=' .repeat(70))
  console.log()

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('📚 Phase 3.1: 社区贡献系统 API 测试')
  console.log('-'.repeat(70))

  // 测试 1: 贡献排行榜 API
  console.log('\n📋 测试 1: 贡献排行榜 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/contributions/leaderboard?limit=10')
    if (response.code === 200 && response.data.items) {
      console.log('✅ API 正常')
      console.log(`   排行榜人数: ${response.data.items.length}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  // 测试 2: 我的提交列表 API
  console.log('\n📋 测试 2: 我的提交列表 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/contributions/my-submissions?page=1&limit=10')
    if (response.code === 200 && response.data.items) {
      console.log('✅ API 正常')
      console.log(`   提交总数: ${response.data.total}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  // 测试 3: 贡献者资料 API
  console.log('\n📋 测试 3: 贡献者资料 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/contributions/profile/1')
    if (response.code === 200 && response.data.stats) {
      console.log('✅ API 正常')
      console.log(`   总提交数: ${response.data.stats.totalSubmissions}`)
      console.log(`   通过率: ${(response.data.stats.approvalRate * 100).toFixed(1)}%`)
      console.log(`   徽章数: ${response.data.badges.length}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  // 测试 4: 徽章列表 API
  console.log('\n📋 测试 4: 徽章列表 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/contributions/badges')
    if (response.code === 200 && response.data.items) {
      console.log('✅ API 正常')
      console.log(`   徽章种类数: ${response.data.items.length}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  console.log()
  console.log('📊 Phase 3.2: 跨专业能力分析 API 测试')
  console.log('-'.repeat(70))

  // 测试 5: 用户能力画像 API
  console.log('\n📋 测试 5: 用户能力画像 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/ability/profile/1')
    if (response.code === 200 && response.data.tShapeAnalysis) {
      console.log('✅ API 正常')
      console.log(`   T型指数: ${(response.data.tShapeAnalysis.index * 100).toFixed(1)}`)
      console.log(`   人才类型: ${response.data.tShapeAnalysis.type}`)
      console.log(`   主攻领域: ${response.data.primaryDomain.domainName}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  // 测试 6: 雷达图数据 API
  console.log('\n📋 测试 6: 雷达图数据 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/ability/radar/1')
    if (response.code === 200 && response.data.domains) {
      console.log('✅ API 正常')
      console.log(`   领域数: ${response.data.domains.length}`)
      console.log(`   领域: ${response.data.domains.join(', ')}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  // 测试 7: T型人才排行榜 API
  console.log('\n📋 测试 7: T型人才排行榜 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/ability/t-shape-leaderboard?limit=10')
    if (response.code === 200 && response.data.items) {
      console.log('✅ API 正常')
      console.log(`   排行榜人数: ${response.data.items.length}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  // 测试 8: 跨专业推荐 API
  console.log('\n📋 测试 8: 跨专业推荐 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/ability/cross-domain-recommendations/1')
    if (response.code === 200 && response.data.recommendations) {
      console.log('✅ API 正常')
      console.log(`   推荐数量: ${response.data.recommendations.length}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  console.log()
  console.log('🤖 Phase 3.3: AI 自动出题 API 测试')
  console.log('-'.repeat(70))

  // 测试 9: AI 生成历史 API
  console.log('\n📋 测试 9: AI 生成历史 API')
  testsTotal++
  try {
    const response = await makeRequest('GET', '/api/ai/generation-history?page=1&limit=10')
    if (response.code === 200 && response.data.items) {
      console.log('✅ API 正常')
      console.log(`   历史记录数: ${response.data.items.length}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  // 测试 10: 模拟提交题目
  console.log('\n📋 测试 10: 提交题目 API')
  testsTotal++
  try {
    const submitData = {
      domainId: 1,
      domainName: '计算机科学',
      categoryId: 1,
      title: '前端测试题目',
      content: '这是一个测试题目',
      difficulty: 'easy',
      tags: ['测试'],
      options: [
        { id: 'A', text: '选项A' },
        { id: 'B', text: '选项B' }
      ],
      correctAnswer: 'A',
      explanation: '答案是A',
      hints: [],
      metadata: {}
    }
    const response = await makeRequest('POST', '/api/contributions/submit', submitData)
    if (response.code === 200) {
      console.log('✅ API 正常')
      console.log(`   提交ID: ${response.data.id}`)
      testsPassed++
    } else {
      console.log('❌ API 返回异常')
      testsFailed++
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
    testsFailed++
  }

  // 输出测试总结
  console.log()
  console.log('=' .repeat(70))
  console.log('📊 Phase 3 前端集成测试总结')
  console.log('='.repeat(70))
  console.log()
  console.log(`总测试数: ${testsTotal}`)
  console.log(`✅ 通过: ${testsPassed} (${(testsPassed / testsTotal * 100).toFixed(1)}%)`)
  console.log(`❌ 失败: ${testsFailed}`)
  console.log()

  if (testsFailed > 0) {
    console.log(`⚠️  有 ${testsFailed} 个测试失败`)
  } else {
    console.log('🎉 所有测试通过！')
  }

  console.log()
  console.log('=' .repeat(70))
  console.log()
  console.log('✅ 前端集成测试完毕')
  console.log()
  console.log('📝 前端页面清单:')
  console.log('   - /contributions/submit           提交题目页面')
  console.log('   - /contributions/my-submissions   我的提交列表')
  console.log('   - /contributions/profile/1        贡献者资料')
  console.log('   - /contributions/leaderboard      贡献排行榜')
  console.log('   - /ability/profile                能力画像')
  console.log('   - /ability/leaderboard            T型人才排行榜')
  console.log('   - /ai/generate                    AI生成题目')
  console.log()
}

// 运行测试
testPhase3Frontend().catch(error => {
  console.error('测试脚本执行出错:', error)
  process.exit(1)
})
