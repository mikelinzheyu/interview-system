<template>
  <aside class="domain-sidebar">
    <!-- 搜索头部 -->
    <header class="sidebar-header">
      <div class="sidebar-title">
        <h3 class="title">探索领域</h3>
        <el-tag v-if="domains.length" size="small" type="info" effect="plain">{{ domains.length }}</el-tag>
      </div>

      <!-- 增强搜索框 -->
      <div class="search-wrapper">
        <el-input
          v-model="searchQuery"
          class="sidebar-search"
          placeholder="搜索领域、拼音..."
          clearable
          size="default"
          :prefix-icon="Search"
          @input="handleSearchInput"
          @focus="showSuggestions = true"
          @blur="closeSuggestions"
        />
        <!-- 搜索建议下拉 -->
        <div v-if="showSuggestions && suggestions.length" class="search-suggestions">
          <div v-for="item in suggestions" :key="item" class="suggestion-item" @click="selectSuggestion(item)">
            <span class="suggestion-text">{{ item }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 分组列表 -->
    <section class="sidebar-body">
      <el-skeleton v-if="loading" animated :rows="8" class="sidebar-skeleton" />

      <el-scrollbar v-else class="sidebar-scroll">
        <!-- 搜索结果 -->
        <div v-if="searchQuery.trim()" class="search-results">
          <template v-if="filteredDomains.length">
            <ul class="domain-list">
              <li
                v-for="domain in filteredDomains"
                :key="`${domain.id}-${domain.slug}`"
                class="domain-item"
                :class="{ active: domain.slug === selectedSlug }"
                role="button"
                tabindex="0"
                @click="selectDomain(domain)"
                @keyup.enter="selectDomain(domain)"
              >
                <div class="indicator" />
                <div class="item-content">
                  <div class="item-title">
                    <span v-if="domain.icon" class="icon">{{ domain.icon }}</span>
                    <span class="name">{{ domain.name }}</span>
                  </div>
                  <p v-if="domain.shortDescription" class="description">{{ domain.shortDescription }}</p>
                </div>
              </li>
            </ul>
          </template>
          <div v-else class="empty-result">
            <el-empty description="未找到匹配的领域" :image-size="100" />
          </div>
        </div>

        <!-- 分组列表视图 -->
        <div v-else class="grouped-list">
          <template v-if="groupedDomains.length">
            <div v-for="group in groupedDomains" :key="group.category" class="domain-group">
              <div class="group-header">
                <h4 class="group-title">{{ group.category }}</h4>
                <el-tag size="small" effect="plain">{{ group.count }}</el-tag>
              </div>
              <ul class="domain-list">
                <li
                  v-for="domain in group.domains"
                  :key="`${domain.id}-${domain.slug}`"
                  class="domain-item"
                  :class="{ active: domain.slug === selectedSlug }"
                  role="button"
                  tabindex="0"
                  @click="selectDomain(domain)"
                  @keyup.enter="selectDomain(domain)"
                >
                  <div class="indicator" />
                  <div class="item-content">
                    <div class="item-title">
                      <span v-if="domain.icon" class="icon">{{ domain.icon }}</span>
                      <span class="name">{{ domain.name }}</span>
                    </div>
                    <p v-if="domain.shortDescription" class="description">{{ domain.shortDescription }}</p>
                  </div>
                </li>
              </ul>
            </div>
          </template>
          <div v-else class="empty-result">
            <el-empty description="暂无领域数据" :image-size="100" />
          </div>
        </div>
      </el-scrollbar>
    </section>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { searchDomainsWithRanking, getSuggestions } from '@/services/domainSearchService'

const props = defineProps({
  domains: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  selectedSlug: { type: String, default: '' }
})

const emit = defineEmits(['select'])

const searchQuery = ref('')
const showSuggestions = ref(false)

const filteredDomains = computed(() => {
  if (!searchQuery.value.trim()) return []
  return searchDomainsWithRanking(props.domains, searchQuery.value)
})

const suggestions = computed(() => {
  if (searchQuery.value.length < 1) return []
  return getSuggestions(props.domains, searchQuery.value)
})

const groupedDomains = computed(() => {
  if (!props.domains.length) return []

  // 如果没有category字段，按首字母分组
  const groups = {}

  props.domains.forEach(domain => {
    const category = domain.category || domain.type || '其他'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(domain)
  })

  return Object.entries(groups)
    .map(([category, items]) => ({
      category,
      domains: items,
      count: items.length
    }))
    .sort((a, b) => a.category.localeCompare(b.category, 'zh-CN'))
})

function handleSearchInput(value) {
  searchQuery.value = value
  if (!value.trim()) {
    showSuggestions.value = false
  }
}

function selectSuggestion(suggestion) {
  searchQuery.value = suggestion
  showSuggestions.value = false
  const matched = props.domains.find(d => d.name === suggestion)
  if (matched) {
    selectDomain(matched)
  }
}

function selectDomain(domain) {
  emit('select', domain)
  searchQuery.value = ''
}

function closeSuggestions() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}
</script>

<style scoped>
.domain-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.75) 100%);
  color: #e2e8f0;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.28);
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sidebar-title .title {
  font-weight: 700;
  color: #f8fafc;
  font-size: 16px;
  margin: 0;
}

.search-wrapper {
  position: relative;
}

.sidebar-search :deep(.el-input__wrapper) {
  background: rgba(148, 163, 184, 0.12);
  box-shadow: none;
  border-radius: 10px;
  transition: all 0.25s ease;
}

.sidebar-search :deep(.el-input__wrapper:hover) {
  background: rgba(148, 163, 184, 0.18);
}

.sidebar-search :deep(.el-input__wrapper.is-focus) {
  background: rgba(148, 163, 184, 0.25);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(2, 6, 23, 0.4);
  z-index: 10;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.suggestion-item {
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: rgba(59, 130, 246, 0.2);
}

.suggestion-text {
  color: #e2e8f0;
  font-size: 14px;
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

.grouped-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.domain-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  gap: 8px;
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(226, 232, 240, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
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

.indicator {
  width: 4px;
  height: 30px;
  border-radius: 999px;
  background: linear-gradient(180deg, #22d3ee 0%, #3b82f6 100%);
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.3s ease;
}

.domain-item.active .indicator {
  opacity: 1;
  transform: translateX(0);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon {
  font-size: 18px;
  flex-shrink: 0;
}

.empty-result {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
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

