import * as aiApi from '@/api/ai'
import logger, { apiLogger } from '@/utils/logger'

/**
 * Dify workflow service
 * All calls go through the backend proxy to avoid CORS and centralise secrets.
 */
export class DifyService {
  constructor() {
    this.defaultConfidence = 0.92
  }

  /**
   * Generate interview questions for a profession via Dify.
   */
  async generateQuestionByProfession(profession, options = {}) {
    const startTime = Date.now()

    try {
      const { level = 'Intermediate', count = 1, excludeQuestions = [] } = options

      apiLogger.info('Calling Dify generate workflow', { profession, level, count, excludeQuestions })

      const response = await aiApi.callDifyWorkflow({
        requestType: 'generate_questions',
        jobTitle: profession,
        level,
        count,
        excludeQuestions
      })

      if (response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Dify generation failed')
      }

      const payload = response.data
      if (payload.success === false) {
        throw new Error(payload.error || 'Dify workflow returned an error')
      }

      const sessionId = payload.sessionId || payload.session_id
      const jobTitle = payload.jobTitle || payload.job_title || profession
      const questions = this.normalizeQuestionList(payload)
      const selectedQuestion = this.pickSelectedQuestion(payload, questions)
      const storageSnapshot = payload.metadata?.sessionSnapshot

      const composedQuestion = this.composeQuestionData({
        sessionId,
        jobTitle,
        profession,
        difficulty: level,
        selectedQuestion,
        storageSnapshot
      })

      const metadata = {
        processingTime: Date.now() - startTime,
        workflowRunId: payload.metadata?.workflowRunId,
        sessionId,
        raw: payload
      }

      return {
        success: true,
        data: {
          ...composedQuestion,
          allQuestions: questions,
          jobTitle,
          level
        },
        metadata
      }
    } catch (error) {
      logger.error('Dify question generation failed', error)
      return {
        success: false,
        error: error.message || 'Unable to call Dify workflow',
        fallbackAvailable: true,
        profession
      }
    }
  }

  /**
   * Analyse a candidate answer through the Dify scoring workflow.
   */
  async analyzeAnswerWithDify(data) {
    const startTime = Date.now()

    try {
      const {
        question,
        answer,
        sessionId,
        questionId,
        profession = 'General'
      } = data

      if (!question || !answer) {
        throw new Error('Question and answer are required')
      }
      if (!sessionId) {
        throw new Error('sessionId is required for Dify scoring')
      }

      apiLogger.info('Calling Dify scoring workflow', { question, questionId, sessionId, profession })

      const response = await aiApi.callDifyWorkflow({
        requestType: 'score_answer',
        sessionId,
        questionId,
        question,
        candidateAnswer: answer
      })

      if (response.code !== 200 || !response.data) {
        throw new Error(response.message || 'Dify scoring failed')
      }

      const payload = response.data
      if (payload.success === false) {
        throw new Error(payload.error || 'Dify workflow returned an error')
      }

      const overallScore = payload.overallScore ?? payload.overall_score ?? 75
      const evaluation = payload.comprehensiveEvaluation ?? payload.comprehensive_evaluation ?? ''
      const standardAnswer = payload.standardAnswer ?? payload.standard_answer ?? ''

      return {
        success: true,
        source: 'dify_workflow',
        processingTime: Date.now() - startTime,
        data: {
          sessionId: payload.sessionId || payload.session_id || sessionId,
          questionId: payload.questionId || payload.question_id || questionId,
          overallScore,
          summary: evaluation,
          suggestions: this.extractSuggestions(evaluation),
          standardAnswer,
          raw: payload,
          // derived metrics for UI
          technicalAccuracy: Math.round(overallScore * 0.9),
          fluency: Math.round(overallScore * 1.05),
          logicClarity: Math.round(overallScore * 1.1)
        }
      }
    } catch (error) {
      logger.error('Dify answer analysis failed', error)
      return {
        success: false,
        error: error.message || 'Unable to call Dify workflow',
        fallbackAvailable: true
      }
    }
  }

  composeQuestionData({ sessionId, jobTitle, profession, difficulty, selectedQuestion, storageSnapshot }) {
    const questionId = selectedQuestion?.id || `q-${Date.now()}`
    const questionText = selectedQuestion?.question || `Please describe a recent ${profession} project you led.`
    const resolvedAnswer = this.resolveAnswer(selectedQuestion, storageSnapshot)

    return {
      questionId,
      question: questionText,
      expectedAnswer: resolvedAnswer,
      sessionId,
      jobTitle,
      profession,
      difficulty,
      generatedBy: 'dify_workflow',
      confidenceScore: selectedQuestion?.confidenceScore || this.defaultConfidence,
      smartGeneration: true,
      searchSource: selectedQuestion?.searchSource || 'dify_rag',
      sourceUrls: selectedQuestion?.sourceUrls || [],
      keywords: this.extractKeywords(profession),
      category: profession,
      metadata: selectedQuestion?.metadata || {},
      hasAnswer: Boolean(resolvedAnswer)
    }
  }

