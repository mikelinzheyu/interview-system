# 🔗 WebSocket 实时通信集成指南

## 📋 概述

本指南将帮助集成 WebSocket 实时通信功能到 QQ 聊天 UI 中。

## 🎯 集成计划

### 第一步：配置 ChatSocketService

ChatSocketService 已在 `frontend/src/utils/ChatSocketService.js` 中创建，具备以下功能：

- ✅ WebSocket 连接管理
- ✅ 自动重连机制
- ✅ 消息队列（离线缓冲）
- ✅ 心跳检测
- ✅ 事件监听系统

### 第二步：在 ChatRoom.vue 中初始化连接

在 `onMounted` 生命周期中：

```javascript
import { ChatSocketService } from '@/utils/ChatSocketService'

const socketService = new ChatSocketService()

onMounted(async () => {
  try {
    // 初始化 WebSocket 连接
    await socketService.connect(
      userStore.user?.id || 1,
      'ws://localhost:3001/ws/chat'
    )

    // 监听消息事件
    socketService.on('message', handleNewMessage)
    socketService.on('typing', handleUserTyping)
    socketService.on('user-joined', handleUserJoined)
    socketService.on('user-left', handleUserLeft)
  } catch (error) {
    ElMessage.error('连接失败，请检查网络')
  }
})

onBeforeUnmount(() => {
  // 清理监听器
  socketService.off('message', handleNewMessage)
  socketService.off('typing', handleUserTyping)
})
```

### 第三步：实现消息收发

#### 发送消息

```javascript
async function handleSendMessage(content) {
  if (!store.activeConversationId) return

  try {
    // 本地添加消息
    const message = {
      id: `msg_${Date.now()}`,
      content,
      timestamp: Date.now(),
      status: 'pending',
      isOwn: true
    }

    // 通过 WebSocket 发送
    socketService.send({
      type: 'message',
      roomId: store.activeConversationId,
      content,
      timestamp: Date.now()
    })

  } catch (error) {
    ElMessage.error('发送失败')
  }
}
```

#### 接收消息

```javascript
function handleNewMessage(data) {
  const message = {
    id: data.id,
    content: data.content,
    timestamp: data.timestamp,
    senderName: data.senderName,
    senderAvatar: data.senderAvatar,
    isOwn: data.senderId === userStore.user?.id,
    status: 'delivered',
    type: 'text'
  }

  // 添加到消息列表
  store.addMessage(store.activeConversationId, message)
}
```

### 第四步：实现实时通知

#### 打字指示

```javascript
function handleTypingStatus(isTyping) {
  socketService.send({
    type: 'typing',
    roomId: store.activeConversationId,
    isTyping
  })
}

function handleUserTyping(data) {
  store.handleRemoteTyping(
    data.roomId,
    data.userName,
    data.isTyping
  )
}
```

#### 用户上线/离线

```javascript
function handleUserJoined(data) {
  ElNotification({
    title: '用户上线',
    message: `${data.userName} 已上线`,
    type: 'success'
  })
  store.updateParticipantStatus(data.userId, 'online')
}

function handleUserLeft(data) {
  ElNotification({
    title: '用户离线',
    message: `${data.userName} 已离线`,
    type: 'info'
  })
  store.updateParticipantStatus(data.userId, 'offline')
}
```

## 🔌 WebSocket 事件类型

### 客户端发送

| 事件 | 数据结构 | 说明 |
|------|---------|------|
| message | `{type, roomId, content, timestamp}` | 发送消息 |
| typing | `{type, roomId, isTyping}` | 打字状态 |
| read-receipt | `{type, roomId, messageIds}` | 消息已读 |
| join-room | `{type, roomId}` | 加入房间 |
| leave-room | `{type, roomId}` | 离开房间 |

### 服务器推送

| 事件 | 数据结构 | 说明 |
|------|---------|------|
| message | `{id, content, senderId, senderName, timestamp}` | 新消息 |
| typing | `{roomId, userId, userName, isTyping}` | 用户打字 |
| user-joined | `{userId, userName, roomId}` | 用户加入 |
| user-left | `{userId, userName, roomId}` | 用户离开 |
| online-users | `{roomId, users}` | 在线用户列表 |

## 📝 完整集成示例

