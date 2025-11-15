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
          <!-- 用户消息：纯文本 -->
          <p v-if="msg.role === 'user'">{{ msg.text }}</p>

          <!-- AI消息：渲染为HTML（包含Markdown和复制按钮） -->
          <div v-else-if="msg.htmlContent" class="ai-message-html" v-html="msg.htmlContent"></div>
          <p v-else>{{ msg.text }}</p>

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
import { ref, defineProps, nextTick, computed, onUnmounted, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Promotion } from '@element-plus/icons-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

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

// 逐字输出相关变量 - 简化版本
const typeoutQueue = ref('') // 等待输出的文本队列
const displaySpeed = ref(30) // 改到30ms，显示更快
let typeoutTimer = null
let isProcessing = ref(false) // 标志是否正在处理
let streamComplete = ref(false) // 流式接收是否已完成

/**
 * DOMPurify 配置 - 用于安全渲染Markdown
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's',
    'a', 'code', 'pre', 'div',
    'ul', 'ol', 'li',
    'blockquote', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'button', 'span'
  ],
  ALLOWED_ATTR: {
    'a': ['href', 'target', 'rel', 'title'],
    'pre': ['class'],
    'code': ['class'],
    'div': ['class'],
    'button': ['class', 'data-code'],
    'span': ['class']
  },
  ALLOW_DATA_ATTR: false,
  SAFE_FOR_TEMPLATES: true,
  KEEP_CONTENT: true,
}

/**
 * 渲染Markdown为HTML，并为代码块添加复制按钮
 */
const renderMarkdownWithCopyButtons = (content) => {
  try {
    // 1. 转换Markdown为HTML
    let html = marked(content)

    // 2. 使用DOMPurify清理HTML
    let sanitized = DOMPurify.sanitize(html, PURIFY_CONFIG)

    // 3. 为代码块添加复制按钮容器
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = sanitized

    // 查找所有的pre标签
    tempDiv.querySelectorAll('pre').forEach((preElement) => {
      // 创建容器
      const container = document.createElement('div')
      container.className = 'code-block-container'

      // 创建复制按钮
      const copyBtn = document.createElement('button')
      copyBtn.className = 'code-copy-btn'
      copyBtn.textContent = '复制'
      copyBtn.setAttribute('data-code', preElement.textContent)
      copyBtn.type = 'button'

      // 将pre元素移到容器中
      preElement.parentNode.insertBefore(container, preElement)
      container.appendChild(preElement)
      container.appendChild(copyBtn)
    })

    return tempDiv.innerHTML
  } catch (error) {
    console.error('[ChatFeature] Markdown rendering error:', error)
    // 降级方案：仅显示纯文本
    return `<p>${DOMPurify.sanitize(content)}</p>`
  }
}

/**
 * 处理复制按钮点击事件
 */
const setupCopyButtons = (containerElement) => {
  if (!containerElement) return

  const copyBtns = containerElement.querySelectorAll('.code-copy-btn')
  copyBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()

      const codeText = btn.getAttribute('data-code')
      if (!codeText) return

      try {
        await navigator.clipboard.writeText(codeText)

        // 显示反馈
        const originalText = btn.textContent
        btn.textContent = '✓ 已复制!'
        btn.classList.add('copied')

        setTimeout(() => {
          btn.textContent = originalText
          btn.classList.remove('copied')
        }, 2000)
      } catch (err) {
        console.error('[ChatFeature] Copy failed:', err)
        btn.textContent = '❌ 复制失败'
        setTimeout(() => {
          btn.textContent = '复制'
        }, 2000)
      }
    })
  })
}

/**
 * 简化的逐字输出处理 - 直接使用setTimeout而不是async/await
 * 优先保证功能可用，而不是代码完美性
 */
const processTypeout = () => {
  // 如果队列有内容，继续处理
  if (typeoutQueue.value.length > 0) {
    const char = typeoutQueue.value.charAt(0)
    typeoutQueue.value = typeoutQueue.value.substring(1)
    streamingText.value += char

    console.log(`[Typeout] 显示: "${char}" | 队列: ${typeoutQueue.value.length} | 总: ${streamingText.value.length}`)

    // 继续处理下一个字符
    typeoutTimer = setTimeout(() => {
      processTypeout()
    }, displaySpeed.value)

    // 自动滚动
    nextTick(() => scrollToBottom())
  } else if (streamComplete.value && typeoutQueue.value.length === 0) {
    // 流已完成且队列为空，彻底完成
    isProcessing.value = false
    typeoutTimer = null
    console.log('[Typeout] ✅ 逐字输出完成')
  } else if (typeoutQueue.value.length === 0 && !streamComplete.value) {
    // 队列为空但流还在继续，暂停等待
    isProcessing.value = false
    console.log('[Typeout] ⏸️  暂停等待新数据...')
  }
}

/**
 * 将文本添加到逐字输出队列
 */
