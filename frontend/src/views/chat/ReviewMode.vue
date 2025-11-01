<template>
  <div class="review-mode-container">
    <!-- Header with progress -->
    <div class="review-header">
      <div class="progress-section">
        <el-button icon="ArrowLeft" @click="handleQuit" text></el-button>
        <div class="progress-bar">
          <el-progress :percentage="progressPercentage" />
          <span class="progress-text">{{ currentIndex + 1 }}/{{ totalQuestions }}</span>
        </div>
      </div>
      <div class="timer">
        <el-icon><Clock /></el-icon>
        <span>{{ formatTime(reviewTime) }}</span>
      </div>
    </div>

    <!-- Review Content -->
    <div class="review-content" v-if="currentQuestion">
      <!-- Question Card -->
      <el-card class="question-card">
        <div class="question-section">
          <div class="question-meta">
            <el-tag :type="getDifficultyTagType(currentQuestion.difficulty)">
              {{ getDifficultyLabel(currentQuestion.difficulty) }}
            </el-tag>
            <el-tag type="info">{{ currentQuestion.source }}</el-tag>
          </div>
          <h2 class="question-title">{{ currentQuestion.questionTitle }}</h2>
          <div class="question-content">
            {{ currentQuestion.questionContent }}
          </div>
        </div>
      </el-card>

      <!-- User Notes (if exists) -->
      <el-card v-if="currentQuestion.userNotes" class="notes-card">
        <template #header>
          <span class="card-title">你的笔记</span>
        </template>
        <p class="notes-content">{{ currentQuestion.userNotes }}</p>
      </el-card>

      <!-- Statistics -->
      <el-card class="stats-card">
        <div class="stats-grid">
          <div class="stat">
            <span class="label">错误次数</span>
            <span class="value">{{ currentQuestion.wrongCount }}</span>
          </div>
          <div class="stat">
            <span class="label">正确次数</span>
            <span class="value">{{ currentQuestion.correctCount }}</span>
          </div>
          <div class="stat">
            <span class="label">掌握度</span>
            <span class="value">{{ calculateMastery(currentQuestion) }}%</span>
          </div>
        </div>
      </el-card>

      <!-- Action Buttons -->
      <div class="review-actions">
        <el-button
          type="danger"
          size="large"
          @click="handleMarkWrong"
          :loading="marking"
        >
          <el-icon><Close /></el-icon>
          还是不会
        </el-button>
        <el-button
          type="success"
          size="large"
          @click="handleMarkCorrect"
          :loading="marking"
        >
          <el-icon><SuccessFilled /></el-icon>
          已掌握
        </el-button>
      </div>

      <!-- Navigation -->
      <div class="review-navigation">
        <el-button
          :disabled="currentIndex === 0"
          @click="previousQuestion"
        >
          <el-icon><ArrowLeft /></el-icon>
          上一题
        </el-button>
        <el-button
          :disabled="currentIndex === totalQuestions - 1"
          @click="nextQuestion"
        >
          下一题
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Completion Screen -->
    <div v-else-if="isCompleted" class="completion-screen">
      <div class="completion-content">
        <div class="completion-icon">
          <el-icon><SuccessFilled /></el-icon>
        </div>
        <h2>复习完成！</h2>
        <div class="completion-stats">
          <div class="stat">
            <span class="label">复习题数</span>
            <span class="value">{{ totalQuestions }}</span>
          </div>
          <div class="stat">
            <span class="label">耗时</span>
            <span class="value">{{ formatTime(reviewTime) }}</span>
          </div>
          <div class="stat">
            <span class="label">掌握进度</span>
            <span class="value">{{ masteredCount }}/{{ totalQuestions }}</span>
          </div>
        </div>

        <div class="completion-actions">
          <el-button type="primary" size="large" @click="handleReturnHome">
            返回首页
          </el-button>
          <el-button size="large" @click="handleStartNewSession">
            开始新一轮复习
          </el-button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-else class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- Quit Dialog -->
    <el-dialog
      v-model="showQuitDialog"
      title="确认退出复习?"
      width="400px"
    >
      <div class="quit-dialog-content">
        <p>你已完成 {{ currentIndex }} 道题目</p>
        <p v-if="masteredCount > 0" class="text-success">已掌握 {{ masteredCount }} 道题目</p>
        <p>确定要退出吗？</p>
      </div>
      <template #footer>
        <el-button @click="showQuitDialog = false">继续复习</el-button>
        <el-button type="primary" @click="confirmQuit">确认退出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Close,
  SuccessFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const wrongAnswersStore = useWrongAnswersStore()

const questions = ref([])
const currentIndex = ref(0)
const marking = ref(false)
const reviewTime = ref(0)
const isCompleted = ref(false)
const showQuitDialog = ref(false)
const sessionStartTime = ref(null)

onMounted(async () => {
  await loadReviewQuestions()
  sessionStartTime.value = Date.now()
  startTimer()
})

onUnmounted(() => {
  clearInterval(timerInterval)
})

let timerInterval = null

async function loadReviewQuestions() {
  try {
    const dueQuestions = await wrongAnswersStore.fetchDueForReview()
    questions.value = dueQuestions || wrongAnswersStore.wrongAnswers
    if (questions.value.length === 0) {
      ElMessage.info('暂无待复习题目')
      router.push('/wrong-answers')
    }
  } catch (error) {
    ElMessage.error('加载题目失败: ' + error.message)
    router.push('/wrong-answers')
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    reviewTime.value++
  }, 1000)
}

