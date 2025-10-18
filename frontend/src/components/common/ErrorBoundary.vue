<template>
  <div v-if="hasError" class="error-boundary">
    <el-icon class="error-icon" :size="48">
      <WarningFilled />
    </el-icon>
    <h3 class="error-title">出现了一些问题</h3>
    <p class="error-message">{{ errorMessage }}</p>
    <div class="action-buttons">
      <el-button type="primary" @click="retry">重试</el-button>
      <el-button @click="reset">重置</el-button>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'

const hasError = ref(false)
const errorMessage = ref('')

const emit = defineEmits(['error', 'retry', 'reset'])

onErrorCaptured((error) => {
  hasError.value = true
  errorMessage.value = error.message || '未知错误'
  emit('error', error)
  return false
})

const retry = () => {
  hasError.value = false
  errorMessage.value = ''
  emit('retry')
}

const reset = () => {
  hasError.value = false
  errorMessage.value = ''
  emit('reset')
}

defineExpose({
  retry,
  reset,
  hasError
})
</script>

<style scoped>
.error-boundary {
  padding: 60px 20px;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  margin: 20px;
}

.error-icon {
  color: var(--danger-color);
  margin-bottom: 16px;
}

.error-title {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 600;
}

.error-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>