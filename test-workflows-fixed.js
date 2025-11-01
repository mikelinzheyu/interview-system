const https = require('https');

// Workflow 1 配置 - 加上 user 参数
const workflow1 = {
  name: "Workflow1 (生成问题)",
  url: "https://api.dify.ai/v1/workflows/560EB9DDSwOFc8As/run",
  apiKey: "app-WhLg4w9QxdY7vUqbWbYWBWYi",
  inputs: {
    job_title: "Python 后端开发工程师"
  }
};

// Workflow 2 配置
const workflow2 = {
  name: "Workflow2 (生成答案)",
  url: "https://api.dify.ai/v1/workflows/5X6RBtTFMCZr0r4R/run",
  apiKey: "app-TEw1j6rBUw0ZHHlTdJvJFfPB",
  inputs: {
    session_id: "test-session-123",
    question_id: "test-question-1",
    user_answer: "这是一个测试答案",
    job_title: "Python 后端开发工程师"
  }
};

function testWorkflow(workflow, callback) {
  console.log('\n' + '='.repeat(70));
  console.log('Workflow: ' + workflow.name);
  console.log('='.repeat(70));

  // 关键修复: 添加 user 参数
  const requestBody = {
    inputs: workflow.inputs,
    user: "test-user-" + Date.now()  // 添加 user 标识
  };

  const data = JSON.stringify(requestBody);

  const options = {
    headers: {
      'Authorization': 'Bearer ' + workflow.apiKey,
      'Content-Type': 'application/json'
    },
    method: 'POST'
  };

  console.log('Request:');
  console.log('  Method: POST');
  console.log('  URL: ' + workflow.url);
  console.log('  Body: ' + JSON.stringify(requestBody, null, 2));

  const req = https.request(workflow.url, options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('\nResponse:');
      console.log('  Status: ' + res.statusCode);

      try {
        const parsed = JSON.parse(responseData);

        if (parsed.data && parsed.data.outputs) {
          console.log('  ✅ SUCCESS - Outputs received:');
          const outputs = parsed.data.outputs;
          console.log('     Fields: ' + Object.keys(outputs).join(', '));

          // 显示关键字段
          console.log('\n  Data:');
          for (const key in outputs) {
            const value = outputs[key];
            if (typeof value === 'string' && value.length > 50) {
              console.log('    - ' + key + ': ' + value.substring(0, 50) + '...');
            } else {
              console.log('    - ' + key + ': ' + JSON.stringify(value));
            }
          }

          callback(null, parsed);
        } else {
          console.log('  ❌ Error Response:');
          console.log('  ' + JSON.stringify(parsed, null, 2));
          callback(new Error(parsed.message || 'Unknown error'), parsed);
        }
      } catch (e) {
        console.log('  ⚠️ Parse error: ' + e.message);
        console.log('  Raw: ' + responseData.substring(0, 200));
        callback(e);
      }
    });
  });

  req.on('error', (e) => {
    console.error('  Network error: ' + e.message);
    callback(e);
  });

  req.write(data);
  req.end();
}

console.log('\n' + '='.repeat(70));
console.log('FIXED Workflow Test - With user parameter');
console.log('='.repeat(70));

testWorkflow(workflow1, (err1, result1) => {
  if (!err1 && result1 && result1.data && result1.data.outputs) {
    console.log('\n✅ Workflow1 SUCCESS!');
    console.log('Now testing Workflow2 with Workflow1 outputs...\n');

    const outputs = result1.data.outputs;

    // 尝试使用 Workflow1 的输出
    if (outputs.session_id) {
      workflow2.inputs.session_id = outputs.session_id;
    }
    if (outputs.question_id) {
      workflow2.inputs.question_id = outputs.question_id;
    }

    setTimeout(() => {
      testWorkflow(workflow2, (err2) => {
        console.log('\n' + '='.repeat(70));
        if (!err1 && !err2) {
          console.log('✅ BOTH WORKFLOWS SUCCESS!');
        } else {
          console.log('⚠️ Some workflows failed');
        }
        console.log('='.repeat(70));
        process.exit(err1 || err2 ? 1 : 0);
      });
    }, 2000);
  } else {
    console.log('\n❌ Workflow1 failed');
    setTimeout(() => {
      testWorkflow(workflow2, (err2) => {
        console.log('\n' + '='.repeat(70));
        console.log('Test completed');
        console.log('='.repeat(70));
        process.exit(1);
      });
    }, 2000);
  }
});
