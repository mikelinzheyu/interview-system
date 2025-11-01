<template>
  <div class="ai-recommendation-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="ai-icon">🤖</span> AI 学习推荐
      </h3>
      <el-button
        icon="Refresh"
        circle
        size="small"
        @click="refreshRecommendations"
      />
    </div>

    <!-- AI Confidence Score -->
    <div class="confidence-section">
      <div class="confidence-header">
        <span class="confidence-label">推荐准确度</span>
        <span class="confidence-value">{{ confidenceScore }}%</span>
      </div>
      <el-progress
        :percentage="confidenceScore"
        :color="getConfidenceColor(confidenceScore)"
        :show-text="false"
      />
      <p class="confidence-desc">
        基于你的 {{ analyzeCount }} 次学习活动分析
      </p>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="recommendation-tabs">
      <!-- Personalized Recommendations Tab -->
      <el-tab-pane label="个性化推荐" name="personalized">
        <div class="tab-content">
          <div class="recommendations-list">
            <div
              v-for="(rec, idx) in mlRecommendations"
              :key="rec.id"
              class="recommendation-card"
              :style="{ animationDelay: `${idx * 100}ms` }"
            >
              <div class="card-header">
                <div class="rank-badge">{{ idx + 1 }}</div>
                <div class="domain-info">
                  <h5 class="domain-name">{{ rec.name }}</h5>
                  <p class="domain-reason">{{ rec.reason }}</p>
                </div>
                <div class="score-badge" :style="{ backgroundColor: getScoreColor(rec.score) }">
                  {{ Math.round(rec.score * 100) }}%
                </div>
              </div>

              <div class="card-metrics">
                <div class="metric">
                  <span class="metric-icon">⏱️</span>
                  <span class="metric-label">约{{ rec.estimatedTime }}小时</span>
                </div>
                <div class="metric">
                  <span class="metric-icon">📊</span>
                  <span class="metric-label">难度 {{ rec.difficulty }}/5</span>
                </div>
                <div class="metric">
                  <span class="metric-icon">👥</span>
                  <span class="metric-label">{{ rec.similarUsersCount }}人推荐</span>
                </div>
              </div>

              <el-button
                type="primary"
                size="small"
                @click="startLearning(rec)"
                style="width: 100%"
              >
                开始学习
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Learning Style Analysis Tab -->
      <el-tab-pane label="学习风格分析" name="learning-style">
        <div class="tab-content">
          <LearningStyleAnalysis :userId="userId" />
        </div>
      </el-tab-pane>

      <!-- Churn Risk Tab -->
      <el-tab-pane label="学习状态分析" name="churn-risk">
        <div class="tab-content">
          <div class="churn-analysis">
            <div class="churn-card">
              <div class="risk-header">
                <h4>学习坚持度评估</h4>
                <span class="risk-badge" :class="churnRisk.riskLevel">
                  {{ getRiskLevelLabel(churnRisk.riskLevel) }}
                </span>
              </div>

              <div class="risk-progress">
                <div class="risk-label">风险指数</div>
                <el-progress
                  :percentage="churnRisk.probability"
                  :color="getRiskColor(churnRisk.probability)"
                  :show-text="false"
                />
                <span class="risk-text">{{ Math.round(churnRisk.probability) }}%</span>
              </div>

              <el-divider />

              <div class="risk-factors">
                <h5>主要因素</h5>
                <div v-for="factor in churnRisk.factors" :key="factor.name" class="factor-item">
                  <div class="factor-header">
                    <span class="factor-name">{{ factor.name }}</span>
                    <span class="factor-impact">{{ factor.impact.toFixed(1) }} 分</span>
                  </div>
                  <p class="factor-description">{{ factor.description }}</p>
                </div>
              </div>

              <el-divider />

              <div class="interventions">
                <h5>建议措施</h5>
                <div v-for="(intervention, idx) in churnRisk.recommendations" :key="idx" class="intervention-item">
                  <div class="intervention-header">
                    <el-tag :type="getUrgencyType(intervention.urgency)" effect="light">
                      {{ getUrgencyLabel(intervention.urgency) }}
                    </el-tag>
                    <span class="intervention-action">{{ intervention.action }}</span>
                  </div>
                  <p class="intervention-reason">{{ intervention.reason }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Learning Path Tab -->
      <el-tab-pane label="学习路径规划" name="learning-path">
        <div class="tab-content">
          <div class="learning-path">
            <div class="path-header">
              <h4>{{ learningPath.goal }}</h4>
              <div class="path-duration">
                预计耗时：<strong>{{ learningPath.estimatedDuration }}</strong> 小时
              </div>
            </div>

            <div class="path-timeline">
              <div v-for="(stage, idx) in learningPath.stages" :key="idx" class="stage">
                <div class="stage-header">
                  <div class="stage-number">第 {{ idx + 1 }} 阶段</div>
                  <div class="stage-level">Lv. {{ stage.level }}</div>
                  <span class="stage-duration">{{ stage.estimatedDuration }}h</span>
                </div>

                <div class="stage-content">
                  <div class="stage-objectives">
                    <div v-for="obj in stage.objectives" :key="obj" class="objective">
                      <span class="objective-check">✓</span>
                      {{ obj }}
                    </div>
                  </div>

                  <div class="stage-domains">
                    <div v-for="domain in stage.domains" :key="domain.id" class="domain-item">
                      <span class="domain-icon">{{ domain.icon }}</span>
                      <span class="domain-name">{{ domain.name }}</span>
                      <el-button link type="primary" size="small">
                        了解更多
                      </el-button>
                    </div>
                  </div>
                </div>

                <div v-if="idx < learningPath.stages.length - 1" class="stage-arrow">
                  ↓
                </div>
              </div>
            </div>

            <el-button type="primary" @click="startLearningPath" style="width: 100%; margin-top: 16px">
              开始学习路径规划
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- Adaptive Difficulty Tab -->
      <el-tab-pane label="难度自适应" name="difficulty">
        <div class="tab-content">
          <div class="difficulty-section">
            <div class="difficulty-card">
              <h4>当前难度等级</h4>

              <div class="difficulty-display">
                <div class="current-difficulty">
                  <div class="difficulty-icon">{{ difficultyEmoji }}</div>
                  <div class="difficulty-info">
                    <div class="difficulty-label">{{ currentDifficultyLabel }}</div>
                    <div class="difficulty-rating">{{ currentDifficulty }}/5</div>
                  </div>
                </div>
              </div>

              <el-divider />

              <div class="difficulty-controls">
                <div class="control-group">
                  <span class="control-label">调整难度：</span>
                  <el-button-group>
                    <el-button
                      v-for="level in 5"
                      :key="level"
                      :type="currentDifficulty === level ? 'primary' : 'default'"
                      size="small"
                      @click="setDifficulty(level)"
                    >
                      {{ level }}
                    </el-button>
                  </el-button-group>
                </div>
              </div>

              <el-divider />

              <div class="difficulty-performance">
                <h5>性能反馈</h5>
                <div class="performance-stats">
                  <div class="stat">
                    <span class="stat-label">准确率</span>
                    <span class="stat-value">{{ accuracyRate }}%</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">完成率</span>
                    <span class="stat-value">{{ completionRate }}%</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">学习速度</span>
                    <span class="stat-value">{{ learningSpeed }}x</span>
                  </div>
                </div>
              </div>

              <el-alert
                v-if="difficultyAdvice"
                :title="difficultyAdvice.title"
                :type="difficultyAdvice.type"
                :description="difficultyAdvice.description"
                :closable="false"
                style="margin-top: 16px"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import mlRecommendationService from '@/services/mlRecommendationService'
import LearningStyleAnalysis from './LearningStyleAnalysis.vue'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const activeTab = ref('personalized')
const mlRecommendations = ref([])
const confidenceScore = ref(0)
const analyzeCount = ref(0)
const churnRisk = ref(null)
const learningPath = ref(null)
const currentDifficulty = ref(3)
const accuracyRate = ref(75)
const completionRate = ref(82)
const learningSpeed = ref(1.2)

// Computed
const currentDifficultyLabel = computed(() => {
  const labels = ['', '初级', '简单', '中等', '高级', '专家']
  return labels[currentDifficulty.value] || '中等'
})

const difficultyEmoji = computed(() => {
  const emojis = ['', '🌱', '🌿', '🌳', '🏔️', '🚀']
  return emojis[currentDifficulty.value] || '🌳'
})

const difficultyAdvice = computed(() => {
  if (accuracyRate.value > 85 && completionRate.value > 80) {
    return {
      title: '🎯 建议增加难度',
      type: 'success',
      description: '你的表现很好！建议尝试更高难度的挑战来提升技能。'
    }
  } else if (accuracyRate.value < 60 || completionRate.value < 70) {
    return {
      title: '⚠️ 建议降低难度',
      type: 'warning',
      description: '当前难度可能有些高，建议降低难度以巩固基础。'
    }
  }
  return null
})

// Methods
const loadRecommendations = () => {
  mlRecommendations.value = mlRecommendationService.getMLRecommendations(props.userId, 5)
  analyzeCount.value = Math.floor(Math.random() * 200) + 50
  confidenceScore.value = 70 + Math.floor(Math.random() * 25)
}

const loadChurnAnalysis = () => {
  churnRisk.value = mlRecommendationService.predictChurn(props.userId)
}

const loadLearningPath = () => {
  learningPath.value = {
    goal: 'Web 全栈开发',
    estimatedDuration: 120,
    stages: [
      {
        level: 1,
        estimatedDuration: 20,
        objectives: ['学习 HTML 基础', '掌握 CSS 样式'],
        domains: [
          { id: 1, name: 'HTML/CSS', icon: '🎨' },
          { id: 2, name: '响应式设计', icon: '📱' }
        ]
      },
      {
        level: 2,
        estimatedDuration: 30,
        objectives: ['JavaScript 基础', '理解 DOM 操作'],
        domains: [
          { id: 3, name: 'JavaScript', icon: '⚙️' },
          { id: 4, name: '异步编程', icon: '⏱️' }
        ]
      },
      {
        level: 3,
        estimatedDuration: 35,
        objectives: ['掌握 React', '构建复杂应用'],
        domains: [
          { id: 5, name: 'React', icon: '⚛️' },
          { id: 6, name: '状态管理', icon: '📦' }
        ]
      },
      {
        level: 4,
        estimatedDuration: 35,
        objectives: ['学习 Node.js', '数据库操作'],
        domains: [
          { id: 7, name: 'Node.js', icon: '📦' },
          { id: 8, name: 'MongoDB', icon: '🗄️' }
        ]
      }
    ]
  }
}

const refreshRecommendations = () => {
  loadRecommendations()
  loadChurnAnalysis()
  ElMessage.success('推荐已刷新')
}

const startLearning = (rec) => {
  ElMessage.success(`开始学习: ${rec.name}`)
}

const startLearningPath = () => {
  ElMessage.success('学习路径已启动')
}

const setDifficulty = (level) => {
  currentDifficulty.value = level
  const difficultyName = ['', '初级', '简单', '中等', '高级', '专家'][level]
  ElMessage.success(`难度已调整为: ${difficultyName}`)
}

const getConfidenceColor = (score) => {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

const getScoreColor = (score) => {
  if (score >= 0.8) return '#67c23a'
  if (score >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const getRiskColor = (probability) => {
  if (probability < 20) return '#67c23a'
  if (probability < 50) return '#e6a23c'
  if (probability < 75) return '#f56c6c'
  return '#d32f2f'
}

const getRiskLevelLabel = (level) => {
  const labels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险'
  }
  return labels[level] || '未知'
}

const getUrgencyLabel = (urgency) => {
  const labels = {
    low: '低优先',
    medium: '中等',
    high: '高优先',
    critical: '紧急'
  }
  return labels[urgency] || '未知'
}

const getUrgencyType = (urgency) => {
  const types = {
    low: 'info',
    medium: 'warning',
    high: 'warning',
    critical: 'danger'
  }
  return types[urgency] || 'info'
}

onMounted(() => {
  loadRecommendations()
  loadChurnAnalysis()
  loadLearningPath()
})
</script>

<style scoped>
.ai-recommendation-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-icon {
  font-size: 24px;
}

/* Confidence Section */
.confidence-section {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(103, 194, 58, 0.05) 100%);
  border: 1px solid rgba(103, 194, 58, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.confidence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.confidence-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.confidence-value {
  font-size: 18px;
  font-weight: 700;
  color: #67c23a;
}

.confidence-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
  margin-bottom: 0;
}

/* Tabs */
.recommendation-tabs {
  margin-top: 24px;
}

.tab-content {
  padding: 16px 0;
}

/* Recommendations List */
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-card {
  padding: 16px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  transition: all 0.3s;
  animation: slideIn 0.4s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recommendation-card:hover {
  border-color: rgba(94, 124, 224, 0.3);
  background: rgba(94, 124, 224, 0.02);
  box-shadow: 0 4px 12px rgba(94, 124, 224, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5e7ce0, #667eea);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.domain-info {
  flex: 1;
}

.domain-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 2px 0;
}

.domain-reason {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.score-badge {
  padding: 6px 12px;
  border-radius: 6px;
  color: white;
  font-weight: 700;
  font-size: 13px;
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.metric-icon {
  font-size: 14px;
}

.metric-label {
  color: #6b7280;
}

/* Learning Path */
.learning-path {
  padding: 12px 0;
}

.path-header {
  margin-bottom: 24px;
}

.path-header h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.path-duration {
  font-size: 13px;
  color: #6b7280;
}

.path-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stage {
  padding: 16px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stage-number {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.stage-level {
  padding: 4px 8px;
  background: rgba(94, 124, 224, 0.1);
  color: #5e7ce0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.stage-duration {
  font-size: 12px;
  color: #6b7280;
}

.stage-objectives {
  margin-bottom: 12px;
}

.objective {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  padding: 4px 0;
}

.objective-check {
  color: #67c23a;
  font-weight: 700;
}

.stage-domains {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.domain-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 4px;
}

.domain-icon {
  font-size: 18px;
}

.domain-name {
  flex: 1;
  font-size: 12px;
  color: #1f2937;
  font-weight: 600;
}

.stage-arrow {
  text-align: center;
  color: #d1d5db;
  font-size: 20px;
  margin: 8px 0;
}

/* Difficulty Section */
.difficulty-section {
  padding: 12px 0;
}

.difficulty-card {
  padding: 16px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
}

.difficulty-card h4 {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.difficulty-display {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.current-difficulty {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid rgba(94, 124, 224, 0.2);
}

.difficulty-icon {
  font-size: 36px;
}

.difficulty-info {
  display: flex;
  flex-direction: column;
}

.difficulty-label {
  font-size: 13px;
  color: #6b7280;
}

.difficulty-rating {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.difficulty-controls {
  margin-bottom: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.control-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.difficulty-performance {
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.difficulty-performance h5 {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.performance-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

/* Churn Analysis */
.churn-analysis {
  padding: 12px 0;
}

.churn-card {
  padding: 16px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
}

.risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.risk-header h4 {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.risk-badge.low {
  background: #67c23a;
}

.risk-badge.medium {
  background: #e6a23c;
}

.risk-badge.high {
  background: #f56c6c;
}

.risk-badge.critical {
  background: #d32f2f;
}

.risk-progress {
  margin-bottom: 12px;
}

.risk-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.risk-text {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  display: block;
  text-align: right;
  margin-top: 6px;
}

.risk-factors {
  margin-bottom: 12px;
}

.risk-factors h5 {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.factor-item {
  padding: 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 6px;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.factor-name {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

.factor-impact {
  font-size: 11px;
  color: #6b7280;
}

.factor-description {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

.interventions {
  margin-bottom: 0;
}

.interventions h5 {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.intervention-item {
  padding: 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 6px;
}

.intervention-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.intervention-action {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

.intervention-reason {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .ai-recommendation-panel {
    padding: 16px;
  }

  .card-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .performance-stats {
    grid-template-columns: 1fr;
  }

  .stage-header {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .confidence-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-metrics {
    grid-template-columns: 1fr;
  }

  .stage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
