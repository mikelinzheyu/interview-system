#!/usr/bin/env node

/**
 * 更新的工作流测试脚本
 * - 去掉 difficulty_level 参数
 * - 测试 workflow1, 2, 3
 */

const https = require('https');
const http = require('http');

const DIFY_API_BASE_URL = 'https://api.dify.ai/v1';

const WORKFLOWS = {
  workflow1: {
    name: 'Workflow1 - 生成问题',
    apiKey: 'app-WhLg4w9QxdY7vUqbWbYWBWYi',
    workflowId: '560EB9DDSwOFc8As',
  },
  workflow2: {
    name: 'Workflow2 - 生成答案',
    apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    workflowId: '5X6RBtTFMCZr0r4R',
  },
  workflow3: {
    name: 'Workflow3 - 评分',
    apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
    workflowId: '7C4guOpDk2GfmIFy',
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
  console.log(`📋 ${workflow.name}`);
  console.log(`${'='.repeat(70)}`);
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

    if (response.data.data && response.data.data.status) {
      const status = response.data.data.status;

      if (status === 'succeeded') {
        console.log(`✅ 成功`);
        console.log(`📦 输出:`);
        console.log(JSON.stringify(response.data.data.outputs, null, 2));
        return response.data.data.outputs;
      } else if (status === 'failed') {
        console.log(`❌ 失败`);
        console.log(`❌ 错误信息:`);
        console.log(response.data.data.error);
        return null;
      } else {
        console.log(`⚠️  状态: ${status}`);
        return response.data.data.outputs || response.data.data;
      }
    }
  } catch (error) {
    console.log(`❌ 异常: ${error.message}`);
    return null;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║       工作流1、2、3 测试 (无 difficulty_level 参数)            ║`);
  console.log(`║                    ${new Date().toLocaleString('zh-CN')}        ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝`);

  // 步骤 1: 测试 Workflow1
  console.log(`\n🎯 Step 1: Workflow1 - 生成问题\n`);

  const workflow1Inputs = {
    job_title: 'Python 后端开发工程师'
  };

  const workflow1Output = await callDifyWorkflow('workflow1', workflow1Inputs);

  if (!workflow1Output) {
    console.log(`\n❌ Workflow1 失败，停止测试`);
    process.exit(1);
  }

  const session_id = workflow1Output.session_id;
  const question_id = workflow1Output.question_id;

  console.log(`\n✅ Workflow1 成功!`);
  console.log(`   - Session ID: ${session_id}`);
  console.log(`   - Question ID: ${question_id}`);

  // 步骤 2: 测试 Workflow2
  await delay(3000);
  console.log(`\n🎯 Step 2: Workflow2 - 生成答案\n`);

  const workflow2Inputs = {
    session_id: session_id,
    question_id: question_id,
    user_answer: 'Python 装饰器是一个函数',
    job_title: 'Python 后端开发工程师'
  };

  const workflow2Output = await callDifyWorkflow('workflow2', workflow2Inputs);

  if (!workflow2Output) {
    console.log(`\n⚠️  Workflow2 无结果`);
  } else {
    console.log(`\n✅ Workflow2 完成!`);
  }

  // 步骤 3: 测试 Workflow3
  await delay(3000);
  console.log(`\n🎯 Step 3: Workflow3 - 评分\n`);

  const workflow3Inputs = {
    session_id: session_id,
    question_id: question_id,
    user_answer: 'Python 装饰器是一个函数',
    standard_answer: workflow2Output?.standard_answer || '装饰器是一个高阶函数',
    job_title: 'Python 后端开发工程师'
  };

  const workflow3Output = await callDifyWorkflow('workflow3', workflow3Inputs);

  if (!workflow3Output) {
    console.log(`\n⚠️  Workflow3 无结果`);
  } else {
    console.log(`\n✅ Workflow3 完成!`);
  }

  // 总结
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 测试总结`);
  console.log(`${'='.repeat(70)}`);
  console.log(`
✅ Workflow1 (生成问题): 成功
   - Session ID: ${session_id}
   - Question ID: ${question_id}

${workflow2Output ? `✅ Workflow2 (生成答案): 成功` : `⚠️  Workflow2 (生成答案): 无结果`}

${workflow3Output ? `✅ Workflow3 (评分): 成功` : `⚠️  Workflow3 (评分): 无结果`}
  `);

  console.log(`\n✨ 测试完成!\n`);
}

runTests().catch(error => {
  console.error('测试异常:', error);
  process.exit(1);
});
