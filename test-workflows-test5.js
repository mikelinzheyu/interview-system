#!/usr/bin/env node

/**
 * 测试 test5 中的三个工作流
 * 用于完整验证工作流1、2、3的功能
 */

const https = require('https');
const http = require('http');

// Dify API 配置
const DIFY_API_BASE_URL = 'https://api.dify.ai/v1';

// 工作流配置 (从 test5 中获取的最新工作流)
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

// 通用 HTTP 请求函数
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

// 调用 Dify 工作流
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

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主测试流程
async function runTests() {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║         工作流1、2、3 完整功能测试                           ║`);
  console.log(`║         (基于 D:\\code7\\test5 中的最新工作流)                ║`);
  console.log(`║                                                                ║`);
  console.log(`║  测试时间: ${new Date().toLocaleString('zh-CN')}        ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

  // Step 1: 测试 Workflow1
  console.log(`\n🎯 第1步: 测试 Workflow1 - 生成问题\n`);

  const workflow1Inputs = {
    job_title: 'Python 后端开发工程师',
    difficulty_level: '中级'
  };

  const workflow1Output = await callDifyWorkflow('workflow1', workflow1Inputs);

  if (!workflow1Output) {
    console.log(`\n❌ Workflow1 测试失败，无法继续后续测试`);
    process.exit(1);
  }

  // 从 workflow1 输出中提取关键数据
  const session_id = workflow1Output.session_id;
  const question_id = workflow1Output.question_id;
  const question_text = workflow1Output.question || '无法获取问题文本';

  console.log(`\n✅ Workflow1 测试成功！`);
  console.log(`   - Session ID: ${session_id}`);
  console.log(`   - Question ID: ${question_id}`);
  console.log(`   - Save Status: ${workflow1Output.save_status}`);

  // Step 2: 测试 Workflow2
  await delay(3000);
  console.log(`\n🎯 第2步: 测试 Workflow2 - 生成答案\n`);

  const workflow2Inputs = {
    session_id: session_id,
    question_id: question_id,
    user_answer: 'Python 装饰器是一个函数',
    job_title: 'Python 后端开发工程师',
    difficulty_level: '中级'
  };

  const workflow2Output = await callDifyWorkflow('workflow2', workflow2Inputs);

  if (!workflow2Output) {
    console.log(`\n⚠️  Workflow2 测试失败或无输出`);
  } else {
    console.log(`\n✅ Workflow2 测试完成！`);
    console.log(`   - Save Status: ${workflow2Output.save_status || '无状态返回'}`);
    if (workflow2Output.standard_answer) {
      console.log(`   - Generated Answer: ${workflow2Output.standard_answer.substring(0, 50)}...`);
    }
  }

  // Step 3: 测试 Workflow3
  await delay(3000);
  console.log(`\n🎯 第3步: 测试 Workflow3 - 评分\n`);

  const workflow3Inputs = {
    session_id: session_id,
    question_id: question_id,
    user_answer: 'Python 装饰器是一个函数',
    standard_answer: workflow2Output?.standard_answer || '装饰器是一个高阶函数',
    job_title: 'Python 后端开发工程师',
    difficulty_level: '中级'
  };

  const workflow3Output = await callDifyWorkflow('workflow3', workflow3Inputs);

  if (!workflow3Output) {
    console.log(`\n⚠️  Workflow3 测试失败或无输出`);
  } else {
    console.log(`\n✅ Workflow3 测试完成！`);
    if (workflow3Output.overall_score !== undefined) {
      console.log(`   - Overall Score: ${workflow3Output.overall_score}`);
    }
    if (workflow3Output.comprehensive_evaluation) {
      console.log(`   - Evaluation: ${workflow3Output.comprehensive_evaluation.substring(0, 50)}...`);
    }
  }

  // 最终总结
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 测试总结`);
  console.log(`${'='.repeat(70)}`);

  console.log(`
✅ Workflow1 (生成问题): 成功
   - 返回了 session_id 和 question_id
   - save_status: ${workflow1Output.save_status}

${workflow2Output ? `✅ Workflow2 (生成答案): ${workflow2Output.save_status === '成功' ? '成功' : '部分成功'}` : `⚠️  Workflow2 (生成答案): 无结果`}
   ${workflow2Output ? `- save_status: ${workflow2Output.save_status}` : ''}

${workflow3Output ? `✅ Workflow3 (评分): 成功` : `⚠️  Workflow3 (评分): 无结果`}
   ${workflow3Output && workflow3Output.overall_score !== undefined ? `- 评分: ${workflow3Output.overall_score}` : ''}
  `);

  console.log(`\n✨ 测试完成！\n`);
}

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
