<template>
  <div class="dashboard-container">
    <SidebarNav
      :is-open="isSidebarOpen"
      @update:isOpen="isSidebarOpen = $event"
    />

    <div class="dashboard-main">
      <HeaderV2 :toggle-sidebar="() => (isSidebarOpen = !isSidebarOpen)" />

      <div class="dashboard-body">
        <section class="hero">
          <div class="hero-content">
            <h1>欢迎回来{{ userName }}！</h1>
            <p>准备好拿下你的下一次面试了吗？你的 AI 教练正在等你。</p>
            <div class="hero-actions">
              <button class="btn primary">
                <el-icon><VideoCamera /></el-icon>
                开始 AI 模拟面试
              </button>
              <button class="btn ghost">
                <el-icon><Document /></el-icon>
                浏览题库
              </button>
            </div>
          </div>
          <div class="hero-blob"></div>
        </section>

        <div class="stats-grid">
          <StatCardV2 v-for="stat in statsList" :key="stat.id" :stat="stat" />
        </div>

        <div class="middle-grid">
          <section class="panel chart-panel">
            <div class="panel-header between">
              <div>
                <h3 class="panel-title">学习动态</h3>
                <p class="panel-subtitle">过去 7 天的学习进度</p>
              </div>
              <select class="ghost-select">
                <option>最近 7 天</option>
                <option>最近 30 天</option>
              </select>
            </div>
            <ProgressChart :data="chartList" />
          </section>

          <section class="panel wrong-panel">
            <div class="panel-header">
              <h3 class="panel-title">错题本</h3>
              <p class="panel-subtitle">回顾你最近的错误</p>
            </div>
            <div class="wrong-list">
              <div v-for="item in wrongList" :key="item" class="wrong-item">
                <div class="wrong-icon">
                  <el-icon><DocumentCopy /></el-icon>
                </div>
                <span class="wrong-text">{{ item }}</span>
                <el-icon class="wrong-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
            <button class="ghost-btn" @click="goToWrongAnswers">查看所有错题</button>
          </section>
        </div>

        <section class="panel history-panel">
          <div class="panel-header between">
            <div>
              <p class="panel-label">仪表板 / 总览</p>
              <h2 class="panel-title">面试历史</h2>
              <p class="panel-subtitle">查看你过去的模拟面试记录</p>
            </div>
          </div>
          <InterviewHistory
            :data="historyList"
            :loading="dashboardStore.isLoading"
            :error="dashboardStore.error"
            @toggle-favorite="handleToggleFavorite"
            @view-detail="handleViewInterviewDetail"
            @clear-error="dashboardStore.clearError"
          />
        </section>

        <div class="bottom-grid">
          <section class="panel ability-panel">
            <div class="panel-header between">
              <div>
                <h3 class="panel-title">能力画像</h3>
                <p class="panel-subtitle">基于表现的技能细分</p>
              </div>
            </div>
            <SkillDistributionChart :data="skillList" />
          </section>

          <section class="panel activity-panel">
            <div class="panel-header between">
              <h3 class="panel-title">最近活动</h3>
              <button class="link-btn" @click="viewAllActivities">查看全部</button>
            </div>
            <div class="activity-list">
              <div
                v-for="(item, idx) in activityList"
                :key="item.id"
                class="activity-row"
              >
                <div class="dot">
                  <span class="pulse"></span>
                </div>
                <div class="activity-detail">
                  <div class="activity-head">
                    <span class="activity-title">{{ item.title }}</span>
                    <span v-if="item.score" class="activity-score">{{ item.score }}</span>
                  </div>
                  <p class="activity-time">{{ item.time }}</p>
                  <div v-if="idx < activityList.length - 1" class="timeline"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Document, DocumentCopy, VideoCamera } from '@element-plus/icons-vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import HeaderV2 from '@/components/layout/HeaderV2.vue'
