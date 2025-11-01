import { reactive, computed, ref } from 'vue'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import socketService from '@/utils/socket'

/**
 * Message Recommendation Service (Phase 7D)
 * 提供基于用户行为和模式的消息推荐功能
 *
 * 功能:
 * - 基于收藏内容推荐相似消息
 * - 检测需要跟进的消息
 * - 查找相关消息
 * - 个人化推荐排序
 * - 推荐反馈和学习
 */

const store = useChatWorkspaceStore()

// 推荐类型
const RECOMMENDATION_TYPES = {
  COLLECTION_SIMILARITY: 'collection_similarity',  // 相似于已收藏的内容
  FOLLOW_UP_NEEDED: 'follow_up_needed',            // 需要跟进
  RELATED_MESSAGE: 'related_message',              // 相关消息
  IMPORTANT_FROM_VIP: 'important_from_vip'         // 来自重要联系人的消息
}

// 推荐配置
const CONFIG = {
  MAX_RECOMMENDATIONS: 20,           // 最多推荐数
  SIMILARITY_THRESHOLD: 0.5,         // 相似度阈值
  MIN_COLLECTION_SIZE: 3,            // 最小收藏数以启用推荐
  FOLLOW_UP_KEYWORDS: ['?', '请问', '怎么', '可以吗', 'todo', 'ASAP', '紧急'],
  STORAGE_KEY: 'message_recommendations',
  FEEDBACK_STORAGE_KEY: 'recommendation_feedback'
}

// 推荐数据存储
const recommendations = reactive(new Map())  // messageId -> recommendationObject
const feedback = reactive(new Map())          // messageId -> feedbackObject
const recommendationStats = reactive({
  totalGenerated: 0,
  totalAccepted: 0,
  totalDismissed: 0,
  totalClicked: 0,
  averageRelevanceScore: 0
})
const pendingSyncs = ref([])                  // 待同步的推荐 IDs

/**
 * 生成消息推荐
 * 分析用户的收藏、标记等模式，为消息生成推荐分数
 *
 * @param {string} messageId - 消息ID
 * @param {string} conversationId - 会话ID
 * @param {object} message - 消息对象
 * @param {object} userCollections - 用户的收藏 Map
 * @param {object} userMarks - 用户的标记 Map
 * @returns {object|null} 推荐对象或 null
 */
export function generateRecommendation(messageId, conversationId, message, userCollections, userMarks) {
  if (!messageId || !message) return null

  // 不推荐已经收藏的消息
  if (userCollections && userCollections.has(messageId)) {
    return null
  }

  const scores = {
    collectionSimilarity: calculateCollectionSimilarity(message, userCollections),
    followUpNeed: calculateFollowUpScore(message),
    relatedMessage: calculateRelatedScore(message, userCollections),
    vipScore: calculateVIPScore(message),
    recencyBoost: calculateRecencyBoost(message)
  }

  // 计算综合得分 (加权平均)
  const weights = {
    collectionSimilarity: 0.35,
    followUpNeed: 0.25,
    relatedMessage: 0.15,
    vipScore: 0.15,
    recencyBoost: 0.10
  }

  let combinedScore = 0
  let recommendationType = null
  let reason = '推荐的消息'

  // 确定推荐类型和分数
  if (scores.collectionSimilarity > CONFIG.SIMILARITY_THRESHOLD) {
    recommendationType = RECOMMENDATION_TYPES.COLLECTION_SIMILARITY
    combinedScore = scores.collectionSimilarity * weights.collectionSimilarity
    reason = '类似于您已收藏的内容'
  } else if (scores.followUpNeed > 0.7) {
    recommendationType = RECOMMENDATION_TYPES.FOLLOW_UP_NEEDED
    combinedScore = scores.followUpNeed * weights.followUpNeed
    reason = '此消息可能需要您的关注'
  } else if (scores.relatedMessage > 0.6) {
    recommendationType = RECOMMENDATION_TYPES.RELATED_MESSAGE
    combinedScore = scores.relatedMessage * weights.relatedMessage
    reason = '与您的兴趣相关'
  } else if (scores.vipScore > 0.7) {
    recommendationType = RECOMMENDATION_TYPES.IMPORTANT_FROM_VIP
    combinedScore = scores.vipScore * weights.vipScore
    reason = '来自重要联系人'
  }

  // 如果综合分数过低，不推荐
  if (combinedScore < 0.3) {
    return null
  }

  // 添加新鲜度加权
  combinedScore = combinedScore * 0.9 + scores.recencyBoost * 0.1

  const recommendation = {
    id: `rec_${messageId}_${Date.now()}`,
    messageId,
    conversationId,
    type: recommendationType,
    score: Math.min(1, combinedScore),
    reason,
    suggestedAt: Date.now(),
    dismissed: false,
    clicked: false,
    clickedAt: null,
    helpful: null  // null (未反馈) | true (有用) | false (无用)
  }

  recommendations.set(messageId, recommendation)
  recommendationStats.totalGenerated++
  pendingSyncs.value.push(messageId)

  return recommendation
}

/**
 * 计算内容相似度 (基于词汇和主题)
 * @private
 */
