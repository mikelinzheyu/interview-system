/**
 * 聊天相关 API
 */
import api from './index'

/**
 * 获取聊天室列表
 */
export function getChatRooms(params = {}) {
  return api({
    url: '/chat/rooms',
    method: 'get',
    params
  })
}

/**
 * 获取聊天室详情
 * @param {number} roomId - 聊天室 ID
 */
export function getChatRoomDetail(roomId) {
  return api({
    url: `/chat/rooms/${roomId}`,
    method: 'get'
  })
}

/**
 * 创建聊天室
 * @param {Object} data - 聊天室数据
 * @param {string} data.name - 聊天室名称
 * @param {string} data.type - 类型（public/group/private）
 * @param {string} data.description - 描述
 * @param {number} data.maxMembers - 最大成员数
 */
export function createChatRoom(data) {
  return api({
    url: '/chat/rooms',
    method: 'post',
    data
  })
}

/**
 * 获取聊天室历史消息
 * @param {number} roomId - 聊天室 ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 */
export function getChatMessages(roomId, params = {}) {
  return api({
    url: `/chat/rooms/${roomId}/messages`,
    method: 'get',
    params
  })
}

/**
 * 获取聊天室成员列表
 * @param {number} roomId - 聊天室 ID
 */
export function getChatMembers(roomId) {
  return api({
    url: `/chat/rooms/${roomId}/members`,
    method: 'get'
  })
}

/**
 * 加入聊天室
 * @param {number} roomId - 聊天室 ID
 */
export function joinChatRoom(roomId) {
  return api({
    url: `/chat/rooms/${roomId}/join`,
    method: 'post'
  })
}

/**
 * 离开聊天室
 * @param {number} roomId - 聊天室 ID
 */
export function leaveChatRoom(roomId) {
  return api({
    url: `/chat/rooms/${roomId}/leave`,
    method: 'post'
  })
}

export function uploadChatMedia(payload) {
  return api({
    url: '/chat/uploads',
    method: 'post',
    data: payload
  })
}

export function deleteChatMedia(key) {
  return api({
    url: `/chat/uploads/${key}`,
    method: 'delete'
  })
}

export function searchChatMessages(params = {}) {
  return api({
    url: '/chat/messages/search',
    method: 'get',
    params
  })
}
/**
 * 发送聊天室消息
 * @param {number|string} roomId - 聊天室 ID
 * @param {{ content: string, contentType?: string }} payload - 消息内容
 */
export function sendChatMessage(roomId, payload) {
  return api({
    url: `/chat/rooms/${roomId}/messages`,
    method: 'post',
    data: payload
  })
}

/**
 * 置顶会话
 * @param {number|string} conversationId - 会话 ID
 * @param {boolean} pinned - 是否置顶
 */
export function pinConversation(conversationId, pinned) {
  return api({
    url: `/chat/conversations/${conversationId}/pin`,
    method: 'post',
    data: { pinned }
  })
}

/**
 * 免打扰会话
 * @param {number|string} conversationId - 会话 ID
 * @param {boolean} muted - 是否免打扰
 * @param {number} duration - 免打扰时长（秒）
 */
export function muteConversation(conversationId, muted, duration = null) {
  return api({
    url: `/chat/conversations/${conversationId}/mute`,
    method: 'post',
    data: { muted, duration }
  })
}

/**
 * 标记会话为已读
 * @param {number|string} conversationId - 会话 ID
 */
export function markConversationRead(conversationId) {
  return api({
    url: `/chat/conversations/${conversationId}/mark-read`,
    method: 'post'
  })
}

/**
 * 删除会话
 * @param {number|string} conversationId - 会话 ID
 */
export function deleteConversation(conversationId) {
  return api({
    url: `/chat/conversations/${conversationId}`,
    method: 'delete'
  })
}

/**
 * 上传文件到聊天
 * @param {FormData} formData - 包含文件的FormData对象
 * @param {Function} onUploadProgress - 进度回调函数
 */
export function uploadFile(formData, onUploadProgress) {
  return api({
    url: '/chat/uploads',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  })
}

/**
 * 删除已上传的文件
 * @param {string} fileId - 文件ID
 */
export function deleteUploadedFile(fileId) {
  return api({
    url: `/chat/uploads/${fileId}`,
    method: 'delete'
  })
}

/**
 * 编辑消息
 * @param {string} conversationId - 会话ID
 * @param {string} messageId - 消息ID
 * @param {Object} data - 编辑数据
 */
export function editMessage(conversationId, messageId, data) {
  return api({
    url: `/chat/conversations/${conversationId}/messages/${messageId}`,
    method: 'put',
    data
  })
}

/**
 * 撤回消息
 * @param {string} conversationId - 会话ID
 * @param {string} messageId - 消息ID
 */
export function recallMessage(conversationId, messageId) {
  return api({
    url: `/chat/conversations/${conversationId}/messages/${messageId}/recall`,
    method: 'post'
  })
}

// ==================== 用户状态 API ====================

/**
 * 获取当前用户状态
 */
export function getCurrentUserStatus() {
  return api({
    url: '/chat/users/me/status',
    method: 'get'
  })
}

/**
 * 更新当前用户状态
 * @param {Object} data - 状态数据
 * @param {string} data.status - 状态(online/away/busy/offline)
 * @param {string} data.customStatus - 自定义状态消息
 */
export function updateUserStatus(data) {
  return api({
    url: '/chat/users/me/status',
    method: 'put',
    data
  })
}

/**
 * 获取指定用户状态
 * @param {number|string} userId - 用户ID
 */
export function getUserStatus(userId) {
  return api({
    url: `/chat/users/${userId}/status`,
    method: 'get'
  })
}

/**
 * 批量获取多个用户状态
 * @param {Array} userIds - 用户ID数组
 */
export function getUserStatuses(userIds) {
  return api({
    url: '/chat/users/statuses',
    method: 'post',
    data: { userIds }
  })
}

/**
 * 设置自定义状态消息
 * @param {string} message - 自定义消息(最多50字符)
 */
export function setStatusMessage(message) {
  return api({
    url: '/chat/users/me/status-message',
    method: 'put',
    data: { message }
  })
}

/**
 * 获取用户状态历史
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 限制数量(默认20)
 */
export function getStatusHistory(params = {}) {
  return api({
    url: '/chat/users/me/status-history',
    method: 'get',
    params
  })
}
