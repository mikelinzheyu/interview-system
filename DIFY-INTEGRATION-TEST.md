# Dify 工作流集成测试指南

## 🎉 恭喜！Dify 工作流已成功集成

你的 Dify 工作流已经成功集成到 `/interview/ai` 页面中！

---

## ✅ 已完成的工作

### 1. 后端配置 ✓
- ✅ 配置了 Dify API 密钥: `app-vZlc0w5Dio2gnrTkdlblcPXG`
- ✅ 创建了 `.env` 配置文件
- ✅ 安装了 `dotenv` 依赖
- ✅ 在 `backend/mock-server.js` 中添加了 Dify API 调用函数
- ✅ 添加了 `/api/ai/dify-workflow` 路由处理

### 2. 前端配置 ✓
- ✅ 在 `frontend/src/api/ai.js` 中添加了 `callDifyWorkflow()` API
- ✅ 更新了 `frontend/src/services/difyService.js` 通过后端代理调用
- ✅ 前端页面 `AIInterviewSession.vue` 已实现智能专业题目生成功能

---

## 🚀 启动服务测试

### 步骤 1: 启动后端服务

```bash
cd D:\code7\interview-system\backend
node mock-server.js
```

**预期输出:**
```
🔧 Dify 配置: {
  apiKey: 'app-vZlc0w...',
  baseURL: 'https://api.dify.ai/v1'
}
🚀 Mock API服务器已启动
📍 地址: http://localhost:3001
```

### 步骤 2: 启动前端服务

打开新的命令行窗口:

```bash
cd D:\code7\interview-system\frontend
npm run dev
```

**预期输出:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
```

---

## 🧪 功能测试

### 测试 1: 访问面试页面

1. 打开浏览器访问: **`http://localhost:5174/interview/ai`**
2. 你应该看到 AI 智能面试系统界面

### 测试 2: 生成智能专业题目

1. 在页面顶部找到 **"🎯 智能专业题目生成"** 卡片
2. 在下拉框中选择一个专业，例如: **"Python后端开发工程师"**
3. 选择难度级别: **"中级"**
4. 点击 **"智能生成题目"** 按钮

**预期结果:**
- ✅ 按钮显示 "正在生成题目..." 加载状态
- ✅ 后端控制台输出 Dify API 调用日志
- ✅ 约 10-30 秒后返回生成的题目
- ✅ 题目显示在右侧面试问题卡片中
- ✅ 题目标记为 "AI智能生成"

**后端控制台预期日志:**
```
🔄 收到 Dify 工作流请求: { requestType: 'generate_questions', jobTitle: 'Python后端开发工程师' }
📡 调用 Dify API: {
  url: 'https://api.dify.ai/v1/workflows/run',
  requestType: 'generate_questions',
  jobTitle: 'Python后端开发工程师'
}
📥 Dify 响应状态: 200
✅ Dify 工作流调用成功
```

### 测试 3: 回答问题并获取评分

1. 开启摄像头
2. 点击 "开始录音" 按钮
3. 语音回答生成的问题
4. 点击 "停止录音"
5. 点击 "分析回答" 按钮

**预期结果:**
- ✅ 系统调用 Dify 工作流进行评分
- ✅ 返回 AI 综合评价和分数
- ✅ 显示详细的评分结果

---

## 🔍 调试技巧

### 查看后端日志

后端会输出详细的日志信息:
- `🔧` Dify 配置加载
- `🔄` 收到 Dify 工作流请求
- `📡` 调用 Dify API
- `📥` Dify 响应状态
- `✅` 调用成功
- `❌` 调用失败(如果有错误)

### 查看浏览器控制台

打开浏览器开发者工具(F12) -> Console 标签:
- 查看前端 API 调用日志
- 查看 Dify Service 日志
- 查看错误信息

### 查看网络请求

打开浏览器开发者工具(F12) -> Network 标签:
- 查找 `/api/ai/dify-workflow` 请求
- 查看请求体(Request Payload)
- 查看响应数据(Response)

---

## ❌ 常见问题排查

### 问题 1: "调用 Dify API 失败"

**可能原因:**
- Dify API Key 无效或已过期
- 网络连接问题
- Dify 服务器故障

**解决方法:**
1. 检查 `.env` 文件中的 API Key 是否正确
2. 测试网络连接: `ping api.dify.ai`
3. 访问 Dify 平台检查 API Key 状态

### 问题 2: "请求超时"

**可能原因:**
- Dify 工作流执行时间过长(>30秒)
- 网络不稳定

**解决方法:**
1. 增加超时时间 (在 backend/mock-server.js 第 2312 行)
2. 检查网络质量
3. 简化 Dify 工作流步骤

### 问题 3: "CORS 错误"

**可能原因:**
- 后端服务未启动
- 前端 API 调用错误

**解决方法:**
1. 确保后端服务运行在 `http://localhost:3001`
2. 检查前端 API 配置中的 `baseURL`

### 问题 4: "题目返回为空"

**可能原因:**
- Dify 工作流返回数据格式不匹配
- 解析函数出错

**解决方法:**
1. 查看后端控制台的 Dify 响应数据
2. 检查 `parseQuestions()` 函数 (backend/mock-server.js 第 2331 行)
3. 根据实际返回格式调整解析逻辑

---

## 📊 测试数据示例

### 成功的 API 响应示例

**生成题目:**
```json
{
  "code": 200,
  "message": "调用成功",
  "data": {
    "session_id": "mock-session-1234567890",
    "generated_questions": [
      "请介绍一下你在Python后端开发方面最有挑战性的一个项目。",
      "对于Python后端开发这个岗位,你认为最重要的技能是什么？",
      "请描述你如何解决Python后端开发工作中遇到的技术难题。"
    ],
    "metadata": {
      "workflowId": "wf-xxxxx",
      "processingTime": 15000
    }
  }
}
```

**评分答案:**
```json
{
  "code": 200,
  "message": "调用成功",
  "data": {
    "comprehensive_evaluation": "候选人的回答展现了对Python后端开发的深入理解...",
    "overall_score": 85,
    "metadata": {
      "workflowId": "wf-xxxxx",
      "processingTime": 8000
    }
  }
}
```

---

## 🎯 下一步优化建议

1. **添加错误重试机制**: 当 Dify API 调用失败时自动重试
2. **实现 session_id 持久化**: 将 session_id 保存到 localStorage
3. **优化加载体验**: 添加进度条显示 Dify 工作流执行进度
4. **批量生成**: 支持一次生成多道题目
5. **历史记录**: 保存生成的题目和评分历史

---

## 📚 相关文档

- [完整实施方案](./DIFY-INTEGRATION-GUIDE.md)
- [Dify 官方文档](https://docs.dify.ai/)
- [项目文档索引](./DOCUMENTATION-INDEX.md)

---

## ✨ 总结

你的 Dify 工作流已经成功集成！现在可以:

✅ 在 `/interview/ai` 页面输入专业名称
✅ 调用 Dify 工作流智能生成面试题目
✅ 语音回答问题
✅ 获取 AI 智能评分

**祝你使用愉快！** 🚀

如有任何问题，请查看上面的常见问题排查部分，或联系技术支持。
