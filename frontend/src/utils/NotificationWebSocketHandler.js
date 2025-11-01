/**
 * WebSocket Handlers for Real-time Notifications
 *
 * Manages WebSocket connections and real-time event handling for:
 * - User notifications
 * - Admin activity updates
 * - System alerts
 * - Live content moderation updates
 *
 * @module websocketHandlers
 */

/**
 * Notification WebSocket Handler
 * Handles all notification-related real-time events
 */
export const NotificationWebSocketHandler = {
  // Connection state
  isConnected: false,
  socket: null,
  userId: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  reconnectTimeout: null,

  // Event subscriptions
  listeners: {},

  /**
   * Initialize WebSocket connection
   * @param {string} userId - Current user ID
   * @param {string} wsUrl - WebSocket server URL
   * @returns {Promise<void>}
   */
  async connect(userId, wsUrl = 'ws://localhost:8080/ws/notifications') {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId
        this.socket = new WebSocket(`${wsUrl}?userId=${userId}`)

        // Connection opened
        this.socket.onopen = () => {
          console.log('✅ Notification WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0

          // Send initial handshake
          this.sendMessage({
            type: 'CONNECT',
            userId: userId,
            timestamp: new Date().toISOString()
          })

          resolve()
        }

        // Receive messages
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this._handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        // Connection error
        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.isConnected = false
          reject(error)
        }

        // Connection closed
        this.socket.onclose = () => {
          console.log('⚠️ WebSocket closed')
          this.isConnected = false
          this._handleDisconnect()
        }
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        reject(error)
      }
    })
  },

  /**
   * Handle incoming WebSocket messages
   * @private
   */
  _handleMessage(message) {
    const { type, data, timestamp } = message

    console.log(`📨 Received [${type}]:`, data)

    switch (type) {
      // Notification events
      case 'NOTIFICATION_NEW':
        this._emit('notification:new', data)
        break

      case 'NOTIFICATION_UPDATE':
        this._emit('notification:update', data)
        break

      case 'NOTIFICATION_DELETE':
        this._emit('notification:delete', data)
        break

      // Admin events
      case 'ADMIN_ACTION':
        this._emit('admin:action', data)
        break

      case 'CONTENT_MODERATED':
        this._emit('content:moderated', data)
        break

      case 'USER_REPORT':
        this._emit('user:report', data)
        break

      // System events
      case 'SYSTEM_ALERT':
        this._emit('system:alert', data)
        break

      case 'SYSTEM_STATUS':
        this._emit('system:status', data)
        break

      // Broadcast events
      case 'BROADCAST':
        this._emit('broadcast', data)
        break

      default:
        console.warn(`⚠️ Unknown message type: ${type}`)
    }
  },

  /**
   * Handle WebSocket disconnect and attempt reconnect
   * @private
   */
  _handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * this.reconnectAttempts

      console.log(
        `🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      )

      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.userId).catch((error) => {
          console.error('Reconnect failed:', error)
        })
      }, delay)
    } else {
      console.error('❌ Max reconnection attempts reached')
      this._emit('connection:failed')
    }
  },

  /**
   * Send message to server
   * @param {Object} message - Message object
   */
  sendMessage(message) {
    if (this.isConnected && this.socket) {
      try {
        this.socket.send(
          JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
            userId: this.userId
          })
        )
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
      }
    } else {
      console.warn('⚠️ WebSocket not connected')
    }
  },

  /**
   * Subscribe to WebSocket events
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Callback function
   */
  on(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = []
    }
    this.listeners[eventType].push(callback)
  },

  /**
   * Unsubscribe from WebSocket events
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function
   */
  off(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType].filter(
        (cb) => cb !== callback
      )
    }
  },

  /**
   * Emit event to all subscribers
   * @private
   */
  _emit(eventType, data) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
        }
      })
    }
  },

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    if (this.socket) {
      this.socket.close()
      this.isConnected = false
    }

    console.log('🔌 WebSocket disconnected')
  },

  /**
   * Send notification acknowledgement
   * @param {string} notificationId - Notification ID
   */
  acknowledgeNotification(notificationId) {
    this.sendMessage({
      type: 'NOTIFICATION_ACK',
      notificationId: notificationId
    })
  },

  /**
   * Send ping to keep connection alive
   */
  ping() {
    this.sendMessage({
      type: 'PING'
    })
  },

  /**
   * Get connection status
   * @returns {boolean}
   */
  getStatus() {
    return this.isConnected
  }
}

/**
 * Admin Activity WebSocket Handler
 * Handles admin-specific real-time events
 */
export const AdminActivityWebSocketHandler = {
  // Connection state
  handler: NotificationWebSocketHandler,

  /**
   * Initialize admin activity monitoring
   * @param {string} userId - Admin user ID
   */
  init(userId) {
    // Listen for admin events
    this.handler.on('admin:action', (data) => {
      console.log('📊 Admin action received:', data)
      this._handleAdminAction(data)
    })

    this.handler.on('content:moderated', (data) => {
      console.log('📋 Content moderated:', data)
      this._handleContentModerated(data)
    })

    this.handler.on('user:report', (data) => {
      console.log('⚠️ User report received:', data)
      this._handleUserReport(data)
    })
  },

  /**
   * Handle admin action event
   * @private
   */
  _handleAdminAction(data) {
    const { action, actor, target, timestamp, details } = data

    // Log admin action
    console.log({
      event: 'ADMIN_ACTION',
      action: action, // user_deleted, user_role_changed, content_approved, etc.
      actor: actor, // admin user info
      target: target, // what was modified
      timestamp: timestamp,
      details: details
    })

    // Dispatch event for UI update
    window.dispatchEvent(
      new CustomEvent('admin:action', {
        detail: { action, actor, target, timestamp, details }
      })
    )
  },

  /**
   * Handle content moderation event
   * @private
   */
  _handleContentModerated(data) {
    const { contentId, status, moderator, reason, timestamp } = data

    console.log({
      event: 'CONTENT_MODERATED',
      contentId: contentId,
      status: status, // approved, rejected, deleted
      moderator: moderator,
      reason: reason,
      timestamp: timestamp
    })

    // Dispatch event for UI update
    window.dispatchEvent(
      new CustomEvent('content:moderated', {
        detail: { contentId, status, moderator, reason, timestamp }
      })
    )
  },

  /**
   * Handle user report event
   * @private
   */
  _handleUserReport(data) {
    const { reportId, reportType, content, reporter, reason, timestamp } = data

    console.log({
      event: 'USER_REPORT',
      reportId: reportId,
      type: reportType, // abuse, spam, inappropriate, etc.
      content: content,
      reporter: reporter,
      reason: reason,
      timestamp: timestamp
    })

    // Dispatch event for UI update
    window.dispatchEvent(
      new CustomEvent('user:report', {
        detail: { reportId, reportType, content, reporter, reason, timestamp }
      })
    )
  },

  /**
   * Send admin notification to other users
   * @param {Object} notification - Notification data
   */
  broadcastNotification(notification) {
    NotificationWebSocketHandler.sendMessage({
      type: 'ADMIN_BROADCAST',
      notification: notification
    })
  },

  /**
   * Notify about content moderation action
   * @param {string} contentId - Content ID
   * @param {string} action - Action (approve, reject, delete)
   * @param {string} reason - Reason (if applicable)
   */
  notifyModeration(contentId, action, reason = '') {
    NotificationWebSocketHandler.sendMessage({
      type: 'CONTENT_MODERATION',
      contentId: contentId,
      action: action,
      reason: reason
    })
  },

  /**
   * Notify about user action
   * @param {string} userId - User ID
   * @param {string} action - Action (created, updated, deleted, role_changed)
   * @param {Object} details - Action details
   */
  notifyUserAction(userId, action, details = {}) {
    NotificationWebSocketHandler.sendMessage({
      type: 'USER_ACTION',
      userId: userId,
      action: action,
      details: details
    })
  }
}

/**
 * System Alert Handler
 * Handles system-wide alerts and notifications
 */
export const SystemAlertHandler = {
  handler: NotificationWebSocketHandler,

  /**
   * Initialize system alert monitoring
   */
  init() {
    this.handler.on('system:alert', (data) => {
      console.log('🚨 System alert:', data)
      this._handleSystemAlert(data)
    })

    this.handler.on('system:status', (data) => {
      console.log('📊 System status:', data)
      this._handleSystemStatus(data)
    })
  },

  /**
   * Handle system alert
   * @private
   */
  _handleSystemAlert(data) {
    const { alertType, severity, message, timestamp } = data

    // severity: critical, high, medium, low
    const bgColor = {
      critical: '#f56c6c',
      high: '#e6a23c',
      medium: '#409eff',
      low: '#67c23a'
    }[severity]

    // Dispatch event for alert display
    window.dispatchEvent(
      new CustomEvent('system:alert', {
        detail: { alertType, severity, message, timestamp, bgColor }
      })
    )
  },

  /**
   * Handle system status update
   * @private
   */
  _handleSystemStatus(data) {
    const { cpuUsage, memoryUsage, diskUsage, activeUsers, timestamp } = data

    window.dispatchEvent(
      new CustomEvent('system:status', {
        detail: {
          cpuUsage,
          memoryUsage,
          diskUsage,
          activeUsers,
          timestamp
        }
      })
    )
  }
}

export default NotificationWebSocketHandler
