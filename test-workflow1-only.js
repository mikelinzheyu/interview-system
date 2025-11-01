#!/usr/bin/env node

const https = require('https');
const http = require('http');

const DIFY_API_BASE_URL = 'https://api.dify.ai/v1';

const WORKFLOWS = {
  workflow1: {
    name: 'Workflow1 - 生成问题',
    apiKey: 'app-WhLg4w9QxdY7vUqbWbYWBWYi',
    workflowId: '560EB9DDSwOFc8As',
  }
};

function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    if (url.includes('ngrok') || url.includes('localhost')) {
      options.rejectUnauthorized = false;
    }

    const req = protocol.request(url, options, (res) => {
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

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function callDifyWorkflow(workflowKey, inputs, user = 'test-user') {
  const workflow = WORKFLOWS[workflowKey];

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 调用 ${workflow.name}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📍 工作流ID: ${workflow.workflowId}`);
  console.log(`📝 输入参数:`);
  console.log(JSON.stringify(inputs, null, 2));

  try {
    const response = await makeRequest(
      `${DIFY_API_BASE_URL}/workflows/run`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workflow.apiKey}`,
          'User-Agent': 'Test-Workflow/1.0'
        },
        timeout: 120000
      },
      {
        workflow_id: workflow.workflowId,
        inputs: inputs,
        response_mode: 'blocking',
        user: user
      }
    );

    console.log(`\n✅ HTTP 状态码: ${response.status}`);

    if (response.data.data && response.data.data.status) {
      const status = response.data.data.status;

      if (status === 'succeeded') {
        console.log(`✅ 工作流执行成功！`);
        console.log(`\n📦 输出数据:`);
        console.log(JSON.stringify(response.data.data.outputs, null, 2));
        return response.data.data.outputs;
      } else if (status === 'failed') {
        console.log(`❌ 工作流执行失败！`);
        console.log(`\n❌ 错误信息:`);
        console.log(response.data.data.error);
        return null;
      } else {
        console.log(`⚠️  工作流状态: ${status}`);
        console.log(`\n📦 响应数据:`);
        console.log(JSON.stringify(response.data.data, null, 2));
        return response.data.data.outputs || response.data.data;
      }
    } else {
      console.log(`⚠️  返回数据格式不符预期`);
      console.log(JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`❌ 调用异常: ${error.message}`);
    return null;
  }
}

async function runTest() {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║         Workflow1 独立测试 (无 difficulty_level)                  ║`);
  console.log(`║                                                                ║`);
  console.log(`║  测试时间: ${new Date().toLocaleString('zh-CN')}        ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

  // Test 1: Without difficulty_level
  console.log(`\n🎯 测试 1: 不传递 difficulty_level 参数\n`);

  const workflow1Inputs = {
    job_title: 'Python 后端开发工程师'
  };

  const result = await callDifyWorkflow('workflow1', workflow1Inputs);

  if (result) {
    console.log(`\n✅ 测试成功！`);
  } else {
    console.log(`\n❌ 测试失败`);
  }
}

runTest().catch(error => {
  console.error('测试异常:', error);
  process.exit(1);
});
