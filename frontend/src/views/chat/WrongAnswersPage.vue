<template>
  <div class="wa-page">
    <!-- Header -->
    <header class="wa-header">
      <div class="header-content">
        <!-- Left: Logo & Title -->
        <div class="header-left">
          <div class="logo-box">
            <el-icon><Notebook /></el-icon>
          </div>
          <div class="title-box">
            <h1>错题本</h1>
            <span>错题诊断与复习平台</span>
          </div>
          
          <!-- Navigation Tabs -->
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

        <!-- Right: Actions -->
        <div class="header-right">
          <!-- View Toggle (Grid/List) -->
          <div class="view-toggle hidden-md-and-down" v-if="activeTab !== 'batches'">
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

          <div class="divider hidden-md-and-down"></div>

          <el-button type="primary" class="start-review-btn" @click="startReview">
            <el-icon><VideoPlay /></el-icon>
            <span>开始复习</span>
          </el-button>
        </div>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      <!-- Sidebar (Left) -->
      <WrongAnswerSidebar
        v-if="activeTab !== 'batches'"
        v-model:filters="filters"
        :all-tags="allTags"
        :counts="counts"
        :available-sources="availableSources"
      />

      <!-- Main Content (Right) -->
      <main class="content-area" :class="{ 'bg-white': activeTab === 'batches' }">
        
        <!-- BATCHES VIEW -->
        <div v-if="activeTab === 'batches'" class="batches-container animate-fade-in">
          <div class="batches-header">
            <div>
              <h2>我的复习集</h2>
              <p>创建针对性复习计划，提升薄弱环节</p>
            </div>
            <el-button type="primary" class="dark-btn" @click="openBatchModal()">
              <el-icon><Plus /></el-icon>
              新建复习集
            </el-button>
          </div>

          <!-- Batches Grid -->
          <div v-if="reviewBatches.length > 0" class="batches-grid">
            <div v-for="batch in reviewBatches" :key="batch.id" class="batch-card group">
              <div class="card-top">
                <div class="icon-box">
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="actions">
                  <button class="icon-btn" @click.stop="openBatchModal(batch)">
                    <el-icon><Edit /></el-icon>
                  </button>
                  <button class="icon-btn danger" @click.stop="deleteBatch(batch)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </div>
              </div>
              
              <h3>{{ batch.name }}</h3>
              <p class="subtitle">{{ batch.mistakeIds.length }} 个题目待复习</p>

              <div class="card-bottom">
                <span class="date">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(batch.createdAt) }}
                </span>
                <button class="start-btn">
                  开始练习 <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-batches">
            <div class="empty-icon">
              <el-icon><FolderAdd /></el-icon>
            </div>
            <h3>暂无复习集</h3>
            <p>将错题添加到复习集，进行专项训练</p>
            <button class="text-btn" @click="openBatchModal()">立即创建</button>
          </div>
        </div>

        <!-- MISTAKES VIEW -->
        <template v-else>
          <MistakeDetail
            v-if="viewingMistake"
            :item="viewingMistake"
            @back="viewingMistakeId = null"
            @toggle-favorite="toggleFavorite"
            @toggle-master="id => { toggleFavorite(id); /* Reusing toggle logic as placeholder */ }"
            @ignore="toggleIgnore"
          />

          <div v-else class="mistakes-view-container">
            <!-- Top Controls -->
            <div class="top-controls">
              <div class="search-bar">
                <div class="search-input-wrapper">
                  <el-icon class="search-icon"><Search /></el-icon>
                  <input
                    type="text"
                    v-model="filters.search"
                    placeholder="搜索知识点、题目描述..."
                    class="search-input"
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
  
                <!-- Sort Dropdown -->
                <el-dropdown trigger="click" @command="handleSortCommand">
                  <button class="sort-btn">
                    {{ getSortLabel(sortBy) }}
                    <el-icon><ArrowDown /></el-icon>
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu class="sort-dropdown">
                      <el-dropdown-item command="recent" :class="{ active: sortBy === 'recent' }">
                        最近更新
                      </el-dropdown-item>
                      <el-dropdown-item command="mastery_asc" :class="{ active: sortBy === 'mastery_asc' }">
                        掌握度 (低到高)
                      </el-dropdown-item>
                      <el-dropdown-item command="count_desc" :class="{ active: sortBy === 'count_desc' }">
                        错误次数 (多到少)
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
  
            <!-- Ignored Banner -->
            <div v-if="filters.showIgnored" class="ignored-banner animate-fade-in">
              <div class="banner-content">
                <div class="icon-box">
                  <el-icon><Hide /></el-icon>
                </div>
                <div class="text">
                  <h3>回收站 / 已忽略</h3>
                  <p>这里显示的是您选择隐藏的错题。您可以随时恢复它们。</p>
                </div>
              </div>
              <button class="exit-btn" @click="filters.showIgnored = false">退出查看</button>
            </div>
  
            <!-- List Header / Summary -->
            <div class="list-summary">
              <div class="count-info">
                <el-icon class="icon-indigo"><Cpu /></el-icon>
                <span>共筛选出 <strong>{{ sortedData.length }}</strong> 道需要复习的题目</span>
              </div>
              <div v-if="sortedData.length > 0" class="select-all-wrapper">
                <label class="select-all-label">
                  <div class="checkbox-box" :class="{ checked: isAllSelected }" @click="toggleSelectAll">
                    <el-icon v-if="isAllSelected"><Check /></el-icon>
                  </div>
                  全选当前页
                </label>
              </div>
            </div>
  
            <!-- Mistakes Grid/List -->
            <div v-if="sortedData.length > 0" class="mistakes-container" :class="viewMode">
              <MistakeCard
                v-for="item in sortedData"
                :key="item.id"
                :item="item"
                :is-selected="selectedIds.has(item.id)"
                :selection-mode="selectedIds.size > 0"
                :view-mode="viewMode"
                @toggle-favorite="toggleFavorite"
                @ignore="toggleIgnore"
                @update="handleUpdateMistake"
                @toggle-selection="toggleSelection"
                @click="viewingMistakeId = item.id"
              />
            </div>
  
            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon-wrapper">
                <el-icon><Search /></el-icon>
              </div>
              <h3>未找到相关错题</h3>
              <p>
                {{ availableSources.length > 0 ? '当前分类下没有符合条件的题目。试着调整关键词或清除筛选条件。' : '请选择一个分类开始查看错题。' }}
              </p>
              <button class="reset-btn" @click="clearFilters">重置所有筛选</button>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- Floating Batch Action Bar -->
    <div class="floating-bar" :class="{ visible: selectedIds.size > 0 }">
      <div class="bar-content">
        <div class="selection-info">
          <span class="count-badge">{{ selectedIds.size }}</span>
          <span class="label">已选择</span>
          <button class="close-btn" @click="clearSelection">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="actions">
          <button class="action-btn" @click="openBatchModal()">
            <el-icon class="icon-gray"><FolderAdd /></el-icon>
            加入复习集
          </button>
          <button class="action-btn" @click="confirmBulkAction('master')">
            <el-icon class="icon-emerald"><CircleCheck /></el-icon>
            标记掌握
          </button>
          <div class="divider"></div>
          
          <template v-if="!filters.showIgnored">
            <button class="action-btn" @click="confirmBulkAction('ignore')">
              <el-icon class="icon-gray"><Hide /></el-icon>
              忽略
            </button>
          </template>
          <template v-else>
            <button class="action-btn" @click="confirmBulkAction('restore')">
              <el-icon class="icon-emerald"><View /></el-icon>
              恢复
            </button>
          </template>

          <button class="action-btn danger" @click="confirmBulkAction('delete')">
            <el-icon class="icon-rose"><Delete /></el-icon>
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- Batch Modal -->
    <el-dialog
      v-model="batchModal.visible"
      :title="batchModal.isEditing ? '编辑复习集' : '添加到复习集'"
      width="450px"
      class="custom-dialog"
      destroy-on-close
    >
      <div class="batch-modal-content">
        <!-- New Batch Input -->
        <div v-if="!batchModal.isEditing" class="input-group">
          <label>新建复习集</label>
          <div class="input-wrapper" :class="{ error: batchModal.newName.length > 50 }">
            <el-icon class="input-icon"><Plus /></el-icon>
            <input
              type="text"
              v-model="batchModal.newName"
              placeholder="例如：考前冲刺、React 专项..."
              @input="batchModal.selectedId = null"
            />
            <span class="char-count" :class="{ error: batchModal.newName.length > 50 }">
              {{ batchModal.newName.length }}/50
            </span>
          </div>
          <p v-if="batchModal.newName.length > 50" class="error-msg">名称不能超过 50 个字符</p>
        </div>

        <div v-if="!batchModal.isEditing" class="divider-text">
          <span>或选择已有</span>
        </div>

        <!-- Existing Batches -->
        <div class="existing-batches">
          <label>{{ batchModal.isEditing ? '复习集名称' : '已有复习集' }}</label>
          
          <!-- Edit Mode: Single Input -->
          <div v-if="batchModal.isEditing" class="input-group">
             <div class="input-wrapper">
                <input
                  type="text"
                  v-model="batchModal.editName"
                  placeholder="复习集名称"
                />
             </div>
          </div>

          <!-- Select Mode: List -->
          <div v-else class="batches-list custom-scrollbar">
            <div
              v-for="batch in reviewBatches"
              :key="batch.id"
              class="batch-item"
              :class="{ active: batchModal.selectedId === batch.id }"
              @click="selectBatchForAdd(batch.id)"
            >
              <div class="batch-icon">
                <el-icon><Folder /></el-icon>
              </div>
              <div class="batch-info">
                <span class="name">{{ batch.name }}</span>
                <span class="count">{{ batch.mistakeIds.length }} 个题目</span>
              </div>
              <el-icon v-if="batchModal.selectedId === batch.id" class="check-icon"><CircleCheckFilled /></el-icon>
            </div>
            <div v-if="reviewBatches.length === 0" class="empty-list">
              暂无复习集，请新建一个吧！
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchModal.visible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="isBatchSubmitDisabled"
            @click="submitBatchModal"
          >
            {{ batchModal.isEditing ? '保存修改' : (batchModal.newName ? '创建并添加' : '确认添加') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Notebook, Grid, List, VideoPlay, Search, Filter, ArrowDown,
  Cpu, Check, Close, FolderAdd, CircleCheck, Hide, View, Delete,
  Plus, Folder, Edit, Calendar, ArrowRight, FolderAdd as FolderAddIcon,
  CircleCheckFilled, Aim, Clock
} from '@element-plus/icons-vue'
import WrongAnswerSidebar from './components/WrongAnswerSidebar.vue'
import MistakeCard from './components/MistakeCard.vue'
import MistakeDetail from './components/MistakeDetail.vue'
import { MistakeType, SourceType, type MistakeItem, type FilterState, type ReviewBatch } from './types'
import { mockWrongAnswers, mockReviewBatches } from '@/data/mock-wrong-answers'

// --- State ---

// Tabs
const tabs = [
  { label: '题库错题', value: 'bank' },
  { label: '面试复盘', value: 'interview' },
  { label: '复习集', value: 'batches' }
]
const activeTab = ref('bank')
const viewMode = ref<'grid' | 'list'>('grid')

// Data
const allData = ref<MistakeItem[]>([])
const reviewBatches = ref<ReviewBatch[]>([])
const viewingMistakeId = ref<string | null>(null)

const viewingMistake = computed(() => {
  return allData.value.find(i => i.id === viewingMistakeId.value)
})

// Filters
const filters = reactive<FilterState>({
  search: '',
  selectedSources: [],
  selectedTypes: [],
  selectedTags: [],
  showFavorites: false,
  showIgnored: false
})

// Selection
const selectedIds = ref<Set<string>>(new Set())

// Sorting
const sortBy = ref<'recent' | 'mastery_asc' | 'count_desc'>('recent')

// Batch Modal State
const batchModal = reactive({
  visible: false,
  isEditing: false,
  selectedId: null as string | null, // For selecting existing batch to add to
  newName: '', // For creating new
  editId: null as string | null, // For editing existing
  editName: ''
})

// --- Computed ---

const availableSources = computed(() => {
  if (activeTab.value === 'interview') {
    return [SourceType.FRONTEND_INTERVIEW, SourceType.BACKEND_INTERVIEW, SourceType.FULLSTACK_INTERVIEW]
  } else if (activeTab.value === 'bank') {
    return [SourceType.QUESTION_BANK, SourceType.MOCK_EXAM]
  }
  return []
})

const allTags = computed(() => {
  const relevantItems = allData.value.filter(item => availableSources.value.includes(item.source))
  return Array.from(new Set(relevantItems.flatMap(item => item.tags)))
})

const filteredData = computed(() => {
  return allData.value.filter(item => {
    // 1. Context Filter
    if (!availableSources.value.includes(item.source)) return false

    // 2. Sidebar Filters
    const searchLower = filters.search.toLowerCase()
    const matchSearch = !filters.search || 
      item.question.toLowerCase().includes(searchLower) || 
      item.tags.some(t => t.toLowerCase().includes(searchLower))
    
    const matchSource = filters.selectedSources.length === 0 || filters.selectedSources.includes(item.source)
    const matchType = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type)
    const matchTags = filters.selectedTags.length === 0 || filters.selectedTags.every(t => item.tags.includes(t))
    const matchFavorite = filters.showFavorites ? item.isFavorite : true
    const matchIgnored = filters.showIgnored ? item.isIgnored : !item.isIgnored

    return matchSearch && matchSource && matchType && matchTags && matchFavorite && matchIgnored
  })
})

