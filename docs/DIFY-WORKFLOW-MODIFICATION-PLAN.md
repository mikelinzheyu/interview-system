# Dify 工作流修改方案

## 📋 概述

本文档详细说明如何修改 `AI 面试官 - 全流程定制与评分 (RAG) (2).yml` 工作流,使其与当前项目的 Redis 会话存储 API 完全集成。

---

## 🎯 修改目标

1. **集成 Redis 会话存储 API**: 替换工作流中的模拟代码,调用实际的后端 API
2. **统一参数命名**: 将 `job_title` 改为 `jobTitle`,与前端保持一致
3. **完善会话管理**: 实现完整的会话存储和加载逻辑
4. **优化错误处理**: 增强 API 调用的错误处理和重试机制

---

## 🔍 当前工作流分析

### 工作流结构

```
开始节点 (start)
  ├─ 输入参数: job_title, request_type, question, candidate_answer, session_id
  └─ 条件分支 (branch)
      ├─ TRUE: generate_questions (生成问题流程)
      │   ├─ search_job (Google搜索职位信息)
      │   ├─ extract_skills (提取核心技能)
      │   ├─ gen_questions (生成5个面试问题)
      │   ├─ iteration (循环处理每个问题)
      │   │   ├─ search_answer (搜索标准答案)
      │   │   ├─ gen_std_answer (生成标准答案)
      │   │   └─ assemble_qa (组装问答对)
      │   ├─ save_session (保存会话 - **需要修改**)
      │   └─ end_generate (输出: generated_questions, session_id)
      │
      └─ FALSE: score_answer (评分流程)
          ├─ load_session (加载标准答案 - **需要修改**)
          ├─ evaluation (综合评价与打分)
          ├─ parse_score (解析评分结果)
          └─ end_score (输出: comprehensive_evaluation, overall_score)
```

### 需要修改的节点

#### 1. **save_session** (保存会话节点) - 第 644-687 行

**当前问题:**
- 使用 Python `uuid.uuid4()` 生成会话ID
- 只有注释说明需要调用外部API,没有实际实现
- 没有错误处理

**修改内容:**
```python
import json
import requests

def main(qa_data: str) -> dict:
    """
    将问答对数据保存到后端 Redis 会话存储
    调用 POST /api/interview/sessions
    """
    try:
        # 解析问答数据
        qa_list = json.loads(qa_data) if isinstance(qa_data, str) else qa_data

        # 生成会话ID (使用 UUID)
        import uuid
        session_id = str(uuid.uuid4())

        # 调用后端 Redis 会话存储 API
        api_url = "http://localhost:3000/api/interview/sessions"

        # 准备会话数据
        session_data = {
            "qa_pairs": qa_list,
            "createdAt": datetime.datetime.now().isoformat(),
            "type": "interview_questions"
        }

        # 发送 POST 请求
        response = requests.post(
            api_url,
            json={
                "sessionId": session_id,
                "sessionData": session_data
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        # 检查响应
        if response.status_code == 200:
            result = response.json()
            return {
                "session_id": result.get("sessionId", session_id),
                "save_status": "success"
            }
        else:
            # API 调用失败,但仍返回 session_id (可以后续重试)
            return {
                "session_id": session_id,
                "save_status": f"failed: {response.status_code}"
            }

    except Exception as e:
        # 错误处理: 即使保存失败也返回 session_id
        import uuid
        fallback_id = str(uuid.uuid4())
        return {
            "session_id": fallback_id,
            "save_status": f"error: {str(e)}"
        }
```

**输出变量调整:**
```yaml
outputs:
  session_id:
    type: string
  save_status:  # 新增: 保存状态
    type: string
```

---

#### 2. **load_session** (加载标准答案节点) - 第 716-757 行

**当前问题:**
- 需要传入 `qa_data` 参数,但实际应该从 API 加载
- 没有实际调用外部存储服务
- 查找逻辑在 Python 代码中,应该由后端处理

