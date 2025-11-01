<template>
  <div class="learning-insights">
    <!-- Header -->
    <div class="insights-header">
      <h3 class="insights-title">
        <i class="el-icon-s-promotion"></i> 学习洞察与建议
      </h3>
      <el-button
        icon="Refresh"
        circle
        size="small"
        @click="refreshInsights"
      />
    </div>

    <!-- Insights Grid -->
    <div v-if="sortedInsights.length > 0" class="insights-container">
      <!-- Insights by Type -->
      <div class="insights-section">
        <h4 class="section-title">💡 个性化建议</h4>
        <div class="insights-grid">
          <div
            v-for="insight in getInsightsByType('recommendation')"
            :key="insight.title"
            class="insight-card insight-recommendation"
            @click="selectInsight(insight)"
            :class="{ active: selectedInsight?.title === insight.title }"
          >
            <div class="insight-header">
              <span class="insight-icon">{{ insight.icon }}</span>
              <span class="priority-badge">优先级: {{ insight.priority }}</span>
            </div>
            <h5 class="insight-title">{{ insight.title }}</h5>
            <p class="insight-description">{{ insight.description }}</p>
            <div class="insight-action">
              <el-button size="small" type="primary" text>
                采取行动 →
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Strengths -->
      <div class="insights-section" v-if="getInsightsByType('strength').length > 0">
        <h4 class="section-title">🌟 优势领域</h4>
        <div class="insights-grid">
          <div
            v-for="insight in getInsightsByType('strength')"
            :key="insight.title"
            class="insight-card insight-strength"
            @click="selectInsight(insight)"
            :class="{ active: selectedInsight?.title === insight.title }"
          >
            <div class="insight-header">
              <span class="insight-icon">{{ insight.icon }}</span>
            </div>
            <h5 class="insight-title">{{ insight.title }}</h5>
            <p class="insight-description">{{ insight.description }}</p>
          </div>
        </div>
      </div>

      <!-- Weaknesses -->
      <div class="insights-section" v-if="getInsightsByType('weakness').length > 0">
        <h4 class="section-title">⚠️ 需要改进</h4>
        <div class="insights-grid">
          <div
            v-for="insight in getInsightsByType('weakness')"
            :key="insight.title"
            class="insight-card insight-weakness"
            @click="selectInsight(insight)"
            :class="{ active: selectedInsight?.title === insight.title }"
          >
            <div class="insight-header">
              <span class="insight-icon">{{ insight.icon }}</span>
            </div>
            <h5 class="insight-title">{{ insight.title }}</h5>
            <p class="insight-description">{{ insight.description }}</p>
            <div class="suggestion">
              <strong>建议:</strong> 花更多时间在这个领域的练习和复习上
            </div>
          </div>
        </div>
      </div>

      <!-- Milestones -->
      <div class="insights-section" v-if="getInsightsByType('milestone').length > 0">
        <h4 class="section-title">🏆 里程碑</h4>
        <div class="milestones-list">
          <div
            v-for="insight in getInsightsByType('milestone')"
            :key="insight.title"
            class="milestone-item"
            @click="selectInsight(insight)"
            :class="{ active: selectedInsight?.title === insight.title }"
          >
            <div class="milestone-icon">{{ insight.icon }}</div>
            <div class="milestone-content">
              <h5 class="milestone-title">{{ insight.title }}</h5>
              <p class="milestone-description">{{ insight.description }}</p>
            </div>
            <div class="milestone-badge">已解锁</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📊</div>
      <p class="empty-text">暂无学习洞察。开始学习后，我们会为你生成个性化的建议。</p>
    </div>

    <!-- Detailed Insight Modal -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`${selectedInsight?.icon} ${selectedInsight?.title}`"
      width="500px"
    >
      <div v-if="selectedInsight" class="insight-detail">
        <div class="detail-section">
          <h4>概述</h4>
          <p>{{ selectedInsight.description }}</p>
        </div>

        <div class="detail-section">
          <h4>类型</h4>
          <el-tag :type="getInsightTagType(selectedInsight.type)">
            {{ getInsightTypeLabel(selectedInsight.type) }}
          </el-tag>
        </div>

        <div class="detail-section">
          <h4>优先级</h4>
          <el-progress
            :percentage="selectedInsight.priority"
            :color="getProgressColor(selectedInsight.priority)"
          />
          <small>{{ selectedInsight.priority }}/100</small>
        </div>

        <!-- Recommendations for Improvement -->
        <div v-if="selectedInsight.type === 'weakness'" class="detail-section">
          <h4>改进方案</h4>
          <ul class="recommendation-list">
            <li>📚 复习该学科的基础概念</li>
            <li>🎯 做针对性练习</li>
            <li>⏰ 分配更多学习时间</li>
            <li>💬 查找相关学习资源</li>
            <li>🤝 与他人讨论难点</li>
          </ul>
        </div>

        <!-- Action Items for Recommendations -->
        <div v-if="selectedInsight.type === 'recommendation'" class="detail-section">
          <h4>立即行动</h4>
          <ul class="action-list">
            <li v-for="(action, idx) in getRecommendationActions(selectedInsight)" :key="idx">
              {{ action }}
            </li>
          </ul>
        </div>

        <!-- Celebrate Milestone -->
        <div v-if="selectedInsight.type === 'milestone'" class="detail-section celebration">
          <h4>🎉 恭喜!</h4>
          <p>你已经达成了这个里程碑。继续保持这个势头！</p>
        </div>

        <!-- Strengthen Strength -->
        <div v-if="selectedInsight.type === 'strength'" class="detail-section">
          <h4>继续优化</h4>
          <ul class="optimize-list">
            <li>🎓 深入学习该领域的高级话题</li>
            <li>🧠 总结学习笔记，加深理解</li>
            <li>🌐 帮助他人学习该领域</li>
            <li>📖 阅读相关的进阶材料</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="applyInsightAction">应用建议</el-button>
      </template>
    </el-dialog>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat-item">
        <span class="stat-label">总洞察数</span>
        <span class="stat-value">{{ insights.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">高优先级</span>
        <span class="stat-value">{{ insights.filter(i => i.priority >= 80).length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">需要关注</span>
        <span class="stat-value">{{ insights.filter(i => i.type === 'weakness').length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">优势领域</span>
        <span class="stat-value">{{ insights.filter(i => i.type === 'strength').length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import analyticsService from '@/services/analyticsService'

// Props
const props = defineProps({
  metrics: {
    type: Object,
    default: () => ({})
  },
  velocity: {
    type: Object,
    default: () => ({})
  }
})

// Refs
const insights = ref([])
const selectedInsight = ref(null)
const showDetailDialog = ref(false)

// Computed
const sortedInsights = computed(() => {
  return [...insights.value].sort((a, b) => b.priority - a.priority)
})

// Methods
const getInsightsByType = (type) => {
  return sortedInsights.value.filter(i => i.type === type)
}

const selectInsight = (insight) => {
  selectedInsight.value = insight
  showDetailDialog.value = true
}

const getInsightTagType = (type) => {
  const typeMap = {
    strength: 'success',
    weakness: 'danger',
    recommendation: 'warning',
    milestone: 'info'
  }
  return typeMap[type] || 'info'
}

const getInsightTypeLabel = (type) => {
  const labelMap = {
    strength: '优势',
    weakness: '需要改进',
    recommendation: '建议',
    milestone: '里程碑'
  }
  return labelMap[type] || '未知'
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getRecommendationActions = (insight) => {
  // Generate contextual actions based on insight
  const actions = []

  if (insight.description.includes('加快学习')) {
    actions.push('✅ 设置每日学习计划')
    actions.push('⏰ 安排固定学习时间')
    actions.push('📊 跟踪学习进度')
  } else if (insight.description.includes('复习基础')) {
    actions.push('📚 查找基础课程')
    actions.push('✏️ 做复习题')
    actions.push('📝 记录笔记')
  } else if (insight.description.includes('即将完成')) {
    actions.push('🎯 完成剩余题目')
    actions.push('✨ 总结学习成果')
    actions.push('🏆 标记为完成')
  }

  return actions.length > 0 ? actions : ['按照建议采取行动']
}

const applyInsightAction = () => {
  ElMessage.success('建议已应用！')
  showDetailDialog.value = false
}

const refreshInsights = () => {
  if (props.metrics && props.velocity) {
    insights.value = analyticsService.generateInsights(props.metrics, props.velocity)
    ElMessage.success('洞察已刷新')
  } else {
    ElMessage.warning('没有足够的数据生成洞察')
  }
}

// Initialize on component mount
import { onMounted } from 'vue'
onMounted(() => {
  refreshInsights()
})
</script>

<style scoped>
.learning-insights {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.insights-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.insights-title i {
  color: #5e7ce0;
  font-size: 24px;
}

.insights-container {
  margin-bottom: 24px;
}

.insights-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding: 0;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.insight-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
  border: 2px solid rgba(229, 230, 235, 0.4);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: rgba(94, 124, 224, 0.3);
}

.insight-card.active {
  border-color: #5e7ce0;
  box-shadow: 0 8px 16px rgba(94, 124, 224, 0.2);
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
}

.insight-card.insight-recommendation {
  border-left: 4px solid #e6a23c;
}

.insight-card.insight-strength {
  border-left: 4px solid #67c23a;
}

.insight-card.insight-weakness {
  border-left: 4px solid #f56c6c;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.insight-icon {
  font-size: 28px;
}

.priority-badge {
  font-size: 11px;
  background: rgba(94, 124, 224, 0.1);
  color: #5e7ce0;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.insight-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.insight-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.insight-action {
  margin-top: auto;
}

.suggestion {
  font-size: 12px;
  color: #6b7280;
  background: rgba(245, 167, 108, 0.1);
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
  border: 2px solid rgba(94, 124, 224, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.milestone-item:hover {
  border-color: #5e7ce0;
  box-shadow: 0 4px 12px rgba(94, 124, 224, 0.1);
  transform: translateX(4px);
}

.milestone-item.active {
  border-color: #5e7ce0;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
}

.milestone-icon {
  font-size: 32px;
  min-width: 40px;
  text-align: center;
}

.milestone-content {
  flex: 1;
}

.milestone-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.milestone-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.milestone-badge {
  background: linear-gradient(135deg, #67c23a, #55bf61);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  align-self: center;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  color: #9ca3af;
  font-size: 14px;
}

.insight-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  border-bottom: 1px solid rgba(229, 230, 235, 0.4);
  padding-bottom: 16px;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.detail-section p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.recommendation-list,
.action-list,
.optimize-list {
  margin: 0;
  padding-left: 20px;
  color: #6b7280;
  font-size: 13px;
}

.recommendation-list li,
.action-list li,
.optimize-list li {
  margin-bottom: 8px;
}

.celebration {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(94, 124, 224, 0.05) 100%);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.celebration h4 {
  color: #67c23a;
  font-size: 18px;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding: 16px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
  margin-top: 24px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #5e7ce0;
}

/* Responsive */
@media (max-width: 768px) {
  .learning-insights {
    padding: 16px;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .insights-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
