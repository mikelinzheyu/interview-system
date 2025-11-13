import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export function useShare() {
  const shareDialogVisible = ref(false)

  const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  const isSecure = () => window.isSecureContext || ['localhost', '127.0.0.1', '::1'].includes(location.hostname) || location.protocol === 'https:'
  const canUseWebShare = () => typeof navigator.share === 'function' && isMobileDevice() && isSecure()

  const copyShare = async (content) => {
    const text = String(content || '')
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const input = document.createElement('input')
        input.value = text
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      ElMessage.success('内容已复制到剪贴板')
    } catch (e) {
      ElMessage.error('复制失败，请手动复制')
    }
  }

  const triggerShare = async ({ title, text, url, onFallback } = {}) => {
    const payload = { title, text, url }
    if (canUseWebShare()) {
      try {
        await navigator.share(payload)
        return
      } catch (err) {
        // 用户取消不提示错误
        const msg = String(err?.message || '')
        if (err?.name === 'AbortError' || /cancel/i.test(msg)) {
          ElMessage.info('已取消分享')
          return
        }
        // 其他错误走降级
      }
    }

    if (typeof onFallback === 'function') {
      onFallback()
    } else if (url) {
      await copyShare(url)
    } else if (text) {
      await copyShare(text)
    } else {
      ElMessage.warning('没有可分享的内容')
    }
  }

  return {
    shareDialogVisible,
    isMobileDevice,
    isSecure,
    canUseWebShare,
    triggerShare,
    copyShare,
  }
}

