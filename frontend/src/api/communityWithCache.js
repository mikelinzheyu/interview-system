/**
 * Community API with Cache & Retry
 * 提供缓存、重试、去重等高级功能
 */
import api from './index'
import { generateMockPosts } from './communityMock'

const cache = new Map()
const CACHE_TIME = {
  FORUMS: 10 * 60 * 1000,      // 论坛：10分钟
  POSTS: 3 * 60 * 1000,        // 帖子列表：3分钟
  POST_DETAIL: 5 * 60 * 1000,  // 帖子详情：5分钟
  TAGS: 30 * 60 * 1000,        // 标签：30分钟
  STATS: 1 * 60 * 1000         // 统计：1分钟
}

class CommunityAPI {
  constructor() {
    this.cache = cache
    this.pending = new Map()
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @param {Function} fetcher - 数据获取函数
   * @param {number} ttl - 缓存时间（毫秒）
   * @returns {Promise}
   */
  async getCached(key, fetcher, ttl = CACHE_TIME.POSTS) {
    // 检查是否有有效缓存
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key)
      if (Date.now() - timestamp < ttl) {
        return data
      }
      // 缓存过期，删除
      this.cache.delete(key)
    }

    // 检查是否有待处理的相同请求（去重）
    if (this.pending.has(key)) {
      return this.pending.get(key)
    }

    // 发起新请求
    const promise = fetcher()
      .then(res => {
        this.cache.set(key, { data: res, timestamp: Date.now() })
        this.pending.delete(key)
        return res
      })
      .catch(err => {
        this.pending.delete(key)
        throw err
      })

