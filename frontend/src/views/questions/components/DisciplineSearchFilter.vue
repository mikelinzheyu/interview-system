<template>
  <div class="discipline-search-filter">
    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        clearable
        @input="handleSearch"
        @clear="handleClear"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <!-- 搜索结果下拉 -->
      <transition name="fade-quick">
        <div v-if="showSearchResults" class="search-results-dropdown">
          <!-- 搜索加载状态 -->
          <div v-if="disciplinesStore.searchLoading" class="search-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>搜索中...</span>
          </div>

          <!-- 搜索结果 -->
          <div v-else-if="disciplinesStore.searchResults.length" class="results-list">
            <div
              v-for="result in displayedResults"
              :key="`${result.type}-${result.id}`"
              class="result-item"
              :class="{ active: activeResultId === result.id }"
              @click="selectSearchResult(result)"
            >
              <div class="result-info">
                <span class="result-type-badge" :class="result.type">
                  {{ getResultTypeLabel(result.type) }}
                </span>
                <span class="result-name">{{ result.name }}</span>
              </div>
              <span class="result-level">{{ getLevelIndicator(result.level) }}</span>
            </div>

            <!-- 显示更多 -->
            <div v-if="disciplinesStore.searchResults.length > maxResults" class="show-more">
              <el-button link type="primary" @click="expandResults">
                显示全部 {{ disciplinesStore.searchResults.length }} 个结果
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 无结果 -->
          <div v-else class="no-results">
            <el-icon><InfoFilled /></el-icon>
            <p>未找到相关结果</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- 过滤选项 -->
    <div class="filter-options">
      <!-- 排序 -->
      <el-dropdown @command="handleSort" trigger="click">
        <el-button link :class="{ active: sortBy !== 'default' }">
          <el-icon><Sort /></el-icon>
          排序: {{ getSortLabel(sortBy) }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="default">
              <span :class="{ 'is-active': sortBy === 'default' }">默认排序</span>
            </el-dropdown-item>
            <el-dropdown-item command="popularity">
              <span :class="{ 'is-active': sortBy === 'popularity' }">⭐ 热度最高</span>
            </el-dropdown-item>
            <el-dropdown-item command="questionCount">
              <span :class="{ 'is-active': sortBy === 'questionCount' }">📚 题目最多</span>
            </el-dropdown-item>
            <el-dropdown-item command="difficulty">
              <span :class="{ 'is-active': sortBy === 'difficulty' }">🎯 难度递增</span>
            </el-dropdown-item>
            <el-dropdown-item command="newest">
              <span :class="{ 'is-active': sortBy === 'newest' }">⏰ 最新更新</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 难度过滤 -->
      <el-dropdown @command="handleDifficultyFilter" trigger="click">
        <el-button link :class="{ active: selectedDifficulty.length > 0 }">
          <el-icon><Filter /></el-icon>
          难度: {{ getDifficultyLabel() }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="all">
              <el-checkbox
                :model-value="selectedDifficulty.length === difficultyOptions.length"
                @change="handleSelectAllDifficulty"
              >
                全选
              </el-checkbox>
            </el-dropdown-item>
            <el-dropdown-item v-for="option in difficultyOptions" :key="option.value" disabled>
              <el-checkbox
                :model-value="selectedDifficulty.includes(option.value)"
                @change="toggleDifficulty(option.value)"
              >
                {{ option.label }}
              </el-checkbox>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 学习时间过滤 -->
      <el-dropdown @command="handleTimeFilter" trigger="click">
        <el-button link :class="{ active: selectedTime.length > 0 }">
          <el-icon><Clock /></el-icon>
          学习时间: {{ getTimeLabel() }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="option in timeOptions" :key="option.value" :command="option.value">
              <el-checkbox
                :model-value="selectedTime.includes(option.value)"
                @change="toggleTime(option.value)"
              >
                {{ option.label }}
              </el-checkbox>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 清除过滤 -->
      <el-button
        v-if="hasActiveFilters"
        link
        type="danger"
        @click="clearAllFilters"
      >
        <el-icon><Close /></el-icon>
        清除过滤
      </el-button>
    </div>

    <!-- 活跃过滤标签 -->
    <div v-if="hasActiveFilters" class="active-filters">
      <el-tag
        v-for="tag in activeFilterTags"
        :key="`${tag.type}-${tag.value}`"
        closable
        @close="removeFilter(tag.type, tag.value)"
        class="filter-tag"
      >
        <span class="tag-label">{{ tag.label }}</span>
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisciplinesStore } from '@/stores/disciplines'
import { Search, Sort, Filter, Clock, Close, Loading, ArrowRight, InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  currentLevel: {
    type: String,
    default: 'root'
  }
})

const emit = defineEmits(['search', 'filter-change', 'select-result'])

const disciplinesStore = useDisciplinesStore()

// 搜索
const searchQuery = ref('')
const showSearchResults = ref(false)
const activeResultId = ref(null)
const maxResults = 8

// 排序选项
const sortBy = ref('default')

// 难度过滤
const selectedDifficulty = ref([])
const difficultyOptions = [
  { value: 'beginner', label: '🟢 初级' },
  { value: 'intermediate', label: '🟡 中级' },
  { value: 'advanced', label: '🔴 高级' },
  { value: 'hard', label: '⚫ 困难' }
]

// 学习时间过滤
const selectedTime = ref([])
const timeOptions = [
  { value: 'short', label: '⏱️ 短期 (1-7 天)' },
  { value: 'medium', label: '📅 中期 (1-4 周)' },
  { value: 'long', label: '📆 长期 (1 个月+)' }
]

// 搜索框占位符
const searchPlaceholder = computed(() => {
  const placeholders = {
    root: '搜索学科、专业、细分方向...',
    discipline: '在该学科中搜索专业...',
    majorGroup: '在该专业类中搜索专业...',
    major: '在该专业中搜索细分方向...',
    specialization: '搜索课程或技能...'
  }
  return placeholders[props.currentLevel] || placeholders.root
})

// 显示的搜索结果
const displayedResults = computed(() => {
  return disciplinesStore.searchResults.slice(0, maxResults)
})

// 是否有活跃过滤
const hasActiveFilters = computed(() => {
  return sortBy.value !== 'default' || selectedDifficulty.value.length > 0 || selectedTime.value.length > 0
})

// 活跃过滤标签
const activeFilterTags = computed(() => {
  const tags = []

  if (sortBy.value !== 'default') {
    tags.push({
      type: 'sort',
      value: sortBy.value,
      label: `排序: ${getSortLabel(sortBy.value)}`
    })
  }

  selectedDifficulty.value.forEach(diff => {
    const option = difficultyOptions.find(opt => opt.value === diff)
    if (option) {
      tags.push({
        type: 'difficulty',
        value: diff,
        label: option.label
      })
    }
  })

  selectedTime.value.forEach(time => {
    const option = timeOptions.find(opt => opt.value === time)
    if (option) {
      tags.push({
        type: 'time',
        value: time,
        label: option.label
      })
    }
  })

  return tags
})

// 处理搜索
async function handleSearch(query) {
  showSearchResults.value = query.length > 0

  if (query.length > 0) {
    await disciplinesStore.search(query)
  } else {
    disciplinesStore.clearSearch()
  }

  emit('search', { query, results: disciplinesStore.searchResults })
}

// 清除搜索
function handleClear() {
  searchQuery.value = ''
  showSearchResults.value = false
  disciplinesStore.clearSearch()
  emit('search', { query: '', results: [] })
}

// 选择搜索结果
function selectSearchResult(result) {
  activeResultId.value = result.id
  emit('select-result', result)

  // 导航到该结果
  disciplinesStore.navigateToSearchResult(result)

  setTimeout(() => {
    showSearchResults.value = false
  }, 300)
}

// 展开结果
function expandResults() {
  // 打开全量结果模态框或列表
  emit('expand-results', disciplinesStore.searchResults)
}

// 处理排序
function handleSort(command) {
  sortBy.value = command
  emit('filter-change', {
    sortBy: sortBy.value,
    difficulty: selectedDifficulty.value,
    time: selectedTime.value
  })
}

// 处理难度过滤
function toggleDifficulty(value) {
  const index = selectedDifficulty.value.indexOf(value)
  if (index > -1) {
    selectedDifficulty.value.splice(index, 1)
  } else {
    selectedDifficulty.value.push(value)
  }
  emitFilterChange()
}

// 全选难度
function handleSelectAllDifficulty(checked) {
  if (checked) {
    selectedDifficulty.value = difficultyOptions.map(opt => opt.value)
  } else {
    selectedDifficulty.value = []
  }
  emitFilterChange()
}

// 处理时间过滤
function toggleTime(value) {
  const index = selectedTime.value.indexOf(value)
  if (index > -1) {
    selectedTime.value.splice(index, 1)
  } else {
    selectedTime.value.push(value)
  }
  emitFilterChange()
}

// 清除所有过滤
function clearAllFilters() {
  sortBy.value = 'default'
  selectedDifficulty.value = []
  selectedTime.value = []
  emitFilterChange()
}

// 移除单个过滤
function removeFilter(type, value) {
  if (type === 'sort') {
    sortBy.value = 'default'
  } else if (type === 'difficulty') {
    selectedDifficulty.value = selectedDifficulty.value.filter(d => d !== value)
  } else if (type === 'time') {
    selectedTime.value = selectedTime.value.filter(t => t !== value)
  }
  emitFilterChange()
}

// 发出过滤变更事件
function emitFilterChange() {
  emit('filter-change', {
    sortBy: sortBy.value,
    difficulty: selectedDifficulty.value,
    time: selectedTime.value
  })
}

// 获取排序标签
function getSortLabel(sort) {
  const labels = {
    default: '默认',
    popularity: '热度最高',
    questionCount: '题目最多',
    difficulty: '难度递增',
    newest: '最新更新'
  }
  return labels[sort] || '默认'
}

// 获取难度标签
function getDifficultyLabel() {
  if (selectedDifficulty.value.length === 0) return '全部'
  if (selectedDifficulty.value.length === difficultyOptions.length) return '全部'
  return `${selectedDifficulty.value.length} 个`
}

// 获取时间标签
function getTimeLabel() {
  if (selectedTime.value.length === 0) return '全部'
  if (selectedTime.value.length === timeOptions.length) return '全部'
  return `${selectedTime.value.length} 个`
}

// 获取搜索结果类型标签
function getResultTypeLabel(type) {
  const labels = {
    discipline: '学科',
    majorGroup: '专业类',
    major: '专业',
    specialization: '细分方向'
  }
  return labels[type] || type
}

// 获取层级指示
function getLevelIndicator(level) {
  const indicators = ['', '📚', '📖', '📊', '🎯']
  return indicators[level] || ''
}
</script>

<style scoped lang="scss">
.discipline-search-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
}

