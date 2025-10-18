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
