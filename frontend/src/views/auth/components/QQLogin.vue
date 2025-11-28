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
      @close="closeDialog"
    >
      <div class="qr-container">
        <!-- 等待扫码 -->
        <div v-if="qrStatus === 'waiting'" class="qr-waiting">
          <img :src="qrCodeDataUrl" class="qr-image" />
          <p class="qr-tip">请使用手机QQ扫描二维码</p>
          <p class="qr-countdown">{{ countdownSeconds }}s 后过期</p>
        </div>

        <!-- 已扫码，等待确认 -->
        <div v-else-if="qrStatus === 'scanned'" class="qr-scanned">
          <el-icon :size="64" color="#67C23A"><CircleCheck /></el-icon>
          <p class="qr-tip">扫码成功！</p>
          <p class="user-info" v-if="scannedUser">
            <el-avatar :src="scannedUser.avatar" :size="40" />
            {{ scannedUser.username }}
          </p>
          <p class="confirming">正在等待确认...</p>
        </div>

        <!-- 确认成功 -->
        <div v-else-if="qrStatus === 'confirmed'" class="qr-confirmed">
          <el-icon :size="64" color="#67C23A"><CircleCheck /></el-icon>
          <p class="qr-tip">登录成功！</p>
          <p>正在跳转到仪表板...</p>
        </div>

        <!-- 二维码过期 -->
        <div v-else-if="qrStatus === 'expired'" class="qr-expired">
          <el-icon :size="64" color="#F56C6C"><CircleClose /></el-icon>
          <p class="qr-tip">二维码已过期</p>
          <el-button type="primary" @click="handleQQLogin">刷新二维码</el-button>
        </div>

        <!-- 加载中 -->
        <div v-else-if="qrStatus === 'loading'" class="qr-loading">
          <el-icon :size="48" class="is-loading"><Loading /></el-icon>
          <p>正在生成二维码...</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Connection, CircleCheck, CircleClose, Loading } from '@element-plus/icons-vue'
import { oauthAPI } from '@/api/oauth'
import QRCode from 'qrcode'

const router = useRouter()
const userStore = useUserStore()

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['login-success'])

const loading = ref(false)
const qrDialogVisible = ref(false)
const qrCodeDataUrl = ref('')
const qrStatus = ref('loading') // loading, waiting, scanned, confirmed, expired
const scannedUser = ref(null)
const state = ref('')
const countdownSeconds = ref(600) // 10分钟

let pollingTimer = null
let countdownTimer = null

const handleQQLogin = async () => {
  loading.value = true
  qrStatus.value = 'loading'

  try {
    // 1. 获取授权 URL 和 state
    const authRes = await oauthAPI.getQQAuthorizeUrl('/dashboard')

    if (authRes.code !== 200) {
      throw new Error(authRes.message || 'Failed to get authorize URL')
    }

    state.value = authRes.data.state

    // 2. 获取二维码
    const qrRes = await oauthAPI.getQQQRCode(authRes.data.state)

    if (qrRes.code !== 200) {
      throw new Error(qrRes.message || 'Failed to generate QR code')
    }

    // 3. 生成二维码图片
    qrCodeDataUrl.value = await QRCode.toDataURL(qrRes.data.qrContent || qrRes.data.qrCodeUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // 4. 显示对话框
    qrDialogVisible.value = true
    qrStatus.value = 'waiting'
    countdownSeconds.value = 600
    scannedUser.value = null

    // 5. 开始轮询状态
    startPolling(authRes.data.state)

    // 6. 开始倒计时
    startCountdown()

    loading.value = false
  } catch (error) {
    loading.value = false
    qrDialogVisible.value = false
    ElMessage.error(error.message || 'QQ登录发起失败')
    stopPolling()
    stopCountdown()
  }
}

function startPolling(currentState) {
  // 每2秒轮询一次
  pollingTimer = setInterval(async () => {
    try {
      const res = await oauthAPI.pollQQQRStatus(currentState)

      if (res.code !== 200) {
        return
      }

      const { status, username, avatar } = res.data

      if (status === 'scanned') {
        qrStatus.value = 'scanned'
        scannedUser.value = { username, avatar }
      } else if (status === 'confirmed') {
        qrStatus.value = 'confirmed'
        stopPolling()
        stopCountdown()

        // 等待后端处理完成，然后跳转
        setTimeout(() => {
          router.push('/dashboard')
          qrDialogVisible.value = false
        }, 500)
      } else if (status === 'expired') {
        qrStatus.value = 'expired'
        stopPolling()
        stopCountdown()
      }
    } catch (error) {
      console.error('轮询失败:', error)
    }
  }, 2000)
}

function startCountdown() {
  countdownTimer = setInterval(() => {
    countdownSeconds.value--

    if (countdownSeconds.value <= 0) {
      qrStatus.value = 'expired'
      stopPolling()
      stopCountdown()
    }
  }, 1000)
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function closeDialog() {
  qrDialogVisible.value = false
  stopPolling()
  stopCountdown()
  qrCodeDataUrl.value = ''
  qrStatus.value = 'loading'
  scannedUser.value = null
}

defineExpose({
  closeDialog,
  startLogin: handleQQLogin
})

onBeforeUnmount(() => {
  stopPolling()
  stopCountdown()
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

/* 等待扫码状态 */
.qr-waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.qr-image {
  width: 240px;
  height: 240px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.qr-countdown {
  font-size: 12px;
  color: #F56C6C;
  margin-top: 8px;
  font-weight: 500;
}

/* 已扫码状态 */
.qr-scanned,
.qr-confirmed,
.qr-expired {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

.qr-scanned .qr-tip,
.qr-confirmed .qr-tip,
.qr-expired .qr-tip {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0;
  font-size: 14px;
  color: #606266;
}

.confirming {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}

.qr-loading p {
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
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
