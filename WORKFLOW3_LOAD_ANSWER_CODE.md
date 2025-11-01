# Workflow3 - 加载标准答案用于评分

## 📋 Workflow3 的关键 Python 节点

Workflow3 需要在评分之前，从 Redis 加载标准答案，与用户的答案进行对比评分。

---

## 节点: 加载标准答案

### 位置
在 workflow3 中，放在 LLM 评分之前

### 节点配置

**输入参数**:
- `session_id: string` - 会话ID
- `question_id: string` - 问题ID

**输出参数**:
- `standard_answer: string` - 标准答案
- `error: string` - 错误信息

### Python 代码

```python
import json
import urllib.request
import urllib.error
import ssl

def main(session_id: str, question_id: str) -> dict:
    """
    从后端 Redis 加载会话数据，提取标准答案用于评分对比

    Args:
        session_id: 会话ID
        question_id: 问题ID

    Returns:
        {
            "standard_answer": "标准答案文本",
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
                    "standard_answer": "",
                    "error": f"HTTP {response_code}: {response_body}"
                }

            # 解析会话数据
            session_data = json.loads(response_body)

            # 查找匹配的问题并获取标准答案
            standard_answer = ""
            if "questions" in session_data and isinstance(session_data["questions"], list):
                for q in session_data["questions"]:
                    if q.get("id") == question_id:
                        standard_answer = q.get("answer", "")
                        break

            if not standard_answer:
                return {
                    "standard_answer": "",
                    "error": f"未找到问题 {question_id} 的标准答案，可能答案还未生成"
                }

            return {
                "standard_answer": standard_answer,
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
            "standard_answer": "",
            "error": error_msg
        }

    except Exception as e:
        return {
            "standard_answer": "",
            "error": f"错误: {str(e)}"
        }
```

---

## 数据流说明

### Workflow3 执行流程:

```
1. 输入:
   - session_id (来自 workflow2)
   - question_id (来自 workflow2)
   - user_answer (用户的答案)
   - 可能还有: job_title, difficulty_level 等

2. 节点: 加载标准答案
   - 调用: GET /api/sessions/{session_id}
   - 从返回的会话数据中提取对应问题的答案
   - 返回: standard_answer

3. LLM 评分
   - 输入: user_answer, standard_answer, question_id 等
   - LLM 对比两个答案，生成评分和反馈
   - 输出: overall_score, comprehensive_evaluation 等

4. 可选: 保存评分结果
   - 可以选择是否将评分结果保存回 Redis
```

---

## 关键点说明

### 1. YOUR_NGROK_URL 替换
将 `YOUR_NGROK_URL` 替换为你的实际 ngrok URL:

