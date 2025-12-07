<template>
  <div class="nav-bar-sticky">
    <div class="nav-container">
      <div class="nav-scroll-wrapper no-scrollbar">
        <div 
          v-for="item in items" 
          :key="item.id"
          class="nav-item-wrapper"
          @mouseenter="hoveredTab = item.id"
          @mouseleave="hoveredTab = null"
        >
          <button
            @click="$emit('update:activeTab', item.id)"
            :class="[
              'nav-button',
              activeTab === item.id ? 'active' : 'inactive'
            ]"
          >
            <!-- Icon only on mobile if needed, but design shows text primarily -->
            <component :is="getIcon(item.id)" :size="18" class="nav-icon-mobile" /> 
            <span>{{ item.label }}</span>
            
            <!-- Active Indicator -->
            <span v-if="activeTab === item.id" class="active-indicator"></span>
          </button>

          <!-- Floating Tooltip (Desktop Only) -->
          <div 
            class="floating-tooltip"
            :class="{ 'visible': hoveredTab === item.id }"
          >
            <div class="tooltip-arrow"></div>
            <div class="tooltip-content-box">
              <!-- Decorative Blur -->
              <div class="tooltip-bg-blur"></div>
              
              <div class="tooltip-inner">
                <div class="tooltip-icon-box">
                  <component :is="getIcon(item.id)" :size="18" />
                </div>
                <div class="tooltip-text">
                  <p>{{ item.description }}</p>
                </div>
              </div>
              
              <!-- Hover Progress Line -->
              <div class="tooltip-progress" :style="{ width: hoveredTab === item.id ? '100%' : '0%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  User, Shield, Lock, Bell, Monitor, Settings, Info 
} from 'lucide-vue-next';

defineProps({
  activeTab: String
});

defineEmits(['update:activeTab']);

const hoveredTab = ref(null);

const items = [
  { id: 'profile', label: '个人信息', description: '管理您的个人资料、头像和基本信息' },
  { id: 'security', label: '账户安全', description: '密码修改、两步验证及设备管理' },
  { id: 'privacy', label: '隐私设置', description: '控制谁可以看到您的动态和个人信息' },
  { id: 'notification', label: '通知中心', description: '自定义邮件、短信及推送通知偏好' },
  { id: 'interface', label: '界面偏好', description: '切换深色模式、主题色及字体大小' },
  { id: 'account', label: '账户管理', description: '数据导出或注销您的账户' }
];

const getIcon = (id) => {
  const map = {
    profile: User,
    security: Shield,
    privacy: Lock,
    notification: Bell,
    interface: Monitor,
    account: Settings
  };
  return map[id] || Info;
};
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.nav-bar-sticky {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-slate-200);
  position: sticky;
  top: 0;
  z-index: 50;
  @include transition-all;
}

.nav-container {
  max-width: 64rem; /* max-w-5xl */
  margin: 0 auto;
  padding: 0 1rem;
}

.nav-scroll-wrapper {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  padding: 0.5rem 0;
  position: relative;
  
  @media (min-width: 768px) {
    overflow: visible;
  }
}

.nav-item-wrapper {
  position: relative;
  flex-shrink: 0;
}

.nav-button {
  position: relative;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem; /* text-sm */
  font-weight: 500;
  border-radius: 0.5rem;
  white-space: nowrap;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  @include transition-all;

  &.active {
    color: var(--color-blue-600);
    background-color: rgba(239, 246, 255, 0.5); /* blue-50/50 */
  }

  &.inactive {
    color: var(--color-slate-500);
    
    &:hover {
      color: var(--color-slate-800);
      background-color: var(--color-slate-50);
    }
  }
}

.nav-icon-mobile {
  display: block; 
}

.active-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--color-blue-600);
  border-top-left-radius: 9999px;
  border-top-right-radius: 9999px;
  box-shadow: 0 -2px 6px rgba(37, 99, 235, 0.3);
  animation: slideInLeft 0.3s ease-out;
}

/* Floating Tooltip Styles */
.floating-tooltip {
  display: none; /* Hidden by default (mobile) */
  
  @media (min-width: 768px) {
    display: block;
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-0.5rem) scale(0.95);
    margin-top: 1rem;
    width: 16rem; /* w-64 */
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 50;
    transform-origin: top;

    &.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }
}

.tooltip-arrow {
  position: absolute;
  top: -0.5rem;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 1rem;
  height: 1rem;
  background-color: white;
  border-top: 1px solid rgba(219, 234, 254, 0.5);
  border-left: 1px solid rgba(219, 234, 254, 0.5);
  border-radius: 1px;
  box-shadow: -2px -2px 5px rgba(255, 255, 255, 0.5);
  z-index: 11;
}

.tooltip-content-box {
  position: relative;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: var(--shadow-floating);
  border: 1px solid rgba(219, 234, 254, 0.5);
  backdrop-filter: blur(24px);
  padding: 1rem;
  overflow: hidden;
  z-index: 10;
}

.tooltip-bg-blur {
  position: absolute;
  top: -2.5rem;
  right: -2.5rem;
  width: 6rem;
  height: 6rem;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 9999px;
  filter: blur(24px);
}

.tooltip-inner {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tooltip-icon-box {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background-color: var(--color-blue-50);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-blue-600);
  flex-shrink: 0;
}

.tooltip-text {
  flex: 1;
  p {
    font-size: 0.75rem;
    color: var(--color-slate-600);
    line-height: 1.4;
    font-weight: 500;
    margin: 0;
  }
}

.tooltip-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(to right, var(--color-blue-400), #818cf8); /* indigo-400 */
  transition: width 0.5s ease;
}

@keyframes slideInLeft {
  from { opacity: 0; transform: scaleX(0); }
  to { opacity: 1; transform: scaleX(1); }
}
</style>
