/**
 * 微信 OAuth 服务
 * 集成微信开放平台的 OAuth 2.0 登录
 */

const axios = require('axios')
const qs = require('qs')
const logger = require('../utils/logger')

// 微信 OAuth 配置
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  redirectUri: process.env.WECHAT_REDIRECT_URI,
  // 官方 API 端点
  authorizeUrl: 'https://open.weixin.qq.com/connect/qrconnect',
  accessTokenUrl: 'https://api.weixin.qq.com/sns/oauth2/access_token',
  userInfoUrl: 'https://api.weixin.qq.com/sns/userinfo'
}

// 验证配置
if (!WECHAT_CONFIG.appId || !WECHAT_CONFIG.appSecret || !WECHAT_CONFIG.redirectUri) {
  logger.warn('⚠️  WeChat OAuth configuration is incomplete. Set WECHAT_APP_ID, WECHAT_APP_SECRET, WECHAT_REDIRECT_URI')
}

/**
 * 获取微信授权 URL
 * @param {string} state - CSRF protection state
 * @returns {string} - 授权 URL
 */
function getAuthorizeUrl(state) {
  const params = {
    appid: WECHAT_CONFIG.appId,
    redirect_uri: WECHAT_CONFIG.redirectUri,
    response_type: 'code',
    scope: 'snsapi_login',
    state,
    '#wechat_redirect': '' // 微信特殊要求
  }

  const url = `${WECHAT_CONFIG.authorizeUrl}?${qs.stringify(params)}`
  logger.info(`[WeChat] Authorization URL generated for state: ${state.substr(0, 8)}...`)

  return url
}

/**
 * 获取微信 QR 码 URL
 * 返回用于在网页中显示的二维码内容
 * @param {string} state - CSRF protection state
 * @returns {string} - QR 码 URL
 */
function getQRCodeUrl(state) {
  // 微信的 QR 码 URL 就是授权 URL
  // 前端可以使用 qrcode.js 库将这个 URL 转换成二维码图片
  return getAuthorizeUrl(state)
}

/**
 * 用 code 换取 access_token 和用户信息
 * @param {string} code - 微信返回的授权码
 * @returns {Promise<Object>} - {accessToken, refreshToken, expiresIn, openid, unionid, userInfo}
 */
async function exchangeCodeForToken(code) {
  try {
    if (!code) {
      throw new Error('Code is required')
    }

    logger.info(`[WeChat] Exchanging code for token...`)

    // 步骤1: 使用 code 换取 access_token
    const tokenParams = {
      appid: WECHAT_CONFIG.appId,
      secret: WECHAT_CONFIG.appSecret,
      code,
      grant_type: 'authorization_code'
    }

    const tokenResponse = await axios.get(WECHAT_CONFIG.accessTokenUrl, {
      params: tokenParams,
      timeout: 10000
    })

    if (tokenResponse.data.errcode) {
      throw new Error(`WeChat API Error: ${tokenResponse.data.errmsg}`)
    }

    const { access_token, refresh_token, expires_in, openid, unionid } = tokenResponse.data

    logger.info(`[WeChat] Got access_token for openid: ${openid.substr(0, 8)}...`)

    // 步骤2: 使用 access_token 获取用户信息
    const userInfoParams = {
      access_token,
      openid,
      lang: 'zh_CN'
    }

    const userInfoResponse = await axios.get(WECHAT_CONFIG.userInfoUrl, {
      params: userInfoParams,
      timeout: 10000
    })

    if (userInfoResponse.data.errcode) {
      throw new Error(`WeChat API Error: ${userInfoResponse.data.errmsg}`)
    }

    const userInfo = {
      openid: userInfoResponse.data.openid,
      unionid: userInfoResponse.data.unionid || unionid,
      nickname: userInfoResponse.data.nickname,
      headimgurl: userInfoResponse.data.headimgurl,
      sex: userInfoResponse.data.sex,
      province: userInfoResponse.data.province,
      city: userInfoResponse.data.city,
      country: userInfoResponse.data.country,
      privilege: userInfoResponse.data.privilege
    }

    logger.info(`[WeChat] Got user info: ${userInfo.nickname}`)

    return {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresIn: expires_in || 7200,
      openid: userInfo.openid,
      unionid: userInfo.unionid,
      userInfo
    }
  } catch (error) {
    logger.error(`[WeChat] Failed to exchange code: ${error.message}`)
    throw error
  }
}

/**
 * 刷新 access_token
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise<Object>} - {accessToken, refreshToken, expiresIn}
 */
async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken) {
      throw new Error('Refresh token is required')
    }

    logger.info(`[WeChat] Refreshing access token...`)

    const params = {
      appid: WECHAT_CONFIG.appId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }

    const response = await axios.get(WECHAT_CONFIG.accessTokenUrl, {
      params,
      timeout: 10000
    })

    if (response.data.errcode) {
      throw new Error(`WeChat API Error: ${response.data.errmsg}`)
    }

    const { access_token, refresh_token, expires_in } = response.data

    logger.info(`[WeChat] Access token refreshed successfully`)

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in || 7200
    }
  } catch (error) {
    logger.error(`[WeChat] Failed to refresh access token: ${error.message}`)
    throw error
  }
}

/**
 * 验证 access_token 是否有效
 * @param {string} accessToken - 访问令牌
 * @param {string} openid - 用户 openid
 * @returns {Promise<boolean>}
 */
async function validateAccessToken(accessToken, openid) {
  try {
    const params = {
      access_token: accessToken,
      openid
    }

    const response = await axios.get('https://api.weixin.qq.com/sns/auth', {
      params,
      timeout: 10000
    })

    // errcode 为 0 表示有效
    return response.data.errcode === 0
  } catch (error) {
    logger.warn(`[WeChat] Failed to validate access token: ${error.message}`)
    return false
  }
}

module.exports = {
  getAuthorizeUrl,
  getQRCodeUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  validateAccessToken
}
