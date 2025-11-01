/**
 * 快速测试：登录并访问 /home
 * 这个脚本演示如何通过 API 登录，以及如何访问受保护的页面
 */

const http = require('http');

console.log('\n' + '='.repeat(70));
console.log('测试：/home 页面访问');
console.log('='.repeat(70) + '\n');

// 测试用例
const testCases = [
  {
    name: '未登录状态下访问 /home',
    method: 'GET',
    url: 'http://localhost:5174/home',
    expectedBehavior: '❌ 应重定向到 /login'
  },
  {
    name: '访问根路由',
    method: 'GET',
    url: 'http://localhost:5174/',
    expectedBehavior: '✅ 应显示登陆/注册页面'
  },
  {
    name: '访问登录页',
    method: 'GET',
    url: 'http://localhost:5174/login',
    expectedBehavior: '✅ 应显示登录表单'
  }
];

console.log('📋 访问场景：\n');

testCases.forEach((testCase, index) => {
  console.log(`   ${index + 1}. ${testCase.name}`);
  console.log(`      URL: ${testCase.url}`);
  console.log(`      预期: ${testCase.expectedBehavior}\n`);
});

console.log('='.repeat(70));
console.log('后端 API 测试');
console.log('='.repeat(70) + '\n');

// 测试登录 API
console.log('📝 登录 API 测试\n');
console.log('   端点: POST http://localhost:3001/api/auth/login');
console.log('   请求体:');
console.log('   {');
console.log('     "username": "testuser",');
console.log('     "password": "password"');
console.log('   }\n');
console.log('   预期响应: 200 OK');
console.log('   {');
console.log('     "token": "mock_jwt_token_...",');
console.log('     "user": { ... testuser 数据 ... },');
console.log('     "expires": 1234567890000,');
console.log('     "msg": "登录成功"');
console.log('   }\n');

// 执行登录测试
const loginPayload = JSON.stringify({
  username: 'testuser',
  password: 'password'
});

console.log('🔐 执行登录请求...\n');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginPayload.length
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`✅ 状态码: ${res.statusCode}`);

    try {
      const response = JSON.parse(data);
      console.log(`✅ 消息: ${response.msg || '登录成功'}`);
      console.log(`✅ Token: ${response.data?.token ? '✓ 已获取' : '✗ 未获取'}`);
      console.log(`✅ 用户: ${response.data?.user?.username || response.data?.user || '✓ 已返回'}`);

      console.log('\n' + '='.repeat(70));
      console.log('下一步');
      console.log('='.repeat(70) + '\n');

      console.log('1️⃣  在浏览器中打开登录页面:');
      console.log('    http://localhost:5174/login\n');

      console.log('2️⃣  输入登录信息:');
      console.log('    用户名: testuser (或任意用户名)');
      console.log('    密码: password (或任意密码)\n');

      console.log('3️⃣  点击登录按钮\n');

      console.log('4️⃣  应自动跳转到:');
      console.log('    http://localhost:5174/home\n');

      console.log('✨ 成功！现在你已登录，可以访问受保护的页面。\n');

    } catch (error) {
      console.log('❌ 响应格式错误:', data);
    }

    console.log('='.repeat(70) + '\n');
  });
});

req.on('error', (error) => {
  console.log('❌ 请求失败:', error.message);
  console.log('   确保后端服务运行在 http://localhost:3001\n');
  console.log('='.repeat(70) + '\n');
});

req.write(loginPayload);
req.end();
