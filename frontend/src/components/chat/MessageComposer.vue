<template>
  <div
    class="message-composer"
    :class="{ 'message-composer--dragover': isDragOver, 'message-composer--offline': !isConnected }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- Offline indicator -->
    <div v-if="!isConnected" class="message-composer__offline-banner">
      <el-icon><Warning /></el-icon>
      <span>网络连接已断开，消息将在连接恢复后发送</span>
    </div>

    <div v-if="isDragOver" class="message-composer__drop-overlay">
      <el-icon><UploadFilled /></el-icon>
      <span>释放以上传附件</span>
    </div>
    <div class="message-composer__input-wrapper">
      <el-input
        ref="inputRef"
        v-model="innerValue"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 6 }"
        :placeholder="placeholder"
        :disabled="disabled"
        maxlength="1000"
        @keydown.enter.prevent="handleEnter"
        @input="handleMentionInput"
      />
      <div class="message-composer__char-count">
        {{ innerValue.length }}/1000
      </div>

      <!-- Phase 3: @mention autocomplete list -->
      <el-popover
        v-if="showMentionList"
        :visible="showMentionList"
        placement="top"
        :popper-style="{ maxWidth: '240px', width: '240px' }"
        trigger="manual"
        class="message-composer__mention-popover"
      >
        <div class="message-composer__mention-list">
          <button
            v-for="member in getFilteredMembers()"
            :key="member.id"
            type="button"
            class="message-composer__mention-item"
            @click="handleMentionSelect(member)"
          >
            <el-avatar
              :size="24"
              :src="member.avatar"
              class="message-composer__mention-avatar"
            >
              {{ member.name?.slice(0, 1) || '?' }}
            </el-avatar>
            <span class="message-composer__mention-name">{{ member.name }}</span>
          </button>
        </div>
      </el-popover>
    </div>

    <div class="message-composer__toolbar">
      <div class="message-composer__left">
        <el-popover
          placement="top-start"
          trigger="click"
          width="280"
          v-model:visible="emojiVisible"
        >
          <template #reference>
            <el-button
              circle
              text
              size="large"
              :disabled="disabled"
              class="message-composer__emoji-btn"
              title="插入表情"
            >
              😊
            </el-button>
          </template>
          <div class="message-composer__emoji-selector">
            <!-- Search box -->
            <el-input
              v-model="emojiSearch"
              placeholder="搜索表情..."
              size="small"
              clearable
              class="message-composer__emoji-search"
            />

            <!-- Category tabs -->
            <div class="message-composer__emoji-tabs">
              <button
                v-for="(cat, key) in emojiCategories"
                :key="key"
                class="message-composer__emoji-tab"
                :class="{ 'is-active': currentEmojiCategory === key }"
                @click="currentEmojiCategory = key; emojiSearch = ''"
                :title="cat.name"
              >
                {{ key === 'recent' ? '⏱️' : key === 'smileys' ? '😊' : key === 'gestures' ? '👍' : key === 'symbols' ? '✨' : '🎁' }}
              </button>
            </div>

            <!-- Emoji grid -->
            <div class="message-composer__emoji-grid">
              <button
                v-for="emoji in getFilteredEmojis()"
                :key="emoji"
                type="button"
                class="message-composer__emoji-item"
                @click="handleEmojiSelect(emoji)"
                :title="emoji"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </el-popover>

        <el-popover
          v-if="quickReplies.length"
          placement="top-start"
          trigger="click"
          width="260"
          v-model:visible="quickReplyVisible"
        >
          <template #reference>
            <el-button
              circle
              text
              size="large"
              :disabled="disabled"
              class="message-composer__quick-btn"
              title="快捷回复"
            >
              <el-icon><ChatDotRound /></el-icon>
            </el-button>
          </template>
          <div class="message-composer__quick-replies">
            <el-button
              v-for="reply in quickReplies"
              :key="reply"
              size="small"
              text
              class="message-composer__quick-reply"
              @click="handleQuickReply(reply)"
            >
              {{ reply }}
            </el-button>
          </div>
        </el-popover>

        <el-upload
          v-if="allowAttachments"
          ref="uploadRef"
          class="message-composer__upload"
          :auto-upload="false"
          :show-file-list="false"
          :accept="attachmentAccept"
          :disabled="disabled"
          multiple
          @change="handleAttachmentChange"
        >
          <el-button
            circle
            text
            size="large"
            :disabled="disabled"
            class="message-composer__upload-btn"
            title="上传附件"
          >
            <el-icon><UploadFilled /></el-icon>
          </el-button>
        </el-upload>
        <slot name="tools" />
      </div>
      <div class="message-composer__actions">
        <el-button
          :disabled="disabled || !innerValue.trim()"
          type="primary"
          class="message-composer__send-btn"
          @click="emitSend"
        >
          <el-icon><Promotion /></el-icon>
          <span>发送</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, ChatDotRound, Promotion, Warning } from '@element-plus/icons-vue'

