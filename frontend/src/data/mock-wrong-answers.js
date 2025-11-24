// Mock data for wrong-answer features to keep UI working without backend
const now = Date.now()

export const mockWrongAnswerSessions = [
  { sessionId: 'ai-2024-10-001', jobTitle: '前端开发工程师面试（AI）' },
  { sessionId: 'ai-2024-10-002', jobTitle: '全栈工程师面试（AI）' },
  { sessionId: 'ai-2024-10-003', jobTitle: '后端工程师面试（AI）' }
]

export const mockWrongAnswers = [
  {
    id: 'wa-001',
    questionId: 101,
    questionTitle: '什么是闭包？在实际项目中如何应用？',
    questionContent: '请解释 JavaScript 闭包的概念，并给出两个常见使用场景。',
    errorType: 'knowledge',
    mastery: 45,
    wrongCount: 3,
    correctCount: 1,
    difficulty: 'medium',
    reviewStatus: 'reviewing',
    source: 'ai_interview',
    sessionId: 'ai-2024-10-001',
    lastWrongTime: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    nextReviewTime: new Date(now + 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'wa-002',
    questionId: 202,
    questionTitle: 'Vue3 的响应式原理是怎样的？',
    questionContent: '基于 Proxy 的依赖收集与触发机制，简述核心流程。',
    errorType: 'logic',
    mastery: 62,
    wrongCount: 2,
    correctCount: 3,
    difficulty: 'hard',
    reviewStatus: 'unreviewed',
    source: 'question_bank',
    sessionId: null,
    lastWrongTime: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    nextReviewTime: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 26).toISOString()
  },
  {
    id: 'wa-003',
    questionId: 203,
    questionTitle: 'HTTP 缓存控制策略有哪些？',
    questionContent: '对比强缓存与协商缓存，说明适用场景与常见 Header。',
    errorType: 'incomplete',
    mastery: 30,
    wrongCount: 5,
    correctCount: 0,
    difficulty: 'medium',
    reviewStatus: 'unreviewed',
    source: 'ai_interview',
    sessionId: 'ai-2024-10-002',
    lastWrongTime: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    nextReviewTime: new Date(now + 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 2).toISOString()
  }
]

export const mockReviewLogs = [
  { id: 'log-1', recordId: 'wa-001', result: 'fail', errorType: 'knowledge', createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString() },
  { id: 'log-2', recordId: 'wa-001', result: 'pass', errorType: 'knowledge', createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString() },
  { id: 'log-3', recordId: 'wa-002', result: 'fail', errorType: 'logic', createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString() }
]

export function buildWrongAnswerStats(list = mockWrongAnswers) {
  const totalWrongCount = list.reduce((sum, item) => sum + (item.wrongCount || 0), 0)
  const totalCorrectCount = list.reduce((sum, item) => sum + (item.correctCount || 0), 0)
  const masteredCount = list.filter(item => item.reviewStatus === 'mastered').length
  const reviewingCount = list.filter(item => item.reviewStatus === 'reviewing').length
  const unreviewedCount = list.filter(item => item.reviewStatus === 'unreviewed').length
  const total = list.length || 1

  const countBySource = list.reduce((acc, item) => {
    const key = item.source || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const countByDifficulty = list.reduce((acc, item) => {
    const key = item.difficulty || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return {
    totalWrongCount,
    totalCorrectCount,
    masteredCount,
    reviewingCount,
    unreviewedCount,
    masteredPercentage: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    countBySource,
    countByDifficulty
  }
}
