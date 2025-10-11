# Dify MCP 快速开始指南

## 🚀 5分钟快速上手

### 步骤 1: 验证 MCP 配置

MCP 配置文件已经创建在：`.claude/mcp.json`

```json
{
  "mcpServers": {
    "dify-interview-workflow": {
      "url": "https://api.dify.ai/mcp/server/sUb5skskelb6Nkm1/mcp",
      "headers": {
        "Authorization": "Bearer app-vZlc0w5Dio2gnrTkdlblcPXG"
      }
    }
  }
}
```

### 步骤 2: 测试 MCP 连接

运行测试脚本验证连接：

```bash
node test-dify-mcp.js
```

✅ **预期输出**: 应该看到 "✅ 所有测试完成！"

### 步骤 3: 运行演示

选择一个演示运行：

```bash
# 演示 1: 为 Python 后端生成题目（需要 30-60 秒）
node demo-dify-mcp.js 1

# 演示 2: 为前端开发生成题目
node demo-dify-mcp.js 2

# 演示 3: 查看参数格式（不调用 API）
node demo-dify-mcp.js 3

# 演示 4: 为区块链工程师生成题目
node demo-dify-mcp.js 4
```

### 步骤 4: 在 Claude Code 中使用

在 Claude Code 对话中直接请求：

```
请使用 Dify MCP 工具为 "数据分析师" 职位生成面试问题
```

Claude Code 会自动调用 MCP 工具！

## 📋 可用的 MCP 工具

### 工具名称
`AI 面试官 - 全流程定制与评分 (RAG)`

### 输入参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `request_type` | string | ✅ | 请求类型 |
| `job_title` | string | ❌ | 职位名称 |
| `question` | string | ❌ | 面试问题 |
| `candidate_answer` | string | ❌ | 候选人答案 |
| `session_id` | string | ❌ | 会话 ID |

### 请求类型

1. **`generate_questions`** - 生成面试问题
   ```json
   {
     "request_type": "generate_questions",
     "job_title": "前端开发工程师"
   }
   ```

2. **`analyze_answer`** - 分析答案
   ```json
   {
     "request_type": "analyze_answer",
     "session_id": "sess-xxx",
     "question": "什么是闭包？",
     "candidate_answer": "闭包是..."
   }
   ```

3. **`continue_interview`** - 继续面试
   ```json
   {
     "request_type": "continue_interview",
     "session_id": "sess-xxx"
   }
   ```

## 💡 使用场景

### 场景 1: 快速生成面试题目

**在 Claude Code 中**：
```
使用 Dify MCP 为 "机器学习工程师" 生成 5 个面试问题
```

**或使用 Node.js**：
```bash
node demo-dify-mcp.js 1
```

### 场景 2: 测试不同职位

```
依次为以下职位生成题目：
1. 前端开发工程师
2. Python 后端工程师
3. DevOps 工程师
```

### 场景 3: 验证答案评估

```
使用 Dify MCP 评估这个答案：
问题：什么是 Docker？
答案：Docker 是一个容器化平台...
```

## 🔧 故障排除

### 问题 1: 连接失败

**症状**: `node test-dify-mcp.js` 显示连接错误

**解决方案**:
1. 检查网络连接
2. 确认 API Key 正确
3. 验证 MCP URL 可访问

### 问题 2: 超时错误

**症状**: 调用超时（timeout）

**原因**: Dify 工作流需要搜索引擎查询，通常需要 30-60 秒

**解决方案**: 增加超时时间或耐心等待

### 问题 3: Claude Code 找不到工具

**症状**: Claude Code 说找不到 MCP 工具

**解决方案**:
1. 确认 `.claude/mcp.json` 文件存在
2. 重启 Claude Code
3. 检查配置文件格式

## 📚 相关文档

- **完整文档**: `DIFY-MCP-INTEGRATION.md`
- **自由输入功能**: `SMART-PROFESSION-INPUT-UPDATE.md`
- **Dify 集成指南**: `DIFY-INTEGRATION-GUIDE.md`

## ✨ 高级用法

### 在代码中调用 MCP

```javascript
const https = require('https');

async function callDifyMCP(params) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'AI 面试官 - 全流程定制与评分 (RAG)',
      arguments: params
    }
  });

  // ... (参考 demo-dify-mcp.js 完整实现)
}

// 使用
const result = await callDifyMCP({
  request_type: 'generate_questions',
  job_title: '全栈开发工程师'
});
```

### 批量生成题目

```javascript
const professions = [
  '前端开发工程师',
  'Python后端开发工程师',
  '数据分析师',
  '产品经理'
];

for (const prof of professions) {
  const result = await callDifyMCP({
    request_type: 'generate_questions',
    job_title: prof
  });
  console.log(`${prof}: 已生成 ${result.questions.length} 道题目`);
}
```

## 🎯 下一步

1. ✅ 运行 `node test-dify-mcp.js` 验证连接
2. ✅ 运行 `node demo-dify-mcp.js 1` 生成第一个题目
3. ✅ 在 Claude Code 中尝试调用 MCP 工具
4. ✅ 将 MCP 集成到您的开发流程

## 💬 需要帮助？

在 Claude Code 对话中询问：

```
我想了解如何使用 Dify MCP 工具
```

或者查看完整文档：

```
请打开并解释 DIFY-MCP-INTEGRATION.md 文件
```

---

**更新时间**: 2025-10-10
**版本**: 1.0
**状态**: ✅ 可用
