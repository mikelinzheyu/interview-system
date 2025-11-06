<template>
  <div class="job-market-analysis">
    <!-- Header Section -->
    <div class="analysis-header">
      <h2 class="analysis-title">📊 就业市场分析</h2>
      <p class="analysis-subtitle">实时行业就业数据和市场趋势</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载就业数据...</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="hasJobMarketData" class="analysis-content">
      <!-- Key Metrics Cards -->
      <section class="metrics-section">
        <h3 class="section-title">🎯 关键指标</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">💼</div>
            <div class="metric-info">
              <p class="metric-label">招聘热度</p>
              <p class="metric-value">{{ jobMarketData.recruitmentHot }}/10</p>
              <div class="metric-bar">
                <div
                  class="metric-fill"
                  :style="{ width: `${jobMarketData.recruitmentHot * 10}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">📈</div>
            <div class="metric-info">
              <p class="metric-label">职位总数</p>
              <p class="metric-value">{{ (jobMarketData.totalOpenings / 1000).toFixed(0) }}K+</p>
              <p class="metric-desc">全国招聘岗位</p>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">📊</div>
            <div class="metric-info">
              <p class="metric-label">月增长率</p>
              <p class="metric-value">{{ jobMarketData.monthlyGrowth }}%</p>
              <p class="metric-desc">环比增长</p>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">⚔️</div>
            <div class="metric-info">
              <p class="metric-label">竞争指数</p>
              <p class="metric-value">{{ competitiveIndex }}/10</p>
              <p class="metric-desc" :class="competitiveIndex > 7 ? 'high' : 'medium'">
                {{ competitiveIndex > 7 ? '竞争激烈' : '竞争中等' }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Industry Distribution -->
      <section class="distribution-section">
        <h3 class="section-title">🏢 行业分布</h3>
        <div class="industry-grid">
          <div
            v-for="(industry, index) in jobMarketData.industryDistribution"
            :key="index"
            class="industry-card"
          >
            <div class="industry-header">
              <h4 class="industry-name">{{ industry.industry }}</h4>
              <span class="industry-ratio">{{ industry.ratio }}%</span>
            </div>

            <div class="industry-bar">
              <div class="industry-fill" :style="{ width: `${industry.ratio}%` }"></div>
            </div>

            <div v-if="industry.companies && industry.companies.length > 0" class="industry-companies">
              <p class="companies-title">热门公司:</p>
              <div class="companies-list">
                <span v-for="(company, idx) in industry.companies.slice(0, 3)" :key="idx" class="company-tag">
                  {{ company }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- City Comparison -->
      <section class="city-section">
        <h3 class="section-title">🌆 城市对比 (Top 5)</h3>
        <div class="city-comparison">
          <div
            v-for="(city, index) in topCities.slice(0, 5)"
            :key="index"
            class="city-item"
          >
            <div class="city-rank">{{ index + 1 }}</div>
            <div class="city-info">
              <h4 class="city-name">{{ city.city }}</h4>
              <p class="city-stats">
                💼 {{ city.companies }} 家公司 | 📍 {{ city.ratio }}% 占比
              </p>
              <p class="city-salary">
                平均薪资: <strong>¥{{ city.salary.toLocaleString() }}/月</strong>
              </p>
            </div>
            <div class="salary-bar">
              <div
                class="salary-fill"
                :style="{ width: `${(city.salary / 30000) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Job Categories -->
      <section class="categories-section">
        <h3 class="section-title">💻 岗位分布</h3>
        <div class="categories-list">
          <div
            v-for="(job, index) in jobMarketData.jobCategories"
            :key="index"
            class="category-item"
          >
            <div class="category-header">
              <h4 class="category-title">{{ job.category }}</h4>
              <span class="category-count">{{ (job.count / 1000).toFixed(0) }}K+ 岗位</span>
            </div>

            <div class="category-bar">
              <div
                class="category-fill"
                :style="{ width: `${(job.count / jobMarketData.totalOpenings) * 100}%` }"
              ></div>
            </div>

            <div class="category-footer">
              <p class="category-desc">{{ job.description }}</p>
              <p class="category-salary">
                平均薪资: <strong>¥{{ job.avgSalary.toLocaleString() }}/月</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Technologies -->
      <section v-if="getPopularTechnologies().length > 0" class="tech-section">
        <h3 class="section-title">🛠️ 热门技术栈</h3>
        <div class="tech-grid">
          <div
            v-for="(tech, index) in getPopularTechnologies()"
            :key="index"
            class="tech-item"
          >
            <div class="tech-header">
              <span class="tech-name">{{ tech.name }}</span>
              <span class="tech-usage">{{ tech.usage }}%</span>
            </div>
            <div class="tech-bar">
              <div class="tech-fill" :style="{ width: `${tech.usage}%` }"></div>
            </div>
            <p class="tech-trend" :class="getTrendClass(tech.trend)">
              {{ tech.trend === '上升' ? '📈' : tech.trend === '下降' ? '📉' : '➡️' }} {{ tech.trend }}
            </p>
          </div>
        </div>
      </section>

      <!-- Trends Analysis -->
      <section v-if="getTrendAnalysis().sixMonthGrowth" class="trends-section">
        <h3 class="section-title">📊 市场趋势</h3>
        <div class="trends-grid">
          <div class="trend-card">
            <h4 class="trend-title">6个月增长</h4>
            <p class="trend-value">{{ getTrendAnalysis().sixMonthGrowth }}%</p>
            <p class="trend-desc">岗位数量增长</p>
          </div>

          <div class="trend-card">
            <h4 class="trend-title">年增长率</h4>
            <p class="trend-value">{{ getTrendAnalysis().yearGrowth }}%</p>
            <p class="trend-desc">同比增长</p>
          </div>

          <div class="trend-card">
            <h4 class="trend-title">2025年预测</h4>
            <p class="trend-value">{{ (getTrendAnalysis().forecast2025 / 1000).toFixed(0) }}K</p>
            <p class="trend-desc">预计岗位数</p>
          </div>

          <div class="trend-card">
            <h4 class="trend-title">需求前景</h4>
            <p class="trend-value" style="color: #27ae60">{{ getTrendAnalysis().demandOutlook }}</p>
            <p class="trend-desc">{{ getTrendAnalysis().salaryTrend }}</p>
          </div>
        </div>
      </section>

      <!-- Top Companies -->
      <section v-if="getTopCompanies().length > 0" class="companies-section">
        <h3 class="section-title">🏆 热门招聘公司</h3>
        <div class="companies-ranking">
          <div
            v-for="(company, index) in getTopCompanies()"
            :key="index"
            class="company-rank-item"
          >
            <div class="rank-badge">{{ company.rank }}</div>
            <div class="company-details">
              <h4 class="company-name">{{ company.name }}</h4>
              <div class="company-stats">
                <span class="stat">💼 {{ company.openings }} 个岗位</span>
                <span class="stat">💰 ¥{{ company.avgSalary.toLocaleString() }}/月</span>
                <span class="stat">⭐ {{ company.rating }}/5.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Required Skills -->
      <section v-if="getRequiredSkills().length > 0" class="skills-section">
        <h3 class="section-title">🎯 核心技能需求</h3>
        <div class="skills-list">
          <div
            v-for="(skill, index) in getRequiredSkills()"
            :key="index"
            class="skill-item"
          >
            <div class="skill-header">
              <span class="skill-name">{{ skill.skill }}</span>
              <span class="skill-trend" :class="skill.trend === '必需' ? 'required' : skill.trend === '上升' ? 'rising' : 'stable'">
                {{ skill.trend }}
              </span>
            </div>
            <div class="skill-bar">
              <div class="skill-fill" :style="{ width: `${skill.importance}%` }"></div>
            </div>
            <p class="skill-importance">重要度: {{ skill.importance }}%</p>
          </div>
        </div>
      </section>

      <!-- Salary Ladder -->
      <section v-if="getSalaryLadder().length > 0" class="salary-section">
        <h3 class="section-title">💰 薪资阶梯</h3>
        <div class="salary-progression">
          <div
            v-for="(level, index) in getSalaryLadder()"
            :key="index"
            class="salary-step"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-info">
              <h4 class="step-level">{{ level.level }}</h4>
              <p class="step-title">{{ level.title }}</p>
              <p class="step-years">{{ level.years }}工作经验</p>
            </div>
            <div class="step-salary">
              <p class="salary-amount">¥{{ level.salary.toLocaleString() }}</p>
              <p class="salary-period">/月</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Experience Requirements -->
      <section class="experience-section">
        <h3 class="section-title">📋 经验要求分布</h3>
        <div class="experience-grid">
          <div
            v-for="(exp, index) in jobMarketData.experienceRequirement"
            :key="index"
            class="experience-item"
          >
            <div class="exp-header">
              <h4 class="exp-level">{{ exp.years }}</h4>
              <span class="exp-ratio">{{ exp.ratio }}%</span>
            </div>

            <div class="exp-bar">
              <div class="exp-fill" :style="{ width: `${exp.ratio}%` }"></div>
            </div>

            <div class="exp-footer">
              <p class="exp-desc">{{ exp.description }}</p>
              <p class="exp-salary">
                平均: <strong>¥{{ exp.avgSalary.toLocaleString() }}/月</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Summary Report -->
      <section class="summary-section">
        <h3 class="section-title">📄 市场总结</h3>
        <div class="summary-report">
          <div class="summary-item">
            <h4>👍 优势</h4>
            <ul>
              <li>招聘市场热度高，岗位充足</li>
              <li>薪资水平保持稳定增长</li>
              <li>大公司聚集，就业选择多</li>
              <li>技能需求明确，学习目标清晰</li>
            </ul>
          </div>

          <div class="summary-item">
            <h4>⚠️ 挑战</h4>
            <ul>
              <li>竞争激烈，需要扎实的技能基础</li>
              <li>部分岗位经验要求较高</li>
              <li>地区差异明显，需合理规划</li>
              <li>技术栈更新快，持续学习必要</li>
            </ul>
          </div>

          <div class="summary-item">
            <h4>🎯 建议</h4>
            <ul>
              <li>重点掌握数据结构和算法基础</li>
              <li>学习主流技术栈 (Java/Python等)</li>
              <li>积累实际项目经验</li>
              <li>关注热门城市和大公司机会</li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p class="empty-icon">📭</p>
      <p class="empty-text">暂无就业数据，请先选择专业</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useJobMarketStore } from '@/stores/jobMarket'

const jobMarketStore = useJobMarketStore()

const jobMarketData = computed(() => jobMarketStore.jobMarketData)
const isLoading = computed(() => jobMarketStore.isLoading)
const hasJobMarketData = computed(() => jobMarketStore.hasJobMarketData)
const competitiveIndex = computed(() => jobMarketStore.competitiveIndex)
const topCities = computed(() => jobMarketStore.topCities)

// Methods
function getTrendClass(trend) {
  if (trend === '上升') return 'rising'
  if (trend === '下降') return 'falling'
  return 'stable'
}

function getPopularTechnologies() {
  return jobMarketStore.getPopularTechnologies()
}

function getTrendAnalysis() {
  return jobMarketStore.getTrendAnalysis()
}

function getTopCompanies() {
  return jobMarketStore.getTopCompanies()
}

function getRequiredSkills() {
  return jobMarketStore.getRequiredSkills()
}

function getSalaryLadder() {
  return jobMarketStore.getSalaryLadder()
}
</script>

<style scoped>
.job-market-analysis {
  padding: 2rem 0;
}

.analysis-header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: slideDown 0.5s ease-out;
}

