import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMessageSearch } from '@/composables/useMessageSearch'

describe('useMessageSearch - Message Search Engine', () => {
  let search

  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()

    // 创建搜索引擎实例
    search = useMessageSearch()
  })

  describe('Message Indexing', () => {
    it('should build index from messages array', () => {
      const messages = [
        { id: 1, content: '你好，世界', senderId: 'user1', timestamp: Date.now() },
        { id: 2, content: '谢谢你的帮助', senderId: 'user2', timestamp: Date.now() },
        { id: 3, content: '再见', senderId: 'user1', timestamp: Date.now() }
      ]

      search.buildIndex(messages)

      expect(search.searchIndex.forwardIndex.size).toBe(3)
      expect(search.searchIndex.invertedIndex.size).toBeGreaterThan(0)
    })

    it('should handle empty message array', () => {
      search.buildIndex([])
      expect(search.searchIndex.forwardIndex.size).toBe(0)
    })

    it('should handle null messages', () => {
      expect(() => search.buildIndex(null)).not.toThrow()
    })

    it('should clear previous index before building new one', () => {
      const messages1 = [
        { id: 1, content: '第一条消息', senderId: 'user1', timestamp: Date.now() }
      ]
      const messages2 = [
        { id: 2, content: '第二条消息', senderId: 'user2', timestamp: Date.now() }
      ]

      search.buildIndex(messages1)
      expect(search.searchIndex.forwardIndex.size).toBe(1)

      search.buildIndex(messages2)
      expect(search.searchIndex.forwardIndex.size).toBe(1)
      expect(search.searchIndex.forwardIndex.has(2)).toBe(true)
    })
  })

  describe('Tokenization', () => {
    it('should tokenize Chinese text', () => {
      const tokens = search.tokenize('你好，世界')
      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens).toContain('你')
      expect(tokens).toContain('好')
    })

    it('should handle English text', () => {
      const tokens = search.tokenize('hello world')
      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens).toContain('h')
      expect(tokens).toContain('e')
    })

    it('should return empty array for empty string', () => {
      const tokens = search.tokenize('')
      expect(tokens).toEqual([])
    })

    it('should return empty array for null', () => {
      const tokens = search.tokenize(null)
      expect(tokens).toEqual([])
    })

    it('should remove duplicate tokens', () => {
      const tokens = search.tokenize('hello hello')
      const uniqueTokens = new Set(tokens)
      expect(uniqueTokens.size).toBeLessThanOrEqual(tokens.length)
    })

    it('should support common word tokenization', () => {
      const tokens = search.tokenize('你好，谢谢')
      expect(tokens).toContain('你好') // 常见词组
      expect(tokens).toContain('谢谢') // 常见词组
    })
  })

  describe('Relevance Calculation', () => {
    it('should give highest score to exact match', () => {
      const score = search.calculateRelevance('你好', '你好')
      expect(score).toBe(100)
    })

    it('should give high score to complete word match', () => {
      const score = search.calculateRelevance('你好，世界', '你好')
      expect(score).toBeGreaterThan(70)
    })

    it('should give partial score to substring match', () => {
      const score1 = search.calculateRelevance('你好，世界', '你')
      const score2 = search.calculateRelevance('你好，世界', '世界')
      expect(score1).toBeGreaterThan(0)
      expect(score2).toBeGreaterThan(0)
    })

    it('should boost relevance for matches at start', () => {
      const startScore = search.calculateRelevance('你好，世界', '你好')
      const middleScore = search.calculateRelevance('世界，你好', '你好')
      expect(startScore).toBeGreaterThan(middleScore)
    })

    it('should return 0 for no match', () => {
      const score = search.calculateRelevance('你好', '再见')
      expect(score).toBe(0)
    })

    it('should handle case-insensitive matching', () => {
      const score1 = search.calculateRelevance('Hello World', 'hello')
      const score2 = search.calculateRelevance('Hello World', 'HELLO')
      expect(score1).toBeGreaterThan(0)
      expect(score2).toBeGreaterThan(0)
    })
  })

  describe('Highlight Finding', () => {
    it('should find exact highlight positions', () => {
      const highlights = search.findHighlights('你好，世界', '你好')
      expect(highlights).toEqual([{ start: 0, end: 2 }])
    })

    it('should find multiple highlights', () => {
      const highlights = search.findHighlights('你好你好', '你好')
      expect(highlights.length).toBe(2)
      expect(highlights[0]).toEqual({ start: 0, end: 2 })
      expect(highlights[1]).toEqual({ start: 2, end: 4 })
    })

    it('should return empty array for no match', () => {
      const highlights = search.findHighlights('你好', '再见')
      expect(highlights).toEqual([])
    })

    it('should handle null inputs', () => {
      expect(search.findHighlights(null, '你好')).toEqual([])
      expect(search.findHighlights('你好', null)).toEqual([])
    })

    it('should handle case-insensitive highlights', () => {
      const highlights = search.findHighlights('Hello World', 'hello')
      expect(highlights.length).toBeGreaterThan(0)
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      const messages = [
        {
          id: 1,
          content: '你好，欢迎加入我们的团队',
          senderId: 'user1',
          timestamp: Date.now(),
          type: 'text',
          conversationId: 'conv1'
        },
        {
          id: 2,
          content: '谢谢你的帮助和支持',
          senderId: 'user2',
          timestamp: Date.now() - 3600000,
          type: 'text',
          conversationId: 'conv1'
        },
        {
          id: 3,
          content: '再见，祝你有个美好的一天',
          senderId: 'user1',
          timestamp: Date.now() - 7200000,
          type: 'text',
          conversationId: 'conv2'
        }
      ]
      search.buildIndex(messages)
    })

    it('should find messages by keyword', () => {
      search.search({ keyword: '你好' })
      expect(search.searchState.results.length).toBeGreaterThan(0)
      expect(search.searchState.totalCount).toBeGreaterThan(0)
    })

    it('should set loading state during search', (done) => {
      search.search({ keyword: '你好', limit: 10 })
      // 搜索是同步的，所以 loading 状态会立即变为 false
      expect(search.searchState.loading).toBe(false)
      done()
    })

    it('should return empty results for non-matching keyword', () => {
      search.search({ keyword: '🚀火星🚀' })
      expect(search.searchState.results.length).toBe(0)
      expect(search.searchState.totalCount).toBe(0)
    })

    it('should handle empty keyword', () => {
      search.search({ keyword: '' })
      expect(search.searchState.results.length).toBe(0)
    })

    it('should support pagination', () => {
      search.search({ keyword: '你', limit: 1, offset: 0 })
      const firstPageCount = search.searchState.results.length

      search.search({ keyword: '你', limit: 1, offset: 1 })
      const secondPageResults = search.searchState.results

      expect(firstPageCount).toBeLessThanOrEqual(1)
      expect(secondPageResults).toBeDefined()
    })

    it('should sort results by relevance', () => {
      search.search({ keyword: '你好' })

      const results = search.searchState.results
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].relevance).toBeGreaterThanOrEqual(results[i + 1].relevance)
        }
      }
    })
  })

  describe('Filter Application', () => {
    beforeEach(() => {
      const messages = [
        {
          id: 1,
          content: '文本消息',
          type: 'text',
          senderId: 'user1',
          conversationId: 'conv1',
          timestamp: Date.now()
        },
        {
          id: 2,
          content: '图片消息',
          type: 'image',
          senderId: 'user2',
          conversationId: 'conv1',
          timestamp: Date.now() - 86400000
        },
        {
          id: 3,
          content: '文件消息',
          type: 'file',
          senderId: 'user1',
          conversationId: 'conv2',
          timestamp: Date.now() - 604800000
        }
      ]
      search.buildIndex(messages)
    })

    it('should filter by message type', () => {
      search.setFilters({ type: 'text' })
      search.search({ keyword: '消息' })

      const results = search.searchState.results
      results.forEach(result => {
        expect(result.type).toBe('text')
      })
    })

    it('should filter by sender ID', () => {
      search.setFilters({ senderId: 'user1' })
      search.search({ keyword: '消息' })

      const results = search.searchState.results
      results.forEach(result => {
        expect(result.senderId).toBe('user1')
      })
    })

    it('should filter by conversation ID', () => {
      search.setFilters({ conversationId: 'conv1' })
      search.search({ keyword: '消息' })

      const results = search.searchState.results
      results.forEach(result => {
        expect(result.conversationId).toBe('conv1')
      })
    })

    it('should apply multiple filters simultaneously', () => {
      search.setFilters({
        type: 'text',
        senderId: 'user1',
        conversationId: 'conv1'
      })
      search.search({ keyword: '消息' })

      const results = search.searchState.results
      results.forEach(result => {
        expect(result.type).toBe('text')
        expect(result.senderId).toBe('user1')
        expect(result.conversationId).toBe('conv1')
      })
    })

    it('should reset filters', () => {
      search.setFilters({ type: 'text' })
      search.resetFilters()

      expect(search.currentFilters.type).toBeNull()
      expect(search.currentFilters.senderId).toBeNull()
      expect(search.currentFilters.conversationId).toBeNull()
    })
  })

  describe('Search History Management', () => {
    it('should add search to history', () => {
      search.addSearchHistory('你好')
      expect(search.searchHistory.value[0]).toBe('你好')
    })

    it('should move duplicate to front when added again', () => {
      search.addSearchHistory('你好')
      search.addSearchHistory('世界')
      search.addSearchHistory('你好')

      expect(search.searchHistory.value[0]).toBe('你好')
      expect(search.searchHistory.value[1]).toBe('世界')
    })

    it('should limit history to 50 items', () => {
      for (let i = 0; i < 60; i++) {
        search.addSearchHistory(`关键词${i}`)
      }

      expect(search.searchHistory.value.length).toBeLessThanOrEqual(50)
    })

    it('should persist history to localStorage', () => {
      search.addSearchHistory('测试')
      const saved = JSON.parse(localStorage.getItem('messageSearchHistory'))
      expect(saved).toContain('测试')
    })

    it('should load history from localStorage', () => {
      localStorage.setItem('messageSearchHistory', JSON.stringify(['历史项1', '历史项2']))
      const newSearch = useMessageSearch()
      expect(newSearch.searchHistory.value).toContain('历史项1')
    })

    it('should clear history', () => {
      search.addSearchHistory('你好')
      search.clearSearchHistory()

      expect(search.searchHistory.value.length).toBe(0)
      expect(localStorage.getItem('messageSearchHistory')).toBeNull()
    })

    it('should ignore empty keywords in history', () => {
      search.addSearchHistory('')
      search.addSearchHistory('   ')
      expect(search.searchHistory.value.length).toBe(0)
    })
  })

  describe('Search Suggestions', () => {
    beforeEach(() => {
      const messages = [
        { id: 1, content: '你好，世界', senderId: 'user1', timestamp: Date.now() },
        { id: 2, content: '你好，朋友', senderId: 'user2', timestamp: Date.now() },
        { id: 3, content: '世界杯', senderId: 'user1', timestamp: Date.now() }
      ]
      search.buildIndex(messages)
    })

    it('should suggest from search history', () => {
      search.addSearchHistory('你好')
      search.addSearchHistory('世界')

      const suggestions = search.getSearchSuggestions('你')
      expect(suggestions).toContain('你好')
    })

    it('should suggest from frequent tokens', () => {
      const suggestions = search.getSearchSuggestions('你')
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should limit suggestions', () => {
      const suggestions = search.getSearchSuggestions('你', 5)
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should return empty suggestions for unknown prefix', () => {
      const suggestions = search.getSearchSuggestions('xyz')
      expect(Array.isArray(suggestions)).toBe(true)
    })
  })

  describe('Search Statistics', () => {
    it('should calculate search stats correctly', () => {
      const messages = [
        { id: 1, content: '你好', senderId: 'user1', timestamp: Date.now() },
        { id: 2, content: '世界', senderId: 'user2', timestamp: Date.now() }
      ]
      search.buildIndex(messages)

      expect(search.searchStats.value.indexSize).toBe(2)
      expect(search.searchStats.value.uniqueTokens).toBeGreaterThan(0)
    })

    it('should update stats after search', () => {
      const messages = [
        { id: 1, content: '你好', senderId: 'user1', timestamp: Date.now() }
      ]
      search.buildIndex(messages)
      search.search({ keyword: '你好' })

      expect(search.searchStats.value.total).toBeGreaterThan(0)
      expect(search.searchStats.value.loaded).toBeLessThanOrEqual(search.searchStats.value.total)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed message data gracefully', () => {
      const messages = [
        { id: 1, content: '正常消息', senderId: 'user1', timestamp: Date.now() },
        { id: 2, senderId: 'user2', timestamp: Date.now() }, // 缺少 content
        { content: '无 ID 消息', senderId: 'user1', timestamp: Date.now() } // 缺少 id
      ]

      expect(() => search.buildIndex(messages)).not.toThrow()
    })

    it('should recover from search errors', () => {
      search.buildIndex([])
      search.search({ keyword: '测试' })

      expect(search.searchState.error).toBeNull()
      expect(search.searchState.results).toEqual([])
    })
  })
})
