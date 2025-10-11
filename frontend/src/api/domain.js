import api from './index'

/**
 * 获取所有领域列表
 */
export function fetchDomains() {
  return api.get('/domains')
}

/**
 * 获取领域详情
 * @param {number|string} idOrSlug - 领域ID或slug
 */
export function fetchDomainDetail(idOrSlug) {
  return api.get(`/domains/${idOrSlug}`)
}

/**
 * 获取领域字段配置
 * @param {number} domainId - 领域ID
 */
export function fetchDomainFieldConfig(domainId) {
  return api.get(`/domains/${domainId}/field-config`)
}
