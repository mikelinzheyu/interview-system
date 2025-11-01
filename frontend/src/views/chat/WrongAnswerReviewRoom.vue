<template>
  <div class="wrong-answer-review-room">
    <!-- Header with navigation -->
    <div class="review-header">
      <div class="review-header-left">
        <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
        <h1 class="review-title">{{ wrongAnswer?.questionTitle || '错题详情' }}</h1>
      </div>
      <div class="review-header-right">
        <el-button
          type="primary"
          :disabled="showRetryPanel"
          @click="retryAnswer"
        >
          <el-icon><VideoPlay /></el-icon>
          再答一次
        </el-button>
        <el-button @click="markAsLearned">
          <el-icon><SuccessFilled /></el-icon>
          我已掌握
        </el-button>
        <el-button @click="addToPractice">
          <el-icon><Plus /></el-icon>
          加入练习
        </el-button>
      </div>
    </div>

    <!-- Main content -->
    <div class="review-main">
      <!-- Retry Answer Panel (新增) -->
      <RetryAnswerPanel
        v-if="showRetryPanel"
        :wrong-answer="wrongAnswer"
        @close="showRetryPanel = false"
        @submit="handleRetrySubmit"
      />

      <!-- Module 1: Context Recap (情境回顾) -->
      <ContextRecap
        v-if="wrongAnswer && !showRetryPanel"
        :wrong-answer="wrongAnswer"
        :loading="loading"
      />

      <!-- Module 2: Analysis Comparison (对比分析 - 核心！) -->
      <AnalysisComparison
        v-if="wrongAnswer && !showRetryPanel"
        :wrong-answer="wrongAnswer"
        :loading="loading"
      />

      <!-- Module 3: Learning Zone (学习提升) -->
      <LearningZone
        v-if="wrongAnswer && !showRetryPanel"
        :wrong-answer="wrongAnswer"
        :loading="loading"
      />

      <!-- Module 4: Action Bar (操作栏) -->
      <ReviewActionBar
        v-if="!showRetryPanel"
        :wrong-answer-id="wrongAnswerId"
        @retry="retryAnswer"
        @mark-learned="markAsLearned"
        @add-practice="addToPractice"
      />
    </div>

    <!-- Loading state -->
    <el-skeleton v-if="loading" :rows="15" animated />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, VideoPlay, SuccessFilled, Plus } from '@element-plus/icons-vue'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import ContextRecap from '@/components/WrongAnswerReview/ContextRecap.vue'
import AnalysisComparison from '@/components/WrongAnswerReview/AnalysisComparison.vue'
import LearningZone from '@/components/WrongAnswerReview/LearningZone.vue'
import ReviewActionBar from '@/components/WrongAnswerReview/ReviewActionBar.vue'
import RetryAnswerPanel from '@/components/WrongAnswerReview/RetryAnswerPanel.vue'

const router = useRouter()
const route = useRoute()
const chatStore = useChatWorkspaceStore()

// Get recordId from route params
const wrongAnswerId = computed(() => route.params.recordId || route.params.id)

// State
const loading = ref(true)
const wrongAnswer = ref(null)
const showRetryPanel = ref(false)

