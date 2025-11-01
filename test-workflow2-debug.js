#!/usr/bin/env node

const https = require('https');

const WORKFLOW2 = {
  apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
  workflowId: '5X6RBtTFMCZr0r4R',
  apiUrl: 'https://api.dify.ai/v1/workflows/run'
};

function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
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
      reject(new Error('请求超时'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  const difyPayload = {
    inputs: {
      session_id: 'fae4a2cf-4435-4201-a4ad-180fedbcb922',
      question_id: 'fae4a2cf-4435-4201-a4ad-180fedbcb922-q1',
      question_text: '请描述你在生产环境中设计并实现一个基于Java的微服务系统',
      user_answer: '用户答案'
    },
    user: 'test-user'
  };

  console.log('发送请求...\n');
  const response = await makeRequest(
    WORKFLOW2.apiUrl,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WORKFLOW2.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    },
    difyPayload
  );

  console.log('完整响应:');
  console.log(JSON.stringify(response.data, null, 2));
}

test().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
