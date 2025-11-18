/**
 * AI 多轮对话功能完整测试
 * 测试 AI 助手能否进行连续的多轮对话，不出现错误
 */

const http = require('http');

// 测试配置
const API_BASE = 'http://localhost:3001';
const API_ENDPOINT = '/api/ai/chat/stream';
const TEST_USER_ID = 'test-user-001';
const TEST_POST_ID = 'test-post-001';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(type, message) {
  const timestamp = new Date().toISOString();
  const prefix = type === 'ERROR' ? colors.red + '❌ ERROR' :
                 type === 'SUCCESS' ? colors.green + '✅ SUCCESS' :
                 type === 'INFO' ? colors.cyan + 'ℹ️ INFO' :
                 type === 'WARN' ? colors.yellow + '⚠️ WARN' :
                 colors.blue + '📝 TEST';
  console.log(`${prefix}${colors.reset} [${timestamp}] ${message}`);
}

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            parsedBody: res.headers['content-type']?.includes('application/json') ?
              JSON.parse(data) : data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testHealthCheck() {
  log('TEST', '测试 1: 后端健康检查');
  try {
    const response = await makeRequest('/health');
    if (response.status === 200) {
      log('SUCCESS', '后端服务正常运行');
      return true;
    } else {
      log('ERROR', `健康检查失败: ${response.status}`);
      return false;
    }
  } catch (err) {
    log('ERROR', `健康检查异常: ${err.message}`);
    return false;
  }
}

async function testFirstMessage() {
  log('TEST', '测试 2: 第一条 AI 消息（应获得 conversationId）');

  const articleContent = 'JavaScript 中的 async/await 是处理异步操作的现代方式。它建立在 Promise 的基础上，使异步代码看起来更像同步代码，从而提高代码的可读性和可维护性。async 函数总是返回一个 Promise，await 只能在 async 函数内使用，它会暂停函数执行直到 Promise 解决。';

  const queryParams = new URLSearchParams({
    message: '你好，请介绍一下 JavaScript 的 async/await',
    articleContent: articleContent,
    postId: TEST_POST_ID,
    userId: TEST_USER_ID,
    token: 'dev-token-for-testing'
  });

  const path = `${API_ENDPOINT}?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer dev-token-for-testing`
      }
    };

    let response = '';
    let conversationId = null;
    let hasError = false;
    let hasData = false;

    const req = http.request(options, (res) => {
      log('INFO', `第一条消息响应状态: ${res.statusCode}`);

      res.on('data', (chunk) => {
        const text = chunk.toString();
        response += text;
        hasData = true;

        // 尝试从响应数据中提取 conversationId
        if (text.includes('conversationId')) {
          const match = text.match(/"conversationId":"([^"]+)"/);
          if (match) {
            conversationId = match[1];
            log('INFO', `✨ 已获得 conversationId: ${conversationId}`);
          }
        }

        // 检查是否有错误
        if (text.includes('"error"') || text.includes('ERROR')) {
          hasError = true;
        }
      });

      res.on('end', () => {
        if (hasData && !hasError && response.length > 0) {
          log('SUCCESS', `第一条消息接收成功，收到 ${response.length} 字节数据`);
          resolve({
            success: true,
            conversationId: conversationId,
            response: response,
            hasError: hasError
          });
        } else if (hasError) {
          log('ERROR', `第一条消息返回错误`);
          resolve({
            success: false,
            conversationId: conversationId,
            response: response,
            hasError: true
          });
        } else {
          log('WARN', `第一条消息没有收到数据`);
          resolve({
            success: false,
            conversationId: conversationId,
            response: response,
            hasError: false
          });
        }
      });
    });

    req.on('error', (err) => {
      log('ERROR', `第一条消息请求失败: ${err.message}`);
      resolve({
        success: false,
        conversationId: null,
        error: err.message
      });
    });

    req.end();
  });
}

