<template>
  <div class="recommendation-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h3 class="panel-title">💡 推荐消息</h3>
      <div class="header-actions">
        <el-badge :value="recommendations.length" class="item">
          <el-button link text type="primary" size="small">
            {{ recommendations.length }} 条推荐
          </el-button>
        </el-badge>
        <el-button
          link
          text
          type="danger"
          size="small"
          @click="handleClearAll"
          v-if="recommendations.length > 0"
        >
          全部清除
        </el-button>
      </div>
    </div>

    <!-- 过滤选项 -->
    <div class="filter-section">
      <el-checkbox-group v-model="selectedTypes" size="small">
        <el-checkbox label="collection_similarity">相似内容</el-checkbox>
        <el-checkbox label="follow_up_needed">需要跟进</el-checkbox>
        <el-checkbox label="related_message">相关消息</el-checkbox>
        <el-checkbox label="important_from_vip">重要联系人</el-checkbox>
      </el-checkbox-group>
    </div>

    <!-- 推荐列表 -->
    <div class="recommendations-list">
      <template v-if="filteredRecommendations.length > 0">
        <div
          v-for="(rec, index) in filteredRecommendations"
          :key="rec.id"
          class="recommendation-item"
          :class="{ 'is-helpful': rec.helpful === true, 'is-unhelpful': rec.helpful === false }"
        >
          <!-- 推荐类型图标 -->
          <div class="rec-icon">
            {{ getTypeIcon(rec.type) }}
          </div>

          <!-- 推荐内容 -->
          <div class="rec-content">
            <!-- 推荐原因 -->
            <div class="rec-reason">
              {{ rec.reason }}
              <el-tag
                size="small"
                :type="getTypeTagType(rec.type)"
                style="margin-left: 8px"
              >
                {{ getTypeLabel(rec.type) }}
              </el-tag>
            </div>

            <!-- 相似度分数条 -->
            <div class="score-bar">
              <div class="score-label">
                相关性: {{ (rec.score * 100).toFixed(0) }}%
              </div>
              <el-progress
                :percentage="rec.score * 100"
                :color="getScoreColor(rec.score)"
                :show-text="false"
              />
            </div>

            <!-- 时间信息 -->
            <div class="rec-time">
              推荐于 {{ formatTime(rec.suggestedAt) }}
              <span v-if="rec.clickedAt" class="clicked-info">
                · 已点击 {{ formatTime(rec.clickedAt) }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="rec-actions">
            <!-- 反馈按钮 -->
            <div class="feedback-buttons">
              <el-button
                :type="rec.helpful === true ? 'success' : 'info'"
                link
                text
                size="small"
                @click="handleFeedback(rec.messageId, true)"
                title="这个推荐有帮助"
              >
                👍 有用
              </el-button>
              <el-button
                :type="rec.helpful === false ? 'danger' : 'info'"
                link
                text
                size="small"
                @click="handleFeedback(rec.messageId, false)"
                title="这个推荐没有帮助"
              >
                👎 无用
              </el-button>
            </div>

            <!-- 查看和弃用按钮 -->
            <div class="action-buttons">
              <el-button
                type="primary"
                link
                text
                size="small"
                @click="handleViewMessage(rec.messageId)"
              >
                查看
              </el-button>
              <el-button
                type="danger"
                link
                text
                size="small"
                @click="handleDismiss(rec.messageId)"
              >
                弃用
              </el-button>
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <el-empty
        v-else
        description="暂无推荐消息"
        :image-size="100"
      />
    </div>

    <!-- 统计信息 -->
    <div v-if="recommendations.length > 0" class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">总推荐</div>
          <div class="stat-value">{{ stats.totalGenerated }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">有用率</div>
          <div class="stat-value">{{ (stats.acceptanceRate * 100).toFixed(0) }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">点击率</div>
          <div class="stat-value">{{ (stats.clickRate * 100).toFixed(0) }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">已弃用</div>
          <div class="stat-value">{{ stats.totalDismissed }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  recommendations: {
    type: Array,
    default: () => []
  },
  stats: {
    type: Object,
    default: () => ({
      totalGenerated: 0,
      totalAccepted: 0,
      totalDismissed: 0,
      totalClicked: 0,
      acceptanceRate: 0,
      clickRate: 0
    })
  }
})

const emit = defineEmits([
  'view',
  'dismiss',
  'feedback',
  'clear-all'
])

// UI 状态
const selectedTypes = ref([
  'collection_similarity',
  'follow_up_needed',
  'related_message',
  'important_from_vip'
])

// 推荐类型配置
const typeConfig = {
  collection_similarity: {
    label: '相似内容',
    icon: '🎯',
    tagType: 'info'
  },
  follow_up_needed: {
    label: '需要跟进',
    icon: '⚠️',
    tagType: 'warning'
  },
  related_message: {
    label: '相关消息',
    icon: '🔗',
    tagType: 'primary'
  },
  important_from_vip: {
    label: '重要联系人',
    icon: '⭐',
    tagType: 'success'
  }
}

// 过滤后的推荐
const filteredRecommendations = computed(() => {
  return props.recommendations.filter(rec => {
    if (selectedTypes.value.length === 0) return true
    return selectedTypes.value.includes(rec.type)
  })
})

/**
 * 获取推荐类型图标
 */
function getTypeIcon(type) {
  return typeConfig[type]?.icon || '💡'
}

/**
 * 获取推荐类型标签
 */
function getTypeLabel(type) {
  return typeConfig[type]?.label || '推荐'
}

/**
 * 获取类型标签类型
 */
function getTypeTagType(type) {
  return typeConfig[type]?.tagType || 'info'
}

/**
 * 获取分数颜色
 */
function getScoreColor(score) {
  if (score >= 0.8) return '#67C23A'  // 绿色
  if (score >= 0.6) return '#409EFF'  // 蓝色
  if (score >= 0.4) return '#E6A23C'  // 橙色
  return '#F56C6C'  // 红色
}

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 反馈推荐
 */
function handleFeedback(messageId, isHelpful) {
  emit('feedback', messageId, isHelpful)
  const message = isHelpful ? '感谢您的反馈，这将帮助我们改进推荐' : '已记录您的反馈'
  ElMessage.info(message)
}

/**
 * 查看消息
 */
function handleViewMessage(messageId) {
  emit('view', messageId)
  ElMessage.info('正在查看推荐的消息...')
}

/**
 * 弃用推荐
 */
function handleDismiss(messageId) {
  emit('dismiss', messageId)
  ElMessage.success('已弃用推荐')
}

/**
 * 全部清除
 */
function handleClearAll() {
  ElMessage.confirm('确定要清除所有推荐吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('clear-all')
    ElMessage.success('已清除所有推荐')
  }).catch(() => {
    // 用户取消
  })
}
</script>

<style scoped>
.recommendation-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.filter-section :deep(.el-checkbox) {
  font-size: 12px;
  height: 24px;
}

.recommendations-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409EFF;
  transition: all 0.2s;
}

.recommendation-item:hover {
  background: #e6f7ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.recommendation-item.is-helpful {
  border-left-color: #67C23A;
}

.recommendation-item.is-unhelpful {
  border-left-color: #F56C6C;
  opacity: 0.7;
}

.rec-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rec-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rec-reason {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.rec-reason :deep(.el-tag) {
  font-size: 11px;
  height: 20px;
  line-height: 18px;
}

.score-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.score-label {
  font-size: 12px;
  color: #606266;
  width: 60px;
  flex-shrink: 0;
}

.score-bar :deep(.el-progress) {
  flex: 1;
}

.rec-time {
  font-size: 11px;
  color: #909399;
}

.clicked-info {
  margin-left: 4px;
}

.rec-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.feedback-buttons,
.action-buttons {
  display: flex;
  gap: 4px;
}

.feedback-buttons :deep(.el-button),
.action-buttons :deep(.el-button) {
  font-size: 11px;
  padding: 0 6px;
}

.stats-section {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border-top: 1px solid #ebeef5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: #909399;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 滚动条样式 */
.recommendations-list::-webkit-scrollbar {
  width: 6px;
}

.recommendations-list::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

.recommendations-list::-webkit-scrollbar-thumb {
  background: #d3d4d6;
  border-radius: 3px;
}

.recommendations-list::-webkit-scrollbar-thumb:hover {
  background: #a6a7ab;
}
</style>
