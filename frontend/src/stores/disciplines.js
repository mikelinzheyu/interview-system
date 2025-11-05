import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

/**
 * 学科体系 Store
 * 支持4层级结构：学科 → 专业类 → 专业 → 细分方向
 */
export const useDisciplinesStore = defineStore('disciplines', () => {
  // ============ 状态：一级学科（学科门类） ============
  const disciplines = ref([])
  const disciplinesLoading = ref(false)
  const disciplinesError = ref(null)

  // ============ 状态：二级专业类 ============
  const majorGroupsCache = reactive({}) // key: disciplineId, value: majorGroups array
  const majorGroupsLoading = reactive({}) // key: disciplineId, value: boolean
  const majorGroupsError = reactive({}) // key: disciplineId, value: error object

  // ============ 状态：三级专业详情 ============
  const majorsCache = reactive({}) // key: majorId, value: major detail object
  const majorsLoading = reactive({}) // key: majorId, value: boolean
  const majorsError = reactive({}) // key: majorId, value: error object

  // ============ 状态：四级细分方向详情 ============
  const specializationsCache = reactive({}) // key: specializationId, value: specialization detail object
  const specializationsLoading = reactive({}) // key: specializationId, value: boolean
  const specializationsError = reactive({}) // key: specializationId, value: error object

  // ============ 状态：导航和搜索 ============
  const currentDiscipline = ref(null)
  const currentMajorGroup = ref(null)
  const currentMajor = ref(null)
  const currentSpecialization = ref(null)

  const breadcrumb = ref([]) // 面包屑导航
  const searchQuery = ref('')
  const searchResults = ref([])
  const searchLoading = ref(false)

  // ============ 方法：一级学科加载 ============
  /**
   * 加载所有学科门类
   */
  async function loadDisciplines(options = {}) {
    if (disciplines.value.length && !options.force) {
      return disciplines.value
    }

    disciplinesLoading.value = true
    disciplinesError.value = null

    try {
      const response = await api.get('/disciplines')
      const payload = response.data || response
      const list = Array.isArray(payload) ? payload : payload.data || []

      if (!list.length) {
        throw new Error('未获取到学科数据')
      }

      disciplines.value = list
      return list
    } catch (err) {
      disciplinesError.value = err
      console.error('Failed to load disciplines:', err)
      ElMessage.error('学科列表加载失败')
      throw err
    } finally {
      disciplinesLoading.value = false
    }
  }

  /**
   * 根据ID查找学科
   */
  function findDisciplineById(id) {
    return disciplines.value.find(d => d.id === id)
  }

  /**
   * 选择学科
   */
  function selectDiscipline(discipline) {
    currentDiscipline.value = discipline
    currentMajorGroup.value = null
    currentMajor.value = null
    currentSpecialization.value = null
    updateBreadcrumb()
  }

  // ============ 方法：二级专业类加载 ============
  /**
   * 加载某个学科的专业类列表
   */
  async function loadMajorGroups(disciplineId, options = {}) {
    // 检查缓存
    if (majorGroupsCache[disciplineId] && !options.force) {
      return majorGroupsCache[disciplineId]
    }

    if (!majorGroupsLoading[disciplineId]) {
      majorGroupsLoading[disciplineId] = true
    }

    try {
      const response = await api.get(`/disciplines/${disciplineId}/major-groups`)
      const payload = response.data || response
      const list = Array.isArray(payload) ? payload : payload.data || []

      majorGroupsCache[disciplineId] = list
      majorGroupsError[disciplineId] = null
      return list
    } catch (err) {
      majorGroupsError[disciplineId] = err
      console.error(`Failed to load major groups for discipline ${disciplineId}:`, err)
      return []
    } finally {
      majorGroupsLoading[disciplineId] = false
    }
  }

  /**
   * 获取当前学科的专业类
   */
  const currentMajorGroups = computed(() => {
    if (!currentDiscipline.value) {
      return []
    }
    return majorGroupsCache[currentDiscipline.value.id] || []
  })

  /**
   * 选择专业类
   */
  function selectMajorGroup(majorGroup) {
    currentMajorGroup.value = majorGroup
    currentMajor.value = null
    currentSpecialization.value = null
    updateBreadcrumb()
  }

  // ============ 方法：三级专业详情加载 ============
  /**
   * 加载专业详情（包含细分方向）
   */
  async function loadMajorDetails(majorId, options = {}) {
    // 检查缓存
    if (majorsCache[majorId] && !options.force) {
      return majorsCache[majorId]
    }

    if (!majorsLoading[majorId]) {
      majorsLoading[majorId] = true
    }

    try {
      const response = await api.get(`/majors/${majorId}/details`)
      const payload = response.data || response
      const majorDetail = payload && typeof payload === 'object' ? payload : null

      if (!majorDetail) {
        throw new Error('专业详情为空')
      }

      majorsCache[majorId] = majorDetail
      majorsError[majorId] = null
      return majorDetail
    } catch (err) {
      majorsError[majorId] = err
      console.error(`Failed to load major details for ${majorId}:`, err)
      return null
    } finally {
      majorsLoading[majorId] = false
    }
  }

  /**
   * 选择专业
   */
  async function selectMajor(major) {
    currentMajor.value = major
    currentSpecialization.value = null

    // 异步加载详情
    if (!majorsCache[major.id]) {
      await loadMajorDetails(major.id)
    }

    updateBreadcrumb()
  }

  /**
   * 获取当前专业的细分方向
   */
  const currentSpecializations = computed(() => {
    if (!currentMajor.value || !majorsCache[currentMajor.value.id]) {
      return []
    }
    return majorsCache[currentMajor.value.id].specializations || []
  })

  // ============ 方法：四级细分方向详情加载 ============
  /**
   * 加载细分方向详情
   */
  async function loadSpecializationDetails(specializationId, options = {}) {
    // 检查缓存
    if (specializationsCache[specializationId] && !options.force) {
      return specializationsCache[specializationId]
    }

    if (!specializationsLoading[specializationId]) {
      specializationsLoading[specializationId] = true
    }

    try {
      const response = await api.get(`/specializations/${specializationId}`)
      const payload = response.data || response
      const specDetail = payload && typeof payload === 'object' ? payload : null

      if (!specDetail) {
        throw new Error('细分方向详情为空')
      }

      specializationsCache[specializationId] = specDetail
      specializationsError[specializationId] = null
      return specDetail
    } catch (err) {
      specializationsError[specializationId] = err
      console.error(`Failed to load specialization details for ${specializationId}:`, err)
      return null
    } finally {
      specializationsLoading[specializationId] = false
    }
  }

  /**
   * 选择细分方向
   */
  async function selectSpecialization(specialization) {
    currentSpecialization.value = specialization

    // 异步加载详情
    if (!specializationsCache[specialization.id]) {
      await loadSpecializationDetails(specialization.id)
    }

    updateBreadcrumb()
  }

  // ============ 方法：导航和面包屑 ============
  /**
   * 更新面包屑
   */
  function updateBreadcrumb() {
    const items = []

    if (currentDiscipline.value) {
      items.push({
        label: currentDiscipline.value.name,
        id: currentDiscipline.value.id,
        level: 'discipline'
      })
    }

    if (currentMajorGroup.value) {
      items.push({
        label: currentMajorGroup.value.name,
        id: currentMajorGroup.value.id,
        level: 'majorGroup'
      })
    }

    if (currentMajor.value) {
      items.push({
        label: currentMajor.value.name,
        id: currentMajor.value.id,
        level: 'major'
      })
    }

    if (currentSpecialization.value) {
      items.push({
        label: currentSpecialization.value.name,
        id: currentSpecialization.value.id,
        level: 'specialization'
      })
    }

    breadcrumb.value = items
  }

  /**
   * 返回上一级
   */
  function goBack() {
    if (currentSpecialization.value) {
      currentSpecialization.value = null
    } else if (currentMajor.value) {
      currentMajor.value = null
    } else if (currentMajorGroup.value) {
      currentMajorGroup.value = null
    } else if (currentDiscipline.value) {
      currentDiscipline.value = null
    }

    updateBreadcrumb()
  }

  /**
   * 跳转到指定面包屑级别
   */
  function navigateToBreadcrumb(index) {
    const item = breadcrumb.value[index]
    if (!item) return

    // 重置到该级别之后的所有级别
    if (index === 0) {
      selectDiscipline(currentDiscipline.value)
    } else if (index === 1 && currentMajorGroup.value) {
      selectMajorGroup(currentMajorGroup.value)
    } else if (index === 2 && currentMajor.value) {
      currentMajor.value = currentMajor.value
      updateBreadcrumb()
    } else if (index === 3 && currentSpecialization.value) {
      currentSpecialization.value = currentSpecialization.value
      updateBreadcrumb()
    }
  }

  // ============ 方法：搜索和过滤 ============
  /**
   * 搜索学科、专业、细分方向
   */
  async function search(query) {
    if (!query.trim()) {
      searchResults.value = []
      return
    }

    searchLoading.value = true
    searchQuery.value = query

    try {
      const lowerQuery = query.toLowerCase()
      const results = []

      // 搜索学科
      for (const disc of disciplines.value) {
        if (
          disc.name.toLowerCase().includes(lowerQuery) ||
          (disc.description && disc.description.toLowerCase().includes(lowerQuery))
        ) {
          results.push({
            id: disc.id,
            name: disc.name,
            type: 'discipline',
            level: 1,
            data: disc
          })
        }
      }

      // 搜索专业类和专业
      for (const disc of disciplines.value) {
        const majorGroups = majorGroupsCache[disc.id] || []
        for (const group of majorGroups) {
          if (
            group.name.toLowerCase().includes(lowerQuery) ||
            (group.description && group.description.toLowerCase().includes(lowerQuery))
          ) {
            results.push({
              id: group.id,
              name: group.name,
              type: 'majorGroup',
              level: 2,
              parentId: disc.id,
              data: group
            })
          }

          for (const major of group.majors || []) {
            if (
              major.name.toLowerCase().includes(lowerQuery) ||
              (major.description && major.description.toLowerCase().includes(lowerQuery))
            ) {
              results.push({
                id: major.id,
                name: major.name,
                type: 'major',
                level: 3,
                parentId: disc.id,
                parentGroupId: group.id,
                data: major
              })
            }

            // 搜索细分方向
            const majorDetail = majorsCache[major.id]
            if (majorDetail && majorDetail.specializations) {
              for (const spec of majorDetail.specializations) {
                if (
                  spec.name.toLowerCase().includes(lowerQuery) ||
                  (spec.description && spec.description.toLowerCase().includes(lowerQuery))
                ) {
                  results.push({
                    id: spec.id,
                    name: spec.name,
                    type: 'specialization',
                    level: 4,
                    parentId: disc.id,
                    parentGroupId: group.id,
                    parentMajorId: major.id,
                    data: spec
                  })
                }
              }
            }
          }
        }
      }

      searchResults.value = results
    } catch (err) {
      console.error('Search failed:', err)
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  /**
   * 清除搜索
   */
  function clearSearch() {
    searchQuery.value = ''
    searchResults.value = []
  }

  /**
   * 根据搜索结果导航
   */
  async function navigateToSearchResult(result) {
    // 确保学科已加载
    if (!disciplines.value.length) {
      await loadDisciplines()
    }

    const discipline = findDisciplineById(result.parentId || result.id)
    if (!discipline) return

    selectDiscipline(discipline)

    if (result.type === 'majorGroup' || result.type === 'major' || result.type === 'specialization') {
      // 加载专业类
      const groups = await loadMajorGroups(discipline.id)
      const majorGroup = groups.find(g => g.id === (result.parentGroupId || result.id))
      if (majorGroup) {
        selectMajorGroup(majorGroup)
      }
    }

    if (result.type === 'major' || result.type === 'specialization') {
      const majorGroup = currentMajorGroup.value
      const major = majorGroup?.majors?.find(m => m.id === (result.parentMajorId || result.id))
      if (major) {
        await selectMajor(major)
      }
    }

    if (result.type === 'specialization') {
      const specialization = currentSpecializations.value.find(s => s.id === result.id)
      if (specialization) {
        await selectSpecialization(specialization)
      }
    }

    clearSearch()
  }

  // ============ 计算属性 ============
  /**
   * 是否在加载中
   */
  const isLoading = computed(() => {
    return (
      disciplinesLoading.value ||
      (currentDiscipline.value && majorGroupsLoading[currentDiscipline.value.id]) ||
      (currentMajor.value && majorsLoading[currentMajor.value.id]) ||
      (currentSpecialization.value && specializationsLoading[currentSpecialization.value.id])
    )
  })

  /**
   * 获取当前导航级别
   */
  const currentLevel = computed(() => {
    if (currentSpecialization.value) return 'specialization'
    if (currentMajor.value) return 'major'
    if (currentMajorGroup.value) return 'majorGroup'
    if (currentDiscipline.value) return 'discipline'
    return 'root'
  })

  /**
   * 获取当前路径信息
   */
  const navigationPath = computed(() => {
    return {
      discipline: currentDiscipline.value,
      majorGroup: currentMajorGroup.value,
      major: currentMajor.value,
      specialization: currentSpecialization.value,
      level: currentLevel.value,
      breadcrumb: breadcrumb.value
    }
  })

  // ============ 导出 ============
  return {
    // 状态
    disciplines,
    disciplinesLoading,
    disciplinesError,
    majorGroupsCache,
    majorGroupsLoading,
    majorGroupsError,
    majorsCache,
    majorsLoading,
    majorsError,
    specializationsCache,
    specializationsLoading,
    specializationsError,
    currentDiscipline,
    currentMajorGroup,
    currentMajor,
    currentSpecialization,
    breadcrumb,
    searchQuery,
    searchResults,
    searchLoading,

    // 计算属性
    currentMajorGroups,
    currentSpecializations,
    isLoading,
    currentLevel,
    navigationPath,

    // 方法 - 一级学科
    loadDisciplines,
    findDisciplineById,
    selectDiscipline,

    // 方法 - 二级专业类
    loadMajorGroups,
    selectMajorGroup,

    // 方法 - 三级专业
    loadMajorDetails,
    selectMajor,

    // 方法 - 四级细分方向
    loadSpecializationDetails,
    selectSpecialization,

    // 方法 - 导航
    updateBreadcrumb,
    goBack,
    navigateToBreadcrumb,

    // 方法 - 搜索
    search,
    clearSearch,
    navigateToSearchResult
  }
})