// Emoji categories with full set
const EMOJI_CATEGORIES = {
  recent: { name: '最近使用', emojis: [] },
  smileys: { name: '笑脸', emojis: ['😀', '😁', '😂', '🤣', '😊', '😍', '🤔', '😎', '😢', '😡'] },
  gestures: { name: '手势', emojis: ['👍', '👎', '👏', '🙌', '👋', '🤝', '👊', '✊', '🤟', '🤘'] },
  symbols: { name: '符号', emojis: ['💡', '🔥', '✅', '❓', '🚀', '💯', '⭐', '❤️', '💔', '💫'] },
  objects: { name: '物品', emojis: ['🎁', '🎈', '🎉', '🎊', '🎯', '📌', '📍', '📎', '📝', '📚'] }
}

const EMOJI_PRESETS = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😊',
  '😍',
  '🤔',
  '🙌',
  '👍',
  '👏',
  '💡',
  '🔥',
  '✅',
  '❓',
  '🚀'
]

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '输入消息... (Enter 发送，Shift+Enter 换行)'
  },
  allowAttachments: {
    type: Boolean,
    default: true
  },
  attachmentAccept: {
    type: String,
    default: ''
  },
  maxAttachmentSizeMB: {
    type: Number,
    default: 20
  },
  maxAttachmentCount: {
    type: Number,
    default: 5
  },
  quickReplies: {
    type: Array,
    default: () => [
      '收到，我马上处理。',
      '感谢反馈，我们稍后联系您。',
      '方便再详细描述一下吗？'
    ]
  },
  // Real-time chat props
  isConnected: {
    type: Boolean,
    default: true
  },
  roomId: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'update:modelValue',
  'send',
  'attachments-selected',
  'attachment-rejected',
  'emoji-select',
  'quick-reply',
  'typing-start',
  'typing-stop'
])

const inputRef = ref(null)
const uploadRef = ref(null)
const innerValue = ref(props.modelValue)
const emojiVisible = ref(false)
const quickReplyVisible = ref(false)
const isDragOver = ref(false)
const emojiPresets = EMOJI_PRESETS

// Typing indicator with debouncing
let typingTimeout = null
let isTypingActive = false

function startTypingIndicator() {
  if (!isTypingActive && props.isConnected && props.roomId) {
    isTypingActive = true
    emit('typing-start', { roomId: props.roomId })
  }

  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    if (isTypingActive && props.isConnected && props.roomId) {
      isTypingActive = false
      emit('typing-stop', { roomId: props.roomId })
    }
  }, 1000) // Stop typing indicator after 1 second of no input
}

// Phase 3: Enhanced emoji selector
const emojiCategories = ref(JSON.parse(JSON.stringify(EMOJI_CATEGORIES)))
const currentEmojiCategory = ref('recent')
const emojiSearch = ref('')
const recentEmojiLimit = 12

// Load recent emojis from localStorage
function loadRecentEmojis() {
  try {
    const stored = localStorage.getItem('chat_recent_emojis')
    if (stored) {
      const recent = JSON.parse(stored)
      emojiCategories.value.recent.emojis = recent.slice(0, recentEmojiLimit)
    }
  } catch (e) {
    console.error('Failed to load recent emojis:', e)
  }
}

