<template>
  <div class="activity-timeline">
    <!-- 加载态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- 空态 -->
    <div v-else-if="activities.length === 0" class="empty-state">
      <el-empty description="暂无活动" :image-size="80" />
    </div>

    <!-- 时间线 -->
    <div v-else class="timeline">
      <div v-for="(activity, idx) in activities" :key="activity.id" class="timeline-item">
        <!-- 时间线圆点 -->
        <div class="timeline-dot" :class="getActivityTypeClass(activity.type)"></div>

        <!-- 时间线连接线 -->
        <div v-if="idx < activities.length - 1" class="timeline-line"></div>

        <!-- 活动内容 -->
        <div class="timeline-content">
          <div class="activity-header">
            <h4 class="activity-title">{{ activity.title }}</h4>
            <span v-if="activity.score" class="activity-score">{{ activity.score }}</span>
          </div>
          <p class="activity-time">{{ formatTime(activity.time) }}</p>
          <p v-if="activity.description" class="activity-description">{{ activity.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Activity {
  id: string | number
  title: string
  time: string
  type: 'interview' | 'study' | 'profile' | 'achievement' | 'system'
  score?: string
  description?: string
}

const props = defineProps<{
  data: Activity[]
  loading?: boolean
}>()

const activities = computed(() => props.data)
const loading = computed(() => props.loading ?? false)

// 获取活动类型的样式类
const getActivityTypeClass = (type: string) => {
  const typeMap: Record<string, string> = {
    interview: 'type-interview',
    study: 'type-study',
    profile: 'type-profile',
    achievement: 'type-achievement',
    system: 'type-system'
  }
  return typeMap[type] || 'type-system'
}

// 格式化时间
const formatTime = (time: string) => {
  // 如果包含"前"或"天"，直接返回
  if (time.includes('前') || time.includes('天')) {
    return time
  }

  try {
    const date = new Date(time)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 计算时间差
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`

    return date.toLocaleDateString('zh-CN')
  } catch {
    return time
  }
}
</script>

<style scoped lang="scss">
.activity-timeline {
  width: 100%;
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  padding-left: 40px;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.timeline-dot {
  position: absolute;
  left: -48px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 3px solid white;
  z-index: 1;
  transition: all 0.3s ease;

  :global(.dark) & {
    border-color: #1e1e2e;
  }

  // 活动类型颜色
  &.type-interview {
    background: #0071e3;
  }

  &.type-study {
    background: #67c23a;
  }

  &.type-profile {
    background: #e6a23c;
  }

  &.type-achievement {
    background: #f56c6c;
  }

  &.type-system {
    background: #909399;
  }
}

.timeline-line {
  position: absolute;
  left: -42px;
  top: 20px;
  bottom: -24px;
  width: 2px;
  background: #e4e4e6;

  :global(.dark) & {
    background: #555;
  }
}

.timeline-content {
  flex: 1;
  padding-top: 2px;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.activity-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;

  :global(.dark) & {
    color: white;
  }
}

.activity-score {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  background: #f0f9ff;
  color: #10b981;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;

  :global(.dark) & {
    background: rgba(16, 185, 129, 0.1);
    color: #6ee7b7;
  }
}

.activity-time {
  font-size: 12px;
  color: #909399;
  margin: 0;
  margin-bottom: 8px;

  :global(.dark) & {
    color: #a8abb2;
  }
}

.activity-description {
  font-size: 13px;
  color: #606266;
  margin: 0;
  line-height: 1.5;

  :global(.dark) & {
    color: #b0b5be;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .timeline {
    padding-left: 32px;
  }

  .timeline-dot {
    left: -40px;
    width: 10px;
    height: 10px;
    border-width: 2px;
  }

  .timeline-line {
    left: -35px;
  }

  .activity-title {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .timeline {
    padding-left: 24px;
  }

  .timeline-dot {
    left: -32px;
  }

  .timeline-line {
    left: -27px;
  }

  .activity-title {
    font-size: 12px;
  }

  .activity-score {
    font-size: 10px;
    padding: 2px 6px;
  }
}
</style>