function calculateCollectionSimilarity(message, userCollections) {
  if (!userCollections || userCollections.size < CONFIG.MIN_COLLECTION_SIZE) {
    return 0
  }

  const messageTokens = tokenizeText(message.content || '')
  if (messageTokens.length === 0) return 0

  let totalSimilarity = 0
  let comparisons = 0

  userCollections.forEach(collection => {
    const collectionTokens = tokenizeText(collection.messageContent || '')
    if (collectionTokens.length > 0) {
      const similarity = calculateJaccardSimilarity(messageTokens, collectionTokens)
      totalSimilarity += similarity
      comparisons++
    }
  })

  return comparisons > 0 ? totalSimilarity / comparisons : 0
}

/**
 * 计算跟进需求分数
 * 检查消息是否包含问题、待办项等
 * @private
 */
function calculateFollowUpScore(message) {
  if (!message.content) return 0

  const content = message.content.toLowerCase()
  let score = 0

  // 检查问号
  const questionMarks = (content.match(/\?/g) || []).length
  score += Math.min(0.3, questionMarks * 0.15)

  // 检查关键词
  CONFIG.FOLLOW_UP_KEYWORDS.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 0.1
    }
  })

  // 检查大写字母 (可能表示强调)
  const uppercaseCount = (content.match(/[A-Z]/g) || []).length
  const uppercaseRatio = uppercaseCount / Math.max(content.length, 1)
  if (uppercaseRatio > 0.2) {
    score += 0.15
  }

  // 检查感叹号
  const exclamations = (content.match(/!/g) || []).length
  score += Math.min(0.15, exclamations * 0.075)

  return Math.min(1, score)
}

/**
 * 计算相关消息分数
 * @private
 */
function calculateRelatedScore(message, userCollections) {
  if (!userCollections) return 0

  const messageSender = message.senderId || message.senderName
  let score = 0

  // 来自同一发送者的收藏
  let sameAuthorCount = 0
  userCollections.forEach(collection => {
    if (collection.senderId === messageSender) {
      sameAuthorCount++
    }
  })

  score += Math.min(0.4, (sameAuthorCount / Math.max(userCollections.size, 1)) * 0.4)

  // 相似的对话主题 (简单启发式)
  const messageKeywords = extractKeywords(message.content)
  let keywordMatches = 0
  userCollections.forEach(collection => {
    const collectionKeywords = extractKeywords(collection.messageContent)
    const matches = messageKeywords.filter(k => collectionKeywords.includes(k)).length
    if (matches > 0) keywordMatches += matches
  })

  score += Math.min(0.6, (keywordMatches / Math.max(messageKeywords.length, 1)) * 0.6)

  return Math.min(1, score)
}

/**
 * 计算来自重要联系人的分数
 * @private
 */
function calculateVIPScore(message) {
  // 这可以扩展为使用实际的 VIP 列表
  // 现在使用基于发送频率的启发式
  const sender = message.senderId || message.senderName

  // 检查发送者是否频繁出现在收藏中
  // (实际应用中应该有 VIP 列表或发送频率统计)

  return 0.5  // 默认中等分数
}

/**
 * 计算新鲜度加权
 * @private
 */
function calculateRecencyBoost(message) {
  const messageAge = Date.now() - (message.timestamp || message.createdAt || Date.now())
  const oneDayMs = 24 * 60 * 60 * 1000

  // 最近24小时内的消息获得更高的新鲜度分数
  if (messageAge < oneDayMs) {
    return 0.8 + (1 - messageAge / oneDayMs) * 0.2
  } else if (messageAge < 7 * oneDayMs) {
    return 0.6
  } else if (messageAge < 30 * oneDayMs) {
    return 0.4
  }

  return 0.2
}

/**
 * Jaccard 相似度计算
 * @private
 */
function calculateJaccardSimilarity(tokens1, tokens2) {
  const set1 = new Set(tokens1)
  const set2 = new Set(tokens2)

  const intersection = [...set1].filter(item => set2.has(item)).length
  const union = new Set([...tokens1, ...tokens2]).size

  return union > 0 ? intersection / union : 0
}

/**
 * 文本分词 (简单版本)
 * @private
 */
function tokenizeText(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 50)  // 限制词数以优化性能
}

/**
 * 提取关键词 (简单版本)
 * @private
 */
function extractKeywords(text) {
  const words = tokenizeText(text)
  // 简单启发式：较长的词可能是关键词
  return words.filter(word => word.length > 4).slice(0, 10)
}

/**
 * 获取所有推荐
 * @param {object} filter - 过滤选项
 * @returns {array} 推荐数组
 */
export function getRecommendations(filter = {}) {
  let results = Array.from(recommendations.values())

  // 按类型过滤
  if (filter.type) {
    results = results.filter(r => r.type === filter.type)
  }

  // 过滤已弃用的
  if (filter.hideDismissed !== false) {
    results = results.filter(r => !r.dismissed)
  }

  // 按分数排序
  results.sort((a, b) => b.score - a.score)

  // 应用限制
  const limit = filter.limit || CONFIG.MAX_RECOMMENDATIONS
  return results.slice(0, limit)
}

