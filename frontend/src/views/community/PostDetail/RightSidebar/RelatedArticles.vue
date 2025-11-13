<template>
  <div class="related-articles">
    <div class="section-header">
      <h4>相关推荐</h4>
    </div>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="articles.length === 0" class="empty">
      <el-empty description="暂无推荐" :image-size="60" />
    </div>

    <div v-else class="articles-list">
      <div
        v-for="article in articles"
        :key="article.id"
        class="article-card"
        @click="handleNavigateTo(article)"
      >
        <!-- 缩略图 -->
        <div v-if="article.coverImage" class="article-thumbnail">
          <img :src="article.coverImage" :alt="article.title" />
          <span class="category-tag">{{ article.category }}</span>
        </div>

        <!-- 内容 -->
        <div class="article-info">
          <h5 class="article-title">{{ article.title }}</h5>
          <p class="article-excerpt">{{ article.excerpt }}</p>
          <div class="article-footer">
            <span class="author">{{ article.author }}</span>
            <span class="views">
              <el-icon><View /></el-icon>
              {{ article.viewCount }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { View } from '@element-plus/icons-vue'

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  category: {
    type: String,
    default: '',
  },
})

const router = useRouter()

const loading = ref(false)
const articles = ref([])

const handleNavigateTo = (article) => {
  router.push(`/community/posts/${article.id}`)
}

const fetchRelatedArticles = async () => {
  loading.value = true
  try {
    // TODO: 调用 API 获取相关推荐文章
    // const res = await communityAPI.getRelatedArticles({
    //   tags: props.tags,
    //   category: props.category,
    //   limit: 5,
    // })
    // articles.value = res.data
    articles.value = [
      {
        id: '1',
        title: '深入理解 Vue 3 Composition API',
        excerpt: '从零开始学习如何使用 Composition API 构建可维护的 Vue 应用...',
        author: '李明',
        viewCount: 2450,
        category: 'Vue',
        coverImage: 'https://via.placeholder.com/120x80?text=Vue',
      },
      {
        id: '2',
        title: 'JavaScript 性能优化完全指南',
        excerpt: '详细讲解如何优化 JavaScript 代码性能，包括内存管理...',
        author: '王芳',
        viewCount: 1890,
        category: 'JavaScript',
        coverImage: 'https://via.placeholder.com/120x80?text=JS',
      },
      {
        id: '3',
        title: '响应式设计最佳实践',
        excerpt: '如何设计响应式网站，适配各种设备屏幕尺寸...',
        author: '张三',
        viewCount: 1456,
        category: 'CSS',
        coverImage: 'https://via.placeholder.com/120x80?text=CSS',
      },
    ]
  } catch (error) {
    console.error('Failed to fetch related articles:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRelatedArticles()
})
</script>

<style scoped lang="scss">
.related-articles {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 20px;

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
    .article-card {
      display: flex;
      gap: 12px;
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

        .article-thumbnail img {
          transform: scale(1.05);
        }
      }

      .article-thumbnail {
        flex-shrink: 0;
        position: relative;
        width: 100px;
        height: 70px;
        border-radius: 4px;
        overflow: hidden;
        background: #f0f0f0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .category-tag {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(64, 158, 255, 0.9);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
        }
      }

      .article-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .article-title {
          margin: 0 0 4px 0;
          font-size: 13px;
          font-weight: 600;
          color: #303133;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          transition: color 0.3s;
        }

        .article-excerpt {
          margin: 0 0 6px 0;
          font-size: 12px;
          color: #909399;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .article-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #b2bac2;

          .author {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .views {
            display: flex;
            align-items: center;
            gap: 2px;
            flex-shrink: 0;
          }
        }
      }
    }
  }
}
</style>