// Save emoji to recent list
function saveRecentEmoji(emoji) {
  try {
    const recent = emojiCategories.value.recent.emojis
    const index = recent.indexOf(emoji)
    if (index > -1) {
      recent.splice(index, 1)
    }
    recent.unshift(emoji)
    if (recent.length > recentEmojiLimit) {
      recent.pop()
    }
    localStorage.setItem('chat_recent_emojis', JSON.stringify(recent))
  } catch (e) {
    console.error('Failed to save recent emoji:', e)
  }
}

// Get filtered emojis based on search
function getFilteredEmojis() {
  const category = emojiCategories.value[currentEmojiCategory.value]
  if (!category || !emojiSearch.value) {
    return category?.emojis || []
  }

  const searchLower = emojiSearch.value.toLowerCase()
  const categoryName = category.name.toLowerCase()
  if (categoryName.includes(searchLower)) {
    return category.emojis
  }

  // Search across all categories if not in current
  let results = []
  for (const cat of Object.values(emojiCategories.value)) {
    results = results.concat(cat.emojis)
  }
  return results
}

// Initialize recent emojis on component mount
loadRecentEmojis()

// Phase 3: @mention support
const mentionMembers = ref([
  { name: '张三', id: 'user_1', avatar: '' },
  { name: '李四', id: 'user_2', avatar: '' },
  { name: '王五', id: 'user_3', avatar: '' },
  { name: '刘六', id: 'user_4', avatar: '' },
  { name: '赵七', id: 'user_5', avatar: '' }
])
const showMentionList = ref(false)
const mentionQuery = ref('')
const mentionCursorPosition = ref(0)

// Filter members for mention autocomplete
function getFilteredMembers() {
  if (!mentionQuery.value) return mentionMembers.value
  const query = mentionQuery.value.toLowerCase()
  return mentionMembers.value.filter(member =>
    member.name.toLowerCase().includes(query)
  )
}

// Handle @ mention input
function handleMentionInput() {
  const textarea = inputRef.value?.textarea
  if (!textarea) return

  const text = innerValue.value
  const cursorPos = textarea.selectionStart
  mentionCursorPosition.value = cursorPos

  // Trigger typing indicator
  startTypingIndicator()

  // Find if we're in a mention context
  const beforeCursor = text.substring(0, cursorPos)
  const lastAtIndex = beforeCursor.lastIndexOf('@')

  if (lastAtIndex === -1 || lastAtIndex === cursorPos - 1) {
    showMentionList.value = false
    return
  }

  const mentionText = beforeCursor.substring(lastAtIndex + 1)
  if (mentionText.includes(' ')) {
    showMentionList.value = false
    return
  }

  mentionQuery.value = mentionText
  showMentionList.value = getFilteredMembers().length > 0
}

// Insert mention into text
function handleMentionSelect(member) {
  const textarea = inputRef.value?.textarea
  if (!textarea) return

  const text = innerValue.value
  const cursorPos = mentionCursorPosition.value
  const beforeCursor = text.substring(0, cursorPos)
  const afterCursor = text.substring(cursorPos)

  const lastAtIndex = beforeCursor.lastIndexOf('@')
  if (lastAtIndex === -1) return

  const newText = beforeCursor.substring(0, lastAtIndex) + `@${member.name} ` + afterCursor
  innerValue.value = newText
  showMentionList.value = false
  mentionQuery.value = ''

  nextTick(() => {
    const newCursorPos = lastAtIndex + member.name.length + 2
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
  })
}

watch(
  () => props.modelValue,
  (val) => {
    if (val !== innerValue.value) {
      innerValue.value = val
    }
  }
)

watch(innerValue, (val) => emit('update:modelValue', val))

function focusInput() {
  nextTick(() => {
    const textarea = inputRef.value?.textarea
    textarea?.focus?.()
  })
}

function handleEmojiSelect(emoji) {
  if (props.disabled || !emoji) return
  innerValue.value = `${innerValue.value || ''}${emoji}`
  saveRecentEmoji(emoji)
  emojiVisible.value = false
  emit('emoji-select', emoji)
  focusInput()
}

function handleQuickReply(reply) {
  if (props.disabled || !reply) return
  innerValue.value = reply
  quickReplyVisible.value = false
  emit('quick-reply', reply)
  focusInput()
}

function hasFilePayload(event) {
  const dt = event.dataTransfer
  if (!dt) return false
  if (dt.items && dt.items.length) {
    return Array.from(dt.items).some((item) => item.kind === 'file')
  }
  return Boolean(dt.files && dt.files.length)
}

