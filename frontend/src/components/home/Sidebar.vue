<template>
  <aside class="sidebar" :class="{ collapsed: !isOpen }">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <span class="header-title">主菜单</span>
      <button class="toggle-btn" @click="$emit('toggle')">
        <el-icon><ArrowLeft /></el-icon>
      </button>
    </div>

    <!-- Sidebar Menu -->
    <nav class="sidebar-menu">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="menu-item"
        :class="{ active: activeMenu === item.id }"
        @click="selectMenu(item.id)"
      >
        <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
        <span class="menu-text">{{ item.label }}</span>
      </div>
    </nav>

    <!-- Pro Plan Card -->
    <div class="pro-plan-card">
      <div class="plan-header">Pro 计划</div>
      <p class="plan-desc">解锁无限 AI 模拟面试。</p>
      <button class="plan-btn" @click="goToPricing">立即升级</button>
    </div>

    <!-- Bottom Actions -->
    <div class="sidebar-footer">
      <div class="footer-item" @click="goToFeedback">
        <el-icon><Message /></el-icon>
        <span>我要反馈</span>
      </div>
      <div class="footer-item" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        <span>退出登录</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Menu,
  VideoPlay,
  DocumentCopy,
  DataAnalysis,
  Document,
  User,
  Message,
  SwitchButton,
  ArrowLeft
} from '@element-plus/icons-vue'

interface MenuItem {
  id: string
  label: string
  icon: any
}

const router = useRouter()
const userStore = useUserStore()

const props = defineProps<{
  isOpen?: boolean
  activeMenu?: string
}>()

const emit = defineEmits(['toggle', 'menu-select'])

const FEEDBACK_URL =
  'https://vcnucvq8jqax.feishu.cn/wiki/DK4SwrXt3iInT0kmARIc7RTgnnh#GqtcdFa2zok0Nwx7NXwcFhgYnoh'

const menuItems: MenuItem[] = [
  { id: 'overview', label: '总览', icon: Menu },
  { id: 'simulate', label: '模拟面试', icon: VideoPlay },
  { id: 'learning', label: '学习中心', icon: DocumentCopy },
  { id: 'errors', label: '错题本', icon: Document },
  { id: 'analysis', label: '分析', icon: DataAnalysis },
  { id: 'community', label: '面试社区', icon: User }
]

const activeMenu = computed(() => props.activeMenu || 'overview')
const isOpen = computed(() => props.isOpen !== false)

const routeMap: Record<string, string> = {
  overview: '/',
  simulate: '/interview/ai',
  learning: '/learning-hub',
  errors: '/wrong-answers',
  analysis: '/ability/profile',
  community: '/community'
}

const selectMenu = (id: string) => {
  const route = routeMap[id]
  if (route && route !== '/') {
    router.push(route)
  } else {
    emit('menu-select', id)
    router.push(route || '/')
  }
}

const goToPricing = () => {
  router.push('/pricing')
}

const goToFeedback = () => {
  try {
    window.open(FEEDBACK_URL, '_blank', 'noopener,noreferrer')
  } catch {
    window.location.href = FEEDBACK_URL
  }
}

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.sidebar {
  position: fixed;
  left: 0;
  top: 64px;
  width: 240px;
  height: calc(100vh - 64px);
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s ease;
  z-index: 99;

  &.collapsed {
    width: 80px;

    .sidebar-header {
      .header-title {
        display: none;
      }

      .toggle-btn {
        transform: scaleX(-1);
      }
    }

    .menu-text {
      display: none;
    }

    .menu-item {
      justify-content: center;
    }

    .pro-plan-card {
      .plan-header {
        font-size: 12px;
      }

      .plan-desc {
        display: none;
      }

      .plan-btn {
        width: 100%;
        padding: 8px 4px;
        font-size: 12px;
      }
    }

    .sidebar-footer {
      .footer-item span {
        display: none;
      }
    }
  }
}

.sidebar-header {
  padding: 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #909399;
  transition: all 0.3s ease;

  &:hover {
    background: #f5f7fa;
    color: #0071e3;
  }

  :deep(.el-icon) {
    font-size: 16px;
  }
}

.sidebar-menu {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #909399;
  font-size: 14px;
  font-weight: 500;
  user-select: none;

  &:hover {
    background: #f5f7fa;
    color: #303133;
  }

  &.active {
    background: #000;
    color: #fff;
    border-radius: 14px;
  }
}

.menu-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.menu-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pro-plan-card {
  margin: 12px 8px;
  padding: 20px 16px;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  border-radius: 16px;
  color: #fff;
  text-align: center;
}

.plan-header {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.plan-desc {
  font-size: 12px;
  margin: 0 0 12px;
  opacity: 0.9;
  line-height: 1.5;
}

.plan-btn {
  width: 100%;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.6);
  }
}

.sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  color: #909399;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #f5f7fa;
    color: #303133;
  }

  :deep(.el-icon) {
    font-size: 16px;
    flex-shrink: 0;
  }
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;

  &:hover {
    background: #b0b0b0;
  }
}

@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: -240px;
    transition: left 0.3s ease;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);

    &:not(.collapsed) {
      left: 0;
    }
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 220px;
    left: -220px;

    &.collapsed {
      width: 70px;
      left: -70px;
    }
  }
}

@media (max-width: 640px) {
  .sidebar {
    width: 100%;
    max-width: 220px;
    left: -220px;
    top: 56px;
    height: calc(100vh - 56px);
  }
}
</style>
