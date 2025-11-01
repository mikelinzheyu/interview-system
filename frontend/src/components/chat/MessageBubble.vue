<template>
  <div
    class="message-bubble"
    :class="{
      'message-bubble--own': message.isOwn,
      'message-bubble--other': !message.isOwn,
      'message-bubble--recalled': message.isRecalled,
      'message-bubble--failed': message.status === 'failed'
    }"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <!-- 其他用户的头像 -->
    <el-avatar
      v-if="!message.isOwn"
      :size="32"
      :src="message.senderAvatar"
      :style="{ backgroundColor: getAvatarColor(message.senderId) }"
      class="message-bubble__avatar"
    >
      {{ message.senderName?.slice(0, 1) || '?' }}
    </el-avatar>

    <!-- 消息主体 -->
    <div class="message-bubble__wrapper">
      <!-- 发送人名称 (仅群聊) -->
      <div v-if="!message.isOwn && isGroupChat" class="message-bubble__sender">
        {{ message.senderName }}
      </div>

      <!-- 消息内容容器 -->
      <div class="message-bubble__content" :class="`message-bubble__content--${message.contentType}`">
        <!-- 文本消息 -->
        <div v-if="message.contentType === 'text'" class="message-bubble__text">
          {{ message.content }}
        </div>

        <!-- 编辑标记 -->
        <div v-if="message.editCount && message.editCount > 0" class="message-bubble__edit-badge">
          已编辑({{ message.editCount }})
        </div>

        <!-- 撤回时间显示 -->
        <div v-if="message.isOwn && canRecall(message)" class="message-bubble__recall-timer">
          可撤回 {{ getRecallTimeString(message) }}
        </div>

        <!-- 图片消息 -->
        <div v-else-if="message.contentType === 'image'" class="message-bubble__images">
          <img
            v-for="(image, idx) in message.attachments"
            :key="idx"
            :src="image.previewUrl || image.url"
            :alt="`Image ${idx + 1}`"
            class="message-bubble__image"
            @click="previewImage(image)"
          />
        </div>

        <!-- 文件消息 -->
        <div v-else-if="message.contentType === 'attachment'" class="message-bubble__attachments">
          <div
            v-for="(file, idx) in message.attachments"
            :key="idx"
            class="message-bubble__file"
          >
            <div class="message-bubble__file-icon">
              <el-icon>
                <Document />
              </el-icon>
            </div>
            <div class="message-bubble__file-info">
              <div class="message-bubble__file-name">
                {{ file.name }}
              </div>
              <div class="message-bubble__file-size">
                {{ formatFileSize(file.size) }}
              </div>
            </div>
            <div
              v-if="file.status === 'uploading'"
              class="message-bubble__file-progress"
            >
              <el-progress
                :percentage="file.progress || 0"
                color="#409EFF"
                :show-text="false"
              />
            </div>
            <el-button
              v-else
              link
              type="primary"
              size="small"
              @click="downloadFile(file)"
            >
              下载
            </el-button>
          </div>
        </div>

        <!-- 被撤回的消息 -->
        <div v-if="message.isRecalled" class="message-bubble__recalled">
          <el-icon class="message-bubble__recalled-icon">
            <Delete />
          </el-icon>
          <span class="message-bubble__recalled-text">
            {{ message.recallByName || '对方' }}撤回了一条消息
          </span>
        </div>

        <!-- 引用消息 -->
        <div v-if="message.quotedMessage" class="message-bubble__quoted">
          <div class="message-bubble__quoted-sender">
            {{ message.quotedMessage.senderName }}
          </div>
          <div class="message-bubble__quoted-content">
            {{ message.quotedMessage.content }}
          </div>
        </div>
      </div>

      <!-- 消息操作菜单 -->
      <transition name="fade">
        <div v-if="showActions && !message.isRecalled" class="message-bubble__actions">
          <el-button-group>
            <el-button
              v-if="!message.isOwn"
              link
              text
              size="small"
              @click="handleReply"
            >
              回复
            </el-button>
            <el-button
              v-if="message.isOwn && message.status !== 'failed'"
              link
              text
              size="small"
              @click="handleEdit"
            >
              编辑
            </el-button>
            <el-button
              v-if="message.status === 'failed'"
              link
              text
              type="primary"
              size="small"
              @click="handleResend"
            >
              重试
            </el-button>
            <el-popover trigger="click" placement="top" :show-arrow="false">
              <template #default>
                <div class="message-bubble__menu">
                  <div class="message-bubble__menu-item" @click="handleCopy">
                    复制
                  </div>
                  <div v-if="message.isOwn && canRecall(message)" class="message-bubble__menu-item" @click="handleRecall">
                    撤回 ({{ getRecallTimeString(message) }})
                  </div>
                  <div v-if="message.isOwn && message.editCount && message.editCount > 0" class="message-bubble__menu-item" @click="handleEditHistory">
                    编辑历史 ({{ message.editCount }})
                  </div>
                  <div class="message-bubble__menu-item" @click="handleTranslate">
                    翻译
                  </div>
                  <div class="message-bubble__menu-item" @click="handleCollect">
                    收藏
                  </div>
                  <div v-if="message.isOwn" class="message-bubble__menu-item delete" @click="handleDelete">
                    删除
                  </div>
                </div>
              </template>
              <template #reference>
                <el-button link text size="small">
                  ...
                </el-button>
              </template>
            </el-popover>
          </el-button-group>
        </div>
      </transition>

      <!-- 消息状态指示 -->
      <div v-if="message.isOwn" class="message-bubble__status">
        <el-icon
          v-if="message.status === 'pending' || message.status === 'uploading'"
          class="message-bubble__status-icon is-loading"
        >
          <Loading />
        </el-icon>
        <el-icon v-else-if="message.status === 'delivered'" class="message-bubble__status-icon">
          <Check />
        </el-icon>
        <el-icon v-else-if="message.status === 'read'" class="message-bubble__status-icon is-read">
          <DArrowRight />
        </el-icon>
        <el-icon
          v-else-if="message.status === 'failed'"
          class="message-bubble__status-icon is-failed"
        >
          <Close />
        </el-icon>
      </div>
    </div>

    <!-- 自己的头像 -->
    <el-avatar
      v-if="message.isOwn"
      :size="32"
      :src="currentUserAvatar"
      class="message-bubble__avatar"
    >
      我
    </el-avatar>

    <!-- 时间戳 (可选) -->
    <div v-if="showTimestamp" class="message-bubble__timestamp">
      {{ formatTime(message.createdAt) }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Delete,
  Check,
  DArrowRight,
  Loading,
  Close
} from '@element-plus/icons-vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  currentUserAvatar: {
    type: String,
    default: ''
  },
  showTimestamp: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'reply',
  'edit',
  'resend',
  'recall',
  'delete',
  'copy',
  'translate',
  'collect',
  'preview-image',
  'edit-history',
  'show-recall-timer'
])

