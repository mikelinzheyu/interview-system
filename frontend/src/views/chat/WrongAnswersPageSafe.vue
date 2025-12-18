<template>
  <div class="wa-page">
    <!-- Header -->
    <header class="wa-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-box">
            <el-icon><Notebook /></el-icon>
          </div>
          <div class="title-box">
            <h1>错题本</h1>
            <span>错题诊断与复习平台</span>
          </div>

          <!-- Tabs -->
          <nav class="nav-tabs hidden-sm-and-down">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="nav-tab"
              :class="{ active: activeTab === tab.value }"
              @click="handleTabChange(tab.value)"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <div class="header-right">
          <div v-if="networkStatus === 'offline'" class="offline-indicator">
            <el-icon><Hide /></el-icon>
            <span>离线模式</span>
          </div>

          <div class="view-toggle hidden-md-and-down">
            <button
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
              title="网格视图"
            >
              <el-icon><Grid /></el-icon>
            </button>
            <button
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
              title="列表视图"
            >
              <el-icon><List /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      <!-- Sidebar -->
      <WrongAnswerSidebar
        v-model:filters="filters"
        :all-tags="allTags"
        :counts="counts"
        :available-sources="availableSources"
      />

      <!-- Content -->
      <main class="content-area">
        <!-- Error Banner -->
        <div v-if="hasError && errorMessage" class="error-alert">
          <div class="alert-content">
            <el-icon class="alert-icon"><Close /></el-icon>
            <div class="alert-text">
              <p class="alert-title">加载失败</p>
              <p class="alert-message">{{ errorMessage }}</p>
            </div>
          </div>
          <div class="alert-actions">
            <el-button type="primary" @click="retryLoadData" :loading="isLoading">
              重试
            </el-button>
            <button class="close-btn" @click="hasError = false">
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="isLoading && !sortedData.length" class="loading-skeleton">
          <div v-for="i in 6" :key="i" class="skeleton-item"></div>
        </div>

        <!-- Detail Mode -->
        <MistakeDetail
          v-if="viewingMistake"
          :item="viewingMistake"
          @back="viewingMistakeId = null"
          @toggle-favorite="toggleFavorite"
          @ignore="toggleIgnore"
          @update="handleUpdateMistake"
        />

        <!-- List Mode -->
        <div v-else class="mistakes-view-container">
          <!-- Top Controls -->
          <div class="top-controls">
            <div class="search-bar">
              <div class="search-input-wrapper">
                <el-icon class="search-icon"><Search /></el-icon>
                <input
                  v-model="filters.search"
                  type="text"
                  class="search-input"
                  placeholder="搜索知识点、题目描述..."
                />
              </div>
              <el-button type="primary" class="search-btn">搜索</el-button>
            </div>

            <div class="control-actions">
              <button
                v-if="hasActiveFilters"
                class="clear-filter-btn"
                @click="clearFilters"
              >
                <el-icon><Filter /></el-icon>
                清除筛选
              </button>

              <el-dropdown trigger="click" @command="handleSortCommand">
                <button class="sort-btn">
                  {{ filterService.getSortLabel(sortBy) }}
                  <el-icon><ArrowDown /></el-icon>
                </button>
                <template #dropdown>
                  <el-dropdown-menu class="sort-dropdown">
                    <el-dropdown-item command="recent">
                      最近更新
                    </el-dropdown-item>
                    <el-dropdown-item command="mastery_asc">
                      掌握度（低到高）
                    </el-dropdown-item>
                    <el-dropdown-item command="count_desc">
                      错误次数（多到少）
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- Status Filter Bar -->
          <div class="status-filter-bar">
            <button
              class="status-btn"
              :class="{ active: filters.viewMode === 'all' }"
              @click="filters.viewMode = 'all'"
            >
              <el-icon><Check /></el-icon>
              全部题目
            </button>
            <button
              class="status-btn"
              :class="{ active: filters.viewMode === 'favorites' }"
              @click="filters.viewMode = 'favorites'"
            >
              <el-icon><Star /></el-icon>
              收藏 <span class="badge">{{ favCount }}</span>
            </button>
            <button
              class="status-btn"
              :class="{ active: filters.viewMode === 'ignored' }"
              @click="filters.viewMode = 'ignored'"
            >
              <el-icon><Hide /></el-icon>
              已忽略 <span class="badge">{{ ignoredCount }}</span>
            </button>
          </div>

          <!-- Ignored Banner -->
          <div
            v-if="filters.viewMode === 'ignored'"
            class="ignored-banner"
          >
            <div class="banner-content">
              <div class="icon-box">
                <el-icon><Hide /></el-icon>
              </div>
              <div class="text">
                <h3>已忽略</h3>
                <p>这里显示的是您选择忽略的错题，您可以随时恢复它们。</p>
              </div>
            </div>
            <button class="exit-btn" @click="filters.viewMode = 'all'">
              返回全部题目
            </button>
          </div>

          <!-- Summary -->
          <div class="list-summary">
            <div class="count-info">
              <el-icon class="icon-indigo"><Cpu /></el-icon>
              <span>
                已加载 <strong>{{ sortedData.length }}</strong> 道题目
                {{ totalCount > sortedData.length ? `，共 ${totalCount} 道` : '' }}
              </span>
            </div>
            <div v-if="sortedData.length" class="select-all-wrapper">
              <label class="select-all-label">
                <div
                  class="checkbox-box"
                  :class="{ checked: isAllSelected }"
                  @click="toggleSelectAll"
                >
                  <el-icon v-if="isAllSelected"><Check /></el-icon>
                </div>
                全选已加载的题目
              </label>
            </div>
          </div>

          <!-- List -->
          <VirtualMistakeList
            :initial-items="sortedData"
            :view-mode="viewMode"
            :selected-ids="selectedIds"
            :total-count="totalCount"
            :filters="filters"
            :sort-by="sortBy"
            :use-mock-data="USE_MOCK"
            @toggle-favorite="toggleFavorite"
            @ignore="toggleIgnore"
            @update="handleUpdateMistake"
            @toggle-selection="toggleSelection"
            @view-detail="viewingMistakeId = $event"
            @load-more="handleLoadMore"
            @reset-filters="clearFilters"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Notebook,
  Grid,
  List,
  Search,
  Filter,
  ArrowDown,
  Cpu,
  Check,
  Star,
  Hide,
  Close
} from '@element-plus/icons-vue'
import WrongAnswerSidebar from './components/WrongAnswerSidebar.vue'
import MistakeDetail from './components/MistakeDetail.vue'
import VirtualMistakeList from './components/VirtualMistakeList.vue'
import {
  MistakeType,
  SourceType,
  type MistakeItem,
  type FilterState
} from './types'
import { mockWrongAnswers } from '@/data/mock-wrong-answers'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { filterService } from '@/services/filterService'

