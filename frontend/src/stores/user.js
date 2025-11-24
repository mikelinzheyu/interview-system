import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/auth'
import { userAPI } from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  // 计算用户是否为管理员
  const isAdmin = computed(() => {
    return user.value?.role === 'admin' || user.value?.isAdmin === true
  })

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

  // 短信验证码登录
  const loginBySms = async (data) => {
    try {
      const response = await authAPI.loginBySms(data)
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
      if (!token.value) {
        console.warn('[User] No token available, skipping user info fetch')
        return false
      }

      const response = await userAPI.getUserInfo()

      if (response.code === 200) {
        user.value = response.data
        console.log('[User] User info fetched successfully:', user.value)
        return true
      } else if (response.code === 401 || response.code === 403) {
        // 只在 token 真正失效时登出
        console.warn('[User] Token expired or unauthorized (401/403), logging out')
        await logout()
        return false
      } else {
        // 其他错误（5xx, 4xx 等）：记录但保留认证状态
        console.warn('[User] Failed to fetch user info (code:', response.code, '), keeping auth intact')
        // ✓ 重要：不调用 logout()，保留已认证状态
        return true
      }
    } catch (error) {
      // 网络错误、超时等：记录但保留认证状态
      console.error('[User] Network error fetching user info:', error.message)
      // ✓ 重要：不调用 logout()，保留已认证状态
      // 用户仍然可以访问受保护资源，只是缺少用户详细信息
      return true
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
    isAdmin,
    login,
    loginBySms,
    register,
    logout,
    fetchUserInfo,
    updateUserInfo
  }
})
