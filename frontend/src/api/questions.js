import api from './index'

// 获取领域列表
export function getDomains() {
  return api({
    url: '/domains',
    method: 'get'
  })
}

// 获取领域详情
export function getDomainDetail(id) {
  return api({
    url: `/api/domains/${id}`,
    method: 'get'
  })
}

// 获取领域字段配置
export function getDomainFieldConfig(id) {
  return api({
    url: `/api/domains/${id}/field-config`,
    method: 'get'
  })
}

export function fetchQuestionList(params) {
  return api.get('/questions', { params })
}

export function fetchQuestionDetail(id) {
  return api.get(`/questions/${id}`)
}

export function submitQuestionAnswer(id, payload) {
  return api.post(`/questions/${id}/submit`, payload)
}

export function fetchQuestionCategories(params) {
  return api.get('/questions/categories', { params })
}

export function fetchQuestionTags() {
  return api.get('/questions/tags')
}

export function fetchQuestionPracticeRecords(id, params) {
  return api.get(`/questions/${id}/practice-records`, { params })
}

export function fetchQuestionRecommendations(params) {
  return api.get('/questions/recommendations', { params })
}

// Facets 聚合（难度与分类分布）
export function fetchQuestionFacets(params) {
  return api.get('/questions/facets', { params })
}

// 兼容新的分类接口（后端为 /categories）
export function fetchCategories(params) {
  return api.get('/categories', { params })
}

export function exportQuestions(params) {
  return api({ url: '/questions/export', method: 'get', params, responseType: 'blob' })
}

// Trending/热门题目（稳定来源）
// 优先尝试后端提供的 /questions/trending；
// 若不可用，调用通用列表接口并尝试 popular 排序作为降级。
export function fetchTrendingQuestions(params = {}) {
  // 直接请求标准趋势接口
  return api.get('/questions/trending', { params })
}
