<template>
  <transition name="overlay-fade">
    <div v-if="visible" class="message-edit-overlay">
      <!-- 半透明背景 -->
      <div class="message-edit-overlay__backdrop" @click="handleCancel"></div>

      <!-- 编辑框 -->
      <div class="message-edit-overlay__container">
        <!-- 标题 -->
        <div class="message-edit-overlay__header">
          <h3 class="message-edit-overlay__title">编辑消息</h3>
          <el-button
            link
            text
            type="primary"
            size="small"
            @click="handleCancel"
            aria-label="关闭编辑"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <!-- 消息预览 -->
        <div class="message-edit-overlay__preview">
          <div class="message-edit-overlay__preview-label">原始内容：</div>
          <div class="message-edit-overlay__preview-content">
            {{ originalContent }}
          </div>
        </div>

        <!-- 编辑输入框 -->
        <div class="message-edit-overlay__input-container">
          <label class="message-edit-overlay__label">编辑内容：</label>
          <textarea
            v-model="editContent"
            class="message-edit-overlay__textarea"
            placeholder="输入新内容..."
            maxlength="5000"
            @keydown.ctrl.enter="handleConfirm"
            @keydown.meta.enter="handleConfirm"
            aria-label="编辑内容输入框"
          ></textarea>

          <!-- 字数统计 -->
          <div class="message-edit-overlay__char-count">
            {{ editContent.length }} / 5000
          </div>
        </div>

        <!-- 错误提示 -->
        <transition name="slide-down">
          <div v-if="errorMessage" class="message-edit-overlay__error">
            <el-icon><Warning /></el-icon>
            <span>{{ errorMessage }}</span>
          </div>
        </transition>

        <!-- 编辑历史 (如果有) -->
        <div v-if="showHistory && editHistory.length > 0" class="message-edit-overlay__history">
          <div class="message-edit-overlay__history-header">
            编辑历史 ({{ editHistory.length }} 个版本)
          </div>
          <div class="message-edit-overlay__history-list">
            <div
              v-for="(version, index) in editHistory"
              :key="index"
              class="message-edit-overlay__history-item"
              :class="{ 'is-latest': index === editHistory.length - 1 }"
            >
              <div class="message-edit-overlay__history-meta">
                <span class="message-edit-overlay__history-version">
                  版本 {{ version.version }}
                </span>
                <span class="message-edit-overlay__history-time">
                  {{ formatTime(version.editedAt) }}
                </span>
              </div>
              <div class="message-edit-overlay__history-content">
                {{ version.content }}
              </div>
              <el-button
                v-if="index !== editHistory.length - 1"
                link
                text
                size="small"
                type="primary"
                @click="handleRestoreVersion(version.version)"
              >
                恢复此版本
              </el-button>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="message-edit-overlay__footer">
          <el-button
            @click="handleCancel"
            aria-label="取消编辑"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="isSubmitting"
            @click="handleConfirm"
            aria-label="确认编辑"
          >
            {{ isSubmitting ? '保存中...' : '保存' }}
          </el-button>
        </div>

        <!-- 快捷键提示 -->
        <div class="message-edit-overlay__hint">
          💡 按 Ctrl+Enter (Cmd+Enter) 快速保存
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Warning } from '@element-plus/icons-vue'

/**
 * 消息编辑覆盖层组件
 * 用于编辑已发送的消息
 *
 * Props:
 * - visible: boolean - 是否显示编辑框
 * - message: Object - 要编辑的消息对象
 * - editHistory: Array - 编辑历史版本
 *
 * Emits:
 * - update:visible - 更新可见性
 * - edit - 保存编辑 (messageId, newContent)
 * - restore - 恢复版本 (messageId, versionNumber)
 * - cancel - 取消编辑
 */

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: Object,
    default: null
  },
  editHistory: {
    type: Array,
    default: () => []
  },
  showHistory: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:visible', 'edit', 'restore', 'cancel'])

// State
const editContent = ref('')
const originalContent = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

/**
 * 初始化编辑内容
 */
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.message) {
      editContent.value = props.message.content || ''
      originalContent.value = props.message.content || ''
      errorMessage.value = ''
    }
  },
  { immediate: true }
)

/**
 * 格式化时间
 */