.search-input {
  :deep(.el-input__wrapper) {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover,
    &:focus-within {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }
  }

  :deep(.el-input__inner) {
    font-size: 15px;

    &::placeholder {
      color: #999;
    }
  }
}

.search-results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  animation: slideDown 0.3s ease-out;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.25);
    }
  }
}

.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #999;
  font-size: 14px;

  .el-icon {
    font-size: 16px;
    animation: rotating 2s linear infinite;
  }
}

.results-list {
  padding: 8px 0;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-left: 3px solid transparent;

  &:hover {
    background-color: #f5f7fa;
  }

  &.active {
    background-color: #e3f2fd;
    border-left-color: #667eea;
  }
}

.result-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.result-type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;

  &.discipline {
    background: rgba(102, 126, 234, 0.12);
    color: #667eea;
  }

  &.majorGroup {
    background: rgba(118, 75, 162, 0.12);
    color: #764ba2;
  }

  &.major {
    background: rgba(240, 147, 251, 0.12);
    color: #f093fb;
  }

  &.specialization {
    background: rgba(74, 172, 254, 0.12);
    color: #4facfe;
  }
}

.result-name {
  flex: 1;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-level {
  font-size: 16px;
  margin-left: 8px;
  flex-shrink: 0;
}

.show-more {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: #999;

  .el-icon {
    font-size: 24px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.filter-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;

  .el-button {
    padding: 6px 12px;
    font-size: 13px;
    height: 32px;
    border-radius: 6px;

    &.active {
      color: #667eea;
    }

    &:deep(.el-icon) {
      margin-right: 4px;
    }
  }
}

.active-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tag {
  :deep(.el-tag__content) {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tag-label {
    font-size: 12px;
  }
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

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.fade-quick-enter-active,
.fade-quick-leave-active {
  transition: all 0.2s ease;
}

.fade-quick-enter-from {
  opacity: 0;
}

.fade-quick-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .filter-options {
    gap: 8px;
  }

  .search-results-dropdown {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 60vh;
    border-radius: 16px 16px 0 0;
    margin-top: 0;
  }
}
</style>
