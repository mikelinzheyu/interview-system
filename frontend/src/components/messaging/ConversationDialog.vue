<template>
  <el-dialog
    v-model="visible"
    :title="`与 ${otherUser?.name || '用户'} 聊天`"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleDialogClose"
  >
    <!-- 聊天区域 -->
    <div class="dialog-chat-area">
      <!-- 消息列表 -->
      <div class="messages-area" ref="messagesContainer">
        <!-- 加载中 -->
        <div v-if="loading" class="loading">
          <el-skeleton :rows="3" animated />
        </div>

        <!-- 空状态 -->
        <div v-else-if="messages.length === 0" class="empty">
          <el-empty description="开始新的对话~" />
        </div>

        <!-- 消息列表 -->
        <div v-else>
          <ChatBubble
            v-for="message in messages"
            :key="message.id"
            :message="message"
          />
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-area">
        <el-textarea
          v-model="messageText"
          :rows="2"
          placeholder="输入消息... (Ctrl+Enter 或 Cmd+Enter 发送)"
          @keydown.ctrl.enter="handleSend"
          @keydown.meta.enter="handleSend"
          maxlength="500"
          show-word-limit
        />
      </div>
    </div>

    <!-- 按钮 -->
    <template #footer>
      <div style="flex: auto">
        <span style="color: #909399; font-size: 12px;">
          {{ messageText.length }}/500
        </span>
      </div>
      <el-button @click="handleDialogClose">关闭</el-button>
      <el-button
        type="primary"
        @click="handleSend"
        :loading="sending"
        :disabled="!messageText.trim() || sending"
      >
        {{ sending ? '发送中...' : '发送' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useMessagingStore } from '@/stores/messagingStore'
import ChatBubble from './ChatBubble.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  otherUserId: {
    type: [String, Number],
    required: true
  },
  otherUser: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'close'])

const messagingStore = useMessagingStore()
const messagesContainer = ref(null)
const messageText = ref('')
const sending = ref(false)
let conversationId = null

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const loading = computed(() => messagingStore.loading)
const messages = computed(() => messagingStore.messages)

// 监听 visible 变化，打开对话时加载消息
watch(
  () => visible.value,
  async (newVal) => {
    if (newVal && props.otherUserId) {
      await loadConversation()
    }
  }
)

// 监听消息变化，自动滚动到底部
watch(
  () => messages.value,
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { deep: true }
)

const loadConversation = async () => {
  try {
    const data = await messagingStore.openConversation(props.otherUserId)
    conversationId = data.conversation?.id
    messageText.value = ''
  } catch (error) {
    console.error('[ConversationDialog] Load conversation error:', error)
    ElMessage.error('加载对话失败')
  }
}

const handleSend = async () => {
  const text = messageText.value.trim()

  if (!text) {
    ElMessage.warning('消息不能为空')
    return
  }

  if (text.length > 500) {
    ElMessage.error('消息长度不能超过 500 字符')
    return
  }

  if (!conversationId) {
    ElMessage.error('对话不存在')
    return
  }

  sending.value = true

  try {
    await messagingStore.sendMessage(text)
    messageText.value = ''
  } catch (error) {
    console.error('[ConversationDialog] Send message error:', error)
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

const handleDialogClose = () => {
  visible.value = false
  messageText.value = ''
  messagingStore.closeConversation()
  emit('close')
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}
</script>

<style scoped lang="scss">
.dialog-chat-area {
  display: flex;
  flex-direction: column;
  height: 500px;
  gap: 12px;

  .messages-area {
    flex: 1;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
    background: #f9f9f9;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 3px;

      &:hover {
        background: #b3b3b3;
      }
    }

    .loading,
    .empty {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .input-area {
    :deep(.el-textarea__inner) {
      resize: none;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }
  }
}
</style>
