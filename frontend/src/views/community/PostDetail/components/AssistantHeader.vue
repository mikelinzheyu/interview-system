<template>
  <div class="assistant-header">
    <div class="header-content">
      <span class="logo-icon">✨</span>
      <h2 class="title">AI 助手</h2>
    </div>
  </div>
</template>

<script setup>
// 纯展示组件，无逻辑
</script>

<style scoped lang="scss">
.assistant-header {
  padding: 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-bottom: 1px solid #3d3d4d;
  display: flex;
  align-items: center;

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;

    .logo-icon {
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #e0e0e0;
      margin: 0;
      letter-spacing: 0.5px;
    }
  }
}
</style>
