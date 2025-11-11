const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 3001;
const NUM_USERS = 10;

// 生成测试用户数据
function generateTestUsers(count) {
  const users = [];
  const basePassword = 'TestUser123';
  const userCodes = [
    { phone: '13800138001' },
    { phone: '13800138002' },
    { phone: '13800138003' },
    { phone: '13800138004' },
    { phone: '13800138005' },
    { phone: '13800138006' },
    { phone: '13800138007' },
    { phone: '13800138008' },
    { phone: '13800138009' },
    { phone: '13800138010' }
  ];

  for (let i = 1; i <= count; i++) {
    const userCode = userCodes[i - 1];
    users.push({
      username: `testuser${String(i).padStart(2, '0')}`,
      phone: userCode.phone,
      password: basePassword,
      real_name: `测试用户${i}`
    });
  }

  return users;
}

// 发送HTTP请求
function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const jsonData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': jsonData ? Buffer.byteLength(jsonData) : 0
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (jsonData) req.write(jsonData);
    req.end();
  });
}

// 获取滑块验证码
async function getCaptcha() {
  const result = await makeRequest('/api/captcha/get', 'GET', null);
  if (result.status === 200) {
    return result.data.data;
  }
  return null;
}

// 验证滑块（尝试更多的x坐标值）
async function verifySlider(token) {
  // x 的范围是 40-300，尝试更多的值以提高成功率
  const possibleXValues = [];
  for (let x = 40; x <= 300; x += 5) {
    possibleXValues.push(x);
  }

  for (const x of possibleXValues) {
    const result = await makeRequest('/api/captcha/check', 'POST', {
      token: token,
      x: x
    });

    if (result.status === 200 && result.data.data?.verifyToken) {
      return result.data.data.verifyToken;
    }
  }

  return null;
}

// 发送短信验证码
async function sendSmsCode(phone) {
  const result = await makeRequest('/api/auth/sms/send', 'POST', { phone });
  if (result.status === 200) {
    return result.data.data?.devCode;
  }
  return null;
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

  // 第一阶段：为所有手机号发送短信验证码
  console.log('第一阶段：发送短信验证码...');
  console.log('----------------------------------------');
  const smsCodes = {};
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`[${i + 1}/${NUM_USERS}] 发送验证码到 ${user.phone}...`);
    const code = await sendSmsCode(user.phone);
    if (code) {
      smsCodes[user.phone] = code;
      console.log(`  ✓ 验证码: ${code}`);
    } else {
      console.log(`  ✗ 发送失败`);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n第二阶段：注册用户账号...');
  console.log('----------------------------------------\n');

  // 第二阶段：注册用户
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const smsCode = smsCodes[user.phone];

    if (!smsCode) {
      console.log(`[${i + 1}/${NUM_USERS}] ${user.username} - ✗ 跳过 (无验证码)\n`);
      results.failed.push({
        username: user.username,
        error: '无法发送短信验证码'
      });
      continue;
    }

    console.log(`[${i + 1}/${NUM_USERS}] 正在注册: ${user.username}...`);

    try {
      // 获取滑块验证码
      console.log(`  - 获取滑块验证码...`);
      const captcha = await getCaptcha();
      if (!captcha) {
        throw new Error('无法获取验证码');
      }

      // 验证滑块验证码
      console.log(`  - 验证滑块...`);
      const verifyToken = await verifySlider(captcha.token);
      if (!verifyToken) {
        throw new Error('滑块验证失败');
      }
      console.log(`  ✓ 滑块验证成功`);

      // 注册用户
      console.log(`  - 提交注册...`);
      const registerData = {
        username: user.username,
        phone: user.phone,
        code: smsCode,
        password: user.password,
        real_name: user.real_name,
        captchaToken: verifyToken
      };
      const result = await makeRequest('/api/auth/register', 'POST', registerData);

      if (result.status === 200 || result.status === 201) {
        const userData = result.data.data || result.data;
        results.success.push({
          username: user.username,
          password: user.password,
          phone: user.phone,
          userId: userData.user?.id || '已创建'
        });
        console.log(`  ✓ 注册成功\n`);
      } else if (result.status === 409) {
        console.log(`  ⚠ 账号已存在\n`);
      } else {
        console.log(`  ✗ 注册失败: ${result.status}\n`);
        results.failed.push({
          username: user.username,
          error: result.data.message || `HTTP ${result.status}`
        });
      }
    } catch (error) {
      console.log(`  ✗ 错误: ${error.message}\n`);
      results.failed.push({
        username: user.username,
        error: error.message
      });
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // 输出结果汇总
  console.log('\n========================================');
  console.log('注册结果汇总');
  console.log('========================================\n');
  console.log(`✓ 成功: ${results.success.length} 个`);
  console.log(`✗ 失败: ${results.failed.length} 个\n`);

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
