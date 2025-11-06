<template>
  <div class="learning-hub-dashboard">
    <header class="hub-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="logo-icon">🎓</span>
          <h1 class="logo-text">学习中心</h1>
        </div>
        <CommandPalette
          :domains="domainStore.domains"
          :categories="hierarchicalCategories"
          @search="handleSearch"
          @navigate="handleNavigate"
        />
        <div class="header-actions">
          <!-- 题库导航菜单 -->
          <el-dropdown @command="handleNavigationCommand">
            <el-button text>
              更多功能
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="learning-paths">
                  📚 学习路径
                </el-dropdown-item>
                <el-dropdown-item command="learning-hub">
                  🏠 返回首页
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" divided command="admin-create">
                  ➕ 创建新题目
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin-manage">
                  📝 题目管理
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button text :icon="CircleCheck" @click="showMyProgress = true">
            <span>学习进度</span>
          </el-button>
          <el-button text :icon="Star" @click="showFavorites = true">
            <span>我的收藏</span>
          </el-button>
        </div>
      </div>
    </header>

    <main class="hub-main">
      <!-- 关键路径：推荐 + 继续学习（首屏必显） -->
      <section v-if="!currentDomain && showRecommendation" class="hub-section hub-section--critical">
        <RecommendedForYouSection
          :recommended-domains="recommendedDomains"
          :continue-card="continueStudyCard"
          :loading="loading || recommendedLoading"
          @select-domain="handleSelectDomain"
          @continue-learning="continueLearning"
        />
      </section>

      <!-- 次要路径：分类浏览（lazy 加载） -->
      <section v-if="!currentDomain && showDisciplineExplorer" class="hub-section">
        <DisciplineExplorerSection
          :categories="hierarchicalCategories"
          :loading="hierarchicalLoading"
          @select-domain="handleSelectDomain"
          @select-category="handleSelectCategory"
        />
      </section>

      <!-- 详情路径：领域详情 -->
      <section v-if="currentDomain" class="hub-section">
        <DomainDetailSection
          :domain="currentDomain"
          :progress="domainProgress"
          :preview-questions="domainPreviewQuestions"
          :loading="detailLoading"
          @back="backToDisciplines"
          @start-learning="continueLearning"
          @view-question="openQuestionFromPreview"
        />
      </section>
    </main>

    <el-drawer v-model="showMyProgress" title="学习进度" size="40%">
      <MyProgressPanel
        :loading="analyticsLoading"
        :summary="progressSummary"
        :recent-items="recentLearningItems"
        :goals="learningGoalsList"
      />
    </el-drawer>

    <el-drawer v-model="showFavorites" title="我的收藏" size="40%">
      <MyFavoritesPanel
        :items="favoriteItems"
        :loading="favoritesLoading"
        @continue="handleFavoriteContinue"
        @remove="handleFavoriteRemove"
        @view="handleFavoriteView"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { CircleCheck, Star, ArrowDown } from '@element-plus/icons-vue'
import CommandPalette from '@/views/questions/components/CommandPalette.vue'
import RecommendedForYouSection from '@/views/questions/components/RecommendedForYouSection.vue'
import DisciplineExplorerSection from '@/views/questions/components/DisciplineExplorerSection.vue'
import DomainDetailSection from '@/views/questions/components/DomainDetailSection.vue'
import MyProgressPanel from '@/views/questions/components/MyProgressPanel.vue'
import MyFavoritesPanel from '@/views/questions/components/MyFavoritesPanel.vue'
import { useDomainStore } from '@/stores/domain'
import { useQuestionBankStore } from '@/stores/questions'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const domainStore = useDomainStore()
const questionStore = useQuestionBankStore()
const userStore = useUserStore()

const {
  analyticsLoading,
  learningGoals,
  activities,
  collectionItems,
  progressMetrics,
  progressCache
} = storeToRefs(domainStore)
const { summary } = storeToRefs(questionStore)

const currentDomain = ref(null)
const showRecommendation = ref(true)
const showDisciplineExplorer = ref(false) // 延迟加载
const showMyProgress = ref(false)
const showFavorites = ref(false)
const loading = ref(false)
const hierarchicalLoading = ref(false)
const detailLoading = ref(false)

const recommendedLoading = computed(() => domainStore.recommendedLoading)
const recommendedDomains = computed(() => domainStore.recommendedDomains)
const hierarchicalCategories = computed(() => domainStore.hierarchicalDomains)

