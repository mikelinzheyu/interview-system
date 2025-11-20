<template>
  <div class="sidebar-card">
    <!-- 卡片头部 -->
    <div v-if="$slots.header || title" class="sidebar-card-header">
      <slot name="header">
        <h4 class="sidebar-card-title">{{ title }}</h4>
      </slot>
      <slot name="extra"></slot>
    </div>

    <!-- 卡片内容 -->
    <div class="sidebar-card-body">
      <slot></slot>
    </div>

    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="sidebar-card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<style scoped lang="scss">
.sidebar-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-lg);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-base);
  }
}

.sidebar-card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .sidebar-card-title {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
}

.sidebar-card-body {
  padding: var(--spacing-lg);
}

.sidebar-card-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-gray);
}
</style>
