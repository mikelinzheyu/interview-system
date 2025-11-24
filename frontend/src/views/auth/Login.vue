<template>
  <div class="auth-container">
    <div class="auth-bg"></div>

    <button class="back-btn" @click="goBack">
      <el-icon><ArrowLeft /></el-icon>
    </button>

    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">欢迎回来</h1>
        <p class="auth-subtitle">登录以继续你的练习</p>
      </div>

      <div class="auth-tabs">
        <button
          :class="['tab-btn', { active: loginMode === 'password' }]"
          @click="loginMode = 'password'"
        >
          密码登录
        </button>
        <button
          :class="['tab-btn', { active: loginMode === 'code' }]"
          @click="loginMode = 'code'"
        >
          验证码登录
        </button>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <template v-if="loginMode === 'password'">
          <div class="form-group">
            <div class="input-wrapper">
              <el-icon class="input-icon"><User /></el-icon>
              <input
                v-model="form.username"
                type="text"
                placeholder="用户名 / 手机号 / 邮箱"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="input-wrapper">
              <el-icon class="input-icon"><Lock /></el-icon>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="form-input"
              />
              <el-icon class="toggle-icon" @click="showPassword = !showPassword">
                <View v-if="showPassword" />
                <Hide v-else />
              </el-icon>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="form-group">
            <div class="input-wrapper">
              <el-icon class="input-icon"><Iphone /></el-icon>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="请输入手机号"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="input-row">
              <div class="input-wrapper flex-1">
                <el-icon class="input-icon"><Message /></el-icon>
                <input
                  v-model="form.verifyCode"
                  type="text"
                  placeholder="请输入验证码"
                  class="form-input"
                />
              </div>
              <button
                type="button"
                class="verify-btn"
                :disabled="codeCountdown > 0"
                @click="sendCode"
              >
                {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>
        </template>

        <div class="form-options">
          <label class="checkbox">
            <input v-model="rememberMe" type="checkbox" />
            <span>记住登录状态</span>
          </label>
          <a href="#" class="forgot-link">忘记密码？</a>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="social-login">
        <div class="divider">
          <span>其它登录方式</span>
        </div>
        <div class="social-icons">
          <button type="button" class="social-icon wechat" title="微信登录" @click="openWeChatQr">
            <el-icon :size="24" color="#09BB07">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="currentColor"
                  d="M666.67 512c0 155.7-126.3 282-282 282s-282-126.3-282-282 126.3-282 282-282 282 126.3 282 282z"
                />
                <path
                  fill="currentColor"
                  d="M877.33 657.33c0 124.56-101.1 225.67-225.66 225.67-124.57 0-225.67-101.1-225.67-225.67 0-124.56 101.1-225.66 225.67-225.66 124.56 0 225.66 101.1 225.66 225.66z"
                />
              </svg>
            </el-icon>
          </button>
          <button type="button" class="social-icon qq" title="QQ登录" @click="openQQQr">
            <el-icon :size="24" color="#12B7F5">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="currentColor"
                  d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z"
                />
              </svg>
            </el-icon>
          </button>
        </div>
      </div>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <a href="#" @click.prevent="$router.push('/register')" class="link">立即注册</a>
      </div>

      <WeChatLogin ref="wechatLoginRef" :compact="true" />
      <QQLogin ref="qqLoginRef" :compact="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, User, Lock, View, Hide, Iphone, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { authAPI } from '@/api/auth'
import WeChatLogin from './components/WeChatLogin.vue'
import QQLogin from './components/QQLogin.vue'

const router = useRouter()
const userStore = useUserStore()

const loginMode = ref<'password' | 'code'>('password')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const codeCountdown = ref(0)

const form = ref({
  username: '',
  password: '',
  phone: '',
  verifyCode: ''
})

const wechatLoginRef = ref<InstanceType<typeof WeChatLogin> | null>(null)
const qqLoginRef = ref<InstanceType<typeof QQLogin> | null>(null)

const goBack = () => {
  router.back()
}

const openWeChatQr = () => {
  wechatLoginRef.value?.startLogin()
}

const openQQQr = () => {
  qqLoginRef.value?.startLogin()
}

const handleLogin = async () => {
  if (loginMode.value === 'password') {
    if (!form.value.username || !form.value.password) {
      ElMessage.error('请输入用户名和密码')
      return
    }
  } else {
    if (!form.value.phone || !form.value.verifyCode) {
      ElMessage.error('请输入手机号和验证码')
      return
    }
  }

  loading.value = true
  try {
    let ok = false

    if (loginMode.value === 'password') {
      ok = await userStore.login({
        username: form.value.username,
        password: form.value.password
      })
    } else {
      ok = await userStore.loginBySms({
        phone: form.value.phone,
        code: form.value.verifyCode
      })
    }

    if (!ok) return

    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

const sendCode = () => {
  if (!form.value.phone) {
    ElMessage.error('请先输入手机号')
    return
  }

  authAPI
    .sendSmsCode(form.value.phone)
    .then(() => {
      ElMessage.success('验证码已发送')
    })
    .catch(() => {
      ElMessage.error('验证码发送失败，请稍后重试')
    })

  codeCountdown.value = 60

  const timer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}
</script>

<style scoped lang="scss">
.auth-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.auth-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 50%, #ddd6fe 100%);
  z-index: 0;
}

.back-btn {
  position: fixed;
  top: 24px;
  left: 24px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f2937;
  transition: all 0.3s ease;
  z-index: 10;

  &:hover {
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-icon) {
    font-size: 20px;
  }
}

.auth-card {
  position: relative;
  z-index: 1;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  padding: 40px;
  width: 100%;
  max-width: 420px;
}

.auth-header {
  margin-bottom: 28px;
  text-align: center;
}

.auth-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.auth-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;

  &.active {
    color: #6366f1;
    border-bottom-color: #6366f1;
  }

  &:hover:not(.active) {
    color: #4b5563;
  }
}

.auth-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:focus-within {
    background: #ffffff;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
}

.input-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: #9ca3af;
  margin-right: 8px;
  font-size: 18px;
}

.form-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #111827;
  outline: none;

  &::placeholder {
    color: #d1d5db;
  }
}

.toggle-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s ease;
  font-size: 18px;

  &:hover {
    color: #6366f1;
  }
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: center;

  .input-wrapper {
    flex: 1;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  font-size: 13px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #6b7280;

  input {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  span {
    user-select: none;
  }
}

.forgot-link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.verify-btn {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6366f1;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #6366f1;
    background: #f3f4f6;
  }

  &:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }
}

.submit-btn {
  width: 100%;
  height: 44px;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
}

.social-login {
  margin-bottom: 20px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #9ca3af;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }
}

.social-icons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.social-icon {
  width: 48px;
  height: 48px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #6366f1;
    color: #6366f1;
  }

  &.wechat {
    color: #09b83e;

    &:hover {
      border-color: #09b83e;
    }
  }

  &.qq {
    color: #fa7f16;

    &:hover {
      border-color: #fa7f16;
    }
  }
}

.auth-footer {
  text-align: center;
  font-size: 13px;
  color: #6b7280;

  .link {
    color: #6366f1;
    text-decoration: none;
    font-weight: 500;
    margin-left: 4px;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 640px) {
  .auth-card {
    padding: 24px;
    border-radius: 16px;
  }

  .auth-title {
    font-size: 24px;
  }

  .back-btn {
    top: 16px;
    left: 16px;
  }
}
</style>
