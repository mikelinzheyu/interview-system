<template>
  <aside class="domain-sidebar">
    <header class="sidebar-header">
      <div class="sidebar-title">
        <span class="title">探索领域</span>
        <el-tag v-if="domains.length" size="small" effect="plain">{{ domains.length }}</el-tag>
      </div>
      <el-input
        v-model="search"
        class="sidebar-search"
        placeholder="搜索领域"
        clearable
        size="small"
        :prefix-icon="Search"
      />
    </header>

    <section class="sidebar-body">
      <el-skeleton v-if="loading" animated :rows="8" class="sidebar-skeleton" />

      <el-scrollbar v-else class="sidebar-scroll">
        <template v-if="filteredDomains.length">
          <ul class="domain-list">
            <li
              v-for="domain in filteredDomains"
              :key="domain.id || domain.slug"
              class="domain-item"
              :class="{ active: domain.slug === selectedSlug }"
              role="button"
              tabindex="0"
              @click="handleSelect(domain)"
              @keyup.enter="handleSelect(domain)"
            >
              <div class="indicator" aria-hidden="true" />
              <div class="item-content">
                <div class="item-title">
                  <span v-if="domain.icon" class="icon">{{ domain.icon }}</span>
                  <span class="name">{{ domain.name }}</span>
                </div>
                <p v-if="domainSummary(domain)" class="description">{{ domainSummary(domain) }}</p>
              </div>
              <el-tooltip v-if="showTooltip(domain)" :content="tooltipContent(domain)" placement="left">
                <el-icon class="meta-icon">
                  <CollectionTag />
                </el-icon>
              </el-tooltip>
            </li>
          </ul>
        </template>
        <div v-else class="empty-result">
          <el-empty description="鏈壘鍒板尮閰嶇殑棰嗗煙" :image-size="120" />
        </div>
      </el-scrollbar>
    </section>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Search, CollectionTag } from '@element-plus/icons-vue'

const props = defineProps({
  domains: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedSlug: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select'])

const search = ref('')

const filteredDomains = computed(() => {
  if (!search.value) {
    return props.domains
  }

  const keyword = search.value.trim().toLowerCase()
  if (!keyword) {
    return props.domains
  }

  return props.domains.filter(domain => {
    const name = String(domain.name || '').toLowerCase()
    const description = String(domain.description || '').toLowerCase()
    const tags = Array.isArray(domain.tags) ? domain.tags.join(' ') : ''
    return [name, description, tags.toLowerCase()].some(text => text.includes(keyword))
  })
})

function handleSelect(domain) {
  emit('select', domain)
}

function showTooltip(domain) {
  return Boolean(domain.questionCount || domain.categoryCount)
}

function domainSummary(domain) {
  if (!domain) {
    return ''
  }

  return domain.shortDescription || domain.description || ''
}

function tooltipContent(domain) {
  const parts = []
  if (domain.questionCount) {
    parts.push(`棰樼洰 ${domain.questionCount}`)
  }

  if (domain.categoryCount) {
    parts.push(`鍒嗙被 ${domain.categoryCount}`)
  }

  return parts.join(' 路 ')
}
</script>

<style scoped>
.domain-sidebar {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.92) 0%, rgba(30, 41, 59, 0.85) 100%);
  color: #fff;
  border-radius: 24px;
  padding: 20px 18px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(18px);
  height: clamp(480px, 74vh, 680px);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 12px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.sidebar-search :deep(.el-input__wrapper) {
  background: rgba(148, 163, 184, 0.16);
  border-color: transparent;
  color: #e2e8f0;
}

.sidebar-search :deep(.el-input__inner) {
  color: inherit;
}

.sidebar-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar-scroll {
  height: 100%;
  max-height: 100%;
  padding-right: 4px;
}
.sidebar-scroll :deep(.el-scrollbar__wrap) {
  max-height: 100%;
}

.sidebar-scroll :deep(.el-scrollbar__view) {
  width: 100%;
}

.domain-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.domain-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px 12px 12px;
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.12);
  cursor: pointer;
  transition: all 0.25s ease;
}

.domain-item:hover,
.domain-item:focus-visible {
  background: rgba(148, 163, 184, 0.22);
  outline: none;
}

.domain-item.active {
  background: rgba(14, 165, 233, 0.22);
  box-shadow: 0 12px 30px rgba(14, 165, 233, 0.32);
}

.domain-item.active .indicator {
  opacity: 1;
  transform: translateX(0);
}

.indicator {
  width: 4px;
  height: 30px;
  border-radius: 999px;
  background: linear-gradient(180deg, #22d3ee 0%, #3b82f6 100%);
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.3s ease;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
}

.description {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.68);
  line-height: 1.5;
}

.icon {
  font-size: 18px;
}

.meta-icon {
  color: rgba(148, 163, 184, 0.8);
}

.empty-result {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

@media (max-width: 1024px) {
  .domain-sidebar {
    height: auto;
    min-height: auto;
    max-height: none;
    overflow: visible;
    padding: 16px;
  }

  .domain-item {
    padding: 10px 12px 10px 10px;
  }
}
</style>






