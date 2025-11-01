#!/usr/bin/env node

/**
 * 完整工作流测试脚本 - 使用 MCP 服务端点和公开 URL
 * 测试工作流1、2、3的完整流程
 */

const https = require('https');
const http = require('http');

// 工作流配置（使用提供的MCP端点）
const WORKFLOWS = {
  workflow1: {
    name: '工作流1 - 生成问题',
    publicUrl: 'https://udify.app/workflow/560EB9DDSwOFc8As',
    apiKey: 'app-hHvF3glxCRhtfkyX7Pg9i9kb',
    workflowId: '560EB9DDSwOFc8As',
    apiBaseUrl: 'https://api.dify.ai/v1',
    mcpServerUrl: 'https://api.dify.ai/mcp/server/UqMNCRPfhtX2Io3D/mcp'
  },
  workflow2: {
    name: '工作流2 - 生成答案',
    publicUrl: 'https://udify.app/workflow/5X6RBtTFMCZr0r4R',
    apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    workflowId: '5X6RBtTFMCZr0r4R',
    apiBaseUrl: 'https://api.dify.ai/v1',
    mcpServerUrl: 'https://api.dify.ai/mcp/server/rRhFPigobMYdE8Js/mcp'
  },
  workflow3: {
    name: '工作流3 - 评分系统',
    publicUrl: 'https://udify.app/workflow/7C4guOpDk2GfmIFy',
    apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
    workflowId: '7C4guOpDk2GfmIFy',
    apiBaseUrl: 'https://api.dify.ai/v1',
    mcpServerUrl: 'https://api.dify.ai/mcp/server/us5bQe5TwQbJWQxG/mcp'
  }
};

// 通用HTTP请求函数
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

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
      reject(new Error('请求超时 (120秒)'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    // 设置更长的超时时间 (120秒)
    req.setTimeout(120000);
    req.end();
  });
}

// 调用工作流
async function callDifyWorkflow(workflowKey, inputs, user = 'test-user') {
  const workflow = WORKFLOWS[workflowKey];
  const apiUrl = `${workflow.apiBaseUrl}/workflows/run`;  // 正确的端点格式

  console.log(`\n📤 调用 ${workflow.name}...`);
  console.log(`📍 API URL: ${apiUrl}`);
  console.log(`📍 公开 URL: ${workflow.publicUrl}`);
  console.log(`📝 输入参数:`, JSON.stringify(inputs, null, 2));

  try {
    const response = await makeRequest(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${workflow.apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      {
        workflow_id: workflow.workflowId,  // 在请求体中传递workflow_id
        inputs: inputs,
        user: user
      }
    );

    console.log(`✅ 响应状态码: ${response.status}`);

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${workflow.name} 响应成功`);
      console.log(`📦 输出数据:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.log(`❌ ${workflow.name} 调用失败 (状态码: ${response.status})`);
      console.log(`   错误信息:`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${workflow.name} 调用异常:`, error.message);
    return null;
  }
}

// 主测试函数
async function runFullTest() {
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║         Dify 工作流完整测试 (使用 MCP 端点)                ║`);
  console.log(`║                                                            ║`);
  console.log(`║  时间: ${new Date().toISOString()}      ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  let testResults = {
    workflow1: null,
    workflow2: null,
    workflow3: null
  };

  // 测试工作流1 - 生成问题
  console.log(`\n${'='.repeat(64)}`);
  console.log(`  📋 步骤1: 测试工作流1 - 生成问题`);
  console.log(`${'='.repeat(64)}`);

  testResults.workflow1 = await callDifyWorkflow('workflow1', {
    job_title: 'Python后端开发工程师'
  });

  if (!testResults.workflow1) {
    console.log(`\n❌ 工作流1失败，停止测试`);
    return printSummary(testResults);
  }

  // 从工作流1的输出中提取 session_id
  let sessionId = null;
  if (testResults.workflow1.data && testResults.workflow1.data.outputs) {
    sessionId = testResults.workflow1.data.outputs.session_id;
  } else if (testResults.workflow1.data && testResults.workflow1.data.session_id) {
    sessionId = testResults.workflow1.data.session_id;
  } else if (testResults.workflow1.session_id) {
    sessionId = testResults.workflow1.session_id;
  }

  console.log(`\n✅ 工作流1 完成！`);
  console.log(`   Session ID: ${sessionId}`);

  // 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试工作流2 - 生成答案
  if (sessionId) {
    console.log(`\n${'='.repeat(64)}`);
    console.log(`  📝 步骤2: 测试工作流2 - 生成答案`);
    console.log(`${'='.repeat(64)}`);

    // 如果工作流1有问题列表，获取第一个问题ID
    let questionId = `${sessionId}-q1`;

    testResults.workflow2 = await callDifyWorkflow('workflow2', {
      session_id: sessionId,
      question_id: questionId
    });

    if (testResults.workflow2) {
      console.log(`\n✅ 工作流2 完成！`);
    } else {
      console.log(`\n⚠️  工作流2 失败，继续测试工作流3`);
    }
  }

  // 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试工作流3 - 评分
  if (sessionId) {
    console.log(`\n${'='.repeat(64)}`);
    console.log(`  ⭐ 步骤3: 测试工作流3 - 评分系统`);
    console.log(`${'='.repeat(64)}`);

    let questionId = `${sessionId}-q1`;

    testResults.workflow3 = await callDifyWorkflow('workflow3', {
      session_id: sessionId,
      question_id: questionId,
      candidate_answer: '我认为Python的装饰器是一种函数式编程技巧，允许在不修改原函数代码的情况下，为函数添加额外的功能。'
    });

    if (testResults.workflow3) {
      console.log(`\n✅ 工作流3 完成！`);
    } else {
      console.log(`\n❌ 工作流3 失败`);
    }
  }

  // 打印总结
  printSummary(testResults);
}

// 打印测试总结
function printSummary(results) {
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                  📊 测试总结                               ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  const workflow1Status = results.workflow1 ? '✅ 成功' : '❌ 失败';
  const workflow2Status = results.workflow2 ? '✅ 成功' : '⚠️ 失败/跳过';
  const workflow3Status = results.workflow3 ? '✅ 成功' : '⚠️ 失败/跳过';

  console.log(`工作流1 - 生成问题: ${workflow1Status}`);
  console.log(`工作流2 - 生成答案: ${workflow2Status}`);
  console.log(`工作流3 - 评分系统: ${workflow3Status}`);

  console.log(`\n📌 工作流公开 URL:`);
  console.log(`   工作流1: ${WORKFLOWS.workflow1.publicUrl}`);
  console.log(`   工作流2: ${WORKFLOWS.workflow2.publicUrl}`);
  console.log(`   工作流3: ${WORKFLOWS.workflow3.publicUrl}`);

  console.log(`\n📌 MCP 服务端点:`);
  console.log(`   工作流1: ${WORKFLOWS.workflow1.mcpServerUrl}`);
  console.log(`   工作流2: ${WORKFLOWS.workflow2.mcpServerUrl}`);
  console.log(`   工作流3: ${WORKFLOWS.workflow3.mcpServerUrl}`);

  const successCount = [results.workflow1, results.workflow2, results.workflow3].filter(r => r).length;
  console.log(`\n总体成功率: ${successCount}/3 (${Math.round(successCount/3*100)}%)`);

  process.exit(successCount === 3 ? 0 : 1);
}

// 运行测试
runFullTest().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
