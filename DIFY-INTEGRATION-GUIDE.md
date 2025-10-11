# Dify 工作流集成实施方案

## 📌 概述

本文档提供了在 `http://localhost:5174/interview/ai` 页面实现 Dify 工作流调用的完整方案。

基于你的 Dify 工作流配置文件 (`D:\code7\test5\AI 面试官 - 全流程定制与评分 (RAG) (2).yml`),实现智能专业题目生成功能。

---

## 🎯 功能需求

用户在"智能专业题目生成"区域输入专业名称,调用 Dify 工作流,自动生成面试题目。

### 工作流程

1. **用户输入专业** → 例如: "Python后端开发工程师"
2. **调用 Dify 工作流** → `request_type: generate_questions`
3. **获取生成的问题列表** → 返回 5 道智能生成的题目
4. **用户回答问题** → 语音输入答案
5. **调用 Dify 评分** → `request_type: score_answer`
6. **展示评分结果** → 显示 AI 综合评价和分数

---

## 🛠️ 实施方案

### 方案 A: 直接调用 Dify API (推荐)

#### 优点
- 真实调用 Dify 平台
- 获得最佳的 AI 生成质量
- 完整的 RAG 检索能力

#### 前置条件
- 需要 Dify API Key
- 需要部署 Dify 工作流
- 需要配置 API 端点

#### 实施步骤

### 步骤 1: 配置 Dify API 密钥

创建环境变量配置文件 `backend/.env`:

```bash
# Dify API 配置
DIFY_API_KEY=app-your-dify-api-key-here
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_ID=your-workflow-id

# 或使用本地部署的 Dify
# DIFY_API_BASE_URL=http://localhost:5001/v1
```

### 步骤 2: 在 Backend 添加 Dify API 代理

在 `backend/mock-server.js` 中添加以下代码:

```javascript
// 在文件顶部添加依赖
const https = require('https');
const http = require('http');
require('dotenv').config(); // 如果使用 .env 文件

// Dify 配置
const DIFY_CONFIG = {
  apiKey: process.env.DIFY_API_KEY || 'your-api-key-here',
  baseURL: process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1',
  workflowId: process.env.DIFY_WORKFLOW_ID || ''
};

/**
 * Dify 工作流调用函数
 */
async function callDifyWorkflow(requestData) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      inputs: {
        job_title: requestData.jobTitle || '',
        request_type: requestData.requestType || 'generate_questions',
        question: requestData.question || '',
        candidate_answer: requestData.candidateAnswer || '',
        session_id: requestData.sessionId || ''
      },
      response_mode: 'blocking', // 阻塞模式,等待完整响应
      user: requestData.userId || 'user-' + Date.now()
    });

    const url = new URL(`${DIFY_CONFIG.baseURL}/workflows/run`);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode === 200) {
            // 解析 Dify 响应
            const outputs = response.data?.outputs || {};

            // 根据 request_type 返回不同的数据结构
            if (requestData.requestType === 'generate_questions') {
              resolve({
                success: true,
                data: {
                  session_id: outputs.session_id,
                  generated_questions: parseQuestions(outputs.generated_questions),
                  metadata: {
                    workflowId: response.workflow_run_id,
                    processingTime: response.elapsed_time
                  }
                }
              });
            } else if (requestData.requestType === 'score_answer') {
              resolve({
                success: true,
                data: {
                  comprehensive_evaluation: outputs.comprehensive_evaluation,
                  overall_score: outputs.overall_score,
                  metadata: {
                    workflowId: response.workflow_run_id,
                    processingTime: response.elapsed_time
                  }
                }
              });
            }
          } else {
            reject({
              success: false,
              error: {
                code: 'DIFY_API_ERROR',
                message: response.message || '调用 Dify API 失败',
                statusCode: res.statusCode
              }
            });
          }
        } catch (error) {
          reject({
            success: false,
            error: {
              code: 'DIFY_PARSE_ERROR',
              message: '解析 Dify 响应失败: ' + error.message
            }
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        success: false,
        error: {
          code: 'DIFY_NETWORK_ERROR',
          message: '网络请求失败: ' + error.message
        }
      });
    });

    // 设置超时(30秒)
    req.setTimeout(30000, () => {
      req.destroy();
      reject({
        success: false,
        error: {
          code: 'DIFY_TIMEOUT',
          message: 'Dify API 请求超时'
        }
      });
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * 解析 Dify 返回的题目列表
 */
function parseQuestions(questionsData) {
  if (!questionsData) return [];

  try {
    // Dify 返回的是 JSON 数组字符串
    if (typeof questionsData === 'string') {
      const parsed = JSON.parse(questionsData);

      // 提取 question 字段
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'object' && item.question) {
            return item.question;
          }
          return item;
        });
      }
    }

    if (Array.isArray(questionsData)) {
      return questionsData;
    }

    return [];
  } catch (error) {
    console.error('解析题目失败:', error);
    return [];
  }
}

// 在路由处理中添加 Dify 调用接口
function handleDifyWorkflow(req, res, body) {
  callDifyWorkflow(body)
    .then(result => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        code: 200,
        message: '调用成功',
        data: result.data
      }));
    })
    .catch(error => {
      console.error('Dify API 调用失败:', error);
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        code: 500,
        message: error.error?.message || '调用失败',
        error: error.error
      }));
    });
}
```

