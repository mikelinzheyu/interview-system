import { reactive, computed, ref } from 'vue'

/**
 * Message Classification Service (Phase 7D)
 * 提供自动消息分类和智能标签功能
 *
 * 分类类型:
 * - question: 问题消息
 * - code_snippet: 代码片段
 * - important: 重要信息
 * - announcement: 公告
 * - media: 媒体文件
 * - document: 文档
 * - action_required: 需要操作
 * - completed: 已完成
 */

// 分类配置
const CATEGORIES = {
  QUESTION: 'question',
  CODE_SNIPPET: 'code_snippet',
  IMPORTANT: 'important',
  ANNOUNCEMENT: 'announcement',
  MEDIA: 'media',
  DOCUMENT: 'document',
  ACTION_REQUIRED: 'action_required',
  COMPLETED: 'completed'
}

const CATEGORY_CONFIG = {
  question: {
    label: '问题',
    icon: '❓',
    color: '#409EFF',
    keywords: ['?', '问题', '怎么', '如何', '为什么', '什么时候']
  },
  code_snippet: {
    label: '代码',
    icon: '💻',
    color: '#67C23A',
    keywords: ['code', 'function', 'class', 'const', 'import', '{', '}', '```']
  },
  important: {
    label: '重要',
    icon: '⭐',
    color: '#F56C6C',
    keywords: ['重要', '紧急', '必须', '重点', '!!!', '***']
  },
  announcement: {
    label: '公告',
    icon: '📢',
    color: '#E6A23C',
    keywords: ['公告', '通知', '所有人', '请注意', 'announcement']
  },
  media: {
    label: '媒体',
    icon: '🖼️',
    color: '#909399',
    keywords: ['image', 'video', 'audio', 'photo', 'picture', '.jpg', '.mp4']
  },
  document: {
    label: '文档',
    icon: '📄',
    color: '#606266',
    keywords: ['document', 'pdf', 'doc', 'file', '.xlsx', '.ppt']
  },
  action_required: {
    label: '待办',
    icon: '✓',
    color: '#409EFF',
    keywords: ['待办', 'todo', 'todo:', 'action', '需要', '请']
  },
  completed: {
    label: '已完成',
    icon: '✔️',
    color: '#67C23A',
    keywords: ['完成', 'done', 'completed', '已完成', '✓', '√']
  }
}

const CONFIG = {
  STORAGE_KEY: 'message_classifications',
  MAX_CLASSIFICATIONS: 5000
}

// 分类数据
const classifications = reactive(new Map())  // messageId -> classificationObject
const userAcceptedClassifications = reactive(new Map())  // messageId -> accepted[]
const userRejectedClassifications = reactive(new Map())  // messageId -> rejected[]
const pendingSyncs = ref([])

/**
 * 自动分类消息
 */
export function classifyMessage(messageId, message) {
  if (!messageId || !message) return null

  const content = message.content || ''
  const type = message.type || 'text'
  const attachments = message.attachments || []

  const suggestedCategories = []

  // 基于内容分类
  suggestedCategories.push(...classifyByContent(content))

  // 基于消息类型分类
  suggestedCategories.push(...classifyByType(type, attachments))

  // 基于模式分类
  suggestedCategories.push(...classifyByPattern(content))

  // 去重并排序
  const uniqueCategories = deduplicateCategories(suggestedCategories)
  uniqueCategories.sort((a, b) => b.confidence - a.confidence)

  if (uniqueCategories.length === 0) return null

  const classification = {
    messageId,
    categories: uniqueCategories.slice(0, 3),  // 最多3个分类
    userAccepted: [],
    userRejected: [],
    autoClassified: true,
    classifiedAt: Date.now(),
    revisedAt: null
  }

  classifications.set(messageId, classification)
  pendingSyncs.value.push(messageId)

  return classification
}

/**
 * 基于内容的分类
 * @private
 */
function classifyByContent(content) {
  const results = []
  const lowerContent = content.toLowerCase()

  Object.entries(CATEGORY_CONFIG).forEach(([category, config]) => {
    let score = 0

    // 检查关键词
    config.keywords.forEach(keyword => {
      if (lowerContent.includes(keyword.toLowerCase())) {
        score += 0.2
      }
    })

    // 检查问号（问题）
    if (category === 'question' && content.includes('?')) {
      score += 0.3
    }

    // 检查代码块标记
    if (category === 'code_snippet' && (content.includes('```') || content.includes('```'))) {
      score += 0.5
    }

    if (score > 0) {
      results.push({
        name: category,
        confidence: Math.min(1, score),
        suggestedAt: Date.now()
      })
    }
  })

  return results
}

/**
 * 基于消息类型的分类
 * @private
 */
