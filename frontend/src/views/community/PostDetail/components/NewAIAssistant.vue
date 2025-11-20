<template>
  <div class="ai-assistant-panel">
    <!-- 历史对话侧边栏 -->
    <div v-if="showHistory" class="history-sidebar">
      <div class="history-header">
        <h3>💬 对话历史 ({{ conversations.length }})</h3>
        <div class="header-actions">
          <el-button
            v-if="conversations.length > 0"
            type="danger"
            size="small"
            @click="handleClearAllConversations"
            plain
          >
            清空全部
          </el-button>
          <el-button
            type="primary"
            size="small"
            @click="showHistory = false"
            plain
          >
            关闭
          </el-button>
        </div>
      </div>

      <div v-if="isLoadingHistory" class="history-loading">
        <span>加载中...</span>
      </div>

      <div v-else-if="conversations.length === 0" class="history-empty">
        📭 暂无对话历史<br>
        <small>开始新对话后，历史会自动保存</small>
      </div>

      <div v-else class="history-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="history-item"
          :class="{ active: selectedHistoryId === conv.id }"
        >
          <div class="history-item-content" @click="loadHistoryMessages(conv.id)">
            <div class="history-title">{{ conv.title || '新对话' }}</div>
            <div class="history-meta">
              💬 {{ conv.message_count || 0 }} 条消息
            </div>
            <div class="history-time">
              {{ new Date(conv.updated_at).toLocaleString('zh-CN') }}
            </div>
          </div>
          <el-button
            type="danger"
            size="small"
            @click.stop="handleDeleteConversation(conv.id)"
            plain
            class="delete-btn"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主面板 -->
    <div class="main-panel">
      <AssistantHeader />

      <QuickActions
        @action="handleQuickAction"
        :disabled="isLoading"
      />

      <!-- 历史按钮栏 -->
      <div class="history-button-bar">
        <el-button
          @click="showHistory = !showHistory"
          :type="showHistory ? 'primary' : 'default'"
          size="small"
          plain
        >
          {{ showHistory ? '👈 隐藏历史' : `📋 历史 (${conversations.length})` }}
        </el-button>
        <span v-if="conversationId" class="conversation-badge">
          ✓ 对话 ID: {{ conversationId.substring(0, 8) }}...
        </span>
      </div>

      <AIMessagePanel
        ref="messagePanelRef"
        :messages="messages"
        @scroll-to-bottom="onScrollToBottom"
        @refresh-message="handleRefreshMessage"
      />

      <AIChatInput
        ref="chatInputRef"
        :is-loading="isLoading"
        :suggested-questions="suggestedQuestions"
        @send-message="handleSendMessage"
        @select-question="selectQuestion"
        @context-toggle="handleContextToggle"
      />

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        :closable="true"
        @close="errorMessage = null"
        class="error-alert"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AssistantHeader from './AssistantHeader.vue'
import QuickActions from './QuickActions.vue'
import AIMessagePanel from './AIMessagePanel.vue'
import AIChatInput from './AIChatInput.vue'
import * as aiHistoryApi from '@/api/ai-history'

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
  postContent: {
    type: String,
    default: '',
  },
})

const messagePanelRef = ref(null)
const chatInputRef = ref(null)

const messages = ref([])
const isLoading = ref(false)
const errorMessage = ref(null)
const conversationId = ref('')
const suggestedQuestions = ref([
  '这个内容的核心观点是什么？',
  '能否举个例子说明？',
  '如何在实践中应用？',
])
const useArticleContext = ref(true)
let messageBuffer = ''

// ================ 历史对话相关状态 ================
const conversations = ref([])          // 历史对话列表
const showHistory = ref(false)          // 是否显示历史面板
const isLoadingHistory = ref(false)     // 是否正在加载历史
const selectedHistoryId = ref(null)     // 当前选中的历史对话 ID

const getCurrentUserId = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.id || user.userId || 'anonymous'
    }
  } catch (e) {
    console.error('[AI Assistant] Failed to parse user from localStorage:', e)
  }
  return 'anonymous'
}

const addMessage = (role, content, loading = false) => {
  const id = `msg-${Date.now()}-${Math.random()}`
  messages.value.push({
    id,
    role,
    content,
    timestamp: new Date().toISOString(),
    loading,
  })
  nextTick(() => {
    messagePanelRef.value?.scrollToBottom()
  })
  return id
}

