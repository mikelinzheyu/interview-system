<template>
  <div class="glass-card stats-card" @click="handleCardClick">
    <div class="stats-card-icon">
      <el-icon :style="{ color: iconColor }">
        <component :is="icon" />
      </el-icon>
    </div>

    <div class="stats-card-label">{{ label }}</div>

    <div class="stats-card-value">
      <span class="value">{{ value }}</span>
      <span v-if="unit" class="unit">{{ unit }}</span>
    </div>

    <div v-if="trend" class="stats-card-trend" :class="trendClass">
      <span class="trend-icon">{{ trend.direction === 'up' ? '↗' : '↘' }}</span>
      <span class="trend-text">{{ trend.percent }}% vs 上{{ trend.period }}</span>
    </div>

    <div v-if="subtitle" class="stats-card-subtitle">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  unit: {
    type: String,
    default: ''
  },
  icon: {
    type: Object,
    required: true
  },
  iconColor: {
    type: String,
    default: '#409eff'
  },
  trend: {
    type: Object,
    default: null
    // { direction: 'up'|'down', percent: 12, period: '月' }
  },
  subtitle: {
    type: String,
    default: ''
  },
  clickable: {
    type: Boolean,
    default: true
  },
  route: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click'])

const router = useRouter()

const trendClass = computed(() => {
  if (!props.trend) return ''
  return props.trend.direction === 'up' ? 'is-up' : 'is-down'
})

const handleCardClick = () => {
  emit('click')
  if (props.clickable && props.route) {
    router.push(props.route)
  }
}
</script>

<style scoped>
.stats-card {
  padding: 24px;
  text-align: center;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: slideUp 0.6s ease-out;
}

.stats-card-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.stats-card-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
}

.value {
  font-size: 40px;
  font-weight: 700;
  color: #303133;
}

.unit {
  font-size: 14px;
  font-weight: 400;
  color: #606266;
}

.stats-card-trend {
  font-size: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stats-card-trend.is-up {
  color: #67c23a;
}

.stats-card-trend.is-down {
  color: #f56c6c;
}

.trend-icon {
  font-weight: bold;
}

.stats-card-subtitle {
  font-size: 13px;
  color: #a0a5bd;
  line-height: 1.4;
}

/* 玻璃态卡片样式 */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 1);
}

/* 动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-card {
    min-height: 200px;
    padding: 20px;
  }

  .stats-card-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .value {
    font-size: 32px;
  }
}
</style>
