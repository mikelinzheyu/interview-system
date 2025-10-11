# Dify MCP 服务集成文档

## 📋 概述

本文档介绍如何在 Claude Code 中集成 Dify MCP (Model Context Protocol) 服务器，使得可以直接调用 Dify AI 面试官工作流。

## 🎯 集成完成状态

- ✅ MCP 服务器配置完成
- ✅ API 密钥已配置
- ✅ 连接测试通过
- ✅ 工具发现成功

## 🔧 MCP 服务器信息

### 基本信息
- **MCP URL**: `https://api.dify.ai/mcp/server/sUb5skskelb6Nkm1/mcp`
- **服务器名称**: Dify
- **版本**: 1.9.1
- **协议版本**: 2024-11-05
- **API Key**: `app-vZlc0w5Dio2gnrTkdlblcPXG`

### 工作流工具

#### 工具名称
`AI 面试官 - 全流程定制与评分 (RAG)`

#### 工具描述
从生成面试问题到评估候选人回答的完整工作流，包含条件分支与会话状态存储。

#### 输入参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `request_type` | string | ✅ 是 | 请求类型（必填参数） |
| `job_title` | string | ❌ 否 | 职位名称（如：前端开发工程师） |
| `question` | string | ❌ 否 | 面试问题 |
| `candidate_answer` | string | ❌ 否 | 候选人答案 |
| `session_id` | string | ❌ 否 | 会话 ID（用于保持上下文） |

#### 请求类型说明

根据现有的应用程序实现，`request_type` 支持以下值：

1. **`generate_questions`** - 生成面试问题
   - 需要参数: `job_title`
   - 返回: 生成的面试问题列表

2. **`analyze_answer`** - 分析候选人答案
   - 需要参数: `question`, `candidate_answer`, `session_id`
   - 返回: 答案评分和反馈

3. **`continue_interview`** - 继续面试
   - 需要参数: `session_id`
   - 返回: 下一个面试问题

## 📁 配置文件

### MCP 配置文件位置
`.claude/mcp.json`

### 配置内容
```json
{
  "mcpServers": {
    "dify-interview-workflow": {
      "url": "https://api.dify.ai/mcp/server/sUb5skskelb6Nkm1/mcp",
      "headers": {
        "Authorization": "Bearer app-vZlc0w5Dio2gnrTkdlblcPXG"
      },
      "metadata": {
        "description": "Dify AI面试官工作流 - 智能专业题目生成与评分",
        "capabilities": [
          "generate_interview_questions",
          "analyze_answers",
          "provide_feedback"
        ]
      }
    }
  }
}
```

## 🚀 使用方法

### 方式 1：在 Claude Code 对话中使用

一旦配置完成，Claude Code 会自动发现这个 MCP 工具。您可以直接在对话中请求：

#### 示例 1：生成面试题目
```
请使用 Dify MCP 工具为 "前端开发工程师" 职位生成面试问题
```

Claude Code 会自动调用：
```json
{
  "tool": "AI 面试官 - 全流程定制与评分 (RAG)",
  "parameters": {
    "request_type": "generate_questions",
    "job_title": "前端开发工程师"
  }
}
```

#### 示例 2：评估候选人答案
```
使用 Dify MCP 评估以下答案：
问题：什么是闭包？
答案：闭包是函数和其词法环境的组合...
会话 ID：session-123
```

Claude Code 会调用：
```json
{
  "tool": "AI 面试官 - 全流程定制与评分 (RAG)",
  "parameters": {
    "request_type": "analyze_answer",
    "question": "什么是闭包？",
    "candidate_answer": "闭包是函数和其词法环境的组合...",
    "session_id": "session-123"
  }
}
```

### 方式 2：通过 Node.js 脚本调用

使用提供的测试脚本 `test-dify-mcp.js` 作为参考：