const domainProgress = computed(() => {
  if (!currentDomain.value) return null
  const key = currentDomain.value.slug || currentDomain.value.id
  if (key && progressCache.value?.[key]) {
    return progressCache.value[key]
  }
  if (currentDomain.value.progress) {
    return currentDomain.value.progress
  }
  return domainStore.derivedProgress
})

const domainPreviewQuestions = computed(() => {
  if (!currentDomain.value) return []
  return questionStore.list.slice(0, 4)
})

const continueStudyCard = computed(() => {
  if (currentDomain.value) {
    return buildContinueCard(currentDomain.value)
  }

  const inProgressIds = domainStore.userProfile?.inProgressDomains || []
  if (inProgressIds.length) {
    const domain = domainStore.findDomainById(inProgressIds[0])
    if (domain) {
      return buildContinueCard(domain)
    }
  }

  if (recommendedDomains.value.length) {
    return buildContinueCard(recommendedDomains.value[0])
  }

  return null
})

const favoriteItems = computed(() => {
  const source =
    Array.isArray(collectionItems.value) && collectionItems.value.length
      ? collectionItems.value
      : domainStore.domains.filter(domain => domain.isFavorited)

  return source.map(item => {
    const domain = item.rawDomain || item
    const progress = resolveDomainProgress(domain)
    return {
      id: domain.id ?? item.id,
      name: domain.name || '未命名学科',
      icon: domain.icon || '📘',
      category: domain.category || domain.discipline || '综合',
      questionCount: domain.questionCount ?? domain.stats?.total ?? 0,
      progress: Math.min(100, Math.round(progress || 0)),
      lastAccessed: formatActivityTimestamp(item.lastAccessed || item.lastActivity),
      rawDomain: domain
    }
  })
})

const favoritesLoading = computed(() => domainStore.loading && !favoriteItems.value.length)

const recentLearningItems = computed(() => {
  const activityList = activities.value ? [...activities.value] : []
  if (!activityList.length) return []

  return activityList
    .slice(-5)
    .reverse()
    .map((activity, index) => {
      const domain =
        domainStore.findDomainById(activity.domainId) ||
        domainStore.domains.find(item => item.id === activity.domainId)
      const name = domain?.name || '未知领域'
      const progress =
        activity.metrics?.completion ??
        resolveDomainProgress(domain) ??
        (activity.metrics?.questionsAttempted || 0) * 2

      return {
        id: `${activity.domainId || 'recent'}-${index}`,
        name,
        date: formatActivityTimestamp(activity.timestamp),
        progress: Math.min(100, Math.round(progress || 0))
      }
    })
})

const progressSummary = computed(() => {
  const summaryData = summary.value || {}
  const activityList = activities.value || []

  const domainsTracked = favoriteItems.value.length || domainStore.domains.length
  const questionsFromSummary =
    summaryData.completedQuestions ??
    summaryData.questionsCompleted ??
    summaryData.totalAnswered ??
    summaryData.totalAttempted ??
    summaryData.total ??
    0

  const questionsFromActivities = activityList.reduce(
    (total, activity) => total + (activity.metrics?.questionsAttempted || 0),
    0
  )
  const totalQuestions = questionsFromSummary || questionsFromActivities

  const correctFromActivities = activityList.reduce(
    (total, activity) => total + (activity.metrics?.questionsCorrect || 0),
    0
  )

  const accuracyFromSummary = summaryData.accuracy ?? summaryData.correctRate
  const accuracy =
    accuracyFromSummary != null
      ? Math.round(Number(accuracyFromSummary))
      : totalQuestions
        ? Math.round((correctFromActivities / totalQuestions) * 100)
        : 0

  const streakValue =
    progressMetrics.value?.streak ??
    progressMetrics.value?.longestStreak ??
    summaryData.streak ??
    0

  return {
    domainsTracked,
    questionsCompleted: totalQuestions,
    accuracy,
    streak: streakValue
  }
})

