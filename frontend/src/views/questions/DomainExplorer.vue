<template>
  <div class="domain-explorer-page">
    <div class="background-blur" aria-hidden="true" />

    <header class="page-header">
      <span class="page-eyebrow">学习路径引导</span>
      <h1>按学科层级探索</h1>
      <p>从学科门类 → 专业类 → 专业逐级选择，精准进入目标领域</p>
    </header>

    <el-alert
      v-if="error"
      type="error"
      :closable="false"
      class="error-banner"
      title="数据加载失败，请稍后重试"
    />

    <div class="page-layout" :class="{ 'is-loading': isInitialLoading }">
      <div class="layout-sidebar">
        <AcademicTreeSidebar
          :loading="isInitialLoading"
          :selected-slug="selectedSlug"
          @select="handleSelectSlug"
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
        <KnowledgeGraph v-if="activeDomain?.slug" :slug="activeDomain.slug" />
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAcademicStore } from '@/stores/academic'
import { useDomainStore } from '@/stores/domain'
import AcademicTreeSidebar from './components/AcademicTreeSidebar.vue'
import DomainHeroCard from './components/DomainHeroCard.vue'
import DomainRecommendationPanel from './components/DomainRecommendationPanel.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'

const router = useRouter()
const academic = useAcademicStore()
const domainStore = useDomainStore()

const { loading, error, domains, currentDomain, recommendedDomains, derivedProgress, domainHighlights, recommendedLoading, progressLoading } = storeToRefs(domainStore)

const selectedSlug = ref('')

const activeDomain = computed(() => currentDomain.value || null)

const statsForHero = computed(() => {
  const domain = activeDomain.value
  if (!domain) return {}
  const stats = domain.stats || {}
  return {
    easy: toNumber(stats.easyCount ?? stats.easy),
    medium: toNumber(stats.mediumCount ?? stats.medium),
    hard: toNumber(stats.hardCount ?? stats.hard),
    total: toNumber(domain.questionCount ?? stats.totalCount ?? stats.total)
  }
})

const highlightChips = computed(() => domainHighlights.value || [])

const suggestionList = computed(() => {
  const domain = activeDomain.value
  if (!domain) return []
  const candidates = [domain.suggestions, domain.learningRecommendations, domain.recommendedTopics, highlightChips.value]
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c.filter(Boolean).slice(0, 5)
  }
  if (domain.description) return [domain.description]
  return []
})

const isInitialLoading = computed(() => loading.value && !domains.value.length)
const panelLoading = computed(() => isInitialLoading.value || recommendedLoading.value || progressLoading.value)

onMounted(async () => {
  await Promise.all([
    academic.load(),
    domains.value.length ? null : domainStore.loadDomains()
  ])

  if (!currentDomain.value) {
    const first = academic.majorsFlat.find(m => domainStore.findDomainBySlug(m.slug))
    if (first) {
      const d = domainStore.findDomainBySlug(first.slug)
      if (d) {
        domainStore.setCurrentDomain(d)
        selectedSlug.value = d.slug
      }
    } else if (domains.value.length) {
      domainStore.setCurrentDomain(domains.value[0])
      selectedSlug.value = domains.value[0].slug
    }
  } else {
    selectedSlug.value = currentDomain.value.slug
  }
})

function toNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : 0 }

function handleSelectSlug(slug) {
  const d = domainStore.findDomainBySlug(slug)
  if (d) {
    domainStore.setCurrentDomain(d)
    selectedSlug.value = slug
  }
}

function handleSelectDomain(domain) {
  if (domain?.slug) handleSelectSlug(domain.slug)
}

function handleEnterDomain() {
  const slug = currentDomain.value?.slug
  if (slug) router.push({ name: 'QuestionBankPage', params: { domainSlug: slug } })
}
</script>

<style scoped>
.domain-explorer-page { position: relative; padding: 48px 24px 72px; }
.background-blur { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 20% 15%, rgba(59, 130, 246, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.12), transparent 60%); filter: blur(40px); opacity: 0.7; z-index: 0; }
.page-header { position: relative; z-index: 1; text-align: center; margin-bottom: 40px; display: flex; flex-direction: column; gap: 12px; }
.page-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase; color: #3b82f6; }
.page-header h1 { margin: 0; font-size: clamp(28px, 5vw, 40px); font-weight: 800; color: #0f172a; }
.page-header p { margin: 0; color: #475569; font-size: 16px; }
.error-banner { margin: 0 auto 24px; max-width: 960px; }
.page-layout { position: relative; z-index: 1; display: grid; grid-template-columns: 320px minmax(0, 1fr) 280px; gap: 28px; align-items: start; }
.layout-sidebar, .layout-hero, .layout-panel { min-width: 0; }
.page-layout.is-loading { opacity: 0.75; }
@media (max-width: 1440px) { .page-layout { grid-template-columns: 280px minmax(0, 1fr) 260px; gap: 24px; } }
@media (max-width: 1280px) { .page-layout { grid-template-columns: 260px minmax(0, 1fr); grid-template-areas: 'sidebar hero' 'sidebar panel'; } .layout-sidebar { grid-area: sidebar; } .layout-hero { grid-area: hero; } .layout-panel { grid-area: panel; } }
@media (max-width: 1024px) { .page-layout { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'hero' 'panel' 'sidebar'; } .layout-sidebar { order: 3; } .layout-panel { order: 2; } .layout-hero { order: 1; } .domain-explorer-page { padding: 32px 16px 48px; } .page-header { margin-bottom: 28px; } }
</style>