const sortedData = computed(() => {
  const data = [...filteredData.value]
  
  const getMinutes = (str: string) => {
    const num = parseInt(str.match(/\d+/)?.[0] || '0')
    if (str.includes('分钟')) return num
    if (str.includes('小时')) return num * 60
    if (str.includes('天')) return num * 1440
    return 999999
  }

  switch (sortBy.value) {
    case 'mastery_asc':
      return data.sort((a, b) => a.mastery - b.mastery)
    case 'count_desc':
      return data.sort((a, b) => b.mistakeCount - a.mistakeCount)
    case 'recent':
    default:
      return data.sort((a, b) => getMinutes(a.lastReviewed) - getMinutes(b.lastReviewed))
  }
})

const counts = computed(() => {
  const sourceCounts: Record<string, number> = {}
  const typeCounts: Record<string, number> = {}
  const tagCounts: Record<string, number> = {}

  // Base match for global filters (search, fav, ignored)
  const matchesBase = (item: MistakeItem) => {
    const matchContext = availableSources.value.includes(item.source)
    const matchSearch = !filters.search || item.question.toLowerCase().includes(filters.search.toLowerCase())
    const matchFav = !filters.showFavorites || item.isFavorite
    const matchIgnored = filters.showIgnored ? item.isIgnored : !item.isIgnored
    return matchContext && matchSearch && matchFav && matchIgnored
  }

  allData.value.forEach(item => {
    if (!matchesBase(item)) return

    // Source counts (respect type & tag filters)
    const matchType = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type)
    const matchTags = filters.selectedTags.length === 0 || filters.selectedTags.every(t => item.tags.includes(t))
    if (matchType && matchTags) {
      sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1
    }

    // Type counts (respect source & tag filters)
    const matchSource = filters.selectedSources.length === 0 || filters.selectedSources.includes(item.source)
    if (matchSource && matchTags) {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
    }
  })

  // Tag counts (based on currently filtered data)
  filteredData.value.forEach(item => {
    item.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  return { sources: sourceCounts, types: typeCounts, tags: tagCounts }
})

const hasActiveFilters = computed(() => {
  return filters.selectedSources.length > 0 ||
         filters.selectedTypes.length > 0 ||
         filters.selectedTags.length > 0 ||
         filters.search !== '' ||
         filters.showFavorites ||
         filters.showIgnored
})

const isAllSelected = computed(() => {
  return sortedData.value.length > 0 && selectedIds.value.size === sortedData.value.length
})

const isBatchSubmitDisabled = computed(() => {
  if (batchModal.isEditing) {
    return !batchModal.editName.trim() || batchModal.editName.length > 50
  }
  const isNewNameInvalid = !batchModal.newName.trim() || batchModal.newName.length > 50
  const isSelectionInvalid = !batchModal.selectedId
  // Valid if: (New Name is valid) OR (Selection is valid AND New Name is empty)
  return isNewNameInvalid && isSelectionInvalid
})


// --- Methods ---

onMounted(() => {
  // Load initial data
  // Convert mock data to match our Type Interfaces if needed, or use directly if matches
  // Here assuming mockWrongAnswers matches MistakeItem structure or is compatible enough
  if (mockWrongAnswers) {
    // Mapping mock data to match strict types if necessary
    // For now using JSON parse/stringify to detach ref
    allData.value = JSON.parse(JSON.stringify(mockWrongAnswers)) as MistakeItem[]
  }
  if (mockReviewBatches) {
    reviewBatches.value = JSON.parse(JSON.stringify(mockReviewBatches))
  }
})

const handleTabChange = (val: string) => {
  activeTab.value = val
  selectedIds.value.clear()
  // Reset filters slightly or keep them? Typically reset source filters as they might be invalid
  filters.selectedSources = []
}

const clearFilters = () => {
  filters.search = ''
  filters.selectedSources = []
  filters.selectedTypes = []
  filters.selectedTags = []
  filters.showFavorites = false
  filters.showIgnored = false
}

const getSortLabel = (val: string) => {
  switch (val) {
    case 'recent': return '最近更新'
    case 'mastery_asc': return '掌握度 (低→高)'
    case 'count_desc': return '错误次数 (多→少)'
    default: return '排序'
  }
}

const handleSortCommand = (command: string) => {
  sortBy.value = command as any
}

// Item Actions
const toggleFavorite = (id: string) => {
  const item = allData.value.find(i => i.id === id)
  if (item) item.isFavorite = !item.isFavorite
}

const toggleIgnore = (id: string) => {
  const item = allData.value.find(i => i.id === id)
  if (item) {
    item.isIgnored = !item.isIgnored
    // Deselect if it disappears
    if (selectedIds.value.has(id)) selectedIds.value.delete(id)

    // UX Enhancement: If an item is ignored, automatically switch to "show ignored" view
    if (item.isIgnored && !filters.showIgnored) {
      filters.showIgnored = true
      ElMessage.info('已将题目移入回收站，自动切换到回收站视图。')
    }
  }
}

const handleUpdateMistake = (updatedItem: MistakeItem) => {
  const idx = allData.value.findIndex(i => i.id === updatedItem.id)
  if (idx !== -1) {
    allData.value[idx] = updatedItem
    ElMessage.success('更新成功')
  }
}

// Selection
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
    sortedData.value.forEach(item => selectedIds.value.add(item.id))
  }
}

