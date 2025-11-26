import api from './index'
import { buildApiUrl } from '@/utils/networkConfig'

// 与 authAPI 保持一致的 Mock 开关：
// 默认启用 mock，只有在 VITE_USE_MOCK_DATA 显式设置为 'false' 时才关闭
const isMockAuthMode =
  (import.meta.env.VITE_USE_MOCK_DATA ?? 'true') !== 'false' ||
  import.meta.env.VITE_ENABLE_MOCK === 'true'

const createMockOAuthResponse = (provider) => {
  const now = Date.now()
  const suffix = Math.random().toString(36).slice(2, 8)
  const username = `${provider}_user_${suffix}`

  return {
    code: 200,
    message: `${provider.toUpperCase()} 登录成功 (mock)`,
    data: {
      token: `mock-token-${provider}-${now}-${suffix}`,
      user: {
        id: now % 100000,
        username,
        real_name: username,
        email: `${username}@example.com`,
        avatar: null,
        role: 'user'
      },
      isNewUser: false,
      provider
    }
  }
}

const createMockWeChatAuthorizeResponse = (redirectUrl) => {
  const state = `mock_wx_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

  return {
    code: 200,
    message: 'WeChat authorize URL (mock)',
    data: {
      state,
      authorizeUrl: buildApiUrl(
        `/api/auth/oauth/wechat/authorize?redirect=${encodeURIComponent(redirectUrl)}&state=${state}`
      ),
      expiresIn: 600
    }
  }
}

const createMockWeChatQRCodeResponse = (state) => {
  const scanUrl = buildApiUrl(`/api/auth/oauth/wechat/mock-scan?state=${encodeURIComponent(state)}`)

  return {
    code: 200,
    message: 'WeChat QR code (mock)',
    data: {
      qrCodeUrl: scanUrl,
      qrContent: scanUrl,
      state,
      tip: '开发环境：点击按钮模拟扫码授权'
    }
  }
}

const createMockQQAuthorizeResponse = (redirectUrl) => {
  const state = `mock_qq_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

  return {
    code: 200,
    message: 'QQ authorize URL (mock)',
    data: {
      state,
      authorizeUrl: buildApiUrl(
        `/api/auth/oauth/qq/authorize?redirect=${encodeURIComponent(redirectUrl)}&state=${state}`
      ),
      expiresIn: 600
    }
  }
}

const createMockQQQRCodeResponse = (state) => {
  const scanUrl = buildApiUrl(`/api/auth/oauth/qq/mock-scan?state=${encodeURIComponent(state)}`)

  return {
    code: 200,
    message: 'QQ QR code (mock)',
    data: {
      qrCodeUrl: scanUrl,
      qrContent: scanUrl,
      state,
      tip: '开发环境：点击按钮模拟扫码授权'
    }
  }
}

export const oauthAPI = {
  // 1. 获取微信授权 URL
  getWeChatAuthorizeUrl: (redirectUrl) => {
    if (isMockAuthMode) {
      return Promise.resolve(createMockWeChatAuthorizeResponse(redirectUrl))
    }
    return api.get('/auth/oauth/wechat/authorize', {
      params: { redirect: redirectUrl }
    })
  },

  // 2. 获取微信二维码
  getWeChatQRCode: (state) => {
    if (isMockAuthMode) {
      return Promise.resolve(createMockWeChatQRCodeResponse(state))
    }
    return api.get('/auth/oauth/wechat/qrcode', {
      params: { state }
    })
  },

  // 3. 轮询微信二维码状态
  pollWeChatQRStatus: (state) => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        data: { status: 'waiting' }
      })
    }
    return api.get('/auth/oauth/wechat/poll', {
      params: { state }
    })
  },

  // 4. 微信回调处理
  weChatCallback: (code, state) => {
    if (isMockAuthMode) {
      // 在 mock 模式下，直接返回登录成功结果，避免依赖后端接口
      return Promise.resolve(createMockOAuthResponse('wechat'))
    }
    return api.post('/auth/oauth/wechat/callback', { code, state })
  },

  // 5. 绑定微信账号
  bindWeChatAccount: (code, state) => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        message: 'WeChat account bound (mock)',
        data: { success: true, provider: 'wechat' }
      })
    }
    return api.post('/auth/oauth/wechat/bind', { code, state })
  },

  // 6. 解绑微信账号
  unbindWeChatAccount: () => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        message: 'WeChat account unbound (mock)'
      })
    }
    return api.post('/auth/oauth/wechat/unbind')
  },

  // 7. 获取 QQ 授权 URL
  getQQAuthorizeUrl: (redirectUrl) => {
    if (isMockAuthMode) {
      return Promise.resolve(createMockQQAuthorizeResponse(redirectUrl))
    }
    return api.get('/auth/oauth/qq/authorize', {
      params: { redirect: redirectUrl }
    })
  },

  // 8. 获取 QQ 二维码
  getQQQRCode: (state) => {
    if (isMockAuthMode) {
      return Promise.resolve(createMockQQQRCodeResponse(state))
    }
    return api.get('/auth/oauth/qq/qrcode', {
      params: { state }
    })
  },

  // 9. 轮询 QQ 二维码状态
  pollQQQRStatus: (state) => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        data: { status: 'waiting' }
      })
    }
    return api.get('/auth/oauth/qq/poll', {
      params: { state }
    })
  },

  // 10. QQ 回调处理
  qqCallback: (code, state) => {
    if (isMockAuthMode) {
      return Promise.resolve(createMockOAuthResponse('qq'))
    }
    return api.post('/auth/oauth/qq/callback', { code, state })
  },

  // 11. 绑定 QQ 账号
  bindQQAccount: (code, state) => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        message: 'QQ account bound (mock)',
        data: { success: true, provider: 'qq' }
      })
    }
    return api.post('/auth/oauth/qq/bind', { code, state })
  },

  // 12. 解绑 QQ 账号
  unbindQQAccount: () => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        message: 'QQ account unbound (mock)'
      })
    }
    return api.post('/auth/oauth/qq/unbind')
  },

  // 13. 获取用户的所有 OAuth 连接
  getOAuthConnections: () => {
    if (isMockAuthMode) {
      return Promise.resolve({
        code: 200,
        message: 'OAuth connections (mock)',
        data: []
      })
    }
    return api.get('/auth/oauth/connections')
  }
}
