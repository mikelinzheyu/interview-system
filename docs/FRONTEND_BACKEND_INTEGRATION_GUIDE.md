# 前后端联调集成指南

**Date:** 2025-10-24 16:00
**Status:** 🔧 **集成进行中**

---

## 系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     前端 (Vue.js)                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AIInterviewSession.vue / CreateInterview.vue          │  │
│  │ - 职位选择                                             │  │
│  │ - 问题展示                                             │  │
│  │ - 答案输入                                             │  │
│  │ - 评分展示                                             │  │
│  └─────────────────┬─────────────────────────────────────┘  │
│                    │ HTTP/REST                               │
└────────────────────┼───────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            后端 (Node.js Mock Server)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ POST /api/ai/dify-workflow                            │  │
│  │ ├─ Workflow1: 生成问题 (generate_questions)          │  │
│  │ ├─ Workflow2: 生成答案 (generate_answer)             │  │
│  │ └─ Workflow3: 评分 (score_answer)                    │  │
│  └─────────────────┬─────────────────────────────────────┘  │
│                    │ HTTPS/API Key                           │
└────────────────────┼───────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Dify Cloud (api.dify.ai)                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✅ Workflow1: 560EB9DDSwOFc8As                        │  │
│  │ ✅ Workflow2: 5X6RBtTFMCZr0r4R                        │  │
│  │ ✅ Workflow3: 7C4guOpDk2GfmIFy                        │  │
│  └─────────────────┬─────────────────────────────────────┘  │
│                    │ 网络请求                                │
└────────────────────┼───────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Storage Service (ngrok tunnel)                      │
│  https://phrenologic-preprandial-jesica.ngrok-free.dev      │
│  POST /api/sessions                                         │
│  GET /api/sessions/{sessionId}                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 当前状态

### 前端 ✅
- ✅ AIInterviewSession.vue 已实现
- ✅ difyService.js 已实现（调用后端）
- ✅ API 客户端已实现 (callDifyWorkflow)
- ✅ 可以接收问题、答案、评分

### 后端 ✅
- ✅ POST /api/ai/dify-workflow 端点已实现
- ✅ callDifyWorkflow 函数已实现
- ✅ 错误处理已实现
- ⚠️ **需要更新：** 使用正确的 Workflow IDs

### Dify 工作流 ✅
- ✅ Workflow1 已测试
- ✅ Workflow2 已修复并测试
- ✅ Workflow3 已配置

---

## 需要的修改

### 1. 后端配置更新

**文件:** `backend/mock-server.js`

**当前问题:** 后端没有为不同的工作流使用不同的 Workflow IDs

**修复方案:**

```javascript
// 第 21-25 行，修改为：
const DIFY_CONFIG = {
  apiKey: process.env.DIFY_API_KEY || 'app-vZlc0w5Dio2gnrTkdlblcPXG',
  baseURL: process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1',
  workflowURL: process.env.DIFY_WORKFLOW_URL || 'https://udify.app/workflow/u4Pzho5oyj5HIOn8',
  // 新增：具体工作流配置
  workflows: {
    generate_questions: {
      id: '560EB9DDSwOFc8As',
      apiKey: 'app-hHvF3glxCRhtfkyX7Pg9i9kb'
    },
    generate_answer: {
      id: '5X6RBtTFMCZr0r4R',
      apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB'
    },
    score_answer: {
      id: '7C4guOpDk2GfmIFy',
      apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua'
    }
  }
}
```

### 2. 后端 callDifyWorkflow 函数更新

**文件:** `backend/mock-server.js` 第 2356 行

**需要修改:**
1. 根据 `requestType` 选择正确的 Workflow ID
2. 使用对应的 API Key
3. 处理 Workflow2 的答案保存

