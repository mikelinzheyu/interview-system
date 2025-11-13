# 🚀 Phase 4 实施计划：WebSocket 实时同步 + 后端 API 集成 + 权限系统 + 加密

**版本**: 1.0
**制定日期**: 2025-11-12
**状态**: 规划中 → 进行中
**预期完成**: 2025-11-15

---

## 📋 目录

1. [项目概述](#项目概述)
2. [核心目标](#核心目标)
3. [技术架构](#技术架构)
4. [实施阶段](#实施阶段)
5. [API 设计规范](#api-设计规范)
6. [权限系统](#权限系统)
7. [消息加密](#消息加密)
8. [实施时间表](#实施时间表)
9. [质量保证](#质量保证)

---

## 项目概述

### 背景
Phase 3 已完成 Discord 风格的三栏布局和核心 UI 功能。现在需要实施后端 API 和实时同步功能，使系统从原型化进入生产级别。

### 现状
- ✅ 前端 Phase 3 完成（布局、UI、组件）
- ✅ WebSocket 基础服务存在（socket.js）
- ✅ Mock 后端 API 框架存在（mock-server.js）
- ⚠️ 实时消息同步：部分
- ⚠️ 数据持久化：模拟数据
- ❌ 完整 API 接口：缺失
- ❌ 权限系统：缺失
- ❌ 消息加密：缺失

### 目标

| 功能 | 优先级 | 工时 | 状态 |
|------|--------|------|------|
| 增强 WebSocket 服务 | 🔥 高 | 2-3 天 | 待做 |
| 后端 API 接口 | 🔥 高 | 2-3 天 | 待做 |
| 数据持久化层 | 🔥 高 | 1-2 天 | 待做 |
| 群组权限系统 | 🔶 中 | 1.5 天 | 规划 |
| 消息加密系统 | 🔶 中 | 1 天 | 规划 |

---

## 核心目标

### 1. WebSocket 实时同步
**当前问题**: WebSocket 基础存在，但同步功能不完整

**目标功能**:
- ✅ 实时消息广播
- ✅ 用户状态同步（在线/离开/忙碌）
- ✅ 输入状态实时反馈
- ✅ 消息已读状态同步
- ✅ 频道和 DM 实时更新
- ✅ 消息反应实时更新
- ✅ 线程回复实时通知

### 2. 后端 API 集成
**当前问题**: Mock 数据缺少真正的 API 端点

**目标功能**:
- ✅ RESTful API 接口完整性
- ✅ 频道管理 API
- ✅ DM 管理 API
- ✅ 消息 CRUD API
- ✅ 线程回复 API
- ✅ 反应管理 API
- ✅ 用户关系 API
- ✅ 认证授权 API

### 3. 权限系统
**当前问题**: 无权限控制

**目标功能**:
- ✅ 角色定义（Admin, Moderator, Member, Guest）
- ✅ 频道权限（创建、编辑、删除、邀请）
- ✅ 消息权限（编辑、删除、Pin）
- ✅ DM 隐私控制
- ✅ 用户禁言/封禁
- ✅ 权限检查中间件

### 4. 消息加密
**当前问题**: 消息无加密

**目标功能**:
- ✅ 消息端到端加密（E2E）
- ✅ 密钥交换机制
- ✅ 加密存储
- ✅ 解密显示

---

## 技术架构

### 前端架构

```
src/
├─ utils/
│  └─ socket.js                    [增强] WebSocket 服务
│     ├─ 消息实时同步
│     ├─ 状态管理
│     ├─ 事件处理
│     └─ 错误恢复
├─ services/
│  ├─ api/                         [新建] API 客户端
│  │  ├─ channels.js              频道 API
│  │  ├─ messages.js              消息 API
│  │  ├─ users.js                 用户 API
│  │  └─ encryption.js            加密服务
│  └─ crypto/                      [新建] 加密工具
│     ├─ keyManagement.js         密钥管理
│     ├─ encryption.js            加密/解密
│     └─ encoding.js              编码工具
├─ composables/
│  └─ useWebSocket.js             [新建] WebSocket 组合式函数
└─ stores/
   ├─ chatWorkspace.js            [修改] 集成 WebSocket 和 API
   └─ permissions.js              [新建] 权限管理 store
```

### 后端架构

```
backend/
├─ websocket-server.js            [增强] WebSocket 事件处理
│  ├─ 消息事件
│  ├─ 状态事件
│  ├─ 通知事件
│  └─ 频道事件
├─ routes/                         [新建/增强] API 路由
│  ├─ channels.js                 频道路由
│  ├─ messages.js                 消息路由
│  ├─ users.js                    用户路由
│  ├─ dms.js                      DM 路由
│  └─ permissions.js              权限路由
├─ controllers/                    [新建] 业务逻辑
│  ├─ channelController.js        频道控制器
│  ├─ messageController.js        消息控制器
│  └─ permissionController.js     权限控制器
├─ models/                         [新建] 数据模型
│  ├─ Channel.js
│  ├─ Message.js
│  ├─ User.js
│  └─ Permission.js
└─ middleware/                     [新建/增强] 中间件
   ├─ auth.js                     认证中间件
   ├─ permission.js               权限检查中间件
   └─ validation.js               数据验证中间件
```

---

## 实施阶段

### 阶段 1：WebSocket 增强（1-2 天）

#### 1.1 增强前端 WebSocket 服务
**文件**: `frontend/src/utils/socket.js`

**添加内容**:
```javascript
// 新增事件类型
- message:sync              实时消息同步
- message:read              消息已读状态
- user:status:changed       用户状态变化
- user:presence:update      用户在线状态
- channel:created           频道创建
- channel:updated           频道更新
- channel:deleted           频道删除
- reaction:added            表情反应添加
- reaction:removed          表情反应移除
- thread:reply              线程回复
- typing:status             输入状态

// 新增方法
- syncMessage(roomId, message)
- sendReadReceipt(messageId)
- updateUserStatus(status)
- broadcastTypingStatus(roomId, isTyping)
- subscribeToChannel(channelId)
- subscribeToUser(userId)
```

**代码示例**:
```javascript
// 消息同步
syncMessage(roomId, message) {
  this.emit('message:sync', {
    roomId,
    message: {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      timestamp: message.timestamp,
      type: message.type,
      replyTo: message.replyTo
    }
  })
}

// 用户状态更新
updateUserStatus(status) {
  this.emit('user:status:changed', {
    userId: this.socket.userId,
    status,  // online, away, busy, dnd
    timestamp: new Date().toISOString()
  })
}

// 消息已读
sendReadReceipt(messageId) {
  this.emit('message:read', {
    messageId,
    readBy: this.socket.userId,
    readAt: new Date().toISOString()
  })
}
```

#### 1.2 增强后端 WebSocket 服务
**文件**: `backend/websocket-server.js`

**添加事件**:
```javascript
// 消息同步事件
io.on('message:sync', (data) => {
  // 保存到数据库
  // 广播给房间内所有用户
  io.to(`room-${data.roomId}`).emit('new-message', data.message)
})

// 用户状态事件
io.on('user:status:changed', (data) => {
  // 更新用户状态
  // 广播给所有在线用户
  io.emit('user-presence-updated', {
    userId: data.userId,
    status: data.status
  })
})

// 消息已读事件
io.on('message:read', (data) => {
  // 记录已读状态
  // 通知发件人
  io.to(`room-${messageRoomId}`).emit('message-read', data)
})
```

#### 1.3 创建 WebSocket 组合式函数
**文件**: `frontend/src/composables/useWebSocket.js`

```javascript
export function useWebSocket() {
  const socket = socketService

  // 消息同步
  const syncMessage = (roomId, message) => {
    socket.syncMessage(roomId, message)
  }

  // 监听实时消息
  const onMessageReceived = (callback) => {
    socket.on('new-message', callback)
  }

  // 监听用户状态
  const onUserStatusChanged = (callback) => {
    socket.on('user:status:changed', callback)
  }

  return {
    syncMessage,
    onMessageReceived,
    onUserStatusChanged
  }
}
```

---

### 阶段 2：后端 API 接口（2-3 天）

#### 2.1 频道管理 API

**文件**: `backend/routes/channels.js`

```javascript
// 获取所有频道
GET /api/channels
Response: { code: 200, data: { channels: [...] } }

// 创建频道
POST /api/channels
Body: { name, description, isPrivate }
Response: { code: 200, data: { channel: {...} } }

// 获取频道详情
GET /api/channels/:channelId
Response: { code: 200, data: { channel: {...} } }

// 编辑频道
PUT /api/channels/:channelId
Body: { name, description }
Response: { code: 200, data: { channel: {...} } }

// 删除频道
DELETE /api/channels/:channelId
Response: { code: 200 }

// 邀请用户加入频道
POST /api/channels/:channelId/members
Body: { userId }
Response: { code: 200 }

// 获取频道成员
GET /api/channels/:channelId/members
Response: { code: 200, data: { members: [...] } }
```

#### 2.2 消息管理 API

**文件**: `backend/routes/messages.js`

```javascript
// 获取频道消息
GET /api/channels/:channelId/messages?skip=0&limit=50
Response: { code: 200, data: { messages: [...], total: 0 } }

// 发送消息
POST /api/channels/:channelId/messages
Body: {
  content,
  type,
  replyTo,
  encryptedContent,
  encryptionKeyId
}
Response: { code: 200, data: { message: {...} } }

// 编辑消息
PUT /api/messages/:messageId
Body: { content }
Response: { code: 200, data: { message: {...} } }

// 删除消息
DELETE /api/messages/:messageId
Response: { code: 200 }

// 获取消息线程
GET /api/messages/:messageId/replies
Response: { code: 200, data: { replies: [...] } }

// 添加回复
POST /api/messages/:messageId/replies
Body: { content }
Response: { code: 200, data: { reply: {...} } }
```

#### 2.3 表情反应 API

```javascript
// 添加反应
POST /api/messages/:messageId/reactions
Body: { emoji }
Response: { code: 200 }

// 移除反应
DELETE /api/messages/:messageId/reactions/:emoji
Response: { code: 200 }

// 获取反应列表
GET /api/messages/:messageId/reactions
Response: { code: 200, data: { reactions: [...] } }
```

#### 2.4 已读状态 API

```javascript
// 标记消息已读
POST /api/messages/:messageId/read
Body: { readAt }
Response: { code: 200 }

// 获取消息已读状态
GET /api/messages/:messageId/read-receipts
Response: { code: 200, data: { receipts: [...] } }
```

#### 2.5 DM API

```javascript
// 获取所有 DM 对话
GET /api/dms
Response: { code: 200, data: { dms: [...] } }

// 创建 DM 对话
POST /api/dms
Body: { userId }
Response: { code: 200, data: { dm: {...} } }

// 获取 DM 消息
GET /api/dms/:dmId/messages
Response: { code: 200, data: { messages: [...] } }

// 发送 DM 消息
POST /api/dms/:dmId/messages
Body: { content }
Response: { code: 200, data: { message: {...} } }
```

#### 2.6 用户 API

```javascript
// 获取用户信息
GET /api/users/:userId
Response: { code: 200, data: { user: {...} } }

// 更新用户状态
PUT /api/users/status
Body: { status }
Response: { code: 200 }

// 获取用户在线状态
GET /api/users/:userId/status
Response: { code: 200, data: { status, lastSeen } }

// 搜索用户
GET /api/users/search?q=keyword
Response: { code: 200, data: { users: [...] } }
```

---

### 阶段 3：权限系统（1.5 天）

#### 3.1 权限系统设计

**角色定义**:
```javascript
const ROLES = {
  ADMIN: 'admin',              // 频道/服务器管理员
  MODERATOR: 'moderator',      // 版主
  MEMBER: 'member',            // 普通成员
  GUEST: 'guest'               // 访客
}
```

**权限矩阵**:
```
┌─────────────────────┬───────┬──────────┬────────┬───────┐
│ 权限                │ Admin │ Moderator│ Member │ Guest │
├─────────────────────┼───────┼──────────┼────────┼───────┤
│ 创建频道            │  ✅   │    ❌    │   ❌   │  ❌   │
│ 编辑频道            │  ✅   │    ✅    │   ❌   │  ❌   │
│ 删除频道            │  ✅   │    ❌    │   ❌   │  ❌   │
│ 邀请成员            │  ✅   │    ✅    │   ✅   │  ❌   │
│ 移除成员            │  ✅   │    ✅    │   ❌   │  ❌   │
│ 发送消息            │  ✅   │    ✅    │   ✅   │  ❌   │
│ 编辑自己的消息      │  ✅   │    ✅    │   ✅   │  ❌   │
│ 删除自己的消息      │  ✅   │    ✅    │   ✅   │  ❌   │
│ 删除他人的消息      │  ✅   │    ✅    │   ❌   │  ❌   │
│ Pin 消息            │  ✅   │    ✅    │   ❌   │  ❌   │
│ 禁言用户            │  ✅   │    ✅    │   ❌   │  ❌   │
│ 踢出用户            │  ✅   │    ✅    │   ❌   │  ❌   │
└─────────────────────┴───────┴──────────┴────────┴───────┘
```

#### 3.2 权限检查中间件

**文件**: `backend/middleware/permission.js`

```javascript
// 检查频道权限
async function checkChannelPermission(req, res, next) {
  const { channelId } = req.params
  const userId = req.user.id
  const action = req.action || 'view'

  const channel = await Channel.findById(channelId)
  const userRole = getUserChannelRole(userId, channelId)

  if (!hasPermission(userRole, action)) {
    return res.status(403).json({
      code: 403,
      message: 'Permission denied'
    })
  }

  next()
}

// 检查消息权限
async function checkMessagePermission(req, res, next) {
  const { messageId } = req.params
  const userId = req.user.id
  const action = req.action || 'view'

  const message = await Message.findById(messageId)

  if (action === 'delete' || action === 'edit') {
    // 只有发件人和 admin/moderator 可以
    if (message.senderId !== userId && !isChannelModerator(userId, message.channelId)) {
      return res.status(403).json({
        code: 403,
        message: 'Permission denied'
      })
    }
  }

  next()
}
```

#### 3.3 权限存储和查询

**文件**: `backend/models/Permission.js`

```javascript
// 权限数据结构
const permissionSchema = {
  id: 'uuid',
  userId: 'string',
  channelId: 'string',
  role: 'enum[admin, moderator, member, guest]',
  permissions: {
    canCreateChannel: 'boolean',
    canEditChannel: 'boolean',
    canDeleteChannel: 'boolean',
    canInviteMembers: 'boolean',
    canRemoveMembers: 'boolean',
    canSendMessages: 'boolean',
    canEditMessages: 'boolean',
    canDeleteMessages: 'boolean',
    canDeleteOthersMessages: 'boolean',
    canPinMessages: 'boolean',
    canMuteUsers: 'boolean',
    canKickUsers: 'boolean'
  },
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
}
```

---

### 阶段 4：消息加密（1 天）

#### 4.1 加密系统设计

**加密方案**: AES-256-GCM (端到端加密)

**密钥管理**:
```javascript
// 密钥交换流程
1. 用户 A 生成 ECDH 密钥对
2. 用户 A 发送公钥给用户 B
3. 用户 B 生成 ECDH 密钥对，计算共享密钥
4. 用户 B 发送公钥给用户 A
5. 用户 A 计算相同的共享密钥
6. 都使用共享密钥加密/解密消息
```

#### 4.2 前端加密实现

**文件**: `frontend/src/services/crypto/encryption.js`

```javascript
// 加密消息
export async function encryptMessage(content, sharedKey) {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    sharedKey,
    encoder.encode(content)
  )

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv)
  }
}

// 解密消息
export async function decryptMessage(encrypted, sharedKey) {
  const ciphertext = base64ToBuffer(encrypted.ciphertext)
  const iv = base64ToBuffer(encrypted.iv)

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    sharedKey,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}

// 生成密钥对
export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  )

  return keyPair
}

// 从公钥和私钥导出共享密钥
export async function deriveSharedKey(privateKey, publicKey) {
  const sharedBits = await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey
    },
    privateKey,
    256
  )

  return crypto.subtle.importKey(
    'raw',
    sharedBits,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  )
}
```

#### 4.3 后端加密验证

**文件**: `backend/middleware/encryption.js`

```javascript
// 验证消息加密
async function validateEncryption(req, res, next) {
  const { encryptedContent, encryptionKeyId } = req.body

  if (!encryptedContent || !encryptionKeyId) {
    return res.status(400).json({
      code: 400,
      message: 'Missing encryption data'
    })
  }

  // 验证密钥 ID 有效性
  const key = await EncryptionKey.findById(encryptionKeyId)
  if (!key) {
    return res.status(400).json({
      code: 400,
      message: 'Invalid encryption key'
    })
  }

  next()
}
```

---

## API 设计规范

### 请求格式

```javascript
POST /api/channels
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "general",
  "description": "General discussion",
  "isPrivate": false
}
```

### 响应格式

```javascript
{
  "code": 200,
  "message": "Success",
  "data": {
    "channel": {
      "id": "uuid",
      "name": "general",
      "description": "General discussion",
      "createdAt": "2025-11-12T10:00:00Z",
      "creator": { ... }
    }
  }
}
```

### 错误处理

```javascript
{
  "code": 400,
  "message": "Invalid request",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

---

## 权限系统

### 权限检查流程

```
请求 → 认证 → 授权 → 业务逻辑 → 响应
              ↑
        检查用户角色
        检查频道权限
        检查资源所有权
```

### 权限注解

```javascript
// 快速权限检查
@RequireRole('admin', 'moderator')
@RequirePermission('canDeleteMessages')
deleteMessage(req, res) {
  // ...
}
```

---

## 消息加密

### 加密流程

```
明文消息
  ↓
生成随机 IV
  ↓
使用 AES-256-GCM 加密
  ↓
生成 Base64 编码
  ↓
记录加密密钥 ID
  ↓
发送加密消息
```

### 解密流程

```
加密消息
  ↓
查找密钥 ID
  ↓
加载共享密钥
  ↓
解析 Base64
  ↓
使用 AES-256-GCM 解密
  ↓
显示明文消息
```

---

## 实施时间表

### Week 1 (2025-11-12 ~ 11-15)

| 日期 | 任务 | 预期工时 | 优先级 |
|------|------|---------|--------|
| 11-12 | WebSocket 增强 | 4h | 🔥 |
| 11-13 | 后端 API (频道、消息) | 6h | 🔥 |
| 11-14 | API 集成和测试 | 4h | 🔥 |
| 11-15 | 权限系统规划 | 2h | 🔶 |
| 11-15 | 加密系统规划 | 2h | 🔶 |

### Week 2+ (2025-11-18+)

| 日期 | 任务 | 预期工时 | 优先级 |
|------|------|---------|--------|
| 11-18 | 权限系统实现 | 5h | 🔶 |
| 11-19 | 加密系统实现 | 4h | 🔶 |
| 11-20 | 完整测试和优化 | 4h | 🔷 |
| 11-21 | Phase 4 发布准备 | 2h | 🔷 |

---

## 质量保证

### 测试策略

#### 单元测试
```javascript
// 测试加密/解密
test('encryptMessage should encrypt and decrypt correctly', async () => {
  const message = 'Hello World'
  const key = await generateSharedKey()
  const encrypted = await encryptMessage(message, key)
  const decrypted = await decryptMessage(encrypted, key)
  expect(decrypted).toBe(message)
})

// 测试权限检查
test('checkChannelPermission should deny non-members', () => {
  const user = { id: 'user1' }
  const channel = { id: 'channel1', members: ['user2'] }
  expect(hasChannelAccess(user, channel)).toBe(false)
})
```

#### 集成测试
```javascript
// 测试完整消息流
test('send encrypted message and sync in real-time', async () => {
  const message = 'Secret message'
  const encrypted = await encryptMessage(message, sharedKey)
  const response = await sendMessage(channelId, encrypted)

  // 验证 WebSocket 接收
  const received = await waitForWebSocketEvent('new-message')
  const decrypted = await decryptMessage(received.message, sharedKey)
  expect(decrypted).toBe(message)
})
```

#### 性能测试
```javascript
// 加密性能测试
benchmark('encryptMessage', async () => {
  for (let i = 0; i < 1000; i++) {
    await encryptMessage('test message', key)
  }
  // 应该在 < 1s 内完成
})
```

### 验收标准

| 功能 | 验收标准 | 优先级 |
|------|---------|--------|
| WebSocket 实时同步 | 消息延迟 < 100ms | 🔥 |
| API 接口完整性 | 所有端点覆盖 | 🔥 |
| 权限检查 | 无未授权访问 | 🔥 |
| 消息加密 | 端到端加密正确 | 🔶 |
| 性能 | 加密 < 10ms/msg | 🔶 |

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| WebSocket 连接不稳定 | 消息丢失 | 实现消息队列和重试机制 |
| API 性能瓶颈 | 用户体验差 | 实现缓存和数据库优化 |
| 加密密钥泄露 | 消息被读 | 使用密钥轮换和存储加密 |
| 权限检查遗漏 | 安全漏洞 | 完整的代码审查和测试 |

---

## 后续计划

### Phase 5（计划中）
- 群组管理高级功能
- 文件上传和分享
- 语音/视频通话
- 消息搜索优化

### Phase 6+（远期规划）
- AI 助手集成
- 消息自动翻译
- 内容审核
- 分析和报告

---

## 附录

### A. 技术栈

- **前端**: Vue 3, Pinia, Socket.IO Client, Element Plus
- **后端**: Node.js, Express, Socket.IO, (可选) MongoDB
- **加密**: Web Crypto API, ECDH, AES-GCM
- **认证**: JWT tokens

### B. 参考文档

- Socket.IO 文档: https://socket.io/docs/
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- OWASP 加密存储: https://cheatsheetseries.owasp.org/
- RESTful API 设计: https://restfulapi.net/

---

**制定人**: Claude Code Assistant
**审批状态**: ⏳ 待执行
**最后更新**: 2025-11-12
