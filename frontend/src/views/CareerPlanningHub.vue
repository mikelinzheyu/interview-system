<template>
  <div class="integrated-career-system">
    <!-- Page Container -->
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">🚀 职业规划助手</h1>
        <p class="page-subtitle">AI推荐 + 实时就业数据 + 职业分析</p>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Tab 1: Recommendation -->
        <section v-show="activeTab === 'recommendation'" class="tab-panel">
          <InterestAssessment v-if="!hasRecommendations" />
          <RecommendationResult v-else-if="hasRecommendations" />
        </section>

        <!-- Tab 2: Job Market -->
        <section v-show="activeTab === 'job-market'" class="tab-panel">
          <div v-if="hasRecommendations" class="job-market-selector">
            <p class="selector-label">选择一个推荐专业查看就业数据：</p>
            <div class="major-selector">
              <button
                v-for="(rec, index) in recommendations"
                :key="rec.code"
                class="major-btn"
                :class="{ active: selectedMajorCode === rec.code }"
                @click="selectMajor(rec)"
              >
                <span class="major-rank">#{{ index + 1 }}</span>
                <span class="major-text">{{ rec.name }}</span>
                <span class="major-score">{{ (rec.matchScore * 100).toFixed(0) }}%</span>
              </button>
            </div>
          </div>

          <div class="job-market-container">
            <JobMarketAnalysis />
          </div>
        </section>

        <!-- Tab 3: Salary Analysis -->
        <section v-show="activeTab === 'salary'" class="tab-panel">
          <div v-if="hasRecommendations" class="salary-selector">
            <p class="selector-label">选择一个推荐专业查看薪资数据：</p>
            <div class="major-selector">
              <button
                v-for="(rec, index) in recommendations"
                :key="rec.code"
                class="major-btn"
                :class="{ active: selectedMajorCode === rec.code }"
                @click="selectMajor(rec)"
              >
                <span class="major-rank">#{{ index + 1 }}</span>
                <span class="major-text">{{ rec.name }}</span>
                <span class="major-score">{{ (rec.matchScore * 100).toFixed(0) }}%</span>
              </button>
            </div>
          </div>

          <div class="salary-container">
            <SalaryAnalysis />
          </div>

          <div class="city-comparison-container">
            <CityComparison />
          </div>
        </section>

        <!-- Tab 4: Career Planning -->
        <section v-show="activeTab === 'career-planning'" class="tab-panel">
          <CareerPlanningGuide />
        </section>

        <!-- Tab 5: Quick Stats -->
        <section v-show="activeTab === 'stats'" class="tab-panel">
          <QuickStatsPanel />
        </section>
      </div>

      <!-- Floating Action Button -->
      <div v-if="hasRecommendations" class="floating-actions">
        <button class="fab-btn" @click="scrollToTop" title="回到顶部">
          <span>↑</span>
        </button>
      </div>
    </div>

    <!-- Background Decoration -->
    <div class="page-background"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRecommendationStore } from '@/stores/recommendations'
import { useJobMarketStore } from '@/stores/jobMarket'
import { useSalaryStore } from '@/stores/salary'
import InterestAssessment from '@/components/InterestAssessment.vue'
import RecommendationResult from '@/components/RecommendationResult.vue'
import JobMarketAnalysis from '@/components/JobMarketAnalysis.vue'
import CareerPlanningGuide from '@/components/CareerPlanningGuide.vue'
import QuickStatsPanel from '@/components/QuickStatsPanel.vue'
import SalaryAnalysis from '@/components/SalaryAnalysis.vue'
import CityComparison from '@/components/CityComparison.vue'

const recommendationStore = useRecommendationStore()
const jobMarketStore = useJobMarketStore()
const salaryStore = useSalaryStore()

const activeTab = ref('recommendation')
const selectedMajorCode = ref('')

const hasRecommendations = computed(() => recommendationStore.hasRecommendations)
const recommendations = computed(() => recommendationStore.recommendations)

const tabs = [
  { id: 'recommendation', label: '推荐专业', icon: '🎯' },
  { id: 'job-market', label: '就业数据', icon: '📊' },
  { id: 'salary', label: '薪资分析', icon: '💰' },
  { id: 'career-planning', label: '职业规划', icon: '🛤️' },
  { id: 'stats', label: '数据统计', icon: '📈' }
]

// Watch for recommendation changes
watch(recommendations, (newRecs) => {
  if (newRecs.length > 0 && !selectedMajorCode.value) {
    selectedMajorCode.value = newRecs[0].code
    jobMarketStore.loadJobMarketData(newRecs[0].code)
    salaryStore.loadSalaryData(newRecs[0].code)
  }
})

// Watch for major code changes to load salary data
watch(selectedMajorCode, (newCode) => {
  if (newCode) {
    salaryStore.loadSalaryData(newCode)
  }
})

// Functions
function selectMajor(major) {
  selectedMajorCode.value = major.code
  jobMarketStore.loadJobMarketData(major.code)
  salaryStore.loadSalaryData(major.code)
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.integrated-career-system {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
}

.page-container {
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 2rem;
  animation: slideDown 0.5s ease-out;
}

.page-title {
  font-size: 2.8rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 800;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.nav-tab {
  padding: 0.75rem 1.5rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  color: #7f8c8d;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-tab:hover {
  border-color: #3498db;
  color: #3498db;
}

.nav-tab.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-color: #2980b9;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-label {
  display: none;
}

@media (min-width: 640px) {
  .tab-label {
    display: inline;
  }
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.3s ease-out;
}

.tab-panel {
  animation: slideUp 0.5s ease-out;
}

/* Job Market Selector */
.job-market-selector {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.selector-label {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.major-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.major-btn {
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.major-btn:hover {
  border-color: #3498db;
  background: #f0f7ff;
}

.major-btn.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
}

.major-rank {
  font-size: 0.75rem;
  color: #95a5a6;
  font-weight: 600;
  text-transform: uppercase;
}

.major-text {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 600;
}

.major-score {
  font-size: 1.3rem;
  color: #27ae60;
  font-weight: 700;
}

/* Job Market Container */
.job-market-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease-out;
}

/* Salary Selector and Containers */
.salary-selector {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.salary-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease-out;
}

.city-comparison-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease-out;
}

/* Floating Action Button */
.floating-actions {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
}

.fab-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
}

/* Background Decoration */
.page-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
}

.page-background::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.page-background::after {
  content: '';
  position: absolute;
  bottom: -50%;
  left: -50%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(155, 89, 182, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(30px);
  }
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .page-container {
    padding: 1rem;
  }

  .major-selector {
    grid-template-columns: 1fr;
  }

  .job-market-container {
    padding: 1.5rem;
  }

  .fab-btn {
    width: 45px;
    height: 45px;
    font-size: 1.2rem;
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
