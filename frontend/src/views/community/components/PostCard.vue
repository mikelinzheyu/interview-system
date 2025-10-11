<template>
  <el-card class="post-card" shadow="hover" @click="goToPost">
    <div class="post-header">
      <div class="author-info">
        <el-avatar :src="post.userAvatar" :size="40" />
        <div class="author-details">
          <span class="author-name">{{ post.username }}</span>
          <span class="post-time">{{ formatTime(post.createdAt) }}</span>
        </div>
      </div>
      <el-tag v-if="post.isPinned" type="danger" size="small">置顶</el-tag>
    </div>

    <div class="post-content">
      <h3 class="post-title">{{ post.title }}</h3>
      <p class="post-excerpt">{{ getExcerpt(post.content) }}</p>

      <div v-if="post.tags && post.tags.length" class="post-tags">
        <el-tag
          v-for="tag in post.tags"
          :key="tag"
          size="small"
          type="info"
          @click.stop="searchByTag(tag)"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <div class="post-footer">
      <div class="post-stats">
        <span class="stat-item">
          <el-icon><View /></el-icon>
          {{ post.viewCount }}
        </span>
        <span class="stat-item">
          <el-icon><ChatDotRound /></el-icon>
          {{ post.commentCount }}
        </span>
        <span class="stat-item" @click.stop="handleLike">
          <el-icon :class="{ liked: post.liked }"><Star /></el-icon>
          {{ post.likeCount }}
        </span>
      </div>

      <el-tag v-if="post.aiReviewScore" size="small" effect="plain">
        AI 评分: {{ (post.aiReviewScore * 100).toFixed(0) }}
      </el-tag>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { View, ChatDotRound, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'tag-click'])

const router = useRouter()

// 格式化时间
const formatTime = (timeStr) => {
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

// 获取摘要
const getExcerpt = (content) => {
  const plainText = content.replace(/[#*`\n]/g, ' ').trim()
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText
}

// 跳转到帖子详情
const goToPost = () => {
  router.push(`/community/posts/${props.post.id}`)
}

// 点赞
const handleLike = () => {
  emit('like', props.post.id)
}

// 按标签搜索
const searchByTag = (tag) => {
  emit('tag-click', tag)
}
</script>

<style scoped lang="scss">
.post-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .author-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .author-details {
        display: flex;
        flex-direction: column;

        .author-name {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }

        .post-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .post-content {
    .post-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 12px 0;
      line-height: 1.4;

      &:hover {
        color: #409eff;
      }
    }

    .post-excerpt {
      font-size: 14px;
      color: #606266;
      line-height: 1.6;
      margin: 0 0 12px 0;
    }

    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;

      .el-tag {
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }

  .post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;

    .post-stats {
      display: flex;
      gap: 20px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: #909399;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: #409eff;
        }

        .el-icon {
          font-size: 16px;

          &.liked {
            color: #f56c6c;
          }
        }
      }
    }
  }
}
</style>
