/**
 * Advanced Message Search Engine (Phase 7D Advanced)
 * 提供高级全文搜索、相关性排序和智能查询功能
 *
 * 功能:
 * - TF-IDF 相关性排序
 * - 多个搜索面向 (facets)
 * - 搜索历史和建议
 * - 自然语言查询解析
 * - 查询优化和缓存
 */

import { reactive, computed, ref } from 'vue'

// 搜索配置
const CONFIG = {
  MAX_RESULTS: 100,
  MAX_HISTORY: 20,
  CACHE_SIZE: 50,
  MIN_QUERY_LENGTH: 1,
  SEARCH_TIMEOUT: 5000
}

// 搜索数据
const searchResults = reactive([])
const searchHistory = reactive([])
const searchCache = reactive(new Map())
const savedQueries = reactive([])

/**
 * 执行高级搜索
 * @param {string} query - 搜索查询
 * @param {object} options - 搜索选项
 * @returns {object} 搜索结果
 */
export function advancedSearch(query, options = {}) {
  if (!query || query.trim().length < CONFIG.MIN_QUERY_LENGTH) {
    return { results: [], total: 0, facets: {} }
  }

  // 检查缓存
  const cacheKey = `${query}:${JSON.stringify(options)}`
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)
  }

  // 解析查询
  const parsedQuery = parseQuery(query)

  // 执行搜索
  const results = performSearch(parsedQuery, options)

  // 计算相关性分数
  const rankedResults = rankByRelevance(results, parsedQuery)

  // 应用过滤器
  const facets = extractFacets(rankedResults)
  let filteredResults = rankedResults

  if (options.sender) {
    filteredResults = filteredResults.filter(r => r.senderId === options.sender)
  }
  if (options.type) {
    filteredResults = filteredResults.filter(r => r.type === options.type)
  }
  if (options.markType) {
    filteredResults = filteredResults.filter(r => r.marks && r.marks.includes(options.markType))
  }
  if (options.isCollected !== undefined) {
    filteredResults = filteredResults.filter(r => r.isCollected === options.isCollected)
  }

  // 应用排序
  if (options.sortBy === 'recent') {
    filteredResults.sort((a, b) => b.timestamp - a.timestamp)
  } else if (options.sortBy === 'oldest') {
    filteredResults.sort((a, b) => a.timestamp - b.timestamp)
  }

  // 应用分页
  const page = options.page || 1
  const pageSize = options.pageSize || 20
  const start = (page - 1) * pageSize
  const paginatedResults = filteredResults.slice(start, start + pageSize)

  const result = {
    query: parsedQuery,
    results: paginatedResults,
    total: filteredResults.length,
    page,
    pageSize,
    facets,
    executionTime: 0  // 实际应用中计算
  }

  // 缓存结果
  if (searchCache.size >= CONFIG.CACHE_SIZE) {
    const firstKey = searchCache.keys().next().value
    searchCache.delete(firstKey)
  }
  searchCache.set(cacheKey, result)

  // 添加到历史
  addToHistory(query)

  return result
}

/**
 * 解析查询字符串
 * @private
 */
function parseQuery(queryString) {
  const query = {
    text: queryString.trim(),
    keywords: [],
    phrases: [],
    operators: {},
    isNatural: false
  }

  // 提取精确短语 ("...")
  const phraseMatches = queryString.match(/"([^"]*)"/g)
  if (phraseMatches) {
    query.phrases = phraseMatches.map(p => p.slice(1, -1))
    queryString = queryString.replace(/"([^"]*)"/g, '')
  }

  // 提取操作符 (from:, type:, before:, after:)
  const operatorRegex = /(\w+):(\w+)/g
  let match
  while ((match = operatorRegex.exec(queryString)) !== null) {
    query.operators[match[1]] = match[2]
  }
  queryString = queryString.replace(/\w+:\w+/g, '')

  // 提取关键词
  query.keywords = queryString
    .split(/\s+/)
    .filter(k => k.length > 0)
    .slice(0, 20)  // 限制关键词数

  // 检测自然语言查询
  query.isNatural = hasNaturalLanguagePatterns(queryString)

  return query
}

