#!/usr/bin/env node

/**
 * 测试您项目中的存储API是否可访问和正常工作
 */

const http = require('http');
const https = require('https');

// 存储API配置 (使用ngrok隧道)
const STORAGE_API = {
  protocol: 'https',
  host: 'phrenologic-preprandial-jesica.ngrok-free.dev',
  port: null,
  basePath: '/api/sessions',
  apiKey: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║              存储API连接和功能测试                              ║
║                                                                ║
║  URL: https://${STORAGE_API.host}${STORAGE_API.basePath}           ║
║  通道: ngrok隧道                                               ║
╚════════════════════════════════════════════════════════════════╝
`);

/**
 * 通用HTTP请求函数
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = STORAGE_API.protocol === 'https' ? https : http;
    const options = {
      hostname: STORAGE_API.host,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STORAGE_API.apiKey}`
      },
      timeout: 10000,
      rejectUnauthorized: false  // 接受ngrok自签名证书
    };

    const req = protocol.request(options, (res) => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            statusMessage: res.statusMessage,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusMessage: res.statusMessage,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 主测试流程
 */
async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // ========================================
  // 测试1: 连接性检查
  // ========================================
  console.log('\n' + '='.repeat(64));
  console.log('  🔌 测试1: 连接性检查');
  console.log('='.repeat(64));

  try {
    console.log(`📍 尝试连接到 https://${STORAGE_API.host}${STORAGE_API.basePath}...`);
    // Use a simple POST with minimal data to test connectivity
    const testSessionForConnection = {
      sessionId: `health-check-${Date.now()}`,
      jobTitle: "Health Check",
      questions: [],
      status: "health_check"
    };

    const response = await makeRequest('POST', STORAGE_API.basePath, testSessionForConnection);

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ 服务器连接成功！ (HTTP ${response.status})`);
      console.log(`   服务器正在运行并可接受请求`);
      testsPassed++;
    } else if (response.status === 403 || response.status === 401) {
      console.log(`⚠️  服务器可访问，但认证失败 (HTTP ${response.status})`);
      console.log(`   检查API密钥是否正确`);
      testsFailed++;
    } else {
      console.log(`❌ 服务器返回错误 (HTTP ${response.status})`);
      console.log(`   响应: ${JSON.stringify(response.data)}`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`❌ 无法连接到服务器!`);
    console.error(`   错误: ${error.message}`);
    console.error(`\n💡 故障排除:`);
    console.error(`   1. 确认存储服务是否正在运行:`);
    console.error(`      docker-compose -f D:\\code7\\interview-system\\storage-service\\docker-compose.yml ps`);
    console.error(`   2. 如果没有运行，启动服务:`);
    console.error(`      docker-compose -f D:\\code7\\interview-system\\storage-service\\docker-compose.yml up -d`);
    console.error(`   3. 验证端口 8090 是否可访问:`);
    console.error(`      curl http://localhost:8090/api/sessions`);
    testsFailed++;
    return printSummary(testsPassed, testsFailed);
  }

  // ========================================
  // 测试2: POST 创建会话
  // ========================================
  console.log('\n' + '='.repeat(64));
  console.log('  💾 测试2: POST 创建会话');
  console.log('='.repeat(64));

  const sessionId = `test-${Date.now()}`;
  const testSession = {
    sessionId: sessionId,
    jobTitle: "Python后端开发工程师",
    questions: [
      {
        id: `${sessionId}-q1`,
        question: "请简述Python中的装饰器是什么？",
        hasAnswer: false,
        answer: null
      },
      {
        id: `${sessionId}-q2`,
        question: "如何在Django中创建RESTful API？",
        hasAnswer: false,
        answer: null
      }
    ],
    status: "questions_generated"
  };

  try {
    console.log(`📝 创建测试会话...`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   职位: ${testSession.jobTitle}`);
    console.log(`   问题数: ${testSession.questions.length}`);

    const response = await makeRequest('POST', STORAGE_API.basePath, testSession);

    if (response.status === 201 || response.status === 200) {
      console.log(`✅ 会话创建成功！ (HTTP ${response.status})`);
      console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
      testsPassed++;

      // ========================================
      // 测试3: GET 获取会话
      // ========================================
      console.log('\n' + '='.repeat(64));
      console.log('  📖 测试3: GET 获取会话');
      console.log('='.repeat(64));

      try {
        console.log(`🔍 获取会话 ${sessionId}...`);
        const getResponse = await makeRequest('GET', `${STORAGE_API.basePath}/${sessionId}`);

        if (getResponse.status === 200) {
          console.log(`✅ 会话获取成功！ (HTTP ${getResponse.status})`);
          const retrievedSession = getResponse.data;
          console.log(`   Session ID: ${retrievedSession.sessionId}`);
          console.log(`   职位: ${retrievedSession.jobTitle}`);
          console.log(`   问题数: ${retrievedSession.questions.length}`);
          console.log(`   状态: ${retrievedSession.status}`);
          testsPassed++;

          // ========================================
          // 测试4: POST 更新会话（添加答案）
          // ========================================
          console.log('\n' + '='.repeat(64));
          console.log('  ✏️  测试4: POST 更新会话（添加答案）');
          console.log('='.repeat(64));

          try {
            // 更新第一个问题的答案
            retrievedSession.questions[0].answer = "装饰器是一种在Python中用来修改或增强函数或类的工具。它允许你在不改变原始函数代码的情况下，为函数添加额外的功能。装饰器使用@符号表示，放在函数定义的上一行。";
            retrievedSession.questions[0].hasAnswer = true;

            console.log(`📝 更新第一个问题的答案...`);
            console.log(`   问题ID: ${retrievedSession.questions[0].id}`);
            console.log(`   答案长度: ${retrievedSession.questions[0].answer.length} 字符`);

            const updateResponse = await makeRequest('POST', STORAGE_API.basePath, retrievedSession);

            if (updateResponse.status === 201 || updateResponse.status === 200) {
              console.log(`✅ 会话更新成功！ (HTTP ${updateResponse.status})`);
              console.log(`   响应: ${JSON.stringify(updateResponse.data, null, 2)}`);
              testsPassed++;

              // ========================================
              // 测试5: GET 验证答案是否保存
              // ========================================
              console.log('\n' + '='.repeat(64));
              console.log('  ✔️  测试5: GET 验证答案是否保存');
              console.log('='.repeat(64));

              try {
                console.log(`🔍 再次获取会话以验证答案...`);
                const verifyResponse = await makeRequest('GET', `${STORAGE_API.basePath}/${sessionId}`);

                if (verifyResponse.status === 200) {
                  const updatedSession = verifyResponse.data;
                  const firstQuestion = updatedSession.questions[0];

                  if (firstQuestion.hasAnswer && firstQuestion.answer) {
                    console.log(`✅ 答案验证成功！ (HTTP ${verifyResponse.status})`);
                    console.log(`   问题: ${firstQuestion.question}`);
                    console.log(`   有答案: ${firstQuestion.hasAnswer}`);
                    console.log(`   答案: ${firstQuestion.answer.substring(0, 50)}...`);
                    testsPassed++;
                  } else {
                    console.log(`❌ 答案未正确保存`);
                    console.log(`   当前状态: hasAnswer=${firstQuestion.hasAnswer}, answer=${firstQuestion.answer}`);
                    testsFailed++;
                  }
                } else {
                  console.log(`❌ 获取会话失败 (HTTP ${verifyResponse.status})`);
                  testsFailed++;
                }
              } catch (error) {
                console.error(`❌ 验证答案时出错: ${error.message}`);
                testsFailed++;
              }

            } else {
              console.log(`❌ 会话更新失败 (HTTP ${updateResponse.status})`);
              console.log(`   响应: ${JSON.stringify(updateResponse.data)}`);
              testsFailed++;
            }
          } catch (error) {
            console.error(`❌ 更新会话时出错: ${error.message}`);
            testsFailed++;
          }

        } else {
          console.log(`❌ 会话获取失败 (HTTP ${getResponse.status})`);
          console.log(`   响应: ${JSON.stringify(getResponse.data)}`);
          testsFailed++;
        }
      } catch (error) {
        console.error(`❌ 获取会话时出错: ${error.message}`);
        testsFailed++;
      }

    } else {
      console.log(`❌ 会话创建失败 (HTTP ${response.status})`);
      console.log(`   响应: ${JSON.stringify(response.data)}`);
      testsFailed++;
    }
  } catch (error) {
    console.error(`❌ 创建会话时出错: ${error.message}`);
    testsFailed++;
  }

  // 打印总结
  printSummary(testsPassed, testsFailed);
}

/**
 * 打印测试总结
 */
function printSummary(passed, failed) {
  console.log('\n' + '='.repeat(64));
  console.log('📊 测试总结');
  console.log('='.repeat(64));

  const total = passed + failed;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log(`\n通过: ${passed}/${total} (${percentage}%)`);
  console.log(`失败: ${failed}/${total}`);

  if (failed === 0 && passed > 0) {
    console.log(`\n✅ 太棒了！存储API完全正常！`);
    console.log(`\n现在您可以:`);
    console.log(`  1. 更新Dify工作流配置（参考 DIFY_STORAGE_API_UPDATE.md）`);
    console.log(`  2. 运行 node test-workflows-complete.js 进行完整测试`);
    process.exit(0);
  } else {
    console.log(`\n❌ 存储API存在问题，请检查日志`);
    console.log(`\n常见问题:`);
    console.log(`  1. 服务未运行 -> 启动 docker-compose`);
    console.log(`  2. 端口被占用 -> 检查或更改端口配置`);
    console.log(`  3. 防火墙阻止 -> 检查防火墙设置`);
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
