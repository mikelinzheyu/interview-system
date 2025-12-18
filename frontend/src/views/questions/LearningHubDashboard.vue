<template>
  <div class="learning-hub-dashboard">
    <!-- 顶部导航栏 -->
    <header class="hub-header">
      <div class="header-inner">
        <div class="header-left">
          <div class="brand">
            <span class="brand-icon">🎓</span>
            <h1 class="brand-text">{{ t('learning.hubTitle') }}</h1>
          </div>
        </div>

        <div class="header-center">
          <EnhancedSearchInput
            :domains="domainStore.domains"
            :categories="hierarchicalCategories"
            :questions="questionStore.list"
            @search="handleSearch"
            @select="handleSearchSelect"
            @navigate="handleNavigate"
            class="main-search-bar"
          />
        </div>

        <div class="header-right">
          <el-tooltip content="我的进度" placement="bottom">
            <el-button circle class="icon-btn" @click="showMyProgress = true">
              <el-icon><DataLine /></el-icon>
            </el-button>
          </el-tooltip>
          
          <el-tooltip content="我的收藏" placement="bottom">
            <el-button circle class="icon-btn" @click="showFavorites = true">
              <el-icon><Star /></el-icon>
            </el-button>
          </el-tooltip>

          <el-dropdown trigger="click" @command="handleNavigationCommand">
            <el-button circle class="icon-btn">
              <el-icon><Grid /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="custom-dropdown">
                <el-dropdown-item command="learning-paths">
                  <el-icon><Reading /></el-icon> {{ t('learning.paths') }}
                </el-dropdown-item>
                <el-dropdown-item command="recommendations">
                  <el-icon><Compass /></el-icon> 推荐探索
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" divided command="admin-create">
                  <el-icon><Plus /></el-icon> {{ t('learning.createQuestion') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="hub-main">
      <!-- 欢迎区域 -->
      <section class="welcome-section" v-if="!currentDomain">
        <div class="welcome-text">
          <h2>{{ getGreeting() }}, {{ userStore.user?.nickname || userStore.user?.username || '同学' }} 👋</h2>
          <p>准备好开始今天的学习了吗？</p>
        </div>
        <div class="quick-stats" v-if="progressSummary">
          <div class="stat-item">
            <span class="stat-value">{{ progressSummary.todayCount || 0 }}</span>
            <span class="stat-label">今日刷题</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ progressSummary.totalDays || 0 }}</span>
            <span class="stat-label">坚持天数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ progressSummary.accuracy || 0 }}%</span>
            <span class="stat-label">正确率</span>
          </div>
        </div>
      </section>

      <!-- 推荐与继续学习区域 -->
      <section v-if="!currentDomain && showRecommendation" class="content-section">
        <RecommendedForYouSection
          :recommended-domains="recommendedDomains"
          :continue-card="continueStudyCard"
          :loading="loading || recommendedLoading"
          @select-domain="handleSelectDomain"
          @continue-learning="continueLearning"
        />
      </section>

      <!-- 学科探索区域 -->
      <section v-if="!currentDomain && showDisciplineExplorer" class="content-section">
        <DisciplineExplorerSection
          :categories="hierarchicalCategories"
          :loading="hierarchicalLoading"
          @select-domain="handleSelectDomain"
          @select-category="handleSelectCategory"
        />
      </section>

      <!-- 特定领域详情 -->
      <section v-if="currentDomain" class="content-section domain-view">
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

    <!-- 侧边抽屉 -->
    <el-drawer 
      v-model="showMyProgress" 
      :title="t('learning.progress')" 
      size="400px"
      class="custom-drawer"
    >
      <MyProgressPanel
        :loading="analyticsLoading"
        :summary="progressSummary"
        :recent-items="recentLearningItems"
        :goals="learningGoalsList"
      />
    </el-drawer>

    <el-drawer 
      v-model="showFavorites" 
      :title="t('learning.favorites')" 
      size="400px"
      class="custom-drawer"
    >
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
import { DataLine, Star, Grid, Reading, Plus, Compass } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'

