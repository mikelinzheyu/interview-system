<template>
  <div class="learning-hub-page">
    <!-- 顶部导航 -->
    <header class="hub-header">
      <div class="header-wrapper">
        <div class="logo-section">
          <span class="logo-icon">🎓</span>
          <span class="logo-text">学习中心</span>
        </div>

        <div class="header-actions">
          <el-button text :icon="CircleCheck" @click="showMyProgress = true">学习进度</el-button>
          <el-button text :icon="Star" @click="showMyFavorites = true">我的收藏</el-button>
          <el-button type="primary" @click="goToQuestionBank">题库</el-button>
        </div>
      </div>
    </header>

    <!-- 主搜索区域（搜索引擎风格） -->
    <div v-if="!isSearchMode" class="search-hero">
      <div class="hero-container">
        <!-- 大 Logo -->
        <div class="hero-logo">🎓</div>

        <!-- 大搜索框 -->
        <div class="search-box-wrapper">
          <el-input
            v-model="searchQuery"
            placeholder="搜索题目、知识点、考点..."
            size="large"
            clearable
            @keyup.enter="handleSearch"
            @input="handleSearchInput"
            @focus="showSuggestions = true"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #suffix>
              <el-icon v-if="searchLoading" class="is-loading"><Loading /></el-icon>
            </template>
          </el-input>

          <!-- 搜索建议下拉 -->
          <transition name="slide-fade">
            <div v-if="showSuggestions && searchQuery" class="suggestions-dropdown">
              <div class="suggestion-item" v-for="(item, idx) in searchSuggestions.slice(0, 5)" :key="idx" @click="selectSuggestion(item)">
                <el-icon><Search /></el-icon>
                <span>{{ item }}</span>
              </div>
            </div>
          </transition>
        </div>

        <div class="search-tips">
          <span>输入题目、知识点或考点关键词</span>
        </div>
      </div>

      <!-- 热搜榜 -->
      <div class="hot-search-section">
        <div class="section-title">
          <span class="title-icon">🔥</span>
          <span>全网热搜榜</span>
        </div>

        <div class="hot-search-list">
          <div v-for="(item, idx) in hotSearchRanking" :key="idx" class="hot-item" @click="selectHotSearch(item)">
            <div class="rank-number" :class="{ 'top3': idx < 3 }">{{ idx + 1 }}</div>
            <div class="item-content">
              <div class="item-title">{{ item.keyword }}</div>
              <div class="item-meta">{{ item.count }} 人搜索</div>
            </div>
            <div class="item-tags">
              <el-tag v-if="item.isNew" type="danger" size="small">新</el-tag>
              <el-tag v-if="item.isHot" type="warning" size="small">热</el-tag>
              <span class="heat-value">{{ item.heatValue }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索历史 -->
      <div v-if="recentSearches.length" class="search-history-section">
        <div class="section-header">
          <span class="section-title">搜索历史</span>
          <el-button text type="danger" size="small" @click="clearAllHistory">清空</el-button>
        </div>
        <div class="history-items">
          <div v-for="(search, idx) in recentSearches" :key="idx" class="history-item">
            <el-icon><Clock /></el-icon>
            <span class="history-text" @click="selectHistory(search)">{{ search }}</span>
            <el-icon class="delete-icon" @click="deleteHistory(idx)"><Close /></el-icon>
          </div>
        </div>
      </div>

      <!-- 探索发现 -->
      <div class="discovery-section">
        <div class="section-title">
          <span class="title-icon">✨</span>
          <span>探索发现</span>
        </div>

        <div class="discovery-grid">
          <div v-for="category in discoveryCategories" :key="category.id" class="discovery-card" @click="selectCategory(category)">
            <div class="card-icon">{{ category.icon }}</div>
            <div class="card-name">{{ category.name }}</div>
            <div class="card-count">{{ category.count }} 道题</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果页面 -->
    <div v-else class="search-results-page">
      <div class="results-header">
        <div class="back-search">
          <el-button text @click="goBackToHome">← 返回</el-button>
          <el-input
            v-model="searchQuery"
            placeholder="继续搜索..."
            size="small"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>

        <div class="results-controls">
          <el-select v-model="sortBy" size="small" style="width: 150px">
            <el-option label="最相关" value="relevant" />
            <el-option label="最新" value="newest" />
            <el-option label="最热" value="hottest" />
            <el-option label="难度从低到高" value="difficulty-asc" />
            <el-option label="难度从高到低" value="difficulty-desc" />
          </el-select>
        </div>
      </div>

      <div class="results-container">
        <div v-loading="searchLoading" class="results-list">
          <div v-if="searchResults.length === 0 && !searchLoading" class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">未找到相关结果</div>
            <el-button type="primary" @click="goBackToHome">返回首页</el-button>
          </div>

          <div v-for="result in searchResults" :key="`${result.type}-${result.id}`" class="result-card">
            <div class="result-icon">{{ result.icon }}</div>
            <div class="result-main">
              <div class="result-title" v-html="highlightQuery(result.name)"></div>
              <div class="result-meta">{{ result.meta }}</div>
              <div class="result-desc">{{ result.description }}</div>
            </div>
            <div class="result-action">
              <el-button text type="primary" @click="viewResult(result)">查看</el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <el-pagination
          v-if="totalResults > pageSize"
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalResults"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Loading, CircleCheck, Star, Clock, Close } from '@element-plus/icons-vue'
import { fuzzyMatch, getMatchScore } from '@/utils/pinyin'
import { useQuestionBankStore } from '@/stores/questions'
import { useDomainStore } from '@/stores/domain'

const router = useRouter()
const questionStore = useQuestionBankStore()
const domainStore = useDomainStore()

// 基础状态
const searchQuery = ref('')
const isSearchMode = ref(false)
const searchLoading = ref(false)
const showSuggestions = ref(false)
const showMyProgress = ref(false)
const showMyFavorites = ref(false)

// 搜索相关
const searchResults = ref([])
const sortBy = ref('relevant')
const currentPage = ref(1)
const pageSize = ref(20)
const totalResults = ref(0)

// 历史和热搜
const recentSearches = ref([])
const hotSearchRanking = ref([])

// 搜索建议
const searchSuggestions = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.toLowerCase()
  const candidates = [
    ...questionStore.list.map(q => q.title || q.name),
    ...domainStore.domains.map(d => d.name),
    ...recentSearches.value
  ]
  return [...new Set(candidates)].filter(item => item.toLowerCase().includes(query)).slice(0, 10)
})

