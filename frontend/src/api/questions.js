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
