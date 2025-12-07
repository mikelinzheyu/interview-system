import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  User,
  UserProfile,
  UserSecurity,
  UserPrivacy,
  UserNotifications,
  UserPreferences
} from '@/types/user'
import { userAPI } from '@/api/user'
import { useUserStore } from '@/stores/user'

// Tailwind Color Palettes (Hex values)
const COLOR_PALETTES: Record<string, Record<number, string>> = {
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
    500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc',
    500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87'
  },
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
    500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b'
  },
  rose: {
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
    500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337'
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
    500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f'
  },
  cyan: {
    50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee',
    500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63'
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // ========== State ==========

  const profile = ref<UserProfile | null>(null)
  const security = ref<UserSecurity | null>(null)
  const privacy = ref<UserPrivacy | null>(null)
  const notifications = ref<UserNotifications | null>(null)
  const preferences = ref<UserPreferences | null>(null)

  // 按需加载标志 (避免重复请求)
  const loaded = ref({
    profile: false,
    security: false,
    privacy: false,
    notifications: false,
    preferences: false
  })

  const loading = ref({
    profile: false,
    security: false,
    privacy: false,
    notifications: false,
    preferences: false
  })

  const errors = ref<Record<string, string | null>>({
    profile: null,
    security: null,
    privacy: null,
    notifications: null,
    preferences: null
  })

  const success = ref<Record<string, boolean>>({
    profile: false,
    security: false,
    privacy: false,
    notifications: false,
    preferences: false
  })

  // ========== Computed ==========

  const isLoading = computed(() => Object.values(loading.value).some(v => v))
  const hasErrors = computed(() => Object.values(errors.value).some(v => v))

  // ========== Helper Functions ==========

  function clearError(section: string) {
    errors.value[section] = null
  }

  function clearSuccess(section: string) {
    success.value[section] = false
  }

  function applyTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)

    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function applyAccentColor(color: string) {
    const palette = COLOR_PALETTES[color] || COLOR_PALETTES['blue']
    
    // Dynamically update the --color-blue-XXX variables to match the selected palette
    // This allows us to keep using 'var(--color-blue-500)' in CSS but have it appear purple/green etc.
    const root = document.documentElement
    Object.entries(palette).forEach(([shade, hex]) => {
      root.style.setProperty(`--color-blue-${shade}`, hex)
    })

    localStorage.setItem('accentColor', color)
  }

  // ========== Profile Actions ==========

  /**
   * 加载用户资料
   * 优先使用 userStore 中的缓存，避免重复请求
   */
  async function loadProfile() {
    // 缓存检查：如果已加载过，直接返回
    if (loaded.value.profile) return

    loading.value.profile = true
    errors.value.profile = null

    try {
      const userStore = useUserStore()

      // 优先用全局 userStore 中已有的用户信息
      if (userStore.user) {
        profile.value = userStore.user as unknown as UserProfile
        loaded.value.profile = true
        return
      }

      // 否则从后端拉一次
      const data = await userAPI.getProfile()
      profile.value = data as UserProfile
      loaded.value.profile = true
    } catch (error: any) {
      errors.value.profile = error.message || '加载资料失败'
    } finally {
      loading.value.profile = false
    }
  }

  /**
   * 更新用户资料
   * 包含 Data Sync 逻辑：更新后自动同步 userStore
   */
  async function updateProfile(data: Partial<UserProfile>) {
    loading.value.profile = true
    errors.value.profile = null
    success.value.profile = false

    try {
      // 1. 调用后端 API 更新资料
      const response = await userAPI.updateProfile(data)

      // 2. 更新 settings 内部的编辑视图
      profile.value = { ...profile.value, ...data } as UserProfile

      // 3. 【关键】同步刷新全局 userStore，保证导航栏等地方的用户信息一致
      const userStore = useUserStore()
      await userStore.fetchUserInfo()

      success.value.profile = true
      return true
    } catch (error: any) {
      errors.value.profile = error.message || '更新资料失败'
      throw error
    } finally {
      loading.value.profile = false
    }
  }

  /**
   * 上传头像
   * 包含 Data Sync 逻辑，确保头像在导航栏等处同步更新
   */
  async function uploadAvatar(file: File) {
    loading.value.profile = true
    errors.value.profile = null
    success.value.profile = false

    try {
      // 1. 用 FormData 包一层，符合 userAPI.uploadAvatar 的兼容逻辑
      const formData = new FormData()
      formData.append('avatar', file)

      // 2. 调用后端：这里的 response 是 { code, message, data: User }
      const response = await userAPI.uploadAvatar(formData)

      const newAvatarUrl =
        response?.data?.url || response?.data?.avatar || profile.value?.avatar || ''

      // 3. 更新 settings 内部 profile 视图
      if (profile.value && newAvatarUrl) {
        profile.value.avatar = newAvatarUrl
      }

      // 4. 同步全局 userStore（Data Sync）
      const userStore = useUserStore()
      await userStore.fetchUserInfo()

      success.value.profile = true
      return newAvatarUrl
    } catch (error: any) {
      errors.value.profile = error.message || '上传头像失败'
      throw error
    } finally {
      loading.value.profile = false
    }
  }

  // ========== Security Actions ==========

  async function loadSecurity() {
    if (loaded.value.security) return

    loading.value.security = true
    errors.value.security = null

    try {
      const data = await userAPI.getSecurity()
      security.value = data
      loaded.value.security = true
    } catch (error: any) {
      errors.value.security = error.message || '加载安全设置失败'
    } finally {
      loading.value.security = false
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    loading.value.security = true
    errors.value.security = null
    success.value.security = false

    try {
      await userAPI.changePassword({ oldPassword, newPassword })
      success.value.security = true
    } catch (error: any) {
      errors.value.security = error.message || '修改密码失败'
      throw error
    } finally {
      loading.value.security = false
    }
  }

  // 乐观更新：2FA 开关立即响应，失败则回滚
  async function toggleTwoFactor(enable: boolean) {
    const previousValue = security.value?.twoFactorEnabled ?? false

    // 立即更新 UI (乐观更新)
    if (security.value) {
      security.value.twoFactorEnabled = enable
    }

    try {
      if (enable) {
        await userAPI.enableTwoFactor()
      } else {
        await userAPI.disableTwoFactor()
      }
      success.value.security = true
    } catch (error: any) {
      // 失败时回滚
      if (security.value) {
        security.value.twoFactorEnabled = previousValue
      }
      errors.value.security = error.message || '设置双因素认证失败'
      throw error
    }
  }

  // ========== Privacy Actions ==========

  async function loadPrivacy() {
    if (loaded.value.privacy) return

    loading.value.privacy = true
    errors.value.privacy = null

    try {
      const data = await userAPI.getPrivacy()
      privacy.value = data
      loaded.value.privacy = true
    } catch (error: any) {
      errors.value.privacy = error.message || '加载隐私设置失败'
    } finally {
      loading.value.privacy = false
    }
  }

  async function updatePrivacy(data: Partial<UserPrivacy>) {
    loading.value.privacy = true
    errors.value.privacy = null
    success.value.privacy = false

    try {
      await userAPI.updatePrivacy(data)
      privacy.value = { ...privacy.value, ...data } as UserPrivacy
      success.value.privacy = true
    } catch (error: any) {
      errors.value.privacy = error.message || '更新隐私设置失败'
      throw error
    } finally {
      loading.value.privacy = false
    }
  }

  // ========== Notification Actions ==========

  async function loadNotifications() {
    if (loaded.value.notifications) return

    loading.value.notifications = true
    errors.value.notifications = null

    try {
      const data = await userAPI.getNotifications()
      notifications.value = data
      loaded.value.notifications = true
    } catch (error: any) {
      errors.value.notifications = error.message || '加载通知设置失败'
    } finally {
      loading.value.notifications = false
    }
  }

  // 乐观更新：通知设置立即反映
  async function updateNotifications(data: Partial<UserNotifications>) {
    const previous = notifications.value ? { ...notifications.value } : null

    // 立即更新 UI
    notifications.value = { ...notifications.value, ...data } as UserNotifications
    loading.value.notifications = true
    errors.value.notifications = null
    success.value.notifications = false

    try {
      const response = await userAPI.updateNotifications(data)

      // 如果后端返回了新的通知对象，直接用它
      if (response?.data && typeof response.data === 'object') {
        notifications.value = response.data as UserNotifications
      }

      success.value.notifications = true
    } catch (error: any) {
      // 失败回滚
      notifications.value = previous
      errors.value.notifications = error.message || '更新通知设置失败'
      throw error
    } finally {
      loading.value.notifications = false
    }
  }

  async function resetNotifications() {
    loading.value.notifications = true
    errors.value.notifications = null
    success.value.notifications = false

    try {
      const response = await userAPI.resetNotifications()

      if (response?.data && typeof response.data === 'object') {
        notifications.value = response.data as UserNotifications
      } else {
        // 重新加载
        loaded.value.notifications = false
        await loadNotifications()
      }

      success.value.notifications = true
    } catch (error: any) {
      errors.value.notifications = error.message || '重置通知设置失败'
      throw error
    } finally {
      loading.value.notifications = false
    }
  }

  // ========== Preferences (Interface Settings) Actions ==========

  async function loadPreferences() {
    if (loaded.value.preferences) return

    loading.value.preferences = true
    errors.value.preferences = null

    try {
      const data = await userAPI.getPreferences()
      preferences.value = data as UserPreferences
      loaded.value.preferences = true

      // 应用保存的主题和颜色
      if (data.theme) applyTheme(data.theme)
      if (data.accentColor) applyAccentColor(data.accentColor)
    } catch (error: any) {
      errors.value.preferences = error.message || '加载界面设置失败'
    } finally {
      loading.value.preferences = false
    }
  }

  async function updatePreferences(data: Partial<UserPreferences>) {
    loading.value.preferences = true
    errors.value.preferences = null
    success.value.preferences = false

    // 立即应用 (Optimistic)
    if (data.theme) applyTheme(data.theme)
    if (data.accentColor) applyAccentColor(data.accentColor)

    // Update local state
    if (preferences.value) {
      preferences.value = { ...preferences.value, ...data } as UserPreferences
    } else {
      // In case it wasn't loaded yet, initialize it
      preferences.value = {
        theme: 'light',
        fontSize: 'base',
        accentColor: 'blue',
        ...data
      } as UserPreferences
    }

    try {
      const response = await userAPI.updatePreferences(data)

      // 如果后端返回了新的偏好设置对象，直接用它
      if (response?.data && typeof response.data === 'object') {
        preferences.value = response.data as UserPreferences
      }

      success.value.preferences = true
    } catch (error: any) {
      errors.value.preferences = error.message || '更新界面设置失败'
      // We might choose not to rollback visual changes here as it's jarring
      throw error
    } finally {
      loading.value.preferences = false
    }
  }

  return {
    // State
    profile,
    security,
    privacy,
    notifications,
    preferences,
    loading,
    errors,
    success,
    loaded,

    // Computed
    isLoading,
    hasErrors,

    // Actions
    loadProfile,
    updateProfile,
    uploadAvatar,
    loadSecurity,
    changePassword,
    toggleTwoFactor,
    loadPrivacy,
    updatePrivacy,
    loadNotifications,
    updateNotifications,
    resetNotifications,
    loadPreferences,
    updatePreferences,

    // Helpers
    clearError,
    clearSuccess,
    applyTheme,
    applyAccentColor
  }
})
