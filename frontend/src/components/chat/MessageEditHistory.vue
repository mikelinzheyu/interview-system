<template>
  <el-drawer
    v-model="visible"
    title="编辑历史"
    size="400px"
    :lock-scroll="false"
    destroy-on-close
    @close="emit('close')"
  >
    <template v-if="editHistory && editHistory.length > 0">
      <!-- 统计信息 -->
      <div class="message-edit-history__stats">
        <div class="message-edit-history__stat-item">
          <span class="message-edit-history__stat-label">总版本数：</span>
          <span class="message-edit-history__stat-value">{{ editHistory.length }}</span>
        </div>
        <div class="message-edit-history__stat-item">
          <span class="message-edit-history__stat-label">最后编辑：</span>
          <span class="message-edit-history__stat-value">
            {{ formatTime(editHistory[editHistory.length - 1].editedAt) }}
          </span>
        </div>
      </div>

      <!-- 版本列表 -->
      <div class="message-edit-history__list">
        <div
          v-for="(version, index) in sortedHistory"
          :key="index"
          class="message-edit-history__item"
          :class="{
            'is-latest': index === 0,
            'is-selected': selectedVersionIndex === index
          }"
          @click="selectVersion(index)"
        >
          <!-- 版本头 -->
          <div class="message-edit-history__item-header">
            <div class="message-edit-history__item-version">
              <span class="message-edit-history__badge">
                {{ editHistory.length - index }}
              </span>
              <span class="message-edit-history__version-label">
                {{ index === 0 ? '当前版本' : `版本 ${editHistory.length - index}` }}
              </span>
            </div>
            <span class="message-edit-history__item-time">
              {{ formatTime(version.editedAt) }}
            </span>
          </div>

          <!-- 版本内容 -->
          <div class="message-edit-history__item-content">
            {{ truncateContent(version.content) }}
          </div>

          <!-- 版本操作 -->
          <div v-if="index > 0" class="message-edit-history__item-actions">
            <el-button
              link
              text
              type="primary"
              size="small"
              @click.stop="handleCompare(index)"
            >
              对比
            </el-button>
            <el-divider direction="vertical"></el-divider>
            <el-button
              link
              text
              type="primary"
              size="small"
              @click.stop="handleRestore(version)"
            >
              恢复
            </el-button>
          </div>
        </div>
      </div>

      <!-- 版本详情 (选中时显示) -->
      <div v-if="selectedVersion" class="message-edit-history__detail">
        <div class="message-edit-history__detail-header">
          <h4>版本详情</h4>
          <el-button link text @click="selectedVersionIndex = -1" size="small">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <!-- 版本信息 -->
        <div class="message-edit-history__detail-info">
          <div class="message-edit-history__info-row">
            <span class="message-edit-history__info-label">版本：</span>
            <span class="message-edit-history__info-value">
              {{ editHistory.length - selectedVersionIndex }}
            </span>
          </div>
          <div class="message-edit-history__info-row">
            <span class="message-edit-history__info-label">编辑时间：</span>
            <span class="message-edit-history__info-value">
              {{ formatDetailTime(selectedVersion.editedAt) }}
            </span>
          </div>
          <div class="message-edit-history__info-row">
            <span class="message-edit-history__info-label">编辑者：</span>
            <span class="message-edit-history__info-value">
              {{ selectedVersion.editedBy || '未知用户' }}
            </span>
          </div>
        </div>

        <!-- 版本内容 -->
        <div class="message-edit-history__detail-content">
          <div class="message-edit-history__detail-label">内容：</div>
          <div class="message-edit-history__detail-text">
            {{ selectedVersion.content }}
          </div>
        </div>

        <!-- 恢复按钮 -->
        <div v-if="selectedVersionIndex > 0" class="message-edit-history__detail-actions">
          <el-button
            type="primary"
            size="small"
            @click="handleRestore(selectedVersion)"
            class="message-edit-history__restore-btn"
          >
            恢复此版本
          </el-button>
        </div>
      </div>

      <!-- 比较视图 -->
      <div v-if="compareMode && compareVersions" class="message-edit-history__compare">
        <div class="message-edit-history__compare-header">
          <h4>版本对比</h4>
          <el-button link text @click="compareMode = false" size="small">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="message-edit-history__compare-container">
          <!-- 左侧版本 -->
          <div class="message-edit-history__compare-panel">
            <div class="message-edit-history__compare-title">
              版本 {{ editHistory.length - compareVersions.fromIndex }}
              <span class="message-edit-history__compare-time">
                {{ formatTime(compareVersions.from.editedAt) }}
              </span>
            </div>
            <div class="message-edit-history__compare-content">
              {{ compareVersions.from.content }}
            </div>
          </div>

          <!-- 箭头 -->
          <div class="message-edit-history__compare-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>

          <!-- 右侧版本 -->
          <div class="message-edit-history__compare-panel">
            <div class="message-edit-history__compare-title">
              版本 {{ editHistory.length - compareVersions.toIndex }}
              <span class="message-edit-history__compare-time">
                {{ formatTime(compareVersions.to.editedAt) }}
              </span>
            </div>
            <div class="message-edit-history__compare-content">
              {{ compareVersions.to.content }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 无历史提示 -->
    <template v-else>
      <el-empty
        description="暂无编辑历史"
        :image-size="100"
      ></el-empty>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, ArrowRight } from '@element-plus/icons-vue'

