<template>
  <div class="user-profile-card">
    <!-- 背景 -->
    <div class="card-background" :style="{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)` }"></div>

    <!-- 内容 -->
    <div class="card-content">
      <!-- 头部 -->
      <div class="card-header">
        <el-avatar :size="60" :src="user.avatar" class="user-avatar">
          {{ user.name?.charAt(0) || '?' }}
        </el-avatar>
        <button class="close-btn" @click="$emit('close')">
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <!-- 用户信息 -->
      <div class="user-info">
        <h3 class="user-name">{{ user.name }}</h3>

        <!-- 用户状态 -->
        <div class="user-status">
          <UserStatusIndicator :status="userStatus" show-label />
          <span v-if="userStatusMessage" class="status-message">{{ userStatusMessage }}</span>
        </div>

        <!-- 用户标签 -->
        <div v-if="user.role" class="user-role">
          <el-tag :type="getRoleTagType(user.role)" size="small">
            {{ getRoleLabel(user.role) }}
          </el-tag>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="user-details">
        <div v-if="user.title" class="detail-item">
          <span class="label">职位:</span>
          <span class="value">{{ user.title }}</span>
        </div>

        <div v-if="user.department" class="detail-item">
          <span class="label">部门:</span>
          <span class="value">{{ user.department }}</span>
        </div>

        <div v-if="lastSeenTime" class="detail-item">
          <span class="label">最后活动:</span>
          <span class="value">{{ lastSeenTime }}</span>
        </div>

        <div v-if="user.joinedAt" class="detail-item">
          <span class="label">加入时间:</span>
          <span class="value">{{ formatDate(user.joinedAt) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="card-actions">
        <el-button type="primary" size="small" @click="$emit('send-message')">
          <el-icon><Message /></el-icon>
          发送消息
        </el-button>

        <el-button v-if="!isCurrentUser" size="small" @click="$emit('call-user')">
          <el-icon><Phone /></el-icon>
          语音通话
        </el-button>

        <el-button v-if="!isCurrentUser" type="info" size="small" @click="$emit('view-profile')">
          <el-icon><DocumentCopy /></el-icon>
          查看资料
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Close, Message, Phone, DocumentCopy } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import UserStatusIndicator from './UserStatusIndicator.vue'
import { useUserPresenceStore } from '@/stores/userPresence'

dayjs.locale('zh-cn')

const props = defineProps({
  user: {
    type: Object,
    required: true,
    validator: (obj) =>
      'id' in obj && 'name' in obj && 'avatar' in obj
  },
  currentUserId: {
    type: [String, Number],
    default: null
  },
  primaryColor: {
    type: String,
    default: '#409eff'
  }
})

const emit = defineEmits(['close', 'send-message', 'call-user', 'view-profile'])

const store = useUserPresenceStore()

const isCurrentUser = computed(() => props.user.id === props.currentUserId)

const userStatus = computed(() => {
  const status = store.getUserStatus(props.user.id)
  return status.status || 'offline'
})

const userStatusMessage = computed(() => {
  const status = store.getUserStatus(props.user.id)
  return status.message || ''
})

const lastSeenTime = computed(() => {
  return store.getLastSeenText(props.user.id)
})

function getRoleLabel(role) {
  const labels = {
    owner: '群主',
    admin: '管理员',
    member: '成员'
  }
  return labels[role] || role
}

function getRoleTagType(role) {
  const types = {
    owner: 'success',
    admin: 'warning',
    member: 'info'
  }
  return types[role] || 'info'
}

function formatDate(date) {
  return dayjs(date).format('YYYY年M月D日')
}
</script>

<style scoped>
.user-profile-card {
  width: 100%;
  max-width: 320px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.card-background {
  height: 80px;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  position: relative;
}

.card-content {
  padding: 0 16px 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: -30px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.user-avatar {
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 18px;
  padding: 4px;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.2);
  }
}

.user-info {
  text-align: center;
  margin-bottom: 16px;
}

.user-name {
  margin: 8px 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.user-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.status-message {
  color: #999;
  font-style: italic;
}

.user-role {
  display: flex;
  justify-content: center;
}

.user-details {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;

  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
}

.detail-item .label {
  color: #999;
  font-weight: 500;
}

.detail-item .value {
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  button {
    flex: 1;
    min-width: 80px;
  }
}

/* Hover 效果 */
.user-profile-card {
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
}

/* 响应式 */
@media (max-width: 400px) {
  .user-profile-card {
    max-width: 100%;
  }

  .card-actions button {
    font-size: 12px;
  }
}
</style>
