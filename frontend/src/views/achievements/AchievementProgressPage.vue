<template>
  <div class="progress-page-container">
    <!-- 导航栏 -->
    <el-header class="progress-header">
      <div class="header-content">
        <div class="nav-section">
          <el-button type="text" @click="handleGoBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h1 class="page-title">成就进度追踪</h1>
        </div>
      </div>
    </el-header>

    <!-- 主内容 -->
    <el-main class="progress-content" v-loading="loading">
      <div class="content-wrapper">
        <!-- 总体进度概览 -->
        <div class="overview-section">
          <el-card class="overview-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">整体进度概览</span>
                <el-button @click="refreshData" :loading="refreshing" size="small">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>

            <div class="overview-content">
              <div class="progress-circle-wrapper">
                <el-progress
                  type="circle"
                  :percentage="overallProgress"
                  :width="180"
                  :stroke-width="12"
                  :color="progressColors"
                  class="main-progress-circle"
                >
                  <template #default="{ percentage }">
                    <div class="progress-center">
                      <span class="progress-percentage">{{ percentage }}%</span>
                      <span class="progress-label">总体完成度</span>
                    </div>
                  </template>
                </el-progress>
              </div>

              <div class="overview-stats">
                <div class="stat-grid">
                  <div class="stat-item">
                    <div class="stat-icon">
                      <el-icon :color="'#67c23a'" size="24"><Trophy /></el-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ unlockedCount }}</span>
                      <span class="stat-label">已解锁</span>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon">
                      <el-icon :color="'#409eff'" size="24"><Loading /></el-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ inProgressCount }}</span>
                      <span class="stat-label">进行中</span>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon">
                      <el-icon :color="'#c0c4cc'" size="24"><Lock /></el-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ lockedCount }}</span>
                      <span class="stat-label">未开始</span>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon">
                      <el-icon :color="'#e6a23c'" size="24"><Star /></el-icon>
                    </div>
                    <div class="stat-info">
                      <span class="stat-value">{{ totalCount }}</span>
                      <span class="stat-label">总计</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 分类进度 -->
        <div class="category-progress-section">
          <h2 class="section-title">各分类进度</h2>
          <div class="category-progress-grid">
            <el-card
              v-for="category in categoriesWithProgress"
              :key="category.id"
              class="category-progress-card"
              @click="goToCategoryPage(category.id)"
            >
              <div class="category-header">
                <div class="category-icon" :style="{ backgroundColor: category.color + '20' }">
                  <el-icon :size="32" :color="category.color">
                    <component :is="category.icon" />
                  </el-icon>
                </div>
                <div class="category-info">
                  <h3 class="category-name">{{ category.name }}</h3>
                  <p class="category-description">{{ category.description }}</p>
                </div>
              </div>

              <div class="category-progress">
                <div class="progress-info">
                  <span class="progress-text">
                    {{ category.unlockedCount }} / {{ category.totalCount }}
                  </span>
                  <span class="progress-percentage">{{ category.completionRate }}%</span>
                </div>
                <el-progress
                  :percentage="category.completionRate"
                  :color="category.color"
                  :stroke-width="8"
                  :show-text="false"
                  class="category-progress-bar"
                />
              </div>

              <div class="category-achievements">
                <div class="achievement-preview">
                  <div
                    v-for="achievement in category.previewAchievements"
                    :key="achievement.id"
                    class="mini-achievement"
                    :class="{ unlocked: achievement.progress?.unlocked }"
                    :title="achievement.title"
                  >
                    <el-icon :size="16" :color="achievement.progress?.unlocked ? '#67c23a' : '#c0c4cc'">
                      <component :is="achievement.icon || 'Trophy'" />
                    </el-icon>
                  </div>
                  <span v-if="category.remainingCount > 0" class="more-count">
                    +{{ category.remainingCount }}
                  </span>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 近期活动 -->
        <div class="activity-section">
          <h2 class="section-title">近期活动</h2>
          <el-card class="activity-card">
            <el-timeline>
              <el-timeline-item
                v-for="activity in recentActivities"
                :key="activity.id"
                :timestamp="activity.timestamp"
                :color="activity.color"
                :icon="activity.icon"
              >
                <div class="activity-content">
                  <h4 class="activity-title">{{ activity.title }}</h4>
                  <p class="activity-description">{{ activity.description }}</p>
                  <el-button
                    v-if="activity.actionable"
                    type="primary"
                    size="small"
                    text
                    @click="handleActivityAction(activity)"
                  >
                    {{ activity.actionText }}
                  </el-button>
                </div>
              </el-timeline-item>

              <el-timeline-item
                v-if="recentActivities.length === 0"
                timestamp="暂无活动"
                color="#c0c4cc"
              >
                <div class="empty-activity">
                  <p>暂时没有成就活动记录</p>
                  <el-button type="primary" @click="goToAchievements">
                    开始解锁成就
                  </el-button>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>

        <!-- 进度预测 -->
        <div class="prediction-section">
          <h2 class="section-title">进度预测</h2>
          <el-card class="prediction-card">
            <div class="prediction-content">
              <div class="prediction-chart">
                <!-- 这里可以集成图表库显示进度趋势 -->
                <div class="chart-placeholder">
                  <el-icon size="64" color="#c0c4cc"><TrendCharts /></el-icon>
                  <p>进度趋势图表</p>
                  <p class="chart-desc">基于您的活跃度预测未来成就解锁情况</p>
                </div>
              </div>

              <div class="prediction-stats">
                <div class="prediction-item">
                  <h4 class="prediction-title">预计本周</h4>
                  <p class="prediction-value">2-3 个成就</p>
                  <p class="prediction-desc">基于当前活跃度</p>
                </div>

                <div class="prediction-item">
                  <h4 class="prediction-title">预计本月</h4>
                  <p class="prediction-value">8-12 个成就</p>
                  <p class="prediction-desc">保持当前进度</p>
                </div>

                <div class="prediction-item">
                  <h4 class="prediction-title">全部完成</h4>
                  <p class="prediction-value">3-4 个月</p>
                  <p class="prediction-desc">预估时间</p>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatisticsStore } from '@/stores/statistics'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Refresh, Trophy, Loading, Lock, Star, TrendCharts
} from '@element-plus/icons-vue'

