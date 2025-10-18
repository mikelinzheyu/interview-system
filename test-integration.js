/**
 * 前后端集成测试脚本
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
    name: '前端健康检查',
    method: 'GET',
    url: 'http://localhost:5174/',
    expected: 200
  },
  {
    name: '获取登录QR码',
    method: 'GET',
    url: 'http://localhost:3001/api/auth/qrcode',
    expected: 200
  },
  {
    name: '获取用户信息',
    method: 'GET',
    url: 'http://localhost:3001/api/user/profile',
    expected: 200
  },
  {
    name: '获取问题列表',
    method: 'GET',
    url: 'http://localhost:3001/api/questions',
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
        'User-Agent': 'Integration-Test/1.0'
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
          contentLength: data.length
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

    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 前后端集成测试开始...\n');
  console.log('='.repeat(80));

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
      console.log(`   数据大小: ${result.contentLength} bytes\n`);
    }
  }

  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('✨ 所有测试通过！前后端通信正常。\n');
    process.exit(0);
  } else {
    console.log('⚠️  有些测试失败，请检查服务状态。\n');
    process.exit(1);
  }
}

runTests();
