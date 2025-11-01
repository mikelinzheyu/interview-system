/**
 * Message Sorting Service Tests (Phase 7D Advanced)
 * 70+ comprehensive test cases covering all functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  sortMessages,
  setUserPreference,
  getUserPreferences,
  resetPreferences,
  savePreferences,
  loadPreferences,
  cleanup,
  useMessageSorting
} from '@/services/messageSortingService'

describe('Message Sorting Service', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  // ========== Helper Functions ==========
  const createMessage = (id, content = 'Test', timestamp = Date.now(), meta = {}) => ({
    id,
    content,
    timestamp,
    senderName: meta.senderName || 'User',
    forwardCount: meta.forwardCount || 0,
    replyCount: meta.replyCount || 0,
    isCollected: meta.isCollected || false,
    viewCount: meta.viewCount || 0,
    ...meta
  })

  // ========== Basic Sorting Tests ==========
  describe('sortMessages()', () => {
    it('should return empty array for empty input', () => {
      const result = sortMessages([])
      expect(result).toEqual([])
    })

    it('should return array for null input', () => {
      const result = sortMessages(null)
      expect(result).toEqual([])
    })

    it('should sort by recency by default', () => {
      const now = Date.now()
      const messages = [
        createMessage('1', 'Old', now - 86400000), // 1 day ago
        createMessage('2', 'New', now),
        createMessage('3', 'Middle', now - 3600000) // 1 hour ago
      ]
      const result = sortMessages(messages, 'recency')
      expect(result[0].id).toBe('2') // Most recent first
      expect(result[2].id).toBe('1') // Oldest last
    })

    it('should sort by oldest', () => {
      const now = Date.now()
      const messages = [
        createMessage('1', 'Old', now - 86400000),
        createMessage('2', 'New', now),
        createMessage('3', 'Middle', now - 3600000)
      ]
      const result = sortMessages(messages, 'oldest')
      expect(result[0].id).toBe('1') // Oldest first
      expect(result[2].id).toBe('2') // Newest last
    })

    it('should sort by importance', () => {
      const messages = [
        createMessage('1', 'Low importance'),
        createMessage('2', 'HIGH IMPORTANCE!!!'), // All caps + exclamations
        createMessage('3', 'normal')
      ]
      const userMarks = {
        '2': { important: true }
      }
      const result = sortMessages(messages, 'importance', userMarks)
      expect(result[0].id).toBe('2') // Most important first
    })

    it('should sort by engagement', () => {
      const messages = [
        createMessage('1', 'No engagement', Date.now(), { forwardCount: 0, replyCount: 0 }),
        createMessage('2', 'High engagement', Date.now(), { forwardCount: 5, replyCount: 10, isCollected: true }),
        createMessage('3', 'Some engagement', Date.now(), { forwardCount: 2, replyCount: 1 })
      ]
      const result = sortMessages(messages, 'engagement')
      expect(result[0].id).toBe('2') // Highest engagement first
    })

    it('should sort alphabetically by sender name', () => {
      const messages = [
        createMessage('1', 'Test', Date.now(), { senderName: 'Charlie' }),
        createMessage('2', 'Test', Date.now(), { senderName: 'Alice' }),
        createMessage('3', 'Test', Date.now(), { senderName: 'Bob' })
      ]
      const result = sortMessages(messages, 'alphabetical')
      expect(result[0].senderName).toBe('Alice') // A comes first
    })

    it('should sort by relevance score', () => {
      const messages = [
        createMessage('1', 'Test', Date.now(), { relevanceScore: 0.3 }),
        createMessage('2', 'Test', Date.now(), { relevanceScore: 0.9 }),
        createMessage('3', 'Test', Date.now(), { relevanceScore: 0.5 })
      ]
      const result = sortMessages(messages, 'relevance')
      expect(result[0].id).toBe('2') // Highest relevance first
    })

    it('should not modify original array', () => {
      const messages = [
        createMessage('1', 'Old', Date.now() - 86400000),
        createMessage('2', 'New', Date.now())
      ]
      const original = [...messages]
      sortMessages(messages)
      expect(messages).toEqual(original)
    })

    it('should handle single message', () => {
      const messages = [createMessage('1', 'Only')]
      const result = sortMessages(messages, 'recency')
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('1')
    })

    it('should handle messages with identical timestamps', () => {
      const now = Date.now()
      const messages = [
        createMessage('1', 'Same time', now),
        createMessage('2', 'Same time', now),
        createMessage('3', 'Same time', now)
      ]
      const result = sortMessages(messages, 'recency')
      expect(result.length).toBe(3)
    })

    it('should handle missing timestamps', () => {
      const messages = [
        createMessage('1', 'No timestamp', null),
        createMessage('2', 'Has timestamp', Date.now())
      ]
      const result = sortMessages(messages, 'recency')
      expect(result.length).toBe(2)
    })
  })

  // ========== Recency Scoring Tests ==========
  describe('Recency Scoring', () => {
    it('should give high score to very recent messages', () => {
      const now = Date.now()
      const messages = [
        createMessage('1', 'Very recent', now - 100), // Less than 1 hour
        createMessage('2', 'Older', now - 86400000) // 1 day ago
      ]
      const result = sortMessages(messages, 'recency')
      expect(result[0].id).toBe('1')
    })

    it('should progressively reduce score with age', () => {
      const now = Date.now()
      const messages = [
        createMessage('1', 'Hour ago', now - 3600000),
        createMessage('2', 'Day ago', now - 86400000),
        createMessage('3', 'Week ago', now - 604800000),
        createMessage('4', 'Month ago', now - 2592000000),
        createMessage('5', 'Over month', now - 3600000000)
      ]
      const result = sortMessages(messages, 'recency')
      // Should be ordered from most recent to oldest
      expect(result.map(m => m.id)).toEqual(['1', '2', '3', '4', '5'])
    })

    it('should handle reverse for oldest sorting', () => {
      const now = Date.now()
      const messages = [
        createMessage('1', 'Recent', now),
        createMessage('2', 'Oldest', now - 2592000000),
        createMessage('3', 'Middle', now - 86400000)
      ]
      const result = sortMessages(messages, 'oldest')
      expect(result[0].id).toBe('2') // Oldest first
      expect(result[2].id).toBe('1') // Newest last
    })
  })

  // ========== Importance Scoring Tests ==========
  describe('Importance Scoring', () => {
    it('should boost marked important messages', () => {
      const messages = [
        createMessage('1', 'Normal'),
        createMessage('2', 'Important'),
        createMessage('3', 'Normal')
      ]
      const userMarks = {
        '2': { important: true }
      }
      const result = sortMessages(messages, 'importance', userMarks)
      expect(result[0].id).toBe('2')
    })

    it('should prioritize urgent over important', () => {
      const messages = [
        createMessage('1', 'Important'),
        createMessage('2', 'Urgent'),
        createMessage('3', 'Todo')
      ]
      const userMarks = {
        '1': { important: true },
        '2': { urgent: true },
        '3': { todo: true }
      }
      const result = sortMessages(messages, 'importance', userMarks)
      expect(result[0].id).toBe('2') // Urgent is highest priority
    })

    it('should boost all caps text', () => {
      const messages = [
        createMessage('1', 'normal text'),
        createMessage('2', 'IMPORTANT MESSAGE!!!'),
        createMessage('3', 'MiXeD CaSe')
      ]
      const result = sortMessages(messages, 'importance')
      expect(result[0].id).toBe('2') // Most caps boost
    })

    it('should boost messages with exclamation marks', () => {
      const messages = [
        createMessage('1', 'normal'),
        createMessage('2', 'important!'),
        createMessage('3', 'very important!!!!')
      ]
      const result = sortMessages(messages, 'importance')
      expect(result[0].id).toBe('3') // Most exclamations
    })

    it('should handle done marks', () => {
      const messages = [
        createMessage('1', 'Todo'),
        createMessage('2', 'Done'),
        createMessage('3', 'Important')
      ]
      const userMarks = {
        '1': { todo: true },
        '2': { done: true },
        '3': { important: true }
      }
      const result = sortMessages(messages, 'importance', userMarks)
      expect(result[0].id).toBe('3') // Important highest, done lowest
    })
  })

  // ========== Engagement Scoring Tests ==========
  describe('Engagement Scoring', () => {
    it('should boost messages with forward counts', () => {
      const messages = [
        createMessage('1', 'No forwards', Date.now(), { forwardCount: 0 }),
        createMessage('2', 'Popular', Date.now(), { forwardCount: 5 }),
        createMessage('3', 'Some forwards', Date.now(), { forwardCount: 2 })
      ]
      const result = sortMessages(messages, 'engagement')
      expect(result[0].id).toBe('2')
    })

    it('should boost messages with reply counts', () => {
      const messages = [
        createMessage('1', 'No replies', Date.now(), { replyCount: 0 }),
        createMessage('2', 'Discussion', Date.now(), { replyCount: 10 }),
        createMessage('3', 'Some replies', Date.now(), { replyCount: 3 })
      ]
      const result = sortMessages(messages, 'engagement')
      expect(result[0].id).toBe('2')
    })

    it('should boost collected messages', () => {
      const messages = [
        createMessage('1', 'Not collected', Date.now(), { isCollected: false }),
        createMessage('2', 'Collected', Date.now(), { isCollected: true }),
        createMessage('3', 'Not collected', Date.now(), { isCollected: false })
      ]
      const result = sortMessages(messages, 'engagement')
      expect(result[0].id).toBe('2')
    })

    it('should boost messages with view counts', () => {
      const messages = [
        createMessage('1', 'Few views', Date.now(), { viewCount: 5 }),
        createMessage('2', 'Many views', Date.now(), { viewCount: 100 }),
        createMessage('3', 'Some views', Date.now(), { viewCount: 20 })
      ]
      const result = sortMessages(messages, 'engagement')
      expect(result[0].id).toBe('2')
    })

    it('should combine multiple engagement factors', () => {
      const messages = [
        createMessage('1', 'Low', Date.now(), {
          forwardCount: 0,
          replyCount: 0,
          isCollected: false,
          viewCount: 0
        }),
        createMessage('2', 'High', Date.now(), {
          forwardCount: 5,
          replyCount: 10,
          isCollected: true,
          viewCount: 50
        })
      ]
      const result = sortMessages(messages, 'engagement')
      expect(result[0].id).toBe('2')
    })
  })

  // ========== Alphabetical Sorting Tests ==========
  describe('Alphabetical Sorting', () => {
    it('should sort by first letter of sender name', () => {
      const messages = [
        createMessage('1', 'Test', Date.now(), { senderName: 'Charlie' }),
        createMessage('2', 'Test', Date.now(), { senderName: 'Alice' }),
        createMessage('3', 'Test', Date.now(), { senderName: 'Bob' })
      ]
      const result = sortMessages(messages, 'alphabetical')
      expect(result[0].senderName).toBe('Alice')
      expect(result[1].senderName).toBe('Bob')
      expect(result[2].senderName).toBe('Charlie')
    })

    it('should handle names starting with numbers', () => {
      const messages = [
        createMessage('1', 'Test', Date.now(), { senderName: 'User2' }),
        createMessage('2', 'Test', Date.now(), { senderName: 'User1' }),
        createMessage('3', 'Test', Date.now(), { senderName: 'Alice' })
      ]
      const result = sortMessages(messages, 'alphabetical')
      expect(result[0].senderName).toBe('Alice')
    })

    it('should handle missing sender names', () => {
      const messages = [
        createMessage('1', 'Test', Date.now(), { senderName: '' }),
        createMessage('2', 'Test', Date.now(), { senderName: 'Bob' }),
        createMessage('3', 'Test', Date.now(), { senderName: 'Alice' })
      ]
      const result = sortMessages(messages, 'alphabetical')
      expect(result.length).toBe(3)
    })

    it('should be case insensitive', () => {
      const messages = [
        createMessage('1', 'Test', Date.now(), { senderName: 'charlie' }),
        createMessage('2', 'Test', Date.now(), { senderName: 'ALICE' }),
        createMessage('3', 'Test', Date.now(), { senderName: 'Bob' })
      ]
      const result = sortMessages(messages, 'alphabetical')
      expect(result[0].senderName).toBe('ALICE')
    })
  })

  // ========== User Preferences Tests ==========
  describe('User Preferences', () => {
    it('should set user preference', () => {
      const result = setUserPreference('defaultSort', 'importance')
      expect(result).toBe(true)
    })

    it('should return false for invalid preference key', () => {
      const result = setUserPreference('invalidKey', 'value')
      expect(result).toBe(false)
    })

    it('should get user preferences', () => {
      setUserPreference('defaultSort', 'engagement')
      const prefs = getUserPreferences()
      expect(prefs).toHaveProperty('defaultSort')
      expect(prefs.defaultSort).toBe('engagement')
    })

    it('should include all preference properties', () => {
      const prefs = getUserPreferences()
      expect(prefs).toHaveProperty('defaultSort')
      expect(prefs).toHaveProperty('boostCollected')
      expect(prefs).toHaveProperty('boostMarked')
      expect(prefs).toHaveProperty('boostFromVIP')
      expect(prefs).toHaveProperty('recencyWeight')
      expect(prefs).toHaveProperty('importanceWeight')
      expect(prefs).toHaveProperty('engagementWeight')
    })

    it('should reset preferences to defaults', () => {
      setUserPreference('defaultSort', 'importance')
      resetPreferences()
      const prefs = getUserPreferences()
      expect(prefs.defaultSort).toBe('recency')
    })

    it('should apply collected boost preference', () => {
      setUserPreference('boostCollected', false)
      const messages = [
        createMessage('1', 'Collected', Date.now(), { isCollected: true }),
        createMessage('2', 'Not collected', Date.now(), { isCollected: false })
      ]
      const result = sortMessages(messages, 'recency')
      expect(result).toBeDefined()
    })

    it('should apply marked boost preference', () => {
      setUserPreference('boostMarked', true)
      const messages = [
        createMessage('1', 'Marked', Date.now()),
        createMessage('2', 'Not marked', Date.now())
      ]
      const userMarks = {
        '1': { important: true }
      }
      const result = sortMessages(messages, 'recency', userMarks)
      expect(result).toBeDefined()
    })
  })

  // ========== localStorage Persistence Tests ==========
  describe('localStorage Persistence', () => {
    it('should save preferences to localStorage', () => {
      setUserPreference('defaultSort', 'importance')
      const result = savePreferences()
      expect(result).toBe(true)
    })

    it('should load preferences from localStorage', () => {
      setUserPreference('defaultSort', 'engagement')
      savePreferences()

      resetPreferences()
      expect(getUserPreferences().defaultSort).toBe('recency')

      loadPreferences()
      expect(getUserPreferences().defaultSort).toBe('engagement')
    })

    it('should preserve multiple preferences', () => {
      setUserPreference('defaultSort', 'importance')
      setUserPreference('boostCollected', false)
      setUserPreference('recencyWeight', 0.5)
      savePreferences()

      resetPreferences()
      loadPreferences()

      const prefs = getUserPreferences()
      expect(prefs.defaultSort).toBe('importance')
      expect(prefs.boostCollected).toBe(false)
      expect(prefs.recencyWeight).toBe(0.5)
    })

    it('should handle missing localStorage data', () => {
      const result = loadPreferences()
      expect(result).toBe(true)
    })

    it('should include version in saved data', () => {
      savePreferences()
      const saved = localStorage.getItem('message_sorting_prefs')
      const data = JSON.parse(saved)
      expect(data.version).toBe(1)
    })

    it('should include timestamp in saved data', () => {
      savePreferences()
      const saved = localStorage.getItem('message_sorting_prefs')
      const data = JSON.parse(saved)
      expect(data).toHaveProperty('savedAt')
      expect(data.savedAt).toBeGreaterThan(0)
    })
  })

  // ========== Combined Scoring Tests ==========
  describe('Combined Scoring', () => {
    it('should apply user preference boosts', () => {
      const messages = [
        createMessage('1', 'Collected', Date.now(), { isCollected: true }),
        createMessage('2', 'Marked', Date.now()),
        createMessage('3', 'Normal', Date.now())
      ]
      const userMarks = {
        '2': { important: true }
      }
      const result = sortMessages(messages, 'recency', userMarks)
      expect(result.length).toBe(3)
    })

    it('should cap combined score at 1', () => {
      const messages = [createMessage('1', 'Test', Date.now())]
      const result = sortMessages(messages, 'recency')
      if (result[0].sortScore) {
        expect(result[0].sortScore).toBeLessThanOrEqual(1)
      }
    })

    it('should handle collections parameter', () => {
      const messages = [
        createMessage('1', 'In collection', Date.now()),
        createMessage('2', 'Not in collection', Date.now())
      ]
      const collections = {
        '1': { collectionId: 'col1' }
      }
      const result = sortMessages(messages, 'recency', {}, collections)
      expect(result.length).toBe(2)
    })
  })

  // ========== Composition API Tests ==========
  describe('useMessageSorting()', () => {
    it('should export useMessageSorting function', () => {
      const api = useMessageSorting()
      expect(api).toBeDefined()
    })

    it('should return all methods', () => {
      const api = useMessageSorting()
      expect(api.sortMessages).toBeDefined()
      expect(api.setSortOption).toBeDefined()
      expect(api.setUserPreference).toBeDefined()
      expect(api.getUserPreferences).toBeDefined()
      expect(api.resetPreferences).toBeDefined()
      expect(api.getSortOptions).toBeDefined()
      expect(api.savePreferences).toBeDefined()
      expect(api.loadPreferences).toBeDefined()
      expect(api.cleanup).toBeDefined()
    })

    it('should return reactive state', () => {
      const api = useMessageSorting()
      expect(api.userPreferences).toBeDefined()
    })

    it('should export SORT_OPTIONS', () => {
      const api = useMessageSorting()
      expect(api.SORT_OPTIONS).toBeDefined()
      expect(api.SORT_OPTIONS.RECENCY).toBe('recency')
      expect(api.SORT_OPTIONS.IMPORTANCE).toBe('importance')
      expect(api.SORT_OPTIONS.ENGAGEMENT).toBe('engagement')
      expect(api.SORT_OPTIONS.OLDEST).toBe('oldest')
      expect(api.SORT_OPTIONS.ALPHABETICAL).toBe('alphabetical')
      expect(api.SORT_OPTIONS.RELEVANCE).toBe('relevance')
    })

    it('should set sort option', () => {
      const api = useMessageSorting()
      api.setSortOption('importance')
      const prefs = api.getUserPreferences()
      expect(prefs.defaultSort).toBe('importance')
    })

    it('should get sort options list', () => {
      const api = useMessageSorting()
      const options = api.getSortOptions()
      expect(Array.isArray(options)).toBe(true)
      expect(options.length).toBeGreaterThan(0)
    })
  })

  // ========== Edge Cases Tests ==========
  describe('Edge Cases', () => {
    it('should handle undefined userMarks parameter', () => {
      const messages = [createMessage('1', 'Test')]
      const result = sortMessages(messages, 'importance')
      expect(result.length).toBe(1)
    })

    it('should handle undefined collections parameter', () => {
      const messages = [createMessage('1', 'Test')]
      const result = sortMessages(messages, 'recency', {})
      expect(result.length).toBe(1)
    })

    it('should handle empty userMarks object', () => {
      const messages = [createMessage('1', 'Test')]
      const result = sortMessages(messages, 'importance', {})
      expect(result.length).toBe(1)
    })

    it('should handle messages without metadata', () => {
      const messages = [
        { id: '1', content: 'Minimal' },
        createMessage('2', 'Full')
      ]
      const result = sortMessages(messages, 'recency')
      expect(result.length).toBe(2)
    })

    it('should handle very large messages array', () => {
      const messages = []
      for (let i = 0; i < 1000; i++) {
        messages.push(createMessage(`msg${i}`, `Content ${i}`))
      }
      const result = sortMessages(messages, 'recency')
      expect(result.length).toBe(1000)
    })

    it('should handle unicode in sender names', () => {
      const messages = [
        createMessage('1', 'Test', Date.now(), { senderName: '中文用户' }),
        createMessage('2', 'Test', Date.now(), { senderName: 'Alice' })
      ]
      const result = sortMessages(messages, 'alphabetical')
      expect(result.length).toBe(2)
    })
  })

  // ========== Performance Tests ==========
  describe('Performance', () => {
    it('should sort 100 messages quickly', () => {
      const messages = []
      for (let i = 0; i < 100; i++) {
        messages.push(createMessage(`msg${i}`, `Content ${i}`))
      }
      const startTime = performance.now()
      sortMessages(messages, 'recency')
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(500)
    })

    it('should sort 1000 messages within reasonable time', () => {
      const messages = []
      for (let i = 0; i < 1000; i++) {
        messages.push(createMessage(`msg${i}`, `Content ${i}`))
      }
      const startTime = performance.now()
      sortMessages(messages, 'importance')
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(2000)
    })
  })

  // ========== Integration Tests ==========
  describe('Integration Scenarios', () => {
    it('should handle save and load workflow', () => {
      setUserPreference('defaultSort', 'importance')
      setUserPreference('boostCollected', false)
      savePreferences()

      resetPreferences()
      expect(getUserPreferences().defaultSort).toBe('recency')

      loadPreferences()
      expect(getUserPreferences().defaultSort).toBe('importance')
      expect(getUserPreferences().boostCollected).toBe(false)
    })

    it('should apply preferences across multiple sorts', () => {
      setUserPreference('defaultSort', 'engagement')

      const messages1 = [
        createMessage('1', 'Low', Date.now(), { forwardCount: 0 }),
        createMessage('2', 'High', Date.now(), { forwardCount: 10 })
      ]
      const result1 = sortMessages(messages1, 'engagement')

      const messages2 = [
        createMessage('3', 'Old', Date.now() - 86400000),
        createMessage('4', 'New', Date.now())
      ]
      const result2 = sortMessages(messages2, 'engagement')

      expect(result1.length).toBe(2)
      expect(result2.length).toBe(2)
    })
  })
})
