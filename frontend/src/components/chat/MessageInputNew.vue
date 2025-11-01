<template>
  <div class="message-input-container" :class="{ offline: !isConnected }">
    <!-- 离线提示 -->
    <div v-if="!isConnected" class="offline-banner">
      <el-icon><Warning /></el-icon>
      <span>离线状态 - 消息将在连接后发送</span>
    </div>

    <!-- 打字指示器 -->
    <div v-if="typingUsers && typingUsers.length > 0" class="typing-indicator">
      <span class="typing-text">
        <span class="typing-users">{{ typingUsersText }}</span> 正在输入
        <span class="typing-dots">
          <span class="dot">.</span>
          <span class="dot">.</span>
          <span class="dot">.</span>
        </span>
      </span>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 表情按钮 -->
        <el-popover placement="top" width="280" :visible="showEmoji">
          <template #reference>
            <el-button
              text
              circle
              size="large"
              :disabled="disabled"
              @click="showEmoji = !showEmoji"
              class="tool-btn"
              title="表情"
            >
              😊
            </el-button>
          </template>
          <div class="emoji-picker">
            <div class="emoji-grid">
              <button
                v-for="emoji in EMOJI_LIST"
                :key="emoji"
                type="button"
                class="emoji-item"
                @click="insertEmoji(emoji)"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </el-popover>

        <!-- 上传文件 -->
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          @change="handleFileSelect"
          class="upload-wrapper"
        >
          <template #trigger>
            <el-button
              text
              circle
              size="large"
              :disabled="disabled"
              class="tool-btn"
              title="上传文件"
            >
              <el-icon><DocumentAdd /></el-icon>
            </el-button>
          </template>
        </el-upload>

        <!-- 图片上传 -->
        <el-upload
          ref="imageUploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          @change="handleImageSelect"
          class="upload-wrapper"
        >
          <template #trigger>
            <el-button
              text
              circle
              size="large"
              :disabled="disabled"
              class="tool-btn"
              title="上传图片"
            >
              <el-icon><Picture /></el-icon>
            </el-button>
          </template>
        </el-upload>

        <!-- 语音输入 -->
        <el-button
          text
          circle
          size="large"
          :disabled="disabled"
          class="tool-btn"
          title="语音输入"
          @click="toggleVoiceInput"
        >
          <el-icon><Microphone /></el-icon>
        </el-button>
      </div>

      <!-- 文本输入框 -->
      <div class="input-wrapper">
        <el-input
          ref="inputRef"
          v-model="inputValue"
          type="textarea"
          :placeholder="placeholder"
          :disabled="disabled"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :maxlength="1000"
          @keydown.enter.prevent="handleEnter"
          @input="handleInput"
          class="message-input"
        />
        <div class="char-count">
          {{ inputValue.length }}/1000
        </div>
      </div>

      <!-- @mention 列表 -->
      <div v-if="showMentionList" class="mention-list">
        <div
          v-for="member in mentionMatches"
          :key="member.userId"
          class="mention-item"
          @click="selectMention(member)"
        >
          <el-avatar :size="24" :src="member.avatar">
            {{ member.name?.charAt(0) || '?' }}
          </el-avatar>
          <span>{{ member.name }}</span>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <!-- 快捷菜单 -->
      <el-dropdown @command="handleQuickAction">
        <el-button text type="info" size="small">
          更多选项 <el-icon><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="clear">清空输入</el-dropdown-item>
            <el-dropdown-item command="template">快捷模板</el-dropdown-item>
            <el-dropdown-item divider />
            <el-dropdown-item command="setting">设置</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 发送按钮 -->
      <el-button
        type="primary"
        :disabled="disabled || !inputValue.trim()"
        :loading="sending"
        @click="handleSend"
        class="send-btn"
      >
        <el-icon><Promotion /></el-icon>
        <span>发送 (Ctrl+Enter)</span>
      </el-button>
    </div>

    <!-- 拖拽上传区 -->
    <div
      v-if="dragOverlay"
      class="drag-overlay"
      @dragover.prevent="dragOverlay = true"
      @dragleave.prevent="dragOverlay = false"
      @drop.prevent="handleDrop"
    >
      <div class="drag-hint">
        <el-icon><Upload /></el-icon>
        <span>释放以上传文件</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Warning,
  DocumentAdd,
  Picture,
  Microphone,
  Promotion,
  Upload,
  ArrowDown
} from '@element-plus/icons-vue'

const EMOJI_LIST = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😙', '😗', '😚',
  '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😲', '😞', '😖',
  '👍', '👎', '👏', '🙌', '👋', '🤝', '👊', '✊', '🤟', '🤘',
  '💡', '🔥', '✅', '❌', '❓', '⭐', '🚀', '💯', '🎉', '🎊'
]

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  isConnected: {
    type: Boolean,
    default: true
  },
  roomId: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: '输入消息... (Ctrl+Enter 发送，Shift+Enter 换行)'
  },
  typingUsers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['send', 'upload', 'typing'])

// State
const inputValue = ref('')
const showEmoji = ref(false)
const showMentionList = ref(false)
const dragOverlay = ref(false)
const sending = ref(false)
const mentionQuery = ref('')
const inputRef = ref(null)
const uploadRef = ref(null)
const imageUploadRef = ref(null)

