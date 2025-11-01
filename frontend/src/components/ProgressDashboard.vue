<template>
  <div class="progress-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h3 class="dashboard-title">
        <i class="el-icon-data-analysis"></i> 学习进度仪表板
      </h3>
      <div class="header-controls">
        <el-button-group>
          <el-button
            :type="timeRange === 'week' ? 'primary' : 'default'"
            size="small"
            @click="timeRange = 'week'"
          >
            周
          </el-button>
          <el-button
            :type="timeRange === 'month' ? 'primary' : 'default'"
            size="small"
            @click="timeRange = 'month'"
          >
            月
          </el-button>
          <el-button
            :type="timeRange === 'all' ? 'primary' : 'default'"
            size="small"
            @click="timeRange = 'all'"
          >
            全部
          </el-button>
        </el-button-group>

        <el-button
          icon="Refresh"
          circle
          size="small"
          @click="refreshDashboard"
        />
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">📚</div>
        <div class="metric-content">
          <span class="metric-label">学科进度</span>
          <span class="metric-value">{{ summaryStats.completedDomains }}/{{ summaryStats.totalDomains }}</span>
          <el-progress
            :percentage="summaryStats.completionRate"
            :color="getProgressColor(summaryStats.completionRate)"
          />
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">✅</div>
        <div class="metric-content">
          <span class="metric-label">整体准确率</span>
          <span class="metric-value">{{ summaryStats.overallAccuracy }}%</span>
          <small>{{ summaryStats.totalCorrect }}/{{ summaryStats.totalQuestions }} 题</small>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">⏱️</div>
        <div class="metric-content">
          <span class="metric-label">总学时</span>
          <span class="metric-value">{{ summaryStats.totalHours }}h</span>
          <small>继续加油！</small>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">🔥</div>
        <div class="metric-content">
          <span class="metric-label">连续学习</span>
          <span class="metric-value">{{ summaryStats.maxStreak }}天</span>
          <small>个人最高：{{ summaryStats.maxStreak }}天</small>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Weekly Progress Chart -->
      <div class="chart-card">
        <h4 class="chart-title">📊 近四周学习统计</h4>
        <div ref="weeklyChartRef" class="chart-container"></div>
      </div>

      <!-- Accuracy Trend Chart -->
      <div class="chart-card">
        <h4 class="chart-title">📈 准确率趋势</h4>
        <div ref="accuracyChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- Domain Performance -->
    <div class="performance-section">
      <div class="section-header">
        <h4 class="section-title">⭐ 学科表现</h4>
        <el-tabs v-model="performanceTab">
          <el-tab-pane label="优势学科" name="top" />
          <el-tab-pane label="需关注" name="needsAttention" />
        </el-tabs>
      </div>

      <!-- Top Performing -->
      <div v-if="performanceTab === 'top'" class="domains-list">
        <div
          v-for="domain in topDomains"
          :key="domain.domainId"
          class="domain-row"
        >
          <div class="domain-info">
            <h5 class="domain-name">{{ getDomainName(domain.domainId) }}</h5>
            <div class="domain-stats">
              <span class="stat">{{ domain.completionPercentage }}% 完成</span>
              <span class="stat">{{ domain.accuracy }}% 准确</span>
              <span class="stat">{{ domain.streak }}天连续</span>
            </div>
          </div>
          <div class="domain-progress">
            <el-progress
              :percentage="domain.accuracy"
              :color="getAccuracyColor(domain.accuracy)"
              :show-text="false"
            />
          </div>
        </div>

        <div v-if="topDomains.length === 0" class="empty-message">
          还没有学科数据
        </div>
      </div>

      <!-- Needs Attention -->
      <div v-if="performanceTab === 'needsAttention'" class="domains-list">
        <div
          v-for="domain in attentionDomains"
          :key="domain.domainId"
          class="domain-row"
        >
          <div class="domain-info">
            <h5 class="domain-name">{{ getDomainName(domain.domainId) }}</h5>
            <div class="domain-stats">
              <span class="stat">{{ domain.completionPercentage }}% 完成</span>
              <span class="stat">{{ domain.accuracy }}% 准确</span>
              <span class="stat">{{ domain.totalQuestions }} 题</span>
            </div>
          </div>
          <el-button
            size="small"
            type="primary"
            @click="focusDomain(domain.domainId)"
          >
            复习
          </el-button>
        </div>

        <div v-if="attentionDomains.length === 0" class="empty-message">
          所有学科都很棒！
        </div>
      </div>
    </div>

    <!-- Insights Section -->
    <div v-if="insights.length > 0" class="insights-section">
      <h4 class="section-title">💡 学习洞察</h4>
      <div class="insights-grid">
        <div
          v-for="insight in insights"
          :key="insight.title"
          class="insight-card"
          :class="`insight-${insight.type}`"
        >
          <div class="insight-header">
            <span class="insight-icon">{{ insight.icon }}</span>
            <h5 class="insight-title">{{ insight.title }}</h5>
          </div>
          <p class="insight-description">{{ insight.description }}</p>
        </div>
      </div>
    </div>

    <!-- Completion Prediction -->
    <div v-if="selectedDomain && completionPrediction" class="prediction-section">
      <h4 class="section-title">🎯 完成时间预测</h4>
      <div class="prediction-content">
        <div class="prediction-card">
          <span class="prediction-label">乐观估计</span>
          <span class="prediction-value">{{ completionPrediction.optimisticDays }} 天</span>
          <small>{{ formatDate(completionPrediction.optimisticDate) }}</small>
        </div>
        <div class="prediction-card middle">
          <span class="prediction-label">现实估计</span>
          <span class="prediction-value">{{ completionPrediction.realisticDays }} 天</span>
          <small>{{ formatDate(completionPrediction.realisticDate) }}</small>
        </div>
        <div class="prediction-card">
          <span class="prediction-label">保守估计</span>
          <span class="prediction-value">{{ completionPrediction.pessimisticDays }} 天</span>
          <small>{{ formatDate(completionPrediction.pessimisticDate) }}</small>
        </div>
      </div>
      <div class="prediction-progress">
        <div class="progress-item">
          <span class="progress-label">完成进度</span>
          <el-progress
            :percentage="completionPrediction.completionPercentage"
            :color="getProgressColor(completionPrediction.completionPercentage)"
          />
        </div>
        <div class="progress-item">
          <span class="progress-label">剩余题目</span>
          <span class="progress-value">{{ completionPrediction.remainingQuestions }} 道</span>
        </div>
      </div>
    </div>

    <!-- Goal Setting -->
    <div class="goals-section">
      <h4 class="section-title">🎯 学习目标</h4>
      <div class="goals-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="完成学科数">
              <el-input-number
                v-model="learningGoals.domainsToComplete"
                :min="1"
                :max="50"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="目标准确率">
              <el-input-number
                v-model="learningGoals.targetAccuracy"
                :min="0"
                :max="100"
                suffix="%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="每日学时">
              <el-input-number
                v-model="learningGoals.dailyHours"
                :min="0.5"
                :step="0.5"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-button type="primary" @click="saveGoals">保存目标</el-button>
      </div>

      <!-- Goal Progress -->
      <div class="goal-progress">
        <div class="goal-item">
          <span class="goal-label">完成进度</span>
          <el-progress
            :percentage="getGoalProgress('domains')"
            color="#67c23a"
          />
          <small>{{ summaryStats.completedDomains }}/{{ learningGoals.domainsToComplete }}</small>
        </div>
        <div class="goal-item">
          <span class="goal-label">准确率目标</span>
          <el-progress
            :percentage="getGoalProgress('accuracy')"
            color="#e6a23c"
          />
          <small>{{ summaryStats.overallAccuracy }}%/{{ learningGoals.targetAccuracy }}%</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useDomainStore } from '@/stores/domain'
