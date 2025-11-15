<template>
  <SidebarCard title="分类导航">
    <div class="category-nav">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        :class="{ active: selectedCategory === category.id }"
        @click="selectCategory(category.id)"
      >
        <span class="category-icon">{{ category.icon }}</span>
        <span class="category-name">{{ category.name }}</span>
        <span class="category-count">{{ category.count }}</span>
      </button>
    </div>
  </SidebarCard>
</template>

<script setup>
import { ref } from 'vue'
import SidebarCard from './SidebarCard.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedCategory = ref(null)

const categories = ref([
  { id: 'java', name: 'Java', icon: '☕', count: 128 },
  { id: 'python', name: 'Python', icon: '🐍', count: 95 },
  { id: 'frontend', name: '前端开发', icon: '🎨', count: 87 },
  { id: 'devops', name: 'DevOps', icon: '🚀', count: 56 },
  { id: 'database', name: '数据库', icon: '🗄️', count: 42 },
  { id: 'ai', name: 'AI/ML', icon: '🤖', count: 38 },
])

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  // 跳转到分类页面或筛选文章
  router.push(`/community?category=${categoryId}`)
}
</script>

<style scoped lang="scss">
.category-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .category-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #f5f7fa;
    border: 1px solid #e8eaed;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 13px;
    color: #303133;

    &:hover {
      background: #409eff15;
      border-color: #409eff;
    }

    &.active {
      background: #409eff20;
      border-color: #409eff;
      color: #409eff;
      font-weight: 600;

      .category-name {
        color: #409eff;
      }
    }

    .category-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .category-name {
      flex: 1;
      font-weight: 500;
    }

    .category-count {
      font-size: 12px;
      color: #909399;
      flex-shrink: 0;
    }
  }
}
</style>