/**
 * 执行搜索 (模拟)
 * @private
 */
function performSearch(parsedQuery, options) {
  // 在实际应用中，这会搜索真实的消息数据库
  // 这里使用模拟数据来演示

  const mockMessages = generateMockMessages(100)
  const results = []

  mockMessages.forEach(msg => {
    let score = 0

    // 关键词匹配
    parsedQuery.keywords.forEach(keyword => {
      if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
        score += 0.1
      }
    })

    // 短语匹配
    parsedQuery.phrases.forEach(phrase => {
      if (msg.content.toLowerCase().includes(phrase.toLowerCase())) {
        score += 0.3
      }
    })

    // 操作符匹配
    if (parsedQuery.operators.from && msg.senderId === parsedQuery.operators.from) {
      score += 0.2
    }
    if (parsedQuery.operators.type && msg.type === parsedQuery.operators.type) {
      score += 0.15
    }

    if (score > 0) {
      results.push({
        ...msg,
        relevanceScore: score
      })
    }
  })

  return results
}

/**
 * 按相关性排序
 * @private
 */
function rankByRelevance(results, query) {
  return results
    .map(result => ({
      ...result,
      tfidfScore: calculateTFIDF(result.content, query.keywords),
      recencyScore: calculateRecency(result.timestamp),
      engagementScore: calculateEngagement(result),
      combinedScore: 0
    }))
    .map(result => ({
      ...result,
      combinedScore:
        result.tfidfScore * 0.5 +
        result.recencyScore * 0.2 +
        result.engagementScore * 0.2 +
        result.relevanceScore * 0.1
    }))
    .sort((a, b) => b.combinedScore - a.combinedScore)
}

/**
 * 计算 TF-IDF 分数
 * @private
 */
function calculateTFIDF(content, keywords) {
  if (keywords.length === 0) return 0

  const words = content.toLowerCase().split(/\s+/)
  let score = 0

  keywords.forEach(keyword => {
    const termFrequency = words.filter(w => w.includes(keyword.toLowerCase())).length / words.length
    const inverseDocFrequency = Math.log(100 / Math.max(1, words.filter(w => w.includes(keyword.toLowerCase())).length))
    score += termFrequency * inverseDocFrequency
  })

  return Math.min(1, score)
}

/**
 * 计算新鲜度分数
 * @private
 */
function calculateRecency(timestamp) {
  const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60)

  if (ageHours < 1) return 1
  if (ageHours < 24) return 0.8
  if (ageHours < 7 * 24) return 0.6
  if (ageHours < 30 * 24) return 0.4
  return 0.2
}

/**
 * 计算参与度分数
 * @private
 */
function calculateEngagement(message) {
  // 基于收藏、标记、转发等
  let score = 0

  if (message.isCollected) score += 0.3
  if (message.marks && message.marks.length > 0) score += 0.2
  if (message.forwardCount && message.forwardCount > 0) score += 0.2

  return Math.min(1, score)
}

/**
 * 提取搜索面向
 * @private
 */
function extractFacets(results) {
  const facets = {
    senders: {},
    types: {},
    markTypes: {},
    dateRanges: {}
  }

  results.forEach(result => {
    // 发送者分组
    if (result.senderId) {
      facets.senders[result.senderId] = (facets.senders[result.senderId] || 0) + 1
    }

    // 类型分组
    if (result.type) {
      facets.types[result.type] = (facets.types[result.type] || 0) + 1
    }

    // 标记类型分组
    if (result.marks) {
      result.marks.forEach(mark => {
        facets.markTypes[mark] = (facets.markTypes[mark] || 0) + 1
      })
    }

    // 日期范围分组
    const date = new Date(result.timestamp)
    const dateRange = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    facets.dateRanges[dateRange] = (facets.dateRanges[dateRange] || 0) + 1
  })

  return facets
}

/**
 * 检测自然语言查询
 * @private
 */
function hasNaturalLanguagePatterns(query) {
  const naturalPatterns = [
    /recent.*important/i,
    /from.*about/i,
    /messages.*containing/i,
    /show.*starred/i,
    /find.*about/i
  ]

  return naturalPatterns.some(pattern => pattern.test(query))
}

