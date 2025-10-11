/**
 * 社区论坛 API
 */
import api from './index'

/**
 * 获取论坛板块列表
 */
export function getForums() {
  return api({
    url: '/community/forums',
    method: 'get'
  })
}

/**
 * 获取指定板块的帖子列表
 */
export function getForumPosts(slug, params) {
  return api({
    url: `/community/forums/${slug}/posts`,
    method: 'get',
    params
  })
}

/**
 * 获取所有帖子列表（支持搜索和筛选）
 */
export function getPosts(params) {
  return api({
    url: '/community/posts',
    method: 'get',
    params
  })
}

/**
 * 获取帖子详情
 */
export function getPostDetail(id) {
  return api({
    url: `/community/posts/${id}`,
    method: 'get'
  })
}

/**
 * 创建帖子
 */
export function createPost(data) {
  return api({
    url: '/community/posts',
    method: 'post',
    data
  })
}

/**
 * 发表评论
 */
export function createComment(postId, data) {
  return api({
    url: `/community/posts/${postId}/comments`,
    method: 'post',
    data
  })
}

/**
 * 点赞/取消点赞帖子
 */
export function likePost(postId) {
  return api({
    url: `/community/posts/${postId}/like`,
    method: 'post'
  })
}

/**
 * 点赞/取消点赞评论
 */
export function likeComment(commentId) {
  return api({
    url: `/community/comments/${commentId}/like`,
    method: 'post'
  })
}

/**
 * 获取热门标签
 */
export function getHotTags() {
  return api({
    url: '/community/tags/hot',
    method: 'get'
  })
}