const updateMessage = (id, updates) => {
  const msg = messages.value.find(m => m.id === id)
  if (msg) {
    Object.assign(msg, updates)
  }
}

const handleQuickAction = (actionId) => {
  if (actionId === 'analyze') {
    handleAIAnalysis()
  } else if (actionId === 'chat') {
    handleAIChat()
  }
}

const handleAIAnalysis = async () => {
  if (!props.postContent) {
    errorMessage.value = '文章内容为空'
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
    const res = await fetch(`${backendUrl}/api/ai/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: props.postContent,
        postId: String(props.postId),
      }),
    })

    const data = await res.json()
    if (res.ok && data?.data?.summary) {
      addMessage('assistant', data.data.summary)
    } else {
      throw new Error(data?.error || 'AI 解读失败')
    }
  } catch (error) {
    console.error('[AI Assistant] Summary error:', error)
    errorMessage.value = 'AI 解读失败，请重试'
    ElMessage.error('AI 解读失败')
  } finally {
    isLoading.value = false
  }
}

const handleAIChat = () => {
  isLoading.value = false
  errorMessage.value = null
  conversationId.value = ''
  messages.value = []
  messageBuffer = ''

  const welcomeMsg = `欢迎使用 AI 对话功能！

我可以帮助你：
1. 回答关于本文的问题
2. 提供代码示例和最佳实践
3. 讨论相关的安全知识

请在下方输入你的问题开始对话。`
  addMessage('assistant', welcomeMsg)
  chatInputRef.value?.focus()
  ElMessage.success('AI 对话已开启')
}

const handleSendMessage = async (messageText) => {
  if (!messageText.trim()) {
    errorMessage.value = '请输入问题'
    return
  }

  if (!props.postContent) {
    errorMessage.value = '文章内容为空，无法启动对话'
    return
  }

  if (!props.postId) {
    errorMessage.value = '文章 ID 丢失'
    console.error('[AI Assistant] Missing postId:', props.postId)
    return
  }

  addMessage('user', messageText)

  isLoading.value = true
  errorMessage.value = null
  messageBuffer = ''

  const aiMessageId = addMessage('assistant', '', true)

  let eventSource = null

  try {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
    const url = new URL('/api/ai/chat/stream', backendUrl)

    const params = {
      message: messageText,
      articleContent: props.postContent,
      postId: String(props.postId),
      workflow: 'chat',
    }

    if (conversationId.value) {
      params.conversationId = conversationId.value
    }

    let token = localStorage.getItem('authToken')
    if (!token) {
      token = 'dev-token-for-testing'
      console.warn('[AI Assistant] No authToken found, using development token')
    }
    params.token = token
    params.userId = getCurrentUserId()

    Object.keys(params).forEach((key) => {
      const value = params[key]
      if (value != null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })

    eventSource = new EventSource(url)
    let hasReceivedData = false

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        hasReceivedData = true

        if (data.type === 'chunk') {
          const chunk = data.content || data.answer || ''
          messageBuffer += chunk
          updateMessage(aiMessageId, {
            content: messageBuffer,
            loading: false,
          })
        } else if (data.type === 'end') {
          const newConversationId = data.conversationId || data.conversation_id
          if (newConversationId && newConversationId !== conversationId.value) {
            conversationId.value = newConversationId
          }
          updateMessage(aiMessageId, { loading: false })
          if (eventSource) {
            eventSource.close()
          }
          isLoading.value = false
          ElMessage.success('AI 回复完成')

          // ✅ 保存消息到历史
          if (conversationId.value && messageBuffer) {
            saveMessageToHistory(messageText, messageBuffer)
          }
        }
      } catch (e) {
        console.error('[AI Assistant] Error parsing stream data:', e)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[AI Assistant] Stream error:', {
        error,
        readyState: eventSource?.readyState,
        hasReceivedData,
        messageBufferSample: messageBuffer.substring(0, 50),
        conversationId: conversationId.value,
        url: url.toString(),
      })

      let errorMsg = '对话出错'
      if (eventSource?.readyState === EventSource.CLOSED) {
        errorMsg = '连接被关闭'
      } else if (!hasReceivedData) {
        errorMsg = '无法连接到服务器'
      }

      if (hasReceivedData && messageBuffer) {
        updateMessage(aiMessageId, { loading: false })
      } else {
        updateMessage(aiMessageId, {
          content: messageBuffer || errorMsg,
          loading: false,
        })
        errorMessage.value = `${errorMsg}，请重试`
      }

      if (eventSource) {
        eventSource.close()
      }
      isLoading.value = false
    }
  } catch (error) {
    console.error('[AI Assistant] Send message error:', error)
    updateMessage(aiMessageId, {
      content: '消息发送失败，请重试',
      loading: false,
    })
    errorMessage.value = `消息发送失败: ${error.message || '未知错误'}`
    isLoading.value = false
    if (eventSource) {
      eventSource.close()
    }
  }
}

const selectQuestion = (question) => {
  chatInputRef.value?.focus()
  handleSendMessage(question)
}

const handleRefreshMessage = async (message) => {
  if (message.role !== 'assistant') return

  errorMessage.value = null

  const msgIndex = messages.value.findIndex(m => m.id === message.id)
  if (msgIndex >= 0) {
    messages.value[msgIndex] = {
      ...messages.value[msgIndex],
      loading: true,
      content: '重新生成中...',
    }
  }

  try {
    const userMessages = messages.value.filter(m => m.role === 'user')
    const lastUserMessage = userMessages[userMessages.length - 1]

    if (!lastUserMessage) {
      throw new Error('找不到用户消息')
    }

    await handleSendMessage(lastUserMessage.content)
  } catch (error) {
    console.error('Refresh message error:', error)
    errorMessage.value = '重新生成失败，请重试'
    ElMessage.error('重新生成失败')

    if (msgIndex >= 0) {
      messages.value[msgIndex] = {
        ...message,
        loading: false,
      }
    }
  }
}

const onScrollToBottom = () => {
  messagePanelRef.value?.scrollToBottom()
}

const handleContextToggle = (value) => {
  useArticleContext.value = value
  console.log(`[AI Assistant] Context mode: ${value ? '结合博文' : '自由对话'}`)
}

// ================ 历史对话管理函数 ================

/**
 * 加载对话历史列表
 */
const loadConversationHistory = async () => {
  try {
    isLoadingHistory.value = true
    const response = await aiHistoryApi.getConversations({
      postId: props.postId
    })

    if (response.code === 200) {
      conversations.value = response.data || []
      console.log(`[AI Assistant] 加载了 ${conversations.value.length} 个历史对话`)
    }
  } catch (error) {
    console.error('[AI Assistant] 加载历史失败:', error)
    ElMessage.error('加载对话历史失败')
  } finally {
    isLoadingHistory.value = false
  }
}

/**
 * 加载历史对话的所有消息
 */
const loadHistoryMessages = async (convId) => {
  try {
    const response = await aiHistoryApi.getConversationMessages(convId)

    if (response.code === 200) {
      // 清空当前消息，加载历史消息
      messages.value = []
      conversationId.value = convId
      selectedHistoryId.value = convId

      // 显示历史消息
      const msgs = response.data || []
      msgs.forEach(msg => {
        addMessage(msg.role, msg.content)
      })

      // 隐藏历史面板
      showHistory.value = false
      ElMessage.success(`已加载对话（${msgs.length} 条消息）`)
      console.log(`[AI Assistant] 加载历史对话: ${convId}, 消息数: ${msgs.length}`)
    }
  } catch (error) {
    console.error('[AI Assistant] 加载对话失败:', error)
    ElMessage.error('加载对话失败')
  }
}

/**
 * 保存消息到历史
 */
const saveMessageToHistory = async (userMessage, assistantMessage) => {
  try {
    if (!conversationId.value) {
      console.warn('[AI Assistant] conversationId 为空，无法保存消息')
      return
    }

    console.log('[AI Assistant] 开始保存消息到历史', {
      conversationId: conversationId.value,
      userMessageLength: userMessage.length,
      assistantMessageLength: assistantMessage.length,
    })

    // 保存用户消息
    try {
      await aiHistoryApi.saveMessage(
        conversationId.value,
        'user',
        userMessage,
        props.postId
      )
      console.log('[AI Assistant] 用户消息已保存')
    } catch (userError) {
      console.error('[AI Assistant] 保存用户消息失败:', userError)
      throw userError
    }

    // 保存 AI 回复
    try {
      await aiHistoryApi.saveMessage(
        conversationId.value,
        'assistant',
        assistantMessage,
        props.postId
      )
      console.log('[AI Assistant] AI 回复已保存')
    } catch (assistantError) {
      console.error('[AI Assistant] 保存 AI 回复失败:', assistantError)
      throw assistantError
    }

    console.log('[AI Assistant] 消息已保存到历史')

    // 刷新历史列表
    await loadConversationHistory()
  } catch (error) {
    console.error('[AI Assistant] 保存消息失败:', error)
    ElMessage.error(`保存对话失败: ${error.message || '未知错误'}`)
  }
}

/**
 * 删除单个对话
 */
const handleDeleteConversation = async (convId) => {
  try {
    if (!confirm('确定要删除这个对话吗？')) return

    await aiHistoryApi.deleteConversation(convId)
    conversations.value = conversations.value.filter(c => c.id !== convId)
    ElMessage.success('对话已删除')

    // 如果删除的是当前对话，清空
    if (selectedHistoryId.value === convId) {
      conversationId.value = ''
      messages.value = []
      selectedHistoryId.value = null
    }

    console.log('[AI Assistant] 对话已删除:', convId)
  } catch (error) {
    console.error('[AI Assistant] 删除对话失败:', error)
    ElMessage.error('删除对话失败')
  }
}

/**
 * 清空所有对话
 */
const handleClearAllConversations = async () => {
  try {
    if (!confirm('确定要清空所有对话历史吗？此操作不可恢复！')) return

    for (const conv of conversations.value) {
      await aiHistoryApi.deleteConversation(conv.id)
    }

    conversations.value = []
    messages.value = []
    conversationId.value = ''
    selectedHistoryId.value = null
    ElMessage.success('已清空所有对话历史')
    console.log('[AI Assistant] 所有对话已清空')
  } catch (error) {
    console.error('[AI Assistant] 清空对话失败:', error)
    ElMessage.error('清空对话失败')
  }
}

/**
 * 组件挂载时加载历史
 */
onMounted(() => {
  loadConversationHistory()
  console.log('[AI Assistant] 组件已挂载，加载对话历史')
})

defineExpose({
  addMessage,
  updateMessage,
})
</script>

<style scoped lang="scss">
.ai-assistant-panel {
  display: flex;
  height: 900px;
  max-height: 900px;
  background: #1f1f2f;
  border: 1px solid #3d3d4d;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

// 历史对话侧边栏
.history-sidebar {
  position: absolute;
  left: 0;
  top: 0;
  width: 300px;
  height: 100%;
  background: linear-gradient(135deg, #2d2d3d 0%, #25252f 100%);
  border-right: 2px solid #3d3d4d;
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.3);

  .history-header {
    padding: 16px;
    border-bottom: 2px solid #3d3d4d;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 3px;

      &:hover {
        background: #777;
      }
    }
  }

  .history-item {
    display: flex;
    gap: 8px;
    padding: 12px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: #4a90e2;
    }

    &.active {
      background: rgba(74, 144, 226, 0.2);
      border-color: #4a90e2;
    }

    .history-item-content {
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .history-title {
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .history-meta {
      font-size: 12px;
      color: #aaa;
      margin-bottom: 4px;
    }

    .history-time {
      font-size: 11px;
      color: #888;
    }

    .delete-btn {
      flex-shrink: 0;
    }
  }

  .history-loading,
  .history-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
    font-size: 13px;
    text-align: center;
    padding: 20px;
  }

  .history-empty {
    flex-direction: column;
    line-height: 1.6;
  }
}

// 主面板
.main-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  overflow: hidden;
}

// 历史按钮栏
.history-button-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid #3d3d4d;
  flex-shrink: 0;

  .conversation-badge {
    font-size: 12px;
    color: #4a90e2;
    padding: 4px 8px;
    background: rgba(74, 144, 226, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(74, 144, 226, 0.3);
  }
}

// 错误提示
.error-alert {
  margin-top: auto;
  flex-shrink: 0;
}
</style>

