#!/usr/bin/env node

/**
 * Workflow2 测试脚本 - 生成标准答案 (工作流2)
 * 测试"保存标准答案"功能
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
  console.log('║              Workflow2 - 生成标准答案 测试                       ║');
  console.log('║                                                                ║');
  console.log(`║  时间: ${new Date().toLocaleString('zh-CN')}         ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 步骤1：准备测试数据
    console.log('📝 步骤1：准备测试数据');
    const testData = {
      session_id: 'test_session_001',
      question_id: 'q_001',
      question_text: 'Python中如何处理异常？',
      user_answer: '使用try-catch语句'
    };
    console.log('✅ 测试数据已准备：');
    console.log(JSON.stringify(testData, null, 2));

    // 步骤2：调用Workflow2
    console.log('\n📋 步骤2：调用 Workflow2 - 生成标准答案');
    console.log(`📤 API URL: ${WORKFLOW2.apiUrl}`);
    console.log(`🔑 Workflow ID: ${WORKFLOW2.workflowId}`);

    const difyPayload = {
      inputs: {
        session_id: testData.session_id,
        question_id: testData.question_id,
        question_text: testData.question_text,
        user_answer: testData.user_answer
      },
      user: 'test-user'
    };

    console.log('📝 请求负载:');
    console.log(JSON.stringify(difyPayload, null, 2));

    const difyResponse = await makeRequest(
      WORKFLOW2.apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WORKFLOW2.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      },
      difyPayload
    );

    console.log(`\n📦 响应状态码: ${difyResponse.status}`);
    console.log('📦 响应数据:');
    console.log(JSON.stringify(difyResponse.data, null, 2));

    if (difyResponse.status === 200) {
      console.log('\n✅ Workflow2 调用成功！');

      // 提取关键信息
      const outputs = difyResponse.data.data?.outputs || {};
      console.log('\n📊 关键输出:');
      console.log(`  - 生成的答案: ${outputs.generated_answer || 'N/A'}`);
      console.log(`  - 保存状态: ${outputs.save_status || 'N/A'}`);
      console.log(`  - 错误消息: ${outputs.error_message || '无'}`);

      // 验证保存状态
      if (outputs.save_status === '成功') {
        console.log('\n✅ 标准答案保存成功！');
        return { success: true, data: outputs };
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
    console.error(`   堆栈跟踪: ${error.stack}`);
    return { success: false, error: error.message };
  }
}

// 验证存储服务连接
async function verifyStorageService() {
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║            验证存储服务连接                                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    console.log(`📍 存储服务 URL: ${STORAGE_API.baseUrl}`);

    const response = await makeRequest(
      `${STORAGE_API.baseUrl}/api/sessions/test_session_001`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STORAGE_API.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log(`\n📦 响应状态码: ${response.status}`);

    if (response.status === 200) {
      console.log('✅ 存储服务连接成功！');
      console.log('📦 数据:');
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else if (response.status === 404) {
      console.log('⚠️  会话不存在 (这是正常的，第一次测试)');
      return true;
    } else {
      console.log(`⚠️  存储服务返回状态码: ${response.status}`);
      console.log('响应:');
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ 存储服务连接失败:');
    console.error(`   错误: ${error.message}`);
    console.log('\n💡 故障排除建议:');
    console.log('   1. 检查ngrok隧道是否还在运行');
    console.log('   2. 检查本地存储服务 (localhost:8090) 是否在运行');
    console.log('   3. 检查防火墙是否阻止了连接');
    return false;
  }
}

// 主函数
async function main() {
  try {
    // 1. 验证存储服务
    const storageOk = await verifyStorageService();

    // 2. 运行Workflow2测试
    const testResult = await testWorkflow2();

    // 3. 总结
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                          测试总结                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (testResult.success) {
      console.log('✅ Workflow2 测试通过！');
      console.log('   - Dify API 连接正常');
      console.log('   - 标准答案生成成功');
      console.log('   - 数据保存成功');
    } else {
      console.log('❌ Workflow2 测试失败');
      console.log(`   原因: ${testResult.error}`);

      if (!storageOk) {
        console.log('\n💡 可能原因:');
        console.log('   - 存储服务连接失败');
        console.log('   - 检查ngrok隧道和本地服务');
      }
    }

    console.log('\n📚 相关文档:');
    console.log('   - WORKFLOW2_PYTHON_CODE_FIX.md (Python代码修复)');
    console.log('   - QUICK_FIX_WORKFLOW2.md (快速修复指南)');
    console.log('   - DIFY_WORKFLOW2_UPDATE_INSTRUCTIONS.md (详细说明)');

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
