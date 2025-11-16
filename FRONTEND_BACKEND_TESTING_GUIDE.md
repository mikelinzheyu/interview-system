# 前后端联调测试指南 - 私信功能

## 📋 系统要求
- Node.js >= 18.0.0
- npm >= 8.0.0

## 🚀 启动步骤

### 1. 启动后端服务（Express + WebSocket）

打开终端/PowerShell，执行：

```bash
cd D:\code7\interview-system\backend
npm install  # 首次运行需要安装依赖
npm start    # 启动后端服务器
```

**预期输出：**
```
🚀 正在启动后端服务器...
[Init] 正在初始化数据层...
[Init] 正在初始化 WebSocket...
[Init] 正在初始化事件桥接...

╔════════════════════════════════════════════════════════════╗
║          🚀 Backend Server 已启动                          ║
╠════════════════════════════════════════════════════════════╣
║  HTTP API  : http://localhost:3001/api                    ║
║  WebSocket : ws://localhost:3001                         ║
║  Health    : http://localhost:3001/health                ║
╚════════════════════════════════════════════════════════════╝
```

✅ 后端已启动完成

### 2. 启动前端服务（Vue 3 + Vite）

打开**另一个**终端/PowerShell，执行：

```bash
cd D:\code7\interview-system\frontend
npm install  # 首次运行需要安装依赖
npm run dev  # 启动前端开发服务器
```

**预期输出：**
```
VITE v4.4.9  ready in 1234 ms

➜  Local:   http://localhost:5174/
➜  Press h to show help
```

✅ 前端已启动完成

---

## 🧪 私信功能测试

### 测试步骤

1. **打开浏览器**
   - 访问 http://localhost:5174/community/posts/20

2. **进行私信操作**
   - 在左侧找到作者卡片
   - 点击私信按钮（消息图标）
   - 应该看到对话框弹出

3. **发送测试消息**
   - 在对话框中输入消息
   - 按 Ctrl+Enter 或点击发送按钮
   - 消息应该立即显示

### 🔍 调试信息检查

打开浏览器开发者工具（F12），查看 **Console** 标签：

**预期看到的日志：**

```javascript
// AuthorCard 组件
[AuthorCard] handleMessage called {
  authorUserId: "user11",
  author: { userId: "user11", name: "杨十三", avatar: "..." }
}

// PostDetail 组件
[PostDetail] handleMessage called {
  data: { userId: "user11" },
  author: { userId: "user11", name: "杨十三", ... }
}

[PostDetail] Dialog state updated {
  messageTargetUserId: "user11",
  messageTargetUser: { userId: "user11", name: "杨十三", ... },
  showMessageDialog: true
}

// ConversationDialog 组件
[ConversationDialog] visible changed {
  visible: true,
  otherUserId: "user11",
  otherUser: { userId: "user11", name: "杨十三", ... }
}

// 消息发送成功
[ConversationDialog] Send message error: 对话不存在
// 这是正常的，因为第一次加载时对话未创建
```

---

## 📡 API 端点测试

### 1. 创建或获取对话

```bash
curl -X POST http://localhost:3001/api/messages/conversations \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{"otherUserId": 2}'
```

**预期响应：**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "participantIds": [1, 2],
    "createdAt": "2024-11-16T...",
    "lastMessage": null,
    "lastMessageTime": null,
    "unreadCount": {}
  },
  "message": "对话已创建"
}
```

### 2. 发送私信

```bash
curl -X POST http://localhost:3001/api/messages/conversations/1/messages \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "content": "Hello, this is a test message",
    "type": "text"
  }'
```

**预期响应：**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "conversationId": 1,
    "senderId": 1,
    "content": "Hello, this is a test message",
    "type": "text",
    "status": "sent",
    "createdAt": "2024-11-16T..."
  },
  "message": "消息已发送"
}
```

### 3. 获取对话中的消息

```bash
curl http://localhost:3001/api/messages/conversations/1/messages \
  -H "x-user-id: 1"
```

### 4. 标记消息已读

```bash
curl -X POST http://localhost:3001/api/messages/1/read \
  -H "x-user-id: 1"
```

---

## ⚠️ 常见问题排查

### 问题 1：后端无法启动

**错误信息：** `Error: Cannot find module 'express'`

**解决方案：**
```bash
cd backend
npm install
```

### 问题 2：前端无法连接到后端

**错误信息：** 在 Network 标签中看到 `GET /api/messages/conversations` 返回 404

**排查步骤：**
1. 确保后端正在运行：`curl http://localhost:3001/api/health`
2. 检查前端 `.env.development` 中的 `VITE_API_BASE_URL` 是否为 `http://localhost:3001/api`
3. 检查浏览器开发者工具 Network 标签中的请求 URL

### 问题 3：对话框没有出现

**排查步骤：**
1. 打开浏览器开发者工具 → Console 标签
2. 点击私信按钮
3. 查看是否有错误日志
4. 检查 `author.userId` 是否为 `undefined`

### 问题 4：WebSocket 连接失败

**排查步骤：**
1. 打开浏览器开发者工具 → Network 标签
2. 筛选 "WS" 类型
3. 查看 WebSocket 连接状态
4. 检查是否连接到 `ws://localhost:3001`

---

## 🧹 清理和重启

### 完全重启

```bash
# 关闭所有服务（Ctrl+C）

# 清理前端缓存
cd frontend && npm run clean

# 清理后端缓存
cd ../backend && rm -rf node_modules

# 重新安装依赖
npm install && cd ../frontend && npm install

# 重新启动
# 后端：cd backend && npm start
# 前端：cd frontend && npm run dev
```

---

## 📊 测试检查清单

- [ ] 后端服务正常启动
- [ ] 前端服务正常启动
- [ ] 浏览器无 CORS 错误
- [ ] 点击私信按钮显示对话框
- [ ] 可以输入消息
- [ ] 可以发送消息
- [ ] 消息立即显示在对话框中
- [ ] WebSocket 连接成功
- [ ] 浏览器 Console 中无错误

---

## 📝 日志说明

### 后端日志格式
```
[ISO-TIME] METHOD PATH
[WebSocket] 事件描述
[EventBridge] 广播事件
```

### 前端日志格式
```
[ComponentName] 操作描述 { 相关数据 }
```

---

## 🎯 验证成功标志

✅ **完整的测试流程应该包括：**

1. ✅ 后端服务启动成功
2. ✅ 前端服务启动成功
3. ✅ 页面加载时 WebSocket 连接建立
4. ✅ 点击私信按钮，对话框出现
5. ✅ 输入消息，点击发送
6. ✅ 消息显示在对话框中
7. ✅ 没有 JavaScript 错误
8. ✅ 没有网络错误（HTTP 200）

如果所有检查都通过，说明私信功能已经正常工作！🎉
