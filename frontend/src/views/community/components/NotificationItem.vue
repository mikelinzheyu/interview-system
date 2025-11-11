<template>
  <div
    :class="['notification-item', { 'is-unread': !notification.read, 'is-action': hasAction }]"
    @click="markAsRead"
  >
    <!-- 通知类型图标 -->
    <div class="notification-icon">
      <el-icon :style="{ color: getTypeColor() }">
        <component :is="getTypeIcon()" />
      </el-icon>
    </div>

    <!-- 通知内容 -->
    <div class="notification-content">
      <!-- 标题 -->
      <div class="notification-title">
        <span v-if="notification.actor" class="actor-name">
          {{ notification.actor.name }}
        </span>
        <span class="action-text">{{ getActionText() }}</span>
      </div>

      <!-- 副标题/预览 -->
      <div class="notification-preview">
        {{ notification.content.body || notification.content.title }}
      </div>

      <!-- 时间 -->
      <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
    </div>

    <!-- 用户头像 -->
    <img
      v-if="notification.actor"
      :src="notification.actor.avatar"
      :alt="notification.actor.name"
      class="actor-avatar"
    />

    <!-- 操作按钮 -->
    <div class="notification-actions">
      <el-popover placement="left" :width="200">
        <template #reference>
          <el-button link type="info" size="small">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
        </template>

        <div class="action-menu">
          <div
            v-if="!notification.read"
            class="action-item"
            @click.stop="handleMarkAsRead"
          >
            <el-icon><Select /></el-icon>
            标记为已读
          </div>
          <div class="action-item" @click.stop="handleDelete">
            <el-icon><Delete /></el-icon>
            删除
          </div>
          <div v-if="notification.actionUrl" class="action-item">
            <el-icon><Link /></el-icon>
            <a :href="notification.actionUrl" target="_blank" rel="noopener">
              查看详情
            </a>
          </div>
        </div>
      </el-popover>

      <!-- 未读标记 -->
      <div v-if="!notification.read" class="unread-badge" />
    </div>
  </div>
</template>

<script setup>
import {
  ChatDotRound,
  Message,
  Heart,
  UserAdd,
  Warning,
  Bell,
  MoreFilled,
  Select,
  Delete,
  Link
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  notification: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['mark-read', 'delete', 'click'])

/**
 * 获取通知类型的图标
 */
const getTypeIcon = () => {
  const iconMap = {
    comment: ChatDotRound,
    reply: Message,
    like: Heart,
    mention: ChatDotRound,
    follow: UserAdd,
    system: Bell,
    warning: Warning
  }
  return iconMap[props.notification.type] || Bell
}

/**
 * 获取通知类型的颜色
 */
const getTypeColor = () => {
  const colorMap = {
    comment: '#409eff',
    reply: '#409eff',
    like: '#f56c6c',
    mention: '#67c23a',
    follow: '#409eff',
    system: '#909399',
    warning: '#e6a23c'
  }
  return colorMap[props.notification.type] || '#909399'
}

/**
 * 获取操作文本
 */
const getActionText = () => {
  const actionMap = {
    comment: '评论了你的帖子',
    reply: '回复了你的评论',
    like: '赞了你的帖子',
    mention: '提及了你',
    follow: '关注了你',
    system: '系统通知'
  }
  return actionMap[props.notification.type] || '给了你一条消息'
}

/**
 * 格式化时间
 */
const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString('zh-CN')
}

/**
 * 是否有操作链接
 */
const hasAction = computed(() => {
  return !!props.notification.actionUrl
})

/**
 * 标记为已读
 */
const handleMarkAsRead = (event) => {
  event.stopPropagation()
  if (!props.notification.read) {
    emit('mark-read', props.notification.id)
    ElMessage.success('已标记为已读')
  }
}

/**
 * 删除通知
 */
const handleDelete = (event) => {
  event.stopPropagation()
  emit('delete', props.notification.id)
  ElMessage.success('已删除')
}

/**
 * 计算属性
 */
import { computed } from 'vue'
</script>

<style scoped lang="scss">
.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;

  &:hover {
    background: #f0f0f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .notification-actions {
      opacity: 1;
    }
  }

  &.is-unread {
    background: #f0f9ff;
    border-left: 3px solid #409eff;
  }

  &.is-action {
    cursor: pointer;

    &:hover {
      background: #e6f7ff;
    }
  }

  .notification-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 50%;
    flex-shrink: 0;

    :deep(.el-icon) {
      font-size: 20px;
    }
  }

  .notification-content {
    flex: 1;
    min-width: 0;

    .notification-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      font-size: 14px;
      color: #333;

      .actor-name {
        font-weight: 600;
        color: #409eff;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .action-text {
        color: #666;
      }
    }

    .notification-preview {
      font-size: 13px;
      color: #999;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-time {
      font-size: 12px;
      color: #bbb;
    }
  }

  .actor-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .notification-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s;

    :deep(.el-button) {
      padding: 0 4px;
    }

    .unread-badge {
      width: 8px;
      height: 8px;
      background: #409eff;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }
}

.action-menu {
  display: flex;
  flex-direction: column;
  gap: 0;

  .action-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: #333;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: #f5f5f5;
      color: #409eff;
    }

    :deep(.el-icon) {
      font-size: 14px;
      flex-shrink: 0;
    }

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: #409eff;
      }
    }
  }
}
</style>
