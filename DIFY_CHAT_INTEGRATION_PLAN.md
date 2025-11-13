# Dify 聊天工作流集成 - 最佳实践方案

**目标**: 在 http://localhost:5174/community/posts/1 页面的 **AI问答** Tab 中接入新的 Dify 聊天工作流

**时间**: 2025-11-13
**状态**: 设计阶段（方案阶段，待审批）

---

## 📋 需求分析

### 新工作流特征
```
类型: Chat 聊天应用（而非 Workflow）
API URL: https://api.dify.ai/v1
API 密钥: app-LzqvkItq6QOd0PH2VwXL3P16
公开访问: https://udify.app/chat/NF8mUftOYiGfQEzE
MCP 服务端点: https://api.dify.ai/mcp/server/6CIF5pkYZB3sUXRe/mcp
```

### 与现有系统的差异

| 特性 | 现有系统 (摘要/关键点) | 新系统 (聊天) |
|------|------------------|----------|
| 工作流类型 | Workflow | Chat 应用 |
| API 端点 | `/workflows/run` | `/chat-messages` |
| 响应模式 | 阻塞式 blocking | 流式 streaming |
| 对话管理 | 无需 | 需要 conversation_id |
| 上下文 | 静态输入 | 动态多轮 |
| 用户隔离 | 可选 | 必需 |

---

## 🏗️ 架构设计方案

### 整体架构

```
┌─────────────────────────────────────────────────────┐
│         浏览器 (http://localhost:5174)              │
├─────────────────────────────────────────────────────┤
│  PostDetail.vue                                      │
│    └─ RightSidebar.vue                             │
│         └─ AIAssistant.vue (Tab 切换)              │
│              ├─ SummaryFeature (现有)              │
│              ├─ KeypointsFeature (现有)            │
│              └─ ChatFeature (改进)                 │
│                   ├─ 本地模拟响应                   │
│                   ├─ Dify Chat API (新)            │
│                   └─ 多工作流支持                   │
│                                                     │
└──────────────┬──────────────────────────────────────┘
               │ Vite Proxy & Axios
               │ /api/ai/chat/stream
               ▼
┌─────────────────────────────────────────────────────┐
│    后端 (http://localhost:3001)                    │
├─────────────────────────────────────────────────────┤
│  mock-server.js                                     │
│    └─ routes: '/api/ai/chat/stream'                │
│         ├─ 路由到本地模拟 (降级)                   │
│         ├─ 路由到 Dify Chat API (新增)            │
│         └─ 支持工作流选择参数                       │
│                                                     │
│  Dify Service Layer (新建)                         │
│    ├─ ChatWorkflowService                         │
│    │   ├─ sendMessage()                           │
│    │   ├─ getHistory()                            │
│    │   └─ deleteConversation()                    │
│    └─ 配置管理                                      │
│         ├─ Workflow ID (旧)                        │
│         ├─ Chat App ID (新)                        │
│         └─ API 密钥管理                            │
│                                                     │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────────────────┐
│    Dify Cloud (https://api.dify.ai/v1)             │
├─────────────────────────────────────────────────────┤
│  旧工作流 (文章分析)                                │
│    POST /workflows/run                             │
│    - 摘要生成                                       │
│    - 关键点提取                                     │
│                                                     │
│  新聊天应用                                         │
│    POST /chat-messages                             │
│    GET  /conversations/:id                         │
│    DELETE /conversations/:id                       │
│                                                     │
│  用户管理                                           │
│    POST /end-users                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 关键设计决策

### 1. **工作流选择机制**

**方案 A** (推荐): 查询参数控制
```javascript
GET /api/ai/chat/stream?workflow=chat&message=...&articleContent=...
```

**方案 B**: 请求体包含工作流类型
```javascript
POST /api/ai/chat/stream
{
  "workflowType": "chat",  // "chat" | "workflow"
  "message": "...",
  "articleContent": "..."
}
```

**推荐**: 方案 A（EventSource 对 GET 友好）

### 2. **用户隔离策略**

Dify Chat API 要求 user_id，用于隔离不同用户的对话：

```javascript
// 后端生成用户 ID
const userId = `post-${postId}-user-${req.user?.id || 'anonymous'}`
// 格式: post-1-user-123
// 这样可以为每个帖子-用户组合维护独立的对话历史
```

### 3. **对话管理策略**

```javascript
// 前端维护
- 单次会话内的 conversation_id（从 Dify 返回）
- 页面刷新时丢失（可选：localStorage 持久化）

// 后端维护
- 可选：Redis 缓存对话状态
- 可选：定期清理过期对话
```

### 4. **降级方案**

当 Dify API 不可用时：
```
Dify Chat API 异常
  ↓
尝试使用 Workflow API（如果配置）
  ↓
