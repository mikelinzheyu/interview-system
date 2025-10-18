# Dify 工作流1 API 测试故障排除指南

## 问题诊断

根据测试结果，发现以下问题：

### 问题 1：工作流 ID 格式不匹配
```
❌ 错误: Invalid workflow_id format: 'sNkeofwLHukS3sC2'
```

**原因**:
- 提供的 `sNkeofwLHukS3sC2` 是**公开共享 ID**（用于 udify.app 链接）
- Dify API 需要的是**内部工作流 ID**（UUID 格式）

### 问题 2：API 端点问题
```
公开访问 URL: https://udify.app/workflow/sNkeofwLHukS3sC2
API 访问凭据: https://api.dify.ai/v1
```

**说明**:
- `udify.app` 是Dify云端提供的公开共享链接（UI界面）
- `api.dify.ai/v1` 是 API 端点基础 URL
- 但需要正确的工作流 UUID 来进行 API 调用

## 解决方案

### 步骤 1：获取正确的工作流内部 ID

1. **打开 Dify 工作流编辑界面**
   - 登录 https://cloud.dify.ai/
   - 打开"工作流1 - 生成问题"工作流

2. **查找工作流 UUID**

   **方法 A：从浏览器 URL**
   ```
   https://cloud.dify.ai/console/apps/{WORKSPACE_ID}/workflow/{WORKFLOW_UUID}/edit
   ```
   复制这里的 `{WORKFLOW_UUID}` 部分

   **方法 B：从工作流设置**
   - 点击右上角"⚙️ 设置"
   - 查看"工作流 ID"或"应用 ID"字段
   - 这应该是一个 UUID 格式的 ID，例如: `12345678-1234-1234-1234-123456789012`

3. **获取 API 调用示例**
   - 点击"发布"按钮
   - 在发布后的面板中，找到"API"标签页
   - 查看官方提供的 cURL 示例
   - 从中提取：
     - 完整的 API URL
     - 正确的请求格式
     - 所需的所有参数

### 步骤 2：获取工作区 API Key

1. **打开 API Key 管理**
   - 点击左下角"设置" → "API Key"
   - 或者直接访问: https://cloud.dify.ai/console/api-keys

2. **创建或获取 API Key**
   - 如果已有，直接复制
   - 格式应该是: `app-xxxxxxxxxxxxx`
   - 记录下来以备使用

### 步骤 3：获取正确的 API 调用信息

在 Dify UI 中，点击"发布"后，查看发布的工作流详情页面：

```
┌─────────────────────────────────────────────┐
│ 工作流已发布                               │
├─────────────────────────────────────────────┤
│                                             │
│ 📋 API                                     │
│                                             │
│ 请求示例 (cURL):                           │
│ curl -X POST https://api.dify.ai/v1/...    │
│   -H "Authorization: Bearer app-..."       │
│   -H "Content-Type: application/json"      │
│   -d '{"inputs": {...}}'                   │
│                                             │
│ 所需的:                                    │
│ • 完整 URL 路径                             │
│ • API Key                                  │
│ • 输入参数格式                              │
│                                             │
└─────────────────────────────────────────────┘
```

从这个示例中，提取以下信息：

1. **完整的 API URL**
   - 例如: `https://api.dify.ai/v1/workflows/{WORKFLOW_UUID}/run`
   - 或: `https://api.dify.ai/v1/chat-messages`

2. **API 密钥**
   - 格式: `app-xxxxxxxxxxxxx`

3. **输入参数格式**
   - `inputs` 对象包含所需参数
   - 例如: `{"inputs": {"job_title": "..."}}`

## 正确的 API 调用格式

一旦您获得了正确的工作流 UUID，API 调用应该是这样的：

```bash
curl -X POST https://api.dify.ai/v1/workflows/{YOUR_WORKFLOW_UUID}/run \
  -H "Authorization: Bearer app-dTgOwbWnQQ6rZzTRoPUK7Lz0" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "job_title": "Python后端开发工程师"
    },
    "response_mode": "blocking",
    "user": "test-user-123"
  }'
```

## 使用 Node.js 测试

一旦获得了正确的工作流 UUID，运行以下脚本：

```bash
# 设置环境变量
$env:DIFY_WORKFLOW_UUID = "your-workflow-uuid-here"
$env:DIFY_API_KEY = "app-dTgOwbWnQQ6rZzTRoPUK7Lz0"

# 运行测试
node test-workflow1-dify.js
```

## 常见的工作流调用方式

### 方式 1：Workflow 直接调用（适用于工作流应用）
```
POST https://api.dify.ai/v1/workflows/{WORKFLOW_UUID}/run
```

### 方式 2：Chat 调用（如果工作流作为聊天应用）
```
POST https://api.dify.ai/v1/chat-messages
```

### 方式 3：Completion 调用
```
POST https://api.dify.ai/v1/completions
```

正确的方式取决于工作流的**发布类型**（应用类型）

## 检查清单

- [ ] 已登录 Dify 云端账户
- [ ] 找到工作流的内部 UUID（不是共享 ID）
- [ ] 获取了工作区的 API Key
- [ ] 从 Dify UI 中查看了官方的 API 调用示例
- [ ] 记录了完整的 API URL
- [ ] 知道了输入参数的正确格式
- [ ] 测试 nginx 反向代理仍在运行
- [ ] 存储服务仍在 localhost:8080 运行

## 下一步

1. **按照上述步骤获取正确的工作流 UUID 和 API 信息**
2. **提供给我以下信息**：
   ```
   工作流 UUID: (UUID 格式的内部 ID)
   完整 API URL: (从 Dify UI 复制的完整 URL)
   API 密钥: (已有)
   应用类型: (Workflow / Chat / Completion)
   ```
3. **然后我会创建正确的测试脚本来验证工作流是否正常工作**

## 参考资源

- **Dify 官方文档**: https://docs.dify.ai/
- **Dify API 文档**: https://docs.dify.ai/en/guides/application-orchestration/develop-with-api
- **工作流发布指南**: https://docs.dify.ai/en/guides/workflow/publish

## 快速总结

| 项目 | 您提供的信息 | 状态 | 说明 |
|------|----------|------|------|
| 公开共享链接 | https://udify.app/workflow/sNkeofwLHukS3sC2 | ✅ 有效 | 用于分享，不能用于 API |
| API 基础 URL | https://api.dify.ai/v1 | ✅ 正确 | 需要加上正确的工作流路径 |
| API 密钥 | app-dTgOwbWnQQ6rZzTRoPUK7Lz0 | ✅ 正确 | 可以用于授权 |
| 工作流 UUID | 🔴 缺失 | ❌ 需要获取 | **这是关键信息** |
| 完整 API URL | 🔴 缺失 | ❌ 需要获取 | 组合 UUID 后得到 |

---

**遇到问题?** 按照以下步骤操作：

1. 在 Dify UI 中打开您的工作流
2. 点击"发布"查看发布详情
3. 在"API"标签页查看完整的 API 调用示例
4. 复制该示例并提供给我
5. 我会帮您创建正确的测试脚本
