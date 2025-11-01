<template>
  <el-dialog
    v-model="isVisible"
    title="📌 收藏详情"
    width="90%"
    max-width="600px"
    @close="handleClose"
  >
    <!-- 消息内容 -->
    <div v-if="collection" class="detail-content">
      <!-- 消息头部 -->
      <div class="message-header">
        <div class="sender-info">
          <span class="sender-name">{{ collection.senderName }}</span>
          <span class="message-time">{{ formatTime(collection.collectedAt) }}</span>
        </div>
        <span v-if="collection.metadata.editCount > 0" class="edit-badge">
          已编辑 ({{ collection.metadata.editCount }})
        </span>
      </div>

      <!-- 消息内容显示 -->
      <div class="message-content">
        {{ collection.messageContent }}
      </div>

      <!-- 附件显示 -->
      <div v-if="collection.metadata.attachments && collection.metadata.attachments.length > 0" class="attachments">
        <div class="attachments-title">附件</div>
        <div class="attachments-list">
          <div
            v-for="(attachment, index) in collection.metadata.attachments"
            :key="index"
            class="attachment-item"
          >
            <span class="attachment-icon">📎</span>
            <span class="attachment-name">{{ attachment.name }}</span>
            <span class="attachment-size">({{ formatFileSize(attachment.size) }})</span>
          </div>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="divider" />

      <!-- 收藏元数据 -->
      <div class="metadata-section">
        <div class="metadata-item">
          <span class="metadata-label">收藏时间：</span>
          <span class="metadata-value">{{ formatDateTime(collection.collectedAt) }}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">收藏者：</span>
          <span class="metadata-value">{{ collection.collectedBy }}</span>
        </div>
        <div v-if="collection.metadata.isRecalled" class="metadata-item recalled">
          <span class="metadata-label">⚠️ 已撤回</span>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="divider" />

      <!-- 备注编辑 -->
      <div class="notes-section">
        <div class="section-title">📝 备注</div>
        <el-input
          v-model="editingNotes"
          type="textarea"
          placeholder="添加备注..."
          :rows="3"
          maxlength="500"
          show-word-limit
          clearable
        />
        <div class="notes-actions">
          <el-button
            size="small"
            @click="handleSaveNotes"
            :loading="isSavingNotes"
          >
            保存
          </el-button>
          <el-button
            size="small"
            type="info"
            @click="editingNotes = collection.notes"
          >
            取消
          </el-button>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="divider" />

      <!-- 标签管理 -->
      <div class="tags-section">
        <div class="section-title">🏷️ 标签</div>
        <div class="tags-display">
          <el-tag
            v-for="(tag, index) in collection.tags"
            :key="index"
            closable
            @close="handleRemoveTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div v-if="collection.tags.length === 0" class="empty-tags">
          暂无标签
        </div>
        <el-input
          v-model="newTag"
          placeholder="输入新标签后按 Enter"
          size="small"
          @keyup.enter="handleAddTag"
          clearable
        />
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button
          @click="handleViewOriginal"
          type="primary"
        >
          查看原消息
        </el-button>
        <el-button
          @click="handleCopy"
        >
          复制内容
        </el-button>
        <el-button
          type="danger"
          @click="handleDelete"
        >
          删除收藏
        </el-button>
        <el-button @click="handleClose">
          关闭
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  collection: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'update-note', 'delete-collection', 'view-original'])

// UI状态
const editingNotes = ref('')
const newTag = ref('')
const isSavingNotes = ref(false)

// 同步visible属性
const isVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) {
      emit('close')
    }
  }
})

// 监听collection变化，初始化编辑备注
watch(() => props.collection, (newVal) => {
  if (newVal) {
    editingNotes.value = newVal.notes || ''
    newTag.value = ''
  }
}, { immediate: true })

/**
 * 格式化时间为 HH:MM 格式
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * 格式化完整日期时间
 */
function formatDateTime(timestamp) {
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
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

/**
 * 保存备注
 */
async function handleSaveNotes() {
  if (!props.collection) return

  isSavingNotes.value = true
  try {
    // 延迟以显示加载状态
    await new Promise(resolve => setTimeout(resolve, 300))

    emit('update-note', props.collection.messageId, editingNotes.value)
    ElMessage.success('备注已保存')
  } catch (error) {
    console.error('保存备注失败:', error)
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    isSavingNotes.value = false
  }
}

/**
 * 添加标签
 */
function handleAddTag() {
  if (!newTag.value.trim()) {
    ElMessage.warning('请输入标签内容')
    return
  }

  if (!props.collection) return

  const tag = newTag.value.trim()

  // 检查标签是否已存在
  if (props.collection.tags.includes(tag)) {
    ElMessage.info('标签已存在')
    newTag.value = ''
    return
  }

  // 检查标签数量限制
  if (props.collection.tags.length >= 10) {
    ElMessage.warning('最多可添加 10 个标签')
    return
  }

  props.collection.tags.push(tag)
  newTag.value = ''
  ElMessage.success('标签已添加')
}

/**
 * 移除标签
 */
function handleRemoveTag(tag) {
  if (!props.collection) return

  const index = props.collection.tags.indexOf(tag)
  if (index > -1) {
    props.collection.tags.splice(index, 1)
    ElMessage.success('标签已移除')
  }
}

/**
 * 查看原消息
 */
function handleViewOriginal() {
  if (!props.collection) return
  emit('view-original', props.collection.messageId)
  ElMessage.info('正在定位原消息...')
}

/**
 * 复制消息内容
 */
async function handleCopy() {
  if (!props.collection || !props.collection.messageContent) {
    ElMessage.warning('无法复制空内容')
    return
  }

  try {
    await navigator.clipboard.writeText(props.collection.messageContent)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

/**
 * 删除收藏
 */
async function handleDelete() {
  if (!props.collection) return

  try {
    await ElMessageBox.confirm(
      '确定要删除这条收藏吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    emit('delete-collection', props.collection.messageId)
    handleClose()
  } catch (error) {
    // 用户取消操作
  }
}

/**
 * 关闭对话框
 */
function handleClose() {
  isVisible.value = false
}
</script>

<style scoped>
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sender-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.message-time {
  color: #909399;
  font-size: 12px;
}

.edit-badge {
  font-size: 12px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 2px 8px;
  border-radius: 3px;
}

.message-content {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachments-title {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
}

.attachment-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.attachment-name {
  color: #303133;
  word-break: break-all;
}

.attachment-size {
  color: #909399;
  flex-shrink: 0;
}

.divider {
  height: 1px;
  background: #ebeef5;
}

.metadata-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metadata-item.recalled {
  color: #f56c6c;
  font-weight: 500;
}

.metadata-label {
  color: #909399;
  font-weight: 500;
}

.metadata-value {
  color: #303133;
}

.notes-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.notes-section :deep(.el-textarea__inner) {
  font-size: 12px;
  font-family: inherit;
}

.notes-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.tags-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tags-display :deep(.el-tag) {
  font-size: 12px;
}

.empty-tags {
  font-size: 12px;
  color: #909399;
  padding: 8px 0;
}

.tags-section :deep(.el-input__inner) {
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer :deep(.el-button) {
  font-size: 12px;
}

/* 滚动条样式 */
.detail-content::-webkit-scrollbar {
  width: 6px;
}

.detail-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

.detail-content::-webkit-scrollbar-thumb {
  background: #d3d4d6;
  border-radius: 3px;
}

.detail-content::-webkit-scrollbar-thumb:hover {
  background: #a6a7ab;
}
</style>
