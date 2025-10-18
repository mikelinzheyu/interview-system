<template>
  <div class="user-status-badge" :title="tooltipText">
    <span class="status-icon">{{ statusInfo.icon }}</span>
    <span v-if="showLabel" class="status-label">{{ statusInfo.label }}</span>
    <span v-if="showCustomMessage && customStatus" class="custom-message">
      {{ customStatus }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  status: {
    type: String,
    default: 'offline',
    validator: (value) => ['online', 'away', 'busy', 'offline'].includes(value)
  },
  customStatus: {
    type: String,
    default: null
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  showCustomMessage: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'small',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

// 状态配置
const STATUS_CONFIG = {
  online: { label: '在线', icon: '🟢', priority: 1 },
  away: { label: '离开', icon: '🟡', priority: 2 },
  busy: { label: '忙碌', icon: '🔴', priority: 3 },
  offline: { label: '离线', icon: '⚫', priority: 4 }
}

// 计算属性
const statusInfo = computed(() => {
  return STATUS_CONFIG[props.status] || STATUS_CONFIG.offline
})

const tooltipText = computed(() => {
  let text = statusInfo.value.label
  if (props.customStatus) {
    text += ` - ${props.customStatus}`
  }
  return text
})
</script>

<style scoped>
.user-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.status-icon {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.status-label {
  font-weight: 500;
  color: #303133;
}

.custom-message {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.8;
}
</style>
