<template>
  <div class="community-header">
    <div class="header-content">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <el-icon :size="32" class="logo-icon"><Promotion /></el-icon>
        <span class="brand-name">面试社区</span>
      </div>

      <!-- 搜索框（增强版） -->
      <div class="search-section">
        <CommunityEnhancedSearch2 @search="(p) => emit('search', p)" />
      </div>

      <!-- 用户功能区 -->
      <div class="user-section">
        <el-button type="primary" class="publish-btn" @click="$emit('create-post')">
          <el-icon><EditPen /></el-icon>
          <span>发布</span>
        </el-button>

        <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
          <el-button circle class="icon-btn" @click="$emit('show-notifications')">
            <el-icon :size="18"><Bell /></el-icon>
          </el-button>
        </el-badge>

        <el-dropdown @command="handleCommand">
          <div class="user-avatar-wrapper">
            <el-avatar :size="36" :src="userAvatar">
              <el-icon><User /></el-icon>
            </el-avatar>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人主页
              </el-dropdown-item>
              <el-dropdown-item command="my-contributions">
                <el-icon><Document /></el-icon>
                我的贡献
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                设置
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Promotion, EditPen, Bell, User, Setting, SwitchButton
} from '@element-plus/icons-vue'
import CommunityEnhancedSearch2 from './CommunityEnhancedSearch2.vue'

const router = useRouter()
const userStore = useUserStore()

const emit = defineEmits(['create-post', 'show-notifications', 'search'])

const unreadCount = ref(5)

const userAvatar = computed(() => userStore.user?.avatar || '')

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push(`/contributions/profile/${userStore.user?.id}`)
      break
    case 'my-contributions':
      router.push('/contributions/my-submissions')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style scoped>
.community-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e4e7ed;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 30px;
}

/* Logo 区域 */
.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.logo-section:hover {
  transform: scale(1.02);
}

.logo-icon {
  color: #409eff;
}

.brand-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

/* 搜索区域 */
.search-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 800px;
}

/* 用户功能区 */
.user-section {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
}

.publish-btn {
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.icon-btn {
  background: #f5f7fa;
  border: none;
  transition: all 0.3s;
}

.icon-btn:hover {
  background: #e4e7ed;
  transform: scale(1.1);
}

.user-avatar-wrapper {
  cursor: pointer;
  transition: all 0.3s;
}

.user-avatar-wrapper:hover {
  transform: scale(1.05);
}

/* 响应式 */
@media (max-width: 768px) {
  .header-content {
    gap: 15px;
  }

  .brand-name {
    display: none;
  }

  .search-section {
    max-width: none;
  }

  .publish-btn span {
    display: none;
  }
}
</style>