```javascript
// ChatRoom.vue 中的完整集成

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ChatSocketService } from '@/utils/ChatSocketService'
import { ElMessage, ElNotification } from 'element-plus'

const socketService = new ChatSocketService()
const messages = ref([])
const typingUsers = ref([])
const connectionState = ref(socketService.connectionState)

// 初始化连接
onMounted(async () => {
  try {
    // 连接到 WebSocket 服务器
    await socketService.connect(
      userStore.user?.id || 1
    )

    // 注册事件监听
    registerSocketListeners()

    ElMessage.success('已连接到服务器')
  } catch (error) {
    ElMessage.error('连接失败：' + error.message)
  }
})

// 注册事件监听
function registerSocketListeners() {
  socketService.on('message', (data) => {
    messages.value.push({
      ...data,
      isOwn: data.senderId === userStore.user?.id
    })
  })

  socketService.on('typing', (data) => {
    if (data.isTyping && !typingUsers.value.includes(data.userName)) {
      typingUsers.value.push(data.userName)
    } else if (!data.isTyping) {
      typingUsers.value = typingUsers.value.filter(
        u => u !== data.userName
      )
    }
  })

  socketService.on('user-joined', handleUserJoined)
  socketService.on('user-left', handleUserLeft)
}

// 清理资源
onBeforeUnmount(() => {
  socketService.disconnect()
})
```

## 🚀 启动 WebSocket 服务器

确保后端 WebSocket 服务器正在运行：

```bash
cd backend
node mock-server.js
```

后端应该输出：
```
✅ WebSocket 服务器已初始化
📡 WebSocket 服务运行在 ws://localhost:3001
```

## 🔍 调试技巧

### 查看 WebSocket 连接状态

在浏览器控制台中：

```javascript
// 检查连接状态
console.log(socketService.connectionState)

// 输出应该类似于：
// {
//   isConnecting: false,
//   isConnected: true,
//   connectionError: null,
//   reconnectCount: 0
// }
```

### 监听所有 WebSocket 消息

在 DevTools Network 标签中：

1. 打开 DevTools (F12)
2. 选择 Network 标签
3. 过滤类型为 "WS" (WebSocket)
4. 查看所有消息帧

### 测试消息发送

```javascript
// 在控制台中手动发送测试消息
socketService.send({
  type: 'message',
  roomId: 1,
  content: '测试消息',
  timestamp: Date.now()
})
```

## ⚠️ 常见问题

### Q: WebSocket 连接失败？

**A: 检查以下几点：**
1. 后端服务是否运行 (`node mock-server.js`)
2. WebSocket URL 是否正确
3. 防火墙是否阻止了 WebSocket 端口
4. 浏览器控制台是否有错误

### Q: 消息未实时接收？

**A: 可能的原因：**
1. WebSocket 连接已断开
2. 事件监听器未正确注册
3. 消息处理函数有错误
4. 检查浏览器控制台错误

### Q: 自动重连不工作？

**A: 检查重连配置：**
```javascript
// ChatSocketService 中的配置
this.maxReconnectAttempts = 5      // 最大重连次数
this.reconnectDelay = 3000         // 重连延迟 (毫秒)
```

## 📊 性能优化建议

1. **消息批处理**
   ```javascript
   // 避免逐条发送，合并后批量发送
   const messageBuffer = []
   const flushBuffer = () => {
     if (messageBuffer.length > 0) {
       socketService.send({
         type: 'batch-message',
         messages: messageBuffer
       })
       messageBuffer.length = 0
     }
   }
   ```

2. **连接复用**
   - 不要创建多个 ChatSocketService 实例
   - 使用单一全局实例

3. **内存管理**
   - 及时清理旧消息
   - 移除不用的事件监听器

## 📚 相关文件

- `frontend/src/utils/ChatSocketService.js` - Socket 服务
- `frontend/src/views/chat/ChatRoom.vue` - 集成点
- `backend/mock-server.js` - 后端 WebSocket 服务

## ✅ 集成检查清单

- [ ] ChatSocketService 导入正确
- [ ] onMounted 中初始化连接
- [ ] 所有事件监听器已注册
- [ ] onBeforeUnmount 中清理资源
- [ ] 后端服务正常运行
- [ ] 浏览器控制台无错误
- [ ] WebSocket 连接成功建立
- [ ] 消息正常发送和接收
- [ ] 打字指示正常工作
- [ ] 用户在线/离线提示正常

---

**下一步**: 测试完整的消息收发流程并优化性能。