然后在请求处理器中添加路由:

```javascript
// 在 handleRequest 函数中添加
} else if (pathname === '/api/ai/dify-workflow' && method === 'POST') {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      handleDifyWorkflow(req, res, data);
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 400, message: '请求格式错误' }));
    }
  });
}
```

### 步骤 3: 前端 API 调用方法

在 `frontend/src/api/ai.js` 中添加:

```javascript
/**
 * 调用 Dify 工作流
 * @param {Object} data - 请求参数
 * @param {string} data.requestType - 请求类型: generate_questions 或 score_answer
 * @param {string} data.jobTitle - 职位名称(生成题目时必填)
 * @param {string} data.sessionId - 会话ID(评分时必填)
 * @param {string} data.question - 问题(评分时必填)
 * @param {string} data.candidateAnswer - 候选人答案(评分时必填)
 */
export function callDifyWorkflow(data) {
  return api({
    url: '/ai/dify-workflow',
    method: 'post',
    data
  })
}
```

### 步骤 4: 前端页面调用(已实现)

在 `AIInterviewSession.vue` 中已经实现了调用逻辑:

```javascript
// 智能生成专业题目
const generateSmartQuestion = async () => {
  if (!selectedProfession.value) {
    ElMessage.warning('请先选择专业领域')
    return
  }

  smartQuestionLoading.value = true

  try {
    ElMessage.info(`🔍 正在为${selectedProfession.value}专业智能生成题目...`)

    // 调用Dify工作流生成题目
    const result = await difyService.generateQuestionByProfession(
      selectedProfession.value,
      {
        level: selectedDifficulty.value,
        count: 1,
        excludeQuestions: interviewSession.questions.map(q => q.id)
      }
    )

    if (result.success && result.data) {
      // 处理生成的题目...
    }
  } catch (error) {
    ElMessage.error('智能题目生成失败: ' + error.message)
  } finally {
    smartQuestionLoading.value = false
  }
}
```

### 步骤 5: 创建 Dify Service (需要实现)

创建文件 `frontend/src/services/difyService.js`:

