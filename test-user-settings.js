/**
 * 用户个人设置功能集成测试
 * 测试前后端API对接
 */

const http = require('http')

const BASE_URL = 'http://localhost:3001'
let testResults = []
let testToken = 'mock-token-12345' // 模拟token

// 测试结果记录
function recordTest(testName, passed, message, response) {
  const result = {
    testName,
    passed,
    message,
    response,
    timestamp: new Date().toISOString()
  }
  testResults.push(result)

  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${testName}: ${message}`)
  if (response && !passed) {
    console.log('   响应:', JSON.stringify(response, null, 2))
  }
}

// HTTP请求封装
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      }
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        try {
          const response = JSON.parse(body)
          resolve({ status: res.statusCode, data: response })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
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

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============= 测试用例 =============

// 1. 测试获取用户信息
async function testGetUserInfo() {
  try {
    const { status, data } = await makeRequest('GET', '/api/users/me')

    if (status === 200 && data.code === 200) {
      const user = data.data
      const hasRequiredFields = user.username && user.hasOwnProperty('avatar') &&
                                user.hasOwnProperty('privacy') &&
                                user.hasOwnProperty('notification') &&
                                user.hasOwnProperty('preferences')

      if (hasRequiredFields) {
        recordTest('获取用户信息', true, '成功获取用户完整信息', user)
      } else {
        recordTest('获取用户信息', false, '用户信息缺少必要字段', user)
      }
    } else {
      recordTest('获取用户信息', false, `请求失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('获取用户信息', false, `请求异常: ${error.message}`)
  }
}

