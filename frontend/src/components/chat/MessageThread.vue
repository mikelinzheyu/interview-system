<template>
  <div class="message-thread-container">
    <!-- 回复消息预览 -->
    <div v-if="replyingToMessage" class="reply-preview">
      <div class="reply-preview-header">
        <span class="reply-label">回复</span>
        <el-button text size="small" @click="clearReply">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="reply-preview-content">
        <div class="reply-author">{{ replyingToMessage.senderName }}</div>
        <div class="reply-text">{{ truncateText(replyingToMessage.content, 100) }}</div>
      </div>
    </div>

    <!-- 消息线程 -->
    <div v-if="threadMessages.length > 0" class="thread-container">
      <div class="thread-header">
        <span class="thread-title">线程</span>
        <span class="thread-count">{{ threadMessages.length }} 条回复</span>
      </div>
      <div class="thread-messages">
        <div
          v-for="msg in threadMessages"
          :key="msg.id"
          class="thread-message"
          :class="{ 'is-own': msg.isOwn }"
        >
          <el-avatar :size="24" :src="msg.senderAvatar" class="thread-avatar">
            {{ msg.senderName?.charAt(0) || '?' }}
          </el-avatar>
          <div class="thread-content">
            <div class="thread-meta">
              <span class="thread-author">{{ msg.senderName }}</span>
              <span class="thread-time">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <div class="thread-text">{{ msg.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Close } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  parentMessageId: {
    type: [Number, String],
    default: null
  },
  replyingTo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['reply-clear'])

// 过滤出当前消息的所有回复
const threadMessages = computed(() => {
  if (!props.parentMessageId) return []
  const parentId = String(props.parentMessageId)
  return props.messages.filter(msg => String(msg.replyToId) === parentId)
})

const replyingToMessage = computed(() => props.replyingTo)

function clearReply() {
  emit('reply-clear')
}

function formatTime(timestamp) {
  return dayjs(timestamp).format('HH:mm')
}

function truncateText(text, length) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}
</script>

<style scoped>
.message-thread-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.reply-preview {
  background: var(--color-bg-secondary, #f9f9f9);
  border-left: 3px solid #5c6af0;
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  gap: 8px;
}

.reply-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 4px;
}

.reply-label {
  font-size: 12px;
  font-weight: 600;
  color: #5c6af0;
  text-transform: uppercase;
}

.reply-preview-content {
  flex: 1;
}

.reply-author {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text, #333);
  margin-bottom: 2px;
}

.reply-text {
  font-size: 13px;
  color: var(--color-text-secondary, #666);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-container {
  background: var(--color-bg-secondary, #f9f9f9);
  border-radius: 8px;
  padding: 8px 0;
  border: 1px solid var(--color-border, #e0e0e0);
}

.thread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.thread-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text, #333);
  text-transform: uppercase;
}

.thread-count {
  font-size: 11px;
  color: var(--color-text-secondary, #999);
}

.thread-messages {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
  max-height: 200px;
  overflow-y: auto;
}

.thread-message {
  display: flex;
  gap: 8px;
  padding: 6px 12px;
  align-items: flex-start;
}

.thread-message.is-own {
  background: rgba(92, 106, 240, 0.05);
}

.thread-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.thread-content {
  flex: 1;
  min-width: 0;
}

.thread-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 2px;
}

.thread-author {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text, #333);
}

.thread-time {
  font-size: 11px;
  color: var(--color-text-secondary, #999);
}

.thread-text {
  font-size: 12px;
  color: var(--color-text, #333);
  line-height: 1.4;
  word-break: break-word;
}
</style>
