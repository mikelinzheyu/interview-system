/**
 * Redis 会话存储集成测试
 * 测试所有会话存储API端点
 */

const http = require('http')

const API_BASE = 'http://localhost:3001'

/**
 * 发送HTTP请求
 */
function sendRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => {
        body += chunk.toString()
      })
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          }
          resolve(result)
        } catch (error) {
          reject(error)
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

/**
 * 测试函数
 */
async function runTests() {
  console.log('🧪 Redis 会话存储集成测试\n')
  console.log('=' .repeat(60))

  let testSessionId = `test-session-${Date.now()}`

  try {
    // ============ 测试 1: 保存会话数据 ============
    console.log('\n📝 测试 1: 保存会话数据')
    console.log('-'.repeat(60))

    const sessionData = {
      jobTitle: 'Python后端开发工程师',
      generatedQuestions: '请介绍一下你对Python装饰器的理解',
      standardAnswer: '装饰器是一种设计模式，用于在不修改原函数代码的情况下增加额外功能...',
      createdAt: new Date().toISOString(),
      requestType: 'generate_questions'
    }

    const saveResult = await sendRequest('POST', '/api/interview/sessions', {
      sessionId: testSessionId,
      sessionData: sessionData
    })

    console.log('响应状态:', saveResult.statusCode)
    console.log('响应数据:', JSON.stringify(saveResult.body, null, 2))

    if (saveResult.statusCode === 200) {
      console.log('✅ 保存会话成功')
    } else {
      console.log('❌ 保存会话失败')
      throw new Error('保存会话失败')
    }

    // ============ 测试 2: 加载会话数据 ============
    console.log('\n📂 测试 2: 加载会话数据')
    console.log('-'.repeat(60))

    const loadResult = await sendRequest('GET', `/api/interview/sessions/${testSessionId}`)

    console.log('响应状态:', loadResult.statusCode)
    console.log('响应数据:', JSON.stringify(loadResult.body, null, 2))

    if (loadResult.statusCode === 200) {
      const loadedData = loadResult.body.data.sessionData
      console.log('\n已加载的会话数据:')
      console.log('  职位:', loadedData.jobTitle)
      console.log('  问题:', loadedData.generatedQuestions)
      console.log('  创建时间:', loadedData.createdAt)

      // 验证数据一致性
      if (loadedData.jobTitle === sessionData.jobTitle) {
        console.log('✅ 加载会话成功，数据一致')
      } else {
        console.log('❌ 数据不一致')
        throw new Error('数据不一致')
      }
    } else {
      console.log('❌ 加载会话失败')
      throw new Error('加载会话失败')
    }

    // ============ 测试 3: 更新会话TTL ============
    console.log('\n⏱️  测试 3: 更新会话TTL')
    console.log('-'.repeat(60))

    const touchResult = await sendRequest('PUT', `/api/interview/sessions/${testSessionId}/touch`)

    console.log('响应状态:', touchResult.statusCode)
    console.log('响应数据:', JSON.stringify(touchResult.body, null, 2))

    if (touchResult.statusCode === 200) {
      console.log('✅ 更新TTL成功')
    } else {
      console.log('❌ 更新TTL失败')
    }

    // ============ 测试 4: 获取所有会话ID ============
    console.log('\n📋 测试 4: 获取所有会话ID')
    console.log('-'.repeat(60))

    const listResult = await sendRequest('GET', '/api/interview/sessions')

    console.log('响应状态:', listResult.statusCode)
    console.log('会话总数:', listResult.body.data?.total || 0)

    if (listResult.statusCode === 200) {
      const sessionIds = listResult.body.data.sessionIds
      console.log('会话ID列表:', sessionIds)

      if (sessionIds.includes(testSessionId)) {
        console.log('✅ 获取会话列表成功，包含测试会话')
      } else {
        console.log('⚠️  会话列表中不包含测试会话')
      }
    } else {
      console.log('❌ 获取会话列表失败')
    }

    // ============ 测试 5: 更新会话数据（先加载后保存）============
    console.log('\n🔄 测试 5: 更新会话数据')
    console.log('-'.repeat(60))

    const updatedData = {
      ...sessionData,
      candidateAnswer: '装饰器是Python的一个重要特性，它允许我们在不修改原函数的情况下扩展功能...',
      comprehensiveEvaluation: '回答准确，理解深入',
      overallScore: 85,
      evaluatedAt: new Date().toISOString()
    }

    const updateResult = await sendRequest('POST', '/api/interview/sessions', {
      sessionId: testSessionId,
      sessionData: updatedData
    })

    console.log('响应状态:', updateResult.statusCode)

    if (updateResult.statusCode === 200) {
      // 验证更新
      const verifyResult = await sendRequest('GET', `/api/interview/sessions/${testSessionId}`)
      const verifiedData = verifyResult.body.data.sessionData

      if (verifiedData.overallScore === 85) {
        console.log('✅ 更新会话成功，分数已保存:', verifiedData.overallScore)
      } else {
        console.log('❌ 更新验证失败')
      }
    } else {
      console.log('❌ 更新会话失败')
    }

    // ============ 测试 6: 删除会话数据 ============
    console.log('\n🗑️  测试 6: 删除会话数据')
    console.log('-'.repeat(60))

    const deleteResult = await sendRequest('DELETE', `/api/interview/sessions/${testSessionId}`)

    console.log('响应状态:', deleteResult.statusCode)
    console.log('响应数据:', JSON.stringify(deleteResult.body, null, 2))

    if (deleteResult.statusCode === 200) {
      console.log('✅ 删除会话成功')

      // 验证删除
      const verifyDeleteResult = await sendRequest('GET', `/api/interview/sessions/${testSessionId}`)

      if (verifyDeleteResult.statusCode === 404) {
        console.log('✅ 验证删除成功，会话已不存在')
      } else {
        console.log('⚠️  会话似乎仍然存在')
      }
    } else {
      console.log('❌ 删除会话失败')
    }

    // ============ 测试 7: 加载不存在的会话 ============
    console.log('\n🔍 测试 7: 加载不存在的会话')
    console.log('-'.repeat(60))

    const notFoundResult = await sendRequest('GET', '/api/interview/sessions/non-existent-session')

    console.log('响应状态:', notFoundResult.statusCode)

    if (notFoundResult.statusCode === 404) {
      console.log('✅ 正确返回404')
    } else {
      console.log('❌ 应该返回404但返回了:', notFoundResult.statusCode)
    }

    // ============ 测试总结 ============
    console.log('\n' + '='.repeat(60))
    console.log('🎉 所有测试完成!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    console.error('错误详情:', error)
    process.exit(1)
  }
}

// 运行测试
console.log('启动时间:', new Date().toISOString())
runTests()
  .then(() => {
    console.log('\n✅ 测试套件执行完毕')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 测试套件失败:', error)
    process.exit(1)
  })
