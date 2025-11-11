/**
 * useAuth - 认证和权限管理组合式函数
 */
import { computed, ref, inject, isRef } from 'vue'

export function useAuth() {
  // 从全局状态或 Pinia 获取当前用户
  // 这里我们假设通过 inject 获取（或改用 Pinia）
  const injectedUser = inject('currentUser', null)
  const currentUser = isRef(injectedUser)
    ? injectedUser
    : ref(injectedUser || {
    id: null,
    role: 'guest',
    isAdmin: false
  })

  /**
   * 检查用户是否登录
   */
  const isLoggedIn = computed(() => !!currentUser.value?.id)

  /**
   * 检查用户是否是管理员
   */
  const isAdmin = computed(() => currentUser.value?.isAdmin || false)

  /**
   * 检查用户是否有特定权限
   */
  const hasPermission = (permission) => {
    if (isAdmin.value) return true

    const permissions = currentUser.value?.permissions || []
    return permissions.includes(permission)
  }

  /**
   * 检查是否可以编辑资源
   */
  const canEdit = (resource) => {
    if (!isLoggedIn.value) return false
    if (isAdmin.value) return true
    if (resource.author?.userId === currentUser.value?.id) return true
    return false
  }

  /**
   * 检查是否可以删除资源
   */
  const canDelete = (resource) => {
    if (!isLoggedIn.value) return false
    if (isAdmin.value) return true
    if (resource.author?.userId === currentUser.value?.id) return true
    return false
  }

  /**
   * 检查是否可以审核内容
   */
  const canModerate = () => {
    return isAdmin.value || hasPermission('moderate_content')
  }

  /**
   * 检查是否可以访问管理面板
   */
  const canAccessAdmin = () => {
    return isAdmin.value
  }

  /**
   * 更新当前用户
   */
  const setCurrentUser = (user) => {
    currentUser.value = user
  }

  return {
    // 状态
    currentUser,

    // 计算属性
    isLoggedIn,
    isAdmin,

    // 方法
    hasPermission,
    canEdit,
    canDelete,
    canModerate,
    canAccessAdmin,
    setCurrentUser
  }
}