const wrongAnswersStore = useWrongAnswersStore()
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

// Tabs
const tabs = [
  { label: '题库错题', value: 'bank' },
  { label: '面试复盘', value: 'interview' }
]
const activeTab = ref<'bank' | 'interview'>('bank')

// Basic state
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const networkStatus = ref<'online' | 'offline'>('online')

const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref<'recent' | 'mastery_asc' | 'count_desc'>('recent')

// Data
const allData = ref<MistakeItem[]>([])
const totalCount = ref(0)
const viewingMistakeId = ref<string | null>(null)
const selectedIds = ref<Set<string>>(new Set())

// Filters
const filters = reactive<FilterState>({
  search: '',
  selectedSources: [],
  selectedTypes: [],
  selectedTags: [],
  viewMode: 'all'
})

// Computed
const viewingMistake = computed(() =>
  allData.value.find(i => i.id === viewingMistakeId.value) || null
)

const availableSources = computed(() => {
  if (activeTab.value === 'interview') {
    return [
      SourceType.FRONTEND_INTERVIEW,
      SourceType.BACKEND_INTERVIEW,
      SourceType.FULLSTACK_INTERVIEW
    ]
  }
  return [SourceType.QUESTION_BANK, SourceType.MOCK_EXAM]
})

const allTags = computed(() => {
  const relevant = allData.value.filter(item =>
    availableSources.value.includes(item.source)
  )
  return Array.from(new Set(relevant.flatMap(item => item.tags)))
})

const filteredData = computed(() =>
  filterService.applyAllFilters(allData.value, filters)
)

const sortedData = computed(() =>
  filterService.sort(filteredData.value, sortBy.value)
)

const counts = computed(() =>
  filterService.calculateCounts(filteredData.value)
)

const hasActiveFilters = computed(() =>
  filterService.hasActiveFilters(filters)
)

const isAllSelected = computed(
  () => allData.value.length > 0 && selectedIds.value.size === allData.value.length
)

const favCount = computed(
  () =>
    allData.value.filter(
      item => availableSources.value.includes(item.source) && item.isFavorite
    ).length
)

const ignoredCount = computed(
  () =>
    allData.value.filter(
      item => availableSources.value.includes(item.source) && item.isIgnored
    ).length
)

