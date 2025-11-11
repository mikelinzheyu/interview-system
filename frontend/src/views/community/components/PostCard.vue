<template>
  <el-card class="post-card" shadow="hover">
    <div class="post-header">
      <div class="author-info" @click.stop="goToAuthor">
        <el-avatar :src="post.author?.avatar" :size="40" />
        <div class="author-details">
          <span class="author-name">{{ post.author?.name || '匿名' }}</span>
          <span class="post-time">{{ formatTime(post.createdAt) }}</span>
        </div>
      </div>
      <div class="post-tags-header">
        <el-tag v-if="post.solved" type="success" size="small">已解决</el-tag>
        <el-tag v-if="post.pinned" type="danger" size="small">置顶</el-tag>
      </div>
    </div>

    <div class="post-content" @click="goToPost">
      <h3 class="post-title">{{ post.title }}</h3>
      <p class="post-excerpt">{{ getExcerpt(post.content) }}</p>

      <div v-if="post.tags && post.tags.length" class="post-tags">
        <el-tag
          v-for="tag in post.tags"
          :key="tag"
          size="small"
          type="info"
          @click.stop="$emit('tag-click', tag)"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <div class="post-footer">
      <div class="post-stats">
        <span class="stat-item">
          <el-icon><View /></el-icon>
          {{ post.viewCount || 0 }}
        </span>
        <span class="stat-item">
          <el-icon><ChatDotRound /></el-icon>
          {{ post.commentCount || 0 }}
        </span>
        <span
          class="stat-item like-item"
          :class="{ liked: isLiked }"
          @click.stop="handleLike"
        >
          <el-icon :class="{ 'is-liked': isLiked }"><Like /></el-icon>
          {{ post.likes || 0 }}
        </span>
      </div>

      <!-- 操作菜单 -->
      <div class="post-actions">
        <el-button
          v-if="canEdit"
          link
          type="primary"
          size="small"
          @click.stop="handleEdit"
        >
          编辑
        </el-button>
        <el-button
          v-if="canDelete"
          link
          type="danger"
          size="small"
          @click.stop="handleDelete"
        >
          删除
        </el-button>
        <el-dropdown @command="handleCommand">
          <el-button link type="info" size="small">
            更多
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="report">
                <el-icon><Warning /></el-icon>举报
              </el-dropdown-item>
              <el-dropdown-item command="share">
                <el-icon><Share /></el-icon>分享
              </el-dropdown-item>
              <el-dropdown-item v-if="!isCollected" command="collect">
                <el-icon><Collection /></el-icon>收藏
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 举报对话框 -->
    <el-dialog v-model="reportDialogVisible" title="举报帖子" width="400px">
      <el-form :model="reportForm">
        <el-form-item label="举报原因" required>
          <el-select v-model="reportForm.reason" placeholder="请选择原因">
            <el-option label="垃圾/广告" value="spam" />
            <el-option label="不适当内容" value="inappropriate" />
            <el-option label="骚扰/侮辱" value="harassment" />
            <el-option label="侵犯版权" value="copyright" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input
            v-model="reportForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细说明原因（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reportSubmitting" @click="submitReport">
          确认举报
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  View,
  ChatDotRound,
  Like,
  Warning,
  Share,
  Collection,
  ArrowDown
} from '@element-plus/icons-vue'
import communityAPI from '@/api/communityWithCache'
import { usePostActions } from '@/composables/usePostActions'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['like', 'tag-click', 'delete'])

const router = useRouter()
const { canEdit, canDelete } = useAuth()
const { toggleLikePost, isPostLiked, reportContent } = usePostActions()

// 举报相关
const reportDialogVisible = ref(false)
const reportSubmitting = ref(false)
const reportForm = ref({
  reason: '',
  description: ''
})

// 本地状态
const isCollected = ref(false)

// 计算属性
const isLiked = computed(() => isPostLiked(props.post.id))

/**
 * 格式化时间
 */
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

/**
 * 获取摘要
 */
