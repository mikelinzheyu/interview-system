#!/usr/bin/env node

/**
 * Workflow3 测试脚本 - 评分工作流
 * 测试"评分"功能，对候选人答案进行自动评分
 */

const https = require('https');
const http = require('http');

// Workflow3 配置
const WORKFLOW3 = {
  name: '工作流3 - 评分',
  apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
  workflowId: '7C4guOpDk2GfmIFy',
  apiUrl: 'https://api.dify.ai/v1/workflows/run'
};

// 存储服务配置
const STORAGE_API = {
  baseUrl: 'https://phrenologic-preprandial-jesica.ngrok-free.dev',
  apiKey: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
};

// 通用HTTP请求函数
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    // 对于ngrok隧道，禁用SSL验证
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

// 获取会话和问题数据
async function getTestData() {
  console.log('📋 步骤1：获取会话和问题数据');

  try {
    const sessionResponse = await makeRequest(
      `${STORAGE_API.baseUrl}/api/sessions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STORAGE_API.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        rejectUnauthorized: false
      }
    );

    if (sessionResponse.status !== 200 || !sessionResponse.data.sessions || sessionResponse.data.sessions.length === 0) {
      console.log('❌ 没有找到会话数据');
      return null;
    }

    const sessionId = sessionResponse.data.sessions[0].sessionId;
    console.log(`✅ 找到会话: ${sessionId}`);

    // 获取完整的会话数据
    const detailedResponse = await makeRequest(
      `${STORAGE_API.baseUrl}/api/sessions/${sessionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STORAGE_API.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        rejectUnauthorized: false
      }
    );

    const sessionData = detailedResponse.data.data;
    const questions = sessionData.questions || [];

    if (questions.length === 0) {
      console.log('❌ 会话中没有问题');
      return null;
    }

    // 找一个有标准答案的问题，如果没有就用第一个
    let targetQuestion = questions.find(q => q.answer && q.hasAnswer);
    if (!targetQuestion) {
      targetQuestion = questions[0];
    }

    console.log(`✅ 获取到 ${questions.length} 个问题`);
    console.log(`   - 目标问题ID: ${targetQuestion.id}`);
    console.log(`   - 问题文本预览: ${targetQuestion.question.substring(0, 80)}...`);
    console.log(`   - 有标准答案: ${targetQuestion.hasAnswer ? '是' : '否'}`);

    return {
      sessionId,
      questionId: targetQuestion.id,
      question: targetQuestion.question,
      standardAnswer: targetQuestion.answer || '模拟的标准答案',
      sessionData
    };
  } catch (error) {
    console.error('❌ 获取测试数据失败:', error.message);
    return null;
  }
}

