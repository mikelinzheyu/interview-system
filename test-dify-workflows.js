/**
 * Dify工作流完整测试脚本
 * 测试三个工作流的完整流程：生成问题 -> 生成答案 -> 评分
 */

const https = require('https');
const http = require('http');

// 工作流配置
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

// 外部存储服务配置
// 注意：工作流1使用 chestier-unremittently-willis.ngrok-free.dev
// 工作流2和3使用 phrenologic-preprandial-jesica.ngrok-free.dev
const STORAGE_APIS = {
  workflow1: {
    baseUrl: 'https://chestier-unremittently-willis.ngrok-free.dev',
    apiKey: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
  },
  workflow23: {
    baseUrl: 'https://phrenologic-preprandial-jesica.ngrok-free.dev',
    apiKey: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
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
  console.log(`输入参数:`, JSON.stringify(inputs, null, 2));

  try {
    const response = await makeRequest(
      workflow.apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${workflow.apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      {
        inputs,
        response_mode: 'blocking',
        user
      }
    );

    console.log(`✅ ${workflow.name} 响应状态: ${response.status}`);

    if (response.status === 200) {
      console.log(`📦 输出数据:`, JSON.stringify(response.data.data?.outputs || response.data, null, 2));
      return response.data.data?.outputs || response.data;
    } else {
      console.error(`❌ ${workflow.name} 调用失败:`, response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${workflow.name} 调用异常:`, error.message);
    return null;
  }
}

// 查询存储服务
async function queryStorage(sessionId, questionId = null) {
  const url = questionId
    ? `${STORAGE_API.baseUrl}/api/sessions/${sessionId}/questions/${questionId}`
    : `${STORAGE_API.baseUrl}/api/sessions/${sessionId}`;

  console.log(`\n🔍 查询存储服务: ${url}`);

  try {
    const response = await makeRequest(
      url,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STORAGE_API.apiKey}`
        }
      }
    );

    console.log(`✅ 存储查询成功 (状态 ${response.status})`);
    console.log(`📦 数据:`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`❌ 存储查询失败:`, error.message);
    return null;
  }
}

// 主测试流程
async function runCompleteTest() {
  console.log('🚀 开始Dify工作流完整测试\n');
  console.log('=' .repeat(80));

  // ========================================
  // 步骤1: 测试工作流1 - 生成问题
  // ========================================
  console.log('\n📋 步骤1: 测试工作流1 - 生成问题');
  console.log('=' .repeat(80));

  const jobTitle = 'Python后端开发工程师';
  const workflow1Result = await callDifyWorkflow('workflow1', {
    job_title: jobTitle
  });

  if (!workflow1Result) {
    console.error('❌ 工作流1测试失败，终止测试');
    return;
  }

  // 提取session_id和questions
  const sessionId = workflow1Result.session_id;
  let questions = [];

  try {
    questions = JSON.parse(workflow1Result.questions);
  } catch (e) {
    console.error('❌ 解析questions失败:', e.message);
    return;
  }

  console.log(`\n✅ 工作流1完成！`);
  console.log(`   - Session ID: ${sessionId}`);
  console.log(`   - 生成问题数: ${questions.length}`);
  console.log(`   - 职位: ${workflow1Result.job_title}`);

  // 验证存储
  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
  const storedSession = await queryStorage(sessionId);

  if (!storedSession || storedSession.error) {
    console.error('❌ 存储验证失败，数据未正确保存');
    return;
  }

  console.log(`✅ 存储验证成功！`);

  // ========================================
  // 步骤2: 测试工作流2 - 为每个问题生成答案
  // ========================================
  console.log('\n\n📝 步骤2: 测试工作流2 - 生成标准答案');
  console.log('=' .repeat(80));

  if (questions.length === 0) {
    console.error('❌ 没有问题可供生成答案');
    return;
  }

  // 为第一个问题生成答案（可以修改为循环所有问题）
  const firstQuestion = questions[0];
  console.log(`\n为第一个问题生成答案:`);
  console.log(`   问题ID: ${firstQuestion.id}`);
  console.log(`   问题: ${firstQuestion.question}`);

  const workflow2Result = await callDifyWorkflow('workflow2', {
    session_id: sessionId,
    question_id: firstQuestion.id
  });

  if (!workflow2Result) {
    console.error('❌ 工作流2测试失败');
    return;
  }

  console.log(`\n✅ 工作流2完成！`);
  console.log(`   - 保存状态: ${workflow2Result.save_status}`);

  // 验证答案存储
  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
  const storedQuestion = await queryStorage(sessionId, firstQuestion.id);

  if (!storedQuestion || !storedQuestion.answer) {
    console.error('❌ 答案存储验证失败');
    return;
  }

  console.log(`✅ 答案存储验证成功！`);
  console.log(`   标准答案长度: ${storedQuestion.answer.length} 字符`);

  // ========================================
  // 步骤3: 测试工作流3 - 评分
  // ========================================
  console.log('\n\n🎯 步骤3: 测试工作流3 - 评分');
  console.log('=' .repeat(80));

  const candidateAnswer = `
  Python后端开发需要掌握以下核心技能：
  1. Python语言基础和高级特性，包括装饰器、生成器、上下文管理器等
  2. Web框架如Django或Flask的使用，理解MVC/MVT架构
  3. 数据库操作，包括SQL和ORM（如SQLAlchemy、Django ORM）
  4. RESTful API设计和实现
  5. 异步编程（asyncio, aiohttp等）
  6. 性能优化和缓存策略（Redis等）
  7. 单元测试和集成测试
  8. 版本控制（Git）和CI/CD流程
  `;

  console.log(`\n候选人回答:`, candidateAnswer.trim());

  const workflow3Result = await callDifyWorkflow('workflow3', {
    session_id: sessionId,
    question_id: firstQuestion.id,
    candidate_answer: candidateAnswer.trim()
  });

  if (!workflow3Result) {
    console.error('❌ 工作流3测试失败');
    return;
  }

  console.log(`\n✅ 工作流3完成！`);
  console.log(`   - 综合评分: ${workflow3Result.overall_score}/100`);
  console.log(`   - 综合评价:\n${workflow3Result.comprehensive_evaluation}`);

  // ========================================
  // 测试总结
  // ========================================
  console.log('\n\n' + '='.repeat(80));
  console.log('🎉 测试完成总结');
  console.log('='.repeat(80));
  console.log(`✅ 工作流1: 成功生成 ${questions.length} 个问题`);
  console.log(`✅ 工作流2: 成功生成标准答案`);
  console.log(`✅ 工作流3: 成功评分 ${workflow3Result.overall_score}/100`);
  console.log(`✅ 存储服务: 数据正确保存和读取`);
  console.log('\n📊 测试数据:');
  console.log(`   - Session ID: ${sessionId}`);
  console.log(`   - 职位: ${jobTitle}`);
  console.log(`   - 问题总数: ${questions.length}`);
  console.log('\n🔗 可以使用以下信息继续测试其他问题:');
  questions.forEach((q, index) => {
    console.log(`   ${index + 1}. ${q.id}: ${q.question}`);
  });
}

// 运行测试
runCompleteTest().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
