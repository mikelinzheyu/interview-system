const http = require('http');

const postData = JSON.stringify({
  position: '前端开发工程师',
  level: '中级',
  skills: ['Vue.js', 'JavaScript']
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/interview/generate-question-smart',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n✅ API 返回成功');
    try {
      const json = JSON.parse(data);
      console.log('\n📋 返回数据摘要:');
      console.log('  - source:', json.data?.source);
      console.log('  - usingFallback:', json.data?.usingFallback);
      console.log('  - generatedBy:', json.data?.generatedBy);
      console.log('  - 题目数量:', json.data?.allQuestions?.length);

      if (json.data?.allQuestions?.length > 0) {
        console.log('\n📝 题目列表:');
        json.data.allQuestions.forEach((q, i) => {
          console.log('  ' + (i+1) + '. [' + (q.source || 'unknown') + '] ' + q.question.substring(0, 50) + '...');
        });
      }
    } catch(e) {
      console.log('❌ 解析失败:', e.message);
      console.log('原始数据:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ 请求失败:', e.message);
});

console.log('📤 发送请求到 /api/interview/generate-question-smart...');
req.write(postData);
req.end();
