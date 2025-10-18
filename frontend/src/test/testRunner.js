/**
 * 鏂板姛鑳芥ā鍧楁祴璇曡繍琛屽櫒
 * 鐢ㄤ簬娴嬭瘯浜斿ぇ鏂板妯″潡鐨勫熀鏈姛鑳?
 */

// 瀵煎叆娴嬭瘯妯″潡
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
   * 杩愯鎵€鏈夋祴璇?
   */
  async runAllTests() {
    console.log('馃И 寮€濮嬫柊鍔熻兘妯″潡娴嬭瘯...\n')

    try {
      await this.testSystemCheckService()
      await this.testResilientSessionService()
      await this.testVisualReportService()
      await this.testEventDrivenBus()

      this.generateTestReport()

    } catch (error) {
      console.error('鉂?娴嬭瘯杩愯澶辫触:', error)
    }
  }

  /**
   * 娴嬭瘯鏅鸿兘绯荤粺妫€娴嬫湇鍔?
   */
  async testSystemCheckService() {
    console.log('馃攳 娴嬭瘯鏅鸿兘璇婃柇寮曟搸...')
    const category = 'systemCheck'

    // 娴嬭瘯1: 鏈嶅姟鍒濆鍖?
    await this.runTest(category, '鏈嶅姟鍒濆鍖?, async () => {
      const service = systemCheckService
      this.assert(service !== null, '鏈嶅姟瀹炰緥搴旇瀛樺湪')
      this.assert(typeof service.performFullSystemCheck === 'function', '搴旇鏈塸erformFullSystemCheck鏂规硶')
      return true
    })

    // 娴嬭瘯2: 妫€娴嬬煩闃电粨鏋?
    await this.runTest(category, '妫€娴嬬煩闃电粨鏋?, async () => {
      const service = systemCheckService
      this.assert(service.checkMatrix, '搴旇鏈塩heckMatrix閰嶇疆')
      this.assert(service.checkMatrix.deviceLayer, '搴旇鏈夎澶囧眰妫€娴?)
      this.assert(service.checkMatrix.networkLayer, '搴旇鏈夌綉缁滃眰妫€娴?)
      this.assert(service.checkMatrix.browserLayer, '搴旇鏈夋祻瑙堝櫒灞傛娴?)
      this.assert(service.checkMatrix.profileLayer, '搴旇鏈夐厤缃眰妫€娴?)
      return true
    })

    // 娴嬭瘯3: 閿欒澶勭悊寮曟搸
    await this.runTest(category, '閿欒澶勭悊寮曟搸', async () => {
      const service = systemCheckService
      this.assert(service.errorHandlingEngine, '搴旇鏈夐敊璇鐞嗗紩鎿?)
      this.assert(service.errorHandlingEngine.errorKnowledgeBase, '搴旇鏈夐敊璇煡璇嗗簱')
      this.assert(service.errorHandlingEngine.autoRepair, '搴旇鏈夎嚜鍔ㄤ慨澶嶉厤缃?)

      const knowledgeBase = service.errorHandlingEngine.errorKnowledgeBase
      this.assert(knowledgeBase['CAMERA_PERMISSION_DENIED'], '搴旇鏈夋憚鍍忓ご鏉冮檺閿欒澶勭悊')
      this.assert(knowledgeBase['LOW_BANDWIDTH'], '搴旇鏈変綆甯﹀閿欒澶勭悊')
      return true
    })

    // 娴嬭瘯4: 妯℃嫙绯荤粺妫€鏌ワ紙涓嶆秹鍙婂疄闄呯‖浠讹級
    await this.runTest(category, '妯℃嫙绯荤粺妫€鏌?, async () => {
      let progressCalled = false
      const mockProgress = (data) => {
        progressCalled = true
        console.log(`  馃搳 妫€鏌ヨ繘搴? ${data.stage} - ${data.progress}%`)
      }

      mockProgress({ stage: 'init', progress: 0 })
      this.assert(progressCalled, 'Progress callback should be callable')

      // 鐢变簬娑夊強纭欢鏉冮檺锛岃繖閲屽彧娴嬭瘯鏂规硶瀛樺湪鎬?
      const service = systemCheckService
      this.assert(typeof service.checkDeviceLayer === 'function', '搴旇鏈夎澶囨娴嬫柟娉?)
      this.assert(typeof service.checkNetworkLayer === 'function', '搴旇鏈夌綉缁滄娴嬫柟娉?)
      this.assert(typeof service.checkBrowserLayer === 'function', '搴旇鏈夋祻瑙堝櫒妫€娴嬫柟娉?)
      this.assert(typeof service.checkProfileLayer === 'function', '搴旇鏈夐厤缃娴嬫柟娉?)

      return true
    })

    console.log('鉁?鏅鸿兘璇婃柇寮曟搸娴嬭瘯瀹屾垚\n')
  }

  /**
   * 娴嬭瘯寮规€т細璇濇湇鍔?
   */
  async testResilientSessionService() {
    console.log('馃洝锔?娴嬭瘯寮规€т細璇濇灦鏋?..')
    const category = 'resilientSession'

    // 娴嬭瘯1: 鏈嶅姟鍒濆鍖栧拰閰嶇疆
    await this.runTest(category, '鏈嶅姟鍒濆鍖?, async () => {
      const service = resilientSessionService
      this.assert(service !== null, '鏈嶅姟瀹炰緥搴旇瀛樺湪')
      this.assert(service.sessionState, '搴旇鏈変細璇濈姸鎬?)
      this.assert(service.resilience, '搴旇鏈夊脊鎬ч厤缃?)
      this.assert(service.aiServiceFallback, '搴旇鏈堿I鏈嶅姟闄嶇骇閰嶇疆')
      return true
    })

    // 娴嬭瘯2: 浼氳瘽鐘舵€佺鐞?
    await this.runTest(category, '浼氳瘽鐘舵€佺鐞?, async () => {
      const service = resilientSessionService
      const initialState = service.sessionState

      this.assert(initialState.status === 'idle', '鍒濆鐘舵€佸簲璇ユ槸idle')
      this.assert(Array.isArray(initialState.answers), 'answers搴旇鏄暟缁?)
      this.assert(typeof initialState.currentQuestionIndex === 'number', 'currentQuestionIndex搴旇鏄暟瀛?)
      return true
    })

    // 娴嬭瘯3: 浜嬩欢鍙戝皠鑳藉姏
    await this.runTest(category, '浜嬩欢鍙戝皠鑳藉姏', async () => {
      const service = resilientSessionService
      let eventReceived = false

      service.once('test-event', () => {
        eventReceived = true
      })

      service.emit('test-event')

      this.assert(eventReceived, '搴旇鑳藉鍙戝皠鍜屾帴鏀朵簨浠?)
      return true
    })

    // 娴嬭瘯4: 闄嶇骇鏈嶅姟閰嶇疆
    await this.runTest(category, '闄嶇骇鏈嶅姟閰嶇疆', async () => {
      const service = resilientSessionService
      const fallback = service.aiServiceFallback

      this.assert(fallback.questionGeneration, '搴旇鏈夐棶棰樼敓鎴愰檷绾ч厤缃?)
      this.assert(fallback.answerAnalysis, '搴旇鏈夌瓟妗堝垎鏋愰檷绾ч厤缃?)

      this.assert(fallback.questionGeneration.primary === 'smartQuestionGenerator', '涓绘湇鍔″簲璇ユ槸鏅鸿兘闂鐢熸垚鍣?)
      this.assert(fallback.answerAnalysis.primary === 'fiveDimensionAnalyzer', '涓绘湇鍔″簲璇ユ槸浜旂淮搴﹀垎鏋愬櫒')
      return true
    })

    // 娴嬭瘯5: 鑷€傚簲鍙傛暟
    await this.runTest(category, '鑷€傚簲闅惧害璋冩暣', async () => {
      const service = resilientSessionService
      const adaptive = service.adaptiveQuestionFlow

      this.assert(adaptive.difficultyAdaptation, '搴旇鏈夐毦搴﹁嚜閫傚簲閰嶇疆')
      this.assert(adaptive.multiPathFlow, '搴旇鏈夊璺緞娴佺▼閰嶇疆')

      this.assert(typeof adaptive.difficultyAdaptation.currentDifficulty === 'number', '搴旇鏈夊綋鍓嶉毦搴﹀€?)
      return true
    })

    console.log('鉁?寮规€т細璇濇灦鏋勬祴璇曞畬鎴怽n')
  }

  /**
   * 娴嬭瘯澶氱淮鍙鍖栨湇鍔?
   */
  async testVisualReportService() {
    console.log('馃搳 娴嬭瘯澶氱淮鍙鍖栧紩鎿?..')
    const category = 'visualReport'

    // 娴嬭瘯1: 鏈嶅姟鍒濆鍖?
    await this.runTest(category, '鏈嶅姟鍒濆鍖?, async () => {
      const service = visualReportService
      this.assert(service !== null, '鏈嶅姟瀹炰緥搴旇瀛樺湪')
      this.assert(service.chartTypes, '搴旇鏈夊浘琛ㄧ被鍨嬮厤缃?)
      this.assert(service.exportEngine, '搴旇鏈夊鍑哄紩鎿庨厤缃?)
      this.assert(service.industryBenchmarks, '搴旇鏈夎涓氬熀鍑嗘暟鎹?)
      return true
    })

    // 娴嬭瘯2: 鍥捐〃绫诲瀷閰嶇疆
    await this.runTest(category, '鍥捐〃绫诲瀷閰嶇疆', async () => {
      const service = visualReportService
      const chartTypes = service.chartTypes

      this.assert(chartTypes.radarChart, '搴旇鏈夐浄杈惧浘閰嶇疆')
      this.assert(chartTypes.timelineChart, '搴旇鏈夋椂闂寸嚎鍥鹃厤缃?)
      this.assert(chartTypes.wordCloud, '搴旇鏈夎瘝浜戝浘閰嶇疆')
      this.assert(chartTypes.skillGapMatrix, '搴旇鏈夋妧鑳界己鍙ｇ煩闃甸厤缃?)
      this.assert(chartTypes.progressRing, '搴旇鏈夎繘搴︾幆閰嶇疆')
      return true
    })

    // 娴嬭瘯3: 瀵煎嚭寮曟搸閰嶇疆
    await this.runTest(category, '瀵煎嚭寮曟搸閰嶇疆', async () => {
      const service = visualReportService
      const exportEngine = service.exportEngine

      this.assert(Array.isArray(exportEngine.formats), '瀵煎嚭鏍煎紡搴旇鏄暟缁?)
      this.assert(exportEngine.formats.includes('PDF'), '搴旇鏀寔PDF瀵煎嚭')
      this.assert(exportEngine.formats.includes('PNG'), '搴旇鏀寔PNG瀵煎嚭')
      this.assert(exportEngine.templates, '搴旇鏈夋姤鍛婃ā鏉?)
      this.assert(exportEngine.templates.candidate, '搴旇鏈夊€欓€変汉妯℃澘')
      this.assert(exportEngine.templates.hr, '搴旇鏈塇R妯℃澘')
      return true
    })

    // 娴嬭瘯4: 琛屼笟鍩哄噯鏁版嵁
    await this.runTest(category, '琛屼笟鍩哄噯鏁版嵁', async () => {
      const service = visualReportService
      const benchmarks = service.industryBenchmarks

      this.assert(benchmarks.frontend, '搴旇鏈夊墠绔涓氭暟鎹?)
      this.assert(benchmarks.backend, '搴旇鏈夊悗绔涓氭暟鎹?)
      this.assert(benchmarks.fullstack, '搴旇鏈夊叏鏍堣涓氭暟鎹?)

      this.assert(benchmarks.frontend.junior, '鍓嶇搴旇鏈夊垵绾ф暟鎹?)
      this.assert(benchmarks.frontend.mid, '鍓嶇搴旇鏈変腑绾ф暟鎹?)
      this.assert(benchmarks.frontend.senior, '鍓嶇搴旇鏈夐珮绾ф暟鎹?)
      return true
    })

    // 娴嬭瘯5: 鎶ュ憡鐢熸垚鏂规硶
    await this.runTest(category, '鎶ュ憡鐢熸垚鏂规硶', async () => {
      const service = visualReportService

      this.assert(typeof service.generateVisualReport === 'function', '搴旇鏈夋姤鍛婄敓鎴愭柟娉?)
      this.assert(typeof service.createRadarChart === 'function', '搴旇鏈夐浄杈惧浘鍒涘缓鏂规硶')
      this.assert(typeof service.createTimelineChart === 'function', '搴旇鏈夋椂闂寸嚎鍥惧垱寤烘柟娉?)
      this.assert(typeof service.exportReport === 'function', '搴旇鏈夋姤鍛婂鍑烘柟娉?)
      return true
    })

    console.log('鉁?澶氱淮鍙鍖栧紩鎿庢祴璇曞畬鎴怽n')
  }

  /**
   * 娴嬭瘯浜嬩欢椹卞姩鎬荤嚎
   */
  async testEventDrivenBus() {
    console.log('鈿?娴嬭瘯浜嬩欢椹卞姩鎬荤嚎...')
    const category = 'eventBus'

    // 娴嬭瘯1: 鎬荤嚎鍒濆鍖?
    await this.runTest(category, '鎬荤嚎鍒濆鍖?, async () => {
      const bus = eventDrivenBus
      this.assert(bus !== null, '鎬荤嚎瀹炰緥搴旇瀛樺湪')
      this.assert(bus.eventRoutes, '搴旇鏈変簨浠惰矾鐢遍厤缃?)
      this.assert(bus.microservices, '搴旇鏈夊井鏈嶅姟娉ㄥ唽琛?)
      this.assert(bus.eventPriorities, '搴旇鏈変簨浠朵紭鍏堢骇閰嶇疆')
      return true
    })

    // 娴嬭瘯2: 浜嬩欢鍙戝竷鍜岃闃?
    await this.runTest(category, '浜嬩欢鍙戝竷鍜岃闃?, async () => {
      const bus = eventDrivenBus
      let eventReceived = false
      let receivedPayload = null

      const subscriptionId = bus.subscribe('test.event', (payload) => {
        eventReceived = true
        receivedPayload = payload
      })

      await bus.publish('test.event', { test: 'data' })

      // 绛夊緟寮傛浜嬩欢澶勭悊
      await new Promise(resolve => setTimeout(resolve, 50))

      this.assert(eventReceived, '搴旇鎺ユ敹鍒板彂甯冪殑浜嬩欢')
      this.assert(receivedPayload.test === 'data', '搴旇鎺ユ敹鍒版纭殑杞借嵎')

      bus.unsubscribe(subscriptionId)
      return true
    })

    // 娴嬭瘯3: 浜嬩欢璺敱
    await this.runTest(category, '浜嬩欢璺敱', async () => {
      const bus = eventDrivenBus
      const routes = bus.eventRoutes

      this.assert(routes.has('system.check.started'), '搴旇鏈夌郴缁熸鏌ュ惎鍔ㄨ矾鐢?)
      this.assert(routes.has('interview.started'), '搴旇鏈夐潰璇曞惎鍔ㄨ矾鐢?)
      this.assert(routes.has('analysis.completed'), '搴旇鏈夊垎鏋愬畬鎴愯矾鐢?)

      const systemCheckRoutes = routes.get('system.check.started')
      this.assert(Array.isArray(systemCheckRoutes), '璺敱搴旇鏄暟缁?)
      this.assert(systemCheckRoutes.length > 0, '搴旇鏈夊叿浣撶殑璺敱鐩爣')
      return true
    })

    // 娴嬭瘯4: 寰湇鍔℃敞鍐?
    await this.runTest(category, '寰湇鍔℃敞鍐?, async () => {
      const bus = eventDrivenBus

      bus.registerMicroservice('test-service', {
        events: ['test.*'],
        metadata: { version: '1.0' }
      })

      this.assert(bus.microservices.has('test-service'), '搴旇鎴愬姛娉ㄥ唽寰湇鍔?)

      const service = bus.microservices.get('test-service')
      this.assert(service.status === 'active', '鏂版敞鍐屾湇鍔＄姸鎬佸簲璇ユ槸active')
      this.assert(service.events.includes('test.*'), '搴旇璁板綍鏈嶅姟浜嬩欢妯″紡')

      bus.unregisterMicroservice('test-service')
      return true
    })

    // 娴嬭瘯5: 鎵归噺浜嬩欢鍙戝竷
    await this.runTest(category, '鎵归噺浜嬩欢鍙戝竷', async () => {
      const bus = eventDrivenBus

      const events = [
        { name: 'batch.test.1', payload: { id: 1 }, options: { priority: 8 } },
        { name: 'batch.test.2', payload: { id: 2 }, options: { priority: 5 } },
        { name: 'batch.test.3', payload: { id: 3 }, options: { priority: 9 } }
      ]

      const results = await bus.publishBatch(events)

      this.assert(Array.isArray(results), '鎵归噺鍙戝竷搴旇杩斿洖缁撴灉鏁扮粍')
      this.assert(results.length === 3, '搴旇鏈?涓粨鏋?)
      this.assert(results.every(r => r.success), '鎵€鏈変簨浠跺簲璇ュ彂甯冩垚鍔?)
      return true
    })

    console.log('鉁?浜嬩欢椹卞姩鎬荤嚎娴嬭瘯瀹屾垚\n')
  }

  /**
   * 杩愯鍗曚釜娴嬭瘯
   */
  async runTest(category, testName, testFunction) {
    try {
      console.log(`  馃И ${testName}...`)
      await testFunction()
      this.testResults[category].passed++
      this.testResults[category].tests.push({
        name: testName,
        status: 'passed',
        time: Date.now()
      })
      console.log(`    鉁?閫氳繃`)
    } catch (error) {
      this.testResults[category].failed++
      this.testResults[category].tests.push({
        name: testName,
        status: 'failed',
        error: error.message,
        time: Date.now()
      })
      console.log(`    鉂?澶辫触: ${error.message}`)
    }
  }

  /**
   * 鏂█宸ュ叿
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || '鏂█澶辫触')
    }
  }

  /**
   * 鐢熸垚娴嬭瘯鎶ュ憡
   */
  generateTestReport() {
    console.log('\n馃搵 娴嬭瘯鎶ュ憡 ===================')

    let totalPassed = 0
    let totalFailed = 0

    Object.keys(this.testResults).forEach(category => {
      if (category === 'overall') return

      const result = this.testResults[category]
      const total = result.passed + result.failed
      const passRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0'

      console.log(`\n${this.getCategoryName(category)}:`)
      console.log(`  閫氳繃: ${result.passed}  澶辫触: ${result.failed}  閫氳繃鐜? ${passRate}%`)

      if (result.failed > 0) {
        console.log(`  澶辫触鐨勬祴璇?`)
        result.tests
          .filter(test => test.status === 'failed')
          .forEach(test => {
            console.log(`    鉂?${test.name}: ${test.error}`)
          })
      }

      totalPassed += result.passed
      totalFailed += result.failed
    })

    // 鎬讳綋缁熻
    const totalTests = totalPassed + totalFailed
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0'

    this.testResults.overall = {
      passed: totalPassed,
      failed: totalFailed,
      total: totalTests,
      passRate: overallPassRate
    }

    console.log('\n=== 鎬讳綋缁撴灉 ===')
    console.log(`鎬绘祴璇曟暟: ${totalTests}`)
    console.log(`閫氳繃: ${totalPassed}`)
    console.log(`澶辫触: ${totalFailed}`)
    console.log(`閫氳繃鐜? ${overallPassRate}%`)

    if (totalFailed === 0) {
      console.log('\n馃帀 鎵€鏈夋祴璇曢€氳繃锛佹柊鍔熻兘妯″潡杩愯姝ｅ父锛?)
    } else {
      console.log(`\n鈿狅笍  鏈?${totalFailed} 涓祴璇曞け璐ワ紝璇锋鏌ョ浉鍏虫ā鍧梎)
    }

    console.log('\n娴嬭瘯瀹屾垚鏃堕棿:', new Date().toLocaleString())
  }

  getCategoryName(category) {
    const names = {
      systemCheck: '馃攳 鏅鸿兘璇婃柇寮曟搸',
      resilientSession: '馃洝锔?寮规€т細璇濇灦鏋?,
      visualReport: '馃搳 澶氱淮鍙鍖栧紩鎿?,
      eventBus: '鈿?浜嬩欢椹卞姩鎬荤嚎'
    }
    return names[category] || category
  }
}

// 鍒涘缓娴嬭瘯杩愯鍣ㄥ疄渚?
const testRunner = new TestRunner()

// 瀵煎嚭娴嬭瘯鍑芥暟渚涘閮ㄨ皟鐢?
export const runModuleTests = () => testRunner.runAllTests()
export const getTestResults = () => testRunner.testResults

// 濡傛灉鐩存帴杩愯姝ゆ枃浠讹紝鎵ц娴嬭瘯
if (typeof window !== 'undefined') {
  // 娴忚鍣ㄧ幆澧?
  window.runModuleTests = runModuleTests
  console.log('馃挕 鏂板姛鑳芥祴璇曞凡鍑嗗灏辩华锛佸湪娴忚鍣ㄦ帶鍒跺彴涓繍琛?runModuleTests() 寮€濮嬫祴璇?)
} else {
  // Node.js鐜
  runModuleTests()
}
