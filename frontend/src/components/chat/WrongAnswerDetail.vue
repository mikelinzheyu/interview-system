<template>
  <div class="wrong-answer-detail">
    <!-- Header with back button -->
    <div class="detail-header">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        Back
      </button>
      <h1>{{ question.title }}</h1>
      <div class="header-actions">
        <el-button type="primary" @click="startReview">
          <el-icon><VideoPlay /></el-icon>
          Start Review
        </el-button>
        <el-button @click="showSyncDialog = true">
          <el-icon><Refresh /></el-icon>
          Sync
        </el-button>
        <el-button type="danger" @click="deleteRecord">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Main content -->
    <div class="detail-content">
      <!-- Question Section -->
      <div class="section question-section">
        <h2>Question</h2>
        <div class="question-meta">
          <el-tag type="info">{{ question.source }}</el-tag>
          <el-tag :type="getDifficultyType(question.difficulty)">{{ question.difficulty }}</el-tag>
        </div>
        <div class="question-content">{{ question.content }}</div>
        <div class="knowledge-points">
          <strong>Knowledge Points:</strong>
          <el-tag v-for="point in question.knowledgePoints" :key="point" effect="light">
            {{ point }}
          </el-tag>
        </div>
      </div>

      <!-- Error Analysis Section -->
      <div class="section analysis-section">
        <h2>Error Analysis</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Wrong Count</div>
            <div class="stat-value">{{ record.wrongCount }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Correct Count</div>
            <div class="stat-value">{{ record.correctCount }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Mastery %</div>
            <div class="stat-value">{{ masteryPercentage }}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Priority</div>
            <el-progress
              :percentage="record.reviewPriority"
              :color="getPriorityColor(record.reviewPriority)"
            />
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline">
          <div class="timeline-header">Review Timeline</div>
          <div class="timeline-items">
            <div v-for="(item, idx) in timeline" :key="idx" class="timeline-item">
              <div class="timeline-date">{{ item.date }}</div>
              <div class="timeline-content">{{ item.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Review Status Section -->
      <div class="section status-section">
        <h2>Review Status</h2>
        <div class="status-content">
          <div class="status-item">
            <span class="label">Current Status:</span>
            <el-tag :type="getStatusType(record.reviewStatus)">{{ record.reviewStatus }}</el-tag>
          </div>
          <div class="status-item">
            <span class="label">Next Review:</span>
            <span>{{ formatDate(record.nextReviewTime) }}</span>
          </div>
          <div class="status-item">
            <span class="label">Last Updated:</span>
            <span>{{ formatDate(record.updatedAt) }}</span>
          </div>
          <div class="status-actions">
            <el-button
              v-if="record.reviewStatus !== 'mastered'"
              type="success"
              @click="markAsMastered"
            >
              Mark as Mastered
            </el-button>
            <el-button
              v-if="record.reviewStatus === 'mastered'"
              type="warning"
              @click="markAsReviewing"
            >
              Mark as Reviewing
            </el-button>
          </div>
        </div>
      </div>

      <!-- User Notes Section -->
      <div class="section notes-section">
        <h2>User Notes</h2>
        <div class="notes-editor">
          <el-input
            v-model="editingNotes"
            type="textarea"
            :rows="6"
            placeholder="Add your notes about this question..."
            maxlength="2000"
            show-word-limit
          />
          <div class="notes-actions">
            <el-button type="primary" @click="saveNotes" :loading="savingNotes">Save Notes</el-button>
            <el-button @click="editingNotes = record.userNotes">Cancel</el-button>
          </div>
        </div>
      </div>

      <!-- Tags Section -->
      <div class="section tags-section">
        <h2>Tags</h2>
        <div class="tags-container">
          <!-- Current tags -->
          <div v-if="record.userTags.length > 0" class="tags-display">
            <el-tag
              v-for="tag in record.userTags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              effect="light"
            >
              {{ tag }}
            </el-tag>
          </div>
          <div v-else class="empty-tags">No tags yet</div>

          <!-- Add new tag -->
          <div class="tags-input">
            <el-input
              v-model="newTag"
              placeholder="Add a new tag (press Enter)"
              @keyup.enter="addTag"
              class="new-tag-input"
            />
            <el-button @click="addTag" icon="Plus">Add Tag</el-button>
          </div>

          <!-- Suggested tags -->
          <div v-if="suggestedTags.length > 0" class="suggested-tags">
            <strong>Suggested Tags:</strong>
            <el-tag
              v-for="tag in suggestedTags"
              :key="tag"
              @click="addTagFromSuggestion(tag)"
              style="cursor: pointer; margin: 4px;"
            >
              + {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- Similar Questions Section -->
      <div class="section similar-section">
        <h2>Similar Questions</h2>
        <div v-if="similarQuestions.length > 0" class="similar-questions">
          <div
            v-for="q in similarQuestions"
            :key="q.id"
            class="similar-question-card"
            @click="navigateToQuestion(q.id)"
          >
            <div class="similar-title">{{ q.title }}</div>
            <div class="similar-meta">
              <el-tag type="info" size="small">{{ q.source }}</el-tag>
              <el-tag :type="getDifficultyType(q.difficulty)" size="small">{{ q.difficulty }}</el-tag>
            </div>
          </div>
        </div>
        <div v-else class="no-similar">No similar questions found</div>
      </div>
    </div>

    <!-- Sync Dialog -->
    <el-dialog v-model="showSyncDialog" title="Synchronize Data" width="40%">
      <div class="sync-dialog-content">
        <p v-if="!syncing">Manually sync this record with the server</p>
        <el-progress v-else :percentage="syncProgress" />
        <div v-if="syncMessage" :class="['sync-message', syncSuccess ? 'success' : 'error']">
          {{ syncMessage }}
        </div>
      </div>
      <template #footer>
        <el-button @click="showSyncDialog = false">Close</el-button>
        <el-button type="primary" @click="performSync" :loading="syncing">Sync Now</el-button>
      </template>
    </el-dialog>

    <!-- Delete Confirmation Dialog -->
    <el-dialog v-model="showDeleteDialog" title="Confirm Delete" width="30%">
      <p>Are you sure you want to delete this record? This action cannot be undone.</p>
      <template #footer>
        <el-button @click="showDeleteDialog = false">Cancel</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">Delete</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, VideoPlay, Refresh, Delete, Plus } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const store = useWrongAnswersStore()

// State
const record = ref({
  id: null,
  questionId: null,
  wrongCount: 0,
  correctCount: 0,
  reviewStatus: 'unreveiwed',
  nextReviewTime: null,
  reviewPriority: 0,
  userNotes: '',
  userTags: [],
  createdAt: null,
  updatedAt: null
})

const question = ref({
  id: null,
  title: '',
  content: '',
  source: '',
  difficulty: 'medium',
  knowledgePoints: []
})

const editingNotes = ref('')
const newTag = ref('')
const savingNotes = ref(false)
const deleting = ref(false)
const showDeleteDialog = ref(false)
const showSyncDialog = ref(false)
const syncing = ref(false)
const syncProgress = ref(0)
const syncMessage = ref('')
const syncSuccess = ref(false)

// Computed properties
const masteryPercentage = computed(() => {
  const total = record.value.wrongCount + record.value.correctCount
  if (total === 0) return 0
  return Math.round((record.value.correctCount / total) * 100)
})

const timeline = computed(() => {
  const events = []
  if (record.value.createdAt) {
    events.push({
      date: formatDate(record.value.createdAt),
      content: `First encountered (${record.value.source})`
    })
  }
  if (record.value.wrongCount > 0) {
    events.push({
      date: 'Multiple attempts',
      content: `Wrong ${record.value.wrongCount} times, Correct ${record.value.correctCount} times`
    })
  }
  if (record.value.nextReviewTime) {
    events.push({
      date: formatDate(record.value.nextReviewTime),
      content: 'Scheduled for review'
    })
  }
  return events
})

const suggestedTags = computed(() => {
  const suggested = []
  if (question.value.difficulty === 'hard' && !record.value.userTags.includes('需要多次复习')) {
    suggested.push('需要多次复习')
  }
  if (record.value.reviewStatus === 'unreveiwed' && !record.value.userTags.includes('新错题')) {
    suggested.push('新错题')
  }
  if (record.value.wrongCount > 3 && !record.value.userTags.includes('重点关注')) {
    suggested.push('重点关注')
  }
  return suggested
})

const similarQuestions = computed(() => {
  // This would be populated by fetching similar questions from the API
  return []
})

// Methods
const goBack = () => {
  router.back()
}

const startReview = () => {
  router.push({
    name: 'ReviewMode',
    params: { recordId: record.value.id }
  })
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getDifficultyType = (difficulty) => {
  const types = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return types[difficulty] || 'info'
}

const getStatusType = (status) => {
  const types = {
    mastered: 'success',
    reviewing: 'warning',
    unreveiwed: 'info'
  }
  return types[status] || 'info'
}

const getPriorityColor = (priority) => {
  if (priority >= 80) return '#F56C6C'
  if (priority >= 50) return '#E6A23C'
  return '#67C23A'
}

const markAsMastered = async () => {
  try {
    await store.markAsMastered(record.value.id)
    record.value.reviewStatus = 'mastered'
    ElMessage.success('Marked as mastered!')
  } catch (error) {
    ElMessage.error('Failed to update status')
  }
}

const markAsReviewing = async () => {
  try {
    await store.markAsReviewing(record.value.id)
    record.value.reviewStatus = 'reviewing'
    ElMessage.success('Marked as reviewing!')
  } catch (error) {
    ElMessage.error('Failed to update status')
  }
}

const saveNotes = async () => {
  savingNotes.value = true
  try {
    await store.updateUserNotes(record.value.id, editingNotes.value)
    record.value.userNotes = editingNotes.value
    ElMessage.success('Notes saved!')
  } catch (error) {
    ElMessage.error('Failed to save notes')
  } finally {
    savingNotes.value = false
  }
}

const addTag = async () => {
  if (!newTag.value.trim()) return
  if (record.value.userTags.includes(newTag.value)) {
    ElMessage.warning('Tag already exists')
    return
  }

  const updatedTags = [...record.value.userTags, newTag.value]
  try {
    await store.updateUserTags(record.value.id, updatedTags)
    record.value.userTags = updatedTags
    newTag.value = ''
    ElMessage.success('Tag added!')
  } catch (error) {
    ElMessage.error('Failed to add tag')
  }
}

const addTagFromSuggestion = async (tag) => {
  newTag.value = tag
  addTag()
}

const removeTag = async (tag) => {
  const updatedTags = record.value.userTags.filter(t => t !== tag)
  try {
    await store.updateUserTags(record.value.id, updatedTags)
    record.value.userTags = updatedTags
    ElMessage.success('Tag removed!')
  } catch (error) {
    ElMessage.error('Failed to remove tag')
  }
}

const deleteRecord = () => {
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await store.deleteWrongAnswer(record.value.id)
    ElMessage.success('Record deleted!')
    goBack()
  } catch (error) {
    ElMessage.error('Failed to delete record')
  } finally {
    deleting.value = false
  }
}

const performSync = async () => {
  syncing.value = true
  syncMessage.value = ''
  syncSuccess.value = false

  try {
    syncProgress.value = 50
    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    syncProgress.value = 100
    syncSuccess.value = true
    syncMessage.value = 'Synchronization successful!'
    ElMessage.success('Data synchronized!')
  } catch (error) {
    syncSuccess.value = false
    syncMessage.value = error.message || 'Synchronization failed'
    ElMessage.error('Synchronization failed')
  } finally {
    syncing.value = false
  }
}

const navigateToQuestion = (questionId) => {
  router.push({
    name: 'WrongAnswerDetail',
    params: { recordId: questionId }
  })
}

// Lifecycle
onMounted(async () => {
  const recordId = route.params.recordId
  if (recordId) {
    try {
      // Fetch the record from store
      await store.fetchWrongAnswers()
      const found = store.wrongAnswers.find(r => r.id === parseInt(recordId))
      if (found) {
        record.value = found
        editingNotes.value = found.userNotes || ''
        // Load question details (would normally fetch from API)
        question.value = {
          id: found.questionId,
          title: found.questionTitle || 'Question Title',
          content: found.questionContent || 'Question content goes here',
          source: found.source || 'unknown',
          difficulty: found.difficulty || 'medium',
          knowledgePoints: found.knowledgePoints || []
        }
      }
    } catch (error) {
      ElMessage.error('Failed to load question details')
    }
  }
})
</script>

<style scoped lang="css">
.wrong-answer-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.back-btn:hover {
  color: #409eff;
}

.detail-header h1 {
  flex: 1;
  margin: 0 20px;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

/* Question Section */
.question-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.question-content {
  padding: 15px;
  background: #f5f7fa;
  border-left: 4px solid #409eff;
  margin-bottom: 15px;
  line-height: 1.6;
  color: #606266;
}

.knowledge-points {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Analysis Section */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  text-align: center;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.timeline {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.timeline-header {
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
}

.timeline-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-item {
  display: flex;
  gap: 15px;
  padding: 10px 0;
  border-left: 2px solid #409eff;
  padding-left: 15px;
}

.timeline-date {
  color: #909399;
  font-size: 14px;
  min-width: 120px;
}

.timeline-content {
  color: #606266;
  font-size: 14px;
}

/* Status Section */
.status-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-item .label {
  font-weight: bold;
  min-width: 120px;
  color: #606266;
}

.status-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* Notes Section */
.notes-editor {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.notes-actions {
  display: flex;
  gap: 10px;
}

/* Tags Section */
.tags-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-tags {
  color: #909399;
  font-style: italic;
}

.tags-input {
  display: flex;
  gap: 10px;
}

.new-tag-input {
  flex: 1;
}

.suggested-tags {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Similar Section */
.similar-questions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.similar-question-card {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.similar-question-card:hover {
  background: #e6f6ff;
  border-left-color: #409eff;
  transform: translateY(-2px);
}

.similar-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.similar-meta {
  display: flex;
  gap: 8px;
}

.no-similar {
  text-align: center;
  color: #909399;
  padding: 20px;
}

/* Sync Dialog */
.sync-dialog-content {
  padding: 20px 0;
}

.sync-message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
}

.sync-message.success {
  background: #f0f9ff;
  color: #67c23a;
  border: 1px solid #67c23a;
}

.sync-message.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #f56c6c;
}

/* Responsive */
@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .detail-header h1 {
    margin: 0;
    font-size: 20px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .similar-questions {
    grid-template-columns: 1fr;
  }
}
</style>
