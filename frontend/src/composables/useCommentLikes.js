/**
 * useCommentLikes - 评论点赞管理
 *
 * 功能：
 * - 管理点赞状态
 * - 支持点赞/取消点赞
 * - 持久化到 localStorage
 * - 实时更新评论列表
 */

import { ref, computed, watch } from 'vue'

export function useCommentLikes(postId) {
  // 状态
  const likedComments = ref(new Set())
  const likeCounts = ref(new Map())
  const loading = ref(new Set())

  // 初始化
  const initializeLikes = () => {
    try {
      const stored = localStorage.getItem(`post-${postId}-likes`)
      if (stored) {
        const data = JSON.parse(stored)
        likedComments.value = new Set(data.likedComments || [])
        likeCounts.value = new Map(Object.entries(data.likeCounts || {}))
      }
    } catch (err) {
      console.error('Failed to load likes:', err)
    }
  }

  // 保存点赞数据
  const saveLikes = () => {
    try {
      const data = {
        likedComments: Array.from(likedComments.value),
        likeCounts: Object.fromEntries(likeCounts.value)
      }
      localStorage.setItem(`post-${postId}-likes`, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save likes:', err)
    }
  }

  // 点赞/取消点赞
  const toggleLike = async (commentId, currentLikes = 0) => {
    // 防止重复请求
    if (loading.value.has(commentId)) {
      return false
    }

    const isLiked = likedComments.value.has(commentId)
    const newLikeCount = isLiked ? currentLikes - 1 : currentLikes + 1

    // 乐观更新UI
    if (isLiked) {
      likedComments.value.delete(commentId)
    } else {
      likedComments.value.add(commentId)
    }
    likeCounts.value.set(commentId, newLikeCount)

    loading.value.add(commentId)

    try {
      // 模拟API调用（实际应该调用后端接口）
      await new Promise(resolve => setTimeout(resolve, 300))

      // 保存到本地存储
      saveLikes()

      return true
    } catch (err) {
      // 恢复状态
      if (isLiked) {
        likedComments.value.add(commentId)
      } else {
        likedComments.value.delete(commentId)
      }
      likeCounts.value.set(commentId, currentLikes)

      console.error('Failed to toggle like:', err)
      return false
    } finally {
      loading.value.delete(commentId)
    }
  }

  // 设置初始点赞数
  const setInitialLike = (commentId, count) => {
    if (!likeCounts.value.has(commentId)) {
      likeCounts.value.set(commentId, count || 0)
    }
  }

  // 判断是否已点赞
  const isLiked = (commentId) => likedComments.value.has(commentId)

  // 获取点赞数
  const getLikeCount = (commentId) => likeCounts.value.get(commentId) || 0

  // 判断是否正在加载
  const isLoading = (commentId) => loading.value.has(commentId)

  // 清空所有点赞数据
  const clearLikes = () => {
    likedComments.value.clear()
    likeCounts.value.clear()
    loading.value.clear()
    try {
      localStorage.removeItem(`post-${postId}-likes`)
    } catch (err) {
      console.error('Failed to clear likes:', err)
    }
  }

  // 初始化
  initializeLikes()

  return {
    // 状态
    likedComments,
    likeCounts,
    loading,

    // 方法
    toggleLike,
    setInitialLike,
    isLiked,
    getLikeCount,
    isLoading,
    clearLikes,
    saveLikes
  }
}
