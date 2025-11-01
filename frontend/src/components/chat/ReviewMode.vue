<template>
  <div class="review-mode-container">
    <!-- Quit Confirmation Dialog -->
    <el-dialog v-model="showQuitDialog" title="Quit Review Session" width="30%">
      <p>Are you sure you want to quit? Your progress will be saved.</p>
      <template #footer>
        <el-button @click="showQuitDialog = false">Continue Reviewing</el-button>
        <el-button type="danger" @click="confirmQuit">Quit</el-button>
      </template>
    </el-dialog>

    <!-- Review Content -->
    <div v-if="!sessionComplete" class="review-content">
      <!-- Top Toolbar -->
      <div class="review-toolbar">
        <div class="toolbar-left">
          <button class="quit-btn" @click="quitReview">
            <el-icon><CircleClose /></el-icon>
            Quit
          </button>
          <div class="timer">
            <el-icon><Clock /></el-icon>
            {{ formatTime(reviewDuration) }}
          </div>
        </div>

        <div class="progress-info">
          {{ currentQuestionIndex + 1 }} / {{ questionsList.length }}
        </div>

        <div class="toolbar-right">
          <span class="session-info">Session: {{ sessionStartTime }}</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <el-progress
        :percentage="progressPercentage"
        :color="getProgressColor(progressPercentage)"
        class="review-progress"
      />

      <!-- Question Card -->
      <div class="question-card">
        <!-- Question Metadata -->
        <div class="question-header">
          <div class="header-left">
            <h2>{{ currentQuestion.title }}</h2>
            <div class="question-meta">
              <el-tag type="info">{{ currentQuestion.source }}</el-tag>
              <el-tag :type="getDifficultyType(currentQuestion.difficulty)">
                {{ currentQuestion.difficulty }}
              </el-tag>
              <el-tag>Knowledge: {{ currentQuestion.knowledgePoints?.join(', ') }}</el-tag>
            </div>
          </div>
        </div>

        <!-- Question Content -->
        <div class="question-body">
          <div class="question-content">{{ currentQuestion.content }}</div>
        </div>

        <!-- User Notes Display -->
        <div v-if="currentRecord.userNotes" class="user-notes-display">
          <strong>Your Notes:</strong>
          <div class="notes-content">{{ currentRecord.userNotes }}</div>
        </div>

        <!-- Statistics Card -->
        <div class="stats-card-review">
          <div class="stat-item">
            <span class="stat-label">Wrong Count</span>
            <span class="stat-number">{{ currentRecord.wrongCount }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">Correct Count</span>
            <span class="stat-number">{{ currentRecord.correctCount }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">Mastery</span>
            <span class="stat-number">{{ currentRecord.masteryLevel || '未知' }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">Next Review</span>
            <span class="stat-number">
              {{ currentRecord.nextReviewTime ? new Date(currentRecord.nextReviewTime).toLocaleDateString() : '-' }}
              <template v-if="currentRecord.intervalDays != null">（~{{ currentRecord.intervalDays }} 天）</template>
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="review-actions">
          <el-button
            type="danger"
            size="large"
            icon="Close"
            @click="markStillWrong"
            :loading="actionLoading"
          >
            还是不会 (Still Don't Know)
          </el-button>

          <el-button
            type="success"
            size="large"
            icon="Check"
            @click="markMastered"
            :loading="actionLoading"
          >
            已掌握 (Mastered)
          </el-button>
          <el-button
            type="warning"
            size="large"
            icon="QuestionFilled"
            @click="markDoubt"
            :loading="actionLoading"
          >
            存疑 (Doubt)
          </el-button>
        </div>

        <!-- Navigation -->
        <div class="review-navigation">
          <el-button
            :disabled="currentQuestionIndex === 0"
            icon="ArrowLeft"
            @click="previousQuestion"
          >
            Previous
          </el-button>

          <div class="nav-indicator">
            <span
              v-for="(q, idx) in questionsList"
              :key="idx"
              :class="['nav-dot', { active: idx === currentQuestionIndex, completed: reviewedQuestions.includes(idx) }]"
              @click="goToQuestion(idx)"
            ></span>
          </div>

          <el-button
            :disabled="currentQuestionIndex === questionsList.length - 1"
            icon="ArrowRight"
            @click="nextQuestion"
          >
            Next
          </el-button>
        </div>
      </div>
    </div>

    <!-- Completion Screen -->
    <div v-else class="completion-screen">
      <div class="completion-header">
        <el-icon class="success-icon"><SuccessFilled /></el-icon>
        <h1>Review Session Complete!</h1>
      </div>

      <div class="completion-stats">
        <div class="stat-box">
          <div class="stat-title">Questions Reviewed</div>
          <div class="stat-value">{{ reviewedQuestions.length }}</div>
        </div>

        <div class="stat-box">
          <div class="stat-title">Mastered</div>
          <div class="stat-value success">{{ masteredCount }}</div>
        </div>

        <div class="stat-box">
          <div class="stat-title">Still Learning</div>
          <div class="stat-value warning">{{ stillLearningCount }}</div>
        </div>

        <div class="stat-box">
          <div class="stat-title">Session Duration</div>
          <div class="stat-value">{{ formatTime(reviewDuration) }}</div>
        </div>
      </div>

      <div class="completion-chart">
        <el-progress
          type="circle"
          :percentage="masteryPercentage"
          :color="getProgressColor(masteryPercentage)"
          :width="200"
        />
      </div>

      <div class="completion-actions">
        <el-button type="primary" size="large" @click="returnHome">
          <el-icon><Back /></el-icon>
          Return to Home
        </el-button>

        <el-button size="large" @click="startNewSession">
          <el-icon><Refresh /></el-icon>
          Start New Session
        </el-button>

        <el-button size="large" @click="viewDetails">
          <el-icon><Document /></el-icon>
          View Details
        </el-button>
      </div>

      <div class="completion-message">
        <p v-if="masteryPercentage >= 80">Great work! You've mastered most questions!</p>
        <p v-else-if="masteryPercentage >= 50">Good progress! Keep practicing the remaining questions.</p>
        <p v-else>Keep up the practice! You're making progress.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { ElMessage } from 'element-plus'
import {
  CircleClose,
  Clock,
  ArrowLeft,
  ArrowRight,
  Close,
  Check,
  SuccessFilled,
  Back,
  Refresh,
  Document,
  QuestionFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const store = useWrongAnswersStore()

// State
const questionsList = ref([])
const currentQuestionIndex = ref(0)
const reviewedQuestions = ref([])
const sessionComplete = ref(false)
const actionLoading = ref(false)
const showQuitDialog = ref(false)
const reviewDuration = ref(0)
const sessionStartTime = ref(new Date().toLocaleTimeString())
let timerInterval = null
const reviewLogs = ref([])

// Computed properties
const currentRecord = computed(() => {
  if (currentQuestionIndex.value < questionsList.value.length) {
    return questionsList.value[currentQuestionIndex.value]
  }
  return {}
})

const currentQuestion = computed(() => {
  return {
    id: currentRecord.value.questionId,
    title: currentRecord.value.questionTitle || 'Question Title',
    content: currentRecord.value.questionContent || 'Question content goes here',
    source: currentRecord.value.source || 'unknown',
    difficulty: currentRecord.value.difficulty || 'medium',
    knowledgePoints: currentRecord.value.knowledgePoints || []
  }
})

const progressPercentage = computed(() => {
  if (questionsList.value.length === 0) return 0
  return Math.round((reviewedQuestions.value.length / questionsList.value.length) * 100)
})

const masteryPercentage = computed(() => {
  if (questionsList.value.length === 0) return 0
  const masteredCount = questionsList.value.filter(q => q.reviewStatus === 'mastered').length
  return Math.round((masteredCount / questionsList.value.length) * 100)
})

const masteredCount = computed(() => {
  return questionsList.value.filter(q => q.reviewStatus === 'mastered').length
})

const stillLearningCount = computed(() => {
  return questionsList.value.filter(q => q.reviewStatus !== 'mastered').length
})

// Methods
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

const getDifficultyType = (difficulty) => {
  const types = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return types[difficulty] || 'info'
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 50) return '#E6A23C'
  return '#F56C6C'
}

const markMastered = async () => {
  actionLoading.value = true
  try {
    const updated = await store.reviewOnce(currentRecord.value.id, { result: 'pass', timeSpentSec: reviewDuration.value })
    Object.assign(currentRecord.value, updated)
    currentRecord.value.reviewStatus = 'mastered'
    if (!reviewedQuestions.value.includes(currentQuestionIndex.value)) {
      reviewedQuestions.value.push(currentQuestionIndex.value)
    }
    ElMessage.success('Marked as mastered!')
    await loadLogs()

    // Auto advance to next question
    if (currentQuestionIndex.value < questionsList.value.length - 1) {
      setTimeout(() => {
        nextQuestion()
      }, 500)
    } else {
      setTimeout(() => {
        sessionComplete.value = true
      }, 500)
    }
  } catch (error) {
    ElMessage.error('Failed to update status')
  } finally {
    actionLoading.value = false
  }
}

const markStillWrong = async () => {
  actionLoading.value = true
  try {
    const updated = await store.reviewOnce(currentRecord.value.id, { result: 'fail', timeSpentSec: reviewDuration.value })
    Object.assign(currentRecord.value, updated)
    currentRecord.value.reviewStatus = 'reviewing'
    if (!reviewedQuestions.value.includes(currentQuestionIndex.value)) {
      reviewedQuestions.value.push(currentQuestionIndex.value)
    }
    ElMessage.info('Marked for continued review')
    await loadLogs()

    // Auto advance to next question
    if (currentQuestionIndex.value < questionsList.value.length - 1) {
      setTimeout(() => {
        nextQuestion()
      }, 500)
    } else {
      setTimeout(() => {
        sessionComplete.value = true
      }, 500)
    }
  } catch (error) {
    ElMessage.error('Failed to update status')
  } finally {
    actionLoading.value = false
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < questionsList.value.length - 1) {
    currentQuestionIndex.value++
  }
}

const goToQuestion = (index) => {
  currentQuestionIndex.value = index
}

const quitReview = () => {
  showQuitDialog.value = true
}

const confirmQuit = () => {
  showQuitDialog.value = false
  returnHome()
}

const returnHome = () => {
  router.push({ name: 'Home' })
}

const startNewSession = () => {
  currentQuestionIndex.value = 0
  reviewedQuestions.value = []
  sessionComplete.value = false
  reviewDuration.value = 0
  sessionStartTime.value = new Date().toLocaleTimeString()
  startTimer()
}

const viewDetails = () => {
  router.push({ name: 'WrongAnswers' })
}

const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  timerInterval = setInterval(() => {
    reviewDuration.value++
  }, 1000)
}

const loadLogs = async () => {
  if (!currentRecord.value || !currentRecord.value.id) return
  try {
    reviewLogs.value = await store.fetchReviewLogs(currentRecord.value.id)
  } catch (_) {
    reviewLogs.value = []
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Fetch questions due for review
    await store.fetchDueForReview()
    questionsList.value = store.wrongAnswers

    if (questionsList.value.length === 0) {
      ElMessage.info('No questions due for review')
      setTimeout(() => {
        returnHome()
      }, 2000)
    } else {
      startTimer()
    }
  } catch (error) {
    ElMessage.error('Failed to load review questions')
    setTimeout(() => {
      returnHome()
    }, 2000)
  }
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped lang="css">
.review-mode-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 20px;
}

/* Review Content */
.review-content {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 20px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.quit-btn {
  background: #f56c6c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: background 0.3s;
}

.quit-btn:hover {
  background: #dd001b;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-weight: 500;
}

.progress-info {
  color: #303133;
  font-weight: bold;
  font-size: 16px;
}

.session-info {
  color: #909399;
  font-size: 14px;
}

.review-progress {
  border-radius: 4px;
  overflow: hidden;
}

/* Question Card */
.question-card {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.question-header {
  margin-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.question-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.question-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.question-body {
  margin-bottom: 30px;
}

.question-content {
  font-size: 16px;
  line-height: 1.8;
  color: #606266;
  padding: 20px;
  background: #f5f7fa;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

.user-notes-display {
  margin-bottom: 20px;
  padding: 15px;
  background: #fdf6ec;
  border-left: 4px solid #e6a23c;
  border-radius: 4px;
}

.user-notes-display strong {
  color: #e6a23c;
}

.notes-content {
  margin-top: 10px;
  color: #606266;
  line-height: 1.6;
}

/* Stats Card Review */
.stats-card-review {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: white;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
}

.stat-divider {
  width: 2px;
  height: 50px;
  background: rgba(255, 255, 255, 0.3);
}

/* Review Actions */
.review-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
}

.review-actions :deep(.el-button) {
  padding: 12px 40px;
  font-size: 16px;
  min-width: 200px;
}

/* Navigation */
.review-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.nav-indicator {
  display: flex;
  gap: 8px;
}

.nav-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dcdfe6;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-dot.active {
  background: #667eea;
  transform: scale(1.3);
}

.nav-dot.completed {
  background: #67c23a;
}

.nav-dot:hover {
  transform: scale(1.2);
}

/* Completion Screen */
.completion-screen {
  background: white;
  border-radius: 8px;
  padding: 60px 40px;
  text-align: center;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.completion-header {
  margin-bottom: 40px;
}

.success-icon {
  font-size: 60px;
  color: #67c23a;
  margin-bottom: 20px;
}

.completion-header h1 {
  margin: 20px 0 0 0;
  font-size: 32px;
  color: #303133;
}

.completion-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.stat-box {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.completion-chart {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.completion-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.completion-actions :deep(.el-button) {
  width: 100%;
  padding: 12px 20px;
  font-size: 16px;
}

.completion-message {
  color: #606266;
  font-size: 16px;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .review-mode-container {
    padding: 10px;
  }

  .question-card {
    padding: 20px;
  }

  .review-toolbar {
    flex-direction: column;
    gap: 15px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .review-actions {
    flex-direction: column;
  }

  .review-actions :deep(.el-button) {
    min-width: auto;
  }

  .question-header h2 {
    font-size: 20px;
  }

  .completion-stats {
    grid-template-columns: 1fr;
  }

  .stats-card-review {
    flex-direction: column;
    gap: 15px;
  }

  .stat-divider {
    display: none;
  }
}
</style>
