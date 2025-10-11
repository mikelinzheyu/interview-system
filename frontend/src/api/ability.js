/**
 * 跨专业能力分析 API
 */
import api from './index'

/**
 * 获取用户能力画像
 */
export function getAbilityProfile(userId) {
  return api({
    url: `/ability/profile/${userId}`,
    method: 'get'
  })
}

/**
 * 获取雷达图数据
 */
export function getRadarData(userId) {
  return api({
    url: `/ability/radar/${userId}`,
    method: 'get'
  })
}

/**
 * 获取 T 型指数排行榜
 */
export function getTShapeLeaderboard(params) {
  return api({
    url: '/ability/t-shape-leaderboard',
    method: 'get',
    params
  })
}

/**
 * 获取跨专业推荐
 */
export function getCrossDomainRecommendations(userId) {
  return api({
    url: `/ability/cross-domain-recommendations/${userId}`,
    method: 'get'
  })
}