.analysis-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.analysis-subtitle {
  font-size: 1rem;
  color: #7f8c8d;
  margin: 0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #bdc3c7;
}

.loading-spinner {
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
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

/* Content Layout */
.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Section Title */
.section-title {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
  padding-bottom: 0.75rem;
  border-bottom: 3px solid #3498db;
}

/* Metrics Section */
.metrics-section {
  animation: slideUp 0.5s ease-out;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  transition: all 0.3s ease;
  display: flex;
  gap: 1rem;
}

.metric-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
  transform: translateY(-4px);
}

.metric-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
}

.metric-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.metric-value {
  font-size: 1.8rem;
  color: #3498db;
  margin: 0;
  font-weight: 700;
}

.metric-desc {
  font-size: 0.85rem;
  color: #95a5a6;
  margin: 0.25rem 0 0 0;
}

.metric-bar {
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.metric-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* Industry Distribution */
.distribution-section {
  animation: slideUp 0.5s ease-out 0.1s both;
}

.industry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.industry-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  transition: all 0.3s ease;
}

.industry-card:hover {
  border-color: #27ae60;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.15);
}

.industry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.industry-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.industry-ratio {
  background: #f0fff4;
  color: #27ae60;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
}

.industry-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.industry-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60 0%, #229954 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.industry-companies {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.companies-title {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.companies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.company-tag {
  display: inline-block;
  background: #f0f7ff;
  color: #3498db;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* City Comparison */
