/**
 * OAuth 路由
 * 处理 OAuth 登录流程的所有端点
 */

const express = require('express')
const router = express.Router()
const oauthService = require('../services/oauthService')
const rateLimit = require('express-rate-limit')
const logger = require('../utils/logger')

// 频率限制：OAuth 操作限制
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 限制20次请求
  message: 'Too many OAuth requests, please try again later',
  standardHeaders: true, // 返回 RateLimit-* 头
  legacyHeaders: false // 禁用 X-RateLimit-* 头
})

/**
 * 1. 发起 OAuth 授权
 * GET /api/auth/oauth/:provider/authorize
 * Query: redirect (默认 /dashboard)
 */
router.get('/:provider/authorize', oauthLimiter, async (req, res) => {
  try {
    const { provider } = req.params
    const { redirect } = req.query

    if (!['wechat', 'qq'].includes(provider)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid OAuth provider'
      })
    }

    logger.info(`[OAuth API] authorize request for ${provider}`)

    const result = await oauthService.initiateOAuth(provider, redirect || '/dashboard')

    res.json({
      code: 200,
      message: 'OAuth authorization initiated',
      data: result
    })
  } catch (error) {
    logger.error(`[OAuth API] authorize error: ${error.message}`)
    res.status(500).json({
      code: 500,
      message: error.message || 'Failed to initiate OAuth'
    })
  }
})

/**
 * 2. 获取二维码
 * GET /api/auth/oauth/:provider/qrcode
 * Query: state (必需)
 */
router.get('/:provider/qrcode', oauthLimiter, async (req, res) => {
  try {
    const { provider } = req.params
    const { state } = req.query

    if (!state) {
      return res.status(400).json({
        code: 400,
        message: 'State is required'
      })
    }

    if (!['wechat', 'qq'].includes(provider)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid OAuth provider'
      })
    }

    logger.info(`[OAuth API] qrcode request for ${provider}`)

    const result = await oauthService.generateQRCode(provider, state)

    res.json({
      code: 200,
      message: 'QR code generated',
      data: result
    })
  } catch (error) {
    logger.error(`[OAuth API] qrcode error: ${error.message}`)
    res.status(400).json({
      code: 400,
      message: error.message || 'Failed to generate QR code'
    })
  }
})

/**
 * 3. 轮询二维码扫描状态
 * GET /api/auth/oauth/:provider/poll
 * Query: state (必需)
 */
router.get('/:provider/poll', oauthLimiter, async (req, res) => {
  try {
    const { provider } = req.params
    const { state } = req.query

    if (!state) {
      return res.status(400).json({
        code: 400,
        message: 'State is required'
      })
    }

    if (!['wechat', 'qq'].includes(provider)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid OAuth provider'
      })
    }

    const result = await oauthService.pollQRStatus(provider, state)

    res.json({
      code: 200,
      message: 'QR status polled',
      data: result
    })
  } catch (error) {
    logger.error(`[OAuth API] poll error: ${error.message}`)
    res.status(400).json({
      code: 400,
      message: error.message || 'Failed to poll QR status'
    })
  }
})

/**
 * 4. OAuth 回调处理
 * POST /api/auth/oauth/:provider/callback
 * Body: { code, state }
 */
router.post('/:provider/callback', oauthLimiter, async (req, res) => {
  try {
    const { provider } = req.params
    const { code, state } = req.body

    if (!code || !state) {
      return res.status(400).json({
        code: 400,
        message: 'Code and state are required'
      })
    }

    if (!['wechat', 'qq'].includes(provider)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid OAuth provider'
      })
    }

    logger.info(`[OAuth API] callback for ${provider}`)

    const result = await oauthService.handleCallback(provider, code, state)

    res.json({
      code: 200,
      message: 'Login successful',
      data: result
    })
  } catch (error) {
    logger.error(`[OAuth API] callback error: ${error.message}`)
    res.status(401).json({
      code: 401,
      message: error.message || 'OAuth callback failed'
    })
  }
})

/**
 * 5. 账号绑定
 * POST /api/auth/oauth/:provider/bind
 * Headers: Authorization (Bearer token)
 * Body: { code, state }
 */
router.post('/:provider/bind', oauthLimiter, async (req, res) => {
  try {
    const { provider } = req.params
    const { code, state } = req.body

    // 验证用户认证
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Authentication required'
      })
    }

    if (!code || !state) {
      return res.status(400).json({
        code: 400,
        message: 'Code and state are required'
      })
    }

    if (!['wechat', 'qq'].includes(provider)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid OAuth provider'
      })
    }

    const tokenService = require('../services/tokenService')
    const tokenData = tokenService.verifyToken(token)

    logger.info(`[OAuth API] bind ${provider} for user ${tokenData.userId}`)

    const result = await oauthService.bindOAuthAccount(
      tokenData.userId,
      provider,
      code,
      state
    )

    res.json({
      code: 200,
      message: 'OAuth account bound successfully',
      data: result
    })
  } catch (error) {
    logger.error(`[OAuth API] bind error: ${error.message}`)
    res.status(error.message.includes('Authentication') ? 401 : 400).json({
      code: error.message.includes('Authentication') ? 401 : 400,
      message: error.message || 'Failed to bind OAuth account'
    })
  }
})

/**
 * 6. 账号解绑
 * POST /api/auth/oauth/:provider/unbind
 * Headers: Authorization (Bearer token)
 */
router.post('/:provider/unbind', oauthLimiter, async (req, res) => {
  try {
    const { provider } = req.params

    // 验证用户认证
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Authentication required'
      })
    }

    if (!['wechat', 'qq'].includes(provider)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid OAuth provider'
      })
    }

    const tokenService = require('../services/tokenService')
    const tokenData = tokenService.verifyToken(token)

    logger.info(`[OAuth API] unbind ${provider} for user ${tokenData.userId}`)

    await oauthService.unbindOAuthAccount(tokenData.userId, provider)

    res.json({
      code: 200,
      message: 'OAuth account unbound successfully'
    })
  } catch (error) {
    logger.error(`[OAuth API] unbind error: ${error.message}`)
    res.status(error.message.includes('Authentication') ? 401 : 400).json({
      code: error.message.includes('Authentication') ? 401 : 400,
      message: error.message || 'Failed to unbind OAuth account'
    })
  }
})

/**
 * 7. 获取用户的 OAuth 连接
 * GET /api/auth/oauth/connections
 * Headers: Authorization (Bearer token)
 */
router.get('/connections', async (req, res) => {
  try {
    // 验证用户认证
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Authentication required'
      })
    }

    const tokenService = require('../services/tokenService')
    const tokenData = tokenService.verifyToken(token)

    logger.info(`[OAuth API] get connections for user ${tokenData.userId}`)

    const connections = await oauthService.getUserOAuthConnections(tokenData.userId)

    res.json({
      code: 200,
      message: 'OAuth connections retrieved',
      data: connections
    })
  } catch (error) {
    logger.error(`[OAuth API] get connections error: ${error.message}`)
    res.status(error.message.includes('Authentication') ? 401 : 500).json({
      code: error.message.includes('Authentication') ? 401 : 500,
      message: error.message || 'Failed to get OAuth connections'
    })
  }
})

module.exports = router
