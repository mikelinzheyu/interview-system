<template>
  <div class="recommendation-results">
    <!-- Results Header -->
    <div class="results-header">
      <h2 class="results-title">🎯 您的专业推荐结果</h2>
      <div class="results-summary">
        <div class="summary-item">
          <span class="summary-label">推荐专业数</span>
          <span class="summary-value">{{ recommendations.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">平均匹配度</span>
          <span class="summary-value">{{ averageScore }}%</span>
        </div>
      </div>
    </div>

    <!-- Recommendations Grid -->
    <div v-if="recommendations.length > 0" class="recommendations-container">
      <RecommendationCard
        v-for="(rec, index) in recommendations"
        :key="rec.code"
        :recommendation="rec"
        :rank="index + 1"
        @view-details="handleViewDetails"
        @compare="handleCompareInit"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p class="empty-icon">📭</p>
      <p class="empty-text">暂无推荐结果，请先完成兴趣评估</p>
    </div>

    <!-- Action Buttons -->
    <div v-if="recommendations.length > 0" class="results-actions">
      <button class="btn-save" @click="handleSave">
        💾 保存结果
      </button>
      <button class="btn-export" @click="handleExport">
        📄 导出报告
      </button>
      <button class="btn-share" @click="handleShare">
        📤 分享
      </button>
      <button class="btn-newassessment" @click="handleNewAssessment">
        🔄 新建评估
      </button>
    </div>

    <!-- Comparison Modal -->
    <div v-if="showComparison" class="comparison-modal-overlay" @click="handleCloseComparison">
      <div class="comparison-modal" @click.stop>
        <button class="modal-close" @click="handleCloseComparison">✕</button>

        <h3 class="modal-title">对比专业</h3>

        <div class="comparison-selector">
          <div class="selector-group">
            <label>选择第一个专业：</label>
            <select v-model="comparison.major1" class="selector">
              <option value="">-- 选择专业 --</option>
              <option v-for="rec in recommendations" :key="rec.code" :value="rec.code">
                {{ rec.name }}
              </option>
            </select>
          </div>

          <div class="selector-group">
            <label>选择第二个专业：</label>
            <select v-model="comparison.major2" class="selector">
              <option value="">-- 选择专业 --</option>
              <option v-for="rec in recommendations" :key="rec.code" :value="rec.code">
                {{ rec.name }}
              </option>
            </select>
          </div>
        </div>

        <button
          class="btn-compare-exec"
          @click="handleExecuteComparison"
          :disabled="!comparison.major1 || !comparison.major2 || comparison.major1 === comparison.major2"
        >
          开始对比
        </button>

        <div v-if="comparisonResult" class="comparison-result">
          <h4>对比结果</h4>

          <div class="major-comparison">
            <div class="major-column">
              <h5>{{ comparisonResult.major1.name }}</h5>
              <div class="comparison-metric">
                <span>匹配度</span>
                <strong>{{ (comparisonResult.major1.matchScore * 100).toFixed(1) }}%</strong>
              </div>
              <div v-if="comparisonResult.major1.advantages?.disciplineMatch" class="comparison-metric">
                <span>学科匹配</span>
                <strong>{{ (comparisonResult.major1.advantages.disciplineMatch.score * 100).toFixed(0) }}%</strong>
              </div>
              <div v-if="comparisonResult.major1.advantages?.abilityMatch" class="comparison-metric">
                <span>能力匹配</span>
                <strong>{{ (comparisonResult.major1.advantages.abilityMatch.score * 100).toFixed(0) }}%</strong>
              </div>
              <div v-if="comparisonResult.major1.advantages?.salaryMatch" class="comparison-metric">
                <span>平均薪资</span>
                <strong>¥{{ comparisonResult.major1.averageSalary?.toLocaleString() }}/月</strong>
              </div>
            </div>

            <div class="major-column">
              <h5>{{ comparisonResult.major2.name }}</h5>
              <div class="comparison-metric">
                <span>匹配度</span>
                <strong>{{ (comparisonResult.major2.matchScore * 100).toFixed(1) }}%</strong>
              </div>
              <div v-if="comparisonResult.major2.advantages?.disciplineMatch" class="comparison-metric">
                <span>学科匹配</span>
                <strong>{{ (comparisonResult.major2.advantages.disciplineMatch.score * 100).toFixed(0) }}%</strong>
              </div>
              <div v-if="comparisonResult.major2.advantages?.abilityMatch" class="comparison-metric">
                <span>能力匹配</span>
                <strong>{{ (comparisonResult.major2.advantages.abilityMatch.score * 100).toFixed(0) }}%</strong>
              </div>
              <div v-if="comparisonResult.major2.advantages?.salaryMatch" class="comparison-metric">
                <span>平均薪资</span>
                <strong>¥{{ comparisonResult.major2.averageSalary?.toLocaleString() }}/月</strong>
              </div>
            </div>
          </div>

          <div class="comparison-recommendation">
            <p>
              💡 根据您的兴趣和能力，推荐选择：
              <strong>{{ comparisonResult.recommendation === comparison.major1 ? comparisonResult.major1.name : comparisonResult.major2.name }}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Success Message -->
    <div v-if="showSaveSuccess" class="success-message">
      ✅ 推荐结果已保存！
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecommendationStore } from '@/stores/recommendations'
import RecommendationCard from './RecommendationCard.vue'

const recommendationStore = useRecommendationStore()
const recommendations = computed(() => recommendationStore.recommendations)

const averageScore = computed(() => {
  if (recommendations.value.length === 0) return 0
  const total = recommendations.value.reduce((sum, r) => sum + r.matchScore, 0)
  return Math.round((total / recommendations.value.length) * 100)
})

// Comparison state
const showComparison = ref(false)
const comparison = ref({
  major1: '',
  major2: ''
})
const comparisonResult = ref(null)

// Save success message
const showSaveSuccess = ref(false)

// Event handlers
function handleViewDetails(data) {
  // Emit event to parent component to show detail view
  console.log('View details for:', data)
}

function handleCompareInit(data) {
  showComparison.value = true
  comparison.value.major1 = data.majorCode
}

function handleExecuteComparison() {
  comparisonResult.value = recommendationStore.compareSpecialties(
    comparison.value.major1,
    comparison.value.major2
  )
}

function handleCloseComparison() {
  showComparison.value = false
  comparison.value.major1 = ''
  comparison.value.major2 = ''
  comparisonResult.value = null
}

function handleSave() {
  recommendationStore.saveRecommendations()
  showSaveSuccess.value = true
  setTimeout(() => {
    showSaveSuccess.value = false
  }, 3000)
}

function handleExport() {
  recommendationStore.exportAsPDF()
  // In real implementation, this would trigger PDF download
}

function handleShare() {
  // Show share modal or options
  const text = `我根据兴趣和能力测评，得到最佳专业推荐：${recommendationStore.topRecommendation?.name || '计算机科学与技术'}（匹配度：${averageScore.value}%）`

  // Copy to clipboard for easy sharing
  navigator.clipboard.writeText(text)

  alert('推荐文本已复制到剪贴板，可分享给朋友！')
}

function handleNewAssessment() {
  if (confirm('确定要进行新的评估吗？当前结果将被重置。')) {
    recommendationStore.resetRecommendation()
  }
}
</script>

<style scoped>
.recommendation-results {
  padding: 2rem 0;
}

/* Results Header */
.results-header {
  margin-bottom: 2.5rem;
  animation: slideDown 0.5s ease-out;
}

.results-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.results-summary {
  display: flex;
  gap: 2rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.summary-label {
  color: #7f8c8d;
  font-size: 0.9rem;
  font-weight: 500;
}

.summary-value {
  font-size: 1.5rem;
  color: #3498db;
  font-weight: 700;
}

/* Recommendations Container */
.recommendations-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
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

/* Action Buttons */
.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.btn-save,
.btn-export,
.btn-share,
.btn-newassessment {
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.btn-export {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.btn-export:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.btn-share {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  color: white;
}

.btn-share:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.btn-newassessment {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-newassessment:hover {
  background: #bdc3c7;
  transform: translateY(-2px);
}

/* Comparison Modal */
.comparison-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.comparison-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: slideUp 0.3s ease-out;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border: none;
  background: #ecf0f1;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #bdc3c7;
  transform: rotate(90deg);
}

.modal-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.comparison-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selector-group label {
  font-weight: 600;
  color: #2c3e50;
}

.selector {
  padding: 0.75rem;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.selector:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.btn-compare-exec {
  width: 100%;
  padding: 0.85rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.btn-compare-exec:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-compare-exec:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comparison-result {
  padding-top: 1.5rem;
  border-top: 2px solid #ecf0f1;
}

.comparison-result h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.major-comparison {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.major-column {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.major-column h5 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1rem;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

.comparison-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.comparison-metric span {
  color: #7f8c8d;
}

.comparison-metric strong {
  color: #2c3e50;
  font-size: 1rem;
}

.comparison-recommendation {
  padding: 1rem;
  background: linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%);
  border-left: 4px solid #27ae60;
  border-radius: 6px;
  color: #27ae60;
}

.comparison-recommendation p {
  margin: 0;
  line-height: 1.5;
}

/* Success Message */
.success-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  animation: slideUp 0.3s ease-out;
  z-index: 999;
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
  .results-title {
    font-size: 1.5rem;
  }

  .results-summary {
    flex-direction: column;
  }

  .recommendations-container {
    grid-template-columns: 1fr;
  }

  .results-actions {
    gap: 0.5rem;
  }

  .btn-save,
  .btn-export,
  .btn-share,
  .btn-newassessment {
    flex: 1;
    min-width: 100px;
  }

  .major-comparison {
    grid-template-columns: 1fr;
  }

  .success-message {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }
}
</style>
