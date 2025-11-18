/**
 * AI Analysis Service
 * Provides AI-powered insights for wrong answers
 * Integrates with Dify API for intelligent analysis
 */

import { api } from '@/api'

class AIAnalysisService {
  /**
   * Analyze wrong answer using AI
   * Identifies knowledge gaps and learning issues
   *
   * @param {Object} wrongAnswer - Wrong answer record
   * @returns {Promise<Object>} Analysis result
   */
  static async analyzeWrongAnswer(wrongAnswer) {
    try {
      const response = await api.post('/wrong-answers/analyze', {
        recordId: wrongAnswer.id,
        questionId: wrongAnswer.questionId,
        userAnswer: wrongAnswer.userAnswer,
        correctAnswer: wrongAnswer.correctAnswer,
        questionContent: wrongAnswer.questionContent,
        source: wrongAnswer.source,
        difficulty: wrongAnswer.difficulty
      })

      return {
        analysisId: response.data.id,
        rootCauses: response.data.rootCauses || [],
        conceptsToReview: response.data.conceptsToReview || [],
        learningHints: response.data.learningHints || [],
        similarQuestions: response.data.similarQuestions || [],
        confidence: response.data.confidence || 0.85,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Error analyzing wrong answer:', error)
      throw error
    }
  }

  /**
   * Generate personalized learning hints
   * Based on wrong answer patterns
   *
   * @param {Array} wrongAnswers - List of wrong answers
   * @returns {Promise<Array>} Personalized hints
   */
  static async generatePersonalizedHints(wrongAnswers) {
    try {
      if (!wrongAnswers || wrongAnswers.length === 0) {
        return []
      }

      const response = await api.post('/wrong-answers/generate-hints', {
        recordIds: wrongAnswers.map(w => w.id),
        count: Math.min(5, wrongAnswers.length)
      })

      return response.data.hints || []
    } catch (error) {
      console.error('Error generating hints:', error)
      return []
    }
  }

  /**
   * Get learning statistics and insights
   * Analyzes patterns across all wrong answers
   *
   * @param {Array} wrongAnswers - List of wrong answers
   * @returns {Promise<Object>} Learning insights
   */
  static async getLearningInsights(wrongAnswers) {
    try {
      if (!wrongAnswers || wrongAnswers.length === 0) {
        return this.getEmptyInsights()
      }

      const response = await api.post('/wrong-answers/learning-insights', {
        recordIds: wrongAnswers.map(w => w.id),
        count: wrongAnswers.length
      })

      return {
        topWeaknesses: response.data.topWeaknesses || [],
        topStrengths: response.data.topStrengths || [],
        improvementTrend: response.data.improvementTrend || 'stable',
        recommendedFocus: response.data.recommendedFocus || [],
        nextSteps: response.data.nextSteps || [],
        estimatedTimeToMastery: response.data.estimatedTimeToMastery || 'unknown'
      }
    } catch (error) {
      console.error('Error getting learning insights:', error)
      return this.getEmptyInsights()
    }
  }

  /**
   * Generate AI-powered review plan
   *
   * @param {Array} wrongAnswers - List of wrong answers
   * @param {Object} constraints - Time/resource constraints
   * @returns {Promise<Object>} Review plan
   */
  static async generateAIReviewPlan(wrongAnswers, constraints = {}) {
    try {
      const response = await api.post('/wrong-answers/generate-ai-plan', {
        recordIds: wrongAnswers.map(w => w.id),
        hoursPerDay: constraints.hoursPerDay || 1,
        daysAvailable: constraints.daysAvailable || 30,
        focusAreas: constraints.focusAreas || []
      })

      return {
        planId: response.data.id,
        dailyTasks: response.data.dailyTasks || [],
        weeklyGoals: response.data.weeklyGoals || [],
        monthlyMilestones: response.data.monthlyMilestones || [],
        estimatedCompletion: response.data.estimatedCompletion,
        successProbability: response.data.successProbability || 0.75
      }
    } catch (error) {
      console.error('Error generating AI review plan:', error)
      throw error
    }
  }

  /**
   * Generate smart interview question based on user profile
   * Uses AI to generate contextual questions based on job, level, and skills
   *
   * @param {Object} params - Question generation parameters
   * @returns {Promise<Object>} Generated question data
   */
  static async generateQuestionSmart(params) {
    try {
      // Import InterviewAPIService dynamically to avoid circular dependencies
      const InterviewAPIService = await import('./InterviewAPIService').then(m => m.default)
      const interviewService = new InterviewAPIService()

      const response = await interviewService.generateQuestionSmart(params)

      return {
        success: true,
        data: response.data || response,
        message: 'Question generated successfully'
      }
    } catch (error) {
      console.error('Error generating smart question:', error)
      // Return error object that AIInterviewSession can handle
      return {
        success: false,
        data: null,
        error: error.message
      }
    }
  }

  /**
   * Get empty insights object
   */
  static getEmptyInsights() {
    return {
      topWeaknesses: [],
      topStrengths: [],
      improvementTrend: 'unknown',
      recommendedFocus: [],
      nextSteps: [],
      estimatedTimeToMastery: 'unknown'
    }
  }
}

export default AIAnalysisService
