<template>
  <div class="wrong-answers-page">
    <!-- NEW: Page Header Section -->
    <section class="page-header">
      <div class="header-content">
        <h1>错题诊断和复习</h1>
        <p class="subtitle">系统化复习你的错误答案，针对性提升薄弱知识点</p>

        <!-- 标签页：AI错题 / 题库错题 -->
        <el-tabs v-model="activeTab" @change="applyFilters" class="header-tabs">
          <el-tab-pane label="面试错题" name="ai">
            <template #label>
              <span><el-icon><ChatDotRound /></el-icon> 面试错题</span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="题库错题" name="bank">
            <template #label>
              <span><el-icon><Notebook /></el-icon> 题库错题</span>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 右侧操作按钮 -->
      <div class="header-actions">
        <el-button-group class="view-toggle">
          <el-button :type="viewMode==='card' ? 'primary' : 'default'" @click="viewMode='card'" :icon="Grid">卡片</el-button>
          <el-button :type="viewMode==='table' ? 'primary' : 'default'" @click="viewMode='table'" :icon="List">列表</el-button>
        </el-button-group>
        <el-button type="primary" @click="generateReviewPlan" :loading="loadingPlan">
          <el-icon><Notebook /></el-icon>开始复习
        </el-button>
      </div>
    </section>

    <!-- NEW: Main Content Container with Grid Layout -->
    <div class="content-wrapper">
      <!-- Sidebar filters -->
      <aside class="filter-panel">
        <!-- 过滤组1: 错题来源 -->
        <div class="filter-section">
          <div class="filter-header">
            <h4>错题来源</h4>
            <template v-if="activeTab === 'ai'">
              <div class="filter-ops">
                <el-link type="primary" size="small" :underline="false" @click="selectAllSessions">全选</el-link>
                <span class="op-divider">·</span>
                <el-link type="info" size="small" :underline="false" @click="clearSessions">清空</el-link>
              </div>
            </template>
            <template v-else>
              <div class="filter-ops">
                <el-link type="primary" size="small" :underline="false" @click="selectAllSources">全选</el-link>
                <span class="op-divider">·</span>
                <el-link type="info" size="small" :underline="false" @click="clearSources">清空</el-link>
              </div>
            </template>
          </div>
          <div class="filter-body">
            <!-- AI 会话列表 -->
            <template v-if="activeTab === 'ai'">
              <el-input v-model="sessionsSearch" placeholder="搜索会话" size="small" clearable style="margin-bottom: 12px;" />
              <el-checkbox-group v-model="selectedSessions" class="checkbox-list">
                <div v-for="s in shownSessions" :key="s.sessionId" class="checkbox-item">
                  <el-badge :value="sessionCounts[s.sessionId] || 0">
                    <el-checkbox :label="s.sessionId">{{ s.jobTitle || s.sessionId }}</el-checkbox>
                  </el-badge>
                </div>
              </el-checkbox-group>
              <div v-if="filteredSessions.length > sessionShowLimit" style="text-align: center; margin-top: 8px;">
                <el-button link type="primary" size="small" @click="sessionsCollapsed = !sessionsCollapsed">
                  {{ sessionsCollapsed ? '展开更多' : '收起' }}
                </el-button>
              </div>
            </template>

            <!-- 题库来源 -->
            <template v-else>
              <el-checkbox-group v-model="selectedSources" class="checkbox-list">
                <div class="checkbox-item">
                  <el-badge :value="sourceCounts.question_bank || 0">
                    <el-checkbox label="question_bank">题库</el-checkbox>
                  </el-badge>
                </div>
                <div class="checkbox-item">
                  <el-badge :value="sourceCounts.mock_exam || 0">
                    <el-checkbox label="mock_exam">模拟考试</el-checkbox>
                  </el-badge>
                </div>
              </el-checkbox-group>
            </template>
          </div>
        </div>

        <!-- 过滤组2: 错误诊断 -->
        <div class="filter-section">
          <div class="filter-header">
            <h4>错误诊断</h4>
            <div class="filter-ops">
              <el-link type="primary" size="small" :underline="false" @click="selectAllErrorTypes">全选</el-link>
              <span class="op-divider">·</span>
              <el-link type="info" size="small" :underline="false" @click="clearErrorTypes">清空</el-link>
            </div>
          </div>
          <div class="filter-body">
            <el-checkbox-group v-model="selectedErrorTypes" class="checkbox-list">
              <div class="checkbox-item">
                <el-checkbox label="knowledge">知识点错误</el-checkbox>
              </div>
              <div class="checkbox-item">
                <el-checkbox label="logic">逻辑混乱</el-checkbox>
              </div>
              <div class="checkbox-item">
                <el-checkbox label="incomplete">回答不完整</el-checkbox>
              </div>
              <div class="checkbox-item">
                <el-checkbox label="expression">表达不流畅</el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 过滤组3: 知识点标签 -->
        <div class="filter-section">
          <div class="filter-header">
            <h4>知识点标签</h4>
            <div class="filter-ops">
              <el-link type="primary" size="small" :underline="false" @click="selectAllKnowledge">全选</el-link>
              <span class="op-divider">·</span>
              <el-link type="info" size="small" :underline="false" @click="clearKnowledge">清空</el-link>
            </div>
          </div>
          <div class="filter-body">
            <el-input v-model="knowledgeSearch" placeholder="搜索知识点" size="small" clearable style="margin-bottom: 12px;" />
            <div class="tag-group">
              <el-check-tag v-for="tag in filteredKnowledgeTags" :key="tag" :checked="selectedKnowledge.has(tag)" @change="() => toggleKnowledge(tag)" style="margin-bottom: 6px;">
                {{ tag }}
              </el-check-tag>
            </div>
          </div>
        </div>

        <!-- 过滤组4: 排序方式 -->
        <div class="filter-section">
          <div class="filter-header">
            <h4>排序方式</h4>
          </div>
          <div class="filter-body">
            <el-radio-group v-model="sortBy" @change="applyFilters" style="width: 100%;">
              <el-radio-button label="recent">最近时间</el-radio-button>
              <el-radio-button label="reviewed">答题次数</el-radio-button>
              <el-radio-button label="nextReview">下次复习</el-radio-button>
              <el-radio-button label="priority">优先级</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </aside>

      <!-- Main list -->
      <main class="list-panel">
        <!-- 搜索工具栏 -->
        <div class="list-toolbar">
          <el-input v-model="keyword" placeholder="搜索错题描述、知识点等..." clearable style="flex: 1;" @keyup.enter="applyFilters">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>

        <!-- 活跃筛选条件显示 (NEW!) -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span class="label">已选条件：</span>

          <!-- 来源标签 -->
          <template v-if="activeTab === 'ai'">
            <el-tag v-for="sessionId in selectedSessions" :key="`session-${sessionId}`" closable @close="removeSessions(sessionId)">
              {{ getSessionLabel(sessionId) }}
            </el-tag>
          </template>
          <template v-else>
            <el-tag v-for="source in selectedSources" :key="`source-${source}`" closable @close="removeSources(source)">
              {{ getSourceLabel(source) }}
            </el-tag>
          </template>

          <!-- 错误类型标签 -->
          <el-tag v-for="errorType in selectedErrorTypes" :key="`error-${errorType}`" closable @close="removeErrorType(errorType)">
            {{ getErrorTypeLabel(errorType) }}
          </el-tag>

          <!-- 知识点标签 -->
          <el-tag v-for="tag of selectedKnowledge" :key="`knowledge-${tag}`" closable @close="removeKnowledge(tag)">
            {{ tag }}
          </el-tag>

          <!-- 清除所有按钮 -->
          <el-button text size="small" @click="clearAllFilters">清除所有</el-button>
        </div>

        <!-- Card grid view - REDESIGNED -->
        <div v-if="viewMode==='card'" style="display: flex; flex-direction: column; gap: 16px; flex: 1; min-height: 0;">
          <div class="wa-grid">
            <div v-for="item in redesignPaginated" :key="item.id" class="wa-card-redesigned" @click="navigateToDetail(item.id)">
              <!-- Header: 诊断标签最突出 -->
              <div class="wa-card-header">
                <div class="wa-diagnosis-tags">
                  <span
                    v-for="errorType in (item.errorTypes || [item.errorType]).filter(Boolean)"
                    :key="errorType"
                    class="diagnosis-tag"
                    :class="`diagnosis-${errorType}`"
                  >
                    {{ getErrorTypeLabel(errorType) }}
                  </span>
                </div>
                <div class="wa-card-actions-header" @click.stop>
                  <el-button type="text" size="small" @click="navigateToDetail(item.id)">详情</el-button>
                  <el-button type="text" size="small" @click="startReview(item.id)">复习</el-button>
                </div>
              </div>

              <!-- Body: 题目标题 -->
              <div class="wa-card-body">
                <h3 class="wa-question-title">{{ item.questionTitle }}</h3>
                <p class="wa-question-preview">{{ item.questionContent?.slice(0, 100) }}...</p>
              </div>

              <!-- Source: 来源标签 -->
              <div class="wa-card-source">
                <el-tag v-if="activeTab==='ai' && item.sessionId" type="info" size="small">
                  <el-icon class="wa-source-icon"><component :is="sourceIcon(item.source)" /></el-icon>
                  {{ sessionLabel(item.sessionId) }}
                </el-tag>
                <el-tag v-else-if="activeTab==='bank'" type="info" size="small">
                  {{ item.source === 'question_bank' ? '题库' : '模拟考试' }}
                </el-tag>
              </div>

              <!-- Footer: 关键统计信息 -->
              <div class="wa-card-footer">
                <div class="wa-footer-stats">
                  <span class="stat">
                    错<strong>{{ item.wrongCount }}</strong>
                  </span>
                  <span class="stat">
                    掌握度<strong>{{ item.mastery }}%</strong>
                  </span>
                  <span class="stat-secondary">
                    最近答错<strong>{{ formatRelative(item.lastWrongTime) }}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="wa-pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10,20,50,100]"
              :total="redesignFiltered.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </div>

        <!-- Table view -->
        <div v-else style="display: flex; flex-direction: column; gap: 16px; flex: 1; min-height: 0;">
          <div class="wa-table-wrap">
            <el-table :data="redesignPaginated" stripe>
              <el-table-column prop="questionTitle" label="题目" min-width="280">
                <template #default="{ row }">
                  <a class="table-question" @click.stop="navigateToDetail(row.id)">{{ row.questionTitle }}</a>
                </template>
              </el-table-column>
              <el-table-column label="来源" width="180">
                <template #default="{ row }">
                  <el-tag type="info" size="small">
                    <el-icon class="wa-source-icon"><component :is="sourceIcon(row.source)" /></el-icon>
                    {{ row.source==='ai_interview' ? sessionLabel(row.sessionId) : (row.source==='question_bank' ? '题库' : '模拟考试') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="诊断" width="120">
                <template #default="{ row }">
                  <el-tag type="warning" size="small">{{ getErrorTypeLabel(row.errorType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="难度" width="100">
                <template #default="{ row }">
                  <el-tag :type="getDifficultyType(row.difficulty)" size="small">{{ row.difficulty }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="错误/正确" width="120">
                <template #default="{ row }">
                  ✗{{ row.wrongCount }} / ✓{{ row.correctCount }}
                </template>
              </el-table-column>
              <el-table-column label="最近答错" width="140">
                <template #default="{ row }">{{ formatRelative(row.lastWrongTime) }}</template>
              </el-table-column>
              <el-table-column label="下次复习" width="140">
                <template #default="{ row }">{{ formatRelative(row.nextReviewTime) }}</template>
              </el-table-column>
              <el-table-column label="掌握度" width="140">
                <template #default="{ row }">
                  <el-progress :percentage="row.mastery" :format="p => `${p}%`" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button-group>
                    <el-button text type="primary" @click.stop="navigateToDetail(row.id)">详情</el-button>
                    <el-button text type="success" @click.stop="startReview(row.id)">复习</el-button>
                  </el-button-group>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="pagination-area">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10,20,50,100]"
              :total="redesignFiltered.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Grid, List, ChatDotRound, Notebook, Timer, Tickets } from '@element-plus/icons-vue'
import SpacedRepetitionService from '@/services/spacedRepetitionService'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { mockWrongAnswerSessions } from '@/data/mock-wrong-answers'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

const router = useRouter()
const store = useWrongAnswersStore()

// State
const viewMode = ref('card')
const loading = ref(false)
const loadingPlan = ref(false)
const activeTab = ref('ai')
const sessions = ref([])
const sessionMap = computed(() => Object.fromEntries(sessions.value.map(s => [s.sessionId, s])))
const keyword = ref('')
const knowledgeSearch = ref('') // NEW: 知识点搜索
// Sessions sidebar controls
const sessionsCollapsed = ref(true)
const sessionsSearch = ref('')
const sessionShowLimit = ref(8)

const filteredSessions = computed(() => {
  const q = sessionsSearch.value.trim().toLowerCase()
  let list = [...sessions.value]
  if (q) list = list.filter(s => (s.jobTitle||'').toLowerCase().includes(q) || (s.sessionId||'').toLowerCase().includes(q))
  // sort by count desc then by title
  return list.sort((a,b) => (sessionCounts.value[b.sessionId]||0) - (sessionCounts.value[a.sessionId]||0) || (a.jobTitle||'').localeCompare(b.jobTitle||''))
})

const shownSessions = computed(() => sessionsCollapsed.value ? filteredSessions.value.slice(0, sessionShowLimit.value) : filteredSessions.value)

const allErrorTypes = ['knowledge','logic','incomplete','expression']
const selectAllErrorTypes = () => { selectedErrorTypes.value = [...allErrorTypes] }
const clearErrorTypes = () => { selectedErrorTypes.value = [] }
const selectAllKnowledge = () => { selectedKnowledge.value = new Set(knowledgeTags.value) }
const clearKnowledge = () => { selectedKnowledge.value = new Set() }

// bulk selection actions
const selectAllSessions = () => { selectedSessions.value = filteredSessions.value.map(s => s.sessionId) }
const clearSessions = () => { selectedSessions.value = [] }
const selectAllSources = () => { selectedSources.value = ['question_bank', 'mock_exam'] }
const clearSources = () => { selectedSources.value = [] }

// Filters
const selectedSessions = ref([])
const selectedSources = ref([])
const selectedErrorTypes = ref([])
const selectedKnowledge = ref(new Set())
const sortBy = ref('recent')
const sortByPriority = ref(false)

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Data
const wrongAnswers = ref([])

// Persist: localStorage keys and bootstrap
const STORAGE = {
  sessionShowLimit: 'wa.sessionShowLimit',
  errorTypes: 'wa.selectedErrorTypes',
  knowledge: 'wa.selectedKnowledge'
}

// load saved settings
try {
  const savedLimit = Number(localStorage.getItem(STORAGE.sessionShowLimit))
  if (!Number.isNaN(savedLimit) && savedLimit >= 3 && savedLimit <= 50) {
    sessionShowLimit.value = savedLimit
  }
  const savedErr = localStorage.getItem(STORAGE.errorTypes)
  if (savedErr) {
    const arr = JSON.parse(savedErr)
    if (Array.isArray(arr)) selectedErrorTypes.value = arr.filter(v => ['knowledge','logic','incomplete','expression'].includes(v))
  }
  const savedKnow = localStorage.getItem(STORAGE.knowledge)
  if (savedKnow) {
    const arr = JSON.parse(savedKnow)
    if (Array.isArray(arr)) selectedKnowledge.value = new Set(arr)
  }
} catch {}

// Fetch
async function fetchWrongAnswers() {
  loading.value = true
  try {
    await store.fetchWrongAnswers()
    wrongAnswers.value = store.wrongAnswers
  } catch (e) {
    ElMessage.error('加载错题失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchWrongAnswers()
  try {
    if (USE_MOCK) {
      sessions.value = mockWrongAnswerSessions
      return
    }
    const resp = await fetch('/api/sessions')
    if (resp.ok) {
      const payload = await resp.json()
      const list = Array.isArray(payload) ? payload : payload?.data
      if (Array.isArray(list)) sessions.value = list
    }
  } catch {
    if (USE_MOCK) {
      sessions.value = mockWrongAnswerSessions
    }
  }
})

// save on change
watch(sessionShowLimit, v => localStorage.setItem(STORAGE.sessionShowLimit, String(v)))
watch(selectedErrorTypes, v => localStorage.setItem(STORAGE.errorTypes, JSON.stringify(v)), { deep: true })
watch(selectedKnowledge, v => localStorage.setItem(STORAGE.knowledge, JSON.stringify(Array.from(v))))

// UI helpers
const setActiveTab = (tab) => { activeTab.value = tab; applyFilters() }
const sessionLabel = (sid) => sessionMap.value[sid]?.jobTitle || sid || 'AI 面试'
const toggleKnowledge = (tag) => {
  const s = new Set(selectedKnowledge.value)
  if (s.has(tag)) s.delete(tag); else s.add(tag)
  selectedKnowledge.value = s
}

// NEW: 活跃筛选相关的helper函数
const hasActiveFilters = computed(() => {
  return selectedSessions.value.length > 0 ||
         selectedSources.value.length > 0 ||
         selectedErrorTypes.value.length > 0 ||
         selectedKnowledge.value.size > 0 ||
         keyword.value.trim() !== ''
})

const getSessionLabel = (sessionId) => {
  const session = sessions.value.find(s => s.sessionId === sessionId)
  return session?.jobTitle || sessionId
}

const getSourceLabel = (source) => {
  const labels = {
    'question_bank': '题库',
    'mock_exam': '模拟考试'
  }
  return labels[source] || source
}

const removeSessions = (sessionId) => {
  selectedSessions.value = selectedSessions.value.filter(s => s !== sessionId)
  applyFilters()
}

const removeSources = (source) => {
  selectedSources.value = selectedSources.value.filter(s => s !== source)
  applyFilters()
}

const removeErrorType = (type) => {
  selectedErrorTypes.value = selectedErrorTypes.value.filter(t => t !== type)
  applyFilters()
}

const removeKnowledge = (tag) => {
  const s = new Set(selectedKnowledge.value)
  s.delete(tag)
  selectedKnowledge.value = s
  applyFilters()
}

const clearAllFilters = () => {
  selectedSessions.value = []
  selectedSources.value = []
  selectedErrorTypes.value = []
  selectedKnowledge.value.clear()
  keyword.value = ''
  applyFilters()
}

const getDifficultyType = (d) => ({ easy: 'success', medium: 'warning', hard: 'danger' }[d] || 'info')
const getStatusType = (s) => ({ mastered: 'success', reviewing: 'warning', unreviewed: 'info' }[s] || 'info')
const getErrorTypeLabel = (v) => ({ knowledge: '知识点错误', logic: '逻辑混乱', incomplete: '回答不完整', expression: '表达不流畅' }[v] || '诊断')
// counts for sidebar badges
const aiTotalCount = computed(() => wrongAnswers.value.filter(i => i.source === 'ai_interview').length)
const bankTotalCount = computed(() => wrongAnswers.value.filter(i => i.source !== 'ai_interview').length)
const sessionCounts = computed(() => {
  const map = {}
  for (const i of wrongAnswers.value) {
    if (i.source === 'ai_interview') map[i.sessionId] = (map[i.sessionId] || 0) + 1
  }
  return map
})
const sourceCounts = computed(() => {
  return wrongAnswers.value.reduce((acc, i) => {
    acc[i.source] = (acc[i.source] || 0) + 1
    return acc
  }, {})
})

// source icon map
const sourceIcon = (s) => {
  if (s === 'ai_interview') return ChatDotRound
  if (s === 'question_bank') return Notebook
  if (s === 'mock_exam') return Timer
  return Tickets
}

const formatRelative = (date) => {
  if (!date) return '暂无'
  const d = new Date(date).getTime(); const diff = Date.now() - d
  const day = 86400000, hour = 3600000
  if (diff >= day) return `${Math.floor(diff/day)}天前`
  if (diff >= hour) return `${Math.floor(diff/hour)}小时前`
  return '刚刚'
}

// Derived
const knowledgeTags = computed(() => {
  const set = new Set()
  for (const i of wrongAnswers.value) {
    (i.knowledgePoints || []).forEach(t => set.add(t))
  }
  return Array.from(set)
})

// NEW: 过滤知识点标签（支持搜索）
const filteredKnowledgeTags = computed(() => {
  const q = knowledgeSearch.value.trim().toLowerCase()
  if (!q) return knowledgeTags.value
  return knowledgeTags.value.filter(tag => tag.toLowerCase().includes(q))
})

// Filtering and sorting
const filteredAnswers = computed(() => {
  let list = [...wrongAnswers.value]

  if (keyword.value) {
    const k = keyword.value.toLowerCase()
    list = list.filter(i => (i.questionTitle||'').toLowerCase().includes(k) || (i.questionContent||'').toLowerCase().includes(k))
  }

  if (activeTab.value === 'ai') {
    if (selectedSessions.value.length > 0) {
      list = list.filter(i => selectedSessions.value.includes(i.sessionId))
    }
    list = list.filter(i => i.source === 'ai_interview')
  } else {
    if (selectedSources.value.length > 0) {
      list = list.filter(i => selectedSources.value.includes(i.source))
    } else {
      list = list.filter(i => i.source !== 'ai_interview')
    }
  }

  if (selectedErrorTypes.value.length > 0) {
    list = list.filter(i => i.errorType && selectedErrorTypes.value.includes(i.errorType))
  }

  if (selectedKnowledge.value.size > 0) {
    list = list.filter(i => (i.knowledgePoints||[]).some(t => selectedKnowledge.value.has(t)))
  }

  list = list.map(item => ({
    ...item,
    priority: SpacedRepetitionService.calculatePriority(item),
    mastery: SpacedRepetitionService.calculateMasteryScore(item),
    priorityLabel: SpacedRepetitionService.getPriorityLevel(SpacedRepetitionService.calculatePriority(item)),
    priorityColor: '#409eff'
  }))

  if (sortByPriority.value) {
    list.sort((a,b) => b.priority - a.priority)
  } else {
    switch (sortBy.value) {
      case 'reviewed':
        list.sort((a,b) => (b.wrongCount+b.correctCount) - (a.wrongCount+a.correctCount)); break
      case 'nextReview':
        list.sort((a,b) => new Date(a.nextReviewTime) - new Date(b.nextReviewTime)); break
      case 'priority':
        list.sort((a,b) => b.priority - a.priority); break
      case 'recent':
      default:
        list.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    }
  }

  return list
})

const redesignFiltered = filteredAnswers
const redesignPaginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return redesignFiltered.value.slice(start, start + pageSize.value)
})

const applyFilters = () => { currentPage.value = 1 }

// Navigation and actions
const navigateToDetail = (recordId) => {
  router.push({ name: 'WrongAnswerDetail', params: { recordId } })
}
const startReview = (recordId) => {
  router.push({ name: 'WrongAnswerDetail', params: { recordId } })
}
const generateReviewPlan = async () => {
  loadingPlan.value = true
  try {
    await store.generateReviewPlan()
    ElMessage.success('已生成复习计划，正在跳转...')
    setTimeout(() => router.push({ name: 'WrongAnswers' }), 600)
  } catch { ElMessage.error('生成复习计划失败') } finally { loadingPlan.value = false }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

/* ========== Page Structure ========== */
.wrong-answers-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 12px;
  }

  @media (max-width: 480px) {
    padding: 8px;
  }
}

/* ========== Page Header ========== */
.page-header {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin: 0 0 20px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    margin: 0 0 16px 0;
    width: 100%;
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin: 0 0 12px 0;
    width: 100%;
  }
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
  line-height: 1.2;
}

.page-header .subtitle {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.header-content {
  flex: 1;
}

.header-tabs {
  margin-top: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;

    button {
      flex: 1;
    }
  }
}

.view-toggle {
  display: flex;
  gap: 0;
}

/* ========== Content Wrapper (Grid Layout) ========== */
.content-wrapper {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  flex: 1;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  width: 100%;
  max-width: none;

  @media (max-width: 1024px) {
    grid-template-columns: auto 1fr;
    gap: 16px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin: 0;
    width: 100%;
  }

  @media (max-width: 480px) {
    margin: 0;
    width: 100%;
    gap: 12px;
  }
}

/* ========== Filter Panel ========== */
.filter-panel {
  background: white;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
  overflow: hidden;
  box-sizing: border-box;
  flex-shrink: 0;
  min-width: 200px;

  @media (max-width: 768px) {
    position: static;
    margin-bottom: 0;
    top: auto;
    min-width: auto;
  }
}

.filter-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;

  &:first-child {
    padding-top: 16px;
  }

  &:last-child {
    border-bottom: none;
    padding-bottom: 16px;
  }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 12px 0;
  gap: 8px;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    flex-shrink: 0;
  }
}

