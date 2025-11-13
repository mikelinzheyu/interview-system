<template>
  <div class="three-column-layout">
    <!-- 左侧栏 -->
    <aside class="left-sidebar">
      <slot name="left"></slot>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <slot name="main"></slot>
    </main>

    <!-- 右侧栏 -->
    <aside class="right-sidebar">
      <slot name="right"></slot>
    </aside>
  </div>
</template>

<script setup>
// 这是一个纯布局容器组件，不需要任何逻辑
</script>

<style scoped lang="scss">
.three-column-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;

  // 左侧栏
  .left-sidebar {
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;

      &:hover {
        background: #999;
      }
    }
  }

  // 主内容区
  .main-content {
    min-width: 0; // 重要：防止溢出
  }

  // 右侧栏
  .right-sidebar {
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 3px;

      &:hover {
        background: #999;
      }
    }
  }

  // 平板适配（1024px）：两列布局
  @media (max-width: 1200px) {
    grid-template-columns: 250px 1fr;

    .right-sidebar {
      display: none;
    }
  }

  // 手机适配（768px）：单列布局
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;

    .left-sidebar,
    .right-sidebar {
      position: static;
      max-height: none;
    }
  }
}
</style>
