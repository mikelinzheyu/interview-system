<template>
  <div class="chat-feature">
    <!-- 消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :class="['message', msg.role]"
      >
        <div class="message-avatar">
          {{ msg.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message-content">
          <p>{{ msg.text }}</p>
          <span v-if="msg.time" class="message-time">{{ msg.time }}</span>
        </div>
      </div>

      <!-- 流式响应的打字机效果 -->
      <div v-if="isStreaming" class="message ai">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <p class="streaming-text">{{ streamingText }}<span class="cursor">▌</span></p>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="messages.length === 0 && !isStreaming" class="empty-state">
        <el-empty description="向 AI 提问关于本文的任何内容"></el-empty>
      </div>

      <!-- 加载动画 -->
      <div v-if="isConnecting" class="connecting-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>连接中...</span>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="chat-input-area">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="2"
        placeholder="就本文内容向 AI 提问... (Ctrl+Enter 发送)"
        @keydown.ctrl.enter="handleSendMessage"
        :disabled="isStreaming || isConnecting"
        @keydown.enter.prevent
      />
      <el-button
        class="floating-send"
        circle
        type="primary"
        :disabled="!inputMessage.trim() || isStreaming || isConnecting"
        @click="handleSendMessage"
        aria-label="发送"
      >
        <el-icon><Promotion /></el-icon>
      </el-button>
      <div class="input-actions">
        <span class="char-count">{{ inputMessage.length }}/500</span>
        <el-button
          type="primary"
          :loading="isStreaming || isConnecting"
          @click="handleSendMessage"
          :disabled="!inputMessage.trim() || isStreaming || isConnecting"
        >
          {{ isStreaming ? '思考中...' : isConnecting ? '连接中...' : '发送' }}
        </el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="true"
      @close="error = null"
      class="error-alert"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, nextTick, computed, onUnmounted, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Promotion } from '@element-plus/icons-vue'

const props = defineProps({
  articleContent: {
    type: String,
    required: true,
  },
  postId: {
    type: [String, Number],
    required: true,
  },
})

const messages = ref([]) // 历史消息
const inputMessage = ref('')
const isStreaming = ref(false)
const isConnecting = ref(false)
const streamingText = ref('')
const conversationId = ref('') // 用于多轮对话
const error = ref(null)
const messagesContainer = ref(null)
let eventSource = null

// 逐字输出相关变量 - 改进版本
const typeoutQueue = ref('') // 等待输出的文本队列
const displaySpeed = ref(50) // 改进到50ms，显示更流畅
let typeoutTimer = null
let isProcessing = ref(false) // 标志是否正在处理
let streamComplete = ref(false) // 流式接收是否已完成

/**
 * 改进的逐字输出效果处理函数 - 使用async/await确保正确的执行顺序
 * 解决之前setTimeout递归导致的状态混乱问题
 */
const processTypeout = async () => {
  // 持续处理队列中的字符，直到队列为空
  while (typeoutQueue.value.length > 0) {
    const char = typeoutQueue.value.charAt(0)
    typeoutQueue.value = typeoutQueue.value.substring(1)

    // 将字符添加到显示文本
    streamingText.value += char

    console.log(`[Typeout] 显示字符: "${char}" | 队列剩余: ${typeoutQueue.value.length} | 总输出: ${streamingText.value.length}`)

    // 等待指定时间，使用Promise确保顺序执行
    await new Promise(resolve => {
      typeoutTimer = setTimeout(resolve, displaySpeed.value)
    })

    // 自动滚动到最新内容
    await nextTick()
    scrollToBottom()
  }

  // 处理队列为空的情况
  typeoutTimer = null

  if (streamComplete.value) {
    // 流式接收已完成，输出完全完成
    isProcessing.value = false
    console.log('[Typeout] ✅ 逐字输出完成 - 流已关闭')
    await nextTick()
    scrollToBottom()
  } else {
    // 流式接收还在进行，暂停输出等待新数据
    isProcessing.value = false
    console.log('[Typeout] ⏸️  逐字输出暂停 - 等待新数据...')
  }
}

/**
 * 将文本添加到逐字输出队列
 */
const addToTypeoutQueue = (text) => {
  if (!text) return

  console.log(`[Typeout] 📝 添加到队列: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" (长度: ${text.length})`)
  typeoutQueue.value += text

  // 如果没有正在进行的输出，启动输出过程
  if (!isProcessing.value) {
    console.log('[Typeout] 🚀 启动逐字输出过程')
    isProcessing.value = true
    processTypeout()
  } else {
    console.log(`[Typeout] ⏳ 继续排队处理... (队列长度: ${typeoutQueue.value.length})`)
  }
}

// 格式化时间
const formatTime = () => {
  return new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 字符数限制
const messageCharLimit = computed(() => inputMessage.value.length <= 500)

/**
 * 加载对话历史（如果有之前的conversationId）
 */
const loadConversationHistory = async () => {
  // 如果没有 conversationId 或在初始化阶段，不加载
  if (!conversationId.value || conversationId.value.startsWith('pending')) {
    console.log('[ChatFeature] 跳过加载对话历史（无有效ID）')
    return
  }

  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    const url = `${baseURL}/ai/chat/${conversationId.value}?postId=${props.postId}`

    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      if (data && data.length > 0) {
        // 加载历史消息
        messages.value = data.map(msg => ({
          role: msg.role,
          text: msg.content,
          time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('zh-CN') : formatTime(),
        }))
        console.log(`[ChatFeature] 已加载 ${messages.value.length} 条历史消息`)
        nextTick(() => scrollToBottom())
      } else {
        console.log('[ChatFeature] 对话历史为空')
      }
    }
  } catch (err) {
    console.warn('[ChatFeature] 加载对话历史失败:', err)
    // 不影响正常使用
  }
}