```javascript
import * as aiApi from '@/api/ai'

class DifyService {
  /**
   * 推荐的专业列表
   */
  getRecommendedProfessions() {
    return [
      { value: 'Python后端开发工程师', label: 'Python后端开发工程师', icon: '🐍' },
      { value: '前端开发工程师', label: '前端开发工程师', icon: '🎨' },
      { value: 'Java开发工程师', label: 'Java开发工程师', icon: '☕' },
      { value: '数据分析师', label: '数据分析师', icon: '📊' },
      { value: '算法工程师', label: '算法工程师', icon: '🤖' },
      { value: '产品经理', label: '产品经理', icon: '📱' },
      { value: '测试工程师', label: '测试工程师', icon: '🧪' },
      { value: 'DevOps工程师', label: 'DevOps工程师', icon: '⚙️' },
      { value: 'UI/UX设计师', label: 'UI/UX设计师', icon: '🎭' },
      { value: '项目经理', label: '项目经理', icon: '📋' }
    ]
  }

  /**
   * 根据专业生成题目
   * @param {string} profession - 专业名称
   * @param {Object} options - 选项
   */
  async generateQuestionByProfession(profession, options = {}) {
    const startTime = Date.now()

    try {
      // 调用 Dify 工作流
      const response = await aiApi.callDifyWorkflow({
        requestType: 'generate_questions',
        jobTitle: profession
      })

      if (response.code === 200 && response.data) {
        const questions = response.data.generated_questions || []

        // 随机选择一道题目
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

        return {
          success: true,
          data: {
            question: randomQuestion || '请描述一下你在' + profession + '方面的经验',
            expectedAnswer: '这是一道开放性问题,主要考察候选人的实际经验和表达能力。',
            keywords: this.extractKeywords(profession),
            category: profession,
            difficulty: options.level || '中级',
            generatedBy: 'dify_workflow',
            confidenceScore: 0.95,
            smartGeneration: true,
            searchSource: 'dify_rag',
            sourceUrls: [],
            sessionId: response.data.session_id // 保存 session_id 供后续评分使用
          },
          metadata: {
            workflowId: response.data.metadata?.workflowId,
            processingTime: Date.now() - startTime,
            sessionId: response.data.session_id
          }
        }
      } else {
        throw new Error(response.message || '生成题目失败')
      }
    } catch (error) {
      console.error('Dify 题目生成失败:', error)
      return {
        success: false,
        error: error.message || '调用 Dify 失败'
      }
    }
  }

  /**
   * 使用 Dify 工作流分析答案
   * @param {Object} analysisRequest - 分析请求
   */
  async analyzeAnswerWithDify(analysisRequest) {
    const startTime = Date.now()

    try {
      const response = await aiApi.callDifyWorkflow({
        requestType: 'score_answer',
        sessionId: analysisRequest.sessionId || '', // 从生成题目时获取
        question: analysisRequest.question,
        candidateAnswer: analysisRequest.answer
      })

      if (response.code === 200 && response.data) {
        return {
          success: true,
          source: 'dify_workflow',
          processingTime: Date.now() - startTime,
          data: {
            overallScore: response.data.overall_score || 75,
            summary: response.data.comprehensive_evaluation || '回答完成',
            suggestions: this.extractSuggestions(response.data.comprehensive_evaluation),

            // 简化评分
            technicalAccuracy: Math.floor((response.data.overall_score || 75) * 0.9),
            fluency: Math.floor((response.data.overall_score || 75) * 1.05),
            logicClarity: Math.floor((response.data.overall_score || 75) * 1.1),

            strengths: ['AI综合评价已完成'],
            weaknesses: ['请参考评价内容']
          },
          overallScore: response.data.overall_score || 75,
          summary: response.data.comprehensive_evaluation || '回答完成'
        }
      } else {
        throw new Error(response.message || 'Dify 分析失败')
      }
    } catch (error) {
      console.error('Dify 分析失败:', error)
      return {
        success: false,
        error: {
          code: 'DIFY_ANALYSIS_ERROR',
          message: error.message || 'Dify 分析失败'
        }
      }
    }
  }

  /**
   * 提取关键词
   */
  extractKeywords(profession) {
    const keywordMap = {
      'Python后端开发工程师': ['Python', 'Django', 'Flask', 'FastAPI', 'RESTful API'],
      '前端开发工程师': ['JavaScript', 'Vue.js', 'React', 'HTML', 'CSS'],
      'Java开发工程师': ['Java', 'Spring', 'SpringBoot', 'MyBatis', 'JVM'],
      '数据分析师': ['Python', 'SQL', 'Pandas', '数据可视化', '统计分析'],
      '算法工程师': ['机器学习', '深度学习', 'Python', 'TensorFlow', 'PyTorch']
    }

    return keywordMap[profession] || [profession]
  }

  /**
   * 从评价文本中提取建议
   */
  extractSuggestions(evaluation) {
    if (!evaluation) return []

    // 简单的建议提取逻辑
    const suggestions = []
    if (evaluation.includes('建议') || evaluation.includes('改进')) {
      const lines = evaluation.split(/[。\n]/)
      lines.forEach(line => {
        if (line.includes('建议') || line.includes('改进') || line.includes('可以')) {
          suggestions.push(line.trim())
        }
      })
    }

    return suggestions.length > 0 ? suggestions : ['请参考综合评价内容']
  }
}

export default new DifyService()
```

