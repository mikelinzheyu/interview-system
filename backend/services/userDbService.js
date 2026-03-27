/**
 * 用户数据库服务 - 封装与 users 表相关的直接 SQL 操作
 *
 * 说明：
 * - 不定义 Sequelize 模型，避免 sequelize.sync({ alter: true }) 擅自改动既有 users 表结构
 * - 仅通过原生 SQL 更新 avatar 字段，实现“真正落库”
 */

const sequelize = require('../config/database')
const fs = require('fs')
const path = require('path')

/**
 * 判断数据库错误是否由"列不存在"导致
 * 兼容 MySQL 和 PostgreSQL 两种错误信息
 * @param {Error} error
 * @returns {boolean}
 */
function isColumnMissingError(error) {
  if (!error) return false
  const msg = error.message || ''
  // MySQL: "Unknown column 'xxx'" or code ER_BAD_FIELD_ERROR
  if (msg.includes('Unknown column') || error.code === 'ER_BAD_FIELD_ERROR') {
    return true
  }
  // PostgreSQL: "column ... does not exist" or code 42703
  if (msg.includes('does not exist') || error.code === '42703') {
    return true
  }
  return false
}

/**
 * 更新指定用户的头像 URL
 * @param {number|string} userId - 用户 ID，要求为正整数
 * @param {string} avatarUrl - 头像 URL
 */
async function updateUserAvatar(userId, avatarUrl) {
  const numericId = Number(userId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    console.warn(`[UserDbService] Invalid userId for avatar update: ${userId} - skipping DB avatar update`)
    return
  }

  if (!avatarUrl || typeof avatarUrl !== 'string') {
    console.warn('[UserDbService] avatarUrl is required and must be a string - skipping DB avatar update')
    return
  }

  try {
    await sequelize.query(
      'UPDATE users SET avatar = :avatar, updated_at = NOW() WHERE id = :id',
      {
        replacements: { avatar: avatarUrl, id: numericId }
      }
    )
  } catch (error) {
    // In development / test environments the database may be unavailable
    // or the users table/avatar column might not exist yet. Since the
    // in-memory mock user is still updated by the caller, we log and
    // gracefully degrade instead of breaking the avatar upload flow.
    console.error('[UserDbService] Failed to persist avatar to DB, falling back to in-memory only avatar:', error.message)
  }
}

/**
 * 根据用户 ID 从数据库读取完整用户信息
 *（包括 username、real_name、avatar 等字段）
 * @param {number|string} userId
 * @returns {Promise<object|null>}
 */
async function getUserById(userId) {
  const numericId = Number(userId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error(`[UserDbService] Invalid userId for query: ${userId}`)
  }

  let rows
  try {
    // 第一次查询：尝试查询包含 nickname, gender, birthday 的完整字段集
    [rows] = await sequelize.query(
      `SELECT
         id,
         username,
         email,
         real_name,
         avatar,
         bio,
         phone,
         status,
         total_answered,
         correct_answered,
         accuracy_rate,
         study_time,
         interview_count,
         created_at,
         updated_at,
         nickname,
         gender,
         birthday
       FROM users
       WHERE id = :id
       LIMIT 1`,
      {
        replacements: { id: numericId }
      }
    )
  } catch (error) {
    // 如果是列不存在错误（settings_migration 未执行），降级为不查询新字段
    if (isColumnMissingError(error)) {
      console.warn(`[UserDbService] New columns (nickname/gender/birthday) not found, retrying without them:`, error.message)
      try {
        [rows] = await sequelize.query(
          `SELECT
             id,
             username,
             email,
             real_name,
             avatar,
             bio,
             phone,
             status,
             total_answered,
             correct_answered,
             accuracy_rate,
             study_time,
             interview_count,
             created_at,
             updated_at
           FROM users
           WHERE id = :id
           LIMIT 1`,
          {
            replacements: { id: numericId }
          }
        )
      } catch (retryError) {
        // 降级查询也失败，才向上抛
        throw retryError
      }
    } else {
      // 其他类型的 DB 错误直接向上抛
      throw error
    }
  }

  if (!rows || rows.length === 0) {
    return null
  }

  const row = rows[0]

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatar: row.avatar,
    bio: row.bio,
    phone: row.phone,
    status: row.status,
    // 同时提供下划线风格和驼峰风格，兼容前端/其他后端
    real_name: row.real_name,
    realName: row.real_name,
    nickname: row.nickname || null,
    gender: row.gender || 'secret',
    birthday: row.birthday || null,
    total_answered: row.total_answered,
    totalAnswered: row.total_answered,
    correct_answered: row.correct_answered,
    correctAnswered: row.correct_answered,
    accuracy_rate: row.accuracy_rate,
    accuracyRate: row.accuracy_rate,
    study_time: row.study_time,
    studyTime: row.study_time,
    interview_count: row.interview_count,
    interviewCount: row.interview_count,
    created_at: row.created_at,
    createdAt: row.created_at,
    updated_at: row.updated_at,
    updatedAt: row.updated_at
  }
}

