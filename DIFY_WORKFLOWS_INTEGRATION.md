# Dify工作流集成文档

## 📋 概述

您已有三个完整的Dify工作流，用于AI面试官系统的核心功能：
1. **工作流1**: 生成面试问题
2. **工作流2**: 生成标准答案
3. **工作流3**: 评分候选人回答

## 🔐 工作流凭据配置

### 工作流1 - 生成问题 (生成问题)

| 项目 | 值 |
|------|-----|
| **公开访问URL** | https://udify.app/workflow/560EB9DDSwOFc8As |
| **API端点** | https://api.dify.ai/v1/workflows/560EB9DDSwOFc8As/run |
| **API密钥** | `app-hHvF3glxCRhtfkyX7Pg9i9kb` |
| **工作流ID** | `560EB9DDSwOFc8As` |
| **MCP服务端点** | https://api.dify.ai/mcp/server/UqMNCRPfhtX2Io3D/mcp |
| **外部存储端点** | https://chestier-unremittently-willis.ngrok-free.dev |
| **输入参数** | `job_title` (职位名称) |
| **输出参数** | `session_id`, `questions`, `job_title`, `question_count` |

**输入示例:**
```json
{
  "job_title": "Python后端开发工程师"
}
```

**输出示例:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "questions": "[\"问题1\", \"问题2\", ..., \"问题5\"]",
  "job_title": "Python后端开发工程师",
  "question_count": 5
}
```

---

### 工作流2 - 生成答案 (生成标准答案)

| 项目 | 值 |
|------|-----|
| **公开访问URL** | https://udify.app/workflow/5X6RBtTFMCZr0r4R |
| **API端点** | https://api.dify.ai/v1/workflows/5X6RBtTFMCZr0r4R/run |
| **API密钥** | `app-TEw1j6rBUw0ZHHlTdJvJFfPB` |
| **工作流ID** | `5X6RBtTFMCZr0r4R` |
| **MCP服务端点** | https://api.dify.ai/mcp/server/rRhFPigobMYdE8Js/mcp |
| **外部存储端点** | https://phrenologic-preprandial-jesica.ngrok-free.dev |
| **输入参数** | `session_id` (会话ID), `question_id` (问题ID) |
| **输出参数** | `session_id`, `question_id`, `generated_answer`, `save_status` |

**输入示例:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": "550e8400-e29b-41d4-a716-446655440000-q1"
}
```

**输出示例:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": "550e8400-e29b-41d4-a716-446655440000-q1",
  "generated_answer": "Python后端开发工程师需要掌握...",
  "save_status": "成功"
}
```

---

### 工作流3 - 评分 (评分候选人回答)

| 项目 | 值 |
|------|-----|
| **公开访问URL** | https://udify.app/workflow/7C4guOpDk2GfmIFy |
| **API端点** | https://api.dify.ai/v1/workflows/7C4guOpDk2GfmIFy/run |
| **API密钥** | `app-Omq7PcI6P5g1CfyDnT8CNiua` |
| **工作流ID** | `7C4guOpDk2GfmIFy` |
| **MCP服务端点** | https://api.dify.ai/mcp/server/us5bQe5TwQbJWQxG/mcp |
| **外部存储端点** | https://phrenologic-preprandial-jesica.ngrok-free.dev |
| **输入参数** | `session_id`, `question_id`, `candidate_answer` |
| **输出参数** | `session_id`, `question`, `comprehensive_evaluation`, `overall_score` |

**输入示例:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": "550e8400-e29b-41d4-a716-446655440000-q1",
  "candidate_answer": "候选人的回答内容..."
}
```

**输出示例:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "question": "面试问题文本",
  "comprehensive_evaluation": "综合评价文本...",
  "overall_score": 85
}
```

---

## 🧪 测试流程

### 快速开始

运行完整测试脚本（包括所有三个工作流）:

```bash
cd D:\code7\interview-system
node test-workflows-complete.js
```

### 预期测试输出

测试脚本将执行以下步骤:

1. **工作流1测试** - 生成问题
   - 输入职位名称
   - 验证是否生成5个面试问题
   - 验证数据是否正确存储到外部存储

2. **工作流2测试** - 生成答案
   - 使用工作流1返回的session_id和第一个问题ID
   - 为该问题生成标准答案
   - 验证答案是否正确保存

3. **工作流3测试** - 评分
   - 使用session_id和问题ID
   - 模拟候选人的回答
   - 验证是否返回评分(0-100)和综合评价

### 常见问题排查

#### 问题1: 401 Unauthorized 错误

**原因**: API密钥无效或过期

**解决方案**:
- 验证API密钥是否正确复制
- 检查密钥是否在Dify工作流设置中重新生成
- 确认密钥有效期未过期

#### 问题2: 网络超时

**原因**: 请求超过180秒无响应

**解决方案**:
- 检查网络连接
- 检查Dify API服务状态
- 增加超时时间（当前设置为180秒）

#### 问题3: 外部存储API连接失败

**原因**: ngrok隧道断开或API端点地址变更

**解决方案**:
- 验证外部存储服务是否正常运行
- 检查ngrok隧道是否仍然活跃
- 更新ngrok地址（如果地址已变更）

#### 问题4: JSON解析错误

**原因**: 工作流返回的数据格式与预期不符

**解决方案**:
- 查看原始响应数据
- 检查工作流的输出配置
- 验证输入参数格式是否正确

---

## 🔌 在项目中集成工作流

### 后端集成示例 (Node.js)

```javascript
// 调用工作流1 - 生成问题
async function generateInterviewQuestions(jobTitle) {
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
        user: 'user-123'
      })
    }
  );

  const result = await response.json();
  return result.workflow_run.outputs;
}