/**
 * 生成模拟消息（演示用）
 * @private
 */
function generateMockMessages(count) {
  const messages = []
  const keywords = ['会议', '项目', '代码', '设计', '测试', '文档']
  const senders = ['user1', 'user2', 'user3']
  const types = ['text', 'file', 'image']

  for (let i = 0; i < count; i++) {
    messages.push({
      id: `msg${i}`,
      content: `${keywords[i % keywords.length]} 相关的消息内容 ${i}`,
      senderId: senders[i % senders.length],
      senderName: `User ${i % 3 + 1}`,
      type: types[i % types.length],
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      isCollected: Math.random() > 0.7,
      marks: Math.random() > 0.5 ? ['important'] : [],
      forwardCount: Math.floor(Math.random() * 5)
    })
  }

  return messages
}

/**
 * 获取搜索建议
 */
export function getSearchSuggestions(partialQuery) {
  const suggestions = []

  // 来自历史的建议
  const historyMatches = searchHistory
    .filter(h => h.includes(partialQuery))
    .slice(0, 3)

  suggestions.push(...historyMatches)

  // 来自保存查询的建议
  const savedMatches = savedQueries
    .filter(q => q.query.includes(partialQuery))
    .map(q => q.query)
    .slice(0, 2)

  suggestions.push(...savedMatches)

  // 来自常见查询的建议
  const commonQueries = [
    '最近的消息',
    '重要的消息',
    '来自团队的消息',
    '代码片段',
    '我的待办事项'
  ]

  const commonMatches = commonQueries
    .filter(q => q.includes(partialQuery))
    .slice(0, 2)

  suggestions.push(...commonMatches)

  // 去重
  return [...new Set(suggestions)].slice(0, 10)
}

/**
 * 添加到搜索历史
 * @private
 */
function addToHistory(query) {
  if (!searchHistory.includes(query)) {
    searchHistory.unshift(query)
    if (searchHistory.length > CONFIG.MAX_HISTORY) {
      searchHistory.pop()
    }
  }
}

/**
 * 保存查询
 */
export function saveQuery(query, label) {
  const saved = {
    id: `saved_${Date.now()}`,
    query,
    label,
    createdAt: Date.now(),
    count: 0
  }

  savedQueries.push(saved)
  return saved
}

/**
 * 删除已保存的查询
 */
export function deleteQuery(queryId) {
  const index = savedQueries.findIndex(q => q.id === queryId)
  if (index > -1) {
    savedQueries.splice(index, 1)
    return true
  }
  return false
}

/**
 * 获取已保存的查询
 */
export function getSavedQueries() {
  return savedQueries.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * 清空缓存
 */
export function clearCache() {
  searchCache.clear()
  return true
}

/**
 * 清空历史
 */
export function clearHistory() {
  searchHistory.splice(0)
  return true
}

/**
 * 获取搜索统计
 */
export function getSearchStats() {
  return {
    historyCount: searchHistory.length,
    cacheSize: searchCache.size,
    savedQueriesCount: savedQueries.length,
    totalSearches: searchResults.length
  }
}

/**
 * 清理资源（供组件卸载时调用）
 */
export function cleanup() {
  try {
    // 清空结果、缓存与历史，释放内存引用
    searchResults.splice(0)
    clearCache()
    clearHistory()
    return true
  } catch (e) {
    // 保底不抛错，避免卸载阶段中断
    return false
  }
}

/**
 * 主 Composition API 导出
 */
export function useMessageSearchEngine() {
  return {
    // State
    searchHistory: computed(() => searchHistory),
    savedQueries: computed(() => savedQueries),
    cacheStats: computed(() => getSearchStats()),

    // Core methods
    advancedSearch,
    getSearchSuggestions,

    // Query management
    saveQuery,
    deleteQuery,
    getSavedQueries,

    // Cache management
    clearCache,
    clearHistory,

    // Analytics
    getSearchStats,

    // Lifecycle
    cleanup,

    // Constants
    CONFIG
  }
}
