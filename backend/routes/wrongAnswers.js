const express = require('express')
const router = express.Router()

// In-memory wrong answer records
const records = []

function normalizeId(id) {
  return String(id || '0')
}

function findRecord(id) {
  const key = normalizeId(id)
  return records.find((item) => normalizeId(item.id) === key)
}

function buildStatistics() {
  const totalWrongCount = records.length
  const masteredCount = records.filter((r) => r.reviewStatus === 'mastered').length
  const reviewingCount = records.filter((r) => r.reviewStatus === 'reviewing').length
  const unreviewedCount = records.filter((r) => r.reviewStatus === 'unreviewed').length

  const masteredPercentage = totalWrongCount
    ? Math.round((masteredCount / totalWrongCount) * 100)
    : 0

  return {
    masteredCount,
    reviewingCount,
    unreviewedCount,
    totalWrongCount,
    masteredPercentage
  }
}

// POST /api/wrong-answers - record a wrong answer
router.post('/wrong-answers', (req, res) => {
  const payload = req.body || {}
  const id = Date.now()

  const record = {
    id,
    questionId: payload.questionId,
    source: payload.source || 'question_bank',
    isCorrect: Boolean(payload.isCorrect),
    reviewStatus: 'unreviewed',
    errorType: payload.errorType || null,
    metadata: payload.metadata || {},
    notes: payload.notes || '',
    tags: payload.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewHistory: []
  }

  records.unshift(record)

  res.json({
    code: 200,
    message: 'Wrong answer recorded',
    data: record
  })
})

// GET /api/wrong-answers - list all wrong answers
router.get('/wrong-answers', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: records
  })
})

// GET /api/wrong-answers/status/:status
router.get('/wrong-answers/status/:status', (req, res) => {
  const status = req.params.status
  const filtered = records.filter((item) => item.reviewStatus === status)
  res.json({
    code: 200,
    message: 'OK',
    data: filtered
  })
})

// GET /api/wrong-answers/source/:source
router.get('/wrong-answers/source/:source', (req, res) => {
  const source = req.params.source
  const filtered = records.filter((item) => item.source === source)
  res.json({
    code: 200,
    message: 'OK',
    data: filtered
  })
})

// GET /api/wrong-answers/due-for-review
router.get('/wrong-answers/due-for-review', (req, res) => {
  const filtered = records.filter(
    (item) => item.reviewStatus !== 'mastered'
  )
  res.json({
    code: 200,
    message: 'OK',
    data: filtered
  })
})

// GET /api/wrong-answers/statistics
router.get('/wrong-answers/statistics', (req, res) => {
  res.json({
    code: 200,
    message: 'OK',
    data: buildStatistics()
  })
})

// POST /api/wrong-answers/:id/review
router.post('/wrong-answers/:id/review', (req, res) => {
  const record = findRecord(req.params.id)
  if (!record) {
    return res.status(404).json({
      code: 404,
      message: 'Wrong answer not found'
    })
  }

  const { result = 'pass', timeSpentSec = 0, notes = '', errorType } =
    req.body || {}

  record.reviewStatus = result === 'pass' ? 'mastered' : 'reviewing'
  record.errorType = errorType || record.errorType
  record.notes = notes || record.notes
  record.updatedAt = new Date().toISOString()
  record.reviewHistory = record.reviewHistory || []
  record.reviewHistory.push({
    result,
    timeSpentSec,
    notes,
    errorType: record.errorType,
    reviewedAt: new Date().toISOString()
  })

  res.json({
    code: 200,
    message: 'Review recorded',
    data: record
  })
})

// GET /api/wrong-answers/review/logs
router.get('/wrong-answers/review/logs', (req, res) => {
  const recordId = req.query.recordId
  const record = findRecord(recordId)
  if (!record) {
    return res.status(404).json({
      code: 404,
      message: 'Wrong answer not found'
    })
  }

  res.json({
    code: 200,
    message: 'OK',
    data: record.reviewHistory || []
  })
})

// PUT /api/wrong-answers/:id/mark-mastered
router.put('/wrong-answers/:id/mark-mastered', (req, res) => {
  const record = findRecord(req.params.id)
  if (!record) {
    return res.status(404).json({
      code: 404,
      message: 'Wrong answer not found'
    })
  }

  record.reviewStatus = 'mastered'
  record.updatedAt = new Date().toISOString()

  res.json({
    code: 200,
    message: 'Marked as mastered',
    data: record
  })
})

// PUT /api/wrong-answers/:id/mark-reviewing
router.put('/wrong-answers/:id/mark-reviewing', (req, res) => {
  const record = findRecord(req.params.id)
  if (!record) {
    return res.status(404).json({
      code: 404,
      message: 'Wrong answer not found'
    })
  }

  record.reviewStatus = 'reviewing'
  record.updatedAt = new Date().toISOString()

  res.json({
    code: 200,
    message: 'Marked as reviewing',
    data: record
  })
})

// PUT /api/wrong-answers/:id/notes
router.put('/wrong-answers/:id/notes', (req, res) => {
  const record = findRecord(req.params.id)
  if (!record) {
    return res.status(404).json({
      code: 404,
      message: 'Wrong answer not found'
    })
  }

  const { notes = '' } = req.body || {}
  record.notes = notes
  record.updatedAt = new Date().toISOString()

  res.json({
    code: 200,
    message: 'Notes updated',
    data: record
  })
})

// PUT /api/wrong-answers/:id/tags
router.put('/wrong-answers/:id/tags', (req, res) => {
  const record = findRecord(req.params.id)
  if (!record) {
    return res.status(404).json({
      code: 404,
      message: 'Wrong answer not found'
    })
  }

  const { tags = [] } = req.body || {}
  record.tags = Array.isArray(tags) ? tags : []
  record.updatedAt = new Date().toISOString()

  res.json({
    code: 200,
    message: 'Tags updated',
    data: record
  })
})

// POST /api/wrong-answers/generate-review-plan
router.post('/wrong-answers/generate-review-plan', (req, res) => {
  const due = records.filter(
    (item) => item.reviewStatus !== 'mastered'
  )

  res.json({
    code: 200,
    message: 'Review plan generated',
    data: {
      items: due,
      total: due.length
    }
  })
})

// DELETE /api/wrong-answers/:id
router.delete('/wrong-answers/:id', (req, res) => {
  const id = normalizeId(req.params.id)
  const index = records.findIndex((item) => normalizeId(item.id) === id)

  if (index === -1) {
    return res.status(404).json({
      code: 404,
      message: 'Wrong answer not found'
    })
  }

  records.splice(index, 1)

  res.json({
    code: 200,
    message: 'Wrong answer deleted'
  })
})

module.exports = router
