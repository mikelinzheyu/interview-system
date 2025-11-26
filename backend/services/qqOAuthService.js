/**
 * QQ OAuth 服务
 * 集成 QQ 互联的 OAuth 2.0 登录
 */

const axios = require('axios')
const qs = require('qs')
const logger = require('../utils/logger')

// QQ OAuth 配置
const QQ_CONFIG = {
  appId: process.env.QQ_APP_ID,
  appKey: process.env.QQ_APP_KEY,
  redirectUri: process.env.QQ_REDIRECT_URI,
  // 官方 API 端点
  authorizeUrl: 'https://graph.qq.com/oauth2.0/authorize',
  accessTokenUrl: 'https://graph.qq.com/oauth2.0/token',
  openIdUrl: 'https://graph.qq.com/oauth2.0/me',
  userInfoUrl: 'https://graph.qq.com/user/get_user_info'
}

// 验证配置
if (!QQ_CONFIG.appId || !QQ_CONFIG.appKey || !QQ_CONFIG.redirectUri) {
  logger.warn('⚠️  QQ OAuth configuration is incomplete. Set QQ_APP_ID, QQ_APP_KEY, QQ_REDIRECT_URI')
}

/**
 * 获取 QQ 授权 URL
 * @param {string} state - CSRF protection state
 * @returns {string} - 授权 URL
 */
function getAuthorizeUrl(state) {
  const params = {
    response_type: 'code',
    client_id: QQ_CONFIG.appId,
    redirect_uri: QQ_CONFIG.redirectUri,
    scope: 'get_user_info',
    state
  }

  const url = `${QQ_CONFIG.authorizeUrl}?${qs.stringify(params)}`
  logger.info(`[QQ] Authorization URL generated for state: ${state.substr(0, 8)}...`)

  return url
}

/**
 * 获取 QQ QR 码 URL
 * 返回用于在网页中显示的二维码内容
 * @param {string} state - CSRF protection state
 * @returns {string} - QR 码 URL
 */
function getQRCodeUrl(state) {
  // QQ 的 QR 码 URL 就是授权 URL
  // 前端可以使用 qrcode.js 库将这个 URL 转换成二维码图片
  return getAuthorizeUrl(state)
}

/**
 * 用 code 换取 access_token 和用户信息
 * @param {string} code - QQ 返回的授权码
 * @returns {Promise<Object>} - {accessToken, refreshToken, expiresIn, openid, unionid, userInfo}
 */
async function exchangeCodeForToken(code) {
  try {
    if (!code) {
      throw new Error('Code is required')
    }

    logger.info(`[QQ] Exchanging code for token...`)

    // 步骤1: 使用 code 换取 access_token
    const tokenParams = {
      grant_type: 'authorization_code',
      client_id: QQ_CONFIG.appId,
      client_secret: QQ_CONFIG.appKey,
      code,
      redirect_uri: QQ_CONFIG.redirectUri
    }

    const tokenResponse = await axios.get(QQ_CONFIG.accessTokenUrl, {
      params: tokenParams,
      timeout: 10000
    })

    // QQ API 返回格式是 query string，需要解析
    const tokenData = qs.parse(tokenResponse.data)

    if (tokenData.error) {
      throw new Error(`QQ API Error: ${tokenData.error_description}`)
    }

    const { access_token, refresh_token, expires_in } = tokenData

    logger.info(`[QQ] Got access_token, fetching openid...`)

    // 步骤2: 使用 access_token 获取 openid
    const openIdParams = {
      access_token,
      fmt: 'json'
    }

    const openIdResponse = await axios.get(QQ_CONFIG.openIdUrl, {
      params: openIdParams,
      timeout: 10000
    })

    if (openIdResponse.data.error) {
      throw new Error(`QQ API Error: ${openIdResponse.data.error_description}`)
    }

    const { openid, unionid } = openIdResponse.data

    logger.info(`[QQ] Got openid: ${openid.substr(0, 8)}...`)

    // 步骤3: 使用 openid 和 access_token 获取用户信息
    const userInfoParams = {
      access_token,
      oauth_consumer_key: QQ_CONFIG.appId,
      openid,
      format: 'json'
    }

    const userInfoResponse = await axios.get(QQ_CONFIG.userInfoUrl, {
      params: userInfoParams,
      timeout: 10000
    })

    if (userInfoResponse.data.ret !== 0) {
      throw new Error(`QQ API Error: ${userInfoResponse.data.msg}`)
    }

    const userInfo = {
      openid,
      unionid: unionid || null,
      nickname: userInfoResponse.data.nickname,
      figureurl: userInfoResponse.data.figureurl,
      figureurl_1: userInfoResponse.data.figureurl_1,
      figureurl_2: userInfoResponse.data.figureurl_2,
      figureurl_qq_1: userInfoResponse.data.figureurl_qq_1,
      figureurl_qq_2: userInfoResponse.data.figureurl_qq_2,
      gender: userInfoResponse.data.gender,
      province: userInfoResponse.data.province,
      city: userInfoResponse.data.city,
      year: userInfoResponse.data.year,
      constellation: userInfoResponse.data.constellation
    }

    logger.info(`[QQ] Got user info: ${userInfo.nickname}`)

    return {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresIn: parseInt(expires_in) || 7776000, // QQ 默认 90 天
      openid: userInfo.openid,
      unionid: userInfo.unionid,
      userInfo
    }
  } catch (error) {
    logger.error(`[QQ] Failed to exchange code: ${error.message}`)
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

    logger.info(`[QQ] Refreshing access token...`)

    const params = {
      grant_type: 'refresh_token',
      client_id: QQ_CONFIG.appId,
      client_secret: QQ_CONFIG.appKey,
      refresh_token: refreshToken
    }

    const response = await axios.get(QQ_CONFIG.accessTokenUrl, {
      params,
      timeout: 10000
    })

    const tokenData = qs.parse(response.data)

    if (tokenData.error) {
      throw new Error(`QQ API Error: ${tokenData.error_description}`)
    }

    const { access_token, refresh_token, expires_in } = tokenData

    logger.info(`[QQ] Access token refreshed successfully`)

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: parseInt(expires_in) || 7776000
    }
  } catch (error) {
    logger.error(`[QQ] Failed to refresh access token: ${error.message}`)
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
      oauth_consumer_key: QQ_CONFIG.appId,
      openid,
      format: 'json'
    }

    const response = await axios.get('https://graph.qq.com/oauth2.0/me', {
      params,
      timeout: 10000
    })

    // 如果没有返回 error 字段，说明 token 有效
    return !response.data.error
  } catch (error) {
    logger.warn(`[QQ] Failed to validate access token: ${error.message}`)
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
