import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import mockDomains from '@/data/mock-domains.json'

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

  async function loadDomains(options = {}) {
    loading.value = true
    error.value = null

    try {
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
    loadDomains,
    loadDomainDetail,
    loadFieldConfig,
    loadRecommendedDomains,
    loadUserProgress,
    findDomainBySlug,
    findDomainById,
    setCurrentDomain,
    setUserProgress
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