/**
 * 消息编辑历史组件
 * 显示消息的编辑版本历史
 *
 * Props:
 * - visible: boolean - 是否显示抽屉
 * - editHistory: Array - 编辑历史数组
 *
 * Emits:
 * - update:visible - 更新可见性
 * - restore - 恢复版本事件
 * - close - 关闭抽屉
 */

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  editHistory: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'restore', 'close'])

// State
const selectedVersionIndex = ref(-1)
const compareMode = ref(false)
const compareVersions = ref(null)

// Computed
const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

/**
 * 反序排列历史（最新的在前）
 */
const sortedHistory = computed(() => {
  return [...props.editHistory].reverse()
})

/**
 * 获取选中的版本
 */
const selectedVersion = computed(() => {
  if (selectedVersionIndex.value === -1) return null
  return sortedHistory.value[selectedVersionIndex.value]
})

/**
 * 格式化时间 (简短格式)
 */
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()

  // 如果是今天，显示时分
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // 否则显示日期
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * 格式化详细时间
 */
function formatDetailTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * 截断内容显示
 */
function truncateContent(content) {
  if (!content) return ''
  const maxLength = 100
  return content.length > maxLength
    ? content.substring(0, maxLength) + '...'
    : content
}

/**
 * 选择版本
 */
function selectVersion(index) {
  selectedVersionIndex.value = selectedVersionIndex.value === index ? -1 : index
  compareMode.value = false
  compareVersions.value = null
}

/**
 * 处理版本对比
 */
function handleCompare(index) {
  compareMode.value = true
  compareVersions.value = {
    from: sortedHistory.value[index],
    to: sortedHistory.value[index - 1],
    fromIndex: index,
    toIndex: index - 1
  }
}

/**
 * 处理恢复版本
 */
function handleRestore(version) {
  ElMessage.confirm(
    `确定要恢复到此版本吗？`,
    '恢复版本',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      emit('restore', {
        version: version.version,
        content: version.content
      })
      ElMessage.success('已恢复')
      visible.value = false
    })
    .catch(() => {})
}
</script>

<style scoped>
.message-edit-history__stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.message-edit-history__stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.message-edit-history__stat-label {
  color: #909399;
  font-weight: 500;
}

.message-edit-history__stat-value {
  color: #303133;
  font-weight: 500;
}

.message-edit-history__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-edit-history__item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.message-edit-history__item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.message-edit-history__item.is-latest {
  border-color: #409eff;
  background: #f0f9ff;
}

.message-edit-history__item.is-selected {
  border-color: #409eff;
  background: #e6f7ff;
}

.message-edit-history__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-edit-history__item-version {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-edit-history__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 500;
}

.message-edit-history__version-label {
  font-size: 12px;
  color: #303133;
  font-weight: 500;
}

.message-edit-history__item-time {
  font-size: 11px;
  color: #909399;
}

.message-edit-history__item-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 60px;
  overflow: hidden;
}

.message-edit-history__item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  font-size: 12px;
}

.message-edit-history__detail {
  margin-top: 16px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.message-edit-history__detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.message-edit-history__detail-header h4 {
  margin: 0;
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.message-edit-history__detail-info {
  margin-bottom: 12px;
}

.message-edit-history__info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 11px;
}

.message-edit-history__info-label {
  color: #909399;
  font-weight: 500;
}

.message-edit-history__info-value {
  color: #303133;
  text-align: right;
  flex: 1;
  padding-left: 12px;
  word-break: break-word;
}

.message-edit-history__detail-content {
  margin-bottom: 12px;
}

.message-edit-history__detail-label {
  font-size: 11px;
  color: #909399;
  font-weight: 500;
  margin-bottom: 6px;
}

.message-edit-history__detail-text {
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 150px;
  overflow-y: auto;
}

.message-edit-history__detail-actions {
  margin-top: 12px;
}

.message-edit-history__restore-btn {
  width: 100%;
}

.message-edit-history__compare {
  margin-top: 16px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.message-edit-history__compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.message-edit-history__compare-header h4 {
  margin: 0;
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.message-edit-history__compare-container {
  display: flex;
  align-items: stretch;
  gap: 8px;
  max-height: 200px;
}

.message-edit-history__compare-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  min-width: 0;
}

.message-edit-history__compare-title {
  font-size: 11px;
  color: #303133;
  font-weight: 500;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ebeef5;
}

.message-edit-history__compare-time {
  display: block;
  font-size: 10px;
  color: #909399;
  font-weight: normal;
  margin-top: 2px;
}

.message-edit-history__compare-content {
  flex: 1;
  font-size: 11px;
  color: #606266;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
}

.message-edit-history__compare-arrow {
  display: flex;
  align-items: center;
  color: #409eff;
  font-size: 16px;
  flex-shrink: 0;
}

/* 滚动条美化 */
.message-edit-history__detail-text::-webkit-scrollbar,
.message-edit-history__compare-content::-webkit-scrollbar {
  width: 4px;
}

.message-edit-history__detail-text::-webkit-scrollbar-track,
.message-edit-history__compare-content::-webkit-scrollbar-track {
  background: transparent;
}

.message-edit-history__detail-text::-webkit-scrollbar-thumb,
.message-edit-history__compare-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.message-edit-history__detail-text::-webkit-scrollbar-thumb:hover,
.message-edit-history__compare-content::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-edit-history__compare-container {
    flex-direction: column;
  }

  .message-edit-history__compare-arrow {
    transform: rotate(90deg);
    margin: 8px 0;
  }
}
</style>
