<template>
  <div class="homepage-layout">
    <!-- Top Header -->
    <TopHeader />

    <!-- Main Container -->
    <div class="layout-container">
      <!-- Sidebar -->
      <Sidebar
        :isOpen="sidebarOpen"
        :activeMenu="activeMenu"
        @toggle="toggleSidebar"
        @menu-select="selectMenu"
      />

      <!-- Main Content -->
      <MainContent>
        <template v-if="activeMenu === 'overview'">
          <!-- Hero Section will go here (Phase 2) -->
          <HeroSection
            @start-interview="startInterview"
            @browse-questions="goToQuestionBank"
          />

          <!-- Statistics Cards will go here (Phase 2) -->
          <StatisticsCards :data="statistics" />

          <!-- Dashboard Content will go here (Phase 3) -->
          <DashboardContent
            :chartData="chartData"
            :skillData="skillData"
            :interviewHistory="interviewHistory"
            :activities="activities"
            @view-wrong-answers="goToWrongAnswers"
          />
        </template>

        <!-- Other menu items placeholder -->
        <template v-else>
          <div class="coming-soon">
            <h2>{{ getMenuLabel(activeMenu) }}</h2>
            <p>功能开发中...</p>
          </div>
        </template>
      </MainContent>

      <!-- Mobile Overlay -->
      <div
        v-if="sidebarOpen"
        class="sidebar-overlay"
        @click="toggleSidebar"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHomepageStore } from '@/stores/homepage'
import TopHeader from '@/components/home/TopHeader.vue'
import Sidebar from '@/components/home/Sidebar.vue'
import MainContent from '@/components/home/MainContent.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import StatisticsCards from '@/components/home/StatisticsCards.vue'
import DashboardContent from '@/components/home/DashboardContent.vue'

const router = useRouter()
const homepageStore = useHomepageStore()

// Computed properties from store
const sidebarOpen = computed({
  get: () => homepageStore.sidebarOpen,
  set: (value) => {
    if (value) homepageStore.openSidebar()
    else homepageStore.closeSidebar()
  }
})
const activeMenu = computed({
  get: () => homepageStore.activeMenu,
  set: (value) => homepageStore.setActiveMenu(value)
})

// Sample Data (will be replaced with Pinia store in Phase 6)
const statistics = ref([
  { id: '1', label: '模拟面试', value: 12, unit: '次', trend: 12, icon: 'VideoCamera', color: '#0071e3' },
  { id: '2', label: '练习时长', value: '8.5', unit: '小时', trend: 8, icon: 'Timer', color: '#67c23a' },
  { id: '3', label: '平均分', value: 86, unit: '分', trend: 5, icon: 'Trophy', color: '#e6a23c' },
  { id: '4', label: '全球排名', value: '#421', trend: -2, icon: 'Aim', color: '#f56c6c' }
])

const chartData = ref([
  { name: '周一', value: 40, avg: 30 },
  { name: '周二', value: 65, avg: 45 },
  { name: '周三', value: 50, avg: 55 },
  { name: '周四', value: 85, avg: 50 },
  { name: '周五', value: 60, avg: 65 },
  { name: '周六', value: 90, avg: 70 },
  { name: '周日', value: 75, avg: 60 }
])

const skillData = ref([
  { name: 'Java', value: 85 },
  { name: '系统设计', value: 65 },
  { name: '算法', value: 90 },
  { name: '前端技术', value: 45 },
  { name: '数据库', value: 70 }
])

const interviewHistory = ref([
  { id: 1, topic: 'React Hooks & Performance', date: '2025-09-25', duration: '15 分钟', score: 92, status: '已完成', isFavorite: true },
  { id: 2, topic: 'System Design: URL Shortener', date: '2025-09-24', duration: '20 分钟', score: 88, status: '已完成', isFavorite: false },
  { id: 3, topic: 'JavaScript Event Loop', date: '2025-09-22', duration: '10 分钟', score: 75, status: '需复习', isFavorite: false }
])

const activities = ref([
  { title: '完成模拟面试：系统设计', time: '2 小时前', type: 'interview', score: '92/100' },
  { title: '学习：高级 CSS Grid', time: '5 小时前', type: 'study', score: '+15 XP' },
  { title: '更新个人资料：添加 TypeScript', time: '1 天前', type: 'profile', score: '' }
])

// Methods
const toggleSidebar = () => {
  homepageStore.toggleSidebar()
}

const selectMenu = (menuId: string) => {
  homepageStore.setActiveMenu(menuId)

  // 仅在小屏幕下自动收起，桌面端保持用户手动控制
  if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
    homepageStore.closeSidebar()
  }
}

const getMenuLabel = (menuId: string): string => {
  const menu = homepageStore.menuItems.find(m => m.id === menuId)
  return menu?.label || '总览'
}

const startInterview = async () => {
  // Check system requirements
  const supported = checkSystemRequirements()
  if (supported) {
    router.push('/interview/ai')
  }
}

const checkSystemRequirements = (): boolean => {
  // Basic check - will be enhanced in Phase 2
  const browserSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  return browserSupport
}

const goToQuestionBank = () => {
  router.push({ name: 'LearningHub' })
}

const goToWrongAnswers = () => {
  router.push('/wrong-answers')
}

onMounted(() => {
  // Initialize - load data from Pinia store in Phase 6
})
</script>

<style scoped lang="scss">
.homepage-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f7fa;
}

.layout-container {
  display: flex;
  flex: 1;
  position: relative;
  overflow: hidden;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 98;
  animation: fadeIn 0.3s ease;

  @media (max-width: 1024px) {
    display: block;
  }
}

.coming-soon {
  text-align: center;
  padding: 60px 20px;

  h2 {
    font-size: 24px;
    color: #303133;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    color: #909399;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
