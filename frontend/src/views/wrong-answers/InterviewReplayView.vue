<template>
  <div class="replay-container">
    <!-- Header -->
    <div class="replay-header">
      <div class="header-content">
        <h1>错题复盘</h1>
        <p class="subtitle">{{ reportInfo.jobTitle }} - {{ reportInfo.difficulty }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goBack">返回报告</button>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">总计</span>
        <span class="stat-value">{{ wrongAnswers.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已复盘</span>
        <span class="stat-value">{{ masteredCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">掌握度</span>
        <span class="stat-value">{{ avgMasteryLevel }}%</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span>正在加载错题复盘数据...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="wrongAnswers.length === 0" class="empty-state">
      <div class="empty-icon">✨</div>
      <p>恭喜！本次面试没有错题</p>
    </div>

    <!-- Wrong Answers List -->
    <div v-else class="wrong-answers-list">
      <div
        v-for="(item, index) in wrongAnswers"
        :key="item.id"
        class="wrong-answer-card"
      >
        <!-- Card Header -->
        <div class="card-header" @click="toggleExpand(index)">
          <div class="header-left">
            <span class="q-number">Q{{ index + 1 }}</span>
            <span class="question-text">{{ item.question }}</span>
          </div>
          <div class="header-right">
            <span class="mastery-badge" :style="getMasteryStyle(item.masterLevel)">
              掌握度 {{ item.masterLevel }}%
            </span>
            <span class="expand-icon">{{ expandedItems.has(index) ? '▲' : '▼' }}</span>
          </div>
        </div>

        <!-- Card Body (Expanded) -->
        <div v-if="expandedItems.has(index)" class="card-body">
          <!-- Mode Toggle -->
          <div class="mode-toggle">
            <button
              :class="['mode-btn', { active: selectedMode === 'reference' }]"
              @click="selectedMode = 'reference'"
            >
              📖 参考模式
            </button>
            <button
              :class="['mode-btn', { active: selectedMode === 'practice' }]"
              @click="selectedMode = 'practice'"
            >
              ✏️ 练习模式
            </button>
          </div>

          <!-- Reference Mode -->
          <div v-if="selectedMode === 'reference'" class="mode-content">
            <div class="original-section">
              <h4>原始答案</h4>
              <p>{{ item.originalAnswer }}</p>
              <div class="score-row">
                <span>原始得分:</span>
                <span class="score" :style="{ color: getScoreColor(item.originalScore) }">
                  {{ item.originalScore }}
                </span>
              </div>
            </div>

            <!-- Learning Notes Section -->
            <div class="notes-section">
              <h4>学习笔记</h4>
              <div v-if="!editingNotes" class="notes-display">
                <p v-if="item.learningNotes">{{ item.learningNotes }}</p>
                <p v-else class="empty-notes">暂无笔记</p>
                <button class="btn-edit-notes" @click="startEditingNotes(item.id)">
                  编辑笔记
                </button>
              </div>
              <div v-else class="notes-edit">
                <textarea
                  v-model="editingNotesContent"
                  placeholder="输入您的学习笔记..."
                  rows="4"
                ></textarea>
                <div class="notes-actions">
                  <button class="btn btn-primary" @click="saveNotes(item.id)">保存</button>
                  <button class="btn btn-secondary" @click="editingNotes = null">取消</button>
                </div>
              </div>
            </div>

            <!-- Retry History -->
            <div v-if="item.retryAnswers?.length > 0" class="history-section">
              <h4>复盘记录 ({{ item.retryAnswers.length }})</h4>
              <div class="history-list">
                <div v-for="(retry, rIndex) in item.retryAnswers" :key="rIndex" class="history-item">
                  <div class="history-header">
                    <span class="attempt">第 {{ retry.attempt }} 次</span>
                    <span class="time">{{ formatTime(retry.timestamp) }}</span>
                    <span v-if="retry.score" class="retry-score" :style="{ color: getScoreColor(retry.score) }">
                      {{ retry.score }}
                    </span>
                  </div>
                  <p class="answer">{{ retry.userAnswer }}</p>
                  <p v-if="retry.notes" class="notes">{{ retry.notes }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Practice Mode -->
          <div v-if="selectedMode === 'practice'" class="mode-content">
            <div v-if="!practiceSubmitted" class="practice-form">
              <h4>提交你的答案</h4>
              <textarea
                v-model="practiceAnswer"
                placeholder="输入你的答案..."
                rows="6"
              ></textarea>
              <div class="practice-notes">
                <textarea
                  v-model="practiceNotes"
                  placeholder="备注（可选）..."
                  rows="2"
                ></textarea>
              </div>
              <div class="practice-actions">
                <button class="btn btn-primary" @click="submitPractice(item.id)">
                  {{ submitting ? '提交中...' : '提交答案' }}
                </button>
              </div>
            </div>

            <!-- Mastery Level Adjustment -->
            <div class="mastery-section">
              <h4>掌握度评估</h4>
              <div class="mastery-slider">
                <input
                  type="range"
                  v-model="masteryInput"
                  min="0"
                  max="100"
                  @input="masteryInput = Math.round($event.target.value)"
                />
                <span class="mastery-value">{{ masteryInput }}%</span>
              </div>
              <button class="btn btn-primary" @click="updateMastery(item.id)">
                更新掌握度
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// State
const loading = ref(false)
const wrongAnswers = ref([])
const reportInfo = ref({
  jobTitle: '',
  difficulty: ''
})
const expandedItems = ref(new Set())
const selectedMode = ref('reference') // 'reference' 或 'practice'
const editingNotes = ref(null)
const editingNotesContent = ref('')
const practiceSubmitted = ref(false)
const practiceAnswer = ref('')
const practiceNotes = ref('')
const masteryInput = ref(0)
const submitting = ref(false)

// Computed
const masteredCount = computed(() => {
  return wrongAnswers.value.filter(item => item.masterLevel >= 80).length
})

const avgMasteryLevel = computed(() => {
  if (wrongAnswers.value.length === 0) return 0
  const sum = wrongAnswers.value.reduce((acc, item) => acc + (item.masterLevel || 0), 0)
  return Math.round(sum / wrongAnswers.value.length)
})

// Methods
const goBack = () => {
  const recordId = route.query.recordId
  if (recordId) {
    history.back()
  } else {
    router.push('/wrong-answers')
  }
}

const toggleExpand = (index) => {
  if (expandedItems.value.has(index)) {
    expandedItems.value.delete(index)
  } else {
    expandedItems.value.add(index)
    selectedMode.value = 'reference' // 重置为参考模式
  }
}

const getMasteryStyle = (level) => {
  let color = '#ef4444' // 红色
  if (level >= 80) color = '#22c55e' // 绿色
  else if (level >= 60) color = '#f59e0b' // 橙色
  return { color }
}

const getScoreColor = (score) => {
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#f59e0b'
  return '#ef4444'
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const startEditingNotes = (id) => {
  editingNotes.value = id
  const item = wrongAnswers.value.find(i => i.id === id)
  editingNotesContent.value = item?.learningNotes || ''
}

const saveNotes = async (id) => {
  try {
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || 1
    const response = await fetch(`/api/interview/wrong-answers/${id}/notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`
      },
      body: JSON.stringify({ notes: editingNotesContent.value })
    })

    if (response.ok) {
      const item = wrongAnswers.value.find(i => i.id === id)
      if (item) {
        item.learningNotes = editingNotesContent.value
      }
      editingNotes.value = null
    }
  } catch (error) {
    console.error('Save notes error:', error)
    alert('保存笔记失败')
  }
}

const submitPractice = async (id) => {
  if (!practiceAnswer.value.trim()) {
    alert('请输入答案')
    return
  }

  submitting.value = true
  try {
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || 1
    const response = await fetch(`/api/interview/wrong-answers/${id}/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`
      },
      body: JSON.stringify({
        userAnswer: practiceAnswer.value,
        notes: practiceNotes.value
      })
    })

    if (response.ok) {
      const result = await response.json()
      const item = wrongAnswers.value.find(i => i.id === id)
      if (item) {
        item.retryAnswers = result.data.retryAnswers
        item.reviewCount = result.data.reviewCount
      }
      practiceSubmitted.value = true
      practiceAnswer.value = ''
      practiceNotes.value = ''
      alert('答案已提交！')
      setTimeout(() => {
        practiceSubmitted.value = false
      }, 2000)
    }
  } catch (error) {
    console.error('Submit practice error:', error)
    alert('提交答案失败')
  } finally {
    submitting.value = false
  }
}

const updateMastery = async (id) => {
  try {
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || 1
    const response = await fetch(`/api/interview/wrong-answers/${id}/mastery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`
      },
      body: JSON.stringify({ masterLevel: masteryInput.value })
    })

    if (response.ok) {
      const item = wrongAnswers.value.find(i => i.id === id)
      if (item) {
        item.masterLevel = masteryInput.value
      }
      alert('掌握度已更新')
    }
  } catch (error) {
    console.error('Update mastery error:', error)
    alert('更新掌握度失败')
  }
}

const loadWrongAnswers = async () => {
  loading.value = true
  try {
    const recordId = route.query.recordId
    if (!recordId) {
      alert('缺少面试记录ID')
      return
    }

    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || 1
    const response = await fetch(`/api/interview/wrong-answers?recordId=${recordId}`, {
      headers: {
        'Authorization': `Bearer ${userId}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      wrongAnswers.value = result.data.items || []

      // 也加载面试记录信息
      const recordResponse = await fetch(`/api/interview/records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${userId}`
        }
      })
      if (recordResponse.ok) {
        const recordResult = await recordResponse.json()
        reportInfo.value = {
          jobTitle: recordResult.data.jobTitle,
          difficulty: recordResult.data.difficulty
        }
      }
    }
  } catch (error) {
    console.error('Load wrong answers error:', error)
    alert('加载错题数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWrongAnswers()
  // 默认展开第一项
  if (wrongAnswers.value.length > 0) {
    expandedItems.value.add(0)
  }
})
</script>

<style scoped>
.replay-container {
  background: #f0f2f5;
  min-height: 100vh;
  padding: 20px;
}

.replay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.header-content h1 {
  margin: 0 0 5px;
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border: 1.5px solid #e5e7eb;
}

.btn-secondary:hover {
  border-color: #4F46E5;
  color: #4F46E5;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #4F46E5;
}

.loading-state,
.empty-state {
  background: white;
  padding: 60px 20px;
  border-radius: 12px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.wrong-answers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-answer-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: #fafafa;
  transition: background 0.15s;
}

.card-header:hover {
  background: #f0f0ff;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.q-number {
  background: #eef2ff;
  color: #4F46E5;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.question-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  line-height: 1.5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.mastery-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.05);
}

.expand-icon {
  font-size: 11px;
  color: #9ca3af;
}

.card-body {
  padding: 16px;
  border-top: 1px solid #f3f4f6;
}

.mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.mode-btn {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.mode-btn.active {
  background: #eef2ff;
  border-color: #4F46E5;
  color: #4F46E5;
}

.mode-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.original-section,
.notes-section,
.history-section,
.practice-form,
.mastery-section {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 12px;
}

.original-section h4,
.notes-section h4,
.history-section h4,
.practice-form h4,
.mastery-section h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
}

.original-section p,
.practice-form textarea {
  margin: 0 0 8px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.score-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.score {
  font-weight: 600;
}

.notes-display {
  margin-bottom: 10px;
}

.empty-notes {
  color: #9ca3af;
  font-style: italic;
}

.btn-edit-notes {
  padding: 6px 12px;
  background: #eef2ff;
  border: none;
  border-radius: 6px;
  color: #4F46E5;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit-notes:hover {
  background: #e0e7ff;
}

.notes-edit textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

.notes-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  border: 1px solid #f3f4f6;
  padding: 10px;
  border-radius: 6px;
  background: #fafafa;
}

.history-header {
  display: flex;
  gap: 12px;
  font-size: 12px;
  margin-bottom: 6px;
}

.attempt {
  font-weight: 600;
  color: #4F46E5;
}

.time {
  color: #9ca3af;
}

.retry-score {
  font-weight: 600;
  margin-left: auto;
}

.history-item .answer {
  margin: 0 0 4px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.history-item .notes {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

.practice-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: inherit;
  resize: vertical;
}

.practice-notes {
  margin-top: 10px;
}

.practice-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.mastery-slider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.mastery-slider input {
  flex: 1;
}

.mastery-value {
  font-weight: 600;
  color: #4F46E5;
  min-width: 40px;
  text-align: right;
}

@media (max-width: 768px) {
  .stats-bar {
    grid-template-columns: 1fr;
  }

  .replay-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    flex-wrap: wrap;
  }

  .mode-toggle {
    flex-direction: column;
  }

  .mode-btn {
    width: 100%;
  }
}
</style>
