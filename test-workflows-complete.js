#!/usr/bin/env node

/**
 * Dify工作流完整测试脚本 (更新版)
 * 测试三个工作流的完整流程：生成问题 -> 生成答案 -> 评分
 */

const https = require('https');
const http = require('http');

// 工作流配置 (修正为正确的API格式)
const WORKFLOWS = {
  workflow1: {
    name: '工作流1 - 生成问题',
    apiKey: 'app-hHvF3glxCRhtfkyX7Pg9i9kb',
    workflowId: '560EB9DDSwOFc8As',
    apiUrl: 'https://api.dify.ai/v1/workflows/run'  // 正确的API端点
  },
  workflow2: {
    name: '工作流2 - 生成答案',
    apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    workflowId: '5X6RBtTFMCZr0r4R',
    apiUrl: 'https://api.dify.ai/v1/workflows/run'  // 正确的API端点
  },
  workflow3: {
    name: '工作流3 - 评分',
    apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
    workflowId: '7C4guOpDk2GfmIFy',
    apiUrl: 'https://api.dify.ai/v1/workflows/run'  // 正确的API端点
  }
};

// 外部存储服务配置 (ngrok隧道 - 已验证)
const STORAGE_APIS = {
  workflow1: {
    baseUrl: 'https://phrenologic-preprandial-jesica.ngrok-free.dev',
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

    // 对于ngrok隧道，禁用SSL验证 (ngrok使用自签名证书)
    if (url.includes('ngrok')) {
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
      // 兼容多种响应格式
      const outputs = response.data?.workflow_run?.outputs || response.data?.data?.outputs || response.data?.outputs || response.data;
      console.log(`📦 输出数据:`, JSON.stringify(outputs, null, 2));
      return outputs;
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

// 查询存储服务
async function queryStorage(storageKey, sessionId, questionId = null) {
  const storageApi = STORAGE_APIS[storageKey];
  // 总是查询完整会话 (统一端点)
  const url = `${storageApi.baseUrl}/api/sessions/${sessionId}`;

  console.log(`\n🔍 查询存储服务: ${url}`);

  try {
    const response = await makeRequest(
      url,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storageApi.apiKey}`
        },
        timeout: 30000
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ 存储查询成功 (状态码 ${response.status})`);

      const session = response.data;

      // 如果指定了 questionId，则从会话中查找对应问题
      if (questionId && session.questions && Array.isArray(session.questions)) {
        const question = session.questions.find(q => q.id === questionId);
        if (question) {
          console.log(`📦 找到问题的答案:`, JSON.stringify(question, null, 2));
          return question;
        } else {
          console.error(`❌ 问题ID ${questionId} 未在会话中找到`);
          return null;
        }
      }

      // 否则返回完整会话
      console.log(`📦 返回数据:`, JSON.stringify(session, null, 2));
      return session;
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
║              Dify 工作流完整功能测试                             ║
║                                                                ║
║  时间: ${new Date().toLocaleString('zh-CN')}                 ║
╚════════════════════════════════════════════════════════════════╝
  `);

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
  console.log(`\n📋 生成的问题列表:`);
  questions.forEach((q, idx) => {
    console.log(`   ${idx + 1}. [${q.id}] ${q.question}`);
  });

  // 验证存储
  console.log(`\n⏳ 等待2秒后验证数据存储...`);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const storedSession = await queryStorage('workflow1', sessionId);
  if (!storedSession || storedSession.error) {
    console.error('❌ 存储验证失败，数据未正确保存');
    return;
  }
  console.log(`✅ 存储验证成功！`);

  // ========================================
  // 步骤2: 测试工作流2 - 生成答案
  // ========================================
  console.log('\n' + '='.repeat(64));
  console.log('  📝 步骤2: 测试工作流2 - 生成标准答案');
  console.log('='.repeat(64));

  if (questions.length === 0) {
    console.error('❌ 没有问题可供生成答案');
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
    return;
  }

  console.log(`\n✅ 工作流2完成！`);
  console.log(`   - 保存状态: ${workflow2Result.save_status}`);
  console.log(`   - 生成答案长度: ${workflow2Result.generated_answer.length} 字符`);

  // 验证答案存储
  console.log(`\n⏳ 等待2秒后验证答案存储...`);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const storedQuestion = await queryStorage('workflow23', sessionId, firstQuestion.id);
  if (!storedQuestion || !storedQuestion.answer) {
    console.error('❌ 答案存储验证失败');
    console.error('   返回数据:', storedQuestion);
    return;
  }

  console.log(`✅ 答案存储验证成功！`);
  console.log(`   标准答案长度: ${storedQuestion.answer.length} 字符`);
  console.log(`   标准答案内容 (前300字):`);
  console.log(`   ${storedQuestion.answer.substring(0, 300)}...`);

  // ========================================
  // 步骤3: 测试工作流3 - 评分
  // ========================================
  console.log('\n' + '='.repeat(64));
  console.log('  🎯 步骤3: 测试工作流3 - 评分');
  console.log('='.repeat(64));

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

  console.log(`\n👤 候选人回答:`);
  console.log(`${candidateAnswer.trim()}`);

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
  console.log(`   - 综合评价:`);
  console.log(`\n${workflow3Result.comprehensive_evaluation}`);

  // ========================================
  // 测试总结
  // ========================================
  console.log('\n' + '='.repeat(64));
  console.log('🎉 测试完成总结');
  console.log('='.repeat(64));
  console.log(`\n✅ 工作流1: 成功生成 ${questions.length} 个问题`);
  console.log(`✅ 工作流2: 成功生成标准答案`);
  console.log(`✅ 工作流3: 成功评分 ${workflow3Result.overall_score}/100`);
  console.log(`✅ 存储服务: 数据正确保存和读取`);

  console.log(`\n📊 测试数据信息:`);
  console.log(`   - Session ID: ${sessionId}`);
  console.log(`   - 职位: ${jobTitle}`);
  console.log(`   - 问题总数: ${questions.length}`);

  console.log(`\n🔗 完整问题列表:`);
  questions.forEach((q, index) => {
    console.log(`   ${index + 1}. [${q.id}] ${q.question}`);
  });

  console.log(`\n✨ 所有测试都已通过！工作流完全可用！\n`);
}

// 运行测试
runCompleteTest().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
