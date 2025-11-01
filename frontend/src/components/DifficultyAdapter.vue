<template>
  <div class="difficulty-adapter">
    <!-- Header -->
    <div class="adapter-header">
      <h3 class="adapter-title">
        <span class="adapter-icon">⚙️</span> 难度自适应系统
      </h3>
    </div>

    <!-- Current Difficulty Display -->
    <div class="current-difficulty-section">
      <div class="difficulty-card">
        <div class="card-content">
          <div class="difficulty-visual">
            <div class="difficulty-icon">{{ currentDifficultyEmoji }}</div>
            <div class="difficulty-info">
              <div class="difficulty-label">当前难度级别</div>
              <div class="difficulty-value">{{ currentDifficultyLabel }}</div>
            </div>
          </div>

          <div class="adjustment-indicator" v-if="suggestedAdjustment">
            <el-tag :type="adjustmentType" effect="light">
              {{ suggestedAdjustment }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <!-- Manual Difficulty Control -->
        <div class="manual-control">
          <span class="control-label">手动调整：</span>
          <el-slider
            v-model="manualDifficulty"
            :min="1"
            :max="5"
            :step="1"
            :marks="difficultyMarks"
            @change="handleDifficultyChange"
          />
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="performance-section">
      <h4 class="section-title">📊 性能指标</h4>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">🎯</span>
            <span class="metric-label">准确率</span>
          </div>
          <div class="metric-value">{{ performanceMetrics.accuracy }}%</div>
          <el-progress
            :percentage="performanceMetrics.accuracy"
            :color="getAccuracyColor(performanceMetrics.accuracy)"
            :show-text="false"
          />
          <p class="metric-status">{{ getAccuracyStatus(performanceMetrics.accuracy) }}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">⏱️</span>
            <span class="metric-label">完成速度</span>
          </div>
          <div class="metric-value">{{ performanceMetrics.speed }}x</div>
          <div class="speed-indicator" :class="getSpeedClass(performanceMetrics.speed)">
            {{ getSpeedLabel(performanceMetrics.speed) }}
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">✅</span>
            <span class="metric-label">完成率</span>
          </div>
          <div class="metric-value">{{ performanceMetrics.completion }}%</div>
          <el-progress
            :percentage="performanceMetrics.completion"
            :color="getCompletionColor(performanceMetrics.completion)"
            :show-text="false"
          />
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-icon">📈</span>
            <span class="metric-label">学习速度</span>
          </div>
          <div class="metric-value">{{ (performanceMetrics.learningSpeed || 1.0).toFixed(1) }}x</div>
          <p class="metric-status">{{ getLearningSpeedStatus(performanceMetrics.learningSpeed) }}</p>
        </div>
      </div>
    </div>

    <!-- Difficulty Adjustment Recommendation -->
    <div class="recommendation-section">
      <h4 class="section-title">💡 系统建议</h4>

      <div class="recommendation-card" :class="recommendationClass">
        <div class="recommendation-header">
          <span class="recommendation-icon">{{ recommendationIcon }}</span>
          <span class="recommendation-title">{{ recommendationTitle }}</span>
        </div>
        <p class="recommendation-description">{{ recommendationDescription }}</p>

        <div class="recommendation-actions">
          <el-button
            v-if="suggestedAdjustment === '增加难度'"
            type="primary"
            size="small"
            @click="increaseDifficulty"
          >
            接受建议，增加难度
          </el-button>
          <el-button
            v-else-if="suggestedAdjustment === '降低难度'"
            type="warning"
            size="small"
            @click="decreaseDifficulty"
          >
            接受建议，降低难度
          </el-button>
          <el-button text type="primary" size="small" @click="dismissRecommendation">
            暂时忽略
          </el-button>
        </div>
      </div>
    </div>

    <!-- Adaptation History -->
    <div class="history-section">
      <h4 class="section-title">📋 调整历史</h4>

      <div class="history-list">
        <div v-for="(entry, idx) in adaptationHistory" :key="idx" class="history-item">
          <div class="history-date">{{ formatDate(entry.date) }}</div>
          <div class="history-change">
            <span class="change-from">{{ entry.fromLevel }}</span>
            <span class="change-arrow">→</span>
            <span class="change-to">{{ entry.toLevel }}</span>
          </div>
          <div class="history-reason">{{ entry.reason }}</div>
        </div>

        <div v-if="adaptationHistory.length === 0" class="empty-history">
          还没有调整记录
        </div>
      </div>
    </div>

    <!-- Optimization Tips -->
    <div class="tips-section">
      <h4 class="section-title">🎯 优化建议</h4>

      <div class="tips-list">
        <div class="tip-item">
          <span class="tip-icon">✓</span>
          <span class="tip-text">保持一致的学习计划有助于系统更准确地调整难度</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">✓</span>
          <span class="tip-text">定期休息（5-10分钟）可以提高学习效率和准确率</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">✓</span>
          <span class="tip-text">尝试不同的学习资源可以更好地适应难度变化</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">✓</span>
          <span class="tip-text">完成所有练习有助于确保充分理解内容</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import mlRecommendationService from '@/services/mlRecommendationService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const manualDifficulty = ref(3)
const performanceMetrics = ref({
  accuracy: 75,
  speed: 1.2,
  completion: 82,
  learningSpeed: 1.1
})
const adaptationHistory = ref([])
const dismissedRecommendation = ref(false)

// Computed
const currentDifficultyLabel = computed(() => {
  const labels = ['', '初级', '简单', '中等', '高级', '专家']
  return labels[manualDifficulty.value] || '中等'
})

const currentDifficultyEmoji = computed(() => {
  const emojis = ['', '🌱', '🌿', '🌳', '🏔️', '🚀']
  return emojis[manualDifficulty.value] || '🌳'
})

const suggestedAdjustment = computed(() => {
  if (dismissedRecommendation.value) return null

  const { accuracy, completion, learningSpeed } = performanceMetrics.value

  if (accuracy > 85 && completion > 80 && learningSpeed > 1.1) {
    return '增加难度'
  } else if (accuracy < 60 || completion < 70) {
    return '降低难度'
  }
  return null
})

const adjustmentType = computed(() => {
  if (suggestedAdjustment.value === '增加难度') return 'success'
  if (suggestedAdjustment.value === '降低难度') return 'warning'
  return 'info'
})

const recommendationClass = computed(() => {
  if (suggestedAdjustment.value === '增加难度') return 'success'
  if (suggestedAdjustment.value === '降低难度') return 'warning'
  return 'normal'
})

const recommendationIcon = computed(() => {
  if (suggestedAdjustment.value === '增加难度') return '📈'
  if (suggestedAdjustment.value === '降低难度') return '📉'
  return '👍'
})

const recommendationTitle = computed(() => {
  if (suggestedAdjustment.value === '增加难度') return '表现优异，建议增加难度'
  if (suggestedAdjustment.value === '降低难度') return '建议调整难度以巩固基础'
  return '表现良好，保持当前难度'
})

const recommendationDescription = computed(() => {
  if (suggestedAdjustment.value === '增加难度') {
    return '你的表现非常出色！准确率和完成率都很高。系统建议增加难度来进一步挑战自己，以便更快地提升技能。'
  } else if (suggestedAdjustment.value === '降低难度') {
    return '你的准确率或完成率有些低。系统建议降低难度，以便更好地理解和掌握当前内容。'
  }
  return '你的表现稳定。保持当前难度，继续学习！'
})

// Difficulty marks
const difficultyMarks = {
  1: '初级',
  2: '简单',
  3: '中等',
  4: '高级',
  5: '专家'
}

// Methods
const handleDifficultyChange = () => {
  addToHistory(3, manualDifficulty.value, '手动调整')
  ElMessage.success(`难度已调整为: ${currentDifficultyLabel.value}`)
}

const increaseDifficulty = () => {
  if (manualDifficulty.value < 5) {
    manualDifficulty.value++
    handleDifficultyChange()
  }
}

const decreaseDifficulty = () => {
  if (manualDifficulty.value > 1) {
    manualDifficulty.value--
    handleDifficultyChange()
  }
}

const dismissRecommendation = () => {
  dismissedRecommendation.value = true
  ElMessage.info('建议已忽略')
  setTimeout(() => {
    dismissedRecommendation.value = false
  }, 300000) // 5 minutes
}

const getAccuracyColor = (accuracy) => {
  if (accuracy >= 80) return '#67c23a'
  if (accuracy >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getAccuracyStatus = (accuracy) => {
  if (accuracy >= 85) return '优秀'
  if (accuracy >= 70) return '良好'
  if (accuracy >= 60) return '合格'
  return '需要改进'
}

const getCompletionColor = (completion) => {
  if (completion >= 85) return '#67c23a'
  if (completion >= 70) return '#e6a23c'
  return '#f56c6c'
}

const getSpeedClass = (speed) => {
  if (speed > 1.2) return 'fast'
  if (speed < 0.8) return 'slow'
  return 'normal'
}

const getSpeedLabel = (speed) => {
  if (speed > 1.2) return '很快'
  if (speed > 1.0) return '快速'
  if (speed > 0.8) return '正常'
  return '较慢'
}

const getLearningSpeedStatus = (speed) => {
  const label = getSpeedLabel(speed)
  if (speed > 1.2) return '进度快于平均水平'
  if (speed < 0.8) return '进度慢于平均水平'
  return '进度符合预期'
}

const addToHistory = (fromLevel, toLevel, reason) => {
  if (fromLevel !== toLevel) {
    adaptationHistory.value.unshift({
      date: new Date(),
      fromLevel: difficultyMarks[fromLevel],
      toLevel: difficultyMarks[toLevel],
      reason
    })
    if (adaptationHistory.value.length > 10) {
      adaptationHistory.value.pop()
    }
  }
}

const formatDate = (date) => {
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

onMounted(() => {
  // Initialize adaptation history
  adaptationHistory.value = [
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      fromLevel: '简单',
      toLevel: '中等',
      reason: '自动调整：性能提升'
    },
    {
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      fromLevel: '初级',
      toLevel: '简单',
      reason: '自动调整：完成率高'
    }
  ]
})
</script>

<style scoped>
.difficulty-adapter {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.adapter-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.adapter-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.adapter-icon {
  font-size: 20px;
}

/* Current Difficulty Section */
.current-difficulty-section {
  margin-bottom: 24px;
}

.difficulty-card {
  padding: 16px;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%);
  border: 1px solid rgba(94, 124, 224, 0.2);
  border-radius: 8px;
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.difficulty-visual {
  display: flex;
  align-items: center;
  gap: 16px;
}

.difficulty-icon {
  font-size: 48px;
}

.difficulty-info {
  display: flex;
  flex-direction: column;
}

.difficulty-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.difficulty-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.adjustment-indicator {
  display: flex;
}

.manual-control {
  margin-top: 12px;
}

.control-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  display: block;
  margin-bottom: 8px;
}

.manual-control :deep(.el-slider) {
  margin-bottom: 0;
}

/* Performance Section */
.performance-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.metric-card {
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.metric-icon {
  font-size: 18px;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.metric-status {
  font-size: 10px;
  color: #6b7280;
  margin-top: 6px;
  margin-bottom: 0;
}

.speed-indicator {
  padding: 4px 8px;
  background: rgba(94, 124, 224, 0.1);
  color: #5e7ce0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.speed-indicator.fast {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.speed-indicator.slow {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

/* Recommendation Section */
.recommendation-section {
  margin-bottom: 24px;
}

.recommendation-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #909399;
  background: rgba(245, 247, 250, 0.6);
}

.recommendation-card.success {
  border-left-color: #67c23a;
  background: rgba(103, 194, 58, 0.05);
}

.recommendation-card.warning {
  border-left-color: #e6a23c;
  background: rgba(230, 162, 60, 0.05);
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.recommendation-icon {
  font-size: 20px;
}

.recommendation-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.recommendation-description {
  font-size: 12px;
  color: #6b7280;
  margin: 8px 0;
  line-height: 1.5;
}

.recommendation-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* History Section */
.history-section {
  margin-bottom: 24px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
  border-left: 3px solid #5e7ce0;
}

.history-date {
  font-size: 11px;
  color: #9ca3af;
  min-width: 70px;
}

.history-change {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.change-from {
  padding: 2px 6px;
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  border-radius: 3px;
  font-weight: 600;
}

.change-arrow {
  color: #d1d5db;
}

.change-to {
  padding: 2px 6px;
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  border-radius: 3px;
  font-weight: 600;
}

.history-reason {
  flex: 1;
  font-size: 11px;
  color: #6b7280;
}

.empty-history {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 12px;
}

/* Tips Section */
.tips-section {
  margin-bottom: 0;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: rgba(103, 194, 58, 0.05);
  border-left: 3px solid #67c23a;
  border-radius: 4px;
}

.tip-icon {
  color: #67c23a;
  font-weight: 700;
  min-width: 16px;
}

.tip-text {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .difficulty-adapter {
    padding: 16px;
  }

  .card-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .history-item {
    flex-wrap: wrap;
  }

  .recommendation-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-reason {
    width: 100%;
  }
}
</style>
