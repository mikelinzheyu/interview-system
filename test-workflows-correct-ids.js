const https = require('https');

// 使用正确的 App IDs 作为 Workflow IDs
const workflow1 = {
  name: "Workflow1 (生成问题)",
  appId: "882eab7a-f717-435c-987c-bb0a69c2c60d",
  apiKey: "app-WhLg4w9QxdY7vUqbWbYWBWYi",
  inputs: {
    job_title: "Python 后端开发工程师"
  }
};

const workflow2 = {
  name: "Workflow2 (生成答案)",
  appId: "3c57ab85-037c-4f02-b7d8-574f5ccdd34d",
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

  const url = 'https://api.dify.ai/v1/workflows/' + workflow.appId + '/run';

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

  console.log('Request:');
  console.log('  URL: ' + url);
  console.log('  Auth: Bearer ' + workflow.apiKey.substring(0, 15) + '...');
  console.log('  Inputs: ' + JSON.stringify(workflow.inputs));

  const req = https.request(url, options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('\nResponse:');
      console.log('  Status: ' + res.statusCode);

      try {
        const parsed = JSON.parse(responseData);

        if (res.statusCode === 200 && parsed.data && parsed.data.outputs) {
          console.log('  ✅ SUCCESS');
          const outputs = parsed.data.outputs;
          console.log('  Output fields: ' + Object.keys(outputs).join(', '));

          console.log('\n  Data:');
          for (const key in outputs) {
            const value = outputs[key];
            let displayValue;
            if (typeof value === 'string') {
              if (value.length > 50) {
                displayValue = value.substring(0, 50) + '...';
              } else {
                displayValue = value;
              }
            } else {
              displayValue = JSON.stringify(value);
            }
            console.log('    - ' + key + ': ' + displayValue);
          }

          callback(null, parsed);
        } else if (parsed.code) {
          console.log('  ❌ Error:');
          console.log('    Code: ' + parsed.code);
          console.log('    Message: ' + parsed.message);
          callback(new Error(parsed.message), parsed);
        } else {
          console.log('  ⚠️ Unexpected response:');
          console.log('    ' + JSON.stringify(parsed, null, 2));
          callback(null, parsed);
        }
      } catch (e) {
        console.log('  ⚠️ Parse error: ' + e.message);
        console.log('  Raw response: ' + responseData.substring(0, 300));
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
console.log('Testing Workflows with Correct App IDs');
console.log('='.repeat(70));

let workflow1Result = null;

testWorkflow(workflow1, (err1, result1) => {
  workflow1Result = result1;

  setTimeout(() => {
    if (!err1 && result1 && result1.data && result1.data.outputs) {
      console.log('\n✅ Workflow1 SUCCESS!');
      console.log('Now using Workflow1 outputs for Workflow2...\n');

      const outputs = result1.data.outputs;

      if (outputs.session_id) {
        workflow2.inputs.session_id = outputs.session_id;
        console.log('Updated session_id: ' + outputs.session_id);
      }
      if (outputs.question_id) {
        workflow2.inputs.question_id = outputs.question_id;
        console.log('Updated question_id: ' + outputs.question_id);
      }
    } else {
      console.log('\n⚠️ Workflow1 failed, continuing with default Workflow2 inputs');
    }

    testWorkflow(workflow2, (err2) => {
      console.log('\n' + '='.repeat(70));
      console.log('FINAL SUMMARY');
      console.log('='.repeat(70));

      if (!err1 && workflow1Result && workflow1Result.data) {
        console.log('✅ Workflow1: SUCCESS');
      } else {
        console.log('❌ Workflow1: FAILED');
      }

      console.log('(Workflow2 test completed)');
      console.log('='.repeat(70));

      process.exit((err1 || err2) ? 1 : 0);
    });
  }, 2000);
});
