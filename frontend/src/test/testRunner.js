/**
 * 新功能模块测试运行器
 * 用于测试五大新增模块的基本功能
 */

// 导入测试模块
import systemCheckService from '../services/systemCheckService.js'
import resilientSessionService from '../services/resilientSessionService.js'
import visualReportService from '../services/visualReportService.js'
import eventDrivenBus from '../services/eventDrivenBus.js'

class TestRunner {
  constructor() {
    this.testResults = {
      systemCheck: { passed: 0, failed: 0, tests: [] },
      resilientSession: { passed: 0, failed: 0, tests: [] },
      visualReport: { passed: 0, failed: 0, tests: [] },
      eventBus: { passed: 0, failed: 0, tests: [] },
      overall: { passed: 0, failed: 0, total: 0 }
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始新功能模块测试...\n')

    try {
      await this.testSystemCheckService()
      await this.testResilientSessionService()
      await this.testVisualReportService()
      await this.testEventDrivenBus()

      this.generateTestReport()

    } catch (error) {
      console.error('❌ 测试运行失败:', error)
    }
  }

  /**
   * 测试智能系统检测服务
   */
  async testSystemCheckService() {
    console.log('🔍 测试智能诊断引擎...')
    const category = 'systemCheck'

    // 测试1: 服务初始化
    await this.runTest(category, '服务初始化', async () => {
      const service = systemCheckService
      this.assert(service !== null, '服务实例应该存在')
      this.assert(typeof service.performFullSystemCheck === 'function', '应该有performFullSystemCheck方法')
      return true
    })

    // 测试2: 检测矩阵结构
    await this.runTest(category, '检测矩阵结构', async () => {
      const service = systemCheckService
      this.assert(service.checkMatrix, '应该有checkMatrix配置')
      this.assert(service.checkMatrix.deviceLayer, '应该有设备层检测')
      this.assert(service.checkMatrix.networkLayer, '应该有网络层检测')
      this.assert(service.checkMatrix.browserLayer, '应该有浏览器层检测')
      this.assert(service.checkMatrix.profileLayer, '应该有配置层检测')
      return true
    })

    // 测试3: 错误处理引擎
    await this.runTest(category, '错误处理引擎', async () => {
      const service = systemCheckService
      this.assert(service.errorHandlingEngine, '应该有错误处理引擎')
      this.assert(service.errorHandlingEngine.errorKnowledgeBase, '应该有错误知识库')
      this.assert(service.errorHandlingEngine.autoRepair, '应该有自动修复配置')

      const knowledgeBase = service.errorHandlingEngine.errorKnowledgeBase
      this.assert(knowledgeBase['CAMERA_PERMISSION_DENIED'], '应该有摄像头权限错误处理')
      this.assert(knowledgeBase['LOW_BANDWIDTH'], '应该有低带宽错误处理')
      return true
    })

    // 测试4: 模拟系统检查（不涉及实际硬件）
    await this.runTest(category, '模拟系统检查', async () => {
      let progressCalled = false
      const mockProgress = (data) => {
        progressCalled = true
        console.log(`  📊 检查进度: ${data.stage} - ${data.progress}%`)
      }

      // 由于涉及硬件权限，这里只测试方法存在性
      const service = systemCheckService
      this.assert(typeof service.checkDeviceLayer === 'function', '应该有设备检测方法')
      this.assert(typeof service.checkNetworkLayer === 'function', '应该有网络检测方法')
      this.assert(typeof service.checkBrowserLayer === 'function', '应该有浏览器检测方法')
      this.assert(typeof service.checkProfileLayer === 'function', '应该有配置检测方法')

      return true
    })

    console.log('✅ 智能诊断引擎测试完成\n')
  }

  /**
   * 测试弹性会话服务
   */
  async testResilientSessionService() {
    console.log('🛡️ 测试弹性会话架构...')
    const category = 'resilientSession'

    // 测试1: 服务初始化和配置
    await this.runTest(category, '服务初始化', async () => {
      const service = resilientSessionService
      this.assert(service !== null, '服务实例应该存在')
      this.assert(service.sessionState, '应该有会话状态')
      this.assert(service.resilience, '应该有弹性配置')
      this.assert(service.aiServiceFallback, '应该有AI服务降级配置')
      return true
    })

    // 测试2: 会话状态管理
    await this.runTest(category, '会话状态管理', async () => {
      const service = resilientSessionService
      const initialState = service.sessionState

      this.assert(initialState.status === 'idle', '初始状态应该是idle')
      this.assert(Array.isArray(initialState.answers), 'answers应该是数组')
      this.assert(typeof initialState.currentQuestionIndex === 'number', 'currentQuestionIndex应该是数字')
      return true
    })

    // 测试3: 事件发射能力
    await this.runTest(category, '事件发射能力', async () => {
      const service = resilientSessionService
      let eventReceived = false

      service.once('test-event', () => {
        eventReceived = true
      })

      service.emit('test-event')

      this.assert(eventReceived, '应该能够发射和接收事件')
      return true
    })

    // 测试4: 降级服务配置
    await this.runTest(category, '降级服务配置', async () => {
      const service = resilientSessionService
      const fallback = service.aiServiceFallback

      this.assert(fallback.questionGeneration, '应该有问题生成降级配置')
      this.assert(fallback.answerAnalysis, '应该有答案分析降级配置')

      this.assert(fallback.questionGeneration.primary === 'smartQuestionGenerator', '主服务应该是智能问题生成器')
      this.assert(fallback.answerAnalysis.primary === 'fiveDimensionAnalyzer', '主服务应该是五维度分析器')
      return true
    })

    // 测试5: 自适应参数
    await this.runTest(category, '自适应难度调整', async () => {
      const service = resilientSessionService
      const adaptive = service.adaptiveQuestionFlow

      this.assert(adaptive.difficultyAdaptation, '应该有难度自适应配置')
      this.assert(adaptive.multiPathFlow, '应该有多路径流程配置')

      this.assert(typeof adaptive.difficultyAdaptation.currentDifficulty === 'number', '应该有当前难度值')
      return true
    })

    console.log('✅ 弹性会话架构测试完成\n')
  }

  /**
   * 测试多维可视化服务
   */
  async testVisualReportService() {
    console.log('📊 测试多维可视化引擎...')
    const category = 'visualReport'

    // 测试1: 服务初始化
    await this.runTest(category, '服务初始化', async () => {
      const service = visualReportService
      this.assert(service !== null, '服务实例应该存在')
      this.assert(service.chartTypes, '应该有图表类型配置')
      this.assert(service.exportEngine, '应该有导出引擎配置')
      this.assert(service.industryBenchmarks, '应该有行业基准数据')
      return true
    })

    // 测试2: 图表类型配置
    await this.runTest(category, '图表类型配置', async () => {
      const service = visualReportService
      const chartTypes = service.chartTypes

      this.assert(chartTypes.radarChart, '应该有雷达图配置')
      this.assert(chartTypes.timelineChart, '应该有时间线图配置')
      this.assert(chartTypes.wordCloud, '应该有词云图配置')
      this.assert(chartTypes.skillGapMatrix, '应该有技能缺口矩阵配置')
      this.assert(chartTypes.progressRing, '应该有进度环配置')
      return true
    })

    // 测试3: 导出引擎配置
    await this.runTest(category, '导出引擎配置', async () => {
      const service = visualReportService
      const exportEngine = service.exportEngine

      this.assert(Array.isArray(exportEngine.formats), '导出格式应该是数组')
      this.assert(exportEngine.formats.includes('PDF'), '应该支持PDF导出')
      this.assert(exportEngine.formats.includes('PNG'), '应该支持PNG导出')
      this.assert(exportEngine.templates, '应该有报告模板')
      this.assert(exportEngine.templates.candidate, '应该有候选人模板')
      this.assert(exportEngine.templates.hr, '应该有HR模板')
      return true
    })

    // 测试4: 行业基准数据
    await this.runTest(category, '行业基准数据', async () => {
      const service = visualReportService
      const benchmarks = service.industryBenchmarks

      this.assert(benchmarks.frontend, '应该有前端行业数据')
      this.assert(benchmarks.backend, '应该有后端行业数据')
      this.assert(benchmarks.fullstack, '应该有全栈行业数据')

      this.assert(benchmarks.frontend.junior, '前端应该有初级数据')
      this.assert(benchmarks.frontend.mid, '前端应该有中级数据')
      this.assert(benchmarks.frontend.senior, '前端应该有高级数据')
      return true
    })

    // 测试5: 报告生成方法
    await this.runTest(category, '报告生成方法', async () => {
      const service = visualReportService

      this.assert(typeof service.generateVisualReport === 'function', '应该有报告生成方法')
      this.assert(typeof service.createRadarChart === 'function', '应该有雷达图创建方法')
      this.assert(typeof service.createTimelineChart === 'function', '应该有时间线图创建方法')
      this.assert(typeof service.exportReport === 'function', '应该有报告导出方法')
      return true
    })

    console.log('✅ 多维可视化引擎测试完成\n')
  }

  /**
   * 测试事件驱动总线
   */
  async testEventDrivenBus() {
    console.log('⚡ 测试事件驱动总线...')
    const category = 'eventBus'

    // 测试1: 总线初始化
    await this.runTest(category, '总线初始化', async () => {
      const bus = eventDrivenBus
      this.assert(bus !== null, '总线实例应该存在')
      this.assert(bus.eventRoutes, '应该有事件路由配置')
      this.assert(bus.microservices, '应该有微服务注册表')
      this.assert(bus.eventPriorities, '应该有事件优先级配置')
      return true
    })

    // 测试2: 事件发布和订阅
    await this.runTest(category, '事件发布和订阅', async () => {
      const bus = eventDrivenBus
      let eventReceived = false
      let receivedPayload = null

      const subscriptionId = bus.subscribe('test.event', (payload) => {
        eventReceived = true
        receivedPayload = payload
      })

      await bus.publish('test.event', { test: 'data' })

      // 等待异步事件处理
      await new Promise(resolve => setTimeout(resolve, 50))

      this.assert(eventReceived, '应该接收到发布的事件')
      this.assert(receivedPayload.test === 'data', '应该接收到正确的载荷')

      bus.unsubscribe(subscriptionId)
      return true
    })

    // 测试3: 事件路由
    await this.runTest(category, '事件路由', async () => {
      const bus = eventDrivenBus
      const routes = bus.eventRoutes

      this.assert(routes.has('system.check.started'), '应该有系统检查启动路由')
      this.assert(routes.has('interview.started'), '应该有面试启动路由')
      this.assert(routes.has('analysis.completed'), '应该有分析完成路由')

      const systemCheckRoutes = routes.get('system.check.started')
      this.assert(Array.isArray(systemCheckRoutes), '路由应该是数组')
      this.assert(systemCheckRoutes.length > 0, '应该有具体的路由目标')
      return true
    })

    // 测试4: 微服务注册
    await this.runTest(category, '微服务注册', async () => {
      const bus = eventDrivenBus

      bus.registerMicroservice('test-service', {
        events: ['test.*'],
        metadata: { version: '1.0' }
      })

      this.assert(bus.microservices.has('test-service'), '应该成功注册微服务')

      const service = bus.microservices.get('test-service')
      this.assert(service.status === 'active', '新注册服务状态应该是active')
      this.assert(service.events.includes('test.*'), '应该记录服务事件模式')

      bus.unregisterMicroservice('test-service')
      return true
    })

    // 测试5: 批量事件发布
    await this.runTest(category, '批量事件发布', async () => {
      const bus = eventDrivenBus

      const events = [
        { name: 'batch.test.1', payload: { id: 1 }, options: { priority: 8 } },
        { name: 'batch.test.2', payload: { id: 2 }, options: { priority: 5 } },
        { name: 'batch.test.3', payload: { id: 3 }, options: { priority: 9 } }
      ]

      const results = await bus.publishBatch(events)

      this.assert(Array.isArray(results), '批量发布应该返回结果数组')
      this.assert(results.length === 3, '应该有3个结果')
      this.assert(results.every(r => r.success), '所有事件应该发布成功')
      return true
    })

    console.log('✅ 事件驱动总线测试完成\n')
  }

  /**
   * 运行单个测试
   */
  async runTest(category, testName, testFunction) {
    try {
      console.log(`  🧪 ${testName}...`)
      await testFunction()
      this.testResults[category].passed++
      this.testResults[category].tests.push({
        name: testName,
        status: 'passed',
        time: Date.now()
      })
      console.log(`    ✅ 通过`)
    } catch (error) {
      this.testResults[category].failed++
      this.testResults[category].tests.push({
        name: testName,
        status: 'failed',
        error: error.message,
        time: Date.now()
      })
      console.log(`    ❌ 失败: ${error.message}`)
    }
  }

  /**
   * 断言工具
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || '断言失败')
    }
  }

  /**
   * 生成测试报告
   */
  generateTestReport() {
    console.log('\n📋 测试报告 ===================')

    let totalPassed = 0
    let totalFailed = 0

    Object.keys(this.testResults).forEach(category => {
      if (category === 'overall') return

      const result = this.testResults[category]
      const total = result.passed + result.failed
      const passRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0'

      console.log(`\n${this.getCategoryName(category)}:`)
      console.log(`  通过: ${result.passed}  失败: ${result.failed}  通过率: ${passRate}%`)

      if (result.failed > 0) {
        console.log(`  失败的测试:`)
        result.tests
          .filter(test => test.status === 'failed')
          .forEach(test => {
            console.log(`    ❌ ${test.name}: ${test.error}`)
          })
      }

      totalPassed += result.passed
      totalFailed += result.failed
    })

    // 总体统计
    const totalTests = totalPassed + totalFailed
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0'

    this.testResults.overall = {
      passed: totalPassed,
      failed: totalFailed,
      total: totalTests,
      passRate: overallPassRate
    }

    console.log('\n=== 总体结果 ===')
    console.log(`总测试数: ${totalTests}`)
    console.log(`通过: ${totalPassed}`)
    console.log(`失败: ${totalFailed}`)
    console.log(`通过率: ${overallPassRate}%`)

    if (totalFailed === 0) {
      console.log('\n🎉 所有测试通过！新功能模块运行正常！')
    } else {
      console.log(`\n⚠️  有 ${totalFailed} 个测试失败，请检查相关模块`)
    }

    console.log('\n测试完成时间:', new Date().toLocaleString())
  }

  getCategoryName(category) {
    const names = {
      systemCheck: '🔍 智能诊断引擎',
      resilientSession: '🛡️ 弹性会话架构',
      visualReport: '📊 多维可视化引擎',
      eventBus: '⚡ 事件驱动总线'
    }
    return names[category] || category
  }
}

// 创建测试运行器实例
const testRunner = new TestRunner()

// 导出测试函数供外部调用
export const runModuleTests = () => testRunner.runAllTests()
export const getTestResults = () => testRunner.testResults

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.runModuleTests = runModuleTests
  console.log('💡 新功能测试已准备就绪！在浏览器控制台中运行 runModuleTests() 开始测试')
} else {
  // Node.js环境
  runModuleTests()
}