import SkillDistributionChart from '@/components/charts/SkillDistributionChart.vue'
import InterviewHistory from '@/components/home/InterviewHistory.vue'
import ProgressChart from '@/components/charts/ProgressChart.vue'
import StatCardV2 from '@/components/home/StatCardV2.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const dashboardStore = useDashboardStore()
const userStore = useUserStore()
const isSidebarOpen = ref(true)

// 获取用户名（优先使用 real_name，次之 username，最后使用默认值）
const userName = computed(() => {
  return userStore.user?.real_name || userStore.user?.username || 'Alex'
})

const fallbackStats = [
  { id: '1', label: '模拟面试', value: 12, unit: '次', trend: 12, icon: VideoCamera, color: '#3b82f6' },
  { id: '2', label: '练习时长', value: '8.5', unit: '小时', trend: 8, icon: Document, color: '#22c55e' },
  { id: '3', label: '平均分', value: 86, unit: '分', trend: 5, icon: ArrowRight, color: '#f59e0b' },
  { id: '4', label: '全球排名', value: '#421', unit: '', trend: -2, icon: DocumentCopy, color: '#8b5cf6' }
]

const fallbackHistory = [
  { id: 1, topic: 'React Hooks & Performance', date: '2023-10-25', duration: '15 分钟', score: 92, status: '已完成', isFavorite: true },
  { id: 2, topic: 'System Design: URL Shortener', date: '2023-10-24', duration: '20 分钟', score: 88, status: '已完成', isFavorite: false },
  { id: 3, topic: 'JavaScript Event Loop', date: '2023-10-22', duration: '10 分钟', score: 75, status: '需复习', isFavorite: false },
  { id: 4, topic: 'CSS Flexbox vs Grid', date: '2023-10-20', duration: '12 分钟', score: 95, status: '已完成', isFavorite: false }
]

const fallbackSkills = [
  { name: 'Java', value: 85 },
  { name: '系统设计', value: 70 },
  { name: '算法', value: 64 },
  { name: '前端技术', value: 55 },
  { name: '数据库', value: 48 }
]

const fallbackActivities = [
  { id: 1, title: '完成模拟面试：系统设计', time: '2 小时前', type: 'interview', score: '92/100' },
  { id: 2, title: '学习：高级 CSS Grid', time: '5 小时前', type: 'study', score: '+15 XP' },
  { id: 3, title: '更新个人资料：添加 TypeScript', time: '1 天前', type: 'profile' }
]

const fallbackChart = [
  { name: '周一', value: 40, avg: 30 },
  { name: '周二', value: 65, avg: 45 },
  { name: '周三', value: 50, avg: 55 },
  { name: '周四', value: 85, avg: 50 },
  { name: '周五', value: 60, avg: 65 },
  { name: '周六', value: 90, avg: 70 },
  { name: '周日', value: 75, avg: 60 }
]

const wrongList = [
  'React useEffect 依赖项',
  'Java HashMap 内部原理',
  'SQL 索引优化'
]

const historyList = computed(() => {
  return dashboardStore.data.historyData?.length
    ? dashboardStore.data.historyData
    : fallbackHistory
})

const statsList = computed(() => {
  return dashboardStore.data.stats?.length ? dashboardStore.data.stats : fallbackStats
})

const chartList = computed(() => {
  return dashboardStore.data.chartData?.length ? dashboardStore.data.chartData : fallbackChart
})

const skillList = computed(() => {
  return dashboardStore.data.skillDistribution?.length
    ? dashboardStore.data.skillDistribution
    : fallbackSkills
})

const activityList = computed(() => {
  return dashboardStore.data.activities?.length
    ? dashboardStore.data.activities
    : fallbackActivities
})

const goToWrongAnswers = () => {
  router.push('/wrong-answers')
}

const handleToggleFavorite = (id: number) => {
  dashboardStore.toggleFavorite(id)
}

const handleViewInterviewDetail = (item: any) => {
  ElMessage.info(`查看详情: ${item.topic}`)
}

const viewAllActivities = () => {
  ElMessage.info('最近活动列表开发中')
}

onMounted(async () => {
  try {
    await dashboardStore.fetchDashboardData()
  } catch (err) {
    console.error('Failed to load dashboard data', err)
  }
})
</script>

