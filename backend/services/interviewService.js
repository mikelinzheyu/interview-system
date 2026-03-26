/**
 * 面试报告和错题复盘服务
 * 处理面试报告保存、错题跟踪、复盘记录等业务逻辑
 */

const { InterviewRecord, WrongAnswerReview } = require('../models')

/**
 * 保存面试报告并创建错题复盘记录
 * @param {number} userId - 用户ID
 * @param {object} reportData - 面试报告数据
 *   - jobTitle: 岗位名称
 *   - difficulty: 难度等级
 *   - duration: 面试耗时（秒）
 *   - answers: 问答记录数组 [{question, answer, score}, ...]
 *   - overallScore: 综合评分
 *   - technicalScore: 技术评分
 *   - communicationScore: 表达评分
 *   - logicalScore: 逻辑评分
 *   - summary: 面试总结
 *   - suggestions: 改进建议数组
 * @returns {object} 创建的InterviewRecord对象
 */
async function saveInterviewReport(userId, reportData) {
  if (!userId || !reportData) {
    throw new Error('用户ID和报告数据不能为空')
  }

  const {
    jobTitle,
    difficulty,
    duration,
    answers = [],
    overallScore,
    technicalScore,
    communicationScore,
    logicalScore,
    summary,
    suggestions = []
  } = reportData

  // 1. 创建InterviewRecord
  const record = await InterviewRecord.create({
    userId,
    jobTitle: jobTitle || '综合面试',
    difficulty: difficulty || '中级',
    duration: duration || 0,
    answers: Array.isArray(answers) ? answers : [],
    overallScore: overallScore || 0,
    technicalScore: technicalScore || 0,
    communicationScore: communicationScore || 0,
    logicalScore: logicalScore || 0,
    summary: summary || '面试已完成',
    suggestions: Array.isArray(suggestions) ? suggestions : []
  })

  // 2. 为每个答题记录创建WrongAnswerReview记录
  // 通常只为答错的题目创建复盘记录
  const wrongAnswerPromises = answers
    .filter(item => item.score !== undefined && item.score < 100) // 只记录未满分的
    .map(item => {
      return WrongAnswerReview.create({
        userId,
        recordId: record.id,
        questionId: item.questionId || `q_${Date.now()}_${Math.random()}`,
        question: item.question || '未命名问题',
        originalAnswer: item.answer || '（未录入）',
        originalScore: item.score || 0,
        retryAnswers: [],
        masterLevel: 0,
        reviewCount: 0,
        learningNotes: '',
        lastReviewAt: null
      })
    })

  if (wrongAnswerPromises.length > 0) {
    await Promise.all(wrongAnswerPromises)
  }

  return record
}

/**
 * 获取用户的错题复盘列表
 * @param {number} userId - 用户ID
 * @param {string} recordId - 关联的面试记录ID（可选）
 * @returns {array} 错题复盘列表
 */
async function getWrongAnswers(userId, recordId = null) {
  if (!userId) {
    throw new Error('用户ID不能为空')
  }

  const where = { userId }
  if (recordId) {
    where.recordId = recordId
  }

  const items = await WrongAnswerReview.findAll({
    where,
    order: [['lastReviewAt', 'DESC NULLS LAST'], ['createdAt', 'DESC']],
    limit: 100
  })

  return items || []
}

/**
 * 获取单个错题复盘详情（含重试历史）
 * @param {number} userId - 用户ID
 * @param {string} wrongAnswerId - 错题复盘ID
 * @returns {object} 错题复盘详情
 */
async function getWrongAnswerDetail(userId, wrongAnswerId) {
  if (!userId || !wrongAnswerId) {
    throw new Error('用户ID和错题ID不能为空')
  }

  const item = await WrongAnswerReview.findOne({
    where: {
      id: wrongAnswerId,
      userId
    }
  })

  if (!item) {
    throw new Error('错题复盘记录不存在')
  }

  return item
}

/**
 * 提交重试答案
 * @param {number} userId - 用户ID
 * @param {string} wrongAnswerId - 错题复盘ID
 * @param {string} userAnswer - 新的答案
 * @param {string} notes - 备注（可选）
 * @returns {object} 更新后的WrongAnswerReview
 */
