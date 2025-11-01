#!/usr/bin/env node

/**
 * 工作流3 测试脚本 - 评分
 */

const https = require('https');

// 工作流3配置
const WORKFLOW3 = {
  name: '工作流3 - 评分',
  apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
  workflowId: '7C4guOpDk2GfmIFy',
  apiUrl: 'https://api.dify.ai/v1/workflows/run'
};

// 通用HTTP请求函数
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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

// 调用工作流3
async function testWorkflow3() {
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║              测试工作流3 - 评分                            ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  // 测试参数 - 使用真实数据
  const testInput = {
    session_id: 'test-session-' + Date.now(),
    question_id: 'test-q1',
    candidate_answer: '我认为Python的装饰器是一种函数式编程技巧，允许在不修改原函数代码的情况下，为函数添加额外的功能。装饰器使用@符号表示，放在函数定义的上一行。',
    standard_answer: '装饰器是Python中的一个重要概念，它是一个函数，接收另一个函数作为参数，然后返回一个新的函数。装饰器可以用来扩展或修改被装饰函数的行为。'
  };

  console.log(`📝 工作流3输入参数:`);
  console.log(JSON.stringify(testInput, null, 2));

  try {
    console.log(`\n📤 调用 ${WORKFLOW3.name}...`);
    console.log(`📍 URL: ${WORKFLOW3.apiUrl}`);

    const response = await makeRequest(
      WORKFLOW3.apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WORKFLOW3.apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      {
        workflow_id: WORKFLOW3.workflowId,
        inputs: testInput,
        user: 'test-user'
      }
    );

    if (response.status === 200) {
      console.log(`✅ 工作流3 - 评分 响应成功 (状态码: 200)`);
      console.log(`\n📦 输出数据:`);
      console.log(JSON.stringify(response.data, null, 2));

      // 分析返回结果
      if (response.data && response.data.outputs) {
        const outputs = response.data.outputs;
        console.log(`\n📊 评分结果:`);
        console.log(`   - Session ID: ${outputs.session_id || 'N/A'}`);
        console.log(`   - 问题 ID: ${outputs.question_id || 'N/A'}`);
        console.log(`   - 分数: ${outputs.score || 'N/A'}`);
        console.log(`   - 反馈: ${(outputs.feedback || 'N/A').substring(0, 100)}...`);
        console.log(`   - 评分状态: ${outputs.save_status || 'N/A'}`);
      }

      console.log(`\n✅ 工作流3 测试成功！\n`);
      return true;
    } else {
      console.log(`❌ 工作流3 - 评分 调用失败 (状态码: ${response.status})`);
      console.log(`   错误信息:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ 工作流3 调用异常:`, error.message);
    return false;
  }
}

// 运行测试
(async () => {
  const success = await testWorkflow3();
  process.exit(success ? 0 : 1);
})();