**修改内容:**
```python
import json
import requests

def main(session_id: str, question: str) -> dict:
    """
    从后端 Redis 加载会话数据并查找标准答案
    调用 GET /api/interview/sessions/:sessionId
    """
    try:
        # 验证输入
        if not session_id:
            return {
                "loaded_standard_answer": "错误: 缺少会话ID",
                "load_status": "failed"
            }

        # 调用后端 Redis 会话存储 API
        api_url = f"http://localhost:3000/api/interview/sessions/{session_id}"

        # 发送 GET 请求
        response = requests.get(api_url, timeout=10)

        if response.status_code == 200:
            result = response.json()
            session_data = result.get("sessionData", {})
            qa_pairs = session_data.get("qa_pairs", [])

            # 查找匹配的标准答案
            standard_answer = ""
            for qa in qa_pairs:
                if isinstance(qa, dict):
                    qa_question = qa.get("question", "")
                    # 精确匹配或包含匹配
                    if qa_question == question or question in qa_question:
                        standard_answer = qa.get("answer", "")
                        break

            if standard_answer:
                return {
                    "loaded_standard_answer": standard_answer,
                    "load_status": "success"
                }
            else:
                return {
                    "loaded_standard_answer": f"未找到问题 '{question}' 的标准答案",
                    "load_status": "not_found"
                }

        elif response.status_code == 404:
            return {
                "loaded_standard_answer": f"会话 {session_id} 不存在或已过期",
                "load_status": "session_not_found"
            }
        else:
            return {
                "loaded_standard_answer": f"加载失败: HTTP {response.status_code}",
                "load_status": "api_error"
            }

    except requests.exceptions.Timeout:
        return {
            "loaded_standard_answer": "加载超时,请重试",
            "load_status": "timeout"
        }
    except Exception as e:
        return {
            "loaded_standard_answer": f"加载标准答案失败: {str(e)}",
            "load_status": "error"
        }
```

**输入变量调整:**
```yaml
variables:
  - value_selector:
    - start
    - session_id
    variable: session_id
  - value_selector:
    - start
    - question
    variable: question
  # 移除 qa_data 参数 (不再需要)
```

**输出变量调整:**
```yaml
outputs:
  loaded_standard_answer:
    type: string
  load_status:  # 新增: 加载状态
    type: string
```

---

#### 3. **start** (开始节点) - 第 238-298 行

**当前问题:**
- 使用 `job_title` 参数名
- 前端使用的是 `jobTitle` (驼峰命名)

**修改内容:**
```yaml
variables:
  - default: ''
    hint: 例如:Python后端开发工程师
    label: 职位名称
    max_length: 200
    options: []
    placeholder: ''
    required: false
    type: text-input
    variable: jobTitle  # 改为驼峰命名
```

**影响的节点:**
需要同步修改以下节点中引用 `job_title` 的地方:
- `search_job` (第 356 行): `{{#start.job_title#}}` → `{{#start.jobTitle#}}`
- `extract_skills` (第 387 行): `{{#start.job_title#}}` → `{{#start.jobTitle#}}`
- `gen_questions` (第 430 行): `{{#start.job_title#}}` → `{{#start.jobTitle#}}`
- `search_answer` (第 553 行): `{{#start.job_title#}}` → `{{#start.jobTitle#}}`

---

#### 4. **assemble_qa** (组装问答对节点) - 第 612-643 行

**当前问题:**
- 模板引用了 `gen_questions.text`,应该引用 `iteration.item`

**修改内容:**
```yaml
template: |
  {
    "question": "{{ question }}",
    "answer": "{{ answer }}"
  }
variables:
  - value_selector:
    - iteration
    - item  # 修正: 使用迭代器当前项
    value_type: string
    variable: question
  - value_selector:
    - gen_std_answer
    - text
    variable: answer
```

---

## 📦 API 端点配置

### 后端环境变量

确保在 Dify 工作流的 Python 代码节点中可以访问后端 API:

