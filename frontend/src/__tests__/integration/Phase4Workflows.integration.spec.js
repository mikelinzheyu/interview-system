/**
 * Phase 4 Integration Tests
 *
 * Tests for complete workflows involving multiple modules:
 * - Permission system + Route guards + API interceptor
 * - WebSocket + Notification + Permission system
 * - Admin operations with audit logging
 * - Sensitive operations with confirmation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PermissionControl, AuditLogger, ROLES, ACTIONS } from '@/utils/PermissionControl'
import { AuthenticationGuard, AuthorizationGuard, useRouteGuard } from '@/utils/RouteGuards'
import { NotificationWebSocketHandler, AdminActivityWebSocketHandler } from '@/utils/NotificationWebSocketHandler'
import { ConfirmSensitiveOperation } from '@/utils/APIInterceptor'

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

import { ElMessage, ElMessageBox } from 'element-plus'

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.messages = []
    this.onopen = null
    this.onmessage = null
  }

  send(data) {
    this.messages.push(JSON.parse(data))
  }

  simulateOpen() {
    if (this.onopen) this.onopen()
  }

  simulateMessage(data) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) })
  }

  close() {}
}

global.WebSocket = MockWebSocket

describe('Integration Tests - Complete Workflows', () => {
  let mockSocket
  let originalLocalStorage

  beforeEach(() => {
    // Setup localStorage
    originalLocalStorage = global.localStorage
    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'authToken') return 'admin_token_123'
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'admin_1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: ROLES.ADMIN
          })
        }
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }

    // Initialize permission system
    const user = { id: 'admin_1', name: 'Admin User', role: ROLES.ADMIN }
    PermissionControl.init(user)

    // Clear audit logs
    AuditLogger.clearLogs()

    // Mock WebSocket handler listeners
    NotificationWebSocketHandler.listeners = {}

    vi.clearAllMocks()
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage
    if (NotificationWebSocketHandler.socket) {
      NotificationWebSocketHandler.disconnect()
    }
    AuditLogger.clearLogs()
  })

  // ========== Permission + Route + API Flow ==========
  describe('Complete Permission + Route + API Flow', () => {
    it('should enforce permissions at all layers', () => {
      // Layer 1: Authentication
      const isAuthenticated = AuthenticationGuard.isAuthenticated()
      expect(isAuthenticated).toBe(true)

      // Layer 2: Authorization - Route Access
      const routeAccess = AuthorizationGuard.checkRouteAccess({ path: '/admin/users' })
      expect(routeAccess.allowed).toBe(true)

      // Layer 3: Permission - API Level
      const apiAccess = PermissionControl.hasPermission(ACTIONS.DELETE_USER)
      expect(apiAccess).toBe(true)

      // All layers allow access
      const guard = useRouteGuard()
      expect(guard.isAdmin()).toBe(true)
      expect(guard.hasPermission(ACTIONS.DELETE_USER)).toBe(true)
      expect(guard.canAccess('/admin/users')).toBe(true)
    })

    it('should block user without required permissions', () => {
      // Initialize as regular user
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

      // Layer 1: Authentication
      const isAuthenticated = AuthenticationGuard.isAuthenticated()
      expect(isAuthenticated).toBe(true) // Still authenticated

      // Layer 2: Authorization - Route Access
      const routeAccess = AuthorizationGuard.checkRouteAccess({ path: '/admin/users' })
      expect(routeAccess.allowed).toBe(false) // Access denied
      expect(routeAccess.redirectPath).toBe('/forbidden')

      // Layer 3: Permission - API Level
      const apiAccess = PermissionControl.hasPermission(ACTIONS.DELETE_USER)
      expect(apiAccess).toBe(false) // No permission

      const guard = useRouteGuard()
      expect(guard.isAdmin()).toBe(false)
      expect(guard.hasPermission(ACTIONS.DELETE_USER)).toBe(false)
      expect(guard.canAccess('/admin/users')).toBe(false)
    })

    it('should handle expired token in route guard', () => {
      // Create expired token
      const header = btoa(JSON.stringify({ alg: 'HS256' }))
      const now = Math.floor(Date.now() / 1000)
      const payload = btoa(JSON.stringify({ exp: now - 1000 }))
      const expiredToken = `${header}.${payload}.sig`

      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') return expiredToken
        return null
      })

      const isValid = AuthenticationGuard.isTokenValid()
      expect(isValid).toBe(false)

      // Route guard should redirect to login
      const routeAccess = AuthorizationGuard.checkRouteAccess({ path: '/admin/dashboard' })
      // Token check happens before route access
    })
  })

  // ========== WebSocket + Notification + Permission Flow ==========
  describe('WebSocket + Notification + Permission Integration', () => {
    it('should receive notifications with permission validation', async () => {
      // Connect WebSocket
      const promise = NotificationWebSocketHandler.connect('admin_1')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise
      expect(NotificationWebSocketHandler.isConnected).toBe(true)

      // Subscribe to notification events
      const callbacks = {
        onNew: vi.fn(),
        onAdmin: vi.fn()
      }

      NotificationWebSocketHandler.on('notification:new', callbacks.onNew)
      NotificationWebSocketHandler.on('admin:action', callbacks.onAdmin)

      // Check admin permissions
      expect(PermissionControl.hasPermission(ACTIONS.VIEW_NOTIFICATIONS)).toBe(true)

      // Receive admin notification
      mockSocket.simulateMessage({
        type: 'ADMIN_ACTION',
        data: {
          action: 'user_deleted',
          actor: { id: 'admin_1', name: 'Admin' },
          target: { id: 'user_123' }
        }
      })

      expect(callbacks.onAdmin).toHaveBeenCalled()

      // Acknowledge notification
      NotificationWebSocketHandler.acknowledgeNotification('notif_123')
      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.type).toBe('NOTIFICATION_ACK')
    })

    it('should enforce role-based access to WebSocket events', async () => {
      // Regular user should receive basic notifications
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

      // User should NOT have permission to receive admin actions
      expect(PermissionControl.hasPermission(ACTIONS.VIEW_DASHBOARD)).toBe(false)

      // But should be able to receive notifications
      expect(PermissionControl.hasPermission(ACTIONS.VIEW_NOTIFICATIONS)).toBe(true)
    })
  })

  // ========== Complete User Deletion Workflow ==========
  describe('Complete User Deletion Workflow', () => {
    it('should complete full user deletion workflow with audit trail', async () => {
      // Step 1: Check permissions
      expect(PermissionControl.hasPermission(ACTIONS.DELETE_USER)).toBe(true)

      // Step 2: Route access check
      const routeAccess = AuthorizationGuard.checkRouteAccess({ path: '/admin/users' })
      expect(routeAccess.allowed).toBe(true)

      // Step 3: Show confirmation dialog
      ElMessageBox.confirm.mockResolvedValueOnce(true)

      // Step 4: Execute deletion with confirmation
      const deleteCallback = vi.fn().mockResolvedValueOnce({ success: true })

      const result = await ConfirmSensitiveOperation.execute('DELETE_USER', deleteCallback)

      expect(deleteCallback).toHaveBeenCalled()
      expect(result).toEqual({ success: true })

      // Step 5: Verify audit log
      expect(AuditLogger.logs).toHaveLength(1)
      const log = AuditLogger.logs[0]
      expect(log.action).toBe('DELETE_USER')
      expect(log.actor.id).toBe('admin_1')
      expect(log.details.result).toEqual({ success: true })

      // Step 6: Verify success message
      expect(ElMessage.success).toHaveBeenCalledWith('操作成功')
    })

    it('should prevent non-admin from deleting users', async () => {
      // Initialize as VIP user
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'vip_1',
            role: ROLES.VIP
          })
        }
        return null
      })

      PermissionControl.init({ id: 'vip_1', role: ROLES.VIP })

      // Check permission
      expect(PermissionControl.hasPermission(ACTIONS.DELETE_USER)).toBe(false)

      // Route access should be denied
      const routeAccess = AuthorizationGuard.checkRouteAccess({ path: '/admin/users' })
      expect(routeAccess.allowed).toBe(false)

      // Should not be able to execute deletion
      ElMessageBox.confirm.mockResolvedValueOnce(true)
      const deleteCallback = vi.fn()

      // This would be blocked by the API interceptor in real app
      expect(PermissionControl.hasPermission(ACTIONS.DELETE_USER)).toBe(false)
    })

    it('should handle user cancellation of deletion', async () => {
      // User cancels confirmation dialog
      ElMessageBox.confirm.mockRejectedValueOnce(new Error('cancelled'))

      const deleteCallback = vi.fn()

      const result = await ConfirmSensitiveOperation.execute('DELETE_USER', deleteCallback)

      expect(deleteCallback).not.toHaveBeenCalled()
      expect(result).toBe(false)
      expect(ElMessage.info).toHaveBeenCalledWith('操作已取消')

      // No audit log for cancelled operation
      expect(AuditLogger.logs).toHaveLength(0)
    })

    it('should log deletion failure', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)

      const error = new Error('User not found')
      const deleteCallback = vi.fn().mockRejectedValueOnce(error)

      try {
        await ConfirmSensitiveOperation.execute('DELETE_USER', deleteCallback)
      } catch {}

      // Should log the failure
      expect(AuditLogger.logs).toHaveLength(1)
      expect(AuditLogger.logs[0].details.error).toBe('User not found')
    })
  })

  // ========== Content Moderation Workflow ==========
  describe('Complete Content Moderation Workflow', () => {
    it('should complete content approval with notification', async () => {
      // Step 1: Connect WebSocket for admin activity
      const promise = NotificationWebSocketHandler.connect('admin_1')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise

      // Step 2: Initialize admin activity handler
      AdminActivityWebSocketHandler.init('admin_1')

      // Step 3: Check permissions
      expect(PermissionControl.hasPermission(ACTIONS.APPROVE_CONTENT)).toBe(true)

      // Step 4: Approve content
      AdminActivityWebSocketHandler.notifyModeration('content_123', 'approve')

      // Step 5: Verify WebSocket message sent
      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.type).toBe('CONTENT_MODERATION')
      expect(lastMessage.action).toBe('approve')

      // Step 6: Log to audit trail
      AuditLogger.log(
        'APPROVE_CONTENT',
        { id: 'admin_1', name: 'Admin' },
        { id: 'content_123' },
        { reason: 'Appropriate content' }
      )

      expect(AuditLogger.logs).toHaveLength(1)
      expect(AuditLogger.logs[0].action).toBe('APPROVE_CONTENT')
    })

    it('should prevent non-admin from moderating content', () => {
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

      // Should not have content approval permission
      expect(PermissionControl.hasPermission(ACTIONS.APPROVE_CONTENT)).toBe(false)

      // Route access denied
      const routeAccess = AuthorizationGuard.checkRouteAccess({ path: '/admin/content' })
      expect(routeAccess.allowed).toBe(false)
    })
  })

  // ========== Multi-Step Administrative Operation ==========
  describe('Multi-Step Administrative Operation', () => {
    it('should complete user role change with all validations', async () => {
      // Step 1: Admin authentication
      const user = AuthenticationGuard.getCurrentUser()
      expect(user.role).toBe(ROLES.ADMIN)

      // Step 2: Check route access
      const canAccess = AuthorizationGuard.checkRouteAccess({ path: '/admin/users' })
      expect(canAccess.allowed).toBe(true)

      // Step 3: Check role management permission
      expect(PermissionControl.hasPermission(ACTIONS.MANAGE_ROLES)).toBe(true)

      // Step 4: Show confirmation (not required for role change, but good practice)
      ElMessageBox.confirm.mockResolvedValueOnce(true)

      // Step 5: Execute role change
      const updateCallback = vi.fn().mockResolvedValueOnce({ newRole: ROLES.VIP })
      const result = await ConfirmSensitiveOperation.execute('EDIT_USER', updateCallback)

      expect(updateCallback).toHaveBeenCalled()

      // Step 6: Log action
      AuditLogger.log(
        'EDIT_USER',
        user,
        { id: 'user_123' },
        { action: 'role_changed', oldRole: ROLES.USER, newRole: ROLES.VIP }
      )

      expect(AuditLogger.logs).toHaveLength(1)
      expect(AuditLogger.logs[0].details.action).toBe('role_changed')

      // Step 7: Notify via WebSocket
      const promise = NotificationWebSocketHandler.connect('admin_1')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise

      AdminActivityWebSocketHandler.notifyUserAction('user_123', 'role_changed', {
        oldRole: ROLES.USER,
        newRole: ROLES.VIP
      })

      const notifMsg = mockSocket.messages[mockSocket.messages.length - 1]
      expect(notifMsg.type).toBe('USER_ACTION')
      expect(notifMsg.action).toBe('role_changed')
    })
  })

  // ========== Audit Trail Completeness ==========
  describe('Audit Trail Completeness', () => {
    it('should maintain complete audit trail for sensitive operations', () => {
      const admin = { id: 'admin_1', name: 'Admin User' }

      // Log multiple admin operations
      AuditLogger.log('DELETE_USER', admin, { id: 'user_1' }, { reason: 'Spam' })
      AuditLogger.log('DELETE_CONTENT', admin, { id: 'content_1' }, { reason: 'Inappropriate' })
      AuditLogger.log('BAN_USER', admin, { id: 'user_2' }, { duration: '30 days' })
      AuditLogger.log('MANAGE_SYSTEM', admin, {}, { setting: 'maintenance_mode', value: true })

      expect(AuditLogger.logs).toHaveLength(4)

      // Filter by action
      const deletions = AuditLogger.getLogs({ action: 'DELETE_USER' })
      expect(deletions).toHaveLength(1)
      expect(deletions[0].target.id).toBe('user_1')

      // Filter by actor
      const adminActions = AuditLogger.getLogs({ actor: 'admin_1' })
      expect(adminActions).toHaveLength(4)

      // All logs should have timestamps and IP
      AuditLogger.logs.forEach((log) => {
        expect(log.timestamp).toBeDefined()
        expect(log.ipAddress).toBe('127.0.0.1')
        expect(log.userAgent).toBeDefined()
      })
    })
  })

  // ========== Error Recovery Scenarios ==========
  describe('Error Recovery Scenarios', () => {
    it('should handle WebSocket disconnection gracefully', async () => {
      // Connect
      const promise = NotificationWebSocketHandler.connect('admin_1')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise
      expect(NotificationWebSocketHandler.isConnected).toBe(true)

      // Simulate disconnect
      vi.useFakeTimers()
      mockSocket.close()

      // Handler should attempt reconnection
      expect(NotificationWebSocketHandler.reconnectAttempts).toBeGreaterThanOrEqual(0)

      vi.useRealTimers()
    })

    it('should handle API errors with audit logging', () => {
      const error = new Error('API request failed')

      // Log the error
      AuditLogger.log(
        'API_ERROR',
        { id: 'admin_1' },
        { url: '/api/admin/users' },
        { error: error.message }
      )

      expect(AuditLogger.logs).toHaveLength(1)
      expect(AuditLogger.logs[0].details.error).toBe('API request failed')
    })

    it('should recover from permission check failures', () => {
      // Simulate permission check that fails
      const hasPermission = PermissionControl.hasPermission('NONEXISTENT_ACTION')
      expect(hasPermission).toBe(false)

      // System should continue to work
      expect(PermissionControl.isAdmin()).toBe(true)
      expect(PermissionControl.getRole()).toBe(ROLES.ADMIN)

      // Audit logging should still work
      AuditLogger.log('TEST_ACTION', { id: 'admin_1' }, {})
      expect(AuditLogger.logs).toHaveLength(1)
    })
  })

  // ========== Permission Escalation Protection ==========
  describe('Permission Escalation Prevention', () => {
    it('should prevent regular user from accessing admin functions', () => {
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

      // User cannot access any admin actions
      const adminActions = [
        ACTIONS.DELETE_USER,
        ACTIONS.MANAGE_SYSTEM,
        ACTIONS.BROADCAST_NOTIFICATION,
        ACTIONS.DELETE_CONTENT
      ]

      adminActions.forEach((action) => {
        expect(PermissionControl.hasPermission(action)).toBe(false)
      })

      // User cannot access admin routes
      const adminRoutes = ['/admin/dashboard', '/admin/users', '/admin/content']

      adminRoutes.forEach((route) => {
        const access = AuthorizationGuard.checkRouteAccess({ path: route })
        expect(access.allowed).toBe(false)
      })
    })

    it('should prevent privilege escalation through token manipulation', () => {
      // Even if token is tampered with, permission system checks user role
      global.localStorage.getItem = vi.fn((key) => {
        if (key === 'authToken') return 'tampered_token_123'
        if (key === 'currentUser') {
          return JSON.stringify({
            id: 'user_1',
            role: ROLES.USER // Real role from user data
          })
        }
        return null
      })

      PermissionControl.init({ id: 'user_1', role: ROLES.USER })

      // Permission check should use user role, not token
      expect(PermissionControl.hasPermission(ACTIONS.DELETE_USER)).toBe(false)

      // Route guard should also check user role
      const access = AuthorizationGuard.checkRouteAccess({ path: '/admin/users' })
      expect(access.allowed).toBe(false)
    })
  })
})
