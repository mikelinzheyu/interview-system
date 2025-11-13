<template>
  <div class="right-sidebar">
    <!-- AI 助手 -->
    <AIAssistant :article-content="articleContent" :post-id="postId" />

    <!-- 相关推荐 -->
    <RelatedArticles :tags="tags" :category="category" />

    <!-- 热门话题 -->
    <div class="trending-topics">
      <div class="section-header">
        <h4>热门话题</h4>
      </div>
      <div class="topics-list">
        <el-tag v-for="topic in trendingTopics" :key="topic" @click="handleTagClick(topic)">
          {{ topic }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import AIAssistant from './AIAssistant.vue'
import RelatedArticles from './RelatedArticles.vue'

const props = defineProps({
  articleContent: {
    type: String,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
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

const trendingTopics = [
  'Vue 3',
  'JavaScript',
  '性能优化',
  '前端',
  'React',
  'TypeScript',
  '响应式设计',
  'Web 开发',
]

const handleTagClick = (tag) => {
  router.push(`/community/posts?tag=${encodeURIComponent(tag)}`)
}
</script>

<style scoped lang="scss">
.right-sidebar {
  display: flex;
  flex-direction: column;

  .trending-topics {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 16px;
    margin-bottom: 20px;

    .section-header {
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }

    .topics-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      :deep(.el-tag) {
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          opacity: 0.8;
          transform: translateY(-2px);
        }
      }
    }
  }
}
</style>
