/**
 * 关注系统 API 路由
 * 处理用户关注、粉丝列表等功能
 */

const express = require('express')
const router = express.Router()

// 模拟数据存储
let followData = {
  follows: [
    // 示例数据
    { id: 1, followerId: 1, followingId: 2, createdAt: '2025-01-01T10:00:00Z' },
    { id: 2, followerId: 1, followingId: 3, createdAt: '2025-01-02T10:00:00Z' },
    { id: 3, followerId: 2, followingId: 1, createdAt: '2025-01-03T10:00:00Z' },
    { id: 4, followerId: 3, followingId: 1, createdAt: '2025-01-04T10:00:00Z' },
    { id: 5, followerId: 4, followingId: 1, createdAt: '2025-01-05T10:00:00Z' }
  ],
  followIdCounter: 6,
  // 模拟用户信息
  users: [
    {
      id: 1,
      username: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      bio: '全栈开发工程师，热爱技术分享',
      stats: { followers: 3, following: 2, posts: 15 }
    },
    {
      id: 2,
      username: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      bio: '前端架构师，React 专家',
      stats: { followers: 1, following: 5, posts: 23 }
    },
    {
      id: 3,
      username: '王五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      bio: 'Node.js 后端开发，开源爱好者',
      stats: { followers: 1, following: 8, posts: 31 }
    },
    {
      id: 4,
      username: '赵六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
      bio: 'UI/UX 设计师，追求极致体验',
      stats: { followers: 1, following: 3, posts: 12 }
    },
    {
      id: 5,
      username: '刘七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
      bio: '算法工程师，ACM 金牌',
      stats: { followers: 0, following: 2, posts: 8 }
    },
    {
      id: 6,
      username: '陈八',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
      bio: 'DevOps 工程师，云原生实践者',
      stats: { followers: 0, following: 4, posts: 19 }
    },
    {
      id: 7,
      username: '周九',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7',
      bio: '数据分析师，Python 爱好者',
      stats: { followers: 0, following: 6, posts: 27 }
    },
    {
      id: 8,
      username: '吴十',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8',
      bio: '移动端开发，Flutter 实践者',
      stats: { followers: 0, following: 1, posts: 14 }
    }
  ]
}

/**
 * 获取用户信息
 */
