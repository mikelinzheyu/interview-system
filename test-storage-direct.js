#!/usr/bin/env node

const http = require('http');
const https = require('https');

function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;

    const req = protocol.request(url, {
      timeout: 5000,
      rejectUnauthorized: false,
      ...options
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║       存储API直接测试                              ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const apiKey = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
  const sessionId = `test-${Date.now()}`;

  // 测试1: 创建会话(POST)
  console.log('🔍 测试1: 创建会话 (POST /api/sessions)');
  console.log('─'.repeat(50));

  const sessionData = {
    sessionId: sessionId,
    jobTitle: 'Python后端开发工程师',
    questions: [
      { id: 'q1', question: '你有什么核心技能？', hasAnswer: false, answer: null },
      { id: 'q2', question: '你的项目经验？', hasAnswer: false, answer: null }
    ],
    status: 'questions_generated'
  };

  try {
    const response = await makeRequest(
      'http://localhost:8090/api/sessions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      sessionData
    );

    console.log(`✅ 响应状态: ${response.status}`);
    console.log(`📦 响应数据: ${JSON.stringify(response.data, null, 2)}\n`);

    if (response.status === 201 && response.data.success) {
      // 测试2: 获取会话(GET)
      console.log('🔍 测试2: 获取会话 (GET /api/sessions/{sessionId})');
      console.log('─'.repeat(50));

      try {
        const getResponse = await makeRequest(
          `http://localhost:8090/api/sessions/${sessionId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );

        console.log(`✅ 响应状态: ${getResponse.status}`);
        console.log(`📦 会话数据:\n${JSON.stringify(getResponse.data, null, 2)}\n`);

        if (getResponse.status === 200) {
          console.log('✅ 本地存储API工作正常！\n');
        }
      } catch (error) {
        console.log(`❌ GET请求失败: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.log(`❌ POST请求失败: ${error.message}\n`);
  }

  // 测试3: ngrok隧道
  console.log('🔍 测试3: 通过ngrok隧道创建会话');
  console.log('─'.repeat(50));

  const ngrokSessionId = `test-ngrok-${Date.now()}`;
  const ngrokSessionData = {
    sessionId: ngrokSessionId,
    jobTitle: 'Java开发工程师',
    questions: [
      { id: 'q1', question: '谈谈你对设计模式的理解', hasAnswer: false, answer: null }
    ],
    status: 'questions_generated'
  };

  try {
    const response = await makeRequest(
      'https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      ngrokSessionData
    );

    console.log(`✅ 响应状态: ${response.status}`);
    console.log(`📦 响应数据: ${JSON.stringify(response.data, null, 2)}\n`);

    if (response.status === 201) {
      console.log('✅ ngrok隧道工作正常！\n');
    }
  } catch (error) {
    console.log(`❌ ngrok隧道请求失败: ${error.message}\n`);
  }

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║       测试完成                                    ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

test().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
