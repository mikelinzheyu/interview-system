<template>
  <div class="callback-container">
    <div class="callback-content">
      <div v-if="processing" class="processing">
        <el-icon :size="64" class="is-loading"><Loading /></el-icon>
        <h2>正在登录...</h2>
        <p>{{ statusMessage }}</p>
      </div>

      <div v-else-if="error" class="error">
        <el-icon :size="64" color="#F56C6C"><CircleClose /></el-icon>
        <h2>登录失败</h2>
        <p>{{ error }}</p>
        <el-button type="primary" @click="backToLogin">返回登录</el-button>
      </div>

      <div v-else class="success">
        <el-icon :size="64" color="#67C23A"><CircleCheck /></el-icon>
        <h2>登录成功</h2>
        <p>正在跳转...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Loading, CircleClose, CircleCheck } from '@element-plus/icons-vue'
import { oauthAPI } from '@/api/oauth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const processing = ref(true)
const error = ref('')
const statusMessage = ref('正在验证授权信息...')

onMounted(async () => {
  const { code, state } = route.query
  const provider = route.params.provider

  if (!code || !state) {
    error.value = '缺少必要的授权参数'
    processing.value = false
    return
  }

  try {
    statusMessage.value = '正在获取用户信息...'

    let response
    if (provider === 'wechat') {
      response = await oauthAPI.weChatCallback(code, state)
    } else if (provider === 'qq') {
      response = await oauthAPI.qqCallback(code, state)
    } else {
      throw new Error('不支持的登录方式')
    }

    if (response.code === 200) {
      const { token, user, isNewUser } = response.data

      // 存储token和用户信息
      userStore.token = token
      userStore.user = user
      localStorage.setItem('token', token)

      statusMessage.value = '登录成功，正在跳转...'

      if (isNewUser) {
        ElMessage.success('欢迎使用智能面试系统！')
      } else {
        ElMessage.success('欢迎回来！')
      }

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }
  } catch (err) {
    console.error('OAuth回调错误:', err)
    error.value = err.message || '登录过程中发生错误'
    processing.value = false
  }
})

const backToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.callback-content {
  background: white;
  padding: 60px 80px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 400px;
}

.processing, .error, .success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.error p {
  color: #F56C6C;
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