<template>
  <div class="related-posts-section">
    <div class="section-header">
      <h3 class="section-title">
        <span class="title-icon">📚</span>
        相关推荐
      </h3>
      <el-button
        v-if="!loading && relatedPosts.length === 0"
        size="small"
        type="primary"
        @click="fetchRelatedPosts"
      >
        获取推荐
      </el-button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 推荐文章列表 -->
    <div v-else-if="relatedPosts.length > 0" class="posts-grid">
      <div
        v-for="post in relatedPosts"
        :key="post.id"
        class="post-card"
        @click="navigateToPost(post.id)"
      >
        <!-- 封面图 -->
        <div v-if="post.coverImage" class="post-cover">
          <img :src="post.coverImage" :alt="post.title" loading="lazy" />
          <div class="cover-overlay"></div>
        </div>

        <!-- 内容 -->
        <div class="post-content">
          <h4 class="post-title">{{ post.title }}</h4>

          <p v-if="post.summary" class="post-summary">
            {{ truncate(post.summary, 80) }}
          </p>

          <!-- 标签 -->
          <div v-if="post.tags && post.tags.length > 0" class="post-tags">
            <el-tag
              v-for="tag in post.tags.slice(0, 3)"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>

          <!-- 元信息 -->
          <div class="post-meta">
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ post.author?.name || '未知' }}
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ formatNumber(post.viewCount || 0) }}
            </span>
            <span class="meta-item">
              <el-icon><Star /></el-icon>
              {{ formatNumber(post.likeCount || post.like_count || 0) }}
            </span>
          </div>

          <!-- 相似度指示器（可选） -->
          <div v-if="post.similarity" class="similarity-badge">
            <span class="similarity-label">匹配度</span>
            <el-progress
              :percentage="Math.round(post.similarity * 100)"
              :stroke-width="4"
              :show-text="false"
              :color="getSimilarityColor(post.similarity)"
            />
            <span class="similarity-value">{{ Math.round(post.similarity * 100) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-else
      description="暂无相关推荐"
      :image-size="100"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, View, Star } from '@element-plus/icons-vue'

const props = defineProps({
  postId: {
    type: [String, Number],
    required: true
  },
  tags: {
    type: Array,
    default: () => []
  },
  category: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const loading = ref(false)
const relatedPosts = ref([])

/**
 * 获取相关文章推荐
 */
const fetchRelatedPosts = async () => {
  loading.value = true

  try {
    // TODO: 调用真实的推荐 API
    // 可以基于标签、分类、向量相似度等算法
    // const response = await fetch(`/api/posts/${props.postId}/related`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     tags: props.tags,
    //     category: props.category
    //   })
    // })
    // const data = await response.json()

    // 模拟 API 延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 模拟推荐数据
    relatedPosts.value = [
      {
        id: 21,
        title: 'Vue 3 组合式 API 深度解析',
        summary: '深入探讨 Vue 3 Composition API 的设计理念和实践技巧，帮助开发者更好地理解和使用新特性。',
        coverImage: 'https://picsum.photos/400/200?random=1',
        tags: ['Vue', 'JavaScript', '前端'],
        author: { name: '张三' },
        viewCount: 1520,
        likeCount: 89,
        similarity: 0.85
      },
      {
        id: 22,
        title: 'React Hooks 最佳实践指南',
        summary: '总结 React Hooks 在实际项目中的应用经验，包括常见陷阱和优化策略。',
        coverImage: 'https://picsum.photos/400/200?random=2',
        tags: ['React', 'JavaScript', '前端'],
        author: { name: '李四' },
        viewCount: 2340,
        likeCount: 156,
        similarity: 0.72
      },
      {
        id: 23,
        title: '前端性能优化实战',
        summary: '从代码层面到工程化配置，全方位讲解前端性能优化的实用技巧。',
        coverImage: 'https://picsum.photos/400/200?random=3',
        tags: ['性能优化', '前端', 'Web'],
        author: { name: '王五' },
        viewCount: 3120,
        likeCount: 234,
        similarity: 0.68
      }
    ]
  } catch (error) {
    console.error('获取推荐失败:', error)
    ElMessage.error('获取推荐文章失败')
  } finally {
    loading.value = false
  }
}

/**
 * 跳转到文章详情
 */
const navigateToPost = (postId) => {
  router.push(`/community/posts/${postId}`)
  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 截断文本
 */
const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}

/**
 * 格式化数字
 */
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

/**
 * 获取相似度颜色
 */
const getSimilarityColor = (similarity) => {
  if (similarity >= 0.8) return '#67C23A'
  if (similarity >= 0.6) return '#409EFF'
  if (similarity >= 0.4) return '#E6A23C'
  return '#F56C6C'
}

// 自动加载推荐
fetchRelatedPosts()
</script>

<style scoped lang="scss">
.related-posts-section {
  margin-top: 48px;
  padding: 32px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);

      .title-icon {
        font-size: 28px;
      }
    }
  }

  .loading-container {
    padding: 20px 0;
  }

  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;

    .post-card {
      background: var(--el-fill-color-lighter);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
      border: 1px solid transparent;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: var(--el-color-primary-light-5);

        .post-cover {
          .cover-overlay {
            opacity: 0.3;
          }

          img {
            transform: scale(1.05);
          }
        }
      }

      .post-cover {
        position: relative;
        width: 100%;
        height: 180px;
        overflow: hidden;
        background: var(--el-fill-color);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .cover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.5) 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }

      .post-content {
        padding: 20px;

        .post-title {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          line-height: 1.5;
          color: var(--el-text-color-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .post-summary {
          margin: 0 0 12px 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--el-text-color-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .post-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .post-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 13px;
          color: var(--el-text-color-secondary);
          margin-bottom: 12px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }

        .similarity-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--el-bg-color);
          border-radius: 6px;
          font-size: 12px;

          .similarity-label {
            color: var(--el-text-color-secondary);
            font-weight: 500;
          }

          .el-progress {
            flex: 1;
          }

          .similarity-value {
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .related-posts-section {
    padding: 20px 16px;

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .section-title {
        font-size: 20px;
      }
    }

    .posts-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
