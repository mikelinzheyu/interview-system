/**
 * Community API with Cache & Retry
 * 提供缓存、重试、去重等高级功能
 */
import api from './index'
import { generateMockPosts, generateMockForums, generateMockHotTags, getPostDetailMock } from './communityMock'

const cache = new Map()
const CACHE_TIME = {
  FORUMS: 10 * 60 * 1000,      // 论坛：10分钟
  POSTS: 3 * 60 * 1000,        // 帖子列表：3分钟
  POST_DETAIL: 5 * 60 * 1000,  // 帖子详情：5分钟
  TAGS: 30 * 60 * 1000,        // 标签：30分钟
  STATS: 1 * 60 * 1000         // 统计：1分钟
}

/**
 * 配置开关：是否使用 Mock 数据
 * 默认在所有环境都使用 Mock 数据，确保数据总是可见
 * 可通过环境变量或手动调用来禁用 Mock 模式
 *
 * 使用方式：
 * import communityAPI from '@/api/communityWithCache'
 * communityAPI.setUseMockData(true)  // 启用 mock 模式
 * communityAPI.setUseMockData(false) // 禁用 mock 模式，使用真实 API
 *
 * 环境变量配置（可选）：
 * 在 .env 或 .env.production 中设置：
 * VITE_USE_MOCK_DATA=true   // 使用 mock（默认）
 * VITE_USE_MOCK_DATA=false  // 使用真实 API
 */
const config = {
  // 默认值：所有环境都使用 mock 数据
  // 这样可以确保无论是开发、测试还是生产环境，
  // 前端都能直接显示完整的论坛数据，无需等待后端 API
  useMockData: import.meta.env.VITE_USE_MOCK_DATA !== 'false'
}

class CommunityAPI {
  constructor() {
    this.cache = cache
    this.pending = new Map()
    this.config = config
  }

  /**
   * 设置是否使用 Mock 数据
   * @param {boolean} useMock - true 使用 mock，false 使用真实 API
   */
  setUseMockData(useMock) {
    this.config.useMockData = useMock
    console.log(`[CommunityAPI] Mock Data Mode: ${useMock ? '✅ 启用' : '❌ 禁用'}`)
  }

