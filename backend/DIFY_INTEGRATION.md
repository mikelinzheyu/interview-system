# Dify 工作流集成配置

## 🎯 当前状态

后端已成功集成 Dify 工作流 API。以下是完整配置说明。

---

## 📋 Dify 工作流信息

| 项目 | 值 |
|------|-----|
| **工作流ID** | `D6kweN4qjR1FWd3g` |
| **API密钥** | `app-9AB8NRgNKmk5gtsHYt1ByRD5` |
| **API端点** | `https://api.dify.ai/v1` |
| **公开访问URL** | https://udify.app/workflow/D6kweN4qjR1FWd3g |
| **Dify页面** | https://cloud.dify.ai/app/b3e08dfb-d76c-42b2-a0b0-a0db5ea28530/workflow |

---

## 🔧 环境变量配置

### 后端 `.env` 文件

在 `backend/.env` 中添加以下配置：

```env
# Dify 工作流配置
DIFY_API_KEY=app-9AB8NRgNKmk5gtsHYt1ByRD5
DIFY_API_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_ID=D6kweN4qjR1FWd3g

# Redis 缓存配置（如果使用）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# 其他配置
LOG_LEVEL=info
NODE_ENV=production
```

### 说明

- **DIFY_API_KEY**: Dify API 密钥（保持安全，不要提交到版本控制）
- **DIFY_API_URL**: Dify API 基础URL（默认：https://api.dify.ai/v1）
- **DIFY_WORKFLOW_ID**: 工作流ID（单一工作流处理三种任务）

---

## 🔌 后端 API 端点

### 1. 生成文章摘要

**请求**
```bash
POST /api/ai/summary
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "文章完整内容",
  "postId": "post-123"
}
```

**响应**
```json
{
  "summary": "这是生成的摘要...",
  "fromCache": false
}
```

---

### 2. 提取关键点

**请求**
```bash
POST /api/ai/keypoints
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "文章完整内容",
  "postId": "post-123"
}
```

**响应**
```json
{
  "keypoints": "- 关键点1\n- 关键点2\n- 关键点3",
  "fromCache": false
}
```

---

### 3. 提取 SEO 关键词

**请求**
```bash
POST /api/ai/keywords
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "文章完整内容",
  "postId": "post-123"
}
```

**响应**
```json
{
  "keywords": "关键词1, 关键词2, 关键词3, 关键词4, 关键词5",
  "fromCache": false
}
```

---

### 4. AI 问答（流式SSE）

**请求**
```bash
POST /api/ai/chat/stream
Content-Type: application/json
Authorization: Bearer {token}

{
  "message": "用户提问内容",
  "articleContent": "文章完整内容",
  "conversationId": "conv-123"  // 可选，用于多轮对话
}
```

**响应（Server-Sent Events）**
```
data: {"type":"chunk","content":"回复内容逐块返回"}

data: {"type":"end","conversationId":"conv-new-id"}

event: done
data: {"conversationId":"conv-new-id"}
```

---

## 🔄 工作流任务类型

工作流支持三种任务类型，通过 `task_type` 参数路由：

| 任务类型 | 说明 | LLM | 输出 |
|----------|------|-----|------|
| `summary` | 生成摘要 | Gemini 2.5 Flash | 150-200字摘要 |
| `key_points` | 提取要点 | Gemini 2.5 Flash | Markdown 格式列表 |
| `seo_keywords` | SEO 关键词 | Gemini 2.5 Flash | 逗号分隔的关键词 |

---

## 💾 缓存策略

所有 AI 生成的结果都会被缓存在 Redis 中：

| 任务类型 | 缓存键前缀 | TTL |
|----------|-----------|-----|
| 摘要 | `summary:postId` | 24小时 |
| 要点 | `keypoints:postId` | 24小时 |
| 关键词 | `keywords:postId` | 24小时 |
| 聊天记录 | `chat:conversationId` | 7天 |

---

## 🧪 测试集成

### 1. 检查 Dify 服务状态

```javascript
const difyService = require('./backend/services/difyService');

async function testDify() {
  try {
    const isConfigured = difyService.isConfigured();
    console.log('Dify configured:', isConfigured);

    const summary = await difyService.generateSummary('测试文章内容');
    console.log('Summary:', summary);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDify();
```

### 2. 测试 API 端点

```bash
# 测试摘要
curl -X POST http://localhost:3000/api/ai/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "content": "Vue 3 是一个现代的 JavaScript 框架...",
    "postId": "test-post-1"
  }'

# 测试关键点
curl -X POST http://localhost:3000/api/ai/keypoints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "content": "Vue 3 是一个现代的 JavaScript 框架...",
    "postId": "test-post-1"
  }'

# 测试流式对话
curl -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "message": "Vue 3 有什么优点？",
    "articleContent": "Vue 3 是一个现代的 JavaScript 框架..."
  }'
```

---

## 🚀 前端集成

前端通过 HTTP/SSE 调用后端 API：

```javascript
// 生成摘要
async function generateSummary(content, postId) {
  const response = await fetch('/api/ai/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, postId })
  });
  return response.json();
}

// 流式对话
function streamChat(message, articleContent, conversationId) {
  const eventSource = new EventSource(
    `/api/ai/chat/stream?message=${encodeURIComponent(message)}&content=${encodeURIComponent(articleContent)}`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'chunk') {
      console.log('Response chunk:', data.content);
    } else if (data.type === 'end') {
      console.log('Conversation ID:', data.conversationId);
      eventSource.close();
    }
  };
}
```

---

## ⚙️ 生产部署建议

### 1. 环境变量安全
- 使用密钥管理服务（如 AWS Secrets Manager, Azure Key Vault）
- 不要在代码中硬编码 API 密钥
- 定期轮换 API 密钥

### 2. API 速率限制
- 当前配置：
  - 摘要/关键点：每用户每分钟 10 次
  - 流式对话：每用户每分钟 30 次
- 根据实际需求调整

### 3. 错误处理
- 实现自动重试机制（指数退避）
- 记录详细的错误日志
- 向用户返回友好的错误消息

### 4. 监控
- 监控 Dify API 响应时间
- 跟踪缓存命中率
- 记录 API 错误率和用户反馈

### 5. 成本优化
- 使用 Gemini Flash（更便宜、更快）
- 充分利用缓存减少 API 调用
- 定期审查使用情况

---

## 📞 故障排除

### 问题1：Dify API 返回 401

**原因**：API 密钥无效或过期
**解决方案**：
1. 检查 API 密钥是否正确
2. 在 Dify 管理界面重新生成 API 密钥
3. 更新 `.env` 文件

### 问题2：工作流返回空结果

**原因**：LLM 服务响应超时或错误
**解决方案**：
1. 检查 Gemini API 是否有效
2. 查看 Dify 工作流日志
3. 增加超时时间（当前：30秒）

### 问题3：缓存不工作

**原因**：Redis 连接失败
**解决方案**：
1. 确认 Redis 服务运行
2. 检查 REDIS_HOST 和 REDIS_PORT
3. 查看应用日志

---

## 📚 相关文档

- [Dify 官方文档](https://docs.dify.ai)
- [工作流配置说明](D:\code7\test11\Gemini-Flash-导入指南.md)
- [API 参考](https://docs.dify.ai/zh-hans/guides/api-integration)

---

**最后更新**：2025-11-13
**状态**：✅ 生产就绪
