/**
 * OAuth 服务
 * 企业级 OAuth 2.0 登录实现
 * 支持微信和 QQ 第三方登录
 */

const crypto = require('crypto')
const redisClient = require('../redis-client')
const { OAuthConnection } = require('../models')
const tokenService = require('./tokenService')
const { encrypt, decrypt } = require('../utils/crypto')

// OAuth 配置
const OAUTH_CONFIG = {
  stateExpiry: parseInt(process.env.OAUTH_STATE_EXPIRY || 600), // 10分钟
  codeExpiry: parseInt(process.env.OAUTH_CODE_EXPIRY || 300),   // 5分钟
  qrExpiry: parseInt(process.env.OAUTH_QR_EXPIRY || 600)        // 10分钟
}

const logger = require('../utils/logger')

/**
 * 生成安全的 OAuth state
 * @returns {string} - 加密安全的随机 state
 */
function generateState() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 步骤1: 发起 OAuth 授权，获取授权 URL
 * @param {string} provider - OAuth 提供商 (wechat|qq)
 * @param {string} redirectUrl - 重定向 URL
 * @returns {Promise<Object>} - {state, authorizeUrl, expiresIn}
 */
async function initiateOAuth(provider, redirectUrl) {
  try {
    // 验证提供商
    if (!['wechat', 'qq'].includes(provider)) {
      throw new Error(`Unsupported OAuth provider: ${provider}`)
    }

    // 生成唯一 state
    const state = generateState()

    logger.info(`[OAuth] Initiating OAuth for provider: ${provider}, state: ${state.substr(0, 8)}...`)

    // 缓存 state 到 Redis
    await redisClient.saveSession(`oauth:state:${state}`, {
      provider,
      redirectUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    }, OAUTH_CONFIG.stateExpiry)

    // 调用对应提供商的 API 获取授权 URL
    let authorizeUrl
    if (provider === 'wechat') {
      const wechatOAuth = require('./wechatOAuthService')
      authorizeUrl = wechatOAuth.getAuthorizeUrl(state)
    } else if (provider === 'qq') {
      const qqOAuth = require('./qqOAuthService')
      authorizeUrl = qqOAuth.getAuthorizeUrl(state)
    }

    logger.info(`[OAuth] OAuth initiated successfully for ${provider}`)

    return {
      state,
      authorizeUrl,
      expiresIn: OAUTH_CONFIG.stateExpiry
    }
  } catch (error) {
    logger.error(`[OAuth] Failed to initiate OAuth: ${error.message}`)
    throw error
  }
}

/**
 * 步骤2: 生成二维码
 * @param {string} provider - OAuth 提供商
 * @param {string} state - OAuth state
 * @returns {Promise<Object>} - {qrCodeUrl, state, status}
 */
async function generateQRCode(provider, state) {
  try {
    // 验证 state
    const stateData = await redisClient.loadSession(`oauth:state:${state}`)
    if (!stateData) {
      throw new Error('Invalid or expired state')
    }

    if (stateData.provider !== provider) {
      throw new Error('Provider mismatch')
    }

    logger.info(`[OAuth] Generating QR code for ${provider}`)

    // 生成二维码 URL
    let qrCodeUrl
    if (provider === 'wechat') {
      const wechatOAuth = require('./wechatOAuthService')
      qrCodeUrl = wechatOAuth.getQRCodeUrl(state)
    } else if (provider === 'qq') {
      const qqOAuth = require('./qqOAuthService')
      qrCodeUrl = qqOAuth.getQRCodeUrl(state)
    }

    // 缓存二维码状态
    await redisClient.saveSession(`oauth:qr:${state}`, {
      qrCodeUrl,
      status: 'waiting',
      provider,
      createdAt: new Date().toISOString()
    }, OAUTH_CONFIG.qrExpiry)

    logger.info(`[OAuth] QR code generated for ${provider}`)

    return {
      qrCodeUrl,
      state,
      status: 'waiting'
    }
  } catch (error) {
    logger.error(`[OAuth] Failed to generate QR code: ${error.message}`)
    throw error
  }
}

/**
 * 步骤3: 轮询二维码扫描状态
 * @param {string} provider - OAuth 提供商
 * @param {string} state - OAuth state
 * @returns {Promise<Object>} - {status, scannedAt?, username?, avatar?}
 */
async function pollQRStatus(provider, state) {
  try {
    const qrData = await redisClient.loadSession(`oauth:qr:${state}`)

    if (!qrData) {
      logger.warn(`[OAuth] QR code not found or expired for state: ${state.substr(0, 8)}...`)
      return { status: 'expired' }
    }

    return {
      status: qrData.status,
      scannedAt: qrData.scannedAt,
      username: qrData.username,
      avatar: qrData.avatar
    }
  } catch (error) {
    logger.error(`[OAuth] Failed to poll QR status: ${error.message}`)
    throw error
  }
}

