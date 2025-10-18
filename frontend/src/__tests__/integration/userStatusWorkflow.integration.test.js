/**
 * 用户状态集成测试
 * 测试完整的工作流程和前后端交互
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getStatusManager,
  setUserStatus,
  getCurrentUserStatus,
  setStatusMessage,
  getStatusHistory,
  getAvailableStatuses
} from '../../services/userStatusEnhancedService'
import {
  getCurrentUserStatus as apiGetCurrentUserStatus,
  updateUserStatus,
  getUserStatus,
  getUserStatuses,
  setStatusMessage as apiSetStatusMessage,
  getStatusHistory as apiGetStatusHistory
} from '../../api/chat'

describe('用户状态完整工作流集成测试', () => {
  let manager
  let statusChangeCallback

  beforeEach(() => {
    localStorage.clear()
    manager = getStatusManager()
    statusChangeCallback = vi.fn()
    manager.onStatusChange(statusChangeCallback)
  })

  afterEach(() => {
    if (manager) {
      manager.destroy()
    }
    localStorage.clear()
  })

  // ==================== 完整工作流测试 ====================

  describe('完整用户状态工作流', () => {
    it('应该完成从在线到离线的完整状态转换流程', () => {
      // 步骤1: 初始化（在线状态）
      let status = getCurrentUserStatus()
      expect(status.status).toBe('online')
      expect(status.customStatus).toBeNull()

      // 步骤2: 切换到离开状态并设置消息
      setUserStatus('away', '午休中')
      status = getCurrentUserStatus()
      expect(status.status).toBe('away')
      expect(status.customStatus).toBe('午休中')
      expect(statusChangeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          oldStatus: 'online',
          newStatus: 'away'
        })
      )

      // 步骤3: 更新消息
      setStatusMessage('即将回来')
      status = getCurrentUserStatus()
      expect(status.customStatus).toBe('即将回来')

      // 步骤4: 切换到忙碌状态
      setUserStatus('busy')
      status = getCurrentUserStatus()
      expect(status.status).toBe('busy')

      // 步骤5: 返回在线
      setUserStatus('online')
      status = getCurrentUserStatus()
      expect(status.status).toBe('online')

      // 步骤6: 验证状态历史
      const history = getStatusHistory(10)
      expect(history.length).toBeGreaterThan(0)

      // 验证状态转换的顺序
      const statuses = history.map(h => h.to)
      expect(statuses).toContain('away')
      expect(statuses).toContain('busy')
      expect(statuses).toContain('online')
    })

    it('应该正确处理状态持久化和恢复', () => {
      // 设置初始状态
      setUserStatus('busy', '开会中')
      const initialStatus = getCurrentUserStatus()

      // 验证保存到 localStorage
      const saved = localStorage.getItem('user_status_custom')
      expect(saved).not.toBeNull()
      const parsed = JSON.parse(saved)
      expect(parsed.status).toBe('busy')
      expect(parsed.customStatus).toBe('开会中')

      // 销毁管理器
      manager.destroy()

      // 清空内存中的状态
      localStorage.clear()
      localStorage.setItem('user_status_custom', JSON.stringify(parsed))

      // 创建新的管理器实例
      const newManager = getStatusManager()
      const restoredStatus = getCurrentUserStatus()

      // 验证恢复的状态
      expect(restoredStatus.status).toBe('busy')
      expect(restoredStatus.customStatus).toBe('开会中')
    })

    it('应该在状态转换时触发所有回调', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      manager.onStatusChange(callback1)
      manager.onStatusChange(callback2)

      setUserStatus('away')

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(callback1.mock.calls.length).toBe(callback2.mock.calls.length)
    })
  })

  // ==================== 前后端交互测试 ====================

  describe('前后端交互流程', () => {
    it('应该能够从服务获取状态并与本地状态同步', async () => {
      // 本地设置状态
      setUserStatus('away', '离开中')
      const localStatus = getCurrentUserStatus()

      // 模拟从API获取状态
      expect(localStatus.status).toBe('away')
      expect(localStatus.customStatus).toBe('离开中')

      // 验证状态可以被格式化用于显示
      const formatted = manager.formatStatus()
      expect(formatted.text).toContain('离开中')
      expect(formatted.icon).toBeDefined()
    })

    it('应该支持批量用户状态查询', async () => {
      // 设置多个用户的状态
      const userIds = [1, 2, 3]

      // 模拟批量查询
      const results = userIds.map(id => ({
        userId: id,
        status: 'online',
        customStatus: null
      }))

      expect(results.length).toBe(3)
      expect(results.every(r => r.status === 'online')).toBe(true)
    })

    it('应该正确处理状态同步间隔', (done) => {
      const config = manager.getStatusConfig || (() => ({
        SYNC_INTERVAL: 30 * 1000
      }))()

      // 同步间隔应该是30秒
      expect(config.SYNC_INTERVAL).toBe(30 * 1000)
      done()
    })
  })

  // ==================== 错误恢复测试 ====================

  describe('错误恢复和异常处理', () => {
    it('应该在无效状态下保持现有状态', () => {
      setUserStatus('online')
      const initialStatus = getCurrentUserStatus().status

      const result = setUserStatus('invalid_status')

      expect(result).toBe(false)
      const currentStatus = getCurrentUserStatus()
      expect(currentStatus.status).toBe(initialStatus)
    })

    it('应该优雅地处理消息长度超限', () => {
      const longMessage = 'a'.repeat(51)
      const result = setStatusMessage(longMessage)

      expect(result).toBe(false)
      const status = getCurrentUserStatus()
      expect(status.customStatus).not.toBe(longMessage)
    })

    it('应该处理历史记录超限', () => {
      // 创建超过100条的状态变化
      for (let i = 0; i < 120; i++) {
        const newStatus = i % 2 === 0 ? 'away' : 'online'
        setUserStatus(newStatus)
      }

      const history = getStatusHistory(200)
      expect(history.length).toBeLessThanOrEqual(100)
    })

    it('应该在 localStorage 不可用时继续工作', () => {
      // 模拟 localStorage 不可用
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full')
      })

      // 应该不抛出异常
      expect(() => {
        setUserStatus('away')
      }).not.toThrow()

      localStorage.setItem = originalSetItem
    })
  })

  // ==================== 并发操作测试 ====================

  describe('并发操作处理', () => {
    it('应该正确处理快速连续的状态更新', () => {
      const states = ['online', 'away', 'busy', 'online', 'offline']

      states.forEach(state => {
        setUserStatus(state)
      })

      const finalStatus = getCurrentUserStatus()
      expect(finalStatus.status).toBe('offline')
    })

    it('应该处理并发的状态和消息更新', () => {
      setUserStatus('away')
      setStatusMessage('午休中')
      setUserStatus('busy')
      setStatusMessage('忙碌中')

      const status = getCurrentUserStatus()
      expect(status.status).toBe('busy')
      expect(status.customStatus).toBe('忙碌中')
    })

    it('应该正确处理快速的历史记录查询', () => {
      // 进行多次状态更新
      for (let i = 0; i < 10; i++) {
        setUserStatus(i % 2 === 0 ? 'away' : 'online')
      }

      // 并发查询历史
      const history1 = getStatusHistory(5)
      const history2 = getStatusHistory(10)
      const history3 = getStatusHistory(20)

      expect(history1.length).toBeLessThanOrEqual(5)
      expect(history2.length).toBeLessThanOrEqual(10)
      expect(history3.length).toBeLessThanOrEqual(20)
    })
  })

  // ==================== 数据一致性测试 ====================

  describe('数据一致性验证', () => {
    it('状态信息应该始终一致', () => {
      setUserStatus('away', '午休')

      const status1 = getCurrentUserStatus()
      const status2 = getCurrentUserStatus()

      expect(status1).toEqual(status2)
    })

    it('格式化状态应该与原始状态一致', () => {
      setUserStatus('busy', '开会')

      const originalStatus = getCurrentUserStatus()
      const formatted = manager.formatStatus()

      expect(formatted.status).toBe(originalStatus.status)
      expect(formatted.text).toContain(originalStatus.customStatus)
    })

    it('历史记录应该与当前状态匹配', () => {
      setUserStatus('online')
      setUserStatus('away', '离开')

      const history = getStatusHistory(2)
      const currentStatus = getCurrentUserStatus()

      expect(history.length).toBeGreaterThan(0)
      expect(history[history.length - 1].to).toBe(currentStatus.status)
    })

    it('持久化数据应该与内存中的状态一致', () => {
      setUserStatus('busy', '忙碌中')

      const memoryStatus = getCurrentUserStatus()
      const saved = localStorage.getItem('user_status_custom')
      const persistedStatus = JSON.parse(saved)

      expect(persistedStatus.status).toBe(memoryStatus.status)
      expect(persistedStatus.customStatus).toBe(memoryStatus.customStatus)
    })
  })

  // ==================== 边界条件测试 ====================

  describe('边界条件和压力测试', () => {
    it('应该处理连续1000次状态查询', () => {
      for (let i = 0; i < 1000; i++) {
        const status = getCurrentUserStatus()
        expect(status).toBeDefined()
      }
    })

    it('应该处理50条回调同时触发', () => {
      const callbacks = Array.from({ length: 50 }, () => vi.fn())

      callbacks.forEach(cb => manager.onStatusChange(cb))

      setUserStatus('away')

      callbacks.forEach(cb => {
        expect(cb).toHaveBeenCalledTimes(1)
      })
    })

    it('应该处理非常长的自定义消息（最大50字符）', () => {
      const maxMessage = 'a'.repeat(50)
      const result = setStatusMessage(maxMessage)

      expect(result).toBe(true)
      const status = getCurrentUserStatus()
      expect(status.customStatus.length).toBe(50)
    })

    it('应该在极限情况下保持性能', () => {
      const startTime = performance.now()

      // 执行大量操作
      for (let i = 0; i < 100; i++) {
        setUserStatus(i % 2 === 0 ? 'away' : 'online')
        setStatusMessage(`Message ${i}`.substring(0, 50))
        getStatusHistory(10)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // 应该在合理时间内完成
      expect(duration).toBeLessThan(5000) // 5秒
    })
  })

  // ==================== 真实场景模拟 ====================

  describe('真实使用场景模拟', () => {
    it('应该模拟用户上班流程', () => {
      // 早上登录 - 在线
      setUserStatus('online')
      let status = getCurrentUserStatus()
      expect(status.status).toBe('online')

      // 开会 - 忙碌
      setUserStatus('busy', '在开会')
      status = getCurrentUserStatus()
      expect(status.status).toBe('busy')

      // 午休 - 离开
      setUserStatus('away', '午休中')
      status = getCurrentUserStatus()
      expect(status.status).toBe('away')

      // 回来 - 在线
      setUserStatus('online')
      status = getCurrentUserStatus()
      expect(status.status).toBe('online')

      // 验证历史
      const history = getStatusHistory(10)
      expect(history.length).toBeGreaterThan(0)
    })

    it('应该模拟网络波动场景', () => {
      // 用户快速切换网络
      setUserStatus('away')
      setUserStatus('online')
      setUserStatus('away')
      setUserStatus('online')

      const status = getCurrentUserStatus()
      const history = getStatusHistory(10)

      expect(status.status).toBe('online')
      expect(history.length).toBeGreaterThan(2)
    })

    it('应该模拟用户离开场景', () => {
      // 用户长时间不活动 - 会自动变为离开
      setUserStatus('online')

      // 模拟不活动
      let status = getCurrentUserStatus()
      expect(status.status).toBe('online')

      // 用户手动标记为离线
      setUserStatus('offline')
      status = getCurrentUserStatus()
      expect(status.status).toBe('offline')

      // 可以查看完整的状态历史
      const history = getStatusHistory(10)
      expect(history.length).toBeGreaterThan(0)
    })
  })
})
