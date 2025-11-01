#!/usr/bin/env node

/**
 * Dify工作流完整测试脚本 (本地存储API版本)
 * 测试三个工作流的完整流程：生成问题 -> 生成答案 -> 评分
 * 使用本地存储API: http://localhost:8090
 */

const https = require('https');
const http = require('http');

// 工作流配置 (使用正确的API密钥)
const WORKFLOWS = {
  workflow1: {
    name: '工作流1 - 生成问题',
    apiKey: 'app-hHvF3glxCRhtfkyX7Pg9i9kb',
    workflowId: '560EB9DDSwOFc8As',
    apiUrl: 'https://api.dify.ai/v1/workflows/560EB9DDSwOFc8As/run'
  },
  workflow2: {
    name: '工作流2 - 生成答案',
    apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    workflowId: '5X6RBtTFMCZr0r4R',
    apiUrl: 'https://api.dify.ai/v1/workflows/5X6RBtTFMCZr0r4R/run'
  },
  workflow3: {
    name: '工作流3 - 评分',
    apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
    workflowId: '7C4guOpDk2GfmIFy',
    apiUrl: 'https://api.dify.ai/v1/workflows/7C4guOpDk2GfmIFy/run'
  }
};

// 本地存储服务配置
const STORAGE_API = {
  baseUrl: 'http://localhost:8090/api/sessions',
  apiKey: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
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
      reject(new Error('请求超时'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 调用Dify工作流
async function callDifyWorkflow(workflowKey, inputs, user = 'test-user') {
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
          'Authorization': `Bearer ${workflow.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 180000
      },
      {
        inputs,
        response_mode: 'blocking',
        user
      }
    );

    if (response.status === 200) {
      console.log(`✅ ${workflow.name} 响应成功 (状态码: ${response.status})`);
      console.log(`📦 输出数据:`, JSON.stringify(response.data.workflow_run.outputs, null, 2));
      return response.data.workflow_run.outputs;
    } else {
      console.error(`❌ ${workflow.name} 调用失败 (状态码: ${response.status})`);
      console.error(`📦 错误信息:`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${workflow.name} 调用异常:`, error.message);
    return null;
  }
}

// 查询本地存储服务
async function queryStorage(sessionId, questionId = null) {
  const url = questionId
    ? `${STORAGE_API.baseUrl}/${sessionId}`
    : `${STORAGE_API.baseUrl}/${sessionId}`;

  console.log(`\n🔍 查询本地存储: ${url}`);

  try {
    const response = await makeRequest(
      url,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STORAGE_API.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ 存储查询成功 (状态码 ${response.status})`);
      console.log(`📦 返回数据:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.error(`❌ 存储查询失败 (状态码 ${response.status})`);
      console.error(`📦 错误信息:`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ 存储查询异常:`, error.message);
    return null;
  }
}

// 主测试流程
async function runCompleteTest() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Dify 工作流完整功能测试 (本地存储API版本)                 ║
║                                                                ║
║  时间: ${new Date().toLocaleString('zh-CN')}                 ║
║  存储API: http://localhost:8090/api/sessions                  ║
╚════════════════════════════════════════════════════════════════╝
  `);

  let testResults = {
    workflow1: { passed: false, message: '' },
    workflow2: { passed: false, message: '' },
    workflow3: { passed: false, message: '' },
    storage: { passed: false, message: '' }
  };

  // ========================================
  // 步骤1: 测试工作流1 - 生成问题
  // ========================================
  console.log('\n' + '='.repeat(64));
  console.log('  📋 步骤1: 测试工作流1 - 生成问题');
  console.log('='.repeat(64));

  const jobTitle = 'Python后端开发工程师';
  const workflow1Result = await callDifyWorkflow('workflow1', {
    job_title: jobTitle
  });

  if (!workflow1Result) {
    console.error('❌ 工作流1测试失败，无法继续');
    testResults.workflow1.message = '工作流调用失败';
    printSummary(testResults);
    return;
  }

  // 提取session_id和questions
  const sessionId = workflow1Result.session_id;
  let questions = [];

  try {
    questions = JSON.parse(workflow1Result.questions);
  } catch (e) {
    console.error('❌ 解析questions失败:', e.message);
    testResults.workflow1.message = '解析questions失败: ' + e.message;
    printSummary(testResults);
    return;
  }

  console.log(`\n✅ 工作流1完成！`);
  console.log(`   - Session ID: ${sessionId}`);
  console.log(`   - 生成问题数: ${questions.length}`);
  console.log(`   - 职位: ${workflow1Result.job_title}`);
  console.log(`\n📋 生成的问题列表:`);
  questions.forEach((q, idx) => {
    console.log(`   ${idx + 1}. [${q.id}] ${q.question}`);
  });

  testResults.workflow1.passed = true;
  testResults.workflow1.message = `成功生成 ${questions.length} 个问题`;

  // 验证存储
  console.log(`\n⏳ 等待2秒后验证数据存储...`);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const storedSession = await queryStorage(sessionId);
  if (!storedSession || storedSession.error) {
    console.error('❌ 存储验证失败，数据未正确保存');
    console.error('   检查项:');
    console.error('   1. 存储API是否运行: docker ps | grep interview-storage-api');
    console.error('   2. Redis是否连接: docker exec interview-redis redis-cli PING');
    testResults.storage.message = '数据存储验证失败';
  } else {
    console.log(`✅ 存储验证成功！`);
    testResults.storage.passed = true;
    testResults.storage.message = '问题列表已成功保存到存储系统';
  }

  // ========================================
  // 步骤2: 测试工作流2 - 生成答案
  // ========================================
  console.log('\n' + '='.repeat(64));
  console.log('  📝 步骤2: 测试工作流2 - 生成标准答案');
  console.log('='.repeat(64));

  if (questions.length === 0) {
    console.error('❌ 没有问题可供生成答案');
    testResults.workflow2.message = '没有问题可供处理';
    printSummary(testResults);
    return;
  }

  // 为第一个问题生成答案
  const firstQuestion = questions[0];
  console.log(`\n📝 为第一个问题生成答案:`);
  console.log(`   问题ID: ${firstQuestion.id}`);
  console.log(`   问题: ${firstQuestion.question}`);

  const workflow2Result = await callDifyWorkflow('workflow2', {
    session_id: sessionId,
    question_id: firstQuestion.id
  });

  if (!workflow2Result) {
    console.error('❌ 工作流2测试失败');
    testResults.workflow2.message = '工作流调用失败';
    printSummary(testResults);
    return;
  }

  console.log(`\n✅ 工作流2完成！`);
  console.log(`   - 保存状态: ${workflow2Result.save_status}`);
  console.log(`   - 生成答案长度: ${workflow2Result.generated_answer?.length || 0} 字符`);

  if (workflow2Result.generated_answer) {
    console.log(`   - 生成的答案: ${workflow2Result.generated_answer.substring(0, 100)}...`);
  }

  testResults.workflow2.passed = true;
  testResults.workflow2.message = `成功为问题 ${firstQuestion.id} 生成答案`;

  // 验证答案是否保存
  console.log(`\n⏳ 等待2秒后验证答案保存...`);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const updatedSession = await queryStorage(sessionId);
  if (!updatedSession || updatedSession.error) {
    console.error('❌ 答案验证失败');
  } else {
    const updatedQuestion = updatedSession.questions?.find(q => q.id === firstQuestion.id);
    if (updatedQuestion && updatedQuestion.answer) {
      console.log(`✅ 答案验证成功！已找到保存的答案`);
      console.log(`   答案预览: ${updatedQuestion.answer.substring(0, 100)}...`);
    } else {
      console.error('❌ 答案未找到或未保存');
    }
  }

  // ========================================
  // 步骤3: 测试工作流3 - 评分
  // ========================================
  console.log('\n' + '='.repeat(64));
  console.log('  ⭐ 步骤3: 测试工作流3 - 评分');
  console.log('='.repeat(64));

  // 模拟用户答案
  const candidateAnswer = '我对Python装饰器的理解是它是一个用来增强函数功能的强大工具。';

  console.log(`\n⭐ 测试评分:`);
  console.log(`   问题: ${firstQuestion.question}`);
  console.log(`   用户答案: ${candidateAnswer}`);

  const workflow3Result = await callDifyWorkflow('workflow3', {
    session_id: sessionId,
    question_id: firstQuestion.id,
    candidate_answer: candidateAnswer
  });

  if (!workflow3Result) {
    console.error('❌ 工作流3测试失败');
    testResults.workflow3.message = '工作流调用失败';
    printSummary(testResults);
    return;
  }

  console.log(`\n✅ 工作流3完成！`);
  console.log(`   - 总分: ${workflow3Result.overall_score}/100`);
  console.log(`   - 评价: ${workflow3Result.comprehensive_evaluation?.substring(0, 100) || '无'}...`);

  testResults.workflow3.passed = true;
  testResults.workflow3.message = `评分成功: ${workflow3Result.overall_score}/100`;

  // 打印最终总结
  printSummary(testResults);
}

function printSummary(results) {
  console.log('\n' + '='.repeat(64));
  console.log('📊 测试结果总结');
  console.log('='.repeat(64));

  let passCount = 0;
  let totalCount = 0;

  for (const [key, result] of Object.entries(results)) {
    totalCount++;
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${key}: ${result.message}`);
    if (result.passed) passCount++;
  }

  console.log('\n' + '='.repeat(64));
  console.log(`\n总体结果: ${passCount}/${totalCount} 通过`);

  if (passCount === totalCount) {
    console.log('\n🎉 太棒了！所有测试都通过了！');
    console.log('\n✨ 下一步:');
    console.log('  1. ✅ 存储API正常工作');
    console.log('  2. ✅ 工作流1可以生成问题并保存');
    console.log('  3. ✅ 工作流2可以生成答案并保存');
    console.log('  4. ✅ 工作流3可以进行评分');
    console.log('  5. 现在可以集成到后端和前端');
    process.exit(0);
  } else {
    console.log('\n⚠️  有些测试失败了，请检查上面的错误信息');
    console.log('\n🔍 常见问题排查:');
    console.log('  1. 存储API未运行? docker ps | grep interview-storage-api');
    console.log('  2. Redis连接失败? docker logs interview-storage-api');
    console.log('  3. Dify工作流未更新? 检查工作流是否使用正确的存储API URL');
    process.exit(1);
  }
}

// 运行测试
runCompleteTest().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
