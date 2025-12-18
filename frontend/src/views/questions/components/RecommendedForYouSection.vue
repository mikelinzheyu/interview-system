<template>
  <div class="recommended-section">
    <div class="section-header">
      <h2 class="section-title">为您推荐</h2>
      <p class="section-subtitle">根据学习进度与兴趣，优先安排值得投入的领域</p>
    </div>

    <el-skeleton v-if="loading" animated :rows="6" />

    <template v-else>
      <div v-if="resolvedContinueCard" class="continue-study-container">
        <div class="continue-card">
          <div class="card-background" :style="{ background: resolvedContinueCard.gradient }"></div>
          <div class="card-content">
            <div class="badge">继续学习</div>
            <h3 class="card-title">{{ resolvedContinueCard.name }}</h3>
            <p class="card-description">{{ resolvedContinueCard.description }}</p>

            <div class="progress-section">
              <div class="progress-header">
                <span class="progress-label">学习进度</span>
                <span class="progress-percent">{{ resolvedContinueCard.progress }}%</span>
              </div>
              <el-progress
                :percentage="resolvedContinueCard.progress"
                :color="progressColor"
                :stroke-width="6"
              />
            </div>

            <div class="card-stats">
              <div class="stat">
                <span class="stat-number">{{ resolvedContinueCard.completedTopics }}</span>
                <span class="stat-label">已完成主题</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ resolvedContinueCard.questionsAnswered }}</span>
                <span class="stat-label">已做题目</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ resolvedContinueCard.accuracy }}%</span>
                <span class="stat-label">平均正确率</span>
              </div>
            </div>

            <el-button
              type="primary"
              size="large"
              class="continue-btn"
              @click="$emit('continue-learning', resolvedContinueCard.rawDomain)"
            >
              继续学习
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="hasRecommendations" class="recommended-grid">
        <div class="grid-header">
          <h3>推荐学科</h3>
          <span class="grid-count">{{ displayRecommendedDomains.length }} 个</span>
        </div>

        <div class="cards-container">
          <div
            v-for="domain in displayRecommendedDomains"
            :key="domain.id"
            class="recommendation-card"
            @click="$emit('select-domain', domain.rawDomain)"
          >
            <div class="card-visual">
              <div class="visual-bg" :style="{ backgroundColor: domain.color }"></div>
              <span class="visual-icon">{{ domain.icon }}</span>
            </div>

            <div class="card-info">
              <h4 class="card-name">{{ domain.name }}</h4>
              <p class="card-brief">{{ domain.description }}</p>

              <div class="card-footer">
                <span class="question-count">
                  <el-icon><DocumentCopy /></el-icon>
                  {{ domain.questionCount }} 道题
                </span>
                <span v-if="domain.newQuestionsCount" class="new-badge">
                  +{{ domain.newQuestionsCount }} 新题
                </span>
              </div>
            </div>

            <div class="card-hover-overlay">
              <el-button type="primary" text>
                开始学习
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂时没有推荐，先浏览全部学科试试" />

      <div class="learning-tips">
        <el-card shadow="hover" class="tip-card">
          <template #header>
            <div class="tip-header">
              <el-icon class="header-icon"><Opportunity /></el-icon>
              <span>学习小贴士</span>
            </div>
          </template>
          <div class="tips-list">
            <div class="tip-item">
              <span class="tip-number">1</span>
              <span>保持日更学习，30 分钟以上的高频练习比一次性刷题更有效。</span>
            </div>
            <div class="tip-item">
              <span class="tip-number">2</span>
              <span>组合使用「练习 + 复盘」，及时标记未掌握的知识点。</span>
            </div>
            <div class="tip-item">
              <span class="tip-number">3</span>
              <span>收藏重点题目，系统会优先安排巩固练习。</span>
            </div>
          </div>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight, DocumentCopy, Opportunity } from '@element-plus/icons-vue'

