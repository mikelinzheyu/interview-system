<template>
  <div class="file-uploader">
    <!-- 上传区域 -->
    <div
      class="file-uploader__drop-zone"
      :class="{ 'is-dragging': isDragging }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="acceptTypes"
        @change="handleFileSelect"
        class="file-uploader__input"
      />

      <div class="file-uploader__prompt">
        <el-icon class="file-uploader__icon">
          <DocumentAdd />
        </el-icon>
        <p class="file-uploader__text">
          {{ isDragging ? '释放文件即可上传' : '拖拽文件到此或点击选择' }}
        </p>
        <p class="file-uploader__hint">
          支持图片、视频、文件等，单个文件最大 100MB
        </p>
      </div>
    </div>

    <!-- 上传列表 -->
    <div v-if="uploads.length > 0" class="file-uploader__list">
      <div class="file-uploader__header">
        <span>上传列表 ({{ uploads.length }})</span>
        <el-button
          v-if="hasActiveUploads"
          size="small"
          type="danger"
          text
          @click="cancelAll"
        >
          全部取消
        </el-button>
      </div>

      <div class="file-uploader__items">
        <div
          v-for="upload in uploads"
          :key="upload.id"
          class="file-uploader__item"
          :class="`is-${upload.status}`"
        >
          <!-- 文件信息 -->
          <div class="file-uploader__item-header">
            <el-icon class="file-uploader__item-icon">
              <Document />
            </el-icon>

            <div class="file-uploader__item-info">
              <div class="file-uploader__item-name">
                {{ upload.file?.name || '未知文件' }}
              </div>
              <div class="file-uploader__item-meta">
                {{ formatFileSize(upload.file?.size) }}
                <span class="file-uploader__status">
                  {{ formatStatus(upload.status) }}
                </span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="file-uploader__item-actions">
              <el-button
                v-if="upload.status === 'failed'"
                size="small"
                type="primary"
                text
                @click="retryUpload(upload.id)"
              >
                重试
              </el-button>
              <el-button
                v-if="upload.status === 'uploading'"
                size="small"
                type="danger"
                text
                @click="cancelUpload(upload.id)"
              >
                取消
              </el-button>
              <el-icon
                v-if="upload.status === 'completed'"
                class="file-uploader__success-icon"
              >
                <CircleCheck />
              </el-icon>
            </div>
          </div>

          <!-- 进度条 -->
          <div
            v-if="upload.status === 'uploading' || upload.status === 'pending'"
            class="file-uploader__progress"
          >
            <el-progress
              :percentage="upload.progress"
              :status="upload.status === 'uploading' ? 'success' : 'warning'"
              :show-text="true"
            />
          </div>

          <!-- 错误信息 -->
          <div v-if="upload.status === 'failed'" class="file-uploader__error">
            <el-icon><Warning /></el-icon>
            <span>{{ upload.error }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="uploads.length === 0 && completedCount > 0" class="file-uploader__empty">
      <el-empty description="没有上传任务" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  uploadFile,
  uploadMultipleFiles,
  getUploadStatus,
  getAllUploads,
  cancelUpload,
  cancelAllUploads,
  formatFileSize,
  validateFile
} from '@/services/uploadService'
import { Document, DocumentAdd, CircleCheck, Warning } from '@element-plus/icons-vue'

const emit = defineEmits(['upload-start', 'upload-progress', 'upload-complete', 'upload-error'])

const props = defineProps({
  acceptTypes: {
    type: String,
    default: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt'
  },
  multiple: {
    type: Boolean,
    default: true
  },
  autoRetry: {
    type: Boolean,
    default: true
  }
})

const fileInput = ref(null)
const isDragging = ref(false)
const uploads = ref([])
const completedCount = ref(0)

const hasActiveUploads = computed(() => {
  return uploads.value.some(u => u.status === 'uploading' || u.status === 'pending')
})

// 处理文件选择
function handleFileSelect(event) {
  const files = event.target.files
  if (files?.length) {
    uploadFiles(Array.from(files))
  }
  // 重置input
  event.target.value = ''
}

// 处理拖拽上传
function handleDrop(event) {
  isDragging.value = false
  const files = event.dataTransfer.files
  if (files?.length) {
    uploadFiles(Array.from(files))
  }
}