async function submitRetry(userId, wrongAnswerId, userAnswer, notes = '') {
  if (!userId || !wrongAnswerId || !userAnswer) {
    throw new Error('用户ID、错题ID和答案不能为空')
  }

  const item = await WrongAnswerReview.findOne({
    where: {
      id: wrongAnswerId,
      userId
    }
  })

  if (!item) {
    throw new Error('错题复盘记录不存在')
  }

  // 构建新的重试记录
  const retryRecord = {
    attempt: (item.retryAnswers?.length || 0) + 1,
    userAnswer: userAnswer.trim(),
    score: null, // 由前端或其他服务设置
    notes: notes.trim() || '',
    timestamp: new Date().toISOString()
  }

  // 更新retryAnswers和相关字段
  const retryAnswers = Array.isArray(item.retryAnswers) ? [...item.retryAnswers] : []
  retryAnswers.push(retryRecord)

  await item.update({
    retryAnswers,
    reviewCount: retryAnswers.length,
    lastReviewAt: new Date()
  })

  return item
}

/**
 * 更新学习笔记
 * @param {number} userId - 用户ID
 * @param {string} wrongAnswerId - 错题复盘ID
 * @param {string} notes - 学习笔记内容
 * @returns {object} 更新后的WrongAnswerReview
 */
async function updateLearningNotes(userId, wrongAnswerId, notes) {
  if (!userId || !wrongAnswerId) {
    throw new Error('用户ID和错题ID不能为空')
  }

  const item = await WrongAnswerReview.findOne({
    where: {
      id: wrongAnswerId,
      userId
    }
  })

  if (!item) {
    throw new Error('错题复盘记录不存在')
  }

  await item.update({
    learningNotes: notes || '',
    updatedAt: new Date()
  })

  return item
}

/**
 * 更新掌握度
 * @param {number} userId - 用户ID
 * @param {string} wrongAnswerId - 错题复盘ID
 * @param {number} masterLevel - 掌握度（0-100）
 * @returns {object} 更新后的WrongAnswerReview
 */
async function updateMasteryLevel(userId, wrongAnswerId, masterLevel) {
  if (!userId || !wrongAnswerId) {
    throw new Error('用户ID和错题ID不能为空')
  }

  if (masterLevel === undefined || masterLevel === null) {
    throw new Error('掌握度不能为空')
  }

  const level = Math.max(0, Math.min(100, parseInt(masterLevel)))

  const item = await WrongAnswerReview.findOne({
    where: {
      id: wrongAnswerId,
      userId
    }
  })

  if (!item) {
    throw new Error('错题复盘记录不存在')
  }

  await item.update({
    masterLevel: level,
    updatedAt: new Date()
  })

  return item
}

/**
 * 获取面试记录详情
 * @param {number} userId - 用户ID
 * @param {string} recordId - 面试记录ID
 * @returns {object} 面试记录详情
 */
async function getInterviewRecord(userId, recordId) {
  if (!userId || !recordId) {
    throw new Error('用户ID和记录ID不能为空')
  }

  const record = await InterviewRecord.findOne({
    where: {
      id: recordId,
      userId
    }
  })

  if (!record) {
    throw new Error('面试记录不存在')
  }

  return record
}

/**
 * 获取用户的所有面试记录
 * @param {number} userId - 用户ID
 * @param {object} options - 查询选项
 *   - limit: 限制数量
 *   - offset: 偏移量
 * @returns {object} { items, total }
 */
async function getInterviewRecords(userId, options = {}) {
  if (!userId) {
    throw new Error('用户ID不能为空')
  }

  const { limit = 20, offset = 0 } = options

  const { count, rows } = await InterviewRecord.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  })

  return {
    items: rows,
    total: count
  }
}

module.exports = {
  saveInterviewReport,
  getWrongAnswers,
  getWrongAnswerDetail,
  submitRetry,
  updateLearningNotes,
  updateMasteryLevel,
  getInterviewRecord,
  getInterviewRecords
}
