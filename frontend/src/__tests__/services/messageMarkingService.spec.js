import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useMessageMarking } from '@/services/messageMarkingService'

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}))

// Mock socket service
vi.mock('@/utils/socket', () => ({
  default: {
    emit: vi.fn()
  }
}))

// Mock chat workspace store
vi.mock('@/stores/chatWorkspace', () => ({
  useChatWorkspaceStore: () => ({
    currentUserId: 'user123',
    getMessageById: vi.fn((id) => ({
      id,
      content: `Message ${id}`
    }))
  })
}))

describe('messageMarkingService', () => {
  let service
  let localStorage

  beforeEach(() => {
    // Mock localStorage
    localStorage = {
      store: {},
      getItem: vi.fn((key) => localStorage.store[key] || null),
      setItem: vi.fn((key, value) => {
        localStorage.store[key] = value
      }),
      removeItem: vi.fn((key) => {
        delete localStorage.store[key]
      }),
      clear: vi.fn(() => {
        localStorage.store = {}
      })
    }

    global.localStorage = localStorage

    service = useMessageMarking()
  })

  afterEach(() => {
    localStorage.clear()
    service.cleanup()
  })

  describe('Initialization', () => {
    it('should initialize with default tags', () => {
      service.initialize()

      expect(service.tags.length).toBe(4)
      expect(service.tags.some(t => t.name === '工作')).toBe(true)
      expect(service.tags.some(t => t.name === '个人')).toBe(true)
      expect(service.tags.some(t => t.name === '紧急')).toBe(true)
      expect(service.tags.some(t => t.name === '重要')).toBe(true)
    })

    it('should load from localStorage if available', () => {
      // Create first service and save tags
      service.initialize()
      service.saveTagsToLocalStorage()

      // Create second service
      const newService = useMessageMarking()
      newService.loadTagsFromLocalStorage()

      expect(newService.tags.length).toBe(4)
    })
  })

  describe('Mark Operations', () => {
    it('should mark message successfully', () => {
      const result = service.markMessage('msg123', 'important')

      expect(result).toBe(true)
      expect(service.hasMarkType('msg123', 'important')).toBe(true)
    })

    it('should toggle mark when marking twice', () => {
      service.markMessage('msg123', 'important')
      expect(service.hasMarkType('msg123', 'important')).toBe(true)

      service.markMessage('msg123', 'important')
      expect(service.hasMarkType('msg123', 'important')).toBe(false)
    })

    it('should add multiple mark types to same message', () => {
      service.markMessage('msg123', 'important')
      service.markMessage('msg123', 'urgent')

      const marks = service.getMessageMarks('msg123')
      expect(marks).toContain('important')
      expect(marks).toContain('urgent')
    })

    it('should fail with invalid mark type', () => {
      const result = service.markMessage('msg123', 'invalid')

      expect(result).toBe(false)
    })

    it('should fail without messageId', () => {
      const result = service.markMessage(null, 'important')

      expect(result).toBe(false)
    })

    it('should save to localStorage after marking', () => {
      service.markMessage('msg123', 'important')

      expect(localStorage.setItem).toHaveBeenCalled()
      const saved = localStorage.getItem(service.config.STORAGE_KEY)
      expect(saved).toBeTruthy()
    })
  })

  describe('Unmark Operations', () => {
    it('should unmark message successfully', () => {
      service.markMessage('msg123', 'important')
      const result = service.unmarkMessage('msg123', 'important')

      expect(result).toBe(true)
      expect(service.hasMarkType('msg123', 'important')).toBe(false)
    })

    it('should fail to unmark non-existent mark', () => {
      const result = service.unmarkMessage('msg123', 'important')

      expect(result).toBe(false)
    })

    it('should fail to unmark non-existent message', () => {
      const result = service.unmarkMessage('nonexistent', 'important')

      expect(result).toBe(false)
    })

    it('should update timestamp when unmarking', () => {
      service.markMessage('msg123', 'important')
      const record1 = service.marks.get('msg123')

      service.unmarkMessage('msg123', 'important')
      const record2 = service.marks.get('msg123')

      expect(record2.updatedAt).toBeGreaterThan(record1.updatedAt)
    })
  })

  describe('Mark Type Queries', () => {
    beforeEach(() => {
      service.markMessage('msg1', 'important')
      service.markMessage('msg2', 'important')
      service.markMessage('msg2', 'urgent')
      service.markMessage('msg3', 'todo')
    })

    it('should check if message has specific mark type', () => {
      expect(service.hasMarkType('msg1', 'important')).toBe(true)
      expect(service.hasMarkType('msg1', 'urgent')).toBe(false)
      expect(service.hasMarkType('nonexistent', 'important')).toBe(false)
    })

    it('should get all marks for a message', () => {
      const marks = service.getMessageMarks('msg2')

      expect(marks).toHaveLength(2)
      expect(marks).toContain('important')
      expect(marks).toContain('urgent')
    })

    it('should return empty array for unmarked message', () => {
      const marks = service.getMessageMarks('unmarked')

      expect(marks).toEqual([])
    })

    it('should get all messages with specific mark type', () => {
      const messages = service.getMarkedMessages('important')

      expect(messages).toHaveLength(2)
      expect(messages).toContain('msg1')
      expect(messages).toContain('msg2')
    })

    it('should get mark statistics', () => {
      const stats = service.getMarkStatistics()

      expect(stats.important).toBe(2)
      expect(stats.urgent).toBe(1)
      expect(stats.todo).toBe(1)
      expect(stats.done).toBe(0)
    })
  })

  describe('Tag Management', () => {
    beforeEach(() => {
      service.initialize()
    })

    it('should add tag to message', () => {
      const tag = service.tags[0]
      const result = service.addTag('msg123', tag)

      expect(result).toBe(true)
      expect(service.getMessageTags('msg123')).toContain(tag)
    })

    it('should fail to add duplicate tag', () => {
      const tag = service.tags[0]
      service.addTag('msg123', tag)
      const result = service.addTag('msg123', tag)

      expect(result).toBe(false)
    })

    it('should remove tag from message', () => {
      const tag = service.tags[0]
      service.addTag('msg123', tag)
      const result = service.removeTag('msg123', tag.id)

      expect(result).toBe(true)
      expect(service.getMessageTags('msg123')).not.toContain(tag)
    })

    it('should get tags for message', () => {
      const tag1 = service.tags[0]
      const tag2 = service.tags[1]

      service.addTag('msg123', tag1)
      service.addTag('msg123', tag2)

      const tags = service.getMessageTags('msg123')
      expect(tags).toHaveLength(2)
      expect(tags).toContain(tag1)
      expect(tags).toContain(tag2)
    })

    it('should return empty array for message without tags', () => {
      const tags = service.getMessageTags('msg123')

      expect(tags).toEqual([])
    })
  })

  describe('Tag CRUD', () => {
    beforeEach(() => {
      service.initialize()
    })

    it('should create new tag', () => {
      const newTag = service.createTag('Custom', '#FF0000')

      expect(newTag).toBeTruthy()
      expect(newTag.name).toBe('Custom')
      expect(newTag.color).toBe('#FF0000')
      expect(newTag.id).toBeDefined()
    })

    it('should fail to create tag without name', () => {
      const result = service.createTag('', '#FF0000')

      expect(result).toBeNull()
    })

    it('should fail to create tag without color', () => {
      const result = service.createTag('Custom', '')

      expect(result).toBeNull()
    })

    it('should update tag', () => {
      const tag = service.tags[0]
      const result = service.updateTag(tag.id, 'Updated', '#00FF00')

      expect(result).toBe(true)
      expect(tag.name).toBe('Updated')
      expect(tag.color).toBe('#00FF00')
    })

    it('should fail to update non-existent tag', () => {
      const result = service.updateTag('nonexistent', 'Updated', '#00FF00')

      expect(result).toBe(false)
    })

    it('should delete tag', () => {
      const initialCount = service.tags.length
      const tag = service.tags[0]
      const result = service.deleteTag(tag.id)

      expect(result).toBe(true)
      expect(service.tags.length).toBe(initialCount - 1)
    })

    it('should cascade delete tag from messages', () => {
      const tag = service.tags[0]
      service.addTag('msg1', tag)
      service.addTag('msg2', tag)

      service.deleteTag(tag.id)

      expect(service.getMessageTags('msg1')).not.toContain(tag)
      expect(service.getMessageTags('msg2')).not.toContain(tag)
    })

    it('should get all tags', () => {
      const tags = service.getTags()

      expect(tags).toHaveLength(service.tags.length)
      expect(tags).toEqual(service.tags)
    })

    it('should get tag statistics', () => {
      const tag1 = service.tags[0]
      const tag2 = service.tags[1]

      service.addTag('msg1', tag1)
      service.addTag('msg2', tag1)
      service.addTag('msg2', tag2)

      const stats = service.getTagStatistics()

      expect(stats[tag1.id]).toBe(2)
      expect(stats[tag2.id]).toBe(1)
    })
  })

  describe('Local Storage', () => {
    it('should save marks to localStorage', () => {
      service.markMessage('msg123', 'important')
      service.saveToLocalStorage()

      expect(localStorage.setItem).toHaveBeenCalled()
      const saved = localStorage.getItem(service.config.STORAGE_KEY)
      expect(saved).toBeTruthy()

      const parsed = JSON.parse(saved)
      expect(parsed.marks).toBeDefined()
      expect(parsed.version).toBe(1)
    })

    it('should load marks from localStorage', () => {
      service.markMessage('msg123', 'important')
      service.saveToLocalStorage()

      const newService = useMessageMarking()
      newService.loadFromLocalStorage()

      expect(newService.hasMarkType('msg123', 'important')).toBe(true)
    })

    it('should save tags to localStorage', () => {
      service.initialize()
      service.createTag('Custom', '#FF0000')
      service.saveTagsToLocalStorage()

      expect(localStorage.setItem).toHaveBeenCalled()
      const saved = localStorage.getItem(service.config.TAGS_STORAGE_KEY)
      expect(saved).toBeTruthy()

      const parsed = JSON.parse(saved)
      expect(parsed.tags).toBeDefined()
      expect(parsed.version).toBe(1)
    })

    it('should load tags from localStorage', () => {
      service.initialize()
      service.createTag('Custom', '#FF0000')
      service.saveTagsToLocalStorage()

      const newService = useMessageMarking()
      newService.loadTagsFromLocalStorage()

      expect(newService.tags.some(t => t.name === 'Custom')).toBe(true)
    })

    it('should initialize default tags if storage is empty', () => {
      const newService = useMessageMarking()
      newService.loadTagsFromLocalStorage()

      expect(newService.tags.length).toBe(4)
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(service.config.STORAGE_KEY, 'invalid json')

      const newService = useMessageMarking()
      // Should not throw
      newService.loadFromLocalStorage()

      expect(newService.marks.size).toBe(0)
    })
  })

  describe('WebSocket Events', () => {
    it('should handle mark-added event', () => {
      const event = {
        messageId: 'msg123',
        type: 'mark-added',
        data: { markType: 'important' }
      }

      service.handleMarkingEvent(event)

      expect(service.hasMarkType('msg123', 'important')).toBe(true)
    })

    it('should handle mark-removed event', () => {
      service.markMessage('msg123', 'important')

      const event = {
        messageId: 'msg123',
        type: 'mark-removed',
        data: { markType: 'important' }
      }

      service.handleMarkingEvent(event)

      expect(service.hasMarkType('msg123', 'important')).toBe(false)
    })

    it('should ignore invalid events', () => {
      service.handleMarkingEvent(null)
      service.handleMarkingEvent({})
      service.handleMarkingEvent({ type: 'invalid' })

      // Should not throw and marks should be empty
      expect(service.marks.size).toBe(0)
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      service.markMessage('msg1', 'important')
      service.markMessage('msg2', 'important')
      service.markMessage('msg3', 'urgent')
      service.initialize()
      service.createTag('Custom', '#FF0000')
    })

    it('should compute totalMarkedMessages', () => {
      expect(service.totalMarkedMessages.value).toBe(3)
    })

    it('should compute totalTags', () => {
      expect(service.totalTags.value).toBe(5) // 4 default + 1 custom
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid mark/unmark cycles', () => {
      for (let i = 0; i < 10; i++) {
        service.markMessage('msg123', 'important')
        service.unmarkMessage('msg123', 'important')
      }

      expect(service.hasMarkType('msg123', 'important')).toBe(false)
    })

    it('should handle many messages with same mark', () => {
      for (let i = 0; i < 100; i++) {
        service.markMessage(`msg${i}`, 'important')
      }

      const messages = service.getMarkedMessages('important')
      expect(messages).toHaveLength(100)
    })

    it('should handle many marks on single message', () => {
      const markTypes = ['important', 'urgent', 'todo', 'done']

      for (const markType of markTypes) {
        service.markMessage('msg123', markType)
      }

      const marks = service.getMessageMarks('msg123')
      expect(marks).toHaveLength(4)
    })

    it('should handle clearing and reusing message IDs', () => {
      service.markMessage('msg123', 'important')
      service.unmarkMessage('msg123', 'important')
      service.markMessage('msg123', 'urgent')

      expect(service.hasMarkType('msg123', 'important')).toBe(false)
      expect(service.hasMarkType('msg123', 'urgent')).toBe(true)
    })

    it('should maintain consistency across operations', () => {
      const tag1 = service.tags[0]
      const tag2 = service.tags[1]

      service.markMessage('msg123', 'important')
      service.addTag('msg123', tag1)
      service.addTag('msg123', tag2)

      expect(service.hasMarkType('msg123', 'important')).toBe(true)
      expect(service.getMessageTags('msg123')).toHaveLength(2)

      service.unmarkMessage('msg123', 'important')

      expect(service.hasMarkType('msg123', 'important')).toBe(false)
      expect(service.getMessageTags('msg123')).toHaveLength(2) // Tags should remain
    })
  })

  describe('Cleanup', () => {
    it('should clear all marks on cleanup', () => {
      service.markMessage('msg1', 'important')
      service.markMessage('msg2', 'urgent')

      service.cleanup()

      expect(service.marks.size).toBe(0)
    })

    it('should clear all tags on cleanup', () => {
      service.initialize()
      expect(service.tags.length).toBeGreaterThan(0)

      service.cleanup()

      expect(service.tags.length).toBe(0)
    })
  })
})
