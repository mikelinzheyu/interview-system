/**
 * AI面试系统 - 控制台演示脚本
 * 在浏览器控制台中直接执行此脚本
 *
 * 使用方法：
 * 1. 打开 http://localhost:5174/interview/ai
 * 2. 按 F12 打开开发者工具，切换到 Console 标签页
 * 3. 复制并粘贴本脚本内容，回车执行
 */

(async function runDemoInConsole() {
  console.clear();
  console.log('%c🎬 AI面试系统演示开始...', 'font-size: 20px; font-weight: bold; color: #667eea;');
  console.log('%c', 'font-size: 1px; line-height: 0.5px;');

  // 获取Vue应用实例
  let app = null;
  try {
    // 尝试从页面获取Vue组件实例
    const el = document.querySelector('#app');
    if (el && el.__vue__) {
      app = el.__vue__;
    } else if (el && el._vnode && el._vnode.component) {
      app = el._vnode.component.proxy;
    } else {
      // 尝试从window获取
      if (window.__APP__) {
        app = window.__APP__;
      }
    }

    if (!app) {
      throw new Error('无法找到Vue应用实例');
    }
  } catch (error) {
    console.error('%c❌ 获取应用实例失败:', 'color: #f56c6c; font-weight: bold;', error.message);
    console.log('%c💡 请确保已打开 http://localhost:5174/interview/ai 页面', 'color: #e6a23c;');
    return;
  }

  // 辅助函数
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function log(emoji, text) {
    console.log(`%c${emoji} ${text}`, 'font-size: 14px; color: #333;');
  }

  function logSuccess(text) {
    console.log(`%c✅ ${text}`, 'font-size: 14px; color: #67c23a; font-weight: bold;');
  }

  function logInfo(text) {
    console.log(`%c ℹ️ ${text}`, 'font-size: 13px; color: #909399;');
  }

  function logSection(title) {
    console.log('%c' + title, 'font-size: 16px; font-weight: bold; color: #409eff; text-decoration: underline; margin-top: 10px;');
  }

  try {
    // 第一步：选择专业和难度
    logSection('📌 第一步：选择专业和难度');
    log('🎯', '选择专业领域...');
    app.selectedProfession = '前端开发工程师';
    app.selectedDifficulty = '中级';
    logSuccess(`已选择: ${app.selectedProfession} (${app.selectedDifficulty}难度)`);
    logInfo('变量: selectedProfession, selectedDifficulty');
    await sleep(800);

    // 第二步：生成题目
    logSection('📌 第二步：生成AI面试题');
    log('🔄', '正在调用Dify AI生成题目...');

    app.currentQuestion = {
      id: Date.now(),
      question: '请详细解释React中虚拟DOM的工作原理，以及为什么虚拟DOM能够提高应用的性能？',
      expectedAnswer: '虚拟DOM是React的核心概念，它在内存中创建真实DOM的轻量级副本。当状态变化时，React会创建新的虚拟DOM树，通过Diff算法比较新旧树的差异，最后只更新必要的真实DOM元素。这样做的好处是：1) 减少直接操作真实DOM的次数，提高性能；2) 支持跨平台应用；3) 方便实现服务端渲染。',
      keywords: ['虚拟DOM', 'Diff算法', '性能优化', '架构设计'],
      category: '前端开发',
      difficulty: '中级',
      generatedBy: 'dify_workflow',
      confidenceScore: 0.92,
      smartGeneration: true,
      profession: '前端开发工程师',
      searchSource: 'dify_rag',
      sourceUrls: ['https://react.dev/learn/rendering-lists']
    };

    logSuccess('题目生成成功！');
    logInfo('生成的题目已填充到 currentQuestion');
    console.log('%c📝 问题内容', 'color: #409eff; font-weight: bold;');
    console.log(app.currentQuestion.question);
    console.log('%c🏷️ 题目信息', 'color: #409eff; font-weight: bold;');
    console.log(`   • 分类: ${app.currentQuestion.category}`);
    console.log(`   • 难度: ${app.currentQuestion.difficulty}`);
    console.log(`   • AI置信度: ${(app.currentQuestion.confidenceScore * 100).toFixed(0)}%`);
    console.log(`   • 来源: ${app.currentQuestion.searchSource}`);
    await sleep(1200);

    // 第三步：语音识别模拟
    logSection('📌 第三步：模拟语音识别');
    log('🎤', '正在进行实时语音识别...');

    const mockTranscripts = [
      '虚拟DOM是',
      '虚拟DOM是React的一个',
      '虚拟DOM是React的一个重要概念'
    ];

    for (const text of mockTranscripts) {
      app.interimTranscript = text;
      logInfo(`[实时识别] ${text}...`);
      await sleep(400);
    }

    // 最终识别文本
    app.finalTranscript =
      '虚拟DOM是React的一个重要概念。它在内存中创建真实DOM的一个轻量级副本。当我们的状态发生变化时，React会创建一个新的虚拟DOM树，然后通过Diff算法比较新旧树的差异。最后，React只会更新那些确实发生了变化的DOM元素，这样就减少了对真实DOM的操作次数。虚拟DOM能够提高应用的性能主要有三个原因：第一，减少了直接操作真实DOM的开销；第二，虚拟DOM支持跨平台应用的开发；第三，方便实现服务端渲染。';

    app.interimTranscript = '';
    logSuccess('语音识别完成！');
    console.log('%c📄 识别的完整文本', 'color: #409eff; font-weight: bold;');
    console.log(app.finalTranscript);
    await sleep(1000);

    // 第四步：AI分析
    logSection('📌 第四步：AI分析回答');
    log('🤖', 'Dify AI引擎正在分析您的回答...');

    app.analysisLoading = true;

    // 模拟进度条
    const progressSteps = [
      { percent: 0, bar: '▁▁▁▁▁' },
      { percent: 25, bar: '▃▃▃▃▃' },
      { percent: 50, bar: '▄▄▄▄▄' },
      { percent: 75, bar: '▅▅▅▅▅' },
      { percent: 100, bar: '▆▆▆▆▆' }
    ];

    for (const step of progressSteps) {
      logInfo(`[进度] ${step.percent}% ${step.bar}`);
      await sleep(400);
    }

    // 设置分析结果
    app.analysisResult = {
      overallScore: 82,
      summary: '回答整体思路清晰，概念理解准确。能够全面阐述虚拟DOM的核心作用和优势，展现了扎实的React基础知识。表达流畅自然，逻辑递进合理。',
      suggestions: [
        '可以深入讨论Diff算法的具体实现机制，例如key的作用',
        '可以举具体代码示例来说明虚拟DOM与真实DOM的关系',
        '可以补充讲解Fiber架构如何优化React的性能'
      ],
      technicalScore: 85,
      communicationScore: 80,
      logicalScore: 82,
      analysisEngine: 'dify_workflow',
      processingTime: 2847,
      difyAnalysis: true,
      standardAnswer: '虚拟DOM是React的核心概念...',
      sessionId: 'session_' + Date.now(),
      strengths: [
        '概念理解深入',
        '表达清晰流畅',
        '逻辑思路完整'
      ],
      weaknesses: [
        '缺少代码示例',
        '未涉及Fiber架构'
      ]
    };

    app.analysisLoading = false;
    logSuccess('AI分析完成！');
    await sleep(500);

    // 第五步：显示分析结果
    logSection('📌 第五步：分析结果详情');

    console.log('%c📊 总体评分', 'color: #409eff; font-weight: bold; font-size: 16px;');
    console.log(`   总体评分: ${app.analysisResult.overallScore}分 (优秀)`);
    console.log(`   技术能力: ${app.analysisResult.technicalScore}分`);
    console.log(`   表达能力: ${app.analysisResult.communicationScore}分`);
    console.log(`   逻辑思维: ${app.analysisResult.logicalScore}分`);
    console.log(`   处理时间: ${app.analysisResult.processingTime}ms`);

    console.log('%c💡 改进建议', 'color: #409eff; font-weight: bold; font-size: 16px; margin-top: 10px;');
    app.analysisResult.suggestions.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s}`);
    });

    console.log('%c✨ 优点分析', 'color: #67c23a; font-weight: bold; font-size: 16px; margin-top: 10px;');
    app.analysisResult.strengths.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s}`);
    });

    console.log('%c⚠️ 不足之处', 'color: #e6a23c; font-weight: bold; font-size: 16px; margin-top: 10px;');
    app.analysisResult.weaknesses.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w}`);
    });

    console.log('%c📝 总体评价', 'color: #409eff; font-weight: bold; font-size: 16px; margin-top: 10px;');
    console.log(`   ${app.analysisResult.summary}`);

    await sleep(800);

    // 第六步：准备下一题
    logSection('📌 第六步：准备下一题');
    log('🔄', '正在准备下一题...');

    app.finalTranscript = '';
    app.interimTranscript = '';
    app.analysisResult = null;

    app.currentQuestion = {
      id: Date.now() + 1,
      question: '在项目中遇到过哪些性能问题？你是如何定位和解决的？',
      expectedAnswer: '开放型问题，考察候选人的实战经验和问题解决能力。',
      keywords: ['性能优化', '问题定位', '实践经验'],
      category: '前端开发',
      difficulty: '中级',
      generatedBy: 'dify_workflow',
      confidenceScore: 0.88,
      smartGeneration: true,
      profession: '前端开发工程师'
    };

    logSuccess('下一题已准备好！');
    logInfo('新问题已加载到 currentQuestion');

    // 完成演示
    console.log('%c' + '═'.repeat(60), 'color: #409eff; font-weight: bold;');
    console.log('%c🎬 演示完成！', 'font-size: 18px; font-weight: bold; color: #67c23a;');
    console.log('%c' + '═'.repeat(60), 'color: #409eff; font-weight: bold;');

    console.log('%c📊 演示总结', 'color: #409eff; font-weight: bold; font-size: 14px;');
    console.log(`   • 处理题目数: 2个`);
    console.log(`   • 分析次数: 1次`);
    console.log(`   • 平均评分: 82分`);
    console.log(`   • 演示耗时: ~10秒`);

    console.log('%c💡 接下来你可以：', 'color: #409eff; font-weight: bold; font-size: 14px; margin-top: 10px;');
    console.log(`   1. 在页面上观看UI的实时更新`);
    console.log(`   2. 刷新页面重置所有数据`);
    console.log(`   3. 再次运行此脚本进行新的演示`);
    console.log(`   4. 修改app的属性来自定义演示内容`);

  } catch (error) {
    console.error('%c❌ 演示执行出错', 'font-size: 14px; font-weight: bold; color: #f56c6c;');
    console.error(error);
    console.log('%c请确保：', 'color: #e6a23c; font-weight: bold;');
    console.log(`   1. 已打开 http://localhost:5174/interview/ai`);
    console.log(`   2. 页面已完全加载`);
    console.log(`   3. 后端服务正在运行`);
  }
})();
