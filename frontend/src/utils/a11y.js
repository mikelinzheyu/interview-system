/**
 * 无障碍（可访问性）支持工具
 * 符合 WCAG 2.1 AA 标准
 */

/**
 * 生成唯一的 ARIA ID
 */
function generateAriaId(prefix = 'aria') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 设置 ARIA 标签
 */
function setAriaLabel(element, label) {
  element.setAttribute('aria-label', label)
}

/**
 * 设置 ARIA 描述
 */
function setAriaDescription(element, description) {
  const id = generateAriaId('desc')
  element.setAttribute('aria-describedby', id)
  const descElement = document.createElement('span')
  descElement.id = id
  descElement.textContent = description
  descElement.style.display = 'none'
  element.appendChild(descElement)
}

/**
 * 宣布动态内容（屏幕阅读器）
 */
function announceMessage(message, priority = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.textContent = message
  announcement.style.position = 'absolute'
  announcement.style.left = '-10000px'
  announcement.style.width = '1px'
  announcement.style.height = '1px'
  announcement.style.overflow = 'hidden'

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * 键盘焦点管理
 */
class FocusManager {
  constructor(container) {
    this.container = container
    this.focusableElements = []
    this.currentFocusIndex = -1
  }

  /**
   * 更新可获焦点的元素列表
   */
  updateFocusableElements() {
    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',')

    this.focusableElements = Array.from(this.container.querySelectorAll(selector))
  }

  /**
   * 焦点移至下一个元素
   */
  focusNext() {
    if (this.focusableElements.length === 0) return

    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length
    this.focusableElements[this.currentFocusIndex].focus()
  }

  /**
   * 焦点移至上一个元素
   */
  focusPrevious() {
    if (this.focusableElements.length === 0) return

    this.currentFocusIndex = (this.currentFocusIndex - 1 + this.focusableElements.length) % this.focusableElements.length
    this.focusableElements[this.currentFocusIndex].focus()
  }

  /**
   * 焦点回到第一个元素
   */
  focusFirst() {
    if (this.focusableElements.length === 0) return
    this.currentFocusIndex = 0
    this.focusableElements[0].focus()
  }

  /**
   * 设置焦点陷阱（模态框中）
   */
  createFocusTrap() {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          this.focusPrevious()
        } else {
          this.focusNext()
        }
        e.preventDefault()
      }
    }

    this.container.addEventListener('keydown', handleKeyDown)

    return () => {
      this.container.removeEventListener('keydown', handleKeyDown)
    }
  }
}

/**
 * 可访问性辅助函数
 */
const a11y = {
  generateAriaId,
  setAriaLabel,
  setAriaDescription,
  announceMessage,
  FocusManager,

  /**
   * 为按钮添加 ARIA 属性
   */
  makeButtonAccessible(element, label) {
    element.setAttribute('role', 'button')
    element.setAttribute('aria-label', label || element.textContent)
    element.setAttribute('tabindex', '0')

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        element.click()
      }
    }

    element.addEventListener('keydown', handleKeyDown)
  },

  /**
   * 为链接添加 ARIA 属性
   */
  makeLinkAccessible(element, label) {
    if (!element.getAttribute('aria-label')) {
      element.setAttribute('aria-label', label || element.textContent)
    }
  },

  /**
   * 设置跳过链接（Skip Link）
   */
  createSkipLink(targetSelector) {
    const skipLink = document.createElement('a')
    skipLink.href = targetSelector
    skipLink.textContent = '跳过导航，直接进入主要内容'
    skipLink.setAttribute('class', 'skip-link')
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    `

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0'
    })

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })

    document.body.insertBefore(skipLink, document.body.firstChild)
  },

  /**
   * 高对比度模式支持
   */
  enableHighContrast() {
    document.documentElement.setAttribute('data-high-contrast', 'true')
  },

  disableHighContrast() {
    document.documentElement.removeAttribute('data-high-contrast')
  },

  /**
   * 检测用户是否偏好减少动画
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  /**
   * 安全的动画包装器
   */
  safeAnimate(element, keyframes, options = {}) {
    if (this.prefersReducedMotion()) {
      // 跳过动画，直接应用最终状态
      return
    }

    if (element.animate) {
      element.animate(keyframes, options)
    }
  }
}

export { a11y, FocusManager, generateAriaId, announceMessage }
