<template>
  <div class="user-status-indicator" :class="`status-${status}`" :title="tooltip">
    <!-- 状态圆点 -->
    <span class="status-dot" :style="{ backgroundColor: statusColor }"></span>

    <!-- 状态标签 (可选) -->
    <span v-if="showLabel" class="status-label">{{ statusLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserPresenceStore } from '@/stores/userPresence'

const props = defineProps({
  status: {
    type: String,
    default: 'offline',
    validator: (value) =>
      ['online', 'away', 'busy', 'dnd', 'offline'].includes(value)
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const store = useUserPresenceStore()

const statusConfig = computed(() => store.getStatusConfig(props.status))
const statusLabel = computed(() => statusConfig.value.label)
const statusColor = computed(() => statusConfig.value.color)
const tooltip = computed(() => statusConfig.value.description)
</script>

<style scoped>
.user-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}

/* 不同尺寸 */
.user-status-indicator {
  &:has(.status-online .status-dot),
  &:has(.status-away .status-dot),
  &:has(.status-busy .status-dot),
  &:has(.status-dnd .status-dot) {
    .status-dot {
      animation: pulse 2s infinite;
    }
  }

  &:has(.status-offline .status-dot) {
    .status-dot {
      animation: none;
    }
  }
}

/* 尺寸变体 */
.user-status-indicator {
  font-size: 12px;

  .status-dot {
    width: 8px;
    height: 8px;
  }

  &.size-small .status-dot {
    width: 6px;
    height: 6px;
  }

  &.size-large .status-dot {
    width: 12px;
    height: 12px;
  }
}

.status-label {
  font-weight: 500;
  color: #666;
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 状态特定样式 */
.status-offline .status-dot {
  animation: none !important;
  opacity: 0.6;
}
</style>
