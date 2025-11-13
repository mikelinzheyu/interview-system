<template>
  <div class="author-articles">
    <div class="section-header">
      <h4>作者其他文章</h4>
    </div>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="articles.length === 0" class="empty">
      <el-empty description="暂无更多文章" />
    </div>

    <div v-else class="articles-list">
      <div
        v-for="article in articles"
        :key="article.id"
        class="article-item"
        @click="handleNavigateTo(article)"
      >
        <h5 class="article-title">{{ article.title }}</h5>
        <p class="article-meta">
          <span class="time">{{ formatTime(article.createdAt) }}</span>
          <span class="views">
            <el-icon><View /></el-icon>
            {{ article.viewCount }}
          </span>
        </p>
      </div>
    </div>

    <!-- 查看更多 -->
    <div v-if="articles.length > 0" class="view-more">
      <el-button text type="primary" @click="handleViewAll">
        查看全部文章 →
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { View } from '@element-plus/icons-vue'

const props = defineProps({
  authorId: {
    type: [String, Number],
    required: true,
  },
  limit: {
    type: Number,
    default: 5,
  },
})

const router = useRouter()

const loading = ref(false)
const articles = ref([])

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  const days = Math.floor(diff / 86400000)
  if (days < 7) {
    return days === 0 ? '今天' : `${days}天前`
  }

  return date.toLocaleDateString()
}

const handleNavigateTo = (article) => {
  router.push(`/community/posts/${article.id}`)
}

const handleViewAll = () => {
  router.push(`/user/${props.authorId}?tab=articles`)
}

const fetchArticles = async () => {
  loading.value = true
  try {
    // TODO: 调用 API 获取作者的其他文章
    // const res = await communityAPI.getAuthorArticles(props.authorId, props.limit)
    // articles.value = res.data
    articles.value = [
      {
        id: '1',
        title: '如何优化 Vue 3 应用性能',
        createdAt: new Date(Date.now() - 2 * 24 * 3600000),
        viewCount: 1200,
      },
      {
        id: '2',
        title: '深入理解 JavaScript 事件循环',
        createdAt: new Date(Date.now() - 5 * 24 * 3600000),
        viewCount: 890,
      },
    ]
  } catch (error) {
    console.error('Failed to fetch author articles:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped lang="scss">
.author-articles {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  .section-header {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .loading {
    padding: 16px;
  }

  .empty {
    padding: 32px 16px;
  }

  .articles-list {
    .article-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f5f5f5;
      cursor: pointer;
      transition: all 0.3s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f5f7fa;

        .article-title {
          color: #409eff;
        }
      }

      .article-title {
        margin: 0 0 8px 0;
        font-size: 13px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
        transition: color 0.3s;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .article-meta {
        margin: 0;
        font-size: 12px;
        color: #909399;
        display: flex;
        gap: 12px;

        .time {
          &::before {
            content: '📅 ';
          }
        }

        .views {
          display: flex;
          align-items: center;
          gap: 2px;
        }
      }
    }
  }

  .view-more {
    padding: 12px 16px;
    border-top: 1px solid #f0f0f0;
    text-align: center;

    :deep(.el-button) {
      padding: 0;
    }
  }
}
</style>
