<template>
  <div class="wrong-answer-detail-container">
    <!-- Header -->
    <el-header class="detail-header">
      <div class="header-content">
        <el-button icon="ArrowLeft" @click="goBack" text></el-button>
        <h1 class="detail-title">错题详情</h1>
        <el-button icon="Close" @click="goBack" text></el-button>
      </div>
    </el-header>

    <!-- Loading state -->
    <el-main v-if="loading" class="detail-main">
      <el-skeleton :rows="10" animated />
    </el-main>

    <!-- Content -->
    <el-main v-else-if="record" class="detail-main">
      <!-- Question Section -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">题目信息</span>
            <el-tag :type="getDifficultyTagType(record.difficulty)">
              {{ getDifficultyLabel(record.difficulty) }}
            </el-tag>
          </div>
        </template>

        <div class="question-content">
          <h3 class="question-title">{{ record.questionTitle }}</h3>
          <div class="question-body">
            {{ record.questionContent }}
          </div>

          <!-- Knowledge Points -->
          <div v-if="record.knowledgePoints && record.knowledgePoints.length > 0" class="knowledge-points">
            <span class="label">知识点:</span>
            <el-tag
              v-for="point in record.knowledgePoints"
              :key="point"
              type="info"
              size="small"
            >
              {{ point }}
            </el-tag>
          </div>

          <!-- Source Info -->
          <div class="source-info">
            <span class="label">来源:</span>
            <el-tag type="primary" size="small">
              {{ getSourceLabel(record.source) }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- Error Analysis Section -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">错误分析</span>
        </template>

        <!-- Statistics -->
        <div class="error-stats">
          <div class="stat-item">
            <span class="stat-label">错误次数</span>
            <span class="stat-value">{{ record.wrongCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">正确次数</span>
            <span class="stat-value">{{ record.correctCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">掌握度</span>
            <span class="stat-value">{{ calculateMastery() }}%</span>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline-section">
          <h4>作答历史</h4>
          <el-timeline>
            <el-timeline-item
              timestamp="最近错误"
              :color="record.lastWrongTime ? '#f56c6c' : '#909399'"
              placement="top"
            >
              <p>{{ formatDate(record.lastWrongTime) || '暂无' }}</p>
            </el-timeline-item>
            <el-timeline-item
              timestamp="最近正确"
              :color="record.lastCorrectTime ? '#67c23a' : '#909399'"
              placement="top"
            >
              <p>{{ formatDate(record.lastCorrectTime) || '暂无' }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>

      <!-- Review Status Section -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">复习计划</span>
        </template>

        <!-- Status Badge -->
        <div class="status-section">
          <el-tag :type="getStatusTagType(record.reviewStatus)" effect="dark" size="large">
            {{ getStatusLabel(record.reviewStatus) }}
          </el-tag>

          <div v-if="record.nextReviewTime" class="next-review">
            <span class="label">下次复习:</span>
            <span class="value">{{ formatDate(record.nextReviewTime) }}</span>
            <span v-if="record.intervalDays != null" class="hint">（约 {{ record.intervalDays }} 天后）</span>
          </div>

          <div class="priority-section">
            <span class="label">优先级:</span>
            <el-tag
              :type="getPriorityTagType(record.reviewPriority)"
              size="small"
            >
              {{ getPriorityLabel(record.reviewPriority) }}
            </el-tag>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <el-button
            v-if="record.reviewStatus !== 'mastered'"
            type="success"
            @click="handleMarkAsMastered"
            :loading="marking"
          >
            <el-icon><SuccessFilled /></el-icon>
            标记为已掌握
          </el-button>

          <el-button
            v-if="record.reviewStatus === 'unreviewed'"
            type="warning"
            @click="handleStartReview"
          >
            <el-icon><Play /></el-icon>
            开始复习
          </el-button>

          <el-button
            type="info"
            @click="showSyncDialog = true"
          >
            <el-icon><Refresh /></el-icon>
            同步数据
          </el-button>
        </div>
      </el-card>

      <!-- User Notes Section -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">错误原因分析</span>
        </template>

        <div class="notes-section">
          <el-input
            v-model="editingNotes"
            type="textarea"
            :rows="4"
            placeholder="记录你的错误原因分析，帮助加深印象..."
            :disabled="savingNotes"
          />

          <div class="notes-actions">
            <el-button
              type="primary"
              @click="handleSaveNotes"
              :loading="savingNotes"
            >
              保存笔记
            </el-button>
            <el-button @click="editingNotes = record.userNotes || ''">
              取消编辑
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- Tags Section -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">自定义标签</span>
        </template>

        <div class="tags-section">
          <!-- Current Tags -->
          <div v-if="record.userTags && record.userTags.length > 0" class="current-tags">
            <el-tag
              v-for="tag in record.userTags"
              :key="tag"
              closable
              @close="handleRemoveTag(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>

          <!-- Add New Tag -->
          <div class="add-tag">
            <el-input
              v-model="newTag"
              placeholder="输入新标签，按 Enter 添加"
              @keyup.enter="handleAddTag"
              size="small"
            />
            <el-button @click="handleAddTag" size="small">
              添加
            </el-button>
          </div>

          <!-- Suggested Tags -->
          <div class="suggested-tags">
            <span class="label">推荐标签:</span>
            <el-button
              v-for="suggestedTag in suggestedTags"
              :key="suggestedTag"
              type="text"
              size="small"
              @click="handleAddTag(suggestedTag)"
            >
              + {{ suggestedTag }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- Similar Questions Section -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">相似题目推荐</span>
        </template>

        <div v-if="similarQuestions.length > 0" class="similar-questions">
          <div
            v-for="question in similarQuestions"
            :key="question.id"
            class="question-item"
            @click="navigateToQuestion(question.id)"
          >
            <div class="question-header">
              <h4>{{ question.title }}</h4>
              <el-tag
                :type="getDifficultyTagType(question.difficulty)"
                size="small"
              >
                {{ getDifficultyLabel(question.difficulty) }}
              </el-tag>
            </div>
            <p class="question-preview">{{ question.content?.substring(0, 100) }}...</p>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>暂无相似题目推荐</p>
        </div>
      </el-card>

      <!-- Delete Section -->
      <div class="delete-section">
        <el-button
          type="danger"
          plain
          @click="handleDelete"
          :loading="deleting"
        >
          <el-icon><Delete /></el-icon>
          删除这条记录
        </el-button>
      </div>
    </el-main>

    <!-- Empty state -->
    <el-main v-else class="detail-main">
      <el-empty description="未找到记录" />
    </el-main>

    <!-- Sync Dialog -->
    <el-dialog
      v-model="showSyncDialog"
      title="同步数据"
      width="400px"
    >
      <div class="sync-dialog-content">
        <p>同步最新的错题数据到本地？</p>
        <div class="sync-info">
          <p>当前状态: {{ record.reviewStatus }}</p>
          <p>最后更新: {{ formatDate(record.updatedAt) }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showSyncDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSync" :loading="syncing">
          确认同步
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Close,
  SuccessFilled,
  Play,
  Refresh,
  Delete
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const wrongAnswersStore = useWrongAnswersStore()

const recordId = ref(null)
const record = ref(null)
const loading = ref(true)
const marking = ref(false)
const savingNotes = ref(false)
const deleting = ref(false)
const syncing = ref(false)

const editingNotes = ref('')
const newTag = ref('')
const showSyncDialog = ref(false)

const similarQuestions = ref([])

const suggestedTags = [
  '易混淆',
  '常考点',
  '需要理解',
  '计算错误',
  '概念不清',
  '粗心大意'
]

// Initialize
onMounted(async () => {
  recordId.value = route.params.id
  await loadRecord()
})

// Methods
async function loadRecord() {
  try {
    loading.value = true
    const result = await wrongAnswersStore.getWrongAnswer(recordId.value)
    if (result) {
      record.value = result
      editingNotes.value = result.userNotes || ''
      loadSimilarQuestions()
    } else {
      ElMessage.error('未找到错题记录')
    }
  } catch (error) {
    ElMessage.error('加载记录失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

function loadSimilarQuestions() {
  // Mock data - 实际应调用 API
  similarQuestions.value = [
    {
      id: 'q1',
      title: '相似题目 1',
      content: '这是一个相似的题目内容...',
      difficulty: 'medium'
    },
    {
      id: 'q2',
      title: '相似题目 2',
      content: '这是另一个相似的题目内容...',
      difficulty: 'hard'
    }
  ]
}

async function handleMarkAsMastered() {
  try {
    marking.value = true
    await wrongAnswersStore.markAsMastered(recordId.value)
    record.value.reviewStatus = 'mastered'
    ElMessage.success('已标记为已掌握')
  } catch (error) {
    ElMessage.error('标记失败: ' + error.message)
  } finally {
    marking.value = false
  }
}

async function handleSaveNotes() {
  try {
    savingNotes.value = true
    await wrongAnswersStore.updateUserNotes(recordId.value, editingNotes.value)
    record.value.userNotes = editingNotes.value
    ElMessage.success('笔记已保存')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    savingNotes.value = false
  }
}

async function handleAddTag(tag = null) {
  const tagToAdd = tag || newTag.value
  if (!tagToAdd.trim()) return

  if (!record.value.userTags) {
    record.value.userTags = []
  }

  if (!record.value.userTags.includes(tagToAdd)) {
    record.value.userTags.push(tagToAdd)
    await wrongAnswersStore.updateUserTags(recordId.value, record.value.userTags)
    ElMessage.success('标签已添加')
  }

  if (!tag) {
    newTag.value = ''
  }
}

async function handleRemoveTag(tag) {
  if (record.value.userTags) {
    record.value.userTags = record.value.userTags.filter(t => t !== tag)
    await wrongAnswersStore.updateUserTags(recordId.value, record.value.userTags)
    ElMessage.success('标签已删除')
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm(
      '确定删除这条记录？此操作无法撤销。',
      '警告',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )

    deleting.value = true
    await wrongAnswersStore.deleteWrongAnswer(recordId.value)
    ElMessage.success('记录已删除')
    goBack()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  } finally {
    deleting.value = false
  }
}

async function handleSync() {
  try {
    syncing.value = true
    await wrongAnswersStore.fetchStatistics()
    ElMessage.success('数据已同步')
    showSyncDialog.value = false
  } catch (error) {
    ElMessage.error('同步失败: ' + error.message)
  } finally {
    syncing.value = false
  }
}

function handleStartReview() {
  router.push({
    name: 'ReviewMode',
    params: { recordId: recordId.value }
  })
}

function goBack() {
  router.back()
}

function navigateToQuestion(questionId) {
  router.push({
    path: '/wrong-answers/detail',
    params: { id: questionId }
  })
}

function calculateMastery() {
  const total = (record.value.wrongCount || 0) + (record.value.correctCount || 0)
  if (total === 0) return 0
  return Math.round((record.value.correctCount / total) * 100)
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

function getSourceLabel(source) {
  const labels = {
    'ai_interview': 'AI模拟面试',
    'question_bank': '题库练习',
    'mock_exam': '模拟考试',
    'custom': '自定义'
  }
  return labels[source] || source
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

function getStatusLabel(status) {
  const labels = {
    'unreviewed': '待复习',
    'reviewing': '复习中',
    'mastered': '已掌握'
  }
  return labels[status] || status
}

function getStatusTagType(status) {
  const types = {
    'unreviewed': 'info',
    'reviewing': 'warning',
    'mastered': 'success'
  }
  return types[status] || 'info'
}

function getPriorityLabel(priority) {
  const labels = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return labels[priority] || priority
}

function getPriorityTagType(priority) {
  const types = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return types[priority] || 'info'
}
</script>

<style scoped>
.wrong-answer-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.detail-header {
  background: white;
  border-bottom: 1px solid #eee;
  padding: 12px 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.detail-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.detail-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* Question Content */
.question-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.question-body {
  padding: 12px;
  background: #f5f5f5;
  border-left: 4px solid #409eff;
  border-radius: 4px;
  line-height: 1.6;
  color: #666;
}

.knowledge-points,
.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

/* Error Statistics */
.error-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

/* Timeline */
.timeline-section {
  margin-top: 20px;
}

.timeline-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* Status Section */
.status-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.next-review,
.priority-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.next-review .value {
  font-weight: 600;
  color: #409eff;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.action-buttons :deep(.el-button) {
  flex: 1;
  min-width: 150px;
}

/* Notes Section */
.notes-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes-actions {
  display: flex;
  gap: 8px;
}

.notes-actions :deep(.el-button) {
  flex: 1;
}

/* Tags Section */
.tags-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.add-tag {
  display: flex;
  gap: 8px;
}

.add-tag :deep(.el-input) {
  flex: 1;
}

.suggested-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.suggested-tags .label {
  margin: 0;
}

.suggested-tags :deep(.el-button) {
  color: #409eff;
}

/* Similar Questions */
.similar-questions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.question-item:hover {
  background: #e0e9ff;
  transform: translateX(4px);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.question-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.question-preview {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

/* Delete Section */
.delete-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

/* Sync Dialog */
.sync-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sync-info {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.sync-info p {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .detail-main {
    padding: 12px;
  }

  .error-stats {
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
