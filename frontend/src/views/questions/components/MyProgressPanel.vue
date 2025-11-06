<template>
  <div class="progress-panel">
    <el-skeleton v-if="loading" animated :rows="6" />

    <template v-else>
      <div class="panel-section">
        <h3 class="section-title">学习统计</h3>
        <div class="stats-grid">
          <div v-for="card in statCards" :key="card.id" class="stat-card">
            <div class="stat-icon">{{ card.icon }}</div>
            <div class="stat-content">
              <p class="stat-label">{{ card.label }}</p>
              <p class="stat-value">{{ card.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <h3 class="section-title">最近学习</h3>
        <div v-if="recentItems.length" class="learning-list">
          <div v-for="item in recentItems" :key="item.id" class="learning-item">
            <div class="item-info">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-meta">{{ item.date }}</p>
            </div>
            <div class="item-progress">
              <span class="progress-value">{{ item.progress }}%</span>
              <el-progress :percentage="item.progress" :show-text="false" size="small" />
            </div>
          </div>
        </div>
        <el-empty v-else description="还没有学习记录，开始第一个领域吧！" />
      </div>

      <div class="panel-section">
        <h3 class="section-title">目标追踪</h3>
        <div v-if="goalItems.length" class="goals-list">
          <div v-for="goal in goalItems" :key="goal.id" class="goal-item">
            <div class="goal-header">
              <p class="goal-name">{{ goal.name }}</p>
              <el-tag size="small" :type="goal.tagType">{{ goal.statusLabel }}</el-tag>
            </div>
            <p class="goal-description">{{ goal.description }}</p>
            <div class="goal-progress">
              <span>{{ goal.completed }}/{{ goal.total }}</span>
              <el-progress :percentage="goal.percentage" :show-text="false" size="small" />
            </div>
          </div>
        </div>
        <el-empty v-else description="设置学习目标，系统会帮你追踪进度" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  summary: {
    type: Object,
    default: () => ({})
  },
  recentItems: {
    type: Array,
    default: () => []
  },
  goals: {
    type: Array,
    default: () => []
  }
})

const statCards = computed(() => {
  const summary = props.summary || {}
  const safeNumber = value => (Number.isFinite(Number(value)) ? Number(value) : 0)

  return [
    {
      id: 'domains',
      icon: '📚',
      label: '参与学科',
      value: safeNumber(summary.domainsTracked || summary.domainsLearned || 0)
    },
    {
      id: 'questions',
      icon: '📝',
      label: '已完成题目',
      value: safeNumber(summary.questionsCompleted || summary.questionsAttempted || 0)
    },
    {
      id: 'accuracy',
      icon: '🎯',
      label: '总体正确率',
      value: `${safeNumber(summary.accuracy || 0)}%`
    },
    {
      id: 'streak',
      icon: '🔥',
      label: '连续学习天数',
      value: safeNumber(summary.streak || 0)
    }
  ]
})

const goalItems = computed(() =>
  props.goals.map(goal => {
    const completed = Number.isFinite(Number(goal.completed)) ? Number(goal.completed) : 0
    const total = Number.isFinite(Number(goal.total)) && Number(goal.total) > 0 ? Number(goal.total) : 1
    const percentage = Math.min(100, Math.round((completed / total) * 100))

    const status = goal.status || (percentage >= 100 ? 'completed' : percentage >= 60 ? 'on-track' : 'at-risk')
    const labelMap = {
      completed: '已完成',
      'on-track': '进行中',
      'at-risk': '需加油'
    }
    const typeMap = {
      completed: 'success',
      'on-track': 'info',
      'at-risk': 'warning'
    }

    return {
      ...goal,
      completed,
      total,
      percentage,
      statusLabel: goal.statusLabel || labelMap[status] || '进行中',
      tagType: typeMap[status] || 'info'
    }
  })
)
</script>

<style scoped lang="scss">
.progress-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
}

.panel-section {
  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 16px 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  padding: 16px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;

  .stat-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;

    .stat-label {
      font-size: 12px;
      opacity: 0.8;
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }
  }
}

.learning-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.learning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f9fafb;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.05);
}

.item-info {
  .item-name {
    margin: 0 0 4px 0;
    font-weight: 600;
    color: #1f2937;
  }

  .item-meta {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }
}

.item-progress {
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;

  .progress-value {
    font-size: 12px;
    color: #4b5563;
    width: 42px;
  }
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goal-item {
  padding: 14px 16px;
  border-radius: 12px;
  background: #f9fafb;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.05);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .goal-name {
    margin: 0;
    font-weight: 600;
    color: #1f2937;
  }
}

.goal-description {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 13px;
}

.goal-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #4b5563;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
