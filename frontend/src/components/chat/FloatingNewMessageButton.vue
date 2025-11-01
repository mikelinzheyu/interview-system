<template>
  <div class="floating-button" @click="$emit('click')">
    <el-icon><ArrowDown /></el-icon>
    <span v-if="count > 0" class="badge">{{ count > 99 ? '99+' : count }}</span>
    <span class="text">下滑查看新消息</span>
  </div>
</template>

<script setup>
import { ArrowDown } from '@element-plus/icons-vue'

defineProps({
  count: {
    type: Number,
    default: 0
  }
})

defineEmits(['click'])
</script>

<style scoped>
.floating-button {
  position: fixed;
  bottom: 80px;
  right: 24px;
  background: linear-gradient(135deg, #5c6af0 0%, #6b7eff 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(92, 106, 240, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 12px;
  z-index: 50;
}

.floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(92, 106, 240, 0.4);
}

.badge {
  background: #ff5f72;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 0 4px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
</style>
