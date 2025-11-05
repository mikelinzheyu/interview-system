<template>
  <div class="learning-path-visualization">
    <div class="viz-header">
      <h3 class="title">📚 学习路径</h3>
      <p class="subtitle">{{ specialization?.name }}</p>
    </div>

    <div class="overall-progress">
      <div class="progress-info">
        <span class="label">总体进度</span>
        <span class="percentage">{{ overallProgress }}%</span>
      </div>
      <el-progress :percentage="overallProgress" :color="getProgressColor(overallProgress)" :height="12" />
      <div class="progress-text">预计完成时间: {{ totalDays }} 天</div>
    </div>

    <div class="stages-container">
      <div v-for="(stage, index) in stages" :key="stage.stage" class="stage">
        <div class="stage-card">
          <div class="stage-header">
            <div class="stage-number" :style="{ backgroundColor: getStageColor(index) }">
              {{ stage.stage }}
            </div>
            <div class="stage-title">
              <h4>{{ stage.name }}</h4>
              <p>{{ stage.description }}</p>
            </div>
            <div class="stage-duration">{{ stage.estimatedDays }}<span>天</span></div>
          </div>

          <div class="stage-progress">
            <div class="progress-stats">
              <div class="stat">
                <span class="stat-label">完成度</span>
                <span class="stat-value">{{ stage.progress }}%</span>
              </div>
            </div>
            <el-progress :percentage="stage.progress" :color="getProgressColor(stage.progress)" :height="8" />
          </div>

          <div class="stage-content">
            <h5 class="content-title">📖 学习内容</h5>
            <div class="topics-list">
              <div v-for="(topic, idx) in stage.topics" :key="idx" class="topic-item">
                {{ topic }}
              </div>
            </div>
          </div>

          <div class="stage-actions">
            <el-button type="primary" size="small" @click="startStage(stage.stage)">
              开始学习
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <el-button type="primary" size="large" @click="startLearning">
        立即开始学习
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  specialization: {
    type: Object,
    default: () => ({
      name: '',
      learningPath: []
    })
  }
})

const emit = defineEmits(['start-learning'])

const stageProgress = ref({})

const stages = computed(() => {
  return (props.specialization?.learningPath || []).map(stage => ({
    ...stage,
    progress: stageProgress.value[stage.stage] || 0
  }))
})

const totalDays = computed(() => {
  return stages.value.reduce((sum, stage) => sum + (stage.estimatedDays || 0), 0)
})

const overallProgress = computed(() => {
  if (stages.value.length === 0) return 0
  const avg = stages.value.reduce((sum, stage) => sum + stage.progress, 0) / stages.value.length
  return Math.round(avg)
})

function getStageColor(index) {
  const colors = ['#667eea', '#764ba2', '#f093fb']
  return colors[index % colors.length]
}

function getProgressColor(percentage) {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#409eff'
  if (percentage >= 40) return '#e6a23c'
  return '#f56c6c'
}

function startStage(stageNum) {
  ElMessage.success(`开始学习第 ${stageNum} 阶段`)
  emit('start-learning', stageNum)
}

function startLearning() {
  emit('start-learning')
}
</script>

<style scoped lang="scss">
.learning-path-visualization {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
}

.viz-header {
  margin-bottom: 24px;

  .title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }

  .subtitle {
    margin: 8px 0 0 0;
    color: #666;
    font-size: 14px;
  }
}

.overall-progress {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;

    .percentage {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }
  }

  .progress-text {
    margin-top: 8px;
    font-size: 12px;
    color: #999;
  }
}

.stages-container {
  margin-bottom: 32px;
}

.stage {
  margin-bottom: 24px;
}

.stage-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stage-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;

  .stage-number {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .stage-title {
    flex: 1;

    h4 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #666;
    }
  }

  .stage-duration {
    flex-shrink: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;

    span {
      font-size: 12px;
      color: #999;
      margin-left: 4px;
    }
  }
}

.stage-progress {
  margin-bottom: 20px;

  .progress-stats {
    margin-bottom: 12px;

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .stat-label {
        font-size: 12px;
        color: #999;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }
  }
}

.stage-content {
  margin-bottom: 20px;

  .content-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .topics-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .topic-item {
      padding: 8px;
      border-radius: 6px;
      background: #f5f7fa;
      font-size: 13px;
      color: #333;
    }
  }
}

.stage-actions {
  display: flex;
  gap: 8px;
}

.quick-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
