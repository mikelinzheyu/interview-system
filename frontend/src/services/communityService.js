/**
 * Community Service - Forum, Groups, Guides & Moderation
 *
 * Features:
 * - Forum with threads and discussions
 * - Study groups and collaboration
 * - User guides and tutorials
 * - Moderation system
 * - Community guidelines enforcement
 * - User reputation system
 * - Content reporting and review
 *
 * @module communityService
 */

const communityService = {
  /**
   * Forum operations
   */

  /**
   * Get forum posts
   * @param {string} categoryId
   * @param {number} limit
   * @param {number} offset
   * @returns {Array} Forum posts
   */
  getForumPosts(categoryId = 'general', limit = 20, offset = 0) {
    const posts = []
    const categories = {
      general: '常见问题',
      learning: '学习讨论',
      projects: '项目分享',
      help: '求助',
      announcements: '公告'
    }

    for (let i = 0; i < limit; i++) {
      const idx = offset + i
      posts.push({
        id: `post_${idx}`,
        title: this._generatePostTitle(categoryId, idx),
        author: {
          userId: `user_${Math.floor(Math.random() * 100)}`,
          userName: `Learner ${Math.floor(Math.random() * 100)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${idx}`,
          reputation: Math.floor(Math.random() * 500) + 50
        },
        category: categories[categoryId] || '一般',
        content: this._generatePostContent(idx),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        views: Math.floor(Math.random() * 500) + 10,
        replies: Math.floor(Math.random() * 20),
        likes: Math.floor(Math.random() * 30),
        tags: this._generateTags(categoryId),
        solved: Math.random() > 0.7,
        pinned: Math.random() > 0.9
      })
    }

    return posts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.createdAt - a.createdAt
    })
  },

  /**
   * Create forum post
   * @param {string} userId
   * @param {string} title
   * @param {string} content
   * @param {string} categoryId
   * @param {Array} tags
   * @returns {Object} Created post
   */
  createForumPost(userId, title, content, categoryId = 'general', tags = []) {
    const post = {
      id: `post_${Date.now()}`,
      title,
      author: {
        userId,
        userName: `User ${userId}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        reputation: 100
      },
      category: categoryId,
      content,
      createdAt: new Date(),
      views: 0,
      replies: 0,
      likes: 0,
      tags,
      solved: false,
      pinned: false
    }

    // Save to localStorage
    const posts = this._getForumPosts()
    posts.push(post)
    localStorage.setItem('forum_posts', JSON.stringify(posts))

    return post
  },

  /**
   * Get post replies
   * @param {string} postId
   * @returns {Array} Replies
   */
  getPostReplies(postId) {
    const replies = []
    const replyCount = Math.floor(Math.random() * 5) + 1

    for (let i = 0; i < replyCount; i++) {
      replies.push({
        id: `reply_${postId}_${i}`,
        postId,
        author: {
          userId: `user_${Math.floor(Math.random() * 100)}`,
          userName: `Learner ${Math.floor(Math.random() * 100)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=reply${i}`,
          reputation: Math.floor(Math.random() * 500) + 50
        },
        content: this._generateReplyContent(i),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        likes: Math.floor(Math.random() * 20),
        isAccepted: i === 0 && Math.random() > 0.5
      })
    }

    return replies
  },

  /**
   * Study Groups
   */

  /**
   * Get study groups
   * @param {string} domainId
   * @param {number} limit
   * @returns {Array} Study groups
   */
  getStudyGroups(domainId = null, limit = 10) {
    const groups = []
    const domains = ['JavaScript', 'Python', 'React', 'Vue.js', 'TypeScript', 'Node.js']

    for (let i = 0; i < limit; i++) {
      const domain = domains[Math.floor(Math.random() * domains.length)]

      groups.push({
        id: `group_${i}`,
        name: `${domain} 学习小组 ${i + 1}`,
        domain,
        description: `一起学习和讨论 ${domain} 的学习小组`,
        leader: {
          userId: `user_${i}`,
          userName: `Group Leader ${i}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=leader${i}`
        },
        members: Math.floor(Math.random() * 50) + 5,
        maxMembers: 100,
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.3 ? 'active' : 'archived',
        topics: Math.floor(Math.random() * 20),
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        image: `https://api.dicebear.com/7.x/shapes/svg?seed=group${i}`
      })
    }

    return domainId
      ? groups.filter(g => g.domain === domainId)
      : groups
  },

  /**
   * Create study group
   * @param {string} userId
   * @param {string} name
   * @param {string} description
   * @param {string} domain
   * @returns {Object} Created group
   */
  createStudyGroup(userId, name, description, domain) {
    const group = {
      id: `group_${Date.now()}`,
      name,
      domain,
      description,
      leader: {
        userId,
        userName: `User ${userId}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      },
      members: 1,
      maxMembers: 100,
      createdAt: new Date(),
      status: 'active',
      topics: 0,
      lastActivity: new Date(),
      image: `https://api.dicebear.com/7.x/shapes/svg?seed=${userId}`
    }

    // Save to localStorage
    const groups = this._getStudyGroups()
    groups.push(group)
    localStorage.setItem('study_groups', JSON.stringify(groups))

    return group
  },

  /**
   * Join study group
   * @param {string} groupId
   * @param {string} userId
   * @returns {boolean} Success
   */
  joinStudyGroup(groupId, userId) {
    const groups = this._getStudyGroups()
    const group = groups.find(g => g.id === groupId)

    if (group && group.members < group.maxMembers) {
      group.members++
      localStorage.setItem('study_groups', JSON.stringify(groups))
      return true
    }
    return false
  },

  /**
   * Get group discussions
   * @param {string} groupId
   * @returns {Array} Discussions
   */
  getGroupDiscussions(groupId) {
    const discussions = []

    for (let i = 0; i < 5; i++) {
      discussions.push({
        id: `discussion_${groupId}_${i}`,
        groupId,
        title: this._generateDiscussionTitle(i),
        author: {
          userId: `user_${i}`,
          userName: `Member ${i}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=disc${i}`
        },
        content: this._generateDiscussionContent(i),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        replies: Math.floor(Math.random() * 10),
        views: Math.floor(Math.random() * 50)
      })
    }

    return discussions
  },

  /**
   * User Guides
   */

  /**
   * Get user guides
   * @param {string} domain
   * @param {number} limit
   * @returns {Array} Guides
   */
  getUserGuides(domain = null, limit = 10) {
    const guides = []
    const domains = ['JavaScript', 'Python', 'React', 'Vue.js', 'Web Development']
    const guideTypes = ['初学者指南', '最佳实践', '常见陷阱', '性能优化', '调试技巧']

    for (let i = 0; i < limit; i++) {
      const guideDomain = domain || domains[Math.floor(Math.random() * domains.length)]
      const guideType = guideTypes[Math.floor(Math.random() * guideTypes.length)]

      guides.push({
        id: `guide_${i}`,
        title: `${guideDomain} - ${guideType}`,
        domain: guideDomain,
        type: guideType,
        author: {
          userId: `user_${i}`,
          userName: `Expert ${i}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=guide${i}`,
          reputation: Math.floor(Math.random() * 1000) + 500
        },
        description: this._generateGuideDescription(guideDomain, guideType),
        content: this._generateGuideContent(i),
        sections: Math.floor(Math.random() * 5) + 1,
        readTime: Math.floor(Math.random() * 20) + 5,
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        difficulty: ['初级', '中级', '高级'][Math.floor(Math.random() * 3)],
        tags: this._generateGuideTags(guideDomain),
        rating: (Math.random() * 2 + 3).toFixed(1)
      })
    }

    return guides
  },

  /**
   * Create user guide
   * @param {string} userId
   * @param {string} title
   * @param {string} content
   * @param {string} domain
   * @param {Array} tags
   * @returns {Object} Created guide
   */
  createUserGuide(userId, title, content, domain, tags = []) {
    const guide = {
      id: `guide_${Date.now()}`,
      title,
      domain,
      type: '社区贡献',
      author: {
        userId,
        userName: `User ${userId}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        reputation: 50
      },
      description: title,
      content,
      sections: 1,
      readTime: Math.ceil(content.length / 500),
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      difficulty: '中级',
      tags,
      rating: 0
    }

    // Save to localStorage
    const guides = this._getUserGuides()
    guides.push(guide)
    localStorage.setItem('user_guides', JSON.stringify(guides))

    return guide
  },

  /**
   * Rate guide
   * @param {string} guideId
   * @param {number} rating
   * @returns {Object} Updated guide
   */
  rateGuide(guideId, rating) {
    const guides = this._getUserGuides()
    const guide = guides.find(g => g.id === guideId)

    if (guide) {
      guide.rating = Math.round((parseFloat(guide.rating) + rating) / 2 * 10) / 10
      localStorage.setItem('user_guides', JSON.stringify(guides))
    }

    return guide
  },

  /**
   * Moderation
   */

  /**
   * Report content
   * @param {string} contentType - 'post', 'reply', 'guide', 'comment'
   * @param {string} contentId
   * @param {string} userId
   * @param {string} reason
   * @returns {Object} Report
   */
  reportContent(contentType, contentId, userId, reason) {
    const report = {
      id: `report_${Date.now()}`,
      contentType,
      contentId,
      userId,
      reason,
      createdAt: new Date(),
      status: 'pending', // pending, reviewing, resolved, dismissed
      moderatorNotes: ''
    }

    // Save to localStorage
    const reports = this._getReports()
    reports.push(report)
    localStorage.setItem('moderation_reports', JSON.stringify(reports))

    return report
  },

  /**
   * Get community guidelines
   * @returns {Array} Guidelines
   */
  getCommunityGuidelines() {
    return [
      {
        id: 1,
        title: '尊重他人',
        description: '对所有社区成员要友善和尊重，即使观点不同',
        icon: '🤝'
      },
      {
        id: 2,
        title: '发布相关内容',
        description: '确保你的帖子、评论和指南与学习相关',
        icon: '📌'
      },
      {
        id: 3,
        title: '避免垃圾信息',
        description: '不要发送垃圾邮件、广告或无关内容',
        icon: '🚫'
      },
      {
        id: 4,
        title: '尊重隐私',
        description: '不要分享他人的个人信息或敏感数据',
        icon: '🔐'
      },
      {
        id: 5,
        title: '使用建设性批评',
        description: '提供反馈时要具体、有帮助、有尊重',
        icon: '💡'
      },
      {
        id: 6,
        title: '遵守版权',
        description: '尊重知识产权，引用原始来源',
        icon: '©️'
      }
    ]
  },

  /**
   * Get user reputation
   * @param {string} userId
   * @returns {Object} Reputation data
   */
  getUserReputation(userId) {
    return {
      userId,
      score: Math.floor(Math.random() * 500) + 100,
      level: Math.floor(Math.random() * 5) + 1,
      badges: [
        { id: 1, name: '帮助者', icon: '🤝', count: Math.floor(Math.random() * 20) },
        { id: 2, name: '贡献者', icon: '✍️', count: Math.floor(Math.random() * 10) },
        { id: 3, name: '教导者', icon: '👨‍🏫', count: Math.floor(Math.random() * 15) }
      ],
      postsCreated: Math.floor(Math.random() * 50),
      repliesCreated: Math.floor(Math.random() * 100),
      guidesCreated: Math.floor(Math.random() * 10),
      helpfulVotes: Math.floor(Math.random() * 200)
    }
  },

  /**
   * Private helper methods
   */

  _generatePostTitle(category, idx) {
    const titles = {
      general: [
        '如何开始学习编程？',
        '推荐一些好的学习资源',
        '学习中遇到的挑战',
        '分享我的学习经验'
      ],
      learning: [
        '深入理解闭包',
        'JavaScript 异步编程技巧',
        'React Hooks 最佳实践',
        'Vue.js 性能优化指南'
      ],
      projects: [
        '我的第一个项目分享',
        '完成了一个有趣的小游戏',
        '构建了一个TODO应用',
        '做了个实时聊天应用'
      ],
      help: [
        '这段代码为什么不工作？',
        '如何调试这个问题？',
        '有人能解释一下这个概念吗？',
        '求助：错误提示不明白'
      ],
      announcements: [
        '新课程发布',
        '社区活动通知',
        '维护计划',
        '新功能介绍'
      ]
    }

    const categoryTitles = titles[category] || titles.general
    return categoryTitles[idx % categoryTitles.length]
  },

  _generatePostContent(idx) {
    return `这是第 ${idx} 篇帖子的内容摘要。这里讨论了关于学习和编程的重要话题。...`
  },

  _generateTags(category) {
    const tags = {
      general: ['初学者', '指导', '经验'],
      learning: ['JavaScript', '进阶', '技巧'],
      projects: ['项目', '展示', '代码'],
      help: ['求助', '问题', '解答'],
      announcements: ['通知', '官方', '重要']
    }
    return tags[category] || []
  },

  _generateReplyContent(idx) {
    const replies = [
      '很好的问题！这是我的想法...',
      '我遇到过类似的情况，这样解决...',
      '感谢分享，我学到了很多！',
      '这个方法确实有效，推荐。',
      '+1，完全同意你的看法'
    ]
    return replies[idx % replies.length]
  },

  _generateDiscussionTitle(idx) {
    const titles = [
      '今天学到了什么新东西',
      '遇到的一个有趣的问题',
      '分享一个有用的技巧',
      '讨论最佳实践',
      '代码审查请求'
    ]
    return titles[idx]
  },

  _generateDiscussionContent(idx) {
    return `这是小组讨论 ${idx} 的内容。大家可以在这里交流想法和经验。`
  },

  _generateGuideDescription(domain, type) {
    return `关于 ${domain} 的 ${type} 指南。包含实用的技巧和最佳实践。`
  },

  _generateGuideContent(idx) {
    return `## 指南 ${idx}\n\n这是一个详细的学习指南，包含多个部分和代码示例。\n\n### 1. 基础知识\n...\n\n### 2. 进阶技巧\n...\n\n### 3. 常见问题\n...`
  },

  _generateGuideTags(domain) {
    const tags = {
      'JavaScript': ['ES6', '异步', '原型链'],
      'Python': ['列表推导式', '装饰器', '上下文管理器'],
      'React': ['Hooks', 'State', 'Props'],
      'Vue.js': ['响应式', '组件', '指令'],
      'Web Development': ['HTML', 'CSS', '性能']
    }
    return tags[domain] || []
  },

  _getForumPosts() {
    const saved = localStorage.getItem('forum_posts')
    return saved ? JSON.parse(saved) : []
  },

  _getStudyGroups() {
    const saved = localStorage.getItem('study_groups')
    return saved ? JSON.parse(saved) : []
  },

  _getUserGuides() {
    const saved = localStorage.getItem('user_guides')
    return saved ? JSON.parse(saved) : []
  },

  _getReports() {
    const saved = localStorage.getItem('moderation_reports')
    return saved ? JSON.parse(saved) : []
  }
}

export default communityService
