<template>
  <div class="message-marking-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h3 class="panel-title">🏷️ 消息标记</h3>
      <el-button
        link
        text
        type="primary"
        size="small"
        @click="showTagManager = true"
      >
        管理标签
      </el-button>
    </div>

    <!-- 标记统计 -->
    <div class="mark-statistics">
      <div
        v-for="(count, markType) in markStats"
        :key="markType"
        class="stat-item"
        @click="selectedMarkType = selectedMarkType === markType ? null : markType"
      >
        <div class="stat-icon">{{ getMarkIcon(markType) }}</div>
        <div class="stat-info">
          <div class="stat-label">{{ getMarkLabel(markType) }}</div>
          <div class="stat-count">{{ count }}</div>
        </div>
      </div>
    </div>

    <!-- 标签过滤 -->
    <div class="tag-filter">
      <el-checkbox
        v-model="showAllTags"
        label="全部"
        size="small"
        border
      />
      <el-checkbox
        v-for="tag in tags"
        :key="tag.id"
        v-model="selectedTags"
        :label="tag.id"
        size="small"
        border
      >
        <template #default>
          <span
            class="tag-label"
            :style="{ color: tag.color }"
          >
            {{ tag.name }}
          </span>
        </template>
      </el-checkbox>
    </div>

    <!-- 标记列表 -->
    <div class="marking-list">
      <div v-if="filteredMarkedMessages.length > 0">
        <!-- 按标记类型分组 -->
        <div
          v-for="markType in visibleMarkTypes"
          :key="markType"
          class="mark-section"
        >
          <div class="section-header">
            <span class="section-icon">{{ getMarkIcon(markType) }}</span>
            <span class="section-title">{{ getMarkLabel(markType) }}</span>
            <span class="section-count">({{ getMarkedCount(markType) }})</span>
          </div>

          <div class="section-content">
            <div
              v-for="messageId in getMessagesWithMark(markType)"
              :key="messageId"
              class="mark-item"
            >
              <!-- 消息内容 -->
              <div class="mark-message">
                <div class="message-text">
                  {{ getMessagePreview(messageId) }}
                </div>
                <!-- 标签 -->
                <div v-if="getMessageTags(messageId).length > 0" class="message-tags">
                  <el-tag
                    v-for="tag in getMessageTags(messageId)"
                    :key="tag.id"
                    size="small"
                    :style="{ backgroundColor: tag.color + '20', color: tag.color }"
                    closable
                    @close="handleRemoveTag(messageId, tag.id)"
                  >
                    {{ tag.name }}
                  </el-tag>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="mark-actions">
                <el-dropdown
                  size="small"
                  @command="(cmd) => handleAddTag(messageId, cmd)"
                >
                  <el-button link text size="small">
                    + 标签
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-for="tag in tags"
                        :key="tag.id"
                        :command="tag.id"
                      >
                        <span :style="{ color: tag.color }">⊙</span>
                        {{ tag.name }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button
                  link
                  text
                  size="small"
                  type="danger"
                  @click="handleUnmark(messageId, markType)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-else
        description="没有标记任何消息"
        :image-size="100"
      />
    </div>

    <!-- 标签管理弹窗 -->
    <TagManagementModal
      v-model:visible="showTagManager"
      :tags="tags"
      @create-tag="handleCreateTag"
      @update-tag="handleUpdateTag"
      @delete-tag="handleDeleteTag"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useMessageMarking } from '@/services/messageMarkingService'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import TagManagementModal from './TagManagementModal.vue'

const { marks, tags, getMarkedMessages, getMessageTags, markMessage, unmarkMessage, removeTag, addTag, createTag, updateTag, deleteTag } = useMessageMarking()

const store = useChatWorkspaceStore()

// UI 状态
const selectedMarkType = ref(null)
const selectedTags = ref([])
const showAllTags = ref(true)
const showTagManager = ref(false)

