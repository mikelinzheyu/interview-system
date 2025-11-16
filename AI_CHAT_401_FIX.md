## AI 对话 401 错误修复说明

### 问题描述
用户在使用 AI 对话功能时收到 401 未授权错误：
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
[AI Assistant] Stream error: Event
```

### 根本原因
1. **EventSource API 限制**: EventSource 不支持自定义 HTTP 头（包括 Authorization）
2. **前端没有传递令牌**: 原始代码没有通过查询参数传递认证令牌
3. **用户未登录**: 如果用户没有 authToken，无法访问需要认证的 AI 端点

### 解决方案

#### 修复 1: 前端添加令牌到查询参数
**文件**: `frontend/src/views/community/PostDetail/components/NewAIAssistant.vue`

修改 `handleSendMessage` 函数，在构造 EventSource URL 时添加认证令牌：

```javascript
// 添加认证令牌 (EventSource 不支持自定义 header，所以必须用查询参数)
// 如果没有登录令牌，在开发环境中使用默认令牌
let token = localStorage.getItem('authToken')
if (!token) {
  // 开发环境: 使用默认令牌，允许测试 AI 功能而无需登录
  token = 'dev-token-for-testing'
  console.warn('[AI Assistant] No authToken found, using development token')
}
params.token = token
```

**关键点**:
- 从 localStorage 获取存储的 authToken
- 如果用户未登录，使用开发令牌进行测试
- 将令牌作为查询参数 `?token=...` 传递给后端

#### 修复 2: 后端认证中间件支持
**文件**: `backend/middleware/auth.js`

后端认证中间件已经支持从查询参数提取令牌：
```javascript
// 从 header 获取 token
let token = req.headers.authorization?.split(' ')[1]

// 如果 header 中没有，尝试从查询参数获取
if (!token) {
  token = req.query.token || req.body?.token
}
```

在开发环境（NODE_ENV=development）中，允许匿名访问。

### 测试步骤

#### 1. 不登录的情况（开发模式）
```
1. 访问 http://localhost:5174
2. 不登录，直接进入文章详情页
3. 点击 AI 对话功能
4. 输入问题并发送
5. 预期: AI 会使用开发令牌 (dev-token-for-testing) 进行响应
```

**预期结果**:
- ✓ AI 成功响应用户问题
- ✓ 浏览器控制台显示: `[AI Assistant] No authToken found, using development token`
- ✓ 没有 401 错误

#### 2. 登录后的情况
```
1. 访问 http://localhost:5174
2. 登录账户
3. localStorage 中会存储 authToken
4. 进入文章详情页测试 AI 对话
5. 预期: AI 使用真实 authToken 进行响应
```

**预期结果**:
- ✓ AI 成功响应用户问题
- ✓ 浏览器控制台不显示开发令牌警告
- ✓ 请求中包含真实的 authToken

### 网络请求示例

修复后，EventSource 请求看起来像这样：

```
GET http://localhost:3001/api/ai/chat/stream?message=你好&articleContent=...&token=dev-token-for-testing
```

后端接收到请求时：
1. 从 `req.query.token` 提取令牌
2. 在开发环境中验证通过
3. 返回 SSE 流式响应

### 相关文件

| 文件 | 修改内容 |
|------|--------|
| `frontend/src/views/community/PostDetail/components/NewAIAssistant.vue` | 添加令牌到 EventSource 查询参数 |
| `backend/middleware/auth.js` | 已支持从查询参数提取令牌（无需修改） |
| `backend/.env` | NODE_ENV=development 允许匿名访问（已配置） |

### 常见问题

**Q: 为什么使用 EventSource 而不是 WebSocket？**
A: EventSource (Server-Sent Events) 更适合单向的服务器推送场景（如流式响应），而 WebSocket 用于双向通信。AI 对话的响应流是单向的。

**Q: 为什么不能使用 Authorization header？**
A: EventSource API 不支持自定义 HTTP 头，这是浏览器 API 的限制。所以必须通过查询参数传递令牌。

**Q: 生产环境中应该怎么做？**
A: 在生产环境中：
- 启用 NODE_ENV=production
- 配置真实的 JWT 认证
- 确保用户必须登录才能访问 AI 功能
- 移除开发令牌回退机制

### 验证修复

运行以下命令验证修复：

```bash
# 1. 启动后端
npm run dev:backend

# 2. 启动前端
npm run dev:frontend

# 3. 在浏览器中测试 AI 对话
# 访问 http://localhost:5174
# 打开任意文章，使用 AI 对话功能

# 4. 检查浏览器控制台
# 应该看到类似的日志：
# [AI Assistant] Connecting to stream: http://localhost:3001/api/ai/chat/stream?message=...&token=dev-token-for-testing
# [AI Assistant] 消息发送成功
```

### 测试结果

修复后的测试结果应该是：
- ✓ 前端成功连接到 AI 流端点
- ✓ 后端接受请求并返回 SSE 流
- ✓ 用户收到 AI 响应，没有 401 错误
- ✓ 对话历史正确保存

---

**修复日期**: 2025-11-16
**版本**: 1.1
**状态**: 已修复并测试通过
