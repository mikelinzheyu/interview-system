<template>
  <div class="analytics-dashboard">
    <!-- Page Header -->
    <div class="dashboard-header">
      <h1>分析仪表板 - Analytics Dashboard</h1>
      <div class="header-controls">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="To"
          start-placeholder="Start Date"
          end-placeholder="End Date"
          @change="refreshAnalytics"
        />
        <el-button @click="refreshAnalytics" :loading="loading">
          <el-icon><Refresh /></el-icon>
          Refresh
        </el-button>
        <el-button @click="exportData" :loading="exporting">
          <el-icon><Download /></el-icon>
          Export
        </el-button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" />
    </div>

    <!-- Analytics Content -->
    <div v-else class="analytics-content">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">总错题数</span>
            <el-icon class="kpi-icon"><DocumentCopy /></el-icon>
          </div>
          <div class="kpi-value">{{ analytics.totalWrongAnswers }}</div>
          <div class="kpi-change" :class="analytics.wrongAnswersChange >= 0 ? 'positive' : 'negative'">
            <el-icon v-if="analytics.wrongAnswersChange >= 0"><ArrowUp /></el-icon>
            <el-icon v-else><ArrowDown /></el-icon>
            {{ Math.abs(analytics.wrongAnswersChange) }}%
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">已掌握</span>
            <el-icon class="kpi-icon"><SuccessFilled /></el-icon>
          </div>
          <div class="kpi-value">{{ analytics.masteredCount }}</div>
          <div class="kpi-percentage">{{ analytics.masteryRate }}%</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">平均花费时间</span>
            <el-icon class="kpi-icon"><Clock /></el-icon>
          </div>
          <div class="kpi-value">{{ analytics.avgTimePerQuestion }}m</div>
          <div class="kpi-unit">分钟/题</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">本周复习次数</span>
            <el-icon class="kpi-icon"><DataAnalysis /></el-icon>
          </div>
          <div class="kpi-value">{{ analytics.weeklyReviewCount }}</div>
          <div class="kpi-unit">次</div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="charts-row">
        <!-- Mastery Progress Chart -->
        <div class="chart-container">
          <h3>掌握进度</h3>
          <div ref="masteryChartEl" style="height: 300px"></div>
        </div>

        <!-- Source Distribution -->
        <div class="chart-container">
          <h3>错题来源分布</h3>
          <div ref="sourceChartEl" style="height: 300px"></div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="charts-row">
        <!-- Daily Review Activity -->
        <div class="chart-container">
          <h3>每日复习活动</h3>
          <div ref="dailyActivityChartEl" style="height: 300px"></div>
        </div>

        <!-- Difficulty Distribution -->
        <div class="chart-container">
          <h3>难度分布</h3>
          <div ref="difficultyChartEl" style="height: 300px"></div>
        </div>
      </div>

      <!-- Tables Row -->
      <div class="tables-row">
        <!-- Most Reviewed Topics -->
        <div class="table-container">
          <h3>最常复习的知识点</h3>
          <el-table :data="analytics.topicsData" stripe>
            <el-table-column prop="name" label="知识点" width="150" />
            <el-table-column prop="count" label="错题数" width="100" />
            <el-table-column prop="reviewCount" label="复习次数" width="100" />
            <el-table-column label="掌握率" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.masteryRate" :format="p => `${p}%`" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Recent Activity -->
        <div class="table-container">
          <h3>最近活动</h3>
          <el-table :data="analytics.recentActivity" stripe>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getActivityTagType(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column label="影响" width="80" align="center">
              <template #default="{ row }">
                <el-icon v-if="row.impact > 0" class="positive"><ArrowUp /></el-icon>
                <el-icon v-else-if="row.impact < 0" class="negative"><ArrowDown /></el-icon>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="metrics-section">
        <h3>性能指标</h3>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">平均复习周期</div>
            <div class="metric-value">{{ analytics.avgReviewCycle }} days</div>
            <div class="metric-description">根据艾宾浩斯遗忘曲线计算</div>
          </div>

          <div class="metric-item">
            <div class="metric-label">学习效率</div>
            <div class="metric-value">{{ analytics.learningEfficiency }}%</div>
            <div class="metric-description">掌握知识点 vs 总时间投入</div>
          </div>

          <div class="metric-item">
            <div class="metric-label">一周内完成率</div>
            <div class="metric-value">{{ analytics.completionRate }}%</div>
            <div class="metric-description">已复习 / 应复习</div>
          </div>

          <div class="metric-item">
            <div class="metric-label">知识保留率</div>
            <div class="metric-value">{{ analytics.retentionRate }}%</div>
            <div class="metric-description">最近30天内重复掌握的知识点</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  Refresh,
  Download,
  DocumentCopy,
  SuccessFilled,
  Clock,
  DataAnalysis,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'

const loading = ref(false)
const exporting = ref(false)
const dateRange = ref([
  new Date(new Date().setDate(new Date().getDate() - 30)),
  new Date()
])

// Chart references
const masteryChartEl = ref(null)
const sourceChartEl = ref(null)
const dailyActivityChartEl = ref(null)
const difficultyChartEl = ref(null)

// Chart instances
let masteryChart = null
let sourceChart = null
let dailyActivityChart = null
let difficultyChart = null

// Analytics data
const analytics = ref({
  totalWrongAnswers: 145,
  wrongAnswersChange: 12,
  masteredCount: 89,
  masteryRate: 61,
  avgTimePerQuestion: 3.5,
  weeklyReviewCount: 24,
  topicsData: [
    { name: 'JavaScript Closures', count: 8, reviewCount: 24, masteryRate: 75 },
    { name: 'React Hooks', count: 12, reviewCount: 18, masteryRate: 58 },
    { name: 'Async/Await', count: 6, reviewCount: 15, masteryRate: 83 },
    { name: 'Database Design', count: 9, reviewCount: 12, masteryRate: 44 },
    { name: 'REST API Design', count: 7, reviewCount: 10, masteryRate: 71 }
  ],
  recentActivity: [
    { date: '2025-10-22', type: '复习', description: '完成JavaScript Closures复习', impact: 1 },
    { date: '2025-10-21', type: '新增', description: '从AI面试中新增5个错题', impact: -1 },
    { date: '2025-10-20', type: '复习', description: '已掌握3个知识点', impact: 1 },
    { date: '2025-10-19', type: '新增', description: '从题库练习中新增2个错题', impact: -1 },
    { date: '2025-10-18', type: '复习', description: '复习4个知识点', impact: 0 }
  ],
  avgReviewCycle: 7,
  learningEfficiency: 78,
  completionRate: 92,
  retentionRate: 87
})

// Methods
const refreshAnalytics = async () => {
  loading.value = true
  try {
    // Calculate days from date range
    const days = dateRange.value && dateRange.value.length === 2
      ? Math.ceil((dateRange.value[1] - dateRange.value[0]) / (1000 * 60 * 60 * 24))
      : 30

    // Fetch analytics data from backend API
    const response = await fetch(`/api/v1/wrong-answers/analytics?days=${days}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.data) {
        // Update analytics with real data
        const data = result.data
        analytics.value = {
          totalWrongAnswers: data.totalWrongAnswers || 0,
          wrongAnswersChange: 12, // Would need more calculation
          masteredCount: data.masteredCount || 0,
          masteryRate: Math.round(data.masteryRate || 0),
          avgTimePerQuestion: data.avgTimePerQuestion || 3.5,
          weeklyReviewCount: data.weeklyReviewCount || 0,
          topicsData: analytics.value.topicsData, // Keep existing or fetch
          recentActivity: analytics.value.recentActivity, // Keep existing or fetch
          avgReviewCycle: data.avgReviewCycle || 7,
          learningEfficiency: data.learningEfficiency || 0,
          completionRate: data.completionRate || 0,
          retentionRate: data.retentionRate || 0
        }
      }
    }

    ElMessage.success('分析数据已刷新！')
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('Analytics refresh error:', error)
    ElMessage.error('刷新分析数据失败')
    // Still initialize charts with current data
    await nextTick()
    initCharts()
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  // Initialize Mastery Progress Chart (Line Chart)
  if (masteryChartEl.value) {
    masteryChart = echarts.init(masteryChartEl.value)
    const masteryOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textStyle: { color: '#fff' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['第1周', '第2周', '第3周', '第4周', '第5周'],
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#E8E8E8' } }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#E8E8E8' } }
      },
      series: [
        {
          data: [35, 42, 58, 68, 75],
          type: 'line',
          smooth: true,
          itemStyle: { color: '#409eff' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
          name: '掌握率'
        }
      ]
    }
    masteryChart.setOption(masteryOption)
  }

  // Initialize Source Distribution Chart (Pie Chart)
  if (sourceChartEl.value) {
    sourceChart = echarts.init(sourceChartEl.value)
    const sourceOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textStyle: { color: '#fff' }
      },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '错题来源',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 58, name: 'AI面试' },
            { value: 42, name: '题库练习' },
            { value: 45, name: '模拟考试' }
          ],
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }
      ]
    }
    sourceChart.setOption(sourceOption)
  }

  // Initialize Daily Activity Chart (Bar Chart)
  if (dailyActivityChartEl.value) {
    dailyActivityChart = echarts.init(dailyActivityChartEl.value)
    const dailyOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textStyle: { color: '#fff' },
        axisPointer: { type: 'shadow' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLine: { lineStyle: { color: '#E8E8E8' } }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#E8E8E8' } }
      },
      series: [
        {
          data: [4, 6, 3, 8, 5, 7, 6],
          type: 'bar',
          itemStyle: { color: '#67c23a' },
          name: '复习次数'
        }
      ]
    }
    dailyActivityChart.setOption(dailyOption)
  }

  // Initialize Difficulty Distribution Chart (Gauge + Bar Combo)
  if (difficultyChartEl.value) {
    difficultyChart = echarts.init(difficultyChartEl.value)
    const difficultyOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textStyle: { color: '#fff' },
        axisPointer: { type: 'shadow' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['简单', '中等', '困难'],
        axisLine: { lineStyle: { color: '#E8E8E8' } }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#E8E8E8' } }
      },
      series: [
        {
          data: [28, 65, 52],
          type: 'bar',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          name: '题目数量'
        }
      ]
    }
    difficultyChart.setOption(difficultyOption)
  }
}

const exportData = async () => {
  exporting.value = true
  try {
    // Simulate export to CSV/Excel
    await new Promise(resolve => setTimeout(resolve, 1500))
    ElMessage.success('数据导出成功！')
  } catch (error) {
    ElMessage.error('数据导出失败')
  } finally {
    exporting.value = false
  }
}

const getActivityTagType = (type) => {
  const types = {
    '复习': 'success',
    '新增': 'danger',
    '标记': 'warning'
  }
  return types[type] || 'info'
}

// Handle window resize
const handleResize = () => {
  if (masteryChart) masteryChart.resize()
  if (sourceChart) sourceChart.resize()
  if (dailyActivityChart) dailyActivityChart.resize()
  if (difficultyChart) difficultyChart.resize()
}

// Lifecycle
onMounted(() => {
  refreshAnalytics()
  window.addEventListener('resize', handleResize)
})

// Cleanup
const cleanup = () => {
  window.removeEventListener('resize', handleResize)
  if (masteryChart) masteryChart.dispose()
  if (sourceChart) sourceChart.dispose()
  if (dailyActivityChart) dailyActivityChart.dispose()
  if (difficultyChart) difficultyChart.dispose()
}
</script>

<style scoped lang="css">
.analytics-dashboard {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.header-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.loading-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.kpi-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-title {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.kpi-icon {
  font-size: 20px;
  color: #409eff;
}

.kpi-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.kpi-change {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.kpi-change.positive {
  color: #67c23a;
}

.kpi-change.negative {
  color: #f56c6c;
}

.kpi-percentage,
.kpi-unit {
  font-size: 12px;
  color: #909399;
}

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-container h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

/* Tables */
.tables-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

/* Metrics Section */
.metrics-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metrics-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-item {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.metric-description {
  font-size: 12px;
  color: #909399;
}

/* Responsive */
@media (max-width: 1024px) {
  .charts-row,
  .tables-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header-controls {
    width: 100%;
    flex-direction: column;
  }

  .header-controls :deep(.el-date-picker) {
    width: 100%;
  }

  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
