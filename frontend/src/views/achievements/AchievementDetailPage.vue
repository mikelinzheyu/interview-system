<template>
  <div class="achievement-detail-page">
    <!-- 顶部导航 -->
    <el-header class="detail-header">
      <div class="header-content">
        <div class="nav-section">
          <el-button type="text" class="back-btn" @click="handleGoBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item to="/achievements">成就中心</el-breadcrumb-item>
            <el-breadcrumb-item>成就详情</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-actions">
          <el-button v-if="achievement?.progress?.unlocked" @click="handleShare">
            <el-icon><Share /></el-icon>
            分享成就
          </el-button>
          <el-button :loading="loading" @click="refreshDetail">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </el-header>

    <!-- 主体内容 -->
    <el-main v-loading="loading" class="detail-content">
      <div v-if="achievement" class="content-wrapper">
        <!-- 成就头部信息 -->
        <div class="achievement-hero">
          <div class="hero-background" :class="`rarity-${achievement.rarity}`"></div>

          <div class="hero-content">
            <div class="achievement-icon-large" :class="{ unlocked: achievement.progress?.unlocked }">
              <div class="icon-wrapper" :style="{ backgroundColor: iconBgColor }">
                <el-icon :size="80" :color="iconColor">
                  <component :is="achievement.icon || 'Trophy'" />
                </el-icon>
              </div>
            </div>

            <div class="achievement-info">
              <div class="rarity-badge" :class="`rarity-${achievement.rarity}`">
                {{ rarityText }}
              </div>
              <h1 class="achievement-title">{{ achievement.title }}</h1>
              <p class="achievement-description">{{ achievement.description }}</p>

              <div v-if="achievement.progress?.unlocked" class="unlock-info">
                <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                <span class="unlock-text">
                  于 {{ formatUnlockTime(achievement.progress.unlockedAt) }} 解锁
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 进度信息 -->
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
              <div class="progress-bar-container">
                <el-progress
                  :percentage="progressPercentage"
                  :color="progressColors"
                  :stroke-width="16"
                  :show-text="false"
                />
                <div class="progress-label">
                  <span>{{ formatProgress(achievement.progress?.progress || 0) }}</span>
                  <span>{{ formatRequirement(achievement.requirement) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 提示与相关成就 -->
        <div class="tips-section">
          <el-card class="tips-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">完成建议</span>
              </div>
            </template>

            <div class="tips-content">
              <div v-if="achievementTips.length" class="tips-list">
                <div v-for="tip in achievementTips" :key="tip.id" class="tip-item">
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

              <div v-if="relatedAchievements.length" class="related-achievements">
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
          sub-title="抱歉，没有找到这个成就"
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
import { ArrowLeft, Refresh, Share, CircleCheckFilled, Trophy, Star } from '@element-plus/icons-vue'
import { useShare } from '@/composables/useShare'

const route = useRoute()
const router = useRouter()
const statisticsStore = useStatisticsStore()
const { triggerShare } = useShare()

const loading = ref(false)
const achievement = ref(null)

const progressPercentage = computed(() => {
  if (!achievement.value) return 0
  const progress = achievement.value.progress?.progress || 0
  const requirement = achievement.value.requirement || 1
  return Math.min(100, Math.round((progress / requirement) * 100))
})

const progressTagType = computed(() => {
  const p = progressPercentage.value
  if (p === 100) return 'success'
  if (p >= 80) return 'primary'
  if (p >= 60) return 'warning'
  return 'info'
})

const progressColors = computed(() => [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#409eff', percentage: 80 },
  { color: '#67c23a', percentage: 100 }
])

const rarityText = computed(() => {
  if (!achievement.value) return '普通'
  const map = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return map[achievement.value.rarity] || '普通'
})

const iconColor = computed(() => {
  if (!achievement.value) return '#409eff'
  const map = {
    VideoCamera: '#409eff',
    Clock: '#67c23a',
    Trophy: '#e6a23c',
    Star: '#f56c6c',
    Medal: '#722ed1'
  }
  return map[achievement.value.icon] || '#409eff'
})

const iconBgColor = computed(() => {
  const color = iconColor.value
  return `${color}20`
})

const achievementTips = computed(() => [
  {
    id: 1,
    icon: 'VideoCamera',
    color: '#409eff',
    title: '多参加练习',
    content: '每一次练习都是一次积累，哪怕失败也能获得经验。'
  },
  {
    id: 2,
    icon: 'Clock',
    color: '#67c23a',
    title: '保持节奏',
    content: '持续稳定地练习，比短时间的高强度冲刺更有效。'
  },
  {
    id: 3,
    icon: 'Star',
    color: '#e6a23c',
    title: '关注反馈',
    content: '定期查看系统给出的建议，有针对性地改进。'
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
    title: '时间战士',
    icon: 'Clock',
    color: '#67c23a',
    progress: { unlocked: false }
  }
])

const handleGoBack = () => {
  router.back()
}

const handleShare = () => {
  if (!achievement.value) return
  const title = '我解锁了一个成就'
  const text = achievement.value.description || ''
  const url = window.location.href
  triggerShare({ title, text, url })
}

const refreshDetail = async () => {
  await fetchAchievementDetail(route.params.achievementId)
}

const fetchAchievementDetail = async (achievementId) => {
  if (!achievementId) return
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
  if (!achievementId) return
  router.push(`/achievements/detail/${achievementId}`)
}

const formatUnlockTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString()
}

const formatProgress = (progress) => {
  return `${progress}`
}

const formatRequirement = (req) => {
  return `${req}`
}

onMounted(async () => {
  await fetchAchievementDetail(route.params.achievementId)
})
</script>

<style scoped>
.achievement-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.detail-header {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-content {
  padding: 24px 0 40px;
  background: transparent;
}

.content-wrapper {
  max-width: 960px;
  margin: 0 auto;
}

.achievement-hero {
  position: relative;
  margin-bottom: 24px;
}

.hero-background {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: radial-gradient(circle at top left, #ffffff40 0%, #00000020 60%, #00000000 100%);
}

.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  border-radius: 16px;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.9);
}

.achievement-icon-large {
  position: relative;
}

.icon-wrapper {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.achievement-info {
  flex: 1;
}

.rarity-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.8);
}

.rarity-common {
  color: #606266;
}

.rarity-rare {
  color: #409eff;
}

.rarity-epic {
  color: #722ed1;
}

.rarity-legendary {
  color: #e6a23c;
}

.achievement-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
}

.achievement-description {
  margin: 0 0 12px;
  color: #606266;
}

.unlock-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #67c23a;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-card {
  border-radius: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-weight: 600;
}

.progress-bar-container {
  margin-top: 12px;
}

.progress-label {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.tips-section {
  margin-bottom: 24px;
}

.tips-card {
  border-radius: 16px;
}

.tips-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.tip-title {
  margin: 0 0 4px;
}

.tip-text {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.related-achievements {
  margin-top: 16px;
}

.related-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
}

.related-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.related-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f5f7fa;
  cursor: pointer;
}

.related-name {
  font-size: 13px;
}

.error-state {
  max-width: 600px;
  margin: 60px auto;
}

@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