function classifyByType(type, attachments) {
  const results = []

  if (type === 'image' || type === 'video' || type === 'audio') {
    results.push({
      name: 'media',
      confidence: 0.95,
      suggestedAt: Date.now()
    })
  } else if (type === 'file') {
    const fileName = attachments[0]?.name || ''
    if (fileName.includes('.pdf') || fileName.includes('.doc')) {
      results.push({
        name: 'document',
        confidence: 0.9,
        suggestedAt: Date.now()
      })
    } else {
      results.push({
        name: 'document',
        confidence: 0.7,
        suggestedAt: Date.now()
      })
    }
  }

  return results
}

/**
 * 基于模式的分类
 * @private
 */
function classifyByPattern(content) {
  const results = []

  // 全大写检测（可能是强调/公告）
  if (content.length > 10) {
    const upperCount = (content.match(/[A-Z]/g) || []).length
    if (upperCount / content.length > 0.5) {
      results.push({
        name: 'announcement',
        confidence: 0.6,
        suggestedAt: Date.now()
      })
    }
  }

  // 多个感叹号（可能是重要信息）
  const exclamationCount = (content.match(/!/g) || []).length
  if (exclamationCount >= 3) {
    results.push({
      name: 'important',
      confidence: Math.min(0.8, 0.5 + exclamationCount * 0.1),
      suggestedAt: Date.now()
    })
  }

  // 提及多人（可能是公告）
  const mentionCount = (content.match(/@[^\s]+/g) || []).length
  if (mentionCount >= 3) {
    results.push({
      name: 'announcement',
      confidence: 0.7,
      suggestedAt: Date.now()
    })
  }

  return results
}

/**
 * 去重分类
 * @private
 */
function deduplicateCategories(categories) {
  const seen = new Map()

  categories.forEach(cat => {
    if (!seen.has(cat.name) || seen.get(cat.name).confidence < cat.confidence) {
      seen.set(cat.name, cat)
    }
  })

  return Array.from(seen.values())
}

/**
 * 获取消息分类
 */
export function getClassification(messageId) {
  return classifications.get(messageId)
}

/**
 * 获取所有分类
 */
export function getAllClassifications(filter = {}) {
  let results = Array.from(classifications.values())

  // 按分类过滤
  if (filter.category) {
    results = results.filter(c =>
      c.categories.some(cat => cat.name === filter.category)
    )
  }

  // 按确认状态过滤
  if (filter.onlyAccepted) {
    results = results.filter(c => c.userAccepted.length > 0)
  }

  return results
}

/**
 * 接受分类建议
 */
export function acceptClassification(messageId, categoryName) {
  const classification = classifications.get(messageId)
  if (!classification) return false

  if (!classification.userAccepted.includes(categoryName)) {
    classification.userAccepted.push(categoryName)
    classification.revisedAt = Date.now()
    pendingSyncs.value.push(messageId)
    return true
  }

  return false
}

/**
 * 拒绝分类建议
 */
export function rejectClassification(messageId, categoryName) {
  const classification = classifications.get(messageId)
  if (!classification) return false

  if (!classification.userRejected.includes(categoryName)) {
    classification.userRejected.push(categoryName)
    classification.revisedAt = Date.now()
    pendingSyncs.value.push(messageId)
    return true
  }

  return false
}

/**
 * 获取分类统计
 */
export function getClassificationStats() {
  const stats = {}

  Object.keys(CATEGORY_CONFIG).forEach(category => {
    const count = Array.from(classifications.values()).filter(c =>
      c.userAccepted.includes(category)
    ).length
    stats[category] = count
  })

  return stats
}

/**
 * 保存到 localStorage
 */
export function saveToLocalStorage() {
  try {
    const data = {
      classifications: Array.from(classifications.entries()),
      version: 1,
      lastSaved: Date.now()
    }
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Save classifications to localStorage failed:', error)
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
    if (data.classifications) {
      data.classifications.forEach(([key, value]) => {
        classifications.set(key, value)
      })
    }

    return true
  } catch (error) {
    console.error('Load classifications from localStorage failed:', error)
    return false
  }
}

/**
 * 清理
 */
export function cleanup() {
  classifications.clear()
  userAcceptedClassifications.clear()
  userRejectedClassifications.clear()
  pendingSyncs.value = []
}

/**
 * 主 Composition API 导出
 */
export function useMessageClassification() {
  return {
    // State
    classifications: computed(() => Array.from(classifications.values())),
    pendingSyncs: computed(() => pendingSyncs.value),

    // Core methods
    classifyMessage,
    getClassification,
    getAllClassifications,
    acceptClassification,
    rejectClassification,

    // Query methods
    getClassificationStats,

    // Storage
    saveToLocalStorage,
    loadFromLocalStorage,

    // Lifecycle
    cleanup,

    // Constants
    CATEGORIES,
    CATEGORY_CONFIG
  }
}
