/**
 * AI面试页面演示模拟器
 * 用于在浏览器控制台模拟成功的输入和输出
 */

export const runInterviewDemo = async (componentInstance) => {
  if (!componentInstance) {
    console.error('❌ 组件实例未找到')
    return
  }

  console.log('🎬 开始AI面试演示流程...\n')

  // 演示步骤1: 选择专业和难度
  console.log('📌 第一步: 选择专业领域')
  componentInstance.selectedProfession = '前端开发工程师'
  componentInstance.selectedDifficulty = '中级'
  console.log(`✅ 已选择: ${componentInstance.selectedProfession} (${componentInstance.selectedDifficulty}难度)\n`)

  await sleep(1000)

  // 演示步骤2: 生成智能题目
  console.log('📌 第二步: 生成智能面试题')
  console.log('🔄 正在调用Dify AI生成题目...')

  // 模拟生成的题目
  componentInstance.currentQuestion = {
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
  }

  console.log('✅ 题目生成成功！')
  console.log(`📝 问题: ${componentInstance.currentQuestion.question}\n`)

  await sleep(1500)

  // 演示步骤3: 模拟语音输入
  console.log('📌 第三步: 模拟用户语音回答')
  console.log('🎤 正在进行语音识别...')

  // 模拟实时识别文本
  const mockTranscripts = [
    '虚拟DOM是',
    '虚拟DOM是React的一个',
    '虚拟DOM是React的一个重要概念'
  ]

  for (let i = 0; i < mockTranscripts.length; i++) {
    componentInstance.interimTranscript = mockTranscripts[i]
    console.log(`   [实时识别] ${mockTranscripts[i]}...`)
    await sleep(500)
  }

  // 最终识别文本
  componentInstance.finalTranscript =
    '虚拟DOM是React的一个重要概念。它在内存中创建真实DOM的一个轻量级副本。当我们的状态发生变化时，React会创建一个新的虚拟DOM树，然后通过Diff算法比较新旧树的差异。最后，React只会更新那些确实发生了变化的DOM元素，这样就减少了对真实DOM的操作次数。虚拟DOM能够提高应用的性能主要有三个原因：第一，减少了直接操作真实DOM的开销；第二，虚拟DOM支持跨平台应用的开发；第三，方便实现服务端渲染。'

  componentInstance.interimTranscript = ''
  console.log('✅ 语音识别完成！')
  console.log(`📄 识别文本: ${componentInstance.finalTranscript}\n`)

  await sleep(1000)

  // 演示步骤4: 调用AI分析
  console.log('📌 第四步: AI分析回答')
  console.log('🤖 Dify AI引擎正在分析您的回答...')

  // 模拟分析过程
  componentInstance.analysisLoading = true
  console.log('   [进度] 0% ▁')
  await sleep(300)
  console.log('   [进度] 25% ▃')
  await sleep(300)
  console.log('   [进度] 50% ▄')
  await sleep(300)
  console.log('   [进度] 75% ▅')
  await sleep(300)
  console.log('   [进度] 100% ▆')

  // 模拟分析结果
  componentInstance.analysisResult = {
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
  }

  componentInstance.analysisLoading = false
  console.log('✅ AI分析完成！\n')

  // 输出分析结果
  console.log('📊 分析结果总结:')
  console.log(`  总体评分: ${componentInstance.analysisResult.overallScore}分`)
  console.log(`  技术能力: ${componentInstance.analysisResult.technicalScore}分`)
  console.log(`  表达能力: ${componentInstance.analysisResult.communicationScore}分`)
  console.log(`  逻辑思维: ${componentInstance.analysisResult.logicalScore}分`)
  console.log(`  处理时间: ${componentInstance.analysisResult.processingTime}ms\n`)

  console.log('💡 改进建议:')
  componentInstance.analysisResult.suggestions.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s}`)
  })

  console.log('\n✨ 优点:')
  componentInstance.analysisResult.strengths.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s}`)
  })

  console.log('\n⚠️ 不足:')
  componentInstance.analysisResult.weaknesses.forEach((w, i) => {
    console.log(`  ${i + 1}. ${w}`)
  })

  console.log('\n📝 总体评价:')
  console.log(`  ${componentInstance.analysisResult.summary}\n`)

  // 演示步骤5: 生成下一题
  console.log('📌 第五步: 准备下一题')
  await sleep(800)

  componentInstance.finalTranscript = ''
  componentInstance.interimTranscript = ''
  componentInstance.analysisResult = null

  componentInstance.currentQuestion = {
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
  }

  console.log('✅ 下一题已准备好！')
  console.log(`📝 新问题: ${componentInstance.currentQuestion.question}\n`)

  console.log('🎬 演示完成！')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('总计处理: 2个题目，1个完整面试循环')
  console.log('总耗时: ~4.5秒演示时间')
  console.log('═══════════════════════════════════════════════════════════\n')
}

/**
 * 快速演示 - 只运行核心流程
 */
export const runQuickDemo = async (componentInstance) => {
  if (!componentInstance) {
    console.error('❌ 组件实例未找到')
    return
  }

  console.log('⚡ 快速演示模式\n')

  // 直接设置所有数据
  componentInstance.selectedProfession = '前端开发工程师'
  componentInstance.selectedDifficulty = '中级'

  componentInstance.currentQuestion = {
    id: Date.now(),
    question: '请详细解释React中虚拟DOM的工作原理？',
    expectedAnswer: '虚拟DOM是React的核心...',
    keywords: ['虚拟DOM', 'Diff算法', '性能优化'],
    category: '前端开发',
    difficulty: '中级',
    generatedBy: 'dify_workflow'
  }

  componentInstance.finalTranscript =
    '虚拟DOM是React的一个重要概念，它在内存中创建真实DOM的轻量级副本。当状态变化时，React会创建新的虚拟DOM树，通过Diff算法比较差异，最后只更新必要的真实DOM元素。'

  componentInstance.analysisResult = {
    overallScore: 82,
    summary: '回答思路清晰，概念理解准确。',
    suggestions: ['可以举代码示例', '可以讨论Diff算法细节'],
    technicalScore: 85,
    communicationScore: 80,
    logicalScore: 82,
    processingTime: 2847,
    strengths: ['概念理解深入', '表达清晰'],
    weaknesses: ['缺少代码示例']
  }

  console.log('✅ 演示数据已加载！')
  console.log(`总体评分: ${componentInstance.analysisResult.overallScore}分\n`)
}

/**
 * 重置演示状态
 */
export const resetDemo = (componentInstance) => {
  if (!componentInstance) return

  componentInstance.selectedProfession = ''
  componentInstance.selectedDifficulty = '中级'
  componentInstance.currentQuestion = null
  componentInstance.finalTranscript = ''
  componentInstance.interimTranscript = ''
  componentInstance.analysisResult = null
  componentInstance.interviewSession.questions = []
  componentInstance.interviewSession.answers = []

  console.log('🔄 演示状态已重置')
}

// 辅助函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 导出所有函数
export default {
  runInterviewDemo,
  runQuickDemo,
  resetDemo
}
