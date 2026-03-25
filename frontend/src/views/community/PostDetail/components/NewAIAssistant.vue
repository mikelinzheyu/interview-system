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
        <div class="history-btn-container">
          <button
            @click="showHistory = !showHistory"
            class="modern-history-btn"
            :class="{ 'is-active': showHistory }"
          >
            <span class="btn-inner">
              <i class="btn-icon">
                <svg v-if="!showHistory" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="20" height="20">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.12-2.12-1.41 1.41L11.21 17l4.16-5.25z"/>
                </svg>
              </i>
              <span class="btn-label">
                {{ showHistory ? '隐藏' : '历史' }}
              </span>
              <span class="btn-count" v-if="conversations.length > 0 && !showHistory">
                {{ conversations.length }}
              </span>
            </span>
            <span class="btn-highlight"></span>
          </button>
        </div>

        <div v-if="conversationId" class="active-conv-badge">
          <span class="badge-pulse"></span>
          <span class="badge-content">
            <span class="badge-label">当前对话</span>
            <span class="badge-id">{{ conversationId.substring(0, 6) }}</span>
          </span>
        </div>
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
import { ref, defineProps, nextTick, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AssistantHeader from './AssistantHeader.vue'
import QuickActions from './QuickActions.vue'
import AIMessagePanel from './AIMessagePanel.vue'
import AIChatInput from './AIChatInput.vue'
import * as aiHistoryApi from '@/api/ai-history'
import { buildApiUrl } from '@/utils/networkConfig'

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
const historyLoaded = ref(false)        // 标记历史是否已加载过（用于懒加载）

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
    const res = await fetch(buildApiUrl('/ai/summary'), {
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
    const url = new URL(buildApiUrl('/ai/chat/stream'), window.location.origin)

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
    // 🔧 修复：找到这条AI消息对应的用户消息
    // 向前查找，找到最近的一条用户消息
    let correspondingUserMessage = null

    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages.value[i].role === 'user') {
        correspondingUserMessage = messages.value[i]
        break
      }
    }

    if (!correspondingUserMessage) {
      throw new Error('找不到对应的用户消息')
    }

    await handleSendMessage(correspondingUserMessage.content)
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
 * 组件挂载时 - 不再急加载历史，改为懒加载
 */
onMounted(() => {
  console.log('[AI Assistant] 组件已挂载，历史对话将在首次打开时加载')
})

/**
 * 监听 showHistory 变化，实现懒加载历史对话
 */
watch(showHistory, async (newVal) => {
  if (newVal && !historyLoaded.value) {
    console.log('[AI Assistant] 首次打开历史面板，开始加载...')
    await loadConversationHistory()
    historyLoaded.value = true
  }
})

defineExpose({
  addMessage,
  updateMessage,
})
</script>

<style scoped lang="scss">
.ai-assistant-panel {
  display: flex;
  height: 1000px;
  max-height: 1000px;
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
  gap: 16px;
  padding: 12px 16px;
  background: linear-gradient(to right,
    rgba(31, 31, 47, 0.8),
    rgba(31, 31, 47, 0.6));
  border-bottom: 1px solid rgba(61, 61, 77, 0.6);
  flex-shrink: 0;
  backdrop-filter: blur(8px);

  .history-btn-container {
    flex: 0 0 auto;
  }

  .modern-history-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0;
    outline: none;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    .btn-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: linear-gradient(135deg,
        rgba(74, 144, 226, 0.1) 0%,
        rgba(74, 144, 226, 0.05) 100%);
      border: 1.5px solid rgba(74, 144, 226, 0.3);
      border-radius: 8px;
      transition: all 0.3s ease;
      position: relative;
      z-index: 2;

      .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: #4a90e2;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

        svg {
          width: 100%;
          height: 100%;
          fill: currentColor;
        }
      }

      .btn-label {
        font-size: 13px;
        font-weight: 600;
        color: #b0c4ff;
        letter-spacing: 0.5px;
        transition: all 0.3s ease;
        text-transform: uppercase;
      }

      .btn-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 6px;
        background: rgba(74, 144, 226, 0.25);
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        color: #e8f0ff;
        animation: float-pulse 2.5s ease-in-out infinite;
      }
    }

    .btn-highlight {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 2px;
      background: linear-gradient(90deg,
        transparent 0%,
        #4a90e2 50%,
        transparent 100%);
      transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 1;
    }

    &:hover {
      .btn-inner {
        background: linear-gradient(135deg,
          rgba(74, 144, 226, 0.2) 0%,
          rgba(74, 144, 226, 0.12) 100%);
        border-color: rgba(74, 144, 226, 0.5);
        box-shadow: 0 4px 16px rgba(74, 144, 226, 0.2),
                    inset 0 1px 2px rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
      }

      .btn-icon {
        transform: scale(1.1) rotate(8deg);
        color: #5a9ff0;
      }

      .btn-label {
        color: #d4e4ff;
      }
    }

    &:active {
      .btn-inner {
        transform: translateY(0);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    &.is-active {
      .btn-inner {
        background: linear-gradient(135deg,
          rgba(45, 156, 219, 0.25) 0%,
          rgba(45, 156, 219, 0.15) 100%);
        border-color: rgba(74, 144, 226, 0.6);
        box-shadow: 0 6px 20px rgba(74, 144, 226, 0.25),
                    inset 0 1px 3px rgba(255, 255, 255, 0.15);
      }

      .btn-icon {
        color: #6ba4ff;
        animation: icon-spin 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .btn-label {
        color: #e8f0ff;
      }

      .btn-highlight {
        width: 32px;
        opacity: 1;
      }
    }
  }

  .active-conv-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: linear-gradient(135deg,
      rgba(39, 174, 96, 0.12) 0%,
      rgba(39, 174, 96, 0.05) 100%);
    border: 1.5px solid rgba(39, 174, 96, 0.4);
    border-radius: 8px;
    animation: fade-in 0.4s ease;

    .badge-pulse {
      position: relative;
      width: 8px;
      height: 8px;
      background: #27ae60;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(39, 174, 96, 0.6);
      animation: pulse-glow 2s ease-in-out infinite;
    }

    .badge-content {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .badge-label {
        font-size: 11px;
        font-weight: 600;
        color: #7bd3a0;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .badge-id {
        font-size: 12px;
        font-weight: 700;
        color: #a0ddb8;
        font-family: 'Courier New', monospace;
        letter-spacing: 1px;
      }
    }

    &:hover {
      background: linear-gradient(135deg,
        rgba(39, 174, 96, 0.18) 0%,
        rgba(39, 174, 96, 0.1) 100%);
      border-color: rgba(39, 174, 96, 0.6);
      box-shadow: 0 4px 12px rgba(39, 174, 96, 0.2);
    }
  }
}

@keyframes float-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.9);
  }
}

@keyframes icon-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(180deg);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(39, 174, 96, 0.6),
                0 0 16px rgba(39, 174, 96, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 12px rgba(39, 174, 96, 0.8),
                0 0 24px rgba(39, 174, 96, 0.5);
    transform: scale(1.2);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 错误提示
.error-alert {
  margin-top: auto;
  flex-shrink: 0;
}
</style>
