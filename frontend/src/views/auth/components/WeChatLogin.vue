<template>
  <div class="wechat-login-container">
    <template v-if="!compact">
      <div class="wechat-description">
        <el-icon :size="48" color="#09BB07">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M666.67 512c0 155.7-126.3 282-282 282s-282-126.3-282-282 126.3-282 282-282 282 126.3 282 282z" />
            <path fill="currentColor" d="M877.33 657.33c0 124.56-101.1 225.67-225.66 225.67-124.57 0-225.67-101.1-225.67-225.67 0-124.56 101.1-225.66 225.67-225.66 124.56 0 225.66 101.1 225.66 225.66z" />
          </svg>
        </el-icon>
        <p class="tip-text">使用微信扫码登录</p>
        <p class="sub-tip">快速、安全、便捷</p>
      </div>

      <el-button
        type="success"
        size="large"
        class="wechat-button"
        :loading="loading"
        @click="handleWeChatLogin"
      >
        <el-icon class="button-icon"><ChatLineSquare /></el-icon>
        微信扫码登录
      </el-button>
    </template>

    <!-- 二维码弹窗 -->
    <el-dialog
      v-model="qrDialogVisible"
      title="微信扫码登录"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="qr-container">
        <div v-if="qrCodeUrl" class="qr-code">
          <!-- 开发环境：显示模拟扫码链接 -->
          <div class="dev-qrcode">
            <el-icon :size="120" color="#09BB07">
              <DataAnalysis />
            </el-icon>
            <p class="qr-tip">开发模式：点击下方按钮模拟扫码</p>
          </div>
          <el-button
            type="success"
            style="margin-top: 20px;"
            @click="openMockScanUrl"
          >
            模拟微信扫码授权
          </el-button>
        </div>
        <div v-else class="loading-qr">
          <el-icon :size="48" class="is-loading"><Loading /></el-icon>
          <p>正在生成二维码...</p>
        </div>
        <div class="qr-footer">
          <el-icon :size="16"><InfoFilled /></el-icon>
          <span>请使用微信扫描二维码登录</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatLineSquare, DataAnalysis, Loading, InfoFilled } from '@element-plus/icons-vue'
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
const currentState = ref('')
const mockScanUrl = ref('')

// 发起微信登录
const handleWeChatLogin = async () => {
  loading.value = true

  try {
    const response = await oauthAPI.getWeChatAuthorizeUrl('/home')

    if (response.code === 200) {
      currentState.value = response.data.state
      mockScanUrl.value = buildApiUrl(`/api/auth/oauth/wechat/mock-scan?state=${response.data.state}`)

      // 获取二维码
      const qrResponse = await oauthAPI.getWeChatQRCode(response.data.state)
      if (qrResponse.code === 200) {
        qrCodeUrl.value = qrResponse.data.qrContent
        qrDialogVisible.value = true
      }
    }
  } catch (error) {
    ElMessage.error(error.message || '微信登录发起失败')
  } finally {
    loading.value = false
  }
}

// 打开模拟扫码URL（开发环境）
const openMockScanUrl = () => {
  if (mockScanUrl.value) {
    window.open(mockScanUrl.value, '_blank', 'width=600,height=600')
  }
}

// 关闭弹窗
const closeDialog = () => {
  qrDialogVisible.value = false
  qrCodeUrl.value = ''
  currentState.value = ''
}

// 暴露方法给父组件
defineExpose({
  closeDialog,
  startLogin: handleWeChatLogin
})
</script>

<style scoped>
.wechat-login-container {
  padding: 20px 0;
}

.wechat-description {
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

.wechat-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  background: #09BB07;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.wechat-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(9, 187, 7, 0.3);
  background: #08A006;
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
  background: #f5f7fa;
  border-radius: 12px;
  border: 2px dashed #09BB07;
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
</style>