async function testSecondMessage(conversationId) {
  log('TEST', `测试 3: 第二条 AI 消息（使用 conversationId: ${conversationId}）`);

  if (!conversationId) {
    log('ERROR', '没有有效的 conversationId，无法进行第二条消息测试');
    return {
      success: false,
      error: 'No conversationId'
    };
  }

  const articleContent = 'JavaScript 中的 async/await 是处理异步操作的现代方式。它建立在 Promise 的基础上，使异步代码看起来更像同步代码，从而提高代码的可读性和可维护性。async 函数总是返回一个 Promise，await 只能在 async 函数内使用，它会暂停函数执行直到 Promise 解决。';

  const queryParams = new URLSearchParams({
    message: '请继续解释 async/await 的实际应用场景',
    articleContent: articleContent,
    postId: TEST_POST_ID,
    userId: TEST_USER_ID,
    conversationId: conversationId,
    token: 'dev-token-for-testing'
  });

  const path = `${API_ENDPOINT}?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer dev-token-for-testing`
      }
    };

    let response = '';
    let hasError = false;
    let hasData = false;

    const req = http.request(options, (res) => {
      log('INFO', `第二条消息响应状态: ${res.statusCode}`);

      res.on('data', (chunk) => {
        const text = chunk.toString();
        response += text;
        hasData = true;

        // 检查是否有错误信息
        if (text.includes('"error"') || text.includes('ERROR') || text.includes('对话出错')) {
          hasError = true;
        }
      });

      res.on('end', () => {
        if (hasData && !hasError && response.length > 0) {
          log('SUCCESS', `第二条消息接收成功，收到 ${response.length} 字节数据`);
          resolve({
            success: true,
            response: response,
            hasError: false
          });
        } else if (hasError) {
          log('ERROR', `第二条消息返回错误 - 多轮对话失败！`);
          resolve({
            success: false,
            response: response,
            hasError: true
          });
        } else {
          log('WARN', `第二条消息没有收到数据`);
          resolve({
            success: false,
            response: response,
            hasError: false
          });
        }
      });
    });

    req.on('error', (err) => {
      log('ERROR', `第二条消息请求失败: ${err.message}`);
      resolve({
        success: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function testThirdMessage(conversationId) {
  log('TEST', `测试 4: 第三条 AI 消息（验证持续对话能力）`);

  if (!conversationId) {
    log('ERROR', '没有有效的 conversationId，无法进行第三条消息测试');
    return {
      success: false,
      error: 'No conversationId'
    };
  }

  const articleContent = 'JavaScript 中的 async/await 是处理异步操作的现代方式。它建立在 Promise 的基础上，使异步代码看起来更像同步代码，从而提高代码的可读性和可维护性。async 函数总是返回一个 Promise，await 只能在 async 函数内使用，它会暂停函数执行直到 Promise 解决。';

  const queryParams = new URLSearchParams({
    message: '能举一个真实的代码例子吗？',
    articleContent: articleContent,
    postId: TEST_POST_ID,
    userId: TEST_USER_ID,
    conversationId: conversationId,
    token: 'dev-token-for-testing'
  });

  const path = `${API_ENDPOINT}?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer dev-token-for-testing`
      }
    };

    let response = '';
    let hasError = false;
    let hasData = false;

    const req = http.request(options, (res) => {
      log('INFO', `第三条消息响应状态: ${res.statusCode}`);

      res.on('data', (chunk) => {
        const text = chunk.toString();
        response += text;
        hasData = true;

        if (text.includes('"error"') || text.includes('ERROR') || text.includes('对话出错')) {
          hasError = true;
        }
      });

      res.on('end', () => {
        if (hasData && !hasError && response.length > 0) {
          log('SUCCESS', `第三条消息接收成功 - 多轮对话正常工作！`);
          resolve({
            success: true,
            response: response,
            hasError: false
          });
        } else if (hasError) {
          log('ERROR', `第三条消息返回错误`);
          resolve({
            success: false,
            response: response,
            hasError: true
          });
        } else {
          log('WARN', `第三条消息没有收到数据`);
          resolve({
            success: false,
            response: response,
            hasError: false
          });
        }
      });
    });

    req.on('error', (err) => {
      log('ERROR', `第三条消息请求失败: ${err.message}`);
      resolve({
        success: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}========== AI 多轮对话功能测试 ==========${colors.reset}\n`);

  const results = {
    healthCheck: false,
    firstMessage: false,
    secondMessage: false,
    thirdMessage: false,
    conversationId: null
  };

  // 测试 1: 健康检查
  results.healthCheck = await testHealthCheck();

  if (!results.healthCheck) {
    log('ERROR', '后端未就绪，无法进行后续测试');
    printSummary(results);
    return results;
  }

  // 等待一会儿
  await new Promise(r => setTimeout(r, 1000));

  // 测试 2: 第一条消息
  const firstMsgResult = await testFirstMessage();
  results.firstMessage = firstMsgResult.success;
  results.conversationId = firstMsgResult.conversationId;

  if (!results.firstMessage) {
    log('ERROR', '第一条消息测试失败，无法进行多轮对话测试');
    printSummary(results);
    return results;
  }

  // 等待一会儿
  await new Promise(r => setTimeout(r, 1000));

  // 测试 3: 第二条消息
  const secondMsgResult = await testSecondMessage(results.conversationId);
  results.secondMessage = secondMsgResult.success;

  if (!results.secondMessage) {
    log('ERROR', '第二条消息测试失败 - 这是关键问题，多轮对话不能正常工作');
    printSummary(results);
    return results;
  }

  // 等待一会儿
  await new Promise(r => setTimeout(r, 1000));

  // 测试 4: 第三条消息
  const thirdMsgResult = await testThirdMessage(results.conversationId);
  results.thirdMessage = thirdMsgResult.success;

  printSummary(results);
  return results;
}

function printSummary(results) {
  console.log(`\n${colors.bright}${colors.cyan}========== 测试总结 ==========${colors.reset}\n`);

  console.log('测试结果:');
  console.log(`  ${results.healthCheck ? '✅' : '❌'} 后端健康检查: ${results.healthCheck ? '通过' : '失败'}`);
  console.log(`  ${results.firstMessage ? '✅' : '❌'} 第一条消息: ${results.firstMessage ? '通过' : '失败'}`);
  console.log(`  ${results.secondMessage ? '✅' : '❌'} 第二条消息: ${results.secondMessage ? '通过' : '失败'}`);
  console.log(`  ${results.thirdMessage ? '✅' : '❌'} 第三条消息: ${results.thirdMessage ? '通过' : '失败'}`);

  console.log(`\nconversationId: ${results.conversationId || 'N/A'}`);

  const allPassed = results.healthCheck && results.firstMessage && results.secondMessage && results.thirdMessage;
  console.log(`\n${colors.bright}${allPassed ? colors.green : colors.red}整体结果: ${allPassed ? '✅ 所有测试通过！多轮对话功能正常' : '❌ 存在失败的测试，需要进一步调查'}${colors.reset}\n`);

  if (!allPassed && results.secondMessage === false) {
    console.log(`${colors.red}${colors.bright}关键问题: 第二条消息失败，多轮对话无法正常进行${colors.reset}\n`);
  }
}

// 运行所有测试
runAllTests().catch(err => {
  log('ERROR', `测试执行异常: ${err.message}`);
  console.error(err);
  process.exit(1);
});
