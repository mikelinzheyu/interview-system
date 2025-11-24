<template>
  <el-dialog v-model="isOpen" title="登录" width="420px" class="auth-modal" @close="handleClose">
    <div class="login-form">
      <el-input v-model="form.email" placeholder="邮箱或手机号" clearable />
      <el-input v-model="form.password" placeholder="密码" type="password" show-password clearable />
      <el-button type="primary" class="auth-btn" @click="handleLogin">登录</el-button>
      <p class="auth-link">没有账号？<a href="#" @click.prevent="switchToSignup">立即注册</a></p>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'switch-signup'])

const form = ref({
  email: '',
  password: ''
})

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleLogin = () => {
  if (!form.value.email || !form.value.password) {
    ElMessage.warning('请输入邮箱和密码')
    return
  }
  ElMessage.success('登录成功！')
  isOpen.value = false
  form.value = { email: '', password: '' }
}

const handleClose = () => {
  form.value = { email: '', password: '' }
}

const switchToSignup = () => {
  emit('switch-signup')
}
</script>

<style scoped lang="scss">
.login-form {
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
