import api from './index'

export const userAPI = {
  // 获取用户信息
  getUserInfo: () => api.get('/users/me'),

  // 更新基本信息
  updateProfile: (data) => api.put('/users/profile', data),

  // 上传头像
  // 头像上传（通过更新 profile.avatar 字段）
  // avatarPayload 可以是图片 URL 或 data:image/...;base64,...
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

    // 兼容旧调用方：如果返回的是用户对象，则补充 data.url 字段
    if (res && res.data && !res.data.url && res.data.avatar) {
      res.data = {
        ...res.data,
        url: res.data.avatar
      }
    }

    return res
  },

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