function processSelectedFiles(rawFiles) {
  if (!props.allowAttachments || props.disabled) return
  const files = (rawFiles || []).filter((file) => file instanceof File)
  if (!files.length) return

  let acceptedFiles = files
  if (props.maxAttachmentCount > 0 && files.length > props.maxAttachmentCount) {
    const rejected = files.slice(props.maxAttachmentCount)
    acceptedFiles = files.slice(0, props.maxAttachmentCount)
    emit('attachment-rejected', { reason: 'count', files: rejected })
    ElMessage.warning(`最多只能选择 ${props.maxAttachmentCount} 个附件`)
  }

  const oversize = []
  const withinLimit = []
  const sizeLimitBytes =
    props.maxAttachmentSizeMB > 0 ? props.maxAttachmentSizeMB * 1024 * 1024 : 0

  acceptedFiles.forEach((file) => {
    if (sizeLimitBytes && file.size > sizeLimitBytes) {
      oversize.push(file)
    } else {
      withinLimit.push(file)
    }
  })

  if (oversize.length) {
    emit('attachment-rejected', { reason: 'size', files: oversize })
    ElMessage.warning(`单个附件大小不能超过 ${props.maxAttachmentSizeMB}MB`)
  }

  if (withinLimit.length) {
    emit('attachments-selected', withinLimit)
  }
}

function handleEnter(event) {
  if (event.shiftKey) {
    inputRef.value?.textarea?.setRangeText('\n', inputRef.value.textarea.selectionStart, inputRef.value.textarea.selectionEnd, 'end')
    return
  }
  emitSend()
}

function emitSend() {
  if (!innerValue.value.trim()) return

  // Clear typing indicator
  clearTimeout(typingTimeout)
  if (isTypingActive && props.isConnected && props.roomId) {
    isTypingActive = false
    emit('typing-stop', { roomId: props.roomId })
  }

  emit('send', innerValue.value.trim())
  innerValue.value = ''
}

function handleAttachmentChange(uploadFile, uploadFiles) {
  if (!props.allowAttachments || props.disabled) {
    uploadRef.value?.clearFiles?.()
    return
  }

  const rawFiles = (uploadFiles || [])
    .map((item) => item.raw)
    .filter((file) => file instanceof File)

  if (!rawFiles.length) {
    uploadRef.value?.clearFiles?.()
    return
  }

  processSelectedFiles(rawFiles)
  nextTick(() => uploadRef.value?.clearFiles?.())
}

function handleDragEnter(event) {
  if (!hasFilePayload(event) || props.disabled || !props.allowAttachments) return
  isDragOver.value = true
}

function handleDragOver(event) {
  if (!hasFilePayload(event) || props.disabled || !props.allowAttachments) return
  event.dataTransfer.dropEffect = 'copy'
  isDragOver.value = true
}

function handleDragLeave(event) {
  if (!isDragOver.value) return
  const related = event.relatedTarget
  if (related && event.currentTarget?.contains(related)) return
  isDragOver.value = false
}

function handleDrop(event) {
  if (!hasFilePayload(event) || props.disabled || !props.allowAttachments) return
  const files = Array.from(event.dataTransfer?.files || [])
  isDragOver.value = false
  if (!files.length) return
  processSelectedFiles(files)
  event.dataTransfer?.clearData?.()
}
</script>

<style scoped>
.message-composer {
  position: relative;
  padding: 16px 20px;
  border-top: 1px solid rgba(224, 229, 255, 0.6);
  background: rgba(255, 255, 255, 0.92);
  transition: background 0.2s ease, border 0.2s ease;
  flex-shrink: 0;
}

.message-composer__offline-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  color: #ff8c00;
  font-size: 12px;
  animation: slideDown 0.2s ease;
}

.message-composer__offline-banner .el-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.message-composer--dragover {
  border: 1px dashed rgba(92, 106, 240, 0.6);
  background: rgba(92, 106, 240, 0.08);
}

.message-composer__drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #5c6af0;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px dashed rgba(92, 106, 240, 0.5);
  border-radius: 12px;
  pointer-events: none;
  z-index: 2;
}

