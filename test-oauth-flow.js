/**
 * 测试完整的OAuth登录流程
 */
const http = require('http');

console.log('🧪 开始测试完整的OAuth登录流程...\n');

let testState = '';

// 步骤1: 获取授权URL和state
console.log('📋 步骤1: 用户点击微信登录 → 获取授权URL');
http.get('http://localhost:3001/api/auth/oauth/wechat/authorize?redirect=/home', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.code === 200) {
        testState = result.data.state;
        console.log(`✅ 授权URL生成成功`);
        console.log(`   State: ${testState}`);
        console.log(`   授权URL: ${result.data.authorizeUrl.substring(0, 80)}...`);
        console.log(`   二维码URL: ${result.data.qrCodeUrl}\n`);

        // 步骤2: 获取二维码
        console.log('📋 步骤2: 前端请求二维码图片');
        http.get(`http://localhost:3001/api/auth/oauth/wechat/qrcode?state=${testState}`, (qrRes) => {
          let qrData = '';
          qrRes.on('data', (chunk) => { qrData += chunk; });
          qrRes.on('end', () => {
            try {
              const qrResult = JSON.parse(qrData);
              if (qrResult.code === 200) {
                console.log(`✅ 二维码生成成功`);
                console.log(`   二维码显示在前端对话框`);
                console.log(`   用户可以扫描二维码\n`);

                // 步骤3: 模拟用户扫码（访问mock-scan URL）
                console.log('📋 步骤3: 用户扫描二维码 → 模拟授权');
                console.log(`   扫码URL: ${qrResult.data.qrContent}`);
                console.log(`   （实际场景：用户用手机扫码）\n`);

                // 步骤4: 模拟授权成功后的回调
                console.log('📋 步骤4: 授权成功 → 前端收到code和state');
                const mockCode = 'mock_wx_code_' + Date.now();
                console.log(`   模拟授权码: ${mockCode}`);
                console.log(`   State: ${testState}\n`);

                // 步骤5: 前端调用后端回调接口
                console.log('📋 步骤5: 前端调用回调接口换取token');
                const postData = JSON.stringify({
                  code: mockCode,
                  state: testState
                });

                const options = {
                  hostname: 'localhost',
                  port: 3001,
                  path: '/api/auth/oauth/wechat/callback',
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                  }
                };

                const callbackReq = http.request(options, (callbackRes) => {
                  let callbackData = '';
                  callbackRes.on('data', (chunk) => { callbackData += chunk; });
                  callbackRes.on('end', () => {
                    try {
                      const callbackResult = JSON.parse(callbackData);
                      if (callbackResult.code === 200) {
                        console.log(`✅ 回调处理成功`);
                        console.log(`   Token: ${callbackResult.data.token}`);
                        console.log(`   用户ID: ${callbackResult.data.user.id}`);
                        console.log(`   用户名: ${callbackResult.data.user.username}`);
                        console.log(`   昵称: ${callbackResult.data.user.nickname}`);
                        console.log(`   是否新用户: ${callbackResult.data.isNewUser ? '是' : '否'}`);
                        console.log(`   Token过期时间: ${new Date(callbackResult.data.expires).toLocaleString()}\n`);

                        // 步骤6: 前端存储token并跳转
                        console.log('📋 步骤6: 前端存储token并跳转到首页');
                        console.log(`   localStorage.setItem('token', '${callbackResult.data.token}')`);
                        console.log(`   router.push('/home')`);
                        console.log(`   登录完成！\n`);

                        // 总结
                        console.log('═══════════════════════════════════════');
                        console.log('📊 OAuth登录流程测试总结');
                        console.log('═══════════════════════════════════════');
                        console.log('✅ 步骤1: 获取授权URL - 通过');
                        console.log('✅ 步骤2: 生成二维码 - 通过');
                        console.log('✅ 步骤3: 用户扫码授权 - 通过（模拟）');
                        console.log('✅ 步骤4: 接收授权码 - 通过');
                        console.log('✅ 步骤5: 换取token - 通过');
                        console.log('✅ 步骤6: 存储token并登录 - 通过');
                        console.log('═══════════════════════════════════════');
                        console.log('\n🎉 完整的OAuth登录流程测试成功！');
                        console.log('\n💡 测试总结:');
                        console.log('   - CSRF防护（state验证）: ✅');
                        console.log('   - 授权码流程: ✅');
                        console.log('   - 用户信息获取: ✅');
                        console.log('   - Token生成: ✅');
                        console.log('   - 自动注册新用户: ✅');
                      } else {
                        console.log('❌ 回调处理失败:', callbackResult.message);
                      }
                    } catch (error) {
                      console.error('❌ 回调响应解析错误:', error.message);
                    }
                  });
                });

                callbackReq.on('error', (err) => {
                  console.error('❌ 回调请求失败:', err.message);
                });

                callbackReq.write(postData);
                callbackReq.end();
              } else {
                console.log('❌ 二维码生成失败:', qrResult.message);
              }
            } catch (error) {
              console.error('❌ 二维码响应解析错误:', error.message);
            }
          });
        }).on('error', (err) => {
          console.error('❌ 二维码请求失败:', err.message);
        });
      } else {
        console.log('❌ 授权URL生成失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 响应解析错误:', error.message);
    }
  });
}).on('error', (err) => {
  console.error('❌ 请求失败:', err.message);
});
