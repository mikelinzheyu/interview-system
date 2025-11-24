<template>
  <div class="stat-card-v2">
    <div class="stat-content">
      <!-- 左侧: 标签和数值 -->
      <div>
        <p class="stat-label">{{ stat.label }}</p>
        <div class="stat-value-group">
          <h3 class="stat-value">{{ stat.value }}</h3>
          <span v-if="stat.unit" class="stat-unit">{{ stat.unit }}</span>
        </div>
      </div>

      <!-- 右侧: 图标 -->
      <div class="stat-icon-box" :style="{ backgroundColor: getColorBg(stat.color) }">
        <component
          :is="stat.icon"
          size="24"
          :style="{ color: stat.color }"
        />
      </div>
    </div>

    <!-- 趋势 -->
    <div class="stat-trend">
      <span class="trend-badge" :class="isPositive ? 'trend-positive' : 'trend-negative'">
        <component
          :is="isPositive ? ArrowUpRight : ArrowDownRight"
          size="12"
          class="trend-icon"
        />
        {{ Math.abs(stat.trend) }}%
      </span>
      <span class="trend-label">较上月</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'

interface StatMetric {
  id: string
  label: string
  value: string | number
  unit?: string
  trend: number
  icon: any
  color: string
}

const props = defineProps<{
  stat: StatMetric
}>()

// 计算趋势是否为正
const isPositive = computed(() => {
  return props.stat.trend >= 0
})

// 使用 element-plus 的向上箭头 (趋势正)
const ArrowUpRight = ArrowUp
const ArrowDownRight = ArrowDown

// 根据颜色代码生成背景色 (透明度 10%)
const getColorBg = (color: string) => {
  // color 格式: #409eff
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, 0.1)`
  }
  return 'rgba(64, 158, 255, 0.1)'
}
</script>

<style scoped lang="scss">
.stat-card-v2 {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  background: white;
  padding: 24px;
  box-shadow: 0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  // 暗黑模式
  :global(.dark) & {
    background: #1e1e2e;
    box-shadow: none;
    border-color: rgba(255, 255, 255, 0.1);

    &:hover {
      background: #2a2a3e;
    }
  }
}

.stat-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #909399;
  margin: 0;

  :global(.dark) & {
    color: #a8abb2;
  }
}

.stat-value-group {
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #303133;
  margin: 0;

  :global(.dark) & {
    color: #ffffff;
  }
}

.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: #c0c4cc;
}

.stat-icon-box {
  border-radius: 16px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-trend {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;

  &.trend-positive {
    color: #67c23a;
    background: rgba(103, 194, 58, 0.1);

    :global(.dark) & {
      color: #85ce61;
      background: rgba(103, 194, 58, 0.2);
    }
  }

  &.trend-negative {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.1);

    :global(.dark) & {
      color: #f78989;
      background: rgba(245, 108, 108, 0.2);
    }
  }
}

.trend-icon {
  display: inline;
}

.trend-label {
  font-size: 12px;
  color: #c0c4cc;
}

/* 媒体查询 - 响应式 */
@media (max-width: 768px) {
  .stat-card-v2 {
    padding: 16px;
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-icon-box {
    padding: 10px;
  }
}
</style>
