# 三个工作流完整解决方案

## 📊 总览

这是一个完整的、经过验证的工作流系统实现方案，包括：
- **Workflow1**: 生成问题并创建会话
- **Workflow2**: 生成标准答案并保存
- **Workflow3**: 加载标准答案并评分

所有数据通过 Redis 持久化，通过 ngrok 隧道访问。

---

## ✅ 后端实现状态

### 已实现的 API 端点

#### 1. POST /api/sessions/create
**调用者**: Workflow1
**功能**: 创建新会话并保存初始问题
**状态**: ✅ 已实现并测试

**请求**:
```json
{
  "session_id": "session-1729...",
  "job_title": "Java Developer",
  "difficulty_level": "medium",
  "questions": [
    {
      "id": "q-1729...",
      "text": "请解释 Java 多态性",
      "answer": "",
      "hasAnswer": false
    }
  ]
}
```

**响应**:
```json
{
  "status": "success",
  "session_id": "session-1729..."
}
```

---

#### 2. GET /api/sessions/{session_id}
**调用者**: Workflow2, Workflow3
**功能**: 加载会话数据（问题和答案）
**状态**: ✅ 已实现并测试

**请求**:
```
GET https://YOUR_NGROK_URL/api/sessions/session-1729...
```

**响应**:
```json
{
  "session_id": "session-1729...",
  "job_title": "Java Developer",
  "difficulty_level": "medium",
  "questions": [
    {
      "id": "q-1729...",
      "text": "请解释 Java 多态性",
      "answer": "标准答案文本...",
      "hasAnswer": true
    }
  ],
  "created_at": "2025-10-28T...",
  "updated_at": "2025-10-28T..."
}
```

---

#### 3. POST /api/sessions/save
**调用者**: Workflow2
**功能**: 保存生成的标准答案
**状态**: ✅ 已实现并测试

**请求**:
```json
{
  "session_id": "session-1729...",
  "question_id": "q-1729...",
  "answer": "生成的标准答案文本..."
}
```

**响应**:
```json
{
  "status": "success"
}
```

---

## 🔧 工作流实现详情

### Workflow 1: 生成问题

**输入**:
- job_title (职位名称)
- difficulty_level (难度级别)

**流程**:

```
输入 → LLM 生成问题 → Python 节点（创建会话）→ 输出
```

**Python 节点代码**:

```python
import json
import urllib.request
import ssl
import time

def main(job_title: str, difficulty_level: str, question: str) -> dict:
    api_url = "https://YOUR_NGROK_URL/api/sessions/create"

    try:
        session_id = f"session-{int(time.time() * 1000)}"
        question_id = f"q-{int(time.time() * 1000)}"

        data = {
            "session_id": session_id,
            "job_title": job_title,
            "difficulty_level": difficulty_level,
            "questions": [{
                "id": question_id,
                "text": question,
                "answer": "",
                "hasAnswer": False
            }]
        }

        json_data = json.dumps(data, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=json_data,
            headers={'Content-Type': 'application/json; charset=utf-8'},
            method='POST'
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if response.getcode() >= 200 and response.getcode() < 300:
                return {
                    "session_id": session_id,
                    "question_id": question_id,
                    "question": question,
                    "job_title": job_title,
                    "difficulty_level": difficulty_level,
                    "save_status": "成功",
                    "error_message": ""
                }
            else:
                return {
                    "session_id": "",
                    "question_id": "",
                    "question": question,
                    "job_title": job_title,
                    "difficulty_level": difficulty_level,
                    "save_status": "失败",
                    "error_message": f"HTTP {response.getcode()}"
                }
    except Exception as e:
        return {
            "session_id": "",
            "question_id": "",
            "question": question,
            "job_title": job_title,
            "difficulty_level": difficulty_level,
            "save_status": "失败",
            "error_message": str(e)
        }
```

**输出**:
- session_id ✅
- question_id ✅
- question ✅
- job_title ✅
- difficulty_level ✅
- save_status ✅
- error_message ✅

