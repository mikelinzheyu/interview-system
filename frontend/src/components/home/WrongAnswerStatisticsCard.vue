<template>
  <el-card class="wrong-answer-card">
    <!-- Header with title and action button -->
    <template #header>
      <div class="card-header">
        <div class="title-section">
          <el-icon class="title-icon"><WarningFilled /></el-icon>
          <span class="title">错题集</span>
          <el-tag v-if="hasWrongAnswers" type="danger" size="small">{{ totalWrongCount }}</el-tag>
        </div>
        <el-button
          type="primary"
          size="small"
          @click="navigateToWrongAnswers"
        >
          查看详情
        </el-button>
      </div>
    </template>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasWrongAnswers" class="empty-state">
      <el-icon class="empty-icon"><SuccessFilled /></el-icon>
      <p class="empty-text">暂无错题记录，继续加油！</p>
    </div>

    <!-- Statistics content -->
    <div v-else class="statistics-content">
      <!-- Progress circles -->
      <div class="progress-grid">
        <!-- Mastered -->
        <div class="progress-item">
          <div class="progress-circle">
            <el-progress
              type="circle"
              :percentage="masteredPercentage"
              color="#67c23a"
            />
          </div>
          <div class="progress-label">
            <span class="label-text">已掌握</span>
            <span class="label-count">{{ masteredCount }}</span>
          </div>
        </div>

        <!-- Reviewing -->
        <div class="progress-item">
          <div class="progress-circle">
            <el-progress
              type="circle"
              :percentage="reviewingPercentage"
              color="#e6a23c"
            />
          </div>
          <div class="progress-label">
            <span class="label-text">复习中</span>
            <span class="label-count">{{ reviewingCount }}</span>
          </div>
        </div>

        <!-- Unreviewed -->
        <div class="progress-item">
          <div class="progress-circle">
            <el-progress
              type="circle"
              :percentage="unreviewedPercentage"
              color="#f56c6c"
            />
          </div>
          <div class="progress-label">
            <span class="label-text">待复习</span>
            <span class="label-count">{{ unreviewedCount }}</span>
          </div>
        </div>
      </div>

      <!-- Source breakdown -->
      <div class="source-breakdown">
        <h4 class="section-title">来源分布</h4>
        <div class="source-list">
          <div
            v-for="(count, source) in sourceBreakdown"
            :key="source"
            class="source-item"
          >
            <span class="source-name">{{ getSourceLabel(source) }}</span>
            <el-progress
              :percentage="getSourcePercentage(source)"
              :color="getSourceColor(source)"
              class="source-progress"
            />
            <span class="source-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Difficulty breakdown -->
      <div class="difficulty-breakdown">
        <h4 class="section-title">难度分布</h4>
        <div class="difficulty-list">
          <div
            v-for="(count, difficulty) in difficultyBreakdown"
            :key="difficulty"
            class="difficulty-item"
          >
            <el-tag :type="getDifficultyTagType(difficulty)" size="small">
              {{ getDifficultyLabel(difficulty) }}: {{ count }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <el-button
          type="success"
          :disabled="reviewingCount === 0"
          @click="handleReview"
        >
          <el-icon><VideoPlay /></el-icon>
          开始复习
        </el-button>
        <el-button
          type="info"
          @click="handleGeneratePlan"
          :loading="generatingPlan"
        >
          <el-icon><Refresh /></el-icon>
          生成复习计划
        </el-button>
      </div>
      <div v-if="nextIntervalHint != null" class="interval-hint">
        计划间隔提示：约 {{ nextIntervalHint }} 天（基于当前错题的 SM‑2 进度）
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import {
  WarningFilled,
  SuccessFilled,
  VideoPlay,
  Refresh
} from '@element-plus/icons-vue'

const router = useRouter()
const wrongAnswersStore = useWrongAnswersStore()
const generatingPlan = ref(false)

// Computed properties from store
const loading = computed(() => wrongAnswersStore.loading)
const hasWrongAnswers = computed(() => wrongAnswersStore.totalWrongCount > 0)
const totalWrongCount = computed(() => wrongAnswersStore.totalWrongCount)
const masteredCount = computed(() => wrongAnswersStore.masteredCount)
const reviewingCount = computed(() => wrongAnswersStore.reviewingCount)
const unreviewedCount = computed(() => wrongAnswersStore.unreviewedCount)
const totalCount = computed(() => {
  const total = masteredCount.value + reviewingCount.value + unreviewedCount.value
  return total || 1 // Prevent division by zero
})

const masteredPercentage = computed(() => {
  return Math.round((masteredCount.value / totalCount.value) * 100)
})

const reviewingPercentage = computed(() => {
  return Math.round((reviewingCount.value / totalCount.value) * 100)
})

const unreviewedPercentage = computed(() => {
  return Math.round((unreviewedCount.value / totalCount.value) * 100)
})

const sourceBreakdown = computed(() => {
  return wrongAnswersStore.statistics?.countBySource || {}
})

const difficultyBreakdown = computed(() => {
  return wrongAnswersStore.statistics?.countByDifficulty || {}
})

// Derive a simple next-interval hint from existing wrongAnswers in store
const nextIntervalHint = computed(() => {
  const items = Array.isArray(wrongAnswersStore.wrongAnswers) ? wrongAnswersStore.wrongAnswers : []
  if (items.length === 0) return null
  const withDays = items
    .filter(it => it && it.nextReviewTime)
    .map(it => ({ d: it.intervalDays, t: new Date(it.nextReviewTime) }))
    .filter(x => typeof x.d === 'number' && x.d >= 0)
  if (withDays.length === 0) return null
  return Math.min(...withDays.map(x => x.d))
})

// Methods
const getSourceLabel = (source) => {
  const labels = {
    'ai_interview': 'AI模拟面试',
    'question_bank': '题库练习',
    'mock_exam': '模拟考试',
    'custom': '自定义'
  }
  return labels[source] || source
}

const getSourceColor = (source) => {
  const colors = {
    'ai_interview': '#409eff',
    'question_bank': '#67c23a',
    'mock_exam': '#e6a23c',
    'custom': '#9b59b6'
  }
  return colors[source] || '#909399'
}

const getSourcePercentage = (source) => {
  const count = sourceBreakdown.value[source] || 0
  const total = totalWrongCount.value || 1
  return Math.round((count / total) * 100)
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return labels[difficulty] || difficulty
}

const getDifficultyTagType = (difficulty) => {
  const types = {
    'easy': 'success',
    'medium': 'warning',
    'hard': 'danger'
  }
  return types[difficulty] || 'info'
}

const navigateToWrongAnswers = () => {
  router.push('/wrong-answers')
}

const handleReview = () => {
  router.push('/wrong-answers/review')
}

const handleGeneratePlan = async () => {
  try {
    generatingPlan.value = true
    await wrongAnswersStore.generateReviewPlan()
    await wrongAnswersStore.fetchStatistics()
  } finally {
    generatingPlan.value = false
  }
}

// Initialize
onMounted(async () => {
  await wrongAnswersStore.fetchStatistics()
})
</script>

<style scoped>
.wrong-answer-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.wrong-answer-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.title-icon {
  font-size: 20px;
  color: #f56c6c;
}

.loading-state {
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 12px;
}

.empty-text {
  color: #909399;
  font-size: 14px;
}

.statistics-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Progress Grid */
.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-circle {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-circle :deep(.el-progress__circle) {
  transform: rotate(-90deg);
}

.progress-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.label-text {
  font-size: 12px;
  color: #909399;
}

.label-count {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* Source Breakdown */
.source-breakdown,
.difficulty-breakdown {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.source-name {
  min-width: 80px;
  font-size: 13px;
  color: #666;
}

.source-progress {
  flex: 1;
}

.source-progress :deep(.el-progress__bar) {
  background-color: currentcolor;
}

.source-count {
  min-width: 40px;
  text-align: right;
  font-weight: 600;
  color: #333;
}

/* Difficulty Breakdown */
.difficulty-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.difficulty-item {
  flex: 1;
  min-width: 120px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.action-buttons :deep(.el-button) {
  flex: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .progress-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons :deep(.el-button) {
    width: 100%;
  }
}
</style>
