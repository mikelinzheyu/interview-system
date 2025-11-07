# 实时聊天系统快速开始指南

## 5分钟快速上手

### 步骤 1: 导入服务

```javascript
import ChatSocketService from '@/utils/ChatSocketService'
```

### 步骤 2: 连接到 WebSocket

```javascript
// 在 ChatRoom.vue 的 setup 中
async function initChat(userId) {
  await ChatSocketService.connect(userId, 'ws://localhost:3001/ws/chat')
}

// 在组件加载时调用
onMounted(() => initChat('user_123'))
```

### 步骤 3: 监听事件

```javascript
// 新消息
ChatSocketService.on('message:new', (msg) => {
  messages.value.push(msg)
})

// 连接状态
ChatSocketService.on('connected', () => {
  console.log('已连接')
})

ChatSocketService.on('disconnected', () => {
  console.log('已断开')
})
```

### 步骤 4: 发送消息

```javascript
ChatSocketService.sendChatMessage(receiverId, '你好！')
```

### 步骤 5: 显示连接状态

```vue
<MessagePanel
  :messages="messages"
  :connection-status="connectionStatus"
/>

<MessageComposer
  :is-connected="isConnected"
  @send="sendMessage"
/>
```

---

## 常用 API

### 连接管理

```javascript
// 连接
await ChatSocketService.connect(userId, wsUrl)

// 断开
ChatSocketService.close()

// 获取连接状态
const state = ChatSocketService.getConnectionState()

// 是否已连接
const connected = ChatSocketService.isConnected()
```

### 发送消息

```javascript
// 私聊
ChatSocketService.sendChatMessage(receiverId, content)

// 群聊
ChatSocketService.sendGroupMessage(groupId, content)

// 已读状态
ChatSocketService.sendMessageRead(roomId, messageIds)

// 打字状态
ChatSocketService.sendTypingStatus(roomId, isTyping)

// 加入房间
ChatSocketService.joinRoom(roomId)

// 离开房间
ChatSocketService.leaveRoom(roomId)
```

### 事件监听

```javascript
// 注册监听
ChatSocketService.on(event, callback)

// 移除监听
ChatSocketService.off(event, callback)

// 触发事件
ChatSocketService.emit(event, data)
```

### 支持的事件

```
'connected'         - 连接成功
'disconnected'      - 连接断开
'message:new'       - 新消息
'message:delivered' - 消息已送达
'message:read'      - 消息已读
'message:status'    - 消息状态变化
'message:offline'   - 离线消息
'user:typing'       - 用户打字
'user:online'       - 用户上线
'user:offline'      - 用户离线
```

---

## 组件 Props

### MessagePanel

```javascript
<MessagePanel
  :messages="[]"
  :loading="false"
  :typing-users="[]"
  :has-more="false"
  :connection-status="'connected'" // 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
  @load-previous="handleLoadPrevious"
  @resend-message="handleResend"
/>
```

### MessageComposer

```javascript
<MessageComposer
  v-model="inputText"
  :disabled="false"
  :is-connected="true"
  :room-id="'room_123'"
  @send="handleSend"
  @typing-start="handleTypingStart"
  @typing-stop="handleTypingStop"
/>
```

---

## 连接状态指示器

| 状态 | 图标 | 说明 |
|------|------|------|
| connected | ✓ 绿色 | 连接正常，可以聊天 |
| connecting | ⟳ 黄色 | 正在连接中... |
| reconnecting | ⟳ 橙色 | 正在重新连接... |
| disconnected | ✗ 红色 | 连接已断开 |

---

## 错误处理

### 基本错误处理

```javascript
async function connectChat() {
  try {
    await ChatSocketService.connect(userId)
  } catch (error) {
    console.error('连接失败:', error.message)
    ElMessage.error('连接失败，请稍后重试')
  }
}
```

### 连接错误状态

```javascript
const state = ChatSocketService.getConnectionState()

if (state.connectionError) {
  console.error('连接错误:', state.connectionError)
  console.log('重连次数:', state.reconnectCount)
}
```

### 自动重连

系统会自动重连，最多尝试 5 次，延迟时间为指数退避：
- 第 1 次: 3秒
- 第 2 次: 6秒
- 第 3 次: 12秒
- 第 4 次: 24秒
- 第 5 次: 48秒

---

## 消息状态流

### 消息状态转换

```
pending        → 消息正在发送
    ↓
delivered      → 消息已送达服务器
    ↓
read           → 对方已读
```

### 失败重发

```javascript
// 监听消息失败
if (message.status === 'failed') {
  // 显示重发按钮
}

// 重发消息
ChatSocketService.send({
  type: 'message:send',
  payload: {
    messageId: message.id,
    content: message.content
  }
})
```

---

## 打字指示器

### 自动发送

MessageComposer 会自动管理打字状态：
- 用户开始输入 → 发送 `typing:true`
- 1 秒无输入 → 发送 `typing:false`

### 显示他人打字状态

```vue
<div v-if="typingUsers.length" class="typing-indicator">
  {{ typingUsers.join('、') }} 正在输入...
</div>
```

---

## 离线消息

### 自动队列

当网络断开时，消息自动保存到队列。重连后自动发送。

### 离线通知

```vue
<!-- MessageComposer 自动显示 -->
<div v-if="!isConnected" class="offline-banner">
  <el-icon><Warning /></el-icon>
  <span>网络连接已断开，消息将在连接恢复后发送</span>
</div>
```

---

## 完整示例

### ChatRoom.vue

