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
    path: '/auth/callback/:provider',
    name: 'OAuthCallback',
    component: () => import('@/views/auth/OAuthCallback.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/questions',
    name: 'QuestionBankRoot',
    redirect: '/questions/domains',
    meta: { requiresAuth: true }
  },
  {
    path: '/questions/domains',
    name: 'DomainSelector',
    component: () => import('@/views/questions/DomainSelector.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/questions/:domainSlug',
    name: 'QuestionBankPage',
    component: () => import('@/views/questions/QuestionBankPage.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/learning-paths',
    name: 'LearningPathList',
    component: () => import('@/views/learning/LearningPathList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/learning-paths/:pathSlug',
    name: 'LearningPathDetail',
    component: () => import('@/views/learning/LearningPathDetail.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/admin/questions/new',
    name: 'QuestionCreate',
    component: () => import('@/views/admin/QuestionEditor.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/questions/:id/edit',
    name: 'QuestionEdit',
    component: () => import('@/views/admin/QuestionEditor.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    props: true
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
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/UserSettings.vue'),
    meta: { requiresAuth: true }
  },

  // Phase 3.1: 社区贡献系统
  {
    path: '/community',
    name: 'CommunityHub',
    component: () => import('@/views/contributions/CommunityHub.vue'),
    meta: { requiresAuth: true }
  },
  // 社区论坛
  {
    path: '/community/forums',
    name: 'ForumList',
    component: () => import('@/views/community/ForumList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/community/forums/:slug',
    name: 'ForumPosts',
    component: () => import('@/views/community/PostList.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/community/posts',
    name: 'PostList',
    component: () => import('@/views/community/PostList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/community/posts/:id',
    name: 'PostDetail',
    component: () => import('@/views/community/PostDetail.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/community/create-post',
    name: 'CreatePost',
    component: () => import('@/views/community/CreatePost.vue'),
    meta: { requiresAuth: true }
  },

  // Phase 2: 实时聊天
  {
    path: '/chat',
    name: 'ChatList',
    component: () => import('@/views/chat/ChatList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/room/:roomId',
    name: 'ChatRoom',
    component: () => import('@/views/chat/ChatRoom.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/chat/search',
    name: 'ChatSearch',
    component: () => import('@/views/chat/ChatSearch.vue'),
    meta: { requiresAuth: true }
  },

  // Phase 3: 关注系统
  {
    path: '/community/follow-list',
    name: 'FollowList',
    component: () => import('@/views/community/FollowList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/community/leaderboard',
    name: 'CommunityLeaderboard',
    component: () => import('@/views/community/Leaderboard.vue'),
    meta: { requiresAuth: true }
  },

  {
    path: '/contributions/submit',
    name: 'SubmitQuestion',
    component: () => import('@/views/contributions/SubmitQuestion.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contributions/my-submissions',
    name: 'MySubmissions',
    component: () => import('@/views/contributions/MySubmissions.vue'),
    meta: { requiresAuth: true }
  },
  // {
  //   path: '/contributions/submissions/:id',
  //   name: 'SubmissionDetail',
  //   component: () => import('@/views/contributions/SubmissionDetail.vue'),
  //   meta: { requiresAuth: true },
  //   props: true
  // },
  {
    path: '/contributions/review-queue',
    name: 'ReviewQueue',
    component: () => import('@/views/contributions/ReviewQueue.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contributions/profile/:userId',
    name: 'ContributorProfile',
    component: () => import('@/views/contributions/ContributorProfile.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/contributions/leaderboard',
    name: 'ContributionLeaderboard',
    component: () => import('@/views/contributions/Leaderboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contributions/question/:id',
    name: 'QuestionDetail',
    component: () => import('@/views/contributions/QuestionDetail.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/contributions/favorites',
    name: 'MyFavorites',
    component: () => import('@/views/contributions/MyFavorites.vue'),
    meta: { requiresAuth: true }
  },

  // Phase 3.2: 跨专业能力分析
  {
    path: '/ability/profile',
    name: 'AbilityProfile',
    component: () => import('@/views/ability/AbilityProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ability/leaderboard',
    name: 'TShapeLeaderboard',
    component: () => import('@/views/ability/TShapeLeaderboard.vue'),
    meta: { requiresAuth: true }
  },

  // Phase 3.3: AI 自动出题
  {
    path: '/ai/generate',
    name: 'GenerateQuestions',
    component: () => import('@/views/ai/GenerateQuestions.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ai/smart-generator',
    name: 'SmartQuestionGenerator',
    component: () => import('@/views/ai/SmartQuestionGenerator.vue'),
    meta: { requiresAuth: true }
  },
  // {
  //   path: '/ai/history',
  //   name: 'GenerationHistory',
  //   component: () => import('@/views/ai/GenerationHistory.vue'),
  //   meta: { requiresAuth: true }
  // },
  // {
  //   path: '/ai/review/:id',
  //   name: 'ReviewGenerated',
  //   component: () => import('@/views/ai/ReviewGenerated.vue'),
  //   meta: { requiresAuth: true },
  //   props: true
  // },
  // {
  //   path: '/ai/config',
  //   name: 'AIConfig',
  //   component: () => import('@/views/ai/AIConfig.vue'),
  //   meta: { requiresAuth: true }
  // }
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