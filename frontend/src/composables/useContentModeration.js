/**
 * useContentModeration - 内容审核和过滤系统
 *
 * 功能：
 * - 敏感词检测和过滤
 * - 内容质量评分
 * - 用户举报和审核流程
 * - 黑名单管理
 * - 自动和手动审核
 */

import { ref, computed, reactive } from 'vue'
import communityAPI from '@/api/communityWithCache'

export function useContentModeration() {
  // 审核规则
  const rules = reactive({
    minTextLength: 2,
    maxTextLength: 5000,
    minTitleLength: 3,
    maxTitleLength: 200,
    sensitiveWordThreshold: 0.5,
    spamScoreThreshold: 0.7,
    qualityScoreThreshold: 0.3
  })

  // 敏感词库（可从后端动态加载）
  const sensitiveWords = ref([
    /\b(违法|诈骗|赌博|色情)\b/gi,
    /\b(垃圾|废话|喷子|沙发)\b/gi,
    // ... 更多敏感词规则
  ])

  // 黑名单
  const blacklist = ref({
    users: new Set(),      // 黑名单用户
    keywords: new Set(),   // 黑名单关键词
    domains: new Set()     // 黑名单域名
  })

  // 审核状态
  const auditQueue = ref([])
  const auditHistory = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * 内容质量评分
   * @param {string} content - 内容文本
   * @returns {number} 0-1 之间的评分
   */
  const scoreContentQuality = (content) => {
    let score = 0
    let checks = 0

    // 1. 长度检查
    if (content.length >= rules.minTextLength && content.length <= rules.maxTextLength) {
      score += 0.2
    }
    checks++

    // 2. 多样性检查（单词/字符多样性）
    const uniqueChars = new Set(content).size
    const uniqueRatio = uniqueChars / content.length
    if (uniqueRatio > 0.3) {
      score += 0.2
    }
    checks++

    // 3. 标点符号检查（过多标点是垃圾特征）
    const punctCount = (content.match(/[!?;,。，；？]/g) || []).length
    const punctRatio = punctCount / content.length
    if (punctRatio < 0.15) {
      score += 0.2
    }
    checks++

    // 4. 重复检查（检测连续重复字符）
    const repeatRatio = (content.match(/(.)\1{3,}/g) || []).length
    if (repeatRatio === 0) {
      score += 0.2
    }
    checks++

    // 5. URL 检查（过多链接是垃圾特征）
    const urlCount = (content.match(/https?:\/\//g) || []).length
    if (urlCount <= 2) {
      score += 0.2
    }
    checks++

    return score / checks
  }

  /**
   * 检测敏感词
   * @param {string} content - 内容文本
   * @returns {Object} { detected: boolean, words: string[], score: number }
   */
  const detectSensitiveWords = (content) => {
    const detectedWords = []
    let totalMatches = 0

    sensitiveWords.value.forEach(pattern => {
      const matches = content.match(pattern) || []
      totalMatches += matches.length
      detectedWords.push(...matches)
    })

    const uniqueWords = [...new Set(detectedWords)]
    const score = Math.min(totalMatches / Math.max(content.length / 10, 1), 1)

    return {
      detected: score > rules.sensitiveWordThreshold,
      words: uniqueWords,
      count: totalMatches,
      score
    }
  }

  /**
   * 检测垃圾内容
   * @param {string} content - 内容文本
   * @returns {number} 0-1 之间的垃圾评分
   */
  const detectSpam = (content) => {
    let spamScore = 0
    let checks = 0

    // 1. 验证码模式检测
    if (/\b[0-9]{3,}\b/.test(content)) {
      spamScore += 0.1
    }
    checks++

    // 2. 连续数字/特殊字符
    if (/[0-9]{4,}|[!@#$%^&*]{3,}/.test(content)) {
      spamScore += 0.15
    }
    checks++

    // 3. 过度大写
    const upperRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (upperRatio > 0.3) {
      spamScore += 0.15
    }
    checks++

    // 4. 链接和 @ 符号过多
    const linkAndMentions = (content.match(/[@http]/g) || []).length
    if (linkAndMentions / content.length > 0.1) {
      spamScore += 0.15
    }
    checks++

    // 5. 表情符号过多
    const emojiCount = (content.match(/[\uD83C-\uDBFF]/g) || []).length
    if (emojiCount / content.length > 0.3) {
      spamScore += 0.15
    }
    checks++

    // 6. 重复内容
    const wordArray = content.split(/\s+/)
    const uniqueWords = new Set(wordArray)
    if (uniqueWords.size < wordArray.length * 0.3) {
      spamScore += 0.25
    }
    checks++

    return Math.min(spamScore, 1)
  }

  /**
   * 执行内容审核
   * @param {Object} content - { text, title, type, authorId }
   * @returns {Object} 审核结果
   */
  const auditContent = (content) => {
    const result = {
      id: Math.random().toString(36).substr(2, 9),
      contentId: content.id,
      timestamp: new Date(),
      verdict: 'pending',  // pending | approved | rejected | manual_review
      reasons: [],
      scores: {
        quality: 0,
        sensitive: 0,
        spam: 0,
        final: 0
      }
    }

    // 1. 质量检查
    result.scores.quality = scoreContentQuality(content.text)
    if (result.scores.quality < rules.qualityScoreThreshold) {
      result.reasons.push(`内容质量过低 (${(result.scores.quality * 100).toFixed(1)}%)`)
    }

    // 2. 敏感词检查
    const sensitiveCheck = detectSensitiveWords(content.text)
    result.scores.sensitive = sensitiveCheck.score
    if (sensitiveCheck.detected) {
      result.reasons.push(`包含敏感词: ${sensitiveCheck.words.join(', ')}`)
    }

    // 3. 垃圾检查
    result.scores.spam = detectSpam(content.text)
    if (result.scores.spam > rules.spamScoreThreshold) {
      result.reasons.push(`疑似垃圾内容 (${(result.scores.spam * 100).toFixed(1)}%)`)
    }

    // 4. 黑名单检查
    if (blacklist.value.users.has(content.authorId)) {
      result.reasons.push('用户在黑名单中')
      result.verdict = 'rejected'
    }

    // 5. 决策逻辑
    if (result.verdict === 'rejected') {
      // 已拒绝
    } else if (result.reasons.length > 2) {
      // 多个原因 → 人工审核
      result.verdict = 'manual_review'
    } else if (result.reasons.length > 0) {
      // 单个原因且不是严重问题 → 拒绝
      result.verdict = 'rejected'
    } else {
      // 完全通过
      result.verdict = 'approved'
    }

    // 计算最终评分
    result.scores.final = (
      result.scores.quality * 0.3 +
      (1 - result.scores.sensitive) * 0.4 +
      (1 - result.scores.spam) * 0.3
    )

    auditHistory.value.push(result)
    return result
  }

  /**
   * 过滤敏感词（替换为 *)
   */
  const filterSensitiveWords = (content) => {
    let filtered = content
    sensitiveWords.value.forEach(pattern => {
      filtered = filtered.replace(pattern, (match) => '*'.repeat(match.length))
    })
    return filtered
  }

  /**
   * 用户举报内容
   */
  const reportContent = async (contentId, contentType, reason, description) => {
    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.reportContent(contentType, contentId, {
        reason,
        description,
        reportedAt: new Date()
      })

      if (response.data) {
        auditQueue.value.push({
          type: 'user_report',
          contentId,
          contentType,
          reason,
          status: 'pending'
        })
        return true
      }
    } catch (err) {
      error.value = err.message || '举报失败'
      console.error('Failed to report content:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加用户到黑名单
   */
  const blockUser = (userId, reason = '') => {
    blacklist.value.users.add(userId)
    console.log(`用户 ${userId} 已添加到黑名单 (原因: ${reason})`)
  }

  /**
   * 从黑名单移除用户
   */
  const unblockUser = (userId) => {
    blacklist.value.users.delete(userId)
    console.log(`用户 ${userId} 已从黑名单移除`)
  }

  /**
   * 添加敏感词到黑名单
   */
  const addBlacklistKeyword = (keyword) => {
    blacklist.value.keywords.add(keyword)
    // 也添加为正则表达式
    sensitiveWords.value.push(new RegExp(`\\b${keyword}\\b`, 'gi'))
  }

  /**
   * 批量审核内容
   */
  const batchAudit = (contentList) => {
    const results = contentList.map(content => auditContent(content))

    return {
      total: contentList.length,
      approved: results.filter(r => r.verdict === 'approved').length,
      rejected: results.filter(r => r.verdict === 'rejected').length,
      manualReview: results.filter(r => r.verdict === 'manual_review').length,
      results
    }
  }

  /**
   * 获取审核统计
   */
  const getAuditStats = () => {
    return {
      totalAudited: auditHistory.value.length,
      approved: auditHistory.value.filter(a => a.verdict === 'approved').length,
      rejected: auditHistory.value.filter(a => a.verdict === 'rejected').length,
      manualReview: auditHistory.value.filter(a => a.verdict === 'manual_review').length,
      averageQualityScore: auditHistory.value.length > 0
        ? (auditHistory.value.reduce((sum, a) => sum + a.scores.quality, 0) / auditHistory.value.length).toFixed(2)
        : 0,
      averageSpamScore: auditHistory.value.length > 0
        ? (auditHistory.value.reduce((sum, a) => sum + a.scores.spam, 0) / auditHistory.value.length).toFixed(2)
        : 0
    }
  }

  /**
   * 更新规则
   */
  const updateRules = (newRules) => {
    Object.assign(rules, newRules)
  }

  /**
   * 清除审核历史（可选）
   */
  const clearAuditHistory = () => {
    auditHistory.value = []
  }

  return {
    // 配置
    rules,
    sensitiveWords,
    blacklist,

    // 状态
    auditQueue,
    auditHistory,
    loading,
    error,

    // 方法
    auditContent,
    detectSensitiveWords,
    detectSpam,
    scoreContentQuality,
    filterSensitiveWords,
    reportContent,
    blockUser,
    unblockUser,
    addBlacklistKeyword,
    batchAudit,
    getAuditStats,
    updateRules,
    clearAuditHistory
  }
}
