#!/usr/bin/env node

const https = require('https');

// 工作流配置
const workflows = {
  workflow1: {
    apiKey: 'app-hHvF3glxCRhtfkyX7Pg9i9kb',
    workflowId: '560EB9DDSwOFc8As'
  },
  workflow2: {
    apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    workflowId: '5X6RBtTFMCZr0r4R'
  }
};

function makeRequest(apiKey, workflowId, inputs) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.dify.ai',
      port: 443,
      path: `/v1/workflows/${workflowId}/run`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ raw: responseData, error: e.message });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({
      inputs: inputs,
      response_mode: 'blocking',
      user: 'test-user'
    }));
    req.end();
  });
}

async function testWorkflows() {
  console.log('='.repeat(70));
  console.log('测试工作流1 - 生成问题');
  console.log('='.repeat(70));

  const w1Config = workflows.workflow1;
  const w1Response = await makeRequest(
    w1Config.apiKey,
    w1Config.workflowId,
    { job_title: 'Python后端开发工程师' }
  );

  console.log('\n【工作流1 完整响应】:');
  console.log(JSON.stringify(w1Response, null, 2));

  // 从工作流1获取session_id和question_id
  let sessionId = '';
  let questionId = '';

  if (w1Response.data && w1Response.data.session_id) {
    sessionId = w1Response.data.session_id;
    console.log(`\n✅ 获取到 Session ID: ${sessionId}`);

    // 解析questions获取第一个question_id
    try {
      const questions = JSON.parse(w1Response.data.questions);
      if (questions.length > 0) {
        questionId = questions[0].id;
        console.log(`✅ 获取到 Question ID: ${questionId}`);
        console.log(`✅ 问题内容: ${questions[0].question}`);
      }
    } catch (e) {
      console.log(`❌ 解析questions失败: ${e.message}`);
    }
  } else {
    console.log('\n❌ 工作流1返回数据不正确');
    console.log('错误信息:', w1Response.message || w1Response.error);
    return;
  }

  // 等待2秒
  console.log('\n⏳ 等待2秒...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n' + '='.repeat(70));
  console.log('测试工作流2 - 生成答案');
  console.log('='.repeat(70));

  const w2Config = workflows.workflow2;
  const w2Response = await makeRequest(
    w2Config.apiKey,
    w2Config.workflowId,
    {
      session_id: sessionId,
      question_id: questionId
    }
  );

  console.log('\n【工作流2 完整响应】:');
  console.log(JSON.stringify(w2Response, null, 2));

  if (w2Response.data) {
    console.log('\n【工作流2 输出数据详细信息】:');
    const dataKeys = Object.keys(w2Response.data);
    console.log(`  - 输出字段数: ${dataKeys.length}`);
    console.log(`  - 字段名称: ${dataKeys.join(', ')}`);

    Object.entries(w2Response.data).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 100) {
        console.log(`\n  ${key}: ${value.substring(0, 150)}...`);
      } else if (typeof value === 'string') {
        console.log(`\n  ${key}: ${value}`);
      } else {
        console.log(`\n  ${key}:`, value);
      }
    });
  } else {
    console.log('\n❌ 工作流2返回数据为空或出错');
    console.log('错误信息:', w2Response.message || w2Response.error);
  }

  console.log('\n' + '='.repeat(70));
  console.log('测试完成');
  console.log('='.repeat(70));
}

testWorkflows().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
