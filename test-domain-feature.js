/**
 * 多专业题库功能测试脚本
 */

const http = require('http')

const BASE_URL = 'http://localhost:3001'

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (err) {
          resolve(data)
        }
      })
    }).on('error', reject)
  })
}

async function testDomainFeatures() {
  console.log('\n🧪 开始测试多专业题库功能\n')
  console.log('=' .repeat(60))

  try {
    // 测试 1: 获取所有领域
    console.log('\n📋 测试 1: 获取所有领域')
    const domainsResp = await makeRequest('/api/domains')
    console.log('✅ 状态:', domainsResp.success ? '成功' : '失败')
    console.log('📊 领域数量:', domainsResp.data?.items?.length || 0)
    if (domainsResp.data?.items) {
      domainsResp.data.items.forEach(domain => {
        console.log(`   ${domain.icon} ${domain.name} - ${domain.questionCount} 道题目`)
      })
    }

    // 测试 2: 获取特定领域详情
    console.log('\n📋 测试 2: 获取计算机科学领域详情')
    const domainDetail = await makeRequest('/api/domains/computer-science')
    console.log('✅ 状态:', domainDetail.success ? '成功' : '失败')
    console.log('📊 领域名称:', domainDetail.data?.name)
    console.log('📊 分类数量:', domainDetail.data?.categoryCount)
    console.log('📊 题目数量:', domainDetail.data?.questionCount)

    // 测试 3: 获取领域字段配置
    console.log('\n📋 测试 3: 获取计算机科学领域字段配置')
    const fieldConfig = await makeRequest('/api/domains/1/field-config')
    console.log('✅ 状态:', fieldConfig.success ? '成功' : '失败')
    console.log('📊 字段数量:', fieldConfig.data?.fields?.length || 0)
    if (fieldConfig.data?.fields) {
      fieldConfig.data.fields.forEach(field => {
        console.log(`   - ${field.label} (${field.type})`)
      })
    }

    // 测试 4: 按领域筛选题目 (计算机科学)
    console.log('\n📋 测试 4: 按领域筛选题目 (计算机科学)')
    const csQuestions = await makeRequest('/api/questions?domain_id=1')
    console.log('✅ 状态:', csQuestions.success ? '成功' : '失败')
    console.log('📊 题目数量:', csQuestions.data?.items?.length || 0)
    console.log('📊 总数:', csQuestions.data?.total || 0)

    // 测试 5: 按领域筛选题目 (金融学)
    console.log('\n📋 测试 5: 按领域筛选题目 (金融学)')
    const financeQuestions = await makeRequest('/api/questions?domain_id=2')
    console.log('✅ 状态:', financeQuestions.success ? '成功' : '失败')
    console.log('📊 题目数量:', financeQuestions.data?.items?.length || 0)
    if (financeQuestions.data?.items?.length > 0) {
      console.log('📝 示例题目:', financeQuestions.data.items[0].title)
    }

    // 测试 6: 按领域筛选分类
    console.log('\n📋 测试 6: 按领域筛选分类 (计算机科学)')
    const csCategories = await makeRequest('/api/questions/categories?domain_id=1')
    console.log('✅ 状态:', csCategories.success ? '成功' : '失败')
    console.log('📊 分类数量:', csCategories.data?.tree?.length || 0)

    // 测试 7: metadata 筛选 (编程语言)
    console.log('\n📋 测试 7: Metadata 筛选 (JavaScript)')
    const jsQuestions = await makeRequest('/api/questions?metadata.languageRestrictions=JavaScript')
    console.log('✅ 状态:', jsQuestions.success ? '成功' : '失败')
    console.log('📊 JavaScript 题目数量:', jsQuestions.data?.items?.length || 0)

    // 测试 8: 组合筛选 (domain + metadata)
    console.log('\n📋 测试 8: 组合筛选 (计算机科学 + JavaScript)')
    const comboQuestions = await makeRequest('/api/questions?domain_id=1&metadata.languageRestrictions=JavaScript')
    console.log('✅ 状态:', comboQuestions.success ? '成功' : '失败')
    console.log('📊 筛选后题目数量:', comboQuestions.data?.items?.length || 0)

    // 测试 9: 医学领域题目
    console.log('\n📋 测试 9: 医学领域题目')
    const medQuestions = await makeRequest('/api/questions?domain_id=3')
    console.log('✅ 状态:', medQuestions.success ? '成功' : '失败')
    console.log('📊 医学题目数量:', medQuestions.data?.items?.length || 0)
    if (medQuestions.data?.items?.length > 0) {
      const medQ = medQuestions.data.items[0]
      console.log('📝 示例题目:', medQ.title)
      console.log('🏥 metadata.diseaseTags:', medQ.metadata?.diseaseTags)
    }

    // 测试 10: 法律领域题目
    console.log('\n📋 测试 10: 法律领域题目')
    const lawQuestions = await makeRequest('/api/questions?domain_id=4')
    console.log('✅ 状态:', lawQuestions.success ? '成功' : '失败')
    console.log('📊 法律题目数量:', lawQuestions.data?.items?.length || 0)
    if (lawQuestions.data?.items?.length > 0) {
      const lawQ = lawQuestions.data.items[0]
      console.log('📝 示例题目:', lawQ.title)
      console.log('⚖️  metadata.caseStudyType:', lawQ.metadata?.caseStudyType)
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 所有测试完成!\n')

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    process.exit(1)
  }
}

// 运行测试
testDomainFeatures().then(() => {
  console.log('✅ 测试脚本执行完毕')
  process.exit(0)
}).catch(err => {
  console.error('❌ 测试异常:', err)
  process.exit(1)
})
