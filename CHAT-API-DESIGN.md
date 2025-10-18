# QQ 风格聊天中心 - 后端 API 设计规范

## 目录
- [API 规范](#api-规范)
- [会话接口](#会话接口)
- [消息接口](#消息接口)
- [用户状态接口](#用户状态接口)
- [文件上传接口](#文件上传接口)
- [WebSocket 事件](#websocket-事件)
- [错误处理](#错误处理)

---

## API 规范

### 基础设置
- **基础 URL**: `/api/chat`
- **认证**: Bearer Token (JWT)
- **请求头**: `Content-Type: application/json`
- **响应格式**: JSON

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "success": true,
  "timestamp": 1234567890
}
```

### 状态码
| 状态码 | 含义 |
|-------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 会话接口

### 1. 获取会话列表

**请求**
```http
GET /api/chat/conversations
?page=1&size=20&sort=lastMessageAt&order=desc
```

**参数**
| 参数 | 类型 | 必需 | 说明 |
|-----|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页数量，默认 20 |
| sort | String | 否 | 排序字段，默认 lastMessageAt |
| order | String | 否 | 排序顺序，asc/desc |
| search | String | 否 | 搜索关键词 |

**响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "前端开发",
        "type": "group",
        "avatar": "http://...",
        "description": "前端技术讨论",
        "memberCount": 15,
        "onlineCount": 8,
        "maxMembers": 100,
        "unreadCount": 3,
        "pinned": false,
        "isMuted": false,
        "lastMessage": {
          "id": 100,
          "content": "大家好",
          "senderName": "张三",
          "createdAt": "2024-01-20T10:30:00Z"
        },
        "lastMessageAt": "2024-01-20T10:30:00Z",
        "role": "member",
        "createdAt": "2023-12-01T00:00:00Z",
        "updatedAt": "2024-01-20T10:30:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "size": 20,
    "hasMore": true
  },
  "success": true
}
```

---

### 2. 获取会话详情

**请求**
```http
GET /api/chat/conversations/:conversationId
```

**响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "前端开发",
    "type": "group",
    "avatar": "http://...",
    "description": "前端技术讨论",
    "memberCount": 15,
    "onlineCount": 8,
    "maxMembers": 100,
    "role": "member",
    "permissions": ["sendMessage", "uploadFile"],
    "settings": {
      "messageRetentionDays": 90,
      "editableTimeLimit": 900,
      "recallTimeLimit": 120
    },
    "createdAt": "2023-12-01T00:00:00Z",
    "updatedAt": "2024-01-20T10:30:00Z"
  },
  "success": true
}
```

---

### 3. 创建会话

**请求**
```http
POST /api/chat/conversations
Content-Type: application/json

{
  "name": "前端开发",
  "type": "group",
  "description": "前端技术讨论",
  "avatar": "http://...",
  "memberIds": [1, 2, 3],
  "maxMembers": 100
}
```

**响应**
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "前端开发",
    "type": "group",
    "createdAt": "2024-01-20T10:30:00Z"
  },
  "success": true
}
```

---

### 4. 更新会话

**请求**
```http
PUT /api/chat/conversations/:conversationId
Content-Type: application/json

{
  "name": "前端开发（更新）",
  "description": "前端技术讨论和分享",
  "avatar": "http://..."
}
```

---

### 5. 置顶/取消置顶

**请求**
```http
POST /api/chat/conversations/:conversationId/pin
Content-Type: application/json

{
  "pinned": true
}
```

---

### 6. 免打扰/取消免打扰

**请求**
```http
POST /api/chat/conversations/:conversationId/mute
Content-Type: application/json

{
  "muted": true,
  "duration": 3600 // 秒，0 表示永久
}
```

---

## 消息接口

### 1. 获取消息列表

**请求**
```http
GET /api/chat/conversations/:conversationId/messages
?page=1&size=40&order=desc
```

**参数**
| 参数 | 类型 | 必需 | 说明 |
|-----|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页数量，默认 40 |
| order | String | 否 | 排序顺序，asc/desc |

**响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 100,
        "conversationId": 1,
        "content": "大家好",
        "contentType": "text",
        "senderId": 1,
        "senderName": "张三",
        "senderAvatar": "http://...",
        "status": "read",
        "attachments": [],
        "createdAt": "2024-01-20T10:30:00Z",
        "readBy": [
          { "userId": 2, "readAt": "2024-01-20T10:31:00Z" }
        ]
      }
    ],
    "total": 1000,
    "page": 1,
    "size": 40,
    "hasMore": true
  },
  "success": true
}
```

---

### 2. 发送消息

**请求**
```http
POST /api/chat/conversations/:conversationId/messages
Content-Type: application/json