// 发现分类
const discoveryCategories = computed(() => {
  return domainStore.domains.slice(0, 6).map(domain => ({
    id: domain.id,
    name: domain.name,
    icon: domain.icon || '📘',
    count: domain.questionCount || 0
  }))
})

onMounted(async () => {
  await loadData()
  loadSearchHistory()
  loadHotSearchRanking()
})

async function loadData() {
  try {
    if (domainStore.domains.length === 0) {
      await domainStore.loadDomains()
    }
    if (questionStore.list.length === 0) {
      await questionStore.initialize()
    }
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

function loadSearchHistory() {
  try {
    const stored = localStorage.getItem('hub-recent-searches')
    if (stored) {
      recentSearches.value = JSON.parse(stored).slice(0, 10)
    }
  } catch {}
}

function loadHotSearchRanking() {
  try {
    const stats = localStorage.getItem('hub-search-stats')
    if (stats) {
      const parsed = JSON.parse(stats)
      hotSearchRanking.value = Object.entries(parsed)
        .map(([keyword, count]) => ({
          keyword,
          count,
          isNew: false,
          isHot: count >= 10,
          heatValue: Math.round(count * 10)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((item, idx) => ({
          ...item,
          isNew: idx === 0
        }))
    } else {
      // 使用预定义的热搜
      hotSearchRanking.value = [
        { keyword: 'JavaScript', count: 156, isNew: false, isHot: true, heatValue: 1560 },
        { keyword: 'Python', count: 134, isNew: false, isHot: true, heatValue: 1340 },
        { keyword: '数据结构', count: 98, isNew: true, isHot: true, heatValue: 980 },
        { keyword: '算法', count: 87, isNew: false, isHot: true, heatValue: 870 },
        { keyword: 'Vue', count: 76, isNew: false, isHot: false, heatValue: 760 },
        { keyword: 'React', count: 65, isNew: false, isHot: false, heatValue: 650 },
        { keyword: '数据库', count: 54, isNew: false, isHot: false, heatValue: 540 },
        { keyword: '设计模式', count: 43, isNew: false, isHot: false, heatValue: 430 },
        { keyword: '操作系统', count: 32, isNew: false, isHot: false, heatValue: 320 },
        { keyword: '网络编程', count: 21, isNew: false, isHot: false, heatValue: 210 }
      ]
    }
  } catch {}
}

function handleSearchInput() {
  showSuggestions.value = true
}

function selectSuggestion(suggestion) {
  searchQuery.value = suggestion
  handleSearch()
}

function selectHotSearch(item) {
  searchQuery.value = item.keyword
  handleSearch()
}

function selectHistory(search) {
  searchQuery.value = search
  handleSearch()
}

function deleteHistory(idx) {
  recentSearches.value.splice(idx, 1)
  saveSearchHistory()
}

function clearAllHistory() {
  recentSearches.value = []
  localStorage.removeItem('hub-recent-searches')
}

function selectCategory(category) {
  router.push(`/learning-hub/domain/${category.id}`)
}

async function handleSearch() {
  if (!searchQuery.value.trim()) return

  searchLoading.value = true
  isSearchMode.value = true
  showSuggestions.value = false
  currentPage.value = 1

  try {
    // 保存搜索历史
    const trimmed = searchQuery.value.trim()
    const filtered = recentSearches.value.filter(item => item !== trimmed)
    recentSearches.value = [trimmed, ...filtered].slice(0, 20)
    saveSearchHistory()

    // 执行搜索
    await performSearch()
  } catch (e) {
    ElMessage.error('搜索失败，请重试')
    console.error('搜索失败', e)
  } finally {
    searchLoading.value = false
  }
}

async function performSearch() {
  const query = searchQuery.value.trim().toLowerCase()

  // 搜索题目
  const questionMatches = questionStore.list
    .filter(q => fuzzyMatch(query, q.title || q.name))
    .map(q => ({
      id: q.id,
      type: 'question',
      name: q.title || q.name,
      icon: '❓',
      meta: `${q.difficulty || '未知'} | ${q.stats?.attempts || 0} 人做过`,
      description: (q.question || '').substring(0, 100),
      score: getMatchScore(query, q.title || q.name)
    }))

  // 搜索领域
  const domainMatches = domainStore.domains
    .filter(d => fuzzyMatch(query, d.name))
    .map(d => ({
      id: d.id,
      type: 'domain',
      name: d.name,
      icon: d.icon || '📘',
      meta: `${d.questionCount || 0} 道题`,
      description: d.description || '',
      score: getMatchScore(query, d.name)
    }))

  // 合并和排序
  const allResults = [...questionMatches, ...domainMatches]
    .sort((a, b) => b.score - a.score)

  // 应用排序
  if (sortBy.value === 'newest') {
    searchResults.value = allResults.reverse()
  } else if (sortBy.value === 'hottest') {
    searchResults.value = allResults.sort((a, b) => (b.meta?.split(' ')[1] || 0) - (a.meta?.split(' ')[1] || 0))
  } else {
    searchResults.value = allResults
  }

  totalResults.value = searchResults.value.length
}

function handlePageChange() {
  // 分页逻辑
}

function highlightQuery(text) {
  if (!searchQuery.value) return text
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function viewResult(result) {
  if (result.type === 'question') {
    router.push(`/learning-hub/question/${result.id}`)
  } else if (result.type === 'domain') {
    router.push(`/learning-hub/domain/${result.id}`)
  }
}

function goBackToHome() {
  isSearchMode.value = false
  searchQuery.value = ''
  searchResults.value = []
  showSuggestions.value = false
}

function goToQuestionBank() {
  router.push('/questions')
}

function saveSearchHistory() {
  try {
    localStorage.setItem('hub-recent-searches', JSON.stringify(recentSearches.value))
  } catch {}
}
</script>

<style scoped lang="scss">
.learning-hub-page {
  min-height: 100vh;
  background: #ffffff;
}

// 顶部导航
.hub-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1f2937;

    .logo-icon {
      font-size: 24px;
    }

    .logo-text {
      font-size: 18px;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

// 搜索英雄区
.search-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px 100px;
  text-align: center;
}

.hero-container {
  max-width: 600px;
  margin: 0 auto;
}

.hero-logo {
  font-size: 48px;
  margin-bottom: 30px;
}

.search-box-wrapper {
  position: relative;
  margin-bottom: 20px;

  :deep(.el-input__wrapper) {
    background: white;
    border-radius: 24px;
    padding: 8px 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-input__inner) {
    font-size: 16px;
  }
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
  z-index: 1000;
  overflow: hidden;

  .suggestion-item {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid #f3f4f6;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f9fafb;
    }

    :deep(.el-icon) {
      color: #6b7280;
    }
  }
}

.search-tips {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  margin-top: 12px;
}

// 热搜榜
.hot-search-section {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 20px;

    .title-icon {
      font-size: 20px;
    }
  }

  .hot-search-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }

  .hot-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid #e5e7eb;

    &:hover {
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #d1d5db;
    }

    .rank-number {
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e5e7eb;
      border-radius: 6px;
      font-weight: 600;
      color: #1f2937;
      font-size: 12px;

      &.top3 {
        background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
        color: white;
      }
    }

    .item-content {
      flex: 1;
      min-width: 0;

      .item-title {
        font-weight: 600;
        color: #1f2937;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 4px;
      }

      .item-meta {
        font-size: 12px;
        color: #6b7280;
      }
    }

    .item-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;

      .heat-value {
        font-size: 12px;
        color: #ef4444;
        font-weight: 600;
      }
    }
  }
}

// 搜索历史
.search-history-section {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .history-items {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f3f4f6;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #e5e7eb;

      .delete-icon {
        opacity: 1;
      }
    }

    .history-text {
      font-size: 13px;
      color: #4b5563;
    }

    .delete-icon {
      opacity: 0;
      transition: opacity 0.2s;
      cursor: pointer;
      color: #6b7280;

      &:hover {
        color: #ef4444;
      }
    }
  }
}