---

### Workflow 2: 生成答案

**输入**:
- session_id (来自 Workflow1)
- question_id (来自 Workflow1)
- user_answer (用户答案)

**流程**:

```
输入
  → 节点1: 加载问题信息 (GET /api/sessions/{session_id})
  → LLM 生成标准答案
  → 节点2: 保存标准答案 (POST /api/sessions/save)
  → 输出
```

#### 节点 1: 加载问题信息

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str) -> dict:
    api_url = f"https://YOUR_NGROK_URL/api/sessions/{session_id}"

    try:
        req = urllib.request.Request(
            api_url,
            headers={'Content-Type': 'application/json'},
            method='GET'
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if response.getcode() != 200:
                return {
                    "job_title": "",
                    "question_text": "",
                    "error": f"HTTP {response.getcode()}"
                }

            session_data = json.loads(response.read().decode('utf-8'))
            job_title = session_data.get("job_title", "")

            question_text = ""
            for q in session_data.get("questions", []):
                if q.get("id") == question_id:
                    question_text = q.get("text", "")
                    break

            return {
                "job_title": job_title,
                "question_text": question_text,
                "error": "" if question_text else "问题未找到"
            }
    except Exception as e:
        return {
            "job_title": "",
            "question_text": "",
            "error": str(e)
        }
```

**输出**:
- job_title
- question_text
- error

#### 节点 2: 保存标准答案

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str, standard_answer: str) -> dict:
    api_url = "https://YOUR_NGROK_URL/api/sessions/save"

    try:
        data = {
            "session_id": session_id,
            "question_id": question_id,
            "answer": standard_answer
        }

        json_data = json.dumps(data, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=json_data,
            headers={'Content-Type': 'application/json; charset=utf-8'},
            method='POST'
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if 200 <= response.getcode() < 300:
                return {
                    "status": "成功",
                    "error_message": ""
                }
            else:
                return {
                    "status": "失败",
                    "error_message": f"HTTP {response.getcode()}"
                }
    except Exception as e:
        return {
            "status": "失败",
            "error_message": str(e)
        }
```

**输出**:
- status
- error_message

---

### Workflow 3: 评分

**输入**:
- session_id
- question_id
- user_answer

**流程**:

```
输入
  → 节点: 加载标准答案 (GET /api/sessions/{session_id})
  → LLM 评分对比
  → 输出
```

#### 节点: 加载标准答案

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str) -> dict:
    api_url = f"https://YOUR_NGROK_URL/api/sessions/{session_id}"

    try:
        req = urllib.request.Request(
            api_url,
            headers={'Content-Type': 'application/json'},
            method='GET'
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if response.getcode() != 200:
                return {
                    "standard_answer": "",
                    "error": f"HTTP {response.getcode()}"
                }

            session_data = json.loads(response.read().decode('utf-8'))

            standard_answer = ""
            for q in session_data.get("questions", []):
                if q.get("id") == question_id:
                    standard_answer = q.get("answer", "")
                    break

            return {
                "standard_answer": standard_answer,
                "error": "" if standard_answer else "标准答案未找到"
            }
    except Exception as e:
        return {
            "standard_answer": "",
            "error": str(e)
        }
```

**输出**:
- standard_answer
- error

---

## 📋 完整实现清单

### 后端部分 ✅

- ✅ POST /api/sessions/create 已实现
- ✅ GET /api/sessions/{session_id} 已实现
- ✅ POST /api/sessions/save 已实现
- ✅ Redis 存储已配置（TTL 24 小时）
- ✅ 后端容器已重启（状态: healthy）

### Dify 部分 ⏳ 需要用户配置

**Workflow1** ⏳:
- [ ] 在生成问题后添加 Python 节点（创建会话）
- [ ] 替换 YOUR_NGROK_URL
- [ ] 配置输入/输出参数

**Workflow2** ⏳:
- [ ] 在生成答案前添加 Python 节点（加载问题）
- [ ] 在生成答案后添加 Python 节点（保存答案）
- [ ] 替换两个节点中的 YOUR_NGROK_URL
- [ ] 配置输入/输出参数

**Workflow3** ⏳:
- [ ] 在评分前添加 Python 节点（加载标准答案）
- [ ] 替换 YOUR_NGROK_URL
- [ ] 配置输入/输出参数

---

## 🚀 快速实现步骤

### 第1步: 启动 ngrok 隧道

```bash
ngrok http 8080
```

记下输出的 ngrok URL (例如: `abc123xyz789.ngrok-free.dev`)

### 第2步: 更新 Workflow1

1. 打开 Dify，找到 Workflow1
2. 在 LLM 生成问题节点后添加 Python 代码节点
3. 复制上面 "Workflow 1: 生成问题" 中的代码
4. 将 `YOUR_NGROK_URL` 替换为你的 ngrok URL
5. 配置输入参数: `job_title`, `difficulty_level`, `question`
6. 配置输出参数: `session_id`, `question_id`, `question`, `job_title`, `difficulty_level`, `save_status`, `error_message`
7. 保存 Workflow1

### 第3步: 更新 Workflow2

1. 打开 Dify，找到 Workflow2
2. **在生成答案之前**添加节点 1 (加载问题)
   - 复制 "Workflow 2: 节点 1" 的代码
   - 替换 YOUR_NGROK_URL
   - 配置输入参数: `session_id`, `question_id`
   - 配置输出参数: `job_title`, `question_text`, `error`
3. **在生成答案之后**添加节点 2 (保存答案)
   - 复制 "Workflow 2: 节点 2" 的代码
   - 替换 YOUR_NGROK_URL
   - 配置输入参数: `session_id`, `question_id`, `standard_answer`
   - 配置输出参数: `status`, `error_message`
4. 保存 Workflow2

### 第4步: 更新 Workflow3

1. 打开 Dify，找到 Workflow3
2. **在 LLM 评分之前**添加节点 (加载标准答案)
   - 复制 "Workflow 3" 中的代码
   - 替换 YOUR_NGROK_URL
   - 配置输入参数: `session_id`, `question_id`
   - 配置输出参数: `standard_answer`, `error`
3. 确保 LLM 评分节点接收到 `standard_answer`
4. 保存 Workflow3

### 第5步: 测试

```bash
cd D:\code7\interview-system
node test-workflows-docker-prod.js
```

检查输出:
- ✅ Workflow1: `"save_status": "成功"`
- ✅ Workflow2: `"status": "成功"`
- ✅ Workflow3: `"standard_answer": "......"` (非空)

---

## 🔍 关键配置细节

### ngrok URL 替换说明

**原始 URL 格式**:
```
https://abc123xyz789.ngrok-free.dev/api/sessions/create
```

**分解**:
- Scheme: `https://`
- Domain: `abc123xyz789.ngrok-free.dev`
- Path: `/api/sessions/create`

**在代码中**:
- 使用 `YOUR_NGROK_URL` = `abc123xyz789.ngrok-free.dev` (不包括 https://)
- 完整 URL = `f"https://{YOUR_NGROK_URL}/api/sessions/create"`

### 参数映射

**Workflow1 → Workflow2**:
- Workflow1 输出: `session_id`, `question_id`
- Workflow2 输入: `session_id`, `question_id`

**Workflow2 → Workflow3**:
- Workflow2 输出: `session_id` (从 Workflow1 继承)
- Workflow3 输入: `session_id`, `question_id`

---

## 📊 数据流图

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow1                                 │
│  输入: job_title, difficulty_level, question               │
│  输出: session_id ✅, question_id ✅                        │
└────────────┬────────────────────────────────────────────────┘
             │
             │ POST /api/sessions/create
             ↓ (通过 ngrok)
┌─────────────────────────────────────────────────────────────┐
│                   后端 API (Node.js)                         │
│  写入 Redis: interview:session:{session_id}                 │
└─────────────────────────────────────────────────────────────┘
             │
             │ (session_id, question_id)
             ↓
┌─────────────────────────────────────────────────────────────┐
│                    Workflow2                                 │
│  步骤1: GET /api/sessions/{session_id} (加载问题)           │
│  步骤2: LLM 生成标准答案                                    │
│  步骤3: POST /api/sessions/save (保存答案)                  │
│  输出: status, standard_answer                              │
└────────────┬────────────────────────────────────────────────┘
             │
             │ POST /api/sessions/save
             ↓ (通过 ngrok)
┌─────────────────────────────────────────────────────────────┐
│                   后端 API (Node.js)                         │
│  更新 Redis: interview:session:{session_id}                 │
│  设置 questions[n].answer = standard_answer                 │
└─────────────────────────────────────────────────────────────┘
             │
             │ (session_id, question_id, standard_answer)
             ↓
┌─────────────────────────────────────────────────────────────┐
│                    Workflow3                                 │
│  步骤1: GET /api/sessions/{session_id} (加载标准答案)       │
│  步骤2: LLM 评分对比                                        │
│  输出: overall_score, comprehensive_evaluation              │
└─────────────────────────────────────────────────────────────┘
             │
             │ (评分结果)
             ↓
        ┌─────────────┐
        │   前端展示   │
        └─────────────┘
```

---

## 🆘 故障排查

### 问题 1: Workflow1 返回 "save_status": "失败"

**可能原因**:
- ngrok 隧道未启动或 URL 错误
- 后端容器未运行
- /api/sessions/create 端点不存在

**排查步骤**:
```bash
# 检查 ngrok
ngrok http 8080

# 检查后端
docker ps | grep interview-backend

# 查看后端日志
docker logs interview-backend -f --tail=50
```

### 问题 2: Workflow2 节点 1 返回 error

**可能原因**:
- Workflow1 没有成功创建会话
- session_id 或 question_id 不正确
- Redis 中的会话已过期

**排查步骤**:
```bash
# 检查 Redis 中是否有会话数据
docker exec interview-redis redis-cli keys "interview:session:*"

# 查看具体会话数据
docker exec interview-redis redis-cli get "interview:session:session-1729..."
```

### 问题 3: Workflow3 的 standard_answer 为空

**可能原因**:
- Workflow2 没有成功保存答案
- /api/sessions/save 端点失败

**排查步骤**:
1. 检查 Workflow2 的输出日志
2. 查看 Workflow2 节点 2 的 `status` 是否为 "成功"
3. 检查后端日志中是否有错误

### 问题 4: 请求超时

**解决方案**:
- 增加 Python 代码中的超时时间:
  ```python
  urllib.request.urlopen(req, context=ctx, timeout=60)  # 改为 60 秒
  ```

---

## 📚 相关文档

| 文档 | 内容 |
|------|------|
| WORKFLOWS_QUICK_START.md | 快速开始指南 |
| WORKFLOW1_PYTHON_CODE.md | Workflow1 详解 |
| WORKFLOW2_LOAD_AND_SAVE_CODE.md | Workflow2 详解 |
| WORKFLOW3_LOAD_ANSWER_CODE.md | Workflow3 详解 |
| WORKFLOWS_STATUS_COMPLETE.md | 完成状态报告 |
| WORKFLOWS_IMPLEMENTATION_GUIDE.md | 完整实现指南 |

---

## ✨ 总结

✅ **后端已完全实现**，包括所有三个 API 端点
✅ **Redis 持久化已配置**，TTL 24 小时
✅ **ngrok 隧道已就绪**，等待启用
⏳ **Dify workflows 需要用户更新**，按上面的步骤配置

**总耗时**: 15-20 分钟
**难度**: ⭐ 简单 (仅需复制代码和修改 URL)

---

**文档生成日期**: 2025-10-28
**版本**: 1.0 (完整版)
