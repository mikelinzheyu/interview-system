/**
 * 聊天相关 API
 */
import api from './index'

/**
 * 获取聊天室列表
 */
export function getChatRooms() {
  return api({
    url: '/chat/rooms',
    method: 'get'
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