const props = defineProps({
  recommendedDomains: {
    type: Array,
    default: () => []
  },
  continueCard: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select-domain', 'continue-learning'])

const fallbackColors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#FFD166', '#6C5CE7', '#00B8D9']

const hasRecommendations = computed(() => props.recommendedDomains.length > 0)

const displayRecommendedDomains = computed(() =>
  props.recommendedDomains.map((domain, index) => ({
    id: domain.id,
    name: domain.name,
    description: domain.shortDescription || domain.description || '适合循序渐进提升的学习领域',
    color: domain.color || fallbackColors[index % fallbackColors.length],
    icon: domain.icon || '📘',
    questionCount: domain.questionCount ?? domain.stats?.total ?? 0,
    newQuestionsCount: domain.newQuestionsCount ?? domain.stats?.recent ?? 0,
    rawDomain: domain
  }))
)

const resolvedContinueCard = computed(() => {
  if (!props.continueCard && !displayRecommendedDomains.value.length) {
    return null
  }

  const source = props.continueCard || displayRecommendedDomains.value[0]
  if (!source) return null

  const domain = source.rawDomain || source
  const progress = Math.min(100, Math.max(0, Number(source.progress ?? domain?.progress?.completion ?? 0)))

  return {
    name: source.name,
    description: source.description,
    progress: Number.isFinite(progress) ? Math.round(progress) : 0,
    completedTopics: source.completedTopics ?? domain?.stats?.completedTopics ?? '--',
    questionsAnswered: source.questionsAnswered ?? domain?.stats?.attempts ?? '--',
    accuracy: source.accuracy ?? domain?.stats?.accuracy ?? '--',
    gradient: source.gradient || `linear-gradient(135deg, ${source.color || '#4ECDC4'} 0%, #1b9aaa 100%)`,
    rawDomain: domain
  }
})

const progressColor = computed(() => {
  const progress = resolvedContinueCard.value?.progress ?? 0
  if (progress >= 80) return '#67C23A'
  if (progress >= 50) return '#E6A23C'
  return '#F56C6C'
})
</script>

<style scoped lang="scss">
.recommended-section {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section-header {
  margin-bottom: 20px;

  .section-title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
  }

  .section-subtitle {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 14px;
  }
}

.continue-study-container {
  position: relative;
  animation: slideInLeft 0.4s ease-out;
}

.continue-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #1f2937;
  color: #ffffff;
  min-height: 240px;
  display: flex;
  align-items: stretch;
}

.card-background {
  position: absolute;
  inset: 0;
  opacity: 0.65;
}

.card-content {
  position: relative;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 1;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  letter-spacing: 1px;
}

.card-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.card-description {
  margin: 0;
  opacity: 0.85;
  line-height: 1.6;
  font-size: 14px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 13px;
  opacity: 0.85;
}

.progress-percent {
  font-size: 16px;
  font-weight: 600;
}

.card-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
}

.stat-label {
  font-size: 13px;
  opacity: 0.75;
}

.continue-btn {
  align-self: flex-start;
}

.recommended-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeInUp 0.5s ease-out 0.1s both;
}

.grid-header {
  display: flex;
  align-items: baseline;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  }

  .grid-count {
    font-size: 13px;
    color: #6b7280;
  }
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.recommendation-card {
  position: relative;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border: 1px solid #f3f4f6;
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
    border-color: rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* 卡片级联入场：前12个卡片 */
  @for $i from 0 through 11 {
    &:nth-child(#{$i + 1}) {
      animation-delay: #{$i * 0.05}s;
    }
  }
}

.card-visual {
  display: flex;
  align-items: center;
  gap: 12px;
}

.visual-bg {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  opacity: 0.8;
}

.visual-icon {
  position: relative;
  font-size: 28px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-brief {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
  min-height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4b5563;
  font-size: 13px;
}

.question-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.new-badge {
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  border-radius: 999px;
  font-size: 12px;
}

.card-hover-overlay {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.04);
  opacity: 0;
  transition: opacity 0.2s ease;

  .recommendation-card:hover & {
    opacity: 1;
  }
}

.learning-tips {
  .tip-card {
    border-radius: 16px;
  }

  .tip-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1f2937;
  }

  .header-icon {
    font-size: 18px;
  }

  .tips-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .tip-item {
    display: flex;
    gap: 12px;
    color: #4b5563;
    line-height: 1.5;
  }

  .tip-number {
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.12);
    color: #2563eb;
    font-weight: 600;
  }
}

/* 动画关键帧 */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .continue-card {
    flex-direction: column;
  }

  .card-content {
    padding: 24px;
  }

  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
