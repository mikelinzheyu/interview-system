/**
 * Token 服务
 * 生成和验证“类 JWT”token（使用内置 crypto 实现，避免对 jsonwebtoken 的依赖）
 */

const crypto = require('crypto')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'

if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('⚠️  WARNING: JWT_SECRET is not configured. Using default insecure key. Please set JWT_SECRET in environment variables.')
}

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

const toBase64Url = (input) => {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

const fromBase64Url = (input) => {
  const padLength = (4 - (input.length % 4 || 4)) % 4
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength)
  return Buffer.from(base64, 'base64').toString('utf8')
}

const parseExpirySeconds = (value) => {
  if (!value) return DEFAULT_TTL_SECONDS

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    const match = trimmed.match(/^(\d+)([smhd])$/i)
    if (match) {
      const amount = parseInt(match[1], 10)
      const unit = match[2].toLowerCase()
      switch (unit) {
        case 's': return amount
        case 'm': return amount * 60
        case 'h': return amount * 60 * 60
        case 'd': return amount * 24 * 60 * 60
        default: break
      }
    }

    const asNumber = Number(trimmed)
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      return asNumber
    }
  }

  return DEFAULT_TTL_SECONDS
}

const signTokenPayload = (payload) => {
  const json = JSON.stringify(payload)
  const payloadPart = toBase64Url(json)

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payloadPart)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${payloadPart}.${signature}`
}

const decodeRawToken = (token, { verifySignature = false, ignoreExpiration = false } = {}) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required')
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    throw new Error('Invalid token format')
  }

  const [payloadPart, signaturePart] = parts

  if (verifySignature) {
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(payloadPart)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const expected = Buffer.from(expectedSignature)
    const actual = Buffer.from(signaturePart)

    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      throw new Error('Invalid token')
    }
  }

  let payload
  try {
    const json = fromBase64Url(payloadPart)
    payload = JSON.parse(json)
  } catch (error) {
    throw new Error('Failed to decode token')
  }

  if (!ignoreExpiration && payload.exp && typeof payload.exp === 'number') {
    const now = Math.floor(Date.now() / 1000)
    if (now >= payload.exp) {
      throw new Error('Token has expired')
    }
  }

  return payload
}

/**
 * 生成 token
 * @param {Object} user - 用户对象 {id, username, email, role}
 * @param {Object} options - 可选配置
 * @returns {string} - token 字符串
 */
function generateToken(user, options = {}) {
  if (!user || !user.id) {
    throw new Error('User object with id is required')
  }

  const now = Math.floor(Date.now() / 1000)
  const ttlSeconds = parseExpirySeconds(options.expiresIn || JWT_EXPIRY)

  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
    iat: now,
    exp: now + ttlSeconds,
    iss: options.issuer || 'interview-system',
    ...options.customPayload
  }

  return signTokenPayload(payload)
}

/**
 * 验证 token
 * @param {string} token
 * @returns {Object} - 解码后的 payload
 */
function verifyToken(token) {
  return decodeRawToken(token, { verifySignature: true, ignoreExpiration: false })
}

/**
 * 解码 token（不校验签名，仅用于读取信息）
 * @param {string} token
 * @returns {Object}
 */
function decodeToken(token) {
  return decodeRawToken(token, { verifySignature: false, ignoreExpiration: true })
}

/**
 * 刷新 token（生成新的 token）
 * @param {string} token - 旧 token
 * @param {Object} options - 可选配置
 * @returns {string} - 新 token
 */
function refreshToken(token, options = {}) {
  try {
    const decoded = decodeRawToken(token, { verifySignature: true, ignoreExpiration: true })

    const user = {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    }

    return generateToken(user, options)
  } catch (error) {
    throw new Error(`Failed to refresh token: ${error.message}`)
  }
}

/**
 * 检查 token 是否即将过期
 * @param {string} token
 * @param {number} bufferSeconds - 缓冲时间（秒），默认 5 分钟
 * @returns {boolean}
 */
function isTokenExpiringSoon(token, bufferSeconds = 300) {
  try {
    const decoded = decodeToken(token)
    if (!decoded.exp) {
      return false
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const expiryTime = decoded.exp

    return (expiryTime - currentTime) < bufferSeconds
  } catch (error) {
    return true
  }
}

/**
 * 获取 token 的剩余时间（秒）
 * @param {string} token
 * @returns {number|null}
 */
function getTokenExpiryTime(token) {
  try {
    const decoded = decodeToken(token)
    if (!decoded.exp) {
      return null
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const remainingTime = decoded.exp - currentTime

    return Math.max(0, remainingTime)
  } catch (error) {
    return null
  }
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken,
  isTokenExpiringSoon,
  getTokenExpiryTime
}