// Mock 成员列表
const members = ref([
  { userId: 'user_001', name: '张三', avatar: 'https://via.placeholder.com/24?text=ZS' },
  { userId: 'user_002', name: '李四', avatar: 'https://via.placeholder.com/24?text=LS' },
  { userId: 'user_003', name: '王五', avatar: 'https://via.placeholder.com/24?text=WW' }
])

// 计算属性
const mentionMatches = computed(() => {
  if (!mentionQuery.value) return []
  const query = mentionQuery.value.toLowerCase()
  return members.value.filter(m => m.name.toLowerCase().includes(query))
})

// 打字用户文本
const typingUsersText = computed(() => {
  if (!props.typingUsers || props.typingUsers.length === 0) return ''
  if (props.typingUsers.length === 1) {
    return props.typingUsers[0]
  }
  if (props.typingUsers.length === 2) {
    return props.typingUsers.join(' 和 ')
  }
  return `${props.typingUsers.slice(0, 2).join('、')} 等人`
})

// 方法
function handleEnter(event) {
  if (event.shiftKey) {
    // Shift+Enter: 换行
    inputValue.value += '\n'
    return
  }
  // Ctrl+Enter: 发送
  if (event.ctrlKey || event.metaKey) {
    handleSend()
  }
}

function handleInput() {
  emit('typing', inputValue.value.length > 0)

  // 检查 @mention
  const lastAtIndex = inputValue.value.lastIndexOf('@')
  if (lastAtIndex !== -1) {
    const afterAt = inputValue.value.substring(lastAtIndex + 1)
    if (!afterAt.includes(' ')) {
      mentionQuery.value = afterAt
      showMentionList.value = true
      return
    }
  }
  showMentionList.value = false
}

function handleSend() {
  if (!inputValue.value.trim() || props.disabled) return

  sending.value = true

  setTimeout(() => {
    emit('send', inputValue.value.trim())
    inputValue.value = ''
    sending.value = false
    showMentionList.value = false

    nextTick(() => {
      inputRef.value?.focus?.()
    })
  }, 300)
}

function insertEmoji(emoji) {
  inputValue.value += emoji
  showEmoji.value = false
  nextTick(() => {
    inputRef.value?.focus?.()
  })
}

function selectMention(member) {
  const lastAtIndex = inputValue.value.lastIndexOf('@')
  const beforeAt = inputValue.value.substring(0, lastAtIndex)
  inputValue.value = beforeAt + `@${member.name} `
  showMentionList.value = false
  nextTick(() => {
    inputRef.value?.focus?.()
  })
}

function handleFileSelect(file) {
  if (file.raw) {
    emit('upload', [file.raw])
    uploadRef.value?.clearFiles?.()
  }
}

function handleImageSelect(file) {
  if (file.raw) {
    emit('upload', [file.raw])
    imageUploadRef.value?.clearFiles?.()
  }
}

function handleDrop(event) {
  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    emit('upload', files)
    dragOverlay.value = false
  }
}

function toggleVoiceInput() {
  ElMessage.info('语音输入功能开发中...')
}

function handleQuickAction(command) {
  switch (command) {
    case 'clear':
      inputValue.value = ''
      break
    case 'template':
      ElMessage.info('快捷模板开发中...')
      break
    case 'setting':
      ElMessage.info('设置开发中...')
      break
  }
}

// 暴露方法
defineExpose({
  focus: () => inputRef.value?.focus?.()
})
</script>

<style scoped>
.message-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.offline-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  color: #d97706;
  font-size: 13px;
}

/* 打字指示器 */
.typing-indicator {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  border-radius: 6px;
  margin: 0;
  animation: fadeIn 0.3s ease-out;
}

.typing-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.typing-users {
  font-weight: 600;
  color: #5c6af0;
}

.typing-dots {
  display: inline-flex;
  gap: 2px;
  margin-left: 2px;
}

.typing-dots .dot {
  animation: blink 1.4s infinite;
  display: inline-block;
}

.typing-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.toolbar {
  display: flex;
  gap: 4px;
}

.tool-btn {
  font-size: 18px;
}

.input-wrapper {
  position: relative;
}

.message-input {
  border-radius: 8px;
}

.message-input :deep(.el-textarea__inner) {
  padding: 10px 12px;
  font-size: 14px;
  resize: none;
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #999;
  pointer-events: none;
}

/* @mention 列表 */
.mention-list {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 4px;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.mention-item:hover {
  background: #f5f5f5;
}

/* 表情选择器 */
.emoji-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: popupFadeIn 0.2s ease-out;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: 8px;
  background: #fafafa;
  border-radius: 8px;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border: none;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e5e7eb;
}

.emoji-item:hover {
  background: #5c6af0;
  transform: scale(1.3) translateY(-4px);
  border-color: #5c6af0;
  box-shadow: 0 4px 12px rgba(92, 106, 240, 0.2);
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.send-btn {
  border-radius: 6px;
  padding: 6px 16px;
}

/* 拖拽覆盖层 */
.drag-overlay {
  position: absolute;
  inset: 0;
  background: rgba(92, 106, 240, 0.1);
  border: 2px dashed #5c6af0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.drag-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #5c6af0;
  font-size: 14px;
}

.drag-hint .el-icon {
  font-size: 32px;
}

/* 上传包装 */
.upload-wrapper {
  display: contents;
}

/* 离线状态 */
.message-input-container.offline {
  opacity: 0.8;
}
</style>
