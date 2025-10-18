#!/usr/bin/env node

const https = require('https');

function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    };

    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: body ? JSON.parse(body) : body,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body,
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Dify 工作流1 测试 - 使用标准 API 格式');
  console.log('='.repeat(70) + '\n');

  const workflowUUID = '7f26145f-7808-4d71-94d8-ea375ee7a2e9';
  const apiKey = 'app-dTgOwbWnQQ6rZzTRoPUK7Lz0';

  const apiUrl = `https://api.dify.ai/v1/workflows/${workflowUUID}/run`;

  const payload = {
    inputs: {
      job_title: 'Python后端开发工程师',
    },
    response_mode: 'blocking',
    user: `test-user-${Date.now()}`,
  };

  try {
    console.log('📤 调用 Dify 工作流1...');
    console.log('URL:', apiUrl);
    console.log('\n请求数据:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n等待响应...\n');

    const response = await makeRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }, payload);

    console.log('HTTP 状态码:', response.statusCode);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('\n✅ 工作流调用成功！\n');

      const result = response.body;
      console.log('完整响应:');
      console.log(JSON.stringify(result, null, 2));

      if (result.data && result.data.outputs) {
        const outputs = result.data.outputs;
        console.log('\n' + '='.repeat(70));
        console.log('📊 工作流输出结果:');
        console.log('='.repeat(70));

        if (outputs.session_id) {
          console.log('✅ Session ID:', outputs.session_id);
        }
        if (outputs.job_title) {
          console.log('✅ 职位:', outputs.job_title);
        }
        if (outputs.question_count) {
          console.log('✅ 问题数量:', outputs.question_count);
        }

        if (outputs.questions_json) {
          try {
            const questions = JSON.parse(outputs.questions_json);
            console.log('\n📋 生成的问题:');
            if (Array.isArray(questions)) {
              questions.forEach((q, i) => {
                const questionText = typeof q === 'string' ? q : (q.question || q);
                console.log(`   ${i+1}. ${questionText}`);
              });
            } else {
              console.log('   ', JSON.stringify(questions, null, 2));
            }
          } catch (e) {
            console.log('📋 问题数据:', outputs.questions_json);
          }
        }

        if (outputs.error && outputs.error !== '') {
          console.log('\n⚠️ 错误信息:', outputs.error);
        } else if (!outputs.error) {
          console.log('\n✅ 没有错误，问题已成功保存到存储服务！');
        }
      } else {
        console.log('\n📝 响应数据:');
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      console.log('\n❌ 工作流调用失败！');
      console.log('状态码:', response.statusCode);
      console.log('\n响应:');
      if (typeof response.body === 'string') {
        console.log(response.body);
      } else {
        console.log(JSON.stringify(response.body, null, 2));
      }
    }
  } catch (error) {
    console.log('\n❌ 错误:', error.message);
    console.log(error.stack);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

test();
