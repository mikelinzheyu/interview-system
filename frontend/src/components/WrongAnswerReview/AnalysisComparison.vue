<template>
  <div class="analysis-comparison module">
    <div class="module-header">
      <h2 class="module-title">
        <el-icon><DataAnalysis /></el-icon>
        我的回答 vs AI诊断
      </h2>
      <p class="module-subtitle">深度分析你的回答问题</p>
    </div>

    <div class="comparison-container">
      <!-- Left: My Answer -->
      <div class="comparison-panel my-answer-panel">
        <div class="panel-title">
          <el-icon><User /></el-icon>
          我的原始回答
        </div>

        <!-- Answer voice (if available) -->
        <div v-if="wrongAnswer.myAnswer?.voiceUrl" class="answer-voice">
          <div class="voice-header">
            <el-icon><VideoPlay /></el-icon>
            回答录音
          </div>
          <audio controls :src="wrongAnswer.myAnswer.voiceUrl" class="audio-element"></audio>
        </div>

        <!-- Answer transcript -->
        <div class="answer-transcript">
          <div class="transcript-label">文字稿（高亮关键错误）</div>
          <div class="transcript-content">
            <span
              v-for="(word, index) in highlightedWords"
              :key="index"
              :class="word.highlight"
            >
              {{ word.text }}
            </span>
          </div>
        </div>

        <!-- Answer metrics -->
        <div class="answer-metrics">
          <div class="metric-item">
            <div class="metric-label">流利度</div>
            <el-progress
              :percentage="(wrongAnswer.myAnswer?.metrics?.fluency || 0) * 100"
              :format="p => `${p.toFixed(0)}%`"
              color="#409eff"
            />
          </div>
          <div class="metric-item">
            <div class="metric-label">准确度</div>
            <el-progress
              :percentage="(wrongAnswer.myAnswer?.metrics?.accuracy || 0) * 100"
              :format="p => `${p.toFixed(0)}%`"
              color="#67c23a"
            />
          </div>
          <div class="metric-item">
            <div class="metric-label">完整度</div>
            <el-progress
              :percentage="(wrongAnswer.myAnswer?.metrics?.completeness || 0) * 100"
              :format="p => `${p.toFixed(0)}%`"
              color="#e6a23c"
            />
          </div>
        </div>
      </div>

      <!-- Right: AI Diagnosis -->
      <div class="comparison-panel ai-diagnosis-panel">
        <div class="panel-title">
          <el-icon><Cpu /></el-icon>
          AI智能诊断
        </div>

        <!-- Overall score -->
        <div class="score-card">
          <div class="score-circle">
            <div class="score-number">{{ wrongAnswer.aiDiagnosis?.overallScore || 0 }}</div>
            <div class="score-label">总分</div>
          </div>
          <div class="score-summary">{{ wrongAnswer.aiDiagnosis?.summary }}</div>
        </div>

        <!-- Detailed analysis -->
        <div class="diagnosis-list">
          <div class="diagnosis-label">详细诊断分析</div>
          <div
            v-for="(analysis, index) in wrongAnswer.aiDiagnosis?.analysisList || []"
            :key="index"
            class="diagnosis-item"
          >
            <div class="analysis-category">
              <span class="category-tag">{{ analysis.category }}</span>
            </div>
            <div class="analysis-content">
              <div class="issue">
                <strong>问题：</strong>
                {{ analysis.issue }}
              </div>
              <div class="suggestion">
                <strong>建议：</strong>
                {{ analysis.suggestions }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overall statistics -->
    <div class="comparison-stats">
      <div class="stats-header">综合统计</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon error-icon">
            <el-icon><Close /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">答错次数</div>
            <div class="stat-value">{{ wrongAnswer.learningStatus?.wrongCount || 0 }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon correct-icon">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">答对次数</div>
            <div class="stat-value">{{ wrongAnswer.learningStatus?.correctCount || 0 }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon mastery-icon">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">掌握度</div>
            <div class="stat-value">{{ wrongAnswer.learningStatus?.mastery || 0 }}%</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon priority-icon">
            <el-icon><Flag /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">学习优先级</div>
            <div class="stat-value">{{ priorityLabel }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  DataAnalysis,
  User,
  VideoPlay,
  Cpu,
  Close,
  SuccessFilled,
  CircleCheckFilled,
  Flag
} from '@element-plus/icons-vue'

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

// Mock highlighted words for demonstration
const highlightedWords = computed(() => {
  const text = props.wrongAnswer?.myAnswer?.content || ''
  // 这里简单演示，实际应该根据 AI 分析的关键词来高亮
  return text.split(' ').map((word, index) => ({
    text: word + ' ',
    highlight: index % 5 === 0 ? 'error-highlight' : ''
  }))
})

const priorityLabel = computed(() => {
  const priority = props.wrongAnswer?.learningStatus?.priority
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || '中'
})
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

/* ========== Comparison Container ========== */
.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.comparison-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7eb;
}

/* ========== My Answer Panel ========== */
.answer-voice {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-header {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.audio-element {
  width: 100%;
  height: 32px;
  border-radius: 4px;
}

.answer-transcript {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transcript-label {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}

.transcript-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  white-space: pre-wrap;
  word-break: break-word;

  .error-highlight {
    background-color: #ffe6e6;
    color: #f56c6c;
    padding: 2px 4px;
    border-radius: 2px;
  }
}

.answer-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}

.metric-item :deep(.el-progress) {
  --el-progress-bg-color: #e4e7eb;
  height: 6px;
}

/* ========== AI Diagnosis Panel ========== */
.score-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  flex-shrink: 0;
}

.score-number {
  font-size: 32px;
  font-weight: 700;
}

.score-label {
  font-size: 11px;
  font-weight: 600;
}

.score-summary {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  flex: 1;
}

.diagnosis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diagnosis-label {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}

.diagnosis-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
}

.analysis-category {
  display: flex;
  gap: 8px;
}

.category-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  background: #fee;
  color: #f56c6c;
  border-radius: 3px;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.issue,
.suggestion {
  line-height: 1.5;
}

.issue strong,
.suggestion strong {
  color: #1f2a44;
}

/* ========== Statistics ========== */
.comparison-stats {
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.stats-header {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
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

.stat-icon.priority-icon {
  background: linear-gradient(135deg, #e6a23c, #d79a2c);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2a44;
}

/* ========== Responsive ========== */
@media (max-width: 1024px) {
  .comparison-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .module {
    padding: 16px;
  }

  .module-title {
    font-size: 16px;
  }

  .comparison-panel {
    padding: 12px;
  }

  .score-circle {
    width: 70px;
    height: 70px;
    font-size: 28px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}
</style>
