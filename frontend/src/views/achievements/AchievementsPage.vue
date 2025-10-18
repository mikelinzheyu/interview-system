<template>
  <div class="achievements-container">
    <!-- 顶部导航 -->
    <el-header class="header">
      <div class="header-content">
        <div class="nav-section">
          <el-button type="text" class="back-btn" @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h1 class="page-title">成就中心</h1>
        </div>

        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索成就..."
            class="search-input"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
          <el-button :loading="refreshing" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="main-content">
      <div class="content-wrapper">
        <!-- 成就总览 -->
        <AchievementOverview
          :stats="achievementStats"
          :loading="loadingStates.overview"
          @view-progress="handleViewProgress"
        />

        <!-- 成就分类导航 -->
        <AchievementCategories
          :categories="achievementCategories"
          :loading="loadingStates.categories"
          :active-category="activeCategory"
          @category-change="handleCategoryChange"
        />

        <!-- 筛选和排序 -->
        <div class="filter-section">
          <div class="filter-controls">
            <el-select
              v-model="statusFilter"
              placeholder="状态筛选"
              class="status-filter"
              @change="applyFilters"
            >
              <el-option label="全部" value="all" />
              <el-option label="已解锁" value="unlocked" />
              <el-option label="未解锁" value="locked" />
              <el-option label="进行中" value="in_progress" />
            </el-select>

            <el-select
              v-model="rarityFilter"
              placeholder="稀有度筛选"
              class="rarity-filter"
              @change="applyFilters"
            >
              <el-option label="全部" value="all" />
              <el-option label="普通" value="common" />
              <el-option label="稀有" value="rare" />
              <el-option label="史诗" value="epic" />
              <el-option label="传说" value="legendary" />
            </el-select>

            <el-select
              v-model="sortBy"
              placeholder="排序方式"
              class="sort-select"
              @change="applySorting"
            >
              <el-option label="解锁时间" value="unlockedAt" />
              <el-option label="进度" value="progress" />
              <el-option label="稀有度" value="rarity" />
              <el-option label="名称" value="title" />
            </el-select>
          </div>

          <div class="filter-stats">
            <span class="results-count">
              显示 {{ filteredAchievements.length }} / {{ totalAchievements }} 个成就
            </span>
          </div>
        </div>

        <!-- 成就网格 -->
        <AchievementGrid
          :achievements="paginatedAchievements"
          :loading="loadingStates.details"
          @achievement-click="handleAchievementClick"
          @achievement-share="handleAchievementShare"
        />

        <!-- 分页控制 -->
        <div v-if="totalPages > 1" class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredAchievements.length"
            :page-sizes="[12, 24, 48, 96]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
        </div>

        <!-- 最近解锁的成就 -->
        <div v-if="recentUnlocked.length > 0" class="recent-section">
          <h2 class="section-title">最近解锁</h2>
          <div class="recent-achievements">
            <AchievementCard
              v-for="achievement in recentUnlocked"
              :key="achievement.id"
              :achievement="achievement"
              :compact="true"
              @click="handleAchievementClick"
            />
          </div>
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStatisticsStore } from '@/stores/statistics'
import { ElMessage, ElNotification } from 'element-plus'
import {
  ArrowLeft, Search, Refresh, Share
} from '@element-plus/icons-vue'
import AchievementOverview from '@/components/achievements/AchievementOverview.vue'
import AchievementCategories from '@/components/achievements/AchievementCategories.vue'
import AchievementGrid from '@/components/achievements/AchievementGrid.vue'
import AchievementCard from '@/components/achievements/AchievementCard.vue'

const router = useRouter()
const statisticsStore = useStatisticsStore()

// 响应式数据
const searchQuery = ref('')
const activeCategory = ref('all')
const statusFilter = ref('all')
const rarityFilter = ref('all')
const sortBy = ref('progress')
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = ref(24)

// 从 store 获取数据
const {
  achievementMetadata,
  achievementCategories,
  userAchievementProgress,
  achievementLoadingStates: loadingStates,
  achievementStats,
  achievementsByCategory,
  recentUnlockedAchievements: recentUnlocked
} = statisticsStore

// 计算属性
const totalAchievements = computed(() => achievementMetadata.length)

