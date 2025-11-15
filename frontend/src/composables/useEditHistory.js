/**
 * useEditHistory - 编辑历史管理
 *
 * 功能：
 * - 记录评论编辑历史
 * - 保存编辑时间和内容
 * - 支持查看编辑历史
 * - 支持恢复旧版本
 */

import { ref, computed } from 'vue'

export function useEditHistory(commentId, initialContent = '') {
  // 状态
  const editHistory = ref([
    {
      version: 1,
      content: initialContent,
      timestamp: new Date(),
      author: 'current-user',
      reason: '初始版本'
    }
  ])

  const currentVersion = ref(1)

  // 计算属性
  const currentContent = computed(() => {
    const version = editHistory.value.find(v => v.version === currentVersion.value)
    return version ? version.content : initialContent
  })

  const hasHistory = computed(() => editHistory.value.length > 1)

  const totalVersions = computed(() => editHistory.value.length)

  // 记录编辑
  const recordEdit = (newContent, reason = '编辑评论') => {
    if (newContent === currentContent.value) {
      return false // 内容未改变
    }

    const newVersion = editHistory.value.length + 1

    editHistory.value.push({
      version: newVersion,
      content: newContent,
      timestamp: new Date(),
      author: 'current-user',
      reason
    })

    currentVersion.value = newVersion
    saveHistory()
    return true
  }

  // 获取编辑历史
  const getHistory = () => {
    return editHistory.value.map(item => ({
      ...item,
      formattedTime: item.timestamp.toLocaleString('zh-CN')
    }))
  }

  // 恢复到指定版本
  const restoreVersion = (version) => {
    const targetVersion = editHistory.value.find(v => v.version === version)
    if (!targetVersion) {
      return false
    }

    currentVersion.value = version
    return true
  }

  // 获取两个版本之间的差异
  const getDiff = (version1, version2) => {
    const v1 = editHistory.value.find(v => v.version === version1)
    const v2 = editHistory.value.find(v => v.version === version2)

    if (!v1 || !v2) {
      return null
    }

    return {
      from: v1.content,
      to: v2.content,
      timestamp: v2.timestamp,
      reason: v2.reason
    }
  }

  // 保存到 localStorage
  const saveHistory = () => {
    try {
      const data = {
        commentId,
        editHistory: editHistory.value.map(item => ({
          ...item,
          timestamp: item.timestamp.toISOString()
        })),
        currentVersion: currentVersion.value
      }
      localStorage.setItem(`comment-history-${commentId}`, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save edit history:', err)
    }
  }

  // 从 localStorage 加载历史
  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(`comment-history-${commentId}`)
      if (stored) {
        const data = JSON.parse(stored)
        editHistory.value = data.editHistory.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        currentVersion.value = data.currentVersion
        return true
      }
    } catch (err) {
      console.error('Failed to load edit history:', err)
    }
    return false
  }

  // 清空历史
  const clearHistory = () => {
    editHistory.value = [
      {
        version: 1,
        content: initialContent,
        timestamp: new Date(),
        author: 'current-user',
        reason: '初始版本'
      }
    ]
    currentVersion.value = 1
    try {
      localStorage.removeItem(`comment-history-${commentId}`)
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }

  // 尝试加载历史
  loadHistory()

  return {
    // 状态
    editHistory,
    currentVersion,
    currentContent,

    // 计算属性
    hasHistory,
    totalVersions,

    // 方法
    recordEdit,
    getHistory,
    restoreVersion,
    getDiff,
    saveHistory,
    loadHistory,
    clearHistory
  }
}