---

## 📦 方案 B: Mock 模式(用于测试)

如果暂时没有 Dify API Key,可以使用 Mock 模式进行测试。

在 `backend/mock-server.js` 中添加:

```javascript
// Mock Dify 工作流响应
function mockDifyWorkflow(requestData) {
  const requestType = requestData.requestType;

  // 模拟延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      if (requestType === 'generate_questions') {
        // 生成题目的 Mock 响应
        resolve({
          success: true,
          data: {
            session_id: 'mock-session-' + Date.now(),
            generated_questions: [
              `请介绍一下你在${requestData.jobTitle}方面最有挑战性的一个项目。`,
              `对于${requestData.jobTitle}这个岗位,你认为最重要的技能是什么？`,
              `请描述你如何解决${requestData.jobTitle}工作中遇到的技术难题。`,
              `在${requestData.jobTitle}领域,你如何保持技术更新和学习？`,
              `请谈谈你对${requestData.jobTitle}未来发展趋势的看法。`
            ],
            metadata: {
              workflowId: 'mock-workflow-id',
              processingTime: 1500
            }
          }
        });
      } else if (requestType === 'score_answer') {
        // 评分的 Mock 响应
        const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100分

        resolve({
          success: true,
          data: {
            comprehensive_evaluation: `候选人的回答展现了对${requestData.question}的深入理解。表达清晰流畅,逻辑严谨,能够结合实际案例说明。建议在某些技术细节上可以更加深入,整体表现优秀。`,
            overall_score: mockScore,
            metadata: {
              workflowId: 'mock-workflow-id',
              processingTime: 2000
            }
          }
        });
      }
    }, 1000); // 模拟网络延迟
  });
}

// 在路由中使用 Mock
function handleDifyWorkflow(req, res, body) {
  // 如果没有配置 API Key,使用 Mock
  const useMock = !DIFY_CONFIG.apiKey || DIFY_CONFIG.apiKey === 'your-api-key-here';

  const workflowPromise = useMock ?
    mockDifyWorkflow(body) :
    callDifyWorkflow(body);

  workflowPromise
    .then(result => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        code: 200,
        message: '调用成功' + (useMock ? ' (Mock模式)' : ''),
        data: result.data
      }));
    })
    .catch(error => {
      console.error('Dify API 调用失败:', error);
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        code: 500,
        message: error.error?.message || '调用失败',
        error: error.error
      }));
    });
}
```

---

## 🧪 测试步骤

### 1. 启动后端服务

```bash
cd backend
npm install dotenv  # 如果使用 .env 配置
node mock-server.js
```

### 2. 启动前端服务

```bash
cd frontend
npm run dev
```

