<template>
  <div class="recommendation-card">
    <div class="card-header">
      <div class="rank-badge">#{{ rank }}</div>
      <h3 class="major-name">{{ recommendation.name }}</h3>
      <div class="score-display">
        <div class="score-percentage">
          {{ (recommendation.matchScore * 100).toFixed(0) }}%
        </div>
        <div class="score-label">匹配度</div>
      </div>
    </div>

    <!-- Match Score Bar -->
    <div class="score-bar-container">
      <div class="score-bar">
        <div
          class="score-fill"
          :style="{ width: `${Math.min(recommendation.matchScore * 100, 100)}%` }"
          :class="{
            'score-excellent': recommendation.matchScore >= 0.85,
            'score-good': recommendation.matchScore >= 0.70 && recommendation.matchScore < 0.85,
            'score-fair': recommendation.matchScore >= 0.50 && recommendation.matchScore < 0.70,
            'score-poor': recommendation.matchScore < 0.50
          }"
        ></div>
      </div>
    </div>

    <!-- Recommendation Reasons -->
    <div class="reasons-section">
      <h4 class="reasons-title">💡 推荐理由</h4>
      <ul class="reasons-list">
        <li v-for="(reason, index) in recommendation.reasons.slice(0, 3)" :key="index" class="reason-item">
          <span class="reason-icon">✓</span>
          <span class="reason-text">{{ reason }}</span>
        </li>
        <li v-if="recommendation.reasons.length > 3" class="reason-more">
          + {{ recommendation.reasons.length - 3 }} 更多理由
        </li>
      </ul>
    </div>

    <!-- Match Details Summary -->
    <div class="match-details">
      <div v-if="recommendation.matchDetails" class="details-grid">
        <div class="detail-item">
          <span class="detail-label">学科匹配</span>
          <div class="detail-bar">
            <div
              class="detail-fill"
              :style="{ width: `${recommendation.matchDetails.disciplineMatch.score * 100}%` }"
            ></div>
          </div>
          <span class="detail-score">{{ (recommendation.matchDetails.disciplineMatch.score * 100).toFixed(0) }}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">能力匹配</span>
          <div class="detail-bar">
            <div
              class="detail-fill"
              :style="{ width: `${recommendation.matchDetails.abilityMatch.score * 100}%` }"
            ></div>
          </div>
          <span class="detail-score">{{ (recommendation.matchDetails.abilityMatch.score * 100).toFixed(0) }}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">职业目标</span>
          <div class="detail-bar">
            <div
              class="detail-fill"
              :style="{ width: `${recommendation.matchDetails.careerMatch.score * 100}%` }"
            ></div>
          </div>
          <span class="detail-score">{{ (recommendation.matchDetails.careerMatch.score * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <!-- Salary Info -->
    <div v-if="recommendation.matchDetails?.salaryMatch" class="salary-info">
      <span class="salary-icon">💰</span>
      <span class="salary-text">
        平均薪资: <strong>¥{{ recommendation.matchDetails.salaryMatch.salary.toLocaleString() }}/月</strong>
      </span>
    </div>

    <!-- Employment Rate -->
    <div v-if="recommendation.matchDetails?.employmentMatch" class="employment-info">
      <span class="employment-icon">📊</span>
      <span class="employment-text">
        就业率: <strong>{{ (recommendation.matchDetails.employmentMatch.rate * 100).toFixed(1) }}%</strong>
      </span>
    </div>

    <!-- Action Buttons -->
    <div class="card-actions">
      <button class="btn-details" @click="handleViewDetails">
        查看详情
      </button>
      <button class="btn-compare" @click="handleCompare">
        对比
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  recommendation: {
    type: Object,
    required: true
  },
  rank: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['view-details', 'compare'])

function handleViewDetails() {
  emit('view-details', {
    majorCode: recommendation.code,
    majorName: recommendation.name
  })
}

function handleCompare() {
  emit('compare', {
    majorCode: recommendation.code,
    majorName: recommendation.name
  })
}
</script>

<style scoped>
.recommendation-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.recommendation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  position: relative;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.major-name {
  flex: 1;
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.score-percentage {
  font-size: 1.8rem;
  font-weight: 700;
  color: #27ae60;
}

.score-label {
  font-size: 0.75rem;
  color: #95a5a6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Score Bar */
.score-bar-container {
  margin-bottom: 1.25rem;
}

.score-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
}

.score-excellent {
  background: linear-gradient(90deg, #27ae60 0%, #229954 100%) !important;
}

.score-good {
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%) !important;
}

.score-fair {
  background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%) !important;
}

.score-poor {
  background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%) !important;
}

/* Reasons Section */
.reasons-section {
  margin-bottom: 1.25rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.reasons-title {
  font-size: 0.95rem;
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.reasons-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.reason-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #34495e;
  margin-bottom: 0.5rem;
  align-items: flex-start;
}

.reason-item:last-of-type {
  margin-bottom: 0;
}

.reason-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #27ae60;
  color: white;
  font-size: 0.75rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.reason-text {
  flex: 1;
  line-height: 1.4;
}

.reason-more {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #3498db;
  cursor: pointer;
  font-weight: 500;
  padding-top: 0.25rem;
}

/* Match Details */
.match-details {
  margin-bottom: 1rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.detail-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 500;
  text-align: center;
}

.detail-bar {
  width: 100%;
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
}

.detail-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.detail-score {
  font-size: 0.75rem;
  color: #2c3e50;
  font-weight: 600;
}

/* Salary and Employment Info */
.salary-info,
.employment-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f0fff4;
  border-left: 3px solid #27ae60;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: #27ae60;
}

.employment-info {
  background: #f0f7ff;
  border-left-color: #3498db;
  color: #3498db;
}

.salary-icon,
.employment-icon {
  font-size: 1.1rem;
}

.salary-text,
.employment-text {
  flex: 1;
}

/* Action Buttons */
.card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.btn-details,
.btn-compare {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-details {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.btn-details:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-compare {
  background: white;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-compare:hover {
  background: #f0f7ff;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .card-header {
    flex-wrap: wrap;
  }

  .major-name {
    flex-basis: 100%;
    font-size: 1.1rem;
  }

  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .card-actions {
    flex-direction: column;
  }

  .btn-details,
  .btn-compare {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .recommendation-card {
    padding: 1rem;
  }

  .card-header {
    gap: 0.75rem;
  }

  .rank-badge {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .major-name {
    font-size: 1rem;
  }

  .score-percentage {
    font-size: 1.4rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