const clearSelection = () => {
  selectedIds.value.clear()
}

// Bulk Actions
const confirmBulkAction = (type: 'master' | 'delete' | 'ignore' | 'restore') => {
  const count = selectedIds.value.size
  let title = ''
  let message = ''
  let confirmBtn = ''
  let btnType = 'primary'

  switch (type) {
    case 'master':
      title = '确认标记掌握？'
      message = `这将把选中的 ${count} 个错题的掌握度设置为 100%。`
      confirmBtn = '确认掌握'
      btnType = 'success'
      break
    case 'delete':
      title = '确认删除？'
      message = `您即将永久删除选中的 ${count} 个错题，此操作无法撤销。`
      confirmBtn = '确认删除'
      btnType = 'danger'
      break
    case 'ignore':
      title = '确认隐藏？'
      message = `这将隐藏选中的 ${count} 个错题。它们将不再显示在列表中，但不会被删除。`
      confirmBtn = '确认隐藏'
      btnType = 'info'
      break
    case 'restore':
      title = '确认恢复？'
      message = `这将恢复选中的 ${count} 个错题到正常列表。`
      confirmBtn = '确认恢复'
      btnType = 'primary'
      break
  }

  ElMessageBox.confirm(message, title, {
    confirmButtonText: confirmBtn,
    cancelButtonText: '取消',
    type: btnType as any,
    confirmButtonClass: `el-button--${btnType}`
  }).then(() => {
    executeBulkAction(type)
  }).catch(() => {})
}

