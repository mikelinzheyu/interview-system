const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 3001;

// 要注册的手机号
const phones = [
  '13800138001', '13800138002', '13800138003', '13800138004', '13800138005',
  '13800138006', '13800138007', '13800138008', '13800138009', '13800138010'
];

// 发送短信验证码
function sendSmsCode(phone) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify({ phone });

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/auth/sms/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonData)
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
    req.write(jsonData);
    req.end();
  });
}

// 主程序
async function main() {
  console.log('========================================');
  console.log('发送短信验证码');
  console.log('========================================\n');

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];
    console.log(`[${i + 1}/${phones.length}] 发送验证码到: ${phone}...`);

    try {
      const result = await sendSmsCode(phone);
      if (result.status === 200) {
        console.log(`  ✓ 验证码已发送`);
        if (result.data.data?.devCode) {
          console.log(`  验证码: ${result.data.data.devCode}\n`);
        } else {
          console.log(`  (开发环境: 查看console获取验证码)\n`);
        }
      } else {
        console.log(`  ✗ 失败: ${result.status} - ${JSON.stringify(result.data)}\n`);
      }
    } catch (error) {
      console.log(`  ✗ 错误: ${error.message}\n`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('========================================');
  console.log('验证码发送完成!');
  console.log('========================================');
}

main().catch(console.error);
