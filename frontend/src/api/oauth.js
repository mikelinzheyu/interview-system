import api from './index'

export const oauthAPI = {
  // 获取微信授权URL
  getWeChatAuthorizeUrl: (redirectUrl) => api.get('/auth/oauth/wechat/authorize', {
    params: { redirect: redirectUrl }
  }),

  // 获取微信二维码
  getWeChatQRCode: (state) => api.get('/auth/oauth/wechat/qrcode', {
    params: { state }
  }),

  // 微信回调处理
  weChatCallback: (code, state) => api.post('/auth/oauth/wechat/callback', { code, state }),

  // QQ授权URL
  getQQAuthorizeUrl: (redirectUrl) => api.get('/auth/oauth/qq/authorize', {
    params: { redirect: redirectUrl }
  }),

  // 获取QQ二维码
  getQQQRCode: (state) => api.get('/auth/oauth/qq/qrcode', {
    params: { state }
  }),

  // QQ回调处理
  qqCallback: (code, state) => api.post('/auth/oauth/qq/callback', { code, state })
}