.city-section {
  animation: slideUp 0.5s ease-out 0.2s both;
}

.city-comparison {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.city-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #3498db;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  transition: all 0.3s ease;
}

.city-item:hover {
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
  transform: translateX(4px);
}

.city-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.city-info {
  flex: 1;
}

.city-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.city-stats {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0 0 0.5rem 0;
}

.city-salary {
  font-size: 0.95rem;
  color: #27ae60;
  margin: 0;
}

.salary-bar {
  width: 150px;
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.salary-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60 0%, #229954 100%);
  border-radius: 3px;
}

/* Job Categories */
.categories-section {
  animation: slideUp 0.5s ease-out 0.3s both;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  transition: all 0.3s ease;
}

.category-item:hover {
  border-color: #f39c12;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.15);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category-title {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.category-count {
  background: #fff5f0;
  color: #f39c12;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
}

.category-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.category-fill {
  height: 100%;
  background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.category-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-desc {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
}

.category-salary {
  font-size: 0.95rem;
  color: #e74c3c;
  margin: 0;
}

/* Technologies Section */
.tech-section {
  animation: slideUp 0.5s ease-out 0.4s both;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.tech-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  transition: all 0.3s ease;
  text-align: center;
}

.tech-item:hover {
  border-color: #9b59b6;
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.15);
  transform: translateY(-4px);
}

