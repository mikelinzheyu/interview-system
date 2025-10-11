/**
 * Dify MCP 服务器连接测试
 *
 * 测试 Dify MCP 服务器是否可以正常访问
 */

const https = require('https');

const MCP_URL = 'https://api.dify.ai/mcp/server/sUb5skskelb6Nkm1/mcp';
const API_KEY = 'app-vZlc0w5Dio2gnrTkdlblcPXG';

console.log('🔍 测试 Dify MCP 服务器连接...\n');
console.log(`MCP URL: ${MCP_URL}`);
console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
console.log('\n' + '='.repeat(60) + '\n');

// 测试 1: OPTIONS 请求（检查支持的方法）
function testOptions() {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Origin': 'http://localhost'
      }
    };

    console.log('📡 测试 1: OPTIONS 请求');

    const req = https.request(options, (res) => {
      console.log(`✅ 状态码: ${res.statusCode}`);
      console.log(`📋 响应头:`);
      Object.keys(res.headers).forEach(key => {
        console.log(`   ${key}: ${res.headers[key]}`);
      });

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data) {
          console.log(`📦 响应内容: ${data}`);
        }
        console.log('\n' + '-'.repeat(60) + '\n');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ 错误: ${error.message}\n`);
      reject(error);
    });

    req.end();
  });
}

// 测试 2: POST 请求（MCP 初始化）
function testInitialize() {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_URL);

    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('📡 测试 2: POST 初始化请求');
    console.log(`📤 请求体: ${payload}\n`);

    const req = https.request(options, (res) => {
      console.log(`✅ 状态码: ${res.statusCode}`);

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data) {
          try {
            const json = JSON.parse(data);
            console.log(`📦 响应内容:`);
            console.log(JSON.stringify(json, null, 2));
          } catch (e) {
            console.log(`📦 原始响应: ${data}`);
          }
        }
        console.log('\n' + '-'.repeat(60) + '\n');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ 错误: ${error.message}\n`);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// 测试 3: 列出可用工具
function testListTools() {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_URL);

    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('📡 测试 3: 列出可用工具');

    const req = https.request(options, (res) => {
      console.log(`✅ 状态码: ${res.statusCode}`);

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data) {
          try {
            const json = JSON.parse(data);
            console.log(`📦 可用工具:`);
            console.log(JSON.stringify(json, null, 2));
          } catch (e) {
            console.log(`📦 原始响应: ${data}`);
          }
        }
        console.log('\n' + '-'.repeat(60) + '\n');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ 错误: ${error.message}\n`);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// 运行所有测试
async function runTests() {
  try {
    await testOptions();
    await testInitialize();
    await testListTools();

    console.log('✅ 所有测试完成！');
    console.log('\n💡 如果看到成功的响应，说明 MCP 服务器配置正确。');
    console.log('   您可以在 Claude Code 中使用这个 MCP 服务器了。');
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('   1. API Key 不正确');
    console.log('   2. MCP 服务器 URL 错误');
    console.log('   3. 网络连接问题');
    console.log('   4. Dify 服务暂时不可用');
  }
}

runTests();
