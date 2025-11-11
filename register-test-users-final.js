const http = require('http');

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

// 发送短信验证码
async function sendSmsCode(phone) {
  const result = await makeRequest('/api/auth/sms/send', 'POST', { phone });
  if (result.status === 200 && result.data.data?.devCode) {
    return result.data.data.devCode;
  }
  return null;
}

// 获取滑块验证码
async function getCaptcha() {
  const result = await makeRequest('/api/captcha/get', 'GET', null);
  if (result.status === 200) {
    return result.data.data;
  }
  return null;
}

// 验证滑块（尝试正确的x坐标）
async function verifySlider(token) {
  // 在开发环境，x 的范围是 40-300，我们尝试常见的中间值
  const possibleXValues = [150, 100, 120, 140, 160, 180, 200, 250, 280, 300];

  for (const x of possibleXValues) {
    const result = await makeRequest('/api/captcha/check', 'POST', {
      token: token,
      x: x
    });

    if (result.status === 200 && result.data.data?.verifyToken) {
      console.log(`  ✓ 滑块验证成功 (x=${x})`);
      return result.data.data.verifyToken;
    }
  }

  return null;
}

// 注册用户
async function registerUser(userData, verifyToken) {
  const registerData = {
    username: userData.username,
    phone: userData.phone,
    code: userData.code,
    password: userData.password,
    real_name: userData.real_name,
    captchaToken: verifyToken
  };

  const result = await makeRequest('/api/auth/register', 'POST', registerData);
  return result;
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
      // 第零步：获取短信验证码（使用已发送的验证码或重新发送）
      console.log(`  - 准备短信验证码...`);
      let smsCode = user.code; // 使用预设的验证码
      // 如果需要，可以尝试重新发送
      const smsResult = await makeRequest('/api/auth/sms/send', 'POST', { phone: user.phone });
      if (smsResult.status === 200 && smsResult.data.data?.devCode) {
        smsCode = smsResult.data.data.devCode;
      }
      // 使用预设的验证码继续
      console.log(`  - 短信验证码就绪 (code=${smsCode})`);

      // 第一步：获取滑块验证码
      console.log(`  - 获取滑块验证码...`);
      const captcha = await getCaptcha();
      if (!captcha) {
        throw new Error('无法获取验证码');
      }

      // 第二步：验证滑块验证码
      console.log(`  - 验证滑块...`);
      const verifyToken = await verifySlider(captcha.token);
      if (!verifyToken) {
        throw new Error('滑块验证失败');
      }

      // 第三步：注册用户
      console.log(`  - 提交注册...`);
      const registerData = {
        username: user.username,
        phone: user.phone,
        code: smsCode,  // 使用正确的验证码
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

    await new Promise(resolve => setTimeout(resolve, 500));
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
