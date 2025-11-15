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

            <!-- 消息操作按钮 - Phase 4: 扩展功能 -->
            <div class="message-actions">
              <div class="action-group primary">
                <button @click="copyMessage(message.content)" class="action-btn" title="复制">
                  <span class="icon">📋</span>
                  <span class="text">复制</span>
                </button>
                <button @click="refreshMessage(message)" class="action-btn" title="刷新">
                  <span class="icon">🔄</span>
                  <span class="text">刷新</span>
                </button>
              </div>

              <!-- Phase 4: 交互反馈按钮 -->
              <div class="action-group feedback">
                <button
                  @click="toggleLike(message)"
                  class="action-btn"
                  :class="{ active: message.liked }"
                  title="点赞"
                >
                  <span class="icon">{{ message.liked ? '❤️' : '🤍' }}</span>
                  <span class="text">{{ message.likeCount || 0 }}</span>
                </button>
                <button
                  @click="toggleBookmark(message)"
                  class="action-btn"
                  :class="{ active: message.bookmarked }"
                  title="收藏"
                >
                  <span class="icon">{{ message.bookmarked ? '⭐' : '☆' }}</span>
                  <span class="text">收藏</span>
                </button>
                <div class="share-container">
                  <button
                    @click.stop="showShareMenu($event, message)"
                    class="action-btn"
                    title="分享"
                  >
                    <span class="icon">🔗</span>
                    <span class="text">分享</span>
                  </button>

                  <!-- 分享菜单弹窗 -->
                  <div
                    v-if="shareMenuVisible && shareMenuTarget === message.id"
                    class="share-menu"
                    :style="{ top: shareMenuPosition.top, left: shareMenuPosition.left }"
                  >
                    <button
                      @click="shareToWeChat(message)"
                      class="share-option"
                      title="分享到微信"
                    >
                      <span class="share-icon">💬</span>
                      <span class="share-text">微信</span>
                    </button>
                    <button
                      @click="shareToQQ(message)"
                      class="share-option"
                      title="分享到QQ"
                    >
                      <span class="share-icon">🎯</span>
                      <span class="share-text">QQ</span>
                    </button>
                    <button
                      @click="copyShareLink(message)"
                      class="share-option"
                      title="复制分享链接"
                    >
                      <span class="share-icon">📋</span>
                      <span class="share-text">复制链接</span>
                    </button>
                  </div>
                </div>
              </div>
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
import { ref, watch, nextTick, h } from 'vue'
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

// 分享菜单状态
const shareMenuVisible = ref(false)
const shareMenuTarget = ref(null)
const shareMenuPosition = ref({ top: '0px', left: '0px' })

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
    // 清理Markdown格式符号，只复制纯文本
    let plainText = content
      // 移除标题符号 (###, ##, #)
      .replace(/^#+\s+/gm, '')
      // 移除粗体符号 (**text** or __text__)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      // 移除斜体符号 (*text* or _text_)
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // 移除代码块符号 (```code```)
      .replace(/```[\s\S]*?```/g, '')
      // 移除内联代码符号 (`code`)
      .replace(/`(.+?)`/g, '$1')
      // 移除链接格式 ([text](url))
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      // 移除图片格式 (![alt](url))
      .replace(/!\[(.+?)\]\(.+?\)/g, '')
      // 移除引用符号 (> text)
      .replace(/^>\s+/gm, '')
      // 移除列表符号 (-, *, +)
      .replace(/^[-*+]\s+/gm, '')
      // 移除编号列表符号 (1., 2., etc)
      .replace(/^\d+\.\s+/gm, '')
      // 移除分隔线 (---, ***, ___)
      .replace(/^[\*_-]{3,}$/gm, '')
      // 移除HTML标签
      .replace(/<[^>]*>/g, '')
      // 移除多余空行
      .replace(/\n\n+/g, '\n')
      .trim()

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

// Phase 4: 点赞消息
const toggleLike = (message) => {
  if (!message.liked) {
    message.liked = true
    message.likeCount = (message.likeCount || 0) + 1
    ElMessage.success('感谢你的点赞！')
  } else {
    message.liked = false
    message.likeCount = Math.max(0, (message.likeCount || 0) - 1)
  }
}

// Phase 4: 收藏消息
const toggleBookmark = (message) => {
  if (!message.bookmarked) {
    message.bookmarked = true
    ElMessage.success('已收藏')
  } else {
    message.bookmarked = false
    ElMessage.info('已取消收藏')
  }
}

// Phase 4: 显示分享菜单
const showShareMenu = (event, message) => {
  shareMenuTarget.value = message.id
  shareMenuVisible.value = true

  // 计算菜单位置
  const rect = event.target.getBoundingClientRect()
  shareMenuPosition.value = {
    top: `${rect.bottom + 5}px`,
    left: `${rect.left - 50}px`,
  }

  // 点击其他地方关闭菜单
  const closeMenu = () => {
    shareMenuVisible.value = false
    document.removeEventListener('click', closeMenu)
  }
  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 0)
}