// 测试 Workflow3
async function testWorkflow3() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              Workflow3 - 评分工作流 测试                        ║');
  console.log('║                                                                ║');
  console.log(`║  时间: ${new Date().toLocaleString('zh-CN')}         ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 步骤1: 获取测试数据
    const testData = await getTestData();
    if (!testData) {
      return { success: false, error: '无法获取测试数据' };
    }

    // 步骤2: 准备候选人答案
    console.log('\n📝 步骤2：准备候选人答案');
    const candidateAnswer = `
基于我在生产环境中的实际经验，我设计并实现了一个微服务系统：

系统架构：
- 使用Spring Boot框架，分为10个微服务
- 通过REST API和消息队列通信
- 采用MySQL + Redis存储

我负责的模块：
- 用户认证服务（JWT + OAuth2）
- 订单管理服务（包含缓存优化）

高可用设计：
- 负载均衡
- 服务降级和熔断
- 分布式缓存

可扩展性：
- 水平扩展
- 异步处理
- 数据库分片

这个系统目前支持日均1000万请求，稳定性达到99.9%。
    `.trim();

    console.log(`✅ 候选人答案已准备 (长度: ${candidateAnswer.length} 字符)`);
    console.log(`   预览: ${candidateAnswer.substring(0, 100)}...`);

    // 步骤3: 调用 Workflow3
    console.log('\n📋 步骤3：调用 Workflow3 - 评分');
    console.log(`📤 API URL: ${WORKFLOW3.apiUrl}`);
    console.log(`🔑 Workflow ID: ${WORKFLOW3.workflowId}`);

    const difyPayload = {
      inputs: {
        session_id: testData.sessionId,
        question_id: testData.questionId,
        candidate_answer: candidateAnswer
      },
      user: 'test-user'
    };

    console.log('📝 请求参数:');
    console.log(`   - session_id: ${testData.sessionId}`);
    console.log(`   - question_id: ${testData.questionId}`);
    console.log(`   - candidate_answer: ${candidateAnswer.substring(0, 60)}...`);

    const difyResponse = await makeRequest(
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

    console.log(`\n📦 响应状态码: ${difyResponse.status}`);

    if (difyResponse.status === 200) {
      console.log('✅ Workflow3 调用成功！');

      const outputs = difyResponse.data.data?.outputs || {};

      console.log('\n📊 关键输出:');
      console.log(`  - 总体评分: ${outputs.overall_score !== undefined ? outputs.overall_score : 'N/A'}`);
      console.log(`  - 综合评价长度: ${outputs.comprehensive_evaluation ? outputs.comprehensive_evaluation.length : 0} 字符`);
      console.log(`  - 是否有错误: ${outputs.error ? '是 - ' + outputs.error : '否'}`);

      // 验证返回的字段
      console.log('\n📋 返回字段验证:');
      const requiredFields = ['session_id', 'question_id', 'candidate_answer', 'question', 'standard_answer', 'comprehensive_evaluation', 'overall_score', 'error'];

      let allFieldsPresent = true;
      for (const field of requiredFields) {
        const hasField = field in outputs;
        const symbol = hasField ? '✅' : '❌';
        console.log(`  ${symbol} ${field}: ${hasField ? '有' : '缺失'}`);
        if (!hasField) {
          allFieldsPresent = false;
        }
      }

      if (allFieldsPresent && outputs.overall_score !== undefined) {
        console.log('\n✅ Workflow3 测试通过！');
        console.log(`   - 评分系统工作正常`);
        console.log(`   - 所有输出字段完整`);
        console.log(`   - 评分: ${outputs.overall_score}/100`);
        return { success: true, data: outputs };
      } else {
        console.log('\n⚠️  Workflow3 部分返回字段缺失');
        return { success: false, error: '缺失必要字段', data: outputs };
      }
    } else {
      console.log(`\n❌ Workflow3 调用失败 (状态码: ${difyResponse.status})`);
      console.log('错误响应:');
      console.log(JSON.stringify(difyResponse.data, null, 2));
      return { success: false, error: difyResponse.data };
    }
  } catch (error) {
    console.error('\n❌ 测试过程中出错:');
    console.error(`   错误类型: ${error.name}`);
    console.error(`   错误消息: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主函数
async function main() {
  try {
    const testResult = await testWorkflow3();

    // 总结
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                          测试总结                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (testResult.success) {
      console.log('✅ Workflow3 测试通过！');
      console.log('   - Dify API 连接正常');
      console.log('   - 评分系统工作正常');
      console.log('   - 所有输出字段完整');
      console.log('\n🎉 Workflow3 已准备就绪！');
    } else {
      console.log('❌ Workflow3 测试失败');
      console.log(`   原因: ${testResult.error}`);
      console.log('\n💡 故障排除建议:');
      console.log('   1. 检查Dify Workflow3配置');
      console.log('   2. 确保所有输出字段都已映射');
      console.log('   3. 检查存储服务是否正常运行');
      console.log('   4. 查看workflow3-fixed.yml配置');
    }

  } catch (error) {
    console.error('❌ 主函数错误:');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
main().then(() => {
  console.log('\n\n✅ 测试完成！\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 测试失败:');
  console.error(error);
  process.exit(1);
});
