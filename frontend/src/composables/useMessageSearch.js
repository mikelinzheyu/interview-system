import { ref, reactive, computed } from 'vue'

/**
 * 中文分词处理 - 简单的分词实现
 * 支持字符级和词级分词
 */
function tokenize(text) {
  if (!text) return []

  // 转换为小写以支持不区分大小写的搜索
  const normalized = text.toLowerCase()

  // 分词结果集合（去重）
  const tokens = new Set()

  // 1. 字符级分词 - 每个字符都作为一个token
  for (let i = 0; i < normalized.length; i++) {
    tokens.add(normalized[i])
  }

  // 2. 词级分词 - 常见词组
  const commonWords = ['你好', '谢谢', '再见', '对不起', '没有', '可以', '需要', '想要', '告诉', '知道']
  commonWords.forEach(word => {
    if (normalized.includes(word)) {
      tokens.add(word)
    }
  })

  // 3. 2-3字组合
  for (let i = 0; i < normalized.length - 1; i++) {
    tokens.add(normalized.substring(i, i + 2))
    if (i < normalized.length - 2) {
      tokens.add(normalized.substring(i, i + 3))
    }
  }

  return Array.from(tokens)
}

/**
 * 计算字符串匹配的相关性得分（TF-IDF算法）
 * @param {string} text - 消息内容
 * @param {string} keyword - 搜索关键词
 * @param {number} messageFreq - 该消息在结果中出现的频率
 * @param {number} totalMessages - 总消息数
 * @returns {number} 相关性得分
 */
function calculateRelevance(text, keyword, messageFreq = 1, totalMessages = 1) {
  if (!text || !keyword) return 0

  const normalized = text.toLowerCase()
  const searchKeyword = keyword.toLowerCase()

  // 1. 精确匹配得分最高 (100分)
  if (normalized === searchKeyword) return 100

  // 2. 完整单词匹配 (80分)
  if (normalized.includes(searchKeyword)) {
    const matchCount = (normalized.match(new RegExp(searchKeyword, 'g')) || []).length
    const score = 80 + Math.min(matchCount * 5, 20)
    return score
  }

  // 3. TF-IDF 计算
  const tokens = tokenize(searchKeyword)
  let tfScore = 0

  tokens.forEach(token => {
    const regex = new RegExp(token, 'g')
    const matches = normalized.match(regex) || []
    const tf = matches.length / text.length // 词频
    const idf = Math.log(totalMessages / (messageFreq || 1)) // 逆文档频率
    tfScore += tf * idf
  })

  // 4. 位置权重 - 关键词在开头有更高权重
  let positionBonus = 0
  if (normalized.startsWith(searchKeyword)) {
    positionBonus = 30
  } else if (normalized.indexOf(searchKeyword) !== -1) {
    positionBonus = 10
  }

  return Math.max(0, Math.min(100, (tfScore * 40 + positionBonus)))
}

/**
 * 查找文本中的高亮位置
 * @param {string} text - 原始文本
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 高亮位置数组 [{start, end}, ...]
 */
function findHighlights(text, keyword) {
  if (!text || !keyword) return []

  const highlights = []
  const searchKeyword = keyword.toLowerCase()
  const normalized = text.toLowerCase()

  let startIndex = 0
  while (true) {
    const index = normalized.indexOf(searchKeyword, startIndex)
    if (index === -1) break
    highlights.push({
      start: index,
      end: index + keyword.length
    })
    startIndex = index + 1
  }

  return highlights
}

/**
 * 消息搜索引擎 Composable
 * 支持全文搜索、过滤和排序
 */
