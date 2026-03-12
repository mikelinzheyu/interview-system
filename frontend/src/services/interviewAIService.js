/**
 * interviewAIService.js
 * 统一的 AI 面试服务入口。
 * 调用方只需使用此文件，无需感知 Dify / 后端 API 的降级细节。
 *
 * 降级策略：
 *   generateQuestions: Dify workflow → 后端 /ai/generate-questions → 本地默认题库
 *   analyzeAnswer:     Dify workflow → 后端 /interview/analyze    → 本地规则评分
 */

import * as aiApi from '@/api/ai'
import difyService from '@/services/difyService'

// ─── 工具函数 ────────────────────────────────────────────────────────────────

/** 分数限制在 [0, 100] */
const clamp = (val, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(val || 0)))

/** 从文本长度做简单的本地规则评分（降级兜底） */
function localRuleScore(answer = '') {
  const len = answer.trim().length
  if (len >= 300) return 75
  if (len >= 150) return 65
  if (len >= 50)  return 55
  return 40
}

// ─── 本地默认题库（最后兜底） ────────────────────────────────────────────────

const DEFAULT_QUESTIONS = [
  {
    question: '请简单介绍一下您最近参与的一个项目，以及您在其中承担的角色和使用的技术栈。',
    expectedAnswer: '开放性问题，主要考察项目经验、技术实践和沟通表达能力。',
    keywords: ['项目经验', '技术栈', '团队协作'],
    category: '项目经验',
    difficulty: '初级',
    generatedBy: 'local_fallback'
  },
  {
    question: '请描述一次您在工作中遇到的技术难题，以及您是如何解决的。',
    expectedAnswer: '考察问题分析能力和解决思路。',
    keywords: ['问题解决', '技术难题'],
    category: '综合能力',
    difficulty: '中级',
    generatedBy: 'local_fallback'
  }
]

// ─── 核心 Service ────────────────────────────────────────────────────────────

class InterviewAIService {
  /**
   * 生成面试题目
   * @param {Object} params
   * @param {string} params.profession  - 岗位名称
   * @param {string} params.difficulty  - 难度：初级 / 中级 / 高级
   * @param {number} [params.count=5]   - 题目数量
   * @param {Array}  [params.exclude=[]]- 已有题目 id（避免重复）
   * @returns {Promise<{success, questions, source, error?}>}
   */
  async generateQuestions({ profession, difficulty = '中级', count = 5, exclude = [] }) {
    // ── 1. Dify workflow ──────────────────────────────────────────────────────
    try {
      const result = await difyService.generateQuestionByProfession(profession, {
        level: difficulty,
        count,
        excludeQuestions: exclude
      })

      if (result.success && result.data) {
        const questions = (result.data.allQuestions?.length
          ? result.data.allQuestions
          : [result.data]
        ).map((q, i) => ({
          id: q.questionId || q.id || `dify_${i}_${Date.now()}`,
          question: q.question,
          expectedAnswer: q.expectedAnswer || q.answer || '',
          keywords: q.keywords || q.tags || [],
          category: q.category || profession,
          difficulty: q.difficulty || difficulty,
          generatedBy: 'dify_workflow',
          confidenceScore: q.confidenceScore || 0.92
        }))

        return { success: true, questions, source: 'dify_workflow', metadata: result.metadata }
      }
    } catch (e) {
      console.warn('[InterviewAI] Dify 生成失败，降级到后端 API', e.message)
    }

    // ── 2. 后端 /ai/generate-questions ───────────────────────────────────────
    try {
      const resp = await aiApi.generateQuestions({
        jobTitle: profession,
        level: difficulty,
        count,
        excludeIds: exclude,
        includeMetadata: true
      })

      if (resp?.data?.success && resp.data.data) {
        const raw = resp.data.data
        const questions = (raw.allQuestions || [raw]).map((q, i) => ({
          id: q.questionId || q.id || `api_${i}_${Date.now()}`,
          question: q.question,
          expectedAnswer: q.expectedAnswer || '',
          keywords: q.keywords || [],
          category: q.category || profession,
          difficulty: q.difficulty || difficulty,
          generatedBy: 'backend_api',
          confidenceScore: 0.8
        }))

        return { success: true, questions, source: 'backend_api' }
      }
    } catch (e) {
      console.warn('[InterviewAI] 后端 API 生成失败，降级到本地题库', e.message)
    }

    // ── 3. 本地默认题库（最终兜底） ───────────────────────────────────────────
    const questions = DEFAULT_QUESTIONS.map((q, i) => ({
      ...q,
      id: `local_${i}_${Date.now()}`
    }))

    return {
      success: true,
      questions,
      source: 'local_fallback',
      warning: '当前使用本地默认题库，请检查网络连接'
    }
  }

