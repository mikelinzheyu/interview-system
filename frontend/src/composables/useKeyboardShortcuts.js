import { onMounted, onUnmounted } from 'vue'

/**
 * 键盘快捷键管理器
 * 用于在各个页面添加快捷键支持
 */
export function useKeyboardShortcuts(shortcuts = {}) {
  const defaultShortcuts = {
    'escape': null,
    'enter': null,
    'arrowup': null,
    'arrowdown': null,
    'arrowleft': null,
    'arrowright': null
  }

  const mergedShortcuts = { ...defaultShortcuts, ...shortcuts }

  const handleKeyDown = (event) => {
    const key = event.key.toLowerCase()

    // Cmd/Ctrl + K: 打开搜索
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      mergedShortcuts['cmd+k']?.()
      return
    }

    // Cmd/Ctrl + /: 显示帮助
    if ((event.metaKey || event.ctrlKey) && event.key === '/') {
      event.preventDefault()
      mergedShortcuts['cmd+/']?.()
      return
    }

    // Escape: 关闭/返回
    if (key === 'escape') {
      event.preventDefault()
      mergedShortcuts['escape']?.()
    }

    // Enter: 确认/进入
    if (key === 'enter') {
      event.preventDefault()
      mergedShortcuts['enter']?.()
    }

    // 方向键导航
    if (key === 'arrowup') {
      event.preventDefault()
      mergedShortcuts['arrowup']?.()
    }

    if (key === 'arrowdown') {
      event.preventDefault()
      mergedShortcuts['arrowdown']?.()
    }

    if (key === 'arrowleft') {
      event.preventDefault()
      mergedShortcuts['arrowleft']?.()
    }

    if (key === 'arrowright') {
      event.preventDefault()
      mergedShortcuts['arrowright']?.()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    handleKeyDown
  }
}

/**
 * 快捷键帮助显示工具
 */
export const keyboardHelp = {
  discipline: [
    { keys: 'Cmd/Ctrl + K', description: '打开搜索框' },
    { keys: 'Cmd/Ctrl + /', description: '显示快捷键帮助' },
    { keys: '↑ ↓', description: '在卡片间导航' },
    { keys: 'Enter', description: '选择卡片/进入' },
    { keys: 'Escape', description: '返回上一级' }
  ],
  global: [
    { keys: 'Cmd/Ctrl + K', description: '打开搜索框' },
    { keys: 'Cmd/Ctrl + /', description: '显示快捷键帮助' },
    { keys: 'Home', description: '返回首页' }
  ]
}
