/**
 * Dify MCP 工具使用演示
 *
 * 演示如何通过 MCP 协议调用 Dify AI 面试官工作流
 */

const https = require('https');

const MCP_URL = 'https://api.dify.ai/mcp/server/sQFDstpnlPUJ5MeX/mcp';
const API_KEY = 'app-aROZ5FjseJWUtmRzzjlb6b5E';

// MCP 工具调用函数
function callDifyTool(toolParams) {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_URL);

    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'AI 面试官 - 全流程定制与评分 (RAG)',
        arguments: toolParams
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
      },
      timeout: 60000 // 60秒超时
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message || 'MCP Error'));
          } else {
            resolve(json.result);
          }
        } catch (e) {
          console.error('响应解析错误:', data);
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(payload);
    req.end();
  });
}

// 演示 1: 生成面试问题
async function demo1_generateQuestions() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 演示 1: 为 "Python后端开发工程师" 生成面试问题');
  console.log('='.repeat(70) + '\n');

  try {
    console.log('⏳ 正在调用 Dify 工作流...');
    console.log('📤 请求参数:', JSON.stringify({
      request_type: 'generate_questions',
      job_title: 'Python后端开发工程师'
    }, null, 2));
    console.log('');

    const result = await callDifyTool({
      request_type: 'generate_questions',
      job_title: 'Python后端开发工程师'
    });

    console.log('✅ 调用成功！');
    console.log('📦 返回结果:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 调用失败:', error.message);
  }
}

// 演示 2: 为前端开发工程师生成题目
async function demo2_frontendQuestions() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 演示 2: 为 "前端开发工程师" 生成面试问题');
  console.log('='.repeat(70) + '\n');

  try {
    console.log('⏳ 正在调用 Dify 工作流...');
    console.log('📤 请求参数:', JSON.stringify({
      request_type: 'generate_questions',
      job_title: '前端开发工程师'
    }, null, 2));
    console.log('');

    const result = await callDifyTool({
      request_type: 'generate_questions',
      job_title: '前端开发工程师'
    });

    console.log('✅ 调用成功！');
    console.log('📦 返回结果:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 调用失败:', error.message);
  }
}

// 演示 3: 评估答案（需要先有 session_id）
async function demo3_analyzeAnswer() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 演示 3: 评估候选人答案');
  console.log('='.repeat(70) + '\n');

  console.log('💡 说明: 此演示需要先生成问题获得 session_id');
  console.log('   这里展示的是参数格式，实际使用时需要替换为真实的 session_id\n');

  const exampleParams = {
    request_type: 'analyze_answer',
    session_id: 'sess-example-123',
    question: '请解释 Python 的 GIL（全局解释器锁）是什么？',
    candidate_answer: 'GIL 是 Python 的全局解释器锁，它确保同一时刻只有一个线程在执行 Python 字节码。这是因为 CPython 的内存管理不是线程安全的。'
  };

  console.log('📤 示例参数格式:');
  console.log(JSON.stringify(exampleParams, null, 2));
  console.log('\n💡 要实际调用，请先运行演示 1 或 2 获取 session_id');
}

// 演示 4: 自定义专业（展示自由输入的能力）
async function demo4_customProfession() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 演示 4: 为自定义专业 "区块链开发工程师" 生成面试问题');
  console.log('='.repeat(70) + '\n');

  console.log('💡 这展示了自由输入专业的能力 - 不受预定义列表限制！\n');

  try {
    console.log('⏳ 正在调用 Dify 工作流...');
    console.log('📤 请求参数:', JSON.stringify({
      request_type: 'generate_questions',
      job_title: '区块链开发工程师'
    }, null, 2));
    console.log('');

    const result = await callDifyTool({
      request_type: 'generate_questions',
      job_title: '区块链开发工程师'
    });

    console.log('✅ 调用成功！');
    console.log('📦 返回结果:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 调用失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('\n🎯 Dify MCP 工具使用演示');
  console.log('📚 本脚本展示如何通过 MCP 协议调用 Dify AI 面试官工作流\n');

  console.log('⚠️  注意: Dify 工作流调用需要时间（通常 30-60 秒）');
  console.log('   因为它需要通过搜索引擎搜索职位信息并生成题目\n');

  console.log('请选择要运行的演示:');
  console.log('1. 为 Python后端开发工程师 生成题目');
  console.log('2. 为 前端开发工程师 生成题目');
  console.log('3. 评估答案（仅显示参数格式）');
  console.log('4. 为 区块链开发工程师 生成题目（自定义专业）');
  console.log('5. 运行所有演示（需要较长时间）\n');

  // 从命令行参数获取选择
  const choice = process.argv[2] || '3'; // 默认运行演示 3（不实际调用 API）

  switch (choice) {
    case '1':
      await demo1_generateQuestions();
      break;
    case '2':
      await demo2_frontendQuestions();
      break;
    case '3':
      await demo3_analyzeAnswer();
      break;
    case '4':
      await demo4_customProfession();
      break;
    case '5':
      await demo1_generateQuestions();
      await demo2_frontendQuestions();
      await demo3_analyzeAnswer();
      await demo4_customProfession();
      break;
    default:
      console.log('❌ 无效的选择，运行默认演示（演示 3）');
      await demo3_analyzeAnswer();
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ 演示完成！');
  console.log('='.repeat(70) + '\n');

  console.log('💡 使用说明:');
  console.log('   node demo-dify-mcp.js 1    # 运行演示 1');
  console.log('   node demo-dify-mcp.js 2    # 运行演示 2');
  console.log('   node demo-dify-mcp.js 3    # 运行演示 3');
  console.log('   node demo-dify-mcp.js 4    # 运行演示 4');
  console.log('   node demo-dify-mcp.js 5    # 运行所有演示\n');
}

// 运行主函数
main().catch(error => {
  console.error('💥 程序异常:', error);
  process.exit(1);
});