/**
 * 更新当前用户基础资料（用户名 / 真实姓名 / 简介 / 手机号 / 头像 / 昵称 / 性别 / 生日）
 * 仅更新请求体中提供的字段
 *
 * @param {number|string} userId
 * @param {object} profile
 * @returns {Promise<object|null>} 更新后的用户信息
 */
async function updateUserProfile(userId, profile = {}) {
  const numericId = Number(userId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error(`[UserDbService] Invalid userId for profile update: ${userId}`)
  }

  const fields = {}

  if (typeof profile.username === 'string' && profile.username.trim()) {
    fields.username = profile.username.trim()
  }

  const realName = profile.real_name || profile.realName
  if (typeof realName === 'string' && realName.trim()) {
    fields.real_name = realName.trim()
  }

  const bio = profile.bio || profile.signature
  if (typeof bio === 'string') {
    fields.bio = bio
  }

  if (typeof profile.phone === 'string' && profile.phone.trim()) {
    fields.phone = profile.phone.trim()
  }

  // nickname: 允许空字符串（用户清空昵称）
  if (typeof profile.nickname === 'string') {
    fields.nickname = profile.nickname.trim()
  }

  // gender: 枚举校验
  if (typeof profile.gender === 'string') {
    const VALID_GENDERS = ['male', 'female', 'secret']
    if (VALID_GENDERS.includes(profile.gender)) {
      fields.gender = profile.gender
    }
  }

  // birthday: 允许空字符串（存为 NULL）
  if (typeof profile.birthday === 'string') {
    fields.birthday = profile.birthday.trim() || null
  }

  // avatar 字段支持两种形式：
  // 1) 直接传 URL 字符串
  // 2) 传 data:image/...;base64,... ，后端自动落盘并生成 URL
  if (typeof profile.avatar === 'string' && profile.avatar.trim()) {
    const avatarRaw = profile.avatar.trim()

    if (avatarRaw.startsWith('data:image')) {
      try {
        const matches = avatarRaw.match(/^data:(image\/\w+);base64,(.+)$/)
        if (!matches) {
          throw new Error('Invalid data URL format for avatar')
        }

        const mimeType = matches[1]
        const base64Data = matches[2]
        const ext = (mimeType.split('/')[1] || 'png').toLowerCase()

        const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars')
        fs.mkdirSync(avatarsDir, { recursive: true })

        const filename = `avatar_${numericId}_${Date.now()}.${ext}`
        const filePath = path.join(avatarsDir, filename)
        const buffer = Buffer.from(base64Data, 'base64')
        fs.writeFileSync(filePath, buffer)

        // 与 Node 后端静态目录 /api/uploads 对应
        fields.avatar = `/api/uploads/avatars/${filename}`
      } catch (error) {
        console.error('[UserDbService] Failed to process avatar data URL, falling back to raw value:', error.message)
        fields.avatar = avatarRaw
      }
    } else {
      // 已是 URL，直接写入
      fields.avatar = avatarRaw
    }
  }

  const fieldKeys = Object.keys(fields)

  if (fieldKeys.length === 0) {
    // 没有需要更新的字段，直接返回当前数据库中的用户
    return await getUserById(numericId)
  }

  const setClauses = fieldKeys.map(key => `${key} = :${key}`)

  const sql = `
    UPDATE users
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = :id
  `

  try {
    await sequelize.query(sql, {
      replacements: {
        ...fields,
        id: numericId
      }
    })
  } catch (error) {
    // 如果因新字段不存在而失败，剔除新字段后重试
    if (isColumnMissingError(error)) {
      console.warn('[UserDbService] New columns not found, retrying without nickname/gender/birthday:', error.message)

      const oldFields = {}
      const oldFieldKeys = []
      for (const key of fieldKeys) {
        if (!['nickname', 'gender', 'birthday'].includes(key)) {
          oldFields[key] = fields[key]
          oldFieldKeys.push(key)
        }
      }

      if (oldFieldKeys.length > 0) {
        const oldSetClauses = oldFieldKeys.map(key => `${key} = :${key}`)
        const oldSql = `
          UPDATE users
          SET ${oldSetClauses.join(', ')}, updated_at = NOW()
          WHERE id = :id
        `
        try {
          await sequelize.query(oldSql, {
            replacements: {
              ...oldFields,
              id: numericId
            }
          })
        } catch (retryError) {
          console.error('[UserDbService] Failed to update profile with fallback query:', retryError.message)
          // 继续执行，不抛出错误 - 允许内存中的数据被返回
        }
      }
    } else {
      // 对于其他数据库错误（连接失败等），也优雅降级而不是抛出错误
      console.error('[UserDbService] Database error during profile update (falling back to in-memory):', error.message)
      // 不向上抛，继续执行 - 这样可以返回内存中的数据
    }
  }

  // 尝试从数据库读取更新后的数据
  // 如果数据库不可用，返回 null（上层会处理）
  try {
    return await getUserById(numericId)
  } catch (error) {
    console.error('[UserDbService] Failed to retrieve updated profile:', error.message)
    return null
  }
}

