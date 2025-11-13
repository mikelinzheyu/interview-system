/**
 * AI 自动出题 API
 */
import api from './index'

/**
 * 生成题目
 */
export function generateQuestions(data) {
  return api({
    url: '/ai/generate-questions',
    method: 'post',
    data
  })
}

/**
 * 获取生成历史
 */
export function getGenerationHistory(params) {
  return api({
    url: '/ai/generation-history',
    method: 'get',
    params
  })
}

/**
 * 获取单条生成记录详情
 */
export function getGenerationDetail(id) {
  return api({
    url: `/ai/generation-history/${id}`,
    method: 'get'
  })
}

/**
 * 审核 AI 生成的题目
 */
export function reviewGeneratedQuestions(id, data) {
  return api({
    url: `/ai/generated-questions/${id}/review`,
    method: 'post',
    data
  })
}

/**
 * 获取 Prompt 模板列表
 */
export function getPromptTemplates(params) {
  return api({
    url: '/ai/prompt-templates',
    method: 'get',
    params
  })
}

/**
 * 创建 Prompt 模板
 */
export function createPromptTemplate(data) {
  return api({
    url: '/ai/prompt-templates',
    method: 'post',
    data
  })
}

/**
 * 更新 Prompt 模板
 */
export function updatePromptTemplate(id, data) {
  return api({
    url: `/ai/prompt-templates/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除 Prompt 模板
 */
export function deletePromptTemplate(id) {
  return api({
    url: `/ai/prompt-templates/${id}`,
    method: 'delete'
  })
}

/**
 * 成本预估
 */
export function estimateCost(data) {
  return api({
    url: '/ai/estimate-cost',
    method: 'post',
    data
  })
}

/**
 * 批量导出题目
 */
export function exportQuestions(data) {
  return api({
    url: '/ai/export-questions',
    method: 'post',
    data
  })
}

/**
 * 获取 AI 使用统计
 */
export function getAIStatistics() {
  return api({
    url: '/ai/statistics',
    method: 'get'
  })
}

/**
 * 智能推荐参数
 */
export function recommendParams(data) {
  return api({
    url: '/ai/recommend-params',
    method: 'post',
    data
  })
}

/**
 * 配置 AI
 */
export function configAI(data) {
  return api({
    url: '/ai/config',
    method: 'post',
    data
  })
}

/**
 * 调用 Dify 工作流
 * @param {Object} data - 请求参数
 * @param {string} data.requestType - 请求类型: generate_questions 或 score_answer
 * @param {string} data.jobTitle - 职位名称(生成题目时必填)
 * @param {string} data.sessionId - 会话ID(评分时必填)
 * @param {string} data.question - 问题(评分时必填)
 * @param {string} data.candidateAnswer - 候选人答案(评分时必填)
 */
export function callDifyWorkflow(data) {
  return api({
    url: '/ai/dify-workflow',
    method: 'post',
    data
  })
}

/**
 * 社区文章 AI 助手接口
 */

/**
 * 生成文章摘要
 * @param {Object} data
 * @param {string} data.content - 文章内容
 * @param {string} data.postId - 文章 ID
 * @returns {Promise}
 */
export function generateArticleSummary(data) {
  return api({
    url: '/ai/summary',
    method: 'post',
    data
  })
}

/**
 * 提取文章关键点
 * @param {Object} data
 * @param {string} data.content - 文章内容
 * @param {string} data.postId - 文章 ID
 * @returns {Promise}
 */
export function extractArticleKeypoints(data) {
  return api({
    url: '/ai/keypoints',
    method: 'post',
    data
  })
}

/**
 * 获取对话历史
 * @param {string} conversationId - 对话 ID
 * @returns {Promise}
 */
export function getChatHistory(conversationId) {
  return api({
    url: `/ai/chat/${conversationId}`,
    method: 'get'
  })
}
