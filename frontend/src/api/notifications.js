/**
 * 通知相关 API
 */
import api from './index'

/**
 * 获取通知列表
 * @param {Object} params - 查询参数
 * @param {string} params.type - 通知类型（可选）
 * @param {boolean} params.isRead - 是否已读（可选）
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 */
export function getNotifications(params = {}) {
  return api({
    url: '/notifications',
    method: 'get',
    params
  })
}

/**
 * 标记通知为已读
 * @param {number} notificationId - 通知 ID
 */
export function markNotificationAsRead(notificationId) {
  return api({
    url: `/notifications/${notificationId}/read`,
    method: 'put'
  })
}

/**
 * 删除通知
 * @param {number} notificationId - 通知 ID
 */
export function deleteNotification(notificationId) {
  return api({
    url: `/notifications/${notificationId}`,
    method: 'delete'
  })
}

/**
 * 全部标记为已读
 */
export function markAllAsRead() {
  return api({
    url: '/notifications/read-all',
    method: 'post'
  })
}

/**
 * 获取未读通知数量
 */
export function getUnreadCount() {
  return api({
    url: '/notifications/unread-count',
    method: 'get'
  })
}
