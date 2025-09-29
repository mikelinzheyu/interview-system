// 检查前后端服务状态
const http = require('http');

async function checkService(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${name}: 正常 (状态码: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ ${name}: 错误 - ${error.message}`);
      resolve(false);
    });

    req.setTimeout(3000, () => {
      console.log(`❌ ${name}: 超时`);
      req.destroy();
      resolve(false);
    });
  });
}

async function testProfileAPI() {
  console.log('\n=== 测试个人信息 API ===');

  const apiTests = [
    { url: 'http://localhost:3001/api/users/profile', name: '获取个人资料' },
    { url: 'http://localhost:3001/api/users/preferences', name: '获取用户偏好' },
    { url: 'http://localhost:3001/api/users/activities', name: '获取活动记录' },
    { url: 'http://localhost:3001/api/health', name: '健康检查' }
  ];

  const results = [];
  for (const test of apiTests) {
    const result = await checkService(test.url, test.name);
    results.push(result);
  }

  return results.every(r => r);
}

async function main() {
  console.log('=== 前后端服务状态检查 ===');

  // 检查前端服务
  console.log('\n--- 前端服务 ---');
  const frontendOk = await checkService('http://localhost:5174/', '前端开发服务器');

  // 检查后端服务
  console.log('\n--- 后端服务 ---');
  const backendOk = await checkService('http://localhost:3001/api/health', '后端 Mock 服务器');

  // 检查个人信息相关 API
  const profileAPIok = await testProfileAPI();

  console.log('\n=== 总结 ===');
  console.log(`前端服务: ${frontendOk ? '✅ 正常' : '❌ 异常'}`);
  console.log(`后端服务: ${backendOk ? '✅ 正常' : '❌ 异常'}`);
  console.log(`个人信息API: ${profileAPIok ? '✅ 正常' : '❌ 异常'}`);

  if (frontendOk && backendOk && profileAPIok) {
    console.log('\n🎉 所有服务都运行正常！个人信息功能已就绪。');
    console.log('📖 访问: http://localhost:5174 然后导航到个人信息页面');
  } else {
    console.log('\n⚠️  某些服务存在问题，请检查上述错误信息');
  }
}

main().catch(console.error);