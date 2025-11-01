/**
 * Notification Service - 实时通知服务
 *
 * 功能:
 * - 通知CRUD操作
 * - 通知分类和过滤
 * - 未读通知管理
 * - WebSocket 实时推送
 * - 通知发送
 *
 * @module notificationService
 */

const notificationService = {
  // 通知类型
  NOTIFICATION_TYPES: {
    SYSTEM: 'system',
    USER_INTERACTION: 'user',
    CONTENT: 'content',
    AUDIT: 'audit',
    ALERT: 'alert'
  },

  // 优先级
  PRIORITY_LEVELS: {
    URGENT: 'urgent',
    IMPORTANT: 'important',
    INFO: 'info',
    NORMAL: 'normal'
  },

  /**
   * 获取用户通知列表
   * @param {Object} filters
   *   - type: 通知类型
   *   - read: true/false (已读/未读)
   *   - priority: 优先级
   * @param {Object} pagination
   *   - page: 页码
   *   - pageSize: 每页数量
   * @returns {Object} {notifications, total, unreadCount}
   */
  getNotifications(filters = {}, pagination = {}) {
    const defaultPagination = {
      page: 1,
      pageSize: 20,
      ...pagination
    }

    // 获取所有通知
    const allNotifications = this._getAllNotifications()

    // 应用过滤
    let filtered = allNotifications

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type)
    }

    if (filters.read !== undefined) {
      filtered = filtered.filter(n => n.read === filters.read)
    }

    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority)
    }

    // 按时间倒序排序
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // 分页
    const total = filtered.length
    const start = (defaultPagination.page - 1) * defaultPagination.pageSize
    const end = start + defaultPagination.pageSize
    const notifications = filtered.slice(start, end)

    // 计算未读数
    const unreadCount = allNotifications.filter(n => !n.read).length

    return {
      notifications,
      total,
      unreadCount,
      page: defaultPagination.page,
      pageSize: defaultPagination.pageSize,
      totalPages: Math.ceil(total / defaultPagination.pageSize)
    }
  },

  /**
   * 获取未读通知数
   * @param {string} userId
   * @returns {number} 未读数
   */
  getUnreadCount(userId) {
    const notifications = this._getAllNotifications()
    return notifications.filter(n => !n.read).length
  },

  /**
   * 获取单个通知详情
   * @param {string} notificationId
   * @returns {Object} 通知对象
   */
  getNotificationDetail(notificationId) {
    const notifications = this._getAllNotifications()
    return notifications.find(n => n.id === notificationId)
  },

  /**
   * 创建通知
   * @param {Object} notification
   *   - type: 通知类型
   *   - title: 标题
   *   - content: 内容
   *   - priority: 优先级
   *   - data: 关联数据
   *   - targetUsers: 目标用户 (可选，不指定则为系统通知)
   * @returns {Object} 创建的通知
   */
  createNotification(notification) {
    const newNotification = {
      id: `notif_${Date.now()}`,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      priority: notification.priority || this.PRIORITY_LEVELS.NORMAL,
      read: false,
      data: notification.data || {},
      targetUsers: notification.targetUsers || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
    }

    // 保存到 localStorage
    const notifications = this._getAllNotifications()
    notifications.push(newNotification)
    localStorage.setItem('notifications', JSON.stringify(notifications))

    return newNotification
  },

  /**
   * 标记单个通知为已读
   * @param {string} notificationId
   * @returns {Object} 更新后的通知
   */
  markAsRead(notificationId) {
    const notifications = this._getAllNotifications()
    const notif = notifications.find(n => n.id === notificationId)

    if (notif) {
      notif.read = true
      notif.updatedAt = new Date()
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }

    return notif
  },

  /**
   * 标记全部通知为已读
   * @returns {number} 标记的通知数
   */
  markAllAsRead() {
    const notifications = this._getAllNotifications()
    let count = 0

    notifications.forEach(n => {
      if (!n.read) {
        n.read = true
        n.updatedAt = new Date()
        count++
      }
    })

    localStorage.setItem('notifications', JSON.stringify(notifications))
    return count
  },

  /**
   * 删除单个通知
   * @param {string} notificationId
   * @returns {boolean} 是否成功
   */
  deleteNotification(notificationId) {
    const notifications = this._getAllNotifications()
    const idx = notifications.findIndex(n => n.id === notificationId)

    if (idx > -1) {
      notifications.splice(idx, 1)
      localStorage.setItem('notifications', JSON.stringify(notifications))
      return true
    }

    return false
  },

  /**
   * 删除全部通知
   * @returns {number} 删除的通知数
   */
  deleteAllNotifications() {
    const notifications = this._getAllNotifications()
    const count = notifications.length
    localStorage.setItem('notifications', JSON.stringify([]))
    return count
  },

  /**
   * 删除旧通知（按天数）
   * @param {number} days - 删除days天前的通知
   * @returns {number} 删除的通知数
   */
  deleteOldNotifications(days = 30) {
    const notifications = this._getAllNotifications()
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const filtered = notifications.filter(n => new Date(n.createdAt) > cutoffDate)
    const count = notifications.length - filtered.length
    localStorage.setItem('notifications', JSON.stringify(filtered))
    return count
  },

  /**
   * 发送系统通知
   * @param {string} message - 消息内容
   * @param {string} priority - 优先级
   * @returns {Object} 通知对象
   */
  sendSystemNotification(message, priority = this.PRIORITY_LEVELS.INFO) {
    return this.createNotification({
      type: this.NOTIFICATION_TYPES.SYSTEM,
      title: '系统通知',
      content: message,
      priority
    })
  },

  /**
   * 发送用户互动通知
   * @param {Object} data
   *   - actor: 操作者信息
   *   - action: 操作类型 (like/comment/follow)
   *   - target: 目标对象
   * @returns {Object} 通知对象
   */
  sendUserInteractionNotification(data) {
    const actionTexts = {
      like: '赞了你的',
      comment: '评论了你的',
      follow: '关注了你',
      reply: '回复了你的'
    }

    const actionText = actionTexts[data.action] || data.action
    const content = `${data.actor.name} ${actionText} ${data.target.type}`

    return this.createNotification({
      type: this.NOTIFICATION_TYPES.USER_INTERACTION,
      title: `${data.actor.name} 的互动`,
      content,
      priority: this.PRIORITY_LEVELS.INFO,
      data
    })
  },

  /**
   * 发送内容更新通知
   * @param {Object} data
   *   - contentType: 内容类型
   *   - title: 内容标题
   *   - author: 作者信息
   * @returns {Object} 通知对象
   */
  sendContentNotification(data) {
    return this.createNotification({
      type: this.NOTIFICATION_TYPES.CONTENT,
      title: `新的 ${data.contentType}`,
      content: `${data.author.name} 分享了: ${data.title}`,
      priority: this.PRIORITY_LEVELS.INFO,
      data
    })
  },

  /**
   * 发送审核结果通知
   * @param {Object} data
   *   - contentType: 内容类型
   *   - contentTitle: 内容标题
   *   - status: 'approved' | 'rejected'
   *   - reason: 原因（如果被拒绝）
   * @returns {Object} 通知对象
   */
  sendAuditNotification(data) {
    const statusText = data.status === 'approved' ? '已批准' : '已拒绝'
    const title = `你的 ${data.contentType} ${statusText}`
    const content = data.reason
      ? `${data.contentTitle} - ${data.reason}`
      : data.contentTitle

    return this.createNotification({
      type: this.NOTIFICATION_TYPES.AUDIT,
      title,
      content,
      priority: data.status === 'rejected' ? this.PRIORITY_LEVELS.IMPORTANT : this.PRIORITY_LEVELS.INFO,
      data
    })
  },

  /**
   * 发送告警通知
   * @param {Object} data
   *   - alertType: 告警类型
   *   - message: 告警消息
   *   - severity: 'critical' | 'high' | 'medium' | 'low'
   * @returns {Object} 通知对象
   */
  sendAlertNotification(data) {
    const priorityMap = {
      critical: this.PRIORITY_LEVELS.URGENT,
      high: this.PRIORITY_LEVELS.IMPORTANT,
      medium: this.PRIORITY_LEVELS.INFO,
      low: this.PRIORITY_LEVELS.NORMAL
    }

    return this.createNotification({
      type: this.NOTIFICATION_TYPES.ALERT,
      title: `告警: ${data.alertType}`,
      content: data.message,
      priority: priorityMap[data.severity] || this.PRIORITY_LEVELS.INFO,
      data
    })
  },

  /**
   * WebSocket 实时推送
   */

  // 订阅的用户列表
  _subscribers: {},

  /**
   * 订阅通知
   * @param {string} userId
   * @param {Function} callback - 接收通知的回调函数
   */
  subscribeNotifications(userId, callback) {
    if (!this._subscribers[userId]) {
      this._subscribers[userId] = []
    }
    this._subscribers[userId].push(callback)
  },

  /**
   * 取消订阅
   * @param {string} userId
   * @param {Function} callback
   */
  unsubscribeNotifications(userId, callback) {
    if (this._subscribers[userId]) {
      const idx = this._subscribers[userId].indexOf(callback)
      if (idx > -1) {
        this._subscribers[userId].splice(idx, 1)
      }
    }
  },

  /**
   * 广播通知给所有订阅者
   * @param {Object} notification
   */
  broadcastNotification(notification) {
    // 发送给目标用户
    if (notification.targetUsers && notification.targetUsers.length > 0) {
      notification.targetUsers.forEach(userId => {
        this._sendToUser(userId, notification)
      })
    } else {
      // 发送给所有用户
      Object.keys(this._subscribers).forEach(userId => {
        this._sendToUser(userId, notification)
      })
    }
  },

  /**
   * 发送通知给单个用户
   * @private
   */
  _sendToUser(userId, notification) {
    if (this._subscribers[userId]) {
      this._subscribers[userId].forEach(callback => {
        try {
          callback(notification)
        } catch (error) {
          console.error('Notification callback error:', error)
        }
      })
    }
  },

  /**
   * 私有辅助方法
   */

  /**
   * 生成模拟通知数据
   * @private
   */
  _getAllNotifications() {
    const saved = localStorage.getItem('notifications')
    if (!saved) {
      // 初始化一些示例通知
      const mockNotifications = [
        {
          id: 'notif_1',
          type: this.NOTIFICATION_TYPES.SYSTEM,
          title: '欢迎使用系统',
          content: '欢迎加入我们的学习平台',
          priority: this.PRIORITY_LEVELS.INFO,
          read: false,
          data: {},
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 'notif_2',
          type: this.NOTIFICATION_TYPES.USER_INTERACTION,
          title: 'Alice 的互动',
          content: 'Alice 赞了你的帖子',
          priority: this.PRIORITY_LEVELS.INFO,
          read: false,
          data: { actor: { name: 'Alice' }, action: 'like' },
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
        },
        {
          id: 'notif_3',
          type: this.NOTIFICATION_TYPES.AUDIT,
          title: '你的内容已批准',
          content: '关于 JavaScript 的文章已通过审核',
          priority: this.PRIORITY_LEVELS.INFO,
          read: true,
          data: { status: 'approved' },
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
        }
      ]

      localStorage.setItem('notifications', JSON.stringify(mockNotifications))
      return mockNotifications
    }

    return JSON.parse(saved)
  }
}

export default notificationService
