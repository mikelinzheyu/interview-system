<template>
  <div class="empty-state">
    <el-icon class="empty-icon" :size="iconSize">
      <component :is="iconComponent" />
    </el-icon>
    <div class="empty-text">{{ title }}</div>
    <div v-if="description" class="empty-description">{{ description }}</div>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  DocumentRemove,
  Search,
  Warning,
  InfoFilled,
  QuestionFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'search', 'error', 'info', 'question'].includes(value)
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: ''
  },
  iconSize: {
    type: Number,
    default: 64
  }
})

const iconComponent = computed(() => {
  const iconMap = {
    default: DocumentRemove,
    search: Search,
    error: Warning,
    info: InfoFilled,
    question: QuestionFilled
  }
  return iconMap[props.type] || DocumentRemove
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  color: var(--border-light);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
  color: var(--text-regular);
}

.empty-description {
  font-size: 14px;
  color: var(--text-placeholder);
  margin-bottom: 20px;
  line-height: 1.5;
}

.empty-action {
  margin-top: 20px;
}
</style>