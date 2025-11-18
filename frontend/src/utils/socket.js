/**
 * WebSocket 服务封装
 * 基于 Socket.IO Client
 */
import { io } from 'socket.io-client'
import { ElNotification } from 'element-plus'
import { getWebSocketBaseUrl } from '@/utils/networkConfig'

// 统一解析 WebSocket 基础地址：优先使用配置和后端 API 地址
const DEFAULT_WS_URL = (() => {
  try {
    // 通过统一的网络配置模块解析基础地址
    const base = getWebSocketBaseUrl()

    if (base && typeof base === 'string') {
      let url = base.trim()

      // 如有必要，将 HTTP/HTTPS 协议转换为 WS/WSS
      url = url.replace(/^https?:\/\//, (match) => {
        return match.startsWith('https') ? 'wss://' : 'ws://'
      })

      console.log('[Socket] 使用解析后的 WebSocket URL:', url)
      return url
    }
  } catch (error) {
    console.error('[Socket] 解析 WebSocket 基础地址失败，将使用兜底地址 ws://localhost:3001', error)
  }

  // 兜底：直连本地后端 WebSocket 服�?
  const fallback = 'ws://localhost:3001'
  console.log('[Socket] 使用兜底 WebSocket URL:', fallback)
  return fallback
})()

const normalizeSocketUrl = (value) => {
  if (!value || typeof value !== 'string') return ''
  let url = value.trim()

  // 将 HTTP/HTTPS 协议转换为 WS/WSS
  url = url.replace(/^https?:\/\//, (match) => {
    return match.startsWith('https') ? 'wss://' : 'ws://'
  })

  return url
}

const resolveWebSocketUrl = (candidate) => {
  const direct = normalizeSocketUrl(candidate)
  if (direct) return direct

  // 未显式传入时，始终回退到 DEFAULT_WS_URL（通常是 ws(s)://当前前端 host）
  return DEFAULT_WS_URL
}

class SocketService {
  constructor() {
    this.socket = null
    this.socketUrl = DEFAULT_WS_URL
    this.connected = false
    this.connecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000 // 3s
    this.listeners = new Map() // 存储事件监听器
  }