const learningGoalsList = computed(() => {
  const goals = learningGoals.value
  const result = []

  if (Array.isArray(goals)) {
    return goals.map(goal => ({
      id: goal.id,
      name: goal.name,
      description: goal.description,
      completed: goal.completed ?? 0,
      total: goal.total ?? 1,
      status: goal.status || 'on-track',
      statusLabel: goal.statusLabel || '进行中'
    }))
  }

  if (!goals || typeof goals !== 'object') {
    return result
  }

  if (goals.domainsToComplete) {
    const completed = favoriteItems.value.length
    const total = goals.domainsToComplete
    result.push({
      id: 'domains',
      name: '完成领域数量',
      description: '系统化完成指定数量的学习领域',
      completed,
      total,
      status: completed >= total ? 'completed' : 'on-track'
    })
  }

  if (goals.targetAccuracy) {
    const target = goals.targetAccuracy
    const current = progressSummary.value.accuracy || 0
    result.push({
      id: 'accuracy',
      name: '目标正确率',
      description: '保持练习正确率达到目标值',
      completed: current,
      total: 100,
      status: current >= target ? 'completed' : current >= target * 0.7 ? 'on-track' : 'at-risk'
    })
  }

  if (goals.dailyHours) {
    const targetHours = goals.dailyHours
    const average = calculateAverageStudyHours(activities.value || [])
    result.push({
      id: 'daily-hours',
      name: '每日学习时间',
      description: '坚持每日学习时长计划',
      completed: Math.min(targetHours, Math.round(average)),
      total: targetHours,
      status: average >= targetHours ? 'completed' : average >= targetHours * 0.7 ? 'on-track' : 'at-risk'
    })
  }

  return result
})

onMounted(async () => {
  loading.value = true
  try {
    // 第一阶段：加载关键数据
    await domainStore.loadDomains({ selectFirst: false })
    await domainStore.loadRecommendedDomains()

    if (!questionStore.list.length) {
      await questionStore.initialize()
    }

    // 第二阶段：加载次要数据（延迟到下一个 tick，不阻塞首屏）
    setTimeout(() => {
      loadHierarchicalDomains()
      showDisciplineExplorer.value = true
    }, 100)

  } catch (error) {
    console.error('Failed to initialize learning hub', error)
    ElMessage.error('学习中心数据加载失败，请稍后重试')
  } finally {
    loading.value = false
  }

  // 第三阶段：加载分析数据
  setTimeout(() => {
    domainStore.loadActivities()
    domainStore.loadLearningGoals()
  }, 500)
})

async function loadHierarchicalDomains() {
  hierarchicalLoading.value = true
  try {
    await domainStore.loadHierarchicalDomains()
  } finally {
    hierarchicalLoading.value = false
  }
}

function buildContinueCard(domain) {
  if (!domain) return null
  const progress = resolveDomainProgress(domain)
  const stats = domain.stats || {}
  return {
    name: domain.name,
    description: domain.shortDescription || domain.description || '该领域包含系统化的知识体系，适合阶段性提升',
    progress: Math.min(100, Math.round(progress || 0)),
    completedTopics: stats.completedTopics ?? progress,
    questionsAnswered: stats.attempts ?? stats.completed ?? '--',
    accuracy: stats.accuracy ?? stats.correctRate ?? '--',
    color: domain.color,
    rawDomain: domain
  }
}

function resolveDomainProgress(domain) {
  if (!domain) return 0
  const key = domain.slug || domain.id
  if (key && progressCache.value?.[key]) {
    return progressCache.value[key]?.completion ?? 0
  }
  if (domain.progress?.completion != null) {
    return domain.progress.completion
  }
  return 0
}

