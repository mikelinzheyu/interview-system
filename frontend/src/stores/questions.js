import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchQuestionList,
  fetchQuestionDetail,
  submitQuestionAnswer,
  fetchQuestionCategories,
  fetchQuestionTags,
  fetchQuestionPracticeRecords,
  fetchQuestionRecommendations
} from '@/api/questions'

export const useQuestionBankStore = defineStore('questionBank', () => {
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref(null)

  const list = ref([])
  const summary = ref(null)
  const availableFilters = ref({
    difficulties: [],
    types: [],
    tags: []
  })

  const pagination = reactive({
    page: 1,
    size: 20,
    total: 0,
    totalPages: 1
  })

  const filters = reactive({
    keyword: '',
    difficulty: [],
    type: [],
    tags: [],
    categoryId: null,
    includeDescendants: true,
    sort: 'recent',
    domainId: null,
    metadata: {}
  })

  const categoriesTree = ref([])
  const categoriesFlat = ref([])
  const tags = ref([])

  const currentQuestion = ref(null)
  const currentQuestionLoading = ref(false)
  const practiceRecords = ref([])
  const recommendations = ref([])

  const questionCache = ref(new Map())
  const lastFetchedAt = ref(null)

  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.keyword ||
      filters.categoryId ||
      filters.sort !== 'recent' ||
      filters.difficulty.length ||
      filters.type.length ||
      filters.tags.length
    )
  })

  function buildListParams(overrides = {}) {
    const params = {
      page: overrides.page ?? pagination.page,
      size: overrides.size ?? pagination.size,
      sort: filters.sort
    }

    if (filters.keyword) {
      params.keyword = filters.keyword
    }
    if (filters.domainId) {
      params.domain_id = filters.domainId
    }
    if (filters.categoryId) {
      params.category_id = filters.categoryId
    }
    if (!filters.includeDescendants) {
      params.include_descendants = false
    }
    if (filters.difficulty.length) {
      params.difficulty = filters.difficulty.join(',')
    }
    if (filters.type.length) {
      params.type = filters.type.join(',')
    }
    if (filters.tags.length) {
      params.tags = filters.tags.join(',')
    }

    // metadata 筛选
    Object.keys(filters.metadata).forEach(key => {
      const value = filters.metadata[key]
      if (value !== null && value !== undefined && value !== '') {
        params[`metadata.${key}`] = value
      }
    })

    if (overrides.keyword) {
      params.keyword = overrides.keyword
    }
    if (overrides.categoryId) {
      params.category_id = overrides.categoryId
    }
    if (overrides.domainId) {
      params.domain_id = overrides.domainId
    }

    return params
  }

  async function loadQuestions(overrides = {}) {
    loading.value = true
    error.value = null

    try {
      const params = buildListParams(overrides)

      if (overrides.page != null) {
        pagination.page = overrides.page
      }
      if (overrides.size != null) {
        pagination.size = overrides.size
      }

      const response = await fetchQuestionList(params)
      const data = response.data || {}

      list.value = data.items || []
      summary.value = data.summary || null

      pagination.page = data.page || params.page || 1
      pagination.size = data.size || params.size || pagination.size
      pagination.total = data.total || 0
      pagination.totalPages = data.totalPages || Math.max(1, Math.ceil((data.total || 0) / pagination.size))

      if (data.availableFilters) {
        availableFilters.value = {
          difficulties: data.availableFilters.difficulties || [],
          types: data.availableFilters.types || [],
          tags: data.availableFilters.tags || []
        }
      }

      lastFetchedAt.value = Date.now()
    } catch (err) {
      error.value = err
      console.error('加载题库列表失败:', err)
      ElMessage.error(err?.message || '题库数据加载失败')
    } finally {
      loading.value = false
    }
  }

  async function loadCategories(domainId = null) {
    try {
      const params = {}
      if (domainId) {
        params.domain_id = domainId
      }
      const response = await fetchQuestionCategories(params)
      const data = response.data || {}
      categoriesTree.value = data.tree || []
      categoriesFlat.value = data.flat || []
    } catch (err) {
      console.error('加载题库分类失败:', err)
      ElMessage.error('题库分类加载失败')
    }
  }

  async function loadTags() {
    try {
      const response = await fetchQuestionTags()
      const data = response.data || {}
      tags.value = data.items || []
    } catch (err) {
      console.error('加载题库标签失败:', err)
    }
  }

  async function initialize() {
    await Promise.all([loadCategories(), loadTags()])
    await loadQuestions({ page: 1 })
  }

  async function initializeWithDomain(domainId) {
    filters.domainId = domainId
    await Promise.all([loadCategories(domainId), loadTags()])
    await loadQuestions({ page: 1, domainId })
  }

  function setDomain(domainId) {
    filters.domainId = domainId
  }

  function setMetadataFilter(key, value) {
    filters.metadata[key] = value
  }

  function clearMetadataFilters() {
    filters.metadata = {}
  }

  function setKeyword(keyword) {
    filters.keyword = keyword.trim()
  }

  function resetFilters() {
    filters.keyword = ''
    filters.difficulty = []
    filters.type = []
    filters.tags = []
    filters.categoryId = null
    filters.includeDescendants = true
    filters.sort = 'recent'
    filters.metadata = {}
    // 不重置 domainId,保持在当前领域
  }

  function toggleFilterValue(key, value) {
    if (!Array.isArray(filters[key])) return
    const listRef = filters[key]
    const index = listRef.indexOf(value)
    if (index >= 0) {
      listRef.splice(index, 1)
    } else {
      listRef.push(value)
    }
  }

  function setCategory(categoryId) {
    filters.categoryId = categoryId
  }

  function setSort(sort) {
    filters.sort = sort
  }

  function setIncludeDescendants(value) {
    filters.includeDescendants = value
  }

  async function applyFilters(options = {}) {
    if (options.page) {
      pagination.page = options.page
    } else if (options.resetPage !== false) {
      pagination.page = 1
    }

    await loadQuestions({ page: pagination.page })
  }

  async function changePage(page) {
    pagination.page = page
    await loadQuestions({ page })
  }

  async function changePageSize(size) {
    pagination.size = size
    pagination.page = 1
    await loadQuestions({ page: 1, size })
  }

  async function fetchQuestionDetailData(id, { force = false } = {}) {
    const numericId = Number(id)
    if (!numericId) return null

    if (!force && questionCache.value.has(numericId)) {
      currentQuestion.value = questionCache.value.get(numericId)
      await loadPracticeRecords(numericId)
      return currentQuestion.value
    }

    currentQuestionLoading.value = true
    try {
      const response = await fetchQuestionDetail(numericId)
      const data = response.data || {}
      questionCache.value.set(numericId, data)
      currentQuestion.value = data
      recommendations.value = data.recommendations || []
      await loadPracticeRecords(numericId)
      return data
    } catch (err) {
      console.error('获取题目详情失败:', err)
      ElMessage.error('题目详情加载失败')
      throw err
    } finally {
      currentQuestionLoading.value = false
    }
  }

  async function loadPracticeRecords(questionId) {
    try {
      const response = await fetchQuestionPracticeRecords(questionId)
      practiceRecords.value = response.data?.items || []
      return practiceRecords.value
    } catch (err) {
      console.error('加载练习记录失败:', err)
      return []
    }
  }

  async function loadRecommendations(questionId) {
    try {
      const response = await fetchQuestionRecommendations({ base_id: questionId })
      recommendations.value = response.data?.items || []
    } catch (err) {
      console.error('加载推荐题目失败:', err)
    }
  }

  async function submitAnswer(questionId, payload) {
    if (!questionId) return null

    submitting.value = true
    try {
      const response = await submitQuestionAnswer(questionId, payload)
      const data = response.data || {}
      ElMessage.success('作答提交成功')
      await Promise.all([
        fetchQuestionDetailData(questionId, { force: true }),
        loadRecommendations(questionId)
      ])
      return data
    } catch (err) {
      console.error('提交题目作答失败:', err)
      ElMessage.error(err?.message || '作答提交失败')
      throw err
    } finally {
      submitting.value = false
    }
  }

  return {
    loading,
    submitting,
    error,
    list,
    summary,
    filters,
    availableFilters,
    pagination,
    categoriesTree,
    categoriesFlat,
    tags,
    currentQuestion,
    currentQuestionLoading,
    practiceRecords,
    recommendations,
    hasActiveFilters,
    initialize,
    initializeWithDomain,
    loadQuestions,
    loadCategories,
    loadTags,
    applyFilters,
    changePage,
    changePageSize,
    setKeyword,
    resetFilters,
    toggleFilterValue,
    setCategory,
    setSort,
    setIncludeDescendants,
    setDomain,
    setMetadataFilter,
    clearMetadataFilters,
    fetchQuestionDetailData,
    submitAnswer,
    loadPracticeRecords,
    loadRecommendations
  }
})