// 上传文件
function uploadFiles(files) {
  if (!props.multiple && files.length > 1) {
    ElMessage.warning('只能上传一个文件')
    return
  }

  for (const file of files) {
    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      ElMessage.error(`文件 ${file.name} 验证失败: ${validation.errors.join('; ')}`)
      continue
    }

    // 创建上传记录
    const uploadRecord = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      error: null
    }

    uploads.value.push(uploadRecord)

    // 开始上传
    uploadFile(file, {
      onProgress: (progress) => {
        uploadRecord.progress = progress.progress
        uploadRecord.status = 'uploading'
        emit('upload-progress', progress)
      },
      onSuccess: (response) => {
        uploadRecord.status = 'completed'
        uploadRecord.progress = 100
        completedCount.value++
        emit('upload-complete', {
          id: uploadRecord.id,
          file,
          response
        })
        ElMessage.success(`${file.name} 上传成功`)
      },
      onError: (error) => {
        uploadRecord.status = 'failed'
        uploadRecord.error = error.error
        emit('upload-error', {
          id: uploadRecord.id,
          file,
          error: error.error
        })
        ElMessage.error(`${file.name} 上传失败: ${error.error}`)
      },
      onRetry: (retryInfo) => {
        uploadRecord.status = 'pending'
        if (props.autoRetry) {
          ElMessage.info(
            `${file.name} 重试上传 (${retryInfo.attempt}/${3})`
          )
        }
      }
    })
  }
}

// 重试上传
function retryUpload(uploadId) {
  const uploadRecord = uploads.value.find(u => u.id === uploadId)
  if (uploadRecord && uploadRecord.file) {
    uploadRecord.status = 'pending'
    uploadRecord.progress = 0
    uploadRecord.error = null

    uploadFile(uploadRecord.file, {
      onProgress: (progress) => {
        uploadRecord.progress = progress.progress
        uploadRecord.status = 'uploading'
      },
      onSuccess: (response) => {
        uploadRecord.status = 'completed'
        uploadRecord.progress = 100
        completedCount.value++
        ElMessage.success('重试上传成功')
      },
      onError: (error) => {
        uploadRecord.status = 'failed'
        uploadRecord.error = error.error
        ElMessage.error(`重试上传失败: ${error.error}`)
      }
    })
  }
}

// 取消上传
function cancelUpload(uploadId) {
  cancelUpload(uploadId)
  const uploadRecord = uploads.value.find(u => u.id === uploadId)
  if (uploadRecord) {
    uploadRecord.status = 'cancelled'
  }
  ElMessage.info('已取消上传')
}

// 取消所有上传
function cancelAll() {
  cancelAllUploads()
  uploads.value.forEach(u => {
    if (u.status === 'uploading' || u.status === 'pending') {
      u.status = 'cancelled'
    }
  })
  ElMessage.info('已取消所有上传')
}

// 格式化状态
function formatStatus(status) {
  const statusMap = {
    pending: '等待中...',
    uploading: '上传中...',
    completed: '已完成',
    failed: '已失败',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 点击上传区域打开文件选择器
function triggerFileSelect() {
  fileInput.value?.click()
}

defineExpose({
  uploads,
  uploadFiles,
  cancelUpload,
  cancelAll,
  hasActiveUploads,
  completedCount
})
</script>

<style scoped>
.file-uploader {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.file-uploader__drop-zone {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;

  &:hover {
    border-color: #409eff;
    background: #f5f7fa;
  }

  &.is-dragging {
    border-color: #409eff;
    background: #ecf5ff;
    box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.2);
  }
}

.file-uploader__input {
  display: none;
}

.file-uploader__icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 12px;
}

.file-uploader__text {
  margin: 8px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.file-uploader__hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.file-uploader__list {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.file-uploader__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.file-uploader__items {
  max-height: 400px;
  overflow-y: auto;
}

.file-uploader__item {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }

  &.is-completed {
    background: #f0f9ff;
  }

  &.is-failed {
    background: #fef0f0;
  }
}

.file-uploader__item-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.file-uploader__item-icon {
  font-size: 24px;
  color: #409eff;
  flex-shrink: 0;
}

.file-uploader__item-info {
  flex: 1;
  min-width: 0;
}

.file-uploader__item-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-uploader__item-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 8px;
  align-items: center;
}

.file-uploader__status {
  color: #606266;
}

.file-uploader__item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.file-uploader__success-icon {
  font-size: 20px;
  color: #67c23a;
}

.file-uploader__progress {
  margin-top: 8px;
}

.file-uploader__error {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #f56c6c;
}

.file-uploader__empty {
  padding: 40px 20px;
}
</style>
