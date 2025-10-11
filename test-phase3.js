/**
 * Phase 3 功能测试脚本
 * 测试社区贡献、跨专业能力分析、AI自动出题三大功能
 */

const http = require('http')

const BASE_URL = 'http://localhost:3001'

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
      let responseData = ''
      res.on('data', chunk => { responseData += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData))
        } catch (err) {
          resolve(responseData)
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

async function testPhase3() {
  console.log('\n🧪 开始测试 Phase 3 功能\n')
  console.log('=' .repeat(70))

  let testsTotal = 0
  let testsPassed = 0
  let testsFailed = 0

  try {
    // ========== Phase 3.1: 社区贡献系统测试 ==========
    console.log('\n📚 Phase 3.1: 社区贡献系统测试\n')
    console.log('-'.repeat(70))

    // 测试 1: 提交题目
    console.log('\n📋 测试 1: 提交题目')
    testsTotal++
    const submitData = {
      domainId: 1,
      categoryId: 1,
      title: '测试题目 - 实现Promise.all',
      content: '请实现Promise.all方法',
      difficulty: 'medium',
      tags: ['JavaScript', 'Promise'],
      hints: ['考虑所有Promise都resolve的情况', '考虑有Promise reject的情况'],
      metadata: {
        languageRestrictions: ['JavaScript'],
        timeComplexity: 'O(n)'
      },
      options: [
        { id: 'A', text: '使用async/await' },
        { id: 'B', text: '使用Promise.race' },
        { id: 'C', text: '使用计数器' },
        { id: 'D', text: '以上都可以' }
      ],
      correctAnswer: 'C',
      explanation: 'Promise.all需要等待所有Promise完成,使用计数器是最直接的实现方式'
    }

    const submitResp = await makeRequest('POST', '/api/contributions/submit', submitData)
    if (submitResp.code === 200) {
      console.log('✅ 提交成功')
      console.log('   提交ID:', submitResp.data.id)
      console.log('   状态:', submitResp.data.status)
      testsPassed++
    } else {
      console.log('❌ 提交失败:', submitResp.message)
      testsFailed++
    }

    // 测试 2: 获取我的提交列表
    console.log('\n📋 测试 2: 获取我的提交列表')
    testsTotal++
    const mySubmissionsResp = await makeRequest('GET', '/api/contributions/my-submissions?page=1&limit=10')
    if (mySubmissionsResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   提交数量:', mySubmissionsResp.data.total)
      console.log('   当前页数量:', mySubmissionsResp.data.items.length)
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 3: 获取提交详情
    console.log('\n📋 测试 3: 获取提交详情')
    testsTotal++
    const submissionDetailResp = await makeRequest('GET', '/api/contributions/submissions/1')
    if (submissionDetailResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   题目标题:', submissionDetailResp.data.title)
      console.log('   提交状态:', submissionDetailResp.data.status)
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 4: 获取审核队列
    console.log('\n📋 测试 4: 获取审核队列')
    testsTotal++
    const reviewQueueResp = await makeRequest('GET', '/api/contributions/review-queue?status=pending')
    if (reviewQueueResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   待审核数量:', reviewQueueResp.data.total)
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 5: 领取审核任务
    console.log('\n📋 测试 5: 领取审核任务')
    testsTotal++
    const claimResp = await makeRequest('POST', '/api/contributions/review-queue/1/claim')
    if (claimResp.code === 200) {
      console.log('✅ 领取成功')
      console.log('   队列ID:', claimResp.data.id)
      console.log('   审核员ID:', claimResp.data.reviewerId)
      testsPassed++
    } else {
      console.log('❌ 领取失败:', claimResp.message)
      testsFailed++
    }

    // 测试 6: 提交审核结果 (通过)
    console.log('\n📋 测试 6: 提交审核结果 (通过)')
    testsTotal++
    const reviewResp = await makeRequest('POST', '/api/contributions/submissions/1/review', {
      action: 'approve',
      comment: '题目质量很高,通过审核'
    })
    if (reviewResp.code === 200) {
      console.log('✅ 审核成功')
      console.log('   新状态:', reviewResp.data.newStatus)
      console.log('   创建的题目ID:', reviewResp.data.questionId)
      testsPassed++
    } else {
      console.log('❌ 审核失败')
      testsFailed++
    }

    // 测试 7: 获取贡献者资料
    console.log('\n📋 测试 7: 获取贡献者资料')
    testsTotal++
    const profileResp = await makeRequest('GET', '/api/contributions/profile/1')
    if (profileResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   总提交数:', profileResp.data.stats.totalSubmissions)
      console.log('   通过数:', profileResp.data.stats.approvedCount)
      console.log('   通过率:', (profileResp.data.stats.approvalRate * 100).toFixed(1) + '%')
      console.log('   徽章数:', profileResp.data.badges.length)
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 8: 获取贡献排行榜
    console.log('\n📋 测试 8: 获取贡献排行榜')
    testsTotal++
    const leaderboardResp = await makeRequest('GET', '/api/contributions/leaderboard?limit=10')
    if (leaderboardResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   排行榜人数:', leaderboardResp.data.items.length)
      if (leaderboardResp.data.items.length > 0) {
        console.log('   第1名:', leaderboardResp.data.items[0].username, '-', leaderboardResp.data.items[0].totalPoints, '分')
      }
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 9: 获取徽章列表
    console.log('\n📋 测试 9: 获取徽章列表')
    testsTotal++
    const badgesResp = await makeRequest('GET', '/api/contributions/badges')
    if (badgesResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   徽章种类数:', badgesResp.data.items.length)
      badgesResp.data.items.slice(0, 3).forEach(badge => {
        console.log(`   ${badge.icon} ${badge.name} - ${badge.description}`)
      })
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // ========== Phase 3.2: 跨专业能力分析测试 ==========
    console.log('\n\n📊 Phase 3.2: 跨专业能力分析测试\n')
    console.log('-'.repeat(70))

    // 测试 10: 获取用户能力画像
    console.log('\n📋 测试 10: 获取用户能力画像')
    testsTotal++
    const abilityProfileResp = await makeRequest('GET', '/api/ability/profile/1')
    if (abilityProfileResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   主攻领域:', abilityProfileResp.data.primaryDomain.domainName)
      console.log('   主攻得分:', abilityProfileResp.data.primaryDomain.score)
      console.log('   T型指数:', abilityProfileResp.data.tShapeAnalysis.index)
      console.log('   人才类型:', abilityProfileResp.data.tShapeAnalysis.type)
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 11: 获取雷达图数据
    console.log('\n📋 测试 11: 获取雷达图数据')
    testsTotal++
    const radarResp = await makeRequest('GET', '/api/ability/radar/1')
    if (radarResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   领域数:', radarResp.data.domains.length)
      console.log('   领域列表:', radarResp.data.domains.join(', '))
      console.log('   得分分布:', radarResp.data.scores.join(', '))
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 12: 获取 T 型指数排行
    console.log('\n📋 测试 12: 获取 T 型指数排行')
    testsTotal++
    const tShapeLeaderboardResp = await makeRequest('GET', '/api/ability/t-shape-leaderboard?limit=10')
    if (tShapeLeaderboardResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   排行榜人数:', tShapeLeaderboardResp.data.items.length)
      if (tShapeLeaderboardResp.data.items.length > 0) {
        const top1 = tShapeLeaderboardResp.data.items[0]
        console.log(`   第1名: ${top1.username} - T型指数 ${top1.tShapeIndex}`)
        console.log(`   主攻领域: ${top1.primaryDomain}`)
      }
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 13: 获取跨专业推荐
    console.log('\n📋 测试 13: 获取跨专业推荐')
    testsTotal++
    const recommendationsResp = await makeRequest('GET', '/api/ability/cross-domain-recommendations/1')
    if (recommendationsResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   推荐题目数:', recommendationsResp.data.questions.length)
      console.log('   推荐学习路径数:', recommendationsResp.data.learningPaths.length)
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // ========== Phase 3.3: AI 自动出题测试 ==========
    console.log('\n\n🤖 Phase 3.3: AI 自动出题测试\n')
    console.log('-'.repeat(70))

    // 测试 14: 生成题目
    console.log('\n📋 测试 14: 生成题目')
    testsTotal++
    const generateResp = await makeRequest('POST', '/api/ai/generate-questions', {
      domainId: 1,
      domainName: '计算机科学',
      categoryId: 1,
      difficulty: 'medium',
      metadata: {
        languageRestrictions: ['JavaScript'],
        timeComplexity: 'O(n)'
      },
      count: 3,
      model: 'gpt-4',
      temperature: 0.7
    })
    if (generateResp.code === 200) {
      console.log('✅ 生成成功')
      console.log('   生成ID:', generateResp.data.id)
      console.log('   生成题目数:', generateResp.data.generatedQuestions.length)
      console.log('   使用模型:', generateResp.data.generatedBy)
      console.log('   Token消耗:', generateResp.data.tokensUsed)
      console.log('   成本:', '$' + generateResp.data.cost)
      testsPassed++
    } else {
      console.log('❌ 生成失败')
      testsFailed++
    }

    // 测试 15: 获取生成历史
    console.log('\n📋 测试 15: 获取生成历史')
    testsTotal++
    const historyResp = await makeRequest('GET', '/api/ai/generation-history?page=1&limit=10')
    if (historyResp.code === 200) {
      console.log('✅ 获取成功')
      console.log('   历史记录数:', historyResp.data.total)
      console.log('   当前页数量:', historyResp.data.items.length)
      testsPassed++
    } else {
      console.log('❌ 获取失败')
      testsFailed++
    }

    // 测试 16: 审核AI生成的题目
    console.log('\n📋 测试 16: 审核AI生成的题目')
    testsTotal++
    const aiReviewResp = await makeRequest('POST', '/api/ai/generated-questions/1/review', {
      approvedIndices: [0, 2],  // 通过第1和第3道题
      rejectedIndices: [1]      // 拒绝第2道题
    })
    if (aiReviewResp.code === 200) {
      console.log('✅ 审核成功')
      console.log('   通过数:', aiReviewResp.data.approvedCount)
      console.log('   拒绝数:', aiReviewResp.data.rejectedCount)
      console.log('   创建的题目IDs:', aiReviewResp.data.approvedQuestions.join(', '))
      testsPassed++
    } else {
      console.log('❌ 审核失败')
      testsFailed++
    }

    // 测试 17: 配置 API Key
    console.log('\n📋 测试 17: 配置 API Key')
    testsTotal++
    const configResp = await makeRequest('POST', '/api/ai/config', {
      provider: 'openai',
      apiKey: 'sk-test-key-***',
      enabled: true
    })
    if (configResp.code === 200) {
      console.log('✅ 配置成功')
      testsPassed++
    } else {
      console.log('❌ 配置失败')
      testsFailed++
    }

    // ========== 测试总结 ==========
    console.log('\n\n' + '='.repeat(70))
    console.log('📊 Phase 3 测试总结')
    console.log('='.repeat(70))
    console.log()
    console.log(`总测试数: ${testsTotal}`)
    console.log(`✅ 通过: ${testsPassed} (${((testsPassed/testsTotal) * 100).toFixed(1)}%)`)
    console.log(`❌ 失败: ${testsFailed}`)
    console.log()

    if (testsFailed === 0) {
      console.log('🎉 所有测试通过!')
    } else {
      console.log(`⚠️  有 ${testsFailed} 个测试失败`)
    }

    console.log('\n' + '='.repeat(70))
    console.log('\n')

  } catch (error) {
    console.error('\n❌ 测试过程出错:', error.message)
    process.exit(1)
  }
}

// 等待服务器启动后运行测试
setTimeout(() => {
  testPhase3().then(() => {
    console.log('✅ 测试脚本执行完毕')
    process.exit(0)
  }).catch(err => {
    console.error('❌ 测试异常:', err)
    process.exit(1)
  })
}, 2000)
