import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

export const useDomainStore = defineStore('domain', () => {
  const loading = ref(false)
  const error = ref(null)

  const domains = ref([])
  const currentDomain = ref(null)
  const fieldConfigs = ref({})

  // 获取所有领域
  async function loadDomains() {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/domains')
      const data = response.data || {}
      domains.value = data.items || []
      return domains.value
    } catch (err) {
      error.value = err
      console.error('加载领域列表失败:', err)
      ElMessage.error('领域列表加载失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 根据 slug 或 id 获取领域详情
  async function loadDomainDetail(idOrSlug) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/domains/${idOrSlug}`)
      const data = response.data || {}
      currentDomain.value = data
      return data
    } catch (err) {
      error.value = err
      console.error('加载领域详情失败:', err)
      ElMessage.error('领域详情加载失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取领域的字段配置
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
      console.error('加载领域字段配置失败:', err)
      return { fields: [] }
    }
  }

  // 根据 slug 查找领域
  function findDomainBySlug(slug) {
    return domains.value.find(d => d.slug === slug)
  }

  // 根据 id 查找领域
  function findDomainById(id) {
    return domains.value.find(d => d.id === id)
  }

  // 设置当前领域
  function setCurrentDomain(domain) {
    currentDomain.value = domain
  }

  // 获取当前领域的字段配置
  const currentFieldConfig = computed(() => {
    if (!currentDomain.value) return { fields: [] }
    return fieldConfigs.value[currentDomain.value.id] || { fields: [] }
  })

  return {
    loading,
    error,
    domains,
    currentDomain,
    fieldConfigs,
    currentFieldConfig,
    loadDomains,
    loadDomainDetail,
    loadFieldConfig,
    findDomainBySlug,
    findDomainById,
    setCurrentDomain
  }
})
