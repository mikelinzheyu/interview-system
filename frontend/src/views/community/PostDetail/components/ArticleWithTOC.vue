<template>
  <div class="article-with-toc">
    <!-- 左侧悬浮目录 -->
    <aside class="floating-toc-container">
      <slot name="toc"></slot>
    </aside>

    <!-- 右侧文章正文 -->
    <div class="article-content-container">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script setup>
// 纯布局组件
</script>

<style scoped lang="scss">
.article-with-toc {
  display: grid;
  grid-template-columns: var(--layout-toc-width) 1fr;
  gap: var(--spacing-2xl);
  align-items: start;
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-2xl);
}

/* 左侧悬浮目录容器 */
.floating-toc-container {
  position: sticky;
  top: var(--spacing-2xl);
  max-height: calc(100vh - var(--spacing-4xl));
  overflow-y: auto;
  overflow-x: hidden;
  /* 允许左侧小框微量侵占右侧内容区，不压缩中间区域 */
  /* 不重叠中间内容：使用 grid 列宽控制 */
  
  

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border-default);
    border-radius: var(--radius-base);

    &:hover {
      background: var(--color-border-dark);
    }
  }
}

/* 右侧文章内容容器 */
.article-content-container {
  min-width: 0; // 防止溢出
}

/* 响应式适配 */

/* 平板尺寸 - 隐藏左侧目录 */
@media (max-width: 992px) {
  .article-with-toc {
    grid-template-columns: 1fr;
    padding: var(--spacing-2xl);
  }

  .floating-toc-container {
    display: none;
  }
}

/* 手机尺寸 */
@media (max-width: 768px) {
  .article-with-toc {
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
  }
}
</style>
