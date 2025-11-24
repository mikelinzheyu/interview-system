import api from './index'

const isMockAuthMode =
  (import.meta.env.VITE_USE_MOCK_DATA ?? 'true') !== 'false' ||
  import.meta.env.VITE_ENABLE_MOCK === 'true'

const createMockAuthResponse = (payload = {}) => {
  const now = Date.now()
  const username = payload.username || payload.phone || 'mock_user'

  return {
    code: 200,
    message: 'Login successful (mock)',
    data: {
      token: `mock-token-${now}-${Math.random().toString(36).slice(2, 8)}`,
      user: {
        id: 1,
        username,
        real_name: username,
        email: `${username}@example.com`,
        avatar: null,
        role: 'user'
      }
    }
  }
}

export const authAPI = {
  // 用户名密码登录
  login: (data) => {
    if (isMockAuthMode) {
      return Promise.resolve(createMockAuthResponse(data))
    }
    return api.post('/auth/login', data)
  },

  // 短信验证码登录
  loginBySms: (data) => {
    if (isMockAuthMode) {
      return Promise.resolve(createMockAuthResponse({ phone: data?.phone || 'mock_phone' }))
    }
    return api.post('/auth/login/sms', data)
  },

  // 发送短信验证码
  sendSmsCode: (phone) => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        message: 'SMS code sent (mock)',
        data: { phone, message: 'Development mode - use code: 123456' }
      })
    }
    return api.post('/auth/sms/send', { phone })
  },

  // 用户注册
  register: (data) => {
    if (isMockAuthMode) {
      return Promise.resolve(createMockAuthResponse(data))
    }
    return api.post('/auth/register', data)
  },

  // 用户登出
  logout: () => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        message: 'Logout successful (mock)'
      })
    }
    return api.post('/auth/logout')
  },

  // 刷新 token
  refreshToken: () => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        message: 'Token refreshed (mock)',
        data: {
          token: `mock-token-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        }
      })
    }
    return api.post('/auth/refresh')
  },

  // 获取用户信息（仍通过真实 API，交由 userAPI/fetchUserInfo 统一处理）
  getUserInfo: () => api.get('/users/me'),

  // 忘记密码 - 发送验证码
  sendResetCode: (phone) => api.post('/auth/password/reset/send', { phone }),

  // 忘记密码 - 校验验证码
  verifyResetCode: (data) => api.post('/auth/password/reset/verify', data),

  // 忘记密码 - 重置密码
  resetPassword: (data) => api.post('/auth/password/reset', data)
}

