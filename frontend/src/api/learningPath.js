import api from './index'

/**
 * 获取学习路径列表
 */
export function fetchLearningPaths(params) {
  return api.get('/learning-paths', { params })
}

/**
 * 获取学习路径详情
 */
export function fetchLearningPathDetail(idOrSlug) {
  return api.get(`/learning-paths/${idOrSlug}`)
}

/**
 * 报名学习路径
 */
export function enrollLearningPath(pathId) {
  return api.post(`/learning-paths/${pathId}/enroll`)
}

/**
 * 完成模块
 */
export function completeModule(pathId, moduleId) {
  return api.put(`/learning-paths/${pathId}/modules/${moduleId}/complete`)
}
