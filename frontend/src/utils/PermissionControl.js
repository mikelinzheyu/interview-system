/**
 * Permission Control System
 *
 * Manages role-based access control (RBAC) for admin functions
 * Supports three user roles: admin, vip, user
 *
 * @module permissionControl
 */

/**
 * User Roles and Permissions
 */
export const ROLES = {
  ADMIN: 'admin',
  VIP: 'vip',
  USER: 'user'
}

/**
 * Permission Actions
 */
export const ACTIONS = {
  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  MANAGE_ROLES: 'manage_roles',
  BAN_USER: 'ban_user',

  // Content Moderation
  VIEW_CONTENT: 'view_content',
  APPROVE_CONTENT: 'approve_content',
  REJECT_CONTENT: 'reject_content',
  DELETE_CONTENT: 'delete_content',

  // Notifications
  VIEW_NOTIFICATIONS: 'view_notifications',
  SEND_NOTIFICATION: 'send_notification',
  BROADCAST_NOTIFICATION: 'broadcast_notification',

  // Admin Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_REPORTS: 'export_reports',

  // System Management
  MANAGE_SYSTEM: 'manage_system',
  VIEW_LOGS: 'view_logs',
  MANAGE_SETTINGS: 'manage_settings'
}

/**
 * Role-Based Permission Map
 * Defines which roles can perform which actions
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // User Management (full access)
    ACTIONS.VIEW_USERS,
    ACTIONS.CREATE_USER,
    ACTIONS.EDIT_USER,
    ACTIONS.DELETE_USER,
    ACTIONS.MANAGE_ROLES,
    ACTIONS.BAN_USER,

    // Content Moderation (full access)
    ACTIONS.VIEW_CONTENT,
    ACTIONS.APPROVE_CONTENT,
    ACTIONS.REJECT_CONTENT,
    ACTIONS.DELETE_CONTENT,

    // Notifications (full access)
    ACTIONS.VIEW_NOTIFICATIONS,
    ACTIONS.SEND_NOTIFICATION,
    ACTIONS.BROADCAST_NOTIFICATION,

    // Dashboard (full access)
    ACTIONS.VIEW_DASHBOARD,
    ACTIONS.VIEW_ANALYTICS,
    ACTIONS.EXPORT_REPORTS,

    // System (full access)
    ACTIONS.MANAGE_SYSTEM,
    ACTIONS.VIEW_LOGS,
    ACTIONS.MANAGE_SETTINGS
  ],

  [ROLES.VIP]: [
    // User Management (read-only)
    ACTIONS.VIEW_USERS,

    // Content Moderation (limited)
    ACTIONS.VIEW_CONTENT,
    ACTIONS.APPROVE_CONTENT,
    ACTIONS.REJECT_CONTENT,

    // Notifications (limited)
    ACTIONS.VIEW_NOTIFICATIONS,

    // Dashboard (limited)
    ACTIONS.VIEW_DASHBOARD,
    ACTIONS.VIEW_ANALYTICS
  ],

  [ROLES.USER]: [
    // Notifications (read-only)
    ACTIONS.VIEW_NOTIFICATIONS
  ]
}

/**
 * Permission Control Service
 * Manages permission checks and access control
 */
export const PermissionControl = {
  // Current user
  currentUser: null,
  currentRole: null,

  /**
   * Initialize permission system with current user
   * @param {Object} user - User object with role information
   */
  init(user) {
    this.currentUser = user
    this.currentRole = user?.role || ROLES.USER
    console.log(`✅ Permission system initialized for role: ${this.currentRole}`)
  },

  /**
   * Check if user has specific permission
   * @param {string} action - Action to check
   * @returns {boolean}
   */
  hasPermission(action) {
    if (!this.currentRole) {
      return false
    }

    const permissions = ROLE_PERMISSIONS[this.currentRole] || []
    return permissions.includes(action)
  },

  /**
   * Check if user has any of the given permissions
   * @param {string[]} actions - List of actions
   * @returns {boolean}
   */
  hasAnyPermission(actions) {
    return actions.some((action) => this.hasPermission(action))
  },

  /**
   * Check if user has all of the given permissions
   * @param {string[]} actions - List of actions
   * @returns {boolean}
   */
  hasAllPermissions(actions) {
    return actions.every((action) => this.hasPermission(action))
  },

  /**
   * Check if user has admin role
   * @returns {boolean}
   */
  isAdmin() {
    return this.currentRole === ROLES.ADMIN
  },

  /**
   * Check if user has VIP or admin role
   * @returns {boolean}
   */
  isVipOrAdmin() {
    return [ROLES.ADMIN, ROLES.VIP].includes(this.currentRole)
  },

  /**
   * Get all permissions for current user
   * @returns {string[]}
   */
  getPermissions() {
    return ROLE_PERMISSIONS[this.currentRole] || []
  },

  /**
   * Get current user role
   * @returns {string}
   */
  getRole() {
    return this.currentRole
  },

  /**
   * Set user role (for testing/simulation)
   * @param {string} role - New role
   */
  setRole(role) {
    if (Object.values(ROLES).includes(role)) {
      this.currentRole = role
      console.log(`🔄 Role changed to: ${role}`)
    }
  }
}

