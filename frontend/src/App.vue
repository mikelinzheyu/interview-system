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

// 监听用户登录状态，自动连接/断开 Socket
watch(
  () => userStore.token,
  (newToken) => {
    if (newToken) {
      // 用户已登录，初始化 Socket 连接
      console.log('[App] 用户已登录，初始化 WebSocket 连接')
      socketService.connect(newToken)
    } else {
      // 用户已登出，断开 Socket 连接
      console.log('[App] 用户已登出，断开 WebSocket 连接')
      socketService.disconnect()
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 如果用户已经登录（刷新页面后），立即连接
  if (userStore.token) {
    console.log('[App] 应用启动，用户已登录，初始化 WebSocket 连接')
    socketService.connect(userStore.token)
  }
})

onUnmounted(() => {
  // 应用卸载时断开连接
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