.tech-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tech-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
}

.tech-usage {
  background: #f0f4ff;
  color: #3498db;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
}

.tech-bar {
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.tech-fill {
  height: 100%;
  background: linear-gradient(90deg, #9b59b6 0%, #8e44ad 100%);
  border-radius: 3px;
}

.tech-trend {
  font-size: 0.85rem;
  margin: 0;
  font-weight: 600;
}

.tech-trend.rising {
  color: #27ae60;
}

.tech-trend.falling {
  color: #e74c3c;
}

.tech-trend.stable {
  color: #f39c12;
}

/* Trends Section */
.trends-section {
  animation: slideUp 0.5s ease-out 0.5s both;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.trend-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f1 100%);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #bdc3c7;
  text-align: center;
}

.trend-title {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.trend-value {
  font-size: 2rem;
  color: #3498db;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.trend-desc {
  font-size: 0.85rem;
  color: #95a5a6;
  margin: 0;
}

/* Companies Section */
.companies-section {
  animation: slideUp 0.5s ease-out 0.6s both;
}

.companies-ranking {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.company-rank-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #f39c12;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.company-rank-item:hover {
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.15);
  transform: translateX(4px);
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  font-weight: 700;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.company-details {
  flex: 1;
}

.company-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.company-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat {
  font-size: 0.9rem;
  color: #7f8c8d;
}

/* Skills Section */
.skills-section {
  animation: slideUp 0.5s ease-out 0.7s both;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skill-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  transition: all 0.3s ease;
}

.skill-item:hover {
  border-color: #e74c3c;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.skill-name {
  font-weight: 600;
  color: #2c3e50;
}

.skill-trend {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
}

.skill-trend.required {
  background: #fadbd8;
  color: #c0392b;
}

.skill-trend.rising {
  background: #d5f4e6;
  color: #27ae60;
}

.skill-trend.stable {
  background: #fff5f0;
  color: #f39c12;
}

.skill-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.skill-fill {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%);
  border-radius: 4px;
}

.skill-importance {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0;
}

/* Salary Section */
.salary-section {
  animation: slideUp 0.5s ease-out 0.8s both;
}

.salary-progression {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.salary-step {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  transition: all 0.3s ease;
}

.salary-step:hover {
  border-color: #27ae60;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.15);
  transform: translateX(4px);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #27ae60;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
}

.step-level {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.step-title {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0 0 0.25rem 0;
}

.step-years {
  font-size: 0.85rem;
  color: #95a5a6;
  margin: 0;
}

.step-salary {
  text-align: right;
  flex-shrink: 0;
}

.salary-amount {
  font-size: 1.5rem;
  color: #27ae60;
  margin: 0;
  font-weight: 700;
}

.salary-period {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0;
}

/* Experience Section */
.experience-section {
  animation: slideUp 0.5s ease-out 0.9s both;
}

.experience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.experience-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #ecf0f1;
  transition: all 0.3s ease;
}

.experience-item:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
}

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.exp-level {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.exp-ratio {
  background: #f0f7ff;
  color: #3498db;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
}

.exp-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.exp-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exp-desc {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0;
}

.exp-salary {
  font-size: 0.9rem;
  color: #27ae60;
  margin: 0;
}

/* Summary Section */
.summary-section {
  animation: slideUp 0.5s ease-out 1s both;
}

.summary-report {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.summary-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #3498db;
}

.summary-item h4 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.summary-item ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.summary-item li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  color: #34495e;
  position: relative;
  font-size: 0.95rem;
  line-height: 1.4;
}

.summary-item li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #27ae60;
  font-weight: bold;
}

/* Animations */
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

/* Responsive */
@media (max-width: 768px) {
  .analysis-title {
    font-size: 1.5rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metric-card {
    flex-direction: column;
    text-align: center;
  }

  .industry-grid {
    grid-template-columns: 1fr;
  }

  .tech-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .trends-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .city-item,
  .company-rank-item,
  .salary-step {
    flex-direction: column;
    text-align: center;
  }

  .city-info,
  .company-details,
  .step-info {
    text-align: center;
  }

  .city-stats,
  .company-stats {
    justify-content: center;
  }

  .step-salary {
    text-align: center;
  }

  .exp-footer {
    flex-direction: column;
    gap: 0.5rem;
  }

  .summary-report {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    padding: 1rem;
  }

  .trends-grid {
    grid-template-columns: 1fr;
  }

  .salary-bar {
    width: 100%;
    margin-top: 0.75rem;
  }
}
</style>
