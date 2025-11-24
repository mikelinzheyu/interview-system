<template>
  <div class="qq-login-container">
    <template v-if="!compact">
      <div class="qq-description">
        <el-icon :size="48" color="#12B7F5">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z" />
          </svg>
        </el-icon>
        <p class="tip-text">使用QQ扫码登录</p>
        <p class="sub-tip">快速、安全、便捷</p>
      </div>

      <el-button
        type="primary"
        size="large"
        class="qq-button"
        :loading="loading"
        @click="handleQQLogin"
      >
        <el-icon class="button-icon"><Connection /></el-icon>
        QQ扫码登录
      </el-button>
    </template>

    <!-- 二维码弹窗 -->
    <el-dialog
      v-model="qrDialogVisible"
      title="QQ扫码登录"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="qr-container">
        <div v-if="qrCodeUrl" class="qr-code">
          <div class="dev-qrcode">
            <el-icon :size="120" color="#12B7F5">
              <Grid />
            </el-icon>
            <p class="qr-tip">开发模式：点击下方按钮模拟扫码</p>
          </div>
          <el-button
            type="primary"
            style="margin-top: 20px; background: #12B7F5; border-color: #12B7F5;"
            @click="openMockScanUrl"
          >
            模拟QQ扫码授权
          </el-button>
        </div>
        <div v-else class="loading-qr">
          <el-icon :size="48" class="is-loading"><Loading /></el-icon>
          <p>正在生成二维码...</p>
        </div>
        <div class="qr-footer">
          <el-icon :size="16"><InfoFilled /></el-icon>
          <span>请使用手机QQ扫描二维码登录</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, Grid, Loading, InfoFilled } from '@element-plus/icons-vue'
import { oauthAPI } from '@/api/oauth'
import { buildApiUrl } from '@/utils/networkConfig'

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['login-success'])

const loading = ref(false)
const qrDialogVisible = ref(false)
const qrCodeUrl = ref('')
const mockScanUrl = ref('')

const handleQQLogin = async () => {
  loading.value = true

  try {
    const response = await oauthAPI.getQQAuthorizeUrl('/home')

    if (response.code === 200) {
      mockScanUrl.value = buildApiUrl(`/api/auth/oauth/qq/mock-scan?state=${response.data.state}`)

      const qrResponse = await oauthAPI.getQQQRCode(response.data.state)
      if (qrResponse.code === 200) {
        qrCodeUrl.value = qrResponse.data.qrContent
        qrDialogVisible.value = true
      }
    }
  } catch (error) {
    ElMessage.error(error.message || 'QQ登录发起失败')
  } finally {
    loading.value = false
  }
}

const openMockScanUrl = () => {
  if (mockScanUrl.value) {
    window.open(mockScanUrl.value, '_blank', 'width=600,height=600')
  }
}

const closeDialog = () => {
  qrDialogVisible.value = false
  qrCodeUrl.value = ''
}

defineExpose({
  closeDialog,
  startLogin: handleQQLogin
})
</script>

<style scoped>
.qq-login-container {
  padding: 20px 0;
}

.qq-description {
  text-align: center;
  margin-bottom: 30px;
}

.tip-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 8px 0;
}

.sub-tip {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.qq-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #12B7F5 0%, #0C8EC7 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.qq-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(18, 183, 245, 0.3);
  background: linear-gradient(135deg, #0DA6E4 0%, #0B7DB6 100%);
}

.button-icon {
  margin-right: 8px;
}

.qr-container {
  text-align: center;
  padding: 20px;
}

.qr-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.dev-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background: #f0f9ff;
  border-radius: 12px;
  border: 2px dashed #12B7F5;
}

.qr-tip {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

.loading-qr {
  padding: 40px;
  color: #909399;
}

.loading-qr p {
  margin-top: 16px;
  font-size: 14px;
}

.qr-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #EBEEF5;
  color: #909399;
  font-size: 13px;
}

:deep(.el-dialog__header) {
  text-align: center;
  padding: 20px 20px 10px;
}

:deep(.el-dialog__body) {
  padding: 10px 20px 30px;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