// 探索发现
.discovery-section {
  max-width: 1200px;
  margin: 40px auto 80px;
  padding: 0 20px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 20px;

    .title-icon {
      font-size: 20px;
    }
  }

  .discovery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }

  .discovery-card {
    padding: 20px 16px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;
    color: white;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .card-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .card-name {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .card-count {
      font-size: 12px;
      opacity: 0.9;
    }
  }
}

// 搜索结果页
.search-results-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;

  .back-search {
    display: flex;
    gap: 12px;
    align-items: center;
    flex: 1;

    :deep(.el-input) {
      width: 400px;
    }
  }

  .results-controls {
    display: flex;
    gap: 12px;
  }
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .empty-state {
    text-align: center;
    padding: 60px 20px;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 20px;
    }
  }

  .result-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;
    cursor: pointer;

    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .result-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .result-main {
      flex: 1;
      min-width: 0;

      .result-title {
        font-size: 15px;
        font-weight: 600;
        color: #0066cc;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        mark {
          background-color: #fef08a;
          color: #1f2937;
          font-weight: 700;
        }
      }

      .result-meta {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .result-desc {
        font-size: 13px;
        color: #4b5563;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .result-action {
      flex-shrink: 0;
    }
  }
}

// 过渡动画
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

:deep(.is-loading) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