例如: `abc123xyz789.ngrok-free.dev` (不包括 https://)

修改后的 URL 应该是:
```
https://abc123xyz789.ngrok-free.dev/api/sessions/{session_id}
```

### 2. 数据来源
标准答案来自 workflow2 的保存操作:
- Workflow1 创建会话，初始问题的 answer 字段为空
- Workflow2 生成标准答案，通过 `/api/sessions/save` 端点保存
- Workflow3 通过 `/api/sessions/{session_id}` 端点加载标准答案

### 3. 错误处理
常见错误情况:
- **404**: 会话不存在或已过期
- **answer 为空**: 标准答案尚未生成
- **HTTP 500**: 后端出错

如果 answer 为空，说明 workflow2 可能还没有运行或保存失败。

### 4. SSL 证书处理
同 workflow2，禁用了 SSL 证书验证:
```python
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
```

---

## 在 Dify 中的配置步骤

### 1. 打开 Workflow3

登录 Dify，打开 "AI面试官-工作流3-评分" (或类似名称)

### 2. 添加/编辑节点: 加载标准答案

1. 在 LLM 评分节点之前添加或编辑 Python 代码节点
2. 复制上面的代码
3. 替换 `YOUR_NGROK_URL`
4. 配置输入参数: `session_id`, `question_id`
5. 配置输出参数: `standard_answer`, `error`
6. 保存节点

### 3. 连接工作流

确保工作流的连接顺序:
```
输入 → 加载标准答案 → LLM评分 → 输出
```

并确保 LLM 评分节点接收到:
- `user_answer` (用户的答案)
- `standard_answer` (从加载节点获得)
- `question_id`
- 其他相关信息

### 4. 发布 Workflow3

点击 "发布" 或 "保存" 按钮

---

## 测试验证

运行完整的三个工作流测试:
```bash
cd D:\code7\interview-system
node test-workflows-docker-prod.js
```

检查输出中 workflow3 的部分:
- ✅ `"standard_answer": "答案内容..."` - 表示成功加载了标准答案
- ✅ `"overall_score": 80` 或其他分数 - 表示评分成功
- ❌ 如果 `standard_answer` 为空，查看 `error` 字段

---

## 常见问题

### Q1: 返回 "未找到问题 XXX 的标准答案"
**A**: 可能的原因:
1. Workflow2 还没有运行过
2. Workflow2 运行失败，答案保存失败
3. 会话 ID 或问题 ID 不匹配
4. Redis 中的数据已过期

解决方案:
- 确保 workflow2 已成功运行（检查日志）
- 检查 workflow2 是否返回了 `"status": "成功"`
- 验证传递的 session_id 和 question_id 是否正确

### Q2: 返回 404 错误
**A**: 会话不存在或已过期

检查:
1. session_id 是否正确
2. 会话是否在 24 小时内创建（Redis TTL）
3. ngrok 隧道是否仍在运行

### Q3: LLM 评分时缺少标准答案
**A**: 虽然加载节点返回了错误，但没有中断工作流

解决方案:
1. 在 LLM 节点中添加错误检查
2. 使用条件节点跳过或重试
3. 或者在加载失败时提供默认值

### Q4: 如何验证 Redis 中确实有标准答案？
**A**: 使用 Redis CLI 查看:

```bash
# 连接 Redis
docker exec interview-redis redis-cli

# 查看会话
get interview:session:session-1729...

# 搜索包含标准答案的会话
keys *interview:session:*
```

然后查看返回的 JSON 中的 `questions[0].answer` 字段。

---

## 完整工作流链条

```
Workflow1: 生成问题
  ├─ 输入: job_title, difficulty_level
  ├─ 输出: session_id, question_id
  └─ 后端: POST /api/sessions/create

         ↓

Workflow2: 生成标准答案
  ├─ 输入: session_id, question_id, user_answer
  ├─ 步骤1: 加载问题 → GET /api/sessions/{session_id}
  ├─ 步骤2: LLM 生成答案
  ├─ 步骤3: 保存答案 → POST /api/sessions/save
  └─ 输出: status

         ↓

Workflow3: 评分
  ├─ 输入: session_id, question_id, user_answer
  ├─ 步骤1: 加载标准答案 → GET /api/sessions/{session_id}
  ├─ 步骤2: LLM 评分
  └─ 输出: overall_score, comprehensive_evaluation

         ↓

Redis 持久化
  └─ Key: interview:session:{session_id}
     TTL: 86400 秒 (24 小时)
```

---

## 相关端点汇总

| 方法 | 端点 | 调用者 | 功能 |
|------|------|--------|------|
| POST | /api/sessions/create | Workflow1 | 创建会话并保存初始问题 |
| GET | /api/sessions/{session_id} | Workflow2, Workflow3 | 加载会话数据（用于获取问题和答案） |
| POST | /api/sessions/save | Workflow2 | 保存生成的标准答案 |

---

## 后端 API 现状

✅ **已实现的端点**:
- POST /api/sessions/create
- GET /api/sessions/{session_id}
- POST /api/sessions/save

✅ **后端容器状态**:
- 容器正在运行，状态: healthy
- Redis 连接正常
- ngrok 隧道已配置

---

**关键**: 确保 workflow2 已成功保存标准答案，workflow3 才能正确加载它进行评分！