function formatActivityTimestamp(value) {
  if (!value) return '最近'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '最近'
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function calculateAverageStudyHours(activityList) {
  if (!activityList.length) return 0
  const totalMinutes = activityList.reduce(
    (sum, activity) => sum + (activity.metrics?.timeSpent || activity.timeSpent || 0),
    0
  )
  if (!totalMinutes) return 0
  const days = new Set(
    activityList.map(activity => {
      const date = new Date(activity.timestamp)
      return Number.isNaN(date.getTime()) ? null : date.toDateString()
    }).filter(Boolean)
  )
  const divisor = days.size || 1
  return totalMinutes / 60 / divisor
}

async function handleSelectDomain(domain) {
  if (!domain) return
  detailLoading.value = true
  try {
    const resolved = domainStore.findDomainById(domain.id) || domain
    currentDomain.value = resolved
    showRecommendation.value = false
    domainStore.setCurrentDomain(resolved)

    await Promise.all([
      domainStore.loadFieldConfig(resolved.id),
      domainStore.loadUserProgress(resolved),
      questionStore.initializeWithDomain(resolved.id)
    ])
  } catch (error) {
    console.error('Failed to load domain detail', error)
    ElMessage.error('加载领域数据失败，请稍后重试')
  } finally {
    detailLoading.value = false
  }
}

function handleSelectCategory(category) {
  if (!category) return
  const children = category.children || category.items || []
  if (children.length) {
    handleSelectDomain(children[0])
  }
}

function backToDisciplines() {
  currentDomain.value = null
  showRecommendation.value = true
}

async function continueLearning(domain) {
  const target = domain || currentDomain.value
  if (!target) return

  try {
    if (target.id && questionStore.filters.domainId !== target.id) {
      await questionStore.initializeWithDomain(target.id)
    }
  } catch (error) {
    console.warn('Failed to sync question list for domain', error)
  }

  const slug = target.slug || target.id
  router.push({ name: 'QuestionBankPage', params: { domainSlug: slug } })
}

function openQuestionFromPreview(question) {
  if (!question?.id) {
    continueLearning(currentDomain.value)
    return
  }
  router.push({
    name: 'QuestionBankPage',
    params: { domainSlug: currentDomain.value?.slug || currentDomain.value?.id },
    query: { questionId: question.id }
  })
}

function handleFavoriteContinue(item) {
  continueLearning(item.rawDomain || domainStore.findDomainById(item.id) || item)
  showFavorites.value = false
}

function handleFavoriteRemove(id) {
  domainStore.removeLikedDomain(id)
  if (Array.isArray(collectionItems.value)) {
    collectionItems.value = collectionItems.value.filter(
      entry => (entry.id ?? entry.domainId) !== id
    )
  }
  const match = domainStore.findDomainById(id)
  if (match) {
    match.isFavorited = false
  }
  ElMessage.success('已取消收藏')
}

function handleFavoriteView(item) {
  handleSelectDomain(item.rawDomain || item)
  showFavorites.value = false
}

async function handleSearch(keyword) {
  const value = (keyword || '').trim()
  if (!value) return
  questionStore.setKeyword(value)
  await questionStore.applyFilters({ resetPage: true })
  router.push({ name: 'QuestionBankPage' })
}

function handleNavigate(payload) {
  if (!payload) return
  if (payload.type === 'domain') {
    handleSelectDomain(payload.payload)
    continueLearning(payload.payload)
  } else if (payload.type === 'category') {
    handleSelectCategory(payload.payload)
    continueLearning(payload.payload)
  } else if (payload.type === 'command') {
    switch (payload.id) {
      case 'hot':
        // 热门领域 - 在当前 LearningHub 页面已有展示，无需跳转
        window.scrollTo({ top: 0, behavior: 'smooth' })
        break
      case 'favorites':
        showFavorites.value = true
        break
      case 'progress':
        showMyProgress.value = true
        break
      default:
        break
    }
  }
}

// 处理导航菜单命令
function handleNavigationCommand(command) {
  switch (command) {
    case 'learning-paths':
      router.push({ name: 'LearningPathList' })
      break
    case 'learning-hub':
      router.push({ name: 'LearningHub' })
      break
    case 'admin-create':
      router.push({ name: 'QuestionCreate' })
      break
    case 'admin-manage':
      router.push({ name: 'QuestionCreate' })
      break
    default:
      ElMessage.info('功能开发中...')
  }
}
</script>

<style scoped lang="scss">
.learning-hub-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e1f5ff 100%);
}

.hub-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e5e7eb;

.header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;

    @media (max-width: 1024px) {
      padding: 12px 20px;
      gap: 16px;
    }

    @media (max-width: 768px) {
      flex-wrap: wrap;
      padding: 12px 16px;
      gap: 12px;
    }

    @media (max-width: 480px) {
      padding: 10px 12px;
    }
  }
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  .logo-icon {
    font-size: 28px;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    white-space: nowrap;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    order: 3;
  }
}

.hub-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  @media (max-width: 1024px) {
    padding: 32px 20px;
    gap: 28px;
  }

  @media (max-width: 768px) {
    padding: 24px 16px;
    gap: 20px;
  }

  @media (max-width: 480px) {
    padding: 16px 12px;
    gap: 16px;
  }
}

.hub-section {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);

  @media (max-width: 1024px) {
    border-radius: 16px;
    padding: 28px;
  }

  @media (max-width: 768px) {
    border-radius: 16px;
    padding: 20px;
  }

  @media (max-width: 480px) {
    border-radius: 12px;
    padding: 16px;
  }
}

/* 关键路径优先渲染 */
.hub-section--critical {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 全局按钮改进 */
.learning-hub-dashboard :deep(.el-button) {
  transition: all 0.2s ease;

  &.is-plain {
    &:hover {
      background-color: rgba(59, 130, 246, 0.08);
      border-color: #3b82f6;
    }
  }

  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
}

/* Drawer过渡动画 */
.learning-hub-dashboard :deep(.el-drawer) {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
