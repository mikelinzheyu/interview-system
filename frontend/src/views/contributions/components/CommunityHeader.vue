<template>
  <div class="community-header">
    <div class="header-content">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <el-icon :size="32" class="logo-icon"><Promotion /></el-icon>
        <span class="brand-name">面试社区</span>
      </div>

      <!-- 搜索框 -->
      <div class="search-section">
        <el-autocomplete
          v-model="searchQuery"
          :fetch-suggestions="querySearch"
          placeholder="搜索题目、用户、标签..."
          :trigger-on-focus="false"
          clearable
          class="search-input"
          @select="handleSelect"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #default="{ item }">
            <div class="search-item">
              <el-icon class="search-item-icon">
                <Document v-if="item.type === 'question'" />
                <User v-if="item.type === 'user'" />
                <PriceTag v-if="item.type === 'tag'" />
              </el-icon>
              <span class="search-item-text">{{ item.value }}</span>
              <el-tag size="small" :type="item.tagType">{{ item.typeLabel }}</el-tag>
            </div>
          </template>
        </el-autocomplete>
        <el-button type="primary" class="search-btn" @click="handleSearch">
          <el-icon><Search /></el-icon>
        </el-button>
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
  Promotion, Search, EditPen, Bell, User, Document,
  PriceTag, Setting, SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const emit = defineEmits(['create-post', 'show-notifications', 'search'])

const searchQuery = ref('')
const unreadCount = ref(5)

const userAvatar = computed(() => userStore.user?.avatar || '')

// 模拟搜索建议
const searchSuggestions = [
  { value: '实现防抖函数', type: 'question', typeLabel: '题目', tagType: 'success' },
  { value: 'Vue3 响应式原理', type: 'question', typeLabel: '题目', tagType: 'success' },
  { value: '张三', type: 'user', typeLabel: '用户', tagType: 'info' },
  { value: 'JavaScript', type: 'tag', typeLabel: '标签', tagType: 'warning' },
  { value: 'React Hooks', type: 'question', typeLabel: '题目', tagType: 'success' }
]

const querySearch = (queryString, cb) => {
  const results = queryString
    ? searchSuggestions.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : searchSuggestions
  cb(results)
}

const handleSelect = (item) => {
  emit('search', { query: item.value, type: item.type })
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    emit('search', { query: searchQuery.value.trim(), type: 'all' })
  }
}

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
  max-width: 600px;
}

.search-input {
  flex: 1;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-btn {
  border-radius: 20px;
  padding: 12px 20px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
}

.search-item-icon {
  color: #909399;
}

.search-item-text {
  flex: 1;
  color: #303133;
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
