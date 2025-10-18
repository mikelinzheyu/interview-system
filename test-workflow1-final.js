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
  console.log('🚀 Dify 工作流1 测试 - 已导入修复版本');
  console.log('='.repeat(70) + '\n');

  const apiKey = 'app-dTgOwbWnQQ6rZzTRoPUK7Lz0';
  const apiUrl = 'https://api.dify.ai/v1/workflows/run';

  const testCases = [
    { job_title: 'Python后端开发工程师' },
    { job_title: 'Java高级开发工程师' },
    { job_title: 'Frontend React开发工程师' },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📤 测试 ${i+1}: ${testCase.job_title}`);
    console.log('-'.repeat(70));

    const payload = {
      inputs: {
        job_title: testCase.job_title,
      },
      response_mode: 'blocking',
      user: `test-user-${Date.now()}-${i}`,
    };

    try {
      const response = await makeRequest(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }, payload);

      if (response.statusCode === 200 || response.statusCode === 201) {
        const result = response.body;
        const outputs = result.data && result.data.outputs;

        if (outputs) {
          console.log(`✅ 状态: ${result.data.status}`);
          console.log(`   Session ID: ${outputs.session_id}`);
          console.log(`   问题数量: ${outputs.question_count}`);

          if (outputs.questions_json && outputs.questions_json !== '[]') {
            try {
              const questions = JSON.parse(outputs.questions_json);
              console.log(`\n   📋 生成的面试问题:`);
              if (Array.isArray(questions)) {
                questions.forEach((q, idx) => {
                  const questionText = typeof q === 'string' ? q : (q.question || JSON.stringify(q));
                  console.log(`      ${idx+1}. ${questionText.substring(0, 80)}`);
                });
              }
            } catch (e) {
              console.log(`   问题数据: ${outputs.questions_json.substring(0, 100)}`);
            }
          } else {
            console.log(`⚠️  没有生成问题`);
          }

          if (outputs.error) {
            console.log(`\n⚠️ 工作流错误: ${outputs.error}`);
          }
        }
      } else {
        console.log(`❌ 失败 (${response.statusCode})`);
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }

    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ 测试完成！');
  console.log('='.repeat(70) + '\n');
}

test();
