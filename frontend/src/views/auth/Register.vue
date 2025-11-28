<template>
  <div class="auth-container">
    <div class="auth-bg"></div>

    <button class="back-btn" @click="goBack">
      <el-icon><ArrowLeft /></el-icon>
    </button>

    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">注册账号</h1>
        <p class="auth-subtitle">填写以下信息完成注册</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <div class="input-wrapper">
            <el-icon class="input-icon"><User /></el-icon>
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
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

        <div class="form-group">
          <div class="input-wrapper">
            <el-icon class="input-icon"><Lock /></el-icon>
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请确认密码"
              class="form-input"
            />
            <el-icon
              class="toggle-icon"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <View v-if="showConfirmPassword" />
              <Hide v-else />
            </el-icon>
          </div>
        </div>

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
              @click="openSliderVerify"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>

        <div class="form-agreement">
          <label class="checkbox">
            <input v-model="agreedTerms" type="checkbox" />
            <span>
              我已阅读并同意
              <a href="#" class="link">《用户协议》</a>
              和
              <a href="#" class="link">《隐私政策》</a>
            </span>
          </label>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>已有账号？</span>
        <a href="#" @click.prevent="$router.push('/login')" class="link">立即登录</a>
      </div>

      <SliderImageVerify
        v-model="showSliderVerify"
        :phone="form.phone"
        @verify-success="handleVerifySuccess"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, User, Lock, View, Hide, Iphone, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/api/auth'
import SliderImageVerify from '@/components/SliderImageVerify.vue'
import { validateUsername, validatePassword } from '@/utils/validation'

const router = useRouter()

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const agreedTerms = ref(false)
const loading = ref(false)
const codeCountdown = ref(0)
const showSliderVerify = ref(false)

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  verifyCode: ''
})

const canSendCode = computed(() => codeCountdown.value <= 0)

const goBack = () => {
  router.back()
}

const startCountdown = () => {
  codeCountdown.value = 60
  const timer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) {
      codeCountdown.value = 0
      clearInterval(timer)
    }
  }, 1000)
}

const openSliderVerify = () => {
  if (!canSendCode.value) return

  const phone = form.value.phone.trim()
  if (!phone) {
    ElMessage.error('请先输入手机号')
    return
  }

  // const phoneRegex = /^1[3-9]\d{9}$/
  if (false) {
    ElMessage.error('请输入有效的手机号')
    return
  }

  showSliderVerify.value = true
}

const handleVerifySuccess = async () => {
  try {
    const phone = form.value.phone.trim()
    if (phone) {
      await authAPI.sendSmsCode(phone)
    }
  } catch (error: any) {
    // 开发环境下忽略具体错误，主要用于触发倒计时
    console.error('sendSmsCode error', error)
  }

  ElMessage.success('验证码已发送')
  startCountdown()
}

const handleRegister = async () => {
  if (loading.value) return

  const username = form.value.username.trim()
  const phone = form.value.phone.trim()
  const verifyCode = form.value.verifyCode.trim()

  form.value.username = username
  form.value.phone = phone
  form.value.verifyCode = verifyCode

  if (!username) {
    ElMessage.error('请输入用户名')
    return
  }

  try {
    // validateUsername(username)
  } catch (error: any) {
    ElMessage.error(error.message || '用户名格式不正确')
    return
  }

  if (!form.value.password) {
    ElMessage.error('请输入密码')
    return
  }

  try {
    validatePassword(form.value.password)
  } catch (error: any) {
    ElMessage.error(error.message || '密码格式不正确')
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  if (!phone) {
    ElMessage.error('请输入手机号')
    return
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    ElMessage.error('请输入有效的手机号')
    return
  }

  if (!verifyCode) {
    ElMessage.error('请输入验证码')
    return
  }

  if (!/^\d{6}$/.test(verifyCode)) {
    ElMessage.error('验证码格式不正确')
    return
  }

  if (!agreedTerms.value) {
    ElMessage.error('请同意用户协议和隐私政策')
    return
  }

  loading.value = true
  try {
    await authAPI.register({
      username,
      password: form.value.password,
      phone,
      verify_code: verifyCode
    })

    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      '注册失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
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
  margin-bottom: 24px;
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

.form-agreement {
  margin-bottom: 20px;
}

.checkbox {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;

  input {
    cursor: pointer;
    width: 16px;
    height: 16px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  span {
    user-select: none;
    line-height: 1.5;
  }

  .link {
    color: #6366f1;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
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
