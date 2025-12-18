<template>
  <div class="main-content-container">
    <!-- 加载中状态 -->
    <el-card v-if="loading" class="loading-card">
      <el-skeleton :rows="5" animated />
    </el-card>

    <!-- 文章内容 -->
    <div v-else-if="post" class="post-wrapper">
      <!-- 文章头部 -->
      <div class="article-header">
        <h1 class="article-title">{{ post.title }}</h1>

        <!-- 元信息 -->
        <div class="article-meta">
          <div class="meta-left">
            <el-avatar :src="post.author.avatar" :size="36" />
            <div class="author-info">
              <p class="author-name">{{ post.author.name }}</p>
              <span class="publish-time">
                发布于 {{ formatTime(post.createdAt) }}
              </span>
            </div>
          </div>

          <div class="meta-right">
            <el-tag
              v-if="post.isPinned"
              type="danger"
              size="small"
            >
              置顶
            </el-tag>
            <el-tag
              v-if="post.aiReviewScore"
              type="success"
              size="small"
            >
              AI 评分: {{ (post.aiReviewScore * 100).toFixed(0) }}
            </el-tag>
          </div>
        </div>
        <!-- 分享对话框 -->
        <el-dialog
          v-model="shareDialogVisible"
          title="分享文章"
          width="420px"
          :close-on-click-modal="true"
          :destroy-on-close="true"
        >
          <div style="display:flex; flex-direction: column; gap: 12px;">
            <div>将以下链接分享给好友：</div>
            <el-input :model-value="shareUrl()" readonly type="text" />
            <div style="display:flex; gap: 8px; justify-content:flex-end;">
              <el-button @click="shareDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="copyShareLink">复制链接</el-button>
            </div>
          </div>
        </el-dialog>

        <!-- 标签 -->
        <div v-if="post.tags && post.tags.length" class="article-tags">
          <el-tag
            v-for="tag in post.tags"
            :key="tag"
            type="info"
            size="small"
          >
            {{ tag }}
          </el-tag>
        </div>

        <!-- 分隔线 -->
        <el-divider />
      </div>

      <!-- 文章正文 -->
      <div class="article-body">
        <MarkdownRenderer :content="post.content" />
      </div>

      <!-- 文章尾部 -->
      <div class="article-footer">
        <el-divider />

        <!-- 交互栏 -->
        <div class="interaction-bar">
          <div class="left-actions">
            <el-button
              :type="post.liked ? 'primary' : 'default'"
              :icon="post.liked ? StarFilled : Star"
              @click="handleLike"
            >
              {{ post.liked ? '已点赞' : '点赞' }}
              <span v-if="post.likeCount" class="count">{{ post.likeCount }}</span>
            </el-button>

            <el-button
              type="default"
              :icon="ChatDotRound"
              @click="scrollToComments"
            >
              评论
              <span v-if="post.commentCount" class="count">{{ post.commentCount }}</span>
            </el-button>

            <el-button
              type="default"
              :icon="Collection"
              @click="handleCollect"
            >
              {{ post.collected ? '已收藏' : '收藏' }}
            </el-button>
          </div>

          <div class="right-actions">
            <el-button
              type="default"
              :icon="Share"
              @click="triggerShare"
            >
              分享
            </el-button>

            <el-button
              type="default"
              :icon="MoreFilled"
              @click="handleMore"
            >
              更多
            </el-button>
          </div>
        </div>

        <!-- 作者签名区 -->
        <div class="author-signature">
          <el-avatar :src="post.author.avatar" :size="64" />
          <div class="signature-info">
            <h4>{{ post.author.name }}</h4>
            <p class="signature-bio">{{ post.author.bio }}</p>
            <div class="signature-stats">
              <span>{{ post.author.followerCount }} 粉丝</span>
              <span>{{ post.author.articleCount }} 篇文章</span>
            </div>
          </div>
          <el-button type="primary" size="large">关注</el-button>
        </div>
      </div>

      <!-- 版权声明和 AI 评分 -->
      <PostCopyright
        :author="post.author"
        :post-id="post.id"
        :ai-score="{
          overall: (post.aiReviewScore || 0) * 10,
          contentQuality: 9,
          technicalDepth: 8,
          readability: 9,
          practicality: 8,
          comment: '这是一篇高质量的技术文章，内容详实，技术深度适中，可读性强，实用性高。'
        }"
      />

      <!-- 相关推荐 -->
      <RelatedPosts
        :post-id="post.id"
        :tags="post.tags"
        :category="post.category"
      />

      <!-- 评论区 -->
      <CommentsSection ref="commentsRef" :post-id="post.id" :initial-comments="post.comments || []" />
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="文章不存在" />
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Star,
  StarFilled,
  ChatDotRound,
  Collection,
  Share,
  MoreFilled,
} from '@element-plus/icons-vue'
import MarkdownRenderer from './MarkdownRenderer.vue'
import CommentsSection from './CommentsSection.vue'
import PostCopyright from '../components/PostCopyright.vue'
import RelatedPosts from '../components/RelatedPosts.vue'

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
})

