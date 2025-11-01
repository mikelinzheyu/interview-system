const http = require('http');

function testEndpoint() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      position: "前端开发工程师",
      level: "中级",
      skills: ["Vue.js", "JavaScript"]
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/interview/generate-question-smart',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          console.log('\n📊 API 响应:');
          console.log(JSON.stringify(json, null, 2));

          // 检查题目来源
          if (json.data && json.data.allQuestions && json.data.allQuestions.length > 0) {
            console.log('\n✅ 获得题目:');
            json.data.allQuestions.forEach((q, i) => {
              console.log('  ' + (i+1) + '. ' + q.question.substring(0, 60) + '...');
            });
          }
        } catch(e) {
          console.log('响应:', body);
        }
        resolve();
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

testEndpoint().catch(console.error);