/**
 * Route Permission Guard
 * Protects routes based on user permissions
 */
export const RoutePermissionGuard = {
  /**
   * Check if route should be accessible
   * @param {string} route - Route path
   * @returns {boolean}
   */
  canAccess(route) {
    const routeRequirements = this._getRouteRequirements(route)

    if (!routeRequirements) {
      // Public route
      return true
    }

    const { requiredRole, requiredPermissions } = routeRequirements

    // Check role requirement
    if (requiredRole && PermissionControl.currentRole !== requiredRole) {
      if (requiredRole === ROLES.ADMIN) {
        return PermissionControl.isAdmin()
      }
      return false
    }

    // Check permission requirement
    if (requiredPermissions && requiredPermissions.length > 0) {
      return PermissionControl.hasAllPermissions(requiredPermissions)
    }

    return true
  },

  /**
   * Get route protection requirements
   * @private
   */
  _getRouteRequirements(route) {
    const requirements = {
      '/admin/dashboard': {
        requiredRole: ROLES.ADMIN,
        requiredPermissions: [ACTIONS.VIEW_DASHBOARD]
      },
      '/admin/users': {
        requiredRole: ROLES.ADMIN,
        requiredPermissions: [ACTIONS.VIEW_USERS]
      },
      '/admin/content': {
        requiredRole: ROLES.ADMIN,
        requiredPermissions: [ACTIONS.VIEW_CONTENT]
      },
      '/admin/notifications': {
        requiredRole: ROLES.ADMIN,
        requiredPermissions: [ACTIONS.VIEW_NOTIFICATIONS]
      }
    }

    return requirements[route]
  }
}

/**
 * API Request Permission Guard
 * Protects API calls based on user permissions
 */
export const APIPermissionGuard = {
  /**
   * Check if user can call API endpoint
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @returns {boolean}
   */
  canCallAPI(method, endpoint) {
    const endpointRequirements = this._getEndpointRequirements(method, endpoint)

    if (!endpointRequirements) {
      // Public endpoint
      return true
    }

    const { requiredPermissions } = endpointRequirements

    if (requiredPermissions && requiredPermissions.length > 0) {
      return PermissionControl.hasAllPermissions(requiredPermissions)
    }

    return true
  },

  /**
   * Get API endpoint protection requirements
   * @private
   */
  _getEndpointRequirements(method, endpoint) {
    const requirements = {
      'GET /api/admin/users': {
        requiredPermissions: [ACTIONS.VIEW_USERS]
      },
      'POST /api/admin/users': {
        requiredPermissions: [ACTIONS.CREATE_USER]
      },
      'PUT /api/admin/users/:id': {
        requiredPermissions: [ACTIONS.EDIT_USER]
      },
      'DELETE /api/admin/users/:id': {
        requiredPermissions: [ACTIONS.DELETE_USER]
      },
      'GET /api/admin/content': {
        requiredPermissions: [ACTIONS.VIEW_CONTENT]
      },
      'POST /api/admin/content/:id/approve': {
        requiredPermissions: [ACTIONS.APPROVE_CONTENT]
      },
      'POST /api/admin/content/:id/reject': {
        requiredPermissions: [ACTIONS.REJECT_CONTENT]
      },
      'DELETE /api/admin/content/:id': {
        requiredPermissions: [ACTIONS.DELETE_CONTENT]
      },
      'GET /api/admin/notifications': {
        requiredPermissions: [ACTIONS.VIEW_NOTIFICATIONS]
      },
      'POST /api/admin/notifications/broadcast': {
        requiredPermissions: [ACTIONS.BROADCAST_NOTIFICATION]
      },
      'GET /api/admin/dashboard': {
        requiredPermissions: [ACTIONS.VIEW_DASHBOARD]
      },
      'GET /api/admin/analytics': {
        requiredPermissions: [ACTIONS.VIEW_ANALYTICS]
      }
    }

    const key = `${method} ${endpoint}`
    return requirements[key]
  }
}

