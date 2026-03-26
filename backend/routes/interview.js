/**
 * 面试和错题复盘路由
 * 处理面试报告保存、错题查询、复盘提交等功能
 *
 * POST   /api/interview/save-report          - 保存面试报告
 * GET    /api/interview/wrong-answers         - 查询错题复盘列表
 * GET    /api/interview/wrong-answers/:id     - 获取错题复盘详情
 * POST   /api/interview/wrong-answers/:id/retry - 提交重试答案
 * PUT    /api/interview/wrong-answers/:id/notes - 更新学习笔记
 * PATCH  /api/interview/wrong-answers/:id/mastery - 更新掌握度
 * GET    /api/interview/records               - 获取面试记录列表
 * GET    /api/interview/records/:id           - 获取面试记录详情
 */

const express = require('express')
const router = express.Router()
const {
  saveInterviewReport,
  getWrongAnswers,
  getWrongAnswerDetail,
  submitRetry,
  updateLearningNotes,
  updateMasteryLevel,
  getInterviewRecord,
  getInterviewRecords
} = require('../services/interviewService')

/**
 * 工具函数：异步错误处理包装
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 认证中间件：从header或query中提取userId
 */
const requireAuth = (req, res, next) => {
  let userId = null

  // 尝试从Authorization header中提取
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    userId = parseInt(token) || null
  }

  // 如果没有从header获取，尝试从query中获取
  if (!userId && req.query.userId) {
    userId = parseInt(req.query.userId) || null
  }

  // 如果都没有，从body中获取
  if (!userId && req.body?.userId) {
    userId = parseInt(req.body.userId) || null
  }

  if (!userId) {
    return res.status(401).json({
      code: 401,
      message: '需要认证：请提供用户ID'
    })
  }

  req.user = { id: userId }
  next()
}

router.use(requireAuth)

/**
 * POST /api/interview/save-report
 * 保存面试报告并创建错题复盘记录
 */
router.post(
  '/save-report',
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const reportData = req.body || {}

    if (!reportData.jobTitle) {
      return res.status(400).json({
        code: 400,
        message: '岗位名称不能为空'
      })
    }

    try {
      const record = await saveInterviewReport(userId, reportData)

      res.status(201).json({
        code: 201,
        message: '面试报告已保存',
        data: {
          recordId: record.id,
          record: record.toJSON()
        }
      })
    } catch (error) {
      console.error('[POST /interview/save-report] Error:', error.message)
      res.status(500).json({
        code: 500,
        message: '保存面试报告失败',
        error: error.message
      })
    }
  })
)

/**
 * GET /api/interview/wrong-answers
 * 查询错题复盘列表
 * 可选参数：
 *   - recordId: 关联的面试记录ID（用来过滤特定面试的错题）
 *   - limit: 限制数量（默认20）
 *   - offset: 偏移量（默认0）
 */
router.get(
  '/wrong-answers',
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const recordId = req.query.recordId || null

    try {
      const items = await getWrongAnswers(userId, recordId)

      res.json({
        code: 200,
        message: '错题复盘列表获取成功',
        data: {
          items: items.map(item => item.toJSON ? item.toJSON() : item),
          total: items.length
        }
      })
    } catch (error) {
      console.error('[GET /interview/wrong-answers] Error:', error.message)
      res.status(500).json({
        code: 500,
        message: '获取错题复盘列表失败',
        error: error.message
      })
    }
  })
)

/**
 * GET /api/interview/wrong-answers/:id
 * 获取单个错题复盘详情（含重试历史）
 */
router.get(
  '/wrong-answers/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const wrongAnswerId = req.params.id

    try {
      const item = await getWrongAnswerDetail(userId, wrongAnswerId)

      res.json({
        code: 200,
        message: '错题复盘详情获取成功',
        data: item.toJSON ? item.toJSON() : item
      })
    } catch (error) {
      console.error('[GET /interview/wrong-answers/:id] Error:', error.message)

      if (error.message.includes('不存在')) {
        return res.status(404).json({
          code: 404,
          message: error.message
        })
      }

      res.status(500).json({
        code: 500,
        message: '获取错题复盘详情失败',
        error: error.message
      })
    }
  })
)

/**
 * POST /api/interview/wrong-answers/:id/retry
 * 提交重试答案
 * 请求体：
 *   - userAnswer: 新的答案（必填）
 *   - notes: 备注（可选）
 *   - score: 新的评分（可选，由前端设置或AI评判）
 */