import analyticsService from '@/services/analyticsService'
import { ElMessage } from 'element-plus'

const store = useDomainStore()

// Refs
const timeRange = ref('month')
const performanceTab = ref('top')
const selectedDomain = ref(null)

const weeklyChartRef = ref(null)
const accuracyChartRef = ref(null)

let weeklyChart = null
let accuracyChart = null

// State
const summaryStats = ref({})
const topDomains = ref([])
const attentionDomains = ref([])
const insights = ref([])
const completionPrediction = ref(null)

const learningGoals = ref({
  domainsToComplete: 10,
  targetAccuracy: 85,
  dailyHours: 2
})

// Mock activities (in real app, from backend)
const mockActivities = ref([])

/**
 * Initialize dashboard
 */
const initialize = async () => {
  if (store.domains.length === 0) {
    await store.loadDomains()
  }

  // Generate mock activities
  generateMockActivities()

  // Refresh dashboard
  refreshDashboard()
}

/**
 * Generate mock activities for demo
 */
const generateMockActivities = () => {
  const activities = []
  const now = new Date()

  for (let i = 0; i < 28; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    if (Math.random() > 0.3) { // 70% days have activity
      const domainId = Math.floor(Math.random() * Math.min(5, store.domains.length)) + 1
      const questionsAttempted = Math.floor(Math.random() * 10) + 5
      const questionsCorrect = Math.floor(questionsAttempted * (Math.random() * 0.5 + 0.5))

      activities.push(
        analyticsService.trackActivity(domainId, 'question_attempted', {
          questionsAttempted,
          questionsCorrect,
          timeSpent: Math.floor(questionsAttempted * 1.5)
        })
      )
    }
  }

  // Set timestamps
  activities.forEach((a, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - Math.floor(i / 2))
    a.timestamp = date
  })

  mockActivities.value = activities
}

