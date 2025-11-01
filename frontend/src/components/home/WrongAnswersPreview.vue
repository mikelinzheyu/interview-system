<template>
  <div class="wrong-answers-preview">
    <div class="preview-header">
      <h3 class="preview-title">
        <el-icon><CollectionTag /></el-icon>
        我的错题集
      </h3>
      <el-button text type="primary" @click="goToWrongAnswers">查看全部</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-row">
      <div class="stat-item">
        <div class="stat-icon error-icon">
          <el-icon><Close /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">答错次数</div>
          <div class="stat-value">{{ statistics.wrongCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon correct-icon">
          <el-icon><SuccessFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">答对次数</div>
          <div class="stat-value">{{ statistics.correctCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon mastery-icon">
          <el-icon><CircleCheckFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">平均掌握度</div>
          <div class="stat-value">{{ statistics.masteryPercentage || 0 }}%</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon review-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">待复习</div>
          <div class="stat-value">{{ statistics.dueCount || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 错题列表预览 -->
    <div class="wrong-answers-list">
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="wrongAnswers.length === 0" class="empty-state">
        <el-empty
          description="还没有错题记录"
          :image-size="100"
        >
          <el-button type="primary" @click="goToInterview">开始练习</el-button>
        </el-empty>
      </div>

      <div v-else class="answers-grid">
        <div
          v-for="item in displayedAnswers"
          :key="item.id"
          class="answer-card"
          @click="goToDetail(item.id)"
        >
          <!-- 诊断标签 -->
          <div class="card-header">
            <span v-if="item.errorType" class="error-tag" :class="`error-${item.errorType}`">
              {{ getErrorTypeLabel(item.errorType) }}
            </span>
            <span class="mastery-tag">掌握度: {{ item.mastery || 0 }}%</span>
          </div>

          <!-- 题目信息 -->
          <div class="card-body">
            <h4 class="question-title">{{ item.questionTitle }}</h4>
            <p class="question-preview">{{ item.questionContent?.slice(0, 60) }}...</p>
          </div>

          <!-- 统计信息 -->
          <div class="card-footer">
            <span class="footer-stat">错 {{ item.wrongCount }}</span>
            <span class="footer-stat">对 {{ item.correctCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="action-buttons">
      <el-button type="primary" plain @click="goToWrongAnswers" block>
        <el-icon><ArrowRight /></el-icon>
        进入错题集
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
// 图标已在全局通过 main.js 注册，无需在此单独导入

const router = useRouter()
const store = useWrongAnswersStore()

const loading = ref(false)
const wrongAnswers = ref([])

const statistics = computed(() => ({
  wrongCount: store.statistics?.totalWrongCount || 0,
  correctCount: store.statistics?.totalCorrectCount || 0,
  masteryPercentage: Math.round(
    (wrongAnswers.value.reduce((sum, item) => sum + (item.mastery || 0), 0) / (wrongAnswers.value.length || 1))
  ),
  dueCount: wrongAnswers.value.filter(item => {
    const nextReview = new Date(item.nextReviewTime)
    return nextReview <= new Date()
  }).length
}))

const displayedAnswers = computed(() => wrongAnswers.value.slice(0, 5))

const getErrorTypeLabel = (type) => {
  const labels = {
    knowledge: '知识点错误',
    logic: '逻辑混乱',
    incomplete: '回答不完整',
    expression: '表达不流畅'
  }
  return labels[type] || '诊断'
}

const fetchWrongAnswers = async () => {
  loading.value = true
  try {
    await store.fetchWrongAnswers()
    await store.fetchStatistics()
    wrongAnswers.value = store.wrongAnswers
  } catch (error) {
    console.error('加载错题集失败:', error)
  } finally {
    loading.value = false
  }
}

const goToWrongAnswers = () => {
  router.push('/wrong-answers')
}

const goToDetail = (recordId) => {
  router.push({ name: 'WrongAnswerDetail', params: { recordId } })
}

const goToInterview = () => {
  router.push('/interview/new')
}

onMounted(() => {
  fetchWrongAnswers()
})
</script>

<style scoped lang="scss">
.wrong-answers-preview {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2a44;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 统计卡片 */
.statistics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: white;
  flex-shrink: 0;
  font-size: 20px;
}

.stat-icon.error-icon {
  background: linear-gradient(135deg, #f56c6c, #e55a5a);
}

.stat-icon.correct-icon {
  background: linear-gradient(135deg, #67c23a, #5daf34);
}

.stat-icon.mastery-icon {
  background: linear-gradient(135deg, #409eff, #3a90f0);
}

.stat-icon.review-icon {
  background: linear-gradient(135deg, #e6a23c, #d79a2c);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2a44;
}

/* 错题列表 */
.wrong-answers-list {
  margin-bottom: 20px;
  min-height: 200px;
}

.loading-state {
  padding: 20px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.answers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.answer-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #409eff;
    background: white;
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.error-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;

  &.error-knowledge {
    background: #fee;
    color: #c33;
  }

  &.error-logic {
    background: #fef5e6;
    color: #d97706;
  }

  &.error-incomplete {
    background: #fef3f2;
    color: #d32f2f;
  }

  &.error-expression {
    background: #f0f9ff;
    color: #1976d2;
  }
}

.mastery-tag {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}

.card-body {
  flex: 1;
}

.question-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.question-preview {
  font-size: 12px;
  color: #999;
  margin: 4px 0 0 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.footer-stat {
  flex: 1;
}

/* 按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .wrong-answers-preview {
    padding: 16px;
  }

  .statistics-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .answers-grid {
    grid-template-columns: 1fr;
  }

  .preview-title {
    font-size: 16px;
  }
}
</style>
