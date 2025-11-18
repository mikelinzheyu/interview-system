# 浏览器控制台错误解决方案

## 问题摘要

当前系统存在以下问题，导致前端无法正常加载数据：

1. **HTTP 500 错误** - API 请求失败
2. **WebSocket 连接失败** - Socket.IO 无法连接
3. **AI 助手服务连接失败** - 使用了占位符 URL

---

## 详细问题分析

### 问题 1: HTTP 500 错误和 WebSocket 连接失败

**错误日志：**
```
GET http://localhost:5174/api/community/posts/20/collection net::ERR_ABORTED 500
WebSocket connection to 'ws://localhost:5174/socket.io/?EIO=4&transport=websocket' failed
```

**根本原因：**
- 后端服务（应该在 `http://localhost:3001` 上运行）未启动
- Vite 前端开发服务器在 `http://localhost:5174` 运行
- Vite 配置中代理 `/api` 到 `http://localhost:3001`，但后端服务未运行

**当前架构：**
```
前端 (localhost:5174)
    ├─ /api 请求 → 代理到 localhost:3001 (后端) ❌ 未运行
    └─ WebSocket → 尝试连接到 localhost:5174 并代理到后端
```

### 问题 2: AI 助手服务连接失败

**错误日志：**
```
[AI Assistant] Connecting to stream: https://your-production-api.com/api/ai/chat/stream...
Stream error: net::ERR_CONNECTION_CLOSED
```

**根本原因：**
- 代码中使用了占位符 URL `your-production-api.com`
- 应该使用相对 URL `/api` 或配置的后端 URL

**问题代码位置：**
- 文件：`frontend/src/views/community/PostDetail/components/NewAIAssistant.vue` 第 177-178 行
- 当前逻辑：使用 `VITE_API_BASE_URL` 环境变量或默认为 `http://localhost:3001`

---

## 解决方案

### 步骤 1: 启动后端服务

**方式 A：使用启动脚本（Windows）**
```bash
# 直接运行创建的脚本
D:\code7\interview-system\START_BACKEND.cmd
```

**方式 B：手动启动**
```bash
cd D:\code7\interview-system\backend
npm install --legacy-peer-deps
npm start
```

**验证后端启动成功：**
```bash
curl http://localhost:3001/health
# 应该返回：
# {
#   "code": 200,
#   "message": "API server is running"
# }
```

### 步骤 2: 启动前端开发服务器

**方式 A：使用启动脚本（Windows）**
```bash
# 在另一个终端运行
D:\code7\interview-system\START_FRONTEND.cmd
```

**方式 B：手动启动**
```bash
cd D:\code7\interview-system\frontend
npm install
npm run dev
```

**前端应该在 `http://localhost:5174` 运行**

### 步骤 3: 验证配置

检查 `frontend/vite.config.js` 中的代理配置（已正确配置）：
```javascript
const proxyTarget = 'http://localhost:3001'  // ✅ 正确指向后端

server: {
  proxy: {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
      rewrite: (path) => path  // 保持路径不变
    }
  }
}
```

### 步骤 4: 验证 AI 助手 URL 配置

文件：`frontend/src/views/community/PostDetail/components/NewAIAssistant.vue`

当前代码（第 177-178 行）已正确配置：
```javascript
const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const url = new URL('/api/ai/chat/stream', backendUrl)
```

✅ **已解决**：代码使用环境变量或默认后端 URL，不再使用占位符

---

## 完整启动流程

### 推荐流程：

1. **打开终端 1 - 启动后端**
   ```bash
   D:\code7\interview-system\START_BACKEND.cmd
   ```
   等待看到：
   ```
   ╔════════════════════════════════════════════════════════════╗
   ║          🚀 Backend Server 已启动                          ║
   ║  HTTP API  : http://localhost:3001/api                    ║
   │  WebSocket : ws://localhost:3001                         ║
   ╚════════════════════════════════════════════════════════════╝
   ```

2. **打开终端 2 - 启动前端**
   ```bash
   D:\code7\interview-system\START_FRONTEND.cmd
   ```
   等待看到：
   ```
   VITE v5.x.x  ready in XXX ms

   ➜  Local:   http://localhost:5174/
   ➜  press h + enter to show help
   ```

3. **打开浏览器**
   访问 `http://localhost:5174`

---

## 预期结果

启动成功后，您应该看到：

✅ **API 请求正常**
- 文章、热门文章、归档等数据正常加载
- 不再出现 500 错误

✅ **WebSocket 连接正常**
- 实时消息更新
- 不再有连接失败日志

✅ **AI 助手功能正常**
- 能够发送消息给 AI
- 能够接收流式响应
- 打字机效果正常工作

---

## 常见问题排查

### Q1: 后端启动失败

**检查事项：**
- Node.js 是否安装？运行 `node --version`
- 端口 3001 是否被占用？运行 `netstat -ano | findstr :3001`
- 依赖是否安装？运行 `npm install --legacy-peer-deps`
- 是否有错误信息？检查终端输出

### Q2: 前端请求仍然返回 500

**解决步骤：**
1. 确认后端已启动：`curl http://localhost:3001/health`
2. 检查后端日志是否有错误
3. 检查数据库连接是否成功
4. 清除浏览器缓存：`Ctrl+Shift+Delete`，然后刷新页面

### Q3: WebSocket 连接仍然失败

**解决步骤：**
1. 检查后端 WebSocket 初始化日志
2. 确认防火墙没有阻止 WebSocket 连接
3. 检查浏览器是否支持 WebSocket（通常都支持）

### Q4: AI 助手仍然无法使用

**检查事项：**
- 确认后端在运行
- 检查 `/api/ai/chat/stream` 端点是否可访问
- 检查浏览器控制台中的 EventSource URL 是否正确

---

## 环境变量配置（可选）

如果需要自定义后端 URL，可以创建 `.env` 文件：

**backend/.env**
```
PORT=3001
```

**frontend/.env**
```
# 开发环境下不需要设置，默认使用 localhost:3001
# VITE_API_BASE_URL=http://localhost:3001
```

---

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器客户端                          │
│                 (localhost:5174)                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP + WebSocket
                 │ (/api 代理)
                 ↓
┌─────────────────────────────────────────────────────────┐
│               Vite 开发服务器                           │
│                 (localhost:5174)                        │
│    代理规则：/api → http://localhost:3001               │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ 代理转发
                 ↓
┌─────────────────────────────────────────────────────────┐
│                Express API 服务器                       │
│                  (localhost:3001)                       │
│    - REST API 端点 (/api/...)                          │
│    - WebSocket 服务器 (Socket.IO)                      │
│    - 数据库连接                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 下一步

1. ✅ 使用上述脚本启动前后端
2. ✅ 在浏览器中访问应用并测试基本功能
3. ✅ 检查浏览器控制台确认没有错误
4. ✅ 测试 AI 助手功能

如果仍有问题，请检查：
- 后端终端输出的错误日志
- 浏览器开发工具 (F12) 的 Network 和 Console 选项卡
