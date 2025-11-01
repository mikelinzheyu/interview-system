# 工作流 1 和 2 - 完整实现指南

## 📋 概览

本指南介绍如何在 Dify 中实现 workflow1 和 workflow2 的数据保存功能。两个工作流都将通过 ngrok 隧道调用后端 API 来持久化数据到 Redis。

## ✅ 已完成的工作

### 1. 后端 API 端点已实现

#### POST /api/sessions/create
- **功能**: 创建新的会话并保存初始问题
- **调用者**: workflow1
- **接收参数**:
  ```json
  {
    "session_id": "session-1729123456789",
    "job_title": "Java Developer",
    "difficulty_level": "medium",
    "questions": [
      {
        "id": "q-1729123456789",
        "text": "请解释 Java 的多态性",
        "answer": "",
        "hasAnswer": false
      }
    ]
  }
  ```
- **返回值**:
  ```json
  {
    "status": "success",
    "session_id": "session-1729123456789"
  }
  ```
- **数据存储**: Redis key = `interview:session:{session_id}`, TTL = 86400 秒 (24 小时)

#### POST /api/sessions/save
- **功能**: 保存问题的标准答案
- **调用者**: workflow2
- **接收参数**:
  ```json
  {
    "session_id": "session-1729123456789",
    "question_id": "q-1729123456789",
    "answer": "Java 的多态性是指同一个接口，多种实现方式..."
  }
  ```
- **返回值**:
  ```json
  {
    "status": "success"
  }
  ```

### 2. 后端容器状态
- ✅ Backend 容器已重启，新增 API 端点已激活
- ✅ Redis 容器正在运行，可以存储和检索数据
- ✅ ngrok 隧道已配置，可以从 Dify 访问后端

## 🔧 在 Dify 中的实现步骤

### 步骤 1: 获取 ngrok URL

如果你还没有启动 ngrok 隧道，需要先启动:

```bash
ngrok http 8080
```

输出中的 "Forwarding" 行显示你的 ngrok URL，例如:
```
Forwarding: https://abc123xyz789.ngrok-free.dev -> http://localhost:8080
```

