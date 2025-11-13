<template>
  <el-dialog
    :model-value="visible"
    title="消息已读"
    width="400px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <!-- 消息预览 -->
    <div v-if="message" class="message-preview">
      <div class="preview-header">原消息</div>
      <div class="preview-content">
        <span class="sender">{{ message.senderName }}:</span>
        <span class="text">{{ truncateText(message.content, 100) }}</span>
      </div>
    </div>

    <!-- 已读统计 -->
    <div class="read-stats">
      <div class="stat-item">
        <span class="label">总人数:</span>
        <span class="value">{{ totalCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">已读:</span>
        <span class="value success">{{ readReceipts.length }}</span>
      </div>
      <div class="stat-item">
        <span class="label">未读:</span>
        <span class="value warning">{{ unreadCount }}</span>
      </div>
    </div>

    <!-- 已读用户列表 -->
    <div v-if="readReceipts.length > 0" class="receipt-list">
      <div class="list-header">已读用户</div>
      <div class="users-container">
        <div
          v-for="receipt in readReceipts"
          :key="receipt.userId"
          class="user-item"
        >
          <el-avatar
            :size="32"
            :src="receipt.userAvatar"
            class="user-avatar"
          >
            {{ receipt.userName?.charAt(0) || '?' }}
          </el-avatar>
          <div class="user-info">
            <div class="user-name">{{ receipt.userName }}</div>
            <div class="read-time">{{ formatReadTime(receipt.readAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 未读用户列表 -->
    <div v-if="unreadUsers.length > 0" class="unread-list">
      <div class="list-header">未读用户</div>
      <div class="users-container">
        <div
          v-for="user in unreadUsers"
          :key="user.userId"
          class="user-item unread"
        >
          <el-avatar
            :size="32"
            :src="user.avatar"
            class="user-avatar"
          >
            {{ user.name?.charAt(0) || '?' }}
          </el-avatar>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="status-text">未读</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="readReceipts.length === 0 && unreadUsers.length === 0" class="empty-state">
      <el-empty description="暂无数据" />
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: Object,
    default: null
  },
  readReceipts: {
    type: Array,
    default: () => []
  },
  allParticipants: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible'])

const totalCount = computed(() => props.allParticipants.length)

const readUserIds = computed(() => {
  return new Set(props.readReceipts.map(r => r.userId))
})

const unreadUsers = computed(() => {
  return props.allParticipants.filter(
    u => !readUserIds.value.has(u.userId)
  )
})

const unreadCount = computed(() => unreadUsers.value.length)

function formatReadTime(timestamp) {
  if (!timestamp) return '未知时间'
  const date = dayjs(timestamp)
  const now = dayjs()

  if (date.isSame(now, 'day')) {
    return date.format('HH:mm')
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天 ' + date.format('HH:mm')
  } else {
    return date.format('MM-DD HH:mm')
  }
}

function truncateText(text, maxLength = 100) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
</script>

<style scoped>
.message-preview {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 12px;
}

.preview-header {
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.preview-content {
  color: #666;
  line-height: 1.6;
  word-break: break-word;
}

.sender {
  font-weight: 500;
  color: #409eff;
}

.text {
  color: #999;
  display: block;
  margin-top: 4px;
}

.read-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.stat-item .label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-item .value.success {
  color: #67c23a;
}

.stat-item .value.warning {
  color: #e6a23c;
}

.receipt-list,
.unread-list {
  margin-bottom: 16px;
}

.list-header {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  margin-bottom: 10px;
  padding-left: 4px;
  border-left: 3px solid #409eff;
}

.unread-list .list-header {
  border-left-color: #e6a23c;
}

.users-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  background: #f9f9f9;
  transition: all 0.2s;
}

.user-item:hover {
  background: #f0f0f0;
}

.user-item.unread {
  opacity: 0.7;
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

.read-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.status-text {
  font-size: 11px;
  color: #e6a23c;
  margin-top: 2px;
}

.empty-state {
  padding: 20px 0;
}

/* 滚动条美化 */
.users-container::-webkit-scrollbar {
  width: 4px;
}

.users-container::-webkit-scrollbar-track {
  background: transparent;
}

.users-container::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 2px;
}

.users-container::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
