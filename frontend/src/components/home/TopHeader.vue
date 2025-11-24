<template>
  <header class="top-header">
    <div class="header-container">
      <!-- Logo and Brand -->
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon">⚡</div>
          <span class="logo-text">AI面试官</span>
        </div>
      </div>

      <!-- Search Bar -->
      <!-- <div class="header-center">
        <div class="search-box">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            type="text"
            class="search-input"
            placeholder="搜索话题或历史记录..."
          />
        </div>
      </div> -->

      <!-- Right Actions -->
      <div class="header-right">
        <!-- Notification -->
        <button class="header-icon-btn" @click="handleNotificationClick" title="通知中心">
          <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
            <el-icon><Bell /></el-icon>
          </el-badge>
        </button>

        <!-- Settings -->
        <button class="header-icon-btn" @click="handleSettingClick" title="设置">
          <el-icon><Setting /></el-icon>
        </button>

        <!-- Auth Buttons or User Menu -->
        <div v-if="!isLoggedIn" class="auth-buttons">
          <button class="login-btn" @click="goToLogin">
            <span>登录</span>
          </button>
          <button class="signup-btn" @click="goToSignup">
            <span>注册</span>
          </button>
        </div>

        <!-- User Menu (if logged in) -->
        <el-dropdown v-if="isLoggedIn" @command="handleUserMenuCommand">
          <div class="user-menu">
            <div class="user-info">
              <span class="user-name">{{ user?.username || user?.real_name || 'User' }}</span>
              <span class="user-title">用户</span>
            </div>
              <img
                v-if="user?.avatar"
                class="user-avatar"
                :src="user.avatar"
                :alt="user.username || user.real_name"
              />
              <div v-else class="user-avatar-placeholder">{{ (user?.username || user?.real_name || 'U')?.[0] }}</div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人资料
              </el-dropdown-item>
              <el-dropdown-item command="change-avatar">
                <el-icon><Camera /></el-icon>
                更改头像
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                设置
              </el-dropdown-item>
              <el-divider />
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- Avatar Upload Dialog -->
        <el-dialog
          v-model="showAvatarModal"
          title="个人头像"
          width="700px"
          align-center
        >
          <AvatarUploader ref="avatarUploaderRef" />
        </el-dialog>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Bell, Setting, User, Camera, SwitchButton } from '@element-plus/icons-vue'
import AvatarUploader from '@/components/AvatarUploader.vue'

const router = useRouter()
const userStore = useUserStore()
const avatarUploaderRef = ref<any>(null)

// 通知计数 - 默认为 0，可选加载
const unreadCount = ref(0)

// 异步加载通知系统（避免应用启动失败）
const initializeNotifications = async () => {
  try {
    const { useNotifications } = await import('@/composables/useNotifications')
    const { unreadCount: count, fetchUnreadCount } = useNotifications()
    unreadCount.value = count
    await fetchUnreadCount()
  } catch (error) {
    console.warn('[TopHeader] 通知系统初始化失败，禁用通知功能:', error.message)
    // 通知系统失败不影响应用，直接跳过
  }
}

// ✅ 使用 isAuthenticated（基于 token），而不是 user 对象
const isLoggedIn = computed(() => userStore.isAuthenticated)
const user = computed(() => userStore.user)

// 头像上传相关
const showAvatarModal = ref(false)

const goToLogin = () => {
  router.push('/login')
}

const goToSignup = () => {
  router.push('/register')
}

const handleUserMenuCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
    case 'change-avatar':
      showAvatarModal.value = true
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      await userStore.logout()
      router.push('/login')
      break
  }
}

// 处理通知按钮点击
const handleNotificationClick = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/notifications')
}

// 处理设置按钮点击
const handleSettingClick = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/settings')
}

defineEmits(['login', 'signup'])
</script>

<style scoped lang="scss">
.top-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  height: 64px;
  display: flex;
  align-items: center;
}

.header-container {
  width: 100%;
  max-width: 100%;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  height: 100%;
}

// Logo Section
.header-left {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;

  .logo-icon {
    font-size: 24px;
    font-weight: 700;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #303133;
  }
}

// Search Section
.header-center {
  flex: 1;
  max-width: 400px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid transparent;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover,
  &:focus-within {
    background: white;
    box-shadow: inset 0 0 0 1px #0071e3, 0 2px 8px rgba(0, 113, 227, 0.1);
  }
}

.search-icon {
  color: #909399;
  font-size: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #303133;
  outline: none;

  &::placeholder {
    color: #c0c4cc;
  }
}

// Right Section
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: fit-content;
}

.header-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;

  &:hover {
    background: #f5f7fa;
    color: #0071e3;
  }

  :deep(.el-icon) {
    font-size: 18px;
  }
}

// Auth Buttons
.auth-buttons {
  display: flex;
  gap: 8px;
  margin-left: 8px;
}

.login-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #0071e3;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 113, 227, 0.1);
  }
}

.signup-btn {
  padding: 8px 20px;
  border: none;
  background: #000;
  color: white;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #1a1a1a;
  }
}

// User Menu
.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;

  .user-info {
    display: flex;
    flex-direction: column;
    text-align: right;

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .user-title {
      font-size: 12px;
      color: #909399;
    }
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .user-avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

// Avatar Upload Container
.avatar-upload-container {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .avatar-preview {
    width: 200px;
    height: 200px;
    margin: 0 auto;
    border-radius: 50%;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 2px dashed #dcdfe6;

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      color: #909399;
      font-size: 14px;
    }
  }

  :deep(.avatar-uploader) {
    width: 100%;

    .el-upload-dragger {
      border-color: #dcdfe6;
      background-color: #fafafa;

      &:hover {
        border-color: #0071e3;
        background-color: #f5f7fa;
      }
    }

    .el-upload__icon {
      color: #0071e3;
      font-size: 40px;
    }

    .el-upload__text {
      color: #606266;
      font-size: 14px;

      em {
        color: #0071e3;
        font-style: normal;
      }
    }

    .el-upload__tip {
      color: #909399;
      font-size: 12px;
      margin-top: 8px;
    }
  }
}

// Responsive
@media (max-width: 1024px) {
  .header-center {
    max-width: 250px;
  }

  .header-container {
    padding: 0 16px;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .header-center {
    display: none;
  }

  .header-left {
    min-width: auto;

    .logo-text {
      display: none;
    }
  }

  .header-icon-btn {
    width: 36px;
    height: 36px;

    :deep(.el-icon) {
      font-size: 16px;
    }
  }

  .signup-btn {
    display: none;
  }

  .user-info {
    display: none;
  }
}

@media (max-width: 640px) {
  .top-header {
    height: 56px;
  }

  .header-container {
    padding: 0 12px;
    gap: 12px;
  }

  .header-icon-btn {
    width: 32px;
    height: 32px;
  }

  .login-btn {
    padding: 6px 16px;
    font-size: 13px;
  }
}
</style>
