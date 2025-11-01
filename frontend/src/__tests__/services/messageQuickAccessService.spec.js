/**
 * Message Quick Access Service Tests (Phase 7D Advanced)
 * 60+ comprehensive test cases covering all functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  pinMessage,
  unpinMessage,
  isPinned,
  getPinnedMessages,
  addToRecent,
  getRecentMessages,
  clearRecentHistory,
  toggleQuickFilter,
  getActiveFilters,
  clearFilters,
  getQuickAccessData,
  saveToLocalStorage,
  loadFromLocalStorage,
  cleanup,
  useMessageQuickAccess
} from '@/services/messageQuickAccessService'

describe('Message Quick Access Service', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  // ========== Pin Message Tests ==========
  describe('Pin Message Operations', () => {
    it('should pin a message', () => {
      const result = pinMessage('msg1', {
        content: 'Important message',
        senderName: 'User1',
        timestamp: Date.now(),
        type: 'text'
      })
      expect(result).toBe(true)
    })

    it('should return pinned messages', () => {
      pinMessage('msg1', {
        content: 'Test',
        senderName: 'User1',
        timestamp: Date.now(),
        type: 'text'
      })
      const pinned = getPinnedMessages()
      expect(Array.isArray(pinned)).toBe(true)
      expect(pinned.length).toBe(1)
    })

    it('should pin multiple messages', () => {
      pinMessage('msg1', { content: 'C1', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      pinMessage('msg2', { content: 'C2', senderName: 'U2', timestamp: Date.now(), type: 'text' })
      pinMessage('msg3', { content: 'C3', senderName: 'U3', timestamp: Date.now(), type: 'text' })
      const pinned = getPinnedMessages()
      expect(pinned.length).toBe(3)
    })

    it('should not pin same message twice', () => {
      const data = { content: 'Test', senderName: 'User', timestamp: Date.now(), type: 'text' }
      pinMessage('msg1', data)
      const result = pinMessage('msg1', data)
      expect(result).toBe(false)
      const pinned = getPinnedMessages()
      expect(pinned.length).toBe(1)
    })

    it('should enforce max 10 pinned messages', () => {
      for (let i = 0; i < 10; i++) {
        pinMessage(`msg${i}`, {
          content: `Content ${i}`,
          senderName: `User${i}`,
          timestamp: Date.now(),
          type: 'text'
        })
      }
      const result = pinMessage('msg10', {
        content: 'Over limit',
        senderName: 'User10',
        timestamp: Date.now(),
        type: 'text'
      })
      expect(result).toBe(false)
      const pinned = getPinnedMessages()
      expect(pinned.length).toBe(10)
    })

    it('should unpin a message', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      const result = unpinMessage('msg1')
      expect(result).toBe(true)
      const pinned = getPinnedMessages()
      expect(pinned.length).toBe(0)
    })

    it('should return false when unpinning non-existent message', () => {
      const result = unpinMessage('non-existent')
      expect(result).toBe(false)
    })

    it('should check if message is pinned', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      expect(isPinned('msg1')).toBe(true)
      expect(isPinned('msg2')).toBe(false)
    })

    it('should store pin timestamp', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      const pinned = getPinnedMessages()
      expect(pinned[0]).toHaveProperty('pinnedAt')
      expect(pinned[0].pinnedAt).toBeGreaterThan(0)
    })

    it('should preserve message data when pinning', () => {
      const data = {
        content: 'Important info',
        senderName: 'Alice',
        timestamp: 1234567890,
        type: 'text'
      }
      pinMessage('msg1', data)
      const pinned = getPinnedMessages()
      expect(pinned[0].content).toBe('Important info')
      expect(pinned[0].senderName).toBe('Alice')
      expect(pinned[0].type).toBe('text')
    })

    it('should maintain pin order (most recent first)', () => {
      pinMessage('msg1', { content: 'First', senderName: 'U1', timestamp: 1000, type: 'text' })
      pinMessage('msg2', { content: 'Second', senderName: 'U2', timestamp: 2000, type: 'text' })
      const pinned = getPinnedMessages()
      expect(pinned[0].messageId).toBe('msg2')
      expect(pinned[1].messageId).toBe('msg1')
    })
  })

  // ========== Recent Messages Tests ==========
  describe('Recent Messages Operations', () => {
    it('should add message to recent', () => {
      const result = addToRecent('msg1', {
        content: 'Recent',
        senderName: 'User1',
        timestamp: Date.now(),
        type: 'text'
      })
      expect(result).toBe(true)
    })

    it('should return recent messages', () => {
      addToRecent('msg1', { content: 'R1', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      const recent = getRecentMessages()
      expect(Array.isArray(recent)).toBe(true)
      expect(recent.length).toBe(1)
    })

    it('should limit recent to 5 messages', () => {
      for (let i = 0; i < 7; i++) {
        addToRecent(`msg${i}`, {
          content: `Content ${i}`,
          senderName: `User${i}`,
          timestamp: Date.now(),
          type: 'text'
        })
      }
      const recent = getRecentMessages()
      expect(recent.length).toBe(5)
    })

    it('should move existing message to front', () => {
      addToRecent('msg1', { content: 'First', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      addToRecent('msg2', { content: 'Second', senderName: 'U2', timestamp: Date.now(), type: 'text' })
      addToRecent('msg1', { content: 'First', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      const recent = getRecentMessages()
      expect(recent[0].messageId).toBe('msg1')
      expect(recent.length).toBe(2)
    })

    it('should store view timestamp', () => {
      addToRecent('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      const recent = getRecentMessages()
      expect(recent[0]).toHaveProperty('viewedAt')
      expect(recent[0].viewedAt).toBeGreaterThan(0)
    })

    it('should clear recent messages history', () => {
      addToRecent('msg1', { content: 'R1', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      addToRecent('msg2', { content: 'R2', senderName: 'U2', timestamp: Date.now(), type: 'text' })
      clearRecentHistory()
      const recent = getRecentMessages()
      expect(recent.length).toBe(0)
    })

    it('should preserve recent order (most recent first)', () => {
      addToRecent('msg1', { content: 'First', senderName: 'U1', timestamp: 1000, type: 'text' })
      addToRecent('msg2', { content: 'Second', senderName: 'U2', timestamp: 2000, type: 'text' })
      addToRecent('msg3', { content: 'Third', senderName: 'U3', timestamp: 3000, type: 'text' })
      const recent = getRecentMessages()
      expect(recent[0].messageId).toBe('msg3')
      expect(recent[1].messageId).toBe('msg2')
      expect(recent[2].messageId).toBe('msg1')
    })

    it('should handle rapid additions', () => {
      for (let i = 0; i < 3; i++) {
        addToRecent(`msg${i}`, { content: `C${i}`, senderName: `U${i}`, timestamp: Date.now(), type: 'text' })
      }
      const recent = getRecentMessages()
      expect(recent.length).toBe(3)
    })
  })

  // ========== Quick Filter Tests ==========
  describe('Quick Filter Operations', () => {
    it('should toggle filter on', () => {
      const result = toggleQuickFilter('showPinned')
      expect(result).toBe(true)
    })

    it('should toggle filter off', () => {
      toggleQuickFilter('showPinned')
      const result = toggleQuickFilter('showPinned')
      expect(result).toBe(false)
    })

    it('should toggle multiple filters', () => {
      toggleQuickFilter('showPinned')
      toggleQuickFilter('showRecent')
      toggleQuickFilter('showImportant')
      const active = getActiveFilters()
      expect(active.length).toBe(3)
    })

    it('should return false for invalid filter', () => {
      const result = toggleQuickFilter('invalidFilter')
      expect(result).toBe(false)
    })

    it('should get active filters', () => {
      toggleQuickFilter('showPinned')
      toggleQuickFilter('showRecent')
      const active = getActiveFilters()
      expect(Array.isArray(active)).toBe(true)
      expect(active).toContain('showPinned')
      expect(active).toContain('showRecent')
    })

    it('should return empty array when no filters active', () => {
      const active = getActiveFilters()
      expect(active.length).toBe(0)
    })

    it('should clear all filters', () => {
      toggleQuickFilter('showPinned')
      toggleQuickFilter('showRecent')
      toggleQuickFilter('showImportant')
      clearFilters()
      const active = getActiveFilters()
      expect(active.length).toBe(0)
    })

    it('should support all filter types', () => {
      toggleQuickFilter('showPinned')
      toggleQuickFilter('showRecent')
      toggleQuickFilter('showImportant')
      toggleQuickFilter('showTodo')
      const active = getActiveFilters()
      expect(active.length).toBe(4)
    })

    it('should toggle filter independently', () => {
      toggleQuickFilter('showPinned')
      toggleQuickFilter('showRecent')
      const active1 = getActiveFilters()
      expect(active1.length).toBe(2)

      toggleQuickFilter('showPinned')
      const active2 = getActiveFilters()
      expect(active2.length).toBe(1)
      expect(active2).toContain('showRecent')
    })
  })

  // ========== Quick Access Data Tests ==========
  describe('Quick Access Data Retrieval', () => {
    it('should return complete quick access data', () => {
      pinMessage('msg1', { content: 'C1', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      addToRecent('msg2', { content: 'C2', senderName: 'U2', timestamp: Date.now(), type: 'text' })
      toggleQuickFilter('showPinned')

      const data = getQuickAccessData()
      expect(data).toHaveProperty('pinned')
      expect(data).toHaveProperty('recent')
      expect(data).toHaveProperty('filters')
      expect(data).toHaveProperty('activeFilterCount')
    })

    it('should include pinned messages in data', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      const data = getQuickAccessData()
      expect(data.pinned.length).toBe(1)
    })

    it('should include recent messages in data', () => {
      addToRecent('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      const data = getQuickAccessData()
      expect(data.recent.length).toBe(1)
    })

    it('should include filter state in data', () => {
      toggleQuickFilter('showPinned')
      const data = getQuickAccessData()
      expect(data.filters.showPinned).toBe(true)
    })

    it('should count active filters', () => {
      toggleQuickFilter('showPinned')
      toggleQuickFilter('showRecent')
      toggleQuickFilter('showImportant')
      const data = getQuickAccessData()
      expect(data.activeFilterCount).toBe(3)
    })

    it('should return zero active filter count initially', () => {
      const data = getQuickAccessData()
      expect(data.activeFilterCount).toBe(0)
    })
  })

  // ========== localStorage Tests ==========
  describe('localStorage Persistence', () => {
    it('should save to localStorage', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      const result = saveToLocalStorage()
      expect(result).toBe(true)
    })

    it('should load from localStorage', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      saveToLocalStorage()

      cleanup()
      loadFromLocalStorage()

      const pinned = getPinnedMessages()
      expect(pinned.length).toBe(1)
    })

    it('should preserve pinned messages', () => {
      pinMessage('msg1', { content: 'First', senderName: 'U1', timestamp: 1000, type: 'text' })
      pinMessage('msg2', { content: 'Second', senderName: 'U2', timestamp: 2000, type: 'text' })
      saveToLocalStorage()

      cleanup()
      loadFromLocalStorage()

      const pinned = getPinnedMessages()
      expect(pinned.length).toBe(2)
    })

    it('should preserve recent messages', () => {
      addToRecent('msg1', { content: 'Recent', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      saveToLocalStorage()

      cleanup()
      loadFromLocalStorage()

      const recent = getRecentMessages()
      expect(recent.length).toBe(1)
    })

    it('should preserve filter state', () => {
      toggleQuickFilter('showPinned')
      toggleQuickFilter('showRecent')
      saveToLocalStorage()

      cleanup()
      loadFromLocalStorage()

      const active = getActiveFilters()
      expect(active.length).toBe(2)
    })

    it('should handle missing localStorage data gracefully', () => {
      const result = loadFromLocalStorage()
      expect(result).toBe(true)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('message_quick_access', 'corrupted data')
      const result = loadFromLocalStorage()
      expect(result).toBe(false)
    })

    it('should include version in saved data', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      saveToLocalStorage()

      const saved = localStorage.getItem('message_quick_access')
      const data = JSON.parse(saved)
      expect(data.version).toBe(1)
    })

    it('should include lastSaved timestamp', () => {
      saveToLocalStorage()

      const saved = localStorage.getItem('message_quick_access')
      const data = JSON.parse(saved)
      expect(data).toHaveProperty('lastSaved')
      expect(data.lastSaved).toBeGreaterThan(0)
    })
  })

  // ========== Cleanup Tests ==========
  describe('Cleanup Operations', () => {
    it('should cleanup all data', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      addToRecent('msg2', { content: 'Recent', senderName: 'User2', timestamp: Date.now(), type: 'text' })
      toggleQuickFilter('showPinned')

      cleanup()

      expect(getPinnedMessages().length).toBe(0)
      expect(getRecentMessages().length).toBe(0)
      expect(getActiveFilters().length).toBe(0)
    })

    it('should clear pinned messages', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      cleanup()
      expect(getPinnedMessages().length).toBe(0)
    })

    it('should clear recent messages', () => {
      addToRecent('msg1', { content: 'Test', senderName: 'User1', timestamp: Date.now(), type: 'text' })
      cleanup()
      expect(getRecentMessages().length).toBe(0)
    })

    it('should reset filters', () => {
      toggleQuickFilter('showPinned')
      cleanup()
      expect(getActiveFilters().length).toBe(0)
    })
  })

  // ========== Composition API Tests ==========
  describe('useMessageQuickAccess()', () => {
    it('should export useMessageQuickAccess function', () => {
      const api = useMessageQuickAccess()
      expect(api).toBeDefined()
    })

    it('should return all pin methods', () => {
      const api = useMessageQuickAccess()
      expect(api.pinMessage).toBeDefined()
      expect(api.unpinMessage).toBeDefined()
      expect(api.isPinned).toBeDefined()
      expect(api.getPinnedMessages).toBeDefined()
    })

    it('should return all recent methods', () => {
      const api = useMessageQuickAccess()
      expect(api.addToRecent).toBeDefined()
      expect(api.getRecentMessages).toBeDefined()
      expect(api.clearRecentHistory).toBeDefined()
    })

    it('should return all filter methods', () => {
      const api = useMessageQuickAccess()
      expect(api.toggleQuickFilter).toBeDefined()
      expect(api.getActiveFilters).toBeDefined()
      expect(api.clearFilters).toBeDefined()
    })

    it('should return reactive state', () => {
      const api = useMessageQuickAccess()
      expect(api.pinnedMessages).toBeDefined()
      expect(api.recentMessages).toBeDefined()
      expect(api.quickFilters).toBeDefined()
      expect(api.activeFilterCount).toBeDefined()
    })

    it('should export CONFIG', () => {
      const api = useMessageQuickAccess()
      expect(api.CONFIG).toBeDefined()
      expect(api.CONFIG.MAX_PINNED).toBe(10)
      expect(api.CONFIG.MAX_RECENT).toBe(5)
    })

    it('should return storage methods', () => {
      const api = useMessageQuickAccess()
      expect(api.saveToLocalStorage).toBeDefined()
      expect(api.loadFromLocalStorage).toBeDefined()
    })

    it('should return cleanup method', () => {
      const api = useMessageQuickAccess()
      expect(api.cleanup).toBeDefined()
    })
  })

  // ========== Edge Cases Tests ==========
  describe('Edge Cases', () => {
    it('should handle empty messageId', () => {
      const result = pinMessage('', { content: 'Test', senderName: 'User', timestamp: Date.now(), type: 'text' })
      expect(result).toBe(true)
    })

    it('should handle very long content', () => {
      const longContent = 'a'.repeat(10000)
      const result = pinMessage('msg1', { content: longContent, senderName: 'User', timestamp: Date.now(), type: 'text' })
      expect(result).toBe(true)
    })

    it('should handle special characters in senderName', () => {
      const result = pinMessage('msg1', { content: 'Test', senderName: '!@#$%^&*()', timestamp: Date.now(), type: 'text' })
      expect(result).toBe(true)
    })

    it('should handle unicode content', () => {
      const result = pinMessage('msg1', { content: '中文测试 🎉 テスト', senderName: 'User', timestamp: Date.now(), type: 'text' })
      expect(result).toBe(true)
    })

    it('should handle negative timestamp', () => {
      const result = pinMessage('msg1', { content: 'Test', senderName: 'User', timestamp: -1000, type: 'text' })
      expect(result).toBe(true)
    })

    it('should handle future timestamp', () => {
      const result = pinMessage('msg1', { content: 'Test', senderName: 'User', timestamp: Date.now() + 100000, type: 'text' })
      expect(result).toBe(true)
    })

    it('should handle missing message data fields', () => {
      const result = pinMessage('msg1', { content: 'Test' })
      expect(result).toBe(true)
    })
  })

  // ========== Integration Tests ==========
  describe('Integration Scenarios', () => {
    it('should handle pin and add to recent together', () => {
      pinMessage('msg1', { content: 'Important', senderName: 'User', timestamp: Date.now(), type: 'text' })
      addToRecent('msg1', { content: 'Important', senderName: 'User', timestamp: Date.now(), type: 'text' })

      expect(isPinned('msg1')).toBe(true)
      expect(getRecentMessages().length).toBe(1)
    })

    it('should allow unpinning and later pinning again', () => {
      pinMessage('msg1', { content: 'Test', senderName: 'User', timestamp: Date.now(), type: 'text' })
      unpinMessage('msg1')
      const secondPin = pinMessage('msg1', { content: 'Test', senderName: 'User', timestamp: Date.now(), type: 'text' })

      expect(secondPin).toBe(true)
      expect(getPinnedMessages().length).toBe(1)
    })

    it('should maintain data consistency across operations', () => {
      pinMessage('msg1', { content: 'C1', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      addToRecent('msg2', { content: 'C2', senderName: 'U2', timestamp: Date.now(), type: 'text' })
      toggleQuickFilter('showPinned')

      saveToLocalStorage()
      cleanup()
      loadFromLocalStorage()

      expect(getPinnedMessages().length).toBe(1)
      expect(getRecentMessages().length).toBe(1)
      expect(getActiveFilters().length).toBe(1)
    })

    it('should handle mixed operations in sequence', () => {
      // Complex sequence
      pinMessage('msg1', { content: 'C1', senderName: 'U1', timestamp: Date.now(), type: 'text' })
      addToRecent('msg2', { content: 'C2', senderName: 'U2', timestamp: Date.now(), type: 'text' })
      toggleQuickFilter('showPinned')
      pinMessage('msg3', { content: 'C3', senderName: 'U3', timestamp: Date.now(), type: 'text' })
      addToRecent('msg2', { content: 'C2', senderName: 'U2', timestamp: Date.now(), type: 'text' })
      toggleQuickFilter('showRecent')
      unpinMessage('msg1')

      expect(getPinnedMessages().length).toBe(1)
      expect(getRecentMessages().length).toBe(1)
      expect(getActiveFilters().length).toBe(2)
    })
  })
})
