<template>
  <div class="learning-hub-dashboard">
    <header class="hub-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="logo-icon">🎓</span>
          <h1 class="logo-text">{{ t('learning.hubTitle') }}</h1>
        </div>

        <CommandPalette
          :domains="domainStore.domains"
          :categories="hierarchicalCategories"
          @search="handleSearch"
          @navigate="handleNavigate"
        />

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
import { computed, onMounted, ref } from 'vue'
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
}

function backToDisciplines() {
  currentDomain.value = null
}

function continueLearning(domain) {
  if (!domain) return
  const slug = domain.slug || domain.id
  if (slug) router.push({ name: 'QuestionBankPage', params: { domainSlug: slug } })
}

function openQuestionFromPreview(question) {
  if (!question) return
  router.push({ name: 'QuestionBankPage', query: { questionId: question.id } })
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
  } else if (payload.type === 'question') {
    const q = payload.payload || {}
    router.push({ name: 'QuestionBankPage', query: { questionId: q.id || q.questionId || q.uid } })
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
    router.push({ name: 'QuestionBankPage' })
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
      default:
        break
    }
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
    max-width: 1400px;
    margin: 0 auto;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
