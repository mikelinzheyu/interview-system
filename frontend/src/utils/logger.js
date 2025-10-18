/**
 * 统一日志管理工具
 * 提供统一的日志格式和级别管理
 */

class Logger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    }

    // 从环境变量或默认配置获取日志级别
    this.currentLevel = this.levels[process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO']

    // 日志分类
    this.categories = {
      API: 'API',
      UI: 'UI',
      AUTH: 'AUTH',
      MEDIA: 'MEDIA',
      ERROR: 'ERROR',
      PERF: 'PERF'
    }
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, category, message, data = null) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}] [${category}]`

    if (data) {
      return `${prefix} ${message} | Data:` + (typeof data === 'object' ? JSON.stringify(data, null, 2) : data)
    }

    return `${prefix} ${message}`
  }

  /**
   * 判断是否应该输出日志
   */
  shouldLog(level) {
    return this.levels[level] <= this.currentLevel
  }

  /**
   * 错误日志
   */
  error(category, message, data = null) {
    if (!this.shouldLog('ERROR')) return

    const formattedMessage = this.formatMessage('ERROR', category, message, data)
    console.error(formattedMessage)

    // 错误日志发送到监控系统
    this.sendToMonitoring('ERROR', category, message, data)
  }

  /**
   * 警告日志
   */
  warn(category, message, data = null) {
    if (!this.shouldLog('WARN')) return

    const formattedMessage = this.formatMessage('WARN', category, message, data)
    console.warn(formattedMessage)
  }

  /**
   * 信息日志
   */
  info(category, message, data = null) {
    if (!this.shouldLog('INFO')) return

    const formattedMessage = this.formatMessage('INFO', category, message, data)
    console.log(formattedMessage)
  }

  /**
   * 调试日志
   */
  debug(category, message, data = null) {
    if (!this.shouldLog('DEBUG')) return

    const formattedMessage = this.formatMessage('DEBUG', category, message, data)
    console.debug(formattedMessage)
  }

  /**
   * API请求日志
   */
  apiRequest(method, url, data = null) {
    this.debug(this.categories.API, `${method} ${url}`, data)
  }

  /**
   * API响应日志
   */
  apiResponse(method, url, status, responseTime, data = null) {
    const level = status >= 400 ? 'WARN' : 'INFO'
    const message = `${method} ${url} -> ${status} (${responseTime}ms)`

    if (level === 'WARN') {
      this.warn(this.categories.API, message, data)
    } else {
      this.info(this.categories.API, message, data)
    }
  }

  /**
   * API错误日志
   */
  apiError(method, url, error, requestData = null) {
    const errorData = {
      request: requestData,
      error: {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    }

    this.error(this.categories.API, `${method} ${url} failed`, errorData)
  }

  /**
   * UI事件日志
   */
  uiEvent(event, component, data = null) {
    this.debug(this.categories.UI, `${event} in ${component}`, data)
  }

  /**
   * 认证相关日志
   */
  auth(action, result, data = null) {
    const level = result ? 'INFO' : 'WARN'
    const message = `Auth ${action}: ${result ? 'success' : 'failed'}`

    if (level === 'WARN') {
      this.warn(this.categories.AUTH, message, data)
    } else {
      this.info(this.categories.AUTH, message, data)
    }
  }

  /**
   * 媒体设备日志
   */
  media(action, result, data = null) {
    const level = result ? 'INFO' : 'WARN'
    const message = `Media ${action}: ${result ? 'success' : 'failed'}`

    if (level === 'WARN') {
      this.warn(this.categories.MEDIA, message, data)
    } else {
      this.info(this.categories.MEDIA, message, data)
    }
  }

  /**
   * 性能日志
   */
  performance(operation, duration, data = null) {
    const level = duration > 1000 ? 'WARN' : 'INFO'
    const message = `Performance: ${operation} took ${duration}ms`

    if (level === 'WARN') {
      this.warn(this.categories.PERF, message, data)
    } else {
      this.info(this.categories.PERF, message, data)
    }
  }

  /**
   * 发送日志到监控系统
   */
  sendToMonitoring(level, _category, _message, _data) {
    void _category;
    void _message;
    void _data;
    // 这里可以集成第三方监控服务
    if (level === 'ERROR') {
      // 只发送错误日志到监控系统
      try {
        // 示例：发送到监控API
        // fetch('/api/monitoring/log', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ level, category, message, data, timestamp: new Date().toISOString() })
        // })
      } catch (error) {
        // 监控发送失败，不影响主流程
        console.error('Failed to send log to monitoring:', error.message)
      }
    }
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level]
      this.info('SYSTEM', `Log level changed to: ${level}`)
    }
  }

  /**
   * 创建带有固定分类的子记录器
   */
  createCategoryLogger(category) {
    return {
      error: (message, data) => this.error(category, message, data),
      warn: (message, data) => this.warn(category, message, data),
      info: (message, data) => this.info(category, message, data),
      debug: (message, data) => this.debug(category, message, data)
    }
  }
}

// 创建全局实例
const logger = new Logger()

// 导出便捷方法
export default logger
export const apiLogger = logger.createCategoryLogger(logger.categories.API)
export const uiLogger = logger.createCategoryLogger(logger.categories.UI)
export const authLogger = logger.createCategoryLogger(logger.categories.AUTH)
export const mediaLogger = logger.createCategoryLogger(logger.categories.MEDIA)
export const errorLogger = logger.createCategoryLogger(logger.categories.ERROR)
