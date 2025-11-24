import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import mockDomains from '@/data/mock-domains.json'
import mockDomainsHierarchical from '@/data/mock-domains-hierarchical.json'
import recommendationService from '@/services/recommendationService'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false'
const FALLBACK_RECOMMENDED_COUNT = 6
const FALLBACK_PROGRESS = Object.freeze({ completion: 0, easy: 0, medium: 0, hard: 0, total: 0 })

function normalizeDomainList(payload) {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (Array.isArray(payload.domains)) {
    return payload.domains
  }

  return []
}

function clampPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function normalizeProgress(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...FALLBACK_PROGRESS }
  }

  const easy = Number(raw.easy ?? raw.easyCount ?? 0)
  const medium = Number(raw.medium ?? raw.mediumCount ?? 0)
  const hard = Number(raw.hard ?? raw.hardCount ?? 0)
  const total = Number(raw.total ?? raw.totalCount ?? easy + medium + hard)
  const completion = clampPercent(raw.completion ?? raw.percent ?? raw.percentage ?? 0)

  return {
    completion,
    easy,
    medium,
    hard,
    total
  }
}

function slugify(value, fallbackPrefix = 'domain') {
  const source = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  const slug = source.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (slug) {
    return slug
  }

  const random = Math.random().toString(36).slice(2, 8)
  return `${fallbackPrefix}-${random}`
}

function ensureDomainModel(input) {
  if (!input || typeof input !== 'object') {
    return null
  }

  const stats = input.stats || {}
  const easy = Number(stats.easy ?? stats.easyCount ?? 0)
  const medium = Number(stats.medium ?? stats.mediumCount ?? 0)
  const hard = Number(stats.hard ?? stats.hardCount ?? 0)
  const total = Number(
    stats.total ??
      stats.totalCount ??
      input.questionCount ??
      easy + medium + hard
  )

  const normalizedStats = {
    easy,
    medium,
    hard,
    total
  }

  const inferredTags = Array.isArray(input.tags)
    ? input.tags
    : typeof input.tags === 'string'
      ? input.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : []

  const icon = input.icon || input.emoji || '🎓'
  const slug = input.slug || slugify(input.name || input.id)
  const description =
    input.description ||
    input.descText ||
    input.summary ||
    `系统学习${input.name || '该领域'}的核心知识点。`

  const shortDescription = input.shortDescription || input.subtitle || description

  const questionCount = Number(
    input.questionCount ??
      normalizedStats.total ??
      0
  )

  const categoryCount = Number(
    input.categoryCount ??
      (Array.isArray(input.children) ? input.children.length : 0)
  )

  return {
    ...input,
    slug,
    icon,
    description,
    shortDescription,
    questionCount,
    categoryCount,
    stats: normalizedStats,
    tags: inferredTags,
    isRecommended: Boolean(
      input.isRecommended ||
        input.featured ||
        inferredTags.some(tag => tag.toLowerCase() === 'recommended' || tag === '推荐')
    ),
    recommendedScore: Number(input.recommendedScore ?? 0)
  }
}

function createDomainFromCategory(category) {
  const base = ensureDomainModel({
    id: category.id,
    name: category.name,
    description: category.descText,
    shortDescription: category.descText,
    icon: category.icon,
    questionCount: category.questionCount,
    categoryCount: Array.isArray(category.children) ? category.children.length : 0,
    tags: category.tags,
    stats: category.stats
  })

  if (!base) {
    return null
  }

  return {
    ...base,
    source: 'category'
  }
}

function ensureDomainCollection(domains) {
  return (domains || [])
    .map(ensureDomainModel)
    .filter(Boolean)
}

function deriveRecommended(domains) {
  if (!Array.isArray(domains) || !domains.length) {
    return []
  }

  return [...domains]
    .sort((a, b) => {
      const scoreA = Number(a.recommendedScore || 0)
      const scoreB = Number(b.recommendedScore || 0)
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }

      const countA = Number(a.questionCount || 0)
      const countB = Number(b.questionCount || 0)
      return countB - countA
    })
    .slice(0, FALLBACK_RECOMMENDED_COUNT)
}