// Phase 4: 分享到微信
const shareToWeChat = (message) => {
  const shareText = message.content.replace(/<[^>]*>/g, '').substring(0, 100)
  const shareUrl = window.location.href

  // 微信分享生成二维码
  const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`

  // 弹出提示
  ElMessage.info({
    message: h('div', [
      h('p', '微信分享需要在微信内打开，或扫描二维码：'),
      h('img', { src: qrcodeUrl, style: 'max-width: 200px; margin-top: 10px;' }),
    ]),
    duration: 5000,
    showClose: true,
  })

  shareMenuVisible.value = false
}

// Phase 4: 分享到QQ
const shareToQQ = (message) => {
  const shareText = message.content.replace(/<[^>]*>/g, '').substring(0, 100)
  const shareUrl = window.location.href
  const shareTitle = 'AI 助手回复'

  // QQ分享链接
  const qqShareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&desc=${encodeURIComponent(shareText)}`

  // 打开QQ分享
  window.open(qqShareUrl, 'QQShare', 'width=800,height=600')

  ElMessage.success('已打开QQ分享')
  shareMenuVisible.value = false
}

// Phase 4: 复制分享链接
const copyShareLink = async (message) => {
  try {
    const shareText = message.content.replace(/<[^>]*>/g, '').substring(0, 100)
    const shareUrl = `${window.location.href}?msg=${encodeURIComponent(shareText)}`
    await navigator.clipboard.writeText(shareUrl)
    ElMessage.success('分享链接已复制到剪贴板')
    shareMenuVisible.value = false
  } catch (error) {
    console.error('Copy link error:', error)
    ElMessage.error('复制失败')
  }
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

// 消息操作按钮 - Phase 4: 扩展交互功能
.message-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  .action-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    &.primary {
      gap: 6px;
    }

    &.feedback {
      gap: 8px;
    }
  }

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
    user-select: none;

    .icon {
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 14px;
    }

    .text {
      font-weight: 500;
      white-space: nowrap;
    }

    &:hover {
      background: rgba(102, 126, 234, 0.2);
      border-color: #667eea;
      color: #667eea;
      transform: translateY(-1px);
    }

    &:active {
      transform: scale(0.96);
    }

    // Phase 4: 点赞/收藏活跃状态
    &.active {
      background: rgba(255, 107, 107, 0.15);
      border-color: rgba(255, 107, 107, 0.4);
      color: #ff6b6b;

      &:hover {
        background: rgba(255, 107, 107, 0.25);
        border-color: #ff6b6b;
        color: #ff6b6b;
      }

      .icon {
        animation: heartBeat 0.3s ease-in-out;
      }
    }
  }
}

@keyframes heartBeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

// Phase 4: 分享容器和菜单样式
.share-container {
  position: relative;
  display: inline-block;
}

.share-menu {
  position: fixed;
  background: #2d2d3d;
  border: 1px solid #3d3d4d;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 120px;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;

  .share-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    border: none;
    color: #d0d0d0;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    white-space: nowrap;

    .share-icon {
      font-size: 16px;
    }

    .share-text {
      flex: 1;
      text-align: left;
      font-weight: 500;
    }

    &:hover {
      background: rgba(102, 126, 234, 0.15);
      color: #667eea;

      .share-icon {
        transform: scale(1.1);
      }
    }

    &:active {
      background: rgba(102, 126, 234, 0.25);
    }

    &:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
