const https = require('https');

// 尝试用公开 URL ID 作为 Workflow ID
const workflow1 = {
  name: "Workflow1 (生成问题)",
  workflowId: "vEpTYaWI8vURb3ev",  // 公开 URL ID
  apiKey: "app-82F1Uk9YLgO7bDwmyOpTfZdB",
  inputs: {
    job_title: "Python 后端开发工程师"
  }
};

const workflow2 = {
  name: "Workflow2 (生成答案)",
  workflowId: "5X6RBtTFMCZr0r4R",  // 公开 URL ID
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
          console.log('  ✅ SUCCESS!');
          const outputs = parsed.data.outputs;
          console.log('  Output fields: ' + Object.keys(outputs).join(', '));

          console.log('\n  Data received:');
          for (const key in outputs) {
            const value = outputs[key];
            let displayValue;
            if (typeof value === 'string') {
              if (value.length > 80) {
                displayValue = value.substring(0, 80) + '...';
              } else {
                displayValue = value;
              }
            } else if (Array.isArray(value)) {
              displayValue = '[Array with ' + value.length + ' items]';
            } else {
              displayValue = JSON.stringify(value).substring(0, 80);
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
          console.log('    ' + JSON.stringify(parsed, null, 2).substring(0, 200));
          callback(null, parsed);
        }
      } catch (e) {
        console.log('  ⚠️ Parse error: ' + e.message);
        console.log('  Raw: ' + responseData.substring(0, 300));
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
console.log('Testing with Public URL IDs as Workflow IDs');
console.log('='.repeat(70));

testWorkflow(workflow1, (err1, result1) => {
  if (!err1 && result1 && result1.data && result1.data.outputs) {
    console.log('\n✅✅✅ Workflow1 SUCCESS! Found correct ID!');

    const outputs = result1.data.outputs;

    if (outputs.session_id) {
      workflow2.inputs.session_id = outputs.session_id;
    }
    if (outputs.question_id) {
      workflow2.inputs.question_id = outputs.question_id;
    }
    if (outputs.questions_json) {
      console.log('  Questions JSON received: ' + outputs.questions_json.substring(0, 100) + '...');
    }
  } else {
    console.log('\n❌ Workflow1 failed');
  }

  setTimeout(() => {
    testWorkflow(workflow2, (err2) => {
      console.log('\n' + '='.repeat(70));
      console.log('FINAL RESULT');
      console.log('='.repeat(70));

      if (!err1 && result1 && result1.data) {
        console.log('✅ Workflow1: SUCCESS - Correct ID found!');
        console.log('   Workflow1 ID: vEpTYaWI8vURb3ev');
      } else {
        console.log('❌ Workflow1: FAILED');
      }

      if (!err2) {
        console.log('✅ Workflow2: Test completed');
        console.log('   Workflow2 ID: 5X6RBtTFMCZr0r4R');
      } else {
        console.log('⚠️ Workflow2: Error');
      }

      console.log('='.repeat(70));

      process.exit((err1 || err2) ? 1 : 0);
    });
  }, 2000);
});
