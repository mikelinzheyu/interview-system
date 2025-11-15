<template>
  <div class="comments-section">
    <div class="section-header">
      <h3>评论 ({{ totalComments }})</h3>
      <el-select v-model="sortBy" placeholder="排序方式" size="small" class="sort-select">
        <el-option label="最新" value="latest" />
        <el-option label="最热" value="hot" />
        <el-option label="最多回复" value="replies" />
      </el-select>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-container">
      <el-alert
        :title="error"
        type="error"
        :closable="true"
        show-icon
        @close="error = null"
      >
        <template #default>
          {{ error }}
          <el-button
            v-if="isOnline"
            link
            type="primary"
            size="small"
            @click="handleRetry"
            style="margin-left: 12px;"
          >
            重试
          </el-button>
        </template>
      </el-alert>
    </div>

    <!-- 评论表单 -->
    <CommentForm :post-id="postId" @submit="handleCommentSubmit" />

    <!-- 评论列表 -->
    <CommentList
      :comments="sortedComments"
      :post-id="postId"
      :loading="loading"
      @reply="handleReply"
      @delete="handleDelete"
    />

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more">
      <el-button text type="primary" @click="handleLoadMore">
        加载更多评论
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommentForm from './CommentsSection/CommentForm.vue'
import CommentList from './CommentsSection/CommentList.vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
  initialComments: {
    type: Array,
    default: () => [],
  },
})

// 网络状态监测
const { isOnline } = useNetworkStatus()

const loading = ref(false)
const comments = ref([])
const sortBy = ref('latest')
const totalComments = ref(0)
const pageSize = 20
const currentPage = ref(1)
const hasMore = ref(false)
const error = ref(null)
const lastCommentData = ref(null) // 保存最后的评论数据，用于重试

// 排序评论
const sortedComments = computed(() => {
  const sorted = [...comments.value]

  switch (sortBy.value) {
    case 'hot':
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0))
    case 'replies':
      return sorted.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0))
    case 'latest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
})

const handleCommentSubmit = async (commentData) => {
  // 检查网络连接
  if (!isOnline.value) {
    error.value = '网络连接已断开，无法提交评论。请检查网络后重试。'
    lastCommentData.value = commentData
    return
  }

  error.value = null
  lastCommentData.value = commentData

  try {
    // 添加到列表
    const newComment = {
      id: `comment-${Date.now()}`,
      ...commentData,
      replies: [],
      likes: 0,
      createdAt: new Date().toISOString(),
    }

    comments.value.unshift(newComment)
    totalComments.value++
    ElMessage.success('评论发表成功')
    lastCommentData.value = null // 清空重试数据
  } catch (err) {
    error.value = '发表评论失败，请检查网络后重试'
    console.error('Failed to submit comment:', err)
  }
}

/**
 * 重试提交评论
 */
const handleRetry = () => {
  if (!lastCommentData.value) {
    ElMessage.warning('没有需要重试的评论数据')
    return
  }

  if (!isOnline.value) {
    error.value = '网络仍然未连接，请等待网络恢复'
    return
  }

  error.value = null
  handleCommentSubmit(lastCommentData.value)
}

const handleReply = async (data) => {
  try {
    // 查找评论并添加回复
    const comment = comments.value.find(c => c.id === data.commentId)
    if (comment) {
      const reply = {
        id: `reply-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      }
      if (!comment.replies) {
        comment.replies = []
      }
      comment.replies.push(reply)
      ElMessage.success('回复成功')
    }
  } catch (error) {
    ElMessage.error('回复失败')
  }
}

const handleDelete = async (commentId) => {
  try {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index > -1) {
      comments.value.splice(index, 1)
      totalComments.value--
      ElMessage.success('删除成功')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleLoadMore = async () => {
  currentPage.value++
  // TODO: 调用 API 加载更多评论
  ElMessage.info('加载更多评论...')
}

const fetchComments = async () => {
  loading.value = true
  try {
    // TODO: 调用 API 获取评论列表
    comments.value = props.initialComments || []
    totalComments.value = comments.value.length
  } catch (error) {
    ElMessage.error('获取评论失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchComments()
})
</script>

<style scoped lang="scss">
.comments-section {
  padding-top: 32px;
  border-top: 2px solid #f0f0f0;

  // 错误提示
  .error-container {
    margin-bottom: 20px;

    :deep(.el-alert) {
      padding: 12px 16px;

      .el-alert__content {
        display: flex;
        align-items: center;
      }
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .sort-select {
      width: 120px;
    }
  }

  .load-more {
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }
}
</style>
