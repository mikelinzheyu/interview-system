import { ref, computed, watch } from 'vue'

// 主题模式
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
}

// 获取系统偏好
function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT
  }
  return THEMES.LIGHT
}

// 主题状态
const currentTheme = ref(localStorage.getItem('app-theme') || THEMES.AUTO)
const systemTheme = ref(getSystemTheme())

// 监听系统主题变化
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    systemTheme.value = e.matches ? THEMES.DARK : THEMES.LIGHT
    applyTheme()
  })
}

/**
 * 实际应用的主题
 */
const effectiveTheme = computed(() => {
  if (currentTheme.value === THEMES.AUTO) {
    return systemTheme.value
  }
  return currentTheme.value
})

/**
 * 是否是暗黑模式
 */
const isDark = computed(() => {
  return effectiveTheme.value === THEMES.DARK
})

/**
 * 应用主题
 */
function applyTheme() {
  const theme = effectiveTheme.value

  if (typeof document !== 'undefined') {
    const htmlElement = document.documentElement

    if (theme === THEMES.DARK) {
      htmlElement.classList.add('dark-mode')
      htmlElement.style.colorScheme = 'dark'
    } else {
      htmlElement.classList.remove('dark-mode')
      htmlElement.style.colorScheme = 'light'
    }

    // 应用 CSS 变量
    applyCSSVariables(theme)
  }
}

/**
 * 应用 CSS 变量
 */
function applyCSSVariables(theme) {
  const root = document.documentElement
  const isDarkMode = theme === THEMES.DARK

  const variables = {
    '--bg-primary': isDarkMode ? '#1a1a1a' : '#ffffff',
    '--bg-secondary': isDarkMode ? '#2d2d2d' : '#f5f5f5',
    '--bg-tertiary': isDarkMode ? '#3d3d3d' : '#efefef',
    '--text-primary': isDarkMode ? '#e0e0e0' : '#333333',
    '--text-secondary': isDarkMode ? '#999999' : '#666666',
    '--text-tertiary': isDarkMode ? '#666666' : '#999999',
    '--border-color': isDarkMode ? '#404040' : '#e0e0e0',
    '--shadow-sm': isDarkMode
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.08)',
    '--shadow-md': isDarkMode
      ? '0 4px 16px rgba(0, 0, 0, 0.4)'
      : '0 4px 16px rgba(0, 0, 0, 0.12)',
    '--shadow-lg': isDarkMode
      ? '0 8px 32px rgba(0, 0, 0, 0.5)'
      : '0 8px 32px rgba(0, 0, 0, 0.15)'
  }

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

/**
 * 设置主题
 */
function setTheme(theme) {
  if (!Object.values(THEMES).includes(theme)) {
    console.warn(`Invalid theme: ${theme}`)
    return
  }

  currentTheme.value = theme
  localStorage.setItem('app-theme', theme)
  applyTheme()
}

/**
 * 切换暗黑模式
 */
function toggleDarkMode() {
  if (currentTheme.value === THEMES.DARK) {
    setTheme(THEMES.LIGHT)
  } else {
    setTheme(THEMES.DARK)
  }
}

/**
 * 切换自动主题
 */
function toggleAutoTheme() {
  setTheme(THEMES.AUTO)
}

// 初始化主题
watch(
  effectiveTheme,
  () => {
    applyTheme()
  },
  { immediate: true }
)

/**
 * useTheme 组合函数
 */
export function useTheme() {
  return {
    currentTheme,
    effectiveTheme,
    isDark,
    setTheme,
    toggleDarkMode,
    toggleAutoTheme,
    THEMES
  }
}

// 初始化
export function initTheme() {
  applyTheme()
}