  /**
   * 分析面试回答
   * @param {Object} params
   * @param {string} params.question   - 题目文本
   * @param {string} params.answer     - 候选人回答
   * @param {string} params.profession - 岗位名称
   * @param {string} [params.sessionId]
   * @param {string} [params.questionId]
   * @returns {Promise<{success, data, source, processingTime?}>}
   */
  async analyzeAnswer({ question, answer, profession, sessionId, questionId }) {
    const startTime = Date.now()

    // ── 1. Dify workflow ──────────────────────────────────────────────────────
    try {
      const result = await difyService.analyzeAnswerWithDify({
        question,
        answer,
        profession,
        sessionId,
        questionId
      })

      if (result.success) {
        return {
          success: true,
          data: this._normalizeAnalysis(result.data || result, answer),
          source: 'dify_workflow',
          processingTime: Date.now() - startTime
        }
      }
    } catch (e) {
      console.warn('[InterviewAI] Dify 分析失败，降级到后端 API', e.message)
    }

    // ── 2. 后端 /interview/analyze ────────────────────────────────────────────
    try {
      const resp = await aiApi.callDifyWorkflow({
        requestType: 'score_answer',
        question,
        candidateAnswer: answer,
        jobTitle: profession,
        sessionId
      })

      if (resp?.data?.success && resp.data.data) {
        return {
          success: true,
          data: this._normalizeAnalysis(resp.data.data, answer),
          source: 'backend_api',
          processingTime: Date.now() - startTime
        }
      }
    } catch (e) {
      console.warn('[InterviewAI] 后端 API 分析失败，使用本地规则评分', e.message)
    }

    // ── 3. 本地规则评分（最终兜底） ───────────────────────────────────────────
    const localScore = localRuleScore(answer)
    return {
      success: true,
      data: {
        overallScore: localScore,
        technicalScore: clamp(localScore * 0.9),
        communicationScore: clamp(localScore),
        logicalScore: clamp(localScore * 1.05),
        summary: '本次回答已记录（离线评分模式，仅供参考）',
        suggestions: ['建议检查网络连接后重新分析以获得精准评分'],
        strengths: [],
        weaknesses: []
      },
      source: 'local_rule',
      processingTime: Date.now() - startTime,
      warning: '当前使用离线规则评分，结果仅供参考'
    }
  }

  /** 统一 analysis 数据结构，并 clamp 分数 */
  _normalizeAnalysis(raw, answer = '') {
    const overall = clamp(raw.overallScore || raw.overall?.score || localRuleScore(answer))
    return {
      overallScore: overall,
      technicalScore: clamp(raw.technicalAccuracy ?? raw.technicalScore ?? Math.floor(overall * 0.9)),
      communicationScore: clamp(raw.fluency ?? raw.communicationScore ?? Math.floor(overall)),
      logicalScore: clamp(raw.logicClarity ?? raw.logicalScore ?? Math.floor(overall * 1.05)),
      summary: raw.summary || raw.overall?.summary || '分析完成',
      suggestions: raw.suggestions || [],
      strengths: raw.strengths || [],
      weaknesses: raw.weaknesses || [],
      standardAnswer: raw.standardAnswer || ''
    }
  }
}

export default new InterviewAIService()