/**
 * 组件挂载时加载历史
 */
onMounted(() => {
  loadConversationHistory()
})

/**
 * 发送消息并处理流式响应
 */
const handleSendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message) {
    ElMessage.warning('请输入问题')
    return
  }

  if (!messageCharLimit.value) {
    ElMessage.warning('问题长度不能超过 500 字符')
    return
  }

  if (!props.articleContent) {
    ElMessage.warning('文章内容为空')
    return
  }

  // 清空输入框
  inputMessage.value = ''

  // 添加用户消息到历史
  messages.value.push({
    role: 'user',
    text: message,
    time: formatTime(),
  })

  isStreaming.value = true
  isConnecting.value = true
  streamingText.value = ''
  typeoutQueue.value = ''
  error.value = null

  await nextTick()
  scrollToBottom()

  try {
    // 构建 URL 和查询参数
    const params = new URLSearchParams({
      message: message,
      articleContent: props.articleContent,
      conversationId: conversationId.value || '',
      postId: props.postId.toString(),
      workflow: 'chat', // 使用新的 Dify Chat API
    })

    // 获取 API 基础 URL
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    const url = `${baseURL}/ai/chat/stream?${params.toString()}`

    console.log('[ChatFeature] 发送消息 - URL:', url, 'postId:', props.postId, '当前conversationId:', conversationId.value)

    // 创建 EventSource 连接
    eventSource = new EventSource(url)

    // 连接打开
    eventSource.onopen = () => {
      isConnecting.value = false
      console.log('[ChatFeature] EventSource 连接已打开')
    }

    // 处理消息
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[ChatFeature] 收到数据:', data)

        if (data.type === 'chunk') {
          // 流式内容块 - Dify Chat API 格式
          const content = data.content || data.answer || ''
          if (content) {
            console.log(`[ChatFeature] 接收到内容块，长度: ${content.length}`)
            // 使用逐字输出而不是直接追加
            addToTypeoutQueue(content)
          }
        } else if (data.type === 'end') {
          // 对话结束 - 保存对话 ID
          console.log('[ChatFeature] 收到对话结束信号')

          // 标记流式接收已完成（重要：让processTypeout知道流已关闭）
          streamComplete.value = true
          isStreaming.value = false

          if (data.conversationId) {
            const oldConversationId = conversationId.value
            conversationId.value = data.conversationId
            console.log('[ChatFeature] 对话 ID 已保存:', data.conversationId, '(旧ID:', oldConversationId, ')')

            // 加载对话历史以确保显示完整的对话
            if (oldConversationId !== data.conversationId) {
              loadConversationHistory()
            }
          }

          console.log('[ChatFeature] 流式接收已完成，等待逐字输出...')

          // 异步等待逐字输出完成
          ;(async () => {
            // 等待processTypeout完成其工作
            let attempts = 0
            const maxAttempts = 300 // 最多等待30秒 (300 * 100ms)

            while (isProcessing.value && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 100))
              attempts++
            }

            // 逐字输出已完成，保存消息到历史
            if (streamingText.value) {
              console.log('[ChatFeature] 逐字输出完成，保存消息到历史')
              messages.value.push({
                role: 'assistant',
                text: streamingText.value,
                time: formatTime(),
              })
              streamingText.value = ''
              typeoutQueue.value = ''
              streamComplete.value = false // 重置标志以便下次使用
            }

            scrollToBottom()
            console.log('[ChatFeature] 消息已保存到历史')
          })()
        } else if (data.type === 'error') {
          // 错误响应
          error.value = data.error || '发生错误，请重试'
          console.error('[ChatFeature] 错误:', data.error)
        }
      } catch (parseError) {
        console.error('[ChatFeature] 解析错误:', parseError, '原始数据:', event.data)
      }
    }

    // 处理错误事件
    eventSource.addEventListener('error', () => {
      console.error('[ChatFeature] EventSource 连接错误')
      error.value = '连接错误，请重试'
      isStreaming.value = false
      isConnecting.value = false
      // 清理逐字输出计时器
      if (typeoutTimer) {
        clearTimeout(typeoutTimer)
        typeoutTimer = null
      }
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    })

    // 处理完成事件
    eventSource.addEventListener('done', () => {
      console.log('[ChatFeature] 对话完成')
      isStreaming.value = false
      isConnecting.value = false
      // 清理逐字输出计时器
      if (typeoutTimer) {
        clearTimeout(typeoutTimer)
        typeoutTimer = null
      }
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    })

    // 处理 AI 错误
    eventSource.addEventListener('error-message', (event) => {
      try {
        const data = JSON.parse(event.data)
        error.value = data.error || '发生错误，请重试'
        console.error('[ChatFeature] AI 错误:', data.error)
      } catch (e) {
        error.value = '发生错误，请重试'
        console.error('[ChatFeature] 错误事件解析失败:', e)
      }
      isStreaming.value = false
      isConnecting.value = false
      // 清理逐字输出计时器
      if (typeoutTimer) {
        clearTimeout(typeoutTimer)
        typeoutTimer = null
      }
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    })
  } catch (err) {
    error.value = err.message || '发送失败，请重试'
    isStreaming.value = false
    isConnecting.value = false
  }
}

