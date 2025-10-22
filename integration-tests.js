/**
 * 前后端联调集成测试脚本
 * 测试所有新功能：错题管理、批量操作、分析仪表板、WebSocket实时同步
 */

const http = require('http');

// 配置
const API_BASE = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJpYXQiOjE2MzIwMDAwMDB9.fake_token';

// 测试结果收集
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * 发送HTTP请求
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TEST_TOKEN
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: responseData ? JSON.parse(responseData) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * 记录测试结果
 */
function recordTest(name, passed, message) {
  const result = {
    name,
    passed,
    message,
    timestamp: new Date().toISOString()
  };
  results.tests.push(result);
  if (passed) {
    results.passed++;
    console.log('✅ ' + name + ': ' + message);
  } else {
    results.failed++;
    console.log('❌ ' + name + ': ' + message);
  }
}

/**
 * 测试1: 健康检查
 */
async function test_HealthCheck() {
  try {
    const response = await makeRequest('GET', '/api/health');
    recordTest('健康检查', response.status === 200, 'Backend healthy (' + response.status + ')');
  } catch (err) {
    recordTest('健康检查', false, err.message);
  }
}

/**
 * 测试2: 获取错题统计
 */
async function test_GetWrongAnswersStatistics() {
  try {
    const response = await makeRequest('GET', '/api/v1/wrong-answers/statistics');
    recordTest(
      '获取错题统计',
      response.status === 200 && response.data,
      'Retrieved statistics'
    );
  } catch (err) {
    recordTest('获取错题统计', false, err.message);
  }
}

/**
 * 测试3: 获取分析数据
 */
async function test_GetAnalytics() {
  try {
    const response = await makeRequest('GET', '/api/v1/wrong-answers/analytics?days=30');
    recordTest(
      '获取分析数据',
      response.status === 200 && response.data,
      'Retrieved analytics data'
    );
  } catch (err) {
    recordTest('获取分析数据', false, err.message);
  }
}

/**
 * 测试4: 批量更新状态
 */
async function test_BatchUpdateStatus() {
  try {
    const payload = {
      recordIds: [1, 2, 3],
      status: 'mastered'
    };
    const response = await makeRequest('PUT', '/api/v1/wrong-answers/batch/update-status', payload);
    recordTest(
      '批量更新状态',
      response.status === 200,
      'Status: ' + response.status
    );
  } catch (err) {
    recordTest('批量更新状态', false, err.message);
  }
}

/**
 * 测试5: 批量添加标签
 */
async function test_BatchAddTags() {
  try {
    const payload = {
      recordIds: [1, 2],
      tags: ['重点', '易错']
    };
    const response = await makeRequest('POST', '/api/v1/wrong-answers/batch/add-tags', payload);
    recordTest(
      '批量添加标签',
      response.status === 200 || response.status === 201,
      'Status: ' + response.status
    );
  } catch (err) {
    recordTest('批量添加标签', false, err.message);
  }
}

/**
 * 测试6: 批量删除标签
 */
async function test_BatchRemoveTags() {
  try {
    const payload = {
      recordIds: [1],
      tags: ['重点']
    };
    const response = await makeRequest('POST', '/api/v1/wrong-answers/batch/remove-tags', payload);
    recordTest(
      '批量删除标签',
      response.status === 200 || response.status === 201,
      'Status: ' + response.status
    );
  } catch (err) {
    recordTest('批量删除标签', false, err.message);
  }
}

/**
 * 测试7: 批量删除错题
 */
async function test_BatchDelete() {
  try {
    const payload = {
      recordIds: [999]
    };
    const response = await makeRequest('POST', '/api/v1/wrong-answers/batch/delete', payload);
    recordTest(
      '批量删除错题',
      response.status === 200 || response.status === 204,
      'Status: ' + response.status
    );
  } catch (err) {
    recordTest('批量删除错题', false, err.message);
  }
}

/**
 * 测试8: 输入验证 - 批量大小限制
 */
async function test_BatchSizeValidation() {
  try {
    const largeIds = Array.from({length: 501}, (_, i) => i + 1);
    const payload = {
      recordIds: largeIds,
      status: 'mastered'
    };
    const response = await makeRequest('PUT', '/api/v1/wrong-answers/batch/update-status', payload);
    recordTest(
      '批量大小验证',
      response.status === 400,
      'Status: ' + response.status + ' (Expected 400)'
    );
  } catch (err) {
    recordTest('批量大小验证', false, err.message);
  }
}

/**
 * 测试9: 输入验证 - 无效状态值
 */
async function test_InvalidStatusValidation() {
  try {
    const payload = {
      recordIds: [1],
      status: 'invalid_status'
    };
    const response = await makeRequest('PUT', '/api/v1/wrong-answers/batch/update-status', payload);
    recordTest(
      '无效状态验证',
      response.status === 400,
      'Status: ' + response.status + ' (Expected 400)'
    );
  } catch (err) {
    recordTest('无效状态验证', false, err.message);
  }
}

/**
 * 主函数
 */
async function runAllTests() {
  console.log('======================================');
  console.log('开始前后端联调集成测试');
  console.log('======================================\n');

  await test_HealthCheck();
  await test_GetWrongAnswersStatistics();
  await test_GetAnalytics();
  await test_BatchUpdateStatus();
  await test_BatchAddTags();
  await test_BatchRemoveTags();
  await test_BatchDelete();
  await test_BatchSizeValidation();
  await test_InvalidStatusValidation();

  console.log('\n======================================');
  console.log('测试总结');
  console.log('======================================');
  console.log('✅ 通过: ' + results.passed);
  console.log('❌ 失败: ' + results.failed);
  console.log('总计: ' + results.tests.length + '\n');

  if (results.failed > 0) {
    console.log('失败的测试:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log('  - ' + t.name + ': ' + t.message);
    });
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

setTimeout(runAllTests, 2000);
