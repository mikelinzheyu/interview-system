import api from './index'

export const authAPI = {
  // 用户名密码登录
  login: (data) => api.post('/auth/login', data),

  // 短信验证码登录
  loginBySms: (data) => api.post('/auth/login/sms', data),

  // 发送短信验证码
  sendSmsCode: (phone) => api.post('/auth/sms/send', { phone }),

  // 用户注册
  register: (data) => api.post('/auth/register', data),

  // 用户登出
  logout: () => api.post('/auth/logout'),

  // 刷新token
  refreshToken: () => api.post('/auth/refresh'),

  // 获取用户信息
  getUserInfo: () => api.get('/users/me'),

  // 忘记密码 - 发送验证码
  sendResetCode: (phone) => api.post('/auth/password/reset/send', { phone }),

  // 忘记密码 - 验证验证码
  verifyResetCode: (data) => api.post('/auth/password/reset/verify', data),

  // 忘记密码 - 验证码验证并重置密码
  resetPassword: (data) => api.post('/auth/password/reset', data)
}