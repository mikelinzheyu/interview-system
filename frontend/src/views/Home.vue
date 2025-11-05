<template>
  <div class="home-container">
    <!-- 欢迎对话框 -->
    <WelcomeDialog ref="welcomeDialog" />

    <!-- 顶部导航 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo-section">
          <el-icon :size="32" color="#409eff">
            <ChatRound />
          </el-icon>
          <span class="logo-text">智能面试系统</span>
        </div>
        
        <div class="header-actions">
          <el-button type="text" @click="$router.push('/interview/new')">
            <el-icon><Plus /></el-icon>
            开始面试
          </el-button>
          <!-- 通知入口按钮 + 悬浮面板，不影响原有布局 -->
          <el-button class="notif-trigger" text @click="showNotification = !showNotification">
            <el-icon><Bell /></el-icon>
          </el-button>
          <div v-if="showNotification" class="notification-popover">
            <NotificationCenter />
          </div>

          <el-dropdown @command="handleUserAction">
            <div class="user-info">
              <el-avatar :src="user?.avatar" :size="36">
                {{ user?.real_name?.[0] || 'U' }}
              </el-avatar>
              <span class="username">{{ user?.real_name || user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="settings">个人设置</el-dropdown-item>
                <el-dropdown-item command="system">系统设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="main-content">
      <div class="content-wrapper">
        <!-- Hero Section - 英雄区 -->
        <HeroSection />

        <!-- 统计卡片区域 -->
        <div class="stats-grid">
          <StatsCard
            label="面试次数"
            :value="formattedStats.interviewCount.value"
            unit="次"
            :icon="VideoCamera"
            icon-color="#409eff"
            :trend="{ direction: 'up', percent: 12, period: '月' }"
            clickable
            route="/interview/history"
          />

          <StatsCard
            label="总练习时长"
            :value="formattedStats.practiceTime.formatted"
            :icon="Clock"
            icon-color="#67c23a"
            :trend="{ direction: 'up', percent: 8, period: '月' }"
            clickable
            route="/analysis/time"
          />

          <StatsCard
            label="平均分数"
            :value="formattedStats.averageScore.value"
            unit="分"
            :icon="Trophy"
            icon-color="#e6a23c"
            :trend="{ direction: 'up', percent: 5, period: '月' }"
            clickable
            route="/analysis/score"
          />

          <StatsCard
            label="当前排名"
            :value="formattedStats.rank.level"
            :subtitle="formattedStats.rank.formatted"
            :icon="Star"
            icon-color="#f56c6c"
            :trend="null"
            clickable
            route="/achievements"
          />
        </div>

        <!-- 错题集统计卡片已移除，保留“我的错题集”预览 -->

        <!-- 功能入口区域 -->
        <div class="feature-section">
          <h2 class="section-title">功能入口</h2>
          <div class="feature-grid">
            <FeatureCard
              v-for="feature in filteredFeatures"
              :key="feature.key"
              :title="feature.title"
              :description="feature.description"
              :button-text="feature.buttonText"
              :icon="feature.icon"
              :icon-color="feature.color"
              :route="feature.route"
            />
          </div>
        </div>

        <!-- 错题集功能展示区域 -->
        <div class="wrong-answers-feature-section">
          <WrongAnswersPreview />
        </div>

        <!-- 趋势分析和推荐 -->
        <div class="trend-section">
          <h2 class="section-title">数据洞察</h2>
          <TrendAnalysis />
        </div>

        <!-- 推荐内容 -->
        <div class="recommendation-section">
          <RecommendationFeed />
        </div>

        <!-- 最近活动 -->
        <div class="activity-section">
          <h2 class="section-title">最近活动</h2>
          <el-card class="activity-card">
            <el-timeline>
              <el-timeline-item
                v-for="activity in activities"
                :key="activity.id"
                :timestamp="activity.timestamp"
                :color="activity.color"
              >
                <div class="activity-content">
                  <h4>{{ activity.title }}</h4>
                  <p>{{ activity.description }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useStatisticsStore } from '@/stores/statistics'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatRound, Plus, ArrowDown, Bell,
  Document, DataAnalysis, User,
  Edit, PieChart, MagicStick, VideoCamera, Clock, Trophy, Star
} from '@element-plus/icons-vue'
import HeroSection from '@/components/home/HeroSection.vue'
import StatsCard from '@/components/home/StatsCard.vue'
import FeatureCard from '@/components/home/FeatureCard.vue'
import WrongAnswersPreview from '@/components/home/WrongAnswersPreview.vue'
import TrendAnalysis from '@/components/statistics/TrendAnalysis.vue'
import NotificationCenter from '@/components/NotificationCenter.vue'
import RecommendationFeed from '@/components/RecommendationFeed.vue'
import WelcomeDialog from '@/components/home/WelcomeDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const statisticsStore = useStatisticsStore()

const welcomeDialog = ref()
const showNotification = ref(false)

const user = computed(() => userStore.user)
const { formattedStats, loading } = statisticsStore

// 处理统计卡片点击
const handleStatsClick = (type) => {
  switch (type) {
    case 'interviews':
      router.push('/interview/history')
      break
    case 'time':
      router.push('/analysis/time')
      break
    case 'score':
      router.push('/analysis/score')
      break
    case 'rank':
      router.push('/achievements')
      break
    default:
      ElMessage.info('详细统计功能正在开发中...')
  }
}

// 功能入口
const features = ref([
  {
    key: 'ai-interview',
    title: 'AI模拟面试',
    description: '与AI进行真实的面试对话，提升面试技能',
    buttonText: '开始面试',
    icon: markRaw(VideoCamera),
    color: '#409eff',
    route: '/interview/new'
  },
  {
    key: 'questions',
    title: '题库练习',
    description: '海量面试题目，分类练习提升专业能力',
    buttonText: '开始练习',
    icon: markRaw(Document),
    color: '#67c23a',
    route: '/questions'
  },
  {
    key: 'community',
    title: '面试社区',
    description: '统一的社区功能入口，包含贡献、审核、排行榜、徽章等',
    buttonText: '进入社区',
    icon: markRaw(User),
    color: '#9b59b6',
    route: '/community'
  },
  {
    key: 'ability',
    title: '能力画像',
    description: '查看跨专业能力分析，了解您的T型指数和发展建议',
    buttonText: '查看画像',
    icon: markRaw(PieChart),
    color: '#e6a23c',
    route: '/ability/profile'
  }
])

// 过滤功能列表 - 排除AI生成题目
const filteredFeatures = computed(() => features.value.filter(f => f.key !== 'ai-generate'))

// 最近活动
const activities = ref([
  {
    id: 1,
    title: '完成Java工程师面试',
    description: '面试时长: 45分钟，得分: 88分',
    timestamp: '2025-09-21 14:30',
    color: '#409eff'
  },
  {
    id: 2,
    title: '练习算法题目',
    description: '完成了5道数据结构相关题目',
    timestamp: '2025-09-20 16:45',
    color: '#67c23a'
  },
  {
    id: 3,
    title: '更新个人信息',
    description: '完善了个人简历和技能标签',
    timestamp: '2025-09-19 10:20',
    color: '#e6a23c'
  }
])

// 处理功能卡片点击
const handleFeatureClick = (feature) => {
  if (feature.route) {
    router.push(feature.route)
  } else {
    ElMessage.info(`${feature.title}功能正在开发中...`)
  }
}

// 处理用户操作
const handleUserAction = (command) => {
  switch (command) {
    case 'settings':
      router.push('/settings')
      break
    case 'system':
      ElMessage.info('系统设置功能正在开发中...')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await userStore.logout()
    router.push('/login')
  } catch {
    // 用户取消操作
  }
}

// 初始化统计数据
const initializeStatistics = async () => {
  try {
    await statisticsStore.initialize()
  } catch (error) {
    console.error('Failed to initialize statistics:', error)
    ElMessage.error('统计数据加载失败')
  }
}

onMounted(() => {
  initializeStatistics()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 60px;
  line-height: 60px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 通知悬浮层样式，仅定位在右上角 */
.notif-trigger { margin-left: 8px; }
.notification-popover {
  position: fixed;
  right: 16px;
  top: 64px;
  z-index: 3000;
  width: min(860px, 94vw);
  max-height: 74vh;
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.16);
  padding: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  padding: 0;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Hero Section 已在组件中定义，此处移除旧样式 */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

/* Enhanced stats cards are now self-styled */

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 24px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Hero Section 后的边距 */
:deep(.hero-section) {
  margin-bottom: 40px;
}

.feature-section {
  margin-bottom: 40px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

/* 功能卡片样式已在 FeatureCard.vue 组件中定义 */

.trend-section {
  margin-bottom: 40px;
}

.recommendation-section {
  margin-bottom: 40px;
}

.wrong-answers-section {
  margin-bottom: 40px;
}

.wrong-answers-feature-section {
  margin-bottom: 40px;
}

.activity-section {
  margin-bottom: 40px;
}

.activity-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.activity-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.activity-content p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 13px;
  color: #c0c4cc;
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 20px 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .header-content {
    padding: 0 12px;
  }

  .logo-text {
    display: none;
  }

  .username {
    display: none;
  }
}
</style>




