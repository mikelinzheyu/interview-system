<template>
  <div class="message-list-container">
    <!-- 加载指示 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton animated :rows="8" />
    </div>

    <!-- 消息列表 -->
    <div v-else ref="scrollContainer" class="message-list" @scroll="handleScroll">
      <!-- 加载更多提示 -->
      <div v-if="hasMore" class="load-more-trigger" @click="$emit('load-more')">
        <el-icon><Loading /></el-icon>
        <span>加载更多消息</span>
      </div>

      <!-- 消息组 -->
      <template v-for="(group, index) in messageGroups" :key="index">
        <!-- 时间分组标签 -->
        <div class="time-divider">
          <span class="time-label">{{ formatTimeGroup(group.date) }}</span>
        </div>

        <!-- 该时间段的消息 -->
        <div
          v-for="msg in group.messages"
          :key="msg.id"
          class="message-item"
          :class="{ 'is-own': msg.isOwn }"
          @contextmenu.prevent="handleContextMenu($event, msg)"
          @mouseenter="hoveredMessageId = msg.id"
          @mouseleave="hoveredMessageId = null"
        >
          <!-- 头像 -->
          <div v-if="!msg.isOwn" class="message-avatar">
            <el-avatar
              :size="40"
              :src="msg.senderAvatar"
              class="avatar"
            >
              {{ msg.senderName?.charAt(0) || '?' }}
            </el-avatar>
          </div>

          <!-- 消息内容区 -->
          <div class="message-content-group">
            <!-- 发送者信息 -->
            <div v-if="!msg.isOwn" class="message-meta">
              <span class="sender-name">{{ msg.senderName }}</span>
              <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
            </div>

            <!-- 消息气泡 -->
            <div class="message-bubble-wrapper">
              <div class="message-bubble" :class="`bubble-${msg.type}`">
                <!-- 文本消息 -->
                <div v-if="msg.type === 'text'" class="message-text">
                  {{ msg.content }}
                </div>

                <!-- 图片消息 -->
                <div v-else-if="msg.type === 'image'" class="message-image">
                  <img
                    v-for="att in msg.attachments"
                    :key="att.id"
                    :src="att.url"
                    class="image-thumb"
                    @click="handleImagePreview(att)"
                  />
                </div>

                <!-- 文件消息 -->
                <div v-else-if="msg.type === 'file'" class="message-file">
                  <div v-for="att in msg.attachments" :key="att.id" class="file-item">
                    <el-icon><Document /></el-icon>
                    <div class="file-info">
                      <div class="file-name">{{ att.fileName }}</div>
                      <div class="file-size">{{ formatFileSize(att.fileSize) }}</div>
                    </div>
                  </div>
                </div>

                <!-- 撤回消息 -->
                <div v-else-if="msg.isRecalled" class="message-recalled">
                  <el-icon><CircleClose /></el-icon>
                  <span>{{ msg.isOwn ? '你撤回了一条消息' : `${msg.senderName}撤回了一条消息` }}</span>
                </div>
              </div>

              <!-- 消息状态 -->
              <div v-if="msg.isOwn" class="message-status" :class="`status-${msg.status}`">
                <span v-if="msg.status === 'pending'" class="status-text">发送中...</span>
                <span v-else-if="msg.status === 'failed'" class="status-text error">发送失败</span>
                <el-icon v-else-if="msg.status === 'delivered'" class="status-icon">
                  <Check />
                </el-icon>
                <el-icon v-else-if="msg.status === 'read'" class="status-icon success">
                  <Check />
                </el-icon>
              </div>

              <!-- 右侧时间戳（自己的消息） -->
              <span v-if="msg.isOwn" class="timestamp-own">{{ formatTime(msg.timestamp) }}</span>
            </div>

            <!-- 悬停操作菜单 -->
            <div v-if="hoveredMessageId === msg.id" class="message-actions">
              <el-button text size="small" @click="handleMessageAction(msg, 'reply')">
                <el-icon><ChatDotRound /></el-icon>
              </el-button>
              <el-button text size="small" @click="handleMessageAction(msg, 'more')">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 右对齐头像（自己的消息） -->
          <div v-if="msg.isOwn" class="message-avatar">
            <el-avatar
              :size="40"
              :src="msg.senderAvatar"
              class="avatar"
            >
              {{ msg.senderName?.charAt(0) || '?' }}
            </el-avatar>
          </div>
        </div>
      </template>

      <!-- 打字指示 -->
      <div v-if="typingUsers.length > 0" class="typing-indicator">
        <el-icon class="typing-icon"><Loading /></el-icon>
        <span>{{ typingUsers.join('、') }} 正在输入...</span>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && messageGroups.length === 0" class="empty-state">
        <el-empty description="暂无消息" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElIcon, ElButton, ElAvatar, ElEmpty, ElSkeleton } from 'element-plus'
