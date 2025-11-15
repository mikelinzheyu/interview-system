<template>
  <div class="ai-message-panel">
    <!-- 消息容器 - 普通滚动（比虚拟滚动更稳定） -->
    <div ref="messageContainerRef" class="message-container">
      <!-- 消息列表 -->
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message-wrapper', `message-${message.role}`]"
      >
        <!-- 加载指示器 -->
        <div v-if="message.loading" class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <!-- 消息内容容器 -->
        <div v-else class="message-content-wrapper">
          <!-- 用户消息 - 纯文本 -->
          <div v-if="message.role === 'user'" class="user-message-block">
            {{ message.content }}
          </div>

          <!-- AI消息 - Markdown渲染 -->
          <div v-else class="ai-message-block">
            <div class="message-html-content" v-html="renderMarkdown(message.content)"></div>

            <!-- 消息操作按钮 -->
            <div class="message-actions">
              <button @click="copyMessage(message.content)" class="action-btn" title="复制">
                <span class="icon">📋</span>
                <span class="text">复制</span>
              </button>
              <button @click="refreshMessage(message)" class="action-btn" title="刷新">
                <span class="icon">🔄</span>
                <span class="text">刷新</span>
              </button>
            </div>
          </div>

          <!-- 消息时间戳 -->
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 占位内容 -->
    <div v-if="messages.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <p class="empty-text">开始对话吧！输入你的问题</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
    // 消息格式: { id, role: 'user' | 'assistant', content, timestamp, loading }
  },
})

const emit = defineEmits(['scroll-to-bottom', 'scroll-top-reached', 'refresh-message'])

const messageContainerRef = ref(null)

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
})

// 渲染Markdown为HTML
const renderMarkdown = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch (error) {
    console.error('Markdown render error:', error)
    return `<p>${content}</p>`
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 复制消息
const copyMessage = async (content) => {
  try {
    // 去除HTML标签，只复制纯文本
    const plainText = content.replace(/<[^>]*>/g, '')
    await navigator.clipboard.writeText(plainText)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('Copy error:', error)
    ElMessage.error('复制失败')
  }
}

// 刷新消息
const refreshMessage = (message) => {
  emit('refresh-message', message)
}

// 滚动事件处理
const onScroll = (e) => {
  if (!messageContainerRef.value) return

  const scrollElement = messageContainerRef.value
  const scrollTop = scrollElement.scrollTop
  const scrollHeight = scrollElement.scrollHeight
  const clientHeight = scrollElement.clientHeight

  // 检查是否接近底部（距离底部 50px 内）
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 50

  if (isNearBottom) {
    emit('scroll-to-bottom')
  }
}

// 自动滚到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageContainerRef.value) {
    messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight
  }
}

// 监听消息变化，自动滚到底部
watch(
  () => props.messages.length,
  async () => {
    await scrollToBottom()
  },
  { immediate: true }
)

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
})
</script>

<style scoped lang="scss">
// 消息面板 - 完全全宽块级设计
.ai-message-panel {
  position: relative;
  width: 100%;
  height: 450px;
  display: flex;
  flex-direction: column;
  background: #1f1f2f;
  border-bottom: 1px solid #3d3d4d;
  overflow: hidden;
}

// 消息容器 - 完全全宽块级设计
.message-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #4d4d5d;
    border-radius: 3px;
    transition: background 0.2s;

    &:hover {
      background: #5d5d6d;
    }
  }
}

// 消息包装器 - 100% 宽度块级
.message-wrapper {
  display: flex;
  width: 100%;
  padding: 12px 16px;
  animation: slideIn 0.3s ease-out;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &.message-user {
    justify-content: flex-end;
    background: rgba(61, 61, 77, 0.3);
  }

  &.message-assistant {
    justify-content: flex-start;
    background: transparent;
  }

  // 移除最后一条消息的分隔线
  &:last-child {
    border-bottom: none;
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

// 消息内容包装器
.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: auto;
  max-width: 100%;
}

// 用户消息块 - 简洁风格
.user-message-block {
  padding: 10px 14px;
  background: transparent;
  color: #e0e0e0;
  text-align: right;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 14px;
  animation: bubbleIn 0.3s ease-out;
}

// AI消息块 - 文档式风格
.ai-message-block {
  padding: 0;
  color: #c0c0c0;
  text-align: left;
}

// Markdown HTML内容渲染
.message-html-content {
  line-height: 1.7;
  word-break: break-word;

  // 段落样式
  p {
    margin: 0 0 12px 0;
    color: #d0d0d0;
    font-size: 14px;
  }

  // 标题样式
  h1, h2, h3, h4, h5, h6 {
    color: #ffffff;
    font-weight: 600;
    margin: 16px 0 8px 0;
  }

  h1 {
    font-size: 20px;
  }

  h2 {
    font-size: 18px;
  }

  h3 {
    font-size: 16px;
  }

  h4 {
    font-size: 15px;
  }

  // 列表样式
  ol, ul {
    margin: 8px 0 12px 0;
    padding-left: 24px;

    li {
      margin-bottom: 6px;
      color: #d0d0d0;
      font-size: 14px;
    }
  }

  // 代码块样式
  code {
    background: rgba(102, 126, 234, 0.1);
    color: #89d4ff;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }

  pre {
    background: rgba(0, 0, 0, 0.3);
    border-left: 3px solid #667eea;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 8px 0 12px 0;

    code {
      background: none;
      color: #89d4ff;
      padding: 0;
    }
  }

  // 粗体和斜体
  strong, b {
    color: #ffffff;
    font-weight: 600;
  }

  em, i {
    color: #d0d0d0;
    font-style: italic;
  }

  // 分隔线
  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 16px 0;
  }

  // 引用块
  blockquote {
    border-left: 3px solid #667eea;
    padding-left: 12px;
    margin: 8px 0;
    color: #a0a0a0;
    font-style: italic;
  }

  // 内联链接
  a {
    color: #667eea;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #7c8ef8;
      text-decoration: underline;
    }
  }

  // 表格
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;

    th, td {
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 8px;
      text-align: left;
    }

    th {
      background: rgba(102, 126, 234, 0.1);
      color: #ffffff;
      font-weight: 600;
    }

    td {
      color: #d0d0d0;
    }
  }
}

@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 消息操作按钮
.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  .action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    color: #a0a0a0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;

    .icon {
      font-size: 14px;
    }

    .text {
      font-weight: 500;
    }

    &:hover {
      background: rgba(102, 126, 234, 0.2);
      border-color: #667eea;
      color: #667eea;
    }

    &:active {
      transform: scale(0.96);
    }
  }
}

// 消息时间戳
.message-time {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

// 打字效果指示器
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 20px;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #667eea;
    animation: typing 1.4s infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}

// 空状态
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 12px;

  .empty-icon {
    font-size: 48px;
    opacity: 0.5;
  }

  .empty-text {
    margin: 0;
    font-size: 14px;
    color: #888;
  }
}
</style>
