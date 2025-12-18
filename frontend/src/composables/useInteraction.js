import { ref } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 乐观 UI (Optimistic UI) 交互 Composable
 * 用于处理点赞、收藏等用户交互，提供即时反馈和错误回滚
 */
export function useInteraction() {
  const isProcessing = ref(false)

  /**
   * 执行乐观 UI 更新
   * @param {Object} options 配置选项
   * @param {Function} options.optimisticUpdate - 乐观更新函数（立即执行）
   * @param {Function} options.apiCall - API 调用函数
   * @param {Function} options.rollback - 失败时的回滚函数
   * @param {String} options.successMessage - 成功提示信息
   * @param {String} options.errorMessage - 失败提示信息
   */
  const performOptimisticUpdate = async ({
    optimisticUpdate,
    apiCall,
    rollback,
    successMessage = '操作成功',
    errorMessage = '操作失败，请重试'
  }) => {
    if (isProcessing.value) {
      return false
    }

    isProcessing.value = true

    try {
      // 1. 立即执行乐观更新（UI 瞬间响应）
      if (optimisticUpdate) {
        optimisticUpdate()
      }

      // 2. 发送 API 请求
      if (apiCall) {
        await apiCall()
      }

      // 3. 显示成功提示
      if (successMessage) {
        ElMessage.success(successMessage)
      }

      return true
    } catch (error) {
      console.error('Interaction error:', error)

      // 4. 失败时回滚 UI 状态
      if (rollback) {
        rollback()
      }

      // 5. 显示错误提示
      ElMessage.error(errorMessage)

      return false
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 点赞/取消点赞
   * @param {Object} state - 响应式状态对象，包含 liked 和 likeCount
   * @param {Function} apiCall - API 调用函数
   */
  const toggleLike = async (state, apiCall) => {
    const originalLiked = state.liked
    const originalCount = state.likeCount || state.like_count || 0

    return performOptimisticUpdate({
      optimisticUpdate: () => {
        state.liked = !originalLiked
        if (state.likeCount !== undefined) {
          state.likeCount = originalLiked ? originalCount - 1 : originalCount + 1
        } else if (state.like_count !== undefined) {
          state.like_count = originalLiked ? originalCount - 1 : originalCount + 1
        }
      },
      apiCall,
      rollback: () => {
        state.liked = originalLiked
        if (state.likeCount !== undefined) {
          state.likeCount = originalCount
        } else if (state.like_count !== undefined) {
          state.like_count = originalCount
        }
      },
      successMessage: !originalLiked ? '点赞成功' : '已取消点赞',
      errorMessage: '点赞操作失败，请重试'
    })
  }

  /**
   * 收藏/取消收藏
   * @param {Object} state - 响应式状态对象，包含 collected
   * @param {Function} apiCall - API 调用函数
   */
  const toggleCollect = async (state, apiCall) => {
    const originalCollected = state.collected

    return performOptimisticUpdate({
      optimisticUpdate: () => {
        state.collected = !originalCollected
      },
      apiCall,
      rollback: () => {
        state.collected = originalCollected
      },
      successMessage: !originalCollected ? '收藏成功' : '已取消收藏',
      errorMessage: '收藏操作失败，请重试'
    })
  }

  /**
   * 关注/取消关注
   * @param {Object} state - 响应式状态对象，包含 following 和 followerCount
   * @param {Function} apiCall - API 调用函数
   */
  const toggleFollow = async (state, apiCall) => {
    const originalFollowing = state.following || state.isFollowing
    const originalCount = state.followerCount || 0

    return performOptimisticUpdate({
      optimisticUpdate: () => {
        if (state.following !== undefined) {
          state.following = !originalFollowing
        }
        if (state.isFollowing !== undefined) {
          state.isFollowing = !originalFollowing
        }
        if (state.followerCount !== undefined) {
          state.followerCount = originalFollowing ? originalCount - 1 : originalCount + 1
        }
      },
      apiCall,
      rollback: () => {
        if (state.following !== undefined) {
          state.following = originalFollowing
        }
        if (state.isFollowing !== undefined) {
          state.isFollowing = originalFollowing
        }
        if (state.followerCount !== undefined) {
          state.followerCount = originalCount
        }
      },
      successMessage: !originalFollowing ? '关注成功' : '已取消关注',
      errorMessage: '关注操作失败，请重试'
    })
  }

  return {
    isProcessing,
    performOptimisticUpdate,
    toggleLike,
    toggleCollect,
    toggleFollow
  }
}