const router = useRouter()
const statisticsStore = useStatisticsStore()

// 响应式数据
const loading = ref(true)
const refreshing = ref(false)

// 计算属性
const totalCount = computed(() => statisticsStore.achievementMetadata.length)

const unlockedCount = computed(() => {
  return Object.values(statisticsStore.userAchievementProgress).filter(
    progress => progress.unlocked
  ).length
})

const inProgressCount = computed(() => {
  return Object.values(statisticsStore.userAchievementProgress).filter(
    progress => !progress.unlocked && progress.progress > 0
  ).length
})

const lockedCount = computed(() => {
  return totalCount.value - unlockedCount.value - inProgressCount.value
})

const overallProgress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((unlockedCount.value / totalCount.value) * 100)
})

const progressColors = computed(() => [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#409eff', percentage: 80 },
  { color: '#67c23a', percentage: 100 }
])

const categoriesWithProgress = computed(() => {
  return statisticsStore.achievementCategories.map(category => {
    const categoryAchievements = statisticsStore.achievementMetadata.filter(
      achievement => achievement.category === category.id
    )

    const unlockedAchievements = categoryAchievements.filter(achievement =>
      statisticsStore.userAchievementProgress[achievement.id]?.unlocked
    )

    const totalCount = categoryAchievements.length
    const unlockedCount = unlockedAchievements.length
    const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

    // 预览成就（显示前4个）
    const previewAchievements = categoryAchievements.slice(0, 4).map(achievement => ({
      ...achievement,
      progress: statisticsStore.userAchievementProgress[achievement.id] || {
        unlocked: false,
        progress: 0
      }
    }))

    const remainingCount = Math.max(0, totalCount - 4)

    return {
      ...category,
      totalCount,
      unlockedCount,
      completionRate,
      previewAchievements,
      remainingCount
    }
  })
})

