<template>
  <div class="article-tags-system">
    <div v-if="tags && tags.length" class="tags-container">
      <span class="tags-label">标签：</span>
      <div class="tags-list">
        <router-link
          v-for="tag in tags"
          :key="tag"
          :to="`/community?tag=${encodeURIComponent(tag)}`"
          class="tag-item"
          :title="`查看更多『${tag}』相关文章`"
        >
          <span class="tag-icon">#</span>
          <span class="tag-text">{{ tag }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped lang="scss">
.article-tags-system {
  margin: 16px 0;

  .tags-container {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%);
    border-radius: 8px;
    border-left: 3px solid #409eff;

    .tags-label {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1;

      .tag-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: #ffffff;
        border: 1px solid #409eff;
        border-radius: 16px;
        color: #409eff;
        text-decoration: none;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
          background: #409eff;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
        }

        .tag-icon {
          opacity: 0.8;
          font-weight: 600;
        }

        .tag-text {
          display: inline-block;
        }
      }
    }
  }
}
</style>
