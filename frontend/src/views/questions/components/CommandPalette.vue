<template>
  <div class="command-palette-wrapper">
    <div class="command-input" @click="isFocused = true">
      <span class="search-icon">🔍</span>
      <input
        v-model="searchQuery"
        type="text"
        class="command-input-field"
        placeholder="搜索学科、知识点... (Ctrl+K)"
        @focus="isFocused = true"
        @blur="handleBlur"
        @keydown.enter.prevent="handleSearch"
        @keydown.escape="isFocused = false"
        @input="handleInput"
      />
      <span v-if="!searchQuery" class="keyboard-hint">⌘K</span>
    </div>

    <transition name="fade">
      <div v-if="isFocused && (searchQuery || recentSearches.length || quickCommands.length)" class="command-results">
        <div v-if="isSearching && !searchResults.length" class="results-empty">
          <el-empty description="没有匹配的内容，换个关键词试试" :image-size="80" />
        </div>

        <div v-else>
          <div v-if="searchResults.length" class="results-group">
            <div class="group-title">搜索结果</div>
            <div
              v-for="result in searchResults"
              :key="`${result.type}-${result.id}`"
              class="result-item"
              @click="selectResult(result)"
            >
              <span class="result-icon">{{ result.icon }}</span>
              <div class="result-content">
                <div class="result-name">{{ result.name }}</div>
                <div class="result-meta">{{ result.meta }}</div>
              </div>
              <span class="result-arrow">↵</span>
            </div>
          </div>

          <div v-if="!searchQuery && quickCommands.length" class="results-group">
            <div class="group-title">快速命令</div>
            <div
              v-for="cmd in quickCommands"
              :key="cmd.id"
              class="result-item command-item"
              @click="executeCommand(cmd)"
            >
              <span class="result-icon">{{ cmd.icon }}</span>
              <div class="result-content">
                <div class="result-name">{{ cmd.name }}</div>
                <div class="result-meta">{{ cmd.description }}</div>
              </div>
            </div>
          </div>

          <div v-if="!searchQuery && recentSearches.length" class="results-group">
            <div class="group-title">最近搜索</div>
            <div
              v-for="search in recentSearches"
              :key="search"
              class="result-item recent-item"
              @click="reuseSearch(search)"
            >
              <span>🕘</span>
              <span>{{ search }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  domains: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search', 'navigate'])

const searchQuery = ref('')
const isFocused = ref(false)
const recentSearches = ref([])
const isSearching = computed(() => Boolean(searchQuery.value))

const quickCommands = [
  { id: 'hot', name: '显示热门领域', description: '查看最受欢迎的学科', icon: '🔥' },
  { id: 'favorites', name: '我的收藏', description: '查看已收藏的领域', icon: '⭐' },
  { id: 'progress', name: '学习进度', description: '打开我的学习统计', icon: '📈' }
]

const normalizedDomains = computed(() =>
  props.domains.map(domain => ({
    id: domain.id,
    type: 'domain',
    name: domain.name,
    meta: `${domain.questionCount ?? domain.stats?.total ?? 0} 道题 | ${domain.difficultyLabel || difficultyLabel(domain.difficulty)}`,
    icon: domain.icon || '📘',
    payload: domain
  }))
)

const normalizedCategories = computed(() =>
  props.categories.flatMap(category => {
    const categoryName = category.name || '学科'
    const children = category.items || category.children || []
    return children.map(item => ({
      id: item.id,
      type: 'category',
      name: `${item.name || '未命名'}（${categoryName}）`,
      meta: `${item.questionCount ?? item.stats?.total ?? 0} 道题`,
      icon: item.icon || '🧭',
      payload: item
    }))
  })
)

const searchResults = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.trim().toLowerCase()
  const candidates = [...normalizedDomains.value, ...normalizedCategories.value]

  // 模糊搜索算法：精确匹配 > 首字匹配 > 包含匹配
  const scored = candidates.map(item => {
    const name = item.name.toLowerCase()
    let score = 0

    if (name === query) score = 3 // 精确匹配
    else if (name.startsWith(query)) score = 2 // 前缀匹配
    else if (name.includes(query)) score = 1 // 包含匹配
    else return null

    return { ...item, score }
  })

  return scored
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
})

onMounted(() => {
  try {
    const stored = localStorage.getItem('hub-recent-searches')
    if (stored) {
      recentSearches.value = JSON.parse(stored)
    }
  } catch {}

window.addEventListener('keydown', handleShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleShortcut)
})

watch(recentSearches, value => {
  try {
    localStorage.setItem('hub-recent-searches', JSON.stringify(value.slice(0, 8)))
  } catch {}
})

function handleShortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    isFocused.value = true
    nextTick(() => {
      const input = document.querySelector('.command-input-field')
      input?.focus()
    })
  }
}

function handleBlur() {
  setTimeout(() => {
    isFocused.value = false
  }, 150)
}

function handleInput() {
  // 保留扩展接口，用于后续联想建议
}

function handleSearch() {
  if (!searchQuery.value) return
  addToRecentSearches(searchQuery.value)
  emit('search', searchQuery.value)
  isFocused.value = false
}

function selectResult(result) {
  addToRecentSearches(result.name)
  emit('navigate', result)
  isFocused.value = false
}

function executeCommand(command) {
  emit('navigate', { type: 'command', id: command.id })
  isFocused.value = false
}

function reuseSearch(value) {
  searchQuery.value = value
  handleSearch()
}

function addToRecentSearches(query) {
  const trimmed = query.trim()
  if (!trimmed) return
  const filtered = recentSearches.value.filter(item => item !== trimmed)
  recentSearches.value = [trimmed, ...filtered].slice(0, 8)
}

function difficultyLabel(value) {
  const map = { easy: '基础', medium: '进阶', hard: '挑战', beginner: '初阶', intermediate: '进阶', advanced: '大师' }
  return map[value] || '综合'
}
</script>

<style scoped lang="scss">
.command-palette-wrapper {
  position: relative;
  width: 100%;
}

.command-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 2px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:hover {
    background: #e5e7eb;
  }

  &:focus-within {
    border-color: #2563eb;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1), 0 4px 12px rgba(37, 99, 235, 0.2);
  }
}

.search-icon {
  font-size: 16px;
}

.command-input-field {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #1f2937;
}

.keyboard-hint {
  background: #e5e7eb;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 12px;
  color: #4b5563;
}

.command-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.16);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 20;
}

.results-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  font-size: 12px;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.08em;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;

  &:hover {
    background: #f3f4f6;
    border-color: #e5e7eb;
    transform: translateX(2px);
  }

  &:active {
    background: #e5e7eb;
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }
}

.result-icon {
  font-size: 18px;
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-name {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
}

.result-meta {
  font-size: 12px;
  color: #6b7280;
}

.result-arrow {
  font-size: 12px;
  color: #9ca3af;
}

.command-item {
  background: rgba(37, 99, 235, 0.06);
}

.recent-item {
  color: #4b5563;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
