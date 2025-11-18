<template>
  <div class="achievements-page">
    <!-- 顶部导航 -->
    <el-header class="header">
      <div class="header-content">
        <div class="nav-section">
          <el-button type="text" class="back-btn" @click="router.back()">
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

    <!-- 主体内容 -->
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

        <!-- 过滤和排序 -->
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
              placeholder="稀有度"
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
              <el-option label="完成度" value="progress" />
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

        <!-- 分页 -->
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
import { ElMessage } from 'element-plus'
import { ArrowLeft, Search, Refresh } from '@element-plus/icons-vue'
import AchievementOverview from '@/components/achievements/AchievementOverview.vue'
import AchievementCategories from '@/components/achievements/AchievementCategories.vue'
import AchievementGrid from '@/components/achievements/AchievementGrid.vue'
import AchievementCard from '@/components/achievements/AchievementCard.vue'
import { useShare } from '@/composables/useShare'

const router = useRouter()
const statisticsStore = useStatisticsStore()
const { triggerShare } = useShare()

// 响应式状态
const searchQuery = ref('')
const activeCategory = ref('all')
const statusFilter = ref('all')
const rarityFilter = ref('all')
const sortBy = ref('progress')
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = ref(24)

// 从 store 中获取数据
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
      case 'unlockedAt': {
        const timeA = progressA?.unlockedAt ? new Date(progressA.unlockedAt) : new Date(0)
        const timeB = progressB?.unlockedAt ? new Date(progressB.unlockedAt) : new Date(0)
        return timeB - timeA
      }
      case 'progress': {
        const percentA = (progressA?.progress || 0) / a.requirement
        const percentB = (progressB?.progress || 0) / b.requirement
        return percentB - percentA
      }
      case 'rarity': {
        const order = { common: 1, rare: 2, epic: 3, legendary: 4 }
        return (order[b.rarity] || 0) - (order[a.rarity] || 0)
      }
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

const totalPages = computed(() =>
  Math.ceil(filteredAchievements.value.length / pageSize.value || 1)
)

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
  const main = document.querySelector('.main-content')
  if (main) {
    main.scrollTo({ top: 0, behavior: 'smooth' })
  }
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
  if (!achievement) return
  const title = '我解锁了一个成就'
  const text = achievement.description || ''
  const url = window.location.href
  triggerShare({ title, text, url })
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

// 监听路由参数变化（支持从其它页面带 category 过滤）
watch(
  () => router.currentRoute.value.query,
  (query) => {
    if (query.category) {
      activeCategory.value = query.category
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.achievements-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  padding-left: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 260px;
}

.main-content {
  padding: 24px 0 40px;
  background: transparent;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-section {
  margin: 24px 0 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-filter,
.rarity-filter,
.sort-select {
  width: 150px;
}

.filter-stats {
  font-size: 13px;
  color: #606266;
}

.pagination-section {
  margin-top: 20px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
}

.recent-section {
  margin-top: 24px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.recent-achievements {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-input {
    flex: 1;
  }

  .filter-section {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