// Mapping helpers
const mapSource = (source: string | null | undefined): SourceType => {
  if (!source) return SourceType.QUESTION_BANK
  if (source === 'question_bank') return SourceType.QUESTION_BANK
  if (source === 'mock_exam') return SourceType.MOCK_EXAM
  return SourceType.FRONTEND_INTERVIEW
}

const calcMastery = (
  reviewStatus?: string | null,
  wrongCount?: number | null,
  correctCount?: number | null
): number => {
  if (reviewStatus === 'mastered') return 90
  const wc = wrongCount || 0
  const cc = correctCount || 0
  const total = wc + cc
  if (total === 0) return 20
  const ratio = cc / total
  return Math.round(30 + ratio * 60)
}

const mapLastReviewed = (
  lastWrongTime?: string | null,
  lastCorrectTime?: string | null
): string => {
  const ts = lastWrongTime || lastCorrectTime
  if (!ts) return '未复习'
  try {
    const date = new Date(ts)
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `${diffMin || 1} 分钟前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} 小时前`
    const diffDay = Math.floor(diffHour / 24)
    return `${diffDay} 天前`
  } catch {
    return '刚刚'
  }
}

const mapToMistakeItem = (rec: any): MistakeItem => ({
  id: String(rec.id ?? rec.questionId ?? ''),
  question:
    rec.questionTitle ||
    rec.question ||
    `题目 #${rec.questionId ?? rec.id ?? ''}`,
  snippet: rec.questionContent || rec.snippet || '',
  type: MistakeType.KNOWLEDGE_GAP,
  source: mapSource(rec.source),
  tags: Array.isArray(rec.userTags)
    ? rec.userTags
    : Array.isArray(rec.tags)
      ? rec.tags
      : [],
  mistakeCount: rec.wrongCount ?? rec.mistakeCount ?? 0,
  mastery:
    rec.mastery ?? calcMastery(rec.reviewStatus, rec.wrongCount, rec.correctCount),
  lastReviewed:
    rec.lastReviewed || mapLastReviewed(rec.lastWrongTime, rec.lastCorrectTime),
  isFavorite: !!rec.isFavorite,
  isIgnored: !!rec.isIgnored
})

const loadFromBackend = async () => {
  await wrongAnswersStore.fetchWrongAnswers()
  const backendItems = Array.isArray(wrongAnswersStore.wrongAnswers)
    ? wrongAnswersStore.wrongAnswers
    : []
  allData.value = backendItems.map(rec => mapToMistakeItem(rec))
  totalCount.value = allData.value.length
}

// Lifecycle
onMounted(async () => {
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''
  try {
    if (USE_MOCK && mockWrongAnswers) {
      allData.value = JSON.parse(
        JSON.stringify(mockWrongAnswers)
      ) as MistakeItem[]
      totalCount.value = allData.value.length
    } else {
      try {
        await loadFromBackend()
      } catch (e: any) {
        console.error('[WrongAnswersPageSafe] Failed to load wrong answers:', e)
        hasError.value = true
        errorMessage.value = e?.message || '加载数据失败'
        networkStatus.value = 'offline'
      }
    }
  } finally {
    isLoading.value = false
  }
})

// Handlers
const handleTabChange = (val: string) => {
  activeTab.value = val as 'bank' | 'interview'
  selectedIds.value.clear()
  filters.selectedSources = []
}

const clearFilters = () => {
  filters.search = ''
  filters.selectedSources = []
  filters.selectedTypes = []
  filters.selectedTags = []
  filters.viewMode = 'all'
}

const handleSortCommand = (command: string) => {
  sortBy.value = command as 'recent' | 'mastery_asc' | 'count_desc'
}

const toggleFavorite = async (id: string) => {
  const item = allData.value.find(i => i.id === id)
  if (!item) return

  const prev = !!item.isFavorite
  try {
    item.isFavorite = !item.isFavorite
    const updated = await wrongAnswersStore.toggleFavorite(id)
    if (updated) {
      item.isFavorite = !!updated.isFavorite
    }
    ElMessage.success(item.isFavorite ? '已加入收藏' : '已取消收藏')
  } catch (e: any) {
    item.isFavorite = prev
    ElMessage.error(e?.message || '操作失败')
  }
}

const toggleIgnore = async (id: string) => {
  const item = allData.value.find(i => i.id === id)
  if (!item) return

  const prev = !!item.isIgnored
  try {
    item.isIgnored = !item.isIgnored
    const updated = await wrongAnswersStore.toggleIgnored(id)
    if (updated) {
      item.isIgnored = !!updated.isIgnored
    }
    if (item.isIgnored) {
      ElMessage.success('已忽略该题目')
    }
    if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  } catch (e: any) {
    item.isIgnored = prev
    ElMessage.error(e?.message || '操作失败')
  }
}

