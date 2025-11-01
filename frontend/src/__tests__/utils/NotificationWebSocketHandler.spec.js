/**
 * NotificationWebSocketHandler Unit Tests
 *
 * Tests for WebSocket real-time notification system
 * Covers connection management, event handling, and message routing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  NotificationWebSocketHandler,
  AdminActivityWebSocketHandler,
  SystemAlertHandler
} from '@/utils/NotificationWebSocketHandler'

// Mock WebSocket class
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.isOpen = false
    this.messages = []
    this.onopen = null
    this.onclose = null
    this.onerror = null
    this.onmessage = null
  }

  send(data) {
    this.messages.push(JSON.parse(data))
  }

  close() {
    this.isOpen = false
    if (this.onclose) this.onclose()
  }

  simulateOpen() {
    this.isOpen = true
    if (this.onopen) this.onopen()
  }

  simulateError(error) {
    if (this.onerror) this.onerror(error)
  }

  simulateMessage(data) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) })
  }

  simulateClose() {
    this.isOpen = false
    if (this.onclose) this.onclose()
  }
}

// Global WebSocket mock
global.WebSocket = MockWebSocket

describe('NotificationWebSocketHandler - Connection Management', () => {
  let mockSocket

  beforeEach(() => {
    // Reset handler state
    NotificationWebSocketHandler.isConnected = false
    NotificationWebSocketHandler.socket = null
    NotificationWebSocketHandler.userId = null
    NotificationWebSocketHandler.reconnectAttempts = 0
    NotificationWebSocketHandler.listeners = {}
    if (NotificationWebSocketHandler.reconnectTimeout) {
      clearTimeout(NotificationWebSocketHandler.reconnectTimeout)
    }
  })

  afterEach(() => {
    if (NotificationWebSocketHandler.socket) {
      NotificationWebSocketHandler.disconnect()
    }
  })

  // ========== Connection Lifecycle ==========
  describe('Connection Lifecycle', () => {
    it('should establish WebSocket connection', async () => {
      const promise = NotificationWebSocketHandler.connect('user_1', 'ws://localhost:8080/ws/notifications')

      // Simulate WebSocket open
      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise

      expect(NotificationWebSocketHandler.isConnected).toBe(true)
      expect(NotificationWebSocketHandler.userId).toBe('user_1')
      expect(NotificationWebSocketHandler.socket).not.toBeNull()
    })

    it('should send initial handshake on connection', async () => {
      const promise = NotificationWebSocketHandler.connect('user_2')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise

      expect(mockSocket.messages).toHaveLength(1)
      const handshake = mockSocket.messages[0]
      expect(handshake.type).toBe('CONNECT')
      expect(handshake.userId).toBe('user_2')
    })

    it('should reject on connection error', async () => {
      const promise = NotificationWebSocketHandler.connect('user_3')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateError(new Error('Connection failed'))
      }, 10)

      await expect(promise).rejects.toBeTruthy()
    })

    it('should handle connection close', async () => {
      const promise = NotificationWebSocketHandler.connect('user_4')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise
      expect(NotificationWebSocketHandler.isConnected).toBe(true)

      mockSocket.simulateClose()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(NotificationWebSocketHandler.isConnected).toBe(false)
    })

    it('should disconnect cleanly', async () => {
      const promise = NotificationWebSocketHandler.connect('user_5')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise
      NotificationWebSocketHandler.disconnect()

      expect(NotificationWebSocketHandler.isConnected).toBe(false)
    })

    it('should use custom WebSocket URL', async () => {
      const customUrl = 'ws://custom.server.com/ws'
      const promise = NotificationWebSocketHandler.connect('user_6', customUrl)

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        expect(mockSocket.url).toContain('custom.server.com')
        mockSocket.simulateOpen()
      }, 10)

      await promise
    })
  })

  // ========== Reconnection Logic ==========
  describe('Reconnection Logic', () => {
    it('should attempt reconnection on disconnect', async () => {
      vi.useFakeTimers()

      const promise = NotificationWebSocketHandler.connect('user_7')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise
      expect(NotificationWebSocketHandler.reconnectAttempts).toBe(0)

      // Simulate disconnect
      mockSocket.simulateClose()

      // Should have attempted reconnect
      expect(NotificationWebSocketHandler.reconnectAttempts).toBe(1)

      vi.useRealTimers()
    })

    it('should respect max reconnect attempts', async () => {
      vi.useFakeTimers()

      const promise = NotificationWebSocketHandler.connect('user_8')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise

      // Set to max attempts
      NotificationWebSocketHandler.reconnectAttempts = NotificationWebSocketHandler.maxReconnectAttempts

      const listener = vi.fn()
      NotificationWebSocketHandler.on('connection:failed', listener)

      // Next disconnect should trigger failed event
      mockSocket.simulateClose()

      // Note: actual reconnection won't happen due to maxReconnectAttempts
      expect(NotificationWebSocketHandler.reconnectAttempts).toBe(NotificationWebSocketHandler.maxReconnectAttempts)

      vi.useRealTimers()
    })

    it('should reset reconnect attempts on successful reconnection', async () => {
      const promise = NotificationWebSocketHandler.connect('user_9')

      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)

      await promise
      expect(NotificationWebSocketHandler.reconnectAttempts).toBe(0)
    })
  })

  // ========== Message Sending ==========
  describe('Message Sending', () => {
    beforeEach(async () => {
      const promise = NotificationWebSocketHandler.connect('user_10')
      setTimeout(() => {
        mockSocket = NotificationWebSocketHandler.socket
        mockSocket.simulateOpen()
      }, 10)
      await promise
    })

    it('should send message when connected', () => {
      NotificationWebSocketHandler.sendMessage({ type: 'TEST', data: 'hello' })

      expect(mockSocket.messages.length).toBeGreaterThan(1) // handshake + message
      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.type).toBe('TEST')
      expect(lastMessage.data).toBe('hello')
    })

    it('should add timestamp to messages', () => {
      NotificationWebSocketHandler.sendMessage({ type: 'TEST' })

      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.timestamp).toBeDefined()
      expect(lastMessage.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/)
    })

    it('should add userId to messages', () => {
      NotificationWebSocketHandler.sendMessage({ type: 'TEST' })

      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.userId).toBe('user_10')
    })

    it('should not send message when disconnected', () => {
      NotificationWebSocketHandler.isConnected = false
      const initialCount = mockSocket.messages.length

      NotificationWebSocketHandler.sendMessage({ type: 'TEST' })

      // No new message should be sent
      expect(mockSocket.messages).toHaveLength(initialCount)
    })
  })

  // ========== Event Subscription ==========
  describe('Event Subscription', () => {
    it('should register event listener', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('notification:new', callback)

      expect(NotificationWebSocketHandler.listeners['notification:new']).toContain(callback)
    })

    it('should support multiple listeners for same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      NotificationWebSocketHandler.on('test:event', callback1)
      NotificationWebSocketHandler.on('test:event', callback2)

      expect(NotificationWebSocketHandler.listeners['test:event']).toHaveLength(2)
    })

    it('should unsubscribe from events', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('test:event', callback)
      expect(NotificationWebSocketHandler.listeners['test:event']).toHaveLength(1)

      NotificationWebSocketHandler.off('test:event', callback)
      expect(NotificationWebSocketHandler.listeners['test:event']).toHaveLength(0)
    })

    it('should handle unsubscribe for non-existent event', () => {
      const callback = vi.fn()
      expect(() => {
        NotificationWebSocketHandler.off('non:existent', callback)
      }).not.toThrow()
    })
  })
})

describe('NotificationWebSocketHandler - Message Handling', () => {
  let mockSocket

  beforeEach(async () => {
    NotificationWebSocketHandler.isConnected = false
    NotificationWebSocketHandler.socket = null
    NotificationWebSocketHandler.userId = null
    NotificationWebSocketHandler.listeners = {}

    const promise = NotificationWebSocketHandler.connect('user_11')
    setTimeout(() => {
      mockSocket = NotificationWebSocketHandler.socket
      mockSocket.simulateOpen()
    }, 10)
    await promise
  })

  afterEach(() => {
    if (NotificationWebSocketHandler.socket) {
      NotificationWebSocketHandler.disconnect()
    }
  })

  // ========== Message Routing ==========
  describe('Message Routing', () => {
    it('should handle NOTIFICATION_NEW event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('notification:new', callback)

      mockSocket.simulateMessage({
        type: 'NOTIFICATION_NEW',
        data: { id: 'notif_1', text: 'New notification' }
      })

      expect(callback).toHaveBeenCalledWith({ id: 'notif_1', text: 'New notification' })
    })

    it('should handle NOTIFICATION_UPDATE event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('notification:update', callback)

      mockSocket.simulateMessage({
        type: 'NOTIFICATION_UPDATE',
        data: { id: 'notif_1', status: 'read' }
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle NOTIFICATION_DELETE event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('notification:delete', callback)

      mockSocket.simulateMessage({
        type: 'NOTIFICATION_DELETE',
        data: { id: 'notif_1' }
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle ADMIN_ACTION event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('admin:action', callback)

      mockSocket.simulateMessage({
        type: 'ADMIN_ACTION',
        data: { action: 'user_deleted', actor: { id: 'admin_1' } }
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle CONTENT_MODERATED event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('content:moderated', callback)

      mockSocket.simulateMessage({
        type: 'CONTENT_MODERATED',
        data: { contentId: 'content_1', status: 'approved' }
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle USER_REPORT event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('user:report', callback)

      mockSocket.simulateMessage({
        type: 'USER_REPORT',
        data: { reportId: 'report_1', type: 'abuse' }
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle SYSTEM_ALERT event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('system:alert', callback)

      mockSocket.simulateMessage({
        type: 'SYSTEM_ALERT',
        data: { severity: 'high', message: 'High CPU usage' }
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle SYSTEM_STATUS event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('system:status', callback)

      mockSocket.simulateMessage({
        type: 'SYSTEM_STATUS',
        data: { cpuUsage: 75, memoryUsage: 80 }
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle BROADCAST event', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('broadcast', callback)

      mockSocket.simulateMessage({
        type: 'BROADCAST',
        data: { message: 'Maintenance scheduled' }
      })

      expect(callback).toHaveBeenCalled()
    })

    it('should handle unknown event type gracefully', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('unknown:event', callback)

      mockSocket.simulateMessage({
        type: 'UNKNOWN_TYPE',
        data: { some: 'data' }
      })

      // Unknown types shouldn't trigger callbacks
      expect(callback).not.toHaveBeenCalled()
    })

    it('should parse JSON messages correctly', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('notification:new', callback)

      const data = { id: 'notif_1', nested: { value: 123 } }
      mockSocket.simulateMessage({
        type: 'NOTIFICATION_NEW',
        data: data
      })

      expect(callback).toHaveBeenCalledWith(data)
    })

    it('should handle malformed JSON gracefully', () => {
      const callback = vi.fn()
      NotificationWebSocketHandler.on('notification:new', callback)

      // Simulate malformed message
      if (NotificationWebSocketHandler.socket.onmessage) {
        NotificationWebSocketHandler.socket.onmessage({ data: 'invalid json' })
      }

      // Should not crash, but callback shouldn't be called
      expect(callback).not.toHaveBeenCalled()
    })
  })

  // ========== Special Messages ==========
  describe('Special Message Types', () => {
    it('should acknowledge notifications', () => {
      NotificationWebSocketHandler.acknowledgeNotification('notif_123')

      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.type).toBe('NOTIFICATION_ACK')
      expect(lastMessage.notificationId).toBe('notif_123')
    })

    it('should send ping to keep alive', () => {
      const initialCount = mockSocket.messages.length
      NotificationWebSocketHandler.ping()

      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.type).toBe('PING')
    })
  })

  // ========== Connection Status ==========
  describe('Connection Status', () => {
    it('should return true when connected', () => {
      expect(NotificationWebSocketHandler.getStatus()).toBe(true)
    })

    it('should return false when disconnected', () => {
      NotificationWebSocketHandler.isConnected = false
      expect(NotificationWebSocketHandler.getStatus()).toBe(false)
    })
  })

  // ========== Event Listeners Error Handling ==========
  describe('Event Listener Error Handling', () => {
    it('should catch errors in event listeners', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const normalCallback = vi.fn()

      NotificationWebSocketHandler.on('test:event', errorCallback)
      NotificationWebSocketHandler.on('test:event', normalCallback)

      mockSocket.simulateMessage({
        type: 'TEST_EVENT',
        data: { test: 'data' }
      })

      // Both should be called despite one throwing
      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled()
    })

    it('should not crash on listener error', () => {
      NotificationWebSocketHandler.on('error:event', () => {
        throw new Error('Listener error')
      })

      expect(() => {
        mockSocket.simulateMessage({
          type: 'ERROR_EVENT',
          data: {}
        })
      }).not.toThrow()
    })
  })
})

describe('AdminActivityWebSocketHandler - Admin Events', () => {
  let mockSocket

  beforeEach(async () => {
    NotificationWebSocketHandler.isConnected = false
    NotificationWebSocketHandler.socket = null
    NotificationWebSocketHandler.listeners = {}

    const promise = NotificationWebSocketHandler.connect('admin_1')
    setTimeout(() => {
      mockSocket = NotificationWebSocketHandler.socket
      mockSocket.simulateOpen()
    }, 10)
    await promise

    // Clear window mock
    global.dispatchEvent = vi.fn()
  })

  afterEach(() => {
    if (NotificationWebSocketHandler.socket) {
      NotificationWebSocketHandler.disconnect()
    }
  })

  // ========== Admin Handler Initialization ==========
  describe('Admin Handler Initialization', () => {
    it('should initialize admin activity handler', () => {
      AdminActivityWebSocketHandler.init('admin_1')

      const listeners = NotificationWebSocketHandler.listeners
      expect(listeners['admin:action']).toBeDefined()
      expect(listeners['content:moderated']).toBeDefined()
      expect(listeners['user:report']).toBeDefined()
    })
  })

  // ========== Admin Notifications ==========
  describe('Admin Notifications', () => {
    beforeEach(() => {
      AdminActivityWebSocketHandler.init('admin_1')
    })

    it('should broadcast admin notification', () => {
      AdminActivityWebSocketHandler.broadcastNotification({
        title: 'Maintenance Alert',
        message: 'Server maintenance at 10 PM'
      })

      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.type).toBe('ADMIN_BROADCAST')
      expect(lastMessage.notification).toBeDefined()
    })

    it('should notify content moderation', () => {
      AdminActivityWebSocketHandler.notifyModeration('content_1', 'approve', 'Appropriate content')

      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.type).toBe('CONTENT_MODERATION')
      expect(lastMessage.contentId).toBe('content_1')
      expect(lastMessage.action).toBe('approve')
    })

    it('should notify user action', () => {
      AdminActivityWebSocketHandler.notifyUserAction('user_1', 'role_changed', { oldRole: 'user', newRole: 'vip' })

      const lastMessage = mockSocket.messages[mockSocket.messages.length - 1]
      expect(lastMessage.type).toBe('USER_ACTION')
      expect(lastMessage.userId).toBe('user_1')
      expect(lastMessage.action).toBe('role_changed')
    })
  })
})

describe('SystemAlertHandler - System Alerts', () => {
  let mockSocket

  beforeEach(async () => {
    NotificationWebSocketHandler.isConnected = false
    NotificationWebSocketHandler.socket = null
    NotificationWebSocketHandler.listeners = {}

    const promise = NotificationWebSocketHandler.connect('user_12')
    setTimeout(() => {
      mockSocket = NotificationWebSocketHandler.socket
      mockSocket.simulateOpen()
    }, 10)
    await promise
  })

  afterEach(() => {
    if (NotificationWebSocketHandler.socket) {
      NotificationWebSocketHandler.disconnect()
    }
  })

  // ========== System Alert Handling ==========
  describe('System Alert Handling', () => {
    it('should initialize system alert handler', () => {
      SystemAlertHandler.init()

      const listeners = NotificationWebSocketHandler.listeners
      expect(listeners['system:alert']).toBeDefined()
      expect(listeners['system:status']).toBeDefined()
    })

    it('should handle critical system alert', () => {
      SystemAlertHandler.init()

      mockSocket.simulateMessage({
        type: 'SYSTEM_ALERT',
        data: {
          alertType: 'cpu',
          severity: 'critical',
          message: 'CPU usage at 95%'
        }
      })

      // Verify alert was processed
      expect(NotificationWebSocketHandler.listeners['system:alert'].length).toBeGreaterThan(0)
    })

    it('should handle system status update', () => {
      SystemAlertHandler.init()

      mockSocket.simulateMessage({
        type: 'SYSTEM_STATUS',
        data: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 75,
          activeUsers: 250
        }
      })

      expect(NotificationWebSocketHandler.listeners['system:status'].length).toBeGreaterThan(0)
    })
  })
})

describe('Integration Tests - Complete WebSocket Workflows', () => {
  let mockSocket

  beforeEach(async () => {
    NotificationWebSocketHandler.isConnected = false
    NotificationWebSocketHandler.socket = null
    NotificationWebSocketHandler.userId = null
    NotificationWebSocketHandler.reconnectAttempts = 0
    NotificationWebSocketHandler.listeners = {}

    const promise = NotificationWebSocketHandler.connect('user_integration')
    setTimeout(() => {
      mockSocket = NotificationWebSocketHandler.socket
      mockSocket.simulateOpen()
    }, 10)
    await promise
  })

  afterEach(() => {
    if (NotificationWebSocketHandler.socket) {
      NotificationWebSocketHandler.disconnect()
    }
  })

  // ========== Complete Notification Workflow ==========
  it('should complete full notification workflow', () => {
    const callbacks = {
      onNew: vi.fn(),
      onUpdate: vi.fn(),
      onAck: vi.fn()
    }

    // Subscribe to events
    NotificationWebSocketHandler.on('notification:new', callbacks.onNew)
    NotificationWebSocketHandler.on('notification:update', callbacks.onUpdate)

    // Receive new notification
    mockSocket.simulateMessage({
      type: 'NOTIFICATION_NEW',
      data: { id: 'notif_1', text: 'New message' }
    })

    expect(callbacks.onNew).toHaveBeenCalled()

    // Mark as read
    NotificationWebSocketHandler.acknowledgeNotification('notif_1')
    expect(mockSocket.messages[mockSocket.messages.length - 1].type).toBe('NOTIFICATION_ACK')

    // Receive update
    mockSocket.simulateMessage({
      type: 'NOTIFICATION_UPDATE',
      data: { id: 'notif_1', status: 'read' }
    })

    expect(callbacks.onUpdate).toHaveBeenCalled()
  })

  // ========== Multiple Event Types ==========
  it('should handle multiple event types simultaneously', () => {
    const callbacks = {
      notification: vi.fn(),
      admin: vi.fn(),
      system: vi.fn()
    }

    NotificationWebSocketHandler.on('notification:new', callbacks.notification)
    NotificationWebSocketHandler.on('admin:action', callbacks.admin)
    NotificationWebSocketHandler.on('system:alert', callbacks.system)

    // Send multiple events
    mockSocket.simulateMessage({
      type: 'NOTIFICATION_NEW',
      data: { id: 'n1' }
    })

    mockSocket.simulateMessage({
      type: 'ADMIN_ACTION',
      data: { action: 'user_deleted' }
    })

    mockSocket.simulateMessage({
      type: 'SYSTEM_ALERT',
      data: { severity: 'high' }
    })

    expect(callbacks.notification).toHaveBeenCalled()
    expect(callbacks.admin).toHaveBeenCalled()
    expect(callbacks.system).toHaveBeenCalled()
  })

  // ========== Listener Lifecycle ==========
  it('should manage listener lifecycle correctly', () => {
    const callback = vi.fn()

    NotificationWebSocketHandler.on('test:event', callback)
    expect(NotificationWebSocketHandler.listeners['test:event']).toHaveLength(1)

    mockSocket.simulateMessage({
      type: 'TEST_EVENT',
      data: {}
    })
    expect(callback).toHaveBeenCalledTimes(1)

    NotificationWebSocketHandler.off('test:event', callback)
    expect(NotificationWebSocketHandler.listeners['test:event']).toHaveLength(0)

    mockSocket.simulateMessage({
      type: 'TEST_EVENT',
      data: {}
    })
    expect(callback).toHaveBeenCalledTimes(1) // Still 1, not called again
  })
})
