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
        <div :class="['message-bubble', `role-${message.role}`]">
          <!-- 加载指示器 -->
          <div v-if="message.loading" class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <!-- 消息内容 -->
          <div v-else class="message-content">
            {{ message.content }}
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

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
    // 消息格式: { id, role: 'user' | 'assistant', content, timestamp, loading }
  },
})

const emit = defineEmits(['scroll-to-bottom', 'scroll-top-reached'])

const messageContainerRef = ref(null)

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
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
// 方案 B: 消息面板 - 完全全宽块级
.ai-message-panel {
  position: relative;
  width: 100%;  // ✅ 确保容器 100% 宽度
  height: 450px;
  display: flex;
  flex-direction: column;
  background: #1f1f2f;
  border-bottom: 1px solid #3d3d4d;
  overflow: hidden;  // ✅ 防止内部溢出
}

// 消息容器 - 方案 B: 完全全宽块级设计
.message-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;  // 移除容器 padding，让消息填满宽度

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
  width: 100%;  // ✅ 填满整个宽度
  padding: 8px 16px;  // 水平 padding 用于边距
  animation: slideIn 0.3s ease-out;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);  // 分隔线

  &.message-user {
    justify-content: flex-end;
    background: rgba(61, 61, 77, 0.3);  // 淡色背景区分用户消息
  }

  &.message-assistant {
    justify-content: flex-start;
    background: transparent;  // AI消息无背景
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

// 消息气泡 - 方案 B: 块级设计，移除 max-width
.message-bubble {
  width: auto;  // ✅ 自适应内容宽度
  max-width: none;  // ✅ 移除宽度限制
  padding: 10px 14px;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 14px;
  animation: bubbleIn 0.3s ease-out;

  // 用户消息 - 简洁块级
  &.role-user {
    background: transparent;  // 无背景（wrapper已有背景）
    color: #e0e0e0;
    text-align: right;  // 右对齐文本
  }

  // AI 消息 - 简洁块级
  &.role-assistant {
    background: transparent;  // 无背景（wrapper已有背景）
    border-left: none;  // 移除左边框
    color: #c0c0c0;
    text-align: left;  // 左对齐文本
  }

  // 加载消息
  &.role-loading {
    background: transparent;
    padding: 12px 14px;
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

// 消息内容
.message-content {
  margin: 0 0 4px 0;
  word-break: break-word;
}

// 消息时间戳
.message-time {
  font-size: 12px;
  color: #888;
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
