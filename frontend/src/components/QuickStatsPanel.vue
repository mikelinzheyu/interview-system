<template>
  <div class="quick-stats-panel">
    <h2 class="panel-title">📈 数据统计面板</h2>

    <div class="stats-grid">
      <!-- Recommendation Stats -->
      <div class="stat-card">
        <div class="stat-header">
          <h3 class="stat-name">🎯 推荐统计</h3>
        </div>
        <div class="stat-content">
          <div class="stat-item">
            <span class="stat-label">推荐专业数</span>
            <span class="stat-value">{{ recommendationStore.recommendations.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均匹配度</span>
            <span class="stat-value">{{ averageMatchScore }}%</span>
          </div>
          <div v-if="recommendationStore.topRecommendation" class="stat-item">
            <span class="stat-label">最佳推荐</span>
            <span class="stat-value secondary">{{ recommendationStore.topRecommendation.name }}</span>
          </div>
        </div>
      </div>

      <!-- Market Stats -->
      <div class="stat-card">
        <div class="stat-header">
          <h3 class="stat-name">📊 就业统计</h3>
        </div>
        <div class="stat-content">
          <div class="stat-item">
            <span class="stat-label">招聘热度</span>
            <span class="stat-value">{{ jobMarketStore.jobMarketData.recruitmentHot || '-' }}/10</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">职位数量</span>
            <span class="stat-value">{{ formatNumber(jobMarketStore.jobMarketData.totalOpenings) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">竞争指数</span>
            <span class="stat-value">{{ jobMarketStore.jobMarketData.trends?.competitiveIndex || '-' }}/10</span>
          </div>
        </div>
      </div>

      <!-- User Profile Stats -->
      <div class="stat-card">
        <div class="stat-header">
          <h3 class="stat-name">👤 用户档案</h3>
        </div>
        <div class="stat-content">
          <div class="stat-item">
            <span class="stat-label">评估状态</span>
            <span class="stat-value" :class="hasRecommendations ? 'success' : 'pending'">
              {{ hasRecommendations ? '已完成' : '待评估' }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">学科兴趣</span>
            <span class="stat-value">{{ userDisciplineCount }}/13</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">职业目标</span>
            <span class="stat-value">{{ userCareerGoals }} 个</span>
          </div>
        </div>
      </div>

      <!-- Insights -->
      <div class="stat-card">
        <div class="stat-header">
          <h3 class="stat-name">💡 数据洞察</h3>
        </div>
        <div class="stat-content insights-content">
          <div class="insight-item">
            <span class="insight-icon">🎓</span>
            <p class="insight-text">您的学科兴趣覆盖{{ userDisciplineCount }}个领域，兴趣广泛</p>
          </div>
          <div class="insight-item">
            <span class="insight-icon">💼</span>
            <p class="insight-text">{{ jobMarketStore.jobMarketData.recruitmentHot > 8 ? '行业招聘热度高' : '行业发展稳定' }}</p>
          </div>
          <div class="insight-item">
            <span class="insight-icon">📈</span>
            <p class="insight-text">推荐专业前景{{ trendOutlook }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <h3 class="section-title">📊 可视化分析</h3>

      <div class="charts-grid">
        <!-- Score Distribution -->
        <div class="chart-card">
          <h4 class="chart-title">推荐分数分布</h4>
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div
                v-for="(rec, index) in recommendationStore.recommendations.slice(0, 5)"
                :key="index"
                class="bar-item"
              >
                <div class="bar-label">{{ rec.name.substring(0, 8) }}</div>
                <div class="bar-container">
                  <div
                    class="bar-fill"
                    :style="{ width: `${rec.matchScore * 100}%` }"
                  ></div>
                </div>
                <div class="bar-value">{{ (rec.matchScore * 100).toFixed(0) }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Industry Distribution -->
        <div class="chart-card">
          <h4 class="chart-title">行业分布</h4>
          <div class="chart-placeholder">
            <div class="pie-chart-placeholder">
              <div v-for="(industry, index) in industryTop3" :key="index" class="pie-segment">
                <span class="segment-color" :style="{ background: getSegmentColor(index) }"></span>
                <span class="segment-label">{{ industry.industry }} ({{ industry.ratio }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Salary Trend -->
        <div class="chart-card">
          <h4 class="chart-title">薪资范围</h4>
          <div class="chart-placeholder">
            <div class="salary-range">
              <div class="salary-item">
                <span class="salary-label">最低</span>
                <span class="salary-value">¥{{ minSalary }}</span>
              </div>
              <div class="salary-item">
                <span class="salary-label">平均</span>
                <span class="salary-value highlight">¥{{ averageSalary }}</span>
              </div>
              <div class="salary-item">
                <span class="salary-label">最高</span>
                <span class="salary-value">¥{{ maxSalary }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Growth Trend -->
        <div class="chart-card">
          <h4 class="chart-title">市场增长趋势</h4>
          <div class="chart-placeholder">
            <div class="trend-indicators">
              <div class="trend-item">
                <span class="trend-period">6个月</span>
                <span class="trend-value positive">+{{ jobMarketStore.jobMarketData.trends?.sixMonthGrowth }}%</span>
              </div>
              <div class="trend-item">
                <span class="trend-period">1年</span>
                <span class="trend-value positive">+{{ jobMarketStore.jobMarketData.trends?.yearGrowth }}%</span>
              </div>
              <div class="trend-item">
                <span class="trend-period">预测2025</span>
                <span class="trend-value">{{ formatNumber(jobMarketStore.jobMarketData.trends?.forecast2025 || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Section -->
    <div class="export-section">
      <h3 class="section-title">💾 数据导出</h3>
      <div class="export-buttons">
        <button class="export-btn" @click="exportAsJSON">
          📄 导出为 JSON
        </button>
        <button class="export-btn" @click="exportAsCSV">
          📊 导出为 CSV
        </button>
        <button class="export-btn" @click="exportAsPDF">
          📋 导出为 PDF
        </button>
        <button class="export-btn" @click="printStats">
          🖨️ 打印报告
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRecommendationStore } from '@/stores/recommendations'
import { useJobMarketStore } from '@/stores/jobMarket'

const recommendationStore = useRecommendationStore()
const jobMarketStore = useJobMarketStore()

// Computed Properties
const hasRecommendations = computed(() => recommendationStore.hasRecommendations)

const averageMatchScore = computed(() => {
  if (recommendationStore.recommendations.length === 0) return 0
  const sum = recommendationStore.recommendations.reduce((acc, rec) => acc + rec.matchScore, 0)
  return Math.round((sum / recommendationStore.recommendations.length) * 100)
})

const userDisciplineCount = computed(() => {
  const disciplines = recommendationStore.assessmentForm.disciplines
  return Object.values(disciplines).filter(score => score > 0).length
})

const userCareerGoals = computed(() => {
  const goals = recommendationStore.assessmentForm.careerGoals
  return Object.values(goals).filter(selected => selected).length
})

const trendOutlook = computed(() => {
  const growth = jobMarketStore.jobMarketData.trends?.yearGrowth || 0
  if (growth > 20) return '极佳'
  if (growth > 10) return '良好'
  if (growth > 0) return '稳定'
  return '待观察'
})

const industryTop3 = computed(() => {
  const industries = jobMarketStore.jobMarketData.industryDistribution || []
  return industries.slice(0, 3)
})

const minSalary = computed(() => {
  const cities = jobMarketStore.jobMarketData.cityDistribution || []
  if (cities.length === 0) return '0'
  const min = Math.min(...cities.map(c => c.salary))
  return (min / 1000).toFixed(0) + 'K'
})

const averageSalary = computed(() => {
  const cities = jobMarketStore.jobMarketData.cityDistribution || []
  if (cities.length === 0) return '0'
  const avg = cities.reduce((sum, c) => sum + c.salary, 0) / cities.length
  return (avg / 1000).toFixed(1) + 'K'
})

const maxSalary = computed(() => {
  const cities = jobMarketStore.jobMarketData.cityDistribution || []
  if (cities.length === 0) return '0'
  const max = Math.max(...cities.map(c => c.salary))
  return (max / 1000).toFixed(0) + 'K'
})

// Methods
function formatNumber(num) {
  if (!num) return '0'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num.toString()
}

function getSegmentColor(index) {
  const colors = ['#3498db', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6']
  return colors[index % colors.length]
}

function exportAsJSON() {
  const data = {
    recommendation: recommendationStore.recommendations,
    jobMarket: jobMarketStore.jobMarketData,
    timestamp: new Date().toISOString()
  }
  downloadFile(JSON.stringify(data, null, 2), 'career-data.json')
}

function exportAsCSV() {
  const headers = ['专业名称', '匹配度', '学科', '行业', '薪资']
  const rows = recommendationStore.recommendations.map(rec => [
    rec.name,
    (rec.matchScore * 100).toFixed(0) + '%',
    rec.disciplineName || '',
    jobMarketStore.jobMarketData.industryDistribution?.[0]?.industry || '',
    '¥' + (jobMarketStore.jobMarketData.cityDistribution?.[0]?.salary || 0)
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  downloadFile(csv, 'career-data.csv')
}

function exportAsPDF() {
  alert('PDF导出功能将在下一版本中实现。目前您可以使用浏览器的打印功能另存为PDF。')
}

function printStats() {
  window.print()
}

function downloadFile(content, filename) {
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}
</script>

<style scoped>
.quick-stats-panel {
  padding: 2rem 0;
}

.panel-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 2rem 0;
  font-weight: 700;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
  transform: translateY(-4px);
}

.stat-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.stat-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  color: #3498db;
  font-weight: 700;
}

.stat-value.secondary {
  font-size: 1rem;
  color: #34495e;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-value.success {
  color: #27ae60;
}

.stat-value.pending {
  color: #f39c12;
}

/* Insights */
.insights-content {
  gap: 0.75rem;
}

.insight-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.insight-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.insight-text {
  font-size: 0.85rem;
  color: #34495e;
  margin: 0;
  line-height: 1.4;
}

/* Charts Section */
.charts-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-title {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.chart-placeholder {
  min-height: 250px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

/* Bar Chart */
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bar-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  min-width: 80px;
  text-align: right;
  font-weight: 500;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: #ecf0f1;
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  transition: width 0.5s ease;
}

.bar-value {
  font-size: 0.85rem;
  color: #34495e;
  min-width: 40px;
  text-align: right;
  font-weight: 600;
}

/* Pie Chart */
.pie-chart-placeholder {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
}

.pie-segment {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.segment-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.segment-label {
  font-size: 0.9rem;
  color: #34495e;
}

/* Salary Range */
.salary-range {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.salary-item {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
}

.salary-label {
  display: block;
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  font-weight: 600;
}

.salary-value {
  display: block;
  font-size: 1.3rem;
  color: #3498db;
  font-weight: 700;
}

.salary-value.highlight {
  color: #27ae60;
  font-size: 1.5rem;
}

/* Trend Indicators */
.trend-indicators {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.trend-item {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
}

.trend-period {
  display: block;
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.trend-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  color: #34495e;
}

.trend-value.positive {
  color: #27ae60;
  font-size: 1.5rem;
}

/* Export Section */
.export-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.export-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.export-btn {
  padding: 1rem;
  border: 2px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background: #3498db;
  color: white;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .panel-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .salary-range,
  .trend-indicators {
    grid-template-columns: 1fr;
  }

  .export-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media print {
  .export-btn {
    display: none;
  }
}
</style>