const currentQuestion = computed(() => {
  return questions.value[currentIndex.value]
})

const totalQuestions = computed(() => questions.value.length)

const progressPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((currentIndex.value / totalQuestions.value) * 100)
})

const masteredCount = computed(() => {
  return questions.value.filter(q => q.reviewStatus === 'mastered').length
})

async function handleMarkWrong() {
  try {
    marking.value = true
    const question = currentQuestion.value

    // Update wrong count
    question.wrongCount = (question.wrongCount || 0) + 1
    question.lastWrongTime = new Date().toISOString()
    question.reviewStatus = 'reviewing'

    // Save to store
    await wrongAnswersStore.recordWrongAnswer(
      question.questionId,
      question.source,
      false,
      {
        sourceInstanceId: question.sourceInstanceId,
        questionTitle: question.questionTitle,
        questionContent: question.questionContent,
        difficulty: question.difficulty,
        knowledgePoints: question.knowledgePoints
      }
    )

    nextQuestion()
  } catch (error) {
    ElMessage.error('标记失败: ' + error.message)
  } finally {
    marking.value = false
  }
}

async function handleMarkCorrect() {
  try {
    marking.value = true
    const question = currentQuestion.value

    // Update correct count
    question.correctCount = (question.correctCount || 0) + 1
    question.lastCorrectTime = new Date().toISOString()

    // Check if mastered (3 consecutive correct)
    if (question.correctCount >= 3) {
      question.reviewStatus = 'mastered'
      ElMessage.success('恭喜！题目已掌握！')
    } else {
      question.reviewStatus = 'reviewing'
    }

    // Save to store
    await wrongAnswersStore.recordWrongAnswer(
      question.questionId,
      question.source,
      true,
      {
        sourceInstanceId: question.sourceInstanceId,
        questionTitle: question.questionTitle,
        questionContent: question.questionContent,
        difficulty: question.difficulty,
        knowledgePoints: question.knowledgePoints
      }
    )

    nextQuestion()
  } catch (error) {
    ElMessage.error('标记失败: ' + error.message)
  } finally {
    marking.value = false
  }
}

function nextQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
  } else {
    completeReview()
  }
}

function previousQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function completeReview() {
  clearInterval(timerInterval)
  isCompleted.value = true
}

function calculateMastery(question) {
  const total = (question.wrongCount || 0) + (question.correctCount || 0)
  if (total === 0) return 0
  return Math.round((question.correctCount / total) * 100)
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

function getDifficultyLabel(difficulty) {
  const labels = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return labels[difficulty] || difficulty
}

function getDifficultyTagType(difficulty) {
  const types = {
    'easy': 'success',
    'medium': 'warning',
    'hard': 'danger'
  }
  return types[difficulty] || 'info'
}

function handleQuit() {
  showQuitDialog.value = true
}

function confirmQuit() {
  clearInterval(timerInterval)
  router.push('/wrong-answers')
}

function handleReturnHome() {
  clearInterval(timerInterval)
  router.push('/')
}

function handleStartNewSession() {
  clearInterval(timerInterval)
  location.reload()
}
</script>

<style scoped>
.review-mode-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.progress-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar :deep(.el-progress) {
  flex: 1;
}

.progress-bar :deep(.el-progress__bar) {
  background-color: #67c23a;
}

.progress-text {
  min-width: 60px;
  text-align: right;
  font-weight: 600;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.review-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.question-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-meta {
  display: flex;
  gap: 8px;
}

.question-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.question-content {
  padding: 16px;
  background: #f5f7fa;
  border-left: 4px solid #667eea;
  border-radius: 4px;
  line-height: 1.8;
  color: #666;
  font-size: 16px;
}

.notes-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-title {
  font-weight: 600;
  color: #333;
}

.notes-content {
  margin: 0;
  padding: 12px;
  background: #e8f5e9;
  border-left: 4px solid #67c23a;
  border-radius: 4px;
  color: #666;
  line-height: 1.6;
}

.stats-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.stat .value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.review-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.review-actions :deep(.el-button) {
  height: 50px;
  font-size: 16px;
  font-weight: 600;
}

.review-navigation {
  display: flex;
  gap: 12px;
}

.review-navigation :deep(.el-button) {
  flex: 1;
  height: 40px;
}

/* Completion Screen */
.completion-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.completion-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
}

.completion-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 16px;
}

.completion-content h2 {
  margin: 0 0 24px 0;
  font-size: 32px;
  color: #333;
}

.completion-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.completion-stats .stat {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.completion-stats .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.completion-stats .value {
  font-size: 24px;
  font-weight: 600;
  color: #667eea;
}

.completion-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.completion-actions :deep(.el-button) {
  height: 45px;
  font-size: 16px;
}

/* Quit Dialog */
.quit-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quit-dialog-content p {
  margin: 0;
  color: #666;
}

.text-success {
  color: #67c23a;
  font-weight: 600;
}

/* Loading */
.loading-container {
  flex: 1;
  padding: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    gap: 12px;
  }

  .progress-section {
    width: 100%;
  }

  .question-title {
    font-size: 20px;
  }

  .question-content {
    font-size: 14px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .review-actions {
    grid-template-columns: 1fr;
  }

  .completion-stats {
    grid-template-columns: 1fr;
  }

  .completion-content {
    padding: 20px;
    max-width: 100%;
  }
}
</style>