// 标记类型配置
const markTypes = {
  important: { label: '重要', icon: '⭐' },
  urgent: { label: '紧急', icon: '🔴' },
  todo: { label: '待做', icon: '✓' },
  done: { label: '完成', icon: '✔️' }
}

/**
 * 获取标记图标
 */
function getMarkIcon(markType) {
  return markTypes[markType]?.icon || '•'
}

/**
 * 获取标记标签
 */
function getMarkLabel(markType) {
  return markTypes[markType]?.label || markType
}

/**
 * 获取标记统计
 */
const markStats = computed(() => {
  const stats = {}
  Object.keys(markTypes).forEach(type => {
    stats[type] = getMarkedMessages(type).length
  })
  return stats
})

/**
 * 获取可见的标记类型
 */
const visibleMarkTypes = computed(() => {
  if (!selectedMarkType.value) {
    return Object.keys(markTypes)
  }
  return [selectedMarkType.value]
})

/**
 * 获取具有指定标记的消息
 */
function getMessagesWithMark(markType) {
  const markedIds = getMarkedMessages(markType)

  // 按标签筛选
  if (!showAllTags.value && selectedTags.value.length > 0) {
    return markedIds.filter(messageId => {
      const msgTags = getMessageTags(messageId)
      return selectedTags.value.some(tagId =>
        msgTags.some(tag => tag.id === tagId)
      )
    })
  }

  return markedIds
}

/**
 * 获取指定标记的数量
 */
function getMarkedCount(markType) {
  return getMessagesWithMark(markType).length
}

/**
 * 获取消息预览
 */
function getMessagePreview(messageId) {
  const message = store.getMessageById(messageId)
  if (!message) return '(消息已删除)'

  const text = message.content || '(空消息)'
  return text.length > 50 ? text.substring(0, 50) + '...' : text
}

/**
 * 取消标记
 */
function handleUnmark(messageId, markType) {
  unmarkMessage(messageId, markType)
  ElMessage.success(`已取消 ${getMarkLabel(markType)} 标记`)
}

/**
 * 添加标签
 */
function handleAddTag(messageId, tagId) {
  const tag = tags.find(t => t.id === tagId)
  if (tag) {
    addTag(messageId, tag)
  }
}

/**
 * 移除标签
 */
function handleRemoveTag(messageId, tagId) {
  removeTag(messageId, tagId)
  ElMessage.success('已移除标签')
}

/**
 * 创建标签
 */
function handleCreateTag(name, color) {
  const newTag = createTag(name, color)
  if (newTag) {
    ElMessage.success(`已创建标签: ${name}`)
  }
}

/**
 * 更新标签
 */
function handleUpdateTag(tagId, name, color) {
  const success = updateTag(tagId, name, color)
  if (success) {
    ElMessage.success('标签已更新')
  }
}

/**
 * 删除标签
 */
function handleDeleteTag(tagId) {
  const success = deleteTag(tagId)
  if (success) {
    ElMessage.success('标签已删除')
  }
}
</script>

<style scoped>
.message-marking-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.mark-statistics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.stat-item:hover {
  background: #e6f7ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.stat-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-count {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  overflow-y: auto;
  max-height: 60px;
}

.tag-label {
  font-size: 12px;
  font-weight: 500;
}

.marking-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.mark-section {
  border-bottom: 1px solid #ebeef5;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  font-weight: 500;
  font-size: 13px;
  color: #303133;
  sticky: top 0;
  z-index: 10;
}

.section-icon {
  font-size: 16px;
}

.section-title {
  flex: 1;
}

.section-count {
  color: #909399;
  font-weight: normal;
  font-size: 12px;
}

.section-content {
  padding: 0;
}

.mark-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.mark-item:hover {
  background: #f5f7fa;
}

.mark-message {
  flex: 1;
  min-width: 0;
}

.message-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mark-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

:deep(.el-empty) {
  flex: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>
