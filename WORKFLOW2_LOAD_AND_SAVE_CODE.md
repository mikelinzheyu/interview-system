# Workflow2 完整实现 - 加载问题和保存答案

## 📋 Workflow2 的两个关键 Python 节点

Workflow2 需要两个 Python 代码节点:
1. **加载问题信息** (Load Question Info) - 从 Redis 获取问题文本和职位信息
2. **保存标准答案** (Save Standard Answer) - 保存生成的标准答案到 Redis

---

## 节点 1: 加载问题信息

### 位置
在 workflow2 中，放在生成答案之前

### 节点配置

**输入参数**:
- `session_id: string` - 会话ID
- `question_id: string` - 问题ID

**输出参数**:
- `job_title: string` - 职位名称
- `question_text: string` - 问题文本
- `error: string` - 错误信息

### Python 代码

```python
import json
import urllib.request
import urllib.error
import ssl

def main(session_id: str, question_id: str) -> dict:
    """
    从后端 Redis 加载会话数据，提取问题信息和职位名称

    Args:
        session_id: 会话ID
        question_id: 问题ID

    Returns:
        {
            "job_title": "职位名称",
            "question_text": "问题文本",
            "error": "错误信息（成功时为空）"
        }
    """

    # 通过 ngrok 隧道调用后端 API
    api_url = f"https://YOUR_NGROK_URL/api/sessions/{session_id}"

    try:
        # 创建请求
        req = urllib.request.Request(
            api_url,
            headers={
                'Content-Type': 'application/json'
            },
            method='GET'
        )

        # 创建不验证 SSL 的上下文（ngrok 使用 HTTPS）
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # 发送请求
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            response_code = response.getcode()
            response_body = response.read().decode('utf-8')

            # 检查响应状态
            if response_code != 200:
                return {
                    "job_title": "",
                    "question_text": "",
                    "error": f"HTTP {response_code}: {response_body}"
                }

            # 解析会话数据
            session_data = json.loads(response_body)
            job_title = session_data.get("job_title", "")

            # 查找匹配的问题
            question_text = ""
            if "questions" in session_data and isinstance(session_data["questions"], list):
                for q in session_data["questions"]:
                    if q.get("id") == question_id:
                        question_text = q.get("text", "")
                        break

            if not question_text:
                return {
                    "job_title": job_title,
                    "question_text": "",
                    "error": f"问题 {question_id} 未找到"
                }

            return {
                "job_title": job_title,
                "question_text": question_text,
                "error": ""
            }

    except urllib.error.HTTPError as e:
        error_msg = f"HTTP错误 {e.code}: {e.reason}"
        try:
            error_body = e.read().decode('utf-8')
            error_msg += f" - {error_body}"
        except:
            pass

        return {
            "job_title": "",
            "question_text": "",
            "error": error_msg
        }

    except Exception as e:
        return {
            "job_title": "",
            "question_text": "",
            "error": f"错误: {str(e)}"
        }
```

---

## 节点 2: 保存标准答案

### 位置
在 workflow2 中，放在生成答案之后、调用 workflow3 之前

### 节点配置

**输入参数**:
- `session_id: string` - 会话ID
- `question_id: string` - 问题ID
- `standard_answer: string` - 生成的标准答案

**输出参数**:
- `status: string` - "成功" 或 "失败"
- `error_message: string` - 错误信息

### Python 代码

```python
import json
import urllib.request
import urllib.error
import ssl

def main(session_id: str, question_id: str, standard_answer: str) -> dict:
    """
    保存生成的标准答案到 Redis

    Args:
        session_id: 会话ID
        question_id: 问题ID
        standard_answer: 生成的标准答案

    Returns:
        {
            "status": "成功" 或 "失败",
            "error_message": "错误信息（成功时为空）"
        }
    """

    # 通过 ngrok 隧道调用后端 API
    api_url = f"https://YOUR_NGROK_URL/api/sessions/save"

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
            response_code = response.getcode()
            response_body = response.read().decode('utf-8')

            if 200 <= response_code < 300:
                return {
                    "status": "成功",
                    "error_message": ""
                }
            else:
                return {
                    "status": "失败",
                    "error_message": f"HTTP {response_code}: {response_body}"
                }

    except urllib.error.HTTPError as e:
        error_msg = f"HTTP错误 {e.code}: {e.reason}"
        try:
            error_body = e.read().decode('utf-8')
            error_msg += f" - {error_body}"
        except:
            pass

        return {
            "status": "失败",
            "error_message": error_msg
        }

    except Exception as e:
        return {
            "status": "失败",
            "error_message": f"错误: {str(e)}"
        }
```

---

## 数据流说明

### Workflow2 执行流程:

