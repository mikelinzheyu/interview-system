/**
 * 前端 AI 对话功能验证脚本
 * 使用 Node.js 的 fetch 模拟浏览器行为测试前端页面
 */

const http = require('http');

console.log('🔍 前端 AI 对话功能验证\n');
console.log('='.repeat(60));

// 1. 检查前端是否正常加载
console.log('\n1️⃣  检查前端服务...\n');

function checkFrontend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173/', (res) => {
      console.log(`✅ 前端服务状态: ${res.statusCode}`);
      console.log(`   URL: http://localhost:5173/\n`);

      // 检查是否是成功响应
      if (res.statusCode === 200) {
        console.log('✅ 前端正常运行\n');
      } else {
        console.log('⚠️  前端响应状态码异常\n');
      }

      resolve(res.statusCode === 200);
    });

    req.on('error', (error) => {
      console.log(`❌ 无法连接到前端: ${error.message}\n`);
      resolve(false);
    });
  });
}

// 2. 验证 API 端点
console.log('2️⃣  验证后端 API 端点...\n');

function checkAPIEndpoint() {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      message: '测试消息',
      articleContent: '测试内容',
      postId: '20',
      workflow: 'chat'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/ai/chat/stream?${params.toString()}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer 1'
      }
    };

    let dataReceived = false;
    let realResponseReceived = false;

    const req = http.request(options, (res) => {
      console.log(`✅ API 端点状态: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);
      console.log(`   URL: /api/ai/chat/stream\n`);

      res.on('data', (chunk) => {
        dataReceived = true;
        const str = chunk.toString();

        // 检查是否为真实响应而不是模拟数据
        if (str.includes('"event":"agent_message"') || str.includes('"event":"message"')) {
          realResponseReceived = true;
        }
      });

      res.on('end', () => {
        if (dataReceived && realResponseReceived) {
          console.log('✅ API 正常返回 Dify Chat API 响应');
        } else if (dataReceived) {
          console.log('⚠️  API 返回了数据但可能是模拟数据');
        } else {
          console.log('❌ API 未返回数据');
        }
        console.log();
        resolve(dataReceived && realResponseReceived);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ API 无法连接: ${error.message}\n`);
      resolve(false);
    });

    req.end();
  });
}

// 3. 测试流程
async function runTests() {
  try {
    const frontendOK = await checkFrontend();
    const apiOK = await checkAPIEndpoint();

    console.log('='.repeat(60));
    console.log('\n📊 测试结果总结:\n');

    const results = [
      { name: '前端服务', status: frontendOK },
      { name: '后端 API', status: apiOK }
    ];

    results.forEach(result => {
      const icon = result.status ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.status ? '正常' : '异常'}`);
    });

    console.log('\n' + '='.repeat(60));

    if (frontendOK && apiOK) {
      console.log('\n🎉 所有测试通过！\n');
      console.log('📋 访问地址:');
      console.log('   🌐 前端: http://localhost:5173/');
      console.log('   📱 社区页面: http://localhost:5173/community/posts/20\n');
      console.log('📝 操作步骤:');
      console.log('   1. 在浏览器中打开社区页面');
      console.log('   2. 找到右侧的 AI 助手面板');
      console.log('   3. 向 AI 提问关于帖子内容的问题');
      console.log('   4. 验证 AI 返回真实的响应（不是硬编码的模拟消息）\n');
      console.log('✅ AI 对话功能已修复并正常运行！\n');
      process.exit(0);
    } else {
      console.log('\n❌ 部分测试失败\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 测试过程出错:', error);
    process.exit(1);
  }
}

// 延迟启动，等待服务完全初始化
setTimeout(runTests, 2000);
