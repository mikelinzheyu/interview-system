<template>
  <div class="comment-item">
    <!-- 评论头部 -->
    <div class="comment-header">
      <div class="author-info">
        <el-avatar :src="comment.avatar" :size="40" />
        <div class="author-details">
          <span class="author-name">{{ comment.author }}</span>
          <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
        </div>
      </div>
      <div class="comment-floor">{{ floorNumber }}</div>
    </div>

    <!-- 评论内容 -->
    <div class="comment-content">
      <MarkdownPreview :content="comment.content" />
    </div>

    <!-- 评论交互 -->
    <div class="comment-actions">
      <el-button text size="small" @click="toggleLike">
        <el-icon>
          <StarFilled v-if="liked" />
          <Star v-else />
        </el-icon>
        {{ comment.likes || 0 }}
      </el-button>
      <el-button text size="small" @click="toggleReplyForm">
        <el-icon><ChatDotRound /></el-icon>
        回复 ({{ comment.replies?.length || 0 }})
      </el-button>
      <el-button v-if="canDelete" text type="danger" size="small" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </div>

    <!-- 回复表单 -->
    <ReplyForm
      v-if="showReplyForm"
      :comment-id="comment.id"
      :placeholder="`回复 ${comment.author}...`"
      @submit="handleReplySubmit"
      @cancel="showReplyForm = false"
    />

    <!-- 二级回复列表 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies">
      <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
        <div class="reply-header">
          <div class="author-info">
            <el-avatar :src="reply.avatar" :size="32" />
            <div class="author-details">
              <span class="author-name">{{ reply.author }}</span>
              <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div class="reply-content">
          <span class="reply-to" v-if="reply.replyTo">回复 @{{ reply.replyTo }}:</span>
          <MarkdownPreview :content="reply.content" />
        </div>

        <div class="reply-actions">
          <el-button text size="small" @click="handleReplyLike(reply.id)">
            <el-icon>
              <StarFilled v-if="replyLiked[reply.id]" />
              <Star v-else />
            </el-icon>
            {{ reply.likes || 0 }}
          </el-button>
          <el-button v-if="canDeleteReply(reply)" text type="danger" size="small" @click="handleReplyDelete(reply.id)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, StarFilled, ChatDotRound, Delete } from '@element-plus/icons-vue'
import MarkdownPreview from './MarkdownPreview.vue'
import ReplyForm from './ReplyForm.vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
  floorNumber: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits(['reply', 'delete'])

const showReplyForm = ref(false)
const liked = ref(false)
const replyLiked = ref({})

// 当前用户 ID（从认证信息获取）
const currentUserId = ref('current-user-id')

// 权限检查
const canDelete = computed(() => {
  return props.comment.authorId === currentUserId.value || true // TODO: 检查是否为管理员
})

const canDeleteReply = (reply) => {
  return reply.authorId === currentUserId.value || true // TODO: 检查是否为管理员
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '未知'
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now - time

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return time.toLocaleDateString()
}

const toggleLike = async () => {
  try {
    // TODO: 调用 API 点赞
    liked.value = !liked.value
    props.comment.likes = (props.comment.likes || 0) + (liked.value ? 1 : -1)
    ElMessage.success(liked.value ? '点赞成功' : '已取消点赞')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const toggleReplyForm = () => {
  showReplyForm.value = !showReplyForm.value
}

const handleReplySubmit = async (data) => {
  try {
    emit('reply', {
      commentId: props.comment.id,
      ...data,
    })
    showReplyForm.value = false
  } catch (error) {
    ElMessage.error('回复失败')
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    emit('delete', props.comment.id)
  } catch (error) {
    // 用户取消了删除
  }
}

const handleReplyLike = async (replyId) => {
  try {
    replyLiked.value[replyId] = !replyLiked.value[replyId]
    const reply = props.comment.replies?.find(r => r.id === replyId)
    if (reply) {
      reply.likes = (reply.likes || 0) + (replyLiked.value[replyId] ? 1 : -1)
    }
    ElMessage.success(replyLiked.value[replyId] ? '点赞成功' : '已取消点赞')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleReplyDelete = async (replyId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条回复吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const index = props.comment.replies.findIndex(r => r.id === replyId)
    if (index > -1) {
      props.comment.replies.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch (error) {
    // 用户取消了删除
  }
}
</script>

<style scoped lang="scss">
.comment-item {
  padding: 16px 0;

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .author-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .author-details {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .author-name {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }

        .comment-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .comment-floor {
      font-size: 12px;
      color: #409eff;
      font-weight: 600;
    }
  }

  .comment-content {
    margin: 12px 0 12px 52px;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 6px;
    border-left: 3px solid #409eff;
  }

  .comment-actions {
    display: flex;
    gap: 16px;
    margin-left: 52px;
    padding: 8px 0;

    :deep(.el-button) {
      font-size: 12px;
    }
  }

  .replies {
    margin-left: 52px;
    margin-top: 16px;
    padding: 12px;
    background: #fafbfc;
    border-radius: 6px;
    border: 1px dashed #e0e0e0;

    .reply-item {
      padding: 12px 0;

      &:not(:last-child) {
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 12px;
      }

      .reply-header {
        margin-bottom: 8px;

        .author-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .author-details {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .author-name {
              font-size: 13px;
              font-weight: 600;
              color: #303133;
            }

            .reply-time {
              font-size: 11px;
              color: #909399;
            }
          }
        }
      }

      .reply-content {
        margin-bottom: 8px;
        font-size: 13px;
        line-height: 1.6;

        .reply-to {
          color: #409eff;
          font-weight: 500;
          margin-right: 4px;
        }
      }

      .reply-actions {
        display: flex;
        gap: 16px;

        :deep(.el-button) {
          font-size: 11px;
        }
      }
    }
  }
}
</style>
