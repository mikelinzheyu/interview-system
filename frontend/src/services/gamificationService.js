/**
 * Gamification Service - Achievement, Badge, Points & Streak System
 *
 * Features:
 * - Achievement unlocking and tracking
 * - Points and level system
 * - Streak management with bonuses
 * - Quest system with daily challenges
 * - Badge collection and display
 *
 * @module gamificationService
 */

const gamificationService = {
  /**
   * Achievement Definitions
   */
  ACHIEVEMENTS: {
    // Learning Achievements
    FIRST_DOMAIN: {
      id: 'first_domain',
      title: '初学者',
      description: '完成你的第一个学科',
      icon: '🎓',
      category: 'Learning',
      reward: 100,
      difficulty: 'Easy',
      criteria: { domainsCompleted: 1 }
    },
    TEN_DOMAINS: {
      id: 'ten_domains',
      title: '10个学科完成者',
      description: '完成10个学科',
      icon: '🌟',
      category: 'Learning',
      reward: 500,
      difficulty: 'Hard',
      criteria: { domainsCompleted: 10 }
    },
    PERFECT_ACCURACY: {
      id: 'perfect_accuracy',
      title: '完美准确率',
      description: '在一个学科中获得100%的准确率',
      icon: '💯',
      category: 'Learning',
      reward: 200,
      difficulty: 'Medium',
      criteria: { accuracyPercentage: 100, questionCount: 10 }
    },
    SPEED_LEARNER: {
      id: 'speed_learner',
      title: '速学者',
      description: '平均每题不到2分钟',
      icon: '⚡',
      category: 'Learning',
      reward: 150,
      difficulty: 'Medium',
      criteria: { avgTimePerQuestion: 2 }
    },

    // Streak Achievements
    SEVEN_DAY_STREAK: {
      id: 'seven_day_streak',
      title: '周连续学习',
      description: '连续学习7天',
      icon: '🔥',
      category: 'Progress',
      reward: 300,
      difficulty: 'Medium',
      criteria: { streakDays: 7 }
    },
    THIRTY_DAY_STREAK: {
      id: 'thirty_day_streak',
      title: '月连续学习',
      description: '连续学习30天',
      icon: '🌋',
      category: 'Progress',
      reward: 1000,
      difficulty: 'Hard',
      criteria: { streakDays: 30 }
    },

    // Time Achievements
    HUNDRED_HOURS: {
      id: 'hundred_hours',
      title: '百小时投入',
      description: '学习100小时以上',
      icon: '⏱️',
      category: 'Progress',
      reward: 400,
      difficulty: 'Hard',
      criteria: { totalHours: 100 }
    },

    // Social Achievements
    FIRST_SHARE: {
      id: 'first_share',
      title: '分享者',
      description: '第一次分享学习成就',
      icon: '📤',
      category: 'Social',
      reward: 50,
      difficulty: 'Easy',
      criteria: { shares: 1 }
    },
    TEN_SHARES: {
      id: 'ten_shares',
      title: '传播者',
      description: '分享10次学习内容',
      icon: '📢',
      category: 'Social',
      reward: 250,
      difficulty: 'Medium',
      criteria: { shares: 10 }
    },

    // Exploration Achievements
    EXPLORER: {
      id: 'explorer',
      title: '探索者',
      description: '浏览5个不同学科的知识图',
      icon: '🗺️',
      category: 'Exploration',
      reward: 100,
      difficulty: 'Easy',
      criteria: { domainsExplored: 5 }
    },
    COLLECTION_MASTER: {
      id: 'collection_master',
      title: '收藏大师',
      description: '创建5个学习集合',
      icon: '📚',
      category: 'Exploration',
      reward: 200,
      difficulty: 'Medium',
      criteria: { collectionsCreated: 5 }
    }
  },

  /**
   * Points Configuration
   */
  POINTS: {
    COMPLETE_QUESTION: 10,
    PERFECT_QUESTION: 20,
    COMPLETE_DOMAIN: 100,
    DAILY_CHALLENGE: 50,
    WEEKLY_PERFECT: 200,
    STREAK_7_DAYS: 100,
    STREAK_30_DAYS: 500,
    SHARE_CONTENT: 25,
    HELP_OTHER_USER: 50,
    WRITE_GUIDE: 100
  },

  /**
   * Level Configuration
   */
  LEVELS: {
    1: { name: '新手', minPoints: 0, icon: '🌱' },
    2: { name: '学徒', minPoints: 100, icon: '📖' },
    3: { name: '学生', minPoints: 300, icon: '🎓' },
    4: { name: '学者', minPoints: 600, icon: '📚' },
    5: { name: '专家', minPoints: 1000, icon: '🎯' },
    6: { name: '大师', minPoints: 1500, icon: '👑' },
    7: { name: '传奇', minPoints: 2500, icon: '⭐' }
  },

  /**
   * Get or create user gamification profile
   * @param {string} userId
   * @returns {Object} User gamification profile
   */
  getUserProfile(userId) {
    const savedProfile = localStorage.getItem(`gamification_${userId}`)
    if (savedProfile) {
      return JSON.parse(savedProfile)
    }

    const newProfile = {
      userId,
      totalPoints: 0,
      currentLevel: 1,
      unlockedAchievements: [],
      streaks: {},
      pointsHistory: [],
      createdAt: new Date(),
      lastActivityDate: null
    }

    this.saveProfile(userId, newProfile)
    return newProfile
  },

  /**
   * Save user profile to localStorage
   * @param {string} userId
   * @param {Object} profile
   */
  saveProfile(userId, profile) {
    localStorage.setItem(`gamification_${userId}`, JSON.stringify(profile))
  },

  /**
   * Add points to user
   * @param {string} userId
   * @param {number} points
   * @param {string} reason
   * @returns {Object} Updated profile
   */
  addPoints(userId, points, reason = 'Activity') {
    const profile = this.getUserProfile(userId)
    profile.totalPoints += points
    profile.pointsHistory.push({
      points,
      reason,
      date: new Date(),
      newTotal: profile.totalPoints
    })

    // Update level
    profile.currentLevel = this.calculateLevel(profile.totalPoints)

    // Check for milestone achievements
    this.checkPointAchievements(profile)

    this.saveProfile(userId, profile)
    return profile
  },

  /**
   * Calculate user level based on points
   * @param {number} points
   * @returns {number} User level
   */
  calculateLevel(points) {
    let level = 1
    for (let i = 7; i >= 1; i--) {
      if (points >= this.LEVELS[i].minPoints) {
        level = i
        break
      }
    }
    return level
  },

  /**
   * Get user level info
   * @param {number} level
   * @returns {Object} Level info
   */
  getLevelInfo(level) {
    return this.LEVELS[level] || this.LEVELS[1]
  },

  /**
   * Record activity for streak
   * @param {string} userId
   * @param {number} domainId
   * @returns {Object} Streak info
   */
  recordActivityStreak(userId, domainId) {
    const profile = this.getUserProfile(userId)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!profile.streaks[domainId]) {
      profile.streaks[domainId] = {
        domainId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakStartDate: null
      }
    }

    const streak = profile.streaks[domainId]
    const lastDate = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null
    lastDate?.setHours(0, 0, 0, 0)

    const todayTime = today.getTime()
    const lastTime = lastDate?.getTime() || 0

    // Check if activity is today (within 24 hours)
    if (lastTime === todayTime) {
      // Already recorded today
      return streak
    } else if (lastTime === todayTime - 24 * 60 * 60 * 1000) {
      // Continue streak from yesterday
      streak.currentStreak += 1
    } else {
      // Streak broken, reset
      streak.currentStreak = 1
      streak.streakStartDate = new Date()
    }

    // Update longest streak
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak
    }

    streak.lastActivityDate = new Date()
    profile.lastActivityDate = new Date()

    // Award streak bonus
    const streakBonus = this.getStreakBonus(streak.currentStreak)
    if (streakBonus > 0) {
      this.addPoints(userId, streakBonus, `${streak.currentStreak}日连续学习奖励`)
    }

    this.saveProfile(userId, profile)

    // Check for streak achievements
    this.checkStreakAchievements(profile)

    return streak
  },

  /**
   * Get streak bonus points
   * @param {number} streakDays
   * @returns {number} Bonus points
   */
  getStreakBonus(streakDays) {
    if (streakDays >= 30) return 100
    if (streakDays >= 14) return 50
    if (streakDays >= 7) return 25
    if (streakDays >= 3) return 10
    return 0
  },

  /**
   * Get current streak for domain
   * @param {string} userId
   * @param {number} domainId
   * @returns {number} Current streak days
   */
  getCurrentStreak(userId, domainId) {
    const profile = this.getUserProfile(userId)
    return profile.streaks[domainId]?.currentStreak || 0
  },

  /**
   * Get longest streak for domain
   * @param {string} userId
   * @param {number} domainId
   * @returns {number} Longest streak days
   */
  getLongestStreak(userId, domainId) {
    const profile = this.getUserProfile(userId)
    return profile.streaks[domainId]?.longestStreak || 0
  },

  /**
   * Unlock achievement
   * @param {string} userId
   * @param {string} achievementId
   * @returns {Object} Achievement unlock info
   */
  unlockAchievement(userId, achievementId) {
    const profile = this.getUserProfile(userId)
    const achievement = Object.values(this.ACHIEVEMENTS).find(a => a.id === achievementId)

    if (!achievement) {
      return null
    }

    if (profile.unlockedAchievements.find(a => a.id === achievementId)) {
      return null // Already unlocked
    }

    const unlocked = {
      id: achievementId,
      title: achievement.title,
      icon: achievement.icon,
      reward: achievement.reward,
      unlockedAt: new Date(),
      category: achievement.category
    }

    profile.unlockedAchievements.push(unlocked)

    // Award points for achievement
    this.addPoints(userId, achievement.reward, `解锁成就: ${achievement.title}`)

    this.saveProfile(userId, profile)

    return unlocked
  },

  /**
   * Check and unlock point-based achievements
   * @param {Object} profile
   */
  checkPointAchievements(profile) {
    // Check milestone achievements
    // These would be checked based on total profile stats
  },

  /**
   * Check and unlock streak-based achievements
   * @param {Object} profile
   */
  checkStreakAchievements(profile) {
    let maxStreak = 0
    Object.values(profile.streaks).forEach(streak => {
      if (streak.currentStreak > maxStreak) {
        maxStreak = streak.currentStreak
      }
    })

    // Check for 7-day streak
    if (maxStreak >= 7 && !profile.unlockedAchievements.find(a => a.id === 'seven_day_streak')) {
      this.unlockAchievement(profile.userId, 'seven_day_streak')
    }

    // Check for 30-day streak
    if (maxStreak >= 30 && !profile.unlockedAchievements.find(a => a.id === 'thirty_day_streak')) {
      this.unlockAchievement(profile.userId, 'thirty_day_streak')
    }
  },

  /**
   * Get all unlocked achievements
   * @param {string} userId
   * @returns {Array} Unlocked achievements
   */
  getUnlockedAchievements(userId) {
    const profile = this.getUserProfile(userId)
    return profile.unlockedAchievements
  },

  /**
   * Get achievement progress
   * @param {string} userId
   * @param {string} achievementId
   * @returns {Object} Progress info
   */
  getAchievementProgress(userId, achievementId) {
    const profile = this.getUserProfile(userId)
    const achievement = Object.values(this.ACHIEVEMENTS).find(a => a.id === achievementId)
    const unlocked = profile.unlockedAchievements.find(a => a.id === achievementId)

    if (!achievement) {
      return null
    }

    return {
      achievement,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt || null,
      progress: unlocked ? 100 : 0
    }
  },

  /**
   * Get daily challenge
   * @param {string} userId
   * @returns {Object} Daily challenge
   */
  getDailyChallenge(userId) {
    const challenges = [
      {
        id: 'daily_1',
        title: '答对5题',
        description: '在任何学科中正确回答5道问题',
        reward: 50,
        requirement: 5,
        type: 'correct_answers'
      },
      {
        id: 'daily_2',
        title: '完成一个学科',
        description: '完成任何学科的所有问题',
        reward: 100,
        requirement: 1,
        type: 'complete_domain'
      },
      {
        id: 'daily_3',
        title: '学习3个小时',
        description: '花费至少3小时进行学习',
        reward: 75,
        requirement: 180,
        type: 'study_minutes'
      },
      {
        id: 'daily_4',
        title: '获得100%准确率',
        description: '在一个域中获得完美准确率',
        reward: 100,
        requirement: 100,
        type: 'perfect_accuracy'
      }
    ]

    // Select pseudo-random challenge for today
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
    const challenge = challenges[dayOfYear % challenges.length]

    return {
      ...challenge,
      date: new Date().toLocaleDateString()
    }
  },

  /**
   * Complete daily challenge
   * @param {string} userId
   * @param {string} challengeId
   * @returns {Object} Reward info
   */
  completeDailyChallenge(userId, challengeId) {
    const challenge = this.getDailyChallenge(userId)

    if (challenge.id !== challengeId) {
      return null // Wrong challenge or expired
    }

    const reward = challenge.reward
    this.addPoints(userId, reward, `完成日常挑战: ${challenge.title}`)

    return {
      challengeId,
      reward,
      completedAt: new Date()
    }
  },

  /**
   * Get quest list
   * @param {string} userId
   * @returns {Array} Available quests
   */
  getAvailableQuests(userId) {
    return [
      {
        id: 'quest_1',
        title: '学科探索',
        description: '浏览5个不同学科的知识图',
        reward: 200,
        progress: 0,
        requirement: 5
      },
      {
        id: 'quest_2',
        title: '知识积累',
        description: '完成10个学科',
        reward: 500,
        progress: 0,
        requirement: 10
      },
      {
        id: 'quest_3',
        title: '完美学习',
        description: '在3个学科中各获得100%准确率',
        reward: 400,
        progress: 0,
        requirement: 3
      }
    ]
  },

  /**
   * Get user statistics for achievements
   * @param {string} userId
   * @param {Object} metrics - From analytics service
   * @returns {Object} Statistics
   */
  getAchievementStats(userId, metrics = {}) {
    const profile = this.getUserProfile(userId)

    return {
      totalPoints: profile.totalPoints,
      currentLevel: profile.currentLevel,
      levelName: this.getLevelInfo(profile.currentLevel).name,
      achievementCount: profile.unlockedAchievements.length,
      streakCount: Object.keys(profile.streaks).length,
      domainsCompleted: metrics.domainsCompleted || 0,
      totalHours: metrics.totalHours || 0,
      overallAccuracy: metrics.overallAccuracy || 0
    }
  },

  /**
   * Export profile for sharing
   * @param {string} userId
   * @returns {Object} Shareable profile
   */
  exportProfile(userId) {
    const profile = this.getUserProfile(userId)
    return {
      userId,
      totalPoints: profile.totalPoints,
      currentLevel: profile.currentLevel,
      levelName: this.getLevelInfo(profile.currentLevel).name,
      achievementCount: profile.unlockedAchievements.length,
      topAchievements: profile.unlockedAchievements.slice(0, 5),
      maxStreak: Math.max(...Object.values(profile.streaks).map(s => s.currentStreak || 0), 0),
      createdAt: profile.createdAt
    }
  }
}

export default gamificationService
