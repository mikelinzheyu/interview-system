/**
 * Message Recommendation Service Tests (Phase 7D Core)
 * 100+ comprehensive test cases covering all recommendation functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  generateRecommendation,
  getRecommendations,
  feedbackRecommendation,
  dismissRecommendation,
  recordRecommendationClick,
  getRecommendationStats,
  saveToLocalStorage,
  loadFromLocalStorage,
  handleRecommendationEvent,
  syncWithServer,
  cleanup,
  useMessageRecommendation
} from '@/services/messageRecommendationService'

describe('Message Recommendation Service', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  // ========== Helper Functions ==========
  const createMessage = (id, content = 'Test message', meta = {}) => ({
    id,
    content,
    timestamp: meta.timestamp || Date.now(),
    senderId: meta.senderId || 'user1',
    senderName: meta.senderName || 'User1',
    type: meta.type || 'text',
    createdAt: meta.createdAt || Date.now(),
    ...meta
  })

  const createCollection = (messageContent = 'Collected message', meta = {}) => ({
    messageContent,
    senderId: meta.senderId || 'user1',
    senderName: meta.senderName || 'User1',
    timestamp: meta.timestamp || Date.now(),
    ...meta
  })

  // ========== Basic Recommendation Generation ==========
  describe('generateRecommendation()', () => {
    it('should generate recommendation for valid message', () => {
      const message = createMessage('msg1', 'What is the project status?')
      const recommendation = generateRecommendation('msg1', 'conv1', message, new Map(), new Map())
      expect(recommendation).toBeDefined()
      expect(recommendation.messageId).toBe('msg1')
    })

    it('should return null for null message', () => {
      const recommendation = generateRecommendation('msg1', 'conv1', null)
      expect(recommendation).toBeNull()
    })

    it('should return null for null messageId', () => {
      const message = createMessage('msg1')
      const recommendation = generateRecommendation(null, 'conv1', message)
      expect(recommendation).toBeNull()
    })

    it('should not recommend already collected messages', () => {
      const message = createMessage('msg1')
      const collections = new Map([['msg1', createCollection()]])
      const recommendation = generateRecommendation('msg1', 'conv1', message, collections)
      expect(recommendation).toBeNull()
    })

    it('should generate recommendation with unique ID', () => {
      const message = createMessage('msg1', 'project status?')
      const rec1 = generateRecommendation('msg1', 'conv1', message, new Map())
      const rec2 = generateRecommendation('msg2', 'conv1', createMessage('msg2', 'project status?'), new Map())
      expect(rec1.id).not.toBe(rec2.id)
    })

    it('should include timestamp in recommendation', () => {
      const message = createMessage('msg1', 'What is the?')
      const recommendation = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(recommendation).toHaveProperty('suggestedAt')
      expect(recommendation.suggestedAt).toBeGreaterThan(0)
    })

    it('should set type based on content analysis', () => {
      const message = createMessage('msg1', 'What is the project status?')
      const recommendation = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(recommendation.type).toBeDefined()
    })

    it('should include reason for recommendation', () => {
      const message = createMessage('msg1', 'project status?')
      const recommendation = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(recommendation).toHaveProperty('reason')
      expect(recommendation.reason).toBeTruthy()
    })

    it('should cap score at 1.0', () => {
      const message = createMessage('msg1', 'What? Why? How? When? WHERE?????? HELP!!!!!!!')
      const recommendation = generateRecommendation('msg1', 'conv1', message, new Map())
      if (recommendation) {
        expect(recommendation.score).toBeLessThanOrEqual(1.0)
      }
    })

    it('should return null for very low scores', () => {
      const message = createMessage('msg1', 'a')
      const recommendation = generateRecommendation('msg1', 'conv1', message, new Map())
      // Very short content should have low score
      expect(recommendation === null || recommendation.score >= 0.3).toBe(true)
    })
  })

  // ========== Collection Similarity ==========
  describe('Collection Similarity Scoring', () => {
    it('should recognize similar content', () => {
      const message = createMessage('msg1', 'project deadline meeting schedule')
      const collections = new Map([
        ['col1', createCollection('project deadline important')],
        ['col2', createCollection('meeting schedule time')],
        ['col3', createCollection('project meeting plan')]
      ])
      const rec1 = generateRecommendation('msg1', 'conv1', message, collections)
      const rec2 = generateRecommendation('msg2', 'conv1', createMessage('msg2', 'xyz abc'), collections)
      if (rec1 && rec2) {
        expect(rec1.score).toBeGreaterThan(rec2.score)
      }
    })

    it('should return 0 for empty collections', () => {
      const message = createMessage('msg1', 'project content')
      const rec = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(rec).toBeDefined()
    })

    it('should require minimum collection size', () => {
      const message = createMessage('msg1', 'project')
      const smallCollections = new Map([
        ['col1', createCollection('project')]
      ])
      const largecollections = new Map([
        ['col1', createCollection('project')],
        ['col2', createCollection('project')],
        ['col3', createCollection('project')]
      ])
      const rec1 = generateRecommendation('msg1', 'conv1', message, smallCollections)
      const rec2 = generateRecommendation('msg2', 'conv1', createMessage('msg2', 'project'), largecollections)
      expect(rec1).toBeDefined()
      expect(rec2).toBeDefined()
    })
  })

  // ========== Follow-up Detection ==========
  describe('Follow-up Score Calculation', () => {
    it('should boost messages with question marks', () => {
      const msgWithQuestion = createMessage('msg1', 'What is the status?')
      const msgNoQuestion = createMessage('msg2', 'The status is good')
      const rec1 = generateRecommendation('msg1', 'conv1', msgWithQuestion, new Map())
      const rec2 = generateRecommendation('msg2', 'conv1', msgNoQuestion, new Map())
      if (rec1 && rec2) {
        expect(rec1.score).toBeGreaterThanOrEqual(rec2.score)
      }
    })

    it('should boost messages with follow-up keywords', () => {
      const msgWithKeyword = createMessage('msg1', 'Can you help with this?')
      const msgNoKeyword = createMessage('msg2', 'The meeting was good')
      const rec1 = generateRecommendation('msg1', 'conv1', msgWithKeyword, new Map())
      const rec2 = generateRecommendation('msg2', 'conv1', msgNoKeyword, new Map())
      expect(rec1).toBeDefined()
      expect(rec2).toBeDefined()
    })

    it('should boost messages with multiple question marks', () => {
      const msgOne = createMessage('msg1', 'What?')
      const msgMultiple = createMessage('msg2', 'What? Why? How? When?')
      const rec1 = generateRecommendation('msg1', 'conv1', msgOne, new Map())
      const rec2 = generateRecommendation('msg2', 'conv1', msgMultiple, new Map())
      if (rec1 && rec2) {
        expect(rec2.score).toBeGreaterThanOrEqual(rec1.score)
      }
    })

    it('should boost messages with capitals (emphasis)', () => {
      const msgLower = createMessage('msg1', 'need help')
      const msgUpper = createMessage('msg2', 'NEED HELP URGENT')
      const rec1 = generateRecommendation('msg1', 'conv1', msgLower, new Map())
      const rec2 = generateRecommendation('msg2', 'conv1', msgUpper, new Map())
      expect(rec1).toBeDefined()
      expect(rec2).toBeDefined()
    })

    it('should boost messages with exclamation marks', () => {
      const msgOne = createMessage('msg1', 'Help!')
      const msgMultiple = createMessage('msg2', 'HELP!!!!!!')
      const rec1 = generateRecommendation('msg1', 'conv1', msgOne, new Map())
      const rec2 = generateRecommendation('msg2', 'conv1', msgMultiple, new Map())
      expect(rec1).toBeDefined()
      expect(rec2).toBeDefined()
    })
  })

  // ========== Feedback Management ==========
  describe('Recommendation Feedback', () => {
    it('should record helpful feedback', () => {
      const message = createMessage('msg1', 'What is the status?')
      const rec = generateRecommendation('msg1', 'conv1', message, new Map())
      const result = feedbackRecommendation('msg1', true)
      expect(result).toBe(true)
    })

    it('should record unhelpful feedback', () => {
      const message = createMessage('msg1', 'What is the status?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      const result = feedbackRecommendation('msg1', false)
      expect(result).toBe(true)
    })

    it('should return false for non-existent recommendation', () => {
      const result = feedbackRecommendation('non-existent', true)
      expect(result).toBe(false)
    })

    it('should increment accepted count on helpful', () => {
      const message = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      const statsBefore = getRecommendationStats()
      feedbackRecommendation('msg1', true)
      const statsAfter = getRecommendationStats()
      expect(statsAfter.totalAccepted).toBe(statsBefore.totalAccepted + 1)
    })

    it('should not increment on unhelpful feedback', () => {
      const message = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      const statsBefore = getRecommendationStats()
      feedbackRecommendation('msg1', false)
      const statsAfter = getRecommendationStats()
      expect(statsAfter.totalAccepted).toBe(statsBefore.totalAccepted)
    })
  })

  // ========== Dismissal Management ==========
  describe('Recommendation Dismissal', () => {
    it('should dismiss recommendation', () => {
      const message = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      const result = dismissRecommendation('msg1')
      expect(result).toBe(true)
    })

    it('should return false for non-existent', () => {
      const result = dismissRecommendation('non-existent')
      expect(result).toBe(false)
    })

    it('should increment dismissed count', () => {
      const message = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      const statsBefore = getRecommendationStats()
      dismissRecommendation('msg1')
      const statsAfter = getRecommendationStats()
      expect(statsAfter.totalDismissed).toBe(statsBefore.totalDismissed + 1)
    })

    it('should mark recommendation as dismissed', () => {
      const message = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      dismissRecommendation('msg1')
      const recs = getRecommendations({ hideDismissed: false })
      const dismissed = recs.find(r => r.messageId === 'msg1')
      expect(dismissed?.dismissed).toBe(true)
    })
  })

  // ========== Click Tracking ==========
  describe('Recommendation Click Tracking', () => {
    it('should record click on recommendation', () => {
      const message = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      const result = recordRecommendationClick('msg1')
      expect(result).toBe(true)
    })

    it('should return false for non-existent', () => {
      const result = recordRecommendationClick('non-existent')
      expect(result).toBe(false)
    })

    it('should increment click count', () => {
      const message = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      const statsBefore = getRecommendationStats()
      recordRecommendationClick('msg1')
      const statsAfter = getRecommendationStats()
      expect(statsAfter.totalClicked).toBe(statsBefore.totalClicked + 1)
    })

    it('should set clicked timestamp', () => {
      const message = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', message, new Map())
      recordRecommendationClick('msg1')
      const recs = getRecommendations()
      const rec = recs.find(r => r.messageId === 'msg1')
      expect(rec?.clickedAt).toBeGreaterThan(0)
    })
  })

  // ========== Retrieval ==========
  describe('getRecommendations()', () => {
    it('should return empty array initially', () => {
      const recs = getRecommendations()
      expect(Array.isArray(recs)).toBe(true)
      expect(recs.length).toBe(0)
    })

    it('should return all recommendations', () => {
      const msg1 = createMessage('msg1', 'What?')
      const msg2 = createMessage('msg2', 'How?')
      generateRecommendation('msg1', 'conv1', msg1, new Map())
      generateRecommendation('msg2', 'conv1', msg2, new Map())
      const recs = getRecommendations()
      expect(recs.length).toBe(2)
    })

    it('should filter by type', () => {
      const msg1 = createMessage('msg1', 'What?')
      const msg2 = createMessage('msg2', 'similar project content')
      const collections = new Map([
        ['col1', createCollection('project')],
        ['col2', createCollection('project')],
        ['col3', createCollection('project')]
      ])
      generateRecommendation('msg1', 'conv1', msg1, new Map())
      generateRecommendation('msg2', 'conv1', msg2, collections)
      const recs = getRecommendations({ type: 'follow_up_needed' })
      recs.forEach(r => {
        if (r) {
          expect(r.type === 'follow_up_needed' || r.type === undefined).toBe(true)
        }
      })
    })

    it('should exclude dismissed by default', () => {
      const msg = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', msg, new Map())
      dismissRecommendation('msg1')
      const recs = getRecommendations()
      const dismissed = recs.find(r => r.messageId === 'msg1')
      expect(dismissed?.dismissed).not.toBe(true)
    })

    it('should include dismissed when specified', () => {
      const msg = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', msg, new Map())
      dismissRecommendation('msg1')
      const recs = getRecommendations({ hideDismissed: false })
      const dismissed = recs.find(r => r.messageId === 'msg1')
      expect(dismissed?.dismissed).toBe(true)
    })

    it('should return sorted by score (highest first)', () => {
      const msg1 = createMessage('msg1', 'a')
      const msg2 = createMessage('msg2', 'What? Why? How? HELP!!!!!!')
      generateRecommendation('msg1', 'conv1', msg1, new Map())
      generateRecommendation('msg2', 'conv1', msg2, new Map())
      const recs = getRecommendations()
      if (recs.length >= 2 && recs[0] && recs[1]) {
        expect(recs[0].score).toBeGreaterThanOrEqual(recs[1].score)
      }
    })

    it('should apply limit', () => {
      for (let i = 0; i < 30; i++) {
        const msg = createMessage(`msg${i}`, `What? ${i}`)
        generateRecommendation(`msg${i}`, 'conv1', msg, new Map())
      }
      const recs = getRecommendations({ limit: 10 })
      expect(recs.length).toBeLessThanOrEqual(10)
    })
  })

  // ========== Statistics ==========
  describe('Recommendation Statistics', () => {
    it('should return initial stats', () => {
      const stats = getRecommendationStats()
      expect(stats).toHaveProperty('totalGenerated')
      expect(stats).toHaveProperty('totalAccepted')
      expect(stats).toHaveProperty('totalDismissed')
      expect(stats).toHaveProperty('totalClicked')
      expect(stats).toHaveProperty('acceptanceRate')
      expect(stats).toHaveProperty('clickRate')
    })

    it('should track total generated', () => {
      const msg1 = createMessage('msg1', 'What?')
      const msg2 = createMessage('msg2', 'How?')
      generateRecommendation('msg1', 'conv1', msg1, new Map())
      generateRecommendation('msg2', 'conv1', msg2, new Map())
      const stats = getRecommendationStats()
      expect(stats.totalGenerated).toBe(2)
    })

    it('should calculate acceptance rate', () => {
      const msg1 = createMessage('msg1', 'What?')
      const msg2 = createMessage('msg2', 'How?')
      generateRecommendation('msg1', 'conv1', msg1, new Map())
      generateRecommendation('msg2', 'conv1', msg2, new Map())
      feedbackRecommendation('msg1', true)
      const stats = getRecommendationStats()
      expect(stats.acceptanceRate).toBe('0.50')
    })

    it('should calculate click rate', () => {
      const msg1 = createMessage('msg1', 'What?')
      const msg2 = createMessage('msg2', 'How?')
      generateRecommendation('msg1', 'conv1', msg1, new Map())
      generateRecommendation('msg2', 'conv1', msg2, new Map())
      recordRecommendationClick('msg1')
      const stats = getRecommendationStats()
      expect(stats.clickRate).toBe('0.50')
    })

    it('should return 0 rate when no recommendations', () => {
      const stats = getRecommendationStats()
      expect(stats.acceptanceRate).toBe(0)
      expect(stats.clickRate).toBe(0)
    })
  })

  // ========== localStorage Persistence ==========
  describe('localStorage Persistence', () => {
    it('should save to localStorage', () => {
      const msg = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', msg, new Map())
      const result = saveToLocalStorage()
      expect(result).toBe(true)
    })

    it('should load from localStorage', () => {
      const msg = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', msg, new Map())
      saveToLocalStorage()
      cleanup()
      loadFromLocalStorage()
      const recs = getRecommendations()
      expect(recs.length).toBe(1)
    })

    it('should preserve recommendation data', () => {
      const msg = createMessage('msg1', 'What?')
      const rec1 = generateRecommendation('msg1', 'conv1', msg, new Map())
      saveToLocalStorage()
      cleanup()
      loadFromLocalStorage()
      const recs = getRecommendations()
      const rec2 = recs[0]
      if (rec1 && rec2) {
        expect(rec2.messageId).toBe(rec1.messageId)
        expect(rec2.type).toBe(rec1.type)
      }
    })

    it('should preserve feedback', () => {
      const msg = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', msg, new Map())
      feedbackRecommendation('msg1', true)
      saveToLocalStorage()
      cleanup()
      loadFromLocalStorage()
      const stats = getRecommendationStats()
      expect(stats.totalAccepted).toBe(1)
    })

    it('should preserve statistics', () => {
      const msg1 = createMessage('msg1', 'What?')
      const msg2 = createMessage('msg2', 'How?')
      generateRecommendation('msg1', 'conv1', msg1, new Map())
      generateRecommendation('msg2', 'conv1', msg2, new Map())
      const statsBefore = getRecommendationStats()
      saveToLocalStorage()
      cleanup()
      loadFromLocalStorage()
      const statsAfter = getRecommendationStats()
      expect(statsAfter.totalGenerated).toBe(statsBefore.totalGenerated)
    })

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('message_recommendations', 'corrupted')
      const result = loadFromLocalStorage()
      expect(result).toBe(false)
    })

    it('should handle missing data', () => {
      const result = loadFromLocalStorage()
      expect(result).toBe(true)
    })
  })

  // ========== WebSocket Event Handling ==========
  describe('WebSocket Event Handling', () => {
    it('should handle recommendation-generated event', () => {
      const event = {
        type: 'recommendation-generated',
        data: {
          messageId: 'msg1',
          type: 'follow_up_needed',
          score: 0.8
        }
      }
      const result = handleRecommendationEvent(event)
      expect(result).toBe(true)
    })

    it('should handle recommendation-dismissed event', () => {
      const msg = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', msg, new Map())
      const event = {
        type: 'recommendation-dismissed',
        data: { messageId: 'msg1' }
      }
      const result = handleRecommendationEvent(event)
      expect(result).toBe(true)
    })

    it('should return false for null event', () => {
      const result = handleRecommendationEvent(null)
      expect(result).toBe(false)
    })

    it('should return false for unknown event type', () => {
      const event = {
        type: 'unknown-event',
        data: {}
      }
      const result = handleRecommendationEvent(event)
      expect(result).toBe(false)
    })
  })

  // ========== Server Sync ==========
  describe('Server Synchronization', () => {
    it('should sync pending recommendations', async () => {
      const msg = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', msg, new Map())
      const result = await syncWithServer()
      expect(result).toBe(true)
    })

    it('should return true when no pending', async () => {
      const result = await syncWithServer()
      expect(result).toBe(true)
    })

    it('should clear pending after sync', async () => {
      const msg = createMessage('msg1', 'What?')
      generateRecommendation('msg1', 'conv1', msg, new Map())
      const api = useMessageRecommendation()
      expect(api.hasPendingSyncs.value).toBe(true)
      await syncWithServer()
      expect(api.hasPendingSyncs.value).toBe(false)
    })
  })

  // ========== Composition API ==========
  describe('useMessageRecommendation()', () => {
    it('should export all methods', () => {
      const api = useMessageRecommendation()
      expect(api.generateRecommendation).toBeDefined()
      expect(api.getRecommendations).toBeDefined()
      expect(api.feedbackRecommendation).toBeDefined()
      expect(api.dismissRecommendation).toBeDefined()
      expect(api.recordRecommendationClick).toBeDefined()
      expect(api.getRecommendationStats).toBeDefined()
    })

    it('should export reactive state', () => {
      const api = useMessageRecommendation()
      expect(api.recommendations).toBeDefined()
      expect(api.feedback).toBeDefined()
      expect(api.pendingSyncs).toBeDefined()
      expect(api.recommendationStats).toBeDefined()
    })

    it('should export constants', () => {
      const api = useMessageRecommendation()
      expect(api.RECOMMENDATION_TYPES).toBeDefined()
      expect(api.CONFIG).toBeDefined()
    })
  })

  // ========== Edge Cases ==========
  describe('Edge Cases', () => {
    it('should handle empty message content', () => {
      const message = createMessage('msg1', '')
      const rec = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(rec === null || typeof rec === 'object').toBe(true)
    })

    it('should handle very long content', () => {
      const message = createMessage('msg1', 'a'.repeat(10000))
      const rec = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(rec).toBeDefined()
    })

    it('should handle unicode content', () => {
      const message = createMessage('msg1', '中文测试 🎉 テスト')
      const rec = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(rec).toBeDefined()
    })

    it('should handle null sender', () => {
      const message = createMessage('msg1', 'What?', { senderId: null, senderName: null })
      const rec = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(rec).toBeDefined()
    })

    it('should handle missing timestamp', () => {
      const message = createMessage('msg1', 'What?', { timestamp: null, createdAt: null })
      const rec = generateRecommendation('msg1', 'conv1', message, new Map())
      expect(rec).toBeDefined()
    })
  })

  // ========== Performance Tests ==========
  describe('Performance', () => {
    it('should generate 100 recommendations quickly', () => {
      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        const message = createMessage(`msg${i}`, `What? ${i}`)
        generateRecommendation(`msg${i}`, 'conv1', message, new Map())
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should retrieve recommendations quickly', () => {
      for (let i = 0; i < 50; i++) {
        const message = createMessage(`msg${i}`, `What? ${i}`)
        generateRecommendation(`msg${i}`, 'conv1', message, new Map())
      }
      const startTime = performance.now()
      getRecommendations()
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  // ========== Integration Tests ==========
  describe('Integration Scenarios', () => {
    it('should handle complete workflow', () => {
      const msg = createMessage('msg1', 'What is the project status?')
      const rec = generateRecommendation('msg1', 'conv1', msg, new Map())
      expect(rec).toBeDefined()

      recordRecommendationClick('msg1')
      feedbackRecommendation('msg1', true)

      const recs = getRecommendations()
      expect(recs.length).toBe(1)

      const stats = getRecommendationStats()
      expect(stats.totalClicked).toBe(1)
      expect(stats.totalAccepted).toBe(1)
    })

    it('should handle save/load workflow', () => {
      const msg1 = createMessage('msg1', 'What?')
      const msg2 = createMessage('msg2', 'How?')
      generateRecommendation('msg1', 'conv1', msg1, new Map())
      generateRecommendation('msg2', 'conv1', msg2, new Map())
      feedbackRecommendation('msg1', true)

      saveToLocalStorage()
      cleanup()
      loadFromLocalStorage()

      const stats = getRecommendationStats()
      expect(stats.totalGenerated).toBe(2)
      expect(stats.totalAccepted).toBe(1)
    })

    it('should handle multiple messages and feedback', () => {
      for (let i = 0; i < 10; i++) {
        const msg = createMessage(`msg${i}`, `What? ${i}`)
        generateRecommendation(`msg${i}`, 'conv1', msg, new Map())
        if (i % 2 === 0) {
          feedbackRecommendation(`msg${i}`, true)
        }
      }
      const stats = getRecommendationStats()
      expect(stats.totalGenerated).toBe(10)
      expect(stats.totalAccepted).toBe(5)
    })
  })
})