function fallbackProgressFromDomain(domain) {
  if (!domain || typeof domain !== 'object') {
    return null
  }

  const stats = domain.stats || {}
  const easy = Number(stats.easy ?? stats.easyCount ?? 0)
  const medium = Number(stats.medium ?? stats.mediumCount ?? 0)
  const hard = Number(stats.hard ?? stats.hardCount ?? 0)
  const total = Number(domain.questionCount ?? stats.total ?? stats.totalCount ?? easy + medium + hard)

  if (!total && !easy && !medium && !hard) {
    return null
  }

  const completion = total ? Math.min(100, Math.round(((easy + medium + hard) / total) * 100)) : 0

  return {
    completion,
    easy,
    medium,
    hard,
    total: total || easy + medium + hard
  }
}

function fallbackDomainsFromMock() {
  return ensureDomainCollection(mockDomains)
}

async function loadDomainsFromCategories() {
  try {
    const response = await api.get('/categories', {
      params: { type: 'domain' }
    })
    const payload = response.data || response
    const categories = normalizeDomainList(payload)
    const mapped = categories.map(createDomainFromCategory).filter(Boolean)
    if (mapped.length) {
      return mapped
    }
  } catch (err) {
    console.warn('Failed to transform categories to domains:', err)
  }

  return fallbackDomainsFromMock()
}

