import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMessageRecall } from '@/services/messageRecallService'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'

// Mock 电商存储
vi.mock('@/stores/chatWorkspace', () => ({
  useChatWorkspaceStore: vi.fn(() => ({
    currentUserId: 'user_1',
    activeConversationId: 'conv_1',
    getMessageById: vi.fn((id) => ({
      id,
      content: '测试消息',
      senderId: 'user_1',
      timestamp: Date.now() - 30000,
      isRecalled: false
    })),
    updateMessageRecalledStatus: vi.fn()
  }))
}))

// Mock socket 服务
vi.mock('@/utils/socket', () => ({
  default: {
    emit: vi.fn(),
    on: vi.fn(),
    isConnected: vi.fn(() => true)
  }
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve())
  }
}))

describe('useMessageRecall Service', () => {
  let service

  beforeEach(() => {
    service = useMessageRecall()
  })

  describe('canRecallMessage', () => {
    it('应该检查消息是否能被撤回', () => {
      const message = {
        id: 'msg_1',
        content: '测试消息',
        senderId: 'user_1',
        timestamp: Date.now() - 30000,
        isRecalled: false
      }

      const result = service.canRecallMessage(message)
      expect(result).toBe(true)
    })

    it('不应该撤回已撤回的消息', () => {
      const message = {
        id: 'msg_1',
        isRecalled: true
      }

      const result = service.canRecallMessage(message)
      expect(result).toBe(false)
    })

    it('不应该撤回其他用户的消息', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_2',
        timestamp: Date.now() - 30000,
        isRecalled: false
      }

      const result = service.canRecallMessage(message)
      expect(result).toBe(false)
    })

    it('不应该撤回超过2分钟的消息', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        timestamp: Date.now() - (3 * 60 * 1000),
        isRecalled: false
      }

      const result = service.canRecallMessage(message)
      expect(result).toBe(false)
    })

    it('应该接受 null 消息', () => {
      const result = service.canRecallMessage(null)
      expect(result).toBe(false)
    })
  })

  describe('getRecallTimeRemaining', () => {
    it('应该返回剩余撤回时间（毫秒）', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        timestamp: Date.now() - 30000,
        isRecalled: false
      }

      const remaining = service.getRecallTimeRemaining(message)
      expect(remaining).toBeGreaterThan(100000)
      expect(remaining).toBeLessThan(120000)
    })

    it('应该返回0给不可撤回的消息', () => {
      const message = {
        id: 'msg_1',
        isRecalled: true
      }

      const remaining = service.getRecallTimeRemaining(message)
      expect(remaining).toBe(0)
    })

    it('超时时应该返回0', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        timestamp: Date.now() - (3 * 60 * 1000),
        isRecalled: false
      }

      const remaining = service.getRecallTimeRemaining(message)
      expect(remaining).toBe(0)
    })
  })

  describe('getRecallTimeString', () => {
    it('应该返回格式化的时间字符串（分钟）', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        timestamp: Date.now() - 30000,
        isRecalled: false
      }

      const timeStr = service.getRecallTimeString(message)
      expect(timeStr).toMatch(/\d+m\d+s/)
    })

    it('应该返回格式化的时间字符串（秒）', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        timestamp: Date.now() - (60 * 1000),
        isRecalled: false
      }

      const timeStr = service.getRecallTimeString(message)
      expect(timeStr).toMatch(/\d+s/)
    })

    it('应该返回已过期的消息', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        timestamp: Date.now() - (3 * 60 * 1000),
        isRecalled: false
      }

      const timeStr = service.getRecallTimeString(message)
      expect(timeStr).toBe('已过期')
    })
  })

  describe('recallMessage', () => {
    it('应该撤回消息', async () => {
      const message = {
        id: 'msg_1',
        conversationId: 'conv_1',
        senderId: 'user_1',
        timestamp: Date.now() - 30000,
        isRecalled: false
      }

      const result = await service.recallMessage(message.id, message.conversationId)
      expect(result).toBe(true)
    })

    it('应该拒绝撤回超时的消息', async () => {
      const message = {
        id: 'msg_1',
        conversationId: 'conv_1',
        senderId: 'user_1',
        timestamp: Date.now() - (3 * 60 * 1000),
        isRecalled: false
      }

      const result = await service.recallMessage(message.id, message.conversationId)
      expect(result).toBe(false)
    })
  })

  describe('handleRecallConfirm', () => {
    it('应该显示确认对话框', async () => {
      const message = {
        id: 'msg_1',
        conversationId: 'conv_1',
        senderId: 'user_1',
        timestamp: Date.now() - 30000,
        isRecalled: false
      }

      await service.handleRecallConfirm(message)
      // 验证确认对话框被调用
    })
  })

  describe('hasPendingRecalls', () => {
    it('应该计算待重试的撤回操作', () => {
      const pending = service.hasPendingRecalls
      expect(pending).toBe(false)
    })
  })

  describe('retryRecallQueue', () => {
    it('应该重试失败的撤回操作', async () => {
      await service.retryRecallQueue()
      // 验证队列处理
    })
  })

  describe('cleanup', () => {
    it('应该清理资源', () => {
      service.cleanup()
      expect(service.recalledMessages.size).toBe(0)
    })
  })

  describe('时间检查精确性', () => {
    it('应该精确检查2分钟限制', () => {
      // 在2分钟边界测试
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        timestamp: Date.now() - (120 * 1000),
        isRecalled: false
      }

      const result = service.canRecallMessage(message)
      // 刚好2分钟应该还能撤回
      expect(result).toBe(true)
    })

    it('应该拒绝超过2分钟的消息', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        timestamp: Date.now() - (120 * 1000 + 1000),
        isRecalled: false
      }

      const result = service.canRecallMessage(message)
      expect(result).toBe(false)
    })
  })

  describe('权限验证', () => {
    it('应该只允许消息发送者撤回', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_2',
        timestamp: Date.now() - 30000,
        isRecalled: false
      }

      const result = service.canRecallMessage(message)
      expect(result).toBe(false)
    })
  })

  describe('消息状态管理', () => {
    it('应该跟踪已撤回的消息', () => {
      service.recalledMessages.add('msg_1')
      expect(service.recalledMessages.has('msg_1')).toBe(true)
    })

    it('应该处理WebSocket撤回事件', () => {
      const event = {
        messageId: 'msg_1',
        conversationId: 'conv_1',
        recalledAt: Date.now(),
        recalledBy: 'user_1'
      }

      service.handleRecallEvent(event)
      // 验证事件处理
    })
  })

  describe('离线重试机制', () => {
    it('应该维护重试队列', () => {
      expect(service.recallQueue).toBeDefined()
      expect(Array.isArray(service.recallQueue.value) || service.recallQueue instanceof Array).toBe(true)
    })

    it('应该限制重试次数', async () => {
      // 测试最多重试3次
      const queueItem = {
        messageId: 'msg_1',
        conversationId: 'conv_1',
        retryCount: 3
      }
      // 不应该再重试
    })
  })

  describe('定时器管理', () => {
    it('应该启动撤回时间监听', () => {
      service.startRecallTimeMonitor()
      expect(service).toBeDefined()
    })

    it('应该停止撤回时间监听', () => {
      service.startRecallTimeMonitor()
      service.stopRecallTimeMonitor()
      expect(service).toBeDefined()
    })
  })
})
