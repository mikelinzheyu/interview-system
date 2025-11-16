<template>
  <div class="ai-assistant-panel">
    <!-- Phase 1: 头部区域 (新增) -->
    <AssistantHeader />

    <!-- Phase 1: 快捷功能区域 (新增) -->
    <QuickActions
      @action="handleQuickAction"
      :disabled="isLoading"
    />

    <!-- 消息展示面板 -->
    <AIMessagePanel
      ref="messagePanelRef"
      :messages="messages"
      @scroll-to-bottom="onScrollToBottom"
      @refresh-message="handleRefreshMessage"
    />

    <!-- 聊天输入区 -->
    <AIChatInput
      ref="chatInputRef"
      :is-loading="isLoading"
      :suggested-questions="suggestedQuestions"
      @send-message="handleSendMessage"
      @select-question="selectQuestion"
      @context-toggle="handleContextToggle"
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      :closable="true"
      @close="errorMessage = null"
      class="error-alert"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import AssistantHeader from './AssistantHeader.vue'
import QuickActions from './QuickActions.vue'
import SidebarCard from './SidebarCard.vue'
import AIMessagePanel from './AIMessagePanel.vue'
import AIChatInput from './AIChatInput.vue'
import * as aiApi from '@/api/ai'

// Props
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

// Refs
const messagePanelRef = ref(null)
const chatInputRef = ref(null)

// State
const messages = ref([])
const isLoading = ref(false)
const errorMessage = ref(null)
const conversationId = ref('')
const suggestedQuestions = ref([
  '这个内容的核心观点是什么？',
  '能否举个例子说明？',
  '如何在实践中应用？',
])
// Phase 3: 上下文模式状态
const useArticleContext = ref(true)
let messageBuffer = '' // 用于流式拼接消息

// 添加消息到列表
const addMessage = (role, content, loading = false) => {
  const id = `msg-${Date.now()}-${Math.random()}`
  messages.value.push({
    id,
    role,
    content,
    timestamp: new Date().toISOString(),
    loading,
  })
  return id
}

// 更新消息
const updateMessage = (id, updates) => {
  const msg = messages.value.find(m => m.id === id)
  if (msg) {
    Object.assign(msg, updates)
  }
}

// Phase 1: 快捷操作处理 (新增)
const handleQuickAction = (actionId) => {
  if (actionId === 'analyze') {
    handleAIAnalysis()
  } else if (actionId === 'chat') {
    handleAIChat()
  }
}

// AI 解读
const handleAIAnalysis = async () => {
  if (!props.postContent) {
    errorMessage.value = '文章内容为空'
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const response = await aiApi.generateArticleSummary({
      content: props.postContent,
      postId: props.postId,
    })

    if (response.code === 200 && response.data?.summary) {
      addMessage('assistant', response.data.summary)
      ElMessage.success('AI 解读完成')
    } else {
      throw new Error(response.message || '获取摘要失败')
    }
  } catch (error) {
    errorMessage.value = 'AI 解读失败，请重试'
    console.error('AI analysis error:', error)
    ElMessage.error('AI 解读失败')
  } finally {
    isLoading.value = false
  }
}

// 启动 AI 对话
const handleAIChat = () => {
  isLoading.value = false
  errorMessage.value = null
  conversationId.value = ''
  messages.value = []
  messageBuffer = ''

  const welcomeMsg = `欢迎使用 AI 对话功能！\n\n我可以帮助你：\n1. 回答关于本文的问题\n2. 提供代码示例和最佳实践\n3. 讨论相关的安全知识\n\n请在下方输入你的问题开始对话。`
  addMessage('assistant', welcomeMsg)

  // 聚焦输入框
  chatInputRef.value?.focus()

  ElMessage.success('AI 对话已开启')
}

