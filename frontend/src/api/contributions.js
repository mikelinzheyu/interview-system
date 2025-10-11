/**
 * 社区贡献系统 API
 */
import api from './index'

/**
 * 提交题目
 */
export function submitQuestion(data) {
  return api({
    url: '/contributions/submit',
    method: 'post',
    data
  })
}

/**
 * 获取我的提交列表
 */
export function getMySubmissions(params) {
  return api({
    url: '/contributions/my-submissions',
    method: 'get',
    params
  })
}

/**
 * 获取提交详情
 */
export function getSubmissionDetail(id) {
  return api({
    url: `/contributions/submissions/${id}`,
    method: 'get'
  })
}

/**
 * 修订提交
 */
export function reviseSubmission(id, data) {
  return api({
    url: `/contributions/submissions/${id}/revise`,
    method: 'put',
    data
  })
}

/**
 * 获取审核队列
 */
export function getReviewQueue(params) {
  return api({
    url: '/contributions/review-queue',
    method: 'get',
    params
  })
}

/**
 * 领取审核任务
 */
export function claimReviewTask(id) {
  return api({
    url: `/contributions/review-queue/${id}/claim`,
    method: 'post'
  })
}

/**
 * 提交审核结果
 */
export function submitReview(id, data) {
  return api({
    url: `/contributions/submissions/${id}/review`,
    method: 'post',
    data
  })
}

/**
 * 获取贡献者资料
 */
export function getContributorProfile(userId) {
  return api({
    url: `/contributions/profile/${userId}`,
    method: 'get'
  })
}

/**
 * 获取贡献排行榜
 */
export function getLeaderboard(params) {
  return api({
    url: '/contributions/leaderboard',
    method: 'get',
    params
  })
}

/**
 * 获取徽章列表
 */
export function getBadges() {
  return api({
    url: '/contributions/badges',
    method: 'get'
  })
}

/**
 * 收藏题目
 */
export function favoriteQuestion(questionId) {
  return api({
    url: `/contributions/questions/${questionId}/favorite`,
    method: 'post'
  })
}

/**
 * 取消收藏
 */
export function unfavoriteQuestion(questionId) {
  return api({
    url: `/contributions/questions/${questionId}/favorite`,
    method: 'delete'
  })
}

/**
 * 获取我的收藏
 */
export function getMyFavorites(params) {
  return api({
    url: '/contributions/favorites',
    method: 'get',
    params
  })
}

/**
 * 获取题目列表（社区）
 */
export function getCommunityQuestions(params) {
  return api({
    url: '/contributions/questions',
    method: 'get',
    params
  })
}

/**
 * 获取题目详情（社区）
 */
export function getQuestionDetail(id) {
  return api({
    url: `/contributions/questions/${id}`,
    method: 'get'
  })
}

/**
 * 发布讨论
 */
export function postDiscussion(questionId, data) {
  return api({
    url: `/contributions/questions/${questionId}/discussions`,
    method: 'post',
    data
  })
}

/**
 * 获取讨论列表
 */
export function getDiscussions(questionId, params) {
  return api({
    url: `/contributions/questions/${questionId}/discussions`,
    method: 'get',
    params
  })
}

/**
 * 回复讨论
 */
export function replyDiscussion(discussionId, data) {
  return api({
    url: `/contributions/discussions/${discussionId}/replies`,
    method: 'post',
    data
  })
}

/**
 * 点赞讨论
 */
export function likeDiscussion(discussionId) {
  return api({
    url: `/contributions/discussions/${discussionId}/like`,
    method: 'post'
  })
}

/**
 * 关注用户
 */
export function followUser(userId) {
  return api({
    url: `/contributions/users/${userId}/follow`,
    method: 'post'
  })
}

/**
 * 取消关注
 */
export function unfollowUser(userId) {
  return api({
    url: `/contributions/users/${userId}/follow`,
    method: 'delete'
  })
}

/**
 * 获取个性化推荐
 */
export function getRecommendations(params) {
  return api({
    url: '/contributions/recommendations',
    method: 'get',
    params
  })
}

/**
 * 发布悬赏
 */
export function createBounty(questionId, data) {
  return api({
    url: `/contributions/questions/${questionId}/bounty`,
    method: 'post',
    data
  })
}
