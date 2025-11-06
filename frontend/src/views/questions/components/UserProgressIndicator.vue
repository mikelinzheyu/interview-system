<template>
  <div class="user-progress-indicator">
    <!-- 标题 -->
    <div class="progress-header">
      <h3 class="progress-title">{{ title }}</h3>
      <span v-if="showCompletion" class="completion-text">{{ completionPercentage }}% 完成</span>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar-wrapper">
      <div class="progress-bar-container">
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            :style="{ width: `${completionPercentage}%` }"
            :class="completionClass"
          />
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="progress-stats">
      <!-- 已完成 -->
      <div class="stat-item completed">
        <div class="stat-icon">✓</div>
        <div class="stat-info">
          <div class="stat-label">已完成</div>
          <div class="stat-value">{{ completed }}/{{ total }}</div>
        </div>
      </div>

      <!-- 进行中 -->
      <div class="stat-item in-progress">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-label">进行中</div>
          <div class="stat-value">{{ inProgress }}</div>
        </div>
      </div>

      <!-- 未开始 -->
      <div class="stat-item not-started">
        <div class="stat-icon">⭘</div>
        <div class="stat-info">
          <div class="stat-label">未开始</div>
          <div class="stat-value">{{ notStarted }}</div>
        </div>
      </div>
    </div>

    <!-- 详细统计（可选） -->
    <div v-if="showDetailed" class="progress-details">
      <div class="detail-row">
        <span class="detail-label">学习时长</span>
        <span class="detail-value">{{ studyTime }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">正确率</span>
        <span class="detail-value">{{ accuracy }}%</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">学习频率</span>
        <span class="detail-value">{{ learningFrequency }}</span>
      </div>
    </div>

    <!-- 激励信息 -->
    <div v-if="showMotivation" class="motivation-message" :class="motivationClass">
      <span class="motivation-icon">{{ motivationIcon }}</span>
      <span class="motivation-text">{{ motivationText }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '学习进度'
  },
  completed: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 10
  },
  inProgress: {
    type: Number,
    default: 0
  },
  studyTime: {
    type: String,
    default: '0 分钟'
  },
  accuracy: {
    type: Number,
    default: 0
  },
  learningFrequency: {
    type: String,
    default: '未开始'
  },
  showCompletion: {
    type: Boolean,
    default: true
  },
  showDetailed: {
    type: Boolean,
    default: false
  },
  showMotivation: {
    type: Boolean,
    default: true
  }
})

// 计算已完成百分比
const completionPercentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.completed / props.total) * 100)
})

// 未开始数量
const notStarted = computed(() => {
  return props.total - props.completed - props.inProgress
})

// 完成度等级样式
const completionClass = computed(() => {
  if (completionPercentage.value >= 80) return 'excellent'
  if (completionPercentage.value >= 50) return 'good'
  if (completionPercentage.value >= 25) return 'fair'
  return 'poor'
})

// 激励信息
const motivationData = computed(() => {
  const percentage = completionPercentage.value

  if (percentage === 0) {
    return {
      text: '开始探索，每个学科都是新的冒险！',
      icon: '🚀',
      class: 'start'
    }
  }

  if (percentage < 25) {
    return {
      text: '很好的开始！保持动力继续前进 💪',
      icon: '💪',
      class: 'encouraging'
    }
  }

  if (percentage < 50) {
    return {
      text: '已完成 1/4，继续加油！',
      icon: '📈',
      class: 'progress'
    }
  }

  if (percentage < 75) {
    return {
      text: '已完成过半，坚持就是胜利！',
      icon: '🔥',
      class: 'halfway'
    }
  }

  if (percentage < 100) {
    return {
      text: '距离目标只剩一步之遥，冲刺！',
      icon: '⚡',
      class: 'final'
    }
  }

  return {
    text: '完美！你已经掌握了这个学科！',
    icon: '🏆',
    class: 'complete'
  }
})

const motivationText = computed(() => motivationData.value.text)
const motivationIcon = computed(() => motivationData.value.icon)
const motivationClass = computed(() => motivationData.value.class)
</script>

<style scoped lang="scss">
.user-progress-indicator {
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .progress-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .completion-text {
    font-size: 14px;
    color: #667eea;
    font-weight: 500;
  }
}

.progress-bar-wrapper {
  margin-bottom: 20px;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);

  &.excellent {
    background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
  }

  &.good {
    background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  }

  &.fair {
    background: linear-gradient(90deg, #e6a23c 0%, #ebb563 100%);
  }

  &.poor {
    background: linear-gradient(90deg, #f56c6c 0%, #f89898 100%);
  }
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid;

  .stat-icon {
    font-size: 20px;
    line-height: 1;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: #999;
    font-weight: 500;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  &.completed {
    border-left-color: #67c23a;

    .stat-icon {
      color: #67c23a;
    }
  }

  &.in-progress {
    border-left-color: #409eff;

    .stat-icon {
      color: #409eff;
    }
  }

  &.not-started {
    border-left-color: #999;

    .stat-icon {
      color: #999;
    }
  }
}

.progress-details {
  padding: 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-size: 13px;
    color: #666;
  }

  .detail-value {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
}

.motivation-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid;
  animation: slideIn 0.3s ease-out;

  .motivation-icon {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
  }

  .motivation-text {
    font-size: 13px;
    color: #333;
    font-weight: 500;
  }

  &.start {
    border-left-color: #667eea;
  }

  &.encouraging {
    border-left-color: #409eff;
  }

  &.progress {
    border-left-color: #e6a23c;
  }

  &.halfway {
    border-left-color: #f56c6c;
  }

  &.final {
    border-left-color: #67c23a;
  }

  &.complete {
    border-left-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .progress-stats {
    grid-template-columns: 1fr;
  }
}
</style>
