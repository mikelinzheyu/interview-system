const express = require('express')
const router = express.Router()

// Simple in-memory recommendations for dashboard widgets
const recommendations = [
  {
    id: 1,
    type: 'learning-path',
    title: '强化前端工程能力的 30 天计划',
    description: '结合实际项目，从构建工具、状态管理到性能优化，分阶段完成练习。',
    priority: 'high',
    matchScore: 0.92
  },
  {
    id: 2,
    type: 'interview',
    title: '系统设计常见考点精讲',
    description: '覆盖缓存、消息队列、数据库分库分表等高频题，适合准备中高级面试。',
    priority: 'medium',
    matchScore: 0.87
  },
  {
    id: 3,
    type: 'practice',
    title: '一周算法巩固清单',
    description: '从双指针到二叉树的组合练习，帮助稳固基础。',
    priority: 'low',
    matchScore: 0.8
  }
]

function respondOk(res, data) {
  res.json({
    code: 200,
    message: 'OK',
    data
  })
}

// GET /api/recommendations
router.get('/recommendations', (req, res) => {
  const page = parseInt(req.query.page || '1', 10) || 1
  const size = parseInt(req.query.size || '6', 10) || 6
  const start = (page - 1) * size
  const items = recommendations.slice(start, start + size)

  respondOk(res, {
    items,
    page,
    size,
    total: recommendations.length,
    hasMore: start + size < recommendations.length
  })
})

// GET /api/recommendations/refresh
router.get('/recommendations/refresh', (req, res) => {
  respondOk(res, {
    items: recommendations,
    refreshedAt: new Date().toISOString()
  })
})

// POST /api/recommendations/feedback
router.post('/recommendations/feedback', (req, res) => {
  const { recommendationId, feedback } = req.body || {}
  if (!recommendationId || !feedback) {
    return res.status(400).json({
      code: 400,
      message: 'recommendationId and feedback are required'
    })
  }

  res.json({
    code: 200,
    message: 'Feedback received',
    data: {
      recommendationId,
      feedback
    }
  })
})

// GET /api/users/interests
router.get('/users/interests', (req, res) => {
  respondOk(res, {
    tags: []
  })
})

// PUT /api/users/interests
router.put('/users/interests', (req, res) => {
  const { tags = [] } = req.body || {}
  respondOk(res, { tags })
})

module.exports = router
