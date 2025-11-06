import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSalaryStore = defineStore('salary', () => {
  // State
  const salaryData = ref({})
  const isLoading = ref(false)
  const error = ref(null)

  // 示例数据 - 计算机科学与技术专业
  const sampleSalaryData = {
    '080901': {
      majorId: '080901',
      majorName: '计算机科学与技术',
      overall: {
        avgSalary: 25000,
        medianSalary: 23000,
        minSalary: 12000,
        maxSalary: 60000,
        salary25Percentile: 18000,
        salary75Percentile: 32000
      },
      byIndustry: [
        { industry: 'IT互联网', avg: 28000, median: 26000, count: 6800, growth: 8.5 },
        { industry: '金融科技', avg: 32000, median: 30000, count: 2300, growth: 5.2 },
        { industry: '电信运营', avg: 24000, median: 22000, count: 1800, growth: 2.1 },
        { industry: '制造业', avg: 20000, median: 19000, count: 1500, growth: -1.5 },
        { industry: '教育科技', avg: 22000, median: 21000, count: 1200, growth: 12.3 }
      ],
      byCity: [
        { city: '北京', avg: 28000, median: 26000, count: 3750, costOfLiving: 8000, netSalary: 20000, rank: 1 },
        { city: '上海', avg: 27000, median: 25000, count: 3300, costOfLiving: 8500, netSalary: 18500, rank: 2 },
        { city: '深圳', avg: 29000, median: 27000, count: 3000, costOfLiving: 7000, netSalary: 22000, rank: 3 },
        { city: '杭州', avg: 25000, median: 23000, count: 2100, costOfLiving: 5500, netSalary: 19500, rank: 4 },
        { city: '南京', avg: 22000, median: 20000, count: 1400, costOfLiving: 4000, netSalary: 18000, rank: 5 }
      ],
      bySeniority: [
        { level: '应届毕业', experience: 0, avgSalary: 15000, description: '刚入职' },
        { level: '初级工程师', experience: 2, avgSalary: 22000, description: '1-3年经验' },
        { level: '中级工程师', experience: 4, avgSalary: 28000, description: '3-5年经验' },
        { level: '高级工程师', experience: 6, avgSalary: 35000, description: '5-8年经验' },
        { level: '专家/总监', experience: 10, avgSalary: 45000, description: '8年+经验' }
      ],
      byDegree: [
        { degree: '本科', avgSalary: 22000, ratio: 60, count: 8500 },
        { degree: '硕士', avgSalary: 28000, ratio: 35, count: 5000 },
        { degree: '博士', avgSalary: 32000, ratio: 5, count: 500 }
      ],
      growthCurve: [
        { year: 0, avg: 15000, percentile25: 12000, percentile75: 17000 },
        { year: 1, avg: 18000, percentile25: 15000, percentile75: 21000 },
        { year: 2, avg: 21000, percentile25: 17000, percentile75: 25000 },
        { year: 3, avg: 23000, percentile25: 19000, percentile75: 27000 },
        { year: 5, avg: 28000, percentile25: 23000, percentile75: 32000 },
        { year: 8, avg: 35000, percentile25: 30000, percentile75: 40000 },
        { year: 10, avg: 42000, percentile25: 36000, percentile75: 48000 }
      ],
      comparison: {
        vsAllMajors: 1.2,
        vsEngineering: 1.15,
        vsChina: 1.8,
        ranking: '前15%'
      },
      salaryRange: [
        { range: '10K-15K', percent: 8, count: 1200 },
        { range: '15K-20K', percent: 18, count: 2700 },
        { range: '20K-25K', percent: 28, count: 4200 },
        { range: '25K-30K', percent: 22, count: 3300 },
        { range: '30K-40K', percent: 16, count: 2400 },
        { range: '40K+', percent: 8, count: 1200 }
      ]
    }
  }

  // Computed Properties
  const hasSalaryData = computed(() => Object.keys(salaryData.value).length > 0)
  const averageSalary = computed(() => salaryData.value.overall?.avgSalary || 0)
  const medianSalary = computed(() => salaryData.value.overall?.medianSalary || 0)
  const topIndustries = computed(() => {
    const industries = salaryData.value.byIndustry || []
    return industries.sort((a, b) => b.avg - a.avg)
  })
  const topCities = computed(() => {
    const cities = salaryData.value.byCity || []
    return cities.sort((a, b) => b.avg - a.avg)
  })

  // Actions
  function loadSalaryData(majorCode) {
    isLoading.value = true
    error.value = null
    setTimeout(() => {
      if (sampleSalaryData[majorCode]) {
        salaryData.value = sampleSalaryData[majorCode]
      } else {
        salaryData.value = generateSalaryData(majorCode)
      }
      isLoading.value = false
    }, 500)
  }

  function generateSalaryData(majorCode) {
    const baseAvg = 15000 + Math.random() * 20000
    return {
      majorId: majorCode,
      majorName: `专业 ${majorCode}`,
      overall: {
        avgSalary: Math.round(baseAvg),
        medianSalary: Math.round(baseAvg * 0.95),
        minSalary: Math.round(baseAvg * 0.4),
        maxSalary: Math.round(baseAvg * 2.5),
        salary25Percentile: Math.round(baseAvg * 0.65),
        salary75Percentile: Math.round(baseAvg * 1.35)
      }
    }
  }

  function resetSalaryData() {
    salaryData.value = {}
    error.value = null
  }

  return {
    salaryData,
    isLoading,
    error,
    hasSalaryData,
    averageSalary,
    medianSalary,
    topIndustries,
    topCities,
    loadSalaryData,
    generateSalaryData,
    resetSalaryData
  }
})