export function useMessageSearch() {
  // 搜索索引数据结构
  const searchIndex = reactive({
    invertedIndex: new Map(), // 倒排索引：token -> Set<messageId>
    forwardIndex: new Map(),  // 正向索引：messageId -> message
    tokenIndex: new Map(),    // token索引
    senderIndex: new Map(),   // 发送者索引
    timeIndex: new Map()      // 时间索引
  })

  // 搜索状态
  const searchState = reactive({
    keyword: '',
    results: [],
    loading: false,
    error: null,
    totalCount: 0
  })

  // 搜索历史（localStorage）
  const searchHistory = ref([])

  // 当前应用的过滤器
  const currentFilters = reactive({
    type: null,        // 'text' | 'image' | 'file' | null
    timeRange: 'all',  // 'today', 'week', 'month', 'all'
    senderId: null,
    conversationId: null
  })

  /**
   * 构建消息索引
   * @param {Array} messages - 消息数组
   */
  function buildIndex(messages) {
    if (!messages || messages.length === 0) return

    // 清空现有索引
    searchIndex.invertedIndex.clear()
    searchIndex.forwardIndex.clear()
    searchIndex.senderIndex.clear()
    searchIndex.tokenIndex.clear()
    searchIndex.timeIndex.clear()

    messages.forEach(message => {
      // 添加到正向索引
      searchIndex.forwardIndex.set(message.id, message)

      // 分词并构建倒排索引
      const tokens = tokenize(message.content)
      tokens.forEach(token => {
        if (!searchIndex.invertedIndex.has(token)) {
          searchIndex.invertedIndex.set(token, new Set())
        }
        searchIndex.invertedIndex.get(token).add(message.id)

        // 更新token索引
        if (!searchIndex.tokenIndex.has(token)) {
          searchIndex.tokenIndex.set(token, {
            frequency: 0,
            messages: new Set()
          })
        }
        const tokenData = searchIndex.tokenIndex.get(token)
        tokenData.frequency += 1
        tokenData.messages.add(message.id)
      })

      // 发送者索引
      if (!searchIndex.senderIndex.has(message.senderId)) {
        searchIndex.senderIndex.set(message.senderId, new Set())
      }
      searchIndex.senderIndex.get(message.senderId).add(message.id)

      // 时间索引
      const timeKey = new Date(message.timestamp).toLocaleDateString()
      if (!searchIndex.timeIndex.has(timeKey)) {
        searchIndex.timeIndex.set(timeKey, new Set())
      }
      searchIndex.timeIndex.get(timeKey).add(message.id)
    })
  }

  /**
   * 应用时间范围过滤
   * @param {string} timeRange - 'today' | 'week' | 'month' | 'all'
   * @returns {Set<messageId>}
   */
  function getTimeRangeMessages(timeRange) {
    const now = new Date()
    let startDate

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        return new Set(searchIndex.forwardIndex.keys())
    }

    const result = new Set()
    searchIndex.forwardIndex.forEach((message, messageId) => {
      if (new Date(message.timestamp) >= startDate) {
        result.add(messageId)
      }
    })
    return result
  }

  /**
   * 应用多条件过滤
   * @param {Set<messageId>} messageIds - 候选消息ID集合
   * @returns {Set<messageId>} 过滤后的消息ID
   */
  function applyFilters(messageIds) {
    let filtered = new Set(messageIds)

    // 按类型过滤
    if (currentFilters.type) {
      const typeFiltered = new Set()
      filtered.forEach(messageId => {
        const message = searchIndex.forwardIndex.get(messageId)
        if (message && message.type === currentFilters.type) {
          typeFiltered.add(messageId)
        }
      })
      filtered = typeFiltered
    }

    // 按发送者过滤
    if (currentFilters.senderId) {
      const senderMessages = searchIndex.senderIndex.get(currentFilters.senderId) || new Set()
      filtered = new Set([...filtered].filter(id => senderMessages.has(id)))
    }

    // 按会话过滤
    if (currentFilters.conversationId) {
      const conversationFiltered = new Set()
      filtered.forEach(messageId => {
        const message = searchIndex.forwardIndex.get(messageId)
        if (message && message.conversationId === currentFilters.conversationId) {
          conversationFiltered.add(messageId)
        }
      })
      filtered = conversationFiltered
    }

    // 按时间范围过滤
    const timeMessages = getTimeRangeMessages(currentFilters.timeRange)
    filtered = new Set([...filtered].filter(id => timeMessages.has(id)))

    return filtered
  }

  /**
   * 执行搜索
   * @param {Object} options - 搜索选项
   *   - keyword: 搜索关键词
   *   - limit: 返回结果数量限制
   *   - offset: 分页偏移
   */
  function search(options = {}) {
    const { keyword = '', limit = 20, offset = 0 } = options

    searchState.loading = true
    searchState.error = null
    searchState.keyword = keyword

    try {
      if (!keyword.trim()) {
        searchState.results = []
        searchState.totalCount = 0
        searchState.loading = false
        return
      }

      // 1. 分词
      const tokens = tokenize(keyword)
      if (tokens.length === 0) {
        searchState.results = []
        searchState.totalCount = 0
        searchState.loading = false
        return
      }

      // 2. 查询倒排索引，找到匹配的消息ID
      let matchedIds = null
      tokens.forEach(token => {
        const tokenMessages = searchIndex.invertedIndex.get(token) || new Set()
        if (matchedIds === null) {
          matchedIds = new Set(tokenMessages)
        } else {
          // 取交集（AND）或并集（OR）
          // 这里使用并集（OR），也可以改为交集（AND）
          matchedIds = new Set([...matchedIds, ...tokenMessages])
        }
      })

      if (!matchedIds || matchedIds.size === 0) {
        searchState.results = []
        searchState.totalCount = 0
        searchState.loading = false
        return
      }

      // 3. 应用过滤器
      const filtered = applyFilters(matchedIds)

      // 4. 获取消息对象并计算相关性
      const resultMessages = Array.from(filtered)
        .map(messageId => ({
          ...searchIndex.forwardIndex.get(messageId),
          id: messageId,
          relevance: calculateRelevance(
            searchIndex.forwardIndex.get(messageId)?.content || '',
            keyword,
            1,
            searchIndex.forwardIndex.size
          ),
          highlights: findHighlights(
            searchIndex.forwardIndex.get(messageId)?.content || '',
            keyword
          )
        }))
        .sort((a, b) => b.relevance - a.relevance) // 按相关性排序

      // 5. 分页
      const paginatedResults = resultMessages.slice(offset, offset + limit)

      searchState.results = paginatedResults
      searchState.totalCount = resultMessages.length
    } catch (err) {
      searchState.error = err.message
      searchState.results = []
      searchState.totalCount = 0
    } finally {
      searchState.loading = false
    }
  }

  /**
   * 获取搜索建议
   * @param {string} prefix - 搜索前缀
   * @param {number} limit - 返回数量限制
   * @returns {Array} 建议列表
   */
  function getSearchSuggestions(prefix, limit = 10) {
    if (!prefix) return []

    const suggestions = []
    const normalized = prefix.toLowerCase()

    // 从历史记录中查找
    searchHistory.value.forEach(item => {
      if (item.toLowerCase().startsWith(normalized) && !suggestions.includes(item)) {
        suggestions.push(item)
      }
    })

    // 从token索引中查找常用词
    const tokenArray = Array.from(searchIndex.tokenIndex.entries())
      .map(([token, data]) => ({ token, frequency: data.frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50) // 只考虑前50个高频token

    tokenArray.forEach(({ token }) => {
      if (token.toLowerCase().startsWith(normalized) && !suggestions.includes(token)) {
        suggestions.push(token)
      }
    })

    return suggestions.slice(0, limit)
  }

  /**
   * 添加搜索历史
   * @param {string} keyword - 搜索关键词
   */
  function addSearchHistory(keyword) {
    if (!keyword.trim()) return

    // 从历史中移除重复项
    const index = searchHistory.value.indexOf(keyword)
    if (index !== -1) {
      searchHistory.value.splice(index, 1)
    }

    // 添加到开头
    searchHistory.value.unshift(keyword)

    // 限制历史记录数量为50条
    if (searchHistory.value.length > 50) {
      searchHistory.value = searchHistory.value.slice(0, 50)
    }

    // 保存到localStorage
    try {
      localStorage.setItem('messageSearchHistory', JSON.stringify(searchHistory.value))
    } catch (err) {
      console.warn('Failed to save search history:', err)
    }
  }

  /**
   * 加载搜索历史
   */
  function loadSearchHistory() {
    try {
      const saved = localStorage.getItem('messageSearchHistory')
      if (saved) {
        searchHistory.value = JSON.parse(saved)
      }
    } catch (err) {
      console.warn('Failed to load search history:', err)
    }
  }

  /**
   * 清空搜索历史
   */
  function clearSearchHistory() {
    searchHistory.value = []
    try {
      localStorage.removeItem('messageSearchHistory')
    } catch (err) {
      console.warn('Failed to clear search history:', err)
    }
  }

  /**
   * 设置过滤器
   */
  function setFilters(filters) {
    Object.assign(currentFilters, filters)
  }

  /**
   * 重置过滤器
   */
  function resetFilters() {
    currentFilters.type = null
    currentFilters.timeRange = 'all'
    currentFilters.senderId = null
    currentFilters.conversationId = null
  }

  /**
   * 初始化搜索历史
   */
  loadSearchHistory()

  // 计算搜索结果的统计信息
  const searchStats = computed(() => ({
    total: searchState.totalCount,
    loaded: searchState.results.length,
    hasMore: searchState.totalCount > searchState.results.length,
    indexSize: searchIndex.forwardIndex.size,
    uniqueTokens: searchIndex.invertedIndex.size
  }))

  return {
    // 状态
    searchState,
    searchHistory,
    currentFilters,
    searchStats,

    // 方法
    buildIndex,
    search,
    getSearchSuggestions,
    addSearchHistory,
    loadSearchHistory,
    clearSearchHistory,
    setFilters,
    resetFilters,

    // 工具函数（导出用于测试）
    tokenize,
    calculateRelevance,
    findHighlights
  }
}
