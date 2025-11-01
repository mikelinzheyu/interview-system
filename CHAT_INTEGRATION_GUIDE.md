# Real-Time Chat System Integration Guide

## Overview

This guide shows how to integrate the optimized chat components (MessagePanel.vue, MessageComposer.vue) with the ChatSocketService for real-time communication.

## Architecture

```
┌─────────────────────────────────────────────┐
│         ChatRoom.vue (Parent)               │
│  - Manages WebSocket lifecycle              │
│  - Coordinates component communication      │
│  - Handles message state                    │
└──────────────┬──────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼──────────┐  ┌──▼─────────────┐
│ MessagePanel   │  │ MessageComposer │
│ - Displays     │  │ - Input handling│
│   messages     │  │ - Typing status │
│ - Shows status │  │ - Attachments   │
└────────────────┘  └────────────────┘
      │                 │
      └────────┬────────┘
               │
    ┌──────────▼──────────┐
    │ ChatSocketService   │
    │ - WebSocket mgmt    │
    │ - Message queue     │
    │ - Reconnection      │
    │ - Event handling    │
    └─────────────────────┘
```

## Step 1: Import and Setup ChatSocketService in ChatRoom.vue

```javascript
import ChatSocketService from '@/utils/ChatSocketService'

export default {
  setup() {
    const socketService = ChatSocketService
    const userId = ref(null)
    const currentRoomId = ref(null)
    const messages = ref([])
    const typingUsers = ref([])

    // Connection state
    const connectionState = reactive({
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      reconnectCount: 0
    })

    return {
      socketService,
      connectionState,
      messages,
      typingUsers,
      userId,
      currentRoomId
    }
  }
}
```

## Step 2: Initialize WebSocket Connection

```javascript
async function initializeChat(user) {
  userId.value = user.id

  try {
    connectionState.isConnecting = true

    // Connect to WebSocket server
    await socketService.connect(user.id, 'ws://localhost:3001/ws/chat')

    connectionState.isConnected = true
    connectionState.isConnecting = false

    // Set up event listeners
    setupSocketListeners()

    ElMessage.success('聊天连接已建立')
  } catch (error) {
    connectionState.isConnecting = false
    connectionState.connectionError = error.message
    ElMessage.error('连接失败: ' + error.message)
  }
}

function setupSocketListeners() {
  // Handle new messages
  socketService.on('message:new', (payload) => {
    handleNewMessage(payload)
  })

  // Handle message delivery confirmation
  socketService.on('message:delivered', (payload) => {
    updateMessageStatus(payload.messageId, 'delivered')
  })

  // Handle message read confirmation
  socketService.on('message:read', (payload) => {
    updateMessageStatus(payload.messageId, 'read')
  })

  // Handle user typing
  socketService.on('user:typing', (payload) => {
    handleUserTyping(payload)
  })

  // Handle offline messages on reconnect
  socketService.on('message:offline', (offlineMessages) => {
    handleOfflineMessages(offlineMessages)
  })

  // Handle connection events
  socketService.on('connected', () => {
    connectionState.isConnected = true
    ElMessage.success('连接恢复')
  })

  socketService.on('disconnected', () => {
    connectionState.isConnected = false
    ElMessage.warning('连接已断开')
  })
}
```

## Step 3: Message Handling

```javascript
function handleNewMessage(payload) {
  const message = {
    id: payload.messageId || `msg_${Date.now()}`,
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderAvatar: payload.senderAvatar,
    content: payload.content,
    contentType: payload.contentType || 'text',
    createdAt: new Date(payload.timestamp),
    status: 'delivered',
    isOwn: payload.senderId === userId.value,
    isRecalled: false
  }

  messages.value.push(message)
}

function updateMessageStatus(messageId, status) {
  const message = messages.value.find(m => m.id === messageId)
  if (message) {
    message.status = status
  }
}

function handleOfflineMessages(offlineMessages) {
  offlineMessages.forEach(msg => {
    const existing = messages.value.find(m => m.id === msg.id)
    if (!existing) {
      handleNewMessage(msg)
    }
  })

  ElNotification({
    title: '离线消息',
    message: `收到 ${offlineMessages.length} 条离线消息`,
    type: 'info',
    duration: 2000
  })
}
```

## Step 4: Typing Indicator Handling

