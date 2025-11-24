<template>
  <div class="avatar-uploader">
    <!-- 头像预览 -->
    <div class="avatar-preview-section">
      <div class="avatar-display">
        <img v-if="previewUrl" :src="previewUrl" alt="头像预览" class="avatar-image" />
        <div v-else class="avatar-placeholder">
          <el-icon><User /></el-icon>
          <p>上传头像</p>
        </div>
        <div class="avatar-overlay">
          <el-button
            type="primary"
            :icon="Edit"
            circle
            @click="triggerUpload"
          />
        </div>
      </div>
      <div class="avatar-info">
        <h3>个人头像</h3>
        <p>推荐使用 1:1 比例的图片，最大 5MB</p>
        <div class="avatar-tips">
          <el-alert
            title="头像要求"
            type="info"
            :closable="false"
            description="支持 JPG/PNG 格式，分辨率至少 200×200 像素，头部占比不低于 80%"
          />
        </div>
      </div>
    </div>

    <!-- 隐藏文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="更改头像"
      width="600px"
      align-center
      @close="resetUpload"
    >
      <!-- 图片裁剪区域 -->
      <div class="crop-container" v-if="showCropPanel">
        <div class="crop-preview">
          <div class="crop-box">
            <img
              v-if="cropImageUrl"
              :src="cropImageUrl"
              alt="裁剪预览"
              class="crop-image"
              :style="cropImageStyle"
            />
          </div>
          <div class="crop-guide">
            <p>拖拽图片调整位置</p>
            <p class="text-sm">或使用滑块调整缩放</p>
          </div>
        </div>

        <!-- 裁剪控制 -->
        <div class="crop-controls">
          <div class="slider-group">
            <span>缩放</span>
            <el-slider
              v-model="cropScale"
              :min="1"
              :max="3"
              :step="0.1"
              :marks="{ 1: '1x', 2: '2x', 3: '3x' }"
              :show-stops="true"
            />
          </div>

          <div class="button-group">
            <el-button @click="resetCrop">重置</el-button>
            <el-button type="primary" @click="confirmCrop">确认裁剪</el-button>
          </div>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-else-if="uploading" class="upload-progress">
        <el-progress :percentage="uploadProgress" :show-text="true" />
        <p class="mt-3 text-center">正在上传头像...</p>
      </div>

      <!-- 上传区域 -->
      <div v-else class="upload-area">
        <el-upload
          action=""
          :auto-upload="false"
          :on-change="handleUploadChange"
          accept="image/jpeg,image/jpg,image/png"
          drag
          multiple
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽图片到此或<em>点击选择</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只支持 jpg/jpeg/png 格式，单个文件不超过 5MB
            </div>
          </template>
        </el-upload>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showUploadDialog = false">取消</el-button>
          <el-button
            v-if="!showCropPanel && !uploading"
            type="primary"
            :disabled="!selectedFile"
            @click="handleUpload"
          >
            上传
          </el-button>
          <el-button v-if="uploading" type="primary" disabled>
            上传中...
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { User, Edit, UploadFilled } from '@element-plus/icons-vue'
import { userAPI } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 状态管理
const showUploadDialog = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const cropImageUrl = ref<string>('')
const showCropPanel = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)

// 裁剪参数
const cropScale = ref(1)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const cropBoxSize = 280

const cropImageStyle = computed(() => ({
  transform: `scale(${cropScale.value}) translate(${cropOffsetX.value}px, ${cropOffsetY.value}px)`,
  transformOrigin: 'center center',
  transition: 'transform 0.2s ease'
}))

// 初始化用户头像
const initializeAvatar = () => {
  if (userStore.user?.avatar) {
    previewUrl.value = userStore.user.avatar
  }
}

// 触发文件选择
const triggerUpload = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    const file = files[0]
    validateAndProcessFile(file)
  }
}

// 处理上传框选择
const handleUploadChange = (uploadFile: any) => {
  const file = uploadFile.raw
  if (file) {
    validateAndProcessFile(file)
  }
}

// 验证并处理文件
const validateAndProcessFile = (file: File) => {
  // 验证文件大小
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 5MB')
    return
  }

  // 验证文件类型
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    ElMessage.error('仅支持 JPG/PNG 格式的图片')
    return
  }

  // 读取文件
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    cropImageUrl.value = result
    selectedFile.value = file
    showCropPanel.value = true
    // 打开上传对话框，进入裁剪/上传流程
    showUploadDialog.value = true
  }
  reader.onerror = () => {
    ElMessage.error('图片读取失败，请重试')
  }
  reader.readAsDataURL(file)
}