### 3. 访问页面

打开浏览器访问: `http://localhost:5174/interview/ai`

### 4. 测试流程

1. ✅ 在"智能专业题目生成"区域选择专业
2. ✅ 选择难度级别
3. ✅ 点击"智能生成题目"按钮
4. ✅ 等待 Dify 工作流返回题目
5. ✅ 查看生成的题目
6. ✅ 开启摄像头和麦克风
7. ✅ 语音回答问题
8. ✅ 点击"分析回答"
9. ✅ 查看 AI 评分结果

---

## 🔧 配置说明

### Dify API 配置项

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `DIFY_API_KEY` | Dify API 密钥 | `app-xxxxxxxxxx` |
| `DIFY_API_BASE_URL` | Dify API 基础URL | `https://api.dify.ai/v1` |
| `DIFY_WORKFLOW_ID` | 工作流ID | `workflow-xxxxx` |

### 获取 Dify API Key

1. 登录 [Dify 平台](https://cloud.dify.ai/)
2. 创建或导入你的工作流
3. 在工作流设置中找到 API 密钥
4. 复制 API Key 到配置文件

---

## 📊 数据流程图

```
用户输入专业
    ↓
前端 AIInterviewSession.vue
    ↓
调用 difyService.generateQuestionByProfession()
    ↓
前端 API层 aiApi.callDifyWorkflow()
    ↓
后端 Mock Server /api/ai/dify-workflow
    ↓
调用 Dify API https://api.dify.ai/v1/workflows/run
    ↓
Dify 工作流执行
    ├─ 搜索职位信息 (Google Search)
    ├─ 提取核心技能 (LLM)
    ├─ 生成面试问题 (LLM + RAG)
    └─ 保存会话 (session_id)
    ↓
返回生成的题目列表
    ↓
前端展示题目
```

---

## ⚠️ 注意事项

1. **API Key 安全**: 不要将 API Key 提交到代码仓库,使用环境变量
2. **超时处理**: Dify API 调用可能需要 10-30 秒,注意设置合理的超时时间
3. **错误处理**: 实现完善的错误处理和降级策略
4. **成本控制**: Dify API 调用可能产生费用,注意控制调用频率
5. **Session 管理**: 保存 `session_id` 用于后续的答案评分

---

## 🐛 常见问题

### Q1: Dify API 调用失败

**A:** 检查以下几点:
- API Key 是否正确
- 网络是否能访问 Dify 服务器
- 工作流是否已发布
- 请求参数是否正确

### Q2: 题目生成缓慢

**A:** Dify 工作流包含搜索和 LLM 调用,需要 10-30 秒:
- 添加加载动画提示用户等待
- 实现超时重试机制
- 考虑使用 Mock 模式进行开发调试

### Q3: 无法获取 session_id

**A:** 确保:
- Dify 工作流正确配置了 `保存会话` 节点
- 后端正确解析了 Dify 响应
- 前端保存了 session_id 用于评分

---

## 📚 相关文档

- [Dify 官方文档](https://docs.dify.ai/)
- [Dify API 参考](https://docs.dify.ai/api/)
- [工作流配置指南](https://docs.dify.ai/workflows/)

---

## ✅ 完成检查清单

- [ ] 配置 Dify API Key
- [ ] 部署 Dify 工作流
- [ ] 后端添加 Dify API 代理
- [ ] 前端添加 API 调用方法
- [ ] 创建 difyService.js
- [ ] 测试题目生成功能
- [ ] 测试答案评分功能
- [ ] 添加错误处理
- [ ] 添加加载动画
- [ ] 生产环境配置

---

## 🎉 总结

本方案提供了两种实现方式:
1. **方案 A (推荐)**: 真实调用 Dify API,获得最佳 AI 效果
2. **方案 B**: Mock 模式,用于开发测试

根据你的实际情况选择合适的方案,逐步实施即可! 🚀