/**
 * 反馈推荐 (有用/无用)
 */
export function feedbackRecommendation(messageId, isHelpful) {
  const recommendation = recommendations.get(messageId)
  if (!recommendation) return false

  recommendation.helpful = isHelpful

  if (isHelpful) {
    recommendationStats.totalAccepted++
  }

  feedback.set(messageId, {
    messageId,
    helpful: isHelpful,
    feedbackAt: Date.now(),
    type: recommendation.type
  })

  pendingSyncs.value.push(messageId)
  return true
}

/**
 * 弃用推荐
 */
export function dismissRecommendation(messageId) {
  const recommendation = recommendations.get(messageId)
  if (!recommendation) return false

  recommendation.dismissed = true
  recommendationStats.totalDismissed++

  pendingSyncs.value.push(messageId)
  return true
}

/**
 * 记录推荐点击
 */
export function recordRecommendationClick(messageId) {
  const recommendation = recommendations.get(messageId)
  if (!recommendation) return false

  recommendation.clicked = true
  recommendation.clickedAt = Date.now()
  recommendationStats.totalClicked++

  pendingSyncs.value.push(messageId)
  return true
}

/**
 * 获取推荐统计
 */
export function getRecommendationStats() {
  return {
    totalGenerated: recommendationStats.totalGenerated,
    totalAccepted: recommendationStats.totalAccepted,
    totalDismissed: recommendationStats.totalDismissed,
    totalClicked: recommendationStats.totalClicked,
    acceptanceRate: recommendationStats.totalGenerated > 0
      ? (recommendationStats.totalAccepted / recommendationStats.totalGenerated).toFixed(2)
      : 0,
    clickRate: recommendationStats.totalGenerated > 0
      ? (recommendationStats.totalClicked / recommendationStats.totalGenerated).toFixed(2)
      : 0
  }
}

/**
 * 保存到 localStorage
 */
export function saveToLocalStorage() {
  try {
    const data = {
      recommendations: Array.from(recommendations.entries()),
      feedback: Array.from(feedback.entries()),
      stats: recommendationStats,
      version: 1,
      lastSaved: Date.now()
    }
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Save recommendations to localStorage failed:', error)
    return false
  }
}

/**
 * 从 localStorage 加载
 */
export function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY)
    if (!saved) return true

    const data = JSON.parse(saved)

    if (data.recommendations) {
      data.recommendations.forEach(([key, value]) => {
        recommendations.set(key, value)
      })
    }

    if (data.feedback) {
      data.feedback.forEach(([key, value]) => {
        feedback.set(key, value)
      })
    }

    if (data.stats) {
      Object.assign(recommendationStats, data.stats)
    }

    return true
  } catch (error) {
    console.error('Load recommendations from localStorage failed:', error)
    return false
  }
}

/**
 * WebSocket 事件处理
 */
export function handleRecommendationEvent(event) {
  if (!event || !event.type) return false

  if (event.type === 'recommendation-generated') {
    const recommendation = event.data
    recommendations.set(recommendation.messageId, recommendation)
    return true
  } else if (event.type === 'recommendation-dismissed') {
    const recommendation = recommendations.get(event.data.messageId)
    if (recommendation) {
      recommendation.dismissed = true
    }
    return true
  }

  return false
}

/**
 * 与服务器同步
 */
export async function syncWithServer() {
  if (pendingSyncs.value.length === 0) return true

  try {
    const syncData = pendingSyncs.value.map(messageId => {
      const rec = recommendations.get(messageId)
      return rec ? { ...rec, feedback: feedback.get(messageId) } : null
    }).filter(Boolean)

    // 这里将添加实际的 API 调用
    // await api.post('/recommendations/sync', { recommendations: syncData })

    pendingSyncs.value = []
    return true
  } catch (error) {
    console.error('Sync recommendations with server failed:', error)
    return false
  }
}

/**
 * 清理推荐
 */
export function cleanup() {
  recommendations.clear()
  feedback.clear()
  pendingSyncs.value = []
  Object.assign(recommendationStats, {
    totalGenerated: 0,
    totalAccepted: 0,
    totalDismissed: 0,
    totalClicked: 0,
    averageRelevanceScore: 0
  })
}

/**
 * 主 Composition API 导出
 */
export function useMessageRecommendation() {
  return {
    // State
    recommendations: computed(() => Array.from(recommendations.values())),
    feedback: computed(() => Array.from(feedback.entries())),
    pendingSyncs: computed(() => pendingSyncs.value),
    recommendationStats: computed(() => recommendationStats),
    hasPendingSyncs: computed(() => pendingSyncs.value.length > 0),

    // Core methods
    generateRecommendation,
    dismissRecommendation,
    recordRecommendationClick,
    feedbackRecommendation,

    // Query methods
    getRecommendations,
    getRecommendationStats,

    // Storage
    saveToLocalStorage,
    loadFromLocalStorage,
    syncWithServer,

    // Events
    handleRecommendationEvent,

    // Lifecycle
    cleanup,

    // Constants
    RECOMMENDATION_TYPES,
    CONFIG
  }
}
