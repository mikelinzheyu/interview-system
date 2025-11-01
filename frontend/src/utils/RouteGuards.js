/**
 * Route Guards for Admin Routes
 *
 * Protects admin routes based on user role and permissions
 * Handles authentication and authorization
 *
 * @module routeGuards
 */

import { PermissionControl, RoutePermissionGuard, ROLES, ACTIONS } from './PermissionControl'

/**
 * Authentication Guard
 * Checks if user is authenticated
 */
export const AuthenticationGuard = {
  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('currentUser')

    return !!token && !!user
  },

  /**
   * Get current user
   * @returns {Object|null}
   */
  getCurrentUser() {
    const user = localStorage.getItem('currentUser')
    return user ? JSON.parse(user) : null
  },

  /**
   * Verify token validity
   * @returns {boolean}
   */
  isTokenValid() {
    const token = localStorage.getItem('authToken')
    if (!token) return false

    try {
      // Decode JWT (simple implementation)
      const parts = token.split('.')
      if (parts.length !== 3) return false

      const decoded = JSON.parse(atob(parts[1]))
      const now = Math.floor(Date.now() / 1000)

      // Check expiration
      return decoded.exp > now
    } catch {
      return false
    }
  }
}

/**
 * Authorization Guard
 * Checks if user has required permissions
 */
export const AuthorizationGuard = {
  /**
   * Check route access
   * @param {Object} to - Route destination
   * @returns {Object} { allowed: boolean, redirectPath?: string }
   */
  checkRouteAccess(to) {
    const user = AuthenticationGuard.getCurrentUser()

    // Route protection configuration
    const routeProtection = {
      '/admin': {
        minRole: ROLES.ADMIN,
        requiredPermissions: []
      },
      '/admin/dashboard': {
        minRole: ROLES.ADMIN,
        requiredPermissions: [ACTIONS.VIEW_DASHBOARD]
      },
      '/admin/users': {
        minRole: ROLES.ADMIN,
        requiredPermissions: [ACTIONS.VIEW_USERS]
      },
      '/admin/content': {
        minRole: ROLES.ADMIN,
        requiredPermissions: [ACTIONS.VIEW_CONTENT]
      },
      '/admin/notifications': {
        minRole: ROLES.ADMIN,
        requiredPermissions: [ACTIONS.VIEW_NOTIFICATIONS]
      }
    }

    const protection = routeProtection[to.path]

    if (!protection) {
      // Public route
      return { allowed: true }
    }

    // Check if user exists
    if (!user) {
      return { allowed: false, redirectPath: '/login' }
    }

    // Check role
    const hasRequiredRole = this._hasRole(user.role, protection.minRole)
    if (!hasRequiredRole) {
      return { allowed: false, redirectPath: '/forbidden' }
    }

    // Check permissions
    if (protection.requiredPermissions.length > 0) {
      const hasPermissions = protection.requiredPermissions.every((perm) =>
        PermissionControl.hasPermission(perm)
      )

      if (!hasPermissions) {
        return { allowed: false, redirectPath: '/forbidden' }
      }
    }

    return { allowed: true }
  },

  /**
   * Check if user has required role
   * @private
   */
  _hasRole(userRole, requiredRole) {
    const roleHierarchy = {
      [ROLES.ADMIN]: 3,
      [ROLES.VIP]: 2,
      [ROLES.USER]: 1
    }

    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    return userLevel >= requiredLevel
  }
}

/**
 * Vue Router Guard Setup
 * Call this to set up all route guards
 */