```javascript
const typingTimeouts = new Map()

function handleUserTyping(payload) {
  const { userId: typingUserId, isTyping } = payload

  if (typingUserId === userId.value) return // Don't show own typing

  if (isTyping) {
    // Add user to typing list if not already there
    if (!typingUsers.value.includes(typingUserId)) {
      typingUsers.value.push(typingUserId)

      // Auto-remove after timeout
      const timeout = setTimeout(() => {
        typingUsers.value = typingUsers.value.filter(id => id !== typingUserId)
      }, 3000)

      typingTimeouts.set(typingUserId, timeout)
    }
  } else {
    // Remove user from typing list
    clearTimeout(typingTimeouts.get(typingUserId))
    typingUsers.value = typingUsers.value.filter(id => id !== typingUserId)
    typingTimeouts.delete(typingUserId)
  }
}
```

## Step 5: MessageComposer Integration

```javascript
function handleMessageSend(content) {
  // Create message object
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const message = {
    id: messageId,
    senderId: userId.value,
    senderName: currentUser.value.name,
    senderAvatar: currentUser.value.avatar,
    content,
    contentType: 'text',
    createdAt: new Date(),
    status: 'pending',
    isOwn: true,
    isRecalled: false
  }

  // Add to local messages immediately (optimistic update)
  messages.value.push(message)

  // Send via WebSocket
  const success = socketService.sendChatMessage(currentRoomId.value, content, {
    messageId,
    senderName: currentUser.value.name,
    senderAvatar: currentUser.value.avatar
  })

  if (!success) {
    // Message was queued for later delivery
    message.status = 'pending'
    ElMessage.info('消息已保存，将在连接恢复后发送')
  } else {
    message.status = 'pending'
  }
}

function handleTypingStart(payload) {
  socketService.sendTypingStatus(payload.roomId, true)
}

function handleTypingStop(payload) {
  socketService.sendTypingStatus(payload.roomId, false)
}
```

## Step 6: MessagePanel Connection Status

The MessagePanel component now displays real-time connection status with the following states:

- **已连接** (Connected): Green indicator - normal messaging
- **连接中** (Connecting): Yellow indicator - initial connection
- **重新连接中** (Reconnecting): Orange indicator - reconnection attempt
- **已断开** (Disconnected): Red indicator - no connection

Update the status in your message panel props:

```javascript
<MessagePanel
  :messages="messages"
  :loading="isLoading"
  :typing-users="typingUsers"
  :connection-status="connectionState.isConnected ? 'connected' :
                      connectionState.isConnecting ? 'connecting' :
                      'disconnected'"
/>
```

## Step 7: Full ChatRoom.vue Integration Template

