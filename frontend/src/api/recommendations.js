/**
 * 推荐流相关 API
 */
import api from './index'

/**
 * 获取推荐流
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 */
export function getRecommendations(params = {}) {
  return api({
    url: '/recommendations',
    method: 'get',
    params
  })
}

/**
 * 刷新推荐
 */
export function refreshRecommendations() {
  return api({
    url: '/recommendations/refresh',
    method: 'get'
  })
}

/**
 * 推荐反馈
 * @param {Object} data - 反馈数据
 * @param {number} data.recommendationId - 推荐ID
 * @param {string} data.feedback - 反馈类型（like/dislike）
 */
export function submitRecommendationFeedback(data) {
  return api({
    url: '/recommendations/feedback',
    method: 'post',
    data
  })
}

/**
 * 获取用户兴趣标签
 */
export function getUserInterests() {
  return api({
    url: '/users/interests',
    method: 'get'
  })
}

/**
 * 更新用户兴趣标签
 * @param {Array} tags - 标签数组 [{ tag: 'Vue.js', weight: 0.9 }]
 */
export function updateUserInterests(tags) {
  return api({
    url: '/users/interests',
    method: 'put',
    data: { tags }
  })
}
