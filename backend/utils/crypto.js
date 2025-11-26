/**
 * 加密解密工具
 * 用于加密存储 OAuth token 和敏感信息
 */

const crypto = require('crypto')

// 加密算法和密钥配置
const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : crypto.scryptSync(process.env.JWT_SECRET || 'default-secret', 'salt', 32)

// 验证加密密钥
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required or JWT_SECRET must be set')
}

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
}

/**
 * 加密字符串
 * @param {string} text - 要加密的文本
 * @returns {string} - 加密后的字符串 (iv:authTag:encrypted)
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to encrypt must be a non-empty string')
  }

  try {
    // 生成随机 IV
    const iv = crypto.randomBytes(16)

    // 创建密码
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

    // 加密数据
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // 获取认证标签
    const authTag = cipher.getAuthTag()

    // 返回 IV:authTag:encrypted 格式
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`)
  }
}

/**
 * 解密字符串
 * @param {string} encryptedData - 加密的数据 (iv:authTag:encrypted 格式)
 * @returns {string} - 解密后的文本
 */
function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a non-empty string')
  }

  try {
    // 解析 IV、authTag 和加密数据
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':')

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format. Expected format: iv:authTag:encrypted')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    // 创建解密器
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

    // 设置认证标签
    decipher.setAuthTag(authTag)

    // 解密数据
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`)
  }
}

/**
 * 生成随机密钥（用于初始化配置）
 * @returns {string} - 64位十六进制字符串
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 生成安全的随机 token
 * @param {number} length - token 长度（字节数）
 * @returns {string} - 十六进制 token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * 生成 HMAC 签名
 * @param {string} data - 要签名的数据
 * @param {string} secret - 密钥
 * @returns {string} - 十六进制签名
 */
function hmacSign(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
}

/**
 * 验证 HMAC 签名
 * @param {string} data - 原始数据
 * @param {string} signature - 签名
 * @param {string} secret - 密钥
 * @returns {boolean} - 签名是否有效
 */
function hmacVerify(data, signature, secret) {
  const expectedSignature = hmacSign(data, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
  generateSecureToken,
  hmacSign,
  hmacVerify
}
