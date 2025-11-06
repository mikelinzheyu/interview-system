<template>
  <div class="city-comparison">
    <!-- Header -->
    <div class="comparison-header">
      <h2 class="comparison-title">💼 城市薪资与发展对比</h2>
      <p class="comparison-desc">全面对比各城市薪资、生活成本与发展机会</p>
    </div>

    <!-- Comparison Controls -->
    <div class="comparison-controls">
      <div class="sort-buttons">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          class="sort-btn"
          :class="{ active: sortBy === option.value }"
          @click="sortBy = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="search-box">
        <input
          v-model="searchCity"
          type="text"
          placeholder="搜索城市..."
          class="search-input"
        />
      </div>
    </div>

    <!-- City Comparison Grid -->
    <div class="comparison-grid">
      <div
        v-for="city in sortedCities"
        :key="city.city"
        class="city-card"
        :style="{ animationDelay: `${cities.indexOf(city) * 0.1}s` }"
      >
        <!-- City Header -->
        <div class="city-header">
          <div class="city-info">
            <div class="city-rank">{{ city.rank }}</div>
            <div class="city-name">{{ city.city }}</div>
          </div>
          <div class="city-badge">
            {{ city.count }} 个职位
          </div>
        </div>

        <!-- Salary Comparison -->
        <div class="salary-section">
          <div class="salary-item">
            <span class="label">平均薪资</span>
            <div class="value">¥{{ city.avg.toLocaleString() }}</div>
            <div class="salary-bar">
              <div
                class="bar-fill"
                :style="{ width: (city.avg / maxSalary * 100) + '%' }"
              ></div>
            </div>
          </div>
          <div class="salary-item">
            <span class="label">中位数</span>
            <div class="value">¥{{ city.median.toLocaleString() }}</div>
          </div>
        </div>

        <!-- Cost Analysis -->
        <div class="cost-section">
          <h4 class="section-title">💰 生活成本分析</h4>
          <div class="cost-grid">
            <div class="cost-item">
              <span class="label">生活成本</span>
              <span class="cost-value">¥{{ city.costOfLiving.toLocaleString() }}/月</span>
            </div>
            <div class="cost-item">
              <span class="label">实际薪资</span>
              <span class="net-value">¥{{ city.netSalary.toLocaleString() }}/月</span>
            </div>
            <div class="cost-item">
              <span class="label">消费占比</span>
              <span
                class="ratio-value"
                :class="costRatio(city) > 0.4 ? 'high' : 'low'"
              >
                {{ (costRatio(city) * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Development Score -->
        <div class="development-section">
          <h4 class="section-title">🚀 发展评分</h4>
          <div class="scores-grid">
            <div class="score-item">
              <span class="score-label">薪资竞争力</span>
              <div class="score-bar">
                <div
                  class="score-fill"
                  :style="{ width: salarySalaryScore(city) + '%' }"
                ></div>
              </div>
              <span class="score-text">{{ salarySalaryScore(city).toFixed(0) }}分</span>
            </div>
            <div class="score-item">
              <span class="score-label">生活成本</span>
              <div class="score-bar">
                <div
                  class="score-fill cost-score"
                  :style="{ width: costAffordabilityScore(city) + '%' }"
                ></div>
              </div>
              <span class="score-text">{{ costAffordabilityScore(city).toFixed(0) }}分</span>
            </div>
            <div class="score-item">
              <span class="score-label">机会数量</span>
              <div class="score-bar">
                <div
                  class="score-fill opportunity-score"
                  :style="{ width: opportunityScore(city) + '%' }"
                ></div>
              </div>
              <span class="score-text">{{ opportunityScore(city).toFixed(0) }}分</span>
            </div>
          </div>
        </div>

        <!-- Overall Rating -->
        <div class="rating-section">
          <div class="overall-rating">
            <span class="rating-label">综合评分</span>
            <div class="rating-stars">
              <span
                v-for="i in 5"
                :key="i"
                class="star"
                :class="{ filled: i <= Math.round(overallScore(city) / 20) }"
              >
                ★
              </span>
            </div>
            <span class="rating-value">{{ overallScore(city).toFixed(1) }}分</span>
          </div>
        </div>

        <!-- Pros and Cons -->
        <div class="insights-section">
          <h4 class="section-title">✨ 发展优势</h4>
          <ul class="pros-list">
            <li v-if="city.avg > averageSalary">
              <span class="icon">✓</span>
              <span>薪资水平高于平均 {{ ((city.avg / averageSalary - 1) * 100).toFixed(0) }}%</span>
            </li>
            <li v-if="city.count > averageCount">
              <span class="icon">✓</span>
              <span>职位机会充足，数量排名前列</span>
            </li>
            <li v-if="costRatio(city) < 0.35">
              <span class="icon">✓</span>
              <span>生活成本相对较低，存钱潜力大</span>
            </li>
            <li v-if="city.netSalary > (averageSalary - averageCost)">
              <span class="icon">✓</span>
              <span>实际可支配收入充足</span>
            </li>
          </ul>
        </div>

        <!-- Recommendation -->
        <div class="recommendation">
          <span class="rec-icon">💡</span>
          <span class="rec-text">{{ getCityRecommendation(city) }}</span>
        </div>
      </div>
    </div>

    <!-- Summary Statistics -->
    <div class="summary-section">
      <h2 class="summary-title">📊 城市对比总结</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <h4>薪资最高城市</h4>
          <p class="city-name">{{ highestSalaryCity.city }}</p>
          <p class="value">¥{{ highestSalaryCity.avg.toLocaleString() }}/月</p>
        </div>
        <div class="summary-card">
          <h4>生活成本最低</h4>
          <p class="city-name">{{ lowestCostCity.city }}</p>
          <p class="value">¥{{ lowestCostCity.costOfLiving.toLocaleString() }}/月</p>
        </div>
        <div class="summary-card">
          <h4>性价比最高</h4>
          <p class="city-name">{{ bestValueCity.city }}</p>
          <p class="value">¥{{ bestValueCity.netSalary.toLocaleString() }} 实际收入</p>
        </div>
        <div class="summary-card">
          <h4>机会最多</h4>
          <p class="city-name">{{ mostOpportunitiesCity.city }}</p>
          <p class="value">{{ mostOpportunitiesCity.count }} 个职位</p>
        </div>
      </div>
    </div>

    <!-- Insights -->
    <div class="insights-box">
      <h3 class="insights-title">💭 数据洞察</h3>
      <ul class="insights-list">
        <li>
          一线城市（北京、上海、深圳）薪资水平整体较高，平均比全国平均高
          {{ ((avgFirstTierSalary / averageSalary - 1) * 100).toFixed(0) }}%
        </li>
        <li>
          生活成本与薪资成正相关，但性价比（实际可支配收入）因城市而异
        </li>
        <li>
          建议根据个人背景和职业目标选择，不仅看薪资绝对值，也要看实际生活质量
        </li>
        <li>
          {{ bestValueCity.city }}
          性价比最高，实际可支配收入达
          {{ ((bestValueCity.netSalary / averageNetSalary - 1) * 100).toFixed(0) }}%
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSalaryStore } from '@/stores/salary'

const salaryStore = useSalaryStore()

// State
const sortBy = ref('salary')
const searchCity = ref('')

const cities = computed(() => salaryStore.salaryData.byCity || [])

const sortOptions = [
  { label: '按薪资排序', value: 'salary' },
  { label: '按成本排序', value: 'cost' },
  { label: '按性价比排序', value: 'value' },
  { label: '按机会排序', value: 'opportunity' }
]

// Computed properties
const sortedCities = computed(() => {
  let sorted = [...cities.value]

  if (searchCity.value) {
    sorted = sorted.filter(c => c.city.includes(searchCity.value))
  }

  switch (sortBy.value) {
    case 'salary':
      return sorted.sort((a, b) => b.avg - a.avg)
    case 'cost':
      return sorted.sort((a, b) => a.costOfLiving - b.costOfLiving)
    case 'value':
      return sorted.sort((a, b) => b.netSalary - a.netSalary)
    case 'opportunity':
      return sorted.sort((a, b) => b.count - a.count)
    default:
      return sorted
  }
})

const maxSalary = computed(() => {
  return Math.max(...cities.value.map(c => c.avg), 30000)
})

const averageSalary = computed(() => {
  if (!cities.value.length) return 0
  return cities.value.reduce((sum, c) => sum + c.avg, 0) / cities.value.length
})

const averageCount = computed(() => {
  if (!cities.value.length) return 0
  return cities.value.reduce((sum, c) => sum + c.count, 0) / cities.value.length
})

const averageCost = computed(() => {
  if (!cities.value.length) return 0
  return cities.value.reduce((sum, c) => sum + c.costOfLiving, 0) / cities.value.length
})

const averageNetSalary = computed(() => {
  if (!cities.value.length) return 0
  return cities.value.reduce((sum, c) => sum + c.netSalary, 0) / cities.value.length
})

const avgFirstTierSalary = computed(() => {
  const firstTier = cities.value.filter(c => ['北京', '上海', '深圳'].includes(c.city))
  if (!firstTier.length) return averageSalary.value
  return firstTier.reduce((sum, c) => sum + c.avg, 0) / firstTier.length
})

const highestSalaryCity = computed(() => {
  return cities.value.reduce((max, city) => city.avg > max.avg ? city : max, cities.value[0] || {})
})

const lowestCostCity = computed(() => {
  return cities.value.reduce((min, city) => city.costOfLiving < min.costOfLiving ? city : min, cities.value[0] || {})
})

const bestValueCity = computed(() => {
  return cities.value.reduce((max, city) => city.netSalary > max.netSalary ? city : max, cities.value[0] || {})
})

const mostOpportunitiesCity = computed(() => {
  return cities.value.reduce((max, city) => city.count > max.count ? city : max, cities.value[0] || {})
})

// Methods
function costRatio(city) {
  return city.costOfLiving / city.avg
}

function salarySalaryScore(city) {
  return (city.avg / maxSalary.value) * 100
}

function costAffordabilityScore(city) {
  const costRatio = city.costOfLiving / city.avg
  return Math.max(0, Math.min(100, (1 - costRatio * 0.5) * 100))
}

function opportunityScore(city) {
  const maxCount = Math.max(...cities.value.map(c => c.count), 1000)
  return (city.count / maxCount) * 100
}

function overallScore(city) {
  return (salarySalaryScore(city) * 0.4 + costAffordabilityScore(city) * 0.3 + opportunityScore(city) * 0.3) / 20
}

function getCityRecommendation(city) {
  const netSalary = city.netSalary
  const salary = city.avg
  const costRatio = city.costOfLiving / city.avg

  if (salary > averageSalary.value && costRatio < 0.35) {
    return '💚 推荐：高薪低成本，发展潜力大'
  } else if (salary > averageSalary.value && costRatio > 0.4) {
    return '💙 较好：薪资高但生活成本也高，需提前规划'
  } else if (salary <= averageSalary.value && costRatio < 0.35) {
    return '💜 考虑：生活成本低，适合积累和发展'
  } else {
    return '💛 参考：综合考虑，根据个人目标选择'
  }
}
</script>

<style scoped>
.city-comparison {
  padding: 2rem 0;
}

/* Header */
.comparison-header {
  text-align: center;
  margin-bottom: 2rem;
  animation: slideDown 0.5s ease-out;
}

.comparison-title {
  font-size: 1.8rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.comparison-desc {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.95rem;
}

/* Controls */
.comparison-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.sort-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sort-btn {
  padding: 0.6rem 1.2rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  background: white;
  color: #7f8c8d;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.sort-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.sort-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-color: #2980b9;
}

.search-box {
  flex: 0 1 200px;
}

.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* City Comparison Grid */
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.city-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
  border: 1px solid #ecf0f1;
}

.city-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
  border-color: #3498db;
}

/* City Header */
.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.city-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.city-rank {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.city-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}

.city-badge {
  background: #ecf0f1;
  color: #7f8c8d;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Salary Section */
.salary-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.salary-item {
  margin-bottom: 1rem;
}

.salary-item:last-child {
  margin-bottom: 0;
}

.salary-item .label {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-weight: 600;
  display: block;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
}

.salary-item .value {
  font-size: 1.5rem;
  color: #27ae60;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.salary-bar {
  width: 100%;
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60 0%, #2ecc71 100%);
  transition: width 0.3s ease;
}

/* Cost Section */
.cost-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.cost-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.cost-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.cost-item .label {
  font-size: 0.8rem;
  color: #95a5a6;
  font-weight: 600;
  text-transform: uppercase;
}

.cost-item .cost-value {
  font-size: 1.1rem;
  color: #e67e22;
  font-weight: 700;
}

.cost-item .net-value {
  font-size: 1.1rem;
  color: #27ae60;
  font-weight: 700;
}

.cost-item .ratio-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f39c12;
}

.cost-item .ratio-value.high {
  color: #e74c3c;
}

.cost-item .ratio-value.low {
  color: #27ae60;
}

/* Development Section */
.development-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.scores-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.score-label {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-weight: 600;
  min-width: 80px;
  text-transform: uppercase;
}

.score-bar {
  flex: 1;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  transition: width 0.3s ease;
}

.score-fill.cost-score {
  background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%);
}