// Load detailed analysis data
const loadWrongAnswer = async () => {
  try {
    loading.value = true
    // 这里调用 API 获取完整的分析数据
    // const response = await api.getWrongAnswerAnalysis(wrongAnswerId.value)
    // wrongAnswer.value = response.data

    // 临时模拟数据（等待后端 API）
    wrongAnswer.value = {
      id: wrongAnswerId.value,
      questionTitle: '如何处理 JavaScript 中的并发问题?',
      questionContent: '详细解释你如何在 JavaScript 中处理并发问题，包括 Promise、async/await 的使用...',
      source: 'ai_interview',
      sessionId: 'session-001',
      sessionLabel: 'XX 公司 - 高级前端工程师',
      errorTypes: ['knowledge', 'logic'],

      // 情境回顾
      context: {
        interviewTitle: 'XX 公司 - 高级前端工程师面试',
        askerVoiceUrl: 'https://example.com/audio/question.mp3',
        timestamp: '2025-10-30 14:30:00'
      },

      // 我的回答
      myAnswer: {
        content: '在 JavaScript 中，我们可以使用 Promise 和 async/await 来处理异步操作。Promise 有三种状态：pending、fulfilled、rejected...',
        voiceUrl: 'https://example.com/audio/answer.mp3',
        duration: 45,
        metrics: {
          fluency: 0.82,
          accuracy: 0.75,
          completeness: 0.68
        }
      },

      // AI 诊断
      aiDiagnosis: {
        summary: '回答基本正确，但未能深入阐述原理。',
        analysisList: [
          {
            category: '技术深度',
            issue: '知识点"事件循环"的解释停留在表面',
            suggestions: '需要深入学习事件循环的内部机制'
          },
          {
            category: '逻辑结构',
            issue: '先说了结果，后说原因，建议调整阐述顺序',
            suggestions: '建议：原因 → 过程 → 结果'
          },
          {
            category: '语言表达',
            issue: '使用了较多的"嗯"、"这个"等无效词',
            suggestions: '建议精简表达，提高言语效率'
          }
        ],
        overallScore: 75
      },

      // 学习资源
      learningResources: {
        referencePoints: [
          '事件循环基础',
          '微任务队列 vs 宏任务队列',
          'Promise 的三个状态转移',
          'async/await 的本质'
        ],
        excellentAnswers: [
          {
            title: '标准答案',
            content: '在 JavaScript 中处理并发的核心是理解事件循环机制...',
            voiceUrl: 'https://example.com/audio/excellent.mp3'
          }
        ],
        relatedTopics: [
          {
            id: 't1',
            title: 'JS 异步编程完整指南',
            type: 'topic',
            link: '/topics/async-programming'
          },
          {
            id: 'q2',
            title: '解释 Promise 的链式调用',
            type: 'question',
            link: '/questions/q2'
          }
        ]
      },

      // 学习状态
      learningStatus: {
        wrongCount: 9,
        correctCount: 2,
        mastery: 0.65,
        lastWrongTime: '2025-10-30',
        nextReviewTime: '2025-11-02',
        priority: 'high'
      }
    }
  } catch (error) {
    console.error('Failed to load wrong answer:', error)
    ElMessage.error('加载详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// Actions
const goBack = () => {
  router.back()
}

const retryAnswer = () => {
  // 显示重新回答面板，而不是跳转
  showRetryPanel.value = true
  // 滚动到面板位置
  setTimeout(() => {
    const panel = document.querySelector('.retry-answer-panel')
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}

const handleRetrySubmit = async (submitData) => {
  try {
    ElMessage.loading('提交新答案中...')

    // 这里调用 API 保存新答案
    // const response = await api.submitRetryAnswer({
    //   recordId: submitData.recordId,
    //   newAnswer: submitData.newAnswer,
    //   timestamp: submitData.timestamp
    // })

    ElMessage.success('新答案已提交！AI 正在分析中，请稍候...')

    // 更新本地数据（如果需要）
    if (wrongAnswer.value) {
      wrongAnswer.value.myAnswer = {
        ...wrongAnswer.value.myAnswer,
        content: submitData.newAnswer,
        retryCount: (wrongAnswer.value.myAnswer?.retryCount || 0) + 1
      }
    }

    // 关闭面板
    showRetryPanel.value = false

    // 可选：延迟后刷新页面或重新加载数据
    setTimeout(() => {
      ElMessage.success('分析完成！')
    }, 2000)
  } catch (error) {
    ElMessage.error('提交失败，请稍后重试')
    console.error('Failed to submit retry answer:', error)
  }
}

const markAsLearned = async () => {
  try {
    ElMessage.loading('更新中...')
    // await api.markWrongAnswerAsLearned(wrongAnswerId.value)
    ElMessage.success('已标记为掌握，该题目已移出错题集')
    setTimeout(() => router.back(), 1000)
  } catch (error) {
    ElMessage.error('更新失败，请稍后重试')
  }
}

const addToPractice = async () => {
  try {
    // await api.addWrongAnswerToPractice(wrongAnswerId.value)
    ElMessage.success('已加入练习计划')
  } catch (error) {
    ElMessage.error('加入失败，请稍后重试')
  }
}

// Lifecycle
onMounted(() => {
  loadWrongAnswer()
})
</script>

<style scoped lang="scss">
.wrong-answer-review-room {
  background: #f7f8fa;
  min-height: 100vh;
  padding: 20px;
}

/* ========== Header ========== */
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.review-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.review-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #1f2a44;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-header-right {
  display: flex;
  gap: 12px;
}

/* ========== Main Content ========== */
.review-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .wrong-answer-review-room {
    padding: 12px;
  }

  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }

  .review-header-left {
    flex-direction: column;
    gap: 12px;
  }

  .review-title {
    font-size: 20px;
  }

  .review-header-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .review-header-right :deep(.el-button) {
    flex: 1;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .wrong-answer-review-room {
    padding: 8px;
  }

  .review-header {
    padding: 12px;
  }

  .review-title {
    font-size: 18px;
  }

  .review-header-right {
    flex-direction: column;
    width: 100%;
  }

  .review-header-right :deep(.el-button) {
    width: 100%;
  }
}
</style>
