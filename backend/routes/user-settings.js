const express = require('express')
const router = express.Router()
const { getControllers } = require('../services/dataService')
const {
  updateUserProfile,
  getUserPrivacySettings,
  updateUserPrivacySettings,
  getUserPreferences,
  updateUserPreferences
} = require('../services/userDbService')

// Middleware to get user ID (assuming auth middleware runs before this)
// In api.js: router.use('/users', userSettingsRouter)
// So paths here are relative to /api/users

// ===== 添加日志中间件，用于调试 =====
router.use((req, res, next) => {
  console.log('[user-settings] Incoming request:', {
    method: req.method,
    path: req.path,
    hasReqUser: !!req.user,
    userId: req.user?.id
  })
  next()
})

// ==================== Password & Security ====================

// PUT /users/password
router.put('/password', (req, res) => {
  const { oldPassword, newPassword } = req.body
  // Mock check: accept any old password for now
  res.json({
    code: 200,
    message: 'Password updated successfully'
  })
})

// POST /users/phone/code
router.post('/phone/code', (req, res) => {
  // Mock: just return success
  res.json({
    code: 200,
    message: 'Verification code sent'
  })
})

// POST /users/email/code
router.post('/email/code', (req, res) => {
  res.json({
    code: 200,
    message: 'Verification code sent'
  })
})

// POST /users/phone/bind
router.post('/phone/bind', (req, res) => {
  const { phone, code } = req.body
  if (code !== '123456') { // Mock validation
    // return res.status(400).json({ code: 400, message: 'Invalid code' })
  }
  
  // Update user profile
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)
  if (user) {
    user.phone = phone
    user.phoneVerified = true
  }

  res.json({
    code: 200,
    message: 'Phone bound successfully'
  })
})

// POST /users/email/bind
router.post('/email/bind', (req, res) => {
  const { email, code } = req.body
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)
  if (user) {
    user.email = email
    user.emailVerified = true
  }

  res.json({
    code: 200,
    message: 'Email bound successfully'
  })
})

// POST /users/2fa/enable
router.post('/2fa/enable', async (req, res) => {
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)
  if (user) user.isTwoFactorEnabled = true

  // 持久化到数据库
  try {
    await updateUserProfile(req.user.id, { isTwoFactorEnabled: true })
  } catch (dbError) {
    console.error('[2FA Enable] DB persist error:', dbError.message)
    // 不影响响应，但记录日志
  }

  // 返回完整的 security 信息
  const security = {
    isTwoFactorEnabled: user?.isTwoFactorEnabled ?? false,
    phoneNumber: user?.phone || '',
    phoneVerified: !!user?.phoneVerified,
    email: user?.email || '',
    emailVerified: !!user?.emailVerified,
    lastPasswordChange: new Date(Date.now() - 100000000).toISOString(),
    loginDevices: []
  }

  res.json({ code: 200, data: security })
})

// POST /users/2fa/disable
router.post('/2fa/disable', async (req, res) => {
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)
  if (user) user.isTwoFactorEnabled = false

  // 持久化到数据库
  try {
    await updateUserProfile(req.user.id, { isTwoFactorEnabled: false })
  } catch (dbError) {
    console.error('[2FA Disable] DB persist error:', dbError.message)
    // 不影响响应，但记录日志
  }

  // 返回完整的 security 信息
  const security = {
    isTwoFactorEnabled: user?.isTwoFactorEnabled ?? false,
    phoneNumber: user?.phone || '',
    phoneVerified: !!user?.phoneVerified,
    email: user?.email || '',
    emailVerified: !!user?.emailVerified,
    lastPasswordChange: new Date(Date.now() - 100000000).toISOString(),
    loginDevices: []
  }

  res.json({ code: 200, data: security })
})

// GET /users/devices
router.get('/devices', (req, res) => {
  // Mock devices
  const devices = [
    {
      id: 'dev_1',
      deviceName: 'Chrome on Windows',
      browser: 'Chrome 120.0',
      os: 'Windows 10',
      lastActiveAt: new Date().toISOString(),
      ipAddress: '192.168.1.101'
    },
    {
      id: 'dev_2',
      deviceName: 'Safari on iPhone',
      browser: 'Safari',
      os: 'iOS 17',
      lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
      ipAddress: '10.0.0.5'
    }
  ]
  res.json({
    code: 200,
    data: devices
  })
})