```javascript
async function callDifyWorkflow(requestData) {
  // 获取对应的工作流配置
  let workflowConfig = DIFY_CONFIG.workflows.generate_questions
  let workflowId = '560EB9DDSwOFc8As'
  let apiKey = DIFY_CONFIG.apiKey

  if (requestData.requestType === 'generate_questions') {
    workflowConfig = DIFY_CONFIG.workflows.generate_questions
    workflowId = '560EB9DDSwOFc8As'
    apiKey = 'app-hHvF3glxCRhtfkyX7Pg9i9kb'
  } else if (requestData.requestType === 'generate_answer') {
    workflowConfig = DIFY_CONFIG.workflows.generate_answer
    workflowId = '5X6RBtTFMCZr0r4R'
    apiKey = 'app-TEw1j6rBUw0ZHHlTdJvJFfPB'
  } else if (requestData.requestType === 'score_answer') {
    workflowConfig = DIFY_CONFIG.workflows.score_answer
    workflowId = '7C4guOpDk2GfmIFy'
    apiKey = 'app-Omq7PcI6P5g1CfyDnT8CNiua'
  }

  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      inputs: {
        job_title: requestData.jobTitle || '',
        request_type: requestData.requestType || 'generate_questions',
        question: requestData.question || '',
        question_id: requestData.questionId || '',
        standard_answer: requestData.standardAnswer || '',
        candidate_answer: requestData.candidateAnswer || '',
        session_id: requestData.sessionId || ''
      },
      response_mode: 'blocking',
      user: requestData.userId || 'user-' + Date.now()
    })

    // 使用正确的 API 端点格式
    const apiUrl = new URL(`${DIFY_CONFIG.baseURL}/workflows/${workflowId}/run`)

    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname + apiUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    }

    console.log('📡 调用 Dify 工作流:', {
      workflowId,
      url: apiUrl.href,
      requestType: requestData.requestType,
      jobTitle: requestData.jobTitle || 'N/A'
    })

    // ... rest of the function
  })
}
```

---

## 工作流集成细节

### Workflow1: 生成问题

**前端调用:**
```javascript
await difyService.generateQuestionByProfession('Python后端开发工程师')
```

**后端处理流程:**
```
POST /api/ai/dify-workflow
├─ requestType: 'generate_questions'
├─ jobTitle: 'Python后端开发工程师'
└─ Dify API 调用
   └─ Workflow1 (560EB9DDSwOFc8As)
      └─ 返回: 5 个问题 + sessionId
```

**预期响应:**
```json
{
  "code": 200,
  "data": {
    "session_id": "uuid",
    "questions": [
      {
        "id": "uuid-q1",
        "question": "问题文本",
        "hasAnswer": false,
        "answer": null
      }
    ],
    "job_title": "Python后端开发工程师",
    "metadata": {
      "workflowRunId": "run_id",
      "processingTime": 8000
    }
  }
}
```

### Workflow2: 生成答案

**前端调用:**
```javascript
await difyService.generateAnswerByQuestion({
  sessionId: 'xxx',
  questionId: 'xxx-q1',
  question: '问题文本'
})
```

**后端处理流程:**
```
POST /api/ai/dify-workflow
├─ requestType: 'generate_answer'
├─ sessionId: 'xxx'
├─ questionId: 'xxx-q1'
└─ Dify API 调用
   └─ Workflow2 (5X6RBtTFMCZr0r4R)
      ├─ 加载问题信息
      ├─ Google搜索
      ├─ GPT-4o 生成答案
      └─ 保存到存储服务
         └─ POST https://ngrok.../api/sessions
            └─ 更新问题: hasAnswer: true
```

**预期响应:**
```json
{
  "code": 200,
  "data": {
    "session_id": "xxx",
    "question_id": "xxx-q1",
    "generated_answer": "## 标准答案：...",
    "save_status": "成功",
    "metadata": {
      "workflowRunId": "run_id",
      "processingTime": 18000
    }
  }
}
```

### Workflow3: 评分

**前端调用:**
```javascript
await difyService.analyzeAnswerWithDify({
  sessionId: 'xxx',
  questionId: 'xxx-q1',
  question: '问题文本',
  answer: '候选人答案'
})
```

