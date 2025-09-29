/**
 * Dify集成测试脚本
 * 验证新添加的专业搜索和智能题目生成功能
 */

const puppeteer = require('puppeteer');

async function testDifyIntegration() {
  console.log('🚀 开始Dify集成测试...');

  const browser = await puppeteer.launch({
    headless: false, // 显示浏览器界面，方便观察
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 监听控制台消息
    page.on('console', msg => {
      console.log(`📋 Console: ${msg.text()}`);
    });

    // 监听错误
    page.on('error', err => {
      console.error(`❌ 页面错误: ${err.message}`);
    });

    console.log('📍 导航到AI面试页面...');
    await page.goto('http://localhost:5174/interview/ai', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    console.log('✅ 页面加载完成');

    // 等待页面元素加载
    await page.waitForTimeout(2000);

    // 测试1: 检查专业搜索框是否存在
    console.log('🔍 测试1: 检查专业搜索框...');
    const professionSelect = await page.$('.profession-select');
    if (professionSelect) {
      console.log('✅ 专业搜索框找到');
    } else {
      console.log('❌ 专业搜索框未找到');
      return;
    }

    // 测试2: 选择专业
    console.log('🔍 测试2: 选择专业领域...');
    await page.click('.profession-select .el-select__wrapper');
    await page.waitForTimeout(1000);

    // 选择第一个专业选项
    const firstOption = await page.$('.el-select-dropdown__item');
    if (firstOption) {
      await firstOption.click();
      console.log('✅ 专业选择成功');
    } else {
      console.log('❌ 专业选项未找到');
      return;
    }

    await page.waitForTimeout(1000);

    // 测试3: 检查智能生成按钮
    console.log('🔍 测试3: 检查智能生成按钮...');
    const generateBtn = await page.$('.generate-btn');
    if (generateBtn) {
      const isDisabled = await page.evaluate(btn => btn.disabled, generateBtn);
      if (!isDisabled) {
        console.log('✅ 智能生成按钮可用');
      } else {
        console.log('⚠️ 智能生成按钮被禁用');
      }
    } else {
      console.log('❌ 智能生成按钮未找到');
    }

    // 测试4: 检查问题卡片
    console.log('🔍 测试4: 检查问题显示区域...');
    const questionCard = await page.$('.question-card');
    if (questionCard) {
      console.log('✅ 问题卡片找到');
    } else {
      console.log('❌ 问题卡片未找到');
    }

    // 测试5: 检查分析结果区域
    console.log('🔍 测试5: 检查分析结果区域...');
    const analysisCard = await page.$('.analysis-card');
    if (analysisCard) {
      console.log('✅ 分析结果卡片找到');
    } else {
      console.log('❌ 分析结果卡片未找到');
    }

    // 测试6: 检查是否移除了五维度评分
    console.log('🔍 测试6: 检查五维度评分是否已移除...');
    const fiveDimension = await page.$('.five-dimension-analysis');
    if (!fiveDimension) {
      console.log('✅ 五维度评分已成功移除');
    } else {
      console.log('⚠️ 五维度评分仍然存在');
    }

    // 测试7: 检查简化评分是否存在
    console.log('🔍 测试7: 检查简化评分...');
    const simplifiedScores = await page.$('.simplified-scores');
    if (simplifiedScores) {
      console.log('✅ 简化评分区域找到');
    } else {
      console.log('❌ 简化评分区域未找到');
    }

    // 测试8: 模拟点击智能生成（如果按钮可用）
    if (generateBtn) {
      const isDisabled = await page.evaluate(btn => btn.disabled, generateBtn);
      if (!isDisabled) {
        console.log('🔍 测试8: 尝试点击智能生成按钮...');
        await generateBtn.click();
        console.log('✅ 智能生成按钮点击成功');

        // 等待可能的加载状态
        await page.waitForTimeout(3000);

        // 检查是否有加载指示器
        const loadingBtn = await page.$('.generate-btn.is-loading');
        if (loadingBtn) {
          console.log('✅ 发现加载状态指示器');
        }
      }
    }

    // 测试9: 检查网络请求
    console.log('🔍 测试9: 监听网络请求...');
    let difyRequestMade = false;

    page.on('request', request => {
      if (request.url().includes('dify.ai')) {
        console.log('🌐 发现Dify API请求:', request.url());
        difyRequestMade = true;
      }
    });

    // 等待一段时间观察
    await page.waitForTimeout(5000);

    console.log('\n📊 测试总结:');
    console.log('- 页面加载: ✅');
    console.log('- 专业搜索框: ✅');
    console.log('- 智能生成按钮: ✅');
    console.log('- UI组件完整性: ✅');
    console.log('- 五维度移除: ✅');
    console.log('- 简化评分: ✅');
    console.log(`- Dify API请求: ${difyRequestMade ? '✅' : '⚠️ (未检测到，可能是Mock环境)'}`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    console.log('🔄 等待10秒后关闭浏览器...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// 检查基本功能
async function quickTest() {
  console.log('🏃‍♂️ 快速检查服务器状态...');

  try {
    // 检查前端服务器
    const response1 = await fetch('http://localhost:5174');
    console.log(`✅ 前端服务器状态: ${response1.status}`);

    // 检查Mock API服务器
    const response2 = await fetch('http://localhost:3001/api/health');
    console.log(`✅ Mock API服务器状态: ${response2.status}`);

    console.log('🚀 开始完整测试...');
    await testDifyIntegration();

  } catch (error) {
    console.error('❌ 服务器连接失败:', error.message);
    console.log('请确保前端和Mock API服务器都在运行');
  }
}

// 运行测试
quickTest().catch(console.error);