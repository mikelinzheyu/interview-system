/**
 * useDraft - 评论草稿自动保存
 *
 * 功能：
 * - 自动保存评论内容到 localStorage
 * - 页面刷新/关闭时自动保存
 * - 恢复之前未提交的草稿
 * - 支持多个独立的草稿（通过不同的 key）
 *
 * 使用示例：
 * const { content, lastSaveTime, clearDraft } = useDraft(`comment-draft-post-${postId}`)
 */

import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

export function useDraft(
  storageKey = 'comment-draft',
  autosaveInterval = 30000 // 默认 30 秒自动保存
) {
  const content = ref('')
  const lastSaveTime = ref(null)
  const isSaving = ref(false)
  const hasDraft = ref(false)

  /**
   * 从 localStorage 恢复草稿
   */
  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { content: savedContent, timestamp } = JSON.parse(saved)

        // 验证数据有效性
        if (savedContent && typeof savedContent === 'string') {
          content.value = savedContent
          lastSaveTime.value = new Date(timestamp)
          hasDraft.value = true
          return true
        }
      }
    } catch (error) {
      console.error('[useDraft] Failed to restore draft:', error)
      // 如果恢复失败，清除可能损坏的数据
      localStorage.removeItem(storageKey)
    }
    return false
  }

  /**
   * 保存草稿到 localStorage
   */
  const saveDraft = () => {
    // 如果内容为空，删除草稿
    if (!content.value.trim()) {
      localStorage.removeItem(storageKey)
      lastSaveTime.value = null
      hasDraft.value = false
      return
    }

    try {
      isSaving.value = true

      const draftData = {
        content: content.value,
        timestamp: new Date().toISOString()
      }

      localStorage.setItem(storageKey, JSON.stringify(draftData))
      lastSaveTime.value = new Date()
      hasDraft.value = true

      console.log('[useDraft] Draft saved successfully at', lastSaveTime.value)
    } catch (error) {
      console.error('[useDraft] Failed to save draft:', error)

      // 区分错误类型
      if (error.name === 'QuotaExceededError') {
        ElMessage.warning('本地存储已满，无法继续保存草稿。请清理浏览器缓存。')
      } else {
        ElMessage.warning('保存草稿失败，请检查浏览器设置')
      }
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 防抖保存（避免频繁写入 localStorage）
   */
  let saveTimer = null
  const debouncedSave = () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveDraft()
    }, autosaveInterval)
  }

  /**
   * 立即保存（不等待防抖）
   */
  const saveNow = () => {
    clearTimeout(saveTimer)
    saveDraft()
  }

  /**
   * 清空草稿
   */
  const clearDraft = () => {
    content.value = ''
    localStorage.removeItem(storageKey)
    lastSaveTime.value = null
    hasDraft.value = false
    clearTimeout(saveTimer)
    console.log('[useDraft] Draft cleared')
  }

  /**
   * 获取最后保存时间的格式化字符串
   */
  const getFormattedSaveTime = () => {
    if (!lastSaveTime.value) return ''
    const time = new Date(lastSaveTime.value)
    const hours = String(time.getHours()).padStart(2, '0')
    const minutes = String(time.getMinutes()).padStart(2, '0')
    const seconds = String(time.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  // ========== 生命周期 ==========

  // 页面加载时恢复草稿
  onMounted(() => {
    restoreDraft()
  })

  // 监听内容变化，自动保存
  watch(() => content.value, debouncedSave)

  // 页面关闭/刷新时保存
  const handleBeforeUnload = () => {
    saveNow()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  onUnmounted(() => {
    // 清理事件监听
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
    clearTimeout(saveTimer)
  })

  return {
    // 响应式数据
    content,
    lastSaveTime,
    isSaving,
    hasDraft,

    // 方法
    saveDraft,
    saveNow,
    clearDraft,
    restoreDraft,
    getFormattedSaveTime
  }
}
