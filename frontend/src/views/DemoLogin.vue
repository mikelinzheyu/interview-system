<template>
  <div class="demo-login-container">
    <el-card class="login-card">
      <div class="login-header">
        <h2>演示登录</h2>
        <p>快速进入AI面试系统</p>
      </div>

      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="输入任意用户名"></el-input>
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="输入任意密码"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="demo-tips">
        <el-alert
          title="演示说明"
          type="info"
          :closable="false"
          description="这是演示版本，输入任意用户名和密码即可登录体验AI面试功能。"
        />
      </div>

      <div class="quick-actions">
        <h4>快速操作</h4>
        <el-button-group>
          <el-button @click="quickLogin('前端工程师')">前端工程师</el-button>
          <el-button @click="quickLogin('后端工程师')">后端工程师</el-button>
          <el-button @click="quickLogin('测试工程师')">测试工程师</el-button>
        </el-button-group>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  username: 'demo_user',
  password: '123456'
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }

  loading.value = true

  try {
    const success = await userStore.login({
      username: form.username,
      password: form.password
    })

    if (success) {
      ElMessage.success('登录成功，即将跳转到AI面试')
      setTimeout(() => {
        router.push('/interview/ai')
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

const quickLogin = async (role) => {
  form.username = role
  form.password = '123456'
  await handleLogin()
}
</script>

<style scoped>
.demo-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  color: #303133;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.demo-tips {
  margin: 20px 0;
}

.quick-actions {
  margin-top: 30px;
  text-align: center;
}

.quick-actions h4 {
  color: #606266;
  margin-bottom: 15px;
  font-size: 14px;
}

.el-button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.el-button-group .el-button {
  margin: 0;
  flex: 1;
  min-width: 100px;
}

:deep(.el-card__body) {
  padding: 40px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

@media (max-width: 480px) {
  :deep(.el-card__body) {
    padding: 30px 20px;
  }

  .login-card {
    max-width: 350px;
  }

  .el-button-group .el-button {
    min-width: 80px;
    font-size: 12px;
  }
}
</style>