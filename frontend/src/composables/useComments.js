/**
 * useComments - 评论系统管理
 *
 * 功能：
 * - 获取帖子评论列表（支持分页）
 * - 发表新评论
 * - 回复评论（嵌套）
 * - 删除评论（权限检查）
 * - 编辑评论
 * - 点赞评论
 * - @ 提及用户
 */

import { ref, computed, reactive } from 'vue'
import communityAPI from '@/api/communityWithCache'
import { useAuth } from './useAuth'
import { useDebounce } from './useDebounce'

export function useComments(postId) {
  // 状态管理
  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)
  const totalComments = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // 提交表单状态
  const submitLoading = ref(false)
  const replyingTo = ref(null) // 正在回复哪个评论的 ID

  // 权限管理
  const { canEdit, canDelete, hasPermission } = useAuth()

  // 排序选项
  const sortBy = ref('latest') // latest, hot, oldest
  const sortOptions = [
    { label: '最新', value: 'latest' },
    { label: '最热', value: 'hot' },
    { label: '最早', value: 'oldest' }
  ]

  /**
   * 获取评论列表
   */
  const fetchComments = async (page = 1) => {
    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.getComments(postId, {
        page,
        pageSize: pageSize.value,
        sortBy: sortBy.value
      })

      if (response.data) {
        comments.value = response.data
        totalComments.value = response.total || 0
        currentPage.value = page
      }
    } catch (err) {
      error.value = err.message || '获取评论列表失败'
      console.error('Failed to fetch comments:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 发表评论
   * @param {string} content - 评论内容
   * @param {string[]} mentions - @ 提及的用户 ID
   */
  const submitComment = async (content, mentions = []) => {
    if (!content.trim()) {
      error.value = '评论内容不能为空'
      return false
    }

    submitLoading.value = true
    error.value = null

    try {
      const response = await communityAPI.createComment(postId, {
        content: content.trim(),
        mentions,
        parentCommentId: replyingTo.value
      })

      if (response.data) {
        // 乐观更新：立即添加到列表
        const newComment = {
          ...response.data,
          canEdit: true,
          canDelete: true,
          isLiked: false,
          likeCount: 0,
          replies: []
        }

        if (replyingTo.value) {
          // 添加到父评论的回复列表
          const parentComment = comments.value.find(c => c.id === replyingTo.value)
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = []
            }
            parentComment.replies.push(newComment)
          }
        } else {
          // 添加到顶级评论
          comments.value.unshift(newComment)
          totalComments.value++
        }

        // 重置表单
        replyingTo.value = null

        return true
      }
    } catch (err) {
      error.value = err.message || '发表评论失败'
      console.error('Failed to submit comment:', err)
      return false
    } finally {
      submitLoading.value = false
    }
  }

  /**
   * 回复评论
   * @param {string} commentId - 被回复的评论 ID
   * @param {string} content - 回复内容
   * @param {string[]} mentions - @ 提及的用户 ID
   */
  const replyComment = async (commentId, content, mentions = []) => {
    replyingTo.value = commentId
    return submitComment(content, mentions)
  }

  /**
   * 删除评论
   * @param {string} commentId - 评论 ID
   * @param {string} parentCommentId - 父评论 ID（如果是回复）
   */
  const deleteComment = async (commentId, parentCommentId = null) => {
    if (!hasPermission('delete_comment')) {
      error.value = '您没有权限删除评论'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await communityAPI.deleteComment(commentId)

      if (parentCommentId) {
        // 从回复列表中移除
        const parentComment = comments.value.find(c => c.id === parentCommentId)
        if (parentComment && parentComment.replies) {
          parentComment.replies = parentComment.replies.filter(r => r.id !== commentId)
        }
      } else {
        // 从顶级评论中移除
        comments.value = comments.value.filter(c => c.id !== commentId)
        totalComments.value--
      }

      return true
    } catch (err) {
      error.value = err.message || '删除评论失败'
      console.error('Failed to delete comment:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 编辑评论
   * @param {string} commentId - 评论 ID
   * @param {string} content - 新内容
   */
  const editComment = async (commentId, content) => {
    if (!hasPermission('edit_comment')) {
      error.value = '您没有权限编辑评论'
      return false
    }

    if (!content.trim()) {
      error.value = '评论内容不能为空'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.updateComment(commentId, {
        content: content.trim()
      })

      if (response.data) {
        // 更新列表中的评论
        const updateCommentInList = (commentsList) => {
          const index = commentsList.findIndex(c => c.id === commentId)
          if (index !== -1) {
            commentsList[index] = { ...commentsList[index], ...response.data }
            return true
          }

          // 递归搜索回复
          for (const comment of commentsList) {
            if (comment.replies && updateCommentInList(comment.replies)) {
              return true
            }
          }
          return false
        }

        updateCommentInList(comments.value)
        return true
      }
    } catch (err) {
      error.value = err.message || '编辑评论失败'
      console.error('Failed to edit comment:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 点赞/取消点赞评论
   * @param {string} commentId - 评论 ID
   */
  const toggleLikeComment = async (commentId) => {
    try {
      const response = await communityAPI.likeComment(commentId)

      if (response.data) {
        // 更新列表中的点赞状态
        const updateLikeInList = (commentsList) => {
          const comment = commentsList.find(c => c.id === commentId)
          if (comment) {
            comment.isLiked = response.data.liked
            comment.likeCount = response.data.likeCount
            return true
          }

          // 递归搜索回复
          for (const c of commentsList) {
            if (c.replies && updateLikeInList(c.replies)) {
              return true
            }
          }
          return false
        }

        updateLikeInList(comments.value)
        return true
      }
    } catch (err) {
      console.error('Failed to like comment:', err)
      return false
    }
  }

  /**
   * 改变排序方式
   */
  const changeSortBy = async (newSort) => {
    sortBy.value = newSort
    currentPage.value = 1
    await fetchComments(1)
  }

  /**
   * 改变分页
   */
  const changePage = async (page) => {
    currentPage.value = page
    await fetchComments(page)
  }

  /**
   * 改变每页数量
   */
  const changePageSize = async (size) => {
    pageSize.value = size
    currentPage.value = 1
    await fetchComments(1)
  }

  /**
   * 刷新评论列表
   */
  const refresh = async () => {
    await fetchComments(currentPage.value)
  }

  /**
   * 计算属性：分页信息
   */
  const pageInfo = computed(() => {
    const total = totalComments.value
    const pages = Math.ceil(total / pageSize.value)
    return {
      total,
      pages,
      hasNextPage: currentPage.value < pages,
      hasPrevPage: currentPage.value > 1
    }
  })

  /**
   * 计算属性：显示的评论（支持虚拟滚动优化）
   */
  const displayComments = computed(() => {
    return comments.value.map(comment => ({
      ...comment,
      canEdit: canEdit(comment),
      canDelete: canDelete(comment),
      // 递归处理回复
      replies: (comment.replies || []).map(reply => ({
        ...reply,
        canEdit: canEdit(reply),
        canDelete: canDelete(reply)
      }))
    }))
  })

  return {
    // 数据
    comments: displayComments,
    loading,
    error,
    totalComments,
    currentPage,
    pageSize,
    sortBy,
    sortOptions,
    submitLoading,
    replyingTo,
    pageInfo,

    // 方法
    fetchComments,
    submitComment,
    replyComment,
    deleteComment,
    editComment,
    toggleLikeComment,
    changeSortBy,
    changePage,
    changePageSize,
    refresh,

    // 工具
    canEdit,
    canDelete,
    hasPermission
  }
}
