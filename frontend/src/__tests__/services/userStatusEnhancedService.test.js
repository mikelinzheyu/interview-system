/**
 * 用户状态增强服务测试
 * 测试所有状态管理功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getStatusManager,
  setUserStatus,
  getCurrentUserStatus,
  setStatusMessage,
  getStatusHistory,
  getAvailableStatuses,
  getStatusConfig,
  getFormattedStatus
} from '../../services/userStatusEnhancedService'

describe('UserStatusEnhancedService', () => {
  let manager

  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()
    // 获取新的管理器实例
    manager = getStatusManager()
  })

  afterEach(() => {
    // 清理
    if (manager) {
      manager.destroy()
    }
    localStorage.clear()
  })

  // ==================== 基础状态管理测试 ====================

  describe('基础状态管理', () => {
    it('应该初始化为 online 状态', () => {
      const status = getCurrentUserStatus()
      expect(status.status).toBe('online')
    })

    it('应该能设置不同的状态', () => {
      setUserStatus('away')
      const status = getCurrentUserStatus()
      expect(status.status).toBe('away')

      setUserStatus('busy')
      const busyStatus = getCurrentUserStatus()
      expect(busyStatus.status).toBe('busy')

      setUserStatus('offline')
      const offlineStatus = getCurrentUserStatus()
      expect(offlineStatus.status).toBe('offline')
    })

    it('应该返回正确的状态信息对象', () => {
      setUserStatus('online')
      const status = getCurrentUserStatus()
      expect(status).toHaveProperty('status')
      expect(status).toHaveProperty('customStatus')
      expect(status).toHaveProperty('statusInfo')
      expect(status).toHaveProperty('lastActivityTime')
      expect(status).toHaveProperty('inactiveTime')
    })

    it('应该拒绝无效的状态', () => {
      const result = setUserStatus('invalid_status')
      expect(result).toBe(false)
    })
  })

  // ==================== 自定义消息测试 ====================

  describe('自定义消息', () => {
    it('应该能设置自定义消息', () => {
      const message = '在忙碌中...'
      setStatusMessage(message)
      const status = getCurrentUserStatus()
      expect(status.customStatus).toBe(message)
    })

    it('应该限制消息长度为50字符', () => {
      const longMessage = 'a'.repeat(51)
      const result = setStatusMessage(longMessage)
      expect(result).toBe(false)
    })

    it('应该接受正好50字符的消息', () => {
      const maxMessage = 'a'.repeat(50)
      const result = setStatusMessage(maxMessage)
      expect(result).toBe(true)
      const status = getCurrentUserStatus()
      expect(status.customStatus).toBe(maxMessage)
    })

    it('应该能设置空消息', () => {
      setStatusMessage('初始消息')
      setStatusMessage('')
      const status = getCurrentUserStatus()
      expect(status.customStatus).toBe('')
    })

    it('应该能同时设置状态和自定义消息', () => {
      setUserStatus('away', '午休中')
      const status = getCurrentUserStatus()
      expect(status.status).toBe('away')
      expect(status.customStatus).toBe('午休中')
    })
  })

  // ==================== 状态历史测试 ====================

  describe('状态历史', () => {
    it('应该记录状态变化', () => {
      setUserStatus('online')
      setUserStatus('away')
      setUserStatus('busy')

      const history = getStatusHistory(10)
      expect(history.length).toBeGreaterThan(0)
    })

    it('应该限制历史记录数量为100', () => {
      // 改变状态101次
      for (let i = 0; i < 101; i++) {
        const status = i % 2 === 0 ? 'away' : 'online'
        setUserStatus(status)
      }

      const history = getStatusHistory(150)
      expect(history.length).toBeLessThanOrEqual(100)
    })

    it('应该返回指定数量的历史记录', () => {
      for (let i = 0; i < 10; i++) {
        setUserStatus(i % 2 === 0 ? 'online' : 'away')
      }

      const history5 = getStatusHistory(5)
      expect(history5.length).toBeLessThanOrEqual(5)

      const history20 = getStatusHistory(20)
      expect(history20.length).toBeLessThanOrEqual(20)
    })

    it('历史记录应该包含时间戳', () => {
      setUserStatus('away')
      const history = getStatusHistory(1)
      expect(history.length).toBeGreaterThan(0)
      expect(history[0]).toHaveProperty('timestamp')
    })
  })

  // ==================== 格式化测试 ====================

  describe('格式化状态', () => {
    it('应该返回正确的格式化信息', () => {
      setUserStatus('online')
      const formatted = getFormattedStatus()

      expect(formatted).toHaveProperty('icon')
      expect(formatted).toHaveProperty('text')
      expect(formatted).toHaveProperty('status')
      expect(formatted).toHaveProperty('fullText')
    })

    it('应该包含自定义消息在文本中', () => {
      setUserStatus('away', '午休')
      const formatted = getFormattedStatus()

      expect(formatted.text).toContain('午休')
      expect(formatted.fullText).toContain('午休')
    })

    it('应该为不同状态返回不同的图标', () => {
      setUserStatus('online')
      const onlineFormatted = getFormattedStatus()

      setUserStatus('away')
      const awayFormatted = getFormattedStatus()

      expect(onlineFormatted.icon).not.toBe(awayFormatted.icon)
    })
  })

  // ==================== 持久化测试 ====================

  describe('状态持久化', () => {
    it('应该保存状态到 localStorage', () => {
      setUserStatus('away', '在忙碌中')

      const saved = localStorage.getItem('user_status_custom')
      expect(saved).not.toBeNull()

      const parsed = JSON.parse(saved)
      expect(parsed.status).toBe('away')
      expect(parsed.customStatus).toBe('在忙碌中')
    })

    it('应该从 localStorage 恢复状态', () => {
      setUserStatus('busy', '开会中')
      manager.destroy()

      // 创建新的管理器，应该恢复状态
      const newManager = getStatusManager()
      const status = getCurrentUserStatus()

      expect(status.status).toBe('busy')
      expect(status.customStatus).toBe('开会中')
    })

    it('离线状态应该恢复为在线', () => {
      // 手动设置离线状态到 localStorage
      const offlineData = {
        status: 'offline',
        customStatus: null,
        lastUpdateTime: new Date().toISOString()
      }
      localStorage.setItem('user_status_custom', JSON.stringify(offlineData))

      manager.destroy()
      const newManager = getStatusManager()
      const status = getCurrentUserStatus()

      // 应该恢复为 online，而不是 offline
      expect(status.status).toBe('online')
    })
  })

  // ==================== 配置测试 ====================

  describe('配置和可用状态', () => {
    it('应该返回正确的配置', () => {
      const config = getStatusConfig()

      expect(config).toHaveProperty('STATUS_TYPES')
      expect(config).toHaveProperty('STATUS_TIMEOUT')
      expect(config).toHaveProperty('AUTO_OFFLINE')
      expect(config).toHaveProperty('SYNC_INTERVAL')
    })

    it('应该返回所有可用状态', () => {
      const statuses = getAvailableStatuses()

      expect(statuses.length).toBe(4)
      expect(statuses.map(s => s.value)).toEqual(['online', 'away', 'busy', 'offline'])
    })

    it('可用状态应该包含标签和图标', () => {
      const statuses = getAvailableStatuses()

      statuses.forEach(status => {
        expect(status).toHaveProperty('value')
        expect(status).toHaveProperty('label')
        expect(status).toHaveProperty('icon')
        expect(status).toHaveProperty('priority')
      })
    })
  })

  // ==================== 事件回调测试 ====================

  describe('事件回调系统', () => {
    it('应该触发状态变化回调', (done) => {
      const callback = vi.fn((data) => {
        expect(data.oldStatus).toBe('online')
        expect(data.newStatus).toBe('away')
        expect(callback).toHaveBeenCalled()
        done()
      })

      manager.onStatusChange(callback)
      setUserStatus('away')
    })

    it('应该能注册多个回调', (done) => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      manager.onStatusChange(callback1)
      manager.onStatusChange(callback2)

      setUserStatus('busy')

      setTimeout(() => {
        expect(callback1).toHaveBeenCalled()
        expect(callback2).toHaveBeenCalled()
        done()
      }, 100)
    })

    it('应该能取消注册回调', () => {
      const callback = vi.fn()

      manager.onStatusChange(callback)
      manager.offStatusChange(callback)

      setUserStatus('away')

      expect(callback).not.toHaveBeenCalled()
    })
  })

  // ==================== 边界值测试 ====================

  describe('边界值和错误处理', () => {
    it('应该处理快速状态变化', () => {
      for (let i = 0; i < 10; i++) {
        setUserStatus(i % 2 === 0 ? 'online' : 'away')
      }

      const status = getCurrentUserStatus()
      expect(status.status).toBeDefined()
    })

    it('应该处理连续设置相同状态', () => {
      setUserStatus('away')
      setUserStatus('away')
      setUserStatus('away')

      const status = getCurrentUserStatus()
      expect(status.status).toBe('away')
    })

    it('应该处理空的自定义消息', () => {
      setStatusMessage(null)
      const status = getCurrentUserStatus()
      expect(status.customStatus).toBeNull()
    })

    it('状态应该始终有有效的时间戳', () => {
      setUserStatus('busy')
      const status = getCurrentUserStatus()

      expect(status.lastActivityTime).toBeDefined()
      expect(new Date(status.lastActivityTime)).toBeInstanceOf(Date)
    })
  })

  // ==================== 整合测试 ====================

  describe('整合测试', () => {
    it('完整的状态流程', () => {
      // 1. 初始状态
      let status = getCurrentUserStatus()
      expect(status.status).toBe('online')

      // 2. 设置离开状态和消息
      setUserStatus('away', '午休中')
      status = getCurrentUserStatus()
      expect(status.status).toBe('away')
      expect(status.customStatus).toBe('午休中')

      // 3. 更改消息
      setStatusMessage('午饭后回来')
      status = getCurrentUserStatus()
      expect(status.customStatus).toBe('午饭后回来')

      // 4. 返回在线
      setUserStatus('online')
      status = getCurrentUserStatus()
      expect(status.status).toBe('online')

      // 5. 验证历史
      const history = getStatusHistory(10)
      expect(history.length).toBeGreaterThan(0)
    })

    it('状态应该正确持久化和恢复', () => {
      // 设置初始状态
      setUserStatus('busy', '开会中')
      const initialStatus = getCurrentUserStatus()

      // 销毁并重新创建
      manager.destroy()
      const newManager = getStatusManager()

      // 验证恢复
      const restoredStatus = getCurrentUserStatus()
      expect(restoredStatus.status).toBe('busy')
      expect(restoredStatus.customStatus).toBe('开会中')
    })
  })
})
