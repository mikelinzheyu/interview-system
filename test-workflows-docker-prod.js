#!/usr/bin/env node

/**
 * Dify 工作流完整测试脚本 - Docker 生产环境版本
 * 测试三个工作流的完整流程：生成问题 -> 生成答案 -> 评分
 * 使用有效的 API Key 和 Docker 内部网络调用
 */

const https = require('https');
const http = require('http');

// 从环境变量或使用默认值
const DIFY_API_KEY = process.env.DIFY_API_KEY || 'app-wYqlMORyoUpBkW32BAcRe9lc';
const DIFY_API_BASE_URL = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';

// 工作流配置 (使用用户提供的有效凭证)
const WORKFLOWS = {
  workflow1: {
    name: '工作流1 - 生成问题',
    apiKey: 'app-WhLg4w9QxdY7vUqbWbYWBWYi',
    workflowId: '560EB9DDSwOFc8As',
    // 尝试公开 API 端点
    apiUrl: 'https://api.dify.ai/v1/workflows/run'
  },
  workflow2: {
    name: '工作流2 - 生成答案',
    apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    workflowId: '5X6RBtTFMCZr0r4R',
    apiUrl: 'https://api.dify.ai/v1/workflows/run'
  },
  workflow3: {
    name: '工作流3 - 评分',
    apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
    workflowId: '7C4guOpDk2GfmIFy',
    apiUrl: 'https://api.dify.ai/v1/workflows/run'
  }
};

// 内部存储服务配置 (Docker 网络内)
const STORAGE_API = {
  baseUrl: 'http://interview-storage-service:8081',
  apiKey: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
};

// 通用HTTP请求函数
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    // 对于ngrok隧道或自签名证书，禁用SSL验证
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

// 调用Dify工作流
async function callDifyWorkflow(workflowKey, inputs, user = 'docker-test-user') {
  const workflow = WORKFLOWS[workflowKey];

  console.log(`\n📤 调用 ${workflow.name}...`);
  console.log(`📍 URL: ${workflow.apiUrl}`);
  console.log(`📝 输入参数:`, JSON.stringify(inputs, null, 2));

  try {
    const response = await makeRequest(
      workflow.apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workflow.apiKey}`,
          'User-Agent': 'Docker-Workflow-Test/1.0'
        },
        timeout: 120000 // 120秒超时
      },
      {
        workflow_id: workflow.workflowId,
        inputs: inputs,
        response_mode: 'blocking',
        user: user
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${workflow.name} 成功`);
      console.log(`📦 响应数据:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.log(`❌ ${workflow.name} 调用失败 (状态码: ${response.status})`);
      console.log(`📦 错误信息:`, response.data);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${workflow.name} 调用异常:`, error.message);
    return null;
  }
}