export const useDomainStore = defineStore('domain', () => {
  const loading = ref(false)
  const error = ref(null)

  const domains = ref([])
  const currentDomain = ref(null)
  const fieldConfigs = ref({})

  const recommendedSource = ref([])
  const recommendedLoading = ref(false)
  const recommendedError = ref(null)

  const userProgress = ref(null)
  const progressCache = ref({})
  const progressLoading = ref(false)
  const progressError = ref(null)

  // P1新增：层级树状数据
  const hierarchicalDomains = ref([])
  const expandedNodes = ref(new Set())
  const viewMode = ref('flat') // 'flat' | 'tree'

  // P2新增：推荐引擎相关状态
  const recommendations = ref([])
  const recommendationsLoading = ref(false)
  const recommendationsError = ref(null)

  const userProfile = ref(null)
  const userProfileLoading = ref(false)

  const similarDomains = ref({})
  const collectionItems = ref([])

  // 智能过滤器状态
  const filterOptions = reactive({
    difficulty: [], // ['beginner', 'intermediate', 'advanced']
    timeInvestment: [], // ['1-3h', '5-10h', '15+h']
    popularity: 'all', // 'all' | 'trending' | 'top-rated'
    sortBy: 'recommendation' // 'recommendation' | 'popularity' | 'difficulty' | 'time-required'
  })

  async function loadDomains(options = {}) {
    loading.value = true
    error.value = null

    try {
      if (USE_MOCK) {
        const fallback = fallbackDomainsFromMock()
        domains.value = fallback
        if (options.selectFirst !== false && !currentDomain.value && fallback.length) {
          currentDomain.value = fallback[0]
        }
        return domains.value
      }

      const response = await api.get('/domains')
      const payload = response.data || {}
      const list = ensureDomainCollection(normalizeDomainList(payload))

      if (!list.length) {
        throw new Error('EMPTY_DOMAIN_RESULT')
      }

      domains.value = list
    } catch (primaryError) {
      console.warn('Primary domain endpoint failed, trying fallback:', primaryError)
      const fallback = await loadDomainsFromCategories()

      if (fallback.length) {
        domains.value = fallback
        error.value = null
      } else {
        error.value = primaryError
        ElMessage.error('领域列表加载失败')
        throw primaryError
      }
    } finally {
      loading.value = false
    }

    if (options.selectFirst !== false && !currentDomain.value && domains.value.length) {
      currentDomain.value = domains.value[0]
    }

    return domains.value
  }

  async function loadDomainDetail(idOrSlug) {
    loading.value = true
    error.value = null

    try {
      if (USE_MOCK) {
        const fallback = fallbackDomainsFromMock().find(domain => domain.slug === idOrSlug || domain.id === idOrSlug)
        if (fallback) {
          currentDomain.value = fallback
          return fallback
        }
      }

      const response = await api.get(`/domains/${idOrSlug}`)
      const payload = response.data || {}
      const normalized = ensureDomainModel(payload) || fallbackDomainsFromMock().find(domain => domain.slug === idOrSlug || domain.id === idOrSlug)

      if (!normalized) {
        throw new Error('DOMAIN_NOT_FOUND')
      }

      currentDomain.value = normalized
      return normalized
    } catch (err) {
      error.value = err
      console.error('Failed to load domain detail:', err)
      ElMessage.error('领域详情加载失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadFieldConfig(domainId) {
    if (USE_MOCK) {
      fieldConfigs.value[domainId] = fieldConfigs.value[domainId] || { fields: [] }
      return fieldConfigs.value[domainId]
    }

    if (fieldConfigs.value[domainId]) {
      return fieldConfigs.value[domainId]
    }

    try {
      const response = await api.get(`/domains/${domainId}/field-config`)
      const config = response.data || {}
      fieldConfigs.value[domainId] = config
      return config
    } catch (err) {
      console.error('Failed to load field config:', err)
      return { fields: [] }
    }
  }

  async function loadRecommendedDomains(options = {}) {
    if (recommendedSource.value.length && !options.force) {
      return recommendedSource.value
    }

    if (USE_MOCK) {
      const base = domains.value.length ? domains.value : fallbackDomainsFromMock()
      recommendedSource.value = deriveRecommended(base)
      recommendedError.value = null
      return recommendedSource.value
    }

    recommendedLoading.value = true
    recommendedError.value = null

    try {
      const response = await api.get('/domains/recommended')
      const payload = response.data || {}
      const list = ensureDomainCollection(normalizeDomainList(payload))

      if (list.length) {
        recommendedSource.value = list
      } else {
        recommendedSource.value = deriveRecommended(domains.value.length ? domains.value : fallbackDomainsFromMock())
      }
    } catch (err) {
      recommendedError.value = err
      console.warn('Failed to load recommended domains:', err)

      if (!recommendedSource.value.length) {
        const base = domains.value.length ? domains.value : fallbackDomainsFromMock()
        recommendedSource.value = deriveRecommended(base)
      }
    } finally {
      recommendedLoading.value = false
    }

    return recommendedSource.value
  }

  async function loadUserProgress(domain, options = {}) {
    const cacheKey = resolveDomainKey(domain)

    if (!options.force && cacheKey && progressCache.value[cacheKey]) {
      userProgress.value = progressCache.value[cacheKey]
      return progressCache.value[cacheKey]
    }

    progressLoading.value = true
    progressError.value = null

    try {
      if (USE_MOCK) {
        const fallbackDomain =
          typeof domain === 'object' && domain
            ? domain
            : currentDomain.value

        const fallbackProgress = fallbackProgressFromDomain(fallbackDomain) || { ...FALLBACK_PROGRESS }

        if (cacheKey) {
          progressCache.value = {
            ...progressCache.value,
            [cacheKey]: fallbackProgress
          }
        }

        userProgress.value = fallbackProgress
        return fallbackProgress
      }

      const params = { ...(options.params || {}) }
      if (cacheKey) {
        params.domain = cacheKey
      }

      const response = await api.get('/user/progress', { params })
      const payload = response.data || {}
      const normalized = normalizeProgress(payload)

      if (cacheKey) {
        progressCache.value = {
          ...progressCache.value,
          [cacheKey]: normalized
        }
      }

      userProgress.value = normalized
      return normalized
    } catch (err) {
      progressError.value = err
      console.warn('Failed to load user progress:', err)

      const fallbackDomain =
        typeof domain === 'object' && domain
          ? domain
          : currentDomain.value

      const fallbackProgress = fallbackProgressFromDomain(fallbackDomain)

      if (fallbackProgress) {
        if (cacheKey) {
          progressCache.value = {
            ...progressCache.value,
            [cacheKey]: fallbackProgress
          }
        }

        userProgress.value = fallbackProgress
        return fallbackProgress
      }

      return null
    } finally {
      progressLoading.value = false
    }
  }

  function findDomainBySlug(slug) {
    return domains.value.find(domain => domain.slug === slug)
  }

  function findDomainById(id) {
    return domains.value.find(domain => domain.id === id)
  }

  function setCurrentDomain(domain) {
    currentDomain.value = domain
  }

  function setUserProgress(progress, domainKey) {
    const normalized = normalizeProgress(progress)

    if (domainKey) {
      progressCache.value = {
        ...progressCache.value,
        [domainKey]: normalized
      }
    }

    userProgress.value = normalized
  }

  const currentFieldConfig = computed(() => {
    if (!currentDomain.value) {
      return { fields: [] }
    }

    return fieldConfigs.value[currentDomain.value.id] || { fields: [] }
  })

  const recommendedDomains = computed(() => {
    if (recommendedSource.value.length) {
      return recommendedSource.value
    }

    if (!domains.value.length) {
      return []
    }

    return deriveRecommended(domains.value)
  })

  const derivedProgress = computed(() => {
    const domain = currentDomain.value

    if (!domain) {
      return null
    }

    const cacheKey = resolveDomainKey(domain)
    if (cacheKey && progressCache.value[cacheKey]) {
      return progressCache.value[cacheKey]
    }

    if (userProgress.value) {
      return userProgress.value
    }

    return fallbackProgressFromDomain(domain)
  })

  const domainHighlights = computed(() => {
    if (!currentDomain.value) {
      return []
    }

    const highlights = currentDomain.value.highlights || currentDomain.value.tags || []
    if (Array.isArray(highlights) && highlights.length) {
      return highlights.slice(0, 6)
    }

    const stats = currentDomain.value.stats || {}
    const fallback = [
      stats.bestSkill && `擅长 ${stats.bestSkill}`,
      stats.focusArea && `重点 ${stats.focusArea}`,
      currentDomain.value.category && `方向 ${currentDomain.value.category}`
    ].filter(Boolean)

    return fallback
  })

  // ============ P1 新增：层级菜单相关函数 ============

  /**
   * 加载层级数据
   */
  async function loadHierarchicalDomains(options = {}) {
    if (USE_MOCK) {
      hierarchicalDomains.value = mockDomainsHierarchical
      return mockDomainsHierarchical
    }
    try {
      // 优先使用后端API，否则使用mock数据
      try {
        const response = await api.get('/domains/hierarchical')
        const payload = response.data || {}
        const list = Array.isArray(payload) ? payload : payload.data || mockDomainsHierarchical
        hierarchicalDomains.value = list
        return list
      } catch {
        // 后端不支持，使用mock数据
        hierarchicalDomains.value = mockDomainsHierarchical
        return mockDomainsHierarchical
      }
    } catch (err) {
      console.error('Failed to load hierarchical domains:', err)
      hierarchicalDomains.value = mockDomainsHierarchical
      return mockDomainsHierarchical
    }
  }

  /**
   * 切换节点展开/折叠
   */
  function toggleNodeExpanded(nodeId) {
    if (expandedNodes.value.has(nodeId)) {
      expandedNodes.value.delete(nodeId)
    } else {
      expandedNodes.value.add(nodeId)
    }
  }

  /**
   * 展开所有节点
   */
  function expandAllNodes() {
    const walk = (nodes) => {
      if (!Array.isArray(nodes)) return
      nodes.forEach(node => {
        expandedNodes.value.add(node.id)
        if (node.children) {
          walk(node.children)
        }
      })
    }
    walk(hierarchicalDomains.value)
  }

  /**
   * 折叠所有节点
   */
  function collapseAllNodes() {
    expandedNodes.value.clear()
  }

  /**
   * 在层级树中查找Major级别的专业
   */
  function findAllMajors(nodes = hierarchicalDomains.value) {
    const majors = []
    const walk = (items) => {
      if (!Array.isArray(items)) return
      items.forEach(item => {
        if (item.level === 'major') {
          majors.push(item)
        }
        if (item.children) {
          walk(item.children)
        }
      })
    }
    walk(nodes)
    return majors
  }

  /**
   * 从层级数据中提取所有可选择的项（Major级别）
   */
  const selectableDomains = computed(() => {
    if (hierarchicalDomains.value.length === 0) {
      return domains.value
    }
    return findAllMajors()
  })

  /**
   * 切换视图模式
   */
  function setViewMode(mode) {
    viewMode.value = mode // 'flat' | 'tree'
  }

  // ============ P2 新增：推荐引擎相关函数 ============

  /**
   * 构建用户档案并生成推荐
   */
  async function buildUserProfileAndRecommend(profileData) {
    userProfileLoading.value = true
    try {
      const profile = recommendationService.buildUserProfile(profileData)
      userProfile.value = profile

      // 生成推荐
      const domainList = domains.value.length ? domains.value : fallbackDomainsFromMock()
      const recs = recommendationService.generateRecommendations(profile, domainList, 6)

      recommendations.value = recs
      recommendationsError.value = null
      return recs
    } catch (err) {
      console.error('Failed to build user profile and generate recommendations:', err)
      recommendationsError.value = err
      return []
    } finally {
      userProfileLoading.value = false
    }
  }

  /**
   * 为指定域生成推荐
   */
  async function generateRecommendations(count = 5) {
    if (!userProfile.value) {
      // 如果没有用户档案，使用默认档案
      const defaultProfile = recommendationService.buildUserProfile({
        userId: 'anonymous',
        interests: [],
        goals: [],
        learningStyle: 'balanced',
        timePerWeek: '5-10h'
      })
      userProfile.value = defaultProfile
    }

    recommendationsLoading.value = true
    try {
      const domainList = domains.value.length ? domains.value : fallbackDomainsFromMock()
      const recs = recommendationService.generateRecommendations(userProfile.value, domainList, count)
      recommendations.value = recs
      recommendationsError.value = null
      return recs
    } catch (err) {
      console.error('Failed to generate recommendations:', err)
      recommendationsError.value = err
      return []
    } finally {
      recommendationsLoading.value = false
    }
  }

  /**
   * 获取相似的域
   */
  function loadSimilarDomains(domainId, count = 5) {
    const domainList = domains.value.length ? domains.value : fallbackDomainsFromMock()
    const similar = recommendationService.getSimilarDomains(domainId, domainList, count)
    similarDomains.value[domainId] = similar
    return similar
  }

  /**
   * 获取热门域
   */
  function loadPopularDomains(count = 5) {
    const domainList = domains.value.length ? domains.value : fallbackDomainsFromMock()
    return recommendationService.getPopularDomains(domainList, count)
  }

  /**
   * 获取学习路径
   */
  function getlearningPath(interest) {
    const domainList = domains.value.length ? domains.value : fallbackDomainsFromMock()
    return recommendationService.getLearningPath(interest, domainList)
  }

  /**
   * 获取域的前置条件
   */
  function getDomainPrerequisites(domainId) {
    const domainList = domains.value.length ? domains.value : fallbackDomainsFromMock()
    return recommendationService.getPrerequisites(domainId, domainList)
  }

  /**
   * 更新用户档案
   */
  function updateUserProfile(updates) {
    if (!userProfile.value) {
      userProfile.value = recommendationService.buildUserProfile({})
    }
    userProfile.value = { ...userProfile.value, ...updates }
  }

  /**
   * 添加域到用户的喜欢列表
   */
  function addLikedDomain(domainId) {
    if (!userProfile.value) {
      userProfile.value = recommendationService.buildUserProfile({})
    }
    if (!userProfile.value.likedDomainIds.includes(domainId)) {
      userProfile.value.likedDomainIds.push(domainId)
    }
  }

  /**
   * 移除域从喜欢列表
   */
  function removeLikedDomain(domainId) {
    if (userProfile.value) {
      userProfile.value.likedDomainIds = userProfile.value.likedDomainIds.filter(id => id !== domainId)
    }
  }

  /**
   * 标记域为已完成
   */
  function markDomainAsCompleted(domainId) {
    if (!userProfile.value) {
      userProfile.value = recommendationService.buildUserProfile({})
    }
    if (!userProfile.value.completedDomains.includes(domainId)) {
      userProfile.value.completedDomains.push(domainId)
      // 移除from in-progress
      userProfile.value.inProgressDomains = userProfile.value.inProgressDomains.filter(id => id !== domainId)
    }
  }

  /**
   * 标记域为进行中
   */
  function markDomainAsInProgress(domainId) {
    if (!userProfile.value) {
      userProfile.value = recommendationService.buildUserProfile({})
    }
    if (!userProfile.value.inProgressDomains.includes(domainId)) {
      userProfile.value.inProgressDomains.push(domainId)
    }
  }

  /**
   * 应用过滤器
   */
  function applyFilters(options) {
    filterOptions.difficulty = options.difficulty || []
    filterOptions.timeInvestment = options.timeInvestment || []
    filterOptions.popularity = options.popularity || 'all'
    filterOptions.sortBy = options.sortBy || 'recommendation'
  }

  /**
   * 获取过滤和排序后的域
   */
  const filteredAndSortedDomains = computed(() => {
    let result = domains.value.slice()

    // 应用难度过滤
    if (filterOptions.difficulty.length > 0) {
      result = result.filter(d =>
        filterOptions.difficulty.includes(d.difficulty)
      )
    }

    // 应用热度过滤
    if (filterOptions.popularity !== 'all') {
      if (filterOptions.popularity === 'trending') {
        result = result.filter(d => (d.popularity || 0) >= 75)
      } else if (filterOptions.popularity === 'top-rated') {
        result = result.filter(d => (d.rating || 0) >= 4.5)
      }
    }

    // 应用排序
    const sorted = [...result].sort((a, b) => {
      switch (filterOptions.sortBy) {
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0)
        case 'difficulty':
          const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 }
          return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0)
        case 'time-required':
          return (a.timeRequired || 0) - (b.timeRequired || 0)
        case 'recommendation':
        default:
          return (b.recommendedScore || 0) - (a.recommendedScore || 0)
      }
    })

    return sorted
  })

  /**
   * 重置过滤器
   */
  function resetFilters() {
    filterOptions.difficulty = []
    filterOptions.timeInvestment = []
    filterOptions.popularity = 'all'
    filterOptions.sortBy = 'recommendation'
  }

  // ===================== P2D: 学习分析状态 =====================

  /**
   * 学习分析状态
   */
  const activities = ref([])
  const progressMetrics = ref({})
  const learningGoals = ref({
    domainsToComplete: 10,
    targetAccuracy: 85,
    dailyHours: 2
  })
  const insights = ref([])
  const analyticsLoading = ref(false)
  const analyticsError = ref(null)

  /**
   * 记录用户活动
   */
  function trackActivity(domainId, activityType, metrics = {}) {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    analyticsService.then(service => {
      const activity = service.trackActivity(domainId, activityType, metrics)
      activities.value.push(activity)
      // 保存到localStorage
      localStorage.setItem('activities', JSON.stringify(activities.value))
    })
  }

  /**
   * 获取域的进度指标
   */
  function getProgressMetrics(domainId) {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    analyticsService.then(service => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const metrics = service.calculateProgressMetrics(domainId, activities.value, startDate)
      progressMetrics.value = metrics
      return metrics
    })
  }

  /**
   * 获取所有域的进度指标
   */
  function getAllProgressMetrics() {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    return analyticsService.then(service => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const allMetrics = domains.value.map(domain =>
        service.calculateProgressMetrics(domain.id, activities.value, startDate)
      )
      return allMetrics
    })
  }

  /**
   * 生成学习洞察
   */
  function generateAnalyticsInsights(metrics, velocity) {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    analyticsService.then(service => {
      insights.value = service.generateInsights(metrics, velocity)
      // 保存到localStorage
      localStorage.setItem('insights', JSON.stringify(insights.value))
    })
  }

  /**
   * 获取完成日期预测
   */
  function predictCompletion(metrics, velocity) {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    return analyticsService.then(service => {
      return service.predictCompletionDate(metrics, velocity)
    })
  }

  /**
   * 获取学习速度
   */
  function calculateVelocity(metrics) {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    return analyticsService.then(service => {
      return service.calculateLearningVelocity(metrics, activities.value)
    })
  }

  /**
   * 获取域统计摘要
   */
  function getDomainStatisticsSummary() {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    return analyticsService.then(service => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const allMetrics = domains.value.map(domain =>
        service.calculateProgressMetrics(domain.id, activities.value, startDate)
      )
      return service.getDomainStatisticsSummary(allMetrics)
    })
  }

  /**
   * 获取周统计
   */
  function getWeeklyStats(weeks = 4) {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    return analyticsService.then(service => {
      return service.calculateWeeklyStats(activities.value, weeks)
    })
  }

  /**
   * 获取表现最好的域
   */
  function getTopPerformingDomains(count = 5) {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    return analyticsService.then(service => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const allMetrics = domains.value.map(domain =>
        service.calculateProgressMetrics(domain.id, activities.value, startDate)
      )
      return service.getTopPerformingDomains(allMetrics, count)
    })
  }

  /**
   * 获取需要关注的域
   */
  function getDomainsNeedingAttention(count = 5) {
    const analyticsService = import('@/services/analyticsService').then(m => m.default)
    return analyticsService.then(service => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const allMetrics = domains.value.map(domain =>
        service.calculateProgressMetrics(domain.id, activities.value, startDate)
      )
      return service.getDomainsNeedingAttention(allMetrics, count)
    })
  }

  /**
   * 保存学习目标
   */
  function saveLearningGoals(goals) {
    learningGoals.value = { ...goals }
    localStorage.setItem('learningGoals', JSON.stringify(learningGoals.value))
  }

  /**
   * 加载学习目标
   */
  function loadLearningGoals() {
    const saved = localStorage.getItem('learningGoals')
    if (saved) {
      learningGoals.value = JSON.parse(saved)
    }
  }

  /**
   * 加载活动
   */
  function loadActivities() {
    const saved = localStorage.getItem('activities')
    if (saved) {
      activities.value = JSON.parse(saved)
    }
  }

  /**
   * 加载洞察
   */
  function loadInsights() {
    const saved = localStorage.getItem('insights')
    if (saved) {
      insights.value = JSON.parse(saved)
    }
  }

  return {
    loading,
    error,
    domains,
    currentDomain,
    fieldConfigs,
    recommendedSource,
    recommendedLoading,
    recommendedError,
    userProgress,
    progressCache,
    progressLoading,
    progressError,
    currentFieldConfig,
    recommendedDomains,
    derivedProgress,
    domainHighlights,
    // P1新增导出
    hierarchicalDomains,
    expandedNodes,
    viewMode,
    selectableDomains,
    // P2新增导出 - 推荐引擎
    recommendations,
    recommendationsLoading,
    recommendationsError,
    userProfile,
    userProfileLoading,
    similarDomains,
    collectionItems,
    filterOptions,
    filteredAndSortedDomains,
    loadDomains,
    loadDomainDetail,
    loadFieldConfig,
    loadRecommendedDomains,
    loadUserProgress,
    findDomainBySlug,
    findDomainById,
    setCurrentDomain,
    setUserProgress,
    // P1新增方法
    loadHierarchicalDomains,
    toggleNodeExpanded,
    expandAllNodes,
    collapseAllNodes,
    findAllMajors,
    setViewMode,
    // P2新增方法 - 推荐引擎
    buildUserProfileAndRecommend,
    generateRecommendations,
    loadSimilarDomains,
    loadPopularDomains,
    getlearningPath,
    getDomainPrerequisites,
    updateUserProfile,
    addLikedDomain,
    removeLikedDomain,
    markDomainAsCompleted,
    markDomainAsInProgress,
    applyFilters,
    resetFilters,
    // P2D新增状态 - 学习分析
    activities,
    progressMetrics,
    learningGoals,
    insights,
    analyticsLoading,
    analyticsError,
    // P2D新增方法 - 学习分析
    trackActivity,
    getProgressMetrics,
    getAllProgressMetrics,
    generateAnalyticsInsights,
    predictCompletion,
    calculateVelocity,
    getDomainStatisticsSummary,
    getWeeklyStats,
    getTopPerformingDomains,
    getDomainsNeedingAttention,
    saveLearningGoals,
    loadLearningGoals,
    loadActivities,
    loadInsights
  }
})

function resolveDomainKey(domain) {
  if (!domain) {
    return null
  }

  if (typeof domain === 'string' || typeof domain === 'number') {
    return domain
  }

  if (typeof domain === 'object') {
    return domain.slug || domain.id || null
  }

  return null
}
