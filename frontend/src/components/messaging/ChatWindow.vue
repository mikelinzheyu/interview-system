<template>
  <div class="chat-window">
    <!-- 顶部栏 -->
    <MessageHeader
      :other-user="currentConversation?.otherUser"
      :conversation-id="currentConversation?.id"
      @back="handleBack"
      @clear="handleMessageClear"
      @delete="handleConversationDelete"
    />

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="messages.length === 0" class="empty-state">
        <el-empty description="暂无消息，开始聊天吧~" />
      </div>

      <!-- 消息列表 -->
      <div v-else class="messages-list">
        <ChatBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </div>

      <!-- 加载历史消息提示 -->
      <div v-if="hasMore" class="load-more">
        <el-button
          text
          @click="loadMoreMessages"
          :loading="loadingMore"
        >
          加载更多
        </el-button>
      </div>
    </div>

    <!-- 输入框 -->
    <ChatInput
      :loading="loading"
      @send="handleSendMessage"
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="true"
      @close="clearError"
      class="error-alert"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useMessagingStore } from '@/stores/messagingStore'
import { useWebSocket } from '@/composables/useWebSocket'
import ChatBubble from './ChatBubble.vue'
import ChatInput from './ChatInput.vue'
import MessageHeader from './MessageHeader.vue'

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'conversation-created'])

const messagingStore = useMessagingStore()
const { joinConversation, leaveConversation } = useWebSocket()
const messagesContainer = ref(null)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)

const loading = computed(() => messagingStore.loading)
const messages = computed(() => messagingStore.messages)
const currentConversation = computed(() => props.conversation)
const error = computed(() => messagingStore.error)

// 检测是否为新对话
const isNewConversation = computed(() => {
  return props.conversation?.isNew === true
})

// 监听消息变化，自动滚动到底部
watch(
  () => messages.value,
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { deep: true }
)

// 初始化加载对话
onMounted(async () => {
  // 如果是新对话，不需要加载历史消息
  if (isNewConversation.value) {
    console.log('[ChatWindow] New conversation, skip loading messages')
    messagingStore.messages = []
    return
  }

  // 加载现有对话
  await loadConversation()

  // 加入 WebSocket 对话房间
  if (props.conversation.id) {
    joinConversation(props.conversation.id)
  }
})

// 卸载时离开对话房间
onUnmounted(() => {
  if (props.conversation.id && !isNewConversation.value) {
    leaveConversation(props.conversation.id)
  }
})

const loadConversation = async () => {
  try {
    const data = await messagingStore.openConversation(props.conversation.id)
    hasMore.value = data.pagination?.hasMore || false
    currentPage.value = 1
  } catch (error) {
    console.error('[ChatWindow] Load conversation error:', error)
  }
}

const handleSendMessage = async (data) => {
  try {
    // 如果是新对话，发送第一条消息时创建对话
    if (isNewConversation.value) {
      console.log('[ChatWindow] Creating new conversation with first message')
      const newConv = await messagingStore.createConversation({
        recipientId: props.conversation.otherUser.id,
        content: data.content
      })

      // 通知父组件对话已创建
      emit('conversation-created', newConv)

      // 加入 WebSocket 房间
      if (newConv.id) {
        joinConversation(newConv.id)
      }

      ElMessage.success('对话已创建')
    } else {
      // 普通发送消息
      await messagingStore.sendMessage(data.content)
    }
  } catch (error) {
    console.error('[ChatWindow] Send message error:', error)
    ElMessage.error('发送失败: ' + (error.message || '未知错误'))
  }
}

const loadMoreMessages = async () => {
  loadingMore.value = true
  try {
    currentPage.value++
    const response = await messagingStore.getMessages(
      props.conversation.id,
      currentPage.value
    )
    // 在消息列表最前面添加新消息
    messagingStore.messages.unshift(...response.data)
    hasMore.value = response.hasMore || false
  } catch (error) {
    console.error('[ChatWindow] Load more messages error:', error)
    currentPage.value--
  } finally {
    loadingMore.value = false
  }
}

const handleBack = () => {
  emit('close')
}

const handleMessageClear = () => {
  messagingStore.messages = []
}

const handleConversationDelete = () => {
  emit('close')
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    })
  }
}

const clearError = () => {
  messagingStore.clearError()
}
</script>

<style scoped lang="scss">
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 3px;

      &:hover {
        background: #b3b3b3;
      }
    }

    .loading-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
    }

    .load-more {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }
  }

  .error-alert {
    margin: 8px 12px 0 12px;
  }
}
</style>