export const setupRouteGuards = (router) => {
  router.beforeEach(async (to, from, next) => {
    console.log(`🛣️ Navigating to: ${to.path}`)

    // 1. Check if route requires authentication
    const requiresAuth = to.meta?.requiresAuth !== false

    if (requiresAuth) {
      // Check authentication
      if (!AuthenticationGuard.isAuthenticated()) {
        console.warn('⚠️ Not authenticated')
        return next('/login')
      }

      // Check token validity
      if (!AuthenticationGuard.isTokenValid()) {
        console.warn('⚠️ Token expired')
        localStorage.removeItem('authToken')
        return next('/login')
      }

      // Initialize permission system with current user
      const user = AuthenticationGuard.getCurrentUser()
      PermissionControl.init(user)

      // 2. Check authorization
      const access = AuthorizationGuard.checkRouteAccess(to)

      if (!access.allowed) {
        console.warn(`❌ Access denied to: ${to.path}`)
        return next(access.redirectPath || '/forbidden')
      }
    }

    // 3. Route guard specific logic
    if (to.meta?.guards) {
      for (const guard of to.meta.guards) {
        const result = await guard(to, from)
        if (result !== true) {
          return next(result)
        }
      }
    }

    console.log(`✅ Access allowed: ${to.path}`)
    next()
  })

  router.afterEach((to, from) => {
    console.log(`✔️ Navigated from ${from.path} to ${to.path}`)
  })
}

/**
 * Custom Route Guards (composable function for Vue components)
 */
export const useRouteGuard = () => {
  return {
    /**
     * Check if current user can access route
     * @param {string} routePath - Route path
     * @returns {boolean}
     */
    canAccess(routePath) {
      return AuthorizationGuard.checkRouteAccess({ path: routePath }).allowed
    },

    /**
     * Check if user has permission
     * @param {string|string[]} action - Action(s) to check
     * @returns {boolean}
     */
    hasPermission(action) {
      if (Array.isArray(action)) {
        return PermissionControl.hasAllPermissions(action)
      }
      return PermissionControl.hasPermission(action)
    },

    /**
     * Check if user has any of the permissions
     * @param {string[]} actions - Actions to check
     * @returns {boolean}
     */
    hasAnyPermission(actions) {
      return PermissionControl.hasAnyPermission(actions)
    },

    /**
     * Get current user role
     * @returns {string}
     */
    getRole() {
      return PermissionControl.getRole()
    },

    /**
     * Check if user is admin
     * @returns {boolean}
     */
    isAdmin() {
      return PermissionControl.isAdmin()
    },

    /**
     * Get all user permissions
     * @returns {string[]}
     */
    getPermissions() {
      return PermissionControl.getPermissions()
    }
  }
}

/**
 * Route Metadata Configuration
 * Add this to your router configuration
 */
export const ADMIN_ROUTES_META = {
  dashboard: {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    meta: {
      requiresAuth: true,
      title: '管理员仪表板',
      icon: 'Dashboard'
    }
  },

  users: {
    path: '/admin/users',
    name: 'AdminUsers',
    meta: {
      requiresAuth: true,
      title: '用户管理',
      icon: 'User'
    }
  },

  content: {
    path: '/admin/content',
    name: 'AdminContent',
    meta: {
      requiresAuth: true,
      title: '内容审核',
      icon: 'DocumentCopy'
    }
  },

  notifications: {
    path: '/admin/notifications',
    name: 'AdminNotifications',
    meta: {
      requiresAuth: true,
      title: '通知中心',
      icon: 'Bell'
    }
  }
}

/**
 * Example Route Configuration
 */
export const EXAMPLE_ADMIN_ROUTES = [
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: {
          title: '管理员仪表板',
          requiresAuth: true
        }
      },
      {
        path: 'users',
        component: () => import('@/views/admin/Users.vue'),
        meta: {
          title: '用户管理',
          requiresAuth: true
        }
      },
      {
        path: 'content',
        component: () => import('@/views/admin/Content.vue'),
        meta: {
          title: '内容审核',
          requiresAuth: true
        }
      },
      {
        path: 'notifications',
        component: () => import('@/views/admin/Notifications.vue'),
        meta: {
          title: '通知中心',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/forbidden',
    component: () => import('@/views/errors/Forbidden.vue'),
    meta: { requiresAuth: false }
  }
]

export default {
  AuthenticationGuard,
  AuthorizationGuard,
  setupRouteGuards,
  useRouteGuard,
  ADMIN_ROUTES_META,
  EXAMPLE_ADMIN_ROUTES
}
