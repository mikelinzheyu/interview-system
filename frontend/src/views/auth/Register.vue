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
          <p class="system-subtitle">创建您的专业面试账户</p>
        </div>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          size="large"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="real_name">
            <el-input
              v-model="registerForm.real_name"
              placeholder="请输入真实姓名"
              prefix-icon="Avatar"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="phone">
            <el-input
              v-model="registerForm.phone"
              placeholder="请输入手机号"
              prefix-icon="Iphone"
              maxlength="11"
              clearable
            />
          </el-form-item>

          <!-- 步骤0: 显示"点击按钮进行验证" -->
          <el-form-item v-if="verificationStep === 0">
            <el-button
              type="primary"
              @click="handleShowSlider"
              :disabled="!registerForm.phone"
              class="verify-button"
            >
              <el-icon><Lock /></el-icon>
              点击按钮进行验证
            </el-button>
            <div v-if="!registerForm.phone" class="hint-text">请先输入手机号</div>
          </el-form-item>

          <!-- 步骤1: 显示验证码输入框 -->
          <el-form-item v-else-if="verificationStep === 1" prop="code">
            <div class="code-input-wrapper">
              <el-input
                v-model="registerForm.code"
                placeholder="请输入验证码"
                prefix-icon="Message"
                maxlength="6"
                clearable
                @keyup.enter="handleRegister"
              />
              <el-button
                class="code-button"
                :disabled="codeButtonDisabled"
                @click="handleSendCode"
              >
                {{ codeButtonText }}
              </el-button>
            </div>
          </el-form-item>

          <!-- 滑块验证弹窗 -->
          <el-dialog
            v-model="showSliderDialog"
            title="安全验证"
            width="400px"
            :close-on-click-modal="false"
            class="slider-dialog"
          >
            <Vcode
              :show="showSliderDialog"
              @success="onSliderSuccess"
              @close="onSliderClose"
            />
          </el-dialog>

          <el-form-item>
            <el-checkbox v-model="agreeTerms">
              我已阅读并同意
              <el-link type="primary" :underline="false">用户协议</el-link>
              和
              <el-link type="primary" :underline="false">隐私政策</el-link>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="register-button"
              :loading="loading"
              :disabled="!agreeTerms"
              @click="handleRegister"
            >
              立即注册
            </el-button>
          </el-form-item>

          <el-form-item>
            <div class="login-link">
              已有账号？
              <el-link type="primary" @click="$router.push('/login')">
                立即登录
              </el-link>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { ChatRound, Lock, CircleCheck } from '@element-plus/icons-vue'
import Vcode from 'vue3-puzzle-vcode'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref()
const loading = ref(false)
const agreeTerms = ref(false)

const registerForm = reactive({
  username: '',
  phone: '',
  code: '',
  real_name: '',
  password: '',
  confirmPassword: ''
})

// 验证流程步骤
const verificationStep = ref(0) // 0: 初始状态, 1: 验证通过显示验证码框

// 滑块验证
const showSliderDialog = ref(false)
const captchaVerified = ref(false)
const captchaToken = ref('')

// 验证码倒计时
const countdown = ref(0)
const codeButtonDisabled = ref(false)
const codeButtonText = ref('发送验证码')

let timer = null

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
}

// 显示滑块验证弹窗（先验证手机号）
const handleShowSlider = () => {
  // 验证手机号
  if (!registerForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }

  const phonePattern = /^1[3-9]\d{9}$/
  if (!phonePattern.test(registerForm.phone)) {
    ElMessage.warning('请输入正确的手机号格式')
    return
  }

  // 验证通过，显示滑块弹窗
  showSliderDialog.value = true
}

// 滑块验证成功回调
const onSliderSuccess = async (msg) => {
  console.log('滑块验证成功', msg)

  // 标记验证通过
  captchaVerified.value = true
  captchaToken.value = 'verified_' + Date.now()

  // 关闭弹窗
  showSliderDialog.value = false

  // 切换到步骤1 - 显示验证码输入框
  verificationStep.value = 1

  ElMessage.success('验证成功！正在发送验证码...')

  // 自动发送验证码
  await handleSendCode()
}

// 滑块验证关闭回调
const onSliderClose = () => {
  showSliderDialog.value = false
}

// 发送验证码
const handleSendCode = async () => {
  // 验证手机号
  if (!registerForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }

  const phonePattern = /^1[3-9]\d{9}$/
  if (!phonePattern.test(registerForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  try {
    codeButtonDisabled.value = true

    // 调用发送验证码API
    const response = await fetch('/api/auth/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: registerForm.phone })
    })

    const result = await response.json()

    if (result.code === 200) {
      ElMessage.success('验证码已发送，请查收')

      // 开始倒计时
      countdown.value = 60
      codeButtonText.value = `${countdown.value}秒后重试`

      timer = setInterval(() => {
        countdown.value--
        if (countdown.value > 0) {
          codeButtonText.value = `${countdown.value}秒后重试`
        } else {
          clearInterval(timer)
          codeButtonText.value = '重新发送'
          codeButtonDisabled.value = false
        }
      }, 1000)
    } else if (result.code === 429) {
      ElMessage.warning(result.message || '发送过于频繁，请稍后再试')
      codeButtonDisabled.value = false
    } else {
      ElMessage.error(result.message || '验证码发送失败')
      codeButtonDisabled.value = false
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
    codeButtonDisabled.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    const valid = await registerFormRef.value.validate()
    if (!valid) return

    if (!captchaVerified.value) {
      ElMessage.warning('请先完成滑块验证')
      return
    }

    if (!agreeTerms.value) {
      ElMessage.warning('请先同意用户协议和隐私政策')
      return
    }

    loading.value = true

    // 调用注册API
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: registerForm.username,
        phone: registerForm.phone,
        code: registerForm.code,
        real_name: registerForm.real_name,
        password: registerForm.password,
        captchaToken: captchaToken.value
      })
    })

    const result = await response.json()

    if (result.code === 200) {
      // 保存用户信息和token
      userStore.user = result.data.user
      userStore.token = result.data.token
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data.user))

      ElMessage.success('注册成功，欢迎使用智能面试系统！')
      router.push('/home')
    } else {
      ElMessage.error(result.message || '注册失败，请稍后重试')
    }

  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
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
  max-width: 420px;
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

.register-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
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

:deep(.el-checkbox__label) {
  font-size: 13px;
  color: #666;
}

.code-input-wrapper {
  display: flex;
  gap: 10px;
}

.code-input-wrapper :deep(.el-input) {
  flex: 1;
}

.code-button {
  min-width: 110px;
  height: 48px;
  font-size: 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.code-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #909399;
}

.slider-captcha-wrapper {
  width: 100%;
}

.verify-button {
  width: 100%;
  height: 48px;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 2px solid #67C23A;
  border-radius: 8px;
  color: #67C23A;
  font-size: 15px;
  font-weight: 600;
}

:deep(.slider-dialog .el-dialog__header) {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #eee;
}

:deep(.slider-dialog .el-dialog__body) {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.hint-text {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
  text-align: center;
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
}
</style>