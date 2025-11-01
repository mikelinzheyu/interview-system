# Dify工作流 - 快速参考指南

## 🚀 快速开始

### 1. 运行测试脚本

```bash
node D:\code7\interview-system\test-workflows-complete.js
```

这将自动测试所有三个工作流的完整流程。

---

## 📝 工作流概览

| 工作流 | 功能 | 输入 | 输出 |
|--------|------|------|------|
| **工作流1** | 生成面试问题 | 职位名称 | session_id, 5个问题 |
| **工作流2** | 生成标准答案 | session_id, question_id | 标准答案 |
| **工作流3** | 评分候选回答 | session_id, question_id, 回答 | 评分(0-100), 评价 |

---

## 🔐 API凭据速查表

### 工作流1 - 生成问题
```
API密钥: app-hHvF3glxCRhtfkyX7Pg9i9kb
工作流ID: 560EB9DDSwOFc8As
API端点: https://api.dify.ai/v1/workflows/560EB9DDSwOFc8As/run
存储服务: https://chestier-unremittently-willis.ngrok-free.dev
```

### 工作流2 - 生成答案
```
API密钥: app-TEw1j6rBUw0ZHHlTdJvJFfPB
工作流ID: 5X6RBtTFMCZr0r4R
API端点: https://api.dify.ai/v1/workflows/5X6RBtTFMCZr0r4R/run
存储服务: https://phrenologic-preprandial-jesica.ngrok-free.dev
```

### 工作流3 - 评分
```
API密钥: app-Omq7PcI6P5g1CfyDnT8CNiua
工作流ID: 7C4guOpDk2GfmIFy
API端点: https://api.dify.ai/v1/workflows/7C4guOpDk2GfmIFy/run
存储服务: https://phrenologic-preprandial-jesica.ngrok-free.dev
```

---

## 📋 典型使用流程

### 流程1: 完整的面试流程

```
1. 用户输入职位名称
   ↓
2. 调用工作流1 → 获取5个面试问题 + session_id
   ↓
3. [可选] 并行调用工作流2为所有问题生成标准答案
   ↓
4. 用户逐题回答
   ↓
5. 每次用户回答完成后，调用工作流3评分
   ↓
6. 显示评分和评价
```

### 流程2: 单个问题评分

```
1. 已有 session_id 和 question_id
   ↓
2. 用户输入回答
   ↓
3. 调用工作流3评分
   ↓
4. 返回评分结果
```

---

## 🧪 测试命令快速参考

### 运行完整测试
```bash
node test-workflows-complete.js
```

### 运行原始测试
```bash
node test-dify-workflows.js
```

---

## 🛠️ 常用JavaScript代码片段

### 调用工作流1 - 生成问题

```javascript
async function generateQuestions(jobTitle) {
  const response = await fetch(
    'https://api.dify.ai/v1/workflows/560EB9DDSwOFc8As/run',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer app-hHvF3glxCRhtfkyX7Pg9i9kb',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: { job_title: jobTitle },
        response_mode: 'blocking',
        user: 'user-' + Date.now()
      })
    }
  );

  const data = await response.json();
  return data.workflow_run.outputs;
}
```

### 调用工作流3 - 评分

```javascript
async function scoreAnswer(sessionId, questionId, candidateAnswer) {
  const response = await fetch(
    'https://api.dify.ai/v1/workflows/7C4guOpDk2GfmIFy/run',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer app-Omq7PcI6P5g1CfyDnT8CNiua',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          session_id: sessionId,
          question_id: questionId,
          candidate_answer: candidateAnswer
        },
        response_mode: 'blocking',
        user: 'user-' + Date.now()
      })
    }
  );

  const data = await response.json();
  return data.workflow_run.outputs;
}
```

---

## ⚠️ 常见问题速解

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| 401 Unauthorized | API密钥错误 | 检查密钥是否正确复制 |
| 请求超时 | 工作流耗时过长 | 等待或检查Dify服务状态 |
| 404 Not Found | 工作流ID或存储ID不存在 | 验证session_id和question_id |
| JSON解析错误 | 返回数据格式异常 | 检查工作流输出配置 |
| 存储连接失败 | ngrok隧道断开 | 重启外部存储服务 |

---

## 📊 性能指标

基于测试环境的性能数据：

- **工作流1执行时间**: 10-20秒（包括Google搜索和LLM调用）
- **工作流2执行时间**: 15-30秒（生成详细标准答案）
- **工作流3执行时间**: 5-15秒（评分和评价生成）
- **存储API响应**: < 1秒

---

## 🔄 API请求/响应格式

### 标准请求格式
```json
{
  "inputs": {
    "param1": "value1",
    "param2": "value2"
  },
  "response_mode": "blocking",
  "user": "user-id-or-name"
}
```

### 标准响应格式
```json
{
  "workflow_run": {
    "outputs": {
      "output_key1": "value1",
      "output_key2": "value2"
    }
  }
}
```

---

## 🔗 相关文件位置

- **集成文档**: `DIFY_WORKFLOWS_INTEGRATION.md`
- **测试脚本**: `test-workflows-complete.js`
- **工作流配置**: `D:\code7\test5\`
- **环境文件模板**: `.env.example`

---

## ✨ 下一步

1. ✅ 运行测试脚本验证所有工作流
2. ✅ 在后端集成工作流API调用
3. ✅ 在前端UI中添加工作流触发逻辑
4. ✅ 配置错误处理和重试机制
5. ✅ 部署到生产环境

---

**最后更新**: 2024-10-23