<style scoped lang="scss">
.dashboard-container {
  display: flex;
  background: #f5f7fa;
  min-height: 100vh;
}

.dashboard-main {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  @media (max-width: 1024px) {
    margin-left: 0;
  }
}

.dashboard-body {
  flex: 1;
  padding: 32px 32px 48px;
  max-width: 1300px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 960px) {
    padding: 20px 16px 32px;
  }
}

.hero {
  position: relative;
  margin-bottom: 24px;
  padding: 32px;
  border-radius: 26px;
  background: linear-gradient(135deg, #0071e3 0%, #4facfe 100%);
  overflow: hidden;
  color: #fff;
  box-shadow: 0 20px 40px rgba(0, 113, 227, 0.2);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 560px;
}

.hero h1 {
  margin: 0 0 10px;
  font-size: 32px;
  font-weight: 800;
}

.hero p {
  margin: 0 0 20px;
  font-size: 15px;
  opacity: 0.95;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: inherit;
}

.btn.primary {
  background: #fff;
  color: #0b74e5;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.btn.primary:hover {
  transform: translateY(-2px);
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.3);
}

.hero-blob {
  position: absolute;
  right: -60px;
  top: -80px;
  width: 420px;
  height: 420px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 42% 58% 70% 30% / 37% 44% 56% 63%;
  filter: blur(18px);
  z-index: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.middle-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.chart-panel {
  padding-bottom: 10px;
}

.wrong-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel {
  background: #ffffff;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  &.between {
    justify-content: space-between;
    align-items: flex-start;
  }
}

.panel-label {
  margin: 0 0 2px;
  font-size: 12px;
  color: #9aa0ad;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2430;
}

.panel-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #9aa0ad;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.wrong-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fef3f3;
  border: 1px solid #fde2e2;
  transition: all 0.2s ease;
}

.wrong-item:hover {
  background: #ffe8e8;
}

.wrong-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f56c6c;
}

.wrong-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1f2430;
}

.wrong-arrow {
  color: #f56c6c;
  opacity: 0.7;
}

.ghost-btn {
  width: 100%;
  border: none;
  background: #1f2430;
  color: #fff;
  padding: 14px 18px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ghost-btn:hover {
  background: #0b74e5;
  box-shadow: 0 8px 16px rgba(11, 116, 229, 0.15);
  transform: translateY(-2px);
}

.ghost-btn:active {
  transform: translateY(0);
}

.ghost-select {
  border: 1px solid #eef0f3;
  border-radius: 10px;
  padding: 8px 10px;
  background: #f7f8fa;
  color: #555;
  font-weight: 600;
}

.history-panel {
  padding-bottom: 10px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.ability-panel {
  padding-bottom: 12px;
}

.activity-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-btn {
  border: none;
  background: transparent;
  color: #0071e3;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 10px;
  transition: background 0.2s ease;

  &:hover {
    background: #f1f5ff;
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.activity-row {
  display: flex;
  gap: 12px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22c55e;
  position: relative;
  margin-top: 4px;
  flex-shrink: 0;
}

.pulse {
  position: absolute;
  inset: -6px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.15);
}

.activity-detail {
  flex: 1;
  position: relative;
  padding-bottom: 12px;
}

.activity-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.activity-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2430;
}

.activity-score {
  font-size: 12px;
  color: #22c55e;
  background: #e9f9f0;
  padding: 2px 10px;
  border-radius: 8px;
  font-weight: 700;
  white-space: nowrap;
}

.activity-time {
  margin: 4px 0 0;
  font-size: 12px;
  color: #9aa0ad;
}

.timeline {
  position: absolute;
  left: -26px;
  top: 20px;
  width: 2px;
  bottom: 0;
  background: #e6e8ed;
}

@media (max-width: 720px) {
  .hero {
    padding: 24px;
  }

  .hero h1 {
    font-size: 24px;
  }

  .hero-blob {
    width: 280px;
    height: 280px;
    right: -40px;
    top: -40px;
  }
}
</style>
