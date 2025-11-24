<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import socketService from '@/utils/socket'

const userStore = useUserStore()
const isMockMode = import.meta.env.VITE_USE_MOCK_DATA !== 'false'
const WS_ENABLED = !isMockMode && import.meta.env.VITE_WS_ENABLED !== 'false'

watch(
  () => userStore.token,
  (newToken) => {
    if (!WS_ENABLED) {
      console.log('[App] WebSocket 已禁用（mock 模式或 VITE_WS_ENABLED=false）')
      socketService.disconnect()
      return
    }

    if (newToken) {
      console.log('[App] 用户已登录，初始化 WebSocket 连接')
      socketService.connect(newToken)
    } else {
      console.log('[App] 用户未登录或已退出，断开 WebSocket 连接')
      socketService.disconnect()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  // 如果有token，立即初始化用户信息
  if (userStore.token) {
    try {
      console.log('[App] 应用启动，用户已登录，开始初始化用户信息')
      const success = await userStore.fetchUserInfo()

      if (!success) {
        console.warn('[App] 获取用户信息失败，但保留登录状态（可能是 token 已过期）')
      } else {
        console.log('[App] 用户信息获取完成')
      }
    } catch (error) {
      console.error('[App] 初始化用户信息异常:', error)
      // 不要中断，用户仍可以访问受保护资源
    }
  } else {
    console.log('[App] 应用启动，用户未登录')
  }

  // 初始化 WebSocket 连接（独立于用户信息获取）
  if (userStore.token && WS_ENABLED) {
    console.log('[App] 用户已登录，初始化 WebSocket 连接')
    socketService.connect(userStore.token)
  }
})

onUnmounted(() => {
  socketService.disconnect()
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
