import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

/**
 * 主题管理 Store
 * 支持浅色、深色和自动模式
 */
export const useThemeStore = defineStore('theme', () => {
  // 主题值: 'light' | 'dark' | 'auto'
  const theme = ref('light')
  const autoMode = ref(false)

  // 系统主题偏好 (自动模式时使用)
  const systemPrefersDark = ref(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    systemPrefersDark.value = e.matches
    applyTheme()
  })

  /**
   * 计算当前是否为深色模式
   */
  const isDarkMode = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    // 自动模式
    return systemPrefersDark.value
  })

  /**
   * 设置主题
   */
  function setTheme(value) {
    if (['light', 'dark', 'auto'].includes(value)) {
      theme.value = value
      if (value !== 'auto') {
        autoMode.value = false
      }
      applyTheme()
      localStorage.setItem('app-theme', value)
    }
  }

  /**
   * 切换主题 (在当前主题和对立主题之间切换)
   */
  function toggleTheme() {
    if (theme.value === 'light') {
      setTheme('dark')
    } else if (theme.value === 'dark') {
      setTheme('light')
    } else {
      // 自动模式下，切换到相反的模式
      setTheme(systemPrefersDark.value ? 'light' : 'dark')
    }
  }

  /**
   * 设置自动模式
   */
  function setAutoMode(value) {
    autoMode.value = value
    if (value) {
      theme.value = 'auto'
    }
    applyTheme()
    localStorage.setItem('app-auto-mode', value.toString())
  }

  /**
   * 应用主题到 DOM
   */
  function applyTheme() {
    const html = document.documentElement
    const body = document.body

    if (isDarkMode.value) {
      html.classList.add('dark-mode')
      body.classList.add('dark-mode')
      // 设置 CSS 变量
      setCSSVariables('dark')
    } else {
      html.classList.remove('dark-mode')
      body.classList.remove('dark-mode')
      // 设置 CSS 变量
      setCSSVariables('light')
    }
  }

  /**
   * 设置 CSS 变量
   */
  function setCSSVariables(mode) {
    const root = document.documentElement
    const colors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }

  /**
   * 初始化主题
   */
  function initTheme() {
    const savedTheme = localStorage.getItem('app-theme')
    const savedAutoMode = localStorage.getItem('app-auto-mode') === 'true'

    if (savedAutoMode) {
      setAutoMode(true)
    } else if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setTheme(savedTheme)
    }

    applyTheme()
  }

  return {
    theme,
    autoMode,
    systemPrefersDark,
    isDarkMode,
    setTheme,
    toggleTheme,
    setAutoMode,
    applyTheme,
    initTheme
  }
})

// 浅色主题色值
const LIGHT_COLORS = {
  bg: '#ffffff',
  'bg-secondary': '#f9f9f9',
  'bg-tertiary': '#f0f0f0',
  text: '#333333',
  'text-secondary': '#666666',
  'text-tertiary': '#999999',
  border: '#e0e0e0',
  'border-light': '#f0f0f0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  primary: '#409eff',
  'primary-light': '#66b1ff',
  success: '#67c23a',
  warning: '#e6a23c',
  danger: '#f56c6c',
  error: '#f56c6c'
}

// 深色主题色值
const DARK_COLORS = {
  bg: '#1a1a1a',
  'bg-secondary': '#2a2a2a',
  'bg-tertiary': '#3a3a3a',
  text: '#e0e0e0',
  'text-secondary': '#b0b0b0',
  'text-tertiary': '#808080',
  border: '#3a3a3a',
  'border-light': '#2a2a2a',
  shadow: 'rgba(0, 0, 0, 0.3)',
  primary: '#66b1ff',
  'primary-light': '#85c1ff',
  success: '#85ce61',
  warning: '#e6a23c',
  danger: '#f78989',
  error: '#f78989'
}

export { LIGHT_COLORS, DARK_COLORS }