/**
 * 步骤4: 处理 OAuth 回调
 * @param {string} provider - OAuth 提供商
 * @param {string} code - OAuth code
 * @param {string} state - OAuth state
 * @returns {Promise<Object>} - {token, user, isNewUser}
 */
async function handleCallback(provider, code, state) {
  try {
    // 验证 state
    const stateData = await redisClient.loadSession(`oauth:state:${state}`)
    if (!stateData || stateData.provider !== provider) {
      throw new Error('Invalid state or provider mismatch')
    }

    logger.info(`[OAuth] Processing callback for ${provider}`)

    // 使用 code 换取 access_token 和用户信息
    let oauthResult
    if (provider === 'wechat') {
      const wechatOAuth = require('./wechatOAuthService')
      oauthResult = await wechatOAuth.exchangeCodeForToken(code)
    } else if (provider === 'qq') {
      const qqOAuth = require('./qqOAuthService')
      oauthResult = await qqOAuth.exchangeCodeForToken(code)
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const {
      accessToken,
      refreshToken: oauthRefreshToken,
      expiresIn,
      openid,
      unionid,
      userInfo
    } = oauthResult

    logger.info(`[OAuth] Got OAuth result for provider: ${provider}, openid: ${openid.substr(0, 8)}...`)

    // 查找或创建用户
    const { user, isNewUser } = await findOrCreateUser(
      provider,
      openid,
      unionid,
      userInfo
    )

    logger.info(`[OAuth] User ${isNewUser ? 'created' : 'found'}: ${user.id}`)

    // 保存或更新 OAuth 绑定关系
    await saveOAuthConnection(user.id, provider, {
      providerUserId: openid || unionid,
      providerUsername: userInfo.nickname,
      providerAvatar: userInfo.headimgurl || userInfo.figureurl,
      providerEmail: userInfo.email,
      accessToken: encrypt(accessToken),
      refreshToken: oauthRefreshToken ? encrypt(oauthRefreshToken) : null,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      rawData: userInfo
    })

    logger.info(`[OAuth] OAuth connection saved for user: ${user.id}`)

    // 生成 JWT token
    const jwtToken = tokenService.generateToken(user)

    // 清理 Redis 缓存
    await Promise.all([
      redisClient.deleteSession(`oauth:state:${state}`),
      redisClient.deleteSession(`oauth:qr:${state}`)
    ])

    logger.info(`[OAuth] OAuth callback completed successfully for user: ${user.id}`)

    return {
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        real_name: user.real_name,
        avatar: user.avatar,
        role: user.role
      },
      isNewUser
    }
  } catch (error) {
    logger.error(`[OAuth] Failed to handle callback: ${error.message}`)
    throw error
  }
}

/**
 * 查找或创建用户
 * @private
 */
async function findOrCreateUser(provider, openid, unionid, userInfo) {
  try {
    // 1. 尝试通过 provider + openid/unionid 查找已绑定的账号
    let connection = await OAuthConnection.findOne({
      where: {
        provider,
        provider_user_id: openid || unionid,
        is_active: true
      }
    })

    if (connection) {
      logger.info(`[OAuth] Found existing OAuth connection for user: ${connection.user_id}`)
      // 获取用户信息
      const user = await connection.getUser()
      return {
        user,
        isNewUser: false
      }
    }

    // 2. 创建新用户
    const { User } = require('../models')

    // 生成唯一用户名
    let username = `${provider}_${userInfo.nickname || openid.substr(0, 8)}`
    let counter = 1
    let isUnique = false

    while (!isUnique && counter < 100) {
      const existing = await User.findOne({ where: { username } })
      if (!existing) {
        isUnique = true
      } else {
        username = `${provider}_${userInfo.nickname || openid.substr(0, 8)}_${counter}`
        counter++
      }
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique username')
    }

    const user = await User.create({
      username,
      email: userInfo.email || null,
      real_name: userInfo.nickname,
      avatar: userInfo.headimgurl || userInfo.figureurl || null,
      status: 'active',
      role: 'user'
    })

    logger.info(`[OAuth] Created new user: ${user.id} for ${provider}`)

    return {
      user,
      isNewUser: true
    }
  } catch (error) {
    logger.error(`[OAuth] Failed to find or create user: ${error.message}`)
    throw error
  }
}

/**
 * 保存 OAuth 连接关系
 * @private
 */
