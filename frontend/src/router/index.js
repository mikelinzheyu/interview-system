import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  // 根路由：条件重定向 - 已认证用户重定向到 /dashboard，未认证用户访问营销页面
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/marketing/Landing.vue'),
    meta: { requiresAuth: false }
  },

  // 用户仪表板 - 主页面（替代 /home）
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/home/Homepage.vue'),
    meta: { requiresAuth: false }
  },

  // 认证相关路由
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

  // 传统首页（已弃用，保留兼容性）
  {
    path: '/home-legacy',
    name: 'HomeLegacy',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/questions',
    name: 'QuestionBankRoot',
    redirect: '/learning-hub',
    meta: { requiresAuth: true }
  },

  // 学习中心（首页仪表板）
  {
    path: '/learning-hub',
    name: 'LearningHub',
    component: () => import('@/views/questions/LearningHubDashboard.vue'),
    meta: {
      requiresAuth: true,
      title: '学习中心',
      description: '题库、推荐题目、学习进度'
    }
  },

  // 搜索引擎风格页面
  {
    path: '/search',
    name: 'SearchHub',
    component: () => import('@/views/questions/LearningHubPage.vue'),
    meta: {
      requiresAuth: true,
      title: '搜索',
      description: '搜索题目和知识点'
    }
  },

  // 题库页面（具体学科/专业的题目列表）
  {
    path: '/learning-hub/:domainSlug',
    name: 'QuestionBankPage',
    component: () => import('@/views/questions/QuestionBankPage.vue'),
    meta: {
      requiresAuth: true,
      title: '题库',
      description: '查看特定学科的题目'
    },
    props: true
  },

  // 学习路径列表
  {
    path: '/learning-paths',
    name: 'LearningPathList',
    component: () => import('@/views/learning/LearningPathList.vue'),
    meta: {
      requiresAuth: true,
      title: '学习路径',
      description: '查看推荐的学习路径'
    }
  },

  // 学习路径详情
  {
    path: '/learning-paths/:pathSlug',
    name: 'LearningPathDetail',
    component: () => import('@/views/learning/LearningPathDetail.vue'),
    meta: {
      requiresAuth: true,
      title: '学习路径详情',
      description: '查看学习路径的详细信息'
    },
    props: true
  },

  // ========== 题目管理（管理员） ==========
  // 创建新题目
  {
    path: '/admin/questions/new',
    name: 'QuestionCreate',
    component: () => import('@/views/admin/QuestionEditor.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: '创建题目',
      description: '创建新的考试题目'
    }
  },

  // 编辑题目
  {
    path: '/admin/questions/:id/edit',
    name: 'QuestionEdit',
    component: () => import('@/views/admin/QuestionEditor.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: '编辑题目',
      description: '编辑已有的考试题目'
    },
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
    component: () => import('@/views/community/NewPostDetail.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/community/create-post',
    name: 'CreatePost',
    component: () => import('@/views/community/CreatePost.vue'),
    meta: { requiresAuth: true }
  },

  // 通知中心
  {
    path: '/notifications',
    name: 'NotificationCenter',
    component: () => import('@/views/community/components/NotificationCenter.vue'),
    meta: { requiresAuth: true }
  },

  // Phase 2: 实时聊天
  {
    path: '/chat',
    name: 'ChatList',
    component: () => import('@/views/chat/ChatList.vue'),
    meta: { requiresAuth: true }
  },
  // Temporary safe chat room while ChatRoom.vue is under repair
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

  // Phase 6: 私信系统
  {
    path: '/messages',
    name: 'MessageList',
    component: () => import('@/views/messages/MessageList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/:userId',
    name: 'Conversation',
    component: () => import('@/views/messages/ConversationPage.vue'),
    meta: { requiresAuth: true },
    props: true
  },

  // Phase 2.1: 错题集管理
  {
    path: '/wrong-answers',
    name: 'WrongAnswers',
    component: () => import('@/views/chat/WrongAnswersPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wrong-answers/:recordId',
    name: 'WrongAnswerDetail',
    component: () => import('@/views/chat/WrongAnswerReviewRoom.vue'),
    meta: { requiresAuth: true },
    props: true
  },

  // Phase 3: 分析仪表板和高级功能
  {
    path: '/wrong-answers/analytics/dashboard',
    name: 'AnalyticsDashboard',
    component: () => import('@/views/chat/AnalyticsDashboard.vue'),
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
    path: '/contributions/upload',
    name: 'UploadResource',
    component: () => import('@/views/contributions/UploadResource.vue'),
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

  // Phase 4: AI推荐系统
  {
    path: '/recommendations',
    name: 'RecommendationHub',
    component: () => import('@/views/recommendations/RecommendationPage.vue'),
    meta: { requiresAuth: false }
  },

  // Phase 4: 综合职业规划系统
  {
    path: '/career-planning',
    name: 'CareerPlanningHub',
    component: () => import('@/views/CareerPlanningHub.vue'),
    meta: { requiresAuth: false }
  },

  // Phase 5: 职业生态系统
  {
    path: '/ecosystem',
    name: 'EcosystemHub',
    component: () => import('@/views/EcosystemHub.vue'),
    meta: { requiresAuth: false }
  },

  // Pricing Page
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('@/views/pricing/PricingPage.vue'),
    meta: { requiresAuth: false }
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
  const isAdmin = userStore.isAdmin

  // 日志：路由导航开始
  console.log(`[Router Guard] Navigation: ${from.path} → ${to.path}`, {
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest,
    requiresAdmin: to.meta.requiresAdmin,
    isAuthenticated,
    isAdmin,
    hasToken: !!userStore.token
  })

  // 已认证用户访问根路由 "/"，重定向到仪表板
  if (to.path === '/' && isAuthenticated) {
    console.log('[Router Guard] Authenticated user accessing /, redirecting to /dashboard')
    next('/dashboard')
    return
  }

  // 检查认证要求
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.warn(`[Router Guard] Access denied: ${to.path} requires authentication but user not authenticated`)
    console.warn('[Router Guard] Redirecting to /login')
    next('/login')
    return
  }

  // 检查管理员权限
  if (to.meta.requiresAdmin && !isAdmin) {
    console.warn(`[Router Guard] Access denied: ${to.path} requires admin privileges`)
    next('/dashboard')
    return
  }

  // 检查访客限制（登录/注册页面）
  if (to.meta.requiresGuest && isAuthenticated) {
    console.log(`[Router Guard] Authenticated user accessing guest-only page ${to.path}, redirecting to /dashboard`)
    next('/dashboard')
    return
  }

  console.log(`[Router Guard] Navigation allowed: ${to.path}`)
  next()
})

export default router

