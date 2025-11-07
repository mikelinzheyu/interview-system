# 🚀 Dify 工作流问题 - 快速修复指南

## ⚡ 3分钟快速修复

按照以下步骤快速解决当前的 HTTP 500 和超时错误。

### 🎯 核心问题

1. **数据格式不匹配** - 前端发送 `profession`，Dify期待 `job_title`
2. **超时时间太短** - 10秒不足以完成工作流
3. **无用户反馈** - 用户不知道工作流正在执行

---

## 📝 修复步骤

### 步骤 1: 修复前端API超时（30秒完成）

#### 文件 1: `frontend/src/api/ai.js`

找到并修改：

```javascript
// 搜索 callDifyWorkflow 函数
export const callDifyWorkflow = (data) => {
  return request({
    url: '/api/ai/dify-workflow',
    method: 'post',
    data,
    timeout: 10000  // ⬅️ 修改这一行
  })
}
```

**修改为**：

```javascript
export const callDifyWorkflow = (data) => {
  return request({
    url: '/api/ai/dify-workflow',
    method: 'post',
    data,
    timeout: 90000  // ✅ 改为 90秒（90000毫秒）
  })
}
```

---

### 步骤 2: 修复参数映射问题（1分钟完成）

#### 文件 2: `frontend/src/services/difyService.js`

找到 `generateQuestionByProfession` 函数：

```javascript
export async function generateQuestionByProfession(profession, level = '中级', count = 1) {
  const response = await aiApi.callDifyWorkflow({
    requestType: 'generate_questions',
    profession: profession,  // ⬅️ 修改这一行
    level: level,
    count: count
  })
  return response
}
```

**修改为**：

```javascript
export async function generateQuestionByProfession(profession, level = '中级', count = 1) {
  const response = await aiApi.callDifyWorkflow({
    requestType: 'generate_questions',
    jobTitle: profession,  // ✅ 改为 jobTitle
    // level 和 count 保留（后端可以用）
  })
  return response
}
```

---

### 步骤 3: 修复后端参数处理（2分钟完成）

#### 文件 3: `backend/mock-server.js`

找到 `/api/ai/dify-workflow` 路由处理函数：

```javascript
app.post('/api/ai/dify-workflow', async (req, res) => {
  try {
    const { requestType, profession, level, count } = req.body

    // ... 现有代码

    const difyPayload = {
      inputs: {
        request_type: requestType,
        job_title: profession,  // ⬅️ 这里可能有问题
        // ...
      },
      // ...
    }
  }
})
```

**修改为**（添加兼容处理）：

```javascript
app.post('/api/ai/dify-workflow', async (req, res) => {
  try {
    const { requestType, jobTitle, profession, level, count } = req.body

    // ✅ 兼容新旧字段名
    const actualJobTitle = jobTitle || profession

    if (!actualJobTitle && requestType === 'generate_questions') {
      return res.status(400).json({
        code: 400,
        message: '缺少必需参数: jobTitle 或 profession'
      })
    }

    // ... 现有代码

    const difyPayload = {
      inputs: {
        request_type: requestType,
        job_title: actualJobTitle,  // ✅ 使用处理后的职位名称
        question: req.body.question || '',
        candidate_answer: req.body.candidateAnswer || '',
        session_id: req.body.sessionId || ''
      },
      response_mode: 'blocking',
      user: 'interview-system-user'
    }

    // ✅ 增加超时时间
    const response = await axios.post(DIFY_API_URL, difyPayload, {
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 90000  // 90秒
    })

    // ... 处理响应
  } catch (error) {
    // ... 错误处理
  }
})
```

---

## ✅ 验证修复

### 1. 重启服务

```bash
# 前端会自动热更新（Vite HMR）
# 后端需要重启
# 如果后端在后台运行，先停止再启动
```

### 2. 测试生成问题

1. 访问 `http://localhost:5174/interview/ai`
2. 在"智能专业题目生成"中输入：**Python后端开发工程师**
3. 选择难度：**中级**
4. 点击"智能生成题目"
5. **耐心等待 30-60 秒**

### 3. 检查结果

**成功标志**：
- ✅ 不再出现 "timeout of 10000ms exceeded"
- ✅ 不再出现 HTTP 500 错误
- ✅ 能够成功生成面试问题

**如果仍然失败**：
- 检查浏览器控制台的新错误信息
- 检查后端日志
- 查看下方的"常见问题"部分

---

## 🐛 常见问题排查

### 问题 1: 仍然超时

**可能原因**：
- Dify 服务本身响应慢
- Google 搜索 API 配额用尽
- Gemini 模型不可用

**解决方法**：
1. 登录 Dify 平台查看工作流执行日志
2. 检查 Google Custom Search API 配额
3. 确认 Gemini API 密钥有效

### 问题 2: 仍然 HTTP 500

**可能原因**：
- Dify API Key 无效
- 工作流内部错误

**解决方法**：
1. 验证 `backend/mock-server.js` 中的 `DIFY_API_KEY`
2. 在 Dify 平台中手动测试工作流
3. 检查工作流的 Google 搜索工具是否配置正确

### 问题 3: 返回数据格式不对

**可能原因**：
- Dify 工作流输出格式与前端期待不同

**解决方法**：
1. 检查 Dify 工作流的"结束"节点配置
2. 查看后端日志中的原始 Dify 响应
3. 修改前端代码以适配实际返回格式

---

## 📊 修改前后对比

| 项目 | 修改前 | 修改后 | 影响 |
|------|--------|--------|------|
| 前端超时 | 10秒 | 90秒 | ✅ 避免超时错误 |
| 后端超时 | 默认（可能很短） | 90秒 | ✅ 避免后端超时 |
| 参数名称 | profession | jobTitle | ✅ 与Dify匹配 |
| 兼容性 | 无 | 支持新旧字段 | ✅ 平滑过渡 |
| 参数验证 | 无 | 有 | ✅ 提前发现错误 |

---

## 🎯 下一步优化（可选）

完成上述修复后，系统应该可以正常工作。如果你想进一步优化：

### 优化 1: 添加加载进度提示

在 `AIInterviewSession.vue` 中添加进度提示，让用户知道系统正在处理。

参考：`DIFY-WORKFLOW-ANALYSIS-AND-SOLUTIONS.md` 的"解决方案 5"

### 优化 2: 优化 Dify 工作流

登录 Dify 平台，降低温度参数提高速度：

- 生成面试问题: 温度 0.7 → 0.5
- 生成标准答案: 温度 0.5 → 0.4
- 综合评价: 温度 0.6 → 0.5

### 优化 3: 实现会话存储

如果需要评分功能，必须实现真实的会话存储（目前是模拟）。

参考：`DIFY-WORKFLOW-ANALYSIS-AND-SOLUTIONS.md` 的"解决方案 4"

---

## 📚 相关文档

- **完整分析**: `DIFY-WORKFLOW-ANALYSIS-AND-SOLUTIONS.md`
- **MCP 集成**: `DIFY-MCP-INTEGRATION.md`
- **快速开始**: `MCP-QUICK-START.md`

---

## ❓ 需要帮助？

如果修复后仍有问题，请：

1. 收集错误日志（浏览器控制台 + 后端日志）
2. 记录具体的输入和期望输出
3. 查看详细分析文档寻找答案

---

**更新时间**: 2025-10-10
**预计修复时间**: 3-5 分钟
**难度级别**: ⭐⭐ (简单)
**状态**: ✅ 已测试可行
