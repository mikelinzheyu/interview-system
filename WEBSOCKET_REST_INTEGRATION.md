# WebSocket-REST API 事件桥接集成指南

## 概述

事件桥接 (`eventBridge.js`) 是连接 REST API 和 WebSocket 的中间层。当 REST API 执行操作时，它会自动发出相应的 WebSocket 事件到所有连接的客户端。

## 集成方式

### 1. 导入事件桥接
在 `backend/routes/api.js` 中已导入:
```javascript
const { eventBridge } = require('../services/eventBridge')
```

### 2. 在 API 端点中调用事件桥接

#### 频道操作示例

**创建频道**:
```javascript
// 在 POST /channels 中
const channel = controllers.channel.createChannel({...})
eventBridge.broadcastChannelCreated(channel)  // 广播给所有客户端
```

**更新频道**:
```javascript
// 在 PUT /channels/:channelId 中
const channel = controllers.channel.updateChannel(...)
eventBridge.broadcastChannelUpdated(channel)
```

**删除频道**:
```javascript
// 在 DELETE /channels/:channelId 中
const success = controllers.channel.deleteChannel(channelId)
if (success) {
  eventBridge.broadcastChannelDeleted(channelId)
}
```

**添加成员**:
```javascript
// 在 POST /channels/:channelId/members 中
const success = controllers.channel.addChannelMember(channelId, userId)
if (success) {
  eventBridge.broadcastMemberAdded(channelId, userId)
}
```

#### 消息操作示例

**发送消息**:
```javascript
// 在 POST /channels/:channelId/messages 中
const message = controllers.message.sendMessage({...})
eventBridge.broadcastMessageSent(message)
```

**更新消息**:
```javascript
// 在 PUT /messages/:messageId 中
const message = controllers.message.updateMessage(...)
eventBridge.broadcastMessageUpdated(message)
```

**删除消息**:
```javascript
// 在 DELETE /messages/:messageId 中
const success = controllers.message.deleteMessage(messageId)
if (success) {
  eventBridge.broadcastMessageDeleted(messageId, message.channelId)
}
```

#### 反应操作示例

**添加反应**:
```javascript
// 在 POST /messages/:messageId/reactions 中
const reactions = controllers.message.addReaction(messageId, userId, emoji)
if (reactions) {
  eventBridge.broadcastReactionAdded(messageId, channelId, emoji, reactions)
}
```

**移除反应**:
```javascript
// 在 DELETE /messages/:messageId/reactions/:emoji 中
const reactions = controllers.message.removeReaction(messageId, userId, emoji)
if (reactions) {
  eventBridge.broadcastReactionRemoved(messageId, channelId, emoji, reactions)
}
```

#### 权限操作示例

**设置权限**:
```javascript
// 在 PUT /channels/:channelId/permissions/:userId/role 中
const permission = controllers.permission.setUserRole(userId, channelId, role)
eventBridge.broadcastPermissionChanged(channelId, userId, permission)
```

**禁言用户**:
```javascript
// 在 POST /channels/:channelId/permissions/:userId/mute 中
const permission = controllers.permission.muteUser(userId, channelId, duration)
eventBridge.broadcastUserMuted(channelId, userId, duration)
```

**踢出用户**:
```javascript
// 在 POST /channels/:channelId/permissions/:userId/kick 中
const permission = controllers.permission.kickUser(userId, channelId)
eventBridge.broadcastUserKicked(channelId, userId)
```

**封禁用户**:
```javascript
// 在 POST /channels/:channelId/permissions/:userId/ban 中
const permission = controllers.permission.banUser(userId, channelId, duration)
eventBridge.broadcastUserBanned(channelId, userId, duration)
```

## 事件桥接 API

### 频道事件
- `broadcastChannelCreated(channel)` - 频道创建
- `broadcastChannelUpdated(channel)` - 频道更新
- `broadcastChannelDeleted(channelId)` - 频道删除
- `broadcastMemberAdded(channelId, userId)` - 成员加入
- `broadcastMemberRemoved(channelId, userId)` - 成员移除

### 消息事件
- `broadcastMessageSent(message)` - 消息发送
- `broadcastMessageUpdated(message)` - 消息更新
- `broadcastMessageDeleted(messageId, channelId)` - 消息删除

### 反应事件
- `broadcastReactionAdded(messageId, channelId, emoji, reactions)` - 反应添加
- `broadcastReactionRemoved(messageId, channelId, emoji, reactions)` - 反应移除

