/**
 * Social Collaboration Service - Sharing, Leaderboards & Community
 *
 * Features:
 * - Content sharing with analytics
 * - Leaderboard rankings (global, domain, friends)
 * - Social graph management (follow/unfollow)
 * - User profiles and discovery
 * - Activity feed and interactions
 * - Community highlights
 *
 * @module socialCollaborationService
 */

const socialCollaborationService = {
  /**
   * Create or get leaderboard
   * @param {string} type - 'global'|'domain'|'friends'
   * @param {string} timeframe - 'all'|'month'|'week'
   * @param {number} domainId - For domain leaderboard
   * @returns {Array} Leaderboard entries
   */
  getLeaderboard(type = 'global', timeframe = 'month', domainId = null) {
    const key = `leaderboard_${type}_${timeframe}${domainId ? '_' + domainId : ''}`
    const saved = localStorage.getItem(key)

    if (saved) {
      return JSON.parse(saved)
    }

    // Generate mock leaderboard for demo
    return this._generateMockLeaderboard(10)
  },

  /**
   * Generate mock leaderboard
   * @private
   */
  _generateMockLeaderboard(count) {
    const users = []
    for (let i = 1; i <= count; i++) {
      users.push({
        rank: i,
        userId: `user_${i}`,
        userName: `Learner ${i}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
        points: Math.max(100, 5000 - i * 300),
        level: Math.max(1, Math.ceil((5000 - i * 300) / 600)),
        streak: Math.floor(Math.random() * 30) + 1,
        achievementCount: Math.floor(Math.random() * 12) + 1,
        domainsCompleted: Math.floor(Math.random() * 50) + 1,
        medal: i === 1 ? '🥇' : i === 2 ? '🥈' : i === 3 ? '🥉' : ''
      })
    }
    return users
  },

  /**
   * Get user position in leaderboard
   * @param {string} userId
   * @param {string} type
   * @param {string} timeframe
   * @returns {Object} User position and surrounding users
   */
  getUserLeaderboardPosition(userId, type = 'global', timeframe = 'month') {
    const leaderboard = this.getLeaderboard(type, timeframe)
    const userPos = leaderboard.findIndex(u => u.userId === userId)

    if (userPos === -1) {
      return null
    }

    return {
      userPosition: userPos + 1,
      userRank: leaderboard[userPos],
      above: leaderboard.slice(Math.max(0, userPos - 2), userPos),
      below: leaderboard.slice(userPos + 1, Math.min(leaderboard.length, userPos + 3))
    }
  },

  /**
   * Share content
   * @param {string} userId
   * @param {string} contentType - 'achievement'|'domain'|'path'|'progress'
   * @param {string} contentId
   * @param {string} message
   * @returns {Object} Share link and info
   */
  shareContent(userId, contentType, contentId, message = '') {
    const share = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      contentType,
      contentId,
      message,
      link: `${window.location.origin}?share=${contentId}`,
      createdAt: new Date(),
      views: 0,
      clicks: 0,
      shares: 0,
      likes: [],
      comments: []
    }

    // Save share
    const shares = this._getShares()
    shares.push(share)
    localStorage.setItem('social_shares', JSON.stringify(shares))

    return share
  },

  /**
   * Get user shares
   * @param {string} userId
   * @returns {Array} User's shares
   */
  getUserShares(userId) {
    const shares = this._getShares()
    return shares.filter(s => s.userId === userId)
  },

  /**
   * Track share view
   * @param {string} shareId
   */
  trackShareView(shareId) {
    const shares = this._getShares()
    const share = shares.find(s => s.id === shareId)
    if (share) {
      share.views++
      localStorage.setItem('social_shares', JSON.stringify(shares))
    }
  },

  /**
   * Get share analytics
   * @param {string} shareId
   * @returns {Object} Share analytics
   */
  getShareAnalytics(shareId) {
    const shares = this._getShares()
    const share = shares.find(s => s.id === shareId)

    if (!share) return null

    return {
      shareId,
      views: share.views,
      clicks: share.clicks,
      shares: share.shares,
      likes: share.likes.length,
      comments: share.comments.length,
      engagement: Math.round(((share.clicks + share.shares + share.likes.length) / Math.max(1, share.views)) * 100),
      createdAt: share.createdAt
    }
  },

  /**
   * Get shares
   * @private
   */
  _getShares() {
    const saved = localStorage.getItem('social_shares')
    return saved ? JSON.parse(saved) : []
  },

  /**
   * Follow user
   * @param {string} userId
   * @param {string} targetUserId
   */
  followUser(userId, targetUserId) {
    const followers = this._getFollowers(userId)
    if (!followers.includes(targetUserId)) {
      followers.push(targetUserId)
      localStorage.setItem(`followers_${userId}`, JSON.stringify(followers))
    }

    const following = this._getFollowing(targetUserId)
    if (!following.includes(userId)) {
      following.push(userId)
      localStorage.setItem(`following_${targetUserId}`, JSON.stringify(following))
    }
  },

  /**
   * Unfollow user
   * @param {string} userId
   * @param {string} targetUserId
   */
  unfollowUser(userId, targetUserId) {
    const followers = this._getFollowers(userId)
    const idx = followers.indexOf(targetUserId)
    if (idx > -1) {
      followers.splice(idx, 1)
      localStorage.setItem(`followers_${userId}`, JSON.stringify(followers))
    }

    const following = this._getFollowing(targetUserId)
    const idx2 = following.indexOf(userId)
    if (idx2 > -1) {
      following.splice(idx2, 1)
      localStorage.setItem(`following_${targetUserId}`, JSON.stringify(following))
    }
  },

  /**
   * Get followers
   * @param {string} userId
   * @returns {Array} User IDs
   */
  getFollowers(userId) {
    return this._getFollowers(userId)
  },

  /**
   * Get following
   * @param {string} userId
   * @returns {Array} User IDs
   */
  getFollowing(userId) {
    return this._getFollowing(userId)
  },

  /**
   * Get followers
   * @private
   */
  _getFollowers(userId) {
    const saved = localStorage.getItem(`followers_${userId}`)
    return saved ? JSON.parse(saved) : []
  },

  /**
   * Get following
   * @private
   */
  _getFollowing(userId) {
    const saved = localStorage.getItem(`following_${userId}`)
    return saved ? JSON.parse(saved) : []
  },

  /**
   * Check if users are friends
   * @param {string} userId1
   * @param {string} userId2
   * @returns {boolean}
   */
  isFriends(userId1, userId2) {
    return this.getFollowers(userId1).includes(userId2) &&
           this.getFollowing(userId1).includes(userId2)
  },

  /**
   * Get user profile
   * @param {string} userId
   * @returns {Object} User profile
   */
  getUserProfile(userId) {
    const profile = {
      userId,
      userName: `Learner ${userId}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      bio: '🎓 Learning enthusiast | 📚 Knowledge seeker',
      points: Math.floor(Math.random() * 3000),
      level: Math.floor(Math.random() * 7) + 1,
      followers: this._getFollowers(userId).length,
      following: this._getFollowing(userId).length,
      domainsCompleted: Math.floor(Math.random() * 50),
      streak: Math.floor(Math.random() * 30),
      achievements: Math.floor(Math.random() * 12),
      isVerified: Math.random() > 0.7
    }
    return profile
  },

  /**
   * Get user feed
   * @param {string} userId
   * @param {number} limit
   * @param {number} offset
   * @returns {Array} Feed items
   */
  getUserFeed(userId, limit = 10, offset = 0) {
    const following = this._getFollowing(userId)

    const feed = []

    // Generate mock feed items
    const activityTypes = ['achievement', 'completion', 'share', 'streak']
    for (let i = 0; i < 20; i++) {
      const followerId = following[Math.floor(Math.random() * following.length)] || `user_${i}`
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]

      feed.push({
        id: `activity_${i}`,
        userId: followerId,
        userName: `Learner ${followerId}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${followerId}`,
        type,
        title: this._getActivityTitle(type),
        description: this._getActivityDescription(type),
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
        likes: [],
        comments: [],
        shares: 0
      })
    }

    return feed.slice(offset, offset + limit)
  },

  /**
   * Get activity title
   * @private
   */
  _getActivityTitle(type) {
    const titles = {
      achievement: '解锁成就',
      completion: '完成学科',
      share: '分享学习',
      streak: '连续学习'
    }
    return titles[type] || '活动'
  },

  /**
   * Get activity description
   * @private
   */
  _getActivityDescription(type) {
    const descriptions = {
      achievement: '🎉 解锁了新的成就勋章！',
      completion: '✅ 完成了一个新的学科学习',
      share: '📤 分享了学习成就',
      streak: '🔥 保持了连续学习记录'
    }
    return descriptions[type] || '进行了学习活动'
  },

  /**
   * Like activity
   * @param {string} userId
   * @param {string} activityId
   */
  likeActivity(userId, activityId) {
    // In real app, persist to database
    const likes = {[activityId]: true}
    localStorage.setItem(`likes_${userId}`, JSON.stringify(likes))
  },

  /**
   * Unlike activity
   * @param {string} userId
   * @param {string} activityId
   */
  unlikeActivity(userId, activityId) {
    const likes = JSON.parse(localStorage.getItem(`likes_${userId}`) || '{}')
    delete likes[activityId]
    localStorage.setItem(`likes_${userId}`, JSON.stringify(likes))
  },

  /**
   * Comment on activity
   * @param {string} userId
   * @param {string} activityId
   * @param {string} comment
   */
  commentOnActivity(userId, activityId, comment) {
    const comments = {
      id: `comment_${Date.now()}`,
      userId,
      userName: `User ${userId}`,
      text: comment,
      timestamp: new Date()
    }
    return comments
  },

  /**
   * Get trending domains
   * @param {number} limit
   * @returns {Array} Trending domains
   */
  getTrendingDomains(limit = 10) {
    const domains = []
    const domainNames = [
      'JavaScript', 'Python', 'React', 'Vue.js', 'TypeScript',
      'Node.js', 'SQL', 'MongoDB', 'Docker', 'Kubernetes',
      'AWS', 'GraphQL', 'REST API', 'Microservices', 'DevOps'
    ]

    for (let i = 0; i < Math.min(limit, domainNames.length); i++) {
      domains.push({
        id: i + 1,
        name: domainNames[i],
        trending: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 500),
        learners: Math.floor(Math.random() * 1000),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })
    }

    return domains.sort((a, b) => b.trending - a.trending)
  },

  /**
   * Get trending users
   * @param {number} limit
   * @returns {Array} Trending users
   */
  getTrendingUsers(limit = 10) {
    const users = []

    for (let i = 1; i <= limit; i++) {
      users.push({
        userId: `user_${i}`,
        userName: `Trending Learner ${i}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=trend${i}`,
        points: Math.floor(Math.random() * 5000),
        followers: Math.floor(Math.random() * 500),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        reason: 'Rising star educator'
      })
    }

    return users
  },

  /**
   * Get recommended users
   * @param {string} userId
   * @returns {Array} Recommended users
   */
  getRecommendedUsers(userId) {
    return this._generateMockLeaderboard(5).map((user, idx) => ({
      ...user,
      reason: idx === 0 ? 'Similar interests' : idx === 1 ? 'Popular in your network' : 'Trending this week'
    }))
  },

  /**
   * Get community highlights
   * @returns {Array} Highlights
   */
  getCommunityHighlights() {
    return [
      {
        id: 1,
        title: '本周最活跃学习者',
        description: '连续7天保持学习活跃的用户',
        icon: '🔥',
        count: 42
      },
      {
        id: 2,
        title: '最受欢迎的学科',
        description: '本周被分享最多的学科',
        icon: '⭐',
        name: 'React.js',
        shares: 156
      },
      {
        id: 3,
        title: '社区成就解锁',
        description: '集体完成的成就',
        icon: '🎉',
        count: 5,
        achievement: '100万小时学习'
      }
    ]
  },

  /**
   * Export profile for sharing
   * @param {string} userId
   * @returns {Object} Shareable profile
   */
  exportProfile(userId) {
    const profile = this.getUserProfile(userId)
    return {
      ...profile,
      shareLink: `${window.location.origin}?profile=${userId}`,
      shareMessage: `👋 Hi! I'm ${profile.userName} and I'm learning on this platform! 📚 Join me and let's grow together!`
    }
  }
}

export default socialCollaborationService
