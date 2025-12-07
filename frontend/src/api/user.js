import api from './index'

/**
 * 通知设置的默认值
 * 与后端 backend/routes/user-settings.js 中的默认值保持一致
 */
const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: false,
  smsNotifications: false,
  pushNotifications: true,
  commentNotifications: true,
  messageNotifications: true,
  systemNotifications: true
}

/**
 * 用户相关的所有 API 接口
 *
 * 设计原则：
 * 1. 旧接口（getUserInfo、getLoginDevices、uploadAvatar）保留原有返回结构，用于现有代码兼容
 * 2. 新接口都返回 res.data，直接适配 settings.ts 的 Pinia store
 * 3. 所有方法名和参数名保持英文小驼峰
 */
export const userAPI = {
  // ===== 基础资料 =====

  /**
   * 获取用户信息（旧接口，保留兼容性）
   * 返回结构：{ code, message, data: User }
   * 用于现有 userStore 等调用方
   */
  getUserInfo: () => api.get('/users/me'),

  /**
   * 获取用户资料（新接口）
   * 返回：UserProfile 对象
   * 给 settings.ts 中的 profile store 使用
   */
  getProfile: async () => {
    const res = await api.get('/users/me')
    return res.data
  },

  /**
   * 更新用户资料
   * @param {Partial<UserProfile>} data - 要更新的字段
   * @returns {Promise<ApiResponse<User>>}
   */
  updateProfile: (data) => api.put('/users/profile', data),

  /**
   * 上传头像
   * 可接受两种输入：
   * 1. FormData，包含 'avatar' 字段
   * 2. base64 字符串或图片 URL
   * @param {FormData|string} avatarPayload
   * @returns {Promise<ApiResponse<User>>}
   */
  uploadAvatar: async (avatarPayload) => {
    let payload = avatarPayload

    // 兼容历史用法：传入 FormData，字段名为 avatar
    if (typeof FormData !== 'undefined' && avatarPayload instanceof FormData) {
      const file = avatarPayload.get('avatar')

      if (file && typeof FileReader !== 'undefined') {
        payload = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result || '')
          reader.onerror = () => reject(new Error('头像读取失败'))
          reader.readAsDataURL(file)
        })
      }
    }

    const res = await api.put('/users/profile', { avatar: payload })

    // 兼容旧调用方：如果返回的是用户对象，则补充 data.url 字段（指向 avatar）
    if (res && res.data && !res.data.url && res.data.avatar) {
      res.data = {
        ...res.data,
        url: res.data.avatar
      }
    }

    return res
  },

  // ===== 安全 / 账号 =====

  /**
   * 获取安全信息聚合（手机、邮箱、2FA、登录设备等）
   * @returns {Promise<UserSecurity>}
   */
  getSecurity: async () => {
    const res = await api.get('/users/security')
    return res.data
  },

  /**
   * 修改密码
   * @param {Object} data - { currentPassword, newPassword, confirmPassword }
   */
  changePassword: (data) => api.put('/users/password', data),

  /**
   * 绑定/更换手机号
   * @param {Object} data - { phone, code }
   */
  bindPhone: (data) => api.post('/users/phone/bind', data),

  /**
   * 绑定/更换邮箱
   * @param {Object} data - { email, code }
   */
  bindEmail: (data) => api.post('/users/email/bind', data),

  /**
   * 发送手机验证码
   * @param {string} phone - 手机号
   */
  sendPhoneCode: (phone) => api.post('/users/phone/code', { phone }),

  /**
   * 发送邮箱验证码
   * @param {string} email - 邮箱地址
   */
  sendEmailCode: (email) => api.post('/users/email/code', { email }),

  /**
   * 启用两步验证
   * @param {Object} [data={}]
   */
  enableTwoFactor: (data) => api.post('/users/2fa/enable', data ?? {}),

  /**
   * 禁用两步验证
   * @param {Object} [data={}]
   */
  disableTwoFactor: (data) => api.post('/users/2fa/disable', data ?? {}),

  /**
   * 获取登录设备列表（旧接口，保留兼容性）
   * 返回结构：{ code, message, data: LoginDevice[] }
   */
  getLoginDevices: () => api.get('/users/devices'),

  /**
   * 移除登录设备
   * @param {string} deviceId - 设备 ID
   */
  removeDevice: (deviceId) => api.delete(`/users/devices/${deviceId}`),

  /**
   * 注销账户
   * @param {Object} [data={}] - 可能包含密码确认等
   */
  deleteAccount: (data) => api.post('/users/account/delete', data ?? {}),

  // ===== 隐私设置 =====

  /**
   * 获取隐私设置
   * @returns {Promise<UserPrivacy>}
   */
  getPrivacy: async () => {
    const res = await api.get('/users/privacy')
    return res.data
  },

  /**
   * 更新隐私设置
   * @param {Partial<UserPrivacy>} data
   */
  updatePrivacy: (data) => api.put('/users/privacy', data),

  // ===== 通知设置 =====

  /**
   * 获取通知设置
   * @returns {Promise<UserNotifications>}
   */
  getNotifications: async () => {
    const res = await api.get('/users/notification')
    return res.data
  },

  /**
   * 更新通知设置
   * @param {Partial<UserNotifications>} data
   */
  updateNotifications: (data) => api.put('/users/notification', data),

  /**
   * 更新通知设置（别名，用于兼容旧代码）
   * @param {Partial<UserNotifications>} data
   */
  updateNotification: (data) => api.put('/users/notification', data),

  /**
   * 重置通知设置为默认值
   */
  resetNotifications: () => api.put('/users/notification', DEFAULT_NOTIFICATION_SETTINGS),

  // ===== 界面偏好 =====

  /**
   * 获取界面偏好设置
   * @returns {Promise<UserPreferences>}
   */
  getPreferences: async () => {
    const res = await api.get('/users/preferences')
    return res.data
  },

  /**
   * 更新界面偏好设置
   * @param {Partial<UserPreferences>} data - { theme, fontSize, accentColor, ... }
   */
  updatePreferences: (data) => api.put('/users/preferences', data)
}
