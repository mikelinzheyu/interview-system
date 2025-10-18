/**
 * 消息编辑和撤回服务
 * 管理消息的编辑、撤回、历史等功能
 */

// 消息编辑配置
const MESSAGE_EDIT_CONFIG = {
  EDIT_TIME_LIMIT: 10 * 60 * 1000, // 编辑时限: 10分钟
  RECALL_TIME_LIMIT: 2 * 60 * 1000, // 撤回时限: 2分钟
  MAX_HISTORY_RECORDS: 20, // 最多保存20条编辑历史
  MAX_EDIT_COUNT: 5 // 最多编辑5次
}

// 编辑历史管理
class EditHistory {
  constructor() {
    this.histories = new Map() // messageId -> [{ version, content, editedAt, editor }]
  }

  addRecord(messageId, content, editorId = 'system') {
    if (!this.histories.has(messageId)) {
      this.histories.set(messageId, [])
    }

    const history = this.histories.get(messageId)
    const record = {
      version: history.length + 1,
      content,
      editedAt: new Date().toISOString(),
      editor: editorId
    }

    history.push(record)

    // 限制历史记录数量
    if (history.length > MESSAGE_EDIT_CONFIG.MAX_HISTORY_RECORDS) {
      history.shift()
    }

    return record
  }

  getHistory(messageId) {
    return this.histories.get(messageId) || []
  }

  getLatestVersion(messageId) {
    const history = this.getHistory(messageId)
    return history.length > 0 ? history[history.length - 1] : null
  }

  clearHistory(messageId) {
    this.histories.delete(messageId)
  }

  clearAll() {
    this.histories.clear()
  }
}

// 全局编辑历史实例
const editHistory = new EditHistory()

/**
 * 检查消息是否可以编辑
 */
export function canEditMessage(message) {
  if (!message) return false

  // 只有自己发送的消息才能编辑
  if (message.isOwn !== true && message.sender?.id !== getCurrentUserId()) {
    return false
  }

  // 检查时间限制
  if (message.createdAt) {
    const createdTime = new Date(message.createdAt).getTime()
    const now = Date.now()
    if (now - createdTime > MESSAGE_EDIT_CONFIG.EDIT_TIME_LIMIT) {
      return false
    }
  }

  // 检查编辑次数限制
  const history = editHistory.getHistory(message.id)
  if (history.length >= MESSAGE_EDIT_CONFIG.MAX_EDIT_COUNT) {
    return false
  }

  return true
}

/**
 * 检查消息是否可以撤回
 */
export function canRecallMessage(message) {
  if (!message) return false

  // 只有自己发送的消息才能撤回
  if (message.isOwn !== true && message.sender?.id !== getCurrentUserId()) {
    return false
  }

  // 检查时间限制
  if (message.createdAt) {
    const createdTime = new Date(message.createdAt).getTime()
    const now = Date.now()
    if (now - createdTime > MESSAGE_EDIT_CONFIG.RECALL_TIME_LIMIT) {
      return false
    }
  }

  // 不能撤回已撤回的消息
  if (message.recalled === true) {
    return false
  }

  return true
}

/**
 * 编辑消息
 */
export function editMessage(messageId, newContent, editorId = 'user') {
  if (!messageId || !newContent || !newContent.trim()) {
    return {
      success: false,
      error: '内容不能为空'
    }
  }

  // 记录编辑历史
  const record = editHistory.addRecord(messageId, newContent, editorId)

  return {
    success: true,
    message: {
      id: messageId,
      content: newContent,
      edited: true,
      editedAt: record.editedAt,
      editCount: record.version,
      maxEdits: MESSAGE_EDIT_CONFIG.MAX_EDIT_COUNT
    }
  }
}

/**
 * 撤回消息
 */
export function recallMessage(messageId, recallReason = '撤回消息') {
  if (!messageId) {
    return {
      success: false,
      error: '消息ID无效'
    }
  }

  return {
    success: true,
    message: {
      id: messageId,
      recalled: true,
      recalledAt: new Date().toISOString(),
      recallReason: recallReason || '用户撤回了这条消息',
      originalContent: '[消息已撤回]'
    }
  }
}

/**
 * 获取消息编辑历史
 */
export function getMessageEditHistory(messageId) {
  return editHistory.getHistory(messageId)
}

/**
 * 获取最新编辑版本
 */
export function getLatestMessageVersion(messageId) {
  return editHistory.getLatestVersion(messageId)
}

/**
 * 格式化编辑历史显示
 */
export function formatEditHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return null
  }

  return {
    versions: history.length,
    firstEdit: history[0].editedAt,
    lastEdit: history[history.length - 1].editedAt,
    records: history.map((record, index) => ({
      version: record.version,
      number: index + 1,
      content: record.content.substring(0, 100) + (record.content.length > 100 ? '...' : ''),
      editedAt: formatTime(record.editedAt),
      editor: record.editor
    }))
  }
}

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

/**
 * 获取当前用户ID (需要在实际应用中实现)
 */
function getCurrentUserId() {
  // 这里应该从用户store获取当前用户ID
  return 'current-user'
}

/**
 * 验证编辑请求
 */
export function validateEditRequest(message, newContent) {
  const errors = []

  // 检查消息
  if (!message) {
    errors.push('消息不存在')
    return { valid: false, errors }
  }

  // 检查是否可以编辑
  if (!canEditMessage(message)) {
    errors.push('消息已过期或无法编辑')
  }

  // 检查新内容
  if (!newContent || !newContent.trim()) {
    errors.push('新内容不能为空')
  }

  // 检查内容是否相同
  if (message.content === newContent) {
    errors.push('新内容与原内容相同')
  }

  // 检查内容长度
  if (newContent.length > 5000) {
    errors.push('内容长度不能超过5000字符')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 验证撤回请求
 */
export function validateRecallRequest(message) {
  const errors = []

  // 检查消息
  if (!message) {
    errors.push('消息不存在')
    return { valid: false, errors }
  }

  // 检查是否可以撤回
  if (!canRecallMessage(message)) {
    errors.push('消息已过期或无法撤回')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 清除编辑历史
 */
export function clearEditHistory(messageId) {
  if (messageId) {
    editHistory.clearHistory(messageId)
  } else {
    editHistory.clearAll()
  }
}

/**
 * 获取编辑配置
 */
export function getEditConfig() {
  return {
    ...MESSAGE_EDIT_CONFIG,
    editTimeLimitMinutes: MESSAGE_EDIT_CONFIG.EDIT_TIME_LIMIT / 60 / 1000,
    recallTimeLimitMinutes: MESSAGE_EDIT_CONFIG.RECALL_TIME_LIMIT / 60 / 1000
  }
}

export default {
  canEditMessage,
  canRecallMessage,
  editMessage,
  recallMessage,
  getMessageEditHistory,
  getLatestMessageVersion,
  formatEditHistory,
  validateEditRequest,
  validateRecallRequest,
  clearEditHistory,
  getEditConfig,
  MESSAGE_EDIT_CONFIG
}
