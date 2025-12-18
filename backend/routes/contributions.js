const express = require('express')
const router = express.Router()
const contributionsData = require('../data/contributions-data.json')
const ContributorController = require('../controllers/ContributorController')

const questions = contributionsData.questions || []
const submissions = contributionsData.submissions || []
const reviewQueue = contributionsData.reviewQueue || []
const contributorProfiles = contributionsData.profiles || []
const leaderboard = contributionsData.leaderboard || []
const badges = contributionsData.badges || []
const recommendations = contributionsData.recommendations || []

const favoriteMap = new Map()
const followersMap = new Map()

function getUserId(req) {
  const headerId = req.headers['x-user-id']
  const queryId = req.query.userId
  const userId = parseInt(headerId || queryId || '1', 10)
  return Number.isNaN(userId) ? 1 : userId
}

function paginate(list, page = 1, limit = 10) {
  const currentPage = Math.max(parseInt(page, 10) || 1, 1)
  const pageSize = Math.max(parseInt(limit, 10) || 10, 1)
  const start = (currentPage - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return {
    items,
    page: currentPage,
    limit: pageSize,
    total: list.length,
    hasMore: start + pageSize < list.length
  }
}

function findQuestion(id) {
  return questions.find((item) => String(item.id) === String(id))
}

function ensureFavoriteSet(userId) {
  if (!favoriteMap.has(userId)) {
    favoriteMap.set(userId, new Set())
  }
  return favoriteMap.get(userId)
}

function findDiscussion(discussionId) {
  for (const question of questions) {
    const match = (question.discussions || []).find(
      (discussion) => discussion.id === discussionId
    )
    if (match) {
      return { question, discussion: match }
    }
  }
  return null
}

function respondList(res, payload) {
  res.json({
    code: 200,
    message: 'OK',
    data: payload
  })
}

// ===== Submissions =====
router.post('/submit', (req, res) => {
  const userId = getUserId(req)
  const payload = req.body || {}

  const submission = {
    id: Date.now(),
    title: payload.title || '未命名题目',
    status: 'pending',
    difficulty: payload.difficulty || '中等',
    domain: payload.domain || '通用',
    authorId: userId,
    description: payload.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewComments: []
  }

  submissions.unshift(submission)

  res.json({
    code: 200,
    message: 'Submission received',
    data: submission
  })
})

router.get('/my-submissions', (req, res) => {
  const userId = getUserId(req)
  const { page = 1, limit = 10, status } = req.query
  const filtered = submissions.filter(
    (submission) =>
      submission.authorId === userId &&
      (!status || submission.status === status)
  )
  respondList(res, paginate(filtered, page, limit))
})

router.get('/submissions/:id', (req, res) => {
  const submission = submissions.find(
    (item) => String(item.id) === String(req.params.id)
  )
  if (!submission) {
    return res.status(404).json({
      code: 404,
      message: 'Submission not found'
    })
  }
  res.json({
    code: 200,
    message: 'Submission detail',
    data: submission
  })
})

router.put('/submissions/:id/revise', (req, res) => {
  const submission = submissions.find(
    (item) => String(item.id) === String(req.params.id)
  )
  if (!submission) {
    return res.status(404).json({
      code: 404,
      message: 'Submission not found'
    })
  }

  const { title, description, difficulty, domain } = req.body || {}
  if (title) submission.title = title
  if (description) submission.description = description
  if (difficulty) submission.difficulty = difficulty
  if (domain) submission.domain = domain
  submission.updatedAt = new Date().toISOString()

  res.json({
    code: 200,
    message: 'Submission updated',
    data: submission
  })
})

router.get('/review-queue', (req, res) => {
  const { page = 1, limit = 10, status } = req.query
  const filtered = reviewQueue.filter(
    (item) => !status || item.status === status
  )
  respondList(res, paginate(filtered, page, limit))
})

router.post('/review-queue/:submissionId/claim', (req, res) => {
  const submission = reviewQueue.find(
    (item) => String(item.submissionId) === String(req.params.submissionId)
  )
  if (!submission) {
    return res.status(404).json({
      code: 404,
      message: 'Review task not found'
    })
  }

  submission.status = 'in_review'
  submission.reviewerId = getUserId(req)
  submission.claimedAt = new Date().toISOString()

  res.json({
    code: 200,
    message: 'Review task claimed',
    data: submission
  })
})

router.post('/submissions/:id/review', (req, res) => {
  const submission = submissions.find(
    (item) => String(item.id) === String(req.params.id)
  )
  if (!submission) {
    return res.status(404).json({
      code: 404,
      message: 'Submission not found'
    })
  }

  const { status = 'approved', comment = '' } = req.body || {}
  submission.status = status
  submission.updatedAt = new Date().toISOString()
  submission.reviewComments = submission.reviewComments || []
  if (comment) {
    submission.reviewComments.push({
      reviewer: `user_${getUserId(req)}`,
      comment,
      createdAt: new Date().toISOString()
    })
  }

  res.json({
    code: 200,
    message: 'Review saved',
    data: submission
  })
})

router.post('/submissions/:id/claim-reward', (req, res) => {
  const submission = submissions.find(
    (item) => String(item.id) === String(req.params.id)
  )
  if (!submission) {
    return res.status(404).json({
      code: 404,
      message: 'Submission not found'
    })
  }

  res.json({
    code: 200,
    message: 'Reward claimed',
    data: {
      submissionId: submission.id,
      points: 50,
      claimedAt: new Date().toISOString()
    }
  })
})

// ===== Question catalog =====
router.get('/questions', (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    difficulty,
    tag,
    search,
    sort = 'latest'
  } = req.query

  let list = [...questions]

  if (category) {
    list = list.filter((item) => item.category === category)
  }
  if (difficulty) {
    list = list.filter((item) => item.difficulty === difficulty)
  }
  if (tag) {
    list = list.filter((item) => (item.tags || []).includes(tag))
  }
  if (search) {
    const keyword = String(search).toLowerCase()
    list = list.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)
    )
  }

  if (sort === 'popular') {
    list.sort((a, b) => (b.views + b.favorites) - (a.views + a.favorites))
  } else if (sort === 'most-discussed') {
    list.sort(
      (a, b) => (b.discussions?.length || 0) - (a.discussions?.length || 0)
    )
  } else {
    list.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  }

  respondList(res, paginate(list, page, limit))
})

