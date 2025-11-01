<template>
  <div class="recommendation-panel-enhanced">
    <!-- Header with title and refresh button -->
    <div class="panel-header">
      <div class="header-left">
        <h3 class="panel-title">
          <i class="el-icon-star"></i> 为你推荐
        </h3>
        <span v-if="!loading" class="subtitle">{{ recommendations.length }} 个精选学科</span>
      </div>
      <el-button
        v-if="!loading"
        icon="Refresh"
        circle
        size="small"
        :loading="loading"
        @click="refreshRecommendations"
        class="refresh-btn"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
      <span class="loading-text">正在生成个性化推荐...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="el-icon-warning"></i>
      <p>推荐加载失败，请重试</p>
      <el-button size="small" @click="refreshRecommendations">重新加载</el-button>
    </div>

    <!-- Empty State -->
    <div v-else-if="recommendations.length === 0" class="empty-state">
      <div class="empty-illustration">📚</div>
      <p class="empty-text">暂无推荐</p>
      <p class="empty-description">完成您的用户档案后，将为您生成个性化推荐</p>
    </div>

    <!-- Recommendations List -->
    <div v-else class="recommendations-list">
      <transition-group name="fade-list" tag="div">
        <div
          v-for="(rec, index) in recommendations"
          :key="rec.domainId"
          class="recommendation-card"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- Score Badge -->
          <div class="score-badge" :class="`score-${getScoreLevel(rec.score)}`">
            <span class="score-value">{{ rec.score }}</span>
            <span class="score-label">匹配度</span>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <!-- Header -->
            <div class="card-header">
              <h4 class="domain-name">{{ rec.domainName }}</h4>
              <el-tag
                v-if="rec.isPrerequisite"
                type="warning"
                size="small"
                class="prerequisite-tag"
              >
                前置课程
              </el-tag>
            </div>

            <!-- Reason -->
            <p class="recommendation-reason">
              <i class="el-icon-info"></i>
              {{ rec.reason }}
            </p>

            <!-- Matched Attributes -->
            <div v-if="rec.matchedAttributes.length > 0" class="matched-attributes">
              <el-tag
                v-for="attr in rec.matchedAttributes"
                :key="attr"
                type="info"
                size="small"
                effect="light"
              >
                {{ attr }}
              </el-tag>
            </div>

            <!-- Score Breakdown -->
            <div class="score-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">内容匹配</span>
                <el-progress
                  :percentage="rec.contentSimilarity"
                  :color="getProgressColor(rec.contentSimilarity)"
                  size="small"
                />
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">协作过滤</span>
                <el-progress
                  :percentage="rec.collaborativeSimilarity"
                  :color="getProgressColor(rec.collaborativeSimilarity)"
                  size="small"
                />
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">热门度</span>
                <el-progress
                  :percentage="rec.trendingScore"
                  :color="getProgressColor(rec.trendingScore)"
                  size="small"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <el-button
                size="small"
                @click="selectDomain(rec.domainId)"
                class="action-btn primary"
              >
                <i class="el-icon-check"></i> 选择这个学科
              </el-button>
              <el-button
                v-if="!isLiked(rec.domainId)"
                size="small"
                @click="likeDomain(rec.domainId)"
                class="action-btn"
              >
                <i class="el-icon-star"></i> 喜欢
              </el-button>
              <el-button
                v-else
                size="small"
                @click="unlikeDomain(rec.domainId)"
                class="action-btn active"
              >
                <i class="el-icon-star"></i> 已喜欢
              </el-button>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- View More Button -->
    <div v-if="recommendations.length > 0" class="view-more">
      <el-button text @click="viewAllRecommendations">
        查看更多推荐 →
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDomainStore } from '@/stores/domain'
import { ElMessage } from 'element-plus'