```yaml
environment_variables:
  - name: BACKEND_API_URL
    value: http://localhost:3000  # 开发环境
    # value: http://backend:3000  # Docker 环境
    # value: https://your-domain.com  # 生产环境
```

### 修改后的代码节点使用环境变量

```python
import os

# 获取后端 API URL
backend_url = os.getenv("BACKEND_API_URL", "http://localhost:3000")
api_url = f"{backend_url}/api/interview/sessions"
```

---

## 🔄 会话数据结构

### 保存到 Redis 的数据格式

```json
{
  "sessionId": "uuid-v4-string",
  "sessionData": {
    "qa_pairs": [
      {
        "question": "请描述一下Python装饰器的工作原理?",
        "answer": "Python装饰器是一个可调用对象..."
      },
      {
        "question": "如何优化Django ORM查询性能?",
        "answer": "优化Django ORM查询可以采用以下方法..."
      }
    ],
    "createdAt": "2025-10-10T12:34:56.789Z",
    "type": "interview_questions",
    "updatedAt": "2025-10-10T12:34:56.789Z"
  }
}
```

### 从 Redis 加载的响应格式

```json
{
  "code": 200,
  "message": "会话数据加载成功",
  "data": {
    "sessionId": "uuid-v4-string",
    "sessionData": {
      "qa_pairs": [...],
      "createdAt": "2025-10-10T12:34:56.789Z",
      "type": "interview_questions",
      "updatedAt": "2025-10-10T12:34:56.789Z"
    }
  }
}
```

---

## ⚙️ 依赖项配置

### Python 依赖

Dify 工作流的代码节点需要安装以下依赖:

```python
# 在 Dify 工作流配置中添加
dependencies:
  - requests==2.31.0  # HTTP 请求库
```

**注意**: Dify Cloud 可能有预装的依赖,本地部署需要确保 `requests` 库可用。

---

## 🧪 测试场景

### 场景 1: 生成问题并保存会话

**输入:**
```json
{
  "jobTitle": "Python后端开发工程师",
  "request_type": "generate_questions"
}
```

