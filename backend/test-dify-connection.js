#!/usr/bin/env node

/**
 * Dify API 连接测试脚本
 * 快速验证 API 密钥和连接是否正常
 *
 * 使用方式：
 * node backend/test-dify-connection.js
 */

const chatWorkflowService = require('./services/chatWorkflowService');

async function testDifyConnection() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Dify API 连接测试                    ║');
  console.log('╚════════════════════════════════════════╝\n');

  // 1. 检查配置
  console.log('📋 步骤 1: 检查配置...');
  const isConfigured = chatWorkflowService.checkConfiguration();
  console.log(`   配置状态: ${isConfigured ? '✅ 已配置' : '❌ 未配置'}\n`);

  if (!isConfigured) {
    console.log('❌ API 未配置。请设置以下环境变量：');
    console.log('   DIFY_CHAT_API_KEY=app-Bj1UccX9v9X1aw6st7OW5paG');
    console.log('   DIFY_CHAT_APP_ID=NF8mUftOYiGfQEzE\n');
    return;
  }

  // 2. 获取状态信息
  console.log('📋 步骤 2: 获取配置信息...');
  const status = chatWorkflowService.getStatus();
  console.log(`   API Key: ${status.apiKey}`);
  console.log(`   App ID: ${status.appId}`);
  console.log(`   Base URL: ${status.baseURL}\n`);

  // 3. 测试连接
  console.log('📋 步骤 3: 测试 API 连接...');
  console.log('   正在发送测试请求到 Dify API...\n');

  try {
    const result = await chatWorkflowService.testConnection();

    if (result.success) {
      console.log('✅ 连接成功！\n');
      console.log('📝 响应信息：');
      console.log(JSON.stringify(result.data, null, 2));
      console.log('\n✨ Dify API 已正常工作！');
      console.log('   现在你可以开始使用实时 AI 对话功能。\n');
    } else {
      console.log('❌ 连接失败！\n');
      console.log(`   错误: ${result.message}`);
      console.log('\n🔧 可能的原因：');
      console.log('   1. API Key 无效或已过期');
      console.log('   2. App ID 不正确');
      console.log('   3. 网络连接问题');
      console.log('   4. Dify 服务不可用\n');
      console.log('💡 建议：');
      console.log('   - 重新从 Dify 获取最新的 API Key');
      console.log('   - 确保网络连接正常');
      console.log('   - 检查 Dify 服务状态\n');
    }
  } catch (error) {
    console.log('❌ 测试过程中出错！\n');
    console.log(`   错误信息: ${error.message}\n`);
  }
}

// 运行测试
testDifyConnection().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('测试失败:', error);
  process.exit(1);
});
