<template>
  <div class="auth-container">
    <div class="auth-background">
      <div class="background-pattern"></div>
    </div>
    
    <div class="auth-content">
      <div class="auth-card">
        <div class="logo-section">
          <el-icon :size="48" color="#409eff">
            <ChatRound />
          </el-icon>
          <h1 class="system-title">智能面试系统</h1>
          <p class="system-subtitle">AI驱动的专业面试平台</p>
        </div>

        <el-tabs v-model="activeTab" class="login-tabs">
          <el-tab-pane label="密码登录" name="password">
            <el-form
              ref="loginFormRef"
              :model="loginForm"
              :rules="loginRules"
              size="large"
              @submit.prevent="handleLogin"
            >
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="请输入用户名或邮箱"
                  prefix-icon="User"
                  clearable
                />
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入密码"
                  prefix-icon="Lock"
                  show-password
                  @keyup.enter="handleLogin"
                />
              </el-form-item>

              <el-form-item>
                <div class="login-options">
                  <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                  <el-link type="primary" :underline="false" @click="showForgotPasswordDialog">忘记密码？</el-link>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  class="login-button"
                  :loading="loading"
                  @click="handleLogin"
                >
                  登 录
                </el-button>
              </el-form-item>

              <el-form-item>
                <div class="register-link">
                  还没有账号？
                  <el-link type="primary" @click="$router.push('/register')">
                    立即注册
                  </el-link>
                </div>
              </el-form-item>

              <el-form-item>
                <div class="social-login">
                  <div class="social-login-divider">
                    <span>其他登录方式</span>
                  </div>
                  <div class="social-login-icons">
                    <div class="social-icon wechat-icon" @click="handleWeChatLogin" title="微信登录">
                      <img src="@/assets/wechat-icon.png" alt="微信登录" class="social-icon-img" />
                    </div>
                    <div class="social-icon qq-icon" @click="handleQQLogin" title="QQ登录">
                      <el-icon :size="28">
                        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                          <path fill="currentColor" d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z"/>
                        </svg>
                      </el-icon>
                    </div>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="短信登录" name="sms">
            <SmsLogin @login-success="handleSmsLoginSuccess" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 微信二维码弹窗 -->
    <el-dialog
      v-model="wechatQrDialogVisible"
      title="微信扫码登录"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="qr-container">
        <div v-if="wechatQrCodeImage" class="qr-code">
          <!-- 显示真实的二维码图片 -->
          <div class="qrcode-image-wrapper">
            <img :src="wechatQrCodeImage" alt="微信登录二维码" class="qrcode-image" />
          </div>
          <div class="qr-hint">
            <el-tag type="success" effect="plain">开发环境</el-tag>
            <p class="hint-text">请使用微信扫描二维码</p>
          </div>
        </div>
        <div v-else class="loading-qr">
          <el-icon :size="48" class="is-loading"><Loading /></el-icon>
          <p>正在生成二维码...</p>
        </div>
        <div class="qr-footer">
          <el-icon :size="16"><InfoFilled /></el-icon>
          <span>{{ wechatQrTip || '请使用微信扫描二维码登录' }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- QQ二维码弹窗 -->
    <el-dialog
      v-model="qqQrDialogVisible"
      title="QQ扫码登录"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="qr-container">
        <div v-if="qqQrCodeImage" class="qr-code">
          <!-- 显示真实的二维码图片 -->
          <div class="qrcode-image-wrapper qq-theme">
            <img :src="qqQrCodeImage" alt="QQ登录二维码" class="qrcode-image" />
          </div>
          <div class="qr-hint">
            <el-tag type="primary" effect="plain">开发环境</el-tag>
            <p class="hint-text">请使用手机QQ扫描二维码</p>
          </div>
        </div>
        <div v-else class="loading-qr">
          <el-icon :size="48" class="is-loading"><Loading /></el-icon>
          <p>正在生成二维码...</p>
        </div>
        <div class="qr-footer">
          <el-icon :size="16"><InfoFilled /></el-icon>
          <span>{{ qqQrTip || '请使用手机QQ扫描二维码登录' }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 忘记密码对话框 -->
    <ForgotPasswordDialog
      v-model:visible="forgotPasswordDialogVisible"
      @success="handleForgotPasswordSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { ChatRound, ChatLineSquare, Grid, Loading, InfoFilled } from '@element-plus/icons-vue'
import SmsLogin from './components/SmsLogin.vue'
import ForgotPasswordDialog from './components/ForgotPasswordDialog.vue'
import { oauthAPI } from '@/api/oauth'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('password')
const loginFormRef = ref()
const loading = ref(false)
const rememberMe = ref(false)
const wechatQrDialogVisible = ref(false)
const qqQrDialogVisible = ref(false)
const wechatQrCodeImage = ref('') // Base64二维码图片
const qqQrCodeImage = ref('') // Base64二维码图片
const wechatQrCodeUrl = ref('') // 二维码内容URL
const qqQrCodeUrl = ref('') // 二维码内容URL
const wechatQrTip = ref('') // 提示文本
const qqQrTip = ref('') // 提示文本
const forgotPasswordDialogVisible = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        // 检查是邮箱格式还是用户名格式
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/

        if (!emailPattern.test(value) && !usernamePattern.test(value)) {
          callback(new Error('请输入有效的用户名或邮箱地址'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loading.value = true

    // 调用真正的登录API
    const loginData = {
      username: loginForm.username,
      password: loginForm.password,
      remember: rememberMe.value
    }

    const success = await userStore.login(loginData)
    if (success) {
      router.push('/home')
    }

  } catch (error) {
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

// 短信登录成功回调
const handleSmsLoginSuccess = async (data) => {
  // 存储token和用户信息
  userStore.token = data.token
  userStore.user = data.user
  localStorage.setItem('token', data.token)

  router.push('/home')
}

// 微信登录
const handleWeChatLogin = async () => {
  try {
    // 先显示对话框
    wechatQrDialogVisible.value = true

    const response = await oauthAPI.getWeChatAuthorizeUrl('/home')

    if (response.code === 200) {
      const qrResponse = await oauthAPI.getWeChatQRCode(response.data.state)
      if (qrResponse.code === 200) {
        wechatQrCodeImage.value = qrResponse.data.qrCodeImage // Base64图片
        wechatQrCodeUrl.value = qrResponse.data.qrContent // 二维码URL
        wechatQrTip.value = qrResponse.data.tip // 提示文本
      }
    }
  } catch (error) {
    wechatQrDialogVisible.value = false
    ElMessage.error(error.message || '微信登录发起失败')
  }
}

// QQ登录
const handleQQLogin = async () => {
  try {
    // 先显示对话框
    qqQrDialogVisible.value = true

    const response = await oauthAPI.getQQAuthorizeUrl('/home')

    if (response.code === 200) {
      const qrResponse = await oauthAPI.getQQQRCode(response.data.state)
      if (qrResponse.code === 200) {
        qqQrCodeImage.value = qrResponse.data.qrCodeImage // Base64图片
        qqQrCodeUrl.value = qrResponse.data.qrContent // 二维码URL
        qqQrTip.value = qrResponse.data.tip // 提示文本
      }
    }
  } catch (error) {
    qqQrDialogVisible.value = false
    ElMessage.error(error.message || 'QQ登录发起失败')
  }
}

// 显示忘记密码对话框
const showForgotPasswordDialog = () => {
  forgotPasswordDialogVisible.value = true
}

// 忘记密码成功回调
const handleForgotPasswordSuccess = () => {
  ElMessage.success('密码重置成功，请使用新密码登录')
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%);
  background-size: 400px 400px;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

.auth-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.system-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 16px 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.system-subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.register-link {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-input__wrapper) {
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.login-tabs {
  margin-top: 20px;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__active-bar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 3px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #909399;
}

:deep(.el-tabs__item.is-active) {
  color: #667eea;
  font-weight: 600;
}

:deep(.el-tabs__item:hover) {
  color: #667eea;
}

/* 社交登录区域 */
.social-login {
  margin-top: 0;
}

.social-login-divider {
  text-align: center;
  margin: 2px 0 2px 0;
  position: relative;
}

.social-login-divider::before,
.social-login-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background: #DCDFE6;
}

.social-login-divider::before {
  left: 0;
}

.social-login-divider::after {
  right: 0;
}

.social-login-divider span {
  font-size: 13px;
  color: #909399;
  background: rgba(255, 255, 255, 0.95);
  padding: 0 10px;
}

.social-login-icons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 2px;
}

.social-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #EBEEF5;
  background: #ffffff;
}

.social-icon:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.wechat-icon {
  color: #09BB07;
  padding: 0;
  overflow: hidden;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wechat-icon:hover {
  border: none;
  background: transparent;
  transform: translateY(-3px) scale(1.05);
}

.social-icon-img {
  width: 85%;
  height: 85%;
  object-fit: cover;
  border-radius: 50%;
}

.qq-icon {
  color: #12B7F5;
}

.qq-icon:hover {
  border-color: #12B7F5;
  background: #f0f9ff;
}

/* 二维码弹窗样式 */
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

/* 二维码图片容器 */
.qrcode-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid #EBEEF5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qrcode-image-wrapper.qq-theme {
  border-color: #E6F7FF;
}

.qrcode-image {
  width: 250px;
  height: 250px;
  display: block;
  border-radius: 8px;
}

.qr-hint {
  margin-top: 20px;
  text-align: center;
}

.hint-text {
  margin-top: 12px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
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

:deep(.el-dialog__header) {
  text-align: center;
  padding: 20px 20px 10px;
}

:deep(.el-dialog__body) {
  padding: 10px 20px 30px;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 30px 20px;
    margin: 20px;
    border-radius: 16px;
  }

  .system-title {
    font-size: 24px;
  }

  .social-login-icons {
    gap: 15px;
  }

  .social-icon {
    width: 45px;
    height: 45px;
  }
}
</style>