import RecommendedForYouSection from '@/views/questions/components/RecommendedForYouSection.vue'
import DisciplineExplorerSection from '@/views/questions/components/DisciplineExplorerSection.vue'
import DomainDetailSection from '@/views/questions/components/DomainDetailSection.vue'
import MyProgressPanel from '@/views/questions/components/MyProgressPanel.vue'
import MyFavoritesPanel from '@/views/questions/components/MyFavoritesPanel.vue'
import EnhancedSearchInput from '@/views/questions/components/EnhancedSearchInput.vue'

import { useDomainStore } from '@/stores/domain'
import { useQuestionBankStore } from '@/stores/questions'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const router = useRouter()
const domainStore = useDomainStore()
const questionStore = useQuestionBankStore()
const userStore = useUserStore()

const { analyticsLoading, activities, collectionItems, progressCache, learningGoals } = storeToRefs(domainStore)
const { summary } = storeToRefs(questionStore)

const currentDomain = ref(null)
const showRecommendation = ref(true)
const showDisciplineExplorer = ref(false)
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
  if (key && progressCache.value?.[key]) return progressCache.value[key]
  return currentDomain.value.progress || domainStore.derivedProgress
})

const domainPreviewQuestions = computed(() => {
  if (!currentDomain.value) return []
  return questionStore.list.slice(0, 4)
})

const continueStudyCard = computed(() => {
  if (currentDomain.value) return buildContinueCard(currentDomain.value)
  const inProgressIds = domainStore.userProfile?.inProgressDomains || []
  if (inProgressIds.length) {
    const d = domainStore.findDomainById(inProgressIds[0])
    if (d) return buildContinueCard(d)
  }
  if (recommendedDomains.value.length) return buildContinueCard(recommendedDomains.value[0])
  return null
})

const favoriteItems = computed(() => {
  const source = Array.isArray(collectionItems.value) && collectionItems.value.length
    ? collectionItems.value
    : domainStore.domains.filter((d) => d.isFavorited)
  return source.map((item) => {
    const domain = item.rawDomain || item
    const progress = resolveDomainProgress(domain)
    return {
      id: domain.id ?? item.id,
      name: domain.name || t('learning.unnamedDomain'),
      icon: domain.icon || '📘',
      category: domain.category || domain.discipline || t('learning.mixed'),
      questionCount: domain.questionCount ?? domain.stats?.total ?? 0,
      progress: Math.min(100, Math.round(progress || 0)),
      lastAccessed: formatActivityTimestamp(item.lastAccessed || item.lastActivity),
      rawDomain: domain,
    }
  })
})

const favoritesLoading = computed(() => domainStore.loading && !favoriteItems.value.length)

const recentLearningItems = computed(() => {
  const activityList = activities.value ? [...activities.value] : []
  if (!activityList.length) return []
  return activityList.slice(-5).reverse().map((activity, i) => {
    const domain = domainStore.findDomainById(activity.domainId) || domainStore.domains.find((d) => d.id === activity.domainId)
    const name = domain?.name || t('common.unknown')
    const progress = activity.metrics?.completion ?? resolveDomainProgress(domain) ?? (activity.metrics?.questionsAttempted || 0) * 2
    return {
      id: `${activity.domainId || 'recent'}-${i}`,
      name,
      date: formatActivityTimestamp(activity.timestamp),
      progress: Math.min(100, Math.round(progress || 0)),
    }
  })
})

const progressSummary = computed(() => summary.value || {})

const learningGoalsList = computed(() => {
  const goals = learningGoals.value || {}
  const stats = summary.value || {}
  const items = []

  if (goals.domainsToComplete) {
    items.push({
      id: 'domains',
      name: '完成学科',
      description: '目标学科数',
      completed: stats.completedDomains || stats.domainsTracked || 0,
      total: goals.domainsToComplete
    })
  }

  if (goals.targetAccuracy) {
    items.push({
      id: 'accuracy',
      name: '正确率',
      description: '目标正确率',
      completed: stats.accuracy || stats.overallAccuracy || 0,
      total: goals.targetAccuracy
    })
  }
  return items
})

