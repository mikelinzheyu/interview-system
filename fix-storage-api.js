#!/usr/bin/env node

/**
 * 存储API快速修复脚本
 * 自动诊断和修复常见问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function runCommand(cmd, description) {
  try {
    log(`\n▶ ${description}...`, 'cyan');
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} 完成`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} 失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════╗', 'blue');
  log('║      存储API快速修复工具                            ║', 'blue');
  log('║                                                    ║', 'blue');
  log('║  自动诊断和修复Dify工作流的存储API问题            ║', 'blue');
  log('╚════════════════════════════════════════════════════╝\n', 'blue');

  let fixCount = 0;

  // ========================================
  // 步骤1: 停止冲突的容器
  // ========================================
  log('\n📋 步骤1: 检查并停止冲突的Docker容器', 'blue');
  log('─'.repeat(50), 'blue');

  const stopOldStorageResult = await runCommand(
    'docker stop interview-api-java 2>nul || echo "No old container"',
    '停止旧的存储API容器'
  );

  if (stopOldStorageResult.success && stopOldStorageResult.output.includes('interview-api-java')) {
    log('   ✅ 已停止旧的存储API容器', 'green');
    fixCount++;
  }

  // ========================================
  // 步骤2: 启动主项目的存储API
  // ========================================
  log('\n📋 步骤2: 启动主项目的存储API', 'blue');
  log('─'.repeat(50), 'blue');

  const startStorageResult = await runCommand(
    'cd "D:\\code7\\interview-system" && docker-compose up -d interview-storage-api',
    '启动存储API容器'
  );

  if (startStorageResult.success) {
    log('   ✅ 存储API已启动', 'green');
    fixCount++;
  }

  // ========================================
  // 步骤3: 等待容器完全启动
  // ========================================
  log('\n📋 步骤3: 等待容器启动完成', 'blue');
  log('─'.repeat(50), 'blue');

  log('   ⏳ 等待15秒...', 'yellow');
  for (let i = 0; i < 15; i++) {
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('');
  log('   ✅ 等待完成', 'green');
  fixCount++;

  // ========================================
  // 步骤4: 验证存储API连接
  // ========================================
  log('\n📋 步骤4: 验证存储API连接', 'blue');
  log('─'.repeat(50), 'blue');

  const verifyResult = await runCommand(
    '"C:\\Program Files\\nodejs\\node.exe" "D:\\code7\\interview-system\\test-storage-direct.js"',
    '运行存储API测试'
  );

  if (verifyResult.success && verifyResult.output.includes('响应状态: 201')) {
    log('   ✅ 存储API响应正常 (HTTP 201)', 'green');
    fixCount++;
  } else if (verifyResult.success && verifyResult.output.includes('响应状态: 500')) {
    log('   ⚠️  存储API仍有Redis连接问题', 'yellow');
    log('\n   可能的原因:', 'yellow');
    log('   1. Redis容器未启动', 'yellow');
    log('   2. 网络配置问题', 'yellow');
    log('   3. 环境变量未正确设置', 'yellow');
  }

  // ========================================
  // 步骤5: 检查ngrok隧道
  // ========================================
  log('\n📋 步骤5: 检查ngrok隧道', 'blue');
  log('─'.repeat(50), 'blue');

  const ngrokResult = await runCommand(
    '"C:\\Program Files\\nodejs\\node.exe" "D:\\code7\\interview-system\\check-system-status.js"',
    '检查系统状态'
  );

  if (ngrokResult.success) {
    log('   ✅ 系统状态检查完成', 'green');
    fixCount++;
  }

  // ========================================
  // 总结
  // ========================================
  log('\n╔════════════════════════════════════════════════════╗', 'green');
  log(`║  修复完成 - 成功修复 ${fixCount}个项目                      ║`, 'green');
  log('╚════════════════════════════════════════════════════╝\n', 'green');

  if (fixCount >= 5) {
    log('✅ 所有修复步骤已完成！\n', 'green');
    log('下一步：', 'bright');
    log('1. 确保Dify工作流中的Python节点代码已更新', 'cyan');
    log('2. 运行完整工作流测试：', 'cyan');
    log('   node test-workflows-complete.js\n', 'yellow');
  } else {
    log('⚠️  部分修复可能失败，请检查上面的错误信息\n', 'yellow');
    log('排查步骤：', 'bright');
    log('1. 查看WORKFLOW_TESTING_TROUBLESHOOTING.md', 'cyan');
    log('2. 检查Docker容器: docker ps', 'cyan');
    log('3. 检查容器日志: docker logs interview-storage-api\n', 'cyan');
  }
}

main().catch(error => {
  log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
  process.exit(1);
});
