<template>
  <div class="new-two-column-layout">
    <div class="layout-container">
      <!-- 左侧主内容区 -->
      <main class="main-content-area">
        <slot name="main"></slot>
      </main>

      <!-- 右侧边栏 -->
      <aside class="right-sidebar-area">
        <div class="sidebar-sticky">
          <slot name="sidebar"></slot>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
// 纯布局组件，无需逻辑
</script>

<style scoped lang="scss">
.new-two-column-layout {
  background: var(--color-bg-page);
  min-height: calc(100vh - 200px);
}

.layout-container {
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-3xl);
  display: grid;
  grid-template-columns: 1fr var(--layout-sidebar-width);
  gap: var(--spacing-2xl);
  align-items: start;
}

/* 主内容区 */
.main-content-area {
  min-width: 0; // 防止内容溢出
  width: 100%;
}

/* 右侧边栏 */
.right-sidebar-area {
  width: var(--layout-sidebar-width);

  .sidebar-sticky {
    position: sticky;
    top: var(--spacing-2xl);
    /* 不允许右侧内部滚动，跟随页面整体滚动 */
    max-height: none;
    overflow: visible;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border-dark);
      border-radius: var(--radius-base);

      &:hover {
        background: var(--color-text-tertiary);
      }
    }
  }
}

/* 响应式适配 */

/* 平板尺寸 */
@media (max-width: 1200px) {
  .layout-container {
    grid-template-columns: 1fr 320px; /* 扩宽中等屏宽下的侧栏 */
    gap: var(--spacing-lg);
    padding: 0 var(--spacing-lg);
  }

  .right-sidebar-area {
    width: 320px;
  }
}

/* 小平板尺寸 */
@media (max-width: 992px) {
  .layout-container {
    grid-template-columns: 1fr;
    padding: 0 var(--spacing-md);
  }

  .right-sidebar-area {
    display: none; // 隐藏侧边栏
  }
}

/* 手机尺寸 */
@media (max-width: 768px) {
  .layout-container {
    padding: 0 var(--spacing-sm);
  }
}
</style>