// 重置裁剪
const resetCrop = () => {
  cropScale.value = 1
  cropOffsetX.value = 0
  cropOffsetY.value = 0
}

// 确认裁剪
const confirmCrop = () => {
  showCropPanel.value = false
}

// 上传头像
const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择图片')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('avatar', selectedFile.value)

    // 模拟进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 30
      }
    }, 200)

    const response = await userAPI.uploadAvatar(formData)

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.code === 200 || response.status === 200) {
      // 刷新用户信息
      await userStore.fetchUserInfo()
      previewUrl.value = userStore.user?.avatar || previewUrl.value

      ElNotification({
        title: '成功',
        message: '头像更新成功！',
        type: 'success',
        duration: 3000
      })

      // 关闭对话框
      setTimeout(() => {
        showUploadDialog.value = false
        resetUpload()
      }, 500)
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '头像上传失败，请重试')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// 重置上传
const resetUpload = () => {
  selectedFile.value = null
  cropImageUrl.value = ''
  showCropPanel.value = false
  uploadProgress.value = 0
  resetCrop()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 组件挂载时初始化
watch(
  () => userStore.user?.avatar,
  () => {
    initializeAvatar()
  },
  { immediate: true }
)

defineExpose({
  triggerUpload,
  resetUpload
})
</script>

<style scoped lang="scss">
.avatar-uploader {
  width: 100%;
}

.avatar-preview-section {
  display: flex;
  gap: 24px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
}

.avatar-display {
  position: relative;
  flex-shrink: 0;

  .avatar-image,
  .avatar-placeholder {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    object-fit: cover;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid #f0f0f0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .avatar-placeholder {
    flex-direction: column;
    color: white;
    gap: 8px;

    :deep(.el-icon) {
      font-size: 48px;
    }

    p {
      margin: 0;
      font-size: 12px;
    }
  }

  .avatar-overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 1;
    }

    :deep(.el-button) {
      --el-button-size: 40px;
    }
  }
}

.avatar-info {
  flex: 1;
  padding-top: 10px;

  h3 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1f2430;
  }

  > p {
    margin: 0 0 12px;
    font-size: 13px;
    color: #909399;
  }

  .avatar-tips {
    :deep(.el-alert) {
      padding: 8px 12px;
      font-size: 12px;

      .el-alert__title {
        font-weight: 600;
      }

      .el-alert__description {
        margin-top: 4px;
      }
    }
  }
}

// 上传对话框内容
.upload-area {
  padding: 20px 0;

  :deep(.el-upload-dragger) {
    padding: 40px 20px;
    border-color: #dcdfe6;
    background-color: #fafafa;
    border-radius: 8px;

    &:hover {
      border-color: #0071e3;
      background-color: #f5f7fa;
    }

    .el-icon--upload {
      color: #0071e3;
      font-size: 48px;
      margin-bottom: 12px;
    }

    .el-upload__text {
      color: #606266;

      em {
        color: #0071e3;
        font-style: normal;
      }
    }

    .el-upload__tip {
      color: #909399;
      margin-top: 12px;
    }
  }
}

// 裁剪面板
.crop-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crop-preview {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;

  .crop-box {
    width: 100%;
    height: 280px;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;

    .crop-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .crop-guide {
    padding: 12px;
    background: #f5f7fa;
    text-align: center;
    border-top: 1px solid #dcdfe6;

    p {
      margin: 0;
      font-size: 12px;
      color: #909399;

      &.text-sm {
        font-size: 11px;
        margin-top: 4px;
      }
    }
  }
}

.crop-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .slider-group {
    display: flex;
    align-items: center;
    gap: 12px;

    span {
      min-width: 50px;
      font-size: 14px;
      font-weight: 600;
      color: #1f2430;
    }

    :deep(.el-slider) {
      flex: 1;
    }
  }

  .button-group {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
}

// 上传进度
.upload-progress {
  padding: 20px 0;
  text-align: center;

  :deep(.el-progress) {
    margin-bottom: 12px;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }

  .mt-3 {
    margin-top: 12px;
  }

  .text-center {
    text-align: center;
  }
}

// 对话框底部
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .avatar-preview-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .crop-preview .crop-box {
    height: 240px;
  }
}
</style>