  normalizeQuestionList(payload = {}) {
    const questions = payload.questions || payload.generated_questions || []
    const normalized = Array.isArray(questions) ? questions.slice() : []

    if (normalized.length === 0 && Array.isArray(payload.allQuestions)) {
      return payload.allQuestions
    }

    const snapshotQuestions = payload.metadata?.sessionSnapshot?.questions
    if (normalized.length === 0 && Array.isArray(snapshotQuestions)) {
      return snapshotQuestions
    }

    return normalized.map((item, index) => ({
      id: item.id || `q${index + 1}`,
      question: item.question || item.text || '',
      answer: item.answer || item.standard_answer || '',
      order: item.order ?? index + 1,
      hasAnswer: item.hasAnswer ?? Boolean(item.answer)
    }))
  }

  pickSelectedQuestion(payload, questions) {
    if (payload.selectedQuestion) return payload.selectedQuestion
    if (payload.selected_question) return payload.selected_question
    if (questions && questions.length > 0) return questions[0]
    const generated = payload.generated_questions
    if (Array.isArray(generated) && generated.length > 0) {
      return { question: generated[0] }
    }
    return { question: 'Please introduce a core project you managed recently.' }
  }

  resolveAnswer(selectedQuestion, snapshot) {
    if (selectedQuestion?.answer) {
      return selectedQuestion.answer
    }
    if (!snapshot?.questions) return ''
    const match = snapshot.questions.find(item => item.id === selectedQuestion?.id)
    return match?.answer || ''
  }

  extractKeywords(profession = '') {
    // Extract relevant keywords from profession/role name for context
    if (!profession) return []

    // Split profession into words and filter out common words
    const commonWords = ['engineer', 'developer', 'specialist', 'expert', 'manager', 'lead', 'senior', 'junior', 'the', 'a', 'and', 'or']
    const keywords = profession
      .toLowerCase()
      .split(/[\s-_/]+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))

    return keywords
  }

  extractSuggestions(evaluation = '') {
    if (!evaluation) return []
    const segments = evaluation.split(/[\n;-]/).map(text => text.trim()).filter(Boolean)
    return segments.slice(0, 3)
  }

  getRecommendedProfessions() {
    return [
      { value: 'Front-end', label: 'Front-end', icon: 'FE' },
      { value: 'Back-end', label: 'Back-end', icon: 'BE' },
      { value: 'Full-stack', label: 'Full-stack', icon: 'FS' },
      { value: 'Mobile', label: 'Mobile', icon: 'MB' },
      { value: 'Data Science', label: 'Data Science', icon: 'DS' },
      { value: 'Machine Learning', label: 'Machine Learning', icon: 'ML' },
      { value: 'Artificial Intelligence', label: 'Artificial Intelligence', icon: 'AI' },
      { value: 'Cloud', label: 'Cloud', icon: 'CL' },
      { value: 'Security', label: 'Security', icon: 'SEC' },
      { value: 'Blockchain', label: 'Blockchain', icon: 'BC' },
      { value: 'DevOps', label: 'DevOps', icon: 'DO' },
      { value: 'QA', label: 'QA', icon: 'QA' },
      { value: 'Product Management', label: 'Product Management', icon: 'PM' },
      { value: 'Project Management', label: 'Project Management', icon: 'PMO' },
      { value: 'UI/UX Design', label: 'UI/UX Design', icon: 'UX' }
    ]
  }

  handleDifyError(error) {
    if (error?.response) {
      const { status, data } = error.response
      const message = data?.message || error.message || 'Dify API call failed'
      return {
        code: `DIFY_API_${status}`,
        message,
        details: data,
        suggestion: 'Check Dify configuration or retry later'
      }
    }

    if (error?.request) {
      return {
        code: 'DIFY_NETWORK_ERROR',
        message: 'Unable to reach Dify API',
        suggestion: 'Verify network connectivity'
      }
    }

    return {
      code: 'DIFY_UNKNOWN_ERROR',
      message: error?.message || 'Unknown error',
      suggestion: 'Retry or contact support'
    }
  }
}

export default new DifyService()