**预期输出:**
```json
{
  "generated_questions": [
    "{\"question\": \"问题1\", \"answer\": \"答案1\"}",
    "{\"question\": \"问题2\", \"answer\": \"答案2\"}",
    ...
  ],
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**验证:**
- 后端 API 收到 POST 请求
- Redis 中存储了会话数据
- 返回的 `session_id` 有效

---

### 场景 2: 加载会话并评分

**输入:**
```json
{
  "request_type": "score_answer",
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "question": "请描述一下Python装饰器的工作原理?",
  "candidate_answer": "装饰器是一个返回函数的函数..."
}
```

**预期输出:**
```json
{
  "comprehensive_evaluation": "候选人对装饰器的理解较为准确...",
  "overall_score": 85
}
```

**验证:**
- 后端 API 收到 GET 请求并返回会话数据
- 成功匹配到标准答案
- 评分逻辑正常工作

---

### 场景 3: 会话不存在错误处理

**输入:**
```json
{
  "request_type": "score_answer",
  "session_id": "invalid-session-id",
  "question": "测试问题",
  "candidate_answer": "测试答案"
}
```

**预期输出:**
```json
{
  "comprehensive_evaluation": "由于会话不存在或已过期,无法加载标准答案。评分基于通用标准...",
  "overall_score": 60
}
```

**验证:**
- API 返回 404 错误
- 工作流优雅降级,仍能完成评分

---

## 📝 修改清单

### 必须修改 (P0)

- [x] **save_session**: 替换为调用 `POST /api/interview/sessions` 的 Python 代码
- [x] **load_session**: 替换为调用 `GET /api/interview/sessions/:id` 的 Python 代码
- [x] **start**: 将 `job_title` 改为 `jobTitle`
- [x] **search_job**: 更新变量引用 `{{#start.jobTitle#}}`
- [x] **extract_skills**: 更新变量引用 `{{#start.jobTitle#}}`
- [x] **gen_questions**: 更新变量引用 `{{#start.jobTitle#}}`
- [x] **search_answer**: 更新变量引用 `{{#start.jobTitle#}}`

### 推荐修改 (P1)

- [x] **assemble_qa**: 修正变量引用 `iteration.item`
- [x] 添加环境变量 `BACKEND_API_URL`
- [x] 添加 Python 依赖 `requests`

### 可选优化 (P2)

- [ ] 添加重试机制 (API 调用失败时)
- [ ] 添加日志记录节点
- [ ] 添加监控指标节点
- [ ] 优化超时设置

---

## 🚀 部署建议

### 开发环境

```yaml
environment_variables:
  - name: BACKEND_API_URL
    value: http://localhost:3000
```

### Docker 环境

```yaml
environment_variables:
  - name: BACKEND_API_URL
    value: http://backend:3000  # 使用 Docker 服务名
```

### 生产环境

```yaml
environment_variables:
  - name: BACKEND_API_URL
    value: https://api.yourdomain.com  # 使用 HTTPS
```

---

## ⚠️ 注意事项

1. **网络访问**: 确保 Dify 工作流环境可以访问后端 API (防火墙/网络策略)
2. **超时设置**: API 调用设置合理的超时时间 (建议 10 秒)
3. **错误处理**: 所有外部 API 调用都应有完善的错误处理
4. **会话过期**: Redis 会话默认 7 天过期,评分时需要检查会话是否仍然有效
5. **数据一致性**: 确保 `question` 字段的文本完全匹配,否则无法查找到标准答案
6. **依赖安装**: Dify Cloud 可能需要在工作流设置中声明 `requests` 依赖

---

## 🔍 测试后端 API 可用性

在修改工作流之前,先测试后端 API:

```bash
# 测试保存会话
curl -X POST http://localhost:3000/api/interview/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "sessionData": {
      "qa_pairs": [
        {"question": "测试问题", "answer": "测试答案"}
      ]
    }
  }'

# 测试加载会话
curl http://localhost:3000/api/interview/sessions/test-session-123
```

---

## 📊 修改影响评估

| 修改项 | 影响范围 | 风险等级 | 回滚难度 |
|--------|----------|----------|----------|
| save_session 代码 | 生成问题流程 | 低 | 容易 |
| load_session 代码 | 评分流程 | 中 | 容易 |
| jobTitle 命名 | 所有引用节点 | 低 | 容易 |
| assemble_qa 变量 | 循环输出 | 低 | 容易 |
| 环境变量 | 所有 API 调用 | 低 | 容易 |

---

## ✅ 修改后验证步骤

1. **导入工作流**: 将修改后的 YAML 导入 Dify
2. **检查节点连接**: 确保所有节点连接正确
3. **测试生成问题**: 输入 `jobTitle` 和 `request_type=generate_questions`
4. **验证会话保存**: 检查后端日志,确认 API 被调用
5. **测试评分流程**: 使用返回的 `session_id` 进行评分测试
6. **错误场景测试**: 测试无效 `session_id` 的错误处理
7. **性能测试**: 检查 API 调用的响应时间

---

## 📚 相关文档

- [后端 Redis 会话存储 API](backend/mock-server.js#L4960-L5093)
- [前端 Dify 服务集成](frontend/src/services/difyService.js)
- [Redis 客户端实现](backend/redis-client.js)
- [P2 Redis 实现完成报告](P2-REDIS-IMPLEMENTATION-COMPLETE.md)

---

## 🤝 下一步行动

1. **用户审核本方案** ✅
2. **开始修改 YAML 文件** (待用户确认后)
3. **测试修改后的工作流** (导入 Dify)
4. **前后端集成测试**
5. **文档更新**

---

**方案创建时间**: 2025-10-10
**预计修改时间**: 30 分钟
**测试时间**: 1 小时
**总计**: 1.5 小时