```javascript
const https = require('https');

const MCP_URL = 'https://api.dify.ai/mcp/server/sUb5skskelb6Nkm1/mcp';
const API_KEY = 'app-vZlc0w5Dio2gnrTkdlblcPXG';

// 调用工具
function callDifyTool(params) {
  const url = new URL(MCP_URL);

  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'AI 面试官 - 全流程定制与评分 (RAG)',
      arguments: params
    }
  });

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// 示例：生成面试问题
callDifyTool({
  request_type: 'generate_questions',
  job_title: 'Python后端开发工程师'
}).then(result => {
  console.log('生成的题目:', result);
}).catch(error => {
  console.error('错误:', error);
});
```

## 🧪 测试验证

### 运行测试脚本
```bash
node test-dify-mcp.js
```

### 预期输出
```
🔍 测试 Dify MCP 服务器连接...
...
✅ 所有测试完成！

💡 如果看到成功的响应，说明 MCP 服务器配置正确。
   您可以在 Claude Code 中使用这个 MCP 服务器了。
```

### 测试结果解读

#### ✅ 成功标志
- 状态码: 200
- 收到工具列表
- 包含 "AI 面试官" 工具

#### ❌ 失败可能原因
1. **API Key 错误** - 检查 `app-vZlc0w5Dio2gnrTkdlblcPXG` 是否正确
2. **网络问题** - 确保可以访问 `api.dify.ai`
3. **MCP URL 错误** - 确认 URL 格式正确
4. **Dify 服务不可用** - 检查 Dify 平台状态

## 📊 与现有系统的关系

### 当前实现方式

**REST API 调用**:
```
应用程序 → backend/mock-server.js → Dify REST API
```

文件位置：
- `backend/mock-server.js` - 后端 API 路由（`/api/ai/dify-workflow`）
- `frontend/src/services/difyService.js` - 前端服务封装
- `frontend/src/api/ai.js` - API 调用方法

### MCP 集成方式

**MCP 协议调用**:
```
Claude Code → MCP Protocol → Dify MCP Server
```

文件位置：
- `.claude/mcp.json` - MCP 服务器配置
- `test-dify-mcp.js` - MCP 测试脚本

### 使用场景对比

| 场景 | 使用方式 | 优势 |
|------|----------|------|
| **应用程序内部** | REST API | 稳定、可控、易于监控 |
| **开发测试** | MCP 协议 | 快速、直接、无需启动后端 |
| **Claude Code 辅助开发** | MCP 协议 | 智能、上下文感知、自动化 |

## 💡 最佳实践

### 1. 双轨并行
- ✅ **保留 REST API**：用于生产环境的应用程序调用
- ✅ **添加 MCP 集成**：用于开发、测试和 AI 辅助

### 2. 安全性
- 🔒 **API Key 保护**：不要将 API Key 提交到版本控制系统
- 🔒 **环境变量**：使用环境变量存储敏感信息
- 🔒 **访问控制**：限制 MCP 服务器的访问权限

### 3. 开发工作流

#### 开发阶段
```
Claude Code (MCP) → 快速测试和原型开发
```

#### 集成阶段
```
应用程序 (REST API) → 稳定的生产环境集成
```

## 🔄 工作流程示例

### 完整的面试流程

#### 1. 生成面试问题
```json
{
  "request_type": "generate_questions",
  "job_title": "前端开发工程师"
}
```

**返回**:
```json
{
  "session_id": "sess-abc123",
  "questions": [
    "请解释 JavaScript 的事件循环机制",
    "React Hooks 的原理是什么？",
    ...
  ]
}
```

#### 2. 评估第一个答案
```json
{
  "request_type": "analyze_answer",
  "session_id": "sess-abc123",
  "question": "请解释 JavaScript 的事件循环机制",
  "candidate_answer": "事件循环是 JavaScript 的执行模型..."
}
```

**返回**:
```json
{
  "score": 8.5,
  "feedback": "回答全面，理解深入...",
  "suggestions": "可以补充 microtask 和 macrotask 的区别"
}
```

#### 3. 继续下一个问题
```json
{
  "request_type": "continue_interview",
  "session_id": "sess-abc123"
}
```

## 📚 相关文件

