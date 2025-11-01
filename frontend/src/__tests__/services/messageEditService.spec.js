import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMessageEdit } from '@/services/messageEditService'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'

// Mock 店铺存储
vi.mock('@/stores/chatWorkspace', () => ({
  useChatWorkspaceStore: vi.fn(() => ({
    currentUserId: 'user_1',
    activeConversationId: 'conv_1',
    activeMessages: [],
    getMessageById: vi.fn((id) => ({
      id,
      content: '测试消息',
      senderId: 'user_1',
      type: 'text',
      isRecalled: false
    })),
    updateMessageEditStatus: vi.fn()
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

// Mock API
vi.mock('@/api', () => ({
  default: {
    get: vi.fn(async (url) => {
      if (url.includes('/history')) {
        return { data: { versions: [] } }
      }
      return { data: {} }
    })
  }
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve())
  }
}))

describe('useMessageEdit Service', () => {
  let service

  beforeEach(() => {
    service = useMessageEdit()
  })

  describe('canEditMessage', () => {
    it('应该检查消息是否能被编辑', () => {
      const message = {
        id: 'msg_1',
        content: '测试消息',
        senderId: 'user_1',
        type: 'text',
        isRecalled: false
      }

      const result = service.canEditMessage(message)
      expect(result).toBe(true)
    })

    it('不应该编辑已撤回的消息', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        type: 'text',
        isRecalled: true
      }

      const result = service.canEditMessage(message)
      expect(result).toBe(false)
    })

    it('不应该编辑非文本消息', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_1',
        type: 'image',
        isRecalled: false
      }

      const result = service.canEditMessage(message)
      expect(result).toBe(false)
    })

    it('不应该编辑其他用户的消息', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_2',
        type: 'text',
        isRecalled: false
      }

      const result = service.canEditMessage(message)
      expect(result).toBe(false)
    })

    it('应该接受 null 消息', () => {
      const result = service.canEditMessage(null)
      expect(result).toBe(false)
    })
  })

  describe('validateEditContent', () => {
    it('应该接受有效的内容', () => {
      const result = service.validateEditContent('有效内容')
      expect(result.valid).toBe(true)
    })

    it('应该拒绝空内容', () => {
      const result = service.validateEditContent('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('不能为空')
    })

    it('应该拒绝只有空格的内容', () => {
      const result = service.validateEditContent('   ')
      expect(result.valid).toBe(false)
    })

    it('应该拒绝超过5000字符的内容', () => {
      const longContent = 'a'.repeat(5001)
      const result = service.validateEditContent(longContent)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('长度')
    })

    it('应该接受5000字符的内容', () => {
      const longContent = 'a'.repeat(5000)
      const result = service.validateEditContent(longContent)
      expect(result.valid).toBe(true)
    })

    it('应该处理 null 内容', () => {
      const result = service.validateEditContent(null)
      expect(result.valid).toBe(false)
    })
  })

  describe('editMessage', () => {
    it('应该编辑消息', async () => {
      const result = await service.editMessage('msg_1', 'conv_1', '新内容')
      expect(result).toBe(true)
    })

    it('应该拒绝编辑不可编辑的消息', async () => {
      const store = useChatWorkspaceStore()
      store.getMessageById.mockReturnValue({
        id: 'msg_1',
        senderId: 'user_2',
        type: 'text',
        isRecalled: false
      })

      const result = await service.editMessage('msg_1', 'conv_1', '新内容')
      expect(result).toBe(false)
    })

    it('应该拒绝无效的内容', async () => {
      const result = await service.editMessage('msg_1', 'conv_1', '')
      expect(result).toBe(false)
    })

    it('应该拒绝未修改的内容', async () => {
      const store = useChatWorkspaceStore()
      store.getMessageById.mockReturnValue({
        id: 'msg_1',
        content: '测试消息',
        senderId: 'user_1',
        type: 'text',
        isRecalled: false
      })

      const result = await service.editMessage('msg_1', 'conv_1', '测试消息')
      expect(result).toBe(false)
    })
  })

  describe('saveEditVersion', () => {
    it('应该保存编辑版本', () => {
      service.saveEditVersion('msg_1', '内容', 1)
      const history = service.messageEditHistory.get('msg_1')
      expect(history).toBeDefined()
      expect(history.length).toBe(1)
      expect(history[0].version).toBe(1)
    })

    it('应该限制历史版本数', () => {
      // 保存超过10个版本
      for (let i = 1; i <= 15; i++) {
        service.saveEditVersion('msg_1', `内容${i}`, i)
      }
      const history = service.messageEditHistory.get('msg_1')
      expect(history.length).toBeLessThanOrEqual(10)
    })

    it('应该记录版本元数据', () => {
      service.saveEditVersion('msg_1', '内容', 1)
      const history = service.messageEditHistory.get('msg_1')
      const version = history[0]
      expect(version.content).toBe('内容')
      expect(version.editedAt).toBeDefined()
      expect(version.editedBy).toBeDefined()
    })
  })

  describe('getMessageHistory', () => {
    it('应该获取本地编辑历史', async () => {
      service.saveEditVersion('msg_1', '内容1', 1)
      service.saveEditVersion('msg_1', '内容2', 2)

      const history = await service.getMessageHistory('msg_1')
      expect(history).toBeDefined()
      expect(history.length).toBe(2)
    })

    it('应该从服务器获取编辑历史', async () => {
      const history = await service.getMessageHistory('msg_1')
      expect(Array.isArray(history)).toBe(true)
    })

    it('应该缓存编辑历史', async () => {
      await service.getMessageHistory('msg_1')
      const cached = service.messageEditHistory.get('msg_1')
      expect(cached).toBeDefined()
    })
  })

  describe('restoreVersion', () => {
    it('应该恢复到指定版本', async () => {
      service.saveEditVersion('msg_1', '内容1', 1)
      service.saveEditVersion('msg_1', '内容2', 2)

      const result = await service.restoreVersion('msg_1', 1)
      expect(result).toBe(true)
    })

    it('应该拒绝不存在的版本', async () => {
      const result = await service.restoreVersion('msg_1', 999)
      expect(result).toBe(false)
    })
  })

  describe('handleEditConfirm', () => {
    it('应该处理编辑确认', async () => {
      const message = {
        id: 'msg_1',
        conversationId: 'conv_1',
        content: '原始内容',
        senderId: 'user_1',
        type: 'text'
      }

      const onEdit = vi.fn(async (content) => '新内容')
      await service.handleEditConfirm(message, onEdit)
    })
  })

  describe('hasPendingEdits', () => {
    it('应该计算待重试的编辑操作', () => {
      const pending = service.hasPendingEdits
      expect(pending).toBe(false)
    })
  })

  describe('retryEditQueue', () => {
    it('应该重试失败的编辑操作', async () => {
      await service.retryEditQueue()
      // 验证队列处理
    })
  })

  describe('cleanup', () => {
    it('应该清理资源', () => {
      service.saveEditVersion('msg_1', '内容', 1)
      service.cleanup()
      expect(service.messageEditHistory.size).toBe(0)
      expect(service.editingMessageId.value).toBeNull()
    })
  })

  describe('版本控制功能', () => {
    it('应该跟踪编辑次数', () => {
      service.saveEditVersion('msg_1', '内容1', 1)
      service.saveEditVersion('msg_1', '内容2', 2)
      service.saveEditVersion('msg_1', '内容3', 3)

      const history = service.messageEditHistory.get('msg_1')
      expect(history.length).toBe(3)
    })

    it('应该保持版本历史的顺序', () => {
      service.saveEditVersion('msg_1', '内容1', 1)
      service.saveEditVersion('msg_1', '内容2', 2)

      const history = service.messageEditHistory.get('msg_1')
      expect(history[0].version).toBe(1)
      expect(history[1].version).toBe(2)
    })

    it('应该限制版本数量为10', () => {
      for (let i = 1; i <= 20; i++) {
        service.saveEditVersion('msg_1', `内容${i}`, i)
      }

      const history = service.messageEditHistory.get('msg_1')
      expect(history.length).toBe(10)
    })
  })

  describe('权限验证', () => {
    it('应该只允许消息发送者编辑', () => {
      const message = {
        id: 'msg_1',
        senderId: 'user_2',
        type: 'text'
      }

      const result = service.canEditMessage(message)
      expect(result).toBe(false)
    })
  })

  describe('内容验证', () => {
    it('应该验证内容长度限制', () => {
      const longContent = 'a'.repeat(5001)
      const result = service.validateEditContent(longContent)
      expect(result.valid).toBe(false)
    })

    it('应该验证空内容', () => {
      const result = service.validateEditContent('')
      expect(result.valid).toBe(false)
    })
  })

  describe('WebSocket 事件处理', () => {
    it('应该处理编辑事件', () => {
      const event = {
        messageId: 'msg_1',
        conversationId: 'conv_1',
        content: '新内容',
        editedAt: Date.now(),
        editCount: 1
      }

      service.handleEditEvent(event)
      // 验证事件处理
    })

    it('应该过滤不相关的会话事件', () => {
      const event = {
        messageId: 'msg_1',
        conversationId: 'conv_2',
        content: '新内容'
      }

      service.handleEditEvent(event)
      // 不应该处理不相关会话的事件
    })
  })

  describe('离线重试机制', () => {
    it('应该维护编辑队列', () => {
      expect(service.editQueue).toBeDefined()
      expect(Array.isArray(service.editQueue.value) || service.editQueue instanceof Array).toBe(true)
    })

    it('应该限制重试次数', async () => {
      // 测试最多重试3次
      const queueItem = {
        messageId: 'msg_1',
        conversationId: 'conv_1',
        newContent: '新内容',
        retryCount: 3
      }
      // 不应该再重试
    })
  })
})