使用本地模拟数据
```

### 5. **缓存策略**

| 数据类型 | 缓存时间 | 缓存位置 | 策略 |
|---------|--------|--------|------|
| 对话历史 | 24 小时 | Redis | 用户+帖子粒度 |
| 工作流配置 | 永久 | 内存 | 启动时加载 |
| 摘要/关键点 | 24 小时 | Redis | 现有策略 |

---

## 📝 前端实现方案

### 文件结构

```
frontend/src/views/community/PostDetail/RightSidebar/AIAssistant/
├─ ChatFeature.vue (改进)
│  ├─ 检测帖子 ID
│  ├─ 根据工作流类型切换响应处理
│  ├─ 支持多工作流流式响应
│  └─ 错误降级处理
│
├─ SummaryFeature.vue (保持不变)
│
└─ KeypointsFeature.vue (保持不变)
```

### ChatFeature.vue 改进点

```vue
<script setup>
const props = defineProps({
  articleContent: String,
  postId: String,  // 新增：用于生成用户 ID
})

// 新增：工作流类型检测
const workflowType = ref('chat')  // 'chat' | 'local'

// 响应处理的条件分支
const handleStreamMessage = (data) => {
  if (workflowType.value === 'chat') {
    // 处理 Dify Chat API 的响应
    // 字段: answer, message_id, conversation_id
    handleChatResponse(data)
  } else if (workflowType.value === 'workflow') {
    // 处理 Workflow API 的响应
    // 字段: content, conversationId
    handleWorkflowResponse(data)
  } else {
    // 处理本地模拟响应
    handleLocalResponse(data)
  }
}

// 错误恢复
const handleStreamError = async (error) => {
  if (workflowType.value === 'chat') {
    console.warn('[Chat API] 失败，降级到 Workflow API')
    workflowType.value = 'workflow'
    // 重试
  }
}
</script>
```

---

## 🔌 后端实现方案

### 新建服务文件

**文件**: `backend/services/chatWorkflowService.js`

```javascript
class ChatWorkflowService {
  constructor() {
    this.apiKey = process.env.DIFY_CHAT_API_KEY
    this.baseURL = process.env.DIFY_API_URL
    this.appId = process.env.DIFY_CHAT_APP_ID
  }

  /**
   * 发送消息到 Dify Chat API
   * @param {string} message - 用户消息
   * @param {string} userId - 用户 ID（post-${postId}-user-${userId}）
   * @param {string} conversationId - 对话 ID（可选）
   * @returns {AsyncGenerator} 流式响应
   */
  async* sendMessage(message, userId, conversationId = '') {
    const url = `${this.baseURL}/chat-messages`

    const payload = {
      inputs: {},
      query: message,
      response_mode: 'streaming',  // 流式
      conversation_id: conversationId,
      user: userId,
    }

    // 调用 Dify API
    // yield 处理流式数据
    // 返回格式: {type: 'chunk'|'end', answer?, message_id?, conversation_id?}
  }

  /**
   * 获取对话历史
   */
  async getConversation(conversationId, userId) {
    // GET /conversations/{conversation_id}
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId, userId) {
    // DELETE /conversations/{conversation_id}
  }
}
```

### 路由处理

**修改**: `backend/mock-server.js` 中的 `/api/ai/chat/stream`

```javascript
'GET:/api/ai/chat/stream': (req, res) => {
  const { workflow, message, articleContent, conversationId, postId } = req.query
  const userId = req.user?.id || 'anonymous'

  // 生成完整用户 ID
  const fullUserId = `post-${postId}-user-${userId}`

  if (workflow === 'chat') {
    // 调用 Dify Chat API
    handleDifyChatStream(res, message, fullUserId, conversationId)
  } else if (workflow === 'workflow') {
    // 降级到 Workflow API
    handleDifyWorkflowStream(res, message, articleContent, conversationId)
  } else {
    // 使用本地模拟
    handleLocalStream(res, message)
  }
}
```

### 环境变量配置

**文件**: `backend/.env`

```env
# 现有 Workflow 配置（保持）
DIFY_API_KEY=app-WhLg4w9QxdY7vUqbWbYWBWYi
DIFY_WORKFLOW_ID=D6kweN4qjR1FWd3g
DIFY_API_URL=https://api.dify.ai/v1

# 新增 Chat 应用配置
DIFY_CHAT_API_KEY=app-LzqvkItq6QOd0PH2VwXL3P16
DIFY_CHAT_APP_ID=NF8mUftOYiGfQEzE
DIFY_CHAT_MCP_URL=https://api.dify.ai/mcp/server/6CIF5pkYZB3sUXRe/mcp
```

---

## 📊 Dify Chat API vs Workflow API

### Chat API 特点

**URL**: `https://api.dify.ai/v1/chat-messages`

**请求**:
```javascript
POST /chat-messages
{
  "inputs": {},               // 变量输入（可选）
  "query": "用户问题",        // 必需：用户消息
  "response_mode": "streaming", // 流式响应
  "conversation_id": "",      // 对话 ID（保持上下文）
  "user": "user-123"          // 用户 ID（必需）
}
```