/**
 * 自动滚动到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

/**
 * 清理资源
 */
const cleanup = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  // 清理逐字输出计时器
  if (typeoutTimer) {
    clearTimeout(typeoutTimer)
    typeoutTimer = null
  }
}

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.chat-feature {
  display: flex;
  flex-direction: column;
  height: 700px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 12px;
  position: relative;

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 12px;
    padding-right: 8px;

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

    .message {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      animation: slideIn 0.3s ease;

      &.user {
        justify-content: flex-end;

        .message-content {
          background: #409eff;
          color: white;
          border-radius: 12px 4px 4px 12px;
        }
      }

      &.ai {
        justify-content: flex-start;

        .message-content {
          background: #f0f0f0;
          color: #303133;
          border-radius: 4px 12px 12px 4px;
        }
      }

      .message-avatar {
        font-size: 20px;
        flex-shrink: 0;
        line-height: 1.5;
      }

      .message-content {
        max-width: 75%;
        padding: 8px 12px;
        border-radius: 6px;
        word-wrap: break-word;

        p {
          margin: 0 0 4px 0;
          font-size: 13px;
          line-height: 1.6;

          &:last-child {
            margin-bottom: 0;
          }
        }

        .message-time {
          display: block;
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .streaming-text {
          font-family: 'Monaco', 'Courier New', monospace;
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          letter-spacing: 0.5px;

          .cursor {
            display: inline-block;
            animation: blink 0.8s infinite;
            margin-left: 1px;
            color: #409eff;
            font-weight: bold;
          }
        }
      }
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;

      :deep(.el-empty) {
        --el-empty-padding: 0;
      }
    }

    .connecting-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      color: #909399;
      font-size: 13px;

      .el-icon {
        font-size: 16px;
      }
    }
  }

  .chat-input-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    position: relative;

    :deep(.el-textarea) {
      flex: 1;
    }

    .floating-send {
      position: absolute;
      right: 10px;
      bottom: 52px; /* 悬浮于输入框右下 */
      width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(64,158,255,0.35);
    }

    .input-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .char-count {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .error-alert {
    margin-top: 8px;
  }
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

@keyframes blink {
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}
</style>