  /**
   * 获取当前 Mock 数据模式状态
   */
  isUsingMockData() {
    return this.config.useMockData
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
      async () => {
        // 如果启用了 Mock 数据，直接返回
        if (this.config.useMockData) {
          console.log('[Forums] Using mock data')
          return generateMockForums()
        }

        try {
          return await this.retryRequest(() => api({ url: '/community/forums', method: 'get' }))
        } catch (error) {
          // 后端 API 失败时，降级使用模拟数据
          console.warn('Forums API not available, using mock data', error.message)
          return generateMockForums()
        }
      },
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
        // 如果启用了 Mock 数据，直接返回
        if (this.config.useMockData) {
          console.log(`[ForumPosts: ${slug}] Using mock data`)
          return generateMockPosts({ ...params, forumSlug: slug })
        }

        try {
          return await this.retryRequest(() =>
            api({
              url: `/community/forums/${slug}/posts`,
              method: 'get',
              params
            })
          )
        } catch (error) {
          // 后端 API 失败时，降级使用模拟数据
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
        // 如果启用了 Mock 数据，直接返回
        if (this.config.useMockData) {
          console.log('[Posts] Using mock data')
          return generateMockPosts(params)
        }

        try {
          return await this.retryRequest(() =>
            api({
              url: '/community/posts',
              method: 'get',
              params
            })
          )
        } catch (error) {
          // 后端 API 失败时，降级使用模拟数据
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
      async () => {
        // 如果启用了 Mock 数据，直接返回
        if (this.config.useMockData) {
          console.log(`[PostDetail: ${id}] Using mock data`)
          const mockData = getPostDetailMock(id)
          if (mockData) {
            return { data: mockData }
          }
          // 如果 mock 数据中找不到，继续尝试 API
        }

        try {
          return await this.retryRequest(() =>
            api({
              url: `/community/posts/${id}`,
              method: 'get'
            })
          )
        } catch (error) {
          // 后端 API 失败时，降级使用模拟数据
          console.warn(`Post detail API (${id}) not available, using mock data`, error.message)
          const mockData = getPostDetailMock(id)
          if (mockData) {
            return { data: mockData }
          }
          throw error
        }
      },
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
      async () => {
        // 如果启用了 Mock 数据，直接返回
        if (this.config.useMockData) {
          console.log('[HotTags] Using mock data')
          return generateMockHotTags()
        }

        try {
          return await this.retryRequest(() => api({ url: '/community/tags/hot', method: 'get' }))
        } catch (error) {
          // 后端 API 失败时，降级使用模拟数据
          console.warn('Hot tags API not available, using mock data', error.message)
          return generateMockHotTags()
        }
      },
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
   * 获取用户资料
   */
  getUserProfile(userId) {
    const key = `users:profile:${userId}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}`,
            method: 'get'
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 更新用户资料
   */
  updateUserProfile(userId, data) {
    return this.retryRequest(() =>
      api({
        url: `/community/users/${userId}`,
        method: 'put',
        data
      })
    ).then(res => {
      // 清除用户资料缓存
      this.invalidateCache(`users:profile:${userId}`)
      return res
    })
  }

  /**
   * 上传头像
   */
  uploadAvatar(formData) {
    return api({
      url: '/community/users/avatar',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * 获取用户发布的帖子
   */
  getUserPosts(userId, params) {
    const key = `users:posts:${userId}:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/posts`,
            method: 'get',
            params
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取用户的评论
   */
  getUserComments(userId, params) {
    const key = `users:comments:${userId}:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/comments`,
            method: 'get',
            params
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取用户的收藏
   */
  getUserCollections(userId) {
    const key = `users:collections:${userId}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/collections`,
            method: 'get'
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 检查关注状态
   */
  checkFollowStatus(userId) {
    const key = `users:follow:status:${userId}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/follow-status`,
            method: 'get'
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 关注/取消关注用户
   */
  toggleFollow(userId) {
    return this.retryRequest(() =>
      api({
        url: `/community/users/${userId}/follow`,
        method: 'post'
      })
    ).then(res => {
      // 清除关注状态缓存
      this.invalidateCache(`users:follow:status:${userId}`)
      this.invalidateCache(`users:followers:`)
      this.invalidateCache(`users:following:`)
      return res
    })
  }

  /**
   * 获取粉丝列表
   */
  getFollowers(userId, params) {
    const key = `users:followers:${userId}:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/followers`,
            method: 'get',
            params
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取关注列表
   */
  getFollowing(userId, params) {
    const key = `users:following:${userId}:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/following`,
            method: 'get',
            params
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 屏蔽用户
   */
  blockUser(userId) {
    return this.retryRequest(() =>
      api({
        url: `/community/users/${userId}/block`,
        method: 'post'
      })
    )
  }

  /**
   * 取消屏蔽用户
   */
  unblockUser(userId) {
    return this.retryRequest(() =>
      api({
        url: `/community/users/${userId}/unblock`,
        method: 'post'
      })
    )
  }

  /**
   * 获取用户声誉信息
   */
  getUserReputation(userId) {
    const key = `users:reputation:${userId}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/reputation`,
            method: 'get'
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取用户徽章
   */
  getUserBadges(userId) {
    const key = `users:badges:${userId}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/badges`,
            method: 'get'
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取用户成就
   */
  getUserAchievements(userId) {
    const key = `users:achievements:${userId}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/users/${userId}/achievements`,
            method: 'get'
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取声誉排行榜
   */
  getReputationLeaderboard(params) {
    const key = `leaderboard:reputation:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/leaderboard/reputation',
            method: 'get',
            params
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 搜索内容（帖子、用户、标签）
   */
  search(keyword, params) {
    const key = `search:${keyword}:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/search',
            method: 'get',
            params: {
              q: keyword,
              ...params
            }
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取搜索建议
   */
  getSearchSuggestions(keyword) {
    const key = `search:suggestions:${keyword}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/search/suggestions',
            method: 'get',
            params: { q: keyword }
          })
        ),
      1 * 60 * 1000  // 1分钟缓存
    )
  }

  /**
   * 获取热门搜索
   */
  getTrendingSearches() {
    return this.getCached(
      'search:trending',
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/search/trending',
            method: 'get'
          })
        ),
      10 * 60 * 1000  // 10分钟缓存
    )
  }

  /**
   * 获取搜索历史（从后端同步）
   */
  getSearchHistory() {
    return this.retryRequest(() =>
      api({
        url: '/community/user/search-history',
        method: 'get'
      })
    )
  }

  /**
   * 记录搜索历史
   */
  recordSearchHistory(keyword) {
    return api({
      url: '/community/user/search-history',
      method: 'post',
      data: { keyword }
    })
  }

  /**
   * 清空搜索历史
   */
  clearSearchHistory() {
    return api({
      url: '/community/user/search-history',
      method: 'delete'
    })
  }

  /**
   * 获取通知列表
   */
  getNotifications(params) {
    const key = `notifications:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/notifications',
            method: 'get',
            params
          })
        ),
      CACHE_TIME.POSTS
    )
  }

  /**
   * 获取未读通知计数
   */
  getUnreadNotificationCount() {
    return this.getCached(
      'notifications:unread:count',
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/notifications/unread/count',
            method: 'get'
          })
        ),
      1 * 60 * 1000  // 1分钟缓存
    )
  }

  /**
   * 标记通知为已读
   */
  markNotificationAsRead(notificationId) {
    return api({
      url: `/community/notifications/${notificationId}/read`,
      method: 'post'
    }).then(res => {
      // 清除未读计数缓存
      this.invalidateCache('notifications:unread:count')
      return res
    })
  }

  /**
   * 标记全部通知为已读
   */
  markAllNotificationsAsRead() {
    return api({
      url: '/community/notifications/read-all',
      method: 'post'
    }).then(res => {
      // 清除缓存
      this.invalidateCache('notifications:')
      this.invalidateCache('notifications:unread:count')
      return res
    })
  }

  /**
   * 删除通知
   */
  deleteNotification(notificationId) {
    return api({
      url: `/community/notifications/${notificationId}`,
      method: 'delete'
    }).then(res => {
      // 清除缓存
      this.invalidateCache('notifications:')
      this.invalidateCache('notifications:unread:count')
      return res
    })
  }

  /**
   * 清空所有通知
   */
  clearAllNotifications() {
    return api({
      url: '/community/notifications',
      method: 'delete'
    }).then(res => {
      // 清除缓存
      this.invalidateCache('notifications:')
      this.invalidateCache('notifications:unread:count')
      return res
    })
  }

  /**
   * 获取通知偏好设置
   */
  getNotificationPreferences() {
    return this.getCached(
      'notifications:preferences',
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/notifications/preferences',
            method: 'get'
          })
        ),
      30 * 60 * 1000  // 30分钟缓存
    )
  }

  /**
   * 更新通知偏好设置
   */
  updateNotificationPreferences(preferences) {
    return api({
      url: '/community/notifications/preferences',
      method: 'put',
      data: preferences
    }).then(res => {
      // 清除缓存
      this.invalidateCache('notifications:preferences')
      return res
    })
  }

  /**
   * @ 提及：搜索可提及的用户
   */
  searchMentionableUsers(keyword) {
    const key = `mentions:search:${keyword}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/mentions/search',
            method: 'get',
            params: { q: keyword }
          })
        ),
      1 * 60 * 1000  // 1分钟缓存
    )
  }

  /**
   * 获取被提及的用户列表
   */
  getMentionedUsers() {
    return this.getCached(
      'mentions:mentioned-users',
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/mentions/users',
            method: 'get'
          })
        ),
      10 * 60 * 1000  // 10分钟缓存
    )
  }

  /**
   * 获取提及历史
   */
  getMentionHistory() {
    return this.getCached(
      'mentions:history',
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/mentions/history',
            method: 'get'
          })
        ),
      10 * 60 * 1000  // 10分钟缓存
    )
  }

  /**
   * 私信：获取会话列表
   */
  getConversations() {
    return this.getCached(
      'messages:conversations',
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/messages/conversations',
            method: 'get'
          })
        ),
      3 * 60 * 1000  // 3分钟缓存
    )
  }

  /**
   * 搜索会话
   */
  searchConversations(keyword) {
    const key = `messages:search:${keyword}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/messages/conversations/search',
            method: 'get',
            params: { q: keyword }
          })
        ),
      1 * 60 * 1000  // 1分钟缓存
    )
  }

  /**
   * 获取单个会话及其消息
   */
  getConversation(conversationId) {
    const key = `messages:conversation:${conversationId}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/messages/conversations/${conversationId}`,
            method: 'get'
          })
        ),
      3 * 60 * 1000  // 3分钟缓存
    )
  }

  /**
   * 获取会话消息（分页）
   */
  getConversationMessages(conversationId, params) {
    const key = `messages:${conversationId}:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: `/community/messages/conversations/${conversationId}/messages`,
            method: 'get',
            params
          })
        ),
      3 * 60 * 1000  // 3分钟缓存
    )
  }

  /**
   * 发送私信
   */
  sendPrivateMessage(recipientId, data) {
    return this.retryRequest(() =>
      api({
        url: `/community/messages/send/${recipientId}`,
        method: 'post',
        data
      })
    ).then(res => {
      // 清除会话缓存
      this.invalidateCache('messages:conversations')
      this.invalidateCache(`messages:conversation:`)
      return res
    })
  }

  /**
   * 标记会话为已读
   */
  markConversationAsRead(conversationId) {
    return api({
      url: `/community/messages/conversations/${conversationId}/read`,
      method: 'post'
    }).then(res => {
      // 清除缓存
      this.invalidateCache('messages:conversations')
      return res
    })
  }

  /**
   * 删除会话
   */
  deleteConversation(conversationId) {
    return api({
      url: `/community/messages/conversations/${conversationId}`,
      method: 'delete'
    }).then(res => {
      // 清除缓存
      this.invalidateCache('messages:conversations')
      this.invalidateCache(`messages:conversation:${conversationId}`)
      return res
    })
  }

  /**
   * 开始新会话
   */
  startConversation(userId) {
    return this.retryRequest(() =>
      api({
        url: `/community/messages/conversations/start/${userId}`,
        method: 'post'
      })
    ).then(res => {
      // 清除缓存
      this.invalidateCache('messages:conversations')
      return res
    })
  }

  /**
   * 推荐：获取推荐用户
   */
  getRecommendedUsers(params) {
    const key = `recommendations:users:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/recommendations/users',
            method: 'get',
            params
          })
        ),
      30 * 60 * 1000  // 30分钟缓存（推荐变化不频繁）
    )
  }

  /**
   * 获取热门创作者
   */
  getTrendingCreators(params) {
    const key = `recommendations:trending:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/recommendations/creators',
            method: 'get',
            params
          })
        ),
      30 * 60 * 1000  // 30分钟缓存
    )
  }

  /**
   * 获取相似用户
   */
  getSimilarUsers(params) {
    const key = `recommendations:similar:${JSON.stringify(params)}`
    return this.getCached(
      key,
      () =>
        this.retryRequest(() =>
          api({
            url: '/community/recommendations/similar',
            method: 'get',
            params
          })
        ),
      30 * 60 * 1000  // 30分钟缓存
    )
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
