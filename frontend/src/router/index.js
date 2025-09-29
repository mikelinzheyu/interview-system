import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/interview',
    name: 'Interview',
    component: () => import('@/views/interview/InterviewSession.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/interview/new',
    name: 'NewInterview',
    component: () => import('@/views/interview/AIInterviewPrep.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/interview/ai',
    name: 'AIInterview',
    component: () => import('@/views/interview/AIInterviewSession.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/test',
    name: 'ModuleTest',
    component: () => import('@/views/test/ModuleTestPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: () => import('@/views/achievements/AchievementsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/achievements/categories/:categoryId',
    name: 'AchievementCategory',
    component: () => import('@/views/achievements/AchievementCategoryPage.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/achievements/detail/:achievementId',
    name: 'AchievementDetail',
    component: () => import('@/views/achievements/AchievementDetailPage.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/achievements/progress',
    name: 'AchievementProgress',
    component: () => import('@/views/achievements/AchievementProgressPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = userStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/home')
  } else {
    next()
  }
})

export default router