router.get('/questions/:id', (req, res) => {
  const question = findQuestion(req.params.id)
  if (!question) {
    return res.status(404).json({
      code: 404,
      message: 'Question not found'
    })
  }
  res.json({
    code: 200,
    message: 'Question retrieved',
    data: question
  })
})

router.post('/questions/:id/favorite', (req, res) => {
  const question = findQuestion(req.params.id)
  if (!question) {
    return res.status(404).json({
      code: 404,
      message: 'Question not found'
    })
  }

  const userId = getUserId(req)
  const set = ensureFavoriteSet(userId)
  if (!set.has(String(question.id))) {
    set.add(String(question.id))
    question.favorites = (question.favorites || 0) + 1
  }

  res.json({
    code: 200,
    message: 'Favorited',
    data: {
      questionId: question.id,
      favorites: question.favorites
    }
  })
})

router.delete('/questions/:id/favorite', (req, res) => {
  const question = findQuestion(req.params.id)
  if (!question) {
    return res.status(404).json({
      code: 404,
      message: 'Question not found'
    })
  }

  const userId = getUserId(req)
  const set = ensureFavoriteSet(userId)
  if (set.has(String(question.id))) {
    set.delete(String(question.id))
    question.favorites = Math.max((question.favorites || 0) - 1, 0)
  }

  res.json({
    code: 200,
    message: 'Unfavorited',
    data: {
      questionId: question.id,
      favorites: question.favorites
    }
  })
})

router.get('/favorites', (req, res) => {
  const userId = getUserId(req)
  const set = ensureFavoriteSet(userId)
  const list = questions.filter((question) =>
    set.has(String(question.id))
  )
  respondList(res, paginate(list, req.query.page, req.query.limit))
})

router.get('/questions/:id/discussions', (req, res) => {
  const question = findQuestion(req.params.id)
  if (!question) {
    return res.status(404).json({
      code: 404,
      message: 'Question not found'
    })
  }

  const discussions = question.discussions || []
  respondList(res, {
    items: discussions,
    total: discussions.length
  })
})

router.post('/questions/:id/discussions', (req, res) => {
  const question = findQuestion(req.params.id)
  if (!question) {
    return res.status(404).json({
      code: 404,
      message: 'Question not found'
    })
  }

  const { content } = req.body || {}
  if (!content || !content.trim()) {
    return res.status(400).json({
      code: 400,
      message: 'Discussion content is required'
    })
  }

  const discussion = {
    id: `d-${Date.now()}`,
    author: `用户${getUserId(req)}`,
    authorId: getUserId(req),
    createdAt: new Date().toISOString(),
    likes: 0,
    isLiked: false,
    content,
    replies: []
  }

  question.discussions = question.discussions || []
  question.discussions.unshift(discussion)

  res.status(201).json({
    code: 200,
    message: 'Discussion created',
    data: discussion
  })
})

