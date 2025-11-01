/**
 * Admin Service - 管理员管理服务
 *
 * 功能:
 * - 用户管理（列表、搜索、过滤、修改状态）
 * - 内容审核（获取、批准、拒绝、删除）
 * - 系统统计（用户、内容、活动）
 * - 管理员日志
 *
 * @module adminService
 */

const adminService = {
  /**
   * 用户管理相关方法
   */

  /**
   * 获取用户列表
   * @param {Object} filters - 过滤条件
   *   - searchQuery: 搜索用户名或邮箱
   *   - status: 'all' | 'active' | 'disabled' | 'new'
   *   - role: 'all' | 'user' | 'vip' | 'admin'
   *   - joinDateFrom: 开始日期
   *   - joinDateTo: 结束日期
   * @param {Object} pagination - 分页信息
   *   - page: 页码 (从1开始)
   *   - pageSize: 每页条数
   *   - sortBy: 排序字段
   *   - sortOrder: 'asc' | 'desc'
   * @returns {Object} {users, total, page, pageSize}
   */
  getUsers(filters = {}, pagination = {}) {
    const defaultFilters = {
      searchQuery: '',
      status: 'all',
      role: 'all',
      ...filters
    }

    const defaultPagination = {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...pagination
    }

    // 生成模拟用户数据
    const allUsers = this._generateMockUsers(100)

    // 应用过滤
    let filteredUsers = allUsers.filter(user => {
      // 搜索过滤
      if (defaultFilters.searchQuery) {
        const query = defaultFilters.searchQuery.toLowerCase()
        const matches = user.userName.toLowerCase().includes(query) ||
                       user.email.toLowerCase().includes(query)
        if (!matches) return false
      }

      // 状态过滤
      if (defaultFilters.status !== 'all' && user.status !== defaultFilters.status) {
        return false
      }

      // 角色过滤
      if (defaultFilters.role !== 'all' && user.role !== defaultFilters.role) {
        return false
      }

      return true
    })

    // 排序
    filteredUsers.sort((a, b) => {
      let aVal = a[defaultPagination.sortBy]
      let bVal = b[defaultPagination.sortBy]

      if (defaultPagination.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    // 分页
    const total = filteredUsers.length
    const start = (defaultPagination.page - 1) * defaultPagination.pageSize
    const end = start + defaultPagination.pageSize
    const users = filteredUsers.slice(start, end)

    return {
      users,
      total,
      page: defaultPagination.page,
      pageSize: defaultPagination.pageSize,
      totalPages: Math.ceil(total / defaultPagination.pageSize)
    }
  },

  /**
   * 获取用户详细信息
   * @param {string} userId
   * @returns {Object} 用户对象（包含学习统计、活动历史）
   */
  getUserDetails(userId) {
    const user = this._generateMockUser(userId)
    return {
      ...user,
      // 学习统计
      learningStats: {
        totalQuestions: Math.floor(Math.random() * 500) + 50,
        correctAnswers: Math.floor(Math.random() * 400) + 30,
        accuracy: (Math.random() * 40 + 60).toFixed(1),
        totalTime: Math.floor(Math.random() * 1000) + 100,
        lastActiveTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      },
      // 违规记录
      violations: [
        {
          id: 'v1',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          type: 'spam',
          reason: '发布垃圾内容',
          status: 'resolved'
        }
      ],
      // 活动历史
      activityHistory: [
        {
          date: new Date(),
          action: '登录',
          details: 'Web'
        },
        {
          date: new Date(Date.now() - 1 * 60 * 60 * 1000),
          action: '完成练习',
          details: 'JavaScript 异步编程'
        }
      ]
    }
  },

  /**
   * 更新用户状态
   * @param {string} userId
   * @param {string} newStatus - 'active' | 'disabled'
   * @returns {Object} 更新后的用户对象
   */
  updateUserStatus(userId, newStatus) {
    this._logAdminAction('update_user_status', {
      userId,
      newStatus
    })

    return {
      id: userId,
      status: newStatus,
      updatedAt: new Date()
    }
  },

  /**
   * 更新用户角色
   * @param {string} userId
   * @param {string} newRole - 'user' | 'vip' | 'admin'
   * @returns {Object} 更新后的用户对象
   */
  updateUserRole(userId, newRole) {
    this._logAdminAction('update_user_role', {
      userId,
      newRole
    })

    return {
      id: userId,
      role: newRole,
      updatedAt: new Date()
    }
  },

  /**
   * 删除用户
   * @param {string} userId
   * @param {string} reason - 删除原因
   * @returns {boolean} 是否成功
   */
  deleteUser(userId, reason) {
    this._logAdminAction('delete_user', {
      userId,
      reason
    })

    return true
  },

  /**
   * 内容审核相关方法
   */

  /**
   * 获取待审核内容
   * @param {Object} filters
   *   - contentType: 'all' | 'post' | 'guide' | 'comment'
   *   - status: 'pending' | 'approved' | 'rejected'
   * @returns {Array} 内容对象数组
   */
  getPendingContent(filters = {}) {
    const defaultFilters = {
      contentType: 'all',
      status: 'pending',
      ...filters
    }

    const content = []
    const types = ['post', 'guide', 'comment']
    const statuses = ['pending', 'approved', 'rejected']

    for (let i = 0; i < 15; i++) {
      const type = defaultFilters.contentType === 'all'
        ? types[Math.floor(Math.random() * types.length)]
        : defaultFilters.contentType

      content.push({
        id: `content_${i}`,
        contentType: type,
        title: this._generateContentTitle(type, i),
        author: {
          userId: `user_${Math.floor(Math.random() * 100)}`,
          userName: `User ${Math.floor(Math.random() * 100)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`
        },
        content: this._generateContentText(i),
        reportCount: Math.floor(Math.random() * 5),
        reportReasons: ['spam', 'offensive', 'duplicate', 'irrelevant'],
        status: defaultFilters.status,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        priority: Math.random() > 0.7 ? 'high' : 'normal'
      })
    }

    return content.filter(c => c.status === defaultFilters.status)
  },

  /**
   * 获取内容详情
   * @param {string} contentId
   * @returns {Object} 内容对象
   */
  getContentDetails(contentId) {
    return {
      id: contentId,
      title: '关于 JavaScript 异步编程的讨论',
      author: {
        userId: 'user_123',
        userName: 'Developer XYZ',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123'
      },
      content: '这是详细的内容文本...包含多个段落和代码示例',
      contentType: 'post',
      category: '学习讨论',
      tags: ['JavaScript', '异步', 'Promise'],
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reports: [
        {
          id: 'report_1',
          reporterId: 'user_456',
          reason: 'spam',
          description: '此内容看起来像垃圾邮件',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ],
      totalReports: 1
    }
  },

  /**
   * 批准内容
   * @param {string} contentId
   * @param {string} notes - 批准备注
   * @returns {Object} 更新后的内容
   */
  approveContent(contentId, notes = '') {
    this._logAdminAction('approve_content', {
      contentId,
      notes
    })

    return {
      id: contentId,
      status: 'approved',
      approvedAt: new Date(),
      approverNotes: notes
    }
  },

  /**
   * 拒绝内容
   * @param {string} contentId
   * @param {string} reason - 拒绝原因
   * @returns {Object} 更新后的内容
   */
  rejectContent(contentId, reason) {
    this._logAdminAction('reject_content', {
      contentId,
      reason
    })

    return {
      id: contentId,
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason
    }
  },

  /**
   * 删除内容
   * @param {string} contentId
   * @param {string} reason - 删除原因
   * @returns {boolean} 是否成功
   */
  deleteContent(contentId, reason) {
    this._logAdminAction('delete_content', {
      contentId,
      reason
    })

    return true
  },

  /**
   * 统计和分析
   */

  /**
   * 获取系统统计
   * @returns {Object} 系统统计数据
   */
  getSystemStats() {
    return {
      totalUsers: Math.floor(Math.random() * 10000) + 1000,
      activeUsers: Math.floor(Math.random() * 5000) + 500,
      newUsersToday: Math.floor(Math.random() * 100) + 10,
      totalContent: Math.floor(Math.random() * 50000) + 5000,
      pendingContent: Math.floor(Math.random() * 50) + 5,
      totalReports: Math.floor(Math.random() * 200) + 20,
      activeReports: Math.floor(Math.random() * 20) + 5,
      systemHealth: {
        uptime: 99.9,
        responsTime: Math.floor(Math.random() * 100) + 50,
        errorRate: (Math.random() * 0.1).toFixed(2),
        serverLoad: (Math.random() * 60 + 20).toFixed(1)
      }
    }
  },

  /**
   * 获取用户统计
   * @param {string} timeRange - '24h' | '7d' | '30d'
   * @returns {Object} 用户统计数据
   */
  getUserStats(timeRange = '7d') {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30

    return {
      newUsers: Math.floor(Math.random() * 100 * multiplier) + 50,
      activeUsers: Math.floor(Math.random() * 500 * multiplier) + 200,
      disabledUsers: Math.floor(Math.random() * 20),
      avgSessionDuration: Math.floor(Math.random() * 60 + 10),
      avgLearningTime: Math.floor(Math.random() * 120 + 30),
      retentionRate: (Math.random() * 40 + 60).toFixed(1),
      churnRate: (Math.random() * 20 + 5).toFixed(1)
    }
  },

  /**
   * 获取内容统计
   * @param {string} timeRange
   * @returns {Object} 内容统计数据
   */
  getContentStats(timeRange = '7d') {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30

    return {
      totalContent: Math.floor(Math.random() * 500 * multiplier) + 200,
      approvedContent: Math.floor(Math.random() * 400 * multiplier) + 150,
      rejectedContent: Math.floor(Math.random() * 50 * multiplier) + 10,
      pendingContent: Math.floor(Math.random() * 50),
      avgTimeToApprove: Math.floor(Math.random() * 24 + 2),
      approvalRate: (Math.random() * 20 + 75).toFixed(1),
      reportedContent: Math.floor(Math.random() * 100 * multiplier) + 20
    }
  },

  /**
   * 获取活动统计
   * @param {string} timeRange
   * @returns {Object} 活动统计数据
   */
  getActivityStats(timeRange = '7d') {
    return {
      totalLogins: Math.floor(Math.random() * 5000),
      totalPosts: Math.floor(Math.random() * 2000),
      totalComments: Math.floor(Math.random() * 5000),
      totalLikes: Math.floor(Math.random() * 10000),
      avgPostsPerUser: (Math.random() * 5 + 1).toFixed(1),
      mostActiveHours: ['14:00-15:00', '19:00-20:00', '20:00-21:00']
    }
  },

  /**
   * 管理员日志
   */

  /**
   * 获取管理员操作日志
   * @param {Object} filters
   * @returns {Array} 日志对象数组
   */
  getAdminLogs(filters = {}) {
    const logs = []
    const actions = [
      'update_user_status',
      'update_user_role',
      'delete_user',
      'approve_content',
      'reject_content',
      'delete_content'
    ]

    for (let i = 0; i < 50; i++) {
      logs.push({
        id: `log_${i}`,
        adminId: `admin_${Math.floor(Math.random() * 10)}`,
        adminName: `Admin ${Math.floor(Math.random() * 10)}`,
        action: actions[Math.floor(Math.random() * actions.length)],
        targetType: Math.random() > 0.5 ? 'user' : 'content',
        targetId: `target_${i}`,
        details: {
          oldValue: 'old_value',
          newValue: 'new_value'
        },
        status: Math.random() > 0.9 ? 'failed' : 'success',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      })
    }

    return logs
  },

  /**
   * 记录管理员操作
   * @param {string} action
   * @param {Object} details
   * @returns {Object} 日志对象
   */
  _logAdminAction(action, details) {
    const log = {
      id: `log_${Date.now()}`,
      adminId: 'current_admin', // 应从认证系统获取
      action,
      details,
      status: 'success',
      timestamp: new Date()
    }

    // 保存到 localStorage
    const logs = this._getAdminLogs()
    logs.push(log)
    localStorage.setItem('admin_logs', JSON.stringify(logs))

    return log
  },

  /**
   * 私有辅助方法
   */

  _generateMockUsers(count) {
    const statuses = ['active', 'disabled', 'new', 'inactive']
    const roles = ['user', 'vip', 'admin']
    const users = []

    for (let i = 0; i < count; i++) {
      users.push(this._generateMockUser(`user_${i}`))
    }

    return users
  },

  _generateMockUser(userId) {
    const statuses = ['active', 'disabled', 'new', 'inactive']
    const roles = ['user', 'vip', 'admin']

    return {
      id: userId,
      userName: `User ${Math.floor(Math.random() * 10000)}`,
      email: `user${Math.floor(Math.random() * 10000)}@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    }
  },

  _generateContentTitle(type, idx) {
    const titles = {
      post: [
        '如何学习 JavaScript？',
        '分享我的学习经历',
        '求助：React 组件问题',
        '最佳实践讨论'
      ],
      guide: [
        'JavaScript 完全指南',
        'Vue.js 性能优化',
        'TypeScript 最佳实践',
        '异步编程详解'
      ],
      comment: [
        '很有帮助的内容',
        '我有不同的看法',
        '感谢分享',
        '需要更多细节'
      ]
    }

    const list = titles[type] || titles.post
    return list[idx % list.length]
  },

  _generateContentText(idx) {
    return `这是第 ${idx} 条内容的文本摘要。这里包含了主要的讨论内容，包括问题描述、观点分享或指导信息。...`
  },

  _getAdminLogs() {
    const saved = localStorage.getItem('admin_logs')
    return saved ? JSON.parse(saved) : []
  }
}

export default adminService