// 发送消息 - 支持多轮对话
const handleSendMessage = async (messageText) => {
  if (!messageText.trim() || !props.postContent) {
    return
  }

  // 添加用户消息
  addMessage('user', messageText)

  isLoading.value = true
  errorMessage.value = null
  messageBuffer = ''

  // 添加 AI 加载指示器
  const aiMessageId = addMessage('assistant', '', true)

  let eventSource = null

  try {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
    const url = new URL('/api/ai/chat/stream', backendUrl)

    const params = {
      message: messageText,
      articleContent: props.postContent,
      postId: props.postId,
      workflow: 'chat',
    }

    // 🔴 关键：在第二次及以后的对话中，必须传递 conversationId 以继续对话
    if (conversationId.value) {
      params.conversationId = conversationId.value
      console.log('[AI Assistant] 📌 继续多轮对话，conversationId:', conversationId.value)
    } else {
      console.log('[AI Assistant] 📌 开始新的对话')
    }

    // 添加认证令牌 (EventSource 不支持自定义 header，所以必须用查询参数)
    // 如果没有登录令牌，在开发环境中使用默认令牌
    let token = localStorage.getItem('authToken')
    if (!token) {
      // 开发环境: 使用默认令牌，允许测试 AI 功能而无需登录
      token = 'dev-token-for-testing'
      console.warn('[AI Assistant] No authToken found, using development token')
    }
    params.token = token

    Object.keys(params).forEach(key =>
      url.searchParams.append(key, params[key])
    )

    console.log('[AI Assistant] Connecting to stream:', url.toString())

    // 创建新的 EventSource 连接
    eventSource = new EventSource(url)
    let hasReceivedData = false

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        hasReceivedData = true

        if (data.type === 'chunk') {
          const chunk = data.content || data.answer || ''
          messageBuffer += chunk
          // 实时更新消息（去掉加载状态）
          updateMessage(aiMessageId, {
            content: messageBuffer,
            loading: false,
          })
        } else if (data.type === 'end') {
          // 流结束 - 保存 conversationId 用于多轮对话
          const newConversationId = data.conversationId || data.conversation_id
          if (newConversationId && newConversationId !== conversationId.value) {
            conversationId.value = newConversationId
            console.log('[AI Assistant] ✅ conversationId 已保存:', conversationId.value)
          }
          updateMessage(aiMessageId, {
            loading: false,
          })
          if (eventSource) {
            eventSource.close()
          }
          isLoading.value = false
          ElMessage.success('AI 回复完成')
        }
      } catch (e) {
        console.error('[AI Assistant] Error parsing stream data:', e)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[AI Assistant] ❌ Stream error:', {
        error: error,
        readyState: eventSource?.readyState,
        hasReceivedData: hasReceivedData,
        messageBuffer: messageBuffer.substring(0, 50) + '...',
        conversationId: conversationId.value,
      })

      // 检查是否收到了数据但在流结束前发生错误
      if (hasReceivedData && messageBuffer) {
        console.log('[AI Assistant] ℹ️ 虽然有错误但已收到部分数据，保持消息')
        updateMessage(aiMessageId, {
          loading: false,
        })
        // 如果有消息内容，不显示错误
      } else {
        // 只有在没有收到任何数据时才显示错误
        updateMessage(aiMessageId, {
          content: messageBuffer || '对话出错，请重试',
          loading: false,
        })
        errorMessage.value = '对话出错，请重试'
      }

      if (eventSource) {
        eventSource.close()
      }
      isLoading.value = false
    }
  } catch (error) {
    console.error('Send message error:', error)
    updateMessage(aiMessageId, {
      content: '消息发送失败，请重试',
      loading: false,
    })
    errorMessage.value = '消息发送失败'
    isLoading.value = false
    if (eventSource) {
      eventSource.close()
    }
  }
}

// 选择建议问题
const selectQuestion = (question) => {
  chatInputRef.value?.focus()
  handleSendMessage(question)
}

// 刷新消息 - 重新生成AI回复
const handleRefreshMessage = async (message) => {
  if (message.role !== 'assistant') {
    return
  }

  errorMessage.value = null

  // 标记消息为加载中
  const msgIndex = messages.value.findIndex(m => m.id === message.id)
  if (msgIndex >= 0) {
    messages.value[msgIndex] = {
      ...messages.value[msgIndex],
      loading: true,
      content: '重新生成中...',
    }
  }

  try {
    // 获取用户的最后一条消息作为重新生成的参考
    const userMessages = messages.value.filter(m => m.role === 'user')
    const lastUserMessage = userMessages[userMessages.length - 1]

    if (!lastUserMessage) {
      throw new Error('找不到用户消息')
    }

    // 重新发送请求
    await handleSendMessage(lastUserMessage.content)
  } catch (error) {
    console.error('Refresh message error:', error)
    errorMessage.value = '重新生成失败，请重试'
    ElMessage.error('重新生成失败')

    // 恢复原消息
    if (msgIndex >= 0) {
      messages.value[msgIndex] = {
        ...message,
        loading: false,
      }
    }
  }
}

// 滚动到底部
const onScrollToBottom = () => {
  messagePanelRef.value?.scrollToBottom()
}

// Phase 3: 处理上下文切换
const handleContextToggle = (value) => {
  useArticleContext.value = value
  console.log(`[AI Assistant] Context mode: ${value ? '结合博文' : '自由对话'}`)
}

// 暴露给父组件
defineExpose({
  addMessage,
  updateMessage,
})
</script>

<style scoped lang="scss">
// 主容器 - Phase 1: 新架构 - 固定高度
.ai-assistant-panel {
  display: flex;
  flex-direction: column;
  height: 900px;  // ✅ 增加至 900px（增加 220px）
  max-height: 900px;  // ✅ 防止超出
  background: #1f1f2f;
  border: 1px solid #3d3d4d;
  border-radius: 8px;
  overflow: hidden;  // ✅ 确保内容不溢出

  // 子组件自动填充可用空间的合理分配
  > :nth-child(1) {
    // AssistantHeader - 固定高度
    flex-shrink: 0;
  }

  > :nth-child(2) {
    // QuickActions - 固定高度
    flex-shrink: 0;
  }

  > :nth-child(3) {
    // AIMessagePanel - 可伸缩主体区域
    flex: 1;
    overflow: hidden;  // ✅ 确保不溢出
  }

  > :nth-child(4) {
    // AIChatInput - 固定高度输入区
    flex-shrink: 0;
  }

  > :nth-child(5) {
    // 错误提示 - 固定高度
    flex-shrink: 0;
  }
}

// 错误提示样式
.error-alert {
  margin: 12px;
  flex-shrink: 0;

  :deep(.el-alert__title) {
    font-size: 13px;
  }
}
</style>
