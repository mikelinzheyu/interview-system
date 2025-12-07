/**
 * 用户相关的所有类型定义
 * 前后端共用，保证字段 100% 匹配
 */

// ===== 基础用户信息 =====

/**
 * 完整的用户对象（登录后从 userStore 使用）
 * 包含所有基础用户信息
 */
export interface User {
  id: string
  username: string
  nickname: string
  email: string
  phone?: string
  avatar?: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string | null
  bio?: string
  createdAt: string
  updatedAt: string
}

/**
 * 用户资料面板使用的 Profile 视图
 * settings.ts 中的 profile state 使用此类型
 */
export interface UserProfile {
  id: string
  username: string
  nickname: string
  email: string
  phone?: string
  avatar?: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string | null
  bio?: string
}

// ===== 安全/账号设置 =====

/**
 * 登录设备信息
 */
export interface LoginDevice {
  id: string
  deviceName: string
  browser?: string
  os?: string
  lastActiveAt: string
  ipAddress: string
  isCurrentDevice?: boolean
}

/**
 * 安全信息聚合（手机、邮箱、2FA 等）
 * settings.ts 中的 security state 使用此类型
 */
export interface UserSecurity {
  id: string
  email: string
  emailVerified: boolean
  phone?: string
  phoneVerified: boolean
  twoFactorEnabled: boolean
  lastPasswordChange: string
  loginDevices: LoginDevice[]
}

// 向后兼容的别名
export type SecuritySettings = UserSecurity

// ===== 隐私设置 =====

/**
 * 隐私设置
 * settings.ts 中的 privacy state 使用此类型
 */
export interface UserPrivacy {
  onlineStatus: boolean
  allowMessages: boolean
  shareLocation: boolean
  profileVisibility: 'public' | 'friends' | 'private'
}

// 向后兼容的别名
export type PrivacySettings = UserPrivacy

// ===== 通知设置 =====

/**
 * 通知设置
 * settings.ts 中的 notifications state 使用此类型
 */
export interface UserNotifications {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  commentNotifications: boolean
  messageNotifications: boolean
  systemNotifications: boolean
}

// 向后兼容的别名
export type NotificationSettings = UserNotifications

// ===== 界面偏好设置 =====

/**
 * 界面偏好设置
 * settings.ts 中的 preferences state 使用此类型
 * fontSize: 统一使用小写（sm, base, lg, xl）
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  accentColor?: string
  fontSize: 'sm' | 'base' | 'lg' | 'xl'
  compactMode?: boolean
  language?: string
}

// 向后兼容的别名
export type InterfaceSettings = UserPreferences

// ===== API 响应格式 =====

/**
 * 统一的 API 响应结构
 * 用于 axios 拦截器和类型检查
 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/**
 * API 错误响应
 */
export interface ApiError {
  code: number
  message: string
  errors?: Record<string, string[]>
}
