<template>
  <div
    :class="['conversation-item', { active: isActive }]"
    @click="handleClick"
  >
    <!-- 用户头像 -->
    <el-badge
      :value="conversation.unreadCount"
      :max="99"
      :hidden="conversation.unreadCount === 0 || conversation.unreadCount === undefined"
      class="conversation-badge"
    >
      <el-avatar
        :src="conversation.otherUser?.avatar"
        :size="40"
      />
    </el-badge>

    <!-- 对话信息 -->
    <div class="conversation-content">
      <div class="conversation-header">
        <span class="conversation-name">
          {{ conversation.otherUser?.name || '未知用户' }}
        </span>
        <span class="conversation-time">
          {{ formatTime(conversation.lastMessageTime) }}
        </span>
      </div>
      <div :class="['conversation-preview', { unread: conversation.unreadCount > 0 }]">
        {{ conversation.lastMessage || '暂无消息' }}
      </div>
    </div>

    <!-- 在线状态指示符 -->
    <div
      v-if="conversation.otherUser?.isOnline"
      class="online-indicator"
      title="在线"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const isActive = computed(() => props.active)

const handleClick = () => {
  emit('click', props.conversation)
}

const formatTime = (time) => {
  if (!time) return ''

  const date = new Date(time)
  const now = new Date()

  // 同一天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }

  // 本周内
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (date > weekAgo) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  }

  // 其他
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  margin-bottom: 8px;
  position: relative;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    background: #e8f4fd;
    border-left: 4px solid #409eff;
    padding-left: 8px;
  }

  .conversation-badge {
    position: relative;
    flex-shrink: 0;
  }

  .conversation-content {
    flex: 1;
    min-width: 0;

    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .conversation-name {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }

      .conversation-time {
        font-size: 12px;
        color: #909399;
        flex-shrink: 0;
        margin-left: 8px;
      }
    }

    .conversation-preview {
      font-size: 13px;
      color: #909399;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;

      &.unread {
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .online-indicator {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #67c23a;
    border: 2px solid white;
    right: -6px;
    bottom: -6px;
  }
}
</style>
