# WebSocket Real-Time Messaging Implementation (Phase 2)

## Overview

This document describes the complete WebSocket implementation for real-time private messaging in the interview system. The system uses Socket.IO for bidirectional communication between frontend and backend.

## Architecture

### Backend (Node.js + Socket.IO)

#### WebSocket Server (`backend/websocket-server.js`)

The WebSocket server handles all real-time communication using Socket.IO. Key features:

- **Authentication**: JWT token verification in middleware
- **Connection Management**: Tracks online users with `onlineUsers` Map
- **Room Management**: Conversation rooms using Socket.IO rooms (`conversation-{id}`)
- **Message Broadcasting**: Real-time message delivery to conversation participants

#### Event Handlers

##### Private Messaging Events

```javascript
// Join conversation room
socket.on('join-conversation', (data) => {
  const { conversationId } = data
  socket.join(`conversation-${conversationId}`)
  // Notify other users in conversation about online status
  socket.to(`conversation-${conversationId}`).emit('user-online-status', {
    userId: socket.userId,
    isOnline: true,
    timestamp: new Date().toISOString()
  })
})

// Leave conversation room
socket.on('leave-conversation', (data) => {
  const { conversationId } = data
  socket.leave(`conversation-${conversationId}`)
  // Notify other users about offline status
  socket.to(`conversation-${conversationId}`).emit('user-online-status', {
    userId: socket.userId,
    isOnline: false,
    timestamp: new Date().toISOString()
  })
})

// Send private message
socket.on('send-private-message', (data) => {
  const { conversationId, content, messageId } = data
  const message = {
    id: messageId,
    conversationId,
    senderId: socket.userId,
    content,
    type: 'text',
    status: 'delivered',
    createdAt: new Date().toISOString()
  }
  // Broadcast to all users in conversation
  io.to(`conversation-${conversationId}`).emit('private-message', message)
})

// Mark message as read
socket.on('mark-message-read', (data) => {
  const { conversationId, messageId } = data
  io.to(`conversation-${conversationId}`).emit('message-read', {
    messageId,
    readBy: socket.userId,
    readAt: new Date().toISOString()
  })
})

// Typing indicator
socket.on('typing-indicator', (data) => {
  const { conversationId, isTyping } = data
  socket.to(`conversation-${conversationId}`).emit('user-typing', {
    userId: socket.userId,
    isTyping,
    timestamp: new Date().toISOString()
  })
})

// Mark entire conversation as read
socket.on('mark-conversation-read', (data) => {
  const { conversationId } = data
  io.to(`conversation-${conversationId}`).emit('conversation-read', {
    conversationId,
    readBy: socket.userId,
    readAt: new Date().toISOString()
  })
})
```

#### Event Bridge (`backend/services/eventBridge.js`)

The EventBridge connects REST API operations to WebSocket events. New methods for private messaging:

```javascript
// Broadcast private message to conversation
broadcastPrivateMessage(conversationId, message)

// Broadcast message read status
broadcastPrivateMessageRead(conversationId, messageId, userId)

// Broadcast conversation read status
broadcastConversationRead(conversationId, userId)

// Broadcast typing status
broadcastUserTyping(conversationId, userId, isTyping)

// Broadcast online status
broadcastUserOnlineStatus(conversationId, userId, isOnline)
```

### Frontend (Vue 3 + Socket.IO Client)

#### WebSocket Composable (`frontend/src/composables/useWebSocket.js`)

The composable manages Socket.IO connection and provides methods for real-time operations.

**Key Methods:**

```javascript
// Connection management
connect()        // Establish WebSocket connection
disconnect()     // Close connection
reconnect()      // Reconnect with reset state

// Conversation management
joinConversation(conversationId)      // Join conversation room
leaveConversation(conversationId)     // Leave conversation room

// Message operations
sendPrivateMessage(conversationId, content, messageId)
markMessageAsRead(conversationId, messageId)
markConversationAsRead(conversationId)

// User status
sendTypingIndicator(conversationId, isTyping)

// Generic
sendMessage(type, payload)  // Send custom message type
```

**Event Listeners:**

