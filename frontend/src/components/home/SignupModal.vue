<template>
  <el-dialog v-model="isOpen" title="注册" width="420px" class="auth-modal" @close="handleClose">
    <div class="signup-form">
      <el-input v-model="form.name" placeholder="用户名" clearable />
      <el-input v-model="form.email" placeholder="邮箱" type="email" clearable />
      <el-input v-model="form.password" placeholder="密码" type="password" show-password clearable />
      <el-input v-model="form.confirmPassword" placeholder="确认密码" type="password" show-password clearable />
      <el-button type="primary" class="auth-btn" @click="handleSignup">注册</el-button>
      <p class="auth-link">已有账号？<a href="#" @click.prevent="switchToLogin">立即登录</a></p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'switch-login'])

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleSignup = () => {
  if (!form.value.name || !form.value.email || !form.value.password || !form.value.confirmPassword) {
    ElMessage.warning('请填写所有字段')
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  ElMessage.success('注册成功！')
  isOpen.value = false
  form.value = { name: '', email: '', password: '', confirmPassword: '' }
}

const handleClose = () => {
  form.value = { name: '', email: '', password: '', confirmPassword: '' }
}

const switchToLogin = () => {
  emit('switch-login')
}
</script>

<style scoped lang="scss">
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-btn {
  width: 100%;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 8px;
}

.auth-link {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin: 0;

  a {
    color: #0071e3;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
}

:deep(.el-dialog) {
  border-radius: 16px;
}

:deep(.el-dialog__body) {
  padding: 24px;
}
</style>
