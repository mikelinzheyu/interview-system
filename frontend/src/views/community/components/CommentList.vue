<template>
  <div class="comments-section">
    <!-- 评论标题和统计 -->
    <div class="section-header">
      <h3 class="section-title">
        <el-icon><ChatDotRound /></el-icon>
        评论 ({{ totalComments }})
      </h3>
      <el-button link @click="refresh" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 评论表单 -->
    <CommentForm
      :submit-loading="submitLoading"
      :replying-to="replyingTo"
      :replying-to-name="replyingToName"
      :error="error"
      @submit="handleSubmitComment"
      @cancel-reply="replyingTo = null"
    />

    <!-- 排序选项 -->
    <div class="sort-options">
      <span>排序：</span>
      <el-button-group>
        <el-button
          v-for="option in sortOptions"
          :key="option.value"
          :type="sortBy === option.value ? 'primary' : 'info'"
          size="small"
          link
          @click="changeSortBy(option.value)"
        >
          {{ option.label }}
        </el-button>
      </el-button-group>
    </div>

    <!-- 加载状态 -->
    <el-skeleton v-if="loading && comments.length === 0" :rows="5" animated />

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && comments.length === 0"
      description="暂无评论，快来发表一条吧！"
    />

    <!-- 评论列表 -->
    <div v-if="comments.length > 0" class="comments-list">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        @reply="handleReply"
        @edit="handleEditComment"
        @delete="handleDeleteComment"
        @like="handleLikeComment"
      />
    </div>

    <!-- 分页 -->
    <div v-if="pageInfo.pages > 1" class="pagination-container">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="totalComments"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="changePage"
        @size-change="changePageSize"
      />
    </div>

    <!-- 加载更多提示 -->
    <div v-if="loading && comments.length > 0" class="loading-more">
      <el-spinner size="small" />
      <span>加载中...</span>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error && comments.length > 0"
      :title="error"
      type="error"
      :closable="true"
      @close="error = null"
      style="margin-top: 16px"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ChatDotRound, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CommentForm from './CommentForm.vue'
import CommentItem from './CommentItem.vue'
import { useComments } from '@/composables/useComments'

const props = defineProps({
  postId: {
    type: String,
    required: true
  }
})

const {
  comments,
  loading,
  error: commentError,
  totalComments,
  currentPage,
  pageSize,
  sortBy,
  sortOptions,
  submitLoading,
  replyingTo: composableReplyingTo,
  pageInfo,
  fetchComments,
  submitComment,
  replyComment,
  deleteComment,
  editComment,
  toggleLikeComment,
  changeSortBy,
  changePage,
  changePageSize,
  refresh
} = useComments(props.postId)

// 本地状态
const replyingTo = ref(null)
const replyingToName = ref('')
const error = ref('')

/**
 * 挂载时获取评论
 */
onMounted(() => {
  fetchComments(1)
})

/**
 * 监听组件错误
 */
watch(commentError, (newError) => {
  if (newError) {
    error.value = newError
  }
})

/**
 * 提交新评论
 */
const handleSubmitComment = async (data) => {
  const success = await submitComment(data.content, data.mentions)
  if (success) {
    ElMessage.success(replyingTo.value ? '回复已发布' : '评论已发布')
    replyingTo.value = null
  }
}

/**
 * 处理回复
 */
const handleReply = (reply) => {
  replyingTo.value = reply.id
  replyingToName.value = reply.name
  // 滚动到评论表单
  setTimeout(() => {
    const form = document.querySelector('.comment-form')
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' })
    }
  }, 0)
}

/**
 * 处理编辑评论
 */
const handleEditComment = async (data) => {
  const success = await editComment(data.id, data.content)
  if (success) {
    ElMessage.success('评论已更新')
  }
}

/**
 * 处理删除评论
 */
const handleDeleteComment = async (data) => {
  const success = await deleteComment(data.id, data.parentCommentId)
  if (success) {
    ElMessage.success('评论已删除')
  }
}

/**
 * 处理点赞评论
 */
const handleLikeComment = async (data) => {
  const success = await toggleLikeComment(data.id)
  if (!success) {
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped lang="scss">
.comments-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;

    .section-title {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      color: #333;
    }
  }

  .sort-options {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #666;

    :deep(.el-button-group) {
      .el-button {
        padding: 4px 12px;
        font-size: 13px;
      }
    }
  }

  .comments-list {
    margin-top: 16px;
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
  }

  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    color: #999;
    font-size: 14px;
  }

  :deep(.el-empty) {
    padding: 40px 0;
  }

  :deep(.el-skeleton) {
    padding: 16px;
  }
}
</style>
