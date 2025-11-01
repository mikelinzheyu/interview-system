const https = require('https');

// 尝试不同的方式使用 API Key
const apiKey1 = "app-82F1Uk9YLgO7bDwmyOpTfZdB";

// 可能的 Workflow IDs (尝试多种格式)
const possibleIds = [
  "app-82F1Uk9YLgO7bDwmyOpTfZdB",  // 直接用 API Key
  "82F1Uk9YLgO7bDwmyOpTfZdB",       // 去掉 "app-" 前缀
  "82f1uk9ylgo7bdwmyoptfzdb",       // 小写版本
];

const inputData = {
  job_title: "Python 后端开发工程师"
};

function testId(workflowId, callback) {
  console.log('\n' + '='.repeat(70));
  console.log('Testing Workflow ID: ' + workflowId);
  console.log('='.repeat(70));

  const url = 'https://api.dify.ai/v1/workflows/' + workflowId + '/run';

  const requestBody = {
    inputs: inputData,
    user: "test-user-" + Date.now()
  };

  const data = JSON.stringify(requestBody);

  const options = {
    headers: {
      'Authorization': 'Bearer ' + apiKey1,
      'Content-Type': 'application/json'
    },
    method: 'POST'
  };

  console.log('URL: ' + url);

  const req = https.request(url, options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Status: ' + res.statusCode);

      try {
        const parsed = JSON.parse(responseData);

        if (res.statusCode === 200 && parsed.data && parsed.data.outputs) {
          console.log('\n✅✅✅ SUCCESS! CORRECT ID FOUND!');
          console.log('Correct Workflow1 ID: ' + workflowId);
          console.log('\nOutputs:');
          for (const key in parsed.data.outputs) {
            const val = parsed.data.outputs[key];
            console.log('  ' + key + ': ' + String(val).substring(0, 100));
          }
          callback(true, workflowId, parsed);
        } else {
          console.log('Response: ' + parsed.code + ' - ' + parsed.message);
          callback(false, workflowId, parsed);
        }
      } catch (e) {
        console.log('Parse error: ' + e.message);
        callback(false, workflowId, null);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error: ' + e.message);
    callback(false, workflowId, null);
  });

  req.write(data);
  req.end();
}

console.log('Trying different Workflow ID formats...\n');

let successCount = 0;
let index = 0;

function tryNext() {
  if (index < possibleIds.length) {
    const id = possibleIds[index];
    index++;
    testId(id, (success, tried, result) => {
      if (success) {
        successCount++;
      }
      setTimeout(tryNext, 2000);
    });
  } else {
    console.log('\n' + '='.repeat(70));
    if (successCount > 0) {
      console.log('✅ Found ' + successCount + ' working ID(s)');
    } else {
      console.log('❌ No working IDs found');
      console.log('\nThe real Workflow ID must be in a different format.');
      console.log('Please provide the complete API endpoint URL from Dify.');
    }
    console.log('='.repeat(70));
  }
}

tryNext();
