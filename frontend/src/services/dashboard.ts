import axios from 'axios'

// 创建 API 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

/**
 * 仪表板服务
 * 处理所有与仪表板相关的 API 调用
 */
export const dashboardService = {
  /**
   * 获取统计数据
   * @returns 包含面试次数、练习时长、平均分、排名等数据
   */
  getStats: async () => {
    try {
      const response = await api.get('/statistics/dashboard')
      return response.data?.data || {
        interviewCount: 0,
        practiceTime: 0,
        averageScore: 0,
        rank: 0
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // 返回示例数据作为回退
      return generateSampleStats()
    }
  },

  /**
   * 获取面试历史记录
   * @returns 面试历史列表
   */
  getInterviewHistory: async () => {
    try {
      const response = await api.get('/interview/history')
      return response.data?.data || []
    } catch (error) {
      console.error('Failed to fetch interview history:', error)
      return generateSampleHistory()
    }
  },

  /**
   * 获取最近活动
   * @returns 活动列表
   */
  getActivities: async () => {
    try {
      const response = await api.get('/activity/recent')
      return response.data?.data || []
    } catch (error) {
      console.error('Failed to fetch activities:', error)
      return generateSampleActivities()
    }
  },

  /**
   * 获取错题列表
   * @returns 错题列表
   */
  getWrongAnswers: async () => {
    try {
      const response = await api.get('/wrong-answers')
      return response.data?.data || []
    } catch (error) {
      console.error('Failed to fetch wrong answers:', error)
      return generateSampleWrongAnswers()
    }
  },

  /**
   * 获取学习进度图表数据
   * @returns 7 天的学习进度数据
   */
  getChartData: async () => {
    try {
      const response = await api.get('/statistics/progress?days=7')
      return response.data?.data || []
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
      return generateSampleChartData()
    }
  },

  /**
   * 获取技能分布数据
   * @returns 各技能领域的分布数据
   */
  getSkillDistribution: async () => {
    try {
      const response = await api.get('/ability/skills')
      return response.data?.data || []
    } catch (error) {
      console.error('Failed to fetch skill distribution:', error)
      return generateSampleSkillDistribution()
    }
  },

  /**
   * 获取用户概览数据
   * @returns 包含所有仪表板信息的完整对象
   */
  getDashboardOverview: async () => {
    try {
      const response = await api.get('/dashboard/overview')
      return response.data?.data || {}
    } catch (error) {
      console.error('Failed to fetch dashboard overview:', error)
      return {}
    }
  },

  /**
   * 切换收藏状态
   * @param interviewId 面试 ID
   * @returns 更新后的状态
   */
  toggleFavorite: async (interviewId: number) => {
    try {
      const response = await api.post(`/interview/${interviewId}/favorite`)
      return response.data?.data
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      throw error
    }
  },

  /**
   * 获取详细的面试信息
   * @param interviewId 面试 ID
   * @returns 面试详情
   */
  getInterviewDetail: async (interviewId: number) => {
    try {
      const response = await api.get(`/interview/${interviewId}`)
      return response.data?.data
    } catch (error) {
      console.error('Failed to fetch interview detail:', error)
      throw error
    }
  }
}

// ========== 示例数据生成函数 (用于开发和回退) ==========

/**
 * 生成示例统计数据
 */
function generateSampleStats() {
  return [
    { id: '1', label: '模拟面试', value: 12, unit: '次', trend: 12, color: '#0071e3' },
    { id: '2', label: '练习时长', value: 8.5, unit: '小时', trend: 8, color: '#67c23a' },
    { id: '3', label: '平均分', value: 86, unit: '分', trend: 5, color: '#e6a23c' },
    { id: '4', label: '全球排名', value: '#421', trend: -2, color: '#f56c6c' }
  ]
}

/**
 * 生成示例面试历史
 */
function generateSampleHistory() {
  return [
    {
      id: 1,
      topic: 'React Hooks & Performance',
      date: '2025-09-25',
      duration: '15 分钟',
      score: 92,
      status: '已完成',
      isFavorite: true
    },
    {
      id: 2,
      topic: 'System Design: URL Shortener',
      date: '2025-09-24',
      duration: '20 分钟',
      score: 88,
      status: '已完成',
      isFavorite: false
    },
    {
      id: 3,
      topic: 'JavaScript Event Loop',
      date: '2025-09-22',
      duration: '10 分钟',
      score: 75,
      status: '需复习',
      isFavorite: false
    }
  ]
}

/**
 * 生成示例活动数据
 */
function generateSampleActivities() {
  return [
    { id: 1, title: '完成模拟面试：系统设计', time: '2 小时前', type: 'interview', score: '92/100' },
    { id: 2, title: '学习：高级 CSS Grid', time: '5 小时前', type: 'study', score: '+15 XP' },
    { id: 3, title: '更新个人资料：添加 TypeScript', time: '1 天前', type: 'profile', score: '' }
  ]
}

/**
 * 生成示例错题数据
 */
function generateSampleWrongAnswers() {
  return [
    'React useEffect 依赖项',
    'Java HashMap 内部原理',
    'SQL 索引'
  ]
}

/**
 * 生成示例图表数据
 */
function generateSampleChartData() {
  return [
    { name: '周一', value: 40, avg: 30 },
    { name: '周二', value: 65, avg: 45 },
    { name: '周三', value: 50, avg: 55 },
    { name: '周四', value: 85, avg: 50 },
    { name: '周五', value: 60, avg: 65 },
    { name: '周六', value: 90, avg: 70 },
    { name: '周日', value: 75, avg: 60 }
  ]
}

/**
 * 生成示例技能分布数据
 */
function generateSampleSkillDistribution() {
  return [
    { name: 'Java', value: 85 },
    { name: '系统设计', value: 65 },
    { name: '算法', value: 90 },
    { name: '前端技术', value: 45 },
    { name: '数据库', value: 70 }
  ]
}

export default api