/**
 * 获取用户隐私设置
 * @param {number|string} userId
 * @returns {Promise<object|null>}
 */
async function getUserPrivacySettings(userId) {
  const numericId = Number(userId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error(`[UserDbService] Invalid userId for privacy settings query: ${userId}`)
  }

  try {
    const [rows] = await sequelize.query(
      'SELECT privacy_settings FROM users WHERE id = :id LIMIT 1',
      {
        replacements: { id: numericId }
      }
    )

    if (!rows || rows.length === 0 || !rows[0].privacy_settings) {
      return null
    }

    return JSON.parse(rows[0].privacy_settings)
  } catch (error) {
    if (isColumnMissingError(error)) {
      console.warn('[UserDbService] privacy_settings column not found:', error.message)
      return null
    }
    throw error
  }
}

/**
 * 更新用户隐私设置
 * @param {number|string} userId
 * @param {object} settings - 隐私设置对象
 * @returns {Promise<void>}
 */
async function updateUserPrivacySettings(userId, settings) {
  const numericId = Number(userId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error(`[UserDbService] Invalid userId for privacy settings update: ${userId}`)
  }

  if (typeof settings !== 'object' || settings === null) {
    throw new Error('[UserDbService] settings must be an object')
  }

  const jsonStr = JSON.stringify(settings)

  try {
    await sequelize.query(
      'UPDATE users SET privacy_settings = :jsonStr, updated_at = NOW() WHERE id = :id',
      {
        replacements: { jsonStr, id: numericId }
      }
    )
  } catch (error) {
    if (isColumnMissingError(error)) {
      console.warn('[UserDbService] privacy_settings column not found, skipping DB persist:', error.message)
      return
    }
    throw error
  }
}

/**
 * 获取用户界面偏好设置
 * @param {number|string} userId
 * @returns {Promise<object|null>}
 */
async function getUserPreferences(userId) {
  const numericId = Number(userId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error(`[UserDbService] Invalid userId for preferences query: ${userId}`)
  }

  try {
    const [rows] = await sequelize.query(
      'SELECT preferences FROM users WHERE id = :id LIMIT 1',
      {
        replacements: { id: numericId }
      }
    )

    if (!rows || rows.length === 0 || !rows[0].preferences) {
      return null
    }

    return JSON.parse(rows[0].preferences)
  } catch (error) {
    if (isColumnMissingError(error)) {
      console.warn('[UserDbService] preferences column not found:', error.message)
      return null
    }
    throw error
  }
}

/**
 * 更新用户界面偏好设置
 * @param {number|string} userId
 * @param {object} pref - 偏好设置对象
 * @returns {Promise<void>}
 */
async function updateUserPreferences(userId, pref) {
  const numericId = Number(userId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error(`[UserDbService] Invalid userId for preferences update: ${userId}`)
  }

  if (typeof pref !== 'object' || pref === null) {
    throw new Error('[UserDbService] pref must be an object')
  }

  const jsonStr = JSON.stringify(pref)

  try {
    await sequelize.query(
      'UPDATE users SET preferences = :jsonStr, updated_at = NOW() WHERE id = :id',
      {
        replacements: { jsonStr, id: numericId }
      }
    )
  } catch (error) {
    if (isColumnMissingError(error)) {
      console.warn('[UserDbService] preferences column not found, skipping DB persist:', error.message)
      return
    }
    throw error
  }
}

module.exports = {
  updateUserAvatar,
  getUserById,
  updateUserProfile,
  getUserPrivacySettings,
  updateUserPrivacySettings,
  getUserPreferences,
  updateUserPreferences
}