const executeBulkAction = (type: string) => {
  if (type === 'master') {
    allData.value.forEach(item => {
      if (selectedIds.value.has(item.id)) item.mastery = 100
    })
    ElMessage.success('已批量标记为掌握')
  } else if (type === 'delete') {
    allData.value = allData.value.filter(item => !selectedIds.value.has(item.id))
    ElMessage.success('已批量删除')
  } else if (type === 'ignore') {
    allData.value.forEach(item => {
      if (selectedIds.value.has(item.id)) item.isIgnored = true
    })
    filters.showIgnored = true // Auto switch to ignored view
    ElMessage.success('已批量忽略')
  } else if (type === 'restore') {
    allData.value.forEach(item => {
      if (selectedIds.value.has(item.id)) item.isIgnored = false
    })
    filters.showIgnored = false // Auto switch out of ignored view
    ElMessage.success('已批量恢复')
  }
  clearSelection()
}

// Batch Management
const openBatchModal = (batchToEdit?: ReviewBatch) => {
  if (batchToEdit) {
    batchModal.isEditing = true
    batchModal.editId = batchToEdit.id
    batchModal.editName = batchToEdit.name
    batchModal.newName = ''
    batchModal.selectedId = null
  } else {
    batchModal.isEditing = false
    batchModal.editId = null
    batchModal.editName = ''
    batchModal.newName = ''
    batchModal.selectedId = null
  }
  batchModal.visible = true
}

