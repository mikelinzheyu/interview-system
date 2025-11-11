/**
 * useReputation - 用户声誉系统
 *
 * 功能：
 * - 获取用户等级和积分
 * - 获取用户徽章
 * - 升级提醒
 * - 声誉排行榜
 * - 积分规则说明
 */

import { ref, computed } from 'vue'
import communityAPI from '@/api/communityWithCache'

export function useReputation(userId) {
  // 声誉数据
  const reputation = ref(null)
  const badges = ref([])
  const achievements = ref([])
  const leaderboard = ref([])
  const nextLevelProgress = ref(0)

  // 加载状态
  const loading = ref(false)
  const error = ref(null)

  /**
   * 获取用户声誉信息
   */
  const fetchReputation = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.getUserReputation(userId)

      if (response.data) {
        reputation.value = {
          level: response.data.level || 1,
          score: response.data.score || 0,
          totalScore: response.data.totalScore || 0,
          rank: response.data.rank || 0
        }

        // 计算升级进度
        const currentLevelScore = reputation.value.level * 100
        const nextLevelScore = (reputation.value.level + 1) * 100
        nextLevelProgress.value = Math.min(
          100,
          Math.floor(
            ((reputation.value.score - currentLevelScore) /
              (nextLevelScore - currentLevelScore)) *
            100
          )
        )
      }
    } catch (err) {
      error.value = err.message || '获取声誉信息失败'
      console.error('Failed to fetch reputation:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取用户徽章
   */
  const fetchBadges = async () => {
    try {
      const response = await communityAPI.getUserBadges(userId)

      if (response.data) {
        badges.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch badges:', err)
    }
  }

  /**
   * 获取成就列表
   */
  const fetchAchievements = async () => {
    try {
      const response = await communityAPI.getUserAchievements(userId)

      if (response.data) {
        achievements.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err)
    }
  }

  /**
   * 获取声誉排行榜
   */
  const fetchLeaderboard = async (period = 'month', limit = 10) => {
    try {
      const response = await communityAPI.getReputationLeaderboard({
        period,  // day, week, month, all
        limit
      })

      if (response.data) {
        leaderboard.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    }
  }

  /**
   * 初始化：获取所有声誉相关数据
   */
  const initialize = async () => {
    await Promise.all([
      fetchReputation(),
      fetchBadges(),
      fetchAchievements(),
      fetchLeaderboard('month')
    ])
  }

  /**
   * 刷新声誉数据
   */
  const refresh = async () => {
    await fetchReputation()
  }

  /**
   * 计算属性：等级信息文本
   */
  const levelText = computed(() => {
    const levels = {
      1: '新手',
      2: '初级',
      3: '中级',
      4: '高级',
      5: '专家',
      6: '名人',
      7: '大师',
      8: '传奇',
      9: '神级',
      10: '传说'
    }
    return levels[reputation.value?.level || 1] || '新手'
  })

  /**
   * 计算属性：当前等级边界
   */
  const levelBounds = computed(() => {
    if (!reputation.value) return { min: 0, max: 100 }

    const currentLevel = reputation.value.level
    const min = currentLevel * 100
    const max = (currentLevel + 1) * 100

    return { min, max }
  })

  /**
   * 计算属性：下一等级需要的积分
   */
  const scoreToNextLevel = computed(() => {
    if (!reputation.value) return 0

    const max = (reputation.value.level + 1) * 100
    const current = reputation.value.score

    return Math.max(0, max - current)
  })

  /**
   * 计算属性：徽章分组
   */
  const badgesByCategory = computed(() => {
    const grouped = {}

    badges.value.forEach(badge => {
      const category = badge.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(badge)
    })

    return grouped
  })

  /**
   * 获取等级对应的颜色
   */
  const getLevelColor = () => {
    const colors = {
      1: '#95DE64',  // 绿色
      2: '#1890FF',  // 蓝色
      3: '#13C2C2',  // 青色
      4: '#FAAD14',  // 橙色
      5: '#F5222D',  // 红色
      6: '#722ED1',  // 紫色
      7: '#EB2F96',  // 粉色
      8: '#FA8C16',  // 深橙
      9: '#52C41A',  // 深绿
      10: '#FFD700'   // 金色
    }
    return colors[reputation.value?.level || 1] || '#95DE64'
  }

  /**
   * 获取等级对应的图标
   */
  const getLevelIcon = () => {
    const icons = {
      1: '👤',
      2: '⭐',
      3: '⭐⭐',
      4: '⭐⭐⭐',
      5: '🌟',
      6: '💎',
      7: '👑',
      8: '🏆',
      9: '🚀',
      10: '✨'
    }
    return icons[reputation.value?.level || 1] || '👤'
  }

  return {
    // 数据
    reputation,
    badges,
    achievements,
    leaderboard,
    nextLevelProgress,
    loading,
    error,

    // 计算属性
    levelText,
    levelBounds,
    scoreToNextLevel,
    badgesByCategory,

    // 方法
    fetchReputation,
    fetchBadges,
    fetchAchievements,
    fetchLeaderboard,
    initialize,
    refresh,
    getLevelColor,
    getLevelIcon
  }
}