/**
 * Sensitive Operation Confirmation
 * Requires additional confirmation for dangerous operations
 */
export const SensitiveOperations = {
  /**
   * Dangerous operations that require confirmation
   */
  dangerousOperations: {
    DELETE_USER: {
      message: '确认要删除此用户吗？此操作不可撤销！',
      severity: 'error'
    },
    DELETE_CONTENT: {
      message: '确认要删除此内容吗？此操作不可撤销！',
      severity: 'error'
    },
    BAN_USER: {
      message: '确认要封禁此用户吗？该用户将无法使用平台。',
      severity: 'warning'
    },
    BROADCAST_NOTIFICATION: {
      message: '确认要向全体用户发送通知吗？',
      severity: 'warning'
    },
    MANAGE_SYSTEM: {
      message: '确认要修改系统设置吗？这可能影响所有用户。',
      severity: 'error'
    }
  },

  /**
   * Check if operation requires confirmation
   * @param {string} operation - Operation name
   * @returns {Object|null}
   */
  requiresConfirmation(operation) {
    return this.dangerousOperations[operation] || null
  },

  /**
   * Get confirmation message for operation
   * @param {string} operation - Operation name
   * @returns {string}
   */
  getConfirmationMessage(operation) {
    const config = this.dangerousOperations[operation]
    return config ? config.message : ''
  },

  /**
   * Get severity level for operation
   * @param {string} operation - Operation name
   * @returns {string}
   */
  getSeverity(operation) {
    const config = this.dangerousOperations[operation]
    return config ? config.severity : 'info'
  }
}

/**
 * Audit Logging Service
 * Logs all admin actions for compliance and debugging
 */
export const AuditLogger = {
  logs: [],

  /**
   * Log an admin action
   * @param {Object} log - Log object
   */
  log(action, actor, target, details = {}) {
    const logEntry = {
      id: `audit_${Date.now()}`,
      action: action,
      actor: actor, // user info
      target: target, // what was modified
      details: details,
      timestamp: new Date().toISOString(),
      ipAddress: this._getIPAddress(),
      userAgent: navigator.userAgent
    }

    this.logs.push(logEntry)

    // Send to server for persistent storage
    this._sendToServer(logEntry)

    console.log('📝 Audit log:', logEntry)
  },

  /**
   * Get audit logs
   * @param {Object} filters - Filter options
   * @returns {Array}
   */
  getLogs(filters = {}) {
    let filtered = [...this.logs]

    if (filters.action) {
      filtered = filtered.filter((log) => log.action === filters.action)
    }

    if (filters.actor) {
      filtered = filtered.filter((log) => log.actor.id === filters.actor)
    }

    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp)
        return logDate >= startDate && logDate <= endDate
      })
    }

    return filtered
  },

  /**
   * Clear audit logs (only for testing)
   */
  clearLogs() {
    console.warn('🗑️ Clearing audit logs')
    this.logs = []
  },

  /**
   * Get IP address (simulated)
   * @private
   */
  _getIPAddress() {
    // In real app, get from server
    return '127.0.0.1'
  },

  /**
   * Send audit log to server
   * @private
   */
  _sendToServer(logEntry) {
    // In real app, send via API
    console.log('📤 Sending audit log to server:', logEntry)
  }
}

export default {
  PermissionControl,
  RoutePermissionGuard,
  APIPermissionGuard,
  SensitiveOperations,
  AuditLogger,
  ROLES,
  ACTIONS,
  ROLE_PERMISSIONS
}
