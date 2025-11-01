/**
 * Quick Access Service (Phase 7D Advanced)
 * 提供快速访问常用消息的功能
 */

import { reactive, computed, ref } from 'vue'

const CONFIG = {
  MAX_PINNED: 10,
  MAX_RECENT: 5,
  STORAGE_KEY: 'message_quick_access'
}

// 快速访问数据
const pinnedMessages = reactive([])
const recentMessages = reactive([])
const quickFilters = reactive({
  showPinned: false,
  showRecent: false,
  showImportant: false,
  showTodo: false
})

/**
 * 钉住消息 (最多10条)
 */
export function pinMessage(messageId, messageData) {
  if (pinnedMessages.length >= CONFIG.MAX_PINNED) {
    return false
  }

  if (pinnedMessages.find(m => m.messageId === messageId)) {
    return false
  }

  const pinnedMsg = {
    messageId,
    content: messageData.content,
    senderName: messageData.senderName,
    timestamp: messageData.timestamp,
    pinnedAt: Date.now(),
    type: messageData.type
  }

  pinnedMessages.unshift(pinnedMsg)
  return true
}

/**
 * 取消钉住消息
 */
export function unpinMessage(messageId) {
  const index = pinnedMessages.findIndex(m => m.messageId === messageId)
  if (index > -1) {
    pinnedMessages.splice(index, 1)
    return true
  }
  return false
}

/**
 * 检查消息是否被钉住
 */
export function isPinned(messageId) {
  return pinnedMessages.some(m => m.messageId === messageId)
}

/**
 * 获取钉住的消息
 */
export function getPinnedMessages() {
  return pinnedMessages
}

/**
 * 添加到最近消息
 */
export function addToRecent(messageId, messageData) {
  // 如果已存在，移到最前面
  const index = recentMessages.findIndex(m => m.messageId === messageId)
  if (index > -1) {
    recentMessages.splice(index, 1)
  }

  const recentMsg = {
    messageId,
    content: messageData.content,
    senderName: messageData.senderName,
    timestamp: messageData.timestamp,
    viewedAt: Date.now(),
    type: messageData.type
  }

  recentMessages.unshift(recentMsg)

  // 限制最多5条
  if (recentMessages.length > CONFIG.MAX_RECENT) {
    recentMessages.pop()
  }

  return true
}

/**
 * 获取最近消息
 */
export function getRecentMessages() {
  return recentMessages
}

/**
 * 清除最近消息历史
 */
export function clearRecentHistory() {
  recentMessages.splice(0)
  return true
}

/**
 * 切换快速过滤
 */
export function toggleQuickFilter(filterName) {
  if (filterName in quickFilters) {
    quickFilters[filterName] = !quickFilters[filterName]
    return quickFilters[filterName]
  }
  return false
}

/**
 * 获取活跃的过滤器
 */
export function getActiveFilters() {
  return Object.entries(quickFilters)
    .filter(([_, value]) => value)
    .map(([key, _]) => key)
}

/**
 * 清除所有过滤器
 */
export function clearFilters() {
  Object.keys(quickFilters).forEach(key => {
    quickFilters[key] = false
  })
  return true
}

/**
 * 获取快速访问数据
 */
export function getQuickAccessData() {
  return {
    pinned: pinnedMessages,
    recent: recentMessages,
    filters: { ...quickFilters },
    activeFilterCount: getActiveFilters().length
  }
}

/**
 * 保存到 localStorage
 */
export function saveToLocalStorage() {
  try {
    const data = {
      pinned: pinnedMessages,
      recent: recentMessages,
      filters: { ...quickFilters },
      version: 1,
      lastSaved: Date.now()
    }
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Save quick access to localStorage failed:', error)
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

    if (data.pinned) {
      pinnedMessages.splice(0, pinnedMessages.length, ...data.pinned)
    }

    if (data.recent) {
      recentMessages.splice(0, recentMessages.length, ...data.recent)
    }

    if (data.filters) {
      Object.assign(quickFilters, data.filters)
    }

    return true
  } catch (error) {
    console.error('Load quick access from localStorage failed:', error)
    return false
  }
}

/**
 * 清理
 */
export function cleanup() {
  pinnedMessages.splice(0)
  recentMessages.splice(0)
  Object.keys(quickFilters).forEach(key => {
    quickFilters[key] = false
  })
}

/**
 * 主 Composition API 导出
 */
export function useMessageQuickAccess() {
  return {
    // State
    pinnedMessages: computed(() => pinnedMessages),
    recentMessages: computed(() => recentMessages),
    quickFilters: computed(() => quickFilters),
    activeFilterCount: computed(() => getActiveFilters().length),

    // Pin methods
    pinMessage,
    unpinMessage,
    isPinned,
    getPinnedMessages,

    // Recent methods
    addToRecent,
    getRecentMessages,
    clearRecentHistory,

    // Filter methods
    toggleQuickFilter,
    getActiveFilters,
    clearFilters,

    // Data methods
    getQuickAccessData,

    // Storage
    saveToLocalStorage,
    loadFromLocalStorage,

    // Lifecycle
    cleanup,

    // Constants
    CONFIG
  }
}
