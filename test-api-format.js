const https = require('https');

// 测试多种请求格式
const tests = [
  {
    name: "Format 1: 标准 Bearer Token",
    headers: {
      'Authorization': 'Bearer app-WhLg4w9QxdY7vUqbWbYWBWYi',
      'Content-Type': 'application/json'
    },
    body: {
      inputs: { job_title: "Python 后端开发工程师" }
    }
  },
  {
    name: "Format 2: API-Key Header",
    headers: {
      'API-Key': 'app-WhLg4w9QxdY7vUqbWbYWBWYi',
      'Content-Type': 'application/json'
    },
    body: {
      inputs: { job_title: "Python 后端开发工程师" }
    }
  },
  {
    name: "Format 3: Authorization as API-Key",
    headers: {
      'Authorization': 'app-WhLg4w9QxdY7vUqbWbYWBWYi',
      'Content-Type': 'application/json'
    },
    body: {
      inputs: { job_title: "Python 后端开发工程师" }
    }
  }
];

function testFormat(test, callback) {
  console.log('\n' + '='.repeat(70));
  console.log('Testing: ' + test.name);
  console.log('='.repeat(70));

  const data = JSON.stringify(test.body);
  console.log('Body: ' + data);
  console.log('Headers: ' + JSON.stringify(test.headers, null, 2));

  const options = {
    hostname: 'api.dify.ai',
    path: '/v1/workflows/560EB9DDSwOFc8As/run',
    method: 'POST',
    headers: Object.assign({
      'Content-Length': Buffer.byteLength(data)
    }, test.headers)
  };

  const req = https.request(options, (res) => {
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
          console.log('\n✅ SUCCESS! Found outputs');
          console.log('Fields: ' + Object.keys(parsed.data.outputs).join(', '));
        } else if (parsed.code === 'bad_request') {
          console.log('\n❌ Bad request error');
        } else {
          console.log('\n⚠️ Other response');
        }
      } catch (e) {
        console.log('Response (raw): ' + responseData);
      }

      callback(res.statusCode);
    });
  });

  req.on('error', (e) => {
    console.error('Network error: ' + e.message);
    callback(null);
  });

  req.write(data);
  req.end();
}

console.log('\nTesting different API request formats for Workflow1\n');

let index = 0;
function runNext() {
  if (index < tests.length) {
    const test = tests[index];
    index++;
    testFormat(test, () => {
      setTimeout(runNext, 2000);
    });
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('All tests completed');
    console.log('='.repeat(70));
  }
}

runNext();
