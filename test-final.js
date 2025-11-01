const https = require('https');

// 使用正确的 IDs 和新的 API Keys
const workflow1 = {
  name: "Workflow1 (生成问题)",
  workflowId: "882eab7a-f717-435c-987c-bb0a69c2c60d",
  apiKey: "app-82F1Uk9YLgO7bDwmyOpTfZdB",
  inputs: {
    job_title: "Python 后端开发工程师"
  }
};

const workflow2 = {
  name: "Workflow2 (生成答案)",
  workflowId: "3c57ab85-037c-4f02-b7d8-574f5ccdd34d",
  apiKey: "app-TEw1j6rBUw0ZHHlTdJvJFfPB",
  inputs: {
    session_id: "test-session-123",
    question_id: "test-question-1",
    user_answer: "这是一个测试答案",
    job_title: "Python 后端开发工程师"
  }
};

function testWorkflow(workflow, callback) {
  console.log('\n' + '='.repeat(80));
  console.log('测试: ' + workflow.name);
  console.log('='.repeat(80));

  const url = 'https://api.dify.ai/v1/workflows/' + workflow.workflowId + '/run';

  const requestBody = {
    inputs: workflow.inputs,
    user: "test-user-" + Date.now()
  };

  const data = JSON.stringify(requestBody);

  const options = {
    headers: {
      'Authorization': 'Bearer ' + workflow.apiKey,
      'Content-Type': 'application/json'
    },
    method: 'POST'
  };

  console.log('请求:');
  console.log('  URL: ' + url);
  console.log('  API Key: ' + workflow.apiKey.substring(0, 15) + '...');
  console.log('  输入: ' + JSON.stringify(workflow.inputs));

  const req = https.request(url, options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('\n响应:');
      console.log('  状态码: ' + res.statusCode);

      try {
        const parsed = JSON.parse(responseData);

        if (res.statusCode === 200 && parsed.data && parsed.data.outputs) {
          console.log('\n  ✅✅✅ 成功!');
          const outputs = parsed.data.outputs;
          console.log('  输出字段: ' + Object.keys(outputs).join(', '));

          console.log('\n  数据:');
          for (const key in outputs) {
            const value = outputs[key];
            let displayValue;
            if (typeof value === 'string') {
              displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
            } else if (Array.isArray(value)) {
              displayValue = '[数组, 长度: ' + value.length + ']';
            } else {
              displayValue = JSON.stringify(value).substring(0, 100);
            }
            console.log('    ' + key + ': ' + displayValue);
          }

          callback(null, parsed);
        } else {
          console.log('  ❌ 错误:');
          if (parsed.code) {
            console.log('    代码: ' + parsed.code);
            console.log('    消息: ' + parsed.message);
          } else {
            console.log('    ' + JSON.stringify(parsed).substring(0, 200));
          }
          callback(new Error(parsed.message || '未知错误'), parsed);
        }
      } catch (e) {
        console.log('  ⚠️ 解析错误: ' + e.message);
        console.log('  原始: ' + responseData.substring(0, 300));
        callback(e);
      }
    });
  });

  req.on('error', (e) => {
    console.error('  网络错误: ' + e.message);
    callback(e);
  });

  req.write(data);
  req.end();
}

console.log('\n' + '='.repeat(80));
console.log('最终测试 - 使用正确的 App ID 和新的 API Keys');
console.log('='.repeat(80));

let workflow1Result = null;

testWorkflow(workflow1, (err1, result1) => {
  workflow1Result = result1;

  setTimeout(() => {
    if (!err1 && result1 && result1.data && result1.data.outputs) {
      console.log('\n✅ Workflow1 成功!');
      console.log('现在使用 Workflow1 的输出测试 Workflow2...\n');

      const outputs = result1.data.outputs;

      if (outputs.session_id) {
        workflow2.inputs.session_id = outputs.session_id;
        console.log('更新 session_id: ' + outputs.session_id);
      }
      if (outputs.question_id) {
        workflow2.inputs.question_id = outputs.question_id;
        console.log('更新 question_id: ' + outputs.question_id);
      }
    } else {
      console.log('\n⚠️ Workflow1 失败，继续测试 Workflow2...');
    }

    testWorkflow(workflow2, (err2) => {
      console.log('\n' + '='.repeat(80));
      console.log('最终结果');
      console.log('='.repeat(80));

      if (!err1 && workflow1Result && workflow1Result.data) {
        console.log('✅ Workflow1: 成功');
      } else {
        console.log('❌ Workflow1: 失败');
      }

      if (!err2) {
        console.log('✅ Workflow2: 成功 (或测试完成)');
      } else {
        console.log('❌ Workflow2: 失败');
      }

      console.log('='.repeat(80) + '\n');

      process.exit((err1 || err2) ? 1 : 0);
    });
  }, 2000);
});
