const contributionsData = require('../data/contributions-data.json')

/**
 * 贡献者资料控制器
 * @description 处理用户资料查询、更新、统计数据聚合等
 */
class ContributorController {
  /**
   * 获取贡献者详细资料
   * @description 聚合用户信息、统计数据、徽章、活动日志等
   * @route GET /contributions/profile/:userId
   */
  getProfile(req, res) {
    const userId = parseInt(req.params.userId, 10)

    // 1. 查找用户基础资料
    const profile = contributionsData.profiles.find(
      p => p.userId === userId
    )

    if (!profile) {
      // 返回默认资料（用于新用户或mock场景）
      return res.json({
        code: 200,
        message: 'Profile loaded (default)',
        data: this.getDefaultProfile(userId)
      })
    }

    // 2. 聚合最近提交记录（最多10条）
    const recentSubmissions = contributionsData.submissions
      .filter(s => s.authorId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        title: s.title,
        domain: s.domain,
        status: s.status,
        date: this.formatDate(s.createdAt)
      }))

    // 3. 计算等级
    const level = Math.floor(profile.stats.totalPoints / 50) + 1

    // 4. 构造完整响应
    const fullProfile = {
      userId: profile.userId,
      username: profile.username || `用户${userId}`,
      avatar: profile.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      bio: profile.bio || '这个人很懒，什么都没写~',
      joinDate: profile.joinDate || '2024-08-01',
      level,
      stats: profile.stats,
      badges: profile.badges || [],
      expertise: profile.expertise || [],
      activityLog: profile.activityLog || [],
      recentSubmissions
    }

    res.json({
      code: 200,
      message: 'Profile loaded',
      data: fullProfile
    })
  }

  /**
   * 获取默认用户资料
   * @description 为没有资料的用户返回默认数据
   */
  getDefaultProfile(userId) {
    return {
      userId,
      username: `用户${userId}`,
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      bio: '这个人很懒，什么都没写~',
      joinDate: new Date().toISOString().split('T')[0],
      level: 1,
      stats: {
        totalSubmissions: 0,
        approvedCount: 0,
        approvalRate: 0,
        totalPoints: 0
      },
      badges: [],
      expertise: [],
      activityLog: [],
      recentSubmissions: []
    }
  }

  /**
   * 更新用户资料
   * @description 允许用户编辑个人简介和头像
   * @route PUT /contributions/profile/:userId
   */
  updateProfile(req, res) {
    const userId = parseInt(req.params.userId, 10)
    const { bio, avatar } = req.body

    const profile = contributionsData.profiles.find(p => p.userId === userId)

    if (!profile) {
      return res.status(404).json({
        code: 404,
        message: 'Profile not found'
      })
    }

    if (bio !== undefined) profile.bio = bio
    if (avatar !== undefined) profile.avatar = avatar

    res.json({
      code: 200,
      message: 'Profile updated',
      data: profile
    })
  }

  /**
   * 获取用户贡献热力图数据
   * @description 统计用户每日提交数量，用于生成贡献热力图
   * @route GET /contributions/profile/:userId/heatmap
   */
  getContributionHeatmap(req, res) {
    const userId = parseInt(req.params.userId, 10)
    const { startDate, endDate } = req.query

    // 从submissions中统计用户每日贡献
    const userSubmissions = contributionsData.submissions
      .filter(s => s.authorId === userId)
      .filter(s => {
        if (!startDate || !endDate) return true
        const date = new Date(s.createdAt)
        return date >= new Date(startDate) && date <= new Date(endDate)
      })

    // 按日期分组统计
    const heatmapData = {}
    userSubmissions.forEach(s => {
      const date = s.createdAt.split('T')[0]
      heatmapData[date] = (heatmapData[date] || 0) + 1
    })

    res.json({
      code: 200,
      message: 'Heatmap data retrieved',
      data: heatmapData
    })
  }

  /**
   * 获取用户贡献统计摘要
   * @description 返回用户的快速统计信息（用于卡片展示）
   * @route GET /contributions/profile/:userId/stats
   */
  getProfileStats(req, res) {
    const userId = parseInt(req.params.userId, 10)

    const profile = contributionsData.profiles.find(p => p.userId === userId)

    if (!profile) {
      return res.json({
        code: 200,
        message: 'Stats retrieved (default)',
        data: {
          totalSubmissions: 0,
          approvedCount: 0,
          approvalRate: 0,
          totalPoints: 0,
          rank: 999
        }
      })
    }

    // 查找用户在排行榜中的排名
    const leaderboardEntry = contributionsData.leaderboard.find(
      l => l.userId === userId
    )
    const rank = leaderboardEntry ? leaderboardEntry.rank : 999

    res.json({
      code: 200,
      message: 'Stats retrieved',
      data: {
        ...profile.stats,
        rank
      }
    })
  }

  /**
   * 格式化日期
   * @private
   */
  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
  }
}

module.exports = new ContributorController()
