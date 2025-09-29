/**
 * Dify集成功能测试
 * 验证前端Dify服务调用
 */

const http = require('http');

const API_BASE = 'http://localhost:3001/api';

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            data: res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testDifyIntegration() {
  console.log('🤖 开始Dify集成测试\n');

  // 测试专业字段智能问题生成
  console.log('📝 测试专业字段智能问题生成...');
  try {
    const response = await httpRequest(`${API_BASE}/interview/generate-question-smart`, {
      method: 'POST',
      body: {
        profession: '前端开发工程师',
        experience: '3年',
        difficulty: 'medium',
        category: 'JavaScript'
      }
    });

    if (response.status === 200 && response.data.code === 200) {
      console.log('✅ 智能问题生成成功');
      console.log(`   问题: ${response.data.data.question}`);
      console.log(`   难度: ${response.data.data.difficulty}`);
      console.log(`   来源: ${response.data.data.source}`);
      console.log(`   智能生成: ${response.data.data.smartGeneration}`);
      console.log(`   置信度: ${response.data.data.confidenceScore.toFixed(3)}`);
    } else {
      console.log('❌ 智能问题生成失败');
    }
  } catch (error) {
    console.log('❌ 智能问题生成出错:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试回答分析
  console.log('🔍 测试回答分析功能...');
  try {
    const response = await httpRequest(`${API_BASE}/interview/analyze-advanced`, {
      method: 'POST',
      body: {
        question: 'Vue.js的响应式原理是什么？请详细说明数据劫持和发布订阅模式的实现过程。',
        answer: 'Vue.js的响应式原理主要基于数据劫持和发布订阅模式。首先，Vue使用Object.defineProperty()或Proxy来劫持数据的getter和setter。当数据被访问时，会触发getter进行依赖收集，将当前的Watcher添加到依赖列表中。当数据发生变化时，会触发setter，通知所有依赖该数据的Watcher进行更新。这样就实现了数据变化时自动更新视图的响应式机制。',
        metadata: {
          duration: 45000,
          wordCount: 120,
          profession: '前端开发'
        }
      }
    });

    if (response.status === 200 && response.data.code === 200) {
      console.log('✅ 回答分析成功');
      const analysis = response.data.data;
      console.log(`   总分: ${analysis.overallScore}分`);
      console.log('   维度评分:');
      console.log(`     技术理解: ${analysis.dimensions.technical}分`);
      console.log(`     表达沟通: ${analysis.dimensions.communication}分`);
      console.log(`     逻辑思维: ${analysis.dimensions.logic}分`);
      console.log(`     综合能力: ${analysis.dimensions.comprehensive}分`);
      console.log(`     创新思维: ${analysis.dimensions.innovation}分`);
      console.log(`   反馈: ${analysis.feedback}`);
      console.log(`   智能分析: ${analysis.smartGeneration}`);
      console.log(`   算法版本: ${analysis.algorithmVersion}`);
      console.log(`   置信度: ${analysis.confidenceScore.toFixed(3)}`);
    } else {
      console.log('❌ 回答分析失败');
    }
  } catch (error) {
    console.log('❌ 回答分析出错:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试统计数据
  console.log('📊 测试统计数据功能...');
  try {
    const response = await httpRequest(`${API_BASE}/users/statistics?detail=true`);

    if (response.status === 200 && response.data.code === 200) {
      console.log('✅ 统计数据获取成功');
      const stats = response.data.data;
      console.log(`   面试次数: ${stats.formatted.interviewCount.formatted}`);
      console.log(`   练习时长: ${stats.formatted.practiceTime.formatted}`);
      console.log(`   平均分数: ${stats.formatted.averageScore.formatted}`);
      console.log(`   用户等级: ${stats.formatted.rank.formatted}`);
      console.log(`   成就数量: ${stats.achievements.filter(a => a.unlocked).length}个已解锁`);
    } else {
      console.log('❌ 统计数据获取失败');
    }
  } catch (error) {
    console.log('❌ 统计数据获取出错:', error.message);
  }

  console.log('\n🎉 Dify集成测试完成！');
  console.log('\n🌐 现在可以访问以下URL进行手动测试:');
  console.log('   前端首页: http://localhost:5174');
  console.log('   AI面试页面: http://localhost:5174/interview/ai');
  console.log('   用户登录: http://localhost:5174/auth/login');
  console.log('   统计页面: http://localhost:5174/');
}

// 运行测试
testDifyIntegration().catch(console.error);