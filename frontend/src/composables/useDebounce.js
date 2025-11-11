/**
 * useDebounce - 防抖组合式函数
 * 用于搜索、输入等频繁触发的事件
 */

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function useDebounce(fn, delay = 500) {
  let timeoutId = null

  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function useThrottle(fn, delay = 500) {
  let lastTime = 0
  let timeoutId = null

  return function throttled(...args) {
    const now = Date.now()
    const remaining = delay - (now - lastTime)

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now()
        timeoutId = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * Vue 3 组合式 API 风格的防抖
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function useDebounceFn(fn, delay = 500) {
  let timeoutId = null

  const debounced = function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }

  // 取消防抖
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // 立即执行
  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      fn()
      timeoutId = null
    }
  }

  return debounced
}
