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

const loading = ref(false)
const comments = ref([])
const sortBy = ref('latest')
const totalComments = ref(0)
const pageSize = 20
const currentPage = ref(1)
const hasMore = ref(false)

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
  } catch (error) {
    ElMessage.error('评论发表失败')
  }
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