```vue
<template>
  <div class="chat-room">
    <header class="chat-room__header">
      <div class="chat-room__info">
        <h2>{{ chatTitle }}</h2>
        <p v-if="!connectionState.isConnected" class="chat-room__error">
          {{ connectionState.connectionError }}
        </p>
      </div>
    </header>

    <MessagePanel
      :messages="messages"
      :loading="isLoading"
      :typing-users="typingUsers"
      :has-more="hasMoreMessages"
      :allow-recall="true"
      :connection-status="getConnectionStatus()"
      @load-previous="loadPreviousMessages"
      @resend-message="handleResendMessage"
      @recall-message="handleRecallMessage"
    />

    <MessageComposer
      v-model="composerValue"
      :disabled="!connectionState.isConnected"
      :is-connected="connectionState.isConnected"
      :room-id="currentRoomId"
      @send="handleMessageSend"
      @typing-start="handleTypingStart"
      @typing-stop="handleTypingStop"
      @attachments-selected="handleAttachmentsSelected"
    />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import MessagePanel from '@/components/chat/MessagePanel.vue'
import MessageComposer from '@/components/chat/MessageComposer.vue'
import ChatSocketService from '@/utils/ChatSocketService'
import { ElMessage, ElNotification } from 'element-plus'

const socketService = ChatSocketService
const userId = ref(null)
const currentRoomId = ref(null)
const messages = ref([])
const typingUsers = ref([])
const composerValue = ref('')
const isLoading = ref(false)
const hasMoreMessages = ref(false)
const chatTitle = ref('聊天')

const connectionState = reactive({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  reconnectCount: 0
})

function getConnectionStatus() {
  if (connectionState.isConnected) return 'connected'
  if (connectionState.isConnecting) return 'connecting'
  if (connectionState.reconnectCount > 0) return 'reconnecting'
  return 'disconnected'
}

async function initializeChat() {
  userId.value = 'user_123' // Get from auth
  currentRoomId.value = 'room_456' // Get from route

  try {
    connectionState.isConnecting = true
    await socketService.connect(userId.value)
    connectionState.isConnected = true
    connectionState.isConnecting = false
    setupSocketListeners()
  } catch (error) {
    connectionState.isConnecting = false
    connectionState.connectionError = error.message
  }
}

function setupSocketListeners() {
  socketService.on('message:new', handleNewMessage)
  socketService.on('message:delivered', (p) => updateMessageStatus(p.messageId, 'delivered'))
  socketService.on('message:read', (p) => updateMessageStatus(p.messageId, 'read'))
  socketService.on('user:typing', handleUserTyping)
  socketService.on('connected', () => {
    connectionState.isConnected = true
    ElMessage.success('连接恢复')
  })
  socketService.on('disconnected', () => {
    connectionState.isConnected = false
    ElMessage.warning('连接已断开')
  })
}

function handleNewMessage(payload) {
  messages.value.push({
    id: payload.messageId,
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderAvatar: payload.senderAvatar,
    content: payload.content,
    contentType: 'text',
    createdAt: new Date(payload.timestamp),
    status: 'delivered',
    isOwn: payload.senderId === userId.value,
    isRecalled: false
  })
}

function updateMessageStatus(messageId, status) {
  const msg = messages.value.find(m => m.id === messageId)
  if (msg) msg.status = status
}

function handleUserTyping(payload) {
  if (payload.isTyping && !typingUsers.value.includes(payload.userId)) {
    typingUsers.value.push(payload.userId)
  } else if (!payload.isTyping) {
    typingUsers.value = typingUsers.value.filter(id => id !== payload.userId)
  }
}

function handleMessageSend(content) {
  const messageId = `msg_${Date.now()}`
  messages.value.push({
    id: messageId,
    senderId: userId.value,
    senderName: 'You',
    content,
    createdAt: new Date(),
    status: 'pending',
    isOwn: true,
    isRecalled: false
  })

  socketService.sendChatMessage(currentRoomId.value, content, { messageId })
  composerValue.value = ''
}

function handleTypingStart(payload) {
  socketService.sendTypingStatus(payload.roomId, true)
}

function handleTypingStop(payload) {
  socketService.sendTypingStatus(payload.roomId, false)
}

function handleAttachmentsSelected(files) {
  ElMessage.info(`选择了 ${files.length} 个文件`)
}

function loadPreviousMessages() {
  // Implement pagination
}

function handleResendMessage(message) {
  socketService.send({
    type: 'message:send',
    payload: {
      messageId: message.id,
      receiverId: currentRoomId.value,
      content: message.content
    }
  })
}

function handleRecallMessage(message) {
  socketService.send({
    type: 'message:recall',
    payload: { messageId: message.id }
  })
}

onMounted(() => {
  initializeChat()
})

onBeforeUnmount(() => {
  socketService.close()
})
</script>
```

## Key Features

### 1. Connection State Management
- Real-time connection status display
- Automatic reconnection with exponential backoff
- Message queuing during disconnection

### 2. Message Handling
- Optimistic UI updates
- Message delivery confirmation
- Read receipts tracking
- Message recall functionality

### 3. Typing Indicators
- Debounced typing status broadcast
- Real-time typing user display
- Automatic timeout handling

### 4. Offline Support
- Message queue for offline scenarios
- Automatic retry after reconnection
- Offline notification badge

### 5. Error Handling
- Connection error notification
- Graceful degradation
- Automatic reconnection attempts

## Testing Checklist

- [ ] Connect to WebSocket successfully
- [ ] Send and receive messages
- [ ] Show message delivery status
- [ ] Display typing indicators
- [ ] Handle reconnection
- [ ] Queue messages when offline
- [ ] Display connection status indicators
- [ ] Handle message recall
- [ ] Support file attachments
- [ ] Handle user presence

## Troubleshooting

### Connection Issues
```javascript
// Check connection status
console.log(socketService.getConnectionState())

// Manual reconnect
await socketService.connect(userId)

// Check message queue
console.log(socketService.messageQueue)
```

### Message Delivery
```javascript
// Monitor message status changes
socketService.on('message:status', (payload) => {
  console.log(`Message ${payload.messageId} status: ${payload.status}`)
})
```

### Performance Optimization
- Implement virtual scrolling for large message lists
- Debounce typing indicators
- Batch message updates
- Use message pagination for history

## Next Steps

1. Implement backend WebSocket server (Node.js, Spring, etc.)
2. Add database persistence
3. Implement group chat functionality
4. Add file upload support
5. Implement message search
6. Add end-to-end encryption

