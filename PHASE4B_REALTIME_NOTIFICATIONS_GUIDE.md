# 📢 Phase 4B: 实时通知完整实现指南

## 📋 概述

本指南详细说明如何在 ChatRoom.vue 中实现实时通知功能，包括:
1. 打字指示器 (Typing Indicators)
2. 用户在线/离线通知
3. 消息已读回执
4. 在线用户列表

## 1️⃣ 打字指示器实现

### 服务端 → 客户端流程

当用户输入时，实时推送给其他用户：

```javascript
// ChatRoom.vue - 在 watch draft 中

// 已有的 draft 监听
watch(
  draft,
  (value) => {
    const conversationId = store.activeConversationId
    if (!conversationId) return

    const hasContent = Boolean(value && value.trim())

    if (socketService.isConnected()) {
      try {
        // 发送打字状态 (已实现)
        if (store.notifyTyping(conversationId, hasContent)) {
          socketService.sendTypingStatus(conversationId, hasContent)
        }
      } catch (error) {
        console.warn('[chat] typing status emit failed', error)
      }
    }

    // ... 后续清理逻辑
  }
)
```

### 客户端 → UI 显示

在 MessageInputNew.vue 中显示打字指示：

```vue
<!-- MessageInputNew.vue -->

<template>
  <div class="message-input-wrapper">
    <!-- 打字指示 -->
    <div v-if="typingUsers.length > 0" class="typing-indicator">
      <span class="typing-text">
        {{ typingUsersText }} 正在输入
        <span class="typing-dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </span>
    </div>

    <!-- 其余输入框内容 -->
    <div class="input-container">
      <!-- ... -->
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  typingUsers: {
    type: Array,
    default: () => []
  }
})

// 生成打字用户文本
const typingUsersText = computed(() => {
  if (!props.typingUsers.length) return ''
  if (props.typingUsers.length === 1) {
    return props.typingUsers[0]
  }
  if (props.typingUsers.length === 2) {
    return props.typingUsers.join(' 和 ')
  }
  return `${props.typingUsers.slice(0, 2).join('、')} 等人`
})
</script>

<style scoped>
.typing-indicator {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 8px;
}

.typing-dots span {
  animation: blink 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}
</style>
```

### 在 ChatRoom.vue 中传递打字用户列表

```javascript
// ChatRoom.vue - 已有的计算属性

const typingUsers = computed(() => store.typingUsers?.[store.activeConversationId] || [])

// 在模板中传递
<MessageInputNew
  :typing-users="typingUsers"
  :disabled="!connectionState.isConnected"
  :is-connected="connectionState.isConnected"
  :room-id="room.id"
  @send="handleSendMessage"
  @upload="handleUploadFile"
  @typing="handleTypingStatus"
/>
```

## 2️⃣ 用户在线/离线通知实现

### 接收服务器推送

在 ChatRoom.vue 中处理用户在线/离线事件：

```javascript
// ChatRoom.vue - 已实现的处理器

function handleSocketUserJoined(payload) {
  const roomId = payload?.roomId
  const user = payload?.user || payload
  if (!roomId || !user) return
  const userId = user.id ?? user.userId
  if (!userId) return

  store.upsertParticipant(roomId, {
    userId,
    username: user.name || user.username,
    avatar: user.avatar,
    role: user.role,
    status: 'online',
    lastSeen: new Date().toISOString()
  })

  store.setParticipantStatus(roomId, userId, 'online', {
    username: user.name || user.username,
    avatar: user.avatar,
    lastSeen: new Date().toISOString()
  })

  if (payload?.onlineCount != null) {
    store.updateConversationMeta(roomId, { onlineCount: payload.onlineCount })
  }

  // 可选：显示通知
  ElNotification({
    title: '用户上线',
    message: `${user.name || user.username} 已上线`,
    type: 'success',
    duration: 2000
  })
}

function handleSocketUserLeft(payload) {
  const roomId = payload?.roomId
  const user = payload?.user || payload
  if (!roomId || !user) return
  const userId = user.id ?? user.userId
  if (!userId) return

  store.setParticipantStatus(roomId, userId, 'offline', {
    lastSeen: new Date().toISOString()
  })

  if (payload?.onlineCount != null) {
    store.updateConversationMeta(roomId, { onlineCount: payload.onlineCount })
  }

  // 可选：显示通知
  ElNotification({
    title: '用户离线',
    message: `${user.name || user.username} 已离线`,
    type: 'info',
    duration: 2000
  })
}
```

### 在右侧栏显示在线状态

```vue
<!-- RightSidebar.vue -->

<template>
  <div class="right-sidebar">
    <div class="members-list">
      <div
        v-for="member in members"
        :key="member.userId"
        class="member-item"
        :class="{ 'is-online': member.isOnline }"
      >
        <div class="member-avatar-wrapper">
          <el-avatar
            :size="32"
            :src="member.avatar"
            class="member-avatar"
          >
            {{ member.name?.charAt(0) || '?' }}
          </el-avatar>
          <span
            v-if="member.isOnline"
            class="online-indicator"
            title="在线"
          ></span>
        </div>

        <div class="member-info">
          <div class="member-name">{{ member.name }}</div>
          <div class="member-status">
            {{ member.isOnline ? '在线' : '离线' }}
          </div>
        </div>

        <span class="member-role" v-if="member.role === 'admin'">管理员</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #67c23a;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(103, 194, 58, 0);
  }
}

.is-online {
  opacity: 1;
}

.member-item:not(.is-online) {
  opacity: 0.6;
}

.member-status {
  font-size: 12px;
  color: #999;
}
</style>
```

