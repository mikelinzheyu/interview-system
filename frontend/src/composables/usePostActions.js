/**
 * usePostActions - 帖子操作组合式函数
 * 处理点赞、删除、报告等操作，包含乐观更新和权限控制
 */
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import communityAPI from '@/api/communityWithCache'

export function usePostActions() {
  // 追踪点赞状态
  const likedPostIds = ref(new Set())
  const likedCommentIds = ref(new Set())
  const loadingIds = ref(new Set())

  /**
   * 检查是否有权限编辑帖子
   */
  const canEditPost = (post, currentUser) => {
    if (!currentUser) return false
    return post.author?.userId === currentUser.id || currentUser.isAdmin
  }

  /**
   * 检查是否有权限删除帖子
   */
  const canDeletePost = (post, currentUser) => {
    if (!currentUser) return false
    return post.author?.userId === currentUser.id || currentUser.isAdmin
  }

  /**
   * 检查是否已点赞
   */
  const isPostLiked = (postId) => {
    return likedPostIds.value.has(postId)
  }

  const isCommentLiked = (commentId) => {
    return likedCommentIds.value.has(commentId)
  }

  /**
   * 点赞帖子（乐观更新 + 自动回滚）
   */
  const toggleLikePost = async (post) => {
    if (!post) return

    const wasLiked = isPostLiked(post.id)
    const originalLikes = post.likes || 0

    try {
      // 乐观更新 UI
      if (wasLiked) {
        likedPostIds.value.delete(post.id)
        post.likes = Math.max(0, post.likes - 1)
      } else {
        likedPostIds.value.add(post.id)
        post.likes = (post.likes || 0) + 1
      }

      // 发送请求
      loadingIds.value.add(`post:${post.id}`)
      await communityAPI.likePost(post.id)
      loadingIds.value.delete(`post:${post.id}`)
    } catch (error) {
      // 请求失败，回滚状态
      if (wasLiked) {
        likedPostIds.value.add(post.id)
      } else {
        likedPostIds.value.delete(post.id)
      }
      post.likes = originalLikes

      ElMessage.error('点赞失败，请重试')
      console.error('toggleLikePost error:', error)
    }
  }

  /**
   * 点赞评论（乐观更新 + 自动回滚）
   */
  const toggleLikeComment = async (comment) => {
    if (!comment) return

    const wasLiked = isCommentLiked(comment.id)
    const originalLikes = comment.likes || 0

    try {
      // 乐观更新 UI
      if (wasLiked) {
        likedCommentIds.value.delete(comment.id)
        comment.likes = Math.max(0, comment.likes - 1)
      } else {
        likedCommentIds.value.add(comment.id)
        comment.likes = (comment.likes || 0) + 1
      }

      // 发送请求
      loadingIds.value.add(`comment:${comment.id}`)
      await communityAPI.likeComment(comment.id)
      loadingIds.value.delete(`comment:${comment.id}`)
    } catch (error) {
      // 请求失败，回滚状态
      if (wasLiked) {
        likedCommentIds.value.add(comment.id)
      } else {
        likedCommentIds.value.delete(comment.id)
      }
      comment.likes = originalLikes

      ElMessage.error('点赞失败，请重试')
      console.error('toggleLikeComment error:', error)
    }
  }

  /**
   * 删除帖子
   */
  const deletePost = async (postId) => {
    return new Promise((resolve, reject) => {
      ElMessageBox.confirm('确定要删除这个帖子吗？删除后无法恢复。', '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            loadingIds.value.add(`delete:${postId}`)
            await communityAPI.deletePost(postId)
            loadingIds.value.delete(`delete:${postId}`)
            ElMessage.success('删除成功')
            resolve(true)
          } catch (error) {
            loadingIds.value.delete(`delete:${postId}`)
            ElMessage.error('删除失败: ' + (error.message || '请重试'))
            console.error('deletePost error:', error)
            reject(error)
          }
        })
        .catch(() => {
          reject(new Error('用户取消'))
        })
    })
  }

  /**
   * 报告内容
   */
  const reportContent = async (contentType, contentId, reason) => {
    if (!reason || reason.trim().length === 0) {
      ElMessage.error('请输入举报原因')
      return false
    }

    try {
      await communityAPI.reportContent(contentType, contentId, reason)
      ElMessage.success('举报成功，感谢你的贡献')
      return true
    } catch (error) {
      ElMessage.error('举报失败: ' + (error.message || '请重试'))
      console.error('reportContent error:', error)
      return false
    }
  }

  /**
   * 初始化点赞状态（从已有数据恢复）
   */
  const initializeLikeStatus = (posts = []) => {
    posts.forEach(post => {
      if (post.isLiked) {
        likedPostIds.value.add(post.id)
      }
      // 初始化评论的点赞状态
      if (post.comments && Array.isArray(post.comments)) {
        post.comments.forEach(comment => {
          if (comment.isLiked) {
            likedCommentIds.value.add(comment.id)
          }
        })
      }
    })
  }

  /**
   * 清空点赞状态
   */
  const clearLikeStatus = () => {
    likedPostIds.value.clear()
    likedCommentIds.value.clear()
  }

  /**
   * 是否在加载中
   */
  const isLoading = (id) => {
    return loadingIds.value.has(id)
  }

  return {
    // 状态
    likedPostIds,
    likedCommentIds,
    loadingIds,

    // 方法
    canEditPost,
    canDeletePost,
    isPostLiked,
    isCommentLiked,
    isLoading,
    toggleLikePost,
    toggleLikeComment,
    deletePost,
    reportContent,
    initializeLikeStatus,
    clearLikeStatus
  }
}