const showActions = ref(false)

const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#845EC2']

// 撤回时间限制配置
const RECALL_TIMEOUT = 2 * 60 * 1000 // 2 分钟

function getAvatarColor(id) {
  return colors[id % colors.length]
}

/**
 * 检查消息是否可以撤回
 */
function canRecall(message) {
  if (!message || message.isRecalled) return false
  if (!message.isOwn) return false

  const now = Date.now()
  const messageTime = message.timestamp || message.createdAt
  if (!messageTime) return false

  const elapsed = now - messageTime
  return elapsed <= RECALL_TIMEOUT
}

/**
 * 获取剩余撤回时间字符串
 */
function getRecallTimeString(message) {
  if (!canRecall(message)) return '已过期'

  const now = Date.now()
  const messageTime = message.timestamp || message.createdAt
  const elapsed = now - messageTime
  const remaining = RECALL_TIMEOUT - elapsed

  const seconds = Math.ceil(remaining / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (minutes > 0) {
    return `${minutes}m${secs}s`
  } else {
    return `${secs}s`
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

function handleReply() {
  emit('reply', props.message)
}

function handleEdit() {
  emit('edit', props.message)
}

function handleEditHistory() {
  emit('edit-history', props.message)
}

function handleResend() {
  emit('resend', props.message)
}

function handleRecall() {
  ElMessage.confirm('确定要撤回这条消息吗？', '提示', {
    confirmButtonText: '撤回',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('recall', props.message)
    })
    .catch(() => {})
}

function handleDelete() {
  emit('delete', props.message)
}

function handleCopy() {
  if (props.message.content) {
    navigator.clipboard.writeText(props.message.content).then(() => {
      ElMessage.success('已复制到剪贴板')
    })
  }
}

function handleTranslate() {
  ElMessage.info('翻译功能开发中...')
  emit('translate', props.message)
}

function handleCollect() {
  ElMessage.success('已收藏')
  emit('collect', props.message)
}

function previewImage(image) {
  emit('preview-image', image)
}

function downloadFile(file) {
  if (file.url) {
    window.open(file.url, '_blank')
  }
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 8px;
  margin: 12px 0;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble--own {
  flex-direction: row-reverse;
}

.message-bubble__avatar {
  flex-shrink: 0;
  cursor: pointer;
}

.message-bubble__wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.message-bubble__sender {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.message-bubble__content {
  max-width: 60%;
  padding: 8px 12px;
  border-radius: 12px;
  word-break: break-word;
  position: relative;
}

.message-bubble__content--text {
  background: rgba(0, 0, 0, 0.08);
  color: #333;
}

.message-bubble--own .message-bubble__content--text {
  background: #409eff;
  color: white;
}

.message-bubble__text {
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-bubble__edit-badge {
  display: inline-block;
  font-size: 10px;
  color: #909399;
  margin-top: 4px;
  margin-left: 4px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.message-bubble--own .message-bubble__edit-badge {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.message-bubble__recall-timer {
  display: inline-block;
  font-size: 10px;
  color: #f56c6c;
  margin-top: 4px;
  margin-left: 4px;
  padding: 2px 6px;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 3px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.message-bubble__images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.message-bubble__image {
  max-width: 200px;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.message-bubble__image:hover {
  transform: scale(1.05);
}

.message-bubble__attachments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-bubble__file {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  align-items: center;
}

.message-bubble--own .message-bubble__file {
  background: rgba(255, 255, 255, 0.2);
}

.message-bubble__file-icon {
  font-size: 24px;
  color: #409eff;
  flex-shrink: 0;
}

.message-bubble__file-info {
  flex: 1;
  min-width: 0;
}

.message-bubble__file-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-bubble--own .message-bubble__file-name {
  color: white;
}

.message-bubble__file-size {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.message-bubble--own .message-bubble__file-size {
  color: rgba(255, 255, 255, 0.7);
}

.message-bubble__file-progress {
  width: 80px;
  flex-shrink: 0;
}

.message-bubble__recalled {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 12px;
}

.message-bubble--own .message-bubble__recalled {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.message-bubble__recalled-icon {
  font-size: 14px;
}

.message-bubble__quoted {
  padding: 8px;
  border-left: 3px solid #409eff;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 4px;
}

.message-bubble__quoted-sender {
  font-size: 11px;
  color: #409eff;
  font-weight: 500;
}

.message-bubble__quoted-content {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-bubble__actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.message-bubble__actions:hover {
  opacity: 1;
}

.message-bubble__menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
}

.message-bubble__menu-item {
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.message-bubble__menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.message-bubble__menu-item.delete {
  color: #f56c6c;
}

.message-bubble__status {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.message-bubble__status-icon {
  font-size: 12px;
  margin-left: 4px;
}

.message-bubble__status-icon.is-loading {
  animation: spin 1s linear infinite;
  color: #409eff;
}

.message-bubble__status-icon.is-read {
  color: #409eff;
}

.message-bubble__status-icon.is-failed {
  color: #f56c6c;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.message-bubble__timestamp {
  font-size: 11px;
  color: #bfbfbf;
  text-align: center;
  margin: 8px 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .message-bubble__content {
    max-width: 80%;
  }

  .message-bubble__image {
    max-width: 150px;
    max-height: 250px;
  }
}
</style>


