<template>
  <div>
    <transition name="overlay">
      <div
        v-if="isOpen"
        class="sidebar-overlay"
        @click="$emit('update:isOpen', false)"
      />
    </transition>

    <aside class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon class="logo-icon"><Lightning /></el-icon>
          <div class="logo-text">AI面试官</div>
        </div>
      </div>

      <div class="sidebar-content">
        <p class="menu-title">主菜单</p>
        <nav class="menu-nav">
          <button
            v-for="item in menuItems"
            :key="item.label"
            class="menu-item"
            :class="{ active: isActive(item) }"
            @click="handleMenuClick(item)"
          >
            <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
            <span class="menu-label">{{ item.label }}</span>
          </button>
        </nav>

        <div class="pro-card">
          <p class="pro-title">Pro 计划</p>
          <p class="pro-desc">解锁无限 AI 模拟面试。</p>
          <button class="pro-btn" @click="handleUpgrade">立即升级</button>
        </div>

        <div class="sidebar-footer">
          <a
            class="footer-item"
            :href="FEEDBACK_URL"
            target="_blank"
            rel="noopener noreferrer"
            @click.prevent="handleFeedback"
          >
            <el-icon><ChatLineSquare /></el-icon>
            <span>我要反馈</span>
          </a>
          <button class="footer-item" @click="handleLogout" type="button">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  DataAnalysis,
  DocumentCopy,
  HomeFilled,
  Lightning,
  SwitchButton,
  UserFilled,
  VideoCamera,
  Warning,
  ChatLineSquare
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface MenuItem {
  icon: any
  label: string
  route: string
}

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  (e: 'update:isOpen', value: boolean): void
}>()

const router = useRouter()
const userStore = useUserStore()

const FEEDBACK_URL =
  'https://vcnucvq8jqax.feishu.cn/wiki/DK4SwrXt3iInT0kmARIc7RTgnnh#GqtcdFa2zok0Nwx7NXwcFhgYnoh'

const menuItems = ref<MenuItem[]>([
  { icon: HomeFilled, label: '总览', route: '/dashboard' },
  { icon: VideoCamera, label: '模拟面试', route: '/interview/ai' },
  { icon: DocumentCopy, label: '学习中心', route: '/learning-hub' },
  { icon: Warning, label: '错题本', route: '/wrong-answers' },
  { icon: DataAnalysis, label: '分析', route: '/ability/profile' },
  { icon: UserFilled, label: '社区', route: '/community' }
])

const isActive = (item: MenuItem) => {
  return router.currentRoute.value.path.startsWith(item.route)
}

const handleMenuClick = async (item: MenuItem) => {
  await router.push(item.route)
}

// Pro 计划按钮：保持原有行为，跳转到 Pro 计划页
const handleUpgrade = () => {
  router.push('/pro-plan')
}

const handleFeedback = () => {
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
.sidebar-overlay {
  display: none;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #f0f0f0;
  box-shadow: 6px 0 24px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 40;
  transform: translateX(0);
}

.sidebar-header {
  height: 80px;
  padding: 0 22px;
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #5a71ff 0%, #a555f7 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.logo-text {
  font-size: 19px;
  font-weight: 800;
  color: #1f2430;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 14px 18px;
  gap: 14px;
  overflow-y: auto;
}

.menu-title {
  font-size: 12px;
  color: #9aa0ad;
  letter-spacing: 0.5px;
  padding: 0 10px;
  margin: 0;
}

.menu-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-radius: 18px;
  background: transparent;
  color: #4a5060;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f7fa;
    color: #141414;
  }

  &.active {
    background: #0f1115;
    color: #ffffff;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
}

.menu-icon {
  width: 20px;
  height: 20px;
}

.menu-label {
  flex: 1;
  text-align: left;
}

.pro-card {
  margin: 14px 4px 0;
  padding: 22px 18px;
  border-radius: 18px;
  background: linear-gradient(145deg, #6b7bff 0%, #8a5cff 50%, #ff70c7 100%);
  color: #fff;
  box-shadow: 0 18px 36px rgba(106, 106, 248, 0.28);
  position: relative;
  overflow: hidden;
}

.pro-card::after {
  content: '';
  position: absolute;
  right: -30px;
  bottom: -30px;
  width: 140px;
  height: 140px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 40%;
  filter: blur(12px);
}

.pro-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 900;
}

.pro-desc {
  margin: 0 0 16px;
  font-size: 12px;
  opacity: 0.92;
  line-height: 1.5;
}

.pro-btn {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 6px 0;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  border-radius: 14px;
  color: #4a5060;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f7fa;
    color: #0f1115;
  }
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
