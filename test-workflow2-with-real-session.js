#!/usr/bin/env node

/**
 * Workflow2 测试脚本 - 使用真实会话数据
 * 测试"生成标准答案"功能，使用已存在的会话
 */

const https = require('https');
const http = require('http');

// Workflow2 配置
const WORKFLOW2 = {
  name: '工作流2 - 生成答案',
  apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
  workflowId: '5X6RBtTFMCZr0r4R',
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

// 测试步骤：调用Workflow2
async function testWorkflow2() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Workflow2 - 生成标准答案 测试 (使用真实会话数据)            ║');
  console.log('║                                                                ║');
  console.log(`║  时间: ${new Date().toLocaleString('zh-CN')}         ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 步骤1：获取存储中的真实会话
    console.log('📋 步骤1：获取存储中的真实会话数据');
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
      return { success: false, error: '没有找到会话数据' };
    }

    const sessionId = sessionResponse.data.sessions[0].sessionId;
    console.log(`✅ 找到会话: ${sessionId}`);

    // 步骤2：获取完整的会话数据
    console.log(`\n📋 步骤2：获取会话详细数据 - ${sessionId}`);
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
      return { success: false, error: '会话中没有问题' };
    }

    const firstQuestion = questions[0];
    console.log(`✅ 获取到 ${questions.length} 个问题`);
    console.log(`   - 第一个问题ID: ${firstQuestion.id}`);
    console.log(`   - 问题文本预览: ${firstQuestion.question.substring(0, 100)}...`);
    console.log(`   - 当前状态: ${firstQuestion.hasAnswer ? '已有答案' : '无答案'}`);

    // 步骤3：调用Workflow2生成标准答案
    console.log(`\n📋 步骤3：调用 Workflow2 - 生成标准答案`);
    console.log(`📤 API URL: ${WORKFLOW2.apiUrl}`);
    console.log(`🔑 Workflow ID: ${WORKFLOW2.workflowId}`);

    const difyPayload = {
      inputs: {
        session_id: sessionId,
        question_id: firstQuestion.id,
        question_text: firstQuestion.question,
        user_answer: '用户答案'
      },
      user: 'test-user'
    };

    console.log('📝 请求参数:');
    console.log(`   - session_id: ${sessionId}`);
    console.log(`   - question_id: ${firstQuestion.id}`);
    console.log(`   - question_text: ${firstQuestion.question.substring(0, 100)}...`);

    const difyResponse = await makeRequest(
      WORKFLOW2.apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WORKFLOW2.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      },
      difyPayload
    );

    console.log(`\n📦 响应状态码: ${difyResponse.status}`);

    if (difyResponse.status === 200) {
      console.log('✅ Workflow2 调用成功！');

      // 提取关键信息
      const outputs = difyResponse.data.data?.outputs || {};
      console.log('\n📊 关键输出:');
      console.log(`  - 生成的答案长度: ${outputs.generated_answer ? outputs.generated_answer.length : 0} 字符`);
      console.log(`  - 保存状态: ${outputs.save_status || 'N/A'}`);
      console.log(`  - 错误消息: ${outputs.error_message || '无'}`);

      // 验证保存状态
      if (outputs.save_status === '成功') {
        console.log('\n✅ 标准答案保存成功！');

        // 步骤4：验证答案是否真的被保存
        console.log('\n📋 步骤4：验证答案是否被保存到存储');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const verifyResponse = await makeRequest(
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

        const updatedSessionData = verifyResponse.data.data;
        const updatedQuestion = updatedSessionData.questions.find(q => q.id === firstQuestion.id);

        if (updatedQuestion && updatedQuestion.hasAnswer && updatedQuestion.answer) {
          console.log('✅ 答案已成功保存到存储！');
          console.log(`   - 答案长度: ${updatedQuestion.answer.length} 字符`);
          console.log(`   - 答案预览: ${updatedQuestion.answer.substring(0, 100)}...`);
          return { success: true, data: outputs };
        } else {
          console.log('⚠️  答案未在存储中找到');
          return { success: false, error: '答案未被保存到存储' };
        }
      } else if (outputs.save_status === '失败') {
        console.log('\n❌ 标准答案保存失败');
        console.log(`   错误: ${outputs.error_message || '未知错误'}`);
        return { success: false, error: outputs.error_message };
      }
    } else {
      console.log(`\n❌ Workflow2 调用失败 (状态码: ${difyResponse.status})`);
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
    // 运行Workflow2测试
    const testResult = await testWorkflow2();

    // 总结
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                          测试总结                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (testResult.success) {
      console.log('✅ Workflow2 测试通过！');
      console.log('   - Dify API 连接正常');
      console.log('   - 标准答案生成成功');
      console.log('   - 数据保存成功');
      console.log('\n🎉 Workflow2 工作正常！');
    } else {
      console.log('❌ Workflow2 测试失败');
      console.log(`   原因: ${testResult.error}`);
      console.log('\n💡 故障排除建议:');
      console.log('   1. 检查Dify Workflow2配置中的Python代码');
      console.log('   2. 确保已添加 "import socket" 导入');
      console.log('   3. 检查存储服务是否正常运行');
      console.log('   4. 检查ngrok隧道连接状态');
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