    this.pending.set(key, promise)
    return promise
  }

  /**
   * 带重试的请求
   * @param {Function} fn - 请求函数
   * @param {number} retries - 重试次数
   * @param {number} delay - 初始延迟（毫秒）
   * @returns {Promise}
   */
  async retryRequest(fn, retries = 3, delay = 1000) {
    try {
      return await fn()
    } catch (error) {
      // 只重试 5xx 错误和网络错误
      const shouldRetry =
        retries > 0 &&
        (error.response?.status >= 500 ||
          error.code === 'ECONNABORTED' ||
          error.message === 'Network Error')

      if (shouldRetry) {
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.retryRequest(fn, retries - 1, delay * 2)
      }
      throw error
    }
  }

  /**
   * 获取论坛板块列表
   */
  getForums() {
    return this.getCached(
      'forums:list',
      () => this.retryRequest(() => api({ url: '/community/forums', method: 'get' })),
      CACHE_TIME.FORUMS
    )
  }

  /**
   * 获取指定板块的帖子列表
   */
  getForumPosts(slug, params) {
    const key = `forums:posts:${slug}:${JSON.stringify(params)}`
    return this.getCached(
      key,
      async () => {
        try {
          return await this.retryRequest(() =>
            api({
              url: `/community/forums/${slug}/posts`,
              method: 'get',
              params
            })
          )
        } catch (error) {
          // 后端 API 失败时，使用模拟数据
          console.warn(
            `Forum posts API (${slug}) not available, using mock data`,
            error.message
          )
          return generateMockPosts({ ...params, forumSlug: slug })
        }
      },
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取所有帖子列表
   */
  getPosts(params) {
    const key = `posts:list:${JSON.stringify(params)}`
    return this.getCached(
      key,
      async () => {
        try {
          return await this.retryRequest(() =>
            api({
              url: '/community/posts',
              method: 'get',
              params
            })
          )
        } catch (error) {
          // 后端 API 失败时，使用模拟数据
          console.warn('Community posts API not available, using mock data', error.message)
          return generateMockPosts(params)
        }
      },
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取帖子详情
   */
  getPostDetail(id) {
    const key = `posts:detail:${id}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/posts/${id}`,
            method: 'get'
          })
        ),
      CACHE_TIME.POST_DETAIL
    )
  }

  /**
   * 创建帖子（无缓存）
   */
  createPost(data) {
    return this.retryRequest(() =>
      api({
        url: '/community/posts',
        method: 'post',
        data
      })
    ).then(res => {
      // 创建成功后，清除相关缓存
      this.invalidateCache('posts:list')
      return res
    })
  }

  /**
   * 更新帖子（无缓存）
   */
  updatePost(id, data) {
    return this.retryRequest(() =>
      api({
        url: `/community/posts/${id}`,
        method: 'put',
        data
      })
    ).then(res => {
      // 更新成功后，清除相关缓存
      this.invalidateCache(`posts:detail:${id}`)
      this.invalidateCache('posts:list')
      return res
    })
  }

  /**
   * 删除帖子（无缓存）
   */
  deletePost(id) {
    return this.retryRequest(() =>
      api({
        url: `/community/posts/${id}`,
        method: 'delete'
      })
    ).then(res => {
      // 删除成功后，清除相关缓存
      this.invalidateCache(`posts:detail:${id}`)
      this.invalidateCache('posts:list')
      return res
    })
  }

  /**
   * 发表评论
   */
  createComment(postId, data) {
    return this.retryRequest(() =>
      api({
        url: `/community/posts/${postId}/comments`,
        method: 'post',
        data
      })
    ).then(res => {
      // 清除帖子详情缓存
      this.invalidateCache(`posts:detail:${postId}`)
      return res
    })
  }

  /**
   * 点赞帖子（无缓存，直接发送）
   */
  likePost(postId) {
    return this.retryRequest(() =>
      api({
        url: `/community/posts/${postId}/like`,
        method: 'post'
      })
    )
  }

  /**
   * 点赞评论（无缓存，直接发送）
   */
  likeComment(commentId) {
    return this.retryRequest(() =>
      api({
        url: `/community/comments/${commentId}/like`,
        method: 'post'
      })
    )
  }

  /**
   * 获取热门标签
   */
  getHotTags() {
    return this.getCached(
      'tags:hot',
      () => this.retryRequest(() => api({ url: '/community/tags/hot', method: 'get' })),
      CACHE_TIME.TAGS
    )
  }

  /**
   * 获取今日统计
   */
  getTodayStats() {
    return this.getCached(
      'stats:today',
      async () => {
        try {
          return await this.retryRequest(() =>
            api({ url: '/community/stats/today', method: 'get' })
          )
        } catch (error) {
          // API 不可用时返回默认数据，不抛出错误
          console.warn('Stats API not available, using default values')
          return {
            data: {
              postsCount: 0,
              onlineUsers: 0,
              activeUsers: 0,
              newUsers: 0
            }
          }
        }
      },
      CACHE_TIME.STATS
    )
  }

  /**
   * 获取推荐帖子
   */
  getRecommendedPosts(userId) {
    return this.getCached(
      `posts:recommended:${userId}`,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/recommendations/posts/${userId}`,
            method: 'get'
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 记录帖子浏览
   */
  trackPostView(postId, viewTime) {
    // 不缓存，直接发送
    return api({
      url: `/community/posts/${postId}/views`,
      method: 'post',
      data: { viewTime }
    }).catch(err => {
      // 浏览记录失败不影响用户体验
      console.warn('Failed to track post view:', err)
    })
  }

  /**
   * 报告内容
   */
  reportContent(contentType, contentId, reason) {
    return this.retryRequest(() =>
      api({
        url: '/community/reports',
        method: 'post',
        data: { contentType, contentId, reason }
      })
    )
  }

  /**
   * 清除指定模式的缓存
   * @param {string} pattern - 缓存键模式
   */
  invalidateCache(pattern) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取评论列表
   */
  getComments(postId, params) {
    const key = `comments:post:${postId}:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/posts/${postId}/comments`,
            method: 'get',
            params
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 创建评论
   */
  createComment(postId, data) {
    return this.retryRequest(() =>
      api({
        url: `/community/posts/${postId}/comments`,
        method: 'post',
        data
      })
    ).then(res => {
      // 清除该帖子的评论缓存
      this.invalidateCache(`comments:post:${postId}`)
      // 清除帖子详情缓存（评论数会改变）
      this.invalidateCache(`posts:detail:${postId}`)
      return res
    })
  }

  /**
   * 更新评论
   */
  updateComment(commentId, data) {
    return this.retryRequest(() =>
      api({
        url: `/community/comments/${commentId}`,
        method: 'put',
        data
      })
    ).then(res => {
      // 清除关相关缓存
      this.invalidateCache('comments:')
      return res
    })
  }

  /**
   * 删除评论
   */
  deleteComment(commentId) {
    return this.retryRequest(() =>
      api({
        url: `/community/comments/${commentId}`,
        method: 'delete'
      })
    ).then(res => {
      // 清除相关缓存
      this.invalidateCache('comments:')
      return res
    })
  }

  /**
   * 点赞评论
   */
  likeComment(commentId) {
    return this.retryRequest(() =>
      api({
        url: `/community/comments/${commentId}/like`,
        method: 'post'
      })
    )
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.cache.clear()
    this.pending.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pending.size,
      cacheKeys: Array.from(this.cache.keys())
    }
  }
}

export default new CommunityAPI()
