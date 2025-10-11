import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'
import { userAPI } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  // 登录
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      if (response.code === 200) {
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('token', response.data.token)
        ElMessage.success('登录成功')
        return true
      }
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
      return false
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      if (response.code === 200) {
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('token', response.data.token)
        ElMessage.success('注册成功')
        return true
      }
    } catch (error) {
      ElMessage.error(error.message || '注册失败')
      return false
    }
  }

  // 登出
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      ElMessage.success('已退出登录')
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      if (!token.value) return
      const response = await userAPI.getUserInfo()
      if (response.code === 200) {
        user.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      // 如果获取用户信息失败，可能是token过期
      logout()
    }
  }

  // 更新用户信息
  const updateUserInfo = async (data) => {
    try {
      const response = await userAPI.updateProfile(data)
      if (response.code === 200) {
        await fetchUserInfo()
        return true
      }
    } catch (error) {
      console.error('Failed to update user info:', error)
      return false
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUserInfo,
    updateUserInfo
  }
})