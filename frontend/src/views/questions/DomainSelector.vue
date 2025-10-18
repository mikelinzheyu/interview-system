<template>
  <div class="domain-selector-page">
    <div class="background-blur" aria-hidden="true" />

    <header class="page-header">
      <span class="page-eyebrow">学习路径引导</span>
      <h1>选择学习领域</h1>
      <p>挑选感兴趣的专业方向，系统化掌握核心知识与实战能力。</p>
    </header>

    <el-alert
      v-if="error"
      type="error"
      :closable="false"
      class="error-banner"
      title="领域数据加载失败，请稍后重试"
    />

    <div class="page-layout" :class="{ 'is-loading': isInitialLoading }">
      <div class="layout-sidebar">
        <DomainSidebar
          :domains="domains"
          :loading="isInitialLoading"
          :selected-slug="selectedSlug"
          @select="handleSelectDomain"
        />
      </div>

      <div class="layout-hero">
        <DomainHeroCard
          :domain="activeDomain"
          :stats="statsForHero"
          :progress="derivedProgress"
          :highlights="highlightChips"
          :loading="isInitialLoading"
          @enter="handleEnterDomain"
        />
      </div>

      <div class="layout-panel">
        <DomainRecommendationPanel
          :recommended="recommendedDomains"
          :progress="derivedProgress"
          :suggestions="suggestionList"
          :loading="panelLoading"
          @select="handleSelectDomain"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDomainStore } from '@/stores/domain'
import DomainSidebar from './components/DomainSidebar.vue'
import DomainHeroCard from './components/DomainHeroCard.vue'
import DomainRecommendationPanel from './components/DomainRecommendationPanel.vue'

const router = useRouter()
const domainStore = useDomainStore()

const {
  loading,
  error,
  domains,
  currentDomain,
  recommendedDomains,
  derivedProgress,
  domainHighlights,
  recommendedLoading,
  progressLoading
} = storeToRefs(domainStore)

const selectedSlug = ref('')

const activeDomain = computed(() => currentDomain.value || null)

const statsForHero = computed(() => {
  const domain = activeDomain.value
  if (!domain) {
    return {}
  }

  const stats = domain.stats || {}

  return {
    easy: toNumber(stats.easyCount),
    medium: toNumber(stats.mediumCount),
    hard: toNumber(stats.hardCount),
    total: toNumber(domain.questionCount ?? stats.totalCount)
  }
})

const highlightChips = computed(() => domainHighlights.value || [])

const suggestionList = computed(() => {
  const domain = activeDomain.value
  if (!domain) {
    return []
  }

  const candidates = [domain.suggestions, domain.learningRecommendations, domain.recommendedTopics, highlightChips.value]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate.filter(Boolean).slice(0, 5)
    }
  }

  if (domain.description) {
    return [domain.description]
  }

  return []
})

const isInitialLoading = computed(() => loading.value && !domains.value.length)

const panelLoading = computed(() => {
  return isInitialLoading.value || recommendedLoading.value || progressLoading.value
})

onMounted(async () => {
  if (!domains.value.length) {
    try {
      await domainStore.loadDomains()
    } catch (err) {
      console.error('Failed to load domains:', err)
    }
  }

  domainStore.loadRecommendedDomains().catch(err => {
    console.warn('Failed to prefetch recommended domains:', err)
  })

  if (currentDomain.value) {
    selectedSlug.value = currentDomain.value.slug || String(currentDomain.value.id || '')
    domainStore.loadUserProgress(currentDomain.value).catch(err => {
      console.warn('Failed to prefetch user progress:', err)
    })
  }
})

watch(
  () => currentDomain.value,
  value => {
    if (!value) {
      selectedSlug.value = ''
      return
    }

    selectedSlug.value = value.slug || String(value.id || '')

    domainStore.loadUserProgress(value).catch(err => {
      console.warn('Failed to load user progress:', err)
    })
  },
  { immediate: true }
)

function handleSelectDomain(domain) {
  if (!domain) {
    return
  }

  selectedSlug.value = domain.slug || String(domain.id || '')
  domainStore.setCurrentDomain(domain)
  domainStore.loadUserProgress(domain).catch(err => {
    console.warn('Failed to load user progress after selection:', err)
  })
}

function handleEnterDomain(domain) {
  if (!domain) {
    return
  }

  domainStore.setCurrentDomain(domain)
  domainStore.loadUserProgress(domain).catch(err => {
    console.warn('Failed to refresh user progress before entering domain:', err)
  })

  const target = domain.slug || domain.id
  if (!target) {
    return
  }

  router.push({
    name: 'QuestionBankPage',
    params: { domainSlug: target }
  })
}

function toNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}
</script>

<style scoped>
.domain-selector-page {
  position: relative;
  padding: 48px clamp(16px, 6vw, 64px) 64px;
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 45%),
    linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%);
  overflow: hidden;
}

.background-blur {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 20% 15%, rgba(59, 130, 246, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.12), transparent 60%);
  filter: blur(40px);
  opacity: 0.7;
  z-index: 0;
}

.page-header {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-eyebrow {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #3b82f6;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 42px);
  font-weight: 700;
  color: #0f172a;
}

.page-header p {
  margin: 0;
  color: #475569;
  font-size: 16px;
}

.error-banner {
  margin: 0 auto 24px;
  max-width: 960px;
}

.page-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  gap: 28px;
  align-items: start;
}

.layout-sidebar,
.layout-hero,
.layout-panel {
  min-width: 0;
}

.page-layout.is-loading {
  opacity: 0.75;
}

@media (max-width: 1440px) {
  .page-layout {
    grid-template-columns: 260px minmax(0, 1fr) 260px;
    gap: 24px;
  }
}

@media (max-width: 1280px) {
  .page-layout {
    grid-template-columns: 260px minmax(0, 1fr);
    grid-template-areas:
      'sidebar hero'
      'sidebar panel';
  }

  .layout-sidebar {
    grid-area: sidebar;
  }

  .layout-hero {
    grid-area: hero;
  }

  .layout-panel {
    grid-area: panel;
  }
}

@media (max-width: 1024px) {
  .page-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'hero' 'panel' 'sidebar';
  }

  .layout-sidebar {
    order: 3;
  }

  .layout-panel {
    order: 2;
  }

  .layout-hero {
    order: 1;
  }
}

@media (max-width: 640px) {
  .domain-selector-page {
    padding: 32px 16px 48px;
  }

  .page-header {
    margin-bottom: 28px;
  }
}
</style>
