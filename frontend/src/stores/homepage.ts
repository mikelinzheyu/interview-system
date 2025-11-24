import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useHomepageStore = defineStore('homepage', () => {
  // State
  const activeMenu = ref('overview')
  const sidebarOpen = ref(true)
  const showLoginModal = ref(false)
  const showSignupModal = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Menu items
  const menuItems = ref([
    { id: 'overview', label: '总览' },
    { id: 'simulate', label: '模拟面试' },
    { id: 'learning', label: '学习中心' },
    { id: 'errors', label: '错题本' },
    { id: 'analysis', label: '分析' },
    { id: 'community', label: '社区' }
  ])

  // Getters
  const getActiveMenuLabel = computed(() => {
    const menu = menuItems.value.find(m => m.id === activeMenu.value)
    return menu?.label || '总览'
  })

  const isSidebarVisible = computed(() => sidebarOpen.value)

  // Actions
  const setActiveMenu = (menuId: string) => {
    activeMenu.value = menuId
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const openSidebar = () => {
    sidebarOpen.value = true
  }

  const closeSidebar = () => {
    sidebarOpen.value = false
  }

  const openLoginModal = () => {
    showLoginModal.value = true
    showSignupModal.value = false
  }

  const closeLoginModal = () => {
    showLoginModal.value = false
  }

  const openSignupModal = () => {
    showSignupModal.value = true
    showLoginModal.value = false
  }

  const closeSignupModal = () => {
    showSignupModal.value = false
  }

  const switchToSignup = () => {
    showLoginModal.value = false
    showSignupModal.value = true
  }

  const switchToLogin = () => {
    showSignupModal.value = false
    showLoginModal.value = true
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    activeMenu.value = 'overview'
    sidebarOpen.value = false
    showLoginModal.value = false
    showSignupModal.value = false
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    activeMenu,
    sidebarOpen,
    showLoginModal,
    showSignupModal,
    isLoading,
    error,
    menuItems,

    // Getters
    getActiveMenuLabel,
    isSidebarVisible,

    // Actions
    setActiveMenu,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    openLoginModal,
    closeLoginModal,
    openSignupModal,
    closeSignupModal,
    switchToSignup,
    switchToLogin,
    setLoading,
    setError,
    clearError,
    reset
  }
})