### 权限事件
- `broadcastPermissionChanged(channelId, userId, permission)` - 权限变更
- `broadcastUserMuted(channelId, userId, duration)` - 用户禁言
- `broadcastUserKicked(channelId, userId)` - 用户踢出
- `broadcastUserBanned(channelId, userId, duration)` - 用户封禁

### 读回执事件
- `broadcastMessageRead(messageId, channelId, userId)` - 消息已读

### 加密事件
- `broadcastPublicKeyUpdated(userId, publicKey)` - 公钥更新

## 实现清单

需要在以下端点添加事件桥接调用:

### 频道 API ✓
- [ ] POST /channels - 频道创建
- [ ] PUT /channels/:channelId - 频道更新
- [ ] DELETE /channels/:channelId - 频道删除
- [ ] POST /channels/:channelId/members - 成员添加
- [ ] DELETE /channels/:channelId/members/:userId - 成员移除

### 消息 API ✓
- [ ] POST /channels/:channelId/messages - 消息发送
- [ ] PUT /messages/:messageId - 消息更新
- [ ] DELETE /messages/:messageId - 消息删除
- [ ] POST /messages/:messageId/replies - 回复发送
- [ ] POST /messages/:messageId/read - 消息已读

### 反应 API ✓
- [ ] POST /messages/:messageId/reactions - 反应添加
- [ ] DELETE /messages/:messageId/reactions/:emoji - 反应移除

### 权限 API ✓
- [ ] PUT /channels/:channelId/permissions/:userId/role - 角色更新
- [ ] POST /channels/:channelId/permissions/:userId/mute - 禁言
- [ ] POST /channels/:channelId/permissions/:userId/kick - 踢出
- [ ] POST /channels/:channelId/permissions/:userId/ban - 封禁
- [ ] DELETE /channels/:channelId/permissions/:userId/restrictions/:type - 限制移除

### 加密 API ✓
- [ ] POST /crypto/public-key - 公钥上传

## 工作流示例

### 用户 A 创建频道
```
1. 用户 A 通过 HTTP 发送 POST /api/channels
2. API 创建频道
3. eventBridge.broadcastChannelCreated(channel)
4. WebSocket 广播 channel:created 事件到所有客户端
5. 用户 B 的 WebSocket 客户端收到事件
6. 用户 B 的 UI 立即显示新频道
```

### 用户 A 在频道发送消息
```
1. 用户 A 通过 HTTP 发送 POST /api/channels/1/messages
2. API 创建消息
3. eventBridge.broadcastMessageSent(message)
4. WebSocket 广播 message:sync 事件到频道订阅者
5. 用户 B 的 WebSocket 监听器接收事件
6. 用户 B 的 UI 立即显示新消息
```

### 用户 A 添加表情反应
```
1. 用户 A 通过 HTTP 发送 POST /api/messages/1/reactions
2. API 添加反应
3. eventBridge.broadcastReactionAdded(...)
4. WebSocket 广播 reaction:added 事件
5. 所有用户立即看到新反应
```

## 重要注意事项

1. **事件广播范围**:
   - 频道事件: 广播到所有客户端
   - 消息事件: 只广播到该频道的订阅者 (`io.to(channel:${channelId})`)
   - 用户事件: 广播到所有客户端

2. **时间戳**: 所有事件都包含 `timestamp: new Date().toISOString()`

3. **日志**: 每个广播都有日志输出，便于调试

4. **错误处理**: 如果 `eventBridge` 未初始化，会自动忽略，不会影响 API 功能

## 测试事件桥接

### 使用 WebSocket 客户端监听事件
```javascript
socket.on('channel:created', (data) => {
  console.log('新频道创建:', data)
})

socket.on('message:sync', (data) => {
  console.log('新消息:', data)
})

socket.on('reaction:added', (data) => {
  console.log('新反应:', data)
})
```

### 使用 REST API 触发事件
```bash
# 创建频道（应该触发 channel:created 事件）
curl -X POST http://localhost:3001/api/channels \
  -H "Authorization: Bearer 1" \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "description": "test channel"}'
```

## 性能考虑

1. **广播优化**: 大频道的消息广播可能消耗较多资源
2. **内存使用**: 每个事件都会临时占用内存
3. **网络带宽**: 频繁的消息同步会占用带宽

建议:
- 实施消息合并
- 使用消息队列
- 实施速率限制
- 压缩 WebSocket 消息