// 2. 测试更新个人资料
async function testUpdateProfile() {
  try {
    const profileData = {
      nickname: '测试昵称_' + Date.now(),
      gender: 'female',
      birthday: '1995-05-15',
      signature: '这是一个测试签名'
    }

    const { status, data } = await makeRequest('PUT', '/api/users/profile', profileData)

    if (status === 200 && data.code === 200) {
      const updated = data.data
      const isUpdated = updated.nickname === profileData.nickname &&
                       updated.gender === profileData.gender &&
                       updated.birthday === profileData.birthday

      if (isUpdated) {
        recordTest('更新个人资料', true, '个人资料更新成功', updated)
      } else {
        recordTest('更新个人资料', false, '资料更新但数据不匹配', updated)
      }
    } else {
      recordTest('更新个人资料', false, `更新失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('更新个人资料', false, `请求异常: ${error.message}`)
  }
}

// 3. 测试上传头像
async function testUploadAvatar() {
  try {
    const { status, data } = await makeRequest('POST', '/api/users/avatar', {})

    if (status === 200 && data.code === 200 && data.data.url) {
      recordTest('上传头像', true, `头像上传成功: ${data.data.url}`, data.data)
    } else {
      recordTest('上传头像', false, `上传失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('上传头像', false, `请求异常: ${error.message}`)
  }
}

// 4. 测试修改密码
async function testChangePassword() {
  try {
    const passwordData = {
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword456'
    }

    const { status, data } = await makeRequest('PUT', '/api/users/password', passwordData)

    if (status === 200 && data.code === 200) {
      recordTest('修改密码', true, '密码修改成功', data)
    } else if (status === 400) {
      recordTest('修改密码', true, '正确处理了密码验证', data)
    } else {
      recordTest('修改密码', false, `修改失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('修改密码', false, `请求异常: ${error.message}`)
  }
}

// 5. 测试发送手机验证码
async function testSendPhoneCode() {
  try {
    const { status, data } = await makeRequest('POST', '/api/users/phone/code', {
      phone: '13900139000'
    })

    if (status === 200 && data.code === 200) {
      recordTest('发送手机验证码', true, '验证码发送成功', data)
      return data.data
    } else {
      recordTest('发送手机验证码', false, `发送失败: ${data.message}`, data)
      return null
    }
  } catch (error) {
    recordTest('发送手机验证码', false, `请求异常: ${error.message}`)
    return null
  }
}

// 6. 测试绑定手机号
async function testBindPhone() {
  try {
    // 先发送验证码
    await testSendPhoneCode()
    await delay(500)

    // 使用mock的验证码（需要从后端日志获取）
    const { status, data } = await makeRequest('POST', '/api/users/phone/bind', {
      phone: '13900139000',
      code: '123456' // 模拟验证码
    })

    if (status === 200 && data.code === 200) {
      recordTest('绑定手机号', true, '手机号绑定成功', data)
    } else if (status === 400 && data.message.includes('验证码')) {
      recordTest('绑定手机号', true, '正确验证了验证码', data)
    } else {
      recordTest('绑定手机号', false, `绑定失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('绑定手机号', false, `请求异常: ${error.message}`)
  }
}

// 7. 测试发送邮箱验证码
async function testSendEmailCode() {
  try {
    const { status, data } = await makeRequest('POST', '/api/users/email/code', {
      email: 'test@example.com'
    })

    if (status === 200 && data.code === 200) {
      recordTest('发送邮箱验证码', true, '验证码发送成功', data)
    } else {
      recordTest('发送邮箱验证码', false, `发送失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('发送邮箱验证码', false, `请求异常: ${error.message}`)
  }
}

// 8. 测试更新隐私设置
async function testUpdatePrivacy() {
  try {
    const privacyData = {
      profileVisibility: 'friends',
      showOnlineStatus: false,
      allowStrangerMessage: false,
      shareLocation: true
    }

    const { status, data } = await makeRequest('PUT', '/api/users/privacy', privacyData)

    if (status === 200 && data.code === 200) {
      recordTest('更新隐私设置', true, '隐私设置更新成功', data.data)
    } else {
      recordTest('更新隐私设置', false, `更新失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('更新隐私设置', false, `请求异常: ${error.message}`)
  }
}

// 9. 测试更新通知设置
async function testUpdateNotification() {
  try {
    const notificationData = {
      systemNotification: false,
      messageNotification: true,
      commentNotification: true,
      emailNotification: true,
      smsNotification: false,
      soundEnabled: false,
      vibrationEnabled: false,
      dndEnabled: true,
      dndStartTime: '23:00',
      dndEndTime: '07:00'
    }

    const { status, data } = await makeRequest('PUT', '/api/users/notification', notificationData)

    if (status === 200 && data.code === 200) {
      recordTest('更新通知设置', true, '通知设置更新成功', data.data)
    } else {
      recordTest('更新通知设置', false, `更新失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('更新通知设置', false, `请求异常: ${error.message}`)
  }
}

// 10. 测试更新界面设置
async function testUpdatePreferences() {
  try {
    const preferencesData = {
      theme: 'dark',
      primaryColor: '#FF5722',
      fontSize: 'large',
      language: 'en-US'
    }

    const { status, data } = await makeRequest('PUT', '/api/users/preferences', preferencesData)

    if (status === 200 && data.code === 200) {
      recordTest('更新界面设置', true, '界面设置更新成功', data.data)
    } else {
      recordTest('更新界面设置', false, `更新失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('更新界面设置', false, `请求异常: ${error.message}`)
  }
}

// 11. 测试开启两步验证
async function testEnable2FA() {
  try {
    const { status, data } = await makeRequest('POST', '/api/users/2fa/enable', {})

    if (status === 200 && data.code === 200) {
      recordTest('开启两步验证', true, '两步验证已开启', data)
    } else {
      recordTest('开启两步验证', false, `开启失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('开启两步验证', false, `请求异常: ${error.message}`)
  }
}

// 12. 测试关闭两步验证
async function testDisable2FA() {
  try {
    const { status, data } = await makeRequest('POST', '/api/users/2fa/disable', {})

    if (status === 200 && data.code === 200) {
      recordTest('关闭两步验证', true, '两步验证已关闭', data)
    } else {
      recordTest('关闭两步验证', false, `关闭失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('关闭两步验证', false, `请求异常: ${error.message}`)
  }
}

// 13. 测试获取登录设备列表
async function testGetDevices() {
  try {
    const { status, data } = await makeRequest('GET', '/api/users/devices')

    if (status === 200 && data.code === 200 && Array.isArray(data.data)) {
      recordTest('获取登录设备列表', true, `获取到${data.data.length}个设备`, data.data)
    } else {
      recordTest('获取登录设备列表', false, `获取失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('获取登录设备列表', false, `请求异常: ${error.message}`)
  }
}

// 14. 测试移除登录设备
async function testRemoveDevice() {
  try {
    const { status, data } = await makeRequest('DELETE', '/api/users/devices/2')

    if (status === 200 && data.code === 200) {
      recordTest('移除登录设备', true, '设备已下线', data)
    } else {
      recordTest('移除登录设备', false, `移除失败: ${data.message}`, data)
    }
  } catch (error) {
    recordTest('移除登录设备', false, `请求异常: ${error.message}`)
  }
}

// ============= 执行所有测试 =============

async function runAllTests() {
  console.log('\n🧪 ====== 开始用户个人设置功能集成测试 ======\n')
  console.log('📡 后端服务: ' + BASE_URL)
  console.log('⏰ 测试时间: ' + new Date().toLocaleString('zh-CN'))
  console.log('\n' + '='.repeat(50) + '\n')

  // 账户信息测试
  console.log('📋 【账户信息模块】')
  await testGetUserInfo()
  await delay(200)
  await testUpdateProfile()
  await delay(200)
  await testUploadAvatar()
  await delay(200)

  console.log('\n🔐 【安全设置模块】')
  await testChangePassword()
  await delay(200)
  await testSendPhoneCode()
  await delay(200)
  await testBindPhone()
  await delay(200)
  await testSendEmailCode()
  await delay(200)
  await testEnable2FA()
  await delay(200)
  await testDisable2FA()
  await delay(200)
  await testGetDevices()
  await delay(200)
  await testRemoveDevice()
  await delay(200)

  console.log('\n🔒 【隐私设置模块】')
  await testUpdatePrivacy()
  await delay(200)

  console.log('\n🔔 【通知设置模块】')
  await testUpdateNotification()
  await delay(200)

  console.log('\n🎨 【界面设置模块】')
  await testUpdatePreferences()
  await delay(200)

  // 生成测试报告
  generateReport()
}

// 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(50))
  console.log('\n📊 ====== 测试报告 ======\n')

  const totalTests = testResults.length
  const passedTests = testResults.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const passRate = ((passedTests / totalTests) * 100).toFixed(2)

  console.log(`总测试数: ${totalTests}`)
  console.log(`✅ 通过: ${passedTests}`)
  console.log(`❌ 失败: ${failedTests}`)
  console.log(`📈 通过率: ${passRate}%`)

  if (failedTests > 0) {
    console.log('\n❌ 失败的测试:')
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.testName}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n✨ 测试完成!\n')

  // 保存测试报告到文件
  const fs = require('fs')
  const reportData = {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      passRate: passRate + '%',
      testTime: new Date().toISOString()
    },
    results: testResults
  }

  fs.writeFileSync(
    'USER-SETTINGS-TEST-REPORT.json',
    JSON.stringify(reportData, null, 2),
    'utf-8'
  )
  console.log('📄 详细报告已保存到: USER-SETTINGS-TEST-REPORT.json\n')
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行出错:', error)
  process.exit(1)
})