// 调用工作流2 - 生成答案
async function generateStandardAnswer(sessionId, questionId) {
  const response = await fetch(
    'https://api.dify.ai/v1/workflows/5X6RBtTFMCZr0r4R/run',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer app-TEw1j6rBUw0ZHHlTdJvJFfPB',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: { session_id: sessionId, question_id: questionId },
        response_mode: 'blocking',
        user: 'user-123'
      })
    }
  );

  const result = await response.json();
  return result.workflow_run.outputs;
}

// 调用工作流3 - 评分
async function scoreInterviewAnswer(sessionId, questionId, candidateAnswer) {
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
        user: 'user-123'
      })
    }
  );

  const result = await response.json();
  return result.workflow_run.outputs;
}
```

### 前端调用示例 (Vue.js)

```javascript
// 在组件中调用工作流
export default {
  data() {
    return {
      jobTitle: '',
      sessionId: null,
      questions: [],
      answers: {},
      scores: {}
    };
  },
  methods: {
    // 生成问题
    async generateQuestions() {
      const response = await this.$api.post('/api/interview/generate-questions', {
        job_title: this.jobTitle
      });

      this.sessionId = response.data.session_id;
      this.questions = JSON.parse(response.data.questions);
    },

    // 生成答案
    async generateAnswer(questionId) {
      const response = await this.$api.post('/api/interview/generate-answer', {
        session_id: this.sessionId,
        question_id: questionId
      });

      this.answers[questionId] = response.data.generated_answer;
    },

    // 评分
    async scoreAnswer(questionId, candidateAnswer) {
      const response = await this.$api.post('/api/interview/score-answer', {
        session_id: this.sessionId,
        question_id: questionId,
        candidate_answer: candidateAnswer
      });

      this.scores[questionId] = {
        score: response.data.overall_score,
        evaluation: response.data.comprehensive_evaluation
      };
    }
  }
};
```

---

## 📊 工作流架构

```
┌─────────────────────────────────────────────────────────────┐
│                      工作流1: 生成问题                        │
│                                                              │
│  用户输入: 职位名称 ──→ Google搜索 ──→ Gemini提取 ──→ 保存  │
│                       职位信息        问题与技能      到存储  │
│                                                              │
│  输出: 会话ID + 5个面试问题                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  工作流2: 生成标准答案                        │
│                                                              │
│  会话ID + 问题ID ──→ 加载问题 ──→ Google搜索 ──→ Gemini生成 │
│                      (从存储)      相关资料        标准答案   │
│                                    ↓                      │
│                              保存到存储                      │
│                                                              │
│  输出: 标准答案 (保存到存储)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      工作流3: 评分                            │
│                                                              │
│  会话ID + 问题ID + 候选回答 ──→ 加载标准答案 ──→ Gemini评分│
│                         (从存储)              返回评价+分数 │
│                                                              │
│  输出: 综合评价 + 总分(0-100)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 环境变量配置

如果需要在项目中配置这些凭据，可以添加到 `.env` 文件:

```env
# Dify 工作流1 - 生成问题
DIFY_WORKFLOW1_ID=560EB9DDSwOFc8As
DIFY_WORKFLOW1_API_KEY=app-hHvF3glxCRhtfkyX7Pg9i9kb
DIFY_WORKFLOW1_STORAGE_URL=https://chestier-unremittently-willis.ngrok-free.dev

# Dify 工作流2 - 生成答案
DIFY_WORKFLOW2_ID=5X6RBtTFMCZr0r4R
DIFY_WORKFLOW2_API_KEY=app-TEw1j6rBUw0ZHHlTdJvJFfPB
DIFY_WORKFLOW2_STORAGE_URL=https://phrenologic-preprandial-jesica.ngrok-free.dev

# Dify 工作流3 - 评分
DIFY_WORKFLOW3_ID=7C4guOpDk2GfmIFy
DIFY_WORKFLOW3_API_KEY=app-Omq7PcI6P5g1CfyDnT8CNiua
DIFY_WORKFLOW3_STORAGE_URL=https://phrenologic-preprandial-jesica.ngrok-free.dev

# 外部存储API密钥
EXTERNAL_STORAGE_API_KEY=ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

---

## 📈 性能优化建议

1. **异步生成答案**: 工作流2可以为多个问题并行运行，不需要等待工作流1完全完成

2. **缓存机制**: 为相同职位的生成问题添加缓存，避免重复调用

3. **批量评分**: 可以在后端进行批量评分，而不是逐个问题评分

4. **超时处理**: 确保在工作流耗时较长时有适当的超时和重试机制

5. **错误恢复**: 实现自动重试机制，特别是对于网络超时的情况

---

## 🔒 安全注意事项

1. **API密钥管理**:
   - 不要在版本控制中提交API密钥
   - 使用环境变量存储敏感信息
   - 定期轮换API密钥

2. **外部存储安全**:
   - ngrok隧道应该使用身份验证
   - 确保API端点不暴露敏感数据
   - 实现访问控制和日志记录

3. **输入验证**:
   - 验证所有用户输入
   - 防止SQL注入和其他注入攻击
   - 限制请求大小

---

## 📚 更多资源

- [Dify官方文档](https://docs.dify.ai/)
- [Dify API参考](https://api.dify.ai/docs)
- [工作流配置文件](D:\code7\test5)

---

## ✅ 检查清单

在生产环境部署前，请确保：

- [ ] 所有API密钥都正确配置
- [ ] 外部存储服务正常运行
- [ ] 工作流测试脚本运行成功
- [ ] 错误处理和重试机制已实现
- [ ] API超时设置适当
- [ ] 安全措施已到位（API密钥管理、输入验证等）
- [ ] 日志记录已配置
- [ ] 性能测试已完成
- [ ] 用户文档已准备

---

最后更新: 2024年10月23日
