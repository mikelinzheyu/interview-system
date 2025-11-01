/**
 * Review Plan Service
 * Manages personalized review plans for wrong answers
 */

import { api } from '@/api'
import dayjs from 'dayjs'
import SpacedRepetitionService from './spacedRepetitionService'

class ReviewPlanService {
  /**
   * Generate personalized review plan
   */
  static async generateReviewPlan(wrongAnswers, preferences = {}) {
    try {
      const hoursPerDay = preferences.hoursPerDay || 1
      const daysAvailable = preferences.daysAvailable || 30
      const focusAreas = preferences.focusAreas || []

      const schedule = this.calculateReviewSchedule(wrongAnswers, hoursPerDay, daysAvailable)

      return {
        planId: Date.now(),
        generatedAt: new Date(),
        totalDays: daysAvailable,
        hoursPerDay,
        estimatedCompletionDate: dayjs().add(daysAvailable, 'day').toDate(),
        dailyTasks: schedule.dailyTasks,
        weeklyGoals: schedule.weeklyGoals,
        totalQuestionsToReview: wrongAnswers.length,
        questionsPerDay: schedule.questionsPerDay,
        estimatedSuccessRate: schedule.estimatedSuccessRate,
        focusAreas,
        revisionStrategy: 'spaced-repetition'
      }
    } catch (error) {
      console.error('Error generating review plan:', error)
      throw error
    }
  }

  /**
   * Calculate review schedule
   */
  static calculateReviewSchedule(wrongAnswers, hoursPerDay, daysAvailable) {
    const minutesPerDay = hoursPerDay * 60
    const avgTimePerQuestion = 2
    const questionsPerDay = Math.ceil(minutesPerDay / avgTimePerQuestion)

    const sortedQuestions = SpacedRepetitionService.sortByPriority(wrongAnswers)
    const dailyTasks = []
    let questionIndex = 0

    for (let day = 1; day <= daysAvailable && questionIndex < sortedQuestions.length; day++) {
      const dayDate = dayjs().add(day, 'day').toDate()
      const tasksForDay = []

      for (let i = 0; i < questionsPerDay && questionIndex < sortedQuestions.length; i++) {
        tasksForDay.push({
          recordId: sortedQuestions[questionIndex].id,
          questionTitle: sortedQuestions[questionIndex].questionTitle,
          priority: SpacedRepetitionService.calculatePriority(sortedQuestions[questionIndex]),
          estimatedTime: avgTimePerQuestion
        })
        questionIndex++
      }

      if (tasksForDay.length > 0) {
        dailyTasks.push({
          date: dayDate,
          dayNumber: day,
          tasks: tasksForDay,
          estimatedDuration: tasksForDay.length * avgTimePerQuestion,
          completed: false,
          completedCount: 0
        })
      }
    }

    const weeklyGoals = this.calculateWeeklyGoals(dailyTasks)

    const totalCorrect = wrongAnswers.reduce((sum, q) => sum + (q.correctCount || 0), 0)
    const totalReviews = wrongAnswers.reduce((sum, q) => sum + (q.correctCount || 0) + (q.wrongCount || 0), 0)
    const estimatedSuccessRate = totalReviews > 0 ? (totalCorrect / totalReviews * 100) : 50

    return {
      dailyTasks,
      weeklyGoals,
      questionsPerDay,
      estimatedSuccessRate: Math.round(estimatedSuccessRate)
    }
  }

  /**
   * Calculate weekly goals
   */
  static calculateWeeklyGoals(dailyTasks) {
    const weeklyGoals = []
    let currentWeek = 1
    let weekTasks = []

    dailyTasks.forEach((dailyTask, index) => {
      weekTasks.push(...dailyTask.tasks)

      if ((index + 1) % 7 === 0 || index === dailyTasks.length - 1) {
        weeklyGoals.push({
          weekNumber: currentWeek,
          startDate: dailyTasks[index - weekTasks.length + 1]?.date,
          endDate: dailyTask.date,
          targetQuestions: weekTasks.length,
          targetCompletionRate: 85
        })
        currentWeek++
        weekTasks = []
      }
    })

    return weeklyGoals
  }