.filter-ops {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.op-divider {
  color: #d1d5db;
}

.filter-body {
  display: flex;
  flex-direction: column;
  gap: 8px;

  :deep(.el-input) {
    margin-bottom: 12px;
  }

  :deep(.el-radio-group) {
    width: 100%;
    display: flex;
    flex-direction: column;

    .el-radio-button {
      flex: 1;
      margin-bottom: 6px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;

  :deep(.el-badge) {
    width: 100%;

    .el-badge__content {
      transform: translate(0, -8px);
    }
  }
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  :deep(.el-check-tag) {
    font-size: 12px;
    padding: 6px 12px;
  }
}

/* ========== List Panel ========== */
.list-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
}

.list-toolbar {
  display: flex;
  gap: 12px;
  margin: 0;
  align-items: center;
  flex-shrink: 0;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;

    :deep(.el-input) {
      width: 100%;
    }
  }
}

/* ========== Active Filters Display (NEW!) ========== */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  margin: 0;
  font-size: 14px;
  flex-shrink: 0;
  width: 100%;

  .label {
    color: #666;
    font-weight: 500;
    margin-right: 4px;
    white-space: nowrap;
  }

  :deep(.el-tag) {
    margin-right: 0;
    margin-bottom: 4px;
  }

  :deep(.el-button) {
    margin-left: 8px;
  }
}

