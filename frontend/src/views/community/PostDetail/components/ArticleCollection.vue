<template>
  <SidebarCard title="专栏目录">
    <div v-if="collection && collection.articles && collection.articles.length > 0" class="collection-list">
      <div
        v-for="(article, index) in collection.articles"
        :key="article.id"
        :class="['collection-item', { active: article.id === currentArticleId }]"
        @click="goToArticle(article.id)"
      >
        <div class="item-index">{{ index + 1 }}</div>
        <div class="item-content">
          <h5 class="item-title">{{ article.title }}</h5>
          <p class="item-meta">
            <span>{{ article.viewCount }} 阅读</span>
          </p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暂无专栏文章</p>
    </div>
  </SidebarCard>
</template>

<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import SidebarCard from './SidebarCard.vue'

const props = defineProps({
  collection: {
    type: Object,
    default: null,
  },
  currentArticleId: {
    type: String,
    default: '',
  },
})

const router = useRouter()

const goToArticle = (id) => {
  router.push(`/community/posts/${id}`)
}
</script>

<style scoped lang="scss">
.collection-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.collection-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;

  &:hover {
    background: var(--color-bg-hover);
  }

  &.active {
    background: rgba(252, 85, 49, 0.05);
    border-color: var(--color-primary);

    .item-index {
      background: var(--color-primary);
      color: white;
    }

    .item-title {
      color: var(--color-primary);
    }
  }

  .item-index {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-bg-gray);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
  }

  .item-content {
    flex: 1;
    min-width: 0;

    .item-title {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-meta {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
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
