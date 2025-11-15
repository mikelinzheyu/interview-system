<template>
  <div :class="['message-bubble', isSent ? 'sent' : 'received']">
    <!-- 接收方头像（左侧） -->
    <el-avatar
      v-if="!isSent"
      :src="message.senderAvatar"
      :size="32"
      class="bubble-avatar"
    />

    <!-- 消息气泡内容 -->
    <div class="bubble-wrapper">
      <div class="bubble-content">
        <div class="bubble-text">{{ message.content }}</div>
        <div class="bubble-meta">
          <span class="bubble-time">{{ formatTime(message.createdAt) }}</span>
          <span v-if="isSent" :class="['message-status', message.status]">
            {{ statusText[message.status] }}
          </span>
        </div>
      </div>
    </div>

    <!-- 发送方头像（右侧） -->
    <el-avatar
      v-if="isSent"
      :src="message.senderAvatar"
      :size="32"
      class="bubble-avatar"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const userStore = useUserStore()

// 判断是否是发送方
const isSent = computed(() => {
  return props.message.senderId === userStore.user?.id
})

// 消息状态文本
const statusText = {
  sending: '发送中...',
  sent: '✓ 已送达',
  delivered: '✓✓ 已送达',
  read: '✓✓ 已读',
  failed: '❌ 发送失败'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''

  const date = new Date(time)
  const now = new Date()
  const diffTime = now - date
  const diffMinutes = Math.floor(diffTime / 60000)
  const diffHours = Math.floor(diffTime / 3600000)
  const diffDays = Math.floor(diffTime / 86400000)

  if (diffMinutes < 1) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
</script>

<style scoped lang="scss">
.message-bubble {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  animation: slideUp 0.3s ease;
  align-items: flex-end;

  &.sent {
    flex-direction: row-reverse;
  }

  .bubble-avatar {
    flex-shrink: 0;
  }

  .bubble-wrapper {
    display: flex;
    max-width: 60%;
  }

  .bubble-content {
    padding: 8px 12px;
    border-radius: 8px;
    word-wrap: break-word;
    word-break: break-word;

    .bubble-text {
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      white-space: pre-wrap;
    }

    .bubble-meta {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-end;

      .bubble-time {
        margin-right: 8px;
      }

      .message-status {
        &.sending {
          color: #909399;
        }

        &.sent,
        &.delivered {
          color: #409eff;
        }

        &.read {
          color: #67c23a;
        }

        &.failed {
          color: #f56c6c;
        }
      }
    }
  }

  &.sent {
    .bubble-content {
      background: #409eff;
      color: white;
      border-radius: 12px 4px 4px 12px;

      .bubble-meta {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  &.received {
    .bubble-content {
      background: #f5f5f5;
      color: #303133;
      border-radius: 4px 12px 12px 4px;
    }
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
