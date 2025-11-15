/**
 * useNetworkStatus - 网络状态监测与管理
 *
 * 功能：
 * - 实时监测用户的在线/离线状态
 * - 网络状态变化时给出用户提示
 * - 支持自定义回调函数
 *
 * 使用示例：
 * const { isOnline, waitForOnline } = useNetworkStatus()
 * watch(() => isOnline.value, (online) => {
 *   if (online) {
 *     console.log('网络已连接，可以重试操作')
 *   }
 * })
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'

export function useNetworkStatus() {
  // 当前网络状态
  const isOnline = ref(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  // 网络状态变化的回调
  let onlineCallback = null
  let offlineCallback = null

  /**
   * 处理网络连接恢复
   */
  const handleOnline = () => {
    isOnline.value = true

    // 显示通知
    ElNotification({
      type: 'success',
      title: '网络已连接',
      message: '您的网络连接已恢复，可以继续操作',
      duration: 3000,
      position: 'top-right'
    })

    // 触发回调
    onlineCallback?.()

    console.log('[useNetworkStatus] Network is online')
  }

  /**
   * 处理网络断开
   */
  const handleOffline = () => {
    isOnline.value = false

    // 显示通知（不自动关闭，等待网络恢复）
    ElNotification({
      type: 'warning',
      title: '网络已断开',
      message: '您当前处于离线状态，无法执行需要网络的操作。请检查网络连接。',
      duration: 0,
      position: 'top-right'
    })

    // 触发回调
    offlineCallback?.()

    console.log('[useNetworkStatus] Network is offline')
  }

  /**
   * 注册网络连接恢复的回调
   */
  const onNetworkRecover = (callback) => {
    onlineCallback = callback
  }

  /**
   * 注册网络断开的回调
   */
  const onNetworkLose = (callback) => {
    offlineCallback = callback
  }

  /**
   * 等待网络连接恢复（返回Promise）
   */
  const waitForOnline = () => {
    return new Promise((resolve) => {
      if (isOnline.value) {
        resolve()
      } else {
        const originalCallback = onlineCallback
        onlineCallback = () => {
          originalCallback?.()
          resolve()
        }
      }
    })
  }

  /**
   * 获取网络连接信息
   */
  const getNetworkInfo = async () => {
    // 如果浏览器支持 Network Information API
    if ('connection' in navigator) {
      const connection = navigator.connection
      return {
        isOnline: isOnline.value,
        effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection.downlink, // Mbps
        rtt: connection.rtt, // 毫秒
        saveData: connection.saveData // 用户是否启用省流量模式
      }
    }

    return {
      isOnline: isOnline.value,
      effectiveType: 'unknown',
      downData: null,
      rtt: null,
      saveData: false
    }
  }

  // ========== 生命周期 ==========

  onMounted(() => {
    // 添加事件监听
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    console.log('[useNetworkStatus] Mounted, current status:', isOnline.value)
  })

  onUnmounted(() => {
    // 移除事件监听
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)

    // 清理回调
    onlineCallback = null
    offlineCallback = null

    console.log('[useNetworkStatus] Unmounted')
  })

  return {
    // 状态
    isOnline,

    // 方法
    onNetworkRecover,
    onNetworkLose,
    waitForOnline,
    getNetworkInfo
  }
}
