/* eslint-disable no-unused-vars */
/**
 * Lightweight performance test harness used during local development.
 * The original version logged rich emoji output that caused lint parsing
 * issues after an encoding change, so this simplified version focuses on
 * keeping the utility runnable without special characters.
 */

const DEFAULT_ENDPOINTS = [
  'http://localhost:8080/api/health',
  'http://localhost:8080/api/interview/generate-question',
  'http://localhost:8080/api/interview/analyze'
]

function mockFetch(url) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          code: 200,
          message: 'OK',
          url
        })
      })
    }, Math.random() * 75 + 25)
  })
}

class PerformanceTester {
  constructor(fetchImpl = (typeof fetch === 'function' ? fetch.bind(globalThis) : mockFetch)) {
    this.fetchImpl = fetchImpl
    this.results = []
  }

  async testAPIResponseTime(endpoints = DEFAULT_ENDPOINTS) {
    const summary = []

    for (const endpoint of endpoints) {
      const samples = []
      for (let i = 0; i < 5; i += 1) {
        const start = Date.now()
        try {
          await this.fetchImpl(endpoint)
          samples.push(Date.now() - start)
        } catch (error) {
          samples.push(Number.POSITIVE_INFINITY)
          console.warn(`[perf] request failed: ${endpoint}`, error)
        }
      }

      const validSamples = samples.filter((value) => Number.isFinite(value))
      summary.push({
        endpoint,
        samples,
        average: validSamples.length ? Math.round(validSamples.reduce((sum, value) => sum + value, 0) / validSamples.length) : null,
        min: validSamples.length ? Math.min(...validSamples) : null,
        max: validSamples.length ? Math.max(...validSamples) : null
      })
    }

    this.results.push({ type: 'api', summary })
    return summary
  }

  async testConcurrentRequests(endpoint = DEFAULT_ENDPOINTS[0], concurrency = 10) {
    const tasks = [...new Array(concurrency)].map(() => this.fetchImpl(endpoint))
    const start = Date.now()
    const settled = await Promise.allSettled(tasks)
    const totalTime = Date.now() - start

    const successful = settled.filter((item) => item.status === 'fulfilled').length
    const failed = settled.length - successful

    const outcome = {
      endpoint,
      concurrency,
      totalTime,
      successful,
      failed,
      averageTimePerRequest: Math.round(totalTime / concurrency)
    }

    this.results.push({ type: 'concurrency', summary: outcome })
    return outcome
  }

  async runAllTests() {
    const apiSummary = await this.testAPIResponseTime()
    const concurrencySummary = await this.testConcurrentRequests()

    const overallScore = this.calculateOverallScore({ apiSummary, concurrencySummary })

    return {
      timestamp: new Date().toISOString(),
      apiSummary,
      concurrencySummary,
      overallScore
    }
  }

  calculateOverallScore({ apiSummary, concurrencySummary }) {
    let score = 100

    const slowRequests = apiSummary.filter((item) => item.average && item.average > 400).length
    score -= slowRequests * 10

    if (concurrencySummary.failed > 0) score -= 15
    if (concurrencySummary.averageTimePerRequest > 200) score -= 10

    return Math.max(0, score)
  }
}

async function main() {
  const tester = new PerformanceTester()
  try {
    const report = await tester.runAllTests()
    console.log('[perf] summary:', JSON.stringify(report, null, 2))
    process.exit(report.overallScore >= 60 ? 0 : 1)
  } catch (error) {
    console.error('[perf] test execution failed', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = PerformanceTester
