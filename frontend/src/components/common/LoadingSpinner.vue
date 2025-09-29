<template>
  <div class="loading-spinner">
    <el-icon class="is-loading" :size="size">
      <Loading />
    </el-icon>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'

defineProps({
  size: {
    type: Number,
    default: 24
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.loading-text {
  margin-left: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>