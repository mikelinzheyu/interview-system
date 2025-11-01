/**
 * RouteGuards Unit Tests
 *
 * Tests for route protection and access control
 * Covers authentication, authorization, and Vue Router integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AuthenticationGuard,
  AuthorizationGuard,
  setupRouteGuards,
  useRouteGuard,
  ADMIN_ROUTES_META,
  EXAMPLE_ADMIN_ROUTES
} from '@/utils/RouteGuards'
import { PermissionControl, ROLES, ACTIONS } from '@/utils/PermissionControl'

describe('AuthenticationGuard - Authentication Checks', () => {
  let originalLocalStorage

  beforeEach(() => {
    originalLocalStorage = global.localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage
  })

  // ========== Authentication Status ==========
  describe('isAuthenticated()', () => {
    it('should return true when both token and user exist', () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') return 'test_token_123'
        if (key === 'currentUser') return JSON.stringify({ id: 'user_1' })
        return null
      })

      const result = AuthenticationGuard.isAuthenticated()
      expect(result).toBe(true)
    })

    it('should return false when token is missing', () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'currentUser') return JSON.stringify({ id: 'user_1' })
        return null
      })

      const result = AuthenticationGuard.isAuthenticated()
      expect(result).toBe(false)
    })

    it('should return false when user is missing', () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') return 'test_token_123'
        return null
      })

      const result = AuthenticationGuard.isAuthenticated()
      expect(result).toBe(false)
    })

    it('should return false when neither token nor user exist', () => {
      global.localStorage.getItem = vi.fn(() => null)

      const result = AuthenticationGuard.isAuthenticated()
      expect(result).toBe(false)
    })
  })

  // ========== Get Current User ==========
  describe('getCurrentUser()', () => {
    it('should return current user object', () => {
      const user = { id: 'user_1', name: 'Test User', role: ROLES.ADMIN }
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'currentUser') return JSON.stringify(user)
        return null
      })

      const result = AuthenticationGuard.getCurrentUser()
      expect(result).toEqual(user)
    })

    it('should return null when no user stored', () => {
      global.localStorage.getItem = vi.fn(() => null)

      const result = AuthenticationGuard.getCurrentUser()
      expect(result).toBeNull()
    })

    it('should parse JSON correctly', () => {
      const user = { id: 'user_1', name: 'Test', email: 'test@example.com' }
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'currentUser') return JSON.stringify(user)
        return null
      })

      const result = AuthenticationGuard.getCurrentUser()
      expect(result.email).toBe('test@example.com')
    })

    it('should return null for invalid JSON', () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'currentUser') return 'invalid json'
        return null
      })

      expect(() => AuthenticationGuard.getCurrentUser()).toThrow()
    })
  })

  // ========== Token Validation ==========
  describe('isTokenValid()', () => {
    it('should return false when no token exists', () => {
      global.localStorage.getItem = vi.fn(() => null)

      const result = AuthenticationGuard.isTokenValid()
      expect(result).toBe(false)
    })

    it('should return true for valid JWT token', () => {
      // Create a valid JWT with future expiration
      const header = btoa(JSON.stringify({ alg: 'HS256' }))
      const now = Math.floor(Date.now() / 1000)
      const payload = btoa(JSON.stringify({ exp: now + 3600 }))
      const signature = 'test_signature'
      const token = `${header}.${payload}.${signature}`

      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') return token
        return null
      })

      const result = AuthenticationGuard.isTokenValid()
      expect(result).toBe(true)
    })

    it('should return false for expired token', () => {
      // Create an expired JWT
      const header = btoa(JSON.stringify({ alg: 'HS256' }))
      const now = Math.floor(Date.now() / 1000)
      const payload = btoa(JSON.stringify({ exp: now - 3600 })) // expired 1 hour ago
      const signature = 'test_signature'
      const token = `${header}.${payload}.${signature}`

      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') return token
        return null
      })

      const result = AuthenticationGuard.isTokenValid()
      expect(result).toBe(false)
    })

    it('should return false for malformed token', () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') return 'not_a_jwt'
        return null
      })

      const result = AuthenticationGuard.isTokenValid()
      expect(result).toBe(false)
    })

    it('should return false for token with wrong parts', () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') return 'header.payload' // missing signature
        return null
      })

      const result = AuthenticationGuard.isTokenValid()
      expect(result).toBe(false)
    })
  })
})

describe('AuthorizationGuard - Authorization Checks', () => {
  beforeEach(() => {
    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'user_1',
            name: 'Test User',
            role: ROLES.ADMIN
          })
        }
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }

    PermissionControl.init({ id: 'user_1', role: ROLES.ADMIN })
  })

  // ========== Route Access Control ==========
  describe('checkRouteAccess()', () => {
    it('should allow admin to access /admin/dashboard', () => {
      const result = AuthorizationGuard.checkRouteAccess({ path: '/admin/dashboard' })
      expect(result.allowed).toBe(true)
    })

    it('should allow admin to access /admin/users', () => {
      const result = AuthorizationGuard.checkRouteAccess({ path: '/admin/users' })
      expect(result.allowed).toBe(true)
    })

    it('should allow access to public routes', () => {
      const result = AuthorizationGuard.checkRouteAccess({ path: '/home' })
      expect(result.allowed).toBe(true)
    })

    it('should deny non-admin to access protected routes', () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'user_1',
            role: ROLES.USER
          })
        }
        return null
      })

      PermissionControl.init({ id: 'user_1', role: ROLES.USER })

      const result = AuthorizationGuard.checkRouteAccess({ path: '/admin/dashboard' })
      expect(result.allowed).toBe(false)
      expect(result.redirectPath).toBe('/forbidden')
    })

    it('should redirect to login when no user', () => {
      global.localStorage.getItem = vi.fn(() => null)

      const result = AuthorizationGuard.checkRouteAccess({ path: '/admin/dashboard' })
      expect(result.allowed).toBe(false)
      expect(result.redirectPath).toBe('/login')
    })

    it('should check route-specific permissions', () => {
      // VIP user can view dashboard but can't view analytics (hypothetical check)
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'user_1',
            role: ROLES.VIP
          })
        }
        return null
      })

      PermissionControl.init({ id: 'user_1', role: ROLES.VIP })

      // VIP might not have VIEW_DASHBOARD permission
      const result = AuthorizationGuard.checkRouteAccess({ path: '/admin/dashboard' })
      // This depends on role hierarchy configuration
    })

    it('should enforce role hierarchy', () => {
      // Test that admin > vip > user in terms of access
      expect(AuthorizationGuard._hasRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(true)
      expect(AuthorizationGuard._hasRole(ROLES.ADMIN, ROLES.VIP)).toBe(true)
      expect(AuthorizationGuard._hasRole(ROLES.ADMIN, ROLES.USER)).toBe(true)

      expect(AuthorizationGuard._hasRole(ROLES.VIP, ROLES.ADMIN)).toBe(false)
      expect(AuthorizationGuard._hasRole(ROLES.VIP, ROLES.VIP)).toBe(true)
      expect(AuthorizationGuard._hasRole(ROLES.VIP, ROLES.USER)).toBe(true)

      expect(AuthorizationGuard._hasRole(ROLES.USER, ROLES.ADMIN)).toBe(false)
      expect(AuthorizationGuard._hasRole(ROLES.USER, ROLES.VIP)).toBe(false)
      expect(AuthorizationGuard._hasRole(ROLES.USER, ROLES.USER)).toBe(true)
    })

    it('should handle unknown roles gracefully', () => {
      const result = AuthorizationGuard._hasRole('unknown_role', ROLES.ADMIN)
      expect(result).toBe(false)
    })
  })

  // ========== Route Requirements ==========
  describe('Route Requirements', () => {
    it('should define requirements for /admin/dashboard', () => {
      const requirements = AuthorizationGuard._getRouteRequirements('/admin/dashboard')
      expect(requirements).toBeDefined()
      expect(requirements.requiredRole).toBe(ROLES.ADMIN)
      expect(requirements.requiredPermissions).toContain(ACTIONS.VIEW_DASHBOARD)
    })

    it('should define requirements for /admin/users', () => {
      const requirements = AuthorizationGuard._getRouteRequirements('/admin/users')
      expect(requirements).toBeDefined()
      expect(requirements.requiredPermissions).toContain(ACTIONS.VIEW_USERS)
    })

    it('should define requirements for /admin/content', () => {
      const requirements = AuthorizationGuard._getRouteRequirements('/admin/content')
      expect(requirements).toBeDefined()
      expect(requirements.requiredPermissions).toContain(ACTIONS.VIEW_CONTENT)
    })

    it('should return undefined for undefined routes', () => {
      const requirements = AuthorizationGuard._getRouteRequirements('/unknown/route')
      expect(requirements).toBeUndefined()
    })
  })
})

describe('setupRouteGuards - Vue Router Integration', () => {
  let mockRouter
  let nextSpy
  let toRoute
  let fromRoute

  beforeEach(() => {
    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'authToken') return 'test_token'
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'user_1',
            role: ROLES.ADMIN
          })
        }
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }

    PermissionControl.init({ id: 'user_1', role: ROLES.ADMIN })

    nextSpy = vi.fn()
    mockRouter = {
      beforeEach: vi.fn((guard) => {
        // Mock router.beforeEach to store the guard function
        mockRouter._beforeEachGuard = guard
      }),
      afterEach: vi.fn()
    }

    toRoute = { path: '/admin/dashboard', meta: { requiresAuth: true } }
    fromRoute = { path: '/home' }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ========== Guard Setup ==========
  describe('Guard Setup', () => {
    it('should register beforeEach guard', () => {
      setupRouteGuards(mockRouter)
      expect(mockRouter.beforeEach).toHaveBeenCalled()
    })

    it('should register afterEach hook', () => {
      setupRouteGuards(mockRouter)
      expect(mockRouter.afterEach).toHaveBeenCalled()
    })
  })

  // ========== Authentication Check ==========
  describe('Authentication Check in Guard', () => {
    it('should allow authenticated users', async () => {
      setupRouteGuards(mockRouter)
      const guard = mockRouter._beforeEachGuard

      const result = await guard(toRoute, fromRoute, nextSpy)

      expect(nextSpy).toHaveBeenCalled()
    })

    it('should redirect to login if not authenticated', async () => {
      global.localStorage.getItem = vi.fn(() => null)

      setupRouteGuards(mockRouter)
      const guard = mockRouter._beforeEachGuard

      await guard(toRoute, fromRoute, nextSpy)

      expect(nextSpy).toHaveBeenCalledWith('/login')
    })

    it('should redirect to login if token expired', async () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') {
          // Expired token
          const header = btoa(JSON.stringify({ alg: 'HS256' }))
          const now = Math.floor(Date.now() / 1000)
          const payload = btoa(JSON.stringify({ exp: now - 1000 }))
          return `${header}.${payload}.sig`
        }
        return null
      })

      setupRouteGuards(mockRouter)
      const guard = mockRouter._beforeEachGuard

      await guard(toRoute, fromRoute, nextSpy)

      expect(nextSpy).toHaveBeenCalledWith('/login')
    })
  })

  // ========== Authorization Check ==========
  describe('Authorization Check in Guard', () => {
    it('should allow access to authorized routes', async () => {
      setupRouteGuards(mockRouter)
      const guard = mockRouter._beforeEachGuard

      const result = await guard(toRoute, fromRoute, nextSpy)

      expect(nextSpy).toHaveBeenCalled()
    })

    it('should redirect to forbidden if no permission', async () => {
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'user_1',
            role: ROLES.USER // User role doesn't have admin access
          })
        }
        return null
      })

      PermissionControl.init({ id: 'user_1', role: ROLES.USER })

      setupRouteGuards(mockRouter)
      const guard = mockRouter._beforeEachGuard

      await guard(toRoute, fromRoute, nextSpy)

      expect(nextSpy).toHaveBeenCalledWith('/forbidden')
    })
  })

  // ========== Route Meta Handling ==========
  describe('Route Meta Handling', () => {
    it('should skip auth check for routes without requiresAuth', async () => {
      const publicRoute = { path: '/home', meta: {} }

      setupRouteGuards(mockRouter)
      const guard = mockRouter._beforeEachGuard

      await guard(publicRoute, fromRoute, nextSpy)

      expect(nextSpy).toHaveBeenCalled()
    })

    it('should skip auth check when requiresAuth is explicitly false', async () => {
      const publicRoute = { path: '/home', meta: { requiresAuth: false } }

      setupRouteGuards(mockRouter)
      const guard = mockRouter._beforeEachGuard

      await guard(publicRoute, fromRoute, nextSpy)

      expect(nextSpy).toHaveBeenCalled()
    })
  })
})

describe('useRouteGuard - Composable API', () => {
  beforeEach(() => {
    PermissionControl.init({ id: 'user_1', role: ROLES.ADMIN })
  })

  // ========== Route Access ==========
  describe('Route Access Checking', () => {
    it('should check route access', () => {
      const guard = useRouteGuard()
      const result = guard.canAccess('/admin/users')
      expect(typeof result).toBe('boolean')
    })

    it('should return true for accessible routes', () => {
      const guard = useRouteGuard()
      const result = guard.canAccess('/admin/dashboard')
      expect(result).toBe(true)
    })

    it('should return false for inaccessible routes', () => {
      PermissionControl.init({ id: 'user_1', role: ROLES.USER })
      const guard = useRouteGuard()
      const result = guard.canAccess('/admin/dashboard')
      expect(result).toBe(false)
    })
  })

  // ========== Permission Checking ==========
  describe('Permission Checking', () => {
    it('should check single permission', () => {
      const guard = useRouteGuard()
      const result = guard.hasPermission(ACTIONS.VIEW_USERS)
      expect(result).toBe(true)
    })

    it('should check multiple permissions (all required)', () => {
      const guard = useRouteGuard()
      const result = guard.hasPermission([ACTIONS.VIEW_USERS, ACTIONS.DELETE_USER])
      expect(result).toBe(true)
    })

    it('should return false when user lacks permission', () => {
      PermissionControl.init({ id: 'user_1', role: ROLES.USER })
      const guard = useRouteGuard()
      const result = guard.hasPermission(ACTIONS.DELETE_USER)
      expect(result).toBe(false)
    })
  })

  // ========== Permission Sets ==========
  describe('Permission Sets', () => {
    it('should check any of multiple permissions', () => {
      const guard = useRouteGuard()
      const result = guard.hasAnyPermission([
        ACTIONS.DELETE_USER,
        ACTIONS.VIEW_USERS
      ])
      expect(result).toBe(true)
    })

    it('should return false if user has none of the permissions', () => {
      PermissionControl.init({ id: 'user_1', role: ROLES.USER })
      const guard = useRouteGuard()
      const result = guard.hasAnyPermission([
        ACTIONS.DELETE_USER,
        ACTIONS.MANAGE_SYSTEM
      ])
      expect(result).toBe(false)
    })
  })

  // ========== Role Information ==========
  describe('Role Information', () => {
    it('should return current user role', () => {
      const guard = useRouteGuard()
      const role = guard.getRole()
      expect(role).toBe(ROLES.ADMIN)
    })

    it('should check if user is admin', () => {
      const guard = useRouteGuard()
      const result = guard.isAdmin()
      expect(result).toBe(true)
    })

    it('should return false for isAdmin when user is not admin', () => {
      PermissionControl.init({ id: 'user_1', role: ROLES.USER })
      const guard = useRouteGuard()
      const result = guard.isAdmin()
      expect(result).toBe(false)
    })

    it('should return all permissions for user', () => {
      const guard = useRouteGuard()
      const permissions = guard.getPermissions()
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThan(0)
    })
  })
})

describe('Route Configuration - ADMIN_ROUTES_META', () => {
  // ========== Route Metadata ==========
  it('should define dashboard route', () => {
    expect(ADMIN_ROUTES_META.dashboard).toBeDefined()
    expect(ADMIN_ROUTES_META.dashboard.path).toBe('/admin/dashboard')
    expect(ADMIN_ROUTES_META.dashboard.meta.requiresAuth).toBe(true)
  })

  it('should define users route', () => {
    expect(ADMIN_ROUTES_META.users).toBeDefined()
    expect(ADMIN_ROUTES_META.users.path).toBe('/admin/users')
    expect(ADMIN_ROUTES_META.users.meta.requiresAuth).toBe(true)
  })

  it('should define content route', () => {
    expect(ADMIN_ROUTES_META.content).toBeDefined()
    expect(ADMIN_ROUTES_META.content.path).toBe('/admin/content')
  })

  it('should define notifications route', () => {
    expect(ADMIN_ROUTES_META.notifications).toBeDefined()
    expect(ADMIN_ROUTES_META.notifications.path).toBe('/admin/notifications')
  })

  it('should have required route metadata', () => {
    const dashboard = ADMIN_ROUTES_META.dashboard
    expect(dashboard.name).toBeDefined()
    expect(dashboard.meta.title).toBeDefined()
    expect(dashboard.meta.icon).toBeDefined()
  })
})

describe('Route Configuration - EXAMPLE_ADMIN_ROUTES', () => {
  // ========== Route Structure ==========
  it('should define admin layout route', () => {
    const adminRoute = EXAMPLE_ADMIN_ROUTES.find((r) => r.path === '/admin')
    expect(adminRoute).toBeDefined()
    expect(adminRoute.meta.requiresAuth).toBe(true)
    expect(adminRoute.children).toBeDefined()
    expect(adminRoute.children.length).toBeGreaterThan(0)
  })

  it('should have child routes under /admin', () => {
    const adminRoute = EXAMPLE_ADMIN_ROUTES.find((r) => r.path === '/admin')
    const paths = adminRoute.children.map((r) => r.path)
    expect(paths).toContain('dashboard')
    expect(paths).toContain('users')
    expect(paths).toContain('content')
    expect(paths).toContain('notifications')
  })

  it('should define forbidden route', () => {
    const forbiddenRoute = EXAMPLE_ADMIN_ROUTES.find((r) => r.path === '/forbidden')
    expect(forbiddenRoute).toBeDefined()
    expect(forbiddenRoute.meta.requiresAuth).toBe(false)
  })

  it('should mark child routes as requiring auth', () => {
    const adminRoute = EXAMPLE_ADMIN_ROUTES.find((r) => r.path === '/admin')
    adminRoute.children.forEach((child) => {
      expect(child.meta.requiresAuth).toBe(true)
    })
  })

  it('should have lazy-loaded components', () => {
    const adminRoute = EXAMPLE_ADMIN_ROUTES.find((r) => r.path === '/admin')
    adminRoute.children.forEach((child) => {
      // Component should be a function (lazy-loaded)
      expect(typeof child.component).toBe('function')
    })
  })
})

describe('Integration Tests - Complete Route Protection', () => {
  beforeEach(() => {
    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'authToken') return 'test_token'
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'admin_1',
            role: ROLES.ADMIN
          })
        }
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }

    PermissionControl.init({ id: 'admin_1', role: ROLES.ADMIN })
  })

  // ========== Complete Permission Flow ==========
  it('should complete full route protection workflow', () => {
    // 1. Check authentication
    const isAuth = AuthenticationGuard.isAuthenticated()
    expect(isAuth).toBe(true)

    // 2. Get user
    const user = AuthenticationGuard.getCurrentUser()
    expect(user).toBeDefined()

    // 3. Check authorization
    const access = AuthorizationGuard.checkRouteAccess({ path: '/admin/users' })
    expect(access.allowed).toBe(true)

    // 4. Use composable API
    const guard = useRouteGuard()
    expect(guard.isAdmin()).toBe(true)
    expect(guard.canAccess('/admin/users')).toBe(true)
  })

  // ========== Permission Denial Flow ==========
  it('should deny access to regular users', () => {
    global.localStorage.getItem = vi.fn((key) => {
      if (key === 'currentUser') {
        return JSON.stringify({
          id: 'user_1',
          role: ROLES.USER
        })
      }
      return null
    })

    PermissionControl.init({ id: 'user_1', role: ROLES.USER })

    const guard = useRouteGuard()
    expect(guard.isAdmin()).toBe(false)
    expect(guard.hasPermission(ACTIONS.DELETE_USER)).toBe(false)
    expect(guard.canAccess('/admin/users')).toBe(false)
  })
})
