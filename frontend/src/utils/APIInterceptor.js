/**
 * API Request Interceptor with Permission & Security
 *
 * Intercepts all API requests to:
 * - Check user permissions
 * - Add authentication headers
 * - Log sensitive operations
 * - Handle permission errors
 *
 * @module apiInterceptor
 */

import { PermissionControl, APIPermissionGuard, AuditLogger, SensitiveOperations } from './PermissionControl'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * API Interceptor Service
 */
export const APIInterceptor = {
  // Store for interceptor instances
  interceptors: [],

  /**
   * Initialize API interceptor
   * @param {Object} axiosInstance - Axios instance
   */
  init(axiosInstance) {
    // Request interceptor
    axiosInstance.interceptors.request.use(
      (config) => {
        return this._handleRequest(config)
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    axiosInstance.interceptors.response.use(
      (response) => {
        return this._handleResponse(response)
      },
      (error) => {
        return this._handleError(error)
      }
    )

    console.log('✅ API Interceptor initialized')
  },

  /**
   * Handle outgoing request
   * @private
   */
  _handleRequest(config) {
    const { method, url } = config

    // 1. Check permission
    if (!APIPermissionGuard.canCallAPI(method, url)) {
      ElMessage.error('您没有权限执行此操作')
      return Promise.reject(new Error('Permission denied'))
    }

    // 2. Add authorization token
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 3. Add request ID for tracking
    config.headers['X-Request-ID'] = this._generateRequestId()

    // 4. Log request
    console.log(`📤 API Request: ${method.toUpperCase()} ${url}`)

    return config
  },

  /**
   * Handle successful response
   * @private
   */
  _handleResponse(response) {
    const { config, data } = response

    // Log successful response
    console.log(`📥 API Response: ${config.method.toUpperCase()} ${config.url}`, data)

    // Log sensitive operations
    if (this._isSensitiveOperation(config.method, config.url)) {
      const operation = this._getOperationName(config.method, config.url)
      const currentUser = PermissionControl.currentUser

      AuditLogger.log(
        operation,
        currentUser,
        { url: config.url, method: config.method },
        { status: 'success', response: data }
      )
    }

    return response
  },

  /**
   * Handle error response
   * @private
   */
  _handleError(error) {
    const { response, config } = error

    if (!response) {
      console.error('Network error:', error)
      ElMessage.error('网络连接失败，请稍后重试')
      return Promise.reject(error)
    }

    const { status, data } = response

    console.error(`❌ API Error: ${status} ${config.method.toUpperCase()} ${config.url}`, data)

    switch (status) {
      case 401:
        // Unauthorized - token expired or invalid
        ElMessage.error('您的登录已过期，请重新登录')
        this._handleUnauthorized()
        break

      case 403:
        // Forbidden - no permission
        ElMessage.error('您没有权限执行此操作')
        AuditLogger.log(
          'PERMISSION_DENIED',
          PermissionControl.currentUser,
          { url: config.url, method: config.method },
          { reason: data?.message }
        )
        break

      case 404:
        // Not found
        ElMessage.error('请求的资源不存在')
        break

      case 500:
        // Server error
        ElMessage.error('服务器错误，请联系管理员')
        break

      default:
        ElMessage.error(data?.message || '请求失败，请稍后重试')
    }

    return Promise.reject(error)
  },

  /**
   * Check if operation is sensitive
   * @private
   */
  _isSensitiveOperation(method, url) {
    const sensitiveMethods = ['POST', 'PUT', 'DELETE']
    const sensitivePatterns = ['/admin/', '/api/admin/']

    return (
      sensitiveMethods.includes(method.toUpperCase()) &&
      sensitivePatterns.some((pattern) => url.includes(pattern))
    )
  },

  /**
   * Get operation name from request
   * @private
   */
  _getOperationName(method, url) {
    const operations = {
      'DELETE /api/admin/users/': 'DELETE_USER',
      'DELETE /api/admin/content/': 'DELETE_CONTENT',
      'POST /api/admin/users/': 'CREATE_USER',
      'PUT /api/admin/users/': 'EDIT_USER',
      'POST /api/admin/content/': 'MANAGE_CONTENT'
    }

    for (const [pattern, operation] of Object.entries(operations)) {
      const [patternMethod, patternUrl] = pattern.split(' ')
      if (
        method.toUpperCase() === patternMethod &&
        url.includes(patternUrl)
      ) {
        return operation
      }
    }

    return `${method.toUpperCase()} ${url}`
  },

  /**
   * Generate unique request ID
   * @private
   */
  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Handle unauthorized access
   * @private
   */
  _handleUnauthorized() {
    // Clear auth data
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')

    // Redirect to login
    window.location.href = '/login'
  }
}

/**
 * Sensitive Operation Confirmation Helper
 */
export const ConfirmSensitiveOperation = {
  /**
   * Show confirmation dialog for sensitive operations
   * @param {string} operation - Operation name
   * @returns {Promise<boolean>}
   */
  async confirm(operation) {
    const config = SensitiveOperations.requiresConfirmation(operation)

    if (!config) {
      return true
    }

    try {
      await ElMessageBox.confirm(
        config.message,
        '确认操作',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: config.severity
        }
      )
      return true
    } catch {
      return false
    }
  },

  /**
   * Execute operation with confirmation if needed
   * @param {string} operation - Operation name
   * @param {Function} callback - Operation callback
   * @returns {Promise}
   */
  async execute(operation, callback) {
    const confirmed = await this.confirm(operation)

    if (!confirmed) {
      ElMessage.info('操作已取消')
      return false
    }

    try {
      const result = await callback()

      ElMessage.success('操作成功')
      AuditLogger.log(operation, PermissionControl.currentUser, {}, { result })

      return result
    } catch (error) {
      ElMessage.error('操作失败：' + error.message)
      AuditLogger.log(
        operation,
        PermissionControl.currentUser,
        {},
        { error: error.message }
      )
      throw error
    }
  }
}

export default APIInterceptor
