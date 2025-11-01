/**
 * Message Sorting Service (Phase 7D Advanced)
 * 提供个性化消息排序和优先级管理
 */

import { reactive, computed } from 'vue'

// 排序选项
const SORT_OPTIONS = {
  RELEVANCE: 'relevance',      // 相关性 (搜索结果)
  IMPORTANCE: 'importance',    // 重要性
  RECENCY: 'recency',          // 最近
  OLDEST: 'oldest',            // 最旧
  ENGAGEMENT: 'engagement',    // 参与度
  ALPHABETICAL: 'alphabetical' // 字母顺序
}

// 用户偏好
const userPreferences = reactive({
  defaultSort: SORT_OPTIONS.RECENCY,
  boostCollected: true,
  boostMarked: true,
  boostFromVIP: true,
  recencyWeight: 0.2,
  importanceWeight: 0.3,
  engagementWeight: 0.2
})

/**
 * 对消息数组进行排序
 */
export function sortMessages(messages, option = SORT_OPTIONS.RECENCY, userMarks, collections) {
  if (!messages || messages.length === 0) return []

  const sortedMessages = messages.map(msg => ({
    ...msg,
    sortScore: calculateSortScore(msg, option, userMarks, collections)
  }))

  return sortedMessages
    .sort((a, b) => b.sortScore - a.sortScore)
    .map(({ sortScore, ...msg }) => msg)
}

/**
 * 计算单个消息的排序分数
 * @private
 */
function calculateSortScore(message, sortOption, userMarks = {}, collections = {}) {
  let score = 0

  switch (sortOption) {
    case SORT_OPTIONS.RELEVANCE:
      score = message.relevanceScore || 0.5
      break

    case SORT_OPTIONS.IMPORTANCE:
      score = calculateImportanceScore(message, userMarks, collections)
      break

    case SORT_OPTIONS.RECENCY:
      score = calculateRecencyScore(message.timestamp)
      break

    case SORT_OPTIONS.OLDEST:
      score = 1 - calculateRecencyScore(message.timestamp)
      break

    case SORT_OPTIONS.ENGAGEMENT:
      score = calculateEngagementScore(message)
      break

    case SORT_OPTIONS.ALPHABETICAL:
      score = calculateAlphabeticalScore(message.senderName || '')
      break

    default:
      score = 0.5
  }

  // 应用用户偏好增强
  if (userPreferences.boostCollected && collections[message.id]) {
    score += 0.15
  }

  if (userPreferences.boostMarked && userMarks[message.id]) {
    score += 0.15
  }

  return Math.min(1, score)
}

/**
 * 计算重要性分数
 * @private
 */
function calculateImportanceScore(message, userMarks) {
  let score = 0

  // 基于标记类型
  if (userMarks && userMarks[message.id]) {
    const marks = userMarks[message.id]
    if (marks.important) score += 0.4
    if (marks.urgent) score += 0.35
    if (marks.todo) score += 0.25
    if (marks.done) score += 0.15
  }

  // 基于大写字母和感叹号（启发式）
  const content = message.content || ''
  const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / Math.max(content.length, 1)
  if (uppercaseRatio > 0.3) score += 0.1

  const exclamations = (content.match(/!/g) || []).length
  score += Math.min(0.1, exclamations * 0.05)

  return Math.min(1, score)
}

/**
 * 计算新鲜度分数
 * @private
 */
function calculateRecencyScore(timestamp) {
  if (!timestamp) return 0

  const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60)

  if (ageHours < 1) return 1
  if (ageHours < 6) return 0.9
  if (ageHours < 24) return 0.7
  if (ageHours < 7 * 24) return 0.5
  if (ageHours < 30 * 24) return 0.3
  return 0.1
}

/**
 * 计算参与度分数
 * @private
 */
function calculateEngagementScore(message) {
  let score = 0

  // 基于转发数
  if (message.forwardCount) {
    score += Math.min(0.3, message.forwardCount * 0.05)
  }

  // 基于回复数
  if (message.replyCount) {
    score += Math.min(0.3, message.replyCount * 0.05)
  }

  // 基于收藏状态
  if (message.isCollected) {
    score += 0.2
  }

  // 基于观看数
  if (message.viewCount) {
    score += Math.min(0.2, Math.log(message.viewCount + 1) * 0.1)
  }

  return Math.min(1, score)
}

/**
 * 计算字母顺序分数
 * @private
 */
function calculateAlphabeticalScore(text) {
  if (!text) return 0

  // 将字母转换为分数 (A=1, Z=0)
  const firstLetter = text.charAt(0).toUpperCase()
  const charCode = firstLetter.charCodeAt(0)
  return 1 - (charCode - 65) / 26
}

/**
 * 获取所有排序选项
 */
export function getSortOptions() {
  return Object.entries(SORT_OPTIONS).map(([key, value]) => ({
    label: key.charAt(0) + key.slice(1).toLowerCase(),
    value
  }))
}

/**
 * 设置用户排序偏好
 */
export function setUserPreference(key, value) {
  if (key in userPreferences) {
    userPreferences[key] = value
    return true
  }
  return false
}

/**
 * 获取用户排序偏好
 */
export function getUserPreferences() {
  return { ...userPreferences }
}

/**
 * 重置为默认偏好
 */
export function resetPreferences() {
  userPreferences.defaultSort = SORT_OPTIONS.RECENCY
  userPreferences.boostCollected = true
  userPreferences.boostMarked = true
  userPreferences.boostFromVIP = true
  userPreferences.recencyWeight = 0.2
  userPreferences.importanceWeight = 0.3
  userPreferences.engagementWeight = 0.2
  return true
}

/**
 * 保存到 localStorage
 */
export function savePreferences() {
  try {
    localStorage.setItem(
      'message_sorting_prefs',
      JSON.stringify({
        preferences: { ...userPreferences },
        version: 1,
        savedAt: Date.now()
      })
    )
    return true
  } catch (error) {
    console.error('Save sorting preferences failed:', error)
    return false
  }
}

/**
 * 从 localStorage 加载
 */
export function loadPreferences() {
  try {
    const saved = localStorage.getItem('message_sorting_prefs')
    if (!saved) return true

    const data = JSON.parse(saved)
    if (data.preferences) {
      Object.assign(userPreferences, data.preferences)
    }

    return true
  } catch (error) {
    console.error('Load sorting preferences failed:', error)
    return false
  }
}

/**
 * 清理
 */
export function cleanup() {
  resetPreferences()
}

/**
 * 主 Composition API 导出
 */
export function useMessageSorting() {
  return {
    // State
    userPreferences: computed(() => userPreferences),

    // Core methods
    sortMessages,

    // Preferences
    setSortOption: (option) => setUserPreference('defaultSort', option),
    setUserPreference,
    getUserPreferences,
    resetPreferences,

    // Options
    getSortOptions,
    SORT_OPTIONS,

    // Storage
    savePreferences,
    loadPreferences,

    // Lifecycle
    cleanup
  }
}
