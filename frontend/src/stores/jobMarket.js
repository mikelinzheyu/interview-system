import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useJobMarketStore = defineStore('jobMarket', () => {
  // State
  const jobMarketData = ref({})
  const isLoading = ref(false)
  const error = ref(null)

  // 示例数据 - 从API或JSON数据文件加载
  const sampleJobMarketData = {
    '080901': { // 计算机科学与技术
      majorId: '080901',
      majorName: '计算机科学与技术',
      // 招聘热度
      recruitmentHot: 9.5,
      totalOpenings: 152000,
      monthlyGrowth: 5.2,

      // 行业分布
      industryDistribution: [
        { industry: 'IT互联网', ratio: 45, companies: ['阿里', '腾讯', '字节', '美团', '小红书'] },
        { industry: '金融科技', ratio: 15, companies: ['华为', 'IBM', '甲骨文'] },
        { industry: '电信运营商', ratio: 12, companies: ['中国移动', '中国电信', '中国联通'] },
        { industry: '制造业', ratio: 10, companies: ['富士康', 'BYD'] },
        { industry: '其他', ratio: 18, companies: [] }
      ],

      // 地区分布
      cityDistribution: [
        { city: '北京', ratio: 25, salary: 28000, companies: 3500 },
        { city: '上海', ratio: 22, salary: 27000, companies: 3200 },
        { city: '深圳', ratio: 20, salary: 29000, companies: 2800 },
        { city: '杭州', ratio: 15, salary: 25000, companies: 2100 },
        { city: '南京', ratio: 10, salary: 22000, companies: 1400 },
        { city: '其他城市', ratio: 8, salary: 20000, companies: 1100 }
      ],

      // 岗位分布
      jobCategories: [
        { category: '后端开发', count: 65000, avgSalary: 26000, description: '服务器端开发' },
        { category: '前端开发', count: 45000, avgSalary: 24000, description: 'Web/移动前端' },
        { category: '移动开发', count: 25000, avgSalary: 23000, description: 'iOS/Android开发' },
        { category: 'DevOps/运维', count: 12000, avgSalary: 28000, description: '基础设施运维' },
        { category: '大数据', count: 8000, avgSalary: 30000, description: '数据处理分析' },
        { category: '人工智能/机器学习', count: 6000, avgSalary: 35000, description: 'AI算法' },
        { category: '产品经理', count: 4000, avgSalary: 27000, description: '产品策划' }
      ],

      // 经验要求分布
      experienceRequirement: [
        { years: '应届毕业', ratio: 20, avgSalary: 15000, description: '无经验要求' },
        { years: '1-3年', ratio: 35, avgSalary: 22000, description: '初级开发' },
        { years: '3-5年', ratio: 30, avgSalary: 28000, description: '中级开发' },
        { years: '5年以上', ratio: 15, avgSalary: 35000, description: '高级/专家' }
      ],

      // 市场趋势
      trends: {
        sixMonthGrowth: 12.5,
        yearGrowth: 18.3,
        forecast2025: 220000,
        competitiveIndex: 7.2,
        demandOutlook: '持续高增长',
        salaryTrend: '稳定增长'
      },

      // 主流技术栈
      popularTechnologies: [
        { name: 'Java', usage: 28, trend: '稳定' },
        { name: 'Python', usage: 22, trend: '上升' },
        { name: 'JavaScript', usage: 18, trend: '稳定' },
        { name: 'C++', usage: 12, trend: '下降' },
        { name: 'Go', usage: 10, trend: '上升' },
        { name: 'Rust', usage: 5, trend: '上升' },
        { name: '其他', usage: 5, trend: '稳定' }
      ],

      // 热门公司排名
      topCompanies: [
        { rank: 1, name: '阿里巴巴', openings: 8500, avgSalary: 32000, rating: 4.5 },
        { rank: 2, name: '腾讯', openings: 7200, avgSalary: 33000, rating: 4.6 },
        { rank: 3, name: '字节跳动', openings: 6800, avgSalary: 34000, rating: 4.4 },
        { rank: 4, name: '美团', openings: 5200, avgSalary: 30000, rating: 4.3 },
        { rank: 5, name: '华为', openings: 4500, avgSalary: 31000, rating: 4.2 }
      ],

      // 核心技能需求
      requiredSkills: [
        { skill: '数据结构与算法', importance: 95, trend: '必需' },
        { skill: '系统设计', importance: 85, trend: '重要' },
        { skill: '数据库设计', importance: 80, trend: '重要' },
        { skill: '网络编程', importance: 70, trend: '重要' },
        { skill: 'Web框架', importance: 75, trend: '重要' },
        { skill: '云计算', importance: 65, trend: '上升' },
        { skill: '容器化(Docker)', importance: 70, trend: '上升' },
        { skill: '微服务', importance: 60, trend: '上升' }
      ],

      // 薪资阶梯
      salaryLadder: [
        { level: '应届毕业', years: '0年', salary: 15000, title: '初级工程师' },
        { level: 'P4', years: '1-3年', salary: 22000, title: '高级工程师' },
        { level: 'P5', years: '3-5年', salary: 28000, title: '资深工程师' },
        { level: 'P6', years: '5-8年', salary: 35000, title: '技术专家' },
        { level: 'P7', years: '8年+', salary: 45000, title: '架构师/总监' }
      ]
    }
  }

  // Computed Properties
  const hasJobMarketData = computed(() => Object.keys(jobMarketData.value).length > 0)

  const topIndustries = computed(() => {
    if (!jobMarketData.value.industryDistribution) return []
    return jobMarketData.value.industryDistribution
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3)
  })

  const topCities = computed(() => {
    if (!jobMarketData.value.cityDistribution) return []
    return jobMarketData.value.cityDistribution
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 5)
  })

  const totalJobOpenings = computed(() => jobMarketData.value.totalOpenings || 0)

  const averageSalary = computed(() => {
    if (!jobMarketData.value.cityDistribution) return 0
    const total = jobMarketData.value.cityDistribution.reduce((sum, city) => {
      return sum + (city.salary * city.ratio / 100)
    }, 0)
    return Math.round(total)
  })

  const competitiveIndex = computed(() => jobMarketData.value.trends?.competitiveIndex || 0)

  // Actions
  function loadJobMarketData(majorCode) {
    isLoading.value = true
    error.value = null

    try {
      // 模拟API调用延迟
      setTimeout(() => {
        if (sampleJobMarketData[majorCode]) {
          jobMarketData.value = sampleJobMarketData[majorCode]
        } else {
          // 为其他专业生成动态数据
          jobMarketData.value = generateJobMarketData(majorCode)
        }
        isLoading.value = false
      }, 500)
    } catch (err) {
      error.value = err.message
      isLoading.value = false
    }
  }

  function generateJobMarketData(majorCode) {
    // 为演示目的生成随机就业数据
    const baseOpenings = Math.floor(50000 + Math.random() * 150000)
    return {
      majorId: majorCode,
      majorName: `专业 ${majorCode}`,
      recruitmentHot: (5 + Math.random() * 4.5).toFixed(1),
      totalOpenings: baseOpenings,
      monthlyGrowth: (2 + Math.random() * 8).toFixed(1),
      industryDistribution: [
        { industry: '行业1', ratio: 40, companies: [] },
        { industry: '行业2', ratio: 30, companies: [] },
        { industry: '行业3', ratio: 20, companies: [] },
        { industry: '其他', ratio: 10, companies: [] }
      ],
      cityDistribution: [
        { city: '北京', ratio: 25, salary: 25000, companies: 3000 },
        { city: '上海', ratio: 20, salary: 24000, companies: 2500 },
        { city: '深圳', ratio: 18, salary: 26000, companies: 2000 },
        { city: '杭州', ratio: 18, salary: 22000, companies: 1500 },
        { city: '其他', ratio: 19, salary: 18000, companies: 1000 }
      ],
      jobCategories: [
        { category: '岗位1', count: baseOpenings * 0.4, avgSalary: 24000, description: '描述' },
        { category: '岗位2', count: baseOpenings * 0.3, avgSalary: 22000, description: '描述' },
        { category: '岗位3', count: baseOpenings * 0.3, avgSalary: 20000, description: '描述' }
      ],
      trends: {
        sixMonthGrowth: (5 + Math.random() * 20).toFixed(1),
        yearGrowth: (10 + Math.random() * 25).toFixed(1),
        forecast2025: baseOpenings * 1.2,
        competitiveIndex: (3 + Math.random() * 6).toFixed(1),
        demandOutlook: '持续增长',
        salaryTrend: '稳定增长'
      }
    }
  }

  function getJobCategoryStats() {
    if (!jobMarketData.value.jobCategories) return []
    return jobMarketData.value.jobCategories.sort((a, b) => b.count - a.count)
  }

  function getCityRanking() {
    if (!jobMarketData.value.cityDistribution) return []
    return jobMarketData.value.cityDistribution.sort((a, b) => b.salary - a.salary)
  }

  function getTrendAnalysis() {
    return jobMarketData.value.trends || {}
  }

  function getPopularTechnologies() {
    return jobMarketData.value.popularTechnologies || []
  }

  function getTopCompanies() {
    return jobMarketData.value.topCompanies || []
  }

  function getRequiredSkills() {
    return jobMarketData.value.requiredSkills || []
  }

  function getSalaryLadder() {
    return jobMarketData.value.salaryLadder || []
  }

  function resetJobMarketData() {
    jobMarketData.value = {}
    error.value = null
  }

  return {
    // State
    jobMarketData,
    isLoading,
    error,

    // Computed
    hasJobMarketData,
    topIndustries,
    topCities,
    totalJobOpenings,
    averageSalary,
    competitiveIndex,

    // Actions
    loadJobMarketData,
    generateJobMarketData,
    getJobCategoryStats,
    getCityRanking,
    getTrendAnalysis,
    getPopularTechnologies,
    getTopCompanies,
    getRequiredSkills,
    getSalaryLadder,
    resetJobMarketData
  }
})