const addToTypeoutQueue = (text) => {
  if (!text) return

  console.log(`[Typeout] 📝 添加: "${text.substring(0, 30)}..." (长度: ${text.length})`)
  typeoutQueue.value += text

  // 如果没有在处理，启动处理
  if (!isProcessing.value) {
    console.log('[Typeout] 🚀 启动逐字输出')
    isProcessing.value = true
    processTypeout()
  } else {
    console.log(`[Typeout] 继续排队 (队列: ${typeoutQueue.value.length})`)
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
          htmlContent: msg.role === 'assistant' ? renderMarkdownWithCopyButtons(msg.content) : null,
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
 * 监听消息变化，设置复制按钮
 */
watch(messages, (newMessages) => {
  nextTick(() => {
    // 设置所有的复制按钮
    newMessages.forEach((msg, idx) => {
      if (msg.role === 'assistant' && msg.htmlContent) {
        const messageElement = document.querySelector(
          `.message:nth-child(${idx + 1}) .ai-message-html`
        )
        if (messageElement) {
          setupCopyButtons(messageElement)
        }
      }
    })
  })
}, { deep: true })

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
          // 对话结束信号
          console.log('[ChatFeature] 收到对话结束信号')

          // 关键：标记流完成
          streamComplete.value = true
          isStreaming.value = false
          console.log('[ChatFeature] 流式接收已标记为完成')

          if (data.conversationId) {
            conversationId.value = data.conversationId
            console.log('[ChatFeature] 对话ID:', data.conversationId)
          }

          // 使用轮询等待逐字输出完成
          let checkCount = 0
          const maxChecks = 100 // 最多检查100次 (100 * 500ms = 50s)

          const checkCompletion = setInterval(() => {
            checkCount++
            const isQueueEmpty = typeoutQueue.value.length === 0
            const isNotProcessing = !isProcessing.value
            const isNoTimer = !typeoutTimer

            console.log(`[ChatFeature] 检查完成 #${checkCount}: 队列=${isQueueEmpty}, 处理=${!isNotProcessing}, 计时=${!isNoTimer}`)

            if (isQueueEmpty && isNotProcessing && isNoTimer) {
              // 逐字输出已完成
              console.log('[ChatFeature] ✅ 逐字输出完成，保存消息')
              clearInterval(checkCompletion)

              // 保存消息到历史
              if (streamingText.value) {
                messages.value.push({
                  role: 'assistant',
                  text: streamingText.value,
                  htmlContent: renderMarkdownWithCopyButtons(streamingText.value),
                  time: formatTime(),
                })
                console.log('[ChatFeature] 消息已保存到历史')
              }

              // 重置状态
              streamingText.value = ''
              typeoutQueue.value = ''
              streamComplete.value = false

              scrollToBottom()
            } else if (checkCount >= maxChecks) {
              // 超时，强制保存
              console.warn('[ChatFeature] ⚠️ 超时，强制保存消息')
              clearInterval(checkCompletion)

              if (streamingText.value) {
                messages.value.push({
                  role: 'assistant',
                  text: streamingText.value,
                  htmlContent: renderMarkdownWithCopyButtons(streamingText.value),
                  time: formatTime(),
                })
              }

              streamingText.value = ''
              typeoutQueue.value = ''
              streamComplete.value = false

              scrollToBottom()
            }
          }, 500)  // 每500ms检查一次
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

/* AI消息 HTML 内容样式 */
.ai-message-html {
  font-size: 13px;
  line-height: 1.6;

  p {
    margin: 8px 0;
    word-wrap: break-word;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    font-weight: 600;
    color: #000;
  }

  em {
    font-style: italic;
  }

  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
    color: #c41d7f;
    font-family: 'Monaco', 'Courier New', monospace;
  }

  pre {
    background: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
    margin: 8px 0;

    code {
      background: none;
      padding: 0;
      color: #666;
    }
  }

  a {
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  ul, ol {
    margin: 8px 0 8px 20px;

    li {
      margin: 4px 0;
    }
  }

  blockquote {
    margin: 8px 0;
    padding: 8px 12px;
    background: #f0f0f0;
    border-left: 3px solid #409eff;
    color: #666;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 8px 0 4px 0;
    font-weight: 600;
  }

  h1 { font-size: 18px; }
  h2 { font-size: 16px; }
  h3 { font-size: 14px; }
  h4 { font-size: 13px; }
  h5 { font-size: 12px; }
  h6 { font-size: 11px; }
}

/* 代码块容器 */
.code-block-container {
  position: relative;
  display: block;
  margin: 8px 0;

  &:hover .code-copy-btn {
    opacity: 1;
  }
}

/* 复制按钮样式 */
.code-copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #555;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;
  font-weight: 500;

  &:hover {
    background-color: #777;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &.copied {
    opacity: 1;
    background-color: #67c23a;

    &:hover {
      background-color: #7cd237;
    }
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
