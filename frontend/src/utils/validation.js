/**
 * 表单验证工具类
 */

// 通用验证规则
export const validationRules = {
  // 必填验证
  required: (message = '此字段为必填项') => ({
    required: true,
    message,
    trigger: 'blur'
  }),

  // 邮箱验证
  email: (message = '请输入有效的邮箱地址') => ({
    type: 'email',
    message,
    trigger: ['blur', 'change']
  }),

  // 用户名验证
  username: (message = '用户名长度为3-20个字符，只能包含字母、数字和下划线') => ({
    pattern: /^[a-zA-Z0-9_]{3,20}$/,
    message,
    trigger: ['blur', 'change']
  }),

  // 密码验证
  password: (message = '密码长度为6-20个字符') => ({
    min: 6,
    max: 20,
    message,
    trigger: ['blur', 'change']
  }),

  // 强密码验证
  strongPassword: (message = '密码必须包含大小写字母、数字和特殊字符，长度8-20个字符') => ({
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
    message,
    trigger: ['blur', 'change']
  }),

  // 手机号验证
  phone: (message = '请输入有效的手机号码') => ({
    pattern: /^1[3-9]\d{9}$/,
    message,
    trigger: ['blur', 'change']
  }),

  // 真实姓名验证
  realName: (message = '姓名长度为2-10个字符，只能包含中文和英文字母') => ({
    pattern: /^[\u4e00-\u9fa5a-zA-Z]{2,10}$/,
    message,
    trigger: ['blur', 'change']
  }),

  // 数字验证
  number: (message = '请输入有效的数字') => ({
    type: 'number',
    message,
    trigger: ['blur', 'change']
  }),

  // 正整数验证
  positiveInteger: (message = '请输入正整数') => ({
    pattern: /^[1-9]\d*$/,
    message,
    trigger: ['blur', 'change']
  }),

  // URL验证
  url: (message = '请输入有效的URL地址') => ({
    type: 'url',
    message,
    trigger: ['blur', 'change']
  }),

  // 长度验证
  length: (min, max, message) => ({
    min,
    max,
    message: message || `长度在 ${min} 到 ${max} 个字符`,
    trigger: ['blur', 'change']
  }),

  // 自定义正则验证
  pattern: (regex, message) => ({
    pattern: regex,
    message,
    trigger: ['blur', 'change']
  })
}

// 常用的表单验证规则组合
export const commonValidations = {
  // 登录表单
  login: {
    username: [
      validationRules.required('请输入用户名'),
      validationRules.username()
    ],
    password: [
      validationRules.required('请输入密码'),
      validationRules.password()
    ]
  },

  // 注册表单
  register: {
    username: [
      validationRules.required('请输入用户名'),
      validationRules.username()
    ],
    email: [
      validationRules.required('请输入邮箱'),
      validationRules.email()
    ],
    password: [
      validationRules.required('请输入密码'),
      validationRules.strongPassword()
    ],
    confirmPassword: [
      validationRules.required('请确认密码'),
      {
        validator: (rule, value, callback, source) => {
          if (value && value !== source.password) {
            callback(new Error('两次密码输入不一致'))
          } else {
            callback()
          }
        },
        trigger: ['blur', 'change']
      }
    ],
    realName: [
      validationRules.required('请输入真实姓名'),
      validationRules.realName()
    ]
  },

  // 个人信息表单
  profile: {
    realName: [
      validationRules.required('请输入真实姓名'),
      validationRules.realName()
    ],
    email: [
      validationRules.required('请输入邮箱'),
      validationRules.email()
    ],
    phone: [
      validationRules.phone()
    ]
  },

  // 面试设置表单
  interviewSettings: {
    position: [
      validationRules.required('请输入面试职位'),
      validationRules.length(2, 50)
    ],
    level: [
      validationRules.required('请选择技能水平')
    ],
    duration: [
      validationRules.required('请输入面试时长'),
      validationRules.positiveInteger('请输入有效的时长（分钟）')
    ],
    skills: [
      {
        type: 'array',
        required: true,
        message: '请选择至少一项技能',
        trigger: 'change'
      }
    ]
  }
}