  /**
   * Get today's review tasks
   */
  static getTodayTasks(plan) {
    const today = dayjs().format('YYYY-MM-DD')
    const todayTask = plan.dailyTasks.find(task =>
      dayjs(task.date).format('YYYY-MM-DD') === today
    )
    return todayTask?.tasks || []
  }

  /**
   * Get upcoming tasks
   */
  static getUpcomingTasks(plan, days = 7) {
    const today = dayjs().startOf('day')
    const endDate = today.add(days, 'day')

    return plan.dailyTasks.filter(task => {
      const taskDate = dayjs(task.date).startOf('day')
      return taskDate.isAfter(today) && taskDate.isBefore(endDate)
    })
  }

  /**
   * Mark tasks completed
   */
  static markTasksCompleted(plan, dayNumber, taskIds) {
    const updatedPlan = { ...plan }
    const dayTask = updatedPlan.dailyTasks.find(t => t.dayNumber === dayNumber)

    if (dayTask) {
      dayTask.completedCount = taskIds.length
      dayTask.completed = dayTask.completedCount === dayTask.tasks.length
    }

    return updatedPlan
  }

  /**
   * Get plan progress
   */
  static getPlanProgress(plan) {
    const totalTasks = plan.dailyTasks.reduce((sum, d) => sum + d.tasks.length, 0)
    const completedTasks = plan.dailyTasks.reduce((sum, d) => sum + d.completedCount, 0)
    const completedDays = plan.dailyTasks.filter(d => d.completed).length
    const totalDays = plan.dailyTasks.length

    return {
      completedTasks,
      totalTasks,
      completedPercentage: Math.round((completedTasks / totalTasks) * 100),
      completedDays,
      totalDays,
      daysPercentage: Math.round((completedDays / totalDays) * 100),
      estimatedDaysToCompletion: Math.ceil((totalTasks - completedTasks) / plan.questionsPerDay)
    }
  }

  /**
   * Suggest plan adjustments
   */
  static suggestAdjustments(plan, progress) {
    const suggestions = []

    if (progress.completedPercentage < 50 && progress.daysPercentage < 50) {
      suggestions.push({
        type: 'pace-slow',
        message: 'Your review pace is slower than planned. Consider extending your study time.',
        action: 'increase-hours'
      })
    }

    if (progress.completedPercentage > 80 && progress.daysPercentage < 30) {
      suggestions.push({
        type: 'pace-fast',
        message: 'You are ahead of schedule! Consider taking a break or adding more questions.',
        action: 'add-questions'
      })
    }

    return suggestions
  }

  /**
   * Generate review session
   */
  static generateReviewSession(plan, dayNumber) {
    const dayTask = plan.dailyTasks.find(t => t.dayNumber === dayNumber)

    if (!dayTask) {
      return null
    }

    return {
      sessionId: `session-${dayNumber}-${Date.now()}`,
      dayNumber,
      date: dayTask.date,
      totalQuestions: dayTask.tasks.length,
      questions: dayTask.tasks,
      estimatedDuration: dayTask.estimatedDuration,
      startTime: new Date(),
      status: 'active',
      completedCount: 0,
      score: 0
    }
  }

  /**
   * Save plan to backend
   */
  static async savePlan(plan) {
    try {
      const response = await api.post('/review-plans', plan)
      return response.data
    } catch (error) {
      console.error('Error saving review plan:', error)
      throw error
    }
  }

  /**
   * Fetch user's current plan
   */
  static async getCurrentPlan() {
    try {
      const response = await api.get('/review-plans/current')
      return response.data
    } catch (error) {
      console.error('Error fetching current plan:', error)
      return null
    }
  }
}

export default ReviewPlanService