const selectBatchForAdd = (id: string) => {
  batchModal.selectedId = id
  batchModal.newName = '' // Clear new name if selecting existing
}

const submitBatchModal = () => {
  if (batchModal.isEditing) {
    // Update existing batch name
    const batch = reviewBatches.value.find(b => b.id === batchModal.editId)
    if (batch) {
      batch.name = batchModal.editName
      ElMessage.success('复习集已更新')
    }
  } else {
    // Add to batch (New or Existing)
    const idsToAdd = Array.from(selectedIds.value)
    
    if (batchModal.newName.trim()) {
      // Create New
      const newBatch: ReviewBatch = {
        id: 'b' + Date.now(),
        name: batchModal.newName.trim(),
        mistakeIds: idsToAdd,
        createdAt: new Date().toISOString()
      }
      reviewBatches.value.unshift(newBatch) // Add to top
      ElMessage.success('复习集已创建')
    } else if (batchModal.selectedId) {
      // Add to Existing
      const batch = reviewBatches.value.find(b => b.id === batchModal.selectedId)
      if (batch) {
        const newIds = idsToAdd.filter(id => !batch.mistakeIds.includes(id))
        batch.mistakeIds.push(...newIds)
        ElMessage.success(`已添加 ${newIds.length} 个题目到复习集`)
      }
    }
    clearSelection()
  }
  batchModal.visible = false
}