const filteredAchievements = computed(() => {
  let achievements = [...achievementMetadata]

  // 分类筛选
  if (activeCategory.value !== 'all') {
    achievements = achievements.filter(a => a.category === activeCategory.value)
  }

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    achievements = achievements.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    )
  }

  // 状态筛选
  if (statusFilter.value !== 'all') {
    achievements = achievements.filter(a => {
      const progress = userAchievementProgress[a.id]
      if (statusFilter.value === 'unlocked') {
        return progress?.unlocked
      } else if (statusFilter.value === 'locked') {
        return !progress?.unlocked
      } else if (statusFilter.value === 'in_progress') {
        return progress && progress.progress > 0 && !progress.unlocked
      }
      return true
    })
  }

  // 稀有度筛选
  if (rarityFilter.value !== 'all') {
    achievements = achievements.filter(a => a.rarity === rarityFilter.value)
  }

  // 排序
  achievements.sort((a, b) => {
    const progressA = userAchievementProgress[a.id]
    const progressB = userAchievementProgress[b.id]

    switch (sortBy.value) {
      case 'unlockedAt':
        const timeA = progressA?.unlockedAt ? new Date(progressA.unlockedAt) : new Date(0)
        const timeB = progressB?.unlockedAt ? new Date(progressB.unlockedAt) : new Date(0)
        return timeB - timeA
      case 'progress':
        const progressPercentA = (progressA?.progress || 0) / a.requirement
        const progressPercentB = (progressB?.progress || 0) / b.requirement
        return progressPercentB - progressPercentA
      case 'rarity':
        const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 }
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  return achievements.map(achievement => ({
    ...achievement,
    progress: userAchievementProgress[achievement.id] || {
      unlocked: false,
      progress: 0,
      unlockedAt: null
    }
  }))
})

const totalPages = computed(() => Math.ceil(filteredAchievements.value.length / pageSize.value))

const paginatedAchievements = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAchievements.value.slice(start, end)
})

// 方法
const handleSearch = () => {
  currentPage.value = 1
}

const handleCategoryChange = (categoryId) => {
  activeCategory.value = categoryId
  currentPage.value = 1
}

const applyFilters = () => {
  currentPage.value = 1
}

const applySorting = () => {
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
  // 滚动到顶部
  document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleAchievementClick = (achievement) => {
  router.push({
    name: 'AchievementDetail',
    params: { achievementId: achievement.id }
  })
}

const handleAchievementShare = (achievement) => {
  if (navigator.share) {
    navigator.share({
      title: `我解锁了成就：${achievement.title}`,
      text: achievement.description,
      url: window.location.href
    }).catch(console.error)
  } else {
    // 复制到剪贴板
    const text = `我解锁了成就：${achievement.title} - ${achievement.description}`
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('成就信息已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('分享功能不支持')
    })
  }
}

const handleViewProgress = () => {
  router.push({ name: 'AchievementProgress' })
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      statisticsStore.fetchAchievementMetadata(true),
      statisticsStore.fetchUserAchievementProgress(true),
      statisticsStore.fetchAchievementCategories()
    ])
    ElMessage.success('数据刷新完成')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 监听路由参数变化
watch(() => router.currentRoute.value.query, (newQuery) => {
  if (newQuery.category) {
    activeCategory.value = newQuery.category
  }
}, { immediate: true })

// 初始化数据
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.achievements-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 70px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 16px;
  padding: 8px 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 300px;
}

.main-content {
  padding: 0;
  overflow-x: hidden;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 32px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.filter-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status-filter,
.rarity-filter,
.sort-select {
  width: 140px;
}

.filter-stats {
  color: #666;
  font-size: 14px;
}

.results-count {
  font-weight: 500;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin: 48px 0;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
}

.recent-section {
  margin-top: 48px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recent-achievements {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-wrapper {
    padding: 24px 16px;
  }

  .filter-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .filter-controls {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
    flex-direction: column;
    height: auto;
    padding: 12px 16px;
  }

  .header-actions {
    width: 100%;
    margin-top: 12px;
  }

  .search-input {
    flex: 1;
    width: auto;
  }

  .page-title {
    font-size: 20px;
  }

  .filter-controls {
    width: 100%;
  }

  .status-filter,
  .rarity-filter,
  .sort-select {
    flex: 1;
  }

  .recent-achievements {
    grid-template-columns: 1fr;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .filter-section,
  .pagination-section {
    background: linear-gradient(135deg, #2a2a2a 0%, #1e1e2e 100%);
    color: #fff;
  }

  .results-count {
    color: #ccc;
  }
}
</style>