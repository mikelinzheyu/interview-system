#!/usr/bin/env node

/**
 * Dify 工作流测试脚本 (通过 nginx)
 *
 * 这个脚本测试所有 3 个 Dify 工作流通过本地 nginx 反向代理
 *
 * 前置条件:
 * 1. nginx 运行在 localhost:80
 * 2. 存储服务运行在 localhost:8080
 * 3. Dify 工作流已配置好 API 端点
 *
 * 使用方法:
 *   node test-workflows-via-nginx.js
 */

const http = require('http');

// 配置
const CONFIG = {
  STORAGE_BASE_URL: 'http://localhost', // 通过 nginx
  API_KEY: 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
  WORKFLOW1_ID: '工作流1的ID', // 需要从 Dify 获取
  WORKFLOW2_ID: '工作流2的ID', // 需要从 Dify 获取
  WORKFLOW3_ID: '工作流3的ID', // 需要从 Dify 获取
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testStorageService() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 测试 1: 存储服务可用性', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const response = await httpRequest({
      hostname: 'localhost',
      port: 80,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.statusCode === 200) {
      log('✅ 存储服务健康检查: 通过', 'green');
      log(`   响应: ${JSON.stringify(response.body)}`, 'green');
      return true;
    } else {
      log('❌ 存储服务返回错误状态码: ' + response.statusCode, 'red');
      return false;
    }
  } catch (error) {
    log('❌ 存储服务连接失败: ' + error.message, 'red');
    return false;
  }
}

async function createTestSession() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 测试 2: 创建测试会话', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const sessionData = {
      sessionId: `test-session-${Date.now()}`,
      userId: 'test-user-001',
      interviewType: 'technical',
      domain: 'backend',
      level: 'senior',
      questions: [
        {
          questionId: 'q1',
          question: '你能详细介绍你在Python项目中的架构设计经验吗?',
          standardAnswer: '良好的架构设计应该包括系统分层、模块化设计、高内聚低耦合等',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await httpRequest(
      {
        hostname: 'localhost',
        port: 80,
        path: '/api/sessions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.API_KEY}`,
        },
      },
      sessionData
    );

    if (response.statusCode === 200 || response.statusCode === 201) {
      log('✅ 会话创建成功', 'green');
      log(`   会话ID: ${sessionData.sessionId}`, 'green');
      log(`   响应状态: ${response.statusCode}`, 'green');
      return sessionData.sessionId;
    } else {
      log(`❌ 会话创建失败 (状态码: ${response.statusCode})`, 'red');
      log(`   响应: ${JSON.stringify(response.body)}`, 'red');
      return null;
    }
  } catch (error) {
    log('❌ 会话创建请求异常: ' + error.message, 'red');
    return null;
  }
}

async function testWorkflow1() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 工作流 1: 生成问题', 'cyan');
  log('='.repeat(60), 'cyan');

  const testData = {
    session_id: `wf1-test-${Date.now()}`,
    job_title: 'Python后端开发工程师',
    experience_level: 'senior',
    domain: 'backend',
    requirements: '应该考察候选人的系统设计和架构能力',
  };

  try {
    // 这里需要实际的 Dify API 端点
    log('ℹ️  工作流1 需要 Dify 实际的 API 端点配置', 'yellow');
    log('   当前 nginx 代理到: http://localhost/api/', 'yellow');
    log('   输入参数:', 'yellow');
    log(JSON.stringify(testData, null, 2), 'yellow');
  } catch (error) {
    log('❌ 工作流1 测试异常: ' + error.message, 'red');
  }
}

async function testWorkflow2() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 工作流 2: 生成标准答案', 'cyan');
  log('='.repeat(60), 'cyan');

  const testData = {
    session_id: `wf2-test-${Date.now()}`,
    question_id: 'q1',
    question: '你能详细介绍你在Python项目中的架构设计经验吗?',
    job_title: 'Python后端开发工程师',
    context: '候选人应该展示他们在大型项目中的架构经验',
  };

  try {
    log('ℹ️  工作流2 需要 Dify 实际的 API 端点配置', 'yellow');
    log('   当前 nginx 代理到: http://localhost/api/', 'yellow');
    log('   输入参数:', 'yellow');
    log(JSON.stringify(testData, null, 2), 'yellow');
  } catch (error) {
    log('❌ 工作流2 测试异常: ' + error.message, 'red');
  }
}

async function testWorkflow3() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 工作流 3: 评分答案', 'cyan');
  log('='.repeat(60), 'cyan');

  const testData = {
    session_id: `wf3-test-${Date.now()}`,
    question_id: 'q1',
    question: '你能详细介绍你在Python项目中的架构设计经验吗?',
    candidate_answer: '我在一个电商项目中使用了微服务架构。我设计了商品服务、订单服务和用户服务。使用Django和FastAPI框架。',
    standard_answer: '良好的架构设计应该包括：1. 系统分层 2. 模块化设计 3. 高内聚低耦合 4. 性能考虑 5. 可维护性',
    job_title: 'Python后端开发工程师',
  };

  try {
    log('ℹ️  工作流3 需要 Dify 实际的 API 端点配置', 'yellow');
    log('   当前 nginx 代理到: http://localhost/api/', 'yellow');
    log('   输入参数:', 'yellow');
    log(JSON.stringify(testData, null, 2), 'yellow');
  } catch (error) {
    log('❌ 工作流3 测试异常: ' + error.message, 'red');
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('🚀 Dify 工作流测试 (通过 nginx)', 'blue');
  log('='.repeat(60), 'blue');

  // 测试存储服务
  const storageOk = await testStorageService();
  if (!storageOk) {
    log('\n❌ 存储服务不可用，无法继续测试', 'red');
    process.exit(1);
  }

  // 创建测试会话
  const sessionId = await createTestSession();

  // 测试工作流
  await testWorkflow1();
  await testWorkflow2();
  await testWorkflow3();

  // 总结
  log('\n' + '='.repeat(60), 'blue');
  log('📊 测试总结', 'blue');
  log('='.repeat(60), 'blue');
  log('✅ 本地 nginx 和存储服务正常运行', 'green');
  log('⏳ 等待 Dify 工作流配置更新为使用 nginx (http://localhost/api/)', 'yellow');
  log('\n下一步:', 'cyan');
  log('1. 在 Dify UI 中更新所有工作流的 API 端点地址', 'cyan');
  log('2. 将 ngrok URL 替换为 http://localhost/api/', 'cyan');
  log('3. 重新运行此脚本以完整测试工作流', 'cyan');
  log('\n' + '='.repeat(60) + '\n', 'blue');
}

main().catch((error) => {
  log('❌ 测试失败: ' + error.message, 'red');
  process.exit(1);
});
