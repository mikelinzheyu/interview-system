<template>
  <section class="stats-section">
    <div class="stats-grid">
      <div v-for="stat in data" :key="stat.id" class="stat-card">
        <div class="stat-icon" :style="{ background: stat.color }">
          <el-icon class="stat-icon-inner"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">{{ stat.label }}</p>
          <div class="stat-value">{{ stat.value }}<span class="stat-unit">{{ stat.unit }}</span></div>
          <div class="stat-trend" :class="stat.trend >= 0 ? 'positive' : 'negative'">
            <el-icon><component :is="stat.trend >= 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
            {{ Math.abs(stat.trend) }}% 较上月
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowUp, ArrowDown, VideoCamera, Timer, Trophy, Aim } from '@element-plus/icons-vue'

interface Stat {
  id: string
  label: string
  value: string | number
  unit: string
  trend: number
  icon: string
  color: string
}

defineProps<{
  data: Stat[]
}>()
</script>

<style scoped lang="scss">
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #fff 0%, #fafbfc 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  display: flex;
  gap: 16px;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-inner {
  font-size: 32px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.stat-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
  font-weight: 400;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;

  &.positive {
    color: #67c23a;
  }

  &.negative {
    color: #f56c6c;
  }

  :deep(.el-icon) {
    font-size: 12px;
  }
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 16px;
  }
}
</style>
