/**
 * Phase 3 前后端集成联调测试
 * 测试所有 Phase 3 功能的端到端流程
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passCount = 0;
let failCount = 0;
let token = '';

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, detail = '') {
  if (passed) {
    passCount++;
    log(`✓ ${name}`, 'green');
    if (detail) log(`  ${detail}`, 'cyan');
  } else {
    failCount++;
    log(`✗ ${name}`, 'red');
    if (detail) log(`  ${detail}`, 'yellow');
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 测试用例 ====================

async function testLogin() {
  log('\n【1. 用户登录】', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });

    const passed = response.data.code === 200 && response.data.data.token;
    token = response.data.data.token;
    logTest('用户登录', passed, `Token: ${token.substring(0, 20)}...`);
    return passed;
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || String(error);
    logTest('用户登录', false, `${errMsg} (${error.code || 'NO_CODE'})`);
    console.log('  详细错误:', error.response?.data || error.message);
    return false;
  }
}

// ==================== Phase 3.1: 社区贡献系统 ====================

async function testSubmitQuestion() {
  log('\n【2. Phase 3.1 - 社区贡献系统】', 'blue');
  log('  2.1 提交题目', 'cyan');

  try {
    const questionData = {
      domainId: 1,
      categoryId: 1,
      title: '实现一个LRU缓存算法',
      content: '请使用JavaScript实现一个LRU（Least Recently Used）缓存算法',
      type: 'coding',
      difficulty: 'medium',
      tags: ['算法', '数据结构', '缓存'],
      options: [],
      correctAnswer: null,
      explanation: '使用Map数据结构可以保持插入顺序，配合删除和重新插入来实现LRU',
      timeLimit: 30,
      reference: {
        framework: 'vanilla',
        template: 'class LRUCache { constructor(capacity) {} }'
      }
    };

    const response = await axios.post(
      `${BASE_URL}/api/contributions/submit`,
      questionData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200 && response.data.data.id;
    logTest('提交题目', passed, `提交ID: ${response.data.data?.id}`);
    return response.data.data?.id;
  } catch (error) {
    logTest('提交题目', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetMySubmissions() {
  log('  2.2 查询我的提交', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/contributions/my-submissions`,
      {
        params: { page: 1, pageSize: 10, status: 'all' },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const passed = response.data.code === 200 && Array.isArray(response.data.data.items);
    logTest(
      '查询我的提交',
      passed,
      `共${response.data.data?.total || 0}条提交记录`
    );
    return passed;
  } catch (error) {
    logTest('查询我的提交', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetSubmissionDetail(submissionId) {
  log('  2.3 获取提交详情', 'cyan');

  if (!submissionId) {
    logTest('获取提交详情', false, '缺少提交ID');
    return false;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/api/contributions/submissions/${submissionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200 && response.data.data.id === submissionId;
    logTest(
      '获取提交详情',
      passed,
      `状态: ${response.data.data?.status}`
    );
    return passed;
  } catch (error) {
    logTest('获取提交详情', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testReviewSubmission(submissionId) {
  log('  2.4 审核提交', 'cyan');

  if (!submissionId) {
    logTest('审核提交', false, '缺少提交ID');
    return false;
  }

  try {
    const reviewData = {
      action: 'approve',
      comment: '题目质量很好，符合要求',
      qualityScore: 85
    };

    const response = await axios.post(
      `${BASE_URL}/api/contributions/submissions/${submissionId}/review`,
      reviewData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200;
    logTest('审核提交', passed, `审核结果: ${reviewData.action}`);
    return passed;
  } catch (error) {
    logTest('审核提交', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetReviewQueue() {
  log('  2.5 获取审核队列', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/contributions/review-queue`,
      {
        params: { page: 1, pageSize: 10 },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const passed = response.data.code === 200 && Array.isArray(response.data.data.items);
    logTest(
      '获取审核队列',
      passed,
      `队列中有${response.data.data?.total || 0}个待审核`
    );
    return passed;
  } catch (error) {
    logTest('获取审核队列', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetContributorProfile() {
  log('  2.6 获取贡献者主页', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/contributions/profile/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200 && response.data.data.userId === 1;
    logTest(
      '获取贡献者主页',
      passed,
      `总积分: ${response.data.data?.totalPoints}, 徽章: ${response.data.data?.badges?.length || 0}个`
    );
    return passed;
  } catch (error) {
    logTest('获取贡献者主页', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetLeaderboard() {
  log('  2.7 获取排行榜', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/contributions/leaderboard`,
      {
        params: { timeRange: 'monthly', limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const items = response.data.data?.items || response.data.data;
    const passed = response.data.code === 200 && Array.isArray(items);
    logTest(
      '获取排行榜',
      passed,
      `本月前${items?.length || 0}名贡献者`
    );
    return passed;
  } catch (error) {
    logTest('获取排行榜', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetBadges() {
  log('  2.8 获取徽章列表', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/contributions/badges`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const items = response.data.data?.items || response.data.data;
    const passed = response.data.code === 200 && Array.isArray(items);
    logTest(
      '获取徽章列表',
      passed,
      `共${items?.length || 0}种徽章`
    );
    return passed;
  } catch (error) {
    logTest('获取徽章列表', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testClaimReward(submissionId) {
  log('  2.9 领取奖励', 'cyan');

  if (!submissionId) {
    logTest('领取奖励', false, '缺少提交ID');
    return false;
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/api/contributions/submissions/${submissionId}/claim-reward`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200;
    logTest(
      '领取奖励',
      passed,
      `获得积分: ${response.data.data?.pointsAwarded}`
    );
    return passed;
  } catch (error) {
    logTest('领取奖励', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testUpdateSubmission(submissionId) {
  log('  2.10 修改提交', 'cyan');

  if (!submissionId) {
    logTest('修改提交', false, '缺少提交ID');
    return false;
  }

  try {
    const updateData = {
      title: '实现一个高效的LRU缓存算法（已优化）',
      explanation: '使用Map数据结构配合双向链表可以实现O(1)时间复杂度的LRU缓存'
    };

    const response = await axios.put(
      `${BASE_URL}/api/contributions/submissions/${submissionId}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200;
    logTest('修改提交', passed, '提交内容已更新');
    return passed;
  } catch (error) {
    logTest('修改提交', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ==================== Phase 3.2: 跨专业能力分析 ====================

async function testGetAbilityProfile() {
  log('\n【3. Phase 3.2 - 跨专业能力分析】', 'blue');
  log('  3.1 获取能力画像', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/ability/profile/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200 && response.data.data.tShapeAnalysis;
    const tIndex = response.data.data?.tShapeAnalysis?.index || 0;
    const type = response.data.data?.tShapeAnalysis?.type || 'unknown';

    logTest(
      '获取能力画像',
      passed,
      `T型指数: ${tIndex}, 类型: ${type}`
    );
    return passed;
  } catch (error) {
    logTest('获取能力画像', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetRadarData() {
  log('  3.2 获取雷达图数据', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/ability/radar/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200 && Array.isArray(response.data.data.domains);
    logTest(
      '获取雷达图数据',
      passed,
      `包含${response.data.data?.domains?.length || 0}个领域`
    );
    return passed;
  } catch (error) {
    logTest('获取雷达图数据', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testCompareAbility() {
  log('  3.3 对比能力分析', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/ability/compare`,
      {
        params: { userIds: '1,2' },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const passed = response.data.code === 200 && Array.isArray(response.data.data);
    logTest(
      '对比能力分析',
      passed,
      `对比${response.data.data?.length || 0}个用户`
    );
    return passed;
  } catch (error) {
    logTest('对比能力分析', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetRecommendations() {
  log('  3.4 获取学习建议', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/ability/recommendations/1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200 && Array.isArray(response.data.data);
    logTest(
      '获取学习建议',
      passed,
      `共${response.data.data?.length || 0}条建议`
    );
    return passed;
  } catch (error) {
    logTest('获取学习建议', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ==================== Phase 3.3: AI 自动出题 ====================

async function testGenerateQuestions() {
  log('\n【4. Phase 3.3 - AI 自动出题】', 'blue');
  log('  4.1 生成题目', 'cyan');

  try {
    const generateData = {
      domainId: 1,
      difficulty: 'medium',
      count: 3,
      topics: ['算法', '数据结构'],
      requirements: {
        includeExplanation: true,
        includeTestCases: true
      }
    };

    const response = await axios.post(
      `${BASE_URL}/api/ai/generate-questions`,
      generateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const questions = response.data.data?.generatedQuestions || response.data.data?.questions || [];
    const taskId = response.data.data?.id || response.data.data?.taskId;
    const passed = response.data.code === 200 && Array.isArray(questions);
    logTest(
      'AI生成题目',
      passed,
      `生成${questions.length}道题目, 任务ID: ${taskId}`
    );
    return taskId;
  } catch (error) {
    logTest('AI生成题目', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetGenerationHistory() {
  log('  4.2 获取生成历史', 'cyan');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/ai/generation-history`,
      {
        params: { page: 1, pageSize: 10 },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const passed = response.data.code === 200 && Array.isArray(response.data.data.items);
    logTest(
      '获取生成历史',
      passed,
      `共${response.data.data?.total || 0}条历史记录`
    );
    return passed;
  } catch (error) {
    logTest('获取生成历史', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetGenerationDetail(taskId) {
  log('  4.3 获取生成详情', 'cyan');

  if (!taskId) {
    logTest('获取生成详情', false, '缺少任务ID');
    return false;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}/api/ai/generations/${taskId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200 && response.data.data.taskId === taskId;
    logTest(
      '获取生成详情',
      passed,
      `状态: ${response.data.data?.status}, 生成${response.data.data?.generatedCount}/${response.data.data?.requestedCount}题`
    );
    return passed;
  } catch (error) {
    logTest('获取生成详情', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testEvaluateQuestion(taskId) {
  log('  4.4 评估题目质量', 'cyan');

  if (!taskId) {
    logTest('评估题目质量', false, '缺少任务ID');
    return false;
  }

  try {
    const evaluateData = {
      questionId: 1,
      feedback: {
        clarity: 4,
        difficulty: 5,
        relevance: 4,
        completeness: 5
      }
    };

    const response = await axios.post(
      `${BASE_URL}/api/ai/evaluate`,
      evaluateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const passed = response.data.code === 200;
    logTest(
      '评估题目质量',
      passed,
      `总分: ${response.data.data?.totalScore}/20`
    );
    return passed;
  } catch (error) {
    logTest('评估题目质量', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ==================== 主测试流程 ====================

async function runAllTests() {
  log('='.repeat(60), 'cyan');
  log('Phase 3 前后端集成联调测试', 'cyan');
  log('='.repeat(60), 'cyan');

  // 1. 登录
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    log('\n⚠️  登录失败，部分测试可能无法进行', 'yellow');
  }

  await delay(500);

  // 2. Phase 3.1: 社区贡献系统
  const submissionId = await testSubmitQuestion();
  await delay(300);

  await testGetMySubmissions();
  await delay(300);

  if (submissionId) {
    await testGetSubmissionDetail(submissionId);
    await delay(300);

    await testReviewSubmission(submissionId);
    await delay(300);

    await testUpdateSubmission(submissionId);
    await delay(300);

    await testClaimReward(submissionId);
    await delay(300);
  }

  await testGetReviewQueue();
  await delay(300);

  await testGetContributorProfile();
  await delay(300);

  await testGetLeaderboard();
  await delay(300);

  await testGetBadges();
  await delay(300);

  // 3. Phase 3.2: 跨专业能力分析
  await testGetAbilityProfile();
  await delay(300);

  await testGetRadarData();
  await delay(300);

  await testCompareAbility();
  await delay(300);

  await testGetRecommendations();
  await delay(300);

  // 4. Phase 3.3: AI 自动出题
  const taskId = await testGenerateQuestions();
  await delay(300);

  await testGetGenerationHistory();
  await delay(300);

  if (taskId) {
    await testGetGenerationDetail(taskId);
    await delay(300);

    await testEvaluateQuestion(taskId);
  }

  // 统计结果
  log('\n' + '='.repeat(60), 'cyan');
  log('测试结果汇总', 'cyan');
  log('='.repeat(60), 'cyan');

  const total = passCount + failCount;
  const passRate = total > 0 ? ((passCount / total) * 100).toFixed(1) : 0;

  log(`\n总计: ${total} 个测试`, 'blue');
  log(`通过: ${passCount} 个`, 'green');
  log(`失败: ${failCount} 个`, 'red');
  log(`通过率: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');

  if (passRate >= 90) {
    log('\n🎉 恭喜！Phase 3 前后端集成测试全部通过！', 'green');
  } else if (passRate >= 70) {
    log('\n⚠️  大部分测试通过，但仍有部分问题需要修复', 'yellow');
  } else {
    log('\n❌ 测试失败较多，需要检查并修复问题', 'red');
  }

  log('\n');
}

// 运行测试
runAllTests().catch(error => {
  log('\n❌ 测试运行出错:', 'red');
  console.error(error);
  process.exit(1);
});
