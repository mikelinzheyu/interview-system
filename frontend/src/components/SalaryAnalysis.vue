<template>
  <div class="salary-analysis">
    <!-- Header -->
    <div class="analysis-header">
      <h2 class="title">💰 薪资统计与分析</h2>
      <p class="subtitle">多维度薪资数据对比和趋势分析</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载薪资数据...</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="hasSalaryData" class="analysis-content">
      <!-- Overview Cards -->
      <section class="overview-section">
        <h3 class="section-title">📊 薪资概览</h3>
        <div class="overview-grid">
          <div class="overview-card">
            <div class="card-label">平均薪资</div>
            <div class="card-value">¥{{ averageSalary.toLocaleString() }}</div>
            <div class="card-unit">/月</div>
            <div class="card-desc">全国平均水平</div>
          </div>

          <div class="overview-card">
            <div class="card-label">中位数薪资</div>
            <div class="card-value">¥{{ medianSalary.toLocaleString() }}</div>
            <div class="card-unit">/月</div>
            <div class="card-desc">50%以上人员薪资</div>
          </div>

          <div class="overview-card">
            <div class="card-label">最低薪资</div>
            <div class="card-value">¥{{ salaryData.overall?.minSalary?.toLocaleString() }}</div>
            <div class="card-unit">/月</div>
            <div class="card-desc">入职起薪参考</div>
          </div>

          <div class="overview-card">
            <div class="card-label">最高薪资</div>
            <div class="card-value">¥{{ salaryData.overall?.maxSalary?.toLocaleString() }}</div>
            <div class="card-unit">/月</div>
            <div class="card-desc">行业高端水平</div>
          </div>
        </div>
      </section>

      <!-- Salary Distribution -->
      <section class="distribution-section">
        <h3 class="section-title">📈 薪资分布区间</h3>
        <div class="distribution-chart">
          <div v-for="(range, index) in salaryData.salaryRange" :key="index" class="range-item">
            <div class="range-label">{{ range.range }}</div>
            <div class="range-bar">
              <div class="range-fill" :style="{ width: `${range.percent}%` }"></div>
            </div>
            <div class="range-stats">
              <span class="percent">{{ range.percent }}%</span>
              <span class="count">({{ range.count }}人)</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Industry Comparison -->
      <section class="industry-section">
        <h3 class="section-title">🏢 按行业薪资对比</h3>
        <div class="industry-cards">
          <div v-for="(industry, index) in salaryData.byIndustry" :key="index" class="industry-card">
            <div class="industry-name">{{ industry.industry }}</div>
            <div class="industry-salary">
              <span class="avg">¥{{ industry.avg.toLocaleString() }}</span>
              <span class="period">/月</span>
            </div>
            <div class="industry-bar">
              <div class="bar-fill" :style="{ width: `${(industry.avg / 32000) * 100}%` }"></div>
            </div>
            <div class="industry-stats">
              <span class="stat">招聘: {{ industry.count }}</span>
              <span class="stat" :class="industry.growth > 0 ? 'positive' : 'negative'">
                {{ industry.growth > 0 ? '+' : '' }}{{ industry.growth }}%
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- City Comparison -->
      <section class="city-section">
        <h3 class="section-title">🌆 城市薪资对比</h3>
        <div class="city-comparison">
          <div v-for="(city, index) in salaryData.byCity" :key="index" class="city-row">
            <div class="city-rank">{{ city.rank }}</div>
            <div class="city-info">
              <h4 class="city-name">{{ city.city }}</h4>
              <p class="city-details">
                平均: ¥{{ city.avg.toLocaleString() }} |
                中位: ¥{{ city.median.toLocaleString() }} |
                招聘: {{ city.count }}
              </p>
            </div>
            <div class="city-salary">
              <div class="salary-gross">
                <span class="label">总薪资</span>
                <span class="value">¥{{ city.avg.toLocaleString() }}</span>
              </div>
              <div class="salary-cost">
                <span class="label">生活成本</span>
                <span class="value">¥{{ city.costOfLiving.toLocaleString() }}</span>
              </div>
              <div class="salary-net">
                <span class="label">实际薪资</span>
                <span class="value">¥{{ city.netSalary.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Experience Growth -->
      <section class="experience-section">
        <h3 class="section-title">📈 经验薪资增长曲线</h3>
        <div class="experience-grid">
          <div v-for="(level, index) in salaryData.bySeniority" :key="index" class="experience-item">
            <div class="level-badge">{{ level.level }}</div>
            <div class="level-info">
              <p class="description">{{ level.description }}</p>
              <div class="salary-bar">
                <div class="salary-fill" :style="{ width: `${(level.avgSalary / 45000) * 100}%` }"></div>
              </div>
            </div>
            <div class="level-salary">¥{{ level.avgSalary.toLocaleString() }}</div>
          </div>
        </div>
      </section>

      <!-- Growth Trend -->
      <section class="growth-section">
        <h3 class="section-title">📊 职业成长薪资预测</h3>
        <div class="growth-chart">
          <div class="chart-header">
            <div class="header-item">年份</div>
            <div class="header-item">平均薪资</div>
            <div class="header-item">增长趋势</div>
          </div>
          <div v-for="(point, index) in salaryData.growthCurve" :key="index" class="growth-row">
            <div class="year">{{ point.year }}年</div>
            <div class="salary">¥{{ point.avg.toLocaleString() }}</div>
            <div class="trend">
              <div class="trend-bar">
                <div class="trend-min" :style="{ width: `${(point.percentile25 / point.avg) * 100}%` }"></div>
                <div class="trend-max" :style="{ width: `${(point.percentile75 / point.avg) * 100}%` }"></div>
              </div>
              <span class="trend-range">¥{{ point.percentile25 }}-{{ point.percentile75 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Degree Comparison -->
      <section class="degree-section">
        <h3 class="section-title">🎓 按学位薪资对比</h3>
        <div class="degree-cards">
          <div v-for="(deg, index) in salaryData.byDegree" :key="index" class="degree-card">
            <div class="degree-name">{{ deg.degree }}</div>
            <div class="degree-salary">¥{{ deg.avgSalary.toLocaleString() }}</div>
            <div class="degree-bar">
              <div class="bar-fill" :style="{ width: `${(deg.avgSalary / 32000) * 100}%` }"></div>
            </div>
            <div class="degree-stats">
              <span>占比: {{ deg.ratio }}%</span>
              <span>人数: {{ deg.count }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Comparison with Others -->
      <section class="comparison-section">
        <h3 class="section-title">🔄 与其他专业对比</h3>
        <div class="comparison-grid">
          <div class="comparison-item">
            <span class="compare-label">vs 全专业均值</span>
            <span class="compare-value positive">{{ salaryData.comparison?.vsAllMajors }}x</span>
            <span class="compare-desc">高20%</span>
          </div>
          <div class="comparison-item">
            <span class="compare-label">vs 工学专业</span>
            <span class="compare-value positive">{{ salaryData.comparison?.vsEngineering }}x</span>
            <span class="compare-desc">高15%</span>
          </div>
          <div class="comparison-item">
            <span class="compare-label">vs 全国均值</span>
            <span class="compare-value positive">{{ salaryData.comparison?.vsChina }}x</span>
            <span class="compare-desc">高80%</span>
          </div>
          <div class="comparison-item">
            <span class="compare-label">专业排名</span>
            <span class="compare-value">{{ salaryData.comparison?.ranking }}</span>
            <span class="compare-desc">竞争力强</span>
          </div>
        </div>
      </section>

      <!-- Insights -->
      <section class="insights-section">
        <h3 class="section-title">💡 薪资洞察</h3>
        <div class="insights-grid">
          <div class="insight-card">
            <h4>🔝 薪资最高城市</h4>
            <p>{{ topCities[0]?.city }}</p>
            <span class="value">¥{{ topCities[0]?.avg.toLocaleString() }}/月</span>
          </div>

          <div class="insight-card">
            <h4>💼 薪资最高行业</h4>
            <p>{{ topIndustries[0]?.industry }}</p>
            <span class="value">¥{{ topIndustries[0]?.avg.toLocaleString() }}/月</span>
          </div>

          <div class="insight-card">
            <h4>📈 增长最快行业</h4>
            <p v-if="topIndustries[0]">{{ topIndustries[0].industry }}</p>
            <span class="value positive">+8.5% YoY</span>
          </div>

          <div class="insight-card">
            <h4>🎓 学位薪资差</h4>
            <p>硕士相比本科</p>
            <span class="value positive">+27%</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p class="empty-icon">📭</p>
      <p class="empty-text">暂无薪资数据，请先选择专业</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSalaryStore } from '@/stores/salary'

const salaryStore = useSalaryStore()

const salaryData = computed(() => salaryStore.salaryData)
const isLoading = computed(() => salaryStore.isLoading)
const hasSalaryData = computed(() => salaryStore.hasSalaryData)
const averageSalary = computed(() => salaryStore.averageSalary)
const medianSalary = computed(() => salaryStore.medianSalary)
const topIndustries = computed(() => salaryStore.topIndustries)
const topCities = computed(() => salaryStore.topCities)
</script>

<style scoped>
.salary-analysis {
  padding: 2rem 0;
}

.analysis-header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: slideDown 0.5s ease-out;
}

.title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.subtitle {
  font-size: 1rem;
  color: #7f8c8d;
  margin: 0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #bdc3c7;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Analysis Content */
.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.section-title {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
  padding-bottom: 0.75rem;
  border-bottom: 3px solid #27ae60;
}

/* Overview Cards */
.overview-section {
  animation: slideUp 0.5s ease-out;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.overview-card:hover {
  border-color: #27ae60;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.15);
  transform: translateY(-4px);
}

.card-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 2rem;
  color: #27ae60;
  font-weight: 700;
}

.card-unit {
  font-size: 0.85rem;
  color: #95a5a6;
}

.card-desc {
  font-size: 0.8rem;
  color: #bdc3c7;
  margin-top: 0.5rem;
}

/* Salary Distribution */
.distribution-section {
  animation: slideUp 0.5s ease-out 0.1s both;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.range-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.range-label {
  min-width: 80px;
  font-weight: 600;
  color: #2c3e50;
}

.range-bar {
  flex: 1;
  height: 24px;
  background: #ecf0f1;
  border-radius: 12px;
  overflow: hidden;
}

.range-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60 0%, #229954 100%);
  transition: width 0.5s ease;
}

.range-stats {
  min-width: 120px;
  text-align: right;
}

.percent {
  font-weight: 700;
  color: #27ae60;
  font-size: 0.95rem;
}

.count {
  color: #7f8c8d;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

/* Industry Comparison */
.industry-section {
  animation: slideUp 0.5s ease-out 0.2s both;
}

.industry-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.industry-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.industry-card:hover {
  border-color: #f39c12;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.15);
}

.industry-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}

.industry-salary {
  font-size: 1.8rem;
  color: #f39c12;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.industry-salary .period {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.industry-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%);
  transition: width 0.5s ease;
}

.industry-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #7f8c8d;
}

.stat.positive {
  color: #27ae60;
  font-weight: 600;
}

.stat.negative {
  color: #e74c3c;
  font-weight: 600;
}

/* City Comparison */
.city-section {
  animation: slideUp 0.5s ease-out 0.3s both;
}

.city-comparison {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.city-row {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  align-items: center;
}

.city-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
}

.city-info {
  flex: 1;
}

.city-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.city-details {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
}

.city-salary {
  display: flex;
  gap: 1.5rem;
}

.salary-gross,
.salary-cost,
.salary-net {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.label {
  font-size: 0.75rem;
  color: #95a5a6;
  font-weight: 600;
  text-transform: uppercase;
}

.value {
  font-size: 1.1rem;
  color: #3498db;
  font-weight: 700;
  margin-top: 0.25rem;
}

.salary-net .value {
  color: #27ae60;
}

/* Experience Section */
.experience-section {
  animation: slideUp 0.5s ease-out 0.4s both;
}

.experience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.experience-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.level-badge {
  display: inline-block;
  background: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.description {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0 0 0.75rem 0;
}

.salary-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.salary-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  transition: width 0.5s ease;
}

.level-salary {
  font-size: 1.5rem;
  color: #3498db;
  font-weight: 700;
  text-align: right;
}

/* Growth Section */
.growth-section {
  animation: slideUp 0.5s ease-out 0.5s both;
}

.growth-chart {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.chart-header {
  display: grid;
  grid-template-columns: 100px 150px 1fr;
  gap: 1rem;
  font-weight: 600;
  color: #2c3e50;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
  margin-bottom: 1rem;
}

.header-item {
  text-align: center;
}

.growth-row {
  display: grid;
  grid-template-columns: 100px 150px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #ecf0f1;
}

.year {
  font-weight: 600;
  color: #2c3e50;
}

.salary {
  text-align: right;
  color: #27ae60;
  font-weight: 700;
}

.trend {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.trend-bar {
  flex: 1;
  height: 20px;
  background: #ecf0f1;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.trend-min {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(52, 152, 219, 0.3);
}

.trend-max {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  background: rgba(52, 152, 219, 0.6);
}

.trend-range {
  font-size: 0.8rem;
  color: #7f8c8d;
  min-width: 120px;
}

/* Degree Section */
.degree-section {
  animation: slideUp 0.5s ease-out 0.6s both;
}

.degree-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.degree-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.degree-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}

.degree-salary {
  font-size: 1.8rem;
  color: #9b59b6;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.degree-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.degree-stats {
  display: flex;
  justify-content: space-around;
  font-size: 0.85rem;
  color: #7f8c8d;
}

/* Comparison Section */
.comparison-section {
  animation: slideUp 0.5s ease-out 0.7s both;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.comparison-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.compare-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.compare-value {
  font-size: 2rem;
  font-weight: 700;
  color: #3498db;
  margin-bottom: 0.5rem;
}

.compare-value.positive {
  color: #27ae60;
}

.compare-desc {
  font-size: 0.8rem;
  color: #95a5a6;
}

/* Insights Section */
.insights-section {
  animation: slideUp 0.5s ease-out 0.8s both;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.insight-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #3498db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.insight-card h4 {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.insight-card p {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0 0 0.75rem 0;
}

.insight-card .value {
  font-size: 1.5rem;
  color: #3498db;
  font-weight: 700;
}

.insight-card .value.positive {
  color: #27ae60;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #bdc3c7;
}

.empty-icon {
  font-size: 3rem;
  margin: 0;
}

.empty-text {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 1rem 0 0 0;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 1.5rem;
  }

  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .city-row {
    flex-direction: column;
    gap: 1rem;
  }

  .city-salary {
    width: 100%;
    justify-content: space-around;
  }

  .chart-header,
  .growth-row {
    grid-template-columns: 60px 100px 1fr;
  }

  .degree-cards {
    grid-template-columns: 1fr;
  }
}
</style>
