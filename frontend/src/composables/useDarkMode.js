/**
 * 暗黑模式 Composable
 */
import { ref, watch } from 'vue'

const isDark = ref(false)
const isInitialized = ref(false)

export function useDarkMode() {
  // 初始化
  if (!isInitialized.value) {
    // 从 localStorage 读取偏好
    const storedTheme = localStorage.getItem('theme')

    if (storedTheme) {
      isDark.value = storedTheme === 'dark'
    } else {
      // 检测系统偏好
      if (window.matchMedia) {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
    }

    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = (e) => {
        // 只有当用户没有手动设置时才跟随系统
        if (!localStorage.getItem('theme')) {
          isDark.value = e.matches
        }
      }

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        mediaQuery.addListener(handleChange)
      }
    }

    isInitialized.value = true
  }

  // 监听变化并应用到 DOM
  watch(
    isDark,
    (newValue) => {
      if (document.documentElement) {
        if (newValue) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }

      // 保存到 localStorage
      localStorage.setItem('theme', newValue ? 'dark' : 'light')
    },
    { immediate: true }
  )

  // 切换暗黑模式
  const toggleDark = () => {
    isDark.value = !isDark.value
  }

  // 设置暗黑模式
  const setDark = (value) => {
    isDark.value = value
  }

  return {
    isDark,
    toggleDark,
    setDark
  }
}
