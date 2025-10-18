/**
 * 游戏化系统 Store (积分、徽章、等级)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGamificationStore = defineStore('gamification', () => {
  // 用户积分数据
  const userPoints = ref({
    total: 0,
    available: 0,
    used: 0,
    level: 1,
    levelName: '见习者',
    nextLevelPoints: 100,
    progress: 0
  })

  // 徽章列表
  const badges = ref([])
  const userBadges = ref([])

  // 等级配置
  const levelConfig = [
    { level: 1, name: '见习者', minPoints: 0, maxPoints: 99, color: '#909399' },
    { level: 2, name: '助理', minPoints: 100, maxPoints: 299, color: '#67c23a' },
    { level: 3, name: '专家', minPoints: 300, maxPoints: 699, color: '#409eff' },
    { level: 4, name: '资深专家', minPoints: 700, maxPoints: 1499, color: '#e6a23c' },
    { level: 5, name: '大师', minPoints: 1500, maxPoints: 2999, color: '#f56c6c' },
    { level: 6, name: '宗师', minPoints: 3000, maxPoints: 9999, color: '#9b59b6' },
    { level: 7, name: '传奇', minPoints: 10000, maxPoints: Infinity, color: '#ff6b6b' }
  ]

  // 积分任务配置
  const pointsConfig = {
    SUBMIT_QUESTION: 10,        // 提交题目
    QUESTION_APPROVED: 20,      // 题目通过审核
    POST_DISCUSSION: 5,         // 发布讨论
    REPLY_DISCUSSION: 3,        // 回复讨论
    RECEIVE_LIKE: 2,            // 收到点赞
    DAILY_SIGNIN: 5,            // 每日签到
    FIRST_SUBMISSION: 50,       // 首次提交
    HELP_REVIEW: 8,             // 参与审核
    BOUNTY_SOLVED: 'dynamic'    // 解决悬赏（动态积分）
  }

  // 徽章配置
  const badgeConfig = [
    {
      id: 'first_contribution',
      name: '首次贡献',
      description: '提交第一个题目',
      icon: '🎉',
      color: '#67c23a',
      condition: 'submissions >= 1'
    },
    {
      id: 'prolific_contributor',
      name: '多产贡献者',
      description: '提交 10 个题目',
      icon: '✍️',
      color: '#409eff',
      condition: 'submissions >= 10'
    },
    {
      id: 'quality_master',
      name: '质量大师',
      description: '通过率达到 90%',
      icon: '⭐',
      color: '#f56c6c',
      condition: 'approvalRate >= 0.9'
    },
    {
      id: 'discussion_king',
      name: '讨论之王',
      description: '发布 50 条讨论',
      icon: '💬',
      color: '#e6a23c',
      condition: 'discussions >= 50'
    },
    {
      id: 'helpful_reviewer',
      name: '热心审核员',
      description: '完成 20 次审核',
      icon: '👍',
      color: '#9b59b6',
      condition: 'reviews >= 20'
    },
    {
      id: 'popular_author',
      name: '人气作者',
      description: '题目获得 100 次收藏',
      icon: '🌟',
      color: '#ff6b6b',
      condition: 'totalFavorites >= 100'
    },
    {
      id: 'early_bird',
      name: '早起鸟',
      description: '连续签到 7 天',
      icon: '🐦',
      color: '#67c23a',
      condition: 'consecutiveSignIn >= 7'
    },
    {
      id: 'bounty_hunter',
      name: '赏金猎人',
      description: '解决 5 个悬赏题目',
      icon: '💰',
      color: '#e6a23c',
      condition: 'bountySolved >= 5'
    }
  ]

  // 当前等级信息
  const currentLevelInfo = computed(() => {
    const level = levelConfig.find(l =>
      userPoints.value.total >= l.minPoints &&
      userPoints.value.total <= l.maxPoints
    )
    return level || levelConfig[0]
  })

  // 下一等级信息
  const nextLevelInfo = computed(() => {
    const currentLevel = currentLevelInfo.value.level
    return levelConfig.find(l => l.level === currentLevel + 1)
  })

  // 升级进度
  const levelProgress = computed(() => {
    const current = currentLevelInfo.value
    const total = userPoints.value.total
    const range = current.maxPoints - current.minPoints + 1
    const progress = total - current.minPoints
    return Math.min(100, (progress / range) * 100)
  })

  /**
   * 加载用户积分数据
   */
  const fetchUserPoints = async () => {
    try {
      // 模拟数据
      const mockData = {
        total: 256,
        available: 256,
        used: 0,
        level: 2,
        levelName: '助理',
        nextLevelPoints: 300,
        progress: 52
      }

      userPoints.value = mockData

      // 实际应该调用 API
      // const response = await api.get('/gamification/points')
      // userPoints.value = response.data
    } catch (error) {
      console.error('加载积分数据失败:', error)
    }
  }

  /**
   * 加载用户徽章
   */
  const fetchUserBadges = async () => {
    try {
      // 模拟数据
      const mockBadges = [
        {
          id: 'first_contribution',
          name: '首次贡献',
          description: '提交第一个题目',
          icon: '🎉',
          color: '#67c23a',
          earnedAt: '2024-01-15'
        },
        {
          id: 'early_bird',
          name: '早起鸟',
          description: '连续签到 7 天',
          icon: '🐦',
          color: '#67c23a',
          earnedAt: '2024-02-01'
        }
      ]

      userBadges.value = mockBadges

      // 实际应该调用 API
      // const response = await api.get('/gamification/badges')
      // userBadges.value = response.data
    } catch (error) {
      console.error('加载徽章失败:', error)
    }
  }

  /**
   * 加载所有可获得的徽章
   */
  const fetchAllBadges = async () => {
    badges.value = badgeConfig
  }

  /**
   * 获得积分
   */
  const earnPoints = async (action, amount) => {
    const points = amount || pointsConfig[action] || 0
    if (typeof points === 'number') {
      userPoints.value.total += points
      userPoints.value.available += points

      // 检查是否升级
      checkLevelUp()

      // 实际应该调用 API
      // await api.post('/gamification/points/earn', { action, amount: points })
    }
  }

  /**
   * 消费积分
   */
  const spendPoints = async (amount, reason) => {
    void reason // placeholder until API wiring is implemented
    if (userPoints.value.available >= amount) {
      userPoints.value.available -= amount
      userPoints.value.used += amount

      // 实际应该调用 API
      // await api.post('/gamification/points/spend', { amount, reason })

      return true
    }
    return false
  }

  /**
   * 检查是否升级
   */
  const checkLevelUp = () => {
    const newLevel = levelConfig.find(l =>
      userPoints.value.total >= l.minPoints &&
      userPoints.value.total <= l.maxPoints
    )

    if (newLevel && newLevel.level > userPoints.value.level) {
      userPoints.value.level = newLevel.level
      userPoints.value.levelName = newLevel.name

      // 触发升级事件
      return {
        upgraded: true,
        newLevel: newLevel
      }
    }

    return { upgraded: false }
  }

  /**
   * 检查是否获得新徽章
   */
  const checkBadgeUnlock = (userStats) => {
    const newBadges = []

    badgeConfig.forEach(badge => {
      const alreadyEarned = userBadges.value.some(ub => ub.id === badge.id)
      if (!alreadyEarned) {
        // 简单的条件检查（实际应该更复杂）
        const unlocked = evaluateCondition(badge.condition, userStats)
        if (unlocked) {
          newBadges.push(badge)
          userBadges.value.push({
            ...badge,
            earnedAt: new Date().toISOString()
          })
        }
      }
    })

    return newBadges
  }

  /**
   * 评估徽章解锁条件
   */
  const evaluateCondition = (condition, stats) => {
    try {
      // 简单的条件解析（实际应该使用更安全的方式）
      const func = new Function('stats', `with(stats) { return ${condition} }`)
      return func(stats)
    } catch (error) {
      console.error('条件解析失败:', error)
      return false
    }
  }

  /**
   * 每日签到
   */
  const dailySignIn = async () => {
    try {
      // 调用 API
      // const response = await api.post('/gamification/signin')

      // 模拟签到成功
      await earnPoints('DAILY_SIGNIN')

      return {
        success: true,
        points: pointsConfig.DAILY_SIGNIN,
        consecutiveDays: 3
      }
    } catch (error) {
      console.error('签到失败:', error)
      return { success: false }
    }
  }

  return {
    userPoints,
    badges,
    userBadges,
    levelConfig,
    pointsConfig,
    badgeConfig,
    currentLevelInfo,
    nextLevelInfo,
    levelProgress,
    fetchUserPoints,
    fetchUserBadges,
    fetchAllBadges,
    earnPoints,
    spendPoints,
    checkLevelUp,
    checkBadgeUnlock,
    dailySignIn
  }
})
