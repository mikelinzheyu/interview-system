import { MistakeType, SourceType } from '../views/chat/types'

// Mock data based on test12 - enhanced UI/UX
export const mockWrongAnswers = [
  {
    id: '1',
    question: 'HTTP 缓存控制策略有哪些？',
    snippet: '对比强缓存与协商缓存，说明适用场景与常见 Header。Expires 和 Cache-Control 的区别，以及 Last-Modified/If-Modified-Since 的运作机制...',
    type: MistakeType.INCOMPLETE,
    source: SourceType.FULLSTACK_INTERVIEW,
    tags: ['HTTP', 'Network', 'Web Performance'],
    mistakeCount: 5,
    mastery: 15,
    isFavorite: true,
    isIgnored: true
  },
  {
    id: '2',
    question: '什么是闭包？在实际项目中如何应用？',
    snippet: '请解释 JavaScript 闭包的概念，并给出两个常见使用场景。例如模块化封装私有变量，以及防抖节流函数中的应用...',
    type: MistakeType.KNOWLEDGE_GAP,
    source: SourceType.FRONTEND_INTERVIEW,
    tags: ['JavaScript', 'Core Concept'],
    mistakeCount: 3,
    mastery: 45,
    lastReviewed: '20小时前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '3',
    question: 'React Fiber 的工作原理是什么？',
    snippet: '解释 React 16+ 的协调引擎如何通过链表结构实现任务分割与优先级调度。requestIdleCallback 的作用以及它在浏览器渲染帧中的位置...',
    type: MistakeType.LOGIC_CONFUSION,
    source: SourceType.FRONTEND_INTERVIEW,
    tags: ['React', 'Fiber', 'Source Code'],
    mistakeCount: 8,
    mastery: 10,
    lastReviewed: '1天前',
    isFavorite: true,
    isIgnored: false
  },
  {
    id: '4',
    question: 'TCP 三次握手与四次挥手全过程',
    snippet: '详细描述 SYN, ACK, FIN 标志位的变化以及序列号的传递。为什么需要三次握手而不是两次？TIME_WAIT 状态存在的意义是什么...',
    type: MistakeType.KNOWLEDGE_GAP,
    source: SourceType.BACKEND_INTERVIEW,
    tags: ['Network', 'TCP/IP'],
    mistakeCount: 2,
    mastery: 80,
    lastReviewed: '2天前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '5',
    question: 'Vue 3 响应式原理与 Vue 2 的区别',
    snippet: 'Proxy 与 Object.defineProperty 的性能差异，以及对数组和新增属性的支持情况。Reflect 在其中的作用...',
    type: MistakeType.EXPRESSION,
    source: SourceType.FRONTEND_INTERVIEW,
    tags: ['Vue', 'Proxy', 'Reactive'],
    mistakeCount: 4,
    mastery: 55,
    lastReviewed: '5小时前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '6',
    question: 'Webpack Loader 和 Plugin 的区别',
    snippet: 'Loader 负责转换源文件，Plugin 负责监听构建生命周期并注入功能。请手写一个简单的 Loader...',
    type: MistakeType.INCOMPLETE,
    source: SourceType.FULLSTACK_INTERVIEW,
    tags: ['Webpack', 'Build Tools'],
    mistakeCount: 1,
    mastery: 90,
    lastReviewed: '30分钟前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '7',
    question: '二叉树的层序遍历',
    snippet: '实现二叉树的层序遍历，要求输出二维数组。使用队列实现广度优先搜索 (BFS)...',
    type: MistakeType.LOGIC_CONFUSION,
    source: SourceType.QUESTION_BANK,
    tags: ['Algorithm', 'Tree', 'BFS'],
    mistakeCount: 6,
    mastery: 30,
    lastReviewed: '4小时前',
    isFavorite: false,
    isIgnored: false
  },
  {
    id: '8',
    question: '手写 Promise.allSettled',
    snippet: 'Promise.allSettled 与 Promise.all 的区别。请手动实现一个 polyfill...',
    type: MistakeType.INCOMPLETE,
    source: SourceType.QUESTION_BANK,
    tags: ['JavaScript', 'Promise', 'Polyfill'],
    mistakeCount: 2,
    mastery: 60,
    lastReviewed: '1小时前',
    isFavorite: true,
    isIgnored: false
  },
  {
    id: '9',
    question: 'CSS 盒模型与 BFC',
    snippet: '标准盒模型与 IE 盒模型的区别。BFC 的触发条件及其在布局中的应用（清除浮动、防止 margin 重叠）...',
    type: MistakeType.KNOWLEDGE_GAP,
    source: SourceType.MOCK_EXAM,
    tags: ['CSS', 'Layout'],
    mistakeCount: 1,
    mastery: 85,
    lastReviewed: '5天前',
    isFavorite: false,
    isIgnored: false
  }
]

// Mock review batches for WrongAnswersPage "batches" tab
export const mockReviewBatches = [
  {
    id: 'b1',
    name: '网络协议专项',
    mistakeIds: ['1', '4'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'b2',
    name: '前端核心考点',
    mistakeIds: ['2', '3', '5'],
    createdAt: new Date().toISOString()
  }
]

const now = Date.now()

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
