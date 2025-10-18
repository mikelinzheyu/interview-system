<template>
  <div class="left-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 折叠按钮 -->
    <div class="collapse-btn" @click="toggleCollapse">
      <el-icon>
        <Expand v-if="isCollapsed" />
        <Fold v-else />
      </el-icon>
    </div>

    <!-- 导航菜单 -->
    <div class="nav-menu">
      <div
        v-for="item in menuItems"
        :key="item.key"
        class="nav-item"
        :class="{ active: currentRoute === item.route }"
        @click="navigate(item.route)"
      >
        <el-icon :size="20" class="nav-icon">
          <component :is="item.icon" />
        </el-icon>
        <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
        <el-badge
          v-if="item.badge && !isCollapsed"
          :value="item.badge"
          :type="item.badgeType"
          class="nav-badge"
        />
      </div>
    </div>

    <!-- 底部额外功能 -->
    <div class="sidebar-footer">
      <div class="nav-item" @click="$emit('show-settings')">
        <el-icon :size="20" class="nav-icon"><Setting /></el-icon>
        <span v-if="!isCollapsed" class="nav-label">设置</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  House, Trophy, Edit, Checked, Medal, User,
  ChatLineRound, ChatDotSquare, Star, Expand,
  Fold, Setting, Grid
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['show-settings'])

const isCollapsed = ref(false)

const menuItems = [
  {
    key: 'home',
    label: '社区首页',
    icon: House,
    route: '/community'
  },
  {
    key: 'plaza',
    label: '题目广场',
    icon: Grid,
    route: '/community'
  },
  {
    key: 'my-contributions',
    label: '我的贡献',
    icon: Edit,
    route: '/contributions/my-submissions',
    badge: 3,
    badgeType: 'primary'
  },
  {
    key: 'review',
    label: '审核队列',
    icon: Checked,
    route: '/contributions/review-queue',
    badge: 8,
    badgeType: 'warning'
  },
  {
    key: 'leaderboard',
    label: '贡献排行',
    icon: Trophy,
    route: '/contributions/leaderboard'
  },
  {
    key: 'profile',
    label: '我的主页',
    icon: User,
    route: '/contributions/profile/1'
  },
  {
    key: 'badges',
    label: '徽章墙',
    icon: Medal,
    route: '/contributions/badges'
  },
  {
    key: 'forum',
    label: '社区论坛',
    icon: ChatLineRound,
    route: '/community/forums'
  },
  {
    key: 'chat',
    label: '实时聊天',
    icon: ChatDotSquare,
    route: '/chat'
  },
  {
    key: 'follow',
    label: '关注列表',
    icon: Star,
    route: '/community/follow-list'
  }
]

const currentRoute = computed(() => route.path)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const navigate = (path) => {
  router.push(path)
}
</script>

<style scoped>
.left-sidebar {
  position: fixed;
  left: 0;
  top: 65px;
  bottom: 0;
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 900;
  display: flex;
  flex-direction: column;
}

.left-sidebar.collapsed {
  width: 64px;
}

/* 折叠按钮 */
.collapse-btn {
  position: absolute;
  right: -12px;
  top: 20px;
  width: 24px;
  height: 24px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.collapse-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  padding: 20px 0;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.3s;
  color: #606266;
  border-left: 3px solid transparent;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 14px;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.nav-item.active {
  background: linear-gradient(90deg, #ecf5ff 0%, #ffffff 100%);
  color: #409eff;
  border-left-color: #409eff;
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
  transition: all 0.3s;
}

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-label {
  flex: 1;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  margin-left: auto;
}

/* 底部区域 */
.sidebar-footer {
  padding: 15px 0;
  border-top: 1px solid #e4e7ed;
}

/* 滚动条样式 */
.left-sidebar::-webkit-scrollbar {
  width: 6px;
}

.left-sidebar::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.left-sidebar::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

/* 响应式 */
@media (max-width: 768px) {
  .left-sidebar {
    width: 64px;
  }

  .collapse-btn {
    display: none;
  }

  .nav-label,
  .nav-badge {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 14px;
  }
}

/* 动画 */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.nav-item {
  animation: slideIn 0.3s ease-out backwards;
}

.nav-item:nth-child(1) { animation-delay: 0.05s; }
.nav-item:nth-child(2) { animation-delay: 0.1s; }
.nav-item:nth-child(3) { animation-delay: 0.15s; }
.nav-item:nth-child(4) { animation-delay: 0.2s; }
.nav-item:nth-child(5) { animation-delay: 0.25s; }
.nav-item:nth-child(6) { animation-delay: 0.3s; }
.nav-item:nth-child(7) { animation-delay: 0.35s; }
.nav-item:nth-child(8) { animation-delay: 0.4s; }
.nav-item:nth-child(9) { animation-delay: 0.45s; }
.nav-item:nth-child(10) { animation-delay: 0.5s; }
</style>
