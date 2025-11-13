<template>
  <div class="message-bubble-container">
    <!-- 消息气泡 -->
    <div class="message-bubble" :class="[`bubble-${type}`, { 'is-own': isOwn }]">
      <!-- 引用显示 -->
      <div v-if="message.replyTo" class="reply-quote">
        <div class="quote-header">
          <span class="quote-author">{{ message.replyTo.senderName }}</span>
        </div>
        <div class="quote-content">{{ truncateText(message.replyTo.content, 80) }}</div>
      </div>

      <!-- 消息内容 -->
      <MarkdownRenderer
        v-if="type === 'text'"
        :content="message.content"
        :content-type="getContentType()"
      />

      <!-- 撤回消息 -->
      <div v-else-if="isRecalled" class="message-recalled">
        <el-icon><CircleClose /></el-icon>
        <span>{{ isOwn ? '你撤回了一条消息' : `${message.senderName}撤回了一条消息` }}</span>
      </div>
    </div>

    <!-- 消息状态和时间 -->
    <div v-if="isOwn" class="message-meta-own">
      <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
      <div class="message-status" :class="`status-${message.status}`">
        <el-icon v-if="message.status === 'pending'">
          <Loading />
        </el-icon>
        <el-icon v-else-if="message.status === 'delivered'">
          <Check />
        </el-icon>
        <el-icon v-else-if="message.status === 'read'" class="status-read">
          <Check />
        </el-icon>
      </div>
    </div>
  </div>

  <!-- 反应 -->
  <MessageReactions
    v-if="showReactions"
    :reactions="reactions"
    :message-id="message.id"
    @add-reaction="$emit('add-reaction', $event)"
    @remove-reaction="$emit('remove-reaction', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'
import { Loading, Check, CircleClose } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import MarkdownRenderer from './MessageEnhancements/MarkdownRenderer.vue'
import MessageReactions from './Reactions/MessageReactions.vue'
import MessageFormattingService from '@/services/messageFormattingService'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isOwn: {
    type: Boolean,
    default: false
  },
  reactions: {
    type: Array,
    default: () => []
  },
  showReactions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['add-reaction', 'remove-reaction'])

const isRecalled = computed(() => props.message.isRecalled)

const type = computed(() => {
  if (props.message.isRecalled) return 'recalled'
  return props.message.type || 'text'
})

function getContentType() {
  return MessageFormattingService.parseMessageType(props.message.content)
}

function formatTime(timestamp) {
  return dayjs(timestamp).format('HH:mm')
}

function truncateText(text, maxLength = 80) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
</script>

<style scoped>
.message-bubble-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #333;
  max-width: 500px;
  word-break: break-word;
  overflow-wrap: break-word;
}

.message-bubble.is-own {
  background: #409eff;
  color: white;
}

/* 引用样式 */
.reply-quote {
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-left: 3px solid #409eff;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.is-own .reply-quote {
  background: rgba(255, 255, 255, 0.15);
  border-left-color: rgba(255, 255, 255, 0.7);
}

.quote-header {
  font-weight: 600;
  margin-bottom: 4px;
  color: #409eff;
}

.is-own .quote-header {
  color: rgba(255, 255, 255, 0.9);
}

.quote-content {
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-own .quote-content {
  color: rgba(255, 255, 255, 0.8);
}

/* 撤回消息 */
.message-recalled {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 12px;
  font-style: italic;
}

.is-own .message-recalled {
  color: rgba(255, 255, 255, 0.7);
}

/* 元数据 */
.message-meta-own {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}

.timestamp {
  font-size: 11px;
}

.message-status {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
}

.message-status.status-pending {
  animation: spin 1s linear infinite;
}

.message-status.status-read :deep(.el-icon) {
  color: #409eff;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 600px) {
  .message-bubble {
    max-width: 300px;
  }
}
</style>
