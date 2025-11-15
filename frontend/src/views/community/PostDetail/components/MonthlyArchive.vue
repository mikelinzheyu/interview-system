<template>
  <SidebarCard title="文章归档">
    <div v-if="archives && archives.length > 0" class="archive-list">
      <div
        v-for="archive in archives"
        :key="archive.month"
        class="archive-item"
        @click="goToArchive(archive.month)"
      >
        <span class="archive-month">{{ archive.month }}</span>
        <span class="archive-count">{{ archive.count }} 篇</span>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暂无归档</p>
    </div>
  </SidebarCard>
</template>

<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import SidebarCard from './SidebarCard.vue'

const props = defineProps({
  archives: {
    type: Array,
    default: () => [],
  },
})

const router = useRouter()

const goToArchive = (month) => {
  // TODO: 跳转到归档页面
  console.log('Go to archive:', month)
}
</script>

<style scoped lang="scss">
.archive-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.archive-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-hover);

    .archive-month {
      color: var(--color-primary);
    }
  }

  .archive-month {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    transition: color var(--transition-fast);
  }

  .archive-count {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    background: var(--color-bg-gray);
    padding: 2px var(--spacing-sm);
    border-radius: var(--radius-base);
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
