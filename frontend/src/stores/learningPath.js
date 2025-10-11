import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

export const useLearningPathStore = defineStore('learningPath', () => {
  const loading = ref(false)
  const error = ref(null)

  const paths = ref([])
  const currentPath = ref(null)
  const userEnrollments = ref([])

  // 获取学习路径列表
  async function fetchPaths(params = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/learning-paths', { params })
      const data = response.data || {}
      paths.value = data.items || []
      return paths.value
    } catch (err) {
      error.value = err
      console.error('加载学习路径列表失败:', err)
      ElMessage.error('学习路径列表加载失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取学习路径详情
  async function fetchPathDetail(idOrSlug) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/learning-paths/${idOrSlug}`)
      const data = response.data || {}
      currentPath.value = data
      return data
    } catch (err) {
      error.value = err
      console.error('加载学习路径详情失败:', err)
      ElMessage.error('学习路径详情加载失败')
      throw err
    } finally {
      loading.value = false
    }
  }

  // 报名学习路径
  async function enrollPath(pathId) {
    try {
      const response = await api.post(`/learning-paths/${pathId}/enroll`)
      const enrollment = response.data || {}

      // 更新本地状态
      if (!userEnrollments.value.find(e => e.pathId === pathId)) {
        userEnrollments.value.push(enrollment)
      }

      // 更新当前路径的用户进度
      if (currentPath.value && currentPath.value.id === pathId) {
        currentPath.value.userProgress = enrollment
      }

      ElMessage.success('报名成功！开始学习吧')
      return enrollment
    } catch (err) {
      console.error('报名失败:', err)
      ElMessage.error(err?.response?.data?.message || '报名失败')
      throw err
    }
  }

  // 完成模块
  async function completeModule(pathId, moduleId) {
    try {
      const response = await api.put(
        `/learning-paths/${pathId}/modules/${moduleId}/complete`
      )
      const updatedProgress = response.data || {}

      // 更新用户报名记录
      const enrollment = userEnrollments.value.find(e => e.pathId === pathId)
      if (enrollment) {
        Object.assign(enrollment, updatedProgress)
      }

      // 更新当前路径进度
      if (currentPath.value && currentPath.value.id === pathId) {
        currentPath.value.userProgress = updatedProgress
      }

      ElMessage.success('模块完成！继续加油')
      return updatedProgress
    } catch (err) {
      console.error('更新进度失败:', err)
      ElMessage.error('更新进度失败')
      throw err
    }
  }

  // 检查用户是否已报名某路径
  function isEnrolled(pathId) {
    return userEnrollments.value.some(e => e.pathId === pathId)
  }

  // 获取用户在某路径的进度
  function getUserProgress(pathId) {
    return userEnrollments.value.find(e => e.pathId === pathId)
  }

  return {
    loading,
    error,
    paths,
    currentPath,
    userEnrollments,
    fetchPaths,
    fetchPathDetail,
    enrollPath,
    completeModule,
    isEnrolled,
    getUserProgress
  }
})
