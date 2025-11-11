const http = require('http');

// 配置
const API_HOST = '127.0.0.1';
const API_PORT = 3001;
const NUM_USERS = 10;

// 生成测试用户数据
function generateTestUsers(count) {
  const users = [];
  const basePassword = 'TestUser123';
  const userCodes = [
    { phone: '13800138001', code: '725822' },
    { phone: '13800138002', code: '404270' },
    { phone: '13800138003', code: '687412' },
    { phone: '13800138004', code: '162912' },
    { phone: '13800138005', code: '188512' },
    { phone: '13800138006', code: '932574' },
    { phone: '13800138007', code: '209553' },
    { phone: '13800138008', code: '241731' },
    { phone: '13800138009', code: '339681' },
    { phone: '13800138010', code: '606151' }
  ];

  for (let i = 1; i <= count; i++) {
    const userCode = userCodes[i - 1];
    users.push({
      username: `testuser${String(i).padStart(2, '0')}`,
      phone: userCode.phone,
      code: userCode.code,
      password: basePassword,
      real_name: `测试用户${i}`
    });
  }

  return users;
}

// 发送注册请求
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(userData);

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: response,
            userData: userData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            userData: userData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(jsonData);
    req.end();
  });
}

// 主程序
async function main() {
  console.log('========================================');
  console.log('开始批量注册测试账号');
  console.log('========================================');
  console.log(`目标服务器: http://${API_HOST}:${API_PORT}`);
  console.log(`要创建的账号数量: ${NUM_USERS}\n`);

  const testUsers = generateTestUsers(NUM_USERS);
  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`[${i + 1}/${NUM_USERS}] 正在注册: ${user.username}...`);

    try {
      const result = await registerUser(user);

      if (result.status === 200 || result.status === 201) {
        results.success.push({
          username: user.username,
          password: user.password,
          phone: user.phone,
          token: result.data.token || result.data.data?.token || '获取成功'
        });
        console.log(`  ✓ 注册成功\n`);
      } else if (result.status === 409) {
        console.log(`  ⚠ 账号已存在 (${result.data.message || '重复'})\n`);
      } else {
        console.log(`  ✗ 注册失败: ${result.status} - ${JSON.stringify(result.data)}\n`);
        results.failed.push({
          username: user.username,
          error: result.data.message || `HTTP ${result.status}`
        });
      }
    } catch (error) {
      console.log(`  ✗ 网络错误: ${error.message}\n`);
      results.failed.push({
        username: user.username,
        error: error.message
      });
    }

    // 延迟以避免过快请求
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // 输出结果汇总
  console.log('\n========================================');
  console.log('注册结果汇总');
  console.log('========================================\n');
  console.log(`成功: ${results.success.length} 个`);
  console.log(`失败: ${results.failed.length} 个\n`);

  if (results.success.length > 0) {
    console.log('成功注册的账号列表:');
    console.log('----------------------------------------');
    results.success.forEach(user => {
      console.log(`用户名: ${user.username}`);
      console.log(`密码: ${user.password}`);
      console.log(`手机号: ${user.phone}`);
      console.log('---');
    });
  }

  if (results.failed.length > 0) {
    console.log('\n失败的注册:');
    console.log('----------------------------------------');
    results.failed.forEach(user => {
      console.log(`${user.username}: ${user.error}`);
    });
  }

  console.log('\n========================================');
  console.log('批量注册完成!');
  console.log('========================================');
}

main().catch(console.error);