.message-composer__drop-overlay .el-icon {
  font-size: 32px;
}

/* Input wrapper with character count */
.message-composer__input-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.message-composer__input-wrapper :deep(.el-textarea__inner) {
  border-radius: 12px !important;
  border: 1px solid rgba(224, 229, 255, 0.8) !important;
  padding: 14px 16px !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  background: #fafbff !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04) !important;
}

.message-composer__input-wrapper :deep(.el-textarea__inner):focus {
  border-color: rgba(92, 106, 240, 0.6) !important;
  background: #ffffff !important;
  box-shadow: 0 2px 12px rgba(92, 106, 240, 0.15) !important;
}

.message-composer__input-wrapper :deep(.el-textarea__inner)::placeholder {
  color: #a0a5bd !important;
  font-size: 14px !important;
}

.message-composer__char-count {
  position: absolute;
  right: 16px;
  bottom: 14px;
  font-size: 12px;
  color: #a0a5bd;
  background: #fafbff;
  padding: 2px 6px;
  border-radius: 4px;
  user-select: none;
  pointer-events: none;
}

.message-composer__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.message-composer__left {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Toolbar buttons styling */
.message-composer__emoji-btn,
.message-composer__quick-btn,
.message-composer__upload-btn {
  transition: all 0.3s ease;
  color: #5c6af0;
}

.message-composer__emoji-btn {
  font-size: 18px;
  line-height: 1;
}

.message-composer__emoji-btn:hover:not(:disabled),
.message-composer__quick-btn:hover:not(:disabled),
.message-composer__upload-btn:hover:not(:disabled) {
  transform: scale(1.15);
  color: #2f6bff;
}

.message-composer__emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 4px;
}

.message-composer__emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.message-composer__emoji-item:hover {
  background: rgba(92, 106, 240, 0.15);
  transform: scale(1.2);
}

.message-composer__emoji-item:active {
  transform: scale(1.1);
}

.message-composer__quick-btn {
  color: #5c6af0;
}

.message-composer__quick-replies {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
  padding: 8px 0;
}

.message-composer__quick-reply {
  justify-content: flex-start;
  white-space: normal;
  line-height: 1.5;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.message-composer__quick-reply:hover {
  background: rgba(92, 106, 240, 0.1);
  transform: translateX(4px);
}

/* Send button */
.message-composer__actions {
  display: flex;
  gap: 10px;
}

.message-composer__send-btn {
  border-radius: 8px;
  padding: 8px 20px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-composer__send-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(92, 106, 240, 0.3);
}

.message-composer__send-btn:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(92, 106, 240, 0.2);
}

.message-composer__send-btn:disabled {
  opacity: 0.6;
}

/* Phase 3: Enhanced emoji selector */
.message-composer__emoji-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 280px;
}

.message-composer__emoji-search {
  margin-bottom: 4px;
}

.message-composer__emoji-search :deep(.el-input__inner) {
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
}

.message-composer__emoji-tabs {
  display: flex;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(224, 229, 255, 0.4);
  overflow-x: auto;
}

.message-composer__emoji-tab {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  padding: 0;
}

.message-composer__emoji-tab:hover {
  background: rgba(92, 106, 240, 0.1);
}

.message-composer__emoji-tab.is-active {
  background: rgba(92, 106, 240, 0.2);
  border-color: rgba(92, 106, 240, 0.4);
}

.message-composer__emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
  padding: 8px 4px;
  border-radius: 6px;
}

.message-composer__emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  aspect-ratio: 1;
}

.message-composer__emoji-item:hover {
  background: rgba(92, 106, 240, 0.15);
  transform: scale(1.2) rotate(5deg);
}

.message-composer__emoji-item:active {
  transform: scale(1.1);
}

/* Phase 3: @mention support styles */
.message-composer__mention-popover {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
}

.message-composer__mention-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
  padding: 6px 0;
}

.message-composer__mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  text-align: left;
}

.message-composer__mention-item:hover {
  background: rgba(92, 106, 240, 0.15);
  transform: translateX(4px);
}

.message-composer__mention-avatar {
  flex-shrink: 0;
}

.message-composer__mention-name {
  color: #283056;
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-composer__mention-item:hover .message-composer__mention-name {
  color: #5c6af0;
}
</style>

