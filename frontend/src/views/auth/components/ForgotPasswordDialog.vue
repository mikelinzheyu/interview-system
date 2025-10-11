<template>
  <el-dialog
    v-model="dialogVisible"
    title="重置密码"
    width="450px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-steps :active="currentStep" align-center finish-status="success">
      <el-step title="验证手机" />
      <el-step title="设置密码" />
      <el-step title="完成" />
    </el-steps>

    <div class="reset-content">
      <!-- 步骤1: 输入手机号和验证码 -->
      <div v-if="currentStep === 0" class="step-container">
        <el-form ref="phoneFormRef" :model="resetForm" :rules="phoneRules" label-width="0">
          <el-form-item prop="phone">
            <el-input
              v-model.trim="resetForm.phone"
              placeholder="请输入手机号"
              prefix-icon="Iphone"
              size="large"
              clearable
              maxlength="11"
            />
          </el-form-item>

          <el-form-item prop="code">
            <el-input
              v-model.trim="resetForm.code"
              placeholder="请输入验证码"
              prefix-icon="Message"
              size="large"
              clearable
              maxlength="6"
            >
              <template #append>
                <el-button
                  :disabled="countdown > 0 || codeVerified"
                  @click="handleSendCode"
                >
                  {{ codeVerified ? '验证码已验证' : (countdown > 0 ? `${countdown}秒后重试` : '获取验证码') }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>

        <el-button
          type="primary"
          size="large"
          class="full-width-button"
          :loading="loading"
          @click="handleVerifyCode"
        >
          下一步
        </el-button>
      </div>

      <!-- 步骤2: 设置新密码 -->
      <div v-if="currentStep === 1" class="step-container">
        <el-form ref="passwordFormRef" :model="resetForm" :rules="passwordRules" label-width="0">
          <el-form-item prop="newPassword">
            <el-input
              v-model="resetForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="resetForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleResetPassword"
            />
          </el-form-item>

          <div class="password-strength">
            <span>密码强度：</span>
            <el-tag :type="passwordStrength.type" size="small">
              {{ passwordStrength.text }}
            </el-tag>
          </div>
        </el-form>

        <div class="button-group">
          <el-button size="large" @click="handleGoBack">上一步</el-button>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleResetPassword"
          >
            重置密码
          </el-button>
        </div>
      </div>

      <!-- 步骤3: 完成 -->
      <div v-if="currentStep === 2" class="step-container success-container">
        <el-result
          icon="success"
          title="密码重置成功"
          sub-title="您的密码已成功重置，请使用新密码登录"
        >
          <template #extra>
            <el-button type="primary" size="large" @click="handleSuccess">
              返回登录
            </el-button>
          </template>
        </el-result>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/api/auth'

const dialogVisible = defineModel('visible', { type: Boolean, default: false })
const emit = defineEmits(['success'])

// 表单数据
const resetForm = ref({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 当前步骤
const currentStep = ref(0)
const loading = ref(false)
const countdown = ref(0)
const codeVerified = ref(false) // 验证码是否已通过验证

// 表单引用
const phoneFormRef = ref(null)
const passwordFormRef = ref(null)

// 手机号和验证码验证规则
const phoneRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '请输入6位数字验证码', trigger: 'blur' }
  ]
}

// 密码验证规则
const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      message: '密码需包含大小写字母和数字',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 密码强度计算
const passwordStrength = computed(() => {
  const password = resetForm.value.newPassword
  if (!password) return { text: '未输入', type: 'info' }

  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 10) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  if (strength <= 2) return { text: '弱', type: 'danger' }
  if (strength <= 3) return { text: '中等', type: 'warning' }
  return { text: '强', type: 'success' }
})

// 发送验证码
const handleSendCode = async () => {
  if (!resetForm.value.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }

  const phonePattern = /^1[3-9]\d{9}$/
  if (!phonePattern.test(resetForm.value.phone)) {
    ElMessage.error('请输入有效的手机号')
    return
  }

  try {
    loading.value = true
    const response = await authAPI.sendResetCode(resetForm.value.phone)

    if (response.code === 200) {
      ElMessage.success('验证码已发送，请查收短信')
      startCountdown()
    }
  } catch (error) {
    ElMessage.error(error.message || '发送验证码失败')
  } finally {
    loading.value = false
  }
}

// 倒计时
const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 验证验证码
const handleVerifyCode = async () => {
  if (!phoneFormRef.value) return

  try {
    const valid = await phoneFormRef.value.validate()
    if (!valid) return

    // 调用后端API验证验证码
    loading.value = true
    const response = await authAPI.verifyResetCode({
      phone: resetForm.value.phone,
      code: resetForm.value.code
    })

    if (response.code === 200) {
      ElMessage.success('验证码验证成功')
      // 验证码验证成功，标记并进入下一步
      codeVerified.value = true
      currentStep.value = 1
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || '验证码验证失败'
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}

// 返回上一步
const handleGoBack = () => {
  codeVerified.value = false // 重置验证状态，允许重新获取验证码
  currentStep.value = 0
}

// 重置密码
const handleResetPassword = async () => {
  if (!passwordFormRef.value) return

  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return

    loading.value = true

    const response = await authAPI.resetPassword({
      phone: resetForm.value.phone,
      code: resetForm.value.code,
      newPassword: resetForm.value.newPassword
    })

    if (response.code === 200) {
      currentStep.value = 2
      ElMessage.success('密码重置成功')
    }
  } catch (error) {
    ElMessage.error(error.message || '密码重置失败')
  } finally {
    loading.value = false
  }
}

// 成功后返回
const handleSuccess = () => {
  dialogVisible.value = false
  emit('success')
}

// 关闭对话框
const handleClose = () => {
  // 重置表单
  resetForm.value = {
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  }
  currentStep.value = 0
  countdown.value = 0
  codeVerified.value = false // 重置验证状态
}

// 监听对话框关闭
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    handleClose()
  }
})
</script>

<style scoped>
.reset-content {
  padding: 30px 10px 10px;
  min-height: 300px;
}

.step-container {
  margin-top: 20px;
}

.full-width-button {
  width: 100%;
  margin-top: 10px;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.button-group .el-button {
  flex: 1;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -10px 0 10px 0;
  font-size: 13px;
  color: #606266;
}

.success-container {
  text-align: center;
}

:deep(.el-steps) {
  padding: 0 20px;
}

:deep(.el-result) {
  padding: 20px 0;
}

:deep(.el-result__icon svg) {
  width: 64px;
  height: 64px;
}

:deep(.el-result__title) {
  margin-top: 16px;
}
</style>