const loading = ref(false)
const post = ref(null)
const commentsRef = ref(null)
const shareDialogVisible = ref(false)
// 设备与安全环境检测
const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
const isSecure = () => window.isSecureContext || ['localhost', '127.0.0.1', '::1'].includes(location.hostname) || location.protocol === 'https:'
const canUseWebShare = () => typeof navigator.share === 'function' && isMobileDevice() && isSecure()

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

const handleLike = async () => {
  if (!post.value) return
  // TODO: 调用 API 点赞
  post.value.liked = !post.value.liked
  post.value.likeCount += post.value.liked ? 1 : -1
  ElMessage.success(post.value.liked ? '点赞成功' : '已取消点赞')
}

const handleCollect = async () => {
  if (!post.value) return
  // TODO: 调用 API 收藏
  post.value.collected = !post.value.collected
  ElMessage.success(post.value.collected ? '收藏成功' : '已取消收藏')
}

const handleShare = () => {
  // 使用自定义对话框，避免系统分享面板在部分浏览器卡住
  shareDialogVisible.value = true
  return
  const url = `${window.location.origin}/community/posts/${props.postId}`
  const text = `《${post.value.title}》- 来自社区论坛`

  if (navigator.share) {
    navigator.share({
      title: '社区论坛',
      text: text,
      url: url,
    }).catch(err => console.log('Share cancelled'))
  } else {
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
  }
}

// 分享链接与复制
const shareUrl = () => `${window.location.origin}/community/posts/${props.postId}`

const copyShareLink = async () => {
  const url = shareUrl()
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    ElMessage.success('链接已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败，请手动复制链接')
  }
}

// 移动端安全上下文优先使用系统分享，否则显示对话框
const triggerShare = () => {
  const url = shareUrl()
  const title = post.value?.title || '社区论坛'
  const text = `分享一篇好文：${title}`

  if (canUseWebShare()) {
    navigator.share({ title, text, url })
      .catch((err) => {
        if (err && (err.name === 'AbortError' || /cancel/i.test(String(err.message || '')))) {
          ElMessage.info('已取消分享')
        } else {
          shareDialogVisible.value = true
        }
      })
  } else {
    shareDialogVisible.value = true
  }
}

const handleMore = () => {
  ElMessage.info('更多功能开发中...')
}

const scrollToComments = () => {
  if (commentsRef.value) {
    commentsRef.value.$el.scrollIntoView({ behavior: 'smooth' })
  }
}

