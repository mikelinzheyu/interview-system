const https = require('https');

// Workflow 1 配置 - 使用正确的 Dify 格式
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
  console.log('Testing inputs: ' + JSON.stringify(workflow.inputs));

  const requestBody = {
    inputs: workflow.inputs
  };

  const data = JSON.stringify(requestBody);

  const options = {
    headers: {
      'Authorization': 'Bearer ' + workflow.apiKey,
      'Content-Type': 'application/json'
    },
    method: 'POST'
  };

  console.log('\nRequest Details:');
  console.log('  Method: POST');
  console.log('  URL: ' + workflow.url);
  console.log('  Auth: Bearer ' + workflow.apiKey.substring(0, 10) + '...');
  console.log('  Body: ' + data);

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

        if (parsed.data) {
          console.log('  Has data: YES');
          if (parsed.data.outputs) {
            console.log('  Output fields:', Object.keys(parsed.data.outputs));
            console.log('  Full output:', JSON.stringify(parsed.data.outputs, null, 2));
          }
        } else if (parsed.code === 'bad_request') {
          console.log('  ERROR - Bad Request:');
          console.log('    Code: ' + parsed.code);
          console.log('    Message: ' + parsed.message);
          console.log('\n  Possible causes:');
          console.log('    1. Invalid input field names for this workflow');
          console.log('    2. Invalid API key or workflow ID');
          console.log('    3. Missing required input fields');
        } else {
          console.log('  Response: ' + JSON.stringify(parsed, null, 2));
        }

        callback(null, parsed);
      } catch (e) {
        console.log('  Raw response: ' + responseData.substring(0, 200));
        callback(null, {raw: responseData});
      }
    });
  });

  req.on('error', (e) => {
    console.error('  Network error: ' + e.message);
    callback(e);
  });

  console.log('\nSending request...');
  req.write(data);
  req.end();
}

console.log('\n\nSTART: Workflow Diagnosis');
console.log('This will test both workflows and identify issues\n');

testWorkflow(workflow1, (err1, result1) => {
  setTimeout(() => {
    if (!err1 && result1 && result1.data && result1.data.outputs) {
      console.log('\n>>> Workflow1 SUCCESS - Using outputs for Workflow2');

      const outputs = result1.data.outputs;
      workflow2.inputs.session_id = outputs.session_id || 'unknown';
      workflow2.inputs.question_id = outputs.question_id || 'unknown';

      console.log('Updated Workflow2 inputs:');
      console.log('  session_id: ' + workflow2.inputs.session_id);
      console.log('  question_id: ' + workflow2.inputs.question_id);
    }

    testWorkflow(workflow2, (err2) => {
      console.log('\n' + '='.repeat(70));
      console.log('SUMMARY:');
      console.log('='.repeat(70));

      if (!err1 && result1 && result1.data) {
        console.log('✓ Workflow1: OK');
      } else {
        console.log('✗ Workflow1: FAILED');
        console.log('  Issue: Check input field names, API key, and workflow ID');
      }

      if (!err2 && result2 && result2.data) {
        console.log('✓ Workflow2: OK');
      } else {
        console.log('✗ Workflow2: FAILED');
        console.log('  Issue: Check input field names, API key, and workflow ID');
      }

      console.log('='.repeat(70) + '\n');
    });
  }, 3000);
});