{
  "content": "大家好",
  "contentType": "text",
  "attachments": [
    {
      "id": "attach-123",
      "name": "image.jpg",
      "url": "http://...",
      "type": "image/jpeg"
    }
  ],
  "quotedMessageId": 99
}
```

**响应**
```json
{
  "code": 201,
  "message": "消息已发送",
  "data": {
    "id": 101,
    "conversationId": 1,
    "content": "大家好",
    "contentType": "text",
    "senderId": 1,
    "senderName": "张三",
    "status": "delivered",
    "createdAt": "2024-01-20T10:32:00Z"
  },
  "success": true
}
```

---

### 3. 编辑消息

**请求**
```http
PUT /api/chat/conversations/:conversationId/messages/:messageId
Content-Type: application/json

{
  "content": "大家好（编辑）",
  "attachments": []
}
```

**响应**
```json
{
  "code": 200,
  "message": "编辑成功",
  "data": {
    "id": 101,
    "content": "大家好（编辑）",
    "isEdited": true,
    "editedAt": "2024-01-20T10:35:00Z"
  },
  "success": true
}
```

---

### 4. 撤回消息

**请求**
```http
POST /api/chat/conversations/:conversationId/messages/:messageId/recall
Content-Type: application/json

{
  "reason": "发错了"
}
```

---

### 5. 删除消息

**请求**
```http
DELETE /api/chat/conversations/:conversationId/messages/:messageId
```

---

### 6. 搜索消息

**请求**
```http
GET /api/chat/messages/search
?q=关键词&conversationId=1&senderId=1&startDate=2024-01-01&endDate=2024-01-31&limit=50
```

**参数**
| 参数 | 类型 | 必需 | 说明 |
|-----|------|------|------|
| q | String | 是 | 搜索关键词 |
| conversationId | Integer | 否 | 对话 ID |
| senderId | Integer | 否 | 发送者 ID |
| startDate | String | 否 | 开始日期 (ISO 8601) |
| endDate | String | 否 | 结束日期 (ISO 8601) |
| limit | Integer | 否 | 返回数量限制，默认 50 |

**响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 100,
        "conversationId": 1,
        "conversationName": "前端开发",
        "content": "关键词高亮显示",
        "contentType": "text",
        "senderName": "张三",
        "createdAt": "2024-01-20T10:30:00Z",
        "highlight": "关键词<mark>高亮显示</mark>"
      }
    ],
    "total": 10
  },
  "success": true
}
```

---

### 7. 标记消息为已读

**请求**
```http
POST /api/chat/conversations/:conversationId/mark-read
Content-Type: application/json

{
  "messageIds": [100, 101, 102]
}
```

---

## 用户状态接口

### 1. 获取用户在线状态

**请求**
```http
GET /api/chat/users/:userId/status
```

**响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "username": "zhangsan",
    "nickname": "张三",
    "status": "online",
    "customStatus": "在忙碌中...",
    "customStatusEmoji": "🎮",
    "lastSeenAt": "2024-01-20T10:32:00Z",
    "devices": [
      {
        "deviceId": "device-123",
        "platform": "web",
        "lastActiveAt": "2024-01-20T10:32:00Z",
        "location": "广州"
      }
    ]
  },
  "success": true
}
```

---

### 2. 批量获取用户状态

**请求**
```http
POST /api/chat/users/statuses
Content-Type: application/json

{
  "userIds": [1, 2, 3]
}
```

**响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "statuses": {
      "1": {
        "userId": 1,
        "status": "online",
        "lastSeenAt": "2024-01-20T10:32:00Z"
      },
      "2": {
        "userId": 2,
        "status": "away",
        "lastSeenAt": "2024-01-20T10:20:00Z"
      }
    }
  },
  "success": true
}
```

---

### 3. 更新自己的状态

**请求**
```http
PUT /api/chat/users/me/status
Content-Type: application/json

{
  "status": "busy",
  "customStatus": "在开会",
  "customStatusEmoji": "📞",
  "customStatusExpiry": "2024-01-20T12:00:00Z"
}
```

---

## 文件上传接口

### 1. 上传文件

**请求**
```http
POST /api/chat/uploads
Content-Type: multipart/form-data

file: <binary>
conversationId: 1
fileName: image.jpg
```

**响应**
```json
{
  "code": 201,
  "message": "上传成功",
  "data": {
    "id": "file-123",
    "name": "image.jpg",
    "size": 102400,
    "type": "image/jpeg",
    "url": "http://cdn.example.com/uploads/file-123",
    "previewUrl": "http://cdn.example.com/uploads/file-123-thumb",
    "uploadedAt": "2024-01-20T10:32:00Z"
  },
  "success": true
}
```

---

