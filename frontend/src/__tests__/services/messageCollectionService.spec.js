import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useMessageCollection } from '@/services/messageCollectionService'

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
      content: `Message ${id}`,
      type: 'text',
      senderName: 'John',
      senderId: 'sender123',
      conversationId: 'conv123'
    }))
  })
}))

describe('messageCollectionService', () => {
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

    service = useMessageCollection()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('collectMessage', () => {
    it('should collect a message successfully', async () => {
      const messageId = 'msg123'
      const message = {
        content: 'Test message',
        type: 'text',
        senderName: 'John',
        senderId: 'sender123'
      }

      const result = await service.collectMessage(messageId, 'conv123', message)

      expect(result).toBe(true)
      expect(service.isCollected(messageId)).toBe(true)
      expect(service.collectionCount.value).toBe(1)
    })

    it('should fail if message is already collected', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      const result = await service.collectMessage(messageId, 'conv123', message)

      expect(result).toBe(false)
    })

    it('should fail if collection count exceeds MAX_COLLECTIONS', async () => {
      const maxCollections = service.config.MAX_COLLECTIONS

      // Add maximum collections
      for (let i = 0; i < maxCollections; i++) {
        const message = { content: `Message ${i}`, type: 'text', senderName: 'John', senderId: 'sender1' }
        await service.collectMessage(`msg${i}`, 'conv123', message)
      }

      // Try to add one more
      const message = { content: 'Extra message', type: 'text', senderName: 'John', senderId: 'sender1' }
      const result = await service.collectMessage('msgExtra', 'conv123', message)

      expect(result).toBe(false)
    })

    it('should save to localStorage after collection', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)

      expect(localStorage.setItem).toHaveBeenCalled()
      const saved = localStorage.getItem(service.config.STORAGE_KEY)
      expect(saved).toBeTruthy()
    })

    it('should include metadata in collection record', async () => {
      const messageId = 'msg123'
      const message = {
        content: 'Test',
        type: 'text',
        senderName: 'John',
        senderId: 'sender1',
        attachments: [{ name: 'file.pdf', size: 1024 }],
        editCount: 2
      }

      await service.collectMessage(messageId, 'conv123', message)
      const collection = service.getCollection(messageId)

      expect(collection.metadata.editCount).toBe(2)
      expect(collection.metadata.attachments).toHaveLength(1)
    })
  })

  describe('uncollectMessage', () => {
    it('should uncollect a message successfully', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      const result = await service.uncollectMessage(messageId)

      expect(result).toBe(true)
      expect(service.isCollected(messageId)).toBe(false)
      expect(service.collectionCount.value).toBe(0)
    })

    it('should fail if message is not collected', async () => {
      const result = await service.uncollectMessage('nonexistent')
      expect(result).toBe(false)
    })

    it('should remove from pending syncs', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      expect(service.pendingSyncs.value).toContain(messageId)

      await service.uncollectMessage(messageId)
      expect(service.pendingSyncs.value).not.toContain(messageId)
    })
  })

  describe('isCollected', () => {
    it('should return true if message is collected', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      expect(service.isCollected(messageId)).toBe(true)
    })

    it('should return false if message is not collected', () => {
      expect(service.isCollected('nonexistent')).toBe(false)
    })

    it('should return false for null or undefined', () => {
      expect(service.isCollected(null)).toBe(false)
      expect(service.isCollected(undefined)).toBe(false)
    })
  })

  describe('getCollections', () => {
    beforeEach(async () => {
      const messages = [
        { id: 'msg1', content: 'First message', senderName: 'John', senderId: 'user1', type: 'text' },
        { id: 'msg2', content: 'Second message', senderName: 'Jane', senderId: 'user2', type: 'image' },
        { id: 'msg3', content: 'Important message', senderName: 'John', senderId: 'user1', type: 'text' }
      ]

      for (const msg of messages) {
        await service.collectMessage(msg.id, 'conv123', msg)
      }
    })

    it('should return all collections', () => {
      const collections = service.getCollections()
      expect(collections).toHaveLength(3)
    })

    it('should filter by type', () => {
      const collections = service.getCollections({ type: 'text' })
      expect(collections).toHaveLength(2)
      expect(collections.every(c => c.messageType === 'text')).toBe(true)
    })

    it('should filter by keyword', () => {
      const collections = service.getCollections({ keyword: 'Important' })
      expect(collections).toHaveLength(1)
      expect(collections[0].messageContent).toContain('Important')
    })

    it('should filter by sender', () => {
      const collections = service.getCollections({ senderId: 'user1' })
      expect(collections).toHaveLength(2)
      expect(collections.every(c => c.senderId === 'user1')).toBe(true)
    })

    it('should sort by recent', () => {
      const collections = service.getCollections({ sortBy: 'recent' })
      for (let i = 0; i < collections.length - 1; i++) {
        expect(collections[i].collectedAt).toBeGreaterThanOrEqual(collections[i + 1].collectedAt)
      }
    })

    it('should sort by oldest', () => {
      const collections = service.getCollections({ sortBy: 'oldest' })
      for (let i = 0; i < collections.length - 1; i++) {
        expect(collections[i].collectedAt).toBeLessThanOrEqual(collections[i + 1].collectedAt)
      }
    })

    it('should search case-insensitively', () => {
      const collections = service.getCollections({ keyword: 'FIRST' })
      expect(collections).toHaveLength(1)
      expect(collections[0].messageContent.toLowerCase()).toContain('first')
    })
  })

  describe('updateCollectionNote', () => {
    it('should update collection note successfully', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      const result = service.updateCollectionNote(messageId, 'My important note')

      expect(result).toBe(true)
      expect(service.getCollection(messageId).notes).toBe('My important note')
    })

    it('should fail if collection does not exist', () => {
      const result = service.updateCollectionNote('nonexistent', 'note')
      expect(result).toBe(false)
    })

    it('should save empty notes', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      service.updateCollectionNote(messageId, '')

      expect(service.getCollection(messageId).notes).toBe('')
    })

    it('should update updatedAt timestamp', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      const before = service.getCollection(messageId).updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))
      service.updateCollectionNote(messageId, 'note')
      const after = service.getCollection(messageId).updatedAt

      expect(after).toBeGreaterThan(before)
    })
  })

  describe('Tag Management', () => {
    it('should add collection tag', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      const result = service.addCollectionTag(messageId, 'important')

      expect(result).toBe(true)
      expect(service.getCollection(messageId).tags).toContain('important')
    })

    it('should not add duplicate tags', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      service.addCollectionTag(messageId, 'important')
      service.addCollectionTag(messageId, 'important')

      expect(service.getCollection(messageId).tags).toHaveLength(1)
    })

    it('should remove collection tag', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      service.addCollectionTag(messageId, 'important')
      const result = service.removeCollectionTag(messageId, 'important')

      expect(result).toBe(true)
      expect(service.getCollection(messageId).tags).not.toContain('important')
    })

    it('should filter collections by tags', async () => {
      const msg1 = { id: 'msg1', content: 'Test1', type: 'text', senderName: 'John', senderId: 'user1' }
      const msg2 = { id: 'msg2', content: 'Test2', type: 'text', senderName: 'John', senderId: 'user1' }

      await service.collectMessage('msg1', 'conv123', msg1)
      await service.collectMessage('msg2', 'conv123', msg2)

      service.addCollectionTag('msg1', 'urgent')
      service.addCollectionTag('msg2', 'review')

      const filtered = service.getCollections({ tags: ['urgent'] })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].messageId).toBe('msg1')
    })
  })

  describe('Batch Operations', () => {
    beforeEach(async () => {
      for (let i = 1; i <= 5; i++) {
        const message = { content: `Message ${i}`, type: 'text', senderName: 'John', senderId: 'user1' }
        await service.collectMessage(`msg${i}`, 'conv123', message)
      }
    })

    it('should batch uncollect messages', async () => {
      const result = await service.batchUncollect(['msg1', 'msg2', 'msg3'])

      expect(result).toBe(true)
      expect(service.collectionCount.value).toBe(2)
      expect(service.isCollected('msg1')).toBe(false)
      expect(service.isCollected('msg4')).toBe(true)
    })

    it('should clear all collections', async () => {
      const result = service.clearCollections()

      expect(result).toBe(true)
      expect(service.collectionCount.value).toBe(0)
    })

    it('should clear pending syncs on clear', () => {
      expect(service.pendingSyncs.value.length).toBeGreaterThan(0)

      service.clearCollections()

      expect(service.pendingSyncs.value).toHaveLength(0)
    })
  })

  describe('Local Storage', () => {
    it('should save collections to localStorage', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)

      const saved = localStorage.getItem(service.config.STORAGE_KEY)
      expect(saved).toBeTruthy()

      const parsed = JSON.parse(saved)
      expect(parsed.collections).toBeDefined()
      expect(parsed.version).toBe(1)
    })

    it('should load collections from localStorage', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)

      // Create new service instance
      const newService = useMessageCollection()
      newService.loadFromLocalStorage()

      expect(newService.collections.size).toBe(1)
      expect(newService.isCollected(messageId)).toBe(true)
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(service.config.STORAGE_KEY, 'invalid json')

      const newService = useMessageCollection()
      // Should not throw
      newService.loadFromLocalStorage()

      expect(newService.collections.size).toBe(0)
    })
  })

  describe('Pending Syncs', () => {
    it('should add to pending syncs on collect', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)

      expect(service.pendingSyncs.value).toContain(messageId)
    })

    it('should remove from pending syncs on uncollect', async () => {
      const messageId = 'msg123'
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage(messageId, 'conv123', message)
      await service.uncollectMessage(messageId)

      expect(service.pendingSyncs.value).not.toContain(messageId)
    })

    it('should compute hasPendingSyncs correctly', async () => {
      expect(service.hasPendingSyncs.value).toBe(false)

      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }
      await service.collectMessage('msg123', 'conv123', message)

      expect(service.hasPendingSyncs.value).toBe(true)
    })
  })

  describe('Collection Record Creation', () => {
    it('should create complete collection record', async () => {
      const message = {
        content: 'Test message',
        type: 'text',
        senderName: 'John',
        senderId: 'sender123',
        attachments: [{ name: 'file.pdf', size: 1024 }],
        quotedMessage: { content: 'quoted', senderName: 'Jane' },
        editCount: 2,
        isRecalled: false
      }

      await service.collectMessage('msg123', 'conv123', message)
      const collection = service.getCollection('msg123')

      expect(collection.id).toBeDefined()
      expect(collection.messageId).toBe('msg123')
      expect(collection.messageContent).toBe('Test message')
      expect(collection.messageType).toBe('text')
      expect(collection.senderName).toBe('John')
      expect(collection.senderId).toBe('sender123')
      expect(collection.conversationId).toBe('conv123')
      expect(collection.collectedAt).toBeDefined()
      expect(collection.collectedBy).toBeDefined()
      expect(collection.notes).toBe('')
      expect(collection.tags).toEqual([])
      expect(collection.metadata.attachments).toHaveLength(1)
      expect(collection.metadata.editCount).toBe(2)
      expect(collection.metadata.isRecalled).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty message content', async () => {
      const message = { content: '', type: 'text', senderName: 'John', senderId: 'sender1' }
      const result = await service.collectMessage('msg123', 'conv123', message)

      expect(result).toBe(true)
      expect(service.getCollection('msg123').messageContent).toBe('')
    })

    it('should handle special characters in content', async () => {
      const message = {
        content: 'Test with 🎉 emoji and special chars: <>",',
        type: 'text',
        senderName: 'John',
        senderId: 'sender1'
      }

      const result = await service.collectMessage('msg123', 'conv123', message)

      expect(result).toBe(true)
      expect(service.getCollection('msg123').messageContent).toContain('🎉')
    })

    it('should generate unique collection IDs', async () => {
      const message = { content: 'Test', type: 'text', senderName: 'John', senderId: 'sender1' }

      await service.collectMessage('msg1', 'conv123', message)
      await service.collectMessage('msg2', 'conv123', message)

      const coll1 = service.getCollection('msg1')
      const coll2 = service.getCollection('msg2')

      expect(coll1.id).not.toBe(coll2.id)
    })
  })
})
