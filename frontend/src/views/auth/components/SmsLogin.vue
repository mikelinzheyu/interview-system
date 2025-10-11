<template>
  <el-form
    ref="smsFormRef"
    :model="smsForm"
    :rules="smsRules"
    size="large"
    @submit.prevent="handleSmsLogin"
  >
    <el-form-item prop="phone">
      <el-input
        v-model="smsForm.phone"
        placeholder="请输入手机号"
        prefix-icon="Iphone"
        maxlength="11"
        clearable
      />
    </el-form-item>

    <el-form-item prop="code">
      <div class="code-input-wrapper">
        <el-input
          v-model="smsForm.code"
          placeholder="请输入6位验证码"
          prefix-icon="Message"
          maxlength="6"
          clearable
          @keyup.enter="handleSmsLogin"
        />
        <el-button
          :disabled="countdown > 0 || sendingCode"
          :loading="sendingCode"
          class="code-button"
          @click="handleSendCode"
        >
          {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
        </el-button>
      </div>
    </el-form-item>

    <el-form-item>
      <el-button
        type="primary"
        size="large"
        class="login-button"
        :loading="loading"
        @click="handleSmsLogin"
      >
        登 录
      </el-button>
    </el-form-item>

    <el-form-item>
      <div class="tips">
        未注册的手机号验证后将自动注册
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/api/auth'

const emit = defineEmits(['login-success'])

const smsFormRef = ref()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer = null

const smsForm = reactive({
  phone: '',
  code: ''
})

// 手机号验证规则
const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
    return
  }
  const phonePattern = /^1[3-9]\d{9}$/
  if (!phonePattern.test(value)) {
    callback(new Error('请输入有效的手机号码'))
    return
  }
  callback()
}

const smsRules = {
  phone: [
    { required: true, validator: validatePhone, trigger: ['blur', 'change'] }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码必须为数字', trigger: 'blur' }
  ]
}

// 发送验证码
const handleSendCode = async () => {
  // 先验证手机号
  try {
    await smsFormRef.value.validateField('phone')
  } catch (error) {
    return
  }

  sendingCode.value = true

  try {
    const response = await authAPI.sendSmsCode(smsForm.phone)

    if (response.code === 200) {
      ElMessage.success('验证码发送成功')

      // 开发环境下显示验证码（方便测试）
      if (response.data.devCode) {
        ElMessage.info({
          message: `【开发模式】验证码: ${response.data.devCode}`,
          duration: 10000,
          showClose: true
        })
      }

      // 启动倒计时
      startCountdown()
    }
  } catch (error) {
    ElMessage.error(error.message || '验证码发送失败')
  } finally {
    sendingCode.value = false
  }
}

// 启动倒计时
const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// 短信登录
const handleSmsLogin = async () => {
  if (!smsFormRef.value) return

  try {
    const valid = await smsFormRef.value.validate()
    if (!valid) return

    loading.value = true

    const response = await authAPI.loginBySms({
      phone: smsForm.phone,
      code: smsForm.code
    })

    if (response.code === 200) {
      ElMessage.success('登录成功')
      emit('login-success', response.data)
    }
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请检查验证码')
  } finally {
    loading.value = false
  }
}

// 清理定时器
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.code-input-wrapper {
  display: flex;
  gap: 10px;
  width: 100%;
}

.code-input-wrapper :deep(.el-input) {
  flex: 1;
}

.code-button {
  min-width: 120px;
  white-space: nowrap;
  height: 100%;
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

.tips {
  text-align: center;
  color: #909399;
  font-size: 13px;
  width: 100%;
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
</style>