import { Loading, Check, Document, CircleClose, ChatDotRound, MoreFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

// Props
const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  typingUsers: {
    type: Array,
    default: () => []
  },
  hasMore: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['load-more', 'message-action', 'scroll'])

// State
const hoveredMessageId = ref(null)
const scrollContainer = ref(null)
let autoScrollToBottom = true

// 计算属性：按时间分组的消息
const messageGroups = computed(() => {
  const groups = {}

  props.messages.forEach(msg => {
    const date = dayjs(msg.timestamp).format('YYYY-MM-DD')

    if (!groups[date]) {
      groups[date] = {
        date,
        messages: []
      }
    }

    groups[date].messages.push(msg)
  })

  return Object.values(groups).sort((a, b) => {
    return new Date(a.date) - new Date(b.date)
  })
})

// 方法
function formatTime(timestamp) {
  return dayjs(timestamp).format('HH:mm')
}

function formatTimeGroup(date) {
  const d = dayjs(date)
  const now = dayjs()

  if (d.isSame(now, 'day')) {
    return '今天'
  } else if (d.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  } else if (d.isSame(now, 'year')) {
    return d.format('M月D日')
  } else {
    return d.format('YYYY年M月D日')
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

function handleContextMenu(event, message) {
  emit('message-action', {
    message,
    position: {
      x: event.clientX,
      y: event.clientY
    }
  })
}

function handleMessageAction(message, action) {
  if (action === 'more') {
    handleContextMenu(new MouseEvent('contextmenu'), message)
  } else {
    // 其他操作
  }
}

function handleImagePreview(attachment) {
  // 图片预览逻辑
  window.open(attachment.url, '_blank')
}

function handleScroll(event) {
  const element = event.target
  const { scrollTop, scrollHeight, clientHeight } = element

  // 检查是否在底部
  autoScrollToBottom = scrollHeight - scrollTop - clientHeight < 100

  emit('scroll', event)
}

// 滚动到底部
async function scrollToBottom() {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

// 生命周期
onMounted(() => {
  scrollToBottom()
})

// 暴露方法
defineExpose({
  scrollToBottom
})
</script>

<style scoped>
.message-list-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: #ffffff;
}

.loading-state {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 时间分组 */
.time-divider {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 0;
  animation: fadeinScaleUp 0.4s ease-out;
}

.time-label {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

@keyframes fadeinScaleUp {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
  animation: messageSlideIn 0.3s ease-out;
  opacity: 1;
}

.message-item.is-own {
  flex-direction: row-reverse;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 头像 */
.message-avatar {
  flex-shrink: 0;
}

.avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.avatar:hover {
  transform: scale(1.1);
}

/* 消息内容组 */
.message-content-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
}

.message-item.is-own .message-content-group {
  align-items: flex-end;
}

/* 消息元信息 */
.message-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.sender-name {
  font-weight: 600;
  color: #333;
}

.timestamp {
  color: #999;
}

/* 消息气泡 */
.message-bubble-wrapper {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.message-item.is-own .message-bubble-wrapper {
  flex-direction: row-reverse;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  word-break: break-word;
  background: #f0f0f0;
  color: #333;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
}

.message-item:hover .message-bubble {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.message-item.is-own .message-bubble {
  background: linear-gradient(135deg, #5c6af0 0%, #6b7eff 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(92, 106, 240, 0.2);
}

.message-item.is-own:hover .message-bubble {
  box-shadow: 0 4px 16px rgba(92, 106, 240, 0.3);
  transform: translateY(-2px);
}

/* 消息内容 */
.message-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

/* 图片消息 */
.message-image {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 6px;
}

.image-thumb {
  width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  max-width: 200px;
}

.image-thumb:hover {
  transform: scale(1.05);
}

/* 文件消息 */
.message-file {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  cursor: pointer;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* 撤回消息 */
.message-recalled {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
  font-style: italic;
}

/* 消息状态 */
.message-status {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}

.message-status.status-pending {
  color: #ff9500;
}

.message-status.status-failed {
  color: #ff5f72;
}

.message-status.status-delivered {
  color: #999;
}

.message-status.status-read {
  color: #67c23a;
}

.status-text {
  font-size: 11px;
}

.status-icon {
  font-size: 14px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.status-icon.success {
  color: #67c23a;
  animation: fadeIn 0.3s ease-out;
}

/* 右对齐时间戳 */
.timestamp-own {
  font-size: 12px;
  color: #ccc;
  margin-left: 4px;
}

/* 悬停操作 */
.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .message-actions {
  opacity: 1;
}

/* 打字指示 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
  padding: 12px 0;
}

.typing-icon {
  animation: spin 1s linear infinite;
  font-size: 14px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

/* 加载更多 */
.load-more-trigger {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: #5c6af0;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.load-more-trigger:hover {
  background: #f5f5f5;
  border-radius: 8px;
}
</style>
