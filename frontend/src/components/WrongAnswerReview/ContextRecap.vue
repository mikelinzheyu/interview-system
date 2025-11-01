<template>
  <div class="context-recap module">
    <div class="module-header">
      <h2 class="module-title">
        <el-icon><Document /></el-icon>
        情境回顾
      </h2>
      <p class="module-subtitle">让我们回到当时的面试场景</p>
    </div>

    <div class="module-content">
      <!-- Interview context -->
      <div class="context-info">
        <div class="context-item">
          <div class="context-label">面试职位</div>
          <div class="context-value">{{ wrongAnswer.sessionLabel }}</div>
        </div>
        <div class="context-item">
          <div class="context-label">面试时间</div>
          <div class="context-value">{{ formatDate(wrongAnswer.context.timestamp) }}</div>
        </div>
      </div>

      <!-- Question -->
      <div class="question-section">
        <div class="question-label">题干</div>
        <div class="question-text">{{ wrongAnswer.questionContent }}</div>
      </div>

      <!-- Asker voice (if available) -->
      <div v-if="wrongAnswer.context.askerVoiceUrl" class="voice-section">
        <div class="voice-label">
          <el-icon><VideoCamera /></el-icon>
          面试官提问音频
        </div>
        <div class="voice-player">
          <audio controls :src="wrongAnswer.context.askerVoiceUrl" class="audio-element"></audio>
        </div>
      </div>

      <!-- Review history timeline (optional) -->
      <div v-if="reviewHistory && reviewHistory.length > 0" class="history-section">
        <div class="history-label">复习历史</div>
        <div class="history-timeline">
          <div
            v-for="(record, index) in reviewHistory.slice(0, 5)"
            :key="index"
            class="history-item"
            :class="`history-${record.status}`"
          >
            <div class="history-dot"></div>
            <div class="history-content">
              <div class="history-date">{{ formatDate(record.timestamp) }}</div>
              <div class="history-score">得分: {{ record.score }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Document, VideoCamera } from '@element-plus/icons-vue'

const props = defineProps({
  wrongAnswer: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Mock review history (will be fetched from API)
const reviewHistory = computed(() => {
  return [
    { timestamp: '2025-10-28 10:00:00', status: 'wrong', score: 60 },
    { timestamp: '2025-10-25 14:30:00', status: 'wrong', score: 65 },
    { timestamp: '2025-10-20 09:15:00', status: 'correct', score: 85 }
  ]
})

// Formatting functions
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.module {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.module-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.module-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2a44;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-subtitle {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.module-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== Context Info ========== */
.context-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

.context-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.context-label {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}

.context-value {
  font-size: 14px;
  color: #333;
}

/* ========== Question Section ========== */
.question-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
}

.question-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  padding: 16px;
  background: #f7f8fa;
  border-left: 4px solid #409eff;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ========== Voice Section ========== */
.voice-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.voice-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
  display: flex;
  align-items: center;
  gap: 6px;
}

.voice-player {
  width: 100%;
}

.audio-element {
  width: 100%;
  height: 40px;
  border-radius: 6px;
}

/* ========== History Section ========== */
.history-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 20px;
  position: relative;
}

.history-timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7eb;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

.history-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #909399;
  margin-top: 4px;
  flex-shrink: 0;
  border: 2px solid #fff;
}

.history-item.history-correct .history-dot {
  background: #67c23a;
}

.history-item.history-wrong .history-dot {
  background: #f56c6c;
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-date {
  font-size: 13px;
  color: #606266;
}

.history-score {
  font-size: 13px;
  color: #909399;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .module {
    padding: 16px;
  }

  .module-title {
    font-size: 16px;
  }

  .context-info {
    grid-template-columns: 1fr;
  }

  .question-text {
    font-size: 13px;
    padding: 12px;
  }
}
</style>
