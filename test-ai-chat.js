/**
 * AI 对话功能测试脚本
 * 测试 /api/ai/chat/stream 端点是否正常返回真实的 Dify Chat API 响应
 */

const http = require('http');

// 测试配置
const TEST_CONFIG = {
  apiUrl: 'http://localhost:3001/api/ai/chat/stream',
  message: '请解释什么是人工智能',
  articleContent: '人工智能（AI）是计算机科学的一个分支。现代AI包括机器学习、深度学习等技术。',
  conversationId: '',
  postId: '20'
};

console.log('🧪 开始测试 AI 对话功能...\n');
console.log('📋 测试配置:');
console.log(`   API URL: ${TEST_CONFIG.apiUrl}`);
console.log(`   用户消息: ${TEST_CONFIG.message}`);
console.log(`   Post ID: ${TEST_CONFIG.postId}`);
console.log('---\n');

// 构建查询参数
const params = new URLSearchParams({
  message: TEST_CONFIG.message,
  articleContent: TEST_CONFIG.articleContent,
  conversationId: TEST_CONFIG.conversationId,
  postId: TEST_CONFIG.postId,
  workflow: 'chat'
});

const fullUrl = `${TEST_CONFIG.apiUrl}?${params.toString()}`;

// 测试 EventSource（模拟浏览器中的 EventSource）
function testEventSource() {
  return new Promise((resolve, reject) => {
    const url = new URL(fullUrl);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer 1', // 模拟认证
      }
    };

    let responseData = '';
    let chunks = [];
    let hasRealResponse = false;
    let mockResponseCount = 0;

    const req = http.request(url, options, (res) => {
      console.log(`📡 收到响应状态码: ${res.statusCode}`);
      console.log(`📡 响应头: Content-Type = ${res.headers['content-type']}\n`);

      res.on('data', (chunk) => {
        responseData += chunk.toString();
      });

      res.on('end', () => {
        console.log('📊 完整响应内容:\n');
        const lines = responseData.split('\n').filter(line => line.trim());

        lines.forEach((line, index) => {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6);
            try {
              const data = JSON.parse(jsonStr);
              console.log(`[${index}] ${JSON.stringify(data, null, 2)}`);

              if (data.type === 'chunk' && data.content) {
                // 检查是否为模拟数据
                if (data.content === '这是 AI 对' ||
                    data.content === '你提问的' ||
                    data.content === '一个回复。' ||
                    data.content === '它会逐字' ||
                    data.content === '显示在前' ||
                    data.content === '端。') {
                  mockResponseCount++;
                } else {
                  hasRealResponse = true;
                }
                chunks.push(data.content);
              }
            } catch (e) {
              console.log(`[${index}] ${line}`);
            }
          }
        });

        console.log('\n✅ 响应处理完成\n');

        // 分析结果
        console.log('📈 测试分析:\n');
        console.log(`   收到的数据块: ${chunks.length} 个`);
        console.log(`   模拟数据块: ${mockResponseCount} 个`);
        console.log(`   实际AI响应: ${hasRealResponse ? '✅ 是' : '❌ 否'}`);

        if (hasRealResponse) {
          console.log(`\n🎉 成功! 收到了真实的 AI 响应`);
          console.log(`   响应内容: ${chunks.join('')}`);
          resolve(true);
        } else if (mockResponseCount > 0) {
          console.log(`\n⚠️  警告: 收到的是硬编码的模拟数据`);
          console.log(`   模拟消息: "${chunks.join('')}"`);
          console.log(`\n可能原因:`);
          console.log(`   1. chatWorkflowService.checkConfiguration() 返回了 false`);
          console.log(`   2. 环境变量未正确配置`);
          console.log(`   3. Dify Chat API 密钥无效`);
          resolve(false);
        } else {
          console.log(`\n❌ 错误: 没有收到任何有效的响应数据`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求错误:', error.message);
      reject(error);
    });

    req.end();
  });
}

// 运行测试
testEventSource()
  .then((success) => {
    console.log('\n' + '='.repeat(50) + '\n');
    if (success) {
      console.log('✅ AI 对话测试通过!');
      process.exit(0);
    } else {
      console.log('❌ AI 对话测试失败，仍返回模拟数据');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ 测试发生异常:', error);
    process.exit(1);
  });