**后端处理流程:**
```
POST /api/ai/dify-workflow
├─ requestType: 'score_answer'
├─ sessionId: 'xxx'
├─ questionId: 'xxx-q1'
├─ question: '问题文本'
├─ candidateAnswer: '候选人答案'
└─ Dify API 调用
   └─ Workflow3 (7C4guOpDk2GfmIFy)
      ├─ 加载标准答案
      ├─ 比较候选答案
      ├─ GPT-4o 生成评价
      └─ 返回评分 + 反馈
```

**预期响应:**
```json
{
  "code": 200,
  "data": {
    "session_id": "xxx",
    "question_id": "xxx-q1",
    "overall_score": 82,
    "comprehensive_evaluation": "评价文本...",
    "metadata": {
      "workflowRunId": "run_id",
      "processingTime": 12000
    }
  }
}
```

---

## 集成检查清单

### 后端配置
- [ ] 更新 DIFY_CONFIG 包含所有三个工作流 ID
- [ ] 更新 callDifyWorkflow 函数支持不同 requestType
- [ ] 确保使用正确的 API 端点格式 `/workflows/{id}/run`
- [ ] 测试所有三个工作流

### 前端集成
- [ ] 验证 difyService.js 调用后端端点
- [ ] 验证 AIInterviewSession.vue 显示问题
- [ ] 验证输入答案并调用评分
- [ ] 验证显示评分结果

### 数据流验证
- [ ] Session ID 正确传递和保存
- [ ] 问题列表正确格式化
- [ ] 答案正确返回和显示
- [ ] 评分和反馈正确显示

### 存储服务集成
- [ ] 后端能调用存储服务
- [ ] ngrok 隧道配置正确
- [ ] 会话数据正确保存
- [ ] 答案信息正确更新

---

## 测试计划

### 单元测试
```bash
# 测试后端 Dify 调用
curl -X POST http://localhost:3001/api/ai/dify-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "generate_questions",
    "jobTitle": "Python后端开发工程师"
  }'
```

### 集成测试
1. 前端输入职位名称
2. 后端调用 Workflow1
3. 前端显示生成的问题
4. 用户输入答案
5. 后端调用 Workflow2
6. 前端显示生成的标准答案
7. 后端调用 Workflow3
8. 前端显示评分结果

### E2E 测试
- [ ] 打开面试页面
- [ ] 选择职位
- [ ] 生成问题
- [ ] 输入答案
- [ ] 获取评分
- [ ] 显示完整反馈

---

## 环境配置

**本地开发环境:**
```bash
# 后端启动
node backend/mock-server.js

# 前端启动
npm run dev (在 frontend 目录)

# ngrok 隧道
ngrok http 8090

# Redis
docker-compose up redis
```

**环境变量:**
```bash
# .env 文件
DIFY_API_KEY=app-hHvF3glxCRhtfkyX7Pg9i9kb
DIFY_API_BASE_URL=https://api.dify.ai/v1
STORAGE_API_URL=https://phrenologic-preprandial-jesica.ngrok-free.dev
STORAGE_API_KEY=ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

---

## 常见问题排查

### 问题1: Workflow 返回 404
**原因:** Workflow ID 错误
**解决:** 确认使用正确的三个 ID

### 问题2: API Key 未授权 (401)
**原因:** 使用了错误的 API Key
**解决:** 使用对应 Workflow 的 API Key

### 问题3: 会话数据未保存
**原因:** ngrok 隧道配置错误
**解决:** 检查 ngrok 状态和URL

### 问题4: 答案未显示
**原因:** 前端未正确处理响应
**解决:** 检查浏览器开发者工具中的网络请求

---

## 下一步

1. ✅ 更新后端配置
2. ✅ 测试各个工作流
3. ✅ 集成前后端
4. ✅ 端到端测试
5. 部署到生产环境

---

**Generated:** 2025-10-24 16:00
**Status:** 集成进行中