// DELETE /users/devices/:id
router.delete('/devices/:id', (req, res) => {
  res.json({
    code: 200,
    message: 'Device removed'
  })
})

// POST /users/account/delete
router.post('/account/delete', (req, res) => {
  res.json({
    code: 200,
    message: 'Account deleted'
  })
})


// ==================== Settings & Preferences ====================

// GET /users/privacy
router.get('/privacy', async (req, res) => {
  const DEFAULT_PRIVACY = {
    onlineStatus: true,
    allowMessages: true,
    shareLocation: false,
    profileVisibility: 'public'
  }

  let privacy = null

  // 1. 尝试从 DB 读取
  try {
    privacy = await getUserPrivacySettings(req.user.id)
  } catch (dbError) {
    console.warn('[GET /privacy] DB error:', dbError.message)
  }

  // 2. DB 返回 null（字段不存在或记录为空），降级到内存
  if (!privacy) {
    const controllers = getControllers()
    const user = controllers.user.getUser(req.user.id)
    privacy = user?.privacySettings || DEFAULT_PRIVACY
  }

  res.json({ code: 200, data: privacy })
})

// PUT /users/privacy
router.put('/privacy', async (req, res) => {
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)

  // 1. 合并到内存（保留原有行为）
  if (user) {
    user.privacySettings = { ...user.privacySettings, ...req.body }
  }

  // 2. 持久化到 DB（失败不影响响应）
  try {
    const settingsToSave = user?.privacySettings || req.body
    await updateUserPrivacySettings(req.user.id, settingsToSave)
  } catch (dbError) {
    console.error('[PUT /privacy] DB persist error:', dbError.message)
    // 降级：仅内存生效，不向客户端报错
  }

  res.json({ code: 200, message: 'Privacy settings updated' })
})

// GET /users/notification
router.get('/notification', (req, res) => {
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)
  
  const notifications = user?.notificationSettings || {
    emailNotifications: false,
    smsNotifications: false,
    pushNotifications: true,
    commentNotifications: true,
    messageNotifications: true,
    systemNotifications: true
  }
  
  res.json({ code: 200, data: notifications })
})

// PUT /users/notification
router.put('/notification', (req, res) => {
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)
  if (user) {
    user.notificationSettings = { ...user.notificationSettings, ...req.body }
  }
  res.json({ code: 200, message: 'Notification settings updated' })
})

// GET /users/preferences
router.get('/preferences', async (req, res) => {
  const DEFAULT_PREFERENCES = {
    theme: 'light',
    accentColor: 'blue',
    fontSize: 'base'
  }

  let preferences = null

  // 1. 尝试从 DB 读取
  try {
    preferences = await getUserPreferences(req.user.id)
  } catch (dbError) {
    console.warn('[GET /preferences] DB error:', dbError.message)
  }

  // 2. DB 返回 null（字段不存在或记录为空），降级到内存
  if (!preferences) {
    const controllers = getControllers()
    const user = controllers.user.getUser(req.user.id)
    preferences = user?.preferences || DEFAULT_PREFERENCES
  }

  res.json({ code: 200, data: preferences })
})

// PUT /users/preferences
router.put('/preferences', async (req, res) => {
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)

  // 1. 合并到内存（保留原有行为）
  if (user) {
    user.preferences = { ...user.preferences, ...req.body }
  }

  // 2. 持久化到 DB（失败不影响响应）
  try {
    const prefToSave = user?.preferences || req.body
    await updateUserPreferences(req.user.id, prefToSave)
  } catch (dbError) {
    console.error('[PUT /preferences] DB persist error:', dbError.message)
    // 降级：仅内存生效，不向客户端报错
  }

  res.json({ code: 200, message: 'Preferences updated' })
})

// GET /users/security
// Helper to get aggregated security info
router.get('/security', (req, res) => {
  const controllers = getControllers()
  const user = controllers.user.getUser(req.user.id)
  
  const security = {
    phoneNumber: user?.phone || '',
    phoneVerified: !!user?.phoneVerified,
    email: user?.email || '',
    emailVerified: !!user?.emailVerified,
    isTwoFactorEnabled: !!user?.isTwoFactorEnabled,
    lastPasswordChange: new Date(Date.now() - 100000000).toISOString(),
    loginDevices: [] // We can reuse the devices logic if needed
  }
  
  res.json({ code: 200, data: security })
})


module.exports = router
