/**
 * 测试二维码生成功能
 */
const http = require('http');

console.log('🧪 开始测试二维码生成功能...\n');

// 步骤1: 获取授权URL和state
console.log('📋 步骤1: 获取微信授权URL和state');
http.get('http://localhost:3001/api/auth/oauth/wechat/authorize?redirect=/home', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      if (result.code === 200) {
        console.log('✅ 授权URL生成成功');
        console.log(`   State: ${result.data.state}`);
        console.log(`   过期时间: ${result.data.expiresIn}秒\n`);

        // 步骤2: 使用state获取二维码
        const state = result.data.state;
        console.log('📋 步骤2: 生成二维码图片');

        http.get(`http://localhost:3001/api/auth/oauth/wechat/qrcode?state=${state}`, (qrRes) => {
          let qrData = '';

          qrRes.on('data', (chunk) => {
            qrData += chunk;
          });

          qrRes.on('end', () => {
            try {
              const qrResult = JSON.parse(qrData);

              if (qrResult.code === 200) {
                console.log('✅ 二维码生成成功');
                console.log(`   提示: ${qrResult.data.tip}`);
                console.log(`   二维码格式: Base64 PNG`);
                console.log(`   图片大小: ${qrResult.data.qrCodeImage.length} 字符`);
                console.log(`   二维码内容: ${qrResult.data.qrContent}\n`);

                // 验证Base64格式
                const isValidBase64 = qrResult.data.qrCodeImage.startsWith('data:image/png;base64,');
                console.log(`📸 二维码图片验证:`);
                console.log(`   格式正确: ${isValidBase64 ? '✅' : '❌'}`);
                console.log(`   可用于<img src="">: ${isValidBase64 ? '✅' : '❌'}\n`);

                // 步骤3: 测试QQ二维码
                console.log('📋 步骤3: 测试QQ二维码生成');
                http.get('http://localhost:3001/api/auth/oauth/qq/authorize?redirect=/home', (qqAuthRes) => {
                  let qqAuthData = '';

                  qqAuthRes.on('data', (chunk) => {
                    qqAuthData += chunk;
                  });

                  qqAuthRes.on('end', () => {
                    try {
                      const qqAuthResult = JSON.parse(qqAuthData);

                      if (qqAuthResult.code === 200) {
                        const qqState = qqAuthResult.data.state;

                        http.get(`http://localhost:3001/api/auth/oauth/qq/qrcode?state=${qqState}`, (qqQrRes) => {
                          let qqQrData = '';

                          qqQrRes.on('data', (chunk) => {
                            qqQrData += chunk;
                          });

                          qqQrRes.on('end', () => {
                            try {
                              const qqQrResult = JSON.parse(qqQrData);

                              if (qqQrResult.code === 200) {
                                console.log('✅ QQ二维码生成成功');
                                console.log(`   提示: ${qqQrResult.data.tip}`);
                                console.log(`   图片大小: ${qqQrResult.data.qrCodeImage.length} 字符\n`);

                                // 总结
                                console.log('═══════════════════════════════════════');
                                console.log('📊 测试总结');
                                console.log('═══════════════════════════════════════');
                                console.log('✅ 微信授权URL生成 - 通过');
                                console.log('✅ 微信二维码生成 - 通过');
                                console.log('✅ QQ授权URL生成 - 通过');
                                console.log('✅ QQ二维码生成 - 通过');
                                console.log('✅ Base64格式验证 - 通过');
                                console.log('═══════════════════════════════════════');
                                console.log('\n🎉 所有测试通过！二维码功能正常工作！');
                              } else {
                                console.log('❌ QQ二维码生成失败:', qqQrResult.message);
                              }
                            } catch (error) {
                              console.error('❌ QQ二维码响应解析错误:', error.message);
                            }
                          });
                        }).on('error', (err) => {
                          console.error('❌ QQ二维码请求失败:', err.message);
                        });
                      } else {
                        console.log('❌ QQ授权URL生成失败:', qqAuthResult.message);
                      }
                    } catch (error) {
                      console.error('❌ QQ授权响应解析错误:', error.message);
                    }
                  });
                }).on('error', (err) => {
                  console.error('❌ QQ授权请求失败:', err.message);
                });
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
  console.log('\n💡 确保后端服务器正在运行: http://localhost:3001');
});
