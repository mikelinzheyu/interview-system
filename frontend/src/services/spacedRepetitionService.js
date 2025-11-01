/**
 * Spaced Repetition Service
 * Implements the SM-2 algorithm for optimal review scheduling
 *
 * Algorithm: SM-2
 * - Easy: interval * 2.6
 * - Normal: interval * 1.3
 * - Hard: interval * 1.0
 */

import dayjs from 'dayjs'

class SpacedRepetitionService {
  /**
   * SM-2 Algorithm Parameters
   */
  static INITIAL_INTERVAL = 1 // 1 day
  static INITIAL_FACTOR = 2.5
  static MIN_FACTOR = 1.3
  static FACTOR_STEP = 0.1

  /**
   * Difficulty levels mapping
   * Affects interval calculation
   */
  static DIFFICULTY_MULTIPLIERS = {
    easy: 2.6,      // Very easy recall
    normal: 1.3,    // Standard recall
    hard: 1.0,      // Struggling
    forgotten: 0.5  // Complete failure
  }

  /**
   * Priority level thresholds
   */
  static PRIORITY_LEVELS = {
    CRITICAL: 200,   // Must review
    HIGH: 100,       // Should review
    MEDIUM: 50,      // Recommended
    LOW: 0           // Optional
  }

  /**
   * Calculate next review date using SM-2 algorithm
   *
   * @param {Object} record - Wrong answer record
   * @param {string} difficulty - Review difficulty (easy/normal/hard)
   * @returns {Date} Next review date
   */
  static calculateNextReviewDate(record, difficulty = 'normal') {
    const intervalDays = this.calculateIntervalDays(
      record.intervalDays || this.INITIAL_INTERVAL,
      difficulty
    )

    const nextDate = dayjs().add(intervalDays, 'day').toDate()
    return nextDate
  }

  /**
   * Calculate interval days based on difficulty
   *
   * @param {number} currentInterval - Current interval in days
   * @param {string} difficulty - Review difficulty
   * @returns {number} New interval in days
   */
  static calculateIntervalDays(currentInterval, difficulty = 'normal') {
    const multiplier = this.DIFFICULTY_MULTIPLIERS[difficulty] || this.DIFFICULTY_MULTIPLIERS.normal
    const newInterval = Math.max(1, Math.ceil(currentInterval * multiplier))
    return newInterval
  }

  /**
   * Calculate review priority score
   * Higher score = higher priority
   *
   * @param {Object} record - Wrong answer record
   * @returns {number} Priority score (0-1000+)
   */
  static calculatePriority(record) {
    const now = dayjs()
    const nextReview = dayjs(record.nextReviewTime)
    const daysOverdue = Math.max(0, now.diff(nextReview, 'day'))

    // Component scores
    const overdueScore = daysOverdue * 100      // Heavily weighted
    const wrongCountScore = (record.wrongCount || 0) * 50
    const difficultyScore = this.getDifficultyScore(record.difficulty) * 30
    const correctCountScore = Math.max(0, (record.correctCount || 0) * -10)

    const totalScore = overdueScore + wrongCountScore + difficultyScore + correctCountScore
    return Math.max(0, totalScore)
  }

  /**
   * Get numeric difficulty score
   *
   * @param {string} difficulty - Difficulty level
   * @returns {number} Score (1-10)
   */
  static getDifficultyScore(difficulty) {
    const scores = {
      easy: 2,
      medium: 5,
      hard: 10
    }
    return scores[difficulty] || 5
  }

