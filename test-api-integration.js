const http = require('http');

const tests = [
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/interview/questions', method: 'GET', name: 'Get Questions' },
  { path: '/api/interview/next-question', method: 'GET', name: 'Get Next Question' },
  { path: '/api/sessions', method: 'GET', name: 'Get Sessions' },
];

async function runTests() {
  console.log('\n🔧 Frontend-Backend Integration Tests via Nginx Proxy\n');
  console.log('═'.repeat(60));

  for (const test of tests) {
    try {
      const options = {
        hostname: 'localhost',
        port: 80,
        path: test.path,
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Integration-Test/1.0'
        }
      };

      const response = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          }));
        });
        req.on('error', reject);
        if (test.body) req.write(JSON.stringify(test.body));
        req.end();
      });

      const statusColor = response.status >= 200 && response.status < 300 ? '✅' : '⚠️';
      console.log(`\n${statusColor} ${test.name}`);
      console.log(`   Method: ${test.method} ${test.path}`);
      console.log(`   Status: ${response.status}`);

      const corsHeader = response.headers['access-control-allow-origin'];
      console.log(`   CORS: ${corsHeader || 'NOT SET'}`);

      if (response.body) {
        try {
          const parsed = JSON.parse(response.body);
          const lines = JSON.stringify(parsed, null, 2).split('\n');
          console.log(`   Response: ${lines.slice(0, 4).join('\n   ')}`);
        } catch (e) {
          console.log(`   Response: ${response.body.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.log(`\n❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Integration Test Complete\n');
}

runTests().catch(console.error);