const recentActivities = computed(() => {
  // 模拟近期活动数据
  const activities = []

  // 获取最近解锁的成就
  const recentUnlocked = Object.entries(statisticsStore.userAchievementProgress)
    .filter(([_, progress]) => progress.unlocked && progress.unlockedAt)
    .sort(([_, a], [__, b]) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 3)

  recentUnlocked.forEach(([achievementId, progress]) => {
    const achievement = statisticsStore.achievementMetadata.find(a => a.id === achievementId)
    if (achievement) {
      activities.push({
        id: `unlock_${achievementId}`,
        title: `解锁了成就：${achievement.title}`,
        description: achievement.description,
        timestamp: formatTimestamp(progress.unlockedAt),
        color: '#67c23a',
        icon: 'CircleCheckFilled',
        actionable: true,
        actionText: '查看详情',
        data: { type: 'view_achievement', achievementId }
      })
    }
  })

  return activities
})

// 方法
const handleGoBack = () => {
  router.back()
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

const goToCategoryPage = (categoryId) => {
  router.push({
    name: 'AchievementCategory',
    params: { categoryId }
  })
}

const goToAchievements = () => {
  router.push('/achievements')
}

const handleActivityAction = (activity) => {
  if (activity.data?.type === 'view_achievement') {
    router.push({
      name: 'AchievementDetail',
      params: { achievementId: activity.data.achievementId }
    })
  }
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 7) {
    return date.toLocaleDateString('zh-CN')
  } else if (diffDays > 0) {
    return `${diffDays}天前`
  } else if (diffHours > 0) {
    return `${diffHours}小时前`
  } else {
    return '刚刚'
  }
}

// 生命周期
onMounted(async () => {
  loading.value = true
  try {
    await refreshData()
  } catch (error) {
    console.error('加载进度数据失败:', error)
    ElMessage.error('加载进度数据失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.progress-page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.progress-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 70px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
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

.progress-content {
  padding: 0;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 24px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.overview-section {
  margin-bottom: 48px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}

.overview-content {
  display: flex;
  align-items: center;
  gap: 48px;
}

.progress-circle-wrapper {
  flex-shrink: 0;
}

.progress-center {
  text-align: center;
}

.progress-percentage {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.overview-stats {
  flex: 1;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.category-progress-section {
  margin-bottom: 48px;
}

.category-progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.category-progress-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px;
}

.category-progress-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.category-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.category-description {
  font-size: 13px;
  color: #606266;
  margin: 0;
}

.category-progress {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 8px;
}

.progress-text {
  color: #606266;
  font-weight: 500;
}

.progress-percentage {
  color: #409eff;
  font-weight: 600;
}

.category-progress-bar {
  margin-bottom: 8px;
}

.category-achievements {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.achievement-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-achievement {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  transition: all 0.3s ease;
}

.mini-achievement.unlocked {
  background: rgba(103, 194, 58, 0.1);
}

.mini-achievement:hover {
  transform: scale(1.1);
}

.more-count {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.activity-section {
  margin-bottom: 48px;
}

.activity-content {
  margin-left: 0;
}

.activity-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.activity-description {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px 0;
}

.empty-activity {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.empty-activity p {
  margin: 0 0 12px 0;
}

.prediction-section {
  margin-bottom: 48px;
}

.prediction-content {
  display: flex;
  gap: 48px;
  align-items: center;
}

.prediction-chart {
  flex: 1;
}

.chart-placeholder {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #d0d0d0;
}

.chart-placeholder p {
  margin: 12px 0 0 0;
  color: #909399;
}

.chart-desc {
  font-size: 12px !important;
  margin: 4px 0 0 0 !important;
}

.prediction-stats {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 200px;
}

.prediction-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.prediction-title {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.prediction-value {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
  margin: 0 0 4px 0;
}

.prediction-desc {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .overview-content {
    flex-direction: column;
    gap: 32px;
  }

  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .prediction-content {
    flex-direction: column;
    gap: 32px;
  }

  .prediction-stats {
    flex-direction: row;
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 24px 16px;
  }

  .category-progress-grid {
    grid-template-columns: 1fr;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .prediction-stats {
    flex-direction: column;
  }

  .category-header {
    gap: 12px;
  }

  .category-icon {
    width: 48px;
    height: 48px;
  }
}
</style>