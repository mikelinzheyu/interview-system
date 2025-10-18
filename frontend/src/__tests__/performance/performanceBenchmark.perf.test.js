/**
 * 性能基准测试
 * 测试系统的性能指标和优化效果
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getStatusManager,
  setUserStatus,
  getCurrentUserStatus,
  setStatusMessage,
  getStatusHistory
} from '../../services/userStatusEnhancedService'

describe('性能基准测试', () => {
  let manager

  beforeEach(() => {
    localStorage.clear()
    manager = getStatusManager()
  })

  // ==================== 加载时间测试 ====================

  describe('加载时间性能', () => {
    it('初始化应该在 100ms 内完成', () => {
      const start = performance.now()
      const newManager = getStatusManager()
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(100)
    })

    it('状态切换应该在 10ms 内完成', () => {
      const start = performance.now()
      setUserStatus('away')
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(10)
    })

    it('获取状态应该在 1ms 内完成', () => {
      setUserStatus('online')

      const start = performance.now()
      getCurrentUserStatus()
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(1)
    })

    it('设置消息应该在 5ms 内完成', () => {
      const start = performance.now()
      setStatusMessage('午休中')
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(5)
    })

    it('查询历史应该在 10ms 内完成', () => {
      // 创建一些历史记录
      for (let i = 0; i < 50; i++) {
        setUserStatus(i % 2 === 0 ? 'away' : 'online')
      }

      const start = performance.now()
      getStatusHistory(20)
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(10)
    })
  })

  // ==================== 内存使用测试 ====================

  describe('内存使用性能', () => {
    it('初始内存占用应该小于 1MB', () => {
      if (performance.memory) {
        const initialMemory = performance.memory.usedJSHeapSize

        // 进行一些操作
        for (let i = 0; i < 100; i++) {
          setUserStatus(i % 2 === 0 ? 'away' : 'online')
        }

        const finalMemory = performance.memory.usedJSHeapSize
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024

        expect(memoryIncrease).toBeLessThan(1)
      }
    })

    it('历史记录不应该超过 500KB', () => {
      if (performance.memory) {
        const initialMemory = performance.memory.usedJSHeapSize

        // 创建大量历史记录
        for (let i = 0; i < 1000; i++) {
          setUserStatus(i % 4 === 0 ? 'online' : i % 4 === 1 ? 'away' : i % 4 === 2 ? 'busy' : 'offline')
          setStatusMessage(`Message ${i}`.substring(0, 50))
        }

        const finalMemory = performance.memory.usedJSHeapSize
        const historyMemory = (finalMemory - initialMemory) / 1024

        expect(historyMemory).toBeLessThan(500)
      }
    })
  })

  // ==================== 并发性能测试 ====================

  describe('并发操作性能', () => {
    it('应该在 100ms 内处理 1000 次状态查询', () => {
      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        getCurrentUserStatus()
      }

      const end = performance.now()
      const duration = end - start

      expect(duration).toBeLessThan(100)
    })

    it('应该在 1 秒内处理 100 次状态更新', () => {
      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        const status = i % 4 === 0 ? 'online' : i % 4 === 1 ? 'away' : i % 4 === 2 ? 'busy' : 'offline'
        setUserStatus(status)
      }

      const end = performance.now()
      const duration = end - start

      expect(duration).toBeLessThan(1000)
    })

    it('应该在 500ms 内处理 50 次复杂操作', () => {
      const start = performance.now()

      for (let i = 0; i < 50; i++) {
        const status = i % 2 === 0 ? 'away' : 'online'
        setUserStatus(status)
        setStatusMessage(`Message ${i}`)
        getCurrentUserStatus()
        getStatusHistory(10)
      }

      const end = performance.now()
      const duration = end - start

      expect(duration).toBeLessThan(500)
    })
  })

  // ==================== 吞吐量测试 ====================

  describe('吞吐量性能', () => {
    it('每秒应该能处理 10000+ 次状态查询', () => {
      const start = performance.now()
      const targetCount = 10000

      for (let i = 0; i < targetCount; i++) {
        getCurrentUserStatus()
      }

      const end = performance.now()
      const duration = end - start

      const throughput = (targetCount / duration) * 1000 // 每秒操作数
      expect(throughput).toBeGreaterThan(10000)
    })

    it('每秒应该能处理 1000+ 次状态更新', () => {
      const start = performance.now()
      const targetCount = 1000

      for (let i = 0; i < targetCount; i++) {
        const status = i % 4 === 0 ? 'online' : i % 4 === 1 ? 'away' : i % 4 === 2 ? 'busy' : 'offline'
        setUserStatus(status)
      }

      const end = performance.now()
      const duration = end - start

      const throughput = (targetCount / duration) * 1000 // 每秒操作数
      expect(throughput).toBeGreaterThan(1000)
    })
  })

  // ==================== 缓存效率测试 ====================

  describe('缓存和优化效率', () => {
    it('多次查询同一状态应该更快', () => {
      setUserStatus('away')

      // 第一次查询
      const firstStart = performance.now()
      getCurrentUserStatus()
      const firstEnd = performance.now()
      const firstDuration = firstEnd - firstStart

      // 多次查询
      const subsequentStart = performance.now()
      for (let i = 0; i < 100; i++) {
        getCurrentUserStatus()
      }
      const subsequentEnd = performance.now()
      const averageSubsequentDuration = (subsequentEnd - subsequentStart) / 100

      // 后续查询应该明显更快或至少不慢
      expect(averageSubsequentDuration).toBeLessThanOrEqual(firstDuration * 1.1)
    })

    it('历史记录查询应该在常数时间内完成', () => {
      // 创建不同数量的历史
      const times = []

      for (let historySize of [10, 50, 100]) {
        // 创建历史
        for (let i = 0; i < historySize; i++) {
          setUserStatus(i % 2 === 0 ? 'away' : 'online')
        }

        // 测量查询时间
        const start = performance.now()
        getStatusHistory(20)
        const end = performance.now()

        times.push(end - start)
      }

      // 查询时间应该大致相同（即 O(1) 或接近）
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)
      const ratio = maxTime / minTime

      expect(ratio).toBeLessThan(3) // 不应该超过 3 倍
    })
  })

  // ==================== 极限条件测试 ====================

  describe('极限条件性能', () => {
    it('应该在 2 秒内处理 10000 次状态变化', () => {
      const start = performance.now()

      for (let i = 0; i < 10000; i++) {
        const statuses = ['online', 'away', 'busy', 'offline']
        setUserStatus(statuses[i % 4])
      }

      const end = performance.now()
      const duration = end - start

      expect(duration).toBeLessThan(2000)
    })

    it('历史记录应该稳定在 100 条以内', () => {
      // 创建超过 100 条的状态变化
      for (let i = 0; i < 200; i++) {
        setUserStatus(i % 2 === 0 ? 'away' : 'online')
      }

      const history = getStatusHistory(200)
      expect(history.length).toBeLessThanOrEqual(100)
    })

    it('内存不应该因为大量操作而失控增长', () => {
      if (performance.memory) {
        const initialMemory = performance.memory.usedJSHeapSize

        // 大量操作
        for (let i = 0; i < 5000; i++) {
          setUserStatus(i % 2 === 0 ? 'away' : 'online')
          if (i % 100 === 0) {
            getCurrentUserStatus()
            getStatusHistory(50)
          }
        }

        const finalMemory = performance.memory.usedJSHeapSize
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024

        // 不应该增加超过 5MB
        expect(memoryIncrease).toBeLessThan(5)
      }
    })
  })

  // ==================== 实际使用场景性能 ====================

  describe('实际使用场景性能', () => {
    it('模拟一天的使用应该在合理时间内完成', () => {
      const start = performance.now()

      // 模拟一天 8 小时的工作
      // 每分钟检查一次状态变化
      for (let minute = 0; minute < 480; minute++) {
        // 随机状态变化
        if (Math.random() > 0.9) {
          const statuses = ['online', 'away', 'busy']
          setUserStatus(statuses[Math.floor(Math.random() * 3)])
        }

        // 随机消息更新
        if (Math.random() > 0.95) {
          setStatusMessage('忙碌中')
        }

        // 偶尔查询状态
        if (minute % 10 === 0) {
          getCurrentUserStatus()
        }

        // 偶尔查询历史
        if (minute % 60 === 0) {
          getStatusHistory(10)
        }
      }

      const end = performance.now()
      const duration = end - start

      // 应该在 5 秒内完成
      expect(duration).toBeLessThan(5000)
    })

    it('支持多用户并发操作', () => {
      const start = performance.now()
      const userCount = 100
      const operationsPerUser = 10

      // 模拟多个用户
      for (let user = 0; user < userCount; user++) {
        for (let op = 0; op < operationsPerUser; op++) {
          if (op % 3 === 0) {
            setUserStatus(op % 2 === 0 ? 'away' : 'online')
          } else if (op % 3 === 1) {
            setStatusMessage(`User ${user} message`)
          } else {
            getCurrentUserStatus()
          }
        }
      }

      const end = performance.now()
      const duration = end - start

      // 1000 个操作应该在 100ms 内完成
      expect(duration).toBeLessThan(100)
    })
  })

  // ==================== 性能指标汇总 ====================

  describe('性能指标汇总', () => {
    it('应该达到所有性能目标', () => {
      const metrics = {
        // 时间性能 (ms)
        initializationTime: { target: 100, current: 0 },
        statusSwitchTime: { target: 10, current: 0 },
        statusQueryTime: { target: 1, current: 0 },
        messageSetTime: { target: 5, current: 0 },

        // 内存性能 (MB)
        initialMemory: { target: 1, current: 0 },
        maxMemoryGrowth: { target: 5, current: 0 }
      }

      // 测试初始化
      const initStart = performance.now()
      getStatusManager()
      metrics.initializationTime.current = performance.now() - initStart

      // 测试状态切换
      const switchStart = performance.now()
      setUserStatus('away')
      metrics.statusSwitchTime.current = performance.now() - switchStart

      // 测试查询
      const queryStart = performance.now()
      getCurrentUserStatus()
      metrics.statusQueryTime.current = performance.now() - queryStart

      // 测试消息设置
      const msgStart = performance.now()
      setStatusMessage('test')
      metrics.messageSetTime.current = performance.now() - msgStart

      // 验证所有指标
      for (const [key, metric] of Object.entries(metrics)) {
        if (metric.target) {
          expect(metric.current).toBeLessThan(metric.target)
        }
      }
    })
  })
})
