<template>
  <div class="learning-style-analysis">
    <!-- Learning Style Chart -->
    <div class="style-chart-section">
      <h4 class="section-title">学习风格分析</h4>

      <div class="style-distribution">
        <div
          v-for="(score, style) in styleScores"
          :key="style"
          class="style-item"
          :class="{ dominant: dominantStyle === style }"
        >
          <div class="style-header">
            <span class="style-icon">{{ getStyleIcon(style) }}</span>
            <span class="style-name">{{ getStyleLabel(style) }}</span>
          </div>

          <div class="style-progress">
            <el-progress
              :percentage="score"
              :color="getStyleColor(style)"
              :show-text="false"
            />
            <span class="style-percentage">{{ score }}%</span>
          </div>

          <p class="style-description">{{ getStyleDescription(style) }}</p>
        </div>
      </div>

      <div class="dominant-badge">
        <span class="badge-icon">🎯</span>
        <span class="badge-text">你的主要学习风格是：<strong>{{ getDominantLabel(dominantStyle) }}</strong></span>
      </div>
    </div>

    <!-- Recommendations -->
    <div class="recommendations-section">
      <h4 class="section-title">为你推荐的学习方式</h4>

      <div class="recommendations-grid">
        <div
          v-for="(rec, idx) in recommendations"
          :key="idx"
          class="recommendation-item"
        >
          <div class="rec-icon">{{ rec.icon }}</div>
          <div class="rec-content">
            <h5 class="rec-title">{{ rec.title }}</h5>
            <p class="rec-description">{{ rec.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Type Preferences -->
    <div class="content-preferences">
      <h4 class="section-title">内容格式偏好</h4>

      <div class="preference-list">
        <div
          v-for="(pref, idx) in contentPreferences"
          :key="idx"
          class="preference-item"
        >
          <div class="preference-check">
            <input
              type="checkbox"
              :id="`pref-${idx}`"
              :checked="pref.preferred"
              @change="updatePreference(idx)"
              class="preference-checkbox"
            />
            <label :for="`pref-${idx}`" class="preference-label">
              <span class="pref-icon">{{ pref.icon }}</span>
              <span class="pref-name">{{ pref.name }}</span>
              <span class="pref-match" v-if="pref.matchScore > 0">
                匹配度 {{ pref.matchScore }}%
              </span>
            </label>
          </div>

          <el-progress
            :percentage="pref.matchScore"
            :color="getMatchColor(pref.matchScore)"
            :show-text="false"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Learning Tips -->
    <div class="tips-section">
      <h4 class="section-title">📚 学习建议</h4>

      <div class="tips-list">
        <div
          v-for="(tip, idx) in learningTips"
          :key="idx"
          class="tip-item"
        >
          <div class="tip-number">{{ idx + 1 }}</div>
          <div class="tip-content">
            <h5 class="tip-title">{{ tip.title }}</h5>
            <p class="tip-description">{{ tip.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import mlRecommendationService from '@/services/mlRecommendationService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const styleScores = ref({})
const dominantStyle = ref('')
const recommendations = ref([])
const contentPreferences = ref([])
const learningTips = ref([])

// Methods
const loadLearningStyle = () => {
  const analysis = mlRecommendationService.detectLearningStyle(props.userId)
  styleScores.value = analysis.scores
  dominantStyle.value = analysis.dominant
  recommendations.value = analysis.recommendations.map((rec, idx) => ({
    title: rec,
    description: getRecommendationDescription(idx),
    icon: getRecommendationIcon(idx)
  }))
}

const getStyleIcon = (style) => {
  const icons = {
    visual: '👁️',
    auditory: '👂',
    kinesthetic: '🤲',
    reading_writing: '📝'
  }
  return icons[style] || '📚'
}

const getStyleLabel = (style) => {
  const labels = {
    visual: '视觉学习',
    auditory: '听觉学习',
    kinesthetic: '运动学习',
    reading_writing: '阅读/写作学习'
  }
  return labels[style] || '其他'
}

const getStyleDescription = (style) => {
  const descriptions = {
    visual: '通过图表、图像和视频更好地理解概念',
    auditory: '通过听讲和讨论更好地学习',
    kinesthetic: '通过实践和动手操作更好地学习',
    reading_writing: '通过阅读和笔记更好地学习'
  }
  return descriptions[style] || '混合学习方式'
}

const getDominantLabel = (style) => {
  const labels = {
    visual: '视觉学习者',
    auditory: '听觉学习者',
    kinesthetic: '运动学习者',
    reading_writing: '阅读/写作学习者'
  }
  return labels[style] || '学习者'
}

const getStyleColor = (style) => {
  const colors = {
    visual: '#5e7ce0',
    auditory: '#e6a23c',
    kinesthetic: '#f56c6c',
    reading_writing: '#67c23a'
  }
  return colors[style] || '#909399'
}

const getRecommendationDescription = (idx) => {
  const descriptions = [
    '根据你的学习风格选择最佳内容格式',
    '与志同道合的学习者建立学习小组',
    '定期回顾和总结你的学习进度',
    '参加交互式活动和实践项目'
  ]
  return descriptions[idx] || ''
}

const getRecommendationIcon = (idx) => {
  const icons = ['✅', '👥', '📋', '🎯']
  return icons[idx] || '📚'
}

const getMatchColor = (score) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const updatePreference = (idx) => {
  contentPreferences.value[idx].preferred = !contentPreferences.value[idx].preferred
}

const initContentPreferences = () => {
  contentPreferences.value = [
    { name: '视频教程', icon: '🎥', matchScore: 90, preferred: true },
    { name: '在线课程', icon: '🎓', matchScore: 85, preferred: true },
    { name: '互动练习', icon: '💻', matchScore: 88, preferred: true },
    { name: '文章阅读', icon: '📖', matchScore: 70, preferred: false },
    { name: '播客', icon: '🎙️', matchScore: 65, preferred: false },
    { name: '实时讲座', icon: '🎤', matchScore: 75, preferred: true },
    { name: '笔记', icon: '📝', matchScore: 72, preferred: false },
    { name: '项目挑战', icon: '🏆', matchScore: 92, preferred: true }
  ]
}

const initLearningTips = () => {
  learningTips.value = [
    {
      title: '制定清晰的学习目标',
      description: '在开始学习之前，明确定义你想要学什么以及为什么。设置具体、可衡量的目标。'
    },
    {
      title: '坚持学习进度',
      description: '每周至少安排 3-4 天的学习时间。保持一致的节奏有助于形成学习习惯。'
    },
    {
      title: '使用多种学习资源',
      description: '结合视频、文章、实践项目等资源，以适应不同的学习场景。'
    },
    {
      title: '定期评估进度',
      description: '每周回顾你的学习进度，评估理解程度，调整学习策略。'
    },
    {
      title: '寻找学习伙伴',
      description: '与其他学习者交流、讨论，这有助于加深理解并保持动力。'
    }
  ]
}

onMounted(() => {
  loadLearningStyle()
  initContentPreferences()
  initLearningTips()
})
</script>

<style scoped>
.learning-style-analysis {
  padding: 16px 0;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

/* Style Chart Section */
.style-chart-section {
  margin-bottom: 24px;
}

.style-distribution {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.style-item {
  padding: 16px;
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  transition: all 0.3s;
}

.style-item:hover {
  border-color: rgba(94, 124, 224, 0.3);
  box-shadow: 0 2px 8px rgba(94, 124, 224, 0.1);
}

.style-item.dominant {
  border-color: rgba(94, 124, 224, 0.5);
  background: rgba(94, 124, 224, 0.05);
}

.style-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.style-icon {
  font-size: 20px;
}

.style-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.style-progress {
  margin-bottom: 8px;
}

.style-progress :deep(.el-progress) {
  margin-bottom: 6px;
}

.style-percentage {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  float: right;
}

.style-description {
  font-size: 11px;
  color: #6b7280;
  margin: 8px 0 0 0;
  line-height: 1.4;
}

.dominant-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%);
  border: 1px solid rgba(94, 124, 224, 0.2);
  border-radius: 6px;
}

.badge-icon {
  font-size: 20px;
}

.badge-text {
  font-size: 12px;
  color: #6b7280;
}

/* Recommendations Section */
.recommendations-section {
  margin-bottom: 24px;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
  border-left: 4px solid #5e7ce0;
}

.rec-icon {
  font-size: 24px;
  min-width: 32px;
  text-align: center;
}

.rec-content {
  flex: 1;
}

.rec-title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.rec-description {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

/* Content Preferences */
.content-preferences {
  margin-bottom: 24px;
}

.preference-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preference-item {
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.preference-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preference-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #5e7ce0;
}

.preference-label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  cursor: pointer;
  user-select: none;
}

.pref-icon {
  font-size: 16px;
}

.pref-name {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

.pref-match {
  font-size: 10px;
  color: #9ca3af;
  margin-left: auto;
}

/* Tips Section */
.tips-section {
  margin-bottom: 0;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
  border-left: 4px solid #FFD700;
  border-radius: 6px;
}

.tip-number {
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #FFD700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.tip-description {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .style-distribution {
    grid-template-columns: repeat(2, 1fr);
  }

  .recommendations-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .style-distribution {
    grid-template-columns: 1fr;
  }

  .dominant-badge {
    flex-direction: column;
    text-align: center;
  }

  .preference-label {
    flex-direction: column;
    align-items: flex-start;
  }

  .pref-match {
    margin-left: 0;
  }
}
</style>
