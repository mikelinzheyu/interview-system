const https = require('https');

// Workflow 1 配置
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
    user_answer: "测试答案",
    job_title: "Python 后端开发工程师"
  }
};

function testWorkflow(workflow, callback) {
  console.log('\n' + '='.repeat(60));
  console.log('Test: ' + workflow.name);
  console.log('='.repeat(60));
  console.log('URL: ' + workflow.url);
  console.log('Inputs: ' + JSON.stringify(workflow.inputs, null, 2));

  const data = JSON.stringify({
    inputs: workflow.inputs
  });

  const options = {
    headers: {
      'Authorization': 'Bearer ' + workflow.apiKey,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    },
    method: 'POST'
  };

  const req = https.request(workflow.url, options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('\nStatus: ' + res.statusCode);

      try {
        const parsed = JSON.parse(responseData);
        console.log('Response: ' + JSON.stringify(parsed, null, 2));

        if (parsed.data && parsed.data.outputs) {
          console.log('\nOutput fields: ' + Object.keys(parsed.data.outputs).join(', '));
        }

        callback(null, parsed);
      } catch (e) {
        console.log('Response (raw): ' + responseData);
        console.log('Parse error: ' + e.message);
        callback(null, {raw: responseData});
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error: ' + e.message);
    callback(e);
  });

  req.write(data);
  req.end();
}

console.log('Starting workflow diagnosis...');

testWorkflow(workflow1, (err1, result1) => {
  console.log('\nWorkflow1 result: ' + JSON.stringify(result1, null, 2));

  if (!err1 && result1 && result1.data && result1.data.outputs) {
    const outputs = result1.data.outputs;

    console.log('\nUsing Workflow1 outputs for Workflow2...');
    console.log('  session_id: ' + (outputs.session_id || 'missing'));
    console.log('  question_id: ' + (outputs.question_id || 'missing'));

    workflow2.inputs.session_id = outputs.session_id || 'missing';
    workflow2.inputs.question_id = outputs.question_id || 'missing';

    setTimeout(() => {
      testWorkflow(workflow2, (err2) => {
        console.log('\n' + '='.repeat(60));
        console.log('Diagnosis complete');
        console.log('='.repeat(60));
        process.exit(err1 || err2 ? 1 : 0);
      });
    }, 2000);
  } else {
    console.log('\nWorkflow1 output incomplete or error');
    console.log('Trying Workflow2 anyway with default inputs...');
    setTimeout(() => {
      testWorkflow(workflow2, (err2) => {
        console.log('\n' + '='.repeat(60));
        console.log('Diagnosis complete');
        console.log('='.repeat(60));
        process.exit(1);
      });
    }, 2000);
  }
});