  /**
   * 连接到 WebSocket 服务
   * @param {string} token - JWT token
   * @param {string} url - WebSocket 服务器地址（可选）
   */
  connect(token, url) {
    if (this.connected || this.connecting || (this.socket && this.socket.connected)) {
      console.log('[Socket] 已在连接中或已连接，跳过重复连接')
      return
    }

    const targetUrl = resolveWebSocketUrl(url)
    this.socketUrl = targetUrl
    this.connecting = true

    console.log('[Socket] 正在连接 WebSocket 服务...', targetUrl)

    this.socket = io(targetUrl, {
      auth: { token: token || '1' }, // 传入 JWT token
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    })

    // 连接成功
    this.socket.on('connect', () => {
      this.connected = true
      this.connecting = false
      this.reconnectAttempts = 0
      console.log('[Socket] WebSocket 已连接', this.socket.id, '->', this.socketUrl)

      ElNotification({
        title: '实时通信已连接',
        message: '您现在可以实时接收消息和通知',
        type: 'success',
        duration: 2000
      })

      // 重新注册所有监听器
      this.reRegisterListeners()
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] 连接错误 ->', this.socketUrl, error)
      this.connected = false
      this.connecting = false

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(
          `[Socket] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts}) -> ${this.socketUrl}`
        )
      } else {
        ElNotification({
          title: '连接失败',
          message: '无法连接到实时通信服务器，请检查网络连接',
          type: 'error',
          duration: 3000
        })
      }
    })

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      this.connected = false
      this.connecting = false
      console.log('[Socket] 连接已断开:', reason, '->', this.socketUrl)

      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        this.socket.connect()
      }
    })

    // 在线用户数更新
    this.socket.on('online-users-updated', (data) => {
      console.log('[Socket] 在线用户数:', data.count)
    })

    return this.socket
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.socketUrl = DEFAULT_WS_URL
      this.connected = false
      this.listeners.clear()
      console.log('[Socket] 已断开连接')
    }
  }

  /**
   * 监听事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('[Socket] 尚未连接，无法监听事件')
      return
    }

    // 存储监听器以便重连后恢复
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(callback)

    this.socket.on(event, callback)
    console.log(`[Socket] 已监听事件 ${event}`)
  }

  /**
   * 取消监听事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数（可选）
   */
  off(event, callback) {
    if (!this.socket) return

    if (callback) {
      this.socket.off(event, callback)
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) callbacks.splice(index, 1)
      }
    } else {
      this.socket.off(event)
      this.listeners.delete(event)
    }

    console.log(`[Socket] 已取消监听事件 ${event}`)
  }

  /**
   * 发送事件
   * @param {string} event - 事件名称
   * @param {Object} data - 数据
   */
  emit(event, data) {
    if (!this.socket || !this.connected) {
      console.warn('[Socket] 未连接，无法发送事件')
      return
    }

    this.socket.emit(event, data)
    console.log(`[Socket] 已发送事件 ${event}`, data)
  }

  /**
   * 重新注册所有监听器（用于重连后）
   */
  reRegisterListeners() {
    if (!this.socket) return
    console.log('[Socket] 重新注册监听器...')
    for (const [event, callbacks] of this.listeners.entries()) {
      callbacks.forEach(callback => this.socket.on(event, callback))
    }
  }

  // ==================== 聊天室相关方法 ====================

  /**
   * 加入聊天室
   * @param {number} roomId - 聊天室ID
   */
  joinRoom(roomId) {
    this.emit('join-room', { roomId })
  }

  /**
   * 离开聊天室
   * @param {number} roomId - 聊天室ID
   */
  leaveRoom(roomId) {
    this.emit('leave-room', { roomId })
  }

  /**
   * 发送消息
   * @param {number} roomId - 聊天室ID
   * @param {string} content - 消息内容
   * @param {number} replyTo - 回复的消息ID（可选）
   */
  sendMessage(roomId, content, replyTo = null) {
    this.emit('send-message', { roomId, content, replyTo })
  }

  /**
   * 监听新消息
   * @param {Function} callback - 回调函数
   */
  onNewMessage(callback) {
    this.on('new-message', callback)
  }

  /**
   * 监听用户加入
   * @param {Function} callback - 回调函数
   */
  onUserJoined(callback) {
    this.on('user-joined', callback)
  }

  /**
   * 监听用户离开
   * @param {Function} callback - 回调函数
   */
  onUserLeft(callback) {
    this.on('user-left', callback)
  }

  // ==================== 用户状态相关 ====================

  /**
   * 更新用户状态
   * @param {string} status - 用户状态（online/offline/away 等）
   */
  updateUserStatus(status) {
    this.emit('user-status-updated', { status })
  }

  /**
   * 监听用户状态变化
   * @param {Function} callback - 回调函数
   */
  onUserStatusChanged(callback) {
    this.on('user-status-updated', callback)
  }

  /**
   * 监听用户在线状态更新
   * @param {Function} callback - 回调函数
   */
  onUserPresenceUpdated(callback) {
    this.on('user-presence-updated', callback)
  }

  // ==================== 工具方法 ====================

  /**
   * 获取当前 socket id
   */
  getSocketId() {
    return this.socket ? this.socket.id : null
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats() {
    return {
      connected: this.connected,
      socketId: this.getSocketId(),
      socketUrl: this.socketUrl,
      listenersCount: this.listeners.size,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  /**
   * 清除所有监听器（用于页面卸载）
   */
  clearAllListeners() {
    console.log('[Socket] 清除所有监听器...')
    for (const [event] of this.listeners.entries()) {
      this.off(event)
    }
  }
}

// 导出单例
export const socketService = new SocketService()
export default socketService
