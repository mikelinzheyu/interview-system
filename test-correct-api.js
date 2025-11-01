const https = require('https');
const url = require('url');

// 根据 Dify API 文档，使用公开工作流 API
const workflow1 = {
  name: "Workflow1 (生成问题)",
  publicId: "vEpTYaWI8vURb3ev",  // 公开 URL 中的 ID
  apiKey: "app-82F1Uk9YLgO7bDwmyOpTfZdB",
  inputs: {
    job_title: "Python 后端开发工程师"
  }
};

const workflow2 = {
  name: "Workflow2 (生成答案)",
  publicId: "5X6RBtTFMCZr0r4R",  // 公开 URL 中的 ID
  apiKey: "app-TEw1j6rBUw0ZHHlTdJvJFfPB",
  inputs: {
    session_id: "test-session-123",
    question_id: "test-question-1",
    user_answer: "这是一个测试答案",
    job_title: "Python 后端开发工程师"
  }
};

function testWorkflow(workflow, usePublicEndpoint, callback) {
  console.log('\n' + '='.repeat(80));
  console.log('测试: ' + workflow.name);
  console.log('='.repeat(80));

  let fullUrl;
  if (usePublicEndpoint) {
    // 使用公开工作流端点: POST /workflows/run (通过公开 ID)
    fullUrl = 'https://api.dify.ai/v1/workflows/run?workflow_id=' + workflow.publicId;
  } else {
    // 使用内部工作流端点: POST /workflows/:workflow_id/run
    fullUrl = 'https://api.dify.ai/v1/workflows/' + workflow.publicId + '/run';
  }

  const requestBody = {
    inputs: workflow.inputs,
    response_mode: "blocking",
    user: "test-user-" + Date.now()
  };

  const data = JSON.stringify(requestBody);

  console.log('请求:');
  console.log('  URL: ' + fullUrl);
  console.log('  方法: POST');
  console.log('  API Key: ' + workflow.apiKey.substring(0, 15) + '...');
  console.log('  输入: ' + JSON.stringify(workflow.inputs));
  console.log('  Response Mode: blocking');

  const options = {
    hostname: 'api.dify.ai',
    port: 443,
    path: usePublicEndpoint ? '/v1/workflows/run?workflow_id=' + workflow.publicId : '/v1/workflows/' + workflow.publicId + '/run',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + workflow.apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
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
          console.log('  执行状态: ' + parsed.data.status);
          console.log('  耗时: ' + parsed.data.elapsed_time + 's');

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
          console.log('  ❌ 错误或不完整的响应:');
          if (parsed.code) {
            console.log('    代码: ' + parsed.code);
            console.log('    消息: ' + parsed.message);
          } else if (parsed.error) {
            console.log('    错误: ' + parsed.error);
          } else {
            console.log('    ' + JSON.stringify(parsed, null, 2).substring(0, 300));
          }
          callback(new Error(parsed.message || parsed.error || '未知错误'), parsed);
        }
      } catch (e) {
        console.log('  ⚠️ 解析错误: ' + e.message);
        console.log('  原始响应: ' + responseData.substring(0, 300));
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
console.log('使用 Dify 官方 API 测试公开工作流');
console.log('='.repeat(80));
console.log('\n根据 Dify 文档，公开工作流使用: POST /workflows/run');
console.log('或: POST /workflows/:workflow_id/run\n');

let workflow1Result = null;

// 首先尝试公开端点
testWorkflow(workflow1, true, (err1, result1) => {
  workflow1Result = result1;

  if (err1) {
    console.log('\n公开端点失败，尝试标准端点...');
    testWorkflow(workflow1, false, (err1b, result1b) => {
      workflow1Result = result1b;
      continueToWorkflow2();
    });
  } else {
    continueToWorkflow2();
  }

  function continueToWorkflow2() {
    setTimeout(() => {
      if (!err1 && workflow1Result && workflow1Result.data && workflow1Result.data.outputs) {
        console.log('\n✅ Workflow1 成功!');
        console.log('现在测试 Workflow2...\n');

        const outputs = workflow1Result.data.outputs;

        if (outputs.session_id) {
          workflow2.inputs.session_id = outputs.session_id;
        }
        if (outputs.question_id) {
          workflow2.inputs.question_id = outputs.question_id;
        }
      }

      // 尝试公开端点
      testWorkflow(workflow2, true, (err2, result2) => {
        if (err2) {
          console.log('\n公开端点失败，尝试标准端点...');
          testWorkflow(workflow2, false, (err2b, result2b) => {
            showResults(err1, err2b);
          });
        } else {
          showResults(err1, err2);
        }
      });
    }, 2000);
  }

  function showResults(err1, err2) {
    console.log('\n' + '='.repeat(80));
    console.log('最终结果');
    console.log('='.repeat(80));

    if (!err1 && workflow1Result && workflow1Result.data) {
      console.log('✅ Workflow1: 成功');
    } else {
      console.log('❌ Workflow1: 失败');
    }

    if (!err2) {
      console.log('✅ Workflow2: 成功');
    } else {
      console.log('❌ Workflow2: 失败');
    }

    console.log('='.repeat(80) + '\n');

    process.exit((err1 || err2) ? 1 : 0);
  }
});
