#!/usr/bin/env node

const http = require('http');
const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const protocol = isHttps ? https : http;

    const reqOptions = {
      timeout: 5000,
      rejectUnauthorized: false,
      ...options
    };

    const req = protocol.get(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkStatus() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         系统状态检查                                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 1. 检查ngrok隧道
  console.log('🔍 检查1: ngrok隧道状态');
  console.log('─'.repeat(56));

  try {
    const ngrokRes = await makeRequest('http://localhost:4040/api/tunnels');
    const tunnels = JSON.parse(ngrokRes.data);

    if (tunnels.tunnels && tunnels.tunnels.length > 0) {
      console.log('✅ ngrok隧道正在运行\n');
      tunnels.tunnels.forEach(t => {
        console.log(`   ${t.name}:`);
        console.log(`   - 公共URL: ${t.public_url}`);
        console.log(`   - 协议: ${t.proto}`);
        console.log(`   - 状态: ${t.config?.addr || 'unknown'}\n`);
      });
    } else {
      console.log('❌ 没有active的ngrok隧道\n');
    }
  } catch (error) {
    console.log(`❌ ngrok隧道检查失败: ${error.message}\n`);
  }

  // 2. 检查本地存储API
  console.log('🔍 检查2: 本地存储API (http://localhost:8090)');
  console.log('─'.repeat(56));

  try {
    const localRes = await makeRequest('http://localhost:8090/api/sessions', {
      headers: {
        'Authorization': 'Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
      }
    });

    if (localRes.status === 200) {
      console.log('✅ 本地存储API正常运行\n');
    } else {
      console.log(`⚠️  本地存储API返回: ${localRes.status}\n`);
    }

    if (localRes.data) {
      try {
        const data = JSON.parse(localRes.data);
        console.log(`   响应样本: ${JSON.stringify(data).substring(0, 100)}...\n`);
      } catch (e) {
        console.log(`   响应: ${localRes.data.substring(0, 100)}...\n`);
      }
    }
  } catch (error) {
    console.log(`❌ 本地存储API检查失败: ${error.message}\n`);
  }

  // 3. 检查ngrok隧道的存储API
  console.log('🔍 检查3: ngrok隧道的存储API');
  console.log('─'.repeat(56));

  try {
    const ngrokRes = await makeRequest('https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions', {
      headers: {
        'Authorization': 'Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
      }
    });

    if (ngrokRes.status === 200) {
      console.log('✅ ngrok隧道的存储API正常运行\n');
    } else {
      console.log(`⚠️  ngrok隧道的存储API返回: ${ngrokRes.status}\n`);
    }

    if (ngrokRes.data) {
      try {
        const data = JSON.parse(ngrokRes.data);
        console.log(`   响应: ${JSON.stringify(data).substring(0, 150)}...\n`);
      } catch (e) {
        console.log(`   响应: ${ngrokRes.data.substring(0, 100)}...\n`);
      }
    }
  } catch (error) {
    console.log(`❌ ngrok隧道API检查失败: ${error.message}\n`);
  }

  // 4. 检查Dify API
  console.log('🔍 检查4: Dify API连接');
  console.log('─'.repeat(56));

  try {
    const difyRes = await makeRequest('https://api.dify.ai/v1/workflows/run', {
      method: 'OPTIONS',
      headers: {
        'Authorization': 'Bearer app-test'
      }
    });

    console.log('✅ Dify API服务器可以访问\n');
  } catch (error) {
    console.log(`❌ Dify API检查失败: ${error.message}\n`);
  }

  // 总结
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         故障排除建议                                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('如果ngrok隧道不可用:');
  console.log('  1. 启动ngrok: ngrok http 8090');
  console.log('  2. 获取公共URL并更新存储API配置\n');

  console.log('如果本地存储API不可用:');
  console.log('  1. 启动Docker: docker-compose up -d');
  console.log('  2. 检查: docker ps | grep interview-storage-api\n');

  console.log('如果需要重新配置Dify工作流:');
  console.log('  1. 找到正确的ngrok URL');
  console.log('  2. 更新工作流中的Python节点代码');
  console.log('  3. 发布工作流\n');
}

checkStatus().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
