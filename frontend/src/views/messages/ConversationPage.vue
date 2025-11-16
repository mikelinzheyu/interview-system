<template>
  <div class="conversation-page">
    <!-- 顶部栏 -->
    <div class="conversation-header">
      <div class="header-left">
        <el-button
          :icon="ArrowLeft"
          text
          @click="goBack"
          class="back-btn"
        />
        <div class="user-info" v-if="otherUser">
          <el-avatar :src="otherUser.avatar" :size="40" />
          <div class="user-details">
            <h3>{{ otherUser.name || '用户' }}</h3>
            <p v-if="otherUser.title" class="user-title">{{ otherUser.title }}</p>
          </div>
        </div>
      </div>
      <div class="header-right">
        <el-button
          :icon="Setting"
          text
          class="setting-btn"
          @click="showSettings = true"
        />
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="conversation-content">
      <!-- 聊天区域 -->
      <div class="chat-container">
        <!-- 消息列表 -->
        <div class="messages-area" ref="messagesContainer">
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
        </div>

        <!-- 输入框 -->
        <ChatInput
          :loading="loading"
          @send="handleSendMessage"
          class="input-area"
        />
      </div>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="true"
      @close="clearError"
      class="error-alert"
    />

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="聊天设置"
      width="400px"
    >
      <div class="settings-content">
        <el-button
          type="warning"
          @click="handleClearMessages"
          class="full-width"
        >
          清空聊天记录
        </el-button>
        <el-button
          type="danger"
          @click="handleDeleteConversation"
          class="full-width"
        >
          删除对话
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Setting } from '@element-plus/icons-vue'
import { useMessagingStore } from '@/stores/messagingStore'
import { useWebSocket } from '@/composables/useWebSocket'
import ChatBubble from '@/components/messaging/ChatBubble.vue'
import ChatInput from '@/components/messaging/ChatInput.vue'

const route = useRoute()
const router = useRouter()
const messagingStore = useMessagingStore()
const { joinConversation, leaveConversation } = useWebSocket()

const messagesContainer = ref(null)
const showSettings = ref(false)
const otherUser = ref(null)

// 获取用户ID从路由参数
const userId = computed(() => route.params.userId)

// 从store获取状态
const loading = computed(() => messagingStore.loading)
const messages = computed(() => messagingStore.messages)
const error = computed(() => messagingStore.error)
const currentConversation = computed(() => messagingStore.currentConversation)

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
  await loadConversation()
})

// 卸载时离开对话房间
onUnmounted(() => {
  if (currentConversation.value?.id) {
    leaveConversation(currentConversation.value.id)
  }
})

const loadConversation = async () => {
  try {
    // 验证路由参数中的 userId
    if (!userId.value || isNaN(parseInt(userId.value))) {
      ElMessage.error('无效的用户ID')
      console.warn('[ConversationPage] Invalid userId from route:', userId.value)
      // 返回上一页
      router.back()
      return
    }

    const data = await messagingStore.openConversation(userId.value)

    // 设置其他用户信息
    otherUser.value = data.conversation?.otherUser || {
      id: userId.value,
      name: '用户'
    }

    // 加入WebSocket房间
    if (data.conversation?.id) {
      joinConversation(data.conversation.id)
    }
  } catch (error) {
    ElMessage.error('加载对话失败: ' + error.message)
    console.error('[ConversationPage] Load conversation error:', error)
    // 延迟后返回上一页
    setTimeout(() => {
      router.back()
    }, 2000)
  }
}

const handleSendMessage = async (data) => {
  try {
    await messagingStore.sendMessage(data.content)
  } catch (error) {
    console.error('[ConversationPage] Send message error:', error)
  }
}

const handleClearMessages = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空聊天记录吗？此操作无法撤销。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await messagingStore.clearConversation()
    ElMessage.success('聊天记录已清空')
    showSettings.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[ConversationPage] Clear messages error:', error)
    }
  }
}

const handleDeleteConversation = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个对话吗？此操作无法撤销。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (currentConversation.value?.id) {
      await messagingStore.deleteConversation(currentConversation.value.id)
      ElMessage.success('对话已删除')
      showSettings.value = false
      goBack()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[ConversationPage] Delete conversation error:', error)
    }
  }
}

const goBack = () => {
  router.go(-1)
}

const clearError = () => {
  messagingStore.clearError()
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    })
  }
}
</script>

<style scoped lang="scss">
.conversation-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-page, #fff);

  .conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #e0e0e0;
    background: white;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .back-btn {
        font-size: 18px;
        color: #606266;

        &:hover {
          color: #303133;
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .user-details {
          h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #303133;
          }

          .user-title {
            margin: 0;
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }

    .header-right {
      .setting-btn {
        font-size: 18px;
        color: #606266;

        &:hover {
          color: #303133;
        }
      }
    }
  }

  .conversation-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;

      .messages-area {
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
          gap: 8px;
        }
      }

      .input-area {
        border-top: 1px solid #e0e0e0;
        padding: 16px;
      }
    }
  }

  .error-alert {
    margin: 8px 12px 0 12px;
  }
}

:deep(.el-dialog__body) {
  padding: 20px;

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .full-width {
      width: 100%;
    }
  }
}
</style>
