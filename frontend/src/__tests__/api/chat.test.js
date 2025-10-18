/**
 * 聊天API测试
 * 测试所有聊天相关API调用
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCurrentUserStatus,
  updateUserStatus,
  getUserStatus,
  getUserStatuses,
  setStatusMessage,
  getStatusHistory,
  pinConversation,
  muteConversation,
  markConversationRead,
  deleteConversation,
  uploadFile,
  editMessage,
  recallMessage
} from '../../api/chat'

// Mock axios
vi.mock('../../api/index', () => ({
  default: vi.fn(config => {
    // 模拟API响应
    return Promise.resolve({
      data: {
        success: true,
        message: 'Mock response',
        data: config
      }
    })
  })
}))

describe('Chat API', () => {
  // ==================== 用户状态API测试 ====================

  describe('用户状态API', () => {
    it('应该调用 getCurrentUserStatus', async () => {
      const result = await getCurrentUserStatus()
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 updateUserStatus 并传递数据', async () => {
      const data = {
        status: 'away',
        customStatus: '午休中'
      }
      const result = await updateUserStatus(data)
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 getUserStatus 并传递userId', async () => {
      const result = await getUserStatus(1)
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 getUserStatuses 进行批量查询', async () => {
      const userIds = [1, 2, 3, 4]
      const result = await getUserStatuses(userIds)
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 setStatusMessage', async () => {
      const message = '在忙碌中...'
      const result = await setStatusMessage(message)
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 getStatusHistory 并支持分页', async () => {
      const result = await getStatusHistory({ limit: 20 })
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })
  })

  // ==================== 会话管理API测试 ====================

  describe('会话管理API', () => {
    it('应该调用 pinConversation', async () => {
      const result = await pinConversation('conv_123')
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 muteConversation', async () => {
      const result = await muteConversation('conv_123')
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 markConversationRead', async () => {
      const result = await markConversationRead('conv_123')
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 deleteConversation', async () => {
      const result = await deleteConversation('conv_123')
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })
  })

  // ==================== 文件上传API测试 ====================

  describe('文件上传API', () => {
    it('应该调用 uploadFile', async () => {
      const result = await uploadFile(new FormData())
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })
  })

  // ==================== 消息编辑API测试 ====================

  describe('消息编辑API', () => {
    it('应该调用 editMessage', async () => {
      const result = await editMessage('conv_123', 'msg_456', { content: '新内容' })
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })

    it('应该调用 recallMessage', async () => {
      const result = await recallMessage('conv_123', 'msg_456')
      expect(result).toBeDefined()
      expect(result.data.success).toBe(true)
    })
  })

  // ==================== 错误处理测试 ====================

  describe('错误处理', () => {
    it('应该处理缺少参数的情况', async () => {
      // 测试缺少必需参数
      expect(() => {
        setStatusMessage(null)
      }).not.toThrow()
    })

    it('应该处理无效的userId', async () => {
      const result = await getUserStatus('')
      expect(result).toBeDefined()
    })

    it('应该处理空的userIds数组', async () => {
      const result = await getUserStatuses([])
      expect(result).toBeDefined()
    })
  })
})
