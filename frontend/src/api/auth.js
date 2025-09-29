import api from './index'

export const authAPI = {
  // 用户登录
  login: (data) => api.post('/auth/login', data),
  
  // 用户注册
  register: (data) => api.post('/auth/register', data),
  
  // 用户登出
  logout: () => api.post('/auth/logout'),
  
  // 刷新token
  refreshToken: () => api.post('/auth/refresh'),
  
  // 获取用户信息
  getUserInfo: () => api.get('/users/me')
}