async function saveOAuthConnection(userId, provider, connectionData) {
  try {
    const [connection, created] = await OAuthConnection.findOrCreate({
      where: {
        user_id: userId,
        provider
      },
      defaults: {
        ...connectionData,
        user_id: userId,
        provider,
        is_active: true
      }
    })

    if (!created) {
      // 更新现有连接
      await connection.update(connectionData)
      logger.info(`[OAuth] Updated existing OAuth connection for user: ${userId}`)
    } else {
      logger.info(`[OAuth] Created new OAuth connection for user: ${userId}`)
    }

    return connection
  } catch (error) {
    logger.error(`[OAuth] Failed to save OAuth connection: ${error.message}`)
    throw error
  }
}

/**
 * 账号绑定功能
 * 将第三方账号绑定到已登录的用户账号
 * @param {number} userId - 当前登录用户ID
 * @param {string} provider - OAuth 提供商
 * @param {string} code - OAuth code
 * @param {string} state - OAuth state
 * @returns {Promise<Object>}
 */
async function bindOAuthAccount(userId, provider, code, state) {
  try {
    // 验证 state
    const stateData = await redisClient.loadSession(`oauth:state:${state}`)
    if (!stateData) {
      throw new Error('Invalid or expired state')
    }

    logger.info(`[OAuth] Binding OAuth account for user: ${userId}, provider: ${provider}`)

    // 获取 OAuth 用户信息
    let oauthResult
    if (provider === 'wechat') {
      const wechatOAuth = require('./wechatOAuthService')
      oauthResult = await wechatOAuth.exchangeCodeForToken(code)
    } else if (provider === 'qq') {
      const qqOAuth = require('./qqOAuthService')
      oauthResult = await qqOAuth.exchangeCodeForToken(code)
    }

    // 检查是否已被其他用户绑定
    const existingConnection = await OAuthConnection.findOne({
      where: {
        provider,
        provider_user_id: oauthResult.openid || oauthResult.unionid,
        is_active: true
      }
    })

    if (existingConnection && existingConnection.user_id !== userId) {
      throw new Error('This OAuth account is already bound to another user')
    }

    // 保存或更新绑定关系
    await saveOAuthConnection(userId, provider, {
      providerUserId: oauthResult.openid || oauthResult.unionid,
      providerUsername: oauthResult.userInfo.nickname,
      providerAvatar: oauthResult.userInfo.headimgurl || oauthResult.userInfo.figureurl,
      providerEmail: oauthResult.userInfo.email,
      accessToken: encrypt(oauthResult.accessToken),
      refreshToken: oauthResult.refreshToken ? encrypt(oauthResult.refreshToken) : null,
      expiresAt: new Date(Date.now() + oauthResult.expiresIn * 1000),
      rawData: oauthResult.userInfo
    })

    logger.info(`[OAuth] Successfully bound ${provider} account for user: ${userId}`)

    // 清理 Redis 缓存
    await redisClient.deleteSession(`oauth:state:${state}`)

    return {
      success: true,
      provider,
      username: oauthResult.userInfo.nickname
    }
  } catch (error) {
    logger.error(`[OAuth] Failed to bind OAuth account: ${error.message}`)
    throw error
  }
}

/**
 * 解绑 OAuth 账号
 * @param {number} userId - 用户ID
 * @param {string} provider - OAuth 提供商
 * @returns {Promise<boolean>}
 */
async function unbindOAuthAccount(userId, provider) {
  try {
    logger.info(`[OAuth] Unbinding ${provider} account for user: ${userId}`)

    // 检查是否至少还有一个绑定的账号
    const activeConnections = await OAuthConnection.count({
      where: {
        user_id: userId,
        is_active: true
      }
    })

    if (activeConnections <= 1) {
      throw new Error('Cannot unbind the last OAuth account. Please keep at least one binding.')
    }

    // 软删除（标记为不活跃）
    const result = await OAuthConnection.update(
      { is_active: false },
      {
        where: {
          user_id: userId,
          provider,
          is_active: true
        }
      }
    )

    if (result[0] === 0) {
      throw new Error('OAuth account not found or already unbound')
    }

    logger.info(`[OAuth] Successfully unbound ${provider} account for user: ${userId}`)

    return true
  } catch (error) {
    logger.error(`[OAuth] Failed to unbind OAuth account: ${error.message}`)
    throw error
  }
}

/**
 * 获取用户的所有 OAuth 连接
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>}
 */
async function getUserOAuthConnections(userId) {
  try {
    const connections = await OAuthConnection.findAll({
      where: {
        user_id: userId,
        is_active: true
      },
      attributes: ['id', 'provider', 'provider_username', 'provider_avatar', 'provider_email', 'created_at']
    })

    return connections
  } catch (error) {
    logger.error(`[OAuth] Failed to get user OAuth connections: ${error.message}`)
    throw error
  }
}

module.exports = {
  generateState,
  initiateOAuth,
  generateQRCode,
  pollQRStatus,
  handleCallback,
  bindOAuthAccount,
  unbindOAuthAccount,
  getUserOAuthConnections
}
