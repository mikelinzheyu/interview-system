<template>
  <div class="search-input-wrapper">
    <!-- 简化的搜索输入框 -->
    <el-input
      v-model="query"
      placeholder="搜索题目、知识点..."
      clearable
      size="large"
      style="font-size: 16px"
      @keyup.enter="handleSearch"
      @input="handleInput"
      @clear="handleClear"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <template #prefix>
        <el-icon>
          <Search />
        </el-icon>
      </template>
      <template #suffix>
        <el-icon v-if="isSearching" class="is-loading">
          <Loading />
        </el-icon>
      </template>
    </el-input>

    <!-- 下拉建议面板 -->
    <transition name="dropdown">
      <div v-if="showDropdown && query" class="dropdown-panel">
        <!-- 分类标签页 -->
        <div v-if="searchResults.length" class="tabs">
          <span
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }} ({{ getCount(tab.key) }})
          </span>
        </div>

        <!-- 搜索结果 -->
        <div v-if="getFilteredResults().length" class="results">
          <div
            v-for="result in getFilteredResults()"
            :key="`${result.type}-${result.id}`"
            class="result-item"
            @click="selectResult(result)"
          >
            <span class="icon">{{ result.icon }}</span>
            <div class="content">
              <div class="name" v-html="highlightKeyword(result.name)"></div>
              <div class="meta">{{ result.meta }}</div>
            </div>
            <span class="arrow">→</span>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-else class="empty">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">未找到相关结果</div>
        </div>

        <!-- 快速命令 -->
        <div v-if="!query && quickCommands.length" class="quick-commands">
          <div class="section-title">快速命令</div>
          <div
            v-for="cmd in quickCommands"
            :key="cmd.id"
            class="command-item"
            @click="executeCommand(cmd)"
          >
            <span class="icon">{{ cmd.icon }}</span>
            <div class="content">
              <div class="name">{{ cmd.name }}</div>
              <div class="desc">{{ cmd.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Loading } from '@element-plus/icons-vue'
import { fuzzyMatch, getMatchScore } from '@/utils/pinyin'

const router = useRouter()

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
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['search', 'navigate', 'select'])

const query = ref('')
const isFocused = ref(false)
const activeTab = ref('all')

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'question', label: '题目' },
  { key: 'domain', label: '领域' },
  { key: 'category', label: '分类' }
]

const quickCommands = [
  { id: 'hot', name: '🔥 热门领域', description: '查看最受欢迎的学科' },
  { id: 'favorites', name: '⭐ 我的收藏', description: '查看已收藏的领域' },
  { id: 'progress', name: '📈 学习进度', description: '打开我的学习统计' }
]

const showDropdown = computed(() => isFocused.value)
const isSearching = computed(() => props.loading)

// 规范化数据
const normalizedDomains = computed(() =>
  props.domains.map(domain => ({
    id: domain.id,
    type: 'domain',
    name: domain.name,
    meta: `${domain.questionCount || 0} 道题`,
    icon: domain.icon || '📘',
    payload: domain
  }))
)

const normalizedQuestions = computed(() =>
  props.questions.map(question => ({
    id: question.id,
    type: 'question',
    name: question.title || question.name || '未命名',
    meta: `${question.difficulty || '未知'} | ${question.stats?.attempts || 0} 人做过`,
    icon: '❓',
    payload: question
  }))
)

const normalizedCategories = computed(() =>
  props.categories.flatMap(category => {
    const children = category.items || category.children || []
    return children.map(item => ({
      id: item.id,
      type: 'category',
      name: `${item.name || '未命名'}`,
      meta: `${category.name}`,
      icon: item.icon || '🧭',
      payload: item
    }))
  })
)

// 搜索结果
const searchResults = computed(() => {
  if (!query.value) return []

  const candidates = [
    ...normalizedDomains.value,
    ...normalizedQuestions.value,
    ...normalizedCategories.value
  ]

  return candidates
    .map(item => {
      if (!fuzzyMatch(query.value, item.name)) return null
      const score = getMatchScore(query.value, item.name)
      return { ...item, score }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
})

function getCount(tabKey) {
  if (tabKey === 'all') return searchResults.value.length
  return searchResults.value.filter(r => r.type === tabKey).length
}

function getFilteredResults() {
  if (activeTab.value === 'all') return searchResults.value
  return searchResults.value.filter(r => r.type === activeTab.value)
}

function highlightKeyword(text) {
  if (!query.value || !text) return text
  const regex = new RegExp(`(${query.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function handleInput() {
  activeTab.value = 'all'
}

function handleSearch() {
  const q = (query.value || '').trim()
  if (q) {
    emit('search', q)
    isFocused.value = false
  }
}

function handleClear() {
  query.value = ''
  emit('search', '')
}

function handleFocus() {
  isFocused.value = true
  // 点击搜索框时导航到搜索引擎页面
  router.push({ name: 'SearchHub' })
}

function handleBlur() {
  setTimeout(() => {
    isFocused.value = false
  }, 150)
}

function selectResult(result) {
  emit('select', result)
  isFocused.value = false
}

function executeCommand(cmd) {
  emit('navigate', { type: 'command', id: cmd.id })
  isFocused.value = false
}

// 暴露方法给父组件
defineExpose({
  setQuery: (val) => {
    query.value = val
  }
})
</script>

<style scoped lang="scss">
.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 300px;

  :deep(.el-input__wrapper) {
    background: #f3f4f6;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      background: #e5e7eb;
    }
  }

  :deep(.el-input.is-focus .el-input__wrapper) {
    background: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1), 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  :deep(.el-input__prefix) {
    color: #6b7280;
  }

  :deep(.is-loading) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.16);
  z-index: 1000;
  max-height: 500px;
  overflow-y: auto;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;

  .tab {
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    transition: all 0.2s ease;
    color: #6b7280;

    &:hover {
      color: #2563eb;
      background: #f3f4f6;
    }

    &.active {
      color: #2563eb;
      background: #dbeafe;
      font-weight: 600;
    }
  }
}

.results {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #f3f4f6;
    transform: translateX(2px);
  }

  .icon {
    font-size: 18px;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;

    mark {
      background-color: #fef08a;
      color: #1f2937;
      border-radius: 2px;
      padding: 2px 4px;
      font-weight: 700;
    }
  }

  .meta {
    font-size: 12px;
    color: #6b7280;
  }

  .arrow {
    font-size: 12px;
    color: #d1d5db;
    transition: all 0.2s ease;
  }

  &:hover .arrow {
    color: #2563eb;
  }
}

.empty {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;

  .empty-icon {
    font-size: 32px;
    opacity: 0.5;
    margin-bottom: 8px;
  }

  .empty-text {
    font-size: 13px;
  }
}

.quick-commands {
  padding: 12px 8px;
  border-top: 1px solid #e5e7eb;

  .section-title {
    padding: 0 8px 8px;
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .command-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    background: rgba(37, 99, 235, 0.06);

    &:hover {
      background: rgba(37, 99, 235, 0.12);
    }

    .icon {
      font-size: 16px;
    }

    .content {
      flex: 1;
    }

    .name {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
    }

    .desc {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}
</style>