/**
 * Refresh dashboard
 */
const refreshDashboard = () => {
  // Calculate all metrics
  const allMetrics = store.domains.map(domain => {
    return analyticsService.calculateProgressMetrics(
      domain.id,
      mockActivities.value,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
  })

  // Get summary stats
  summaryStats.value = analyticsService.getDomainStatisticsSummary(allMetrics)

  // Get top and attention domains
  topDomains.value = analyticsService.getTopPerformingDomains(allMetrics, 5)
  attentionDomains.value = analyticsService.getDomainsNeedingAttention(allMetrics, 5)

  // Generate insights
  if (allMetrics.length > 0) {
    const firstMetric = allMetrics[0]
    const velocity = analyticsService.calculateLearningVelocity(firstMetric, mockActivities.value)
    insights.value = analyticsService.generateInsights(firstMetric, velocity)
    completionPrediction.value = analyticsService.predictCompletionDate(firstMetric, velocity)
  }

  // Render charts
  renderCharts(allMetrics)
}

/**
 * Render ECharts
 */
const renderCharts = (allMetrics) => {
  // Weekly stats chart
  const weeklyStats = analyticsService.calculateWeeklyStats(mockActivities.value, 4)

  if (weeklyChartRef.value && weeklyStats.length > 0) {
    if (!weeklyChart) {
      weeklyChart = echarts.init(weeklyChartRef.value)
    }

    weeklyChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['题目数', '准确率'] },
      xAxis: {
        type: 'category',
        data: weeklyStats.map(w => w.week)
      },
      yAxis: [
        { type: 'value', name: '题目数' },
        { type: 'value', name: '准确率 (%)' }
      ],
      series: [
        {
          name: '题目数',
          data: weeklyStats.map(w => w.questionsAttempted),
          type: 'bar',
          smooth: true,
          itemStyle: { color: '#5e7ce0' }
        },
        {
          name: '准确率',
          data: weeklyStats.map(w => w.accuracy),
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          itemStyle: { color: '#67c23a' }
        }
      ]
    })
  }

  // Accuracy trend
  if (accuracyChartRef.value && allMetrics.length > 0) {
    if (!accuracyChart) {
      accuracyChart = echarts.init(accuracyChartRef.value)
    }

    const topDomainMetrics = allMetrics.slice(0, 5)

    accuracyChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: topDomainMetrics.map((m, i) => `学科 ${i + 1}`)
      },
      yAxis: { type: 'value', name: '准确率 (%)' },
      series: [
        {
          data: topDomainMetrics.map(m => m.accuracy),
          type: 'bar',
          smooth: true,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#5e7ce0' },
              { offset: 1, color: '#3c4dc0' }
            ])
          }
        }
      ]
    })
  }
}

