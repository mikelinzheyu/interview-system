import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

/**
 * Wrong Answers Store
 * Manages wrong answer records and statistics
 */
export const useWrongAnswersStore = defineStore('wrongAnswers', () => {
  // State
  const wrongAnswers = ref([])
  const statistics = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Filters
  const selectedStatus = ref(null) // 'unreviewed', 'reviewing', 'mastered'
  const selectedSource = ref(null) // 'ai_interview', 'question_bank', 'mock_exam'

  // Pagination
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Computed Properties
  const filteredWrongAnswers = computed(() => {
    let result = wrongAnswers.value

    if (selectedStatus.value) {
      result = result.filter(item => item.reviewStatus === selectedStatus.value)
    }

    if (selectedSource.value) {
      result = result.filter(item => item.source === selectedSource.value)
    }

    return result
  })

  const paginatedWrongAnswers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredWrongAnswers.value.slice(start, end)
  })

  const totalCount = computed(() => filteredWrongAnswers.value.length)

  const hasStatistics = computed(() => statistics.value !== null)

  // Getters for statistics
  const masteredCount = computed(() => statistics.value?.masteredCount || 0)
  const reviewingCount = computed(() => statistics.value?.reviewingCount || 0)
  const unreviewedCount = computed(() => statistics.value?.unreviewedCount || 0)
  const totalWrongCount = computed(() => statistics.value?.totalWrongCount || 0)
  const masteredPercentage = computed(() => statistics.value?.masteredPercentage || 0)

  // Actions
  /**
   * Record a wrong answer
   */
  const recordWrongAnswer = async (questionId, source, isCorrect, metadata = {}) => {
    try {
      loading.value = true
      error.value = null

      const inferredErrorType = metadata.errorType || metadata.error_type
      const request = {
        questionId,
        source,
        isCorrect,
        errorType: inferredErrorType,
        ...metadata,
        metadata: { ...(metadata.metadata || {}), errorType: inferredErrorType }
      }

      const response = await api.post('/wrong-answers', request)

      if (response.data) {
        // Add or update the wrong answer in local state
        const index = wrongAnswers.value.findIndex(item => item.id === response.data.id)
        const normalized = normalizeRecord(response.data)
        if (index >= 0) {
          wrongAnswers.value[index] = normalized
        } else {
          wrongAnswers.value.unshift(normalized)
        }

        ElMessage.success('Wrong answer recorded successfully')
        return response.data
      }
    } catch (err) {
      error.value = err.message || 'Failed to record wrong answer'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch all wrong answers
   */
  const fetchWrongAnswers = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await api.get('/wrong-answers')

      if (response && response.data !== undefined) {
        // Handle both direct array response and nested data format
        let items = []
        if (Array.isArray(response.data)) {
          items = response.data
        } else if (response.data && typeof response.data === 'object') {
          items = Array.isArray(response.data.data) ? response.data.data : (response.data.items || [])
        }
        wrongAnswers.value = items.map(normalizeRecord)
        return items
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch wrong answers'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch wrong answers by status
   */
  const fetchByStatus = async (status) => {
    try {
      loading.value = true
      error.value = null

      const response = await api.get(`/wrong-answers/status/${status}`)

      if (response && response.data !== undefined) {
        let items = []
        if (Array.isArray(response.data)) {
          items = response.data
        } else if (response.data && typeof response.data === 'object') {
          items = Array.isArray(response.data.data) ? response.data.data : (response.data.items || [])
        }
        wrongAnswers.value = items.map(normalizeRecord)
        return items
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch wrong answers'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch wrong answers by source
   */
  const fetchBySource = async (source) => {
    try {
      loading.value = true
      error.value = null

      const response = await api.get(`/wrong-answers/source/${source}`)

      if (response && response.data !== undefined) {
        let items = []
        if (Array.isArray(response.data)) {
          items = response.data
        } else if (response.data && typeof response.data === 'object') {
          items = Array.isArray(response.data.data) ? response.data.data : (response.data.items || [])
        }
        wrongAnswers.value = items.map(normalizeRecord)
        return items
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch wrong answers'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch questions due for review
   */
  const fetchDueForReview = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await api.get('/wrong-answers/due-for-review')

      if (response && response.data !== undefined) {
        // Normalize to array
        let items = []
        if (Array.isArray(response.data)) {
          items = response.data
        } else if (response.data && typeof response.data === 'object') {
          items = Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data.items) ? response.data.items : [])
        }
        wrongAnswers.value = items.map(normalizeRecord)
        return items
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch due questions'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch statistics
   */
  const fetchStatistics = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await api.get('/wrong-answers/statistics')

      if (response.data) {
        statistics.value = response.data
        return response.data
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch statistics'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Review once with result and time
   */
  const reviewOnce = async (recordId, { result = 'pass', timeSpentSec = 0, notes = '', errorType } = {}) => {
    try {
      loading.value = true
      error.value = null

      const response = await api.post(`/wrong-answers/${recordId}/review`, { result, timeSpentSec, notes, errorType })

      if (response.data) {
        const idx = wrongAnswers.value.findIndex(item => item.id === recordId)
        if (idx >= 0) {
          wrongAnswers.value[idx] = normalizeRecord(response.data)
        }
        return response.data
      }
    } catch (err) {
      error.value = err.message || 'Failed to review'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch review logs
   */
  const fetchReviewLogs = async (recordId) => {
    try {
      const response = await api.get('/wrong-answers/review/logs', { params: { recordId } })
      if (response.data) {
        const items = Array.isArray(response.data.items) ? response.data.items : []
        return items.map(log => ({ ...log, errorType: log.errorType || log.error_type || log?.metadata?.errorType }))
      }
      return []
    } catch (err) {
      // non-fatal for UI
      return []
    }
  }

  /**
   * Mark a question as mastered
   */
  const markAsMastered = async (recordId) => {
    try {
      loading.value = true
      error.value = null

      const response = await api.put(`/wrong-answers/${recordId}/mark-mastered`)

      if (response.data) {
        const index = wrongAnswers.value.findIndex(item => item.id === recordId)
        if (index >= 0) {
          wrongAnswers.value[index] = response.data
        }

        ElMessage.success('Marked as mastered')
        return response.data
      }
    } catch (err) {
      error.value = err.message || 'Failed to update status'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a question as reviewing
   */
  const markAsReviewing = async (recordId) => {
    try {
      loading.value = true
      error.value = null

      const response = await api.put(`/wrong-answers/${recordId}/mark-reviewing`)

      if (response.data) {
        const index = wrongAnswers.value.findIndex(item => item.id === recordId)
        if (index >= 0) {
          wrongAnswers.value[index] = response.data
        }

        ElMessage.success('Marked as reviewing')
        return response.data
      }
    } catch (err) {
      error.value = err.message || 'Failed to update status'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user notes
   */
  const updateUserNotes = async (recordId, notes) => {
    try {
      loading.value = true
      error.value = null

      const response = await api.put(`/wrong-answers/${recordId}/notes`, { notes })

      if (response.data) {
        const index = wrongAnswers.value.findIndex(item => item.id === recordId)
        if (index >= 0) {
          wrongAnswers.value[index] = response.data
        }

        ElMessage.success('Notes updated successfully')
        return response.data
      }
    } catch (err) {
      error.value = err.message || 'Failed to update notes'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user tags
   */
  const updateUserTags = async (recordId, tags) => {
    try {
      loading.value = true
      error.value = null

      const response = await api.put(`/wrong-answers/${recordId}/tags`, { tags })

      if (response.data) {
        const index = wrongAnswers.value.findIndex(item => item.id === recordId)
        if (index >= 0) {
          wrongAnswers.value[index] = response.data
        }

        ElMessage.success('Tags updated successfully')
        return response.data
      }
    } catch (err) {
      error.value = err.message || 'Failed to update tags'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a wrong answer record
   */
  const deleteWrongAnswer = async (recordId) => {
    try {
      loading.value = true
      error.value = null

      await api.delete(`/wrong-answers/${recordId}`)

      wrongAnswers.value = wrongAnswers.value.filter(item => item.id !== recordId)
      ElMessage.success('Wrong answer deleted successfully')
    } catch (err) {
      error.value = err.message || 'Failed to delete wrong answer'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Generate review plan
   */
  const generateReviewPlan = async () => {
    try {
      loading.value = true
      error.value = null

      await api.post('/wrong-answers/generate-review-plan')

      ElMessage.success('Review plan generated successfully')
      await fetchWrongAnswers()
    } catch (err) {
      error.value = err.message || 'Failed to generate review plan'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Set filter status
   */
  const setStatusFilter = (status) => {
    selectedStatus.value = status
    currentPage.value = 1
  }

  /**
   * Set filter source
   */
  const setSourceFilter = (source) => {
    selectedSource.value = source
    currentPage.value = 1
  }

  /**
   * Clear filters
   */
  const clearFilters = () => {
    selectedStatus.value = null
    selectedSource.value = null
    currentPage.value = 1
  }

  /**
   * Reset store
   */
  const reset = () => {
    wrongAnswers.value = []
    statistics.value = null
    loading.value = false
    error.value = null
    selectedStatus.value = null
    selectedSource.value = null
    currentPage.value = 1
  }

  // Normalize a wrong-answer record to ensure errorType is present
  const normalizeRecord = (rec) => {
    const r = { ...rec }
    r.errorType = r.errorType || r.error_type || r?.metadata?.errorType
    return r
  }

  return {
    // State
    wrongAnswers,
    statistics,
    loading,
    error,
    selectedStatus,
    selectedSource,
    currentPage,
    pageSize,

    // Computed
    filteredWrongAnswers,
    paginatedWrongAnswers,
    totalCount,
    hasStatistics,
    masteredCount,
    reviewingCount,
    unreviewedCount,
    totalWrongCount,
    masteredPercentage,

    // Actions
    recordWrongAnswer,
    fetchWrongAnswers,
    fetchByStatus,
    fetchBySource,
    fetchDueForReview,
    fetchStatistics,
    markAsMastered,
    markAsReviewing,
    reviewOnce,
    fetchReviewLogs,
    updateUserNotes,
    updateUserTags,
    deleteWrongAnswer,
    generateReviewPlan,
    setStatusFilter,
    setSourceFilter,
    clearFilters,
    reset
  }
})
