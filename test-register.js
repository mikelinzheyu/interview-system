/**
 * 测试用户注册功能
 */
const http = require('http');

console.log('🧪 开始测试用户注册功能...\n');

const testPhone = '13800138000';
let testCode = '';

// 步骤1: 发送验证码
console.log('📋 步骤1: 发送注册验证码');
const sendCodeData = JSON.stringify({ phone: testPhone });

const sendCodeOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/sms/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(sendCodeData)
  }
};

const sendCodeReq = http.request(sendCodeOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.code === 200) {
        console.log(`✅ 验证码发送成功`);
        console.log(`   手机号: ${testPhone}`);
        console.log(`   过期时间: ${result.data.expiresIn}秒\n`);

        // 注意：在开发环境中，验证码会打印在后端控制台
        console.log('💡 提示: 请查看后端控制台获取验证码\n');
        console.log('等待5秒后继续测试（模拟用户输入验证码）...\n');

        // 模拟等待用户获取验证码
        setTimeout(() => {
          // 在真实场景中，用户需要从短信中获取验证码
          // 这里我们使用一个测试验证码（需要从后端日志中获取）
          testCode = '123456'; // 这个需要从后端日志中看到实际的验证码

          console.log('⚠️  注意: 请手动运行注册步骤，使用后端日志中的实际验证码\n');
          console.log('测试命令示例:');
          console.log(`curl -X POST http://localhost:3001/api/auth/register \\`);
          console.log(`  -H "Content-Type: application/json" \\`);
          console.log(`  -d '{"username":"testuser","phone":"${testPhone}","code":"实际验证码","real_name":"测试用户","password":"Test123456"}'`);
          console.log('\n或者访问前端页面测试: http://127.0.0.1:5174/register\n');

          // 步骤2: 尝试注册（使用示例验证码，可能失败）
          console.log('📋 步骤2: 测试注册接口（使用示例验证码）');
          const registerData = JSON.stringify({
            username: 'testuser_' + Date.now(),
            phone: testPhone,
            code: testCode,
            real_name: '测试用户',
            password: 'Test123456'
          });

          const registerOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(registerData)
            }
          };

          const registerReq = http.request(registerOptions, (regRes) => {
            let regData = '';
            regRes.on('data', (chunk) => { regData += chunk; });
            regRes.on('end', () => {
              try {
                const regResult = JSON.parse(regData);
                if (regResult.code === 200) {
                  console.log(`✅ 注册成功`);
                  console.log(`   Token: ${regResult.data.token}`);
                  console.log(`   用户ID: ${regResult.data.user.id}`);
                  console.log(`   用户名: ${regResult.data.user.username}`);
                  console.log(`   手机号: ${regResult.data.user.phone}`);
                  console.log(`   真实姓名: ${regResult.data.user.real_name}\n`);

                  // 总结
                  console.log('═══════════════════════════════════════');
                  console.log('📊 注册功能测试总结');
                  console.log('═══════════════════════════════════════');
                  console.log('✅ 发送验证码 - 通过');
                  console.log('✅ 用户注册 - 通过');
                  console.log('═══════════════════════════════════════');
                  console.log('\n🎉 注册功能测试成功！');
                } else {
                  console.log(`⚠️  注册响应: ${regResult.message}`);
                  console.log(`   (这是预期的，因为我们使用的是示例验证码)\n`);
                  console.log('请使用前端页面或后端日志中的实际验证码进行完整测试');
                }
              } catch (error) {
                console.error('❌ 注册响应解析错误:', error.message);
              }
            });
          });

          registerReq.on('error', (err) => {
            console.error('❌ 注册请求失败:', err.message);
          });

          registerReq.write(registerData);
          registerReq.end();

        }, 5000);

      } else {
        console.log('❌ 验证码发送失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 响应解析错误:', error.message);
    }
  });
});

sendCodeReq.on('error', (err) => {
  console.error('❌ 发送验证码失败:', err.message);
  console.log('\n💡 确保后端服务器正在运行: http://localhost:3001');
});

sendCodeReq.write(sendCodeData);
sendCodeReq.end();
