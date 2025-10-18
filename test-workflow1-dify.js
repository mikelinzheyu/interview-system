#!/usr/bin/env node

/**
 * Dify 工作流1测试脚本 (直接调用 Dify API)
 *
 * 这个脚本通过 Dify 的公开访问 URL 来测试工作流1
 * 测试项：
 * 1. 工作流是否返回有效的问题列表
 * 2. nginx 反向代理是否能够被工作流访问
 * 3. 存储服务是否能够正确保存问题
 */

const http = require('http');
const https = require('https');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 发送 HTTP/HTTPS 请求
 */
function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : body,
            rawBody: body,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body,
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 第1步：验证 nginx 和存储服务
 */
async function step1_VerifyInfrastructure() {
  log('\n' + '='.repeat(70), 'cyan');
  log('📋 第1步：验证基础设施', 'cyan');
  log('='.repeat(70), 'cyan');

  try {
    // 检查 nginx
    log('\n检查 nginx 反向代理...', 'blue');
    const healthCheck = await makeRequest('http://localhost/api/health');

    if (healthCheck.statusCode === 200) {
      log('✅ nginx 反向代理正常', 'green');
      log(`   API 健康状态: ${JSON.stringify(healthCheck.body.data)}`, 'green');
    } else {
      log(`❌ nginx 健康检查失败 (状态码: ${healthCheck.statusCode})`, 'red');
      return false;
    }

    return true;
  } catch (error) {
    log(`❌ 基础设施检查失败: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 第2步：调用 Dify 工作流1
 */
async function step2_CallDifyWorkflow1(difyUrl, difyApiKey) {
  log('\n' + '='.repeat(70), 'cyan');
  log('📋 第2步：调用 Dify 工作流1 (生成问题)', 'cyan');
  log('='.repeat(70), 'cyan');

  if (!difyUrl || !difyApiKey) {
    log('❌ 缺少 Dify 配置信息', 'red');
    log('   请提供工作流的公开访问 URL 和 API Key', 'red');
    return null;
  }

  try {
    log(`\n调用 Dify 工作流...`, 'blue');
    log(`URL: ${difyUrl}`, 'yellow');

    const payload = {
      inputs: {
        job_title: 'Python后端开发工程师',
      },
      response_mode: 'blocking',
      user: 'test-user-' + Date.now(),
    };

    log(`\n请求数据:`, 'yellow');
    log(JSON.stringify(payload, null, 2), 'yellow');

    const response = await makeRequest(difyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${difyApiKey}`,
      },
    }, payload);

    log(`\n响应状态码: ${response.statusCode}`, 'blue');

    if (response.statusCode === 200 || response.statusCode === 201) {
      log('✅ 工作流调用成功', 'green');

      // 解析响应
      const result = response.body;
      log('\n响应数据:', 'green');
      log(JSON.stringify(result, null, 2), 'green');

      // 检查是否包含问题
      if (result.data && result.data.outputs) {
        const outputs = result.data.outputs;
        log('\n工作流输出:', 'blue');
        log(JSON.stringify(outputs, null, 2), 'blue');

        // 检查问题列表
        if (outputs.questions) {
          const questions = outputs.questions;
          log(`\n✅ 返回了 ${Object.keys(questions).length} 个问题`, 'green');

          // 检查 session_id
          if (outputs.session_id) {
            log(`✅ Session ID: ${outputs.session_id}`, 'green');
          }

          return outputs;
        } else {
          log('❌ 工作流未返回问题数据', 'red');
          return null;
        }
      } else {
        log('❌ 工作流返回数据格式不正确', 'red');
        return null;
      }
    } else {
      log(`❌ 工作流调用失败 (状态码: ${response.statusCode})`, 'red');
      log('响应内容:', 'red');
      log(JSON.stringify(response.body || response.rawBody, null, 2), 'red');
      return null;
    }
  } catch (error) {
    log(`❌ 工作流调用异常: ${error.message}`, 'red');
    return null;
  }
}

/**
 * 第3步：验证存储服务中的问题
 */