/* ========== Grid and Cards ========== */
.wa-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin: 0;
  flex: 1;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.wa-card-redesigned {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  box-sizing: border-box;
  min-height: 240px;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #409eff;
    transform: translateY(-2px);
  }
}

.wa-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.wa-diagnosis-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.diagnosis-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
  display: inline-block;
}

.diagnosis-knowledge {
  background-color: #fee;
  color: #c33;
}

.diagnosis-logic {
  background-color: #fef5e6;
  color: #d97706;
}

.diagnosis-incomplete {
  background-color: #fef3f2;
  color: #d32f2f;
}

.diagnosis-expression {
  background-color: #f0f9ff;
  color: #1976d2;
}

.wa-card-actions-header {
  display: none;
  gap: 4px;
  flex-shrink: 0;
}

.wa-card-redesigned:hover .wa-card-actions-header {
  display: flex;
}

.wa-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wa-question-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wa-question-preview {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wa-card-source {
  display: flex;
  gap: 8px;
}

.wa-card-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  margin-top: auto;
}

.wa-footer-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  gap: 8px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 4px;
  }
}

.wa-footer-stats .stat,
.wa-footer-stats .stat-secondary {
  display: flex;
  gap: 4px;
  align-items: center;
}

.wa-footer-stats strong {
  color: #333;
  font-weight: 500;
}