const props = defineProps({
  count: {
    type: Number,
    default: 6
  },
  showBreakdown: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['domain-selected', 'view-all'])

const store = useDomainStore()

const loading = computed(() => store.recommendationsLoading)
const error = computed(() => store.recommendationsError)
const recommendations = computed(() => store.recommendations.slice(0, props.count))

/**
 * Get score level for styling
 */
const getScoreLevel = (score) => {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

/**
 * Get progress bar color based on percentage
 */
const getProgressColor = (percentage) => {
  if (percentage >= 70) return '#67c23a'
  if (percentage >= 40) return '#e6a23c'
  return '#f56c6c'
}

/**
 * Check if domain is in user's liked list
 */
const isLiked = (domainId) => {
  return store.userProfile?.likedDomainIds?.includes(domainId) || false
}

/**
 * Refresh recommendations
 */
const refreshRecommendations = async () => {
  try {
    await store.generateRecommendations(props.count)
    ElMessage.success('推荐已刷新')
  } catch (err) {
    ElMessage.error('刷新推荐失败')
  }
}

/**
 * Select a domain
 */
const selectDomain = (domainId) => {
  const domain = store.domains.find(d => d.id === domainId)
  if (domain) {
    store.setCurrentDomain(domain)
    emit('domain-selected', domain)
    ElMessage.success(`已选择: ${domain.name}`)
  }
}

/**
 * Like a domain
 */
const likeDomain = (domainId) => {
  store.addLikedDomain(domainId)
  ElMessage.success('已添加到喜欢')
}

/**
 * Unlike a domain
 */
const unlikeDomain = (domainId) => {
  store.removeLikedDomain(domainId)
  ElMessage.success('已取消喜欢')
}

/**
 * View all recommendations
 */
const viewAllRecommendations = () => {
  emit('view-all')
}

// Load recommendations on mount
onMounted(async () => {
  if (recommendations.value.length === 0) {
    await refreshRecommendations()
  }
})
</script>

<style scoped>
.recommendation-panel-enhanced {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.recommendation-panel-enhanced:hover {
  box-shadow: 0 8px 24px rgba(94, 124, 224, 0.12);
  border-color: rgba(94, 124, 224, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.header-left {
  flex: 1;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-title i {
  color: #5e7ce0;
  font-size: 24px;
}

.subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
  display: inline-block;
}

.refresh-btn {
  background: rgba(94, 124, 224, 0.1);
  border: 1px solid rgba(94, 124, 224, 0.3);
  color: #5e7ce0;
}

.refresh-btn:hover {
  background: rgba(94, 124, 224, 0.2);
  border-color: #5e7ce0;
  color: #3c4dc0;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
  padding: 20px;
}

.loading-text {
  margin-top: 16px;
  color: #6b7280;
  font-size: 13px;
  animation: pulse 1.5s ease-in-out infinite;
}

.error-state i {
  font-size: 32px;
  color: #f56c6c;
  margin-bottom: 12px;
}

.error-state p {
  color: #6b7280;
  margin: 8px 0;
}

.empty-illustration {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

/* Recommendations List */
.recommendations-list {
  display: grid;
  gap: 16px;
}

.recommendation-card {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 249, 250, 0.8) 100%);
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInFade 0.3s ease-out forwards;
  opacity: 0;
}

@keyframes slideInFade {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recommendation-card:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(94, 124, 224, 0.3);
  box-shadow: 0 6px 16px rgba(94, 124, 224, 0.08);
  transform: translateY(-2px);
}

.score-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  height: 70px;
  border-radius: 10px;
  font-weight: 700;
  text-align: center;
  background: rgba(94, 124, 224, 0.1);
  border: 2px solid rgba(94, 124, 224, 0.3);
  color: #5e7ce0;
}

.score-badge.score-high {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.15) 0%, rgba(131, 220, 110, 0.1) 100%);
  border-color: rgba(103, 194, 58, 0.4);
  color: #67c23a;
}

.score-badge.score-medium {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.15) 0%, rgba(245, 200, 120, 0.1) 100%);
  border-color: rgba(230, 162, 60, 0.4);
  color: #e6a23c;
}

.score-badge.score-low {
  background: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.3);
  color: #f56c6c;
}

.score-value {
  font-size: 24px;
  line-height: 1;
  margin-bottom: 2px;
}

.score-label {
  font-size: 11px;
  opacity: 0.8;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.domain-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

.prerequisite-tag {
  white-space: nowrap;
  font-size: 11px;
}

.recommendation-reason {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.5;
}

.recommendation-reason i {
  font-size: 14px;
  color: #9ca3af;
  flex-shrink: 0;
}

.matched-attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.matched-attributes :deep(.el-tag) {
  font-size: 11px;
  height: 22px;
  line-height: 20px;
}

.score-breakdown {
  background: rgba(245, 247, 250, 0.6);
  padding: 10px;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.breakdown-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.breakdown-item :deep(.el-progress) {
  min-width: 80px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.action-btn {
  font-size: 12px;
  height: 28px;
  padding: 0 10px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #5e7ce0 0%, #3c4dc0 100%);
  border: none;
  color: white;
  flex: 1;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #3c4dc0 0%, #2a37a0 100%);
}

.action-btn {
  background: rgba(94, 124, 224, 0.05);
  border: 1px solid rgba(94, 124, 224, 0.2);
  color: #5e7ce0;
}

.action-btn:hover {
  background: rgba(94, 124, 224, 0.1);
  border-color: rgba(94, 124, 224, 0.4);
}

.action-btn.active {
  background: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.3);
  color: #67c23a;
}

.action-btn.active:hover {
  background: rgba(103, 194, 58, 0.15);
  border-color: #67c23a;
}

.view-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(229, 230, 235, 0.4);
}

.view-more :deep(.el-button) {
  color: #5e7ce0;
}

/* Fade List Animation */
.fade-list-enter-active,
.fade-list-leave-active {
  transition: all 0.3s ease;
}

.fade-list-enter-from,
.fade-list-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.fade-list-move {
  transition: transform 0.3s ease;
}

/* Pulse Animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .recommendation-panel-enhanced {
    padding: 16px;
  }

  .recommendation-card {
    grid-template-columns: 60px 1fr;
    gap: 12px;
    padding: 12px;
  }

  .score-badge {
    min-width: 60px;
    height: 60px;
  }

  .score-value {
    font-size: 20px;
  }

  .domain-name {
    font-size: 14px;
  }

  .score-breakdown {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .card-actions {
    gap: 6px;
  }

  .action-btn {
    flex: 1;
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .recommendation-card {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .score-badge {
    width: 100%;
    min-width: auto;
  }

  .card-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
