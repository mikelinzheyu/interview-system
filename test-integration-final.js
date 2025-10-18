/**
 * 前后端集成测试脚本 - 最终版本
 * 测试实际可用的API接口
 */
const http = require('http');
const https = require('https');

const tests = [
  {
    name: '后端健康检查',
    method: 'GET',
    url: 'http://localhost:3001/api/health',
    expected: 200
  },
  {
    name: '获取用户信息',
    method: 'GET',
    url: 'http://localhost:3001/api/users/me',
    expected: 200
  },
  {
    name: '获取问题列表',
    method: 'GET',
    url: 'http://localhost:3001/api/questions',
    expected: 200
  },
  {
    name: '获取问题分类',
    method: 'GET',
    url: 'http://localhost:3001/api/questions/categories',
    expected: 200
  },
  {
    name: '获取用户统计数据',
    method: 'GET',
    url: 'http://localhost:3001/api/users/statistics',
    expected: 200
  },
  {
    name: '获取用户排行榜',
    method: 'GET',
    url: 'http://localhost:3001/api/users/leaderboard',
    expected: 200
  },
  {
    name: '生成面试问题',
    method: 'POST',
    url: 'http://localhost:3001/api/interview/generate-question',
    body: { domain: 'javascript', level: 'medium' },
    expected: 200
  },
  {
    name: '分析回答',
    method: 'POST',
    url: 'http://localhost:3001/api/interview/analyze',
    body: { answer: '这是一个测试答案' },
    expected: 200
  },
  {
    name: '前端服务器健康检查',
    method: 'GET',
    url: 'http://localhost:5174/',
    expected: 200
  }
];

function makeRequest(testCase) {
  return new Promise((resolve) => {
    const urlObj = new URL(testCase.url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: testCase.method,
      headers: {
        'User-Agent': 'Integration-Test/1.0',
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          name: testCase.name,
          statusCode: res.statusCode,
          expected: testCase.expected,
          passed: res.statusCode === testCase.expected,
          contentLength: data.length,
          response: data.substring(0, 200)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: testCase.name,
        error: error.message,
        passed: false
      });
    });

    if (testCase.body) {
      req.write(JSON.stringify(testCase.body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 前后端集成测试开始...');
  console.log('='.repeat(80) + '\n');

  const results = [];
  for (const test of tests) {
    const result = await makeRequest(test);
    results.push(result);

    const status = result.passed ? '✅' : '❌';
    if (result.error) {
      console.log(`${status} ${result.name}`);
      console.log(`   错误: ${result.error}\n`);
    } else {
      console.log(`${status} ${result.name}`);
      console.log(`   状态码: ${result.statusCode} (预期: ${result.expected})`);
      console.log(`   响应大小: ${result.contentLength} bytes`);
      if (result.contentLength > 0 && result.contentLength < 200) {
        console.log(`   响应: ${result.response}\n`);
      } else {
        console.log('');
      }
    }
  }

  console.log('='.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`\n📊 测试结果总结`);
  console.log(`   通过: ${passed}/${total}`);
  console.log(`   失败: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n✨ 所有测试通过！前后端通信正常。');
    console.log('\n🎉 系统已准备好进行开发调试！');
    console.log('   前端地址: http://localhost:5174');
    console.log('   后端地址: http://localhost:3001');
    process.exit(0);
  } else {
    console.log('\n⚠️  有些测试失败，请检查服务状态。\n');
    process.exit(1);
  }
}

runTests();
