<template>
  <div class="category-page">
    <!-- 顶部导航 -->
    <el-header class="category-header">
      <div class="header-content">
        <div class="nav-section">
          <el-button type="text" class="back-btn" @click="handleGoBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item to="/achievements">成就中心</el-breadcrumb-item>
            <el-breadcrumb-item>{{ categoryInfo?.name || '分类详情' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </el-header>

    <!-- 主体内容 -->
    <el-main v-loading="loading" class="category-content">
      <div v-if="categoryInfo" class="content-wrapper">
        <!-- 分类信息 -->
        <div class="category-hero">
          <div class="category-icon-large" :style="{ backgroundColor: categoryInfo.color + '20' }">
            <el-icon :size="64" :color="categoryInfo.color">
              <component :is="categoryInfo.icon" />
            </el-icon>
          </div>

          <div class="category-info">
            <h1 class="category-title">{{ categoryInfo.name }}</h1>
            <p class="category-description">{{ categoryInfo.description }}</p>

            <div class="category-stats">
              <div class="stat-item">
                <span class="stat-value">{{ categoryAchievements.length }}</span>
                <span class="stat-label">成就总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ unlockedCount }}</span>
                <span class="stat-label">已解锁</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ completionRate }}%</span>
                <span class="stat-label">完成率</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 成就列表 -->
        <AchievementGrid
          :achievements="categoryAchievements"
          :loading="false"
          @achievement-click="handleAchievementClick"
          @achievement-share="handleAchievementShare"
          @view-detail="handleViewDetail"
        />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="!loading" class="error-state">
        <el-result
          icon="error"
          title="分类不存在"
          sub-title="抱歉，没有找到这个成就分类"
        >
          <template #extra>
            <el-button type="primary" @click="goToAchievements">
              返回成就中心
            </el-button>
          </template>
        </el-result>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStatisticsStore } from '@/stores/statistics'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import AchievementGrid from '@/components/achievements/AchievementGrid.vue'
import { useShare } from '@/composables/useShare'

const route = useRoute()
const router = useRouter()
const statisticsStore = useStatisticsStore()
const { triggerShare } = useShare()

const loading = ref(false)
const categoryInfo = ref(null)
const categoryAchievements = ref([])

const unlockedCount = computed(() => {
  const progressMap = statisticsStore.userAchievementProgress || {}
  return categoryAchievements.value.filter(a => progressMap[a.id]?.unlocked).length
})

const completionRate = computed(() => {
  if (!categoryAchievements.value.length) return 0
  const progressMap = statisticsStore.userAchievementProgress || {}
  const total = categoryAchievements.value.length
  const unlocked = categoryAchievements.value.filter(a => progressMap[a.id]?.unlocked).length
  return Math.round((unlocked / total) * 100)
})

const handleGoBack = () => {
  router.back()
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

const handleViewDetail = (achievement) => {
  handleAchievementClick(achievement)
}

const goToAchievements = () => {
  router.push('/achievements')
}

onMounted(async () => {
  loading.value = true
  try {
    // 确保基础数据已加载
    await statisticsStore.fetchAchievementMetadata()
    await statisticsStore.fetchUserAchievementProgress()
    await statisticsStore.fetchAchievementCategories()

    const categoryId = route.params.categoryId
    const categories = statisticsStore.achievementCategories || []
    categoryInfo.value = categories.find(c => String(c.id) === String(categoryId))

    const allAchievements = statisticsStore.achievementMetadata || []
    categoryAchievements.value = allAchievements.filter(a => String(a.categoryId) === String(categoryId))

    if (!categoryInfo.value) {
      ElMessage.error('未找到对应的成就分类')
    }
  } catch (error) {
    console.error('加载分类数据失败:', error)
    ElMessage.error('加载分类数据失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.category-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.category-header {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  padding-left: 0;
}

.category-content {
  padding: 24px 0 40px;
  background: transparent;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.category-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  margin-bottom: 24px;
}

.category-icon-large {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-info {
  flex: 1;
}

.category-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
}

.category-description {
  margin: 0 0 16px;
  color: #606266;
}

.category-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  min-width: 90px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.error-state {
  max-width: 600px;
  margin: 60px auto;
}

@media (max-width: 768px) {
  .category-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

