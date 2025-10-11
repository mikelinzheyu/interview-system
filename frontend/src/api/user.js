import api from './index'

export const userAPI = {
  // 获取用户信息
  getUserInfo: () => api.get('/users/me'),

  // 更新基本信息
  updateProfile: (data) => api.put('/users/profile', data),

  // 上传头像
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // 修改密码
  changePassword: (data) => api.put('/users/password', data),

  // 绑定/更换手机号
  bindPhone: (data) => api.post('/users/phone/bind', data),

  // 绑定/更换邮箱
  bindEmail: (data) => api.post('/users/email/bind', data),

  // 发送验证码（手机）
  sendPhoneCode: (phone) => api.post('/users/phone/code', { phone }),

  // 发送验证码（邮箱）
  sendEmailCode: (email) => api.post('/users/email/code', { email }),

  // 隐私设置
  updatePrivacy: (data) => api.put('/users/privacy', data),

  // 通知设置
  updateNotification: (data) => api.put('/users/notification', data),

  // 界面设置
  updatePreferences: (data) => api.put('/users/preferences', data),

  // 两步验证
  enableTwoFactor: (data) => api.post('/users/2fa/enable', data),
  disableTwoFactor: (data) => api.post('/users/2fa/disable', data),

  // 登录设备管理
  getLoginDevices: () => api.get('/users/devices'),
  removeDevice: (deviceId) => api.delete(`/users/devices/${deviceId}`),

  // 注销账户
  deleteAccount: (data) => api.post('/users/account/delete', data)
}
