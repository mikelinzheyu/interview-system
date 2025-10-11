<template>
  <el-drawer
    :model-value="visible"
    size="600px"
    custom-class="question-detail-drawer"
    @close="handleClose"
  >
    <template #header>
      <div class="drawer-header">
        <div class="header-info">
          <h3>{{ question?.title || '题目详情' }}</h3>
          <div v-if="question" class="header-tags">
            <el-tag size="small" :type="difficultyTagType(question.difficulty)">
              {{ difficultyLabel(question.difficulty) }}
            </el-tag>
            <el-tag size="small" type="info">{{ typeLabel(question.type) }}</el-tag>
            <el-tag
              v-for="tag in question.tags || []"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        <el-button text icon="Close" @click="handleClose" />
      </div>
    </template>

    <div v-if="loading" class="drawer-loading">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="question" class="drawer-body">
      <section class="question-block">
        <p class="question-text">{{ question.question }}</p>
        <ul v-if="question.options?.length" class="options-list">
          <li v-for="option in question.options" :key="option.id">
            <span class="option-id">{{ option.id }}.</span>
            <span>{{ option.text }}</span>
          </li>
        </ul>
        <div v-if="question.constraints?.length" class="section-meta">
          <el-tag
            v-for="item in question.constraints"
            :key="item"
            size="small"
            effect="plain"
          >
            {{ item }}
          </el-tag>
        </div>
      </section>

      <section class="practice-block">
        <h4>提交你的答案</h4>
        <div v-if="question.type === 'multiple_choice'">
          <el-checkbox-group v-model="answerState.options">
            <el-checkbox
              v-for="option in question.options || []"
              :key="option.id"
              :label="option.id"
            >
              {{ option.id }}. {{ option.text }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div v-else-if="question.type === 'short_answer'">
          <el-input
            v-model="answerState.text"
            type="textarea"
            :rows="6"
            placeholder="写下你的解题思路或关键要点"
          />
        </div>
        <div v-else>
          <el-input
            v-model="answerState.code"
            type="textarea"
            :rows="10"
            placeholder="编写或粘贴你的代码，可结合测试用例自测"
          />
          <ul v-if="question.testCases?.length" class="testcase-list">
            <li v-for="item in question.testCases" :key="item.input">
              <strong>输入：</strong><code>{{ item.input }}</code>
              <strong> 输出：</strong><code>{{ item.expectedOutput }}</code>
            </li>
          </ul>
        </div>
        <div class="practice-actions">
          <el-button type="primary" :disabled="disableSubmit" :loading="submitting" @click="handleSubmit">
            提交作答
          </el-button>
          <el-button text @click="resetAnswers">重置</el-button>
          <span v-if="timerLabel" class="timer-label">已用时 {{ timerLabel }}</span>
        </div>
      </section>

      <section v-if="question.answer || question.explanation" class="reference-block">
        <el-collapse>
          <el-collapse-item
            v-if="question.answer || question.correctOptions?.length"
            name="answer"
            title="参考答案"
          >
            <p v-if="question.answer" class="reference-text">{{ question.answer }}</p>
            <ul v-else>
              <li v-for="opt in question.correctOptions" :key="opt">正确选项：{{ opt }}</li>
            </ul>
          </el-collapse-item>
          <el-collapse-item v-if="question.explanation" name="explanation" title="解析说明">
            <p class="reference-text">{{ question.explanation }}</p>
          </el-collapse-item>
        </el-collapse>
      </section>

      <section class="records-block">
        <el-divider content-position="left">最近练习记录</el-divider>
        <el-empty v-if="!practiceRecords.length" description="暂无练习记录" />
        <ul v-else class="records-list">
          <li v-for="record in practiceRecords" :key="record.id" class="record-item">
            <div class="record-head">
              <span>{{ formatTimestamp(record.submittedAt) }}</span>
              <el-tag size="small" :type="recordType(record)">{{ recordLabel(record) }}</el-tag>
            </div>
            <div v-if="record.answer" class="record-answer">{{ truncate(record.answer) }}</div>
          </li>
        </ul>
      </section>

      <section v-if="recommendations.length" class="recommend-block">
        <el-divider content-position="left">相关推荐</el-divider>
        <el-space wrap>
          <el-card
            v-for="item in recommendations"
            :key="item.id"
            class="recommend-card"
            shadow="hover"
          >
            <div class="recommend-title">{{ item.title }}</div>
            <div class="recommend-meta">
              <el-tag size="small" :type="difficultyTagType(item.difficulty)">
                {{ difficultyLabel(item.difficulty) }}
              </el-tag>
              <el-tag size="small" effect="plain">{{ typeLabel(item.type) }}</el-tag>
            </div>
            <el-button size="small" type="primary" text @click="$emit('view-question', item.id)">
              查看题目
            </el-button>
          </el-card>
        </el-space>
      </section>
    </div>

    <div v-else class="drawer-empty">
      <el-empty description="请选择题目开始练习" />
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  question: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  practiceRecords: {
    type: Array,
    default: () => []
  },
  recommendations: {
    type: Array,
    default: () => []
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit', 'view-question'])

const answerState = reactive({
  text: '',
  options: [],
  code: ''
})

const openedAt = ref(null)
const timerId = ref(null)
const elapsed = ref(0)

const timerLabel = computed(() => {
  if (!elapsed.value) return ''
  const minutes = Math.floor(elapsed.value / 60)
  const seconds = elapsed.value % 60
  return minutes ? `${minutes}分${seconds.toString().padStart(2, '0')}秒` : `${seconds}秒`
})

watch(
  () => props.visible,
  value => {
    if (value) {
      startTimer()
    } else {
      stopTimer()
    }
  }
)

watch(
  () => props.question?.id,
  () => {
    resetAnswers()
    if (props.visible && props.question) {
      startTimer()
    }
  }
)

function startTimer() {
  openedAt.value = Date.now()
  elapsed.value = 0
  stopTimer()
  timerId.value = setInterval(() => {
    elapsed.value = Math.max(0, Math.floor((Date.now() - openedAt.value) / 1000))
  }, 1000)
}

function stopTimer() {
  if (timerId.value) {
    clearInterval(timerId.value)
    timerId.value = null
  }
}

function difficultyLabel(value) {
  const map = {
    easy: '基础',
    medium: '进阶',
    hard: '挑战'
  }
  return map[value] || value || '未知'
}

function difficultyTagType(value) {
  const map = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return map[value] || 'info'
}

function typeLabel(value) {
  const map = {
    short_answer: '简答题',
    multiple_choice: '多选题',
    coding: '编程题'
  }
  return map[value] || value || '题型'
}

const disableSubmit = computed(() => {
  if (!props.question) return true
  if (props.submitting) return true
  if (props.question.type === 'multiple_choice') {
    return !answerState.options.length
  }
  if (props.question.type === 'short_answer') {
    return !answerState.text.trim()
  }
  if (props.question.type === 'coding') {
    return !answerState.code.trim()
  }
  return false
})

function resetAnswers() {
  answerState.text = ''
  answerState.options = []
  answerState.code = props.question?.starterCode || ''
  openedAt.value = Date.now()
  elapsed.value = 0
}

function handleSubmit() {
  if (!props.question) return
  const payload = {}
  if (props.question.type === 'multiple_choice') {
    payload.answerOptions = [...answerState.options]
  } else if (props.question.type === 'short_answer') {
    payload.answer = answerState.text.trim()
  } else {
    payload.code = answerState.code
  }
  if (openedAt.value) {
    payload.timeTaken = Math.max(1, Math.floor((Date.now() - openedAt.value) / 1000))
  }
  emit('submit', payload)
}

function handleClose() {
  emit('close')
}

function formatTimestamp(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

function truncate(text, length = 120) {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

function recordType(record) {
  if (record.isCorrect === true) return 'success'
  if (record.isCorrect === false) return 'danger'
  return 'info'
}

function recordLabel(record) {
  if (record.isCorrect === true) return '答对'
  if (record.isCorrect === false) return '待提升'
  return '待评估'
}
</script>

<style scoped>
.question-detail-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.header-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-tags {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.drawer-loading {
  padding: 24px;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 24px;
}

.question-text {
  white-space: pre-line;
  line-height: 1.6;
  font-size: 15px;
  color: #303133;
}

.options-list {
  margin: 12px 0 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #606266;
}

.option-id {
  font-weight: 600;
  margin-right: 6px;
}

.section-meta {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.practice-block h4 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.practice-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.timer-label {
  font-size: 13px;
  color: #909399;
}

.testcase-list {
  margin-top: 10px;
  padding-left: 18px;
  color: #909399;
}

.reference-text {
  white-space: pre-line;
  line-height: 1.6;
  color: #606266;
}

.records-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  padding: 12px;
  border-radius: 8px;
  background-color: #f5f7fa;
}

.record-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.record-answer {
  font-size: 14px;
  color: #303133;
}

.recommend-card {
  width: 180px;
}

.recommend-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.recommend-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.drawer-empty {
  padding: 40px 0;
}
</style>
