<template>
  <div class="chat-room-safe">
    <el-card class="placeholder-card">
      <h2>聊天功能暂不可用</h2>
      <p>页面正在修复中，您仍可使用其他功能模块。</p>
      <el-button type="primary" @click="$router.push('/home')">返回首页</el-button>
    </el-card>
  </div>
  </template>

<script setup>
// Temporary safe placeholder to bypass corrupted ChatRoom.vue during build
</script>

<style scoped>
.chat-room-safe {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
.placeholder-card {
  max-width: 520px;
  text-align: center;
  padding: 24px;
}
.placeholder-card h2 {
  margin: 0 0 12px;
}
.placeholder-card p {
  color: #606266;
  margin-bottom: 16px;
}
</style>

