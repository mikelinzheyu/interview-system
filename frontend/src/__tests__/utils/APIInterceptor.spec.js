/**
 * APIInterceptor Unit Tests
 *
 * Tests for API request interception with permission & security
 * Covers request/response handling, error scenarios, and sensitive operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { APIInterceptor, ConfirmSensitiveOperation } from '@/utils/APIInterceptor'
import { PermissionControl, APIPermissionGuard, AuditLogger, ROLES, ACTIONS } from '@/utils/PermissionControl'

// Mock Element Plus components
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

// Mock axios
class MockAxiosInstance {
  constructor() {
    this.interceptors = {
      request: {
        use: vi.fn((success, error) => {
          this._requestSuccess = success
          this._requestError = error
        })
      },
      response: {
        use: vi.fn((success, error) => {
          this._responseSuccess = success
          this._responseError = error
        })
      }
    }
  }

  executeRequest(config) {
    return this._requestSuccess(config)
  }

  executeResponse(response) {
    return this._responseSuccess(response)
  }

  executeError(error) {
    return this._responseError(error)
  }
}

describe('APIInterceptor - Request/Response Handling', () => {
  let mockAxios
  let originalLocalStorage

  beforeEach(() => {
    mockAxios = new MockAxiosInstance()
    APIInterceptor.init(mockAxios)

    // Mock localStorage
    originalLocalStorage = global.localStorage
    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'authToken') return 'test_token_123'
        if (key === 'currentUser') return JSON.stringify({ id: 'user_1', name: 'Test User' })
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }

    // Initialize permission control
    const user = { id: 'user_1', role: ROLES.ADMIN }
    PermissionControl.init(user)

    vi.clearAllMocks()
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage
    AuditLogger.clearLogs()
  })

  // ========== Interceptor Initialization ==========
  describe('Interceptor Initialization', () => {
    it('should initialize API interceptor with axios instance', () => {
      expect(mockAxios.interceptors.request.use).toHaveBeenCalled()
      expect(mockAxios.interceptors.response.use).toHaveBeenCalled()
    })

    it('should register both request and response interceptors', () => {
      expect(mockAxios.interceptors.request.use).toHaveBeenCalledTimes(1)
      expect(mockAxios.interceptors.response.use).toHaveBeenCalledTimes(1)
    })
  })

  // ========== Request Handling ==========
  describe('Request Handling', () => {
    it('should allow authorized API requests', () => {
      const config = {
        method: 'GET',
        url: '/api/admin/users',
        headers: {}
      }

      const result = mockAxios.executeRequest(config)

      expect(result).not.toBeNull()
      expect(result.headers.Authorization).toBe('Bearer test_token_123')
    })

    it('should reject unauthorized API requests', () => {
      const user = { id: 'user_1', role: ROLES.USER }
      PermissionControl.init(user)

      const config = {
        method: 'DELETE',
        url: '/api/admin/users/123',
        headers: {}
      }

      expect(() => mockAxios.executeRequest(config)).toThrow('Permission denied')
    })

    it('should add Authorization header with token', () => {
      const config = {
        method: 'GET',
        url: '/api/data',
        headers: {}
      }

      const result = mockAxios.executeRequest(config)

      expect(result.headers.Authorization).toBe('Bearer test_token_123')
    })

    it('should generate unique request IDs', () => {
      const config1 = {
        method: 'GET',
        url: '/api/data',
        headers: {}
      }

      const config2 = {
        method: 'GET',
        url: '/api/data',
        headers: {}
      }

      const result1 = mockAxios.executeRequest(config1)
      const result2 = mockAxios.executeRequest(config2)

      expect(result1.headers['X-Request-ID']).not.toBe(result2.headers['X-Request-ID'])
      expect(result1.headers['X-Request-ID']).toMatch(/^req_/)
    })

    it('should handle missing token gracefully', () => {
      global.localStorage.getItem = vi.fn(() => null)

      const config = {
        method: 'GET',
        url: '/api/public/data',
        headers: {}
      }

      const result = mockAxios.executeRequest(config)

      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should log outgoing requests', () => {
      const consoleLogSpy = vi.spyOn(console, 'log')

      const config = {
        method: 'GET',
        url: '/api/users',
        headers: {}
      }

      mockAxios.executeRequest(config)

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📤 API Request'))
      consoleLogSpy.mockRestore()
    })
  })

  // ========== Response Handling ==========
  describe('Response Handling', () => {
    it('should handle successful response', () => {
      const response = {
        status: 200,
        data: { users: [] },
        config: {
          method: 'GET',
          url: '/api/users'
        }
      }

      const result = mockAxios.executeResponse(response)

      expect(result).toEqual(response)
    })

    it('should log successful responses', () => {
      const consoleLogSpy = vi.spyOn(console, 'log')

      const response = {
        status: 200,
        data: { success: true },
        config: {
          method: 'GET',
          url: '/api/data'
        }
      }

      mockAxios.executeResponse(response)

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📥 API Response'))
      consoleLogSpy.mockRestore()
    })

    it('should log sensitive operations', () => {
      const response = {
        status: 200,
        data: { success: true },
        config: {
          method: 'DELETE',
          url: '/api/admin/users/123'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs).toHaveLength(1)
      const log = AuditLogger.logs[0]
      expect(log.action).toBe('DELETE_USER')
      expect(log.details.status).toBe('success')
    })

    it('should not log non-sensitive operations', () => {
      const response = {
        status: 200,
        data: { data: 'some_public_data' },
        config: {
          method: 'GET',
          url: '/api/public/data'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs).toHaveLength(0)
    })
  })

  // ========== Error Handling ==========
  describe('Error Handling', () => {
    it('should handle 401 Unauthorized error', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Token expired' },
          config: {
            method: 'GET',
            url: '/api/data'
          }
        }
      }

      expect(() => mockAxios.executeError(error)).toThrow()
      expect(ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('登录已过期'))
    })

    it('should clear auth data on 401', () => {
      const error = {
        response: {
          status: 401,
          data: {},
          config: {
            method: 'GET',
            url: '/api/data'
          }
        }
      }

      const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
        href: ''
      })

      try {
        mockAxios.executeError(error)
      } catch {}

      expect(global.localStorage.removeItem).toHaveBeenCalledWith('authToken')
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('currentUser')

      locationSpy.mockRestore()
    })

    it('should handle 403 Forbidden error', () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Access denied' },
          config: {
            method: 'DELETE',
            url: '/api/admin/users/123'
          }
        }
      }

      expect(() => mockAxios.executeError(error)).toThrow()
      expect(ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('权限'))
    })

    it('should audit permission denied errors', () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Permission denied' },
          config: {
            method: 'DELETE',
            url: '/api/admin/users/123'
          }
        }
      }

      try {
        mockAxios.executeError(error)
      } catch {}

      expect(AuditLogger.logs).toHaveLength(1)
      expect(AuditLogger.logs[0].action).toBe('PERMISSION_DENIED')
    })

    it('should handle 404 Not Found error', () => {
      const error = {
        response: {
          status: 404,
          data: {},
          config: {
            method: 'GET',
            url: '/api/non-existent'
          }
        }
      }

      expect(() => mockAxios.executeError(error)).toThrow()
      expect(ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('资源不存在'))
    })

    it('should handle 500 Server Error', () => {
      const error = {
        response: {
          status: 500,
          data: {},
          config: {
            method: 'GET',
            url: '/api/data'
          }
        }
      }

      expect(() => mockAxios.executeError(error)).toThrow()
      expect(ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('服务器错误'))
    })

    it('should handle network errors', () => {
      const error = new Error('Network error')

      expect(() => mockAxios.executeError(error)).toThrow()
      expect(ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('网络连接失败'))
    })

    it('should show custom error messages', () => {
      const error = {
        response: {
          status: 422,
          data: { message: 'Validation failed' },
          config: {
            method: 'POST',
            url: '/api/users'
          }
        }
      }

      expect(() => mockAxios.executeError(error)).toThrow()
      expect(ElMessage.error).toHaveBeenCalledWith('Validation failed')
    })
  })

  // ========== Sensitive Operation Detection ==========
  describe('Sensitive Operation Detection', () => {
    it('should identify DELETE operations as sensitive', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'DELETE',
          url: '/api/admin/users/123'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs).toHaveLength(1)
    })

    it('should identify POST operations as sensitive', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'POST',
          url: '/api/admin/users'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs).toHaveLength(1)
    })

    it('should identify PUT operations as sensitive', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'PUT',
          url: '/api/admin/users/123'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs).toHaveLength(1)
    })

    it('should not mark GET as sensitive', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'GET',
          url: '/api/admin/users'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs).toHaveLength(0)
    })

    it('should require /admin/ in URL for sensitivity', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'DELETE',
          url: '/api/public/data'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs).toHaveLength(0)
    })
  })

  // ========== Operation Name Mapping ==========
  describe('Operation Name Mapping', () => {
    it('should map DELETE /api/admin/users/ to DELETE_USER', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'DELETE',
          url: '/api/admin/users/123'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs[0].action).toBe('DELETE_USER')
    })

    it('should map DELETE /api/admin/content/ to DELETE_CONTENT', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'DELETE',
          url: '/api/admin/content/456'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs[0].action).toBe('DELETE_CONTENT')
    })

    it('should map POST /api/admin/users/ to CREATE_USER', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'POST',
          url: '/api/admin/users/'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs[0].action).toBe('CREATE_USER')
    })

    it('should map PUT /api/admin/users/ to EDIT_USER', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'PUT',
          url: '/api/admin/users/123'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs[0].action).toBe('EDIT_USER')
    })

    it('should use default format for unmapped operations', () => {
      const response = {
        status: 200,
        data: {},
        config: {
          method: 'PATCH',
          url: '/api/admin/custom'
        }
      }

      mockAxios.executeResponse(response)

      expect(AuditLogger.logs[0].action).toBe('PATCH /api/admin/custom')
    })
  })
})

describe('ConfirmSensitiveOperation - Sensitive Operation Handling', () => {
  beforeEach(() => {
    const user = { id: 'user_1', role: ROLES.ADMIN }
    PermissionControl.init(user)
    AuditLogger.clearLogs()
    vi.clearAllMocks()
  })

  // ========== Confirmation Dialog ==========
  describe('Confirmation Dialog', () => {
    it('should show confirmation for DELETE_USER', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)

      const result = await ConfirmSensitiveOperation.confirm('DELETE_USER')

      expect(ElMessageBox.confirm).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should show confirmation for DELETE_CONTENT', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)

      const result = await ConfirmSensitiveOperation.confirm('DELETE_CONTENT')

      expect(ElMessageBox.confirm).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return true for non-sensitive operations', async () => {
      const result = await ConfirmSensitiveOperation.confirm('VIEW_USERS')

      expect(ElMessageBox.confirm).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when user cancels confirmation', async () => {
      ElMessageBox.confirm.mockRejectedValueOnce(new Error('cancelled'))

      const result = await ConfirmSensitiveOperation.confirm('DELETE_USER')

      expect(result).toBe(false)
    })

    it('should use correct message for operation', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)

      await ConfirmSensitiveOperation.confirm('BAN_USER')

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        expect.stringContaining('封禁'),
        expect.any(String),
        expect.any(Object)
      )
    })

    it('should use correct severity for operation', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)

      await ConfirmSensitiveOperation.confirm('DELETE_USER')

      const callArgs = ElMessageBox.confirm.mock.calls[0][2]
      expect(callArgs.type).toBe('error')
    })
  })

  // ========== Operation Execution ==========
  describe('Operation Execution', () => {
    it('should execute callback when confirmed', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)
      const callback = vi.fn().mockResolvedValueOnce({ success: true })

      const result = await ConfirmSensitiveOperation.execute('DELETE_USER', callback)

      expect(callback).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should not execute callback when cancelled', async () => {
      ElMessageBox.confirm.mockRejectedValueOnce(new Error('cancelled'))
      const callback = vi.fn()

      const result = await ConfirmSensitiveOperation.execute('DELETE_USER', callback)

      expect(callback).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('should show success message after execution', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)
      const callback = vi.fn().mockResolvedValueOnce({})

      await ConfirmSensitiveOperation.execute('DELETE_USER', callback)

      expect(ElMessage.success).toHaveBeenCalledWith('操作成功')
    })

    it('should show cancel message when user cancels', async () => {
      ElMessageBox.confirm.mockRejectedValueOnce(new Error('cancelled'))

      await ConfirmSensitiveOperation.execute('DELETE_USER', () => {})

      expect(ElMessage.info).toHaveBeenCalledWith('操作已取消')
    })

    it('should show error message when callback throws', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)
      const callback = vi.fn().mockRejectedValueOnce(new Error('Operation failed'))

      await expect(() =>
        ConfirmSensitiveOperation.execute('DELETE_USER', callback)
      ).rejects.toThrow()

      expect(ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('操作失败'))
    })

    it('should log successful execution', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)
      const callback = vi.fn().mockResolvedValueOnce({ id: 'user_123' })

      await ConfirmSensitiveOperation.execute('DELETE_USER', callback)

      expect(AuditLogger.logs).toHaveLength(1)
      expect(AuditLogger.logs[0].action).toBe('DELETE_USER')
      expect(AuditLogger.logs[0].details.result).toEqual({ id: 'user_123' })
    })

    it('should log execution errors', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)
      const error = new Error('Delete failed')
      const callback = vi.fn().mockRejectedValueOnce(error)

      try {
        await ConfirmSensitiveOperation.execute('DELETE_USER', callback)
      } catch {}

      expect(AuditLogger.logs).toHaveLength(1)
      expect(AuditLogger.logs[0].details.error).toBe('Delete failed')
    })

    it('should execute non-sensitive operations without confirmation', async () => {
      const callback = vi.fn().mockResolvedValueOnce({})

      const result = await ConfirmSensitiveOperation.execute('VIEW_USERS', callback)

      expect(ElMessageBox.confirm).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
    })
  })

  // ========== Audit Logging ==========
  describe('Audit Logging for Operations', () => {
    it('should log operation with user info', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)
      const callback = vi.fn().mockResolvedValueOnce({})

      await ConfirmSensitiveOperation.execute('DELETE_USER', callback)

      expect(AuditLogger.logs).toHaveLength(1)
      const log = AuditLogger.logs[0]
      expect(log.actor).toBeDefined()
      expect(log.actor.id).toBe('user_1')
    })

    it('should log operation with timestamp', async () => {
      ElMessageBox.confirm.mockResolvedValueOnce(true)
      const callback = vi.fn().mockResolvedValueOnce({})

      await ConfirmSensitiveOperation.execute('DELETE_USER', callback)

      expect(AuditLogger.logs).toHaveLength(1)
      expect(AuditLogger.logs[0].timestamp).toBeDefined()
    })
  })
})

describe('Integration Tests - Complete API Workflows', () => {
  let mockAxios

  beforeEach(() => {
    mockAxios = new MockAxiosInstance()
    APIInterceptor.init(mockAxios)

    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'authToken') return 'test_token'
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }

    const user = { id: 'admin_1', role: ROLES.ADMIN }
    PermissionControl.init(user)

    vi.clearAllMocks()
  })

  afterEach(() => {
    AuditLogger.clearLogs()
  })

  // ========== Complete Request-Response Cycle ==========
  it('should complete full request-response cycle with audit logging', () => {
    // Request
    const requestConfig = {
      method: 'DELETE',
      url: '/api/admin/users/123',
      headers: {}
    }

    const config = mockAxios.executeRequest(requestConfig)
    expect(config.headers.Authorization).toBe('Bearer test_token')

    // Response
    const response = {
      status: 200,
      data: { success: true },
      config: config
    }

    mockAxios.executeResponse(response)

    // Verify audit log
    expect(AuditLogger.logs).toHaveLength(1)
    const log = AuditLogger.logs[0]
    expect(log.action).toBe('DELETE_USER')
    expect(log.details.status).toBe('success')
  })

  // ========== Permission-Based Request Blocking ==========
  it('should block requests from users without permission', () => {
    const userWithoutPermission = { id: 'user_1', role: ROLES.USER }
    PermissionControl.init(userWithoutPermission)

    const config = {
      method: 'DELETE',
      url: '/api/admin/users/123',
      headers: {}
    }

    expect(() => mockAxios.executeRequest(config)).toThrow('Permission denied')
  })
})
