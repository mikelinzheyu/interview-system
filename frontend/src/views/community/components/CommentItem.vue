<template>
  <div :class="['comment-item', { 'is-reply': isReply, 'is-self': isSelf }]">
    <!-- 评论内容 -->
    <div class="comment-content">
      <!-- 用户信息 -->
      <div class="comment-header">
        <div class="user-info">
          <img :src="comment.author.avatar" :alt="comment.author.name" class="avatar" />
          <div class="user-details">
            <span class="username">{{ comment.author.name }}</span>
            <span class="user-role" v-if="comment.author.role">
              {{ getRoleLabel(comment.author.role) }}
            </span>
          </div>
        </div>

        <!-- 操作菜单 -->
        <el-dropdown v-if="comment.canEdit || comment.canDelete">
          <el-button link type="info" size="small">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="comment.canEdit" @click="startEdit">
                <el-icon><Edit /></el-icon>
                编辑
              </el-dropdown-item>
              <el-dropdown-item v-if="comment.canDelete" @click="confirmDelete">
                <el-icon><Delete /></el-icon>
                删除
              </el-dropdown-item>
              <el-dropdown-item @click="reportComment">
                <el-icon><Warning /></el-icon>
                举报
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 评论文本 -->
      <div class="comment-text">
        <div v-if="!isEditing" class="text-content">
          <!-- 回复人提及 -->
          <span v-if="comment.replyTo" class="reply-mention">
            @{{ comment.replyTo.name }}
          </span>
          <!-- 文本内容 -->
          <span class="text">{{ comment.content }}</span>
          <!-- 编辑标记 -->
          <span v-if="comment.edited" class="edited-mark">(已编辑)</span>
        </div>

        <!-- 编辑模式 -->
        <el-input
          v-if="isEditing"
          v-model="editContent"
          type="textarea"
          :rows="3"
          placeholder="编辑评论..."
          :maxlength="5000"
        />
      </div>

      <!-- 编辑操作按钮 -->
      <div v-if="isEditing" class="edit-actions">
        <el-button size="small" type="primary" :loading="isSubmitting" @click="submitEdit">
          保存
        </el-button>
        <el-button size="small" @click="cancelEdit">取消</el-button>
      </div>

      <!-- 底部交互栏 -->
      <div class="comment-footer">
        <span class="timestamp">{{ formatTime(comment.createdAt) }}</span>

        <!-- 赞和回复按钮 -->
        <div class="action-buttons">
          <!-- 点赞 -->
          <el-button
            link
            size="small"
            type="primary"
            :class="{ 'is-liked': comment.isLiked }"
            @click="toggleLike"
          >
            <el-icon><Like /></el-icon>
            {{ comment.likeCount }}
          </el-button>

          <!-- 回复按钮 -->
          <el-button
            link
            size="small"
            type="info"
            @click="startReply"
          >
            <el-icon><ChatDotRound /></el-icon>
            回复
          </el-button>
        </div>
      </div>
    </div>

    <!-- 嵌套回复列表 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies-container">
      <div
        v-for="reply in displayReplies"
        :key="reply.id"
        class="reply-item"
      >
        <CommentItem
          :comment="reply"
          :is-reply="true"
          @reply="$emit('reply', $event)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @like="$emit('like', $event)"
        />
      </div>

      <!-- 展开/收起更多回复 -->
      <el-button
        v-if="comment.replies.length > 3 && !showAllReplies"
        link
        size="small"
        @click="showAllReplies = true"
      >
        查看全部 {{ comment.replies.length }} 条回复
      </el-button>
      <el-button
        v-if="showAllReplies && comment.replies.length > 3"
        link
        size="small"
        @click="showAllReplies = false"
      >
        收起
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Delete, Edit, MoreFilled, Warning, Like, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  isReply: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['reply', 'edit', 'delete', 'like'])

const isEditing = ref(false)
const isSubmitting = ref(false)
const editContent = ref(props.comment.content)
const showAllReplies = ref(false)

// 计算属性
const isSelf = computed(() => {
  // TODO: 比较当前用户 ID 和评论作者 ID
  return false
})

const displayReplies = computed(() => {
  if (showAllReplies.value || !props.comment.replies || props.comment.replies.length <= 3) {
    return props.comment.replies || []
  }
  return (props.comment.replies || []).slice(0, 3)
})

/**
 * 获取角色标签
 */
const getRoleLabel = (role) => {
  const labels = {
    admin: '管理员',
    moderator: '版主',
    author: '楼主'
  }
  return labels[role] || ''
}

/**
 * 格式化时间
 */
const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString()
}

/**
 * 开始编辑
 */
const startEdit = () => {
  isEditing.value = true
  editContent.value = props.comment.content
}

/**
 * 取消编辑
 */
const cancelEdit = () => {
  isEditing.value = false
  editContent.value = props.comment.content
}

/**
 * 提交编辑
 */
const submitEdit = async () => {
  if (!editContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  isSubmitting.value = true
  try {
    emit('edit', {
      id: props.comment.id,
      content: editContent.value
    })
    isEditing.value = false
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 删除评论
 */
const confirmDelete = () => {
  ElMessageBox.confirm(
    '确定要删除这条评论吗？',
    '提示',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      emit('delete', {
        id: props.comment.id,
        parentCommentId: props.isReply ? null : props.comment.id
      })
    })
    .catch(() => {
      // 用户取消
    })
}

/**
 * 举报评论
 */
const reportComment = () => {
  ElMessage.info('举报功能待实现')
}

/**
 * 点赞
 */
const toggleLike = () => {
  emit('like', {
    id: props.comment.id
  })
}

/**
 * 开始回复
 */
const startReply = () => {
  emit('reply', {
    id: props.comment.id,
    name: props.comment.author.name
  })
}
</script>

<style scoped lang="scss">
.comment-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;

  &:hover {
    border-color: #d9d9d9;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.is-reply {
    margin-left: 32px;
    background: #fafafa;
    border-color: #f0f0f0;
  }

  &.is-self {
    background: #f0f9ff;
    border-color: #b3d8ff;
  }

  .comment-content {
    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;

      .user-info {
        display: flex;
        gap: 8px;

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .username {
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }

          .user-role {
            font-size: 12px;
            color: #999;
            padding: 0 4px;
            background: #f0f0f0;
            border-radius: 2px;
            width: fit-content;
          }
        }
      }
    }

    .comment-text {
      margin: 8px 0 12px 40px;
      line-height: 1.6;
      color: #333;
      font-size: 14px;

      .text-content {
        .reply-mention {
          color: #409eff;
          font-weight: 600;
        }

        .edited-mark {
          font-size: 12px;
          color: #999;
          margin-left: 4px;
        }
      }

      :deep(.el-input__inner) {
        font-size: 14px;
        border-radius: 4px;
      }
    }

    .edit-actions {
      display: flex;
      gap: 8px;
      margin-left: 40px;
      margin-bottom: 8px;
    }

    .comment-footer {
      margin-left: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #999;

      .timestamp {
        cursor: default;
      }

      .action-buttons {
        display: flex;
        gap: 12px;

        :deep(.el-button) {
          padding: 0;
          font-size: 12px;

          &.is-liked {
            color: #ff4d4f;
          }

          &:hover {
            color: #409eff;
          }
        }
      }
    }
  }

  .replies-container {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;

    .reply-item {
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