const deleteBatch = (batch: ReviewBatch) => {
  ElMessageBox.confirm(`确认删除复习集 "${batch.name}" 吗？`, '删除复习集', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    reviewBatches.value = reviewBatches.value.filter(b => b.id !== batch.id)
    ElMessage.success('复习集已删除')
  }).catch(() => {})
}

const startReview = () => {
  // 顶部“开始复习”：切到“复习集”标签
  if (activeTab.value !== 'batches') {
    handleTabChange('batches')
    ElMessage.info('已切换到复习集，请选择一个复习集开始练习')
  } else {
    ElMessage.info('请选择一个复习集开始练习')
  }
}

const formatDate = (isoStr: string) => {
  return new Date(isoStr).toLocaleDateString()
}

</script>

<style scoped lang="scss">
// --- Variables (Matching Tailwind palette approx) ---
$bg-page: #f8fafc; // slate-50
$bg-white: #ffffff;
$border-color: #e2e8f0; // slate-200
$text-main: #1e293b; // slate-800
$text-sub: #64748b; // slate-500
$primary: #4f46e5; // indigo-600
$primary-hover: #4338ca;
$primary-light: #eef2ff; // indigo-50
$danger: #e11d48; // rose-600
$success: #10b981; // emerald-500

.wa-page {
  min-height: 100vh;
  background-color: $bg-page;
  color: $text-main;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

// --- Header ---
.wa-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border-color;
  height: 64px;

  .header-content {
    max-width: 1920px;
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
    gap: 32px;

    .logo-box {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
    }

    .title-box {
      display: flex;
      flex-direction: column;
      h1 {
        font-size: 16px;
        font-weight: 700;
        margin: 0;
        line-height: 1;
      }
      span {
        font-size: 10px;
        color: $text-sub;
        margin-top: 2px;
        font-weight: 500;
        letter-spacing: 0.02em;
      }
    }

    .nav-tabs {
      display: flex;
      gap: 4px;
      background: rgba(241, 245, 249, 0.5);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid rgba(226, 232, 240, 0.5);

      .nav-tab {
        padding: 6px 16px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: $text-sub;
        cursor: pointer;
        transition: all 0.2s;

        &:hover { color: $text-main; background: rgba(0,0,0,0.03); }
        &.active {
          background: white;
          color: $primary;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .view-toggle {
      display: flex;
      background: rgba(241, 245, 249, 0.5);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid rgba(226, 232, 240, 0.5);
      
      button {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        border-radius: 6px;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s;

        &:hover { color: $text-sub; }
        &.active {
          background: white;
          color: $primary;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      }
    }

    .divider { width: 1px; height: 24px; background: $border-color; }

    .start-review-btn {
      border-radius: 8px;
      font-weight: 600;
      padding: 8px 20px;
      background: $primary;
      border-color: $primary;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
      }
      &:active { transform: translateY(0); }
      
      .el-icon { margin-right: 6px; }
    }
  }
}

// --- Layout ---
.main-layout {
  display: flex;
  flex: 1;
  max-width: 1920px;
  margin: 0 auto;
  width: 100%;
}

.content-area {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
  padding-bottom: 128px; // Space for floating bar

  &.bg-white { background: white; }
}

// --- Top Controls ---
.top-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 16px;
  flex-wrap: wrap;

  .search-bar {
    display: flex;
    gap: 8px;
    flex: 1;
    max-width: 600px;

    .search-input-wrapper {
      flex: 1;
      position: relative;
      
      .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
      }

      .search-input {
        width: 100%;
        padding: 10px 16px 10px 40px;
        border: 1px solid $border-color;
        border-radius: 12px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
        background: white;

        &:focus {
          border-color: $primary;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        &::placeholder { color: #cbd5e1; }
      }
    }

    .search-btn {
      border-radius: 12px;
      padding: 0 24px;
      font-weight: 600;
    }
  }

  .control-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .clear-filter-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      background: #fff1f2; // rose-50
      color: $danger;
      border: none;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;

      &:hover { background: #ffe4e6; }
    }

    .sort-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: white;
      border: 1px solid $border-color;
      border-radius: 8px;
      color: $text-sub;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 160px;
      justify-content: space-between;

      &:hover { background: #f8fafc; border-color: #cbd5e1; }
    }
  }
}

// --- Ignored Banner ---
.ignored-banner {
  background: #f1f5f9; // slate-100
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .banner-content {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon-box {
      width: 32px;
      height: 32px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid $border-color;
      color: $text-sub;
    }

    h3 { margin: 0; font-size: 14px; font-weight: 700; color: $text-main; }
    p { margin: 0; font-size: 12px; color: $text-sub; }
  }

  .exit-btn {
    padding: 6px 12px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: $primary;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { background: $primary-light; }
  }
}

// --- Summary ---
.list-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  .count-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: $text-sub;

    .icon-indigo { color: $primary; }
    strong { color: $text-main; font-weight: 700; }
  }

  .select-all-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: $text-sub;
    user-select: none;

    &:hover { color: $text-main; }

    .checkbox-box {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &.checked {
        background: $primary;
        border-color: $primary;
        .el-icon { color: white; font-size: 10px; font-weight: bold; }
      }
    }
  }
}