function formatTime(timestamp) {
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
 * 验证编辑内容
 */
function validateContent() {
  if (!editContent.value || editContent.value.trim().length === 0) {
    errorMessage.value = '内容不能为空'
    return false
  }

  if (editContent.value.length > 5000) {
    errorMessage.value = '内容长度不能超过 5000 字符'
    return false
  }

  if (editContent.value === originalContent.value) {
    errorMessage.value = '内容未修改'
    return false
  }

  return true
}

/**
 * 处理确认编辑
 */
async function handleConfirm() {
  errorMessage.value = ''

  if (!validateContent()) {
    return
  }

  isSubmitting.value = true

  try {
    // 发送编辑事件
    emit('edit', {
      messageId: props.message.id,
      conversationId: props.message.conversationId,
      newContent: editContent.value
    })

    // 关闭编辑框
    emit('update:visible', false)
    ElMessage.success('消息已保存')
  } catch (error) {
    console.error('编辑消息失败:', error)
    errorMessage.value = '保存失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 处理取消编辑
 */
function handleCancel() {
  if (editContent.value !== originalContent.value) {
    ElMessage.confirm('内容已修改，是否放弃修改？', '提示', {
      confirmButtonText: '放弃',
      cancelButtonText: '继续编辑',
      type: 'warning'
    })
      .then(() => {
        emit('update:visible', false)
        emit('cancel')
      })
      .catch(() => {})
  } else {
    emit('update:visible', false)
    emit('cancel')
  }
}

/**
 * 处理恢复版本
 */
function handleRestoreVersion(versionNumber) {
  ElMessage.confirm(`确定要恢复到版本 ${versionNumber} 吗？`, '恢复版本', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('restore', {
        messageId: props.message.id,
        versionNumber
      })
      emit('update:visible', false)
      ElMessage.success('已恢复到该版本')
    })
    .catch(() => {})
}
</script>

<style scoped>
.message-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.message-edit-overlay__backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.message-edit-overlay__container {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.message-edit-overlay__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.message-edit-overlay__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.message-edit-overlay__preview {
  padding: 16px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.message-edit-overlay__preview-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.message-edit-overlay__preview-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  max-height: 120px;
  overflow-y: auto;
}

.message-edit-overlay__input-container {
  flex: 1;
  padding: 20px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.message-edit-overlay__label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
  display: block;
}

.message-edit-overlay__textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  color: #606266;
  resize: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 8px;
}

.message-edit-overlay__textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.message-edit-overlay__char-count {
  font-size: 11px;
  color: #909399;
  text-align: right;
  margin-bottom: 12px;
}

.message-edit-overlay__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef0f0;
  border: 1px solid #fde2e4;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 12px;
  margin-bottom: 12px;
  animation: shake 0.3s ease;
}

.message-edit-overlay__error :deep(.el-icon) {
  font-size: 14px;
  flex-shrink: 0;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.message-edit-overlay__history {
  padding: 16px 20px;
  background: #fafbfc;
  border-top: 1px solid #ebeef5;
  max-height: 300px;
  overflow-y: auto;
}

.message-edit-overlay__history-header {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  margin-bottom: 12px;
}

.message-edit-overlay__history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-edit-overlay__history-item {
  padding: 12px;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.message-edit-overlay__history-item.is-latest {
  border-color: #409eff;
  background: #f0f9ff;
}

.message-edit-overlay__history-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 11px;
}

.message-edit-overlay__history-version {
  color: #409eff;
  font-weight: 500;
}

.message-edit-overlay__history-time {
  color: #909399;
}

.message-edit-overlay__history-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-edit-overlay__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.message-edit-overlay__footer :deep(.el-button) {
  padding: 8px 20px;
}

.message-edit-overlay__hint {
  padding: 0 20px 16px;
  font-size: 11px;
  color: #909399;
  text-align: center;
}

/* 动画 */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.overlay-fade-enter-active .message-edit-overlay__container {
  animation: slideUp 0.3s ease;
}

.overlay-fade-leave-active .message-edit-overlay__container {
  animation: slideDown 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(30px);
    opacity: 0;
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-edit-overlay__container {
    width: 95%;
    max-height: 90vh;
  }

  .message-edit-overlay__header,
  .message-edit-overlay__preview,
  .message-edit-overlay__input-container,
  .message-edit-overlay__footer {
    padding: 16px;
  }

  .message-edit-overlay__input-container {
    min-height: 150px;
  }

  .message-edit-overlay__footer {
    flex-direction: column-reverse;
  }

  .message-edit-overlay__footer :deep(.el-button) {
    width: 100%;
  }
}

/* 滚动条美化 */
.message-edit-overlay__container::-webkit-scrollbar,
.message-edit-overlay__preview-content::-webkit-scrollbar,
.message-edit-overlay__history::-webkit-scrollbar {
  width: 6px;
}

.message-edit-overlay__container::-webkit-scrollbar-track,
.message-edit-overlay__preview-content::-webkit-scrollbar-track,
.message-edit-overlay__history::-webkit-scrollbar-track {
  background: transparent;
}

.message-edit-overlay__container::-webkit-scrollbar-thumb,
.message-edit-overlay__preview-content::-webkit-scrollbar-thumb,
.message-edit-overlay__history::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.message-edit-overlay__container::-webkit-scrollbar-thumb:hover,
.message-edit-overlay__preview-content::-webkit-scrollbar-thumb:hover,
.message-edit-overlay__history::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
</style>
