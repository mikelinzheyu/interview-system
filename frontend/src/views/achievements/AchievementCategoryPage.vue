<template>
  <div class="category-page-container">
    <!-- 导航栏 -->
    <el-header class="category-header">
      <div class="header-content">
        <div class="nav-section">
          <el-button type="text" @click="handleGoBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item to="/achievements">成就中心</el-breadcrumb-item>
            <el-breadcrumb-item>{{ categoryInfo?.name }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
    </el-header>

    <!-- 主内容 -->
    <el-main class="category-content" v-loading="loading">
      <div class="content-wrapper" v-if="categoryInfo">
        <!-- 分类信息头部 -->
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
                <span class="stat-label">总成就数</span>
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
          sub-title="抱歉，找不到这个成就分类"
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

const route = useRoute()
const router = useRouter()
const statisticsStore = useStatisticsStore()

// 响应式数据
const loading = ref(true)

// 计算属性
const categoryInfo = computed(() => {
  return statisticsStore.achievementCategories.find(
    cat => cat.id === route.params.categoryId
  )
})

const categoryAchievements = computed(() => {
  const categoryId = route.params.categoryId
  const achievements = statisticsStore.achievementMetadata.filter(
    achievement => achievement.category === categoryId
  )

  // 添加进度信息
  return achievements.map(achievement => ({
    ...achievement,
    progress: statisticsStore.userAchievementProgress[achievement.id] || {
      unlocked: false,
      progress: 0,
      unlockedAt: null
    }
  }))
})

const unlockedCount = computed(() => {
  return categoryAchievements.value.filter(a => a.progress.unlocked).length
})

const completionRate = computed(() => {
  if (categoryAchievements.value.length === 0) return 0
  return Math.round((unlockedCount.value / categoryAchievements.value.length) * 100)
})

// 方法
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
  if (navigator.share) {
    navigator.share({
      title: `我解锁了成就：${achievement.title}`,
      text: achievement.description,
      url: window.location.href
    }).catch(console.error)
  } else {
    const text = `我解锁了成就：${achievement.title} - ${achievement.description}`
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('成就信息已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('分享功能不支持')
    })
  }
}

const handleViewDetail = (achievement) => {
  router.push({
    name: 'AchievementDetail',
    params: { achievementId: achievement.id }
  })
}

const goToAchievements = () => {
  router.push('/achievements')
}

// 生命周期
onMounted(async () => {
  loading.value = true
  try {
    // 确保数据已加载
    await statisticsStore.fetchAchievementMetadata()
    await statisticsStore.fetchUserAchievementProgress()
    await statisticsStore.fetchAchievementCategories()
  } catch (error) {
    console.error('加载分类数据失败:', error)
    ElMessage.error('加载分类数据失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.category-page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.category-header {
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

.category-content {
  padding: 0;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.category-hero {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 48px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  margin-bottom: 32px;
}

.category-icon-large {
  width: 120px;
  height: 120px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
}

.category-title {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 16px 0;
}

.category-description {
  font-size: 16px;
  color: #606266;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.category-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 24px 16px;
  }

  .category-hero {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
    gap: 24px;
  }

  .category-icon-large {
    width: 80px;
    height: 80px;
    border-radius: 20px;
  }

  .category-title {
    font-size: 24px;
  }

  .category-stats {
    justify-content: center;
    gap: 24px;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>