// --- Grids ---
.mistakes-container {
  &.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }
  &.list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

// --- Batches View ---
.batches-container {
  max-width: 1200px;
  margin: 0 auto;

  .batches-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;

    h2 { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; color: $text-main; }
    p { margin: 0; color: $text-sub; }
    
    .dark-btn {
      background: $text-main;
      border-color: $text-main;
      &:hover { background: #334155; border-color: #334155; }
    }
  }

  .batches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 24px;

    .batch-card {
      background: white;
      border: 1px solid $border-color;
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s;
      position: relative;
      cursor: pointer;

      &:hover {
        border-color: #c7d2fe;
        box-shadow: 0 10px 40px -10px rgba(79, 70, 229, 0.15);
        transform: translateY(-2px);
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;

        .icon-box {
          width: 48px;
          height: 48px;
          background: $primary-light;
          color: $primary;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;

          .icon-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: none;
            background: transparent;
            color: $text-sub;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            &:hover { background: #f1f5f9; color: $primary; }
            &.danger:hover { background: #fff1f2; color: $danger; }
          }
        }
      }
      &:hover .card-top .actions { opacity: 1; }

      h3 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
      .subtitle { font-size: 14px; color: $text-sub; margin: 0; }

      .card-bottom {
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .date {
          font-size: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .start-btn {
          border: none;
          background: transparent;
          color: $primary;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: gap 0.2s;
          &:hover { gap: 8px; }
        }
      }
    }
  }
}

// --- Empty States ---
.empty-state, .empty-batches {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;

  .empty-icon-wrapper, .empty-icon {
    width: 64px;
    height: 64px;
    background: #f8fafc;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #cbd5e1;
    margin-bottom: 16px;
    
    &.empty-icon { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  }

  h3 { font-size: 18px; font-weight: 700; margin: 0 0 8px 0; color: $text-main; }
  p { font-size: 14px; color: $text-sub; max-width: 400px; margin: 0 0 24px 0; line-height: 1.5; }

  .reset-btn, .text-btn {
    padding: 10px 24px;
    border-radius: 10px;
    background: $primary-light;
    color: $primary;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #e0e7ff; }
  }
  .text-btn { background: transparent; text-decoration: underline; &:hover { color: $primary-hover; } }
}

// --- Floating Bar ---
.floating-bar {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translate(-50%, 100px);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 50;
  pointer-events: none;

  &.visible {
    transform: translate(-50%, 0);
    opacity: 1;
    pointer-events: auto;
  }

  .bar-content {
    background: white;
    border: 1px solid $border-color;
    box-shadow: 0 20px 40px -4px rgba(0, 0, 0, 0.15);
    border-radius: 16px;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 24px;

    .selection-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-right: 24px;
      border-right: 1px solid $border-color;

      .count-badge {
        background: $primary;
        color: white;
        font-size: 12px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
      }
      .label { font-size: 14px; font-weight: 600; color: $text-main; }
      .close-btn {
        border: none;
        background: transparent;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        &:hover { background: #f1f5f9; color: $text-sub; }
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: $text-main;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;

        .icon-gray { color: $text-sub; }
        .icon-emerald { color: $success; }
        .icon-rose { color: $danger; }

        &:hover { background: #f8fafc; }
        &.danger { color: $danger; &:hover { background: #fff1f2; } }
        &.disabled { opacity: 0.5; cursor: not-allowed; }
      }

      .divider { width: 1px; height: 16px; background: $border-color; margin: 0 4px; }
    }
  }
}

// --- Dialog Custom ---
.custom-dialog {
  border-radius: 16px;
  overflow: hidden;

  .batch-modal-content {
    padding: 8px 0;

    .input-group {
      margin-bottom: 24px;
      label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: $text-main; }
      
      .input-wrapper {
        position: relative;
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        input {
          width: 100%;
          padding: 10px 48px 10px 36px;
          border: 1px solid $border-color;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s;
          &:focus { border-color: $primary; box-shadow: 0 0 0 2px $primary-light; }
        }
        .char-count {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #94a3b8;
          &.error { color: $danger; }
        }
        &.error input { border-color: $danger; }
      }
      .error-msg { font-size: 12px; color: $danger; margin-top: 4px; }
    }

    .divider-text {
      position: relative;
      text-align: center;
      margin-bottom: 24px;
      &::before { content: ''; position: absolute; left: 0; top: 50%; width: 100%; height: 1px; background: $border-color; }
      span { position: relative; background: white; padding: 0 12px; font-size: 12px; color: $text-sub; font-weight: 500; text-transform: uppercase; }
    }

    .existing-batches {
      label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: $text-main; }
      
      .batches-list {
        max-height: 240px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .batch-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid $border-color;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;

          .batch-icon {
            width: 32px;
            height: 32px;
            background: #f1f5f9;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $text-sub;
          }

          .batch-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            .name { font-size: 14px; font-weight: 600; color: $text-main; }
            .count { font-size: 12px; color: $text-sub; }
          }

          .check-icon { color: $primary; font-size: 18px; }

          &:hover { border-color: #c7d2fe; background: #f8fafc; }
          &.active {
            border-color: $primary;
            background: $primary-light;
            .batch-icon { background: #c7d2fe; color: $primary; }
            .name { color: $primary; }
          }
        }
      }
    }
  }
}

// Media Queries
@media (max-width: 768px) {
  .hidden-md-and-down { display: none !important; }
  .wa-header .header-content { padding: 0 16px; }
  .content-area { padding: 20px; }
  .top-controls { flex-direction: column; align-items: stretch; }
}
@media (max-width: 640px) {
  .hidden-sm-and-down { display: none !important; }
}

// Animations
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