```vue
<template>
  <div class="chat-room">
    <MessagePanel
      :messages="messages"
      :typing-users="typingUsers"
      :connection-status="connectionStatus"
      @load-previous="loadMoreMessages"
    />

    <MessageComposer
      v-model="inputText"
      :is-connected="isConnected"
      :room-id="roomId"
      @send="handleSendMessage"
      @typing-start="handleTypingStart"
      @typing-stop="handleTypingStop"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import ChatSocketService from '@/utils/ChatSocketService'
import MessagePanel from '@/components/chat/MessagePanel.vue'
import MessageComposer from '@/components/chat/MessageComposer.vue'

const messages = ref([])
const typingUsers = ref([])
const inputText = ref('')
const roomId = ref('room_123')
const userId = ref('user_123')

const connectionState = reactive({
  isConnected: false,
  isConnecting: false,
  reconnectCount: 0
})

const isConnected = computed(() => connectionState.isConnected)
const connectionStatus = computed(() => {
  if (connectionState.isConnected) return 'connected'
  if (connectionState.isConnecting) return 'connecting'
  if (connectionState.reconnectCount > 0) return 'reconnecting'
  return 'disconnected'
})

// 初始化聊天
async function initChat() {
  try {
    connectionState.isConnecting = true
    await ChatSocketService.connect(userId.value)
    connectionState.isConnected = true
    connectionState.isConnecting = false

    // 设置事件监听
    setupListeners()
  } catch (error) {
    connectionState.isConnecting = false
    console.error('连接失败:', error)
  }
}

// 设置事件监听
function setupListeners() {
  // 新消息
  ChatSocketService.on('message:new', (msg) => {
    messages.value.push({
      id: msg.messageId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      content: msg.content,
      createdAt: new Date(msg.timestamp),
      status: 'delivered',
      isOwn: msg.senderId === userId.value
    })
  })

  // 消息已读
  ChatSocketService.on('message:read', ({ messageId }) => {
    const msg = messages.value.find(m => m.id === messageId)
    if (msg) msg.status = 'read'
  })

  // 用户打字
  ChatSocketService.on('user:typing', ({ userId: tyingId, isTyping }) => {
    if (isTyping && !typingUsers.value.includes(tyingId)) {
      typingUsers.value.push(tyingId)
      setTimeout(() => {
        typingUsers.value = typingUsers.value.filter(id => id !== tyingId)
      }, 3000)
    }
  })

  // 连接断开
  ChatSocketService.on('disconnected', () => {
    connectionState.isConnected = false
  })

  // 连接成功
  ChatSocketService.on('connected', () => {
    connectionState.isConnected = true
  })
}

// 发送消息
function handleSendMessage(content) {
  const msgId = `msg_${Date.now()}`

  // 立即显示（乐观更新）
  messages.value.push({
    id: msgId,
    senderId: userId.value,
    senderName: 'You',
    content,
    createdAt: new Date(),
    status: 'pending',
    isOwn: true
  })

  // 通过 WebSocket 发送
  ChatSocketService.sendChatMessage(roomId.value, content, { messageId: msgId })

  inputText.value = ''
}

function handleTypingStart({ roomId: rid }) {
  ChatSocketService.sendTypingStatus(rid, true)
}

function handleTypingStop({ roomId: rid }) {
  ChatSocketService.sendTypingStatus(rid, false)
}

function loadMoreMessages() {
  // 实现分页加载历史消息
}

onMounted(() => {
  initChat()
})
</script>
```

---

## 性能优化建议

### 1. 消息虚拟滚动
```javascript
// MessagePanel 已使用虚拟滚动，大量消息不会卡顿
```

### 2. 去抖动
```javascript
// 打字状态已内置 1 秒去抖
// 避免频繁发送打字状态
```

### 3. 消息分页
```javascript
// 分页加载历史消息，减少初始加载时间
const PAGE_SIZE = 50
function loadMoreMessages(page) {
  // 只加载最近 50 条消息
}
```

### 4. 事件清理
```javascript
// 在组件卸载时清理监听
onBeforeUnmount(() => {
  ChatSocketService.off('message:new', handleNewMessage)
  ChatSocketService.close()
})
```

---

## 故障排除

### 连接失败

```javascript
// 检查 WebSocket URL
console.log('WebSocket URL:', `ws://localhost:3001/ws/chat?userId=123`)

// 检查连接状态
const state = ChatSocketService.getConnectionState()
console.log('连接状态:', state)

// 查看错误信息
console.log('错误:', state.connectionError)
```

### 消息未收到

```javascript
// 检查消息是否在队列中
console.log('消息队列:', ChatSocketService.messageQueue)

// 检查事件监听是否正确
ChatSocketService.on('message:new', (msg) => {
  console.log('收到消息:', msg)
})
```

### 频繁断开连接

```javascript
// 检查心跳日志
// 检查服务器连接状态
// 查看网络错误日志
```

---

## 下一步

1. ✅ 集成前端 WebSocket
2. ⏳ 实现后端服务
3. ⏳ 集成数据库
4. ⏳ 添加群聊功能
5. ⏳ 实现消息搜索
6. ⏳ 添加文件上传

---

## 相关文档

- **完整指南**: CHAT_INTEGRATION_GUIDE.md
- **优化总结**: CHAT_OPTIMIZATION_SUMMARY.md
- **源代码**: frontend/src/utils/ChatSocketService.js

---

**版本**: 1.0
**最后更新**: 2024年

🎉 现在你已经准备好了！开始构建实时聊天应用吧！
