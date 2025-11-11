<template>
  <div class="post-detail-page">
    <el-page-header title="返回" @back="$router.back()">
      <template #content>
        <span class="page-title">帖子详情</span>
      </template>
    </el-page-header>

    <div v-loading="loading" class="detail-container">
      <el-card v-if="post" class="post-card">
        <!-- 帖子头部 -->
        <div class="post-header">
          <div class="author-info">
            <el-avatar :src="post.userAvatar" :size="50" />
            <div class="author-details">
              <span class="author-name">{{ post.username }}</span>
              <span class="post-time">发布于 {{ formatTime(post.createdAt) }}</span>
            </div>
          </div>
          <div class="post-badges">
            <el-tag v-if="post.isPinned" type="danger">置顶</el-tag>
            <el-tag v-if="post.aiReviewScore" type="success">
              AI 评分: {{ (post.aiReviewScore * 100).toFixed(0) }}
            </el-tag>
          </div>
        </div>

        <!-- 帖子标题 -->
        <h1 class="post-title">{{ post.title }}</h1>

        <!-- 标签 -->
        <div v-if="post.tags && post.tags.length" class="post-tags">
          <el-tag v-for="tag in post.tags" :key="tag" type="info">
            {{ tag }}
          </el-tag>
        </div>

        <!-- 帖子内容 -->
        <div class="post-content" v-html="renderMarkdown(post.content)"></div>

        <!-- 帖子统计 -->
        <div class="post-stats">
          <el-button :icon="post.liked ? StarFilled : Star" @click="handleLike">
            {{ post.liked ? '已点赞' : '点赞' }} ({{ post.likeCount }})
          </el-button>
          <span class="stat-item">
            <el-icon><View /></el-icon> {{ post.viewCount }} 浏览
          </span>
          <span class="stat-item">
            <el-icon><ChatDotRound /></el-icon> {{ post.commentCount }} 评论
          </span>
        </div>
      </el-card>

      <!-- 评论区 -->
      <el-card v-if="post" class="comments-card">
        <template #header>
          <span class="card-title">评论 ({{ post.comments?.length || 0 }})</span>
        </template>

        <!-- 发表评论 -->
        <div class="comment-form">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
          />
          <el-button
            type="primary"
            :loading="submitting"
            style="margin-top: 10px"
            @click="submitComment"
          >
            发表评论
          </el-button>
        </div>

        <!-- 评论列表 -->
        <div class="comments-list">
          <div
            v-for="comment in post.comments"
            :key="comment.id"
            class="comment-item"
          >
            <el-avatar :src="comment.userAvatar" :size="40" />
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.username }}</span>
                <span class="comment-floor">#{{ comment.floorNumber }}</span>
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <div class="comment-actions">
                <el-button text size="small" @click="likeComment(comment.id)">
                  <el-icon><Star /></el-icon>
                  {{ comment.likeCount }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, ChatDotRound, Star, StarFilled } from '@element-plus/icons-vue'
import communityAPI from '@/api/communityWithCache'
import { likePost, createComment, likeComment as likeCommentApi } from '@/api/community'

const route = useRoute()

// 状态
const loading = ref(false)
const submitting = ref(false)
const post = ref(null)
const commentContent = ref('')

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

  return time.toLocaleDateString() + ' ' + time.toLocaleTimeString()
}

// 渲染 Markdown
const renderMarkdown = (content) => {
  // 简单的 Markdown 渲染（生产环境应使用专业库如 marked）
  return content
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/\n/g, '<br>')
}

// 获取帖子详情
const fetchPostDetail = async () => {
  loading.value = true
  try {
    const postId = route.params.id
    const res = await communityAPI.getPostDetail(postId)
    post.value = res.data
  } catch (error) {
    ElMessage.error('获取帖子详情失败')
    console.error('AxiosError', error)
  } finally {
    loading.value = false
  }
}

// 点赞帖子
const handleLike = async () => {
  try {
    const res = await likePost(post.value.id)
    post.value.liked = res.data.liked
    post.value.likeCount = res.data.likeCount
    ElMessage.success(res.data.liked ? '点赞成功' : '已取消点赞')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 发表评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  submitting.value = true
  try {
    const res = await createComment(post.value.id, {
      content: commentContent.value
    })
    post.value.comments.push(res.data)
    post.value.commentCount++
    commentContent.value = ''
    ElMessage.success('评论发表成功')
  } catch (error) {
    ElMessage.error('评论发表失败')
  } finally {
    submitting.value = false
  }
}

// 点赞评论
const likeComment = async (commentId) => {
  try {
    const res = await likeCommentApi(commentId)
    const comment = post.value.comments.find(c => c.id === commentId)
    if (comment) {
      comment.likeCount = res.data.likeCount
    }
    ElMessage.success(res.data.liked ? '点赞成功' : '已取消点赞')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchPostDetail()
})
</script>

<style scoped lang="scss">
.post-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.detail-container {
  margin-top: 20px;

  .post-card {
    margin-bottom: 20px;

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .author-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .author-details {
          display: flex;
          flex-direction: column;

          .author-name {
            font-size: 16px;
            font-weight: 600;
          }

          .post-time {
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .post-badges {
        display: flex;
        gap: 8px;
      }
    }

    .post-title {
      font-size: 28px;
      font-weight: 700;
      margin: 20px 0;
      line-height: 1.4;
    }

    .post-tags {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .post-content {
      font-size: 16px;
      line-height: 1.8;
      color: #303133;
      margin: 30px 0;
      min-height: 200px;
    }

    .post-stats {
      display: flex;
      align-items: center;
      gap: 20px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .comments-card {
    .card-title {
      font-size: 18px;
      font-weight: 600;
    }

    .comment-form {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .comments-list {
      .comment-item {
        display: flex;
        gap: 12px;
        padding: 16px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .comment-content {
          flex: 1;

          .comment-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .comment-author {
              font-weight: 600;
              font-size: 14px;
            }

            .comment-floor {
              font-size: 12px;
              color: #409eff;
            }

            .comment-time {
              font-size: 12px;
              color: #909399;
            }
          }

          .comment-text {
            font-size: 14px;
            line-height: 1.6;
            margin: 8px 0;
          }

          .comment-actions {
            display: flex;
            gap: 16px;
          }
        }
      }
    }
  }
}
</style>
