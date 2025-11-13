<template>
  <div class="learning-hub-dashboard">
    <header class="hub-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="logo-icon">🎓</span>
          <h1 class="logo-text">{{ t('learning.hubTitle') }}</h1>
        </div>

        <CommandPalette
          v-show="false"
          :domains="domainStore.domains"
          :categories="hierarchicalCategories"
          :questions="questionStore.list"
          @search="handleSearch"
          @navigate="handleNavigate"
          @filter="handleAdvancedFilter"
        />

        <!-- 居中头部搜索框：放在"学习中心"和"更多功能"之间 -->
        <div class="header-search">
          <EnhancedSearchInput
            :domains="domainStore.domains"
            :categories="hierarchicalCategories"
            :questions="questionStore.list"
            @search="handleSearch"
            @select="handleSearchSelect"
            @navigate="handleNavigate"
          />
        </div>

        <div class="header-actions">
          <el-dropdown @command="handleNavigationCommand">
            <el-button text>
              {{ t('learning.moreActions') }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="learning-paths">📚 {{ t('learning.paths') }}</el-dropdown-item>
                <el-dropdown-item command="learning-hub">🏠 {{ t('learning.home') }}</el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" divided command="admin-create">➕ {{ t('learning.createQuestion') }}</el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin-manage">📝 {{ t('learning.manageQuestions') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button text :icon="CircleCheck" @click="showMyProgress = true">
            <span>{{ t('learning.progress') }}</span>
          </el-button>
          <el-button text :icon="Star" @click="showFavorites = true">
            <span>{{ t('learning.favorites') }}</span>
          </el-button>
        </div>
      </div>
    </header>

    <main class="hub-main">
      <section v-if="!currentDomain && showRecommendation" class="hub-section hub-section--critical">
        <RecommendedForYouSection
          :recommended-domains="recommendedDomains"
          :continue-card="continueStudyCard"
          :loading="loading || recommendedLoading"
          @select-domain="handleSelectDomain"
          @continue-learning="continueLearning"
        />
      </section>

      <section v-if="!currentDomain && showDisciplineExplorer" class="hub-section">
        <DisciplineExplorerSection
          :categories="hierarchicalCategories"
          :loading="hierarchicalLoading"
          @select-domain="handleSelectDomain"
          @select-category="handleSelectCategory"
        />
      </section>

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

    <el-drawer v-model="showMyProgress" :title="t('learning.progress')" size="40%">
      <MyProgressPanel
        :loading="analyticsLoading"
        :summary="progressSummary"
        :recent-items="recentLearningItems"
        :goals="learningGoalsList"
      />
    </el-drawer>

    <el-drawer v-model="showFavorites" :title="t('learning.favorites')" size="40%">
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { CircleCheck, Star, ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'

import CommandPalette from '@/views/questions/components/CommandPalette.vue'
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

const { analyticsLoading, activities, collectionItems, progressCache } = storeToRefs(domainStore)
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
  // questionStore.list 已经被按 domainId 过滤，只需取前4个
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

onMounted(async () => {
  loading.value = true
  try {
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
  // 加载该领域的题目
  loadQuestionsForDomain(domain)
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
  // 重置题目过滤
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
      // 导航到题目详情
      router.push({
        name: 'QuestionBankPage',
        params: { domainSlug: resolveDomainSlugFromQuestion(data) },
        query: { questionId: data.id || data.questionId || data.uid }
      })
      break
    case 'domain':
      // 选择领域
      handleSelectDomain(data)
      continueLearning(data)
      break
    case 'category':
      // 选择分类
      handleSelectCategory(data)
      break
    case 'tag':
      // 应用标签筛选
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
    default:
      break
  }
}

function handleAdvancedFilter(filters) {
  // 应用高级过滤条件
  if (filters.difficulty && filters.difficulty.length) {
    questionStore.filters.difficulty = filters.difficulty
  }
  if (filters.type && filters.type.length) {
    questionStore.filters.type = filters.type
  }
  if (filters.tags && filters.tags.length) {
    questionStore.filters.tags = filters.tags
  }
  // 应用并导航到题库页面
  questionStore.applyFilters({ resetPage: true }).then(() => {
    router.push({ name: 'QuestionBankPage', params: { domainSlug: currentDomain.value?.slug || 'all' } })
  })
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
    // 搜索到题目后，导航到题库页面并显示该题目详情
    router.push({
      name: 'QuestionBankPage',
      params: { domainSlug: resolveDomainSlugFromQuestion(q) },
      query: { questionId: q.id || q.questionId || q.uid }
    })
  } else if (payload.type === 'tag') {
    try {
      if (questionStore.resetFilters) questionStore.resetFilters()
      if (questionStore.toggleFilterValue) {
        questionStore.toggleFilterValue('tags', payload.id)
      } else if (questionStore.filters?.tags) {
        const k = payload.id
        if (!questionStore.filters.tags.includes(k)) questionStore.filters.tags.push(k)
      }
      questionStore.applyFilters?.({ resetPage: true })
    } catch {}
    router.push({ name: 'QuestionBankPage', params: { domainSlug: currentDomain.value?.slug || 'all' } })
  } else if (payload.type === 'command') {
    switch (payload.id) {
      case 'hot':
        window.scrollTo({ top: 0, behavior: 'smooth' })
        break
      case 'favorites':
        showFavorites.value = true
        break
      case 'progress':
        showMyProgress.value = true
        break
      case 'create':
        router.push({ name: 'QuestionCreate' })
        break
      default:
        break
    }
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
      ElMessage.info(t('learning.moreActions'))
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
    max-width: 1500px;
    margin: 0 auto;
    padding: 12px 24px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 24px;
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
}

.header-search {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  max-width: 1500px;
}

.hub-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hub-section {
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
}

.hub-section--critical {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.learning-hub-dashboard :deep(.el-drawer) {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