.wa-footer-stats .stat-secondary {
  margin-left: auto;

  @media (max-width: 480px) {
    margin-left: 0;
  }
}

/* ========== Table View ========== */
.wa-table-wrap {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin: 0;
  flex: 1;

  :deep(.el-table) {
    --el-table-bg-color: #fff;
  }
}

.table-question {
  cursor: pointer;
  color: #409eff;

  &:hover {
    color: #66b1ff;
    text-decoration: underline;
  }
}

/* ========== Pagination ========== */
.wa-pagination {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin: 0;
  flex-shrink: 0;
}

.pagination-area {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin: 0;
  flex-shrink: 0;
}

/* ========== Responsive Design ========== */
@media (max-width: 768px) {
  .wrong-answers-page {
    padding: 12px 0;
  }

  .page-header {
    padding: 16px;
    margin: 0 12px 16px 12px;
  }

  .content-wrapper {
    gap: 16px;
    margin: 0 12px;
  }

  .filter-panel {
    padding: 0;
  }

  .list-panel {
    padding: 16px;
    gap: 14px;
  }
}

@media (max-width: 480px) {
  .wrong-answers-page {
    padding: 8px 0;
  }

  .page-header {
    padding: 12px;
    margin: 0 8px 12px 8px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .page-header .subtitle {
    font-size: 12px;
  }

  .content-wrapper {
    margin: 0 8px;
    gap: 12px;
  }

  .wa-card-redesigned {
    padding: 12px;
    gap: 10px;
    min-height: 240px;
  }

  .wa-question-title {
    font-size: 14px;
  }

  .list-panel {
    padding: 12px;
    gap: 12px;
  }

  .wa-grid {
    gap: 10px;
  }
}
</style>
