# 🔗 Phase 4: WebSocket 实现完成指南

## 📋 概述

本文档记录 Phase 4 WebSocket 实时通信集成的完整实现进度。

## ✅ 已完成的工作

### 1. ChatSocketService 配置

**文件**: `frontend/src/utils/ChatSocketService.js`

✅ 已提供以下功能:
- WebSocket 连接管理
- 自动重连机制 (指数退避)
- 消息队列 (离线消息缓冲)
- 心跳检测 (30秒间隔)
- 事件监听系统
- 消息状态追踪

**关键方法**:
- `connect(userId, wsUrl)` - 初始化连接
- `send(message)` - 发送消息
- `sendChatMessage(receiverId, content)` - 发送聊天消息
- `sendGroupMessage(groupId, content)` - 发送群组消息
- `sendTypingStatus(roomId, isTyping)` - 发送打字状态
- `joinRoom(roomId)` - 加入房间
- `leaveRoom(roomId)` - 离开房间

### 2. ChatRoom.vue 中的上下文菜单功能实现

**文件**: `frontend/src/views/chat/ChatRoom.vue`

✅ 已实现以下功能处理器:

#### 回复 (handleReplyMessage)
- 存储要回复的消息信息
- 显示回复提示
- 准备回复框展示

#### 复制 (handleCopyMessage)
- 使用 Clipboard API 复制消息内容
- 降级方案支持 (兼容旧浏览器)
- 实时反馈用户操作

#### 编辑 (handleEditMessage)
- 权限检查 (仅能编辑自己的消息)
- 存储编辑状态
- 展示编辑提示

#### 撤回 (handleMessageRecall)
- 权限检查 (仅能撤回自己的消息)
- 时间限制检查 (2 分钟内)
- 调用 store.recallMessage 执行撤回
- 实时反馈用户

#### 转发 (handleForwardMessage)
- 存储要转发的消息
- 显示转发提示
- 准备转发对话框

#### 屏蔽 (handleBlockUser)
- 权限检查 (不能屏蔽自己)
- 用户确认对话框
- 添加到屏蔽列表
- 本地存储持久化
- 通过 WebSocket 通知服务器

### 3. 消息事件流集成

**关键集成点**:

```javascript
// 消息发送流
handleSendMessage(content)
  → store.sendMessage(conversationId, content)
  → 本地状态更新
  → WebSocket 消息推送

// 消息右键菜单
@contextmenu.prevent="handleContextMenu($event, msg)"
  → emit('message-action', {message, position})
  → handleMessageAction(payload)
  → 存储 selectedMessage
  → 生成菜单项
  → handleContextMenuSelect(action)
  → 对应处理函数

// 打字状态
handleTypingStatus(isTyping)
  → socketService.sendTypingStatus(roomId, isTyping)
  → 实时通知其他用户
```

## 🔌 WebSocket 事件类型已支持

### 客户端发送:
- `message:send` - 发送消息
- `group-message:send` - 发送群组消息
- `message:read` - 消息已读
- `user:typing` - 打字状态
- `user:block` - 屏蔽用户
- `room:join` - 加入房间
- `room:leave` - 离开房间
- `ping` - 心跳检测

### 服务器推送 (已处理):
- `message:status` - 消息状态更新
- `message:offline` - 离线消息
- `user:online` - 用户上线
- `user:offline` - 用户离线

## 🎯 下一步任务

### Phase 4B - 实现实时通知 (待进行)

需要实现:

1. **打字指示器**
   - 实时显示用户正在输入
   - 自动超时清理

2. **用户在线状态**
   - 上线/离线通知
   - 在线用户列表更新

3. **消息已读状态**
   - 消息已读回执
   - 已读标记显示

4. **消息状态推送**
   - 发送中 → 已发送 → 已读
   - 失败重试机制

### Phase 5 - 完善右键菜单功能 (待进行)

需要完善:

1. **回复功能**
   - 回复框 UI 实现
   - 消息引用显示
   - 回复链关系追踪

2. **编辑功能**
   - 编辑框 UI 实现
   - 编辑历史记录
   - 编辑时间戳标记

3. **转发功能**
   - 转发对话框选择
   - 转发时间戳
   - 转发来源标记

## 📊 当前系统架构

```
ChatRoom.vue (主容器)
├── TopToolbar (顶部工具栏)
├── MessageListNew (消息列表)
│   └── @message-action → handleMessageAction
├── MessageInputNew (输入框)
│   └── @send → handleSendMessage
├── RightSidebarNew (右侧栏)
├── ContextMenuNew (右键菜单)
│   └── @select → handleContextMenuSelect
└── FloatingNewMessageButton (新消息浮窗)

WebSocket 集成点:
├── socketService (socket.js)
├── ChatSocketService (ChatSocketService.js)
└── store (useChatWorkspaceStore)
```

## 💾 状态管理

### messageActionStates (响应式对象)

```javascript
{
  selectedMessage: {...},          // 当前选中的消息
  replyingTo: {...},               // 正在回复的消息
  editingMessage: {...},           // 正在编辑的消息
  messageToForward: {...},         // 要转发的消息
  blockedUsers: [...]              // 屏蔽的用户列表
}
```

## 🔍 测试清单

- [ ] 消息发送成功
- [ ] 消息复制正常
- [ ] 消息撤回时间限制正常
- [ ] 消息编辑权限检查正常
- [ ] 用户屏蔽功能正常
- [ ] WebSocket 连接自动重连
- [ ] 离线消息队列正常
- [ ] 打字状态实时更新
- [ ] 用户在线/离线通知

## 📚 相关文件位置

- 主要实现: `frontend/src/views/chat/ChatRoom.vue`
- WebSocket 服务: `frontend/src/utils/ChatSocketService.js`
- Socket 连接: `frontend/src/utils/socket.js`
- 消息列表: `frontend/src/components/chat/MessageListNew.vue`
- 上下文菜单: `frontend/src/components/chat/ContextMenu.vue`

## 🚀 启动命令

```bash
# 前端
cd frontend
npm run dev

# 后端
cd backend
node mock-server.js
```

**开发地址**: http://localhost:5175/chat/room

---

**进度**: Phase 4 集成消息收发 - 已完成上下文菜单功能
**下一步**: Phase 4 实现实时通知功能