```
1. 输入:
   - session_id (来自 workflow1)
   - question_id (来自 workflow1)
   - user_answer (用户的答案)
   - job_title (可选，来自 workflow1)
   - difficulty_level (可选，来自 workflow1)

2. 节点1: 加载问题信息
   - 调用: GET /api/sessions/{session_id}
   - 返回: job_title, question_text

3. 生成标准答案 (LLM)
   - 使用 question_text 和其他信息
   - LLM 生成 standard_answer

4. 节点2: 保存标准答案
   - 调用: POST /api/sessions/save
   - 传递: session_id, question_id, standard_answer
   - 返回: status

5. 输出:
   - session_id
   - question_id
   - user_answer
   - standard_answer
   - job_title
   - status (成功/失败)
```

---

## 关键点说明

### 1. YOUR_NGROK_URL 替换
在两个 Python 代码中，需要将 `YOUR_NGROK_URL` 替换为你的实际 ngrok URL:

例如: `abc123xyz789.ngrok-free.dev` (不包括 https://)

修改后的 URL 应该是:
- 加载问题: `https://abc123xyz789.ngrok-free.dev/api/sessions/{session_id}`
- 保存答案: `https://abc123xyz789.ngrok-free.dev/api/sessions/save`

### 2. API 端点说明

#### GET /api/sessions/{session_id}
- 获取完整的会话数据
- 返回结构:
```json
{
  "session_id": "session-1729...",
  "job_title": "Java Developer",
  "difficulty_level": "medium",
  "questions": [
    {
      "id": "q-1729...",
      "text": "问题文本",
      "answer": "标准答案（由 workflow2 填充）",
      "hasAnswer": true
    }
  ],
  "created_at": "2025-10-28T...",
  "updated_at": "2025-10-28T..."
}
```

#### POST /api/sessions/save
- 保存特定问题的答案
- 请求体:
```json
{
  "session_id": "session-1729...",
  "question_id": "q-1729...",
  "answer": "生成的标准答案文本"
}
```
- 返回: `{ "status": "success" }`

### 3. 错误处理
- 如果获取会话失败，返回详细的错误消息
- 如果问题不存在，清楚地指出问题 ID
- 如果保存失败，返回 HTTP 状态码

### 4. SSL 证书处理
由于 ngrok 使用自签名的 HTTPS 证书，Python 代码禁用了证书验证:
```python
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
```

这是安全的，因为:
- 我们明确知道目标是我们自己的 ngrok 隧道
- ngrok 隧道本身是受信任的
- 这只在开发/测试环境中使用

---

## 在 Dify 中的配置步骤

### 1. 打开 Workflow2

登录 Dify，打开 "AI面试官-工作流2-生成答案"

### 2. 添加/编辑节点 1: 加载问题信息

1. 在生成答案之前添加或编辑 Python 代码节点
2. 复制上面的 "节点 1" 代码
3. 替换 `YOUR_NGROK_URL`
4. 配置输入参数: `session_id`, `question_id`
5. 配置输出参数: `job_title`, `question_text`, `error`
6. 保存节点

### 3. 添加/编辑节点 2: 保存标准答案

1. 在生成答案之后添加或编辑 Python 代码节点
2. 复制上面的 "节点 2" 代码
3. 替换 `YOUR_NGROK_URL`
4. 配置输入参数: `session_id`, `question_id`, `standard_answer`
5. 配置输出参数: `status`, `error_message`
6. 保存节点

### 4. 连接工作流

确保工作流的连接顺序:
```
输入 → 节点1(加载问题) → LLM(生成答案) → 节点2(保存答案) → 输出
```

### 5. 发布 Workflow2

点击 "发布" 或 "保存" 按钮

---

## 测试验证

运行测试脚本:
```bash
cd D:\code7\interview-system
node test-workflows-docker-prod.js
```

检查输出中 workflow2 的部分:
- ✅ `"status": "成功"` - 表示答案保存成功
- ❌ 如果看到 `"status": "失败"`，查看 `error_message` 了解具体问题

---

## 常见问题

### Q1: 节点 1 返回 "问题 XXX 未找到"
**A**: 检查:
1. session_id 是否正确
2. question_id 是否与 workflow1 生成的一致
3. Redis 中的会话数据是否完整

### Q2: 节点 2 返回 404 错误
**A**: 检查:
1. ngrok 是否仍在运行
2. `/api/sessions/save` 端点是否存在
3. 后端容器是否正常运行

### Q3: 请求超时
**A**:
1. 检查网络连接
2. 增加超时时间 (目前是 30 秒)
3. 检查后端日志是否有错误

---

## 相关端点总结

| 方法 | 端点 | 调用者 | 功能 |
|------|------|--------|------|
| POST | /api/sessions/create | Workflow1 | 创建会话 |
| GET | /api/sessions/{session_id} | Workflow2, Workflow3 | 加载会话数据 |
| POST | /api/sessions/save | Workflow2 | 保存标准答案 |

---

**关键**: 确保所有三个端点都已在后端实现，并且后端容器已重启！
