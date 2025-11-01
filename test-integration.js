#!/usr/bin/env node

/**
 * 前后端集成测试脚本
 */

const http = require('http');

const config = {
  backendUrl: 'http://localhost:3001',
  testTimeout: 5000
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(type, message) {
  const timestamp = new Date().toISOString();
  const typeColors = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.cyan,
    test: colors.blue
  };
  const color = typeColors[type] || colors.reset;
  console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.backendUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: config.testTimeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  前后端集成测试                        ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  let passed = 0, failed = 0;

  try {
    // 1. 健康检查
    log('test', '测试: 后端健康检查');
    const health = await makeRequest('GET', '/api/health');
    if (health.statusCode === 200 && health.body?.data?.status === 'UP') {
      log('success', '✓ 后端健康检查通过');
      passed++;
    } else {
      log('error', '✗ 后端健康检查失败');
      failed++;
    }

    // 2. 启动面试
    log('test', '测试: 启动面试');
    const interview = await makeRequest('POST', '/api/interviews/start', {
      jobPosition: '前端工程师',
      jobDescription: '3年经验',
      difficulty: 'intermediate'
    });
    if (interview.statusCode === 200 && interview.body?.data?.interviewId) {
      log('success', `✓ 启动面试成功 (ID: ${interview.body.data.interviewId})`);
      passed++;

      const interviewId = interview.body.data.interviewId;

      // 3. 获取问题
      log('test', '测试: 获取当前问题');
      const question = await makeRequest('GET', `/api/interviews/${interviewId}/question`);
      if (question.statusCode === 200 && question.body?.data?.questionId) {
        log('success', `✓ 获取问题成功`);
        passed++;

        // 4. 提交答案
        log('test', '测试: 提交答案');
        const answer = await makeRequest('POST', '/api/interviews/submit-answer', {
          interviewId: interviewId,
          questionId: question.body.data.questionId,
          answer: '测试答案'
        });
        if (answer.statusCode === 200) {
          log('success', '✓ 答案提交成功');
          passed++;
        } else {
          log('error', '✗ 答案提交失败');
          failed++;
        }

        // 5. 结束面试
        log('test', '测试: 结束面试');
        const end = await makeRequest('POST', '/api/interviews/end', {
          interviewId: interviewId
        });
        if (end.statusCode === 200) {
          log('success', '✓ 面试结束成功');
          passed++;
        } else {
          log('error', '✗ 面试结束失败');
          failed++;
        }
      } else {
        log('error', '✗ 获取问题失败');
        failed += 3;
      }
    } else {
      log('error', '✗ 启动面试失败');
      failed += 4;
    }

  } catch (error) {
    log('error', `测试执行失败: ${error.message}`);
    failed++;
  }

  console.log(`\n${colors.cyan}════════════════════════════════════════${colors.reset}`);
  console.log(`总计: ${colors.green}${passed} 个通过${colors.reset}, ${colors.red}${failed} 个失败${colors.reset}`);
  console.log(`成功率: ${colors.blue}${((passed / (passed + failed)) * 100).toFixed(2)}%${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════${colors.reset}\n`);

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(error => {
  log('error', `测试失败: ${error.message}`);
  process.exit(1);
});
