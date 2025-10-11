/**
 * 关注系统相关 API
 */
import api from './index'

/**
 * 关注用户
 * @param {number} userId - 用户ID
 */
export function followUser(userId) {
  return api({
    url: `/users/${userId}/follow`,
    method: 'post'
  })
}

/**
 * 取消关注
 * @param {number} userId - 用户ID
 */
export function unfollowUser(userId) {
  return api({
    url: `/users/${userId}/follow`,
    method: 'delete'
  })
}

/**
 * 获取粉丝列表
 * @param {number} userId - 用户ID
 * @param {Object} params - 查询参数
 */
export function getFollowers(userId, params = {}) {
  return api({
    url: `/users/${userId}/followers`,
    method: 'get',
    params
  })
}

/**
 * 获取关注列表
 * @param {number} userId - 用户ID
 * @param {Object} params - 查询参数
 */
export function getFollowing(userId, params = {}) {
  return api({
    url: `/users/${userId}/following`,
    method: 'get',
    params
  })
}

/**
 * 获取用户动态
 * @param {number} userId - 用户ID
 * @param {Object} params - 查询参数
 */
export function getUserFeeds(userId, params = {}) {
  return api({
    url: `/users/${userId}/feeds`,
    method: 'get',
    params
  })
}

/**
 * 获取关注动态流
 * @param {Object} params - 查询参数
 */
export function getTimeline(params = {}) {
  return api({
    url: '/feeds/timeline',
    method: 'get',
    params
  })
}
