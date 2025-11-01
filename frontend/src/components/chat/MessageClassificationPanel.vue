<template>
  <div class="classification-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h3 class="panel-title">🏷️ 智能分类</h3>
      <span class="stat-badge">{{ classifications.length }} 条分类</span>
    </div>

    <!-- 分类统计 -->
    <div class="stats-grid">
      <div
        v-for="(count, category) in stats"
        :key="category"
        class="stat-item"
        :class="{ active: selectedCategory === category }"
        @click="selectedCategory = selectedCategory === category ? null : category"
      >
        <div class="stat-icon">{{ getCategoryIcon(category) }}</div>
        <div class="stat-info">
          <div class="stat-label">{{ getCategoryLabel(category) }}</div>
          <div class="stat-count">{{ count }}</div>
        </div>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="classifications-list">
      <template v-if="filteredClassifications.length > 0">
        <div
          v-for="classification in filteredClassifications"
          :key="classification.messageId"
          class="classification-item"
        >
          <!-- 分类标签 -->
          <div class="classification-tags">
            <el-tag
              v-for="category in classification.categories"
              :key="category.name"
              size="small"
              :color="getCategoryColor(category.name)"
              @close="handleRejectCategory(classification.messageId, category.name)"
              closable
            >
              {{ getCategoryLabel(category.name) }}
              <span class="confidence">({{ (category.confidence * 100).toFixed(0) }}%)</span>
            </el-tag>
          </div>

          <!-- 接受/拒绝按钮 -->
          <div class="classification-actions">
            <el-button
              type="success"
              link
              text
              size="small"
              @click="handleAcceptAll(classification.messageId)"
            >
              接受全部
            </el-button>
            <el-button
              type="danger"
              link
              text
              size="small"
              @click="handleRejectAll(classification.messageId)"
            >
              拒绝全部
            </el-button>
            <el-button
              type="primary"
              link
              text
              size="small"
              @click="handleViewMessage(classification.messageId)"
            >
              查看
            </el-button>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <el-empty
        v-else
        description="暂无分类数据"
        :image-size="100"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  classifications: {
    type: Array,
    default: () => []
  },
  stats: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'accept-category',
  'reject-category',
  'view-message'
])

const selectedCategory = ref(null)

// 分类配置
const categoryConfig = {
  question: { label: '问题', icon: '❓', color: '#409EFF' },
  code_snippet: { label: '代码', icon: '💻', color: '#67C23A' },
  important: { label: '重要', icon: '⭐', color: '#F56C6C' },
  announcement: { label: '公告', icon: '📢', color: '#E6A23C' },
  media: { label: '媒体', icon: '🖼️', color: '#909399' },
  document: { label: '文档', icon: '📄', color: '#606266' },
  action_required: { label: '待办', icon: '✓', color: '#409EFF' },
  completed: { label: '已完成', icon: '✔️', color: '#67C23A' }
}

// 过滤后的分类
const filteredClassifications = computed(() => {
  if (!selectedCategory.value) return props.classifications

  return props.classifications.filter(c =>
    c.categories.some(cat => cat.name === selectedCategory.value)
  )
})

/**
 * 获取分类图标
 */
function getCategoryIcon(category) {
  return categoryConfig[category]?.icon || '🏷️'
}

/**
 * 获取分类标签
 */
function getCategoryLabel(category) {
  return categoryConfig[category]?.label || category
}

/**
 * 获取分类颜色
 */
function getCategoryColor(category) {
  return categoryConfig[category]?.color || '#409EFF'
}

/**
 * 接受所有分类
 */
function handleAcceptAll(messageId) {
  const classification = props.classifications.find(c => c.messageId === messageId)
  if (classification) {
    classification.categories.forEach(cat => {
      emit('accept-category', messageId, cat.name)
    })
  }
  ElMessage.success('已接受分类')
}

/**
 * 拒绝所有分类
 */
function handleRejectAll(messageId) {
  const classification = props.classifications.find(c => c.messageId === messageId)
  if (classification) {
    classification.categories.forEach(cat => {
      emit('reject-category', messageId, cat.name)
    })
  }
  ElMessage.success('已拒绝分类')
}

/**
 * 拒绝单个分类
 */
function handleRejectCategory(messageId, category) {
  emit('reject-category', messageId, category)
  ElMessage.success('已拒绝分类')
}

/**
 * 查看消息
 */
function handleViewMessage(messageId) {
  emit('view-message', messageId)
  ElMessage.info('正在查看消息...')
}
</script>

<style scoped>
.classification-panel {
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

.stat-badge {
  font-size: 12px;
  color: #909399;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 3px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.stat-item:hover {
  background: #e6f7ff;
}

.stat-item.active {
  background: #409EFF;
  color: white;
}

.stat-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.stat-info {
  min-width: 0;
}

.stat-label {
  font-size: 11px;
  opacity: 0.8;
}

.stat-count {
  font-size: 14px;
  font-weight: 600;
}

.classifications-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
}

.classification-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409EFF;
}

.classification-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.classification-tags :deep(.el-tag) {
  font-size: 12px;
}

.confidence {
  font-size: 10px;
  opacity: 0.8;
}

.classification-actions {
  display: flex;
  gap: 8px;
}

.classification-actions :deep(.el-button) {
  font-size: 12px;
}

/* 滚动条 */
.classifications-list::-webkit-scrollbar {
  width: 6px;
}

.classifications-list::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.classifications-list::-webkit-scrollbar-thumb {
  background: #d3d4d6;
  border-radius: 3px;
}

.classifications-list::-webkit-scrollbar-thumb:hover {
  background: #a6a7ab;
}
</style>