// 表单验证工具函数
export class FormValidator {
  constructor(rules = {}) {
    this.rules = rules
    this.errors = {}
  }

  // 设置验证规则
  setRules(rules) {
    this.rules = rules
    return this
  }

  // 验证单个字段
  validateField(field, value, data = {}) {
    const rules = this.rules[field]
    if (!rules || !Array.isArray(rules)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      let hasError = false
      let errorMessage = ''

      for (const rule of rules) {
        // 必填验证
        if (rule.required && (!value || value === '')) {
          hasError = true
          errorMessage = rule.message || '此字段为必填项'
          break
        }

        // 如果值为空且不是必填，跳过其他验证
        if (!value && !rule.required) {
          continue
        }

        // 类型验证
        if (rule.type && !this.validateType(value, rule.type)) {
          hasError = true
          errorMessage = rule.message || '格式不正确'
          break
        }

        // 长度验证
        if ((rule.min !== undefined || rule.max !== undefined) && !this.validateLength(value, rule.min, rule.max)) {
          hasError = true
          errorMessage = rule.message || `长度应在${rule.min || 0}-${rule.max || '∞'}之间`
          break
        }

        // 正则验证
        if (rule.pattern && !rule.pattern.test(value)) {
          hasError = true
          errorMessage = rule.message || '格式不正确'
          break
        }

        // 自定义验证
        if (rule.validator && typeof rule.validator === 'function') {
          try {
            rule.validator(rule, value, (error) => {
              if (error) {
                hasError = true
                errorMessage = error.message || '验证失败'
              }
            }, data)
          } catch (error) {
            hasError = true
            errorMessage = error.message || '验证异常'
          }
          break
        }
      }

      if (hasError) {
        this.errors[field] = errorMessage
        reject(new Error(errorMessage))
      } else {
        delete this.errors[field]
        resolve()
      }
    })
  }

  // 验证整个表单
  async validateForm(data) {
    const promises = []
    this.errors = {}

    for (const field in this.rules) {
      promises.push(
        this.validateField(field, data[field], data).catch(error => {
          throw { field, error }
        })
      )
    }

    try {
      await Promise.all(promises)
      return { valid: true, errors: {} }
    } catch (firstError) {
      // 等待所有验证完成以收集所有错误
      const results = await Promise.allSettled(promises)
      const errors = {}

      results.forEach((result, index) => {
        const field = Object.keys(this.rules)[index]
        if (result.status === 'rejected') {
          errors[field] = result.reason.error?.message || result.reason.message || '验证失败'
        }
      })

      return { valid: false, errors }
    }
  }

  // 类型验证
  validateType(value, type) {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'url':
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      case 'number':
        return !isNaN(Number(value))
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null
      default:
        return true
    }
  }

  // 长度验证
  validateLength(value, min, max) {
    const length = String(value).length
    if (min !== undefined && length < min) return false
    if (max !== undefined && length > max) return false
    return true
  }

  // 获取错误信息
  getErrors() {
    return this.errors
  }

  // 获取特定字段的错误
  getFieldError(field) {
    return this.errors[field]
  }

  // 清除错误
  clearErrors() {
    this.errors = {}
  }

  // 清除特定字段错误
  clearFieldError(field) {
    delete this.errors[field]
  }
}

// 创建验证器实例的工厂函数
export function createValidator(rules) {
  return new FormValidator(rules)
}

// 快速验证函数
export function validateRequired(value, message = '此字段为必填项') {
  if (!value || value === '') {
    throw new Error(message)
  }
  return true
}

export function validateEmail(email, message = '请输入有效的邮箱地址') {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error(message)
  }
  return true
}

export function validatePassword(password, message = '密码长度为6-20个字符') {
  if (!password || password.length < 6 || password.length > 20) {
    throw new Error(message)
  }
  return true
}

export function validateUsername(username, message = '用户名长度为3-20个字符，只能包含字母、数字和下划线') {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernameRegex.test(username)) {
    throw new Error(message)
  }
  return true
}