  /**
   * Get priority level label
   *
   * @param {number} priorityScore - Priority score
   * @returns {string} Priority level
   */
  static getPriorityLevel(priorityScore) {
    if (priorityScore >= this.PRIORITY_LEVELS.CRITICAL) return 'CRITICAL'
    if (priorityScore >= this.PRIORITY_LEVELS.HIGH) return 'HIGH'
    if (priorityScore >= this.PRIORITY_LEVELS.MEDIUM) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Determine if question needs review today
   *
   * @param {Object} record - Wrong answer record
   * @returns {boolean} True if needs review today
   */
  static needsReviewToday(record) {
    const today = dayjs().startOf('day')
    const nextReview = dayjs(record.nextReviewTime).startOf('day')
    return nextReview.isBefore(today) || nextReview.isSame(today)
  }

  /**
   * Calculate mastery score
   *
   * @param {Object} record - Wrong answer record
   * @returns {number} Mastery percentage (0-100)
   */
  static calculateMasteryScore(record) {
    const total = (record.correctCount || 0) + (record.wrongCount || 0)
    if (total === 0) return 0
    return Math.round((record.correctCount || 0) / total * 100)
  }

  /**
   * Get mastery status
   *
   * @param {number} masteryScore - Mastery score percentage
   * @returns {string} Status (mastered/reviewing/unreveiwed)
   */
  static getMasteryStatus(masteryScore) {
    if (masteryScore >= 85) return 'mastered'
    if (masteryScore >= 60) return 'reviewing'
    return 'unreveiwed'
  }

  /**
   * Generate review statistics for a list of records
   *
   * @param {Array} records - Wrong answer records
   * @returns {Object} Statistics object
   */
  static generateStatistics(records) {
    if (!records || records.length === 0) {
      return {
        total: 0,
        mastered: 0,
        reviewing: 0,
        unreveiwed: 0,
        masteredPercentage: 0,
        reviewingPercentage: 0,
        unreveiwedPercentage: 0,
        averagePriority: 0,
        averageMastery: 0,
        nextReviewCount: 0,
        overdueCount: 0
      }
    }

    const stats = {
      total: records.length,
      mastered: 0,
      reviewing: 0,
      unreveiwed: 0,
      nextReviewCount: 0,
      overdueCount: 0,
      totalPriority: 0,
      totalMastery: 0
    }

    records.forEach(record => {
      const mastery = this.calculateMasteryScore(record)
      const status = this.getMasteryStatus(mastery)
      const priority = this.calculatePriority(record)
      const isOverdue = priority >= this.PRIORITY_LEVELS.CRITICAL

      stats[status]++
      stats.totalMastery += mastery
      stats.totalPriority += priority

      if (this.needsReviewToday(record)) {
        stats.nextReviewCount++
      }
      if (isOverdue) {
        stats.overdueCount++
      }
    })

    return {
      ...stats,
      masteredPercentage: Math.round(stats.mastered / stats.total * 100),
      reviewingPercentage: Math.round(stats.reviewing / stats.total * 100),
      unreveiwedPercentage: Math.round(stats.unreveiwed / stats.total * 100),
      averagePriority: Math.round(stats.totalPriority / stats.total),
      averageMastery: Math.round(stats.totalMastery / stats.total)
    }
  }

  /**
   * Filter records due for review
   *
   * @param {Array} records - Wrong answer records
   * @param {Date} beforeDate - Get records due before this date
   * @returns {Array} Filtered records
   */
  static getDueForReview(records, beforeDate = new Date()) {
    return records.filter(record => {
      const nextReview = dayjs(record.nextReviewTime)
      const checkDate = dayjs(beforeDate)
      return nextReview.isBefore(checkDate) || nextReview.isSame(checkDate)
    })
  }

  /**
   * Sort records by priority
   *
   * @param {Array} records - Wrong answer records
   * @returns {Array} Sorted records (highest priority first)
   */
  static sortByPriority(records) {
    return [...records].sort((a, b) => {
      const priorityA = this.calculatePriority(a)
      const priorityB = this.calculatePriority(b)
      return priorityB - priorityA
    })
  }

  /**
   * Get recommended daily review count
   * Based on total records and time available
   *
   * @param {Object} stats - Statistics object
   * @param {number} availableHoursPerDay - Hours available daily
   * @returns {number} Recommended review count
   */
  static getRecommendedDailyCount(stats, availableHoursPerDay = 1) {
    const avgTimePerQuestion = 2 // minutes
    const availableMinutes = availableHoursPerDay * 60
    const baseCount = Math.floor(availableMinutes / avgTimePerQuestion)

    // If many overdue, increase count
    const overdueRatio = stats.overdueCount / stats.total
    if (overdueRatio > 0.2) {
      return Math.ceil(baseCount * 1.5)
    }
    if (overdueRatio > 0.1) {
      return Math.ceil(baseCount * 1.2)
    }

    return baseCount
  }
}

export default SpacedRepetitionService
