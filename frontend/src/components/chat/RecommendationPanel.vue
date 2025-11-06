<template>
  <div class="recommendation-panel">
    <!-- Panel Header -->
    <div class="panel-header">
      <h3>
        <el-icon><MagicStick /></el-icon>
        AI推荐 - Recommended for Review
      </h3>
      <el-button
        text
        icon="Refresh"
        @click="refreshRecommendations"
        :loading="loading"
      >
        更新推荐
      </el-button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="panel-body">
      <el-skeleton :rows="3" />
    </div>

    <!-- Recommendations List -->
    <div v-else-if="recommendations.length > 0" class="panel-body">
      <div v-for="(rec, idx) in recommendations" :key="idx" class="recommendation-item">
        <div class="rec-header">
          <span class="rec-title">{{ rec.questionTitle }}</span>
          <el-tag type="success" effect="light">{{ rec.recommendationReason }}</el-tag>
        </div>

        <div class="rec-meta">
          <span class="meta-item">
            <el-icon><DocumentCopy /></el-icon>
            {{ rec.source }}
          </span>
          <span class="meta-item">
            <el-icon><DataAnalysis /></el-icon>
            难度: {{ rec.difficulty }}
          </span>
          <span class="meta-item">
            <el-icon><WarningFilled /></el-icon>
            错{{ rec.wrongCount }}次
          </span>
        </div>

        <div class="rec-content">
          {{ rec.questionContent?.substring(0, 80) }}...
        </div>

        <div class="rec-actions">
          <el-button type="primary" size="small" @click="startReview(rec.id)">
            现在复习
          </el-button>
          <el-button size="small" @click="viewDetail(rec.id)">
            查看详情
          </el-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <el-icon class="empty-icon"><DocumentCopy /></el-icon>
      <p>暂无推荐</p>
      <p class="empty-desc">完成更多复习后将出现个性化推荐</p>
    </div>

    <!-- Weakness Analysis Section -->
    <div v-if="weaknessAnalysis" class="weakness-section">
      <h4>弱点分析</h4>
      <div class="weakness-list">
        <div
          v-for="weakness in weaknessAnalysis.topWeaknesses.slice(0, 3)"
          :key="weakness.name"
          class="weakness-item"
        >
          <div class="weakness-name">{{ weakness.name }}</div>
          <el-progress :percentage="weakness.masteryRate" />
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="panel-footer">
      <el-button @click="showAllRecommendations">查看全部推荐</el-button>
      <el-button type="primary" @click="generateOptimizedPlan">
        生成优化计划
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import messageAIRecommendationService from '@/services/messageAIRecommendationService'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { MagicStick, DocumentCopy, DataAnalysis, WarningFilled, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const store = useWrongAnswersStore()

const loading = ref(false)
const recommendations = ref([])
const weaknessAnalysis = ref(null)

const refreshRecommendations = async () => {
  loading.value = true
  try {
    // Get recommendations
    const recs = messageAIRecommendationService.generateLocalRecommendations(
      store.wrongAnswers,
      5
    )
    recommendations.value = recs.map((rec, idx) => ({
      ...rec,
      recommendationReason: getRecommendationReason(rec, idx)
    }))

    // Get weakness analysis
    weaknessAnalysis.value = messageAIRecommendationService.analyzeLocalWeaknesses(
      store.wrongAnswers
    )

    ElMessage.success('推荐已更新')
  } catch (error) {
    ElMessage.error('加载推荐失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const getRecommendationReason = (rec, index) => {
  const reasons = []

  if (rec.reviewStatus === 'unreveiwed') {
    reasons.push('新错题')
  } else if (rec.nextReviewTime && new Date(rec.nextReviewTime) <= new Date()) {
    reasons.push('应复习')
  }

  if (rec.wrongCount >= 3) {
    reasons.push('重点题')
  }

  if (rec.difficulty === 'hard') {
    reasons.push('难题')
  }

  return reasons.length > 0 ? reasons[0] : '推荐'
}

const startReview = (recordId) => {
  router.push({
    name: 'ReviewMode',
    params: { recordId }
  })
}

const viewDetail = (recordId) => {
  router.push({
    name: 'WrongAnswerDetail',
    params: { recordId }
  })
}

const showAllRecommendations = () => {
  router.push({ name: 'WrongAnswers' })
}

const generateOptimizedPlan = async () => {
  try {
    loading.value = true
    ElMessage.success('正在生成优化的复习计划...')
    // API call would go here
    setTimeout(() => {
      router.push({ name: 'AnalyticsDashboard' })
    }, 1000)
  } catch (error) {
    ElMessage.error('生成计划失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshRecommendations()
})
</script>

<style scoped lang="css">
.recommendation-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #409eff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-header :deep(.el-button) {
  color: white;
}

.panel-body {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.recommendation-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.recommendation-item:hover {
  background: #e6f6ff;
  transform: translateX(4px);
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.rec-title {
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.rec-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rec-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rec-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  color: #dcdfe6;
  margin-bottom: 15px;
}

.empty-state p {
  margin: 0;
}

.empty-desc {
  font-size: 12px;
  color: #909399;
}

.weakness-section {
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

.weakness-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
}

.weakness-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weakness-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weakness-name {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.panel-footer {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  justify-content: space-between;
}

/* Scrollbar styling */
.panel-body::-webkit-scrollbar {
  width: 6px;
}

.panel-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #bfbfbf;
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: #929292;
}
</style>
