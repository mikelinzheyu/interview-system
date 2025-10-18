<template>
  <aside class="recommendation-panel">
    <el-skeleton v-if="loading" animated :rows="8" class="panel-skeleton" />

    <template v-else>
      <section class="panel-section">
        <div class="section-header">
          <h2>领域推荐</h2>
          <p>根据热度与匹配度，为您精选学习方向</p>
        </div>

        <div v-if="decoratedRecommendations.length" class="recommendation-grid">
          <button
            v-for="item in decoratedRecommendations"
            :key="item.key"
            class="recommendation-card"
            :style="item.styles"
            type="button"
            @click="handleSelect(item.domain)"
          >
            <span v-if="item.domain.icon" class="card-icon">{{ item.domain.icon }}</span>
            <span class="card-title">{{ item.domain.name }}</span>
            <span v-if="item.subtitle" class="card-subtitle">{{ item.subtitle }}</span>
          </button>
        </div>
        <el-empty v-else description="暂无推荐领域" :image-size="120" />
      </section>

      <section v-if="progress" class="panel-section progress-section">
        <div class="section-header">
          <h2>学习进度</h2>
          <p>持续推进，保持稳定节奏</p>
        </div>
        <div class="progress-card">
          <el-progress
            class="progress-chart"
            type="dashboard"
            :percentage="normalizePercent(progress.completion)"
            :color="progressColor"
            :width="160"
            :stroke-width="10"
          >
            <template #default="{ percentage }">
              <span class="progress-percentage">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="progress-details">
            <div class="detail-item">
              <span class="label">题目总数</span>
              <span class="value">{{ formatNumber(progress.total) }}</span>
            </div>
            <div class="detail-group">
              <div class="detail-item">
                <span class="label">基础</span>
                <span class="value">{{ formatNumber(progress.easy) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">进阶</span>
                <span class="value">{{ formatNumber(progress.medium) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">挑战</span>
                <span class="value">{{ formatNumber(progress.hard) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="suggestions.length" class="panel-section suggestion-section">
        <div class="section-header">
          <h2>学习建议</h2>
          <p>结合领域特性，优先完成这些模块</p>
        </div>
        <ul class="suggestion-list">
          <li v-for="item in suggestions" :key="item">
            <span class="bullet" />
            <span class="text">{{ item }}</span>
          </li>
        </ul>
      </section>
    </template>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const GRADIENTS = [
  {
    background: 'linear-gradient(145deg, #fef3c7 0%, #facc15 100%)',
    color: '#92400e',
    shadow: '0 18px 28px rgba(250, 204, 21, 0.25)'
  },
  {
    background: 'linear-gradient(145deg, #bfdbfe 0%, #60a5fa 100%)',
    color: '#1e3a8a',
    shadow: '0 18px 28px rgba(96, 165, 250, 0.25)'
  },
  {
    background: 'linear-gradient(145deg, #c4b5fd 0%, #8b5cf6 100%)',
    color: '#4c1d95',
    shadow: '0 18px 28px rgba(139, 92, 246, 0.25)'
  },
  {
    background: 'linear-gradient(145deg, #a5f3fc 0%, #22d3ee 100%)',
    color: '#0f172a',
    shadow: '0 18px 28px rgba(34, 211, 238, 0.25)'
  }
]

const numberFormatter = new Intl.NumberFormat('en-US')

const props = defineProps({
  recommended: {
    type: Array,
    default: () => []
  },
  progress: {
    type: Object,
    default: null
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const decoratedRecommendations = computed(() => {
  return props.recommended.map((domain, index) => {
    const palette = GRADIENTS[index % GRADIENTS.length]
    return {
      key: domain.id || domain.slug || index,
      domain,
      subtitle: buildSubtitle(domain),
      styles: {
        background: palette.background,
        color: palette.color,
        boxShadow: palette.shadow
      }
    }
  })
})

const progressColor = computed(() => {
  const percentage = normalizePercent(props.progress?.completion)
  if (percentage >= 80) {
    return '#22c55e'
  }
  if (percentage >= 50) {
    return '#3b82f6'
  }
  return '#f97316'
})

function buildSubtitle(domain) {
  if (domain?.categoryCount) {
    return `分类 ${domain.categoryCount}`
  }
  if (domain?.questionCount) {
    return `题库 ${domain.questionCount}`
  }
  return domain?.shortDescription || '探索关键知识点'
}

function handleSelect(domain) {
  emit('select', domain)
}

function normalizePercent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round(Number(value))))
}

function formatNumber(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '0'
  }
  return numberFormatter.format(Number(value))
}
</script>

<style scoped>
.recommendation-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: transparent;
  min-width: 0;
}

.panel-section {
  padding: 22px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(16px);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
  font-weight: 700;
}

.section-header p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.recommendation-card {
  border: none;
  border-radius: 20px;
  padding: 18px 16px;
  text-align: left;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.recommendation-card:hover,
.recommendation-card:focus-visible {
  transform: translateY(-4px);
  outline: none;
}

.card-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 12px;
}

.card-title {
  display: block;
  font-size: 16px;
}

.card-subtitle {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.85;
}

.progress-section {
  background: linear-gradient(160deg, rgba(59, 130, 246, 0.15) 0%, rgba(14, 165, 233, 0.08) 100%);
}

.progress-card {
  display: flex;
  gap: 20px;
  align-items: center;
}

.progress-chart {
  flex-shrink: 0;
}

.progress-percentage {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(80px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.detail-item .label {
  font-size: 12px;
  color: #64748b;
}

.detail-item .value {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.suggestion-section {
  background: linear-gradient(160deg, rgba(16, 185, 129, 0.12) 0%, rgba(45, 212, 191, 0.12) 100%);
}

.suggestion-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.suggestion-list li {
  display: flex;
  gap: 12px;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 16px;
  border-radius: 16px;
}

.suggestion-list .bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34d399 0%, #22d3ee 100%);
}

.suggestion-list .text {
  font-size: 14px;
  color: #0f172a;
}

.panel-skeleton {
  min-height: 540px;
}

@media (max-width: 1280px) {
  .recommendation-panel {
    flex-direction: row;
    gap: 16px;
  }

  .panel-section {
    flex: 1;
  }

  .progress-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 960px) {
  .recommendation-panel {
    flex-direction: column;
  }
}
</style>
