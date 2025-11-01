#!/usr/bin/env node

const https = require('https');

const WORKFLOW3 = {
  apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
  workflowId: '7C4guOpDk2GfmIFy',
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
      candidate_answer: '我的答案是一个关于Java微服务系统的详细描述'
    },
    user: 'test-user'
  };

  console.log('发送请求到 Workflow3...\n');
  const response = await makeRequest(
    WORKFLOW3.apiUrl,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WORKFLOW3.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    },
    difyPayload
  );

  console.log('完整响应:');
  console.log(JSON.stringify(response.data, null, 2));
  
  console.log('\n\nWorkflow数据:');
  console.log(JSON.stringify(response.data.data, null, 2));
}

test().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