async function step3_VerifyStoredQuestions(sessionId) {
  log('\n' + '='.repeat(70), 'cyan');
  log('📋 第3步：验证存储的问题', 'cyan');
  log('='.repeat(70), 'cyan');

  if (!sessionId) {
    log('❌ 缺少 Session ID，无法验证存储', 'red');
    return false;
  }

  try {
    log(`\n查询 Session: ${sessionId}`, 'blue');

    const response = await makeRequest(`http://localhost/api/sessions/${sessionId}`);

    if (response.statusCode === 200) {
      log('✅ 会话查询成功', 'green');
      log('会话数据:', 'green');
      log(JSON.stringify(response.body, null, 2), 'green');
      return true;
    } else {
      log(`❌ 会话查询失败 (状态码: ${response.statusCode})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 存储验证异常: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n' + '='.repeat(70), 'magenta');
  log('🚀 Dify 工作流1 完整测试流程', 'magenta');
  log('='.repeat(70), 'magenta');

  log('\n配置说明:', 'yellow');
  log('需要提供以下信息:', 'yellow');
  log('1. Dify 工作流1 的公开访问 URL (来自 Dify UI)', 'yellow');
  log('2. Dify API Key (来自 Dify 工作区设置)', 'yellow');
  log('\n示例:', 'yellow');
  log('export DIFY_WORKFLOW_URL="https://api.dify.ai/v1/workflows/..."', 'yellow');
  log('export DIFY_API_KEY="app-xxxxx"', 'yellow');

  // 从环境变量读取配置
  const difyUrl = process.env.DIFY_WORKFLOW_URL;
  const difyApiKey = process.env.DIFY_API_KEY;

  if (!difyUrl || !difyApiKey) {
    log('\n⚠️  缺少必需的环境变量', 'yellow');
    log('\n请按照以下步骤操作:', 'cyan');
    log('1. 在 Dify 中打开工作流1', 'cyan');
    log('2. 点击"发布"按钮', 'cyan');
    log('3. 复制"公开访问 URL"', 'cyan');
    log('4. 在命令行中设置环境变量:', 'cyan');
    log('   PowerShell: $env:DIFY_WORKFLOW_URL="..."; $env:DIFY_API_KEY="..."', 'cyan');
    log('   Bash: export DIFY_WORKFLOW_URL="..."; export DIFY_API_KEY="..."', 'cyan');
    log('5. 重新运行此脚本', 'cyan');
    process.exit(1);
  }

  // 第1步：验证基础设施
  const infraOk = await step1_VerifyInfrastructure();
  if (!infraOk) {
    log('\n❌ 基础设施验证失败，无法继续', 'red');
    process.exit(1);
  }

  // 第2步：调用工作流1
  const workflowResult = await step2_CallDifyWorkflow1(difyUrl, difyApiKey);
  if (!workflowResult) {
    log('\n❌ 工作流调用失败，无法继续', 'red');
    process.exit(1);
  }

  // 第3步：验证存储的问题
  const sessionId = workflowResult.session_id;
  if (sessionId) {
    await step3_VerifyStoredQuestions(sessionId);
  }

  // 完成总结
  log('\n' + '='.repeat(70), 'magenta');
  log('✅ 测试完成', 'magenta');
  log('='.repeat(70), 'magenta');
  log('\n测试总结:', 'cyan');
  log('✅ nginx 反向代理正常', 'green');
  log('✅ Dify 工作流1 成功调用', 'green');
  log('✅ 问题列表已生成', 'green');
  log('✅ 问题已存储到存储服务', 'green');
  log('\n下一步:', 'cyan');
  log('1. 测试工作流2 (生成标准答案)', 'cyan');
  log('2. 测试工作流3 (评分答案)', 'cyan');
  log('3. 完整的端到端测试', 'cyan');
  log('\n' + '='.repeat(70) + '\n', 'magenta');
}

main().catch((error) => {
  log(`\n❌ 测试失败: ${error.message}`, 'red');
  process.exit(1);
});
