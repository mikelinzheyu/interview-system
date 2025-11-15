<template>
  <SidebarCard class="ai-assistant-card">
    <!-- 卡片头部 -->
    <template #header>
      <div class="ai-header-custom">
        <span class="ai-title">
          <el-icon class="ai-icon"><CirclePlus /></el-icon>
          AI 助手
        </span>
        <!-- 对话计数器 -->
        <span class="message-count">{{ messages.length }} 条对话</span>
      </div>
    </template>

    <!-- AI 辅助功能区 -->
    <div class="ai-reading-section">
      <div class="section-title">
        <span>AI 辅助阅读</span>
        <el-icon class="title-icon"><Right /></el-icon>
      </div>

      <!-- 功能按钮 -->
      <div class="feature-buttons">
        <button class="feature-btn" @click="handleAIAnalysis" :disabled="isLoading">
          <span class="btn-text">AI 解读 - 创析摘文结构及重点</span>
          <el-icon class="btn-icon"><Right /></el-icon>
        </button>

        <button class="feature-btn" @click="handleAIChat" :disabled="isLoading">
          <span class="btn-text">AI 对话 - 阅读助手及对话引导</span>
          <el-icon class="btn-icon"><Right /></el-icon>
        </button>
      </div>
    </div>

    <!-- 消息展示面板 -->
    <AIMessagePanel
      ref="messagePanelRef"
      :messages="messages"
      @scroll-to-bottom="onScrollToBottom"
    />

    <!-- 聊天输入区 -->
    <AIChatInput
      ref="chatInputRef"
      :is-loading="isLoading"
      :suggested-questions="suggestedQuestions"
      @send-message="handleSendMessage"
      @select-question="selectQuestion"
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
  </SidebarCard>
</template>

<script setup>
import { ref, defineProps, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CirclePlus,
  Right,
} from '@element-plus/icons-vue'
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

// 发送消息
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

  try {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
    const url = new URL('/api/ai/chat/stream', backendUrl)

    const params = {
      message: messageText,
      articleContent: props.postContent,
      postId: props.postId,
      workflow: 'chat',
    }

    if (conversationId.value) {
      params.conversationId = conversationId.value
    }

    Object.keys(params).forEach(key =>
      url.searchParams.append(key, params[key])
    )

    console.log('[AI Assistant] Connecting to stream:', url.toString())

    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'chunk') {
          const chunk = data.content || data.answer || ''
          messageBuffer += chunk
          // 实时更新消息（去掉加载状态）
          updateMessage(aiMessageId, {
            content: messageBuffer,
            loading: false,
          })
        } else if (data.type === 'end') {
          // 流结束
          conversationId.value = data.conversationId || data.conversation_id
          updateMessage(aiMessageId, {
            loading: false,
          })
          eventSource.close()
          isLoading.value = false
          ElMessage.success('AI 回复完成')
        }
      } catch (e) {
        console.error('[AI Assistant] Error parsing stream data:', e)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[AI Assistant] Stream error:', error)
      updateMessage(aiMessageId, {
        content: messageBuffer || '对话出错，请重试',
        loading: false,
      })
      errorMessage.value = '对话出错，请重试'
      eventSource.close()
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
  }
}

// 选择建议问题
const selectQuestion = (question) => {
  chatInputRef.value?.focus()
  handleSendMessage(question)
}

// 滚动到底部
const onScrollToBottom = () => {
  messagePanelRef.value?.scrollToBottom()
}

// 暴露给父组件
defineExpose({
  addMessage,
  updateMessage,
})
</script>

<style scoped lang="scss">
.ai-assistant-card {
  display: flex;
  flex-direction: column;
  height: 100%;

  :deep(.sidebar-card) {
    background: #2d2d3d !important;
    border-color: #3d3d4d !important;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  :deep(.sidebar-card-header) {
    background: #242434 !important;
    border-bottom-color: #3d3d4d !important;
    flex-shrink: 0;
  }

  :deep(.sidebar-card-body) {
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }
}

// 卡片头部
.ai-header-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;

  .ai-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #e0e0e0;

    .ai-icon {
      font-size: 20px;
      color: #667eea;
    }
  }

  .message-count {
    font-size: 12px;
    color: #888;
    background: rgba(102, 126, 234, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
  }
}

// AI 辅助阅读区
.ai-reading-section {
  padding: 16px;
  border-bottom: 1px solid #3d3d4d;
  flex-shrink: 0;

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #e0e0e0;

    .title-icon {
      font-size: 16px;
      color: #666;
    }
  }

  .feature-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .feature-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: 1px solid #3d3d4d;
    border-radius: 6px;
    color: #e0e0e0;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;

    &:hover:not(:disabled) {
      background: rgba(102, 126, 234, 0.1);
      border-color: #667eea;
      color: #667eea;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-text {
      flex: 1;
      text-align: left;
    }

    .btn-icon {
      flex-shrink: 0;
      margin-left: 8px;
      font-size: 14px;
      color: #666;
    }
  }
}

// 错误提示
.error-alert {
  margin: 12px;
  flex-shrink: 0;

  :deep(.el-alert__title) {
    font-size: 13px;
  }
}
</style>