const handleUpdateMistake = (updatedItem: MistakeItem) => {
  const idx = allData.value.findIndex(i => i.id === updatedItem.id)
  if (idx !== -1) {
    allData.value[idx] = updatedItem
    ElMessage.success('更新成功')
  }
}

const toggleSelection = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value.clear()
  } else {
    allData.value.forEach(item => selectedIds.value.add(item.id))
  }
}

const clearSelection = () => {
  selectedIds.value.clear()
}

const handleLoadMore = () => {
  // 当前版本前端不做分页，这里保留占位函数以兼容组件
}

const retryLoadData = async () => {
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''
  try {
    await loadFromBackend()
    networkStatus.value = 'online'
    ElMessage.success('数据重新加载成功')
  } catch (e: any) {
    hasError.value = true
    errorMessage.value = e?.message || '重新加载失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.wa-page {
  min-height: 100vh;
  background-color: #f8fafc;
  color: #1f2933;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
}

.wa-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  height: 64px;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;

    .logo-box {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }

    .title-box {
      display: flex;
      flex-direction: column;

      h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
      }

      span {
        margin-top: 2px;
        font-size: 11px;
        color: #6b7280;
      }
    }

    .nav-tabs {
      display: flex;
      gap: 4px;
      margin-left: 12px;
      padding: 4px;
      background: #eef2ff;
      border-radius: 9999px;

      .nav-tab {
        border: none;
        border-radius: 9999px;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 500;
        background: transparent;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background: #ffffff;
          color: #4f46e5;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .offline-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: #fef3c7;
      color: #92400e;
      font-size: 12px;
    }

    .view-toggle {
      display: flex;
      gap: 4px;
      padding: 4px;
      border-radius: 9999px;
      background: #e5e7eb;

      button {
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background: #ffffff;
          color: #4f46e5;
        }
      }
    }
  }
}

.main-layout {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px 32px;
  gap: 16px;
}

.content-area {
  flex: 1;
  min-width: 0;
}

.error-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  margin-bottom: 16px;

  .alert-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alert-icon {
    color: #dc2626;
  }

  .alert-title {
    margin: 0;
    font-weight: 600;
  }

  .alert-message {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
  }

  .alert-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .close-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    color: #9ca3af;
  }
}

.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 16px;

  .skeleton-item {
    height: 120px;
    border-radius: 12px;
    background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.mistakes-view-container {
  margin-top: 8px;
}

.top-controls {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 9999px;
    background: #ffffff;
    border: 1px solid #e5e7eb;

    .search-input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      min-width: 220px;
    }

    .search-icon {
      color: #9ca3af;
    }
  }

  .search-btn {
    font-size: 13px;
  }

  .control-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .clear-filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 9999px;
    border: none;
    background: #fee2e2;
    color: #b91c1c;
    font-size: 12px;
    cursor: pointer;
  }

  .sort-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 9999px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    font-size: 13px;
    color: #4b5563;
    cursor: pointer;
  }
}

.status-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;

  .status-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 9999px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    font-size: 13px;
    cursor: pointer;
    color: #4b5563;

    .badge {
      padding: 2px 6px;
      border-radius: 9999px;
      background: #f3f4f6;
      font-size: 11px;
    }

    &.active {
      background: #4f46e5;
      border-color: #4f46e5;
      color: #ffffff;

      .badge {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
      }
    }
  }
}

.ignored-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: #e5f3ff;
  border: 1px solid #bfdbfe;
  margin-bottom: 16px;

  .banner-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-box {
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4b5563;
  }

  h3 {
    margin: 0;
    font-size: 14px;
  }

  p {
    margin: 2px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  .exit-btn {
    border-radius: 9999px;
    border: none;
    padding: 6px 12px;
    background: #ffffff;
    color: #2563eb;
    font-size: 12px;
    cursor: pointer;
  }
}

.list-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  .count-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;

    .icon-indigo {
      color: #4f46e5;
    }

    strong {
      color: #111827;
      font-weight: 600;
    }
  }

  .select-all-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
    color: #4b5563;
  }

  .checkbox-box {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;

    &.checked {
      background: #4f46e5;
      border-color: #4f46e5;

      .el-icon {
        color: #ffffff;
        font-size: 10px;
      }
    }
  }
}

@media (max-width: 1024px) {
  .hidden-md-and-down {
    display: none;
  }

  .main-layout {
    flex-direction: column;
    padding: 12px 16px 24px;
  }
}
</style>