const fetchPostDetail = async () => {
  loading.value = true
  try {
    // TODO: 调用 API 获取文章详情
    // const res = await communityAPI.getPostDetail(props.postId)
    post.value = {
      id: props.postId,
      title: 'Vue 3 性能优化的完整指南',
      content: `# Vue 3 性能优化

## 介绍
Vue 3 是一个现代的 JavaScript 框架，提供了许多性能优化的特性。

## Composition API
Composition API 提供了一种更灵活的方式来组织组件逻辑。

\`\`\`javascript
import { ref, computed } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)

    return {
      count,
      doubled
    }
  }
}
\`\`\`

## 响应式优化
Vue 3 使用 Proxy 实现了更高效的响应式系统。

### 特点
- 完整的响应式 API
- 自动依赖收集
- 高性能的更新机制

## 总结
通过使用 Vue 3 的最新特性，我们可以显著提升应用的性能和开发体验。`,
      tags: ['Vue 3', 'JavaScript', '性能优化'],
      isPinned: false,
      aiReviewScore: 0.95,
      liked: false,
      collected: false,
      likeCount: 234,
      commentCount: 18,
      viewCount: 1250,
      createdAt: new Date(Date.now() - 2 * 24 * 3600000),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600000),
      author: {
        id: 'author-1',
        name: '李明',
        avatar: 'https://cube.elemecdn.com/0/88/ff94d3c6d86f60cbe2e86151d6a5cda1.png',
        bio: '资深前端工程师，关注 Vue 和性能优化',
        followerCount: 5420,
        articleCount: 128,
        likeCount: 8900,
      },
      comments: [
        {
          id: 'comment-1',
          author: '张三',
          avatar: 'https://cube.elemecdn.com/0/88/ff94d3c6d86f60cbe2e86151d6a5cda1.png',
          content: '这篇文章写得太好了！**Composition API** 确实提高了代码的可维护性。',
          likes: 10,
          createdAt: new Date(Date.now() - 1 * 24 * 3600000),
          replies: [
            {
              id: 'reply-1',
              author: '李明',
              avatar: 'https://cube.elemecdn.com/0/88/ff94d3c6d86f60cbe2e86151d6a5cda1.png',
              content: '感谢支持！这正是我想传达的核心内容。',
              likes: 5,
              createdAt: new Date(Date.now() - 12 * 3600000),
              replyTo: '张三',
            },
          ],
        },
      ],
    }
  } catch (error) {
    ElMessage.error('获取文章详情失败')
    console.error('Failed to fetch post detail:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPostDetail()
})
</script>

<style scoped lang="scss">
.main-content-container {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .loading-card {
    :deep(.el-card__body) {
      padding: 32px;
    }
  }

  .post-wrapper {
    .article-header {
      margin-bottom: 32px;

      .article-title {
        margin: 0 0 24px 0;
        font-size: 32px;
        font-weight: 700;
        line-height: 1.4;
        color: #000;
      }

      .article-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #f0f0f0;

        .meta-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .author-info {
            .author-name {
              margin: 0;
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }

            .publish-time {
              font-size: 12px;
              color: #909399;
            }
          }
        }

        .meta-right {
          display: flex;
          gap: 8px;
        }
      }

      .article-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    .article-body {
      margin: 32px 0;
      min-height: 300px;
    }

    .article-footer {
      .interaction-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 0;
        gap: 16px;

        .left-actions,
        .right-actions {
          display: flex;
          gap: 12px;

          :deep(.el-button) {
            .count {
              margin-left: 4px;
              font-size: 12px;
            }
          }
        }
      }

      .author-signature {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px;
        background: #f5f7fa;
        border-radius: 8px;
        margin-top: 32px;

        .signature-info {
          flex: 1;

          h4 {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }

          .signature-bio {
            margin: 0 0 8px 0;
            font-size: 13px;
            color: #606266;
          }

          .signature-stats {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .main-content-container {
    padding: 20px;

    .post-wrapper {
      .article-header {
        .article-title {
          font-size: 24px;
        }

        .article-meta {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;

          .meta-right {
            width: 100%;
          }
        }
      }

      .article-footer {
        .interaction-bar {
          flex-direction: column;
          align-items: stretch;

          .left-actions,
          .right-actions {
            width: 100%;

            :deep(.el-button) {
              flex: 1;
            }
          }
        }

        .author-signature {
          flex-direction: column;
          text-align: center;

          .signature-info {
            h4 {
              text-align: center;
            }

            .signature-stats {
              justify-content: center;
            }
          }
        }
      }
    }
  }
}
</style>

