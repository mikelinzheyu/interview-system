<template>
  <div class="retry-answer-panel">
    <!-- Header -->
    <div class="retry-header">
      <h3 class="retry-title">
        <el-icon><VideoPlay /></el-icon>
        重新回答
      </h3>
      <el-button text type="danger" @click="$emit('close')">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <!-- Question Context -->
    <div class="retry-question-context">
      <div class="question-label">题目：</div>
      <div class="question-content">{{ wrongAnswer?.questionTitle }}</div>
    </div>

    <!-- Input Area -->
    <div class="retry-input-section">
      <div class="input-label">
        <span>请输入你的新答案：</span>
        <span class="char-count">{{ newAnswer.length }}/1000</span>
      </div>
      <el-input
        v-model="newAnswer"
        type="textarea"
        :autosize="{ minRows: 5, maxRows: 10 }"
        placeholder="请详细描述你的答案（至少20个字符）"
        maxlength="1000"
        show-word-limit
        class="retry-textarea"
      />
    </div>

    <!-- Comparison Section -->
    <div v-if="showComparison && newAnswer.trim()" class="retry-comparison">
      <el-divider />
      <div class="comparison-title">
        <el-icon><DataAnalysis /></el-icon>
        对比分析
      </div>

      <div class="comparison-content">
        <div class="comparison-item">
          <div class="comparison-item-title">
            <span class="label">之前的回答</span>
            <span class="tag old">之前</span>
          </div>
          <div class="comparison-item-content">
            {{ wrongAnswer?.myAnswer?.content }}
          </div>
        </div>

        <div class="comparison-item">
          <div class="comparison-item-title">
            <span class="label">新的回答</span>
            <span class="tag new">新</span>
          </div>
          <div class="comparison-item-content">
            {{ newAnswer }}
          </div>
        </div>

        <!-- Quick AI Analysis Hint -->
        <div class="comparison-hint">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            提示：提交后，AI 将对你的新答案进行分析，并与之前的回答进行对比。
          </el-alert>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="retry-actions">
      <el-button @click="$emit('close')">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="newAnswer.trim().length < 20"
        @click="handleSubmit"
      >
        <el-icon><Check /></el-icon>
        提交新答案
      </el-button>
    </div>

    <!-- Success Message -->
    <el-alert
      v-if="showSuccess"
      type="success"
      :closable="true"
      show-icon
      class="retry-success"
      @close="showSuccess = false"
    >
      答案已提交！AI 正在分析你的新答案，请稍候...
    </el-alert>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Close, DataAnalysis, Check } from '@element-plus/icons-vue'

const props = defineProps({
  wrongAnswer: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'submit'])

const newAnswer = ref('')
const submitting = ref(false)
const showSuccess = ref(false)

const showComparison = computed(() => {
  return newAnswer.value.trim().length > 0
})

const handleSubmit = async () => {
  if (newAnswer.value.trim().length < 20) {
    ElMessage.warning('请至少输入 20 个字符的答案')
    return
  }

  submitting.value = true
  try {
    // 模拟 API 提交
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 发送提交事件
    emit('submit', {
      newAnswer: newAnswer.value.trim(),
      recordId: props.wrongAnswer?.id,
      timestamp: new Date().toISOString()
    })

    showSuccess.value = true
    // 2秒后关闭面板
    setTimeout(() => {
      newAnswer.value = ''
      emit('close')
    }, 2000)
  } catch (error) {
    ElMessage.error('提交失败，请稍后重试')
    console.error('Submit failed:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.retry-answer-panel {
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* ========== Header ========== */
.retry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #5c6af0;
}

.retry-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2a44;
}

.retry-title .el-icon {
  font-size: 20px;
  color: #5c6af0;
}

/* ========== Question Context ========== */
.retry-question-context {
  background: #fff;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
  border-left: 4px solid #5c6af0;
}

.question-label {
  font-size: 12px;
  font-weight: 600;
  color: #a0a5bd;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.question-content {
  font-size: 15px;
  color: #1f2a44;
  line-height: 1.6;
  font-weight: 500;
}

/* ========== Input Section ========== */
.retry-input-section {
  margin-bottom: 20px;
}

.input-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #1f2a44;
}

.char-count {
  font-size: 12px;
  color: #a0a5bd;
}

.retry-textarea {
  background: #fff;
}

.retry-textarea :deep(.el-textarea__inner) {
  border: 1px solid #dde1ec;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.3s ease;
}

.retry-textarea :deep(.el-textarea__inner):focus {
  border-color: #5c6af0;
  box-shadow: 0 0 0 2px rgba(92, 106, 240, 0.1);
}

/* ========== Comparison Section ========== */
.retry-comparison {
  background: #fff;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
}

.comparison-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
  margin-bottom: 16px;
}

.comparison-title .el-icon {
  font-size: 16px;
  color: #5c6af0;
}

.comparison-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fafbff;
  border-radius: 6px;
  border-left: 3px solid #dde1ec;

  &:has(.tag.old) {
    border-left-color: #f56c6c;
  }

  &:has(.tag.new) {
    border-left-color: #67c23a;
  }
}

.comparison-item-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: #a0a5bd;
  text-transform: uppercase;
}

.tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.old {
    background: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
  }

  &.new {
    background: rgba(103, 194, 58, 0.1);
    color: #67c23a;
  }
}

.comparison-item-content {
  font-size: 13px;
  color: #283056;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.comparison-hint {
  margin-top: 12px;
}

.comparison-hint :deep(.el-alert) {
  margin: 0;
}

/* ========== Action Buttons ========== */
.retry-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.retry-actions .el-button {
  min-width: 120px;
}

/* ========== Success Message ========== */
.retry-success {
  margin-top: 16px;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .retry-answer-panel {
    padding: 16px;
  }

  .retry-header {
    margin-bottom: 16px;
  }

  .retry-title {
    font-size: 16px;
  }

  .retry-actions {
    flex-direction: column;
  }

  .retry-actions .el-button {
    width: 100%;
  }

  .input-label {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
