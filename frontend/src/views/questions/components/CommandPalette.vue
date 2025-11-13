<template>
  <div class="command-palette-wrapper">
    <div class="command-input" @click="isFocused = true">
      <span class="search-icon">🔍</span>
      <input
        v-model="searchQuery"
        type="text"
        class="command-input-field"
        placeholder="搜索学科、题目、知识点... (Ctrl+K)"
        @focus="isFocused = true"
        @blur="handleBlur"
        @keydown.escape="isFocused = false"
        @input="handleInput"
      />
      <span v-if="!searchQuery" class="keyboard-hint">⌘K</span>
      <span v-else class="clear-btn" @click.stop="clearSearch">✕</span>
    </div>

    <transition name="fade">
      <div v-if="isFocused && (searchQuery || recentSearches.length || quickCommands.length || hotSearches.length)" class="command-results">
        <!-- 无结果处理 -->
        <div v-if="isSearching && !searchResults.length && !showAdvancedFilter" class="results-empty">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">未找到 "<span class="search-term">{{ searchQuery }}</span>" 的相关内容</div>
            <div class="empty-suggestions">
              <div class="suggestion-label">试试搜索：</div>
              <div class="suggestion-tags">
                <span
                  v-for="(suggestion, idx) in getAlternativeSuggestions()"
                  :key="idx"
                  class="suggestion-tag"
                  @click="useHotSearch(suggestion)"
                >
                  {{ suggestion }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <!-- 拼写纠错建议 -->
          <div v-if="typoSuggestion && searchResults.length === 0" class="typo-suggestion">
            <span class="suggestion-text">您是不是想搜索</span>
            <el-button
              type="primary"
              text
              size="small"
              @click="searchQuery = typoSuggestion.corrected; handleInput()"
            >
              "{{ typoSuggestion.corrected }}"
            </el-button>
            <span class="suggestion-text">?</span>
          </div>

          <!-- 搜索结果分类标签页 -->
          <div v-if="searchResults.length && !showAdvancedFilter" class="results-tabs">
            <div
              v-for="tab in resultTabs"
              :key="tab.key"
              :class="['tab-item', { active: activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span class="tab-count">({{ getTabResultsCount(tab.key) }})</span>
            </div>
          </div>

          <!-- 搜索结果 -->
          <div v-if="getFilteredResults().length" class="results-group">
            <div v-if="!searchQuery" class="group-title">搜索结果</div>
            <div
              v-for="result in getFilteredResults()"
              :key="`${result.type}-${result.id}`"
              class="result-item"
              @click="selectResult(result)"
            >
              <span class="result-icon">{{ result.icon }}</span>
              <div class="result-content">
                <div class="result-name" v-html="highlightKeyword(result.name)"></div>
                <div class="result-meta">{{ result.meta }}</div>
              </div>
              <span class="result-arrow">↵</span>
            </div>
          </div>

          <!-- 快速命令 -->
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

          <!-- 高级过滤面板 -->
          <div v-if="showAdvancedFilter" class="advanced-filter-panel">
            <div class="filter-section">
              <label class="filter-label">难度:</label>
              <div class="filter-options">
                <el-checkbox v-model="advancedFilters.difficulty" label="easy">基础</el-checkbox>
                <el-checkbox v-model="advancedFilters.difficulty" label="medium">进阶</el-checkbox>
                <el-checkbox v-model="advancedFilters.difficulty" label="hard">挑战</el-checkbox>
              </div>
            </div>
            <div class="filter-section">
              <label class="filter-label">题型:</label>
              <div class="filter-options">
                <el-checkbox v-model="advancedFilters.type" label="single_choice">单选</el-checkbox>
                <el-checkbox v-model="advancedFilters.type" label="multiple_choice">多选</el-checkbox>
                <el-checkbox v-model="advancedFilters.type" label="short_answer">简答</el-checkbox>
                <el-checkbox v-model="advancedFilters.type" label="coding">编程</el-checkbox>
              </div>
            </div>
            <div class="filter-buttons">
              <el-button size="small" @click="showAdvancedFilter = false">取消</el-button>
              <el-button type="primary" size="small" @click="() => {
                emit('filter', advancedFilters)
                showAdvancedFilter = false
              }">应用过滤</el-button>
            </div>
          </div>

          <!-- 热门搜索 -->
          <div v-if="!searchQuery && dynamicHotSearches.length && !showAdvancedFilter" class="results-group">
            <div class="group-title">🔥 热门搜索</div>
            <div class="hot-searches">
              <span
                v-for="(hot, idx) in dynamicHotSearches"
                :key="idx"
                class="hot-search-tag"
                @click="useHotSearch(hot.term)"
              >
                {{ hot.term }}
                <span class="count">({{ hot.count }})</span>
              </span>
            </div>
          </div>

          <!-- 最近搜索 -->
          <div v-if="!searchQuery && recentSearches.length && !showAdvancedFilter" class="results-group">
            <div class="group-title-with-action">
              <span>最近搜索</span>
              <el-button text size="small" type="danger" @click.stop="clearAllRecentSearches">清空</el-button>
            </div>
            <div
              v-for="(search, idx) in recentSearches"
              :key="search"
              class="result-item recent-item"
            >
              <span class="search-history-icon">🕘</span>
              <span class="search-history-text" @click="reuseSearch(search)">{{ search }}</span>
              <el-button
                text
                size="small"
                type="danger"
                class="delete-btn"
                @click.stop="deleteRecentSearch(idx)"
              >✕</el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fuzzyMatch, getMatchScore, correctTypo } from '@/utils/pinyin'

