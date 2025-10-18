/**
 * 消息搜索服务
 * 支持本地搜索、远程搜索和缓存
 */

// 本地搜索缓存
const localSearchCache = new Map()
const CACHE_EXPIRATION = 5 * 60 * 1000 // 5分钟

/**
 * 本地搜索消息
 * @param {Array} messages - 消息列表
 * @param {String} keyword - 搜索关键词
 * @param {Object} filters - 筛选条件
 * @returns {Array} 搜索结果
 */
export function searchMessagesLocally(messages, keyword, filters = {}) {
  if (!Array.isArray(messages)) return []
  if (!keyword || !keyword.trim()) return messages

  const keywordLower = keyword.toLowerCase()
  let results = messages

  // 按关键词搜索
  results = results.filter(msg => {
    const content = (msg?.content || '').toLowerCase()
    const senderName = (msg?.senderName || '').toLowerCase()
    return content.includes(keywordLower) || senderName.includes(keywordLower)
  })

  // 按发送者筛选
  if (filters.senderId) {
    results = results.filter(msg => msg?.senderId === filters.senderId)
  }

  // 按消息类型筛选
  if (filters.type) {
    results = results.filter(msg => msg?.type === filters.type)
  }

  // 按日期范围筛选
  if (filters.startDate || filters.endDate) {
    results = results.filter(msg => {
      if (!msg?.createdAt) return false
      const msgDate = new Date(msg.createdAt).getTime()
      const start = filters.startDate ? new Date(filters.startDate).getTime() : 0
      const end = filters.endDate ? new Date(filters.endDate).getTime() : Date.now()
      return msgDate >= start && msgDate <= end
    })
  }

  // 按消息状态筛选
  if (filters.status) {
    results = results.filter(msg => msg?.status === filters.status)
  }

  // 按是否已读筛选
  if (filters.isRead !== undefined) {
    results = results.filter(msg => msg?.isRead === filters.isRead)
  }

  return results
}

/**
 * 远程搜索消息 (模拟API调用)
 * @param {String} conversationId - 会话ID
 * @param {String} keyword - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Promise<Array>} 搜索结果
 */
export async function searchMessagesRemote(conversationId, keyword, options = {}) {
  const cacheKey = `${conversationId}:${keyword}:${JSON.stringify(options)}`

  // 检查缓存
  const cached = localSearchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
    return cached.data
  }

  try {
    // 实际应用中调用真实API
    // const response = await api.post('/chat/search', {
    //   conversationId,
    //   keyword,
    //   ...options
    // })
    // return response.data

    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    // 模拟返回空结果
    const results = []

    // 缓存结果
    localSearchCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    })

    return results
  } catch (error) {
    console.error('Remote message search failed:', error)
    return []
  }
}

/**
 * 高亮搜索关键词
 * @param {String} text - 原始文本
 * @param {String} keyword - 搜索关键词
 * @returns {String} HTML标记的高亮文本
 */
export function highlightKeyword(text, keyword) {
  if (!text || !keyword) return text

  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 格式化搜索结果
 * @param {Array} messages - 搜索结果消息
 * @param {String} keyword - 搜索关键词
 * @returns {Array} 格式化后的结果
 */
export function formatSearchResults(messages, keyword) {
  if (!Array.isArray(messages)) return []

  return messages.map(msg => ({
    ...msg,
    highlightedContent: highlightKeyword(msg?.content || '', keyword),
    matchedFields: getMatchedFields(msg, keyword)
  }))
}

/**
 * 获取匹配的字段
 * @param {Object} message - 消息对象
 * @param {String} keyword - 搜索关键词
 * @returns {Array} 匹配的字段列表
 */
function getMatchedFields(message, keyword) {
  const fields = []
  const keywordLower = keyword.toLowerCase()

  if (message?.content?.toLowerCase().includes(keywordLower)) {
    fields.push('content')
  }

  if (message?.senderName?.toLowerCase().includes(keywordLower)) {
    fields.push('senderName')
  }

  return fields
}

/**
 * 清除搜索缓存
 */
export function clearSearchCache() {
  localSearchCache.clear()
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return {
    size: localSearchCache.size,
    items: Array.from(localSearchCache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      resultsCount: value.data.length
    }))
  }
}

/**
 * 优化搜索关键词
 * 移除空格、特殊字符等
 */
export function normalizeSearchKeyword(keyword) {
  if (!keyword) return ''
  return keyword
    .trim()
    .toLowerCase()
    .replace(/[\s\W]+/g, ' ')
    .trim()
}

/**
 * 搜索建议
 * @param {String} partial - 部分关键词
 * @param {Array} recentSearches - 最近搜索列表
 * @returns {Array} 搜索建议
 */
export function getSearchSuggestions(partial, recentSearches = []) {
  if (!partial || partial.length < 2) {
    // 返回最近搜索
    return recentSearches.slice(0, 5)
  }

  const partialLower = partial.toLowerCase()
  return recentSearches.filter(search =>
    search.toLowerCase().includes(partialLower)
  ).slice(0, 5)
}

export default {
  searchMessagesLocally,
  searchMessagesRemote,
  highlightKeyword,
  formatSearchResults,
  clearSearchCache,
  getCacheStats,
  normalizeSearchKeyword,
  getSearchSuggestions
}
