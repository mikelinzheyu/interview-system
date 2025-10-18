<template>
  <div class="trend-analysis">
    <!-- 趋势图表区域 -->
    <el-card v-loading="loading" class="trend-chart-card">
      <template #header>
        <div class="card-header">
          <div class="header-info">
            <el-icon class="header-icon">
              <TrendCharts />
            </el-icon>
            <span class="header-title">学习趋势分析</span>
          </div>
          <el-select v-model="selectedTimeRange" size="small" @change="handleTimeRangeChange">
            <el-option label="最近7天" value="weekly" />
            <el-option label="最近30天" value="monthly" />
            <el-option label="最近90天" value="quarterly" />
          </el-select>
        </div>
      </template>

      <div class="chart-container">
        <!-- 简化的趋势图显示 -->
        <div class="trend-metrics">
          <div v-for="metric in trendMetrics" :key="metric.key" class="metric-item">
            <div class="metric-header">
              <el-icon :size="18" :color="metric.color">
                <component :is="metric.icon" />
              </el-icon>
              <span class="metric-label">{{ metric.label }}</span>
            </div>
            <div class="metric-value">
              <span class="value">{{ metric.value }}</span>
              <div class="trend-indicator" :class="`trend-${metric.trend}`">
                <el-icon :size="12">
                  <CaretTop v-if="metric.trend === 'up'" />
                  <CaretBottom v-else-if="metric.trend === 'down'" />
                  <Minus v-else />
                </el-icon>
                <span>{{ metric.change }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 趋势线图 -->
        <div class="trend-graph">
          <div class="graph-header">
            <h4>分数趋势</h4>
            <span class="average">平均分: {{ averageScore }}</span>
          </div>
          <div class="graph-line">
            <div
              v-for="(point, index) in trendData"
              :key="index"
              class="data-point"
              :style="{
                height: `${(point.score / 100) * 60}px`,
                backgroundColor: getScoreColor(point.score)
              }"
              :title="`${point.period}: ${point.score}分`"
            >
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 洞察和推荐 -->
    <div class="insights-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="insights-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon" color="#e6a23c">
                  <DataAnalysis />
                </el-icon>
                <span class="header-title">学习洞察</span>
              </div>
            </template>
            <div class="insights-content">
              <div v-for="insight in insights" :key="insight.type" class="insight-item">
                <div class="insight-icon">
                  <el-icon :size="20" :color="getInsightColor(insight.type)">
                    <component :is="insight.icon" />
                  </el-icon>
                </div>
                <div class="insight-text">
                  <h4>{{ insight.title }}</h4>
                  <p>{{ insight.content }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="recommendations-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon" color="#67c23a">
                  <Compass />
                </el-icon>
                <span class="header-title">个性化推荐</span>
              </div>
            </template>
            <div class="recommendations-content">
              <div
                v-for="rec in recommendations"
                :key="rec.type"
                class="recommendation-item"
                :class="`priority-${rec.priority}`"
                @click="handleRecommendationClick(rec)"
              >
                <div class="rec-header">
                  <span class="rec-title">{{ rec.title }}</span>
                  <el-tag :type="getPriorityType(rec.priority)" size="small">
                    {{ getPriorityLabel(rec.priority) }}
                  </el-tag>
                </div>
                <p class="rec-content">{{ rec.content }}</p>
                <el-button type="text" size="small" class="rec-action">
                  立即行动 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 成就系统 -->
    <el-card class="achievements-card">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon" color="#f56c6c">
            <Trophy />
          </el-icon>
          <span class="header-title">成就系统</span>
          <el-button type="text" size="small" @click="showAllAchievements">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>

      <div class="achievements-grid">
        <div
          v-for="achievement in achievements"
          :key="achievement.id"
          class="achievement-item"
          :class="{ 'unlocked': achievement.unlocked }"
        >
          <div class="achievement-icon">
            <span class="icon-text">{{ achievement.title.split(' ')[0] }}</span>
          </div>
          <div class="achievement-info">
            <h4 class="achievement-name">{{ achievement.title }}</h4>
            <p class="achievement-desc">{{ achievement.description }}</p>
            <div class="achievement-meta">
              <el-tag
                :type="getTierType(achievement.tier)"
                size="small"
              >
                {{ getTierLabel(achievement.tier) }}
              </el-tag>
              <span v-if="achievement.unlocked" class="unlock-date">
                {{ formatDate(achievement.unlockedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatisticsStore } from '@/stores/statistics'
import { ElMessage } from 'element-plus'
import {
  TrendCharts, DataAnalysis, Compass, Trophy, ArrowRight,
  CaretTop, CaretBottom, Minus, Clock, VideoCamera, Star
} from '@element-plus/icons-vue'

const iconRegistry = {
  TrendCharts,
  DataAnalysis,
  Compass,
  Trophy,
  ArrowRight,
  CaretTop,
  CaretBottom,
  Minus,
  Clock,
  VideoCamera,
  Star
}

const resolveIcon = (iconName, fallback = TrendCharts) => {
  if (!iconName) return fallback
  if (typeof iconName === 'string') {
    return iconRegistry[iconName] || fallback
  }
  return iconName
}


const router = useRouter()
const statisticsStore = useStatisticsStore()

// 响应式数据
const loading = ref(false)
const selectedTimeRange = ref('monthly')

// 从store获取数据
const { userStats, achievements, recommendations, timeSeriesData } = statisticsStore

// 计算属性
const trendData = computed(() => {
  return timeSeriesData?.[selectedTimeRange.value] || []
})

const averageScore = computed(() => {
  if (!trendData.value.length) return '0.0'
  const total = trendData.value.reduce((sum, item) => sum + item.score, 0)
  return (total / trendData.value.length).toFixed(1)
})

const trendMetrics = computed(() => {
  const current = trendData.value[trendData.value.length - 1]
  const previous = trendData.value[trendData.value.length - 2]
  const normalize = (items, fallbackIcon = VideoCamera) => items.map((item) => ({
    ...item,
    icon: resolveIcon(item.icon, fallbackIcon)
  }))

  if (!current || !previous) {
    return normalize([
      { key: 'interviews', label: '面试次数', value: userStats?.summary?.interviewCount || 0, change: '0', trend: 'stable', icon: 'VideoCamera', color: '#409eff' },
      { key: 'score', label: '平均分数', value: (userStats?.summary?.averageScore || 0).toFixed(1), change: '0', trend: 'stable', icon: 'Star', color: '#e6a23c' },
      { key: 'time', label: '学习时长', value: formatTime(userStats?.summary?.totalPracticeTime || 0), change: '0', trend: 'stable', icon: 'Clock', color: '#67c23a' }
    ])
  }

  const interviewChange = current.interviews - previous.interviews
  const scoreChange = (current.score - previous.score).toFixed(1)
  const timeChange = current.totalTime - previous.totalTime

  return normalize([
    {
      key: 'interviews',
      label: '面试次数',
      value: current.interviews,
      change: interviewChange > 0 ? `+${interviewChange}` : `${interviewChange}`,
      trend: interviewChange > 0 ? 'up' : interviewChange < 0 ? 'down' : 'stable',
      icon: 'VideoCamera',
      color: '#409eff'
    },
    {
      key: 'score',
      label: '平均分数',
      value: current.score.toFixed(1),
      change: scoreChange > 0 ? `+${scoreChange}` : `${scoreChange}`,
      trend: scoreChange > 0 ? 'up' : scoreChange < 0 ? 'down' : 'stable',
      icon: 'Star',
      color: '#e6a23c'
    },
    {
      key: 'time',
      label: '学习时长',
      value: formatTime(current.totalTime),
      change: timeChange > 0 ? `+${formatTime(timeChange)}` : `${formatTime(timeChange)}`,
      trend: timeChange > 0 ? 'up' : timeChange < 0 ? 'down' : 'stable',
      icon: 'Clock',
      color: '#67c23a'
    }
  ])
})

const insights = computed(() => {
  const list = userStats?.insights || [
    {
      type: 'trend',
      title: '学习进步趋势',
      content: '坚持练习已见成效，继续保持当前学习节奏',
      icon: 'TrendCharts'
    }
  ]

  return list.map((item) => ({
    ...item,
    icon: resolveIcon(item.icon, DataAnalysis)
  }))
})

// 方法
const handleTimeRangeChange = async () => {
  loading.value = true
  try {
    await statisticsStore.fetchUserTrends(selectedTimeRange.value)
  } catch (error) {
    ElMessage.error('获取趋势数据失败')
  } finally {
    loading.value = false
  }
}

const handleRecommendationClick = (recommendation) => {
  if (recommendation.actionUrl) {
    router.push(recommendation.actionUrl)
  } else {
    ElMessage.info('功能正在开发中...')
  }
}

const showAllAchievements = () => {
  router.push('/achievements')
}

// 工具函数
const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '0分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

const getScoreColor = (score) => {
  if (score >= 90) return '#67c23a'
  if (score >= 75) return '#e6a23c'
  if (score >= 60) return '#f56c6c'
  return '#909399'
}

const getInsightColor = (type) => {
  const colors = {
    trend: '#409eff',
    strength: '#67c23a',
    improvement: '#e6a23c',
    warning: '#f56c6c'
  }
  return colors[type] || '#909399'
}

const getPriorityType = (priority) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const labels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return labels[priority] || '普通'
}

const getTierType = (tier) => {
  const types = {
    platinum: 'danger',
    gold: 'warning',
    silver: 'info',
    bronze: 'success'
  }
  return types[tier] || 'info'
}

const getTierLabel = (tier) => {
  const labels = {
    platinum: '白金',
    gold: '黄金',
    silver: '白银',
    bronze: '青铜'
  }
  return labels[tier] || '普通'
}

// 初始化
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      statisticsStore.fetchUserStatistics({ detail: true }),
      statisticsStore.fetchUserTrends(selectedTimeRange.value)
    ])
  } catch (error) {
    console.error('Failed to load trend analysis data:', error)
    ElMessage.error('趋势分析数据加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.trend-analysis {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
}

.header-title {
  font-weight: 600;
  color: #303133;
}

/* 趋势图表卡片 */
.trend-chart-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.trend-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-item {
  padding: 16px;
  background: #f8f9ff;
  border-radius: 8px;
  border-left: 3px solid var(--el-color-primary);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 14px;
  color: #666;
}

.metric-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.trend-up {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.trend-down {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

.trend-stable {
  color: #909399;
  background: rgba(144, 147, 153, 0.1);
}

/* 趋势图 */
.trend-graph {
  padding: 20px;
  background: #fafbfc;
  border-radius: 8px;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.graph-header h4 {
  margin: 0;
  color: #303133;
}

.average {
  font-size: 14px;
  color: #666;
}

.graph-line {
  display: flex;
  align-items: end;
  gap: 8px;
  height: 80px;
}

.data-point {
  flex: 1;
  min-width: 20px;
  border-radius: 2px 2px 0 0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.data-point:hover {
  opacity: 0.8;
}

/* 洞察和推荐区域 */
.insights-section {
  margin: 20px 0;
}

.insights-card,
.recommendations-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 300px;
}

.insights-content,
.recommendations-content {
  height: 240px;
  overflow-y: auto;
}

.insight-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.insight-item:last-child {
  border-bottom: none;
}

.insight-icon {
  flex-shrink: 0;
}

.insight-text h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.insight-text p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.recommendation-item {
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 3px solid #e4e7ed;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recommendation-item:hover {
  background: #f0f9ff;
  border-left-color: #409eff;
}

.priority-high {
  border-left-color: #f56c6c;
}

.priority-medium {
  border-left-color: #e6a23c;
}

.priority-low {
  border-left-color: #909399;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rec-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.rec-content {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.rec-action {
  font-size: 12px;
  padding: 0;
}

/* 成就系统 */
.achievements-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.achievement-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.achievement-item.unlocked {
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.achievement-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  flex-shrink: 0;
}

.achievement-item.unlocked .achievement-icon {
  background: linear-gradient(135deg, #409eff, #67c23a);
}

.icon-text {
  font-size: 16px;
  font-weight: 600;
  color: #666;
}

.achievement-item.unlocked .icon-text {
  color: white;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.achievement-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.achievement-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unlock-date {
  font-size: 11px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .insights-section .el-col {
    margin-bottom: 20px;
  }

  .trend-metrics {
    grid-template-columns: 1fr;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>
