/**
 * 学习路径功能测试脚本
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

async function testLearningPaths() {
  console.log('\n🧪 开始测试学习路径功能\n')
  console.log('=' .repeat(60))

  try {
    // 测试 1: 获取所有学习路径
    console.log('\n📋 测试 1: 获取所有学习路径')
    const pathsResp = await makeRequest('GET', '/api/learning-paths')
    console.log('✅ 状态:', pathsResp.success ? '成功' : '失败')
    console.log('📊 路径数量:', pathsResp.data?.items?.length || 0)
    if (pathsResp.data?.items) {
      pathsResp.data.items.forEach(path => {
        console.log(`   ${path.icon} ${path.name} - ${path.moduleCount}模块, ${path.estimatedHours}小时`)
      })
    }

    // 测试 2: 按领域筛选学习路径
    console.log('\n📋 测试 2: 获取计算机科学领域的学习路径')
    const csPaths = await makeRequest('GET', '/api/learning-paths?domain_id=1')
    console.log('✅ 状态:', csPaths.success ? '成功' : '失败')
    console.log('📊 路径数量:', csPaths.data?.items?.length || 0)

    // 测试 3: 按级别筛选
    console.log('\n📋 测试 3: 获取进阶级别的学习路径')
    const intermediatePaths = await makeRequest('GET', '/api/learning-paths?level=intermediate')
    console.log('✅ 状态:', intermediatePaths.success ? '成功' : '失败')
    console.log('📊 路径数量:', intermediatePaths.data?.items?.length || 0)

    // 测试 4: 获取学习路径详情
    console.log('\n📋 测试 4: 获取前端工程师进阶路径详情')
    const pathDetail = await makeRequest('GET', '/api/learning-paths/frontend-advanced')
    console.log('✅ 状态:', pathDetail.success ? '成功' : '失败')
    console.log('📊 路径名称:', pathDetail.data?.name)
    console.log('📊 模块数量:', pathDetail.data?.modules?.length || 0)
    console.log('📊 用户进度:', pathDetail.data?.userProgress ? '已报名' : '未报名')
    if (pathDetail.data?.modules) {
      console.log('\n模块列表:')
      pathDetail.data.modules.forEach(module => {
        console.log(`   ${module.order}. ${module.name} - ${module.estimatedHours}h, ${module.questionIds.length}题`)
      })
    }

    // 测试 5: 报名学习路径
    console.log('\n📋 测试 5: 报名学习路径')
    const enrollResp = await makeRequest('POST', '/api/learning-paths/2/enroll')
    if (enrollResp.success) {
      console.log('✅ 报名成功')
      console.log('📊 报名时间:', enrollResp.data?.enrolledAt)
      console.log('📊 当前进度:', (enrollResp.data?.progress * 100).toFixed(0) + '%')
    } else {
      console.log('⚠️  报名失败:', enrollResp.message)
    }

    // 测试 6: 完成模块
    console.log('\n📋 测试 6: 完成学习模块')
    const completeResp = await makeRequest('PUT', '/api/learning-paths/1/modules/1/complete')
    if (completeResp.success) {
      console.log('✅ 模块完成')
      console.log('📊 已完成模块:', completeResp.data?.completedModules)
      console.log('📊 整体进度:', (completeResp.data?.progress * 100).toFixed(0) + '%')
      console.log('📊 学习状态:', completeResp.data?.status)
    } else {
      console.log('⚠️  完成失败:', completeResp.message)
    }

    // 测试 7: 再次获取详情查看进度
    console.log('\n📋 测试 7: 查看更新后的进度')
    const updatedDetail = await makeRequest('GET', '/api/learning-paths/1')
    console.log('✅ 状态:', updatedDetail.success ? '成功' : '失败')
    if (updatedDetail.data?.userProgress) {
      const progress = updatedDetail.data.userProgress
      console.log('📊 学习进度:', (progress.progress * 100).toFixed(0) + '%')
      console.log('📊 已完成模块:', progress.completedModules.length + '/' + updatedDetail.data.modules.length)
      console.log('📊 当前模块ID:', progress.currentModuleId)
      console.log('📊 总分:', progress.totalScore)
    }

    // 测试 8: 证书信息
    console.log('\n📋 测试 8: 证书信息')
    const pathWithCert = pathsResp.data?.items[0]
    if (pathWithCert?.certificate?.enabled) {
      console.log('✅ 该路径支持证书')
      console.log('📜 证书名称:', pathWithCert.certificate.name)
      console.log('📊 及格分数:', pathWithCert.certificate.passingScore)
    }

    // 测试 9: 统计数据
    console.log('\n📋 测试 9: 学习路径统计')
    if (pathDetail.data?.stats) {
      const stats = pathDetail.data.stats
      console.log('📊 报名人数:', stats.enrolledCount)
      console.log('📊 完成人数:', stats.completedCount)
      console.log('📊 平均分数:', stats.averageScore)
      console.log('📊 完成率:', ((stats.completedCount / stats.enrolledCount) * 100).toFixed(1) + '%')
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 所有测试完成!\n')

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    process.exit(1)
  }
}

// 运行测试
setTimeout(() => {
  testLearningPaths().then(() => {
    console.log('✅ 测试脚本执行完毕')
    process.exit(0)
  }).catch(err => {
    console.error('❌ 测试异常:', err)
    process.exit(1)
  })
}, 2000) // 等待服务器启动
