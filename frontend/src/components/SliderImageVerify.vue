<template>
  <div v-if="modelValue" class="slider-overlay">
    <div class="slider-dialog">
      <h3 class="slider-title">安全验证</h3>
      <p class="slider-text">
        为了保护你的账号安全，请完成简单的滑动验证后，我们会向
        <span class="slider-phone">{{ displayPhone }}</span>
        发送短信验证码。
      </p>

      <!-- 简化的滑动验证占位交互 -->
      <div class="slider-track" @click="handleSuccess">
        <div class="slider-handle">▶</div>
        <span class="slider-hint">点击或滑动完成验证</span>
      </div>

      <button type="button" class="slider-cancel" @click="close">
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  phone: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'verify-success'): void
}>()

const displayPhone = computed(() => {
  const phone = (props.phone || '').trim()
  if (!phone) return '你的手机号'
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(7)}`
  }
  return phone
})

const close = () => {
  emit('update:modelValue', false)
}

const handleSuccess = () => {
  emit('verify-success')
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.slider-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.slider-dialog {
  width: 320px;
  max-width: 90vw;
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 20px 16px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.35);
}

.slider-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.slider-text {
  margin: 0 0 16px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

.slider-phone {
  color: #111827;
  font-weight: 600;
}

.slider-track {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border-radius: 999px;
  background: #e5e7eb;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
  margin-bottom: 12px;

  &:hover {
    background: #d1d5db;
  }
}

.slider-handle {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: #6366f1;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.slider-hint {
  font-size: 13px;
  color: #374151;
}

.slider-cancel {
  width: 100%;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #e5e7eb;
  }
}
</style>