```javascript
socket.on('connect')              // Connection established
socket.on('disconnect')           // Connection closed
socket.on('reconnect')            // Successfully reconnected
socket.on('reconnect_attempt')    // Attempting reconnection

// Private messaging events
socket.on('private-message', (message))        // New message received
socket.on('message-read', (data))              // Message read notification
socket.on('conversation-read', (data))         // Conversation read notification
socket.on('user-typing', (data))               // User typing indicator
socket.on('user-online-status', (data))        // User online/offline status

// Custom ping/pong
socket.on('pong', (data))         // Pong response
socket.on('error', (error))       // Connection error
```

**Connection Options:**

```javascript
{
  auth: {
    token,      // JWT token or user ID
    userId      // Current user ID
  },
  reconnection: true,
  reconnectionDelay: 1000,           // Initial delay: 1s
  reconnectionDelayMax: 5000,        // Max delay: 5s
  reconnectionAttempts: 5            // Max attempts: 5
}
```

#### Component Integration

**ChatWindow.vue:**

```javascript
onMounted(async () => {
  await loadConversation()
  // Join WebSocket conversation room
  joinConversation(props.conversationId)
})

onUnmounted(() => {
  // Leave conversation room when component unmounts
  leaveConversation(props.conversationId)
})
```

**ConversationDialog.vue:**

```javascript
watch(
  () => visible.value,
  async (newVal) => {
    if (newVal && props.otherUserId) {
      await loadConversation()
      // Join conversation room when dialog opens
      joinConversation(conversationId)
    } else if (!newVal && conversationId) {
      // Leave conversation room when dialog closes
      leaveConversation(conversationId)
    }
  }
)
```

### Message Flow

#### Sending a Message

1. **Frontend**: User types message and clicks send
2. **Frontend**: `ChatInput` emits message content
3. **Frontend**: `messagingStore.sendMessage()` creates optimistic local message
4. **Frontend**: Sends REST API request to POST `/api/messages/conversations/{id}/messages`
5. **Backend**: Creates message in database and broadcasts via `eventBridge.broadcastPrivateMessage()`
6. **WebSocket**: Backend sends `private-message` event to `conversation-{id}` room
7. **Frontend**: `useWebSocket` receives `private-message` event
8. **Frontend**: `messagingStore.addMessageFromSocket()` updates messages list
9. **UI**: Message displays with "delivered" status

#### Reading a Message

1. **Frontend**: Message visible in viewport
2. **Frontend**: `ChatWindow` detects message visibility
3. **Frontend**: Sends REST API request to POST `/api/messages/{messageId}/read`
4. **Backend**: Creates read receipt and broadcasts via `eventBridge.broadcastPrivateMessageRead()`
5. **WebSocket**: Backend sends `message-read` event to `conversation-{id}` room
6. **Frontend**: `useWebSocket` receives `message-read` event
7. **Frontend**: Updates message status to "read" and shows checkmark

#### Typing Indicator

1. **Frontend**: User starts typing in `ChatInput`
2. **Frontend**: Emits `sendTypingIndicator(conversationId, true)`
3. **WebSocket**: Sends `typing-indicator` event to server
4. **Backend**: Broadcasts `user-typing` event to conversation room
5. **Frontend**: Other user's `useWebSocket` receives event
6. **UI**: Shows "User is typing..." indicator

## Data Structures

### Message

```javascript
{
  id: 'unique-id',
  conversationId: 1,
  senderId: 1,
  content: 'Message text',
  type: 'text',
  status: 'sent|delivered|read|failed',  // Message delivery status
  createdAt: '2024-11-16T10:30:00Z',
  readBy: 2,          // User ID who read the message
  readAt: '2024-11-16T10:31:00Z'
}
```

### Conversation

```javascript
{
  id: 1,
  participantIds: [1, 2],
  createdAt: '2024-11-16T10:00:00Z',
  lastMessage: 'Last message preview',
  lastMessageTime: '2024-11-16T10:30:00Z',
  unreadCount: { 1: 3, 2: 0 }  // Unread count per user
}
```

### WebSocket Events

#### Client → Server

