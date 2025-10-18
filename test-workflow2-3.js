/**
 * 测试工作流2和3
 * 工作流2: 生成标准答案
 * 工作流3: 评分答案
 */

const https = require('https');

// 工作流配置
const WORKFLOWS = {
  workflow2: {
    name: '工作流2 - 生成标准答案',
    apiKey: 'app-tl7iWaJSNIam5tA3lAYf2zL8',
    apiUrl: 'https://api.dify.ai/v1/workflows/run',
    workflowId: 'rBRtFrkEqD9QuvcW'
  },
  workflow3: {
    name: '工作流3 - 评分答案',
    apiKey: 'app-wYqlMORyoUpBkW32BAcRe9lc',
    apiUrl: 'https://api.dify.ai/v1/workflows/run',
    workflowId: '6BP4LRMhhWAJErur'
  }
};

// 调用工作流
function callWorkflow(workflow, inputs) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      inputs,
      response_mode: 'blocking',
      user: 'test-user'
    });

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${workflow.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(workflow.apiUrl, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// 测试工作流2
async function testWorkflow2(sessionId) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 工作流2 - 生成标准答案');
  console.log('='.repeat(70));

  const workflow = WORKFLOWS.workflow2;

  // 工作流2 的输入应该包含问题、session_id 和 question_id
  const inputs = {
    session_id: sessionId,
    question_id: 'q1',
    question: "你能详细介绍你在Python项目中的架构设计经验吗?",
    job_title: "Python后端开发工程师",
    context: "候选人应该展示他们在大型项目中的架构经验"
  };

  console.log(`\n📤 调用工作流2...`);
  console.log(`输入:\n`, JSON.stringify(inputs, null, 2));

  try {
    const response = await callWorkflow(workflow, inputs);

    console.log(`\n✅ HTTP 状态: ${response.status}\n`);

    if (response.status !== 200) {
      console.error('❌ API 调用失败');
      console.error(JSON.stringify(response.data, null, 2));
      return { success: false, reason: 'HTTP error' };
    }

    const outputs = response.data.data?.outputs || response.data;

    console.log('📦 原始输出:\n');
    console.log(JSON.stringify(outputs, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('🔍 输出分析');
    console.log('='.repeat(70));

    // 分析输出
    if (!outputs || Object.keys(outputs).length === 0) {
      console.log('\n❌ 问题: 输出为空');
      console.log('📝 原因: 可能工作流配置有问题或输入参数不匹配');
      return { success: false, reason: 'empty output' };
    }

    const hasAnswer = outputs.answer && outputs.answer.length > 0;
    const hasExplanation = outputs.explanation && outputs.explanation.length > 0;
    const hasKeyPoints = outputs.key_points && Array.isArray(JSON.parse(outputs.key_points || '[]')) && JSON.parse(outputs.key_points).length > 0;

    console.log(`\n1️⃣ answer 字段: ${outputs.answer ? '✅ 有内容' : '❌ 空值'}`);
    console.log(`2️⃣ explanation 字段: ${outputs.explanation ? '✅ 有内容' : '❌ 空值'}`);
    console.log(`3️⃣ key_points 字段: ${hasKeyPoints ? '✅ 有内容' : '❌ 空值或无效'}`);

    if (hasAnswer && hasExplanation) {
      console.log('\n✅ 工作流2 正常工作!');
      return { success: true, outputs };
    } else {
      console.log('\n⚠️ 工作流2 缺少关键输出字段');
      return { success: false, reason: 'missing fields', outputs };
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return { success: false, reason: error.message };
  }
}

// 测试工作流3
async function testWorkflow3(sessionId) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 工作流3 - 评分答案');
  console.log('='.repeat(70));

  const workflow = WORKFLOWS.workflow3;

  // 工作流3 的输入应该包含问题、候选人答案、标准答案、session_id 和 question_id
  const inputs = {
    session_id: sessionId,
    question_id: 'q1',
    question: "你能详细介绍你在Python项目中的架构设计经验吗?",
    candidate_answer: "我在一个电商项目中使用了微服务架构。我设计了商品服务、订单服务和用户服务。使用Django和FastAPI框架。",
    standard_answer: "良好的架构设计应该包括：1. 系统分层 2. 模块化设计 3. 高内聚低耦合 4. 性能考虑 5. 可维护性",
    job_title: "Python后端开发工程师"
  };

  console.log(`\n📤 调用工作流3...`);
  console.log(`输入:\n`, JSON.stringify(inputs, null, 2));

  try {
    const response = await callWorkflow(workflow, inputs);

    console.log(`\n✅ HTTP 状态: ${response.status}\n`);

    if (response.status !== 200) {
      console.error('❌ API 调用失败');
      console.error(JSON.stringify(response.data, null, 2));
      return { success: false, reason: 'HTTP error' };
    }

    const outputs = response.data.data?.outputs || response.data;

    console.log('📦 原始输出:\n');
    console.log(JSON.stringify(outputs, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('🔍 输出分析');
    console.log('='.repeat(70));

    // 分析输出
    if (!outputs || Object.keys(outputs).length === 0) {
      console.log('\n❌ 问题: 输出为空');
      console.log('📝 原因: 可能工作流配置有问题或输入参数不匹配');
      return { success: false, reason: 'empty output' };
    }

    const hasScore = outputs.score !== undefined && outputs.score !== null;
    const hasGrade = outputs.grade && outputs.grade.length > 0;
    const hasFeedback = outputs.feedback && outputs.feedback.length > 0;

    console.log(`\n1️⃣ score 字段: ${hasScore ? `✅ ${outputs.score}` : '❌ 空值'}`);
    console.log(`2️⃣ grade 字段: ${outputs.grade ? `✅ ${outputs.grade}` : '❌ 空值'}`);
    console.log(`3️⃣ feedback 字段: ${hasFeedback ? '✅ 有内容' : '❌ 空值'}`);

    if (hasScore && hasGrade && hasFeedback) {
      console.log('\n✅ 工作流3 正常工作!');
      return { success: true, outputs };
    } else {
      console.log('\n⚠️ 工作流3 缺少关键输出字段');
      return { success: false, reason: 'missing fields', outputs };
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return { success: false, reason: error.message };
  }
}

// 主测试
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 工作流2和3 完整测试');
  console.log('='.repeat(70));

  // 首先从工作流1获取 session_id
  const sessionId = 'test-session-' + Date.now();

  const results = {
    workflow2: await testWorkflow2(sessionId),
    workflow3: await testWorkflow3(sessionId)
  };

  console.log('\n' + '='.repeat(70));
  console.log('📊 测试总结');
  console.log('='.repeat(70));

  console.log(`\n工作流2 - 生成标准答案: ${results.workflow2.success ? '✅ 成功' : '❌ 失败'}`);
  if (!results.workflow2.success) {
    console.log(`  原因: ${results.workflow2.reason}`);
  }

  console.log(`\n工作流3 - 评分答案: ${results.workflow3.success ? '✅ 成功' : '❌ 失败'}`);
  if (!results.workflow3.success) {
    console.log(`  原因: ${results.workflow3.reason}`);
  }

  const allSuccess = results.workflow2.success && results.workflow3.success;

  console.log('\n' + '='.repeat(70));
  if (allSuccess) {
    console.log('🎉 所有工作流都正常工作！');
    console.log('\n现在可以执行端到端集成测试:');
    console.log('  1. 工作流1: 生成问题 ✅');
    console.log('  2. 工作流2: 生成标准答案 ✅');
    console.log('  3. 工作流3: 评分答案 ✅');
  } else {
    console.log('⚠️ 部分工作流存在问题，需要调查');
    console.log('\n问题可能的原因:');
    console.log('  1. 输入参数不匹配工作流期望');
    console.log('  2. 工作流中的变量映射有问题');
    console.log('  3. 工作流配置不完整');
    console.log('  4. 依赖的外部服务不可用');
  }

  console.log('='.repeat(70) + '\n');
}

// 运行测试
runTests();