.score-fill.opportunity-score {
  background: linear-gradient(90deg, #9b59b6 0%, #8e44ad 100%);
}

.score-text {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

/* Rating Section */
.rating-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.overall-rating {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.rating-label {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-weight: 600;
  text-transform: uppercase;
}

.rating-stars {
  display: flex;
  gap: 0.2rem;
}

.star {
  font-size: 1.3rem;
  color: #ecf0f1;
  transition: color 0.3s ease;
}

.star.filled {
  color: #f39c12;
}

.rating-value {
  font-size: 1.2rem;
  color: #f39c12;
  font-weight: 700;
  min-width: 50px;
  text-align: right;
}

/* Insights Section */
.insights-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.section-title {
  font-size: 0.95rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.pros-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pros-list li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 0;
  font-size: 0.9rem;
  color: #2c3e50;
}

.pros-list .icon {
  color: #27ae60;
  font-weight: 700;
  font-size: 1rem;
}

/* Recommendation */
.recommendation {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(155, 89, 182, 0.1) 100%);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border-left: 4px solid #3498db;
}

.rec-icon {
  font-size: 1.2rem;
}

.rec-text {
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 600;
}

/* Summary Section */
.summary-section {
  margin-top: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.summary-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  text-align: center;
  border: 1px solid #ecf0f1;
}

.summary-card h4 {
  margin: 0 0 0.8rem 0;
  font-size: 0.9rem;
  color: #7f8c8d;
  text-transform: uppercase;
  font-weight: 600;
}

.summary-card .city-name {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0.5rem 0;
  font-weight: 700;
}

.summary-card .value {
  font-size: 1.3rem;
  color: #3498db;
  margin: 0;
  font-weight: 700;
}

/* Insights Box */
.insights-box {
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.insights-title {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.insights-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.insights-list li {
  padding: 0.8rem 0;
  color: #2c3e50;
  font-size: 0.95rem;
  line-height: 1.6;
  border-bottom: 1px solid rgba(52, 152, 219, 0.1);
}

.insights-list li:last-child {
  border-bottom: none;
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
  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .cost-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .comparison-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-buttons {
    order: 2;
  }

  .search-box {
    order: 1;
    flex: 1;
  }
}

@media (max-width: 480px) {
  .city-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .cost-grid {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .score-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .score-label {
    min-width: auto;
  }

  .overall-rating {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