**响应事件**:
```
data: {"event":"message_start","task_id":"xxx","id":"xxx","conversation_id":"xxx"}
data: {"event":"message_node_started","task_id":"xxx"}
data: {"event":"message_queue","task_id":"xxx"}
data: {"event":"message_node_finish","task_id":"xxx"}
data: {"event":"message_file","task_id":"xxx"}
data: {"event":"agent_message","answer":"这是...","message_id":"xxx"}
data: {"event":"message_end","conversation_id":"xxx"}
```

**关键字段**:
- `event`: 事件类型
- `answer`: AI 回复内容（仅在 agent_message）
- `conversation_id`: 对话 ID（用于后续消息）
- `message_id`: 消息 ID（用于审计）

### Workflow API 特点

**URL**: `https://api.dify.ai/v1/workflows/run`

**请求**:
```javascript
POST /workflows/run
{
  "workflow_id": "xxx",
  "inputs": {"article_content": "..."},
  "response_mode": "streaming",
  "user": "user-123"
}
```

**响应**: 与 Chat API 不同的事件和字段结构

---

## 🛡️ 错误处理与降级

### 错误分类与处理

```javascript
错误类型                    HTTP 码    降级策略           用户提示
─────────────────────────────────────────────────────────────
API 密钥无效               401       使用 Workflow API   "AI 服务升级中..."
应用不存在                 404       使用本地模拟        "AI 暂时不可用..."
超过速率限制               429       重试 + 本地模拟     "请稍候再试..."
内部服务器错误             500       降级                "AI 开小差了..."
网络超时                   -         重试 + 降级         "网络连接中..."
```

### 降级链

```
Dify Chat API
  ↓ (失败)
Dify Workflow API
  ↓ (失败)
本地模拟数据
  ↓ (如果还失败)
显示友好错误信息 + 重试按钮
```

---

## 🧪 测试计划

### 单元测试
- [ ] ChatWorkflowService 消息发送
- [ ] 对话 ID 管理
- [ ] 错误处理和降级

### 集成测试
- [ ] 前后端流式响应
- [ ] 多轮对话上下文保持
- [ ] 用户隔离验证
- [ ] 错误降级流程

### E2E 测试
- [ ] 打开帖子详情页面
- [ ] 点击"AI问答" Tab
- [ ] 发送消息并接收流式响应
- [ ] 多轮对话测试
- [ ] 网络异常模拟

---

## 📋 实施步骤

### 第一阶段：配置与服务层（1-2 小时）
- [ ] 在 `.env` 中添加 Dify Chat API 凭证
- [ ] 创建 `services/chatWorkflowService.js`
- [ ] 实现 ChatWorkflowService 类
- [ ] 添加环境变量读取

### 第二阶段：后端路由集成（1-2 小时）
- [ ] 修改 `mock-server.js` 的 `/api/ai/chat/stream` 路由
- [ ] 添加工作流选择逻辑
- [ ] 实现流式数据转发
- [ ] 添加错误处理和降级

### 第三阶段：前端集成（2-3 小时）
- [ ] 改进 `ChatFeature.vue` 组件
- [ ] 添加工作流类型检测
- [ ] 实现不同响应处理逻辑
- [ ] 测试流式响应和打字机效果

### 第四阶段：测试与优化（1-2 小时）
- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试
- [ ] 性能优化

---

## 🎯 关键检查清单

### 安全性
- [ ] API 密钥在环境变量中，不在代码中
- [ ] 用户 ID 正确生成，防止对话泄露
- [ ] 请求验证（message 不为空）
- [ ] 超时控制

### 功能性
- [ ] 流式响应正确处理
- [ ] 多轮对话上下文保持
- [ ] 错误降级机制工作
- [ ] 本地模拟作为最后手段

### 用户体验
- [ ] 打字机效果流畅
- [ ] 加载状态清晰
- [ ] 错误提示友好
- [ ] 响应速度快

### 可维护性
- [ ] 代码模块化
- [ ] 配置外部化
- [ ] 错误日志完整
- [ ] 文档清晰

---

## 📚 参考资源

### Dify API 文档
- Chat API: https://docs.dify.ai/zh-hans/guides/api/chat-messages
- Workflow API: https://docs.dify.ai/zh-hans/guides/api/workflow

### 项目参考
- test3/7.txt: Workflow API 实现示例
- 当前系统: SummaryFeature 的错误处理模式

---

## 💡 建议

1. **优先级**：先实现 Chat API，保留 Workflow API 作为降级
2. **测试**：在本地环境完整测试所有错误场景
3. **监控**：记录 API 调用成功率，监控降级频率
4. **迭代**：先完成基础功能，后续可添加对话历史持久化等高级功能

---

**下一步**:
- [ ] 审批此方案
- [ ] 确认是否需要修改或补充
- [ ] 批准后开始第一阶段实施

