<template>
  <div class="left-sidebar">
    <!-- 作者卡片 -->
    <AuthorCard :author="author" @follow="handleFollow" />

    <!-- 文章目录 -->
    <TableOfContents :toc="toc" />

    <!-- 作者其他文章 -->
    <AuthorArticles v-if="author && author.userId != null" :author-id="String(author.userId)" :limit="5" />
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import AuthorCard from './AuthorCard.vue'
import TableOfContents from './TableOfContents.vue'
import AuthorArticles from './AuthorArticles.vue'

const props = defineProps({
  author: {
    type: Object,
    required: true,
  },
  toc: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['follow'])

const handleFollow = (data) => {
  emit('follow', data)
}
</script>

<style scoped lang="scss">
.left-sidebar {
  display: flex;
  flex-direction: column;
}
</style>