// 保存会话到存储服务
async function saveSessionToStorage(sessionId, data) {
  console.log(`\n💾 保存会话到存储服务... (Session ID: ${sessionId})`);

  try {
    const response = await makeRequest(
      `${STORAGE_API.baseUrl}/api/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': STORAGE_API.apiKey
        }
      },
      data
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ 会话保存成功`);
      return true;
    } else {
      console.log(`❌ 会话保存失败 (状态码: ${response.status})`);
      console.log(`📦 响应:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  会话保存异常 (非关键): ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Dify 工作流完整功能测试 - Docker 生产环境               ║
║                                                                ║
║  时间: ${new Date().toLocaleString('zh-CN')}         ║
║  API Key: ${DIFY_API_KEY.substring(0, 10)}...              ║
║  API Base: ${DIFY_API_BASE_URL}                    ║
╚════════════════════════════════════════════════════════════════╝
  `);

  let testResults = {
    workflow1: null,
    workflow2: null,
    workflow3: null,
    sessionId: `session-${Date.now()}`
  };

  // 测试工作流1
  console.log(`
================================================================
  📋 步骤1: 测试工作流1 - 生成问题
================================================================
`);

  const sessionId = `session-${Date.now()}`;
  const questionId = `q-${Date.now()}`;

  const workflow1Input = {
    session_id: sessionId,
    question_id: questionId,
    job_title: 'Python后端开发工程师',
    difficulty_level: '中级'
  };

  const workflow1Result = await callDifyWorkflow('workflow1', workflow1Input);

  if (!workflow1Result) {
    console.log(`\n❌ 工作流1测试失败，无法继续后续测试`);
    console.log(`\n⚠️  请检查:`);
    console.log(`  1. DIFY_API_KEY 是否有效: ${DIFY_API_KEY}`);
    console.log(`  2. Dify 工作流ID 是否正确`);
    console.log(`  3. 网络连接是否正常`);
    console.log(`  4. Dify API 服务是否可用`);
    return;
  }

  testResults.workflow1 = workflow1Result;

  // 等待一下，避免频繁调用
  console.log(`\n⏳ 等待 3 秒后继续...`);
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 测试工作流2
  console.log(`
================================================================
  📋 步骤2: 测试工作流2 - 生成答案
================================================================
`);

  const workflow2Input = {
    session_id: sessionId,
    question_id: questionId,
    question_text: workflow1Result.outputs?.question || 'Python中什么是装饰器？',
    job_title: 'Python后端开发工程师',
    difficulty_level: '中级'
  };

  const workflow2Result = await callDifyWorkflow('workflow2', workflow2Input);

  if (!workflow2Result) {
    console.log(`\n⚠️  工作流2测试失败，尝试继续工作流3`);
  } else {
    testResults.workflow2 = workflow2Result;
  }

  // 等待一下
  console.log(`\n⏳ 等待 3 秒后继续...`);
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 测试工作流3
  console.log(`
================================================================
  📋 步骤3: 测试工作流3 - 评分
================================================================
`);

  const workflow3Input = {
    session_id: sessionId,
    question_id: questionId,
    candidate_answer: workflow2Result?.outputs?.generated_answer || '装饰器是一个函数',
    answer_text: workflow2Result?.outputs?.generated_answer || '装饰器是一个函数',
    question_text: workflow1Result.outputs?.question || '什么是装饰器？',
    expected_answer: '装饰器是Python中的一个高级特性，它允许在不修改原始函数的情况下添加功能。',
    difficulty_level: '中级'
  };

  const workflow3Result = await callDifyWorkflow('workflow3', workflow3Input);

  if (!workflow3Result) {
    console.log(`\n⚠️  工作流3测试失败`);
  } else {
    testResults.workflow3 = workflow3Result;
  }

  // 尝试保存会话到存储服务
  console.log(`
================================================================
  📋 步骤4: 保存会话数据到存储服务
================================================================
`);

  await saveSessionToStorage(testResults.sessionId, {
    job_title: 'Python后端开发工程师',
    workflow1_result: testResults.workflow1,
    workflow2_result: testResults.workflow2,
    workflow3_result: testResults.workflow3,
    timestamp: new Date().toISOString()
  });

  // 打印最终结果
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     测试结果总结                                ║
╚════════════════════════════════════════════════════════════════╝
`);

  console.log(`
✅ 工作流1 (生成问题): ${testResults.workflow1 ? '✅ 成功' : '❌ 失败'}`);
  if (testResults.workflow1) {
    console.log(`   问题: ${testResults.workflow1.outputs?.question || 'N/A'}`);
  }

  console.log(`\n✅ 工作流2 (生成答案): ${testResults.workflow2 ? '✅ 成功' : '❌ 失败'}`);
  if (testResults.workflow2) {
    console.log(`   答案: ${testResults.workflow2.outputs?.answer?.substring(0, 100) || 'N/A'}...`);
  }

  console.log(`\n✅ 工作流3 (评分): ${testResults.workflow3 ? '✅ 成功' : '❌ 失败'}`);
  if (testResults.workflow3) {
    console.log(`   评分: ${testResults.workflow3.outputs?.score || 'N/A'}`);
  }

  console.log(`\n📊 会话ID: ${testResults.sessionId}`);

  console.log(`
================================================================
  测试完成！
================================================================
`);
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试发生错误:', error);
  process.exit(1);
});
