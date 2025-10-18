<template>
  <nav class="chat-category-tabs" aria-label="聊天室分类筛选">
    <button
      v-for="category in categories"
      :key="category.key"
      type="button"
      class="chat-category-tabs__item"
      :class="{ 'is-active': category.key === activeKey }"
      @click="emit('change', category.key)"
    >
      <el-icon v-if="iconMap[category.key]"><component :is="iconMap[category.key]" /></el-icon>
      <span>{{ category.label }}</span>
      <span v-if="category.count !== undefined" class="chat-tag__dot" />
      <span v-if="category.count !== undefined">{{ category.count }}</span>
    </button>
  </nav>
</template>

<script setup>
import { ChatLineRound, Clock, StarFilled, TrendCharts, CollectionTag } from '@element-plus/icons-vue'

defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  activeKey: {
    type: String,
    default: 'trending'
  }
})

const emit = defineEmits(['change'])

const iconMap = {
  trending: TrendCharts,
  popular: ChatLineRound,
  latest: Clock,
  mine: StarFilled,
  general: CollectionTag
}
</script>