/**
 * Get domain name
 */
const getDomainName = (domainId) => {
  const domain = store.domains.find(d => d.id === domainId)
  return domain ? domain.name : `学科 #${domainId}`
}

/**
 * Get accuracy color
 */
const getAccuracyColor = (accuracy) => {
  if (accuracy >= 85) return '#67c23a'
  if (accuracy >= 70) return '#e6a23c'
  return '#f56c6c'
}

/**
 * Get progress color
 */
const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

/**
 * Format date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Focus on domain
 */
const focusDomain = (domainId) => {
  selectedDomain.value = domainId
  ElMessage.info(`聚焦学科: ${getDomainName(domainId)}`)
}

/**
 * Save learning goals
 */
const saveGoals = () => {
  localStorage.setItem('learningGoals', JSON.stringify(learningGoals.value))
  ElMessage.success('目标已保存')
}

/**
 * Get goal progress percentage
 */
const getGoalProgress = (type) => {
  if (type === 'domains') {
    return Math.min(100, Math.round((summaryStats.value.completedDomains / learningGoals.value.domainsToComplete) * 100))
  } else if (type === 'accuracy') {
    return Math.min(100, Math.round((summaryStats.value.overallAccuracy / learningGoals.value.targetAccuracy) * 100))
  }
  return 0
}

// Load saved goals
onMounted(() => {
  const saved = localStorage.getItem('learningGoals')
  if (saved) {
    learningGoals.value = JSON.parse(saved)
  }
  initialize()
})

// Auto-refresh on time range change
watch(() => timeRange.value, () => {
  refreshDashboard()
})
</script>

<style scoped>
.progress-dashboard {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  overflow-y: auto;
  max-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.dashboard-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dashboard-title i {
  color: #5e7ce0;
  font-size: 24px;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  transition: all 0.3s;
}

.metric-card:hover {
  border-color: rgba(94, 124, 224, 0.3);
  box-shadow: 0 4px 12px rgba(94, 124, 224, 0.1);
}

.metric-icon {
  font-size: 32px;
  min-width: 40px;
}

.metric-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #5e7ce0;
}

.metric-card small {
  font-size: 11px;
  color: #9ca3af;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 16px;
}

.chart-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.performance-section {
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.domains-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.domain-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.domain-info {
  flex: 1;
  min-width: 0;
}

.domain-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 6px 0;
}

.domain-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.domain-progress {
  min-width: 150px;
}

.empty-message {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

.insights-section {
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
  border: 1px solid rgba(94, 124, 224, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.insight-card {
  background: white;
  border-left: 4px solid #5e7ce0;
  border-radius: 6px;
  padding: 12px;
}

.insight-card.insight-strength {
  border-left-color: #67c23a;
}

.insight-card.insight-weakness {
  border-left-color: #f56c6c;
}

.insight-card.insight-recommendation {
  border-left-color: #e6a23c;
}

.insight-card.insight-milestone {
  border-left-color: #5e7ce0;
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.insight-icon {
  font-size: 18px;
}

.insight-title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.insight-description {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

.prediction-section {
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.prediction-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.prediction-card {
  text-align: center;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(229, 230, 235, 0.3);
}

.prediction-card.middle {
  background: rgba(94, 124, 224, 0.05);
  border-color: rgba(94, 124, 224, 0.2);
}

.prediction-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.prediction-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #5e7ce0;
  margin-bottom: 4px;
}

.prediction-card small {
  font-size: 11px;
  color: #9ca3af;
}

.prediction-progress {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-label {
  min-width: 100px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.progress-value {
  font-size: 14px;
  font-weight: 700;
  color: #5e7ce0;
}

.goals-section {
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 16px;
}

.goals-form {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.goal-progress {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.goal-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.goal-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.goal-item small {
  font-size: 11px;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .progress-dashboard {
    padding: 16px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 250px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .domain-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .domain-progress {
    width: 100%;
    min-width: auto;
  }
}
</style>