const props = defineProps({
  domains: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  },
  questions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search', 'navigate', 'filter'])

const searchQuery = ref('')
const isFocused = ref(false)
const recentSearches = ref([])
const isSearching = computed(() => Boolean(searchQuery.value))
const showAdvancedFilter = ref(false)
const activeTab = ref('all') // 搜索结果分类标签
const searchStats = ref(new Map()) // 搜索统计 - 追踪每个搜索词的次数
const typoSuggestion = ref(null) // 拼写纠错建议

// 高级过滤条件
const advancedFilters = ref({
  difficulty: [],
  type: [],
  tags: []
})

// 热门搜索词
const hotSearches = ref([
  { term: 'JavaScript', count: 156 },
  { term: 'Python', count: 134 },
  { term: '数据结构', count: 98 },
  { term: '算法', count: 87 },
  { term: 'Vue', count: 76 },
  { term: 'React', count: 65 }
])

// 搜索结果分类标签
const resultTabs = [
  { key: 'all', label: '全部' },
  { key: 'question', label: '题目' },
  { key: 'domain', label: '领域' },
  { key: 'category', label: '分类' }
]

// 动态热门搜索 - 基于用户行为和预定义热门搜索
const dynamicHotSearches = computed(() => {
  return getHotSearchesFromStats()
})

const quickCommands = [
  { id: 'hot', name: '显示热门领域', description: '查看最受欢迎的学科', icon: '🔥' },
  { id: 'favorites', name: '我的收藏', description: '查看已收藏的领域', icon: '⭐' },
  { id: 'progress', name: '学习进度', description: '打开我的学习统计', icon: '📈' },
  { id: 'advanced-search', name: '高级搜索', description: '按难度、类型、标签过滤', icon: '⚙️' }
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

const normalizedQuestions = computed(() =>
  props.questions.map(question => ({
    id: question.id,
    type: 'question',
    name: question.title || question.name || '未命名题目',
    meta: `${question.difficulty || '未知'} | ${question.type || '题型'} | ${question.stats?.attempts || 0} 人做过`,
    icon: '❓',
    payload: question
  }))
)

const searchResults = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.trim()
  const candidates = [...normalizedDomains.value, ...normalizedCategories.value, ...normalizedQuestions.value]

  // 使用拼音匹配和智能排序算法
  const scored = candidates
    .map(item => {
      const name = item.name

      // 使用模糊匹配检查是否匹配
      if (!fuzzyMatch(query, name)) {
        return null
      }

      // 计算匹配得分
      const score = getMatchScore(query, name)

      return { ...item, score }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  return scored
})

onMounted(() => {
  try {
    // 加载最近搜索
    const stored = localStorage.getItem('hub-recent-searches')
    if (stored) {
      recentSearches.value = JSON.parse(stored)
    }

    // 加载搜索统计
    const stats = localStorage.getItem('hub-search-stats')
    if (stats) {
      const parsed = JSON.parse(stats)
      searchStats.value = new Map(Object.entries(parsed))
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
  // 实时搜索 - 输入时动态过滤结果
  activeTab.value = 'all' // 重置标签页为全部

  // 检查拼写错误
  if (searchQuery.value.length > 2) {
    const corrected = correctTypo(searchQuery.value)
    if (corrected !== searchQuery.value.toLowerCase()) {
      typoSuggestion.value = {
        original: searchQuery.value,
        corrected: corrected
      }
    } else {
      typoSuggestion.value = null
    }
  } else {
    typoSuggestion.value = null
  }
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
  if (command.id === 'advanced-search') {
    showAdvancedFilter.value = !showAdvancedFilter.value
  } else {
    emit('navigate', { type: 'command', id: command.id })
    isFocused.value = false
  }
}

function reuseSearch(value) {
  searchQuery.value = value
  handleSearch()
}

function deleteRecentSearch(index) {
  recentSearches.value.splice(index, 1)
}

function clearAllRecentSearches() {
  recentSearches.value = []
}

function useHotSearch(term) {
  searchQuery.value = term
  handleSearch()
}

function clearSearch() {
  searchQuery.value = ''
  activeTab.value = 'all'
}

function getAlternativeSuggestions() {
  // 返回前 3 个热门搜索作为替代建议
  return hotSearches.value.slice(0, 3).map(h => h.term)
}

function getFilteredResults() {
  // 按选中的标签页过滤搜索结果
  if (activeTab.value === 'all') {
    return searchResults.value
  }
  return searchResults.value.filter(result => result.type === activeTab.value)
}

function getTabResultsCount(tabKey) {
  // 获取每个标签页的结果数
  if (tabKey === 'all') {
    return searchResults.value.length
  }
  return searchResults.value.filter(result => result.type === tabKey).length
}

function highlightKeyword(text) {
  // 在搜索结果中高亮关键词
  if (!searchQuery.value || !text) return text

  const query = searchQuery.value.toLowerCase()
  const regex = new RegExp(`(${query})`, 'gi')

  return text.replace(regex, '<mark>$1</mark>')
}

function addToRecentSearches(query) {
  const trimmed = query.trim()
  if (!trimmed) return

  // 更新搜索统计
  const count = (searchStats.value.get(trimmed) || 0) + 1
  searchStats.value.set(trimmed, count)

  // 更新最近搜索历史
  const filtered = recentSearches.value.filter(item => item !== trimmed)
  recentSearches.value = [trimmed, ...filtered].slice(0, 8)

  // 保存搜索统计到 localStorage
  try {
    const statsObj = Object.fromEntries(searchStats.value)
    localStorage.setItem('hub-search-stats', JSON.stringify(statsObj))
  } catch {}
}

function getHotSearchesFromStats() {
  // 从搜索统计和预定义的热门搜索中综合生成热门词列表
  const statsArray = Array.from(searchStats.value.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  // 合并统计和预定义的热门搜索
  const predefined = hotSearches.value.slice(0, 3)
  const combined = [...statsArray]

  // 如果统计数据不足，补充预定义的热门搜索
  predefined.forEach(item => {
    if (!combined.some(c => c.term.toLowerCase() === item.term.toLowerCase())) {
      combined.push(item)
    }
  })

  return combined.slice(0, 5)
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

.clear-btn {
  font-size: 14px;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s ease;

  &:hover {
    color: #ef4444;
  }
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

.results-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 12px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }
}

.tab-item {
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s ease;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -14px; // 抵消 border-bottom 的高度
  padding-bottom: 20px;

  &:hover {
    color: #2563eb;
  }

  &.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
    font-weight: 600;
  }
}

.tab-count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.typo-suggestion {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}

.suggestion-text {
  color: #92400e;
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

  mark {
    background-color: #fef08a;
    color: #1f2937;
    border-radius: 2px;
    padding: 2px 4px;
    font-weight: 700;
  }
}

.result-meta {
  font-size: 12px;
  color: #6b7280;
}

.result-arrow {
  font-size: 12px;
  color: #9ca3af;
}

.results-empty {
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.empty-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #4b5563;

  .search-term {
    font-weight: 600;
    color: #1f2937;
  }
}

.empty-suggestions {
  width: 100%;
  text-align: left;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
}

.suggestion-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  display: block;
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.suggestion-tag {
  display: inline-block;
  padding: 4px 10px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #2563eb;

  &:hover {
    background: #eff6ff;
    border-color: #2563eb;
  }
}

.command-item {
  background: rgba(37, 99, 235, 0.06);
}

.recent-item {
  color: #4b5563;
}

.search-history-icon {
  font-size: 14px;
}

.search-history-text {
  flex: 1;
  cursor: pointer;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.recent-item:hover .delete-btn {
  opacity: 1;
}

.group-title-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.advanced-filter-panel {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.filter-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-options :deep(.el-checkbox) {
  margin: 0;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.hot-searches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-search-tag {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #ffa500, #ff6b6b);
  color: white;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }

  .count {
    margin-left: 4px;
    opacity: 0.8;
  }
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