onMounted(async () => {
  loading.value = true
  try {
    await userStore.fetchUserInfo()
    await domainStore.loadDomains({ selectFirst: false })
    await domainStore.loadRecommendedDomains()
    if (!questionStore.list.length) await questionStore.initialize()
    setTimeout(() => {
      loadHierarchicalDomains()
      showDisciplineExplorer.value = true
    }, 100)
  } catch (e) {
    console.error('Failed to initialize learning hub', e)
    ElMessage.error(t('learning.loadError'))
  } finally {
    loading.value = false
  }
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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function buildContinueCard(domain) {
  if (!domain) return null
  const progress = resolveDomainProgress(domain)
  const stats = domain.stats || {}
  return {
    name: domain.name,
    description: domain.shortDescription || domain.description || t('learning.domainDefaultDesc'),
    progress: Math.min(100, Math.round(progress || 0)),
    completedTopics: stats.completedTopics ?? progress,
    questionsAnswered: stats.attempts ?? stats.completed ?? '--',
    accuracy: stats.accuracy ?? stats.correctRate ?? '--',
    color: domain.color,
    rawDomain: domain,
  }
}

function resolveDomainProgress(domain) {
  if (!domain) return 0
  const key = domain.slug || domain.id
  if (key && progressCache.value?.[key]) return progressCache.value[key]?.completion ?? 0
  if (domain.progress?.completion != null) return domain.progress.completion
  return 0
}

function formatActivityTimestamp(value) {
  if (!value) return t('common.unknown')
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return t('common.unknown')
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

function handleSelectDomain(domain) {
  currentDomain.value = domain
  loadQuestionsForDomain(domain)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function loadQuestionsForDomain(domain) {
  if (!domain) return
  const domainId = domain.id || domain.slug
  if (!domainId) return
  detailLoading.value = true
  try {
    questionStore.setDomain(domainId)
    await questionStore.loadQuestions({ domainId, page: 1, size: 20 })
  } catch (e) {
    console.error('加载领域题目失败', e)
    ElMessage.error('加载题目失败，请重试')
  } finally {
    detailLoading.value = false
  }
}

function backToDisciplines() {
  currentDomain.value = null
  questionStore.setDomain(null)
}

function continueLearning(domain) {
  if (!domain) return
  let slug = domain.slug || domain.id
  if (!domain.slug && domain.id) {
    const found = domainStore.findDomainById?.(domain.id)
    if (found?.slug) slug = found.slug
  }
  if (slug) router.push({ name: 'QuestionBankPage', params: { domainSlug: String(slug) } })
}

function openQuestionFromPreview(question) {
  if (!question) return
  router.push({ name: 'QuestionBankPage', params: { domainSlug: currentDomain.value?.slug || 'all' }, query: { questionId: question.id } })
}

function handleFavoriteContinue(item) {
  continueLearning(item.rawDomain || domainStore.findDomainById(item.id) || item)
  showFavorites.value = false
}

function handleFavoriteRemove(id) {
  domainStore.removeLikedDomain(id)
  if (Array.isArray(collectionItems.value)) {
    collectionItems.value = collectionItems.value.filter((entry) => (entry.id ?? entry.domainId) !== id)
  }
  const match = domainStore.findDomainById(id)
  if (match) match.isFavorited = false
  ElMessage.success(t('learning.unfavoriteSuccess'))
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
  router.push({ name: 'QuestionBankPage', params: { domainSlug: currentDomain.value?.slug || 'all' } })
}

function resolveDomainSlugFromQuestion(q) {
  if (!q || typeof q !== 'object') return currentDomain.value?.slug || 'all'
  const directSlug = q.domainSlug || q.domain_slug || q.domain?.slug
  if (directSlug) return directSlug
  const domainId = q.domainId ?? q.domain_id ?? q.domain?.id
  if (domainId != null) {
    const found = domainStore.findDomainById?.(domainId)
    if (found?.slug) return found.slug
  }
  return currentDomain.value?.slug || 'all'
}

function handleSearchSelect(payload) {
  if (!payload) return
  const { type, payload: data } = payload
  switch (type) {
    case 'question':
      router.push({
        name: 'QuestionBankPage',
        params: { domainSlug: resolveDomainSlugFromQuestion(data) },
        query: { questionId: data.id || data.questionId || data.uid }
      })
      break
    case 'domain':
      handleSelectDomain(data)
      continueLearning(data)
      break
    case 'category':
      handleSelectCategory(data)
      break
    case 'tag':
      try {
        if (questionStore.resetFilters) questionStore.resetFilters()
        if (questionStore.toggleFilterValue) {
          questionStore.toggleFilterValue('tags', data.id)
        } else if (questionStore.filters?.tags) {
          const k = data.id
          if (!questionStore.filters.tags.includes(k)) questionStore.filters.tags.push(k)
        }
        questionStore.applyFilters?.({ resetPage: true })
      } catch (e) {
        console.error('Failed to apply tag filter:', e)
      }
      router.push({ name: 'QuestionBankPage', params: { domainSlug: currentDomain.value?.slug || 'all' } })
      break
  }
}

function handleNavigate(payload) {
  if (!payload) return
  if (payload.type === 'domain') {
    handleSelectDomain(payload.payload)
    continueLearning(payload.payload)
  } else if (payload.type === 'category') {
    handleSelectCategory(payload.payload)
    continueLearning(payload.payload)
  } else if (payload.type === 'question') {
    const q = payload.payload || {}
    router.push({
      name: 'QuestionBankPage',
      params: { domainSlug: resolveDomainSlugFromQuestion(q) },
      query: { questionId: q.id || q.questionId || q.uid }
    })
  } else if (payload.type === 'recommend') {
    const title = payload.title || ''
    if (title) {
      try {
        questionStore.setKeyword(title)
        questionStore.applyFilters({ resetPage: true })
      } catch {}
    }
    router.push({ name: 'QuestionBankPage', params: { domainSlug: currentDomain.value?.slug || 'all' } })
  }
}

function handleSelectCategory(category) {
  currentDomain.value = domainStore.createDomainFromCategory?.(category) || null
}

function handleNavigationCommand(command) {
  switch (command) {
    case 'learning-paths':
      router.push({ name: 'LearningPathList' })
      break
    case 'recommendations':
      router.push({ name: 'RecommendationHub' })
      break
    case 'admin-create':
      router.push({ name: 'QuestionCreate' })
      break
  }
}
</script>

<style scoped lang="scss">
.learning-hub-dashboard {
  min-height: 100vh;
  background-color: #f9fafb;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Header Styles */
.hub-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  height: 64px;
  display: flex;
  align-items: center;

  .header-inner {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  .brand-icon {
    font-size: 24px;
  }
  .brand-text {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin: 0;
    white-space: nowrap;
  }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
}

.main-search-bar {
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;

  .icon-btn {
    border: none;
    background-color: #f3f4f6;
    color: #4b5563;
    transition: all 0.2s;
    font-size: 16px;
    width: 36px;
    height: 36px;

    &:hover {
      background-color: #e5e7eb;
      color: #111827;
    }
  }
}

/* Main Content Styles */
.hub-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

.welcome-text {
  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
  }
  p {
    color: #6b7280;
    margin: 0;
    font-size: 16px;
  }
}

.quick-stats {
  display: flex;
  gap: 32px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #2563eb;
  }

  .stat-label {
    font-size: 12px;
    color: #6b7280;
  }
}

.content-section {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Domain View Specifics */
.domain-view {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}
</style>