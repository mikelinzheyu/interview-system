<template>
  <div class="new-article-content">
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 文章内容 -->
    <div v-else-if="post" class="article-wrapper">
      <!-- 文章头部 -->
      <header class="article-header">
        <h1 class="article-title">{{ post.title }}</h1>

        <!--元信息 -->
        <div class="article-meta">
          <el-avatar :src="post.author?.avatar" :size="32" />
          <span class="author-name">{{ post.author?.name }}</span>
          <span class="meta-divider">·</span>
          <span class="publish-time">{{ formatTime(post.createdAt) }}</span>
          <span class="meta-divider">·</span>
          <span class="view-count">{{ post.viewCount || 0 }} 阅读</span>
        </div>

        <!-- 标签 -->
        <ArticleTagsSystem :tags="post.tags" />

        <el-divider />
      </header>

      <!-- 文章正文 -->
      <article class="article-body" ref="articleBodyRef">
        <MarkdownRenderer :content="post.content" />
      </article>

      <!-- 文章底部 -->
      <footer class="article-footer">
        <el-divider />

        <!-- 交互栏 -->
        <div class="interaction-bar">
          <div class="left-actions">
            <el-button
              :type="post.liked ? 'primary' : 'default'"
              :icon="post.liked ? StarFilled : Star"
              @click="handleLike"
            >
              {{ post.liked ? '已点赞' : '点赞' }} {{ post.likeCount || '' }}
            </el-button>

            <el-button
              type="default"
              :icon="ChatDotRound"
              @click="scrollToComments"
            >
              评论 {{ post.commentCount || '' }}
            </el-button>

            <el-button
              :type="post.collected ? 'primary' : 'default'"
              :icon="Collection"
              @click="handleCollect"
            >
              {{ post.collected ? '已收藏' : '收藏' }}
            </el-button>

            <el-button
              type="default"
              :icon="Share"
              @click="handleShare"
            >
              分享
            </el-button>
          </div>
        </div>

        <!-- 作者签名区 -->
        <div class="author-signature-card">
          <el-avatar :src="post.author?.avatar" :size="56" />
          <div class="signature-info">
            <h4 class="author-name">{{ post.author?.name }}</h4>
            <p class="author-bio">{{ post.author?.bio }}</p>
            <div class="author-stats">
              <span>{{ post.author?.followerCount || 0 }} 粉丝</span>
              <span>·</span>
              <span>{{ post.author?.articleCount || 0 }} 篇文章</span>
            </div>
          </div>
          <el-button type="primary">关注</el-button>
        </div>
      </footer>

      <!-- 评论区 -->
      <div class="comments-section-wrapper" ref="commentsRef">
        <CommentsSection
          :post-id="post.id"
          :initial-comments="post.comments || []"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="文章不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Star,
  StarFilled,
  ChatDotRound,
  Collection,
  Share,
} from '@element-plus/icons-vue'
import communityAPI from '@/api/communityAPI'
import MarkdownRenderer from '../MainContent/MarkdownRenderer.vue'
import CommentsSection from '../MainContent/CommentsSection.vue'
import ArticleTagsSystem from './ArticleTagsSystem.vue'

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['post-loaded'])

const loading = ref(true)
const post = ref(null)
const articleBodyRef = ref(null)
const commentsRef = ref(null)

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

const handleLike = () => {
  if (!post.value) return
  post.value.liked = !post.value.liked
  post.value.likeCount += post.value.liked ? 1 : -1
  ElMessage.success(post.value.liked ? '点赞成功' : '已取消点赞')
}

const handleCollect = () => {
  if (!post.value) return
  post.value.collected = !post.value.collected
  ElMessage.success(post.value.collected ? '收藏成功' : '已取消收藏')
}

const handleShare = () => {
  const url = `${window.location.origin}/community/posts/${props.postId}`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
  } else {
    ElMessage.info('请手动复制链接')
  }
}

const scrollToComments = () => {
  if (commentsRef.value) {
    commentsRef.value.scrollIntoView({ behavior: 'smooth' })
  }
}

const fetchPostDetail = async () => {
  loading.value = true
  try {
    // 调用 API 获取文章详情
    const data = await communityAPI.getPostDetail(props.postId)
    post.value = data

    // 触发post-loaded事件，传递文章数据给父组件
    emit('post-loaded', post.value)
  } catch (error) {
    console.error('Failed to fetch post detail:', error)
    ElMessage.error('获取文章详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPostDetail()
})
</script>

<style scoped lang="scss">
.new-article-content {
  width: 100%;
}

.loading-skeleton {
  background: var(--color-bg-white);
  padding: var(--spacing-4xl);
  border-radius: var(--radius-lg);
}

.article-wrapper {
  /* 文章头部 */
  .article-header {
    margin-bottom: var(--spacing-3xl);

    .article-title {
      margin: 0 0 var(--spacing-xl) 0;
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      line-height: 1.3;
      color: var(--color-text-primary);
    }

    .article-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);

      .author-name {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .meta-divider {
        color: var(--color-text-tertiary);
      }
    }

    .article-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
  }

  /* 文章正文 */
  .article-body {
    min-height: 400px;
    margin-bottom: var(--spacing-4xl);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-primary);
  }

  /* 文章底部 */
  .article-footer {
    .interaction-bar {
      padding: var(--spacing-2xl) 0;

      .left-actions {
        display: flex;
        gap: var(--spacing-md);
        flex-wrap: wrap;
      }
    }

    .author-signature-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-2xl);
      background: var(--color-bg-gray);
      border-radius: var(--radius-lg);
      margin-top: var(--spacing-2xl);

      .signature-info {
        flex: 1;

        .author-name {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .author-bio {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .author-stats {
          display: flex;
          gap: var(--spacing-sm);
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }
      }
    }
  }

  /* 评论区 */
  .comments-section-wrapper {
    margin-top: var(--spacing-4xl);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .article-wrapper {
    .article-header {
      .article-title {
        font-size: var(--font-size-2xl);
      }
    }

    .article-footer {
      .author-signature-card {
        flex-direction: column;
        text-align: center;

        .signature-info {
          .author-stats {
            justify-content: center;
          }
        }
      }
    }
  }
}
</style>