## 3️⃣ 消息已读回执实现

### 发送已读状态

```javascript
// ChatRoom.vue - 已实现的 watch

watch(
  () =>
    (store.activeMessages || [])
      .map((message) => `${message?.id}:${message?.status}`)
      .join('|'),
  () => {
    const conversationId = store.activeConversationId
    if (!conversationId) return

    const unreadIds = (store.activeMessages || [])
      .filter((message) => message && !message.isOwn && message.status !== 'read')
      .map((message) => message.id)

    if (!unreadIds.length) return

    store.markConversationRead(conversationId)

    if (socketService.isConnected()) {
      try {
        socketService.sendMessageRead(conversationId, unreadIds)
      } catch (error) {
        console.warn('[chat] emit read receipt failed', error)
      }
    }
  }
)
```

### 处理服务器推送的已读回执

```javascript
// ChatRoom.vue - 已实现

function handleSocketMessageRead(payload) {
  const roomId = payload?.roomId
  if (!roomId) return
  store.applyReadReceipt(roomId, {
    messageIds: payload?.messageIds,
    readerId: payload?.readerId,
    readAt: payload?.readAt
  })
}
```

### 在消息列表显示已读状态

```vue
<!-- MessageListNew.vue - 消息状态显示 -->

<template>
  <!-- 消息状态 -->
  <div v-if="msg.isOwn" class="message-status" :class="`status-${msg.status}`">
    <span v-if="msg.status === 'pending'" class="status-text">发送中...</span>
    <span v-else-if="msg.status === 'failed'" class="status-text error">发送失败</span>
    <el-icon v-else-if="msg.status === 'delivered'" class="status-icon">
      <Check />
    </el-icon>
    <el-icon v-else-if="msg.status === 'read'" class="status-icon success">
      <DoubleRight />
    </el-icon>
  </div>
</template>

<style scoped>
.message-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
}

.status-text {
  color: #999;
}

.status-text.error {
  color: #ff5f72;
}

.status-icon {
  font-size: 14px;
  color: #999;
}

.status-icon.success {
  color: #67c23a;
}
</style>
```

## 4️⃣ 在线用户列表更新

### 获取在线用户列表

```javascript
// ChatRoom.vue - 添加到 bindSocketEvents

addSocketListener('online-users-updated', handleOnlineUsersUpdated)

function handleOnlineUsersUpdated(payload) {
  if (!joinedRoomId) return
  if (payload?.count == null) return
  store.updateConversationMeta(joinedRoomId, {
    onlineCount: payload.count
  })
}
```

### 在顶部工具栏显示在线人数

```vue
<!-- TopToolbar.vue -->

<template>
  <div class="top-toolbar">
    <div class="toolbar-left">
      <el-avatar
        :size="48"
        :src="room.avatar"
        class="room-avatar"
      >
        {{ room.name?.charAt(0) || '?' }}
      </el-avatar>

      <div class="room-info">
        <div class="room-name">{{ room.name }}</div>
        <div class="room-meta">
          <!-- 在线人数 -->
          <span class="online-count">
            <el-icon class="online-dot"><Circle /></el-icon>
            {{ memberCount }} 人在线
          </span>
        </div>
      </div>
    </div>

    <div class="toolbar-right">
      <!-- 工具栏按钮 -->
    </div>
  </div>
</template>

<style scoped>
.online-dot {
  font-size: 8px;
  margin-right: 4px;
  color: #67c23a;
}

.online-count {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
}
</style>
```

## 📊 完整事件流

```
用户输入消息
  ↓
draft 值改变
  ↓
watch 检测到有内容
  ↓
handleTypingStatus() 发送 'user:typing' 事件
  ↓
[服务器广播给其他用户]
  ↓
handleSocketTyping() 接收事件
  ↓
store.handleRemoteTyping() 更新状态
  ↓
typingUsers computed 计算属性更新
  ↓
MessageInputNew 显示打字指示
  ↓
用户停止输入 (2秒后自动清理)
  ↓
打字指示消失
```

## ✅ 实现检查清单

- [ ] 打字指示器 UI 实现
- [ ] 打字指示器动画效果
- [ ] 用户上线/离线通知
- [ ] 在线状态指示器
- [ ] 消息已读回执显示
- [ ] 在线用户列表更新
- [ ] 消息状态正确转换
- [ ] 所有通知音/提示正常
- [ ] 长时间运行无内存泄漏
- [ ] 网络重连后状态正确恢复

## 📝 测试场景

### 场景 1: 多人打字指示
```
1. 用户 A 打开聊天窗口
2. 用户 B、C 分别开始输入
3. A 看到 "B 和 C 正在输入..."
4. B、C 继续输入 2 秒无输入后提示消失
✓ 预期: 打字指示准确显示和消失
```

### 场景 2: 用户上线/离线
```
1. 用户 A 在聊天页面
2. 用户 B 进入聊天页面
3. A 看到通知 "B 已上线" 和右侧栏更新
4. B 退出页面
5. A 看到通知 "B 已离线" 和右侧栏更新
✓ 预期: 所有通知和状态正确更新
```

### 场景 3: 消息已读
```
1. 用户 A 发送消息
2. 消息状态显示 "已发送" (一个勾)
3. 用户 B 查看消息
4. A 的消息状态更新为 "已读" (双勾)
✓ 预期: 状态图标正确显示
```

---

**版本**: Phase 4B
**状态**: 实现指南完成
**下一步**: 实现 Phase 5 右键菜单完善功能