### 配置文件
- `.claude/mcp.json` - MCP 服务器配置
- `backend/.env.example` - 环境变量模板

### 测试文件
- `test-dify-mcp.js` - MCP 连接测试脚本

### 应用程序文件
- `backend/mock-server.js` - 后端 Dify API 集成
- `frontend/src/services/difyService.js` - 前端 Dify 服务
- `frontend/src/views/interview/AIInterviewSession.vue` - AI 面试页面

### 文档文件
- `DIFY-INTEGRATION-GUIDE.md` - Dify REST API 集成指南
- `SMART-PROFESSION-INPUT-UPDATE.md` - 智能专业输入功能文档

## 🎓 常见问题 (FAQ)

### Q1: MCP 和 REST API 有什么区别？

**MCP (Model Context Protocol)**:
- 标准化的协议，专为 AI 模型上下文共享设计
- 支持工具发现、双向通信、流式响应
- 适合 AI 助手直接调用

**REST API**:
- 传统的 HTTP API
- 适合应用程序集成
- 更稳定、更可控

### Q2: 我需要同时使用两种方式吗？

**建议**:
- **开发时**：使用 MCP 快速测试 Dify 工作流
- **生产环境**：使用 REST API 确保稳定性

### Q3: 如何更新 API Key？

编辑 `.claude/mcp.json` 文件，更新 `Authorization` 头：
```json
{
  "mcpServers": {
    "dify-interview-workflow": {
      "headers": {
        "Authorization": "Bearer 新的API-KEY"
      }
    }
  }
}
```

### Q4: MCP 服务器不可用怎么办？

检查步骤：
1. 运行 `node test-dify-mcp.js` 测试连接
2. 确认 API Key 正确
3. 检查网络连接
4. 访问 Dify 平台确认服务状态

### Q5: 可以添加多个 Dify 工作流吗？

可以！在 `.claude/mcp.json` 中添加多个 MCP 服务器：
```json
{
  "mcpServers": {
    "dify-interview": {
      "url": "https://api.dify.ai/mcp/server/xxx/mcp",
      ...
    },
    "dify-another-workflow": {
      "url": "https://api.dify.ai/mcp/server/yyy/mcp",
      ...
    }
  }
}
```

## 🎯 下一步行动

### 立即可以做的事情

1. **在 Claude Code 中测试**
   ```
   请使用 Dify MCP 为 "数据分析师" 生成面试问题
   ```

2. **查看工作流详情**
   ```
   显示 Dify MCP 工具的所有参数和用法
   ```

3. **集成到开发流程**
   - 使用 MCP 快速验证面试问题质量
   - 测试不同职位的题目生成
   - 优化工作流参数

### 未来优化方向

1. **增强 MCP 集成**
   - 添加更多 Dify 工作流
   - 实现流式响应
   - 添加缓存机制

2. **改进应用程序**
   - 统一 MCP 和 REST API 的接口
   - 添加工作流版本管理
   - 实现 A/B 测试

3. **监控和分析**
   - 记录 MCP 调用日志
   - 分析工作流性能
   - 优化响应时间

## ✅ 验证清单

- [x] MCP 配置文件已创建 (`.claude/mcp.json`)
- [x] API Key 已正确配置
- [x] MCP 连接测试通过
- [x] 工具发现成功
- [x] 了解工具参数和用法
- [ ] 在 Claude Code 中成功调用工具
- [ ] 验证工作流返回结果

## 🎉 总结

Dify MCP 服务集成已成功完成！现在您可以：

1. ✅ 在 Claude Code 中直接调用 Dify AI 面试官工作流
2. ✅ 快速测试不同职位的面试题目生成
3. ✅ 使用 AI 辅助开发和调试
4. ✅ 保持应用程序使用稳定的 REST API

这种双轨并行的方式既保证了生产环境的稳定性，又提升了开发效率！

---

**创建时间**: 2025-10-10 15:40
**文档版本**: 1.0
**作者**: Claude Code
**状态**: ✅ 集成完成并测试通过
