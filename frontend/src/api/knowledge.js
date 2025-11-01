import api from './index'

/**
 * 获取领域知识图谱
 * @param {string} slug - 领域slug
 */
export function fetchDomainGraph(slug) {
  return api.get(`/domains/${encodeURIComponent(slug)}/graph`)
}