### 2. 删除文件

**请求**
```http
DELETE /api/chat/uploads/:fileId
```

---

## WebSocket 事件

### 连接相关事件

#### 连接成功
```javascript
socket.on('connect', () => {
  console.log('连接成功')
})
```

#### 连接失败
```javascript
socket.on('connect_error', (error) => {
  console.error('连接失败:', error)
})
```

---

### 消息相关事件

#### 发送消息
```javascript
socket.emit('send-message', {
  conversationId: 1,
  content: '大家好',
  contentType: 'text'
})
```

#### 接收消息
```javascript
socket.on('message-received', (message) => {
  // {
  //   id: 100,
  //   conversationId: 1,
  //   content: '大家好',
  //   senderName: '张三',
  //   createdAt: '2024-01-20T10:32:00Z'
  // }
})
```

#### 消息已读
```javascript
socket.on('message-read', (data) => {
  // {
  //   conversationId: 1,
  //   messageIds: [100, 101],
  //   readerId: 2,
  //   readAt: '2024-01-20T10:32:00Z'
  // }
})
```

#### 消息编辑
```javascript
socket.on('message-updated', (message) => {
  // {...消息内容, isEdited: true}
})
```

#### 消息撤回
```javascript
socket.on('message-recalled', (data) => {
  // {
  //   conversationId: 1,
  //   messageId: 100,
  //   recalledAt: '2024-01-20T10:32:00Z'
  // }
})
```

---

### 用户状态事件

#### 用户上线
```javascript
socket.on('user-online', (data) => {
  // {
  //   userId: 1,
  //   username: 'zhangsan',
  //   customStatus: '在线',
  //   lastSeenAt: '2024-01-20T10:32:00Z'
  // }
})
```

#### 用户离线
```javascript
socket.on('user-offline', (data) => {
  // {
  //   userId: 1,
  //   lastSeenAt: '2024-01-20T10:32:00Z'
  // }
})
```

#### 用户状态改变
```javascript
socket.on('user-status-changed', (data) => {
  // {
  //   userId: 1,
  //   status: 'busy',
  //   customStatus: '在忙碌中...',
  //   timestamp: 1234567890
  // }
})
```

---

### 输入状态事件

#### 用户正在输入
```javascript
socket.emit('typing-status', {
  conversationId: 1,
  isTyping: true
})

socket.on('user-typing', (data) => {
  // {
  //   conversationId: 1,
  //   userId: 1,
  //   username: 'zhangsan',
  //   isTyping: true
  // }
})
```

---

### 成员相关事件

#### 用户加入
```javascript
socket.on('user-joined', (data) => {
  // {
  //   conversationId: 1,
  //   userId: 1,
  //   username: 'zhangsan',
  //   onlineCount: 8,
  //   memberCount: 15
  // }
})
```

#### 用户离开
```javascript
socket.on('user-left', (data) => {
  // {
  //   conversationId: 1,
  //   userId: 1,
  //   username: 'zhangsan',
  //   onlineCount: 7,
  //   memberCount: 15
  // }
})
```

---

## 错误处理

### 常见错误响应

#### 400 - 参数错误
```json
{
  "code": 400,
  "message": "参数验证失败：content 不能为空",
  "success": false
}
```

#### 401 - 未授权
```json
{
  "code": 401,
  "message": "请先登录",
  "success": false
}
```

#### 403 - 禁止访问
```json
{
  "code": 403,
  "message": "您没有权限执行此操作",
  "success": false
}
```

#### 404 - 资源不存在
```json
{
  "code": 404,
  "message": "消息不存在",
  "success": false
}
```

#### 500 - 服务器错误
```json
{
  "code": 500,
  "message": "服务器内部错误",
  "success": false
}
```

---

## 速率限制

所有 API 端点都有速率限制：

- **普通用户**: 100 请求/分钟
- **高级用户**: 1000 请求/分钟
- **管理员**: 无限制

限制信息在响应头中返回：
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## 总结

这个 API 设计：

1. **RESTful 风格**: 遵循 REST 规范
2. **一致的响应格式**: 所有响应都采用统一的 JSON 格式
3. **完整的错误处理**: 提供详细的错误信息
4. **实时通信**: 使用 WebSocket 实现实时消息推送
5. **安全性**: 所有接口都需要认证，支持权限控制
6. **可扩展性**: 易于添加新功能和接口

建议实现顺序：
1. 会话管理接口 (优先级: ⭐⭐⭐)
2. 消息接口 (优先级: ⭐⭐⭐)
3. 用户状态接口 (优先级: ⭐⭐)
4. 文件上传接口 (优先级: ⭐⭐)
5. WebSocket 事件 (优先级: ⭐⭐⭐)