```javascript
// Join conversation
{
  type: 'join-conversation',
  data: { conversationId }
}

// Send message
{
  type: 'send-private-message',
  data: { conversationId, content, messageId }
}

// Mark message read
{
  type: 'mark-message-read',
  data: { conversationId, messageId }
}

// Mark conversation read
{
  type: 'mark-conversation-read',
  data: { conversationId }
}

// Typing status
{
  type: 'typing-indicator',
  data: { conversationId, isTyping }
}
```

#### Server → Client

```javascript
// New message
{
  type: 'private-message',
  data: { id, conversationId, senderId, content, status, createdAt }
}

// Message read
{
  type: 'message-read',
  data: { messageId, readBy, readAt }
}

// User typing
{
  type: 'user-typing',
  data: { userId, isTyping, timestamp }
}

// User online status
{
  type: 'user-online-status',
  data: { userId, isOnline, timestamp }
}
```

## Implementation Status

### Completed (Phase 2)

- ✅ Socket.IO server setup
- ✅ Private messaging event handlers
- ✅ Conversation room management
- ✅ Frontend Socket.IO client composable
- ✅ Component integration (ChatWindow, ConversationDialog)
- ✅ Message delivery status tracking
- ✅ Read receipt implementation
- ✅ Typing indicators
- ✅ Online status synchronization
- ✅ Reconnection logic with exponential backoff
- ✅ EventBridge integration for REST → WebSocket sync

### Pending (Phase 3+)

- 📋 Message encryption/decryption
- 📋 File/image sharing via WebSocket
- 📋 Conversation notifications
- 📋 Message search with WebSocket sync
- 📋 User presence indicators
- 📋 Draft message synchronization

## Testing Checklist

### Basic Functionality

- [ ] User connects to WebSocket on app load
- [ ] User joins conversation room on open
- [ ] User leaves conversation room on close
- [ ] Messages display in real-time
- [ ] Typing indicators show in real-time
- [ ] Online status updates in real-time
- [ ] Read receipts update in real-time

### Connection Handling

- [ ] Disconnects gracefully on logout
- [ ] Reconnects automatically on network restore
- [ ] Handles network interruptions
- [ ] Exponential backoff works correctly
- [ ] Max reconnection attempts respected

### Edge Cases

- [ ] Handles simultaneous message sends
- [ ] Handles rapid typing indicators
- [ ] Handles connection loss during message send
- [ ] Handles race conditions between REST and WebSocket

## Configuration

### Backend

**Environment Variables:**
```
WEBSOCKET_PORT=3001
WEBSOCKET_URL=ws://localhost:3001
MAX_RECONNECT_ATTEMPTS=5
RECONNECT_DELAY=3000
```

### Frontend

**Socket.IO Configuration:**
```javascript
{
  auth: {
    token: localStorage.getItem('token'),
    userId: userStore.user.id
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
}
```

## Performance Considerations

1. **Memory**: Online users Map grows with concurrent connections
2. **CPU**: Message broadcasting scales with participants
3. **Network**: Each message is broadcast to all conversation participants
4. **Storage**: MessageBridge queues events for sync

## Security

- Socket.IO middleware validates JWT tokens
- User authorization checked before sending messages
- Conversation access verified on room join
- XSS prevention through Vue template escaping
- CSRF tokens sent with REST requests

## Debugging

### Enable WebSocket Logs

```javascript
// In browser console
localStorage.setItem('debug', 'socket.io-client:*')
// Reload page
```

### Check Server Logs

```bash
# Look for WebSocket connection logs
[WebSocket] 用户 1 已连接 (socket-id)
[WebSocket] 用户 1 加入对话 1
[WebSocket] 用户 1 在对话 1 发送私信
```

### Network Tab

1. Open DevTools → Network Tab
2. Filter for "ws" or "wss"
3. Click WebSocket connection
4. View Messages tab for events
5. Analyze frame timing and data

## Future Enhancements

- [ ] Message queue for offline users
- [ ] Conversation history pagination
- [ ] Message search with full-text indexing
- [ ] User typing with draft saving
- [ ] Read receipts for groups
- [ ] End-to-end encryption
- [ ] File attachments
- [ ] Voice/video calling