function getUserById(userId) {
  return followData.users.find(u => u.id === userId) || {
    id: userId,
    username: `用户${userId}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    bio: '这个人很懒，什么都没写',
    stats: { followers: 0, following: 0, posts: 0 }
  }
}

/**
 * 检查是否互相关注
 */
function checkMutualFollow(userId, targetUserId) {
  const userFollowsTarget = followData.follows.some(
    f => f.followerId === userId && f.followingId === targetUserId
  )
  const targetFollowsUser = followData.follows.some(
    f => f.followerId === targetUserId && f.followingId === userId
  )
  return userFollowsTarget && targetFollowsUser
}

/**
 * 检查是否关注
 */
function isFollowing(userId, targetUserId) {
  return followData.follows.some(
    f => f.followerId === userId && f.followingId === targetUserId
  )
}

/**
 * 认证中间件
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Missing authentication token'
    })
  }

  try {
    const userId = parseInt(token) || 1
    req.user = { id: userId }
    next()
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: 'Invalid token',
      error: error.message
    })
  }
}

/**
 * GET /api/users/:id/following - 获取用户关注列表
 */
router.get('/:id/following', (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id)
    const { page = 1, size = 12 } = req.query
    const currentUserId = req.user?.id || 1

    // 获取关注的用户 ID 列表
    const followingIds = followData.follows
      .filter(f => f.followerId === targetUserId)
      .map(f => ({
        id: f.followingId,
        followedAt: f.createdAt
      }))

    // 获取用户详细信息
    const followingUsers = followingIds.map(({ id, followedAt }) => {
      const user = getUserById(id)
      return {
        ...user,
        followedAt,
        isFollowing: true, // 在关注列表中，都是已关注的
        isMutual: checkMutualFollow(targetUserId, id) // 是否互相关注
      }
    })

    // 分页
    const start = (parseInt(page) - 1) * parseInt(size)
    const end = start + parseInt(size)
    const paginatedUsers = followingUsers.slice(start, end)

    res.json({
      code: 200,
      message: 'Following list retrieved successfully',
      data: {
        items: paginatedUsers,
        page: parseInt(page),
        size: parseInt(size),
        total: followingUsers.length
      }
    })
  } catch (error) {
    console.error('[GET /users/:id/following] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve following list',
      error: error.message
    })
  }
})

/**
 * GET /api/users/:id/followers - 获取用户粉丝列表
 */
router.get('/:id/followers', (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id)
    const { page = 1, size = 12 } = req.query
    const currentUserId = req.user?.id || 1

    // 获取粉丝的用户 ID 列表
    const followerIds = followData.follows
      .filter(f => f.followingId === targetUserId)
      .map(f => ({
        id: f.followerId,
        followedAt: f.createdAt
      }))

    // 获取用户详细信息
    const followers = followerIds.map(({ id, followedAt }) => {
      const user = getUserById(id)
      return {
        ...user,
        followedAt,
        isFollowing: isFollowing(currentUserId, id), // 当前用户是否关注了这个粉丝
        isMutual: checkMutualFollow(targetUserId, id) // 是否互相关注
      }
    })

    // 分页
    const start = (parseInt(page) - 1) * parseInt(size)
    const end = start + parseInt(size)
    const paginatedUsers = followers.slice(start, end)

    res.json({
      code: 200,
      message: 'Followers list retrieved successfully',
      data: {
        items: paginatedUsers,
        page: parseInt(page),
        size: parseInt(size),
        total: followers.length
      }
    })
  } catch (error) {
    console.error('[GET /users/:id/followers] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve followers list',
      error: error.message
    })
  }
})

/**
 * POST /api/users/:id/follow - 关注用户
 */
router.post('/:id/follow', auth, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id)
    const userId = req.user.id

    // 不能关注自己
    if (userId === targetUserId) {
      return res.status(400).json({
        code: 400,
        message: '不能关注自己'
      })
    }

    // 检查是否已关注
    const existing = followData.follows.find(
      f => f.followerId === userId && f.followingId === targetUserId
    )

    if (existing) {
      return res.status(400).json({
        code: 400,
        message: '已经关注该用户'
      })
    }

    // 添加关注记录
    const newFollow = {
      id: followData.followIdCounter++,
      followerId: userId,
      followingId: targetUserId,
      createdAt: new Date().toISOString()
    }
    followData.follows.push(newFollow)

    // 更新统计
    const targetUser = followData.users.find(u => u.id === targetUserId)
    if (targetUser) {
      targetUser.stats.followers++
    }
    const currentUser = followData.users.find(u => u.id === userId)
    if (currentUser) {
      currentUser.stats.following++
    }

    res.json({
      code: 200,
      message: '关注成功',
      data: {
        followId: newFollow.id,
        isMutual: checkMutualFollow(userId, targetUserId)
      }
    })
  } catch (error) {
    console.error('[POST /users/:id/follow] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to follow user',
      error: error.message
    })
  }
})

/**
 * DELETE /api/users/:id/follow - 取消关注
 */
router.delete('/:id/follow', auth, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id)
    const userId = req.user.id

    // 查找关注记录
    const index = followData.follows.findIndex(
      f => f.followerId === userId && f.followingId === targetUserId
    )

    if (index === -1) {
      return res.status(400).json({
        code: 400,
        message: '未关注该用户'
      })
    }

    // 删除关注记录
    followData.follows.splice(index, 1)

    // 更新统计
    const targetUser = followData.users.find(u => u.id === targetUserId)
    if (targetUser && targetUser.stats.followers > 0) {
      targetUser.stats.followers--
    }
    const currentUser = followData.users.find(u => u.id === userId)
    if (currentUser && currentUser.stats.following > 0) {
      currentUser.stats.following--
    }

    res.json({
      code: 200,
      message: '取消关注成功'
    })
  } catch (error) {
    console.error('[DELETE /users/:id/follow] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to unfollow user',
      error: error.message
    })
  }
})

/**
 * GET /api/users/:id/follow-stats - 获取用户关注统计
 */
router.get('/:id/follow-stats', (req, res) => {
  try {
    const userId = parseInt(req.params.id)

    const followingCount = followData.follows.filter(f => f.followerId === userId).length
    const followersCount = followData.follows.filter(f => f.followingId === userId).length

    res.json({
      code: 200,
      message: 'Stats retrieved successfully',
      data: {
        following: followingCount,
        followers: followersCount
      }
    })
  } catch (error) {
    console.error('[GET /users/:id/follow-stats] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve stats',
      error: error.message
    })
  }
})

module.exports = router
