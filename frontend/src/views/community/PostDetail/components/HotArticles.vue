<template>
  <SidebarCard title="热门文章">
    <div v-if="articles && articles.length > 0" class="hot-articles-list">
      <div
        v-for="(article, index) in articles"
        :key="article.id"
        class="hot-article-item"
        @click="goToArticle(article.id)"
      >
        <div class="article-rank" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
        <div class="article-info">
          <h5 class="article-title">{{ article.title }}</h5>
          <p class="article-stats">
            <span>{{ article.viewCount }} 阅读</span>
            <span>·</span>
            <span>{{ article.likeCount }} 点赞</span>
          </p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暂无热门文章</p>
    </div>
  </SidebarCard>
</template>

<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import SidebarCard from './SidebarCard.vue'

const props = defineProps({
  articles: {
    type: Array,
    default: () => [],
  },
})

const router = useRouter()

const goToArticle = (id) => {
  router.push(`/community/posts/${id}`)
}
</script>

<style scoped lang="scss">
.hot-articles-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.hot-article-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-hover);

    .article-title {
      color: var(--color-primary);
    }
  }

  .article-rank {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-base);
    background: var(--color-bg-gray);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);

    &.rank-1 {
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
      color: white;
    }

    &.rank-2 {
      background: linear-gradient(135deg, #ffa500, #ff8c00);
      color: white;
    }

    &.rank-3 {
      background: linear-gradient(135deg, #ffd700, #ffb700);
      color: white;
    }
  }

  .article-info {
    flex: 1;
    min-width: 0;

    .article-title {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      transition: color var(--transition-fast);
    }

    .article-stats {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
      display: flex;
      gap: var(--spacing-xs);
    }
  }
}

.empty-state {
  padding: var(--spacing-2xl) 0;
  text-align: center;

  p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
  }
}
</style>
