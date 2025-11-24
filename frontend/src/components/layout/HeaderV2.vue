<template>
  <header class="header-v2">
    <div class="header-left">
      <button class="menu-toggle" @click="toggleSidebar">
        <el-icon><Menu /></el-icon>
      </button>
      <div class="breadcrumb">
        <span class="breadcrumb-text">仪表板 / <strong>总览</strong></span>
      </div>
    </div>

    <div class="header-center">
      <div class="search-box">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          type="text"
          placeholder="搜索话题或历史记录..."
          class="search-input"
        />
      </div>
    </div>

    <div class="header-right">
      <button class="icon-btn">
        <el-icon><Bell /></el-icon>
      </button>
      <button class="icon-btn">
        <el-icon><Setting /></el-icon>
      </button>
      <div class="auth-actions">
        <button class="link-btn" @click="goLogin">登录</button>
        <button class="primary-btn" @click="goRegister">注册</button>
      </div>
      <div class="user-section">
        <el-avatar :src="userAvatar" :size="40" />
        <div class="user-detail">
          <span class="user-name">{{ userName }}</span>
          <span class="user-role">专业会员</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Bell, Menu, Search, Setting } from '@element-plus/icons-vue'

defineProps<{
  toggleSidebar: () => void
}>()

const router = useRouter()
const userStore = useUserStore()

const userName = computed(() => {
  return userStore.user?.username || userStore.user?.real_name || 'Alex'
})

const userAvatar = computed(() => {
  return userStore.user?.avatar || 'https://picsum.photos/80/80'
})

const goLogin = () => {
  router.push('/login')
}

const goRegister = () => {
  router.push('/register')
}
</script>

<style scoped lang="scss">
.header-v2 {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 68px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.breadcrumb {
  font-size: 13px;
  color: #909399;

  .breadcrumb-text strong {
    color: #303133;
  }

  @media (max-width: 768px) {
    display: none;
  }
}

.menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #f5f7fa;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s ease;

  &:hover {
    background: #e9eef3;
  }

  .el-icon {
    font-size: 18px;
  }

  @media (min-width: 1025px) {
    display: none;
  }
}

.header-center {
  max-width: 520px;
  width: 100%;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px;
  background: #f7f8fa;
  border-radius: 12px;
  border: 1px solid #eef0f3;
  transition: all 0.2s ease;

  &:focus-within {
    background: #fff;
    border-color: #0071e3;
    box-shadow: 0 6px 20px rgba(0, 113, 227, 0.1);
  }
}

.search-icon {
  color: #a0a4ad;
  font-size: 16px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #303133;

  &::placeholder {
    color: #b0b4bc;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #eef0f3;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f7fa;
  }

  .el-icon {
    font-size: 18px;
  }
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-btn {
  border: none;
  background: transparent;
  color: #606266;
  font-weight: 500;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f5f7fa;
  }
}

.primary-btn {
  border: none;
  background: #050505;
  color: #fff;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #111;
    transform: translateY(-1px);
  }
}

.user-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 12px;
  border-left: 1px solid #eef0f3;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.user-role {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 960px) {
  .header-v2 {
    grid-template-columns: auto 1fr auto;
    padding: 0 16px;
  }

  .auth-actions {
    display: none;
  }
}

@media (max-width: 720px) {
  .header-center {
    display: none;
  }

  .user-role {
    display: none;
  }
}
</style>