**你的 ngrok URL 是**: `abc123xyz789.ngrok-free.dev` (不包括 https:// 前缀)

### 步骤 2: 更新 Workflow1

#### 2.1 打开 workflow1

1. 登录 Dify
2. 打开 "AI面试官-工作流1-生成问题" (workflow1)

#### 2.2 定位保存问题的节点

1. 找到生成问题后的 Python 代码节点
2. 这个节点应该在 "问题生成" 之后、"输出" 之前

#### 2.3 替换 Python 代码

找到该节点，进入 Python 代码编辑器，用以下代码替换:

```python
import json
import urllib.request
import urllib.error
import ssl
import time

def main(job_title: str, difficulty_level: str, question: str) -> dict:
    # 通过 ngrok 隧道调用 backend 的会话创建 API
    api_url = "https://YOUR_NGROK_URL/api/sessions/create"

    try:
        # 生成会话 ID 和问题 ID (使用时间戳保证唯一性)
        session_id = f"session-{int(time.time() * 1000)}"
        question_id = f"q-{int(time.time() * 1000)}"

        # 准备会话数据
        data = {
            "session_id": session_id,
            "job_title": job_title,
            "difficulty_level": difficulty_level,
            "questions": [
                {
                    "id": question_id,
                    "text": question,
                    "answer": "",
                    "hasAnswer": False
                }
            ]
        }

        json_data = json.dumps(data, ensure_ascii=False).encode('utf-8')

        # 创建请求
        req = urllib.request.Request(
            api_url,
            data=json_data,
            headers={
                'Content-Type': 'application/json; charset=utf-8'
            },
            method='POST'
        )

        # 创建不验证 SSL 的上下文（ngrok 使用 HTTPS）
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # 发送请求
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))

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
                    "session_id": session_id,
                    "question_id": question_id,
                    "question": question,
                    "job_title": job_title,
                    "difficulty_level": difficulty_level,
                    "save_status": "失败",
                    "error_message": result.get('message', f"HTTP {response.getcode()}")
                }

    except urllib.error.HTTPError as e:
        return {
            "session_id": "",
            "question_id": "",
            "question": question,
            "job_title": job_title,
            "difficulty_level": difficulty_level,
            "save_status": "失败",
            "error_message": f"HTTP错误 {e.code}: {e.reason}"
        }
    except Exception as e:
        return {
            "session_id": "",
            "question_id": "",
            "question": question,
            "job_title": job_title,
            "difficulty_level": difficulty_level,
            "save_status": "失败",
            "error_message": f"错误: {str(e)}"
        }
```

#### 2.4 替换 ngrok URL

在代码中找到这一行:
```python
api_url = "https://YOUR_NGROK_URL/api/sessions/create"
```

替换为你的实际 ngrok URL，例如:
```python
api_url = "https://abc123xyz789.ngrok-free.dev/api/sessions/create"
```

#### 2.5 配置节点输入和输出

- **输入参数**: job_title, difficulty_level, question
- **输出参数**: session_id, question_id, question, job_title, difficulty_level, save_status, error_message

#### 2.6 保存 workflow1

点击 "保存" 或 "发布" 按钮

### 步骤 3: 更新 Workflow2

#### 3.1 打开 workflow2

1. 在 Dify 中打开 "AI面试官-工作流2-生成答案" (workflow2)

#### 3.2 定位保存答案的节点

1. 找到 "保存标准答案" 节点
2. 这个节点应该在生成答案后、调用 workflow3 之前

#### 3.3 替换 Python 代码

进入该节点的 Python 代码编辑器，用以下代码替换:

```python
import json
import urllib.request
import urllib.error
import ssl

def main(session_id: str, question_id: str, standard_answer: str) -> dict:
    # 通过 ngrok 隧道调用 backend 的会话保存 API
    api_url = "https://YOUR_NGROK_URL/api/sessions/save"

    try:
        # 准备请求数据
        data = {
            "session_id": session_id,
            "question_id": question_id,
            "answer": standard_answer
        }

        json_data = json.dumps(data, ensure_ascii=False).encode('utf-8')

        # 创建请求
        req = urllib.request.Request(
            api_url,
            data=json_data,
            headers={
                'Content-Type': 'application/json; charset=utf-8'
            },
            method='POST'
        )

        # 创建不验证 SSL 的上下文（ngrok 使用 HTTPS）
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # 发送请求
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))

            if response.getcode() >= 200 and response.getcode() < 300:
                return {
                    "status": "成功",
                    "error_message": ""
                }
            else:
                return {
                    "status": "失败",
                    "error_message": result.get('message', f"HTTP {response.getcode()}")
                }

    except urllib.error.HTTPError as e:
        return {
            "status": "失败",
            "error_message": f"HTTP错误 {e.code}: {e.reason}"
        }
    except Exception as e:
        return {
            "status": "失败",
            "error_message": f"错误: {str(e)}"
        }
```

#### 3.4 替换 ngrok URL

在代码中找到这一行:
```python
api_url = "https://YOUR_NGROK_URL/api/sessions/save"
```

替换为你的实际 ngrok URL，例如:
```python
api_url = "https://abc123xyz789.ngrok-free.dev/api/sessions/save"
```

#### 3.5 配置节点输入和输出

- **输入参数**: session_id, question_id, standard_answer
- **输出参数**: status, error_message

#### 3.6 保存 workflow2

点击 "保存" 或 "发布" 按钮

## 🧪 测试修改

完成 Dify 中的修改后，运行以下命令测试整个流程:

```bash
cd D:\code7\interview-system
node test-workflows-docker-prod.js
```

在输出中查找:

### Workflow1 输出 (应该包含):
```json
{
  "session_id": "session-1729...",
  "question_id": "q-1729...",
  "save_status": "成功",
  "error_message": ""
}
```

### Workflow2 输出 (应该包含):
```json
{
  "status": "成功",
  "error_message": ""
}
```

**如果看到 "失败"，查看 error_message 字段了解具体问题。**

## 📊 工作流数据流向图

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow1                                 │
│  1. 输入: job_title, difficulty_level                       │
│  2. LLM 生成问题                                             │
│  3. 生成 session_id, question_id                             │
│  4. 通过 ngrok 调用 POST /api/sessions/create                │
│  5. 返回: session_id, question_id                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ (session_id 和 question_id)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Workflow2                                 │
│  1. 输入: session_id, question_id, user_answer              │
│  2. LLM 生成标准答案                                        │
│  3. 通过 ngrok 调用 POST /api/sessions/save                  │
│  4. 后端更新 Redis 中的会话数据                              │
│  5. 返回: status (成功/失败)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ (session_id 和 user_answer)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Workflow3                                 │
│  1. 输入: session_id, user_answer, standard_answer          │
│  2. LLM 对比两个答案，生成评分和反馈                        │
└─────────────────────────────────────────────────────────────┘

所有数据持久化在 Redis:
Key: interview:session:{session_id}
Value: {
  session_id,
  job_title,
  difficulty_level,
  questions: [
    {
      id,
      text,
      answer (标准答案),
      hasAnswer
    }
  ],
  created_at,
  updated_at
}
```

## ⚠️ 重要注意事项

### ngrok URL 会变化
- 每次重启 ngrok，URL 都会改变 (这是免费版的特性)
- 如果 ngrok 重启了，需要在 Dify 中重新更新 API URL

### 保持服务运行
- ngrok 窗口不要关闭
- Docker 容器保持运行 (`docker-compose up`)
- Redis 容器保持运行

### 数据持久化
- 所有答案保存在 Redis，TTL 24 小时
- 可以通过以下命令查看存储的数据:
  ```bash
  docker exec interview-redis redis-cli keys "interview:session:*"
  docker exec interview-redis redis-cli get "interview:session:session-1729..."
  ```

## 🔍 故障排查

### 问题 1: API 返回 404 Not Found

**原因**: ngrok 隧道无法访问后端 API

**解决**:
1. 检查 ngrok 是否仍在运行: `ngrok http 8080`
2. 检查 ngrok URL 是否正确（无 https:// 前缀）
3. 检查后端容器是否在运行: `docker ps | grep interview-backend`

### 问题 2: API 返回 400 Bad Request

**原因**: 请求参数缺少或格式错误

**解决**:
1. 检查是否传递了所有必需参数
2. 检查参数格式是否正确 (JSON 格式)
3. 检查是否有中文乱码问题 (代码中已处理 ensure_ascii=False)

### 问题 3: API 返回 500 Internal Server Error

**原因**: 后端处理错误或 Redis 连接失败

**解决**:
1. 检查后端日志: `docker logs interview-backend -f --tail=50`
2. 检查 Redis 是否在运行: `docker exec interview-redis redis-cli ping`
3. 检查是否有 JSON 解析错误

### 问题 4: ngrok 隧道连接超时

**原因**: ngrok 隧道无法连接或网络延迟

**解决**:
1. 重启 ngrok: Ctrl+C 然后重新运行 `ngrok http 8080`
2. 增加 Python 代码中的超时时间 (目前是 30 秒)
3. 检查网络连接是否正常

## 📝 完成清单

- [ ] 获取 ngrok URL
- [ ] 更新 workflow1 的 Python 代码
- [ ] 替换 workflow1 中的 YOUR_NGROK_URL
- [ ] 保存 workflow1
- [ ] 更新 workflow2 的 Python 代码
- [ ] 替换 workflow2 中的 YOUR_NGROK_URL
- [ ] 保存 workflow2
- [ ] 运行测试: `node test-workflows-docker-prod.js`
- [ ] 验证 workflow1 输出包含 "save_status": "成功"
- [ ] 验证 workflow2 输出包含 "status": "成功"
- [ ] 检查 Redis 中的数据: `docker exec interview-redis redis-cli get "interview:session:..."`

## 📞 支持

如果遇到任何问题，请:

1. 查看本文档中的 "故障排查" 部分
2. 查看后端日志: `docker logs interview-backend -f`
3. 查看 ngrok 日志 (ngrok 控制台窗口)
4. 检查 Redis 中是否有数据: `docker exec interview-redis redis-cli keys "*"`

祝你实现顺利！✅
