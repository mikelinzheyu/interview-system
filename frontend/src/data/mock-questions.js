// Local mock data for question bank pages to avoid backend dependency
const now = new Date().toISOString()

export const mockQuestionTags = [
  { id: 'vue', name: 'Vue.js', count: 4 },
  { id: 'javascript', name: 'JavaScript', count: 5 },
  { id: 'performance', name: '性能优化', count: 3 },
  { id: 'network', name: '网络', count: 3 },
  { id: 'algorithm', name: '算法', count: 2 },
  { id: 'database', name: '数据库', count: 2 }
]

export const mockQuestionCategories = {
  tree: [
    {
      id: 'frontend',
      name: '前端工程',
      children: [
        { id: 'frontend-frameworks', name: '框架与生态', children: [] },
        { id: 'frontend-engineering', name: '工程化与性能', children: [] }
      ]
    },
    {
      id: 'backend',
      name: '后端与数据库',
      children: [
        { id: 'backend-api', name: 'API 设计', children: [] },
        { id: 'backend-db', name: '数据库', children: [] }
      ]
    }
  ],
  flat: [
    { id: 'frontend', name: '前端工程', parentId: null },
    { id: 'frontend-frameworks', name: '框架与生态', parentId: 'frontend' },
    { id: 'frontend-engineering', name: '工程化与性能', parentId: 'frontend' },
    { id: 'backend', name: '后端与数据库', parentId: null },
    { id: 'backend-api', name: 'API 设计', parentId: 'backend' },
    { id: 'backend-db', name: '数据库', parentId: 'backend' }
  ]
}

export const mockQuestions = [
  {
    id: 101,
    title: 'Vue 3 响应式核心流程',
    brief: '解释 Proxy + effect 的依赖收集与触发步骤',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['vue', 'javascript'],
    domainId: 'frontend',
    categoryId: 'frontend-frameworks',
    stats: { attempts: 182, accuracy: 88 },
    createdAt: now
  },
  {
    id: 102,
    title: '实现一个简单的防抖与节流',
    brief: '描述实现思路并给出应用场景',
    difficulty: 'easy',
    type: 'short_answer',
    tags: ['javascript'],
    domainId: 'frontend',
    categoryId: 'frontend-engineering',
    stats: { attempts: 143, accuracy: 76 },
    createdAt: now
  },
  {
    id: 103,
    title: '前端性能优化指标与采集',
    brief: '解释 FCP、LCP、CLS 的含义与优化方式',
    difficulty: 'medium',
    type: 'multiple_choice',
    tags: ['javascript', 'performance'],
    domainId: 'frontend',
    categoryId: 'frontend-engineering',
    stats: { attempts: 96, accuracy: 72 },
    createdAt: now
  },
  {
    id: 201,
    title: 'RESTful API 设计最佳实践',
    brief: '状态码、资源建模与分页、过滤的设计',
    difficulty: 'medium',
    type: 'short_answer',
    tags: ['network'],
    domainId: 'backend',
    categoryId: 'backend-api',
    stats: { attempts: 88, accuracy: 81 },
    createdAt: now
  },
  {
    id: 202,
    title: '数据库事务的四大特性',
    brief: '解释 ACID 以及可串行化隔离级别的实现',
    difficulty: 'hard',
    type: 'single_choice',
    tags: ['database'],
    domainId: 'backend',
    categoryId: 'backend-db',
    stats: { attempts: 77, accuracy: 69 },
    createdAt: now
  },
  {
    id: 203,
    title: '二叉树的层序遍历实现',
    brief: '给出迭代和递归两种写法的思路',
    difficulty: 'easy',
    type: 'coding',
    tags: ['algorithm', 'javascript'],
    domainId: 'backend',
    categoryId: 'backend-api',
    stats: { attempts: 102, accuracy: 91 },
    createdAt: now
  }
]

export const mockQuestionFacets = (() => {
  const countByDifficulty = mockQuestions.reduce((acc, q) => {
    const key = q.difficulty || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const categories = mockQuestionCategories.flat.map(cat => ({
    id: cat.id,
    name: cat.name,
    count: mockQuestions.filter(q => q.categoryId === cat.id || q.domainId === cat.id).length
  }))

  const tags = mockQuestionTags.map(tag => ({
    ...tag,
    count: mockQuestions.filter(q => (q.tags || []).includes(tag.id)).length
  }))

  return {
    difficulties: Object.keys(countByDifficulty).map(key => ({ id: key, name: key, count: countByDifficulty[key] })),
    categories,
    tags
  }
})()

export const mockQuestionSummary = {
  total: mockQuestions.length,
  totalPages: 1,
  page: 1,
  size: 20,
  attempts: mockQuestions.reduce((sum, q) => sum + (q.stats?.attempts || 0), 0)
}

export const mockPracticeRecords = [
  { id: 'pr-1', questionId: 101, result: 'correct', timeSpent: 58, createdAt: now },
  { id: 'pr-2', questionId: 202, result: 'wrong', timeSpent: 132, createdAt: now },
  { id: 'pr-3', questionId: 103, result: 'correct', timeSpent: 76, createdAt: now }
]

export function buildMockQuestionList(params = {}) {
  let items = [...mockQuestions]

  const keyword = (params.keyword || params.q || '').toLowerCase().trim()
  if (keyword) {
    items = items.filter(q =>
      q.title.toLowerCase().includes(keyword) ||
      (q.brief || '').toLowerCase().includes(keyword)
    )
  }

  const domainId = params.domain_id || params.domainId
  if (domainId) {
    items = items.filter(q => q.domainId === domainId || q.categoryId === domainId)
  }

  const categoryId = params.category_id || params.categoryId
  if (categoryId) {
    items = items.filter(q => q.categoryId === categoryId)
  }

  if (params.tags) {
    const tagList = Array.isArray(params.tags) ? params.tags : String(params.tags).split(',').map(v => v.trim()).filter(Boolean)
    items = items.filter(q => tagList.every(t => (q.tags || []).includes(t)))
  }

  if (params.sort === 'popular') {
    items.sort((a, b) => (b.stats?.attempts || 0) - (a.stats?.attempts || 0))
  } else {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const page = Number(params.page) || 1
  const size = Number(params.size) || 20
  const total = items.length
  const start = (page - 1) * size
  const paged = items.slice(start, start + size)

  return {
    items: paged,
    page,
    size,
    total,
    totalPages: Math.max(1, Math.ceil(total / size)),
    summary: {
      total,
      page,
      size,
      totalPages: Math.max(1, Math.ceil(total / size))
    },
    facets: mockQuestionFacets
  }
}

export function getMockQuestionById(id) {
  return mockQuestions.find(q => String(q.id) === String(id)) || null
}

export function getMockPracticeRecords(questionId) {
  return mockPracticeRecords.filter(r => String(r.questionId) === String(questionId))
}

export function getMockRecommendations(questionId, count = 3) {
  return mockQuestions
    .filter(q => String(q.id) !== String(questionId))
    .slice(0, count)
}
