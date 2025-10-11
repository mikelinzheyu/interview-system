/**
 * Redis 客户端配置和会话存储管理
 */
const redis = require('redis')

// Redis 配置
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  // 会话过期时间（秒）- 默认7天
  sessionTTL: process.env.REDIS_SESSION_TTL || 7 * 24 * 60 * 60
}

// 创建 Redis 客户端
let redisClient = null
let isRedisAvailable = false

/**
 * 初始化 Redis 客户端
 */
async function initRedisClient() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port
      },
      password: REDIS_CONFIG.password,
      database: REDIS_CONFIG.db
    })

    redisClient.on('error', (err) => {
      console.error('❌ Redis 客户端错误:', err)
      isRedisAvailable = false
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis 连接成功')
      isRedisAvailable = true
    })

    redisClient.on('ready', () => {
      console.log('🟢 Redis 客户端就绪')
      isRedisAvailable = true
    })

    await redisClient.connect()

    console.log('🔧 Redis 配置:', {
      host: REDIS_CONFIG.host,
      port: REDIS_CONFIG.port,
      db: REDIS_CONFIG.db,
      sessionTTL: `${REDIS_CONFIG.sessionTTL}秒 (${Math.floor(REDIS_CONFIG.sessionTTL / 86400)}天)`
    })

    return true
  } catch (error) {
    console.error('❌ Redis 初始化失败:', error.message)
    console.warn('⚠️  将使用内存存储作为降级方案')
    isRedisAvailable = false
    return false
  }
}

/**
 * 内存存储作为降级方案
 */
const memoryStorage = new Map()

/**
 * 保存会话数据到 Redis
 * @param {string} sessionId - 会话ID
 * @param {Object} sessionData - 会话数据
 * @returns {Promise<boolean>} - 是否成功
 */
async function saveSession(sessionId, sessionData) {
  const key = `interview:session:${sessionId}`
  const value = JSON.stringify({
    ...sessionData,
    updatedAt: new Date().toISOString()
  })

  try {
    if (isRedisAvailable && redisClient) {
      // 使用 Redis 存储
      await redisClient.setEx(key, REDIS_CONFIG.sessionTTL, value)
      console.log(`💾 会话已保存到 Redis: ${sessionId}`)
      return true
    } else {
      // 降级到内存存储
      memoryStorage.set(key, {
        value,
        expiresAt: Date.now() + (REDIS_CONFIG.sessionTTL * 1000)
      })
      console.log(`💾 会话已保存到内存: ${sessionId} (Redis不可用)`)
      return true
    }
  } catch (error) {
    console.error(`❌ 保存会话失败 (${sessionId}):`, error)
    // 降级到内存存储
    try {
      memoryStorage.set(key, {
        value,
        expiresAt: Date.now() + (REDIS_CONFIG.sessionTTL * 1000)
      })
      console.log(`💾 会话已保存到内存 (降级): ${sessionId}`)
      return true
    } catch (memError) {
      console.error(`❌ 内存保存也失败:`, memError)
      return false
    }
  }
}

/**
 * 从 Redis 加载会话数据
 * @param {string} sessionId - 会话ID
 * @returns {Promise<Object|null>} - 会话数据或null
 */
async function loadSession(sessionId) {
  const key = `interview:session:${sessionId}`

  try {
    if (isRedisAvailable && redisClient) {
      // 从 Redis 加载
      const value = await redisClient.get(key)
      if (value) {
        console.log(`📂 从 Redis 加载会话: ${sessionId}`)
        return JSON.parse(value)
      }
      return null
    } else {
      // 从内存加载
      const stored = memoryStorage.get(key)
      if (stored) {
        // 检查是否过期
        if (Date.now() < stored.expiresAt) {
          console.log(`📂 从内存加载会话: ${sessionId} (Redis不可用)`)
          return JSON.parse(stored.value)
        } else {
          // 已过期，删除
          memoryStorage.delete(key)
          console.log(`⏰ 会话已过期: ${sessionId}`)
          return null
        }
      }
      return null
    }
  } catch (error) {
    console.error(`❌ 加载会话失败 (${sessionId}):`, error)
    // 尝试从内存加载
    try {
      const stored = memoryStorage.get(key)
      if (stored && Date.now() < stored.expiresAt) {
        console.log(`📂 从内存加载会话 (降级): ${sessionId}`)
        return JSON.parse(stored.value)
      }
    } catch (memError) {
      console.error(`❌ 内存加载也失败:`, memError)
    }
    return null
  }
}

/**
 * 删除会话数据
 * @param {string} sessionId - 会话ID
 * @returns {Promise<boolean>} - 是否成功
 */
async function deleteSession(sessionId) {
  const key = `interview:session:${sessionId}`

  try {
    if (isRedisAvailable && redisClient) {
      await redisClient.del(key)
      console.log(`🗑️  已从 Redis 删除会话: ${sessionId}`)
    }
    // 同时删除内存中的备份
    memoryStorage.delete(key)
    return true
  } catch (error) {
    console.error(`❌ 删除会话失败 (${sessionId}):`, error)
    // 至少删除内存中的
    memoryStorage.delete(key)
    return false
  }
}

/**
 * 更新会话的TTL（延长过期时间）
 * @param {string} sessionId - 会话ID
 * @returns {Promise<boolean>} - 是否成功
 */
async function touchSession(sessionId) {
  const key = `interview:session:${sessionId}`

  try {
    if (isRedisAvailable && redisClient) {
      const result = await redisClient.expire(key, REDIS_CONFIG.sessionTTL)
      if (result) {
        console.log(`⏱️  已更新会话TTL: ${sessionId}`)
        return true
      }
    } else {
      // 内存存储中更新过期时间
      const stored = memoryStorage.get(key)
      if (stored) {
        stored.expiresAt = Date.now() + (REDIS_CONFIG.sessionTTL * 1000)
        return true
      }
    }
    return false
  } catch (error) {
    console.error(`❌ 更新会话TTL失败 (${sessionId}):`, error)
    return false
  }
}

/**
 * 获取所有会话ID（用于管理和调试）
 * @returns {Promise<string[]>} - 会话ID列表
 */
async function getAllSessionIds() {
  try {
    if (isRedisAvailable && redisClient) {
      const keys = await redisClient.keys('interview:session:*')
      return keys.map(key => key.replace('interview:session:', ''))
    } else {
      // 从内存获取
      const ids = []
      for (const [key, stored] of memoryStorage.entries()) {
        if (key.startsWith('interview:session:') && Date.now() < stored.expiresAt) {
          ids.push(key.replace('interview:session:', ''))
        }
      }
      return ids
    }
  } catch (error) {
    console.error('❌ 获取会话列表失败:', error)
    return []
  }
}

/**
 * 关闭 Redis 连接
 */
async function closeRedisClient() {
  if (redisClient) {
    try {
      await redisClient.quit()
      console.log('👋 Redis 连接已关闭')
    } catch (error) {
      console.error('❌ 关闭 Redis 连接失败:', error)
    }
  }
}

/**
 * 检查 Redis 是否可用
 */
function isRedisReady() {
  return isRedisAvailable
}

module.exports = {
  initRedisClient,
  saveSession,
  loadSession,
  deleteSession,
  touchSession,
  getAllSessionIds,
  closeRedisClient,
  isRedisReady
}
