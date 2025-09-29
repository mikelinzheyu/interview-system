<template>
  <div class="achievement-detail-container">
    <!-- 导航栏 -->
    <el-header class="detail-header">
      <div class="header-content">
        <div class="nav-section">
          <el-button type="text" @click="handleGoBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item to="/achievements">成就中心</el-breadcrumb-item>
            <el-breadcrumb-item>成就详情</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-actions">
          <el-button @click="handleShare" v-if="achievement?.progress?.unlocked">
            <el-icon><Share /></el-icon>
            分享成就
          </el-button>
          <el-button @click="refreshDetail" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 主内容区 -->
    <el-main class="detail-content" v-loading="loading">
      <div class="content-wrapper" v-if="achievement">
        <!-- 成就主要信息 -->
        <div class="achievement-hero">
          <div class="hero-background" :class="`rarity-${achievement.rarity}`">
            <div class="hero-pattern"></div>
          </div>

          <div class="hero-content">
            <!-- 成就图标 -->
            <div class="achievement-icon-large" :class="{ unlocked: achievement.progress?.unlocked }">
              <div class="icon-wrapper" :style="{ backgroundColor: iconBgColor }">
                <el-icon :size="80" :color="iconColor">
                  <component :is="achievement.icon || 'Trophy'" />
                </el-icon>
              </div>

              <!-- 解锁效果 -->
              <div v-if="achievement.progress?.unlocked" class="unlock-effects">
                <div class="glow-ring"></div>
                <div class="sparkle sparkle-1"></div>
                <div class="sparkle sparkle-2"></div>
                <div class="sparkle sparkle-3"></div>
              </div>

              <!-- 状态徽章 -->
              <div class="status-badge" :class="statusClass">
                <el-icon size="20">
                  <component :is="statusIcon" />
                </el-icon>
              </div>
            </div>

            <!-- 成就信息 -->
            <div class="achievement-info">
              <div class="rarity-badge" :class="`rarity-${achievement.rarity}`">
                {{ rarityText }}
              </div>

              <h1 class="achievement-title">{{ achievement.title }}</h1>
              <p class="achievement-description">{{ achievement.description }}</p>

              <!-- 解锁时间 -->
              <div v-if="achievement.progress?.unlocked" class="unlock-info">
                <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                <span class="unlock-text">
                  于 {{ formatUnlockTime(achievement.progress.unlockedAt) }} 解锁
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 进度详情 -->
        <div class="progress-section">
          <el-card class="progress-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">完成进度</span>
                <el-tag :type="progressTagType" size="large">
                  {{ progressPercentage }}%
                </el-tag>
              </div>
            </template>

            <div class="progress-content">
              <div class="progress-stats">
                <div class="stat-item">
                  <span class="stat-label">当前进度</span>
                  <span class="stat-value">{{ formatProgress(achievement.progress?.progress || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">目标要求</span>
                  <span class="stat-value">{{ formatRequirement(achievement.requirement) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">剩余进度</span>
                  <span class="stat-value">{{ formatRemaining(achievement.remainingProgress || 0) }}</span>
                </div>
              </div>

              <div class="progress-bar-container">
                <el-progress
                  :percentage="progressPercentage"
                  :color="progressColors"
                  :stroke-width="16"
                  :show-text="false"
                  class="main-progress"
                />
                <div class="progress-label">
                  <span>{{ formatProgress(achievement.progress?.progress || 0) }}</span>
                  <span>{{ formatRequirement(achievement.requirement) }}</span>
                </div>
              </div>

              <!-- 进度历史 -->
              <div v-if="progressHistory.length > 0" class="progress-history">
                <h4 class="history-title">进度记录</h4>
                <el-timeline class="history-timeline">
                  <el-timeline-item
                    v-for="record in progressHistory"
                    :key="record.date"
                    :timestamp="record.date"
                    :color="record.color"
                    :icon="record.icon"
                  >
                    <div class="history-item">
                      <h5>{{ record.title }}</h5>
                      <p>{{ record.description }}</p>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 成就提示和攻略 -->
        <div class="tips-section">
          <el-card class="tips-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><Lightbulb /></el-icon>
                  完成提示
                </span>
              </div>
            </template>

            <div class="tips-content">
              <div v-if="achievement.progress?.unlocked" class="congratulations">
                <el-result
                  icon="success"
                  title="恭喜你已解锁此成就！"
                  sub-title="继续努力，解锁更多精彩成就吧！"
                >
                  <template #extra>
                    <el-button type="primary" @click="goToAchievements">
                      查看更多成就
                    </el-button>
                  </template>
                </el-result>
              </div>

              <div v-else class="tips-list">
                <div class="tip-item" v-for="tip in achievementTips" :key="tip.id">
                  <div class="tip-icon">
                    <el-icon :color="tip.color">
                      <component :is="tip.icon" />
                    </el-icon>
                  </div>
                  <div class="tip-content">
                    <h5 class="tip-title">{{ tip.title }}</h5>
                    <p class="tip-text">{{ tip.content }}</p>
                  </div>
                </div>
              </div>

              <!-- 相关成就推荐 -->
              <div class="related-achievements" v-if="relatedAchievements.length > 0">
                <h4 class="related-title">相关成就推荐</h4>
                <div class="related-list">
                  <div
                    v-for="related in relatedAchievements"
                    :key="related.id"
                    class="related-item"
                    @click="goToAchievement(related.id)"
                  >
                    <el-icon :color="related.color">
                      <component :is="related.icon" />
                    </el-icon>
                    <span class="related-name">{{ related.title }}</span>
                    <el-tag v-if="related.progress?.unlocked" type="success" size="small">
                      已解锁
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="!loading" class="error-state">
        <el-result
          icon="error"
          title="成就不存在"
          sub-title="抱歉，找不到这个成就信息"
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
import {
  ArrowLeft, Share, Refresh, Trophy, CircleCheckFilled,
  Lightbulb, VideoCamera, Clock, Star
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const statisticsStore = useStatisticsStore()

// 响应式数据
const loading = ref(false)
const achievement = ref(null)

// 计算属性
const progressPercentage = computed(() => {
  if (!achievement.value) return 0
  const progress = achievement.value.progress?.progress || 0
  const requirement = achievement.value.requirement
  return Math.min(100, Math.round((progress / requirement) * 100))
})

const progressTagType = computed(() => {
  const percentage = progressPercentage.value
  if (percentage === 100) return 'success'
  if (percentage >= 80) return 'primary'
  if (percentage >= 60) return 'warning'
  return 'info'
})

const progressColors = computed(() => [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#409eff', percentage: 80 },
  { color: '#67c23a', percentage: 100 }
])

const statusClass = computed(() => {
  if (!achievement.value) return 'status-locked'
  if (achievement.value.progress?.unlocked) return 'status-unlocked'
  if ((achievement.value.progress?.progress || 0) > 0) return 'status-progress'
  return 'status-locked'
})

const statusIcon = computed(() => {
  if (!achievement.value) return 'Lock'
  if (achievement.value.progress?.unlocked) return 'CircleCheckFilled'
  if ((achievement.value.progress?.progress || 0) > 0) return 'Loading'
  return 'Lock'
})

const rarityText = computed(() => {
  if (!achievement.value) return '普通'
  const rarityMap = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return rarityMap[achievement.value.rarity] || '普通'
})

const iconColor = computed(() => {
  if (!achievement.value) return '#409eff'
  const colorMap = {
    VideoCamera: '#409eff',
    Clock: '#67c23a',
    Trophy: '#e6a23c',
    Star: '#f56c6c',
    Medal: '#722ed1'
  }
  return colorMap[achievement.value.icon] || '#409eff'
})

const iconBgColor = computed(() => {
  const color = iconColor.value
  return `${color}20`
})

// 模拟数据
const progressHistory = ref([
  {
    date: '2025-09-21',
    title: '取得重大进展',
    description: '完成了第一次AI面试，迈出了重要的第一步',
    color: '#67c23a',
    icon: 'CircleCheckFilled'
  }
])

const achievementTips = computed(() => [
  {
    id: 1,
    icon: 'VideoCamera',
    color: '#409eff',
    title: '多参与面试',
    content: '每次面试都是一次学习机会，即使失败也能获得宝贵经验'
  },
  {
    id: 2,
    icon: 'Clock',
    color: '#67c23a',
    title: '保持练习',
    content: '持续的练习能让你的面试技能不断提升'
  },
  {
    id: 3,
    icon: 'Star',
    color: '#e6a23c',
    title: '关注反馈',
    content: '认真查看面试反馈，针对性地改进不足之处'
  }
])

const relatedAchievements = ref([
  {
    id: 'interview_master',
    title: '面试达人',
    icon: 'Trophy',
    color: '#e6a23c',
    progress: { unlocked: false }
  },
  {
    id: 'time_warrior',
    title: '时间勇士',
    icon: 'Clock',
    color: '#67c23a',
    progress: { unlocked: false }
  }
])

// 方法
const handleGoBack = () => {
  router.back()
}

const handleShare = () => {
  if (!achievement.value) return

  if (navigator.share) {
    navigator.share({
      title: `我解锁了成就：${achievement.value.title}`,
      text: achievement.value.description,
      url: window.location.href
    }).catch(console.error)
  } else {
    const text = `我解锁了成就：${achievement.value.title} - ${achievement.value.description}`
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('成就信息已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('分享功能不支持')
    })
  }
}

const refreshDetail = async () => {
  await fetchAchievementDetail(route.params.achievementId)
}

const fetchAchievementDetail = async (achievementId) => {
  loading.value = true
  try {
    const result = await statisticsStore.fetchAchievementDetail(achievementId)
    if (result.success) {
      achievement.value = result.data
    } else {
      ElMessage.error('获取成就详情失败')
    }
  } catch (error) {
    console.error('获取成就详情失败:', error)
    ElMessage.error('获取成就详情失败')
  } finally {
    loading.value = false
  }
}

const goToAchievements = () => {
  router.push('/achievements')
}

const goToAchievement = (achievementId) => {
  router.push(`/achievements/detail/${achievementId}`)
}

const formatProgress = (progress) => {
  if (!achievement.value) return '0'
  if (achievement.value.type === 'time') {
    return formatTime(progress)
  } else if (achievement.value.type === 'score') {
    return progress.toFixed(1)
  }
  return progress.toString()
}

const formatRequirement = (requirement) => {
  if (!achievement.value) return '0'
  if (achievement.value.type === 'time') {
    return formatTime(requirement)
  } else if (achievement.value.type === 'score') {
    return requirement.toFixed(1)
  }
  return requirement.toString()
}

const formatRemaining = (remaining) => {
  if (!achievement.value) return '0'
  if (achievement.value.progress?.unlocked) return '已完成'
  if (achievement.value.type === 'time') {
    return formatTime(remaining)
  } else if (achievement.value.type === 'score') {
    return remaining.toFixed(1)
  }
  return remaining.toString()
}

const formatTime = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`
  }
  return `${minutes}分钟`
}

const formatUnlockTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 生命周期
onMounted(() => {
  fetchAchievementDetail(route.params.achievementId)
})
</script>

<style scoped>
.achievement-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.detail-header {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.detail-content {
  padding: 0;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.achievement-hero {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.hero-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-background.rarity-rare {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.hero-background.rarity-epic {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
}

.hero-background.rarity-legendary {
  background: linear-gradient(135deg, #f56c6c 0%, #ff8a8a 100%);
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="stars" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23stars)"/></svg>');
  opacity: 0.3;
}

.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 48px;
  gap: 32px;
}

.achievement-icon-large {
  position: relative;
  flex-shrink: 0;
}

.icon-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.unlock-effects {
  position: absolute;
  inset: -20px;
  pointer-events: none;
}

.glow-ring {
  position: absolute;
  inset: 0;
  border: 2px solid #67c23a;
  border-radius: 50px;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.sparkle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #ffd700;
  border-radius: 50%;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkle-1 { top: 10%; right: 15%; animation-delay: 0s; }
.sparkle-2 { bottom: 15%; left: 10%; animation-delay: 0.6s; }
.sparkle-3 { top: 20%; left: 20%; animation-delay: 1.2s; }

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.status-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-unlocked { color: #67c23a; }
.status-progress { color: #409eff; }
.status-locked { color: #c0c4cc; }

.achievement-info {
  flex: 1;
  color: white;
}

.rarity-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
}

.achievement-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.achievement-description {
  font-size: 18px;
  line-height: 1.6;
  margin: 0 0 24px 0;
  opacity: 0.9;
}

.unlock-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.progress-section,
.tips-section {
  margin-bottom: 32px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.progress-bar-container {
  position: relative;
}

.main-progress {
  margin-bottom: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.history-item h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.history-item p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tip-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.tip-text {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.related-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.related-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.related-name {
  flex: 1;
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

  .hero-content {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
    gap: 24px;
  }

  .achievement-title {
    font-size: 24px;
  }

  .achievement-description {
    font-size: 16px;
  }

  .progress-stats {
    grid-template-columns: 1fr;
  }
}
</style>