router.post('/discussions/:discussionId/replies', (req, res) => {
  const entry = findDiscussion(req.params.discussionId)
  if (!entry) {
    return res.status(404).json({
      code: 404,
      message: 'Discussion not found'
    })
  }

  const { content } = req.body || {}
  if (!content || !content.trim()) {
    return res.status(400).json({
      code: 400,
      message: 'Reply content is required'
    })
  }

  const reply = {
    id: `r-${Date.now()}`,
    author: `用户${getUserId(req)}`,
    authorId: getUserId(req),
    createdAt: new Date().toISOString(),
    content
  }

  entry.discussion.replies = entry.discussion.replies || []
  entry.discussion.replies.push(reply)

  res.status(201).json({
    code: 200,
    message: 'Reply added',
    data: reply
  })
})

router.post('/discussions/:discussionId/like', (req, res) => {
  const entry = findDiscussion(req.params.discussionId)
  if (!entry) {
    return res.status(404).json({
      code: 404,
      message: 'Discussion not found'
    })
  }

  entry.discussion.likes = (entry.discussion.likes || 0) + 1
  entry.discussion.isLiked = true

  res.json({
    code: 200,
    message: 'Discussion liked',
    data: {
      discussionId: entry.discussion.id,
      likes: entry.discussion.likes
    }
  })
})

router.post('/questions/:id/bounty', (req, res) => {
  const question = findQuestion(req.params.id)
  if (!question) {
    return res.status(404).json({
      code: 404,
      message: 'Question not found'
    })
  }

  const { points = 50, deadline } = req.body || {}
  question.bounty = {
    points,
    deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  res.json({
    code: 200,
    message: 'Bounty updated',
    data: question.bounty
  })
})

router.get('/recommendations', (req, res) => {
  respondList(res, {
    items: recommendations
  })
})

router.post('/users/:userId/follow', (req, res) => {
  const targetId = String(req.params.userId)
  const userId = getUserId(req)
  const followers = followersMap.get(targetId) || new Set()
  followers.add(userId)
  followersMap.set(targetId, followers)

  res.json({
    code: 200,
    message: 'Followed',
    data: {
      userId: targetId,
      followers: followers.size
    }
  })
})

router.delete('/users/:userId/follow', (req, res) => {
  const targetId = String(req.params.userId)
  const userId = getUserId(req)
  const followers = followersMap.get(targetId)
  if (followers) {
    followers.delete(userId)
  }

  res.json({
    code: 200,
    message: 'Unfollowed',
    data: {
      userId: targetId,
      followers: followers ? followers.size : 0
    }
  })
})

// ===== Profiles / badges =====
// 获取贡献者详细资料
router.get('/profile/:userId', ContributorController.getProfile.bind(ContributorController))

// 更新用户资料
router.put('/profile/:userId', ContributorController.updateProfile.bind(ContributorController))

// 获取贡献热力图数据
router.get('/profile/:userId/heatmap', ContributorController.getContributionHeatmap.bind(ContributorController))

// 获取用户统计摘要
router.get('/profile/:userId/stats', ContributorController.getProfileStats.bind(ContributorController))

router.get('/leaderboard', (req, res) => {
  respondList(res, {
    items: leaderboard
  })
})

router.get('/badges', (req, res) => {
  respondList(res, {
    items: badges
  })
})

// ===== 热门问题 =====
router.get('/trending', (req, res) => {
  const size = parseInt(req.query.size || '10', 10)
  const trending = questions.slice(0, size).map(q => ({
    id: q.id,
    title: q.title,
    difficulty: q.difficulty || 'medium',
    views: Math.floor(Math.random() * 10000),
    favorites: Math.floor(Math.random() * 1000)
  }))
  res.json({
    code: 200,
    message: 'Trending questions',
    data: trending
  })
})

// ===== 问题分类 =====
router.get('/categories', (req, res) => {
  const categories = [
    { id: 1, name: '技术基础', count: 245 },
    { id: 2, name: '算法设计', count: 189 },
    { id: 3, name: '系统设计', count: 156 },
    { id: 4, name: '数据库', count: 134 },
    { id: 5, name: '前端开发', count: 267 },
    { id: 6, name: '后端开发', count: 312 }
  ]
  res.json({
    code: 200,
    message: 'Question categories',
    data: categories
  })
})

// ===== 问题标签 =====
router.get('/tags', (req, res) => {
  const tags = [
    { id: 1, name: 'JavaScript', count: 156 },
    { id: 2, name: 'React', count: 134 },
    { id: 3, name: 'Node.js', count: 98 },
    { id: 4, name: 'Python', count: 167 },
    { id: 5, name: 'SQL', count: 89 },
    { id: 6, name: 'REST API', count: 76 },
    { id: 7, name: 'Docker', count: 65 },
    { id: 8, name: 'Kubernetes', count: 54 }
  ]
  res.json({
    code: 200,
    message: 'Question tags',
    data: tags
  })
})

module.exports = router