const getExcerpt = (content) => {
  if (!content) return '暂无内容'
  const plainText = content.replace(/[#*`\n]/g, ' ').trim()
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText
}

/**
 * 跳转到帖子详情
 */
const goToPost = () => {
  router.push(`/community/posts/${props.post.id}`)
}

/**
 * 跳转到作者页面
 */
const goToAuthor = () => {
  if (props.post.author?.userId) {
    router.push(`/user/${props.post.author.userId}`)
  }
}

/**
 * 点赞处理
 */
const handleLike = async () => {
  if (props.loading) return
  await toggleLikePost(props.post)
  emit('like', props.post)
}

/**
 * 编辑帖子
 */
const handleEdit = () => {
  router.push(`/community/posts/${props.post.id}/edit`)
}

/**
 * 删除帖子
 */
const handleDelete = async () => {
  try {
    await communityAPI.deletePost(props.post.id)
    ElMessage.success('删除成功')
    emit('delete', props.post.id)
  } catch (error) {
    ElMessage.error('删除失败: ' + (error.message || '请重试'))
  }
}

/**
 * 处理下拉菜单命令
 */
const handleCommand = (command) => {
  switch (command) {
    case 'report':
      reportDialogVisible.value = true
      break
    case 'share':
      handleShare()
      break
    case 'collect':
      handleCollect()
      break
  }
}

/**
 * 分享帖子
 */
const handleShare = () => {
  const url = `${window.location.origin}/community/posts/${props.post.id}`
  const text = `《${props.post.title}》- 来自社区论坛`

  // 优先使用 Web Share API
  if (navigator.share) {
    navigator.share({
      title: '社区论坛',
      text: text,
      url: url
    }).catch(err => console.log('Share cancelled'))
  } else {
    // 降级方案：复制到剪贴板
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
  }
}

/**
 * 收藏帖子
 */
const handleCollect = async () => {
  try {
    // TODO: 调用后端 API 保存收藏
    isCollected.value = true
    ElMessage.success('收藏成功')
  } catch (error) {
    ElMessage.error('收藏失败')
  }
}

/**
 * 提交举报
 */
const submitReport = async () => {
  if (!reportForm.value.reason) {
    ElMessage.error('请选择举报原因')
    return
  }

  reportSubmitting.value = true
  try {
    await reportContent('post', props.post.id, reportForm.value.reason)
    ElMessage.success('举报成功')
    reportDialogVisible.value = false
    reportForm.value = { reason: '', description: '' }
  } catch (error) {
    ElMessage.error('举报失败: ' + (error.message || '请重试'))
  } finally {
    reportSubmitting.value = false
  }
}

</script>

<style scoped lang="scss">
.post-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .post-title {
      color: #409eff;
    }
  }

  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f5f5f5;

    .author-info {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: opacity 0.3s;

      &:hover {
        opacity: 0.8;
      }

      .author-details {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .author-name {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .post-time {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }

    .post-tags-header {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  }

  .post-content {
    padding: 0;
    margin-bottom: 12px;

    .post-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
      line-height: 1.5;
      transition: color 0.3s;
      word-break: break-word;
    }

    .post-excerpt {
      font-size: 14px;
      color: #606266;
      line-height: 1.6;
      margin: 0 0 10px 0;
      word-break: break-word;
    }

    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .el-tag {
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }
      }
    }
  }

  .post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f5f5f5;
    gap: 12px;

    .post-stats {
      display: flex;
      gap: 24px;
      flex: 1;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #909399;
        cursor: pointer;
        transition: all 0.3s;
        white-space: nowrap;

        &:hover {
          color: #409eff;
        }

        &.like-item {
          &.liked {
            color: #f56c6c;

            .el-icon.is-liked {
              color: #f56c6c;
              animation: heart-beat 0.3s ease-in-out;
            }
          }

          &:hover:not(.liked) {
            color: #f56c6c;
          }
        }

        .el-icon {
          font-size: 16px;
          transition: all 0.3s;
        }
      }
    }

    .post-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;

      :deep(.el-button) {
        padding: 0;
        height: auto;
        line-height: normal;
      }
    }
  }
}

@keyframes heart-beat {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