router.post(
  '/wrong-answers/:id/retry',
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const wrongAnswerId = req.params.id
    const { userAnswer, notes = '', score } = req.body || {}

    if (!userAnswer) {
      return res.status(400).json({
        code: 400,
        message: '答案不能为空'
      })
    }

    try {
      const item = await submitRetry(userId, wrongAnswerId, userAnswer, notes)

      // 如果提供了score，更新到最后一个重试记录中
      if (score !== undefined && item.retryAnswers && item.retryAnswers.length > 0) {
        item.retryAnswers[item.retryAnswers.length - 1].score = score
        await item.save()
      }

      res.json({
        code: 200,
        message: '重试答案已提交',
        data: item.toJSON ? item.toJSON() : item
      })
    } catch (error) {
      console.error('[POST /interview/wrong-answers/:id/retry] Error:', error.message)

      if (error.message.includes('不存在')) {
        return res.status(404).json({
          code: 404,
          message: error.message
        })
      }

      res.status(500).json({
        code: 500,
        message: '提交重试答案失败',
        error: error.message
      })
    }
  })
)

/**
 * PUT /api/interview/wrong-answers/:id/notes
 * 更新学习笔记
 * 请求体：
 *   - notes: 学习笔记内容（必填）
 */
router.put(
  '/wrong-answers/:id/notes',
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const wrongAnswerId = req.params.id
    const { notes = '' } = req.body || {}

    try {
      const item = await updateLearningNotes(userId, wrongAnswerId, notes)

      res.json({
        code: 200,
        message: '学习笔记已更新',
        data: item.toJSON ? item.toJSON() : item
      })
    } catch (error) {
      console.error('[PUT /interview/wrong-answers/:id/notes] Error:', error.message)

      if (error.message.includes('不存在')) {
        return res.status(404).json({
          code: 404,
          message: error.message
        })
      }

      res.status(500).json({
        code: 500,
        message: '更新学习笔记失败',
        error: error.message
      })
    }
  })
)

/**
 * PATCH /api/interview/wrong-answers/:id/mastery
 * 更新掌握度
 * 请求体：
 *   - masterLevel: 掌握度 0-100（必填）
 */
router.patch(
  '/wrong-answers/:id/mastery',
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const wrongAnswerId = req.params.id
    const { masterLevel } = req.body || {}

    if (masterLevel === undefined || masterLevel === null) {
      return res.status(400).json({
        code: 400,
        message: '掌握度不能为空'
      })
    }

    try {
      const item = await updateMasteryLevel(userId, wrongAnswerId, masterLevel)

      res.json({
        code: 200,
        message: '掌握度已更新',
        data: item.toJSON ? item.toJSON() : item
      })
    } catch (error) {
      console.error('[PATCH /interview/wrong-answers/:id/mastery] Error:', error.message)

      if (error.message.includes('不存在')) {
        return res.status(404).json({
          code: 404,
          message: error.message
        })
      }

      res.status(500).json({
        code: 500,
        message: '更新掌握度失败',
        error: error.message
      })
    }
  })
)

/**
 * GET /api/interview/records
 * 获取面试记录列表
 * 可选参数：
 *   - limit: 限制数量（默认20）
 *   - offset: 偏移量（默认0）
 */
router.get(
  '/records',
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const limit = parseInt(req.query.limit) || 20
    const offset = parseInt(req.query.offset) || 0

    try {
      const result = await getInterviewRecords(userId, { limit, offset })

      res.json({
        code: 200,
        message: '面试记录列表获取成功',
        data: {
          items: result.items.map(item => item.toJSON ? item.toJSON() : item),
          total: result.total,
          limit,
          offset
        }
      })
    } catch (error) {
      console.error('[GET /interview/records] Error:', error.message)
      res.status(500).json({
        code: 500,
        message: '获取面试记录列表失败',
        error: error.message
      })
    }
  })
)

/**
 * GET /api/interview/records/:id
 * 获取单个面试记录详情
 */
router.get(
  '/records/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user.id
    const recordId = req.params.id

    try {
      const record = await getInterviewRecord(userId, recordId)

      res.json({
        code: 200,
        message: '面试记录详情获取成功',
        data: record.toJSON ? record.toJSON() : record
      })
    } catch (error) {
      console.error('[GET /interview/records/:id] Error:', error.message)

      if (error.message.includes('不存在')) {
        return res.status(404).json({
          code: 404,
          message: error.message
        })
      }

      res.status(500).json({
        code: 500,
        message: '获取面试记录详情失败',
        error: error.message
      })
    }
  })
)

module.exports = router
