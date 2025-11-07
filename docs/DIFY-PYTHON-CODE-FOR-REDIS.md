# Dify Python 代码 - Redis 会话存储

这个文档包含了可以在 Dify 工作流的 "代码" 节点中使用的 Python 代码片段，用于实现真实的 Redis 会话存储功能。

---

## 📋 目录

1. [保存会话数据到 Redis](#1-保存会话数据到-redis)
2. [从 Redis 加载会话数据](#2-从-redis-加载会话数据)
3. [更新会话数据](#3-更新会话数据)
4. [删除会话数据](#4-删除会话数据)
5. [完整工作流集成示例](#5-完整工作流集成示例)

---

## 1. 保存会话数据到 Redis

### 使用场景
在 Dify 工作流中生成面试问题后，保存会话数据供后续评分使用。

### Python 代码（调用后端 API）

```python
import json
import requests

def main(inputs: dict) -> dict:
    """
    保存会话数据到 Redis

    输入参数:
    - session_id: 会话ID
    - job_title: 职位名称
    - generated_questions: 生成的问题（JSON字符串或对象）
    - standard_answer: 标准答案（可选）

    返回:
    - success: 是否成功
    - message: 提示信息
    - session_id: 会话ID
    """

    # 从工作流输入获取参数
    session_id = inputs.get('session_id', '')
    job_title = inputs.get('job_title', '')
    generated_questions = inputs.get('generated_questions', '')
    standard_answer = inputs.get('standard_answer', '')

    # 验证必需参数
    if not session_id:
        return {
            "success": False,
            "message": "缺少必需参数: session_id",
            "session_id": ""
        }

    # 准备会话数据
    session_data = {
        "jobTitle": job_title,
        "generatedQuestions": generated_questions,
        "standardAnswer": standard_answer,
        "createdAt": inputs.get('created_at', ''),
        "requestType": "generate_questions"
    }

    # 调用后端 API 保存会话数据
    try:
        api_url = "http://localhost:3001/api/interview/sessions"

        payload = {
            "sessionId": session_id,
            "sessionData": session_data
        }

        response = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            return {
                "success": True,
                "message": "会话数据保存成功",
                "session_id": session_id,
                "saved_data": session_data
            }
        else:
            return {
                "success": False,
                "message": f"保存失败: {response.text}",
                "session_id": session_id
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"保存会话失败: {str(e)}",
            "session_id": session_id
        }
```

---

## 2. 从 Redis 加载会话数据

### 使用场景
在评分环节，根据 session_id 加载之前生成的面试问题和标准答案。

### Python 代码（调用后端 API）

```python
import json
import requests

def main(inputs: dict) -> dict:
    """
    从 Redis 加载会话数据

    输入参数:
    - session_id: 会话ID

    返回:
    - success: 是否成功
    - session_data: 会话数据（包含 jobTitle, generatedQuestions, standardAnswer 等）
    - message: 提示信息
    """

    session_id = inputs.get('session_id', '')

    # 验证必需参数
    if not session_id:
        return {
            "success": False,
            "message": "缺少必需参数: session_id",
            "session_data": {}
        }

    # 调用后端 API 加载会话数据
    try:
        api_url = f"http://localhost:3001/api/interview/sessions/{session_id}"

        response = requests.get(
            api_url,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            session_data = result.get('data', {}).get('sessionData', {})

            return {
                "success": True,
                "message": "会话数据加载成功",
                "session_data": session_data,
                "job_title": session_data.get('jobTitle', ''),
                "generated_questions": session_data.get('generatedQuestions', ''),
                "standard_answer": session_data.get('standardAnswer', '')
            }
        elif response.status_code == 404:
            return {
                "success": False,
                "message": "会话不存在或已过期",
                "session_data": {}
            }
        else:
            return {
                "success": False,
                "message": f"加载失败: {response.text}",
                "session_data": {}
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"加载会话失败: {str(e)}",
            "session_data": {}
        }
```

---

## 3. 更新会话数据

### 使用场景
在评分完成后，更新会话数据添加评分结果。

### Python 代码

```python
import json
import requests

def main(inputs: dict) -> dict:
    """
    更新会话数据（先加载再保存）

    输入参数:
    - session_id: 会话ID
    - comprehensive_evaluation: 综合评价
    - overall_score: 总分
    - candidate_answer: 候选人答案（可选）

    返回:
    - success: 是否成功
    - message: 提示信息
    """

    session_id = inputs.get('session_id', '')
    comprehensive_evaluation = inputs.get('comprehensive_evaluation', '')
    overall_score = inputs.get('overall_score', 0)
    candidate_answer = inputs.get('candidate_answer', '')

    if not session_id:
        return {
            "success": False,
            "message": "缺少必需参数: session_id"
        }

    try:
        # 1. 先加载现有会话数据
        load_url = f"http://localhost:3001/api/interview/sessions/{session_id}"
        load_response = requests.get(load_url, timeout=10)

        if load_response.status_code != 200:
            return {
                "success": False,
                "message": "无法加载现有会话数据"
            }

        session_data = load_response.json().get('data', {}).get('sessionData', {})

        # 2. 更新会话数据
        session_data['comprehensiveEvaluation'] = comprehensive_evaluation
        session_data['overallScore'] = overall_score
        session_data['candidateAnswer'] = candidate_answer
        session_data['evaluatedAt'] = inputs.get('evaluated_at', '')

        # 3. 保存更新后的数据
        save_url = "http://localhost:3001/api/interview/sessions"
        save_payload = {
            "sessionId": session_id,
            "sessionData": session_data
        }

        save_response = requests.post(
            save_url,
            json=save_payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if save_response.status_code == 200:
            return {
                "success": True,
                "message": "会话数据更新成功",
                "session_id": session_id
            }
        else:
            return {
                "success": False,
                "message": f"保存更新失败: {save_response.text}"
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"更新会话失败: {str(e)}"
        }
```

---

## 4. 删除会话数据

### 使用场景
清理过期或无用的会话数据。

### Python 代码

```python
import requests

def main(inputs: dict) -> dict:
    """
    删除会话数据

    输入参数:
    - session_id: 会话ID

    返回:
    - success: 是否成功
    - message: 提示信息
    """

    session_id = inputs.get('session_id', '')

    if not session_id:
        return {
            "success": False,
            "message": "缺少必需参数: session_id"
        }

    try:
        api_url = f"http://localhost:3001/api/interview/sessions/{session_id}"

        response = requests.delete(
            api_url,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            return {
                "success": True,
                "message": "会话数据删除成功",
                "session_id": session_id
            }
        else:
            return {
                "success": False,
                "message": f"删除失败: {response.text}"
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"删除会话失败: {str(e)}"
        }
```

---

## 5. 完整工作流集成示例

### 场景：生成问题 → 保存会话 → 评分 → 更新会话

#### 节点1: 生成面试问题后保存会话

```python
import json
import requests
import uuid
from datetime import datetime

def main(inputs: dict) -> dict:
    """
    生成问题后保存会话

    工作流输入:
    - job_title: 职位名称 (来自用户输入)
    - generated_questions: 生成的问题 (来自前一个LLM节点)
    - standard_answer: 标准答案 (来自前一个LLM节点)

    工作流输出:
    - session_id: 新生成的会话ID
    - success: 是否保存成功
    - generated_questions: 原样返回给用户
    """

    # 生成唯一的会话ID
    session_id = f"session-{uuid.uuid4()}"

    # 准备会话数据
    session_data = {
        "jobTitle": inputs.get('job_title', ''),
        "generatedQuestions": inputs.get('generated_questions', ''),
        "standardAnswer": inputs.get('standard_answer', ''),
        "createdAt": datetime.now().isoformat(),
        "requestType": "generate_questions"
    }

    # 保存到 Redis
    try:
        api_url = "http://localhost:3001/api/interview/sessions"
        payload = {
            "sessionId": session_id,
            "sessionData": session_data
        }

        response = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        save_success = response.status_code == 200

        return {
            "session_id": session_id,
            "success": save_success,
            "generated_questions": inputs.get('generated_questions', ''),
            "message": "会话保存成功" if save_success else "会话保存失败，但题目已生成"
        }

    except Exception as e:
        # 即使保存失败，也返回题目
        return {
            "session_id": session_id,
            "success": False,
            "generated_questions": inputs.get('generated_questions', ''),
            "message": f"会话保存失败: {str(e)}"
        }
```

#### 节点2: 评分前加载会话并评分后更新

```python
import json
import requests
from datetime import datetime

def main(inputs: dict) -> dict:
    """
    评分流程：加载会话 → 评分 → 更新会话

    工作流输入:
    - session_id: 会话ID (来自用户输入)
    - candidate_answer: 候选人答案 (来自用户输入)
    - comprehensive_evaluation: 综合评价 (来自LLM评分节点)
    - overall_score: 总分 (来自LLM评分节点)

    工作流输出:
    - success: 是否成功
    - comprehensive_evaluation: 综合评价
    - overall_score: 总分
    """

    session_id = inputs.get('session_id', '')

    if not session_id:
        return {
            "success": False,
            "message": "缺少会话ID，无法评分"
        }

    try:
        # 1. 加载会话数据
        load_url = f"http://localhost:3001/api/interview/sessions/{session_id}"
        load_response = requests.get(load_url, timeout=10)

        if load_response.status_code != 200:
            return {
                "success": False,
                "message": "会话不存在或已过期"
            }

        session_data = load_response.json().get('data', {}).get('sessionData', {})

        # 2. 更新会话数据（添加评分结果）
        session_data.update({
            "candidateAnswer": inputs.get('candidate_answer', ''),
            "comprehensiveEvaluation": inputs.get('comprehensive_evaluation', ''),
            "overallScore": inputs.get('overall_score', 0),
            "evaluatedAt": datetime.now().isoformat()
        })

        # 3. 保存更新后的数据
        save_url = "http://localhost:3001/api/interview/sessions"
        save_payload = {
            "sessionId": session_id,
            "sessionData": session_data
        }

        save_response = requests.post(
            save_url,
            json=save_payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        return {
            "success": save_response.status_code == 200,
            "session_id": session_id,
            "comprehensive_evaluation": inputs.get('comprehensive_evaluation', ''),
            "overall_score": inputs.get('overall_score', 0),
            "message": "评分完成并保存" if save_response.status_code == 200 else "评分完成但保存失败"
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"评分流程失败: {str(e)}",
            "comprehensive_evaluation": inputs.get('comprehensive_evaluation', ''),
            "overall_score": inputs.get('overall_score', 0)
        }
```

---

## 📝 在 Dify 工作流中配置步骤

### 步骤 1: 添加"代码"节点

1. 在 Dify 工作流编辑器中，点击 **"+"** → **"代码"**
2. 选择 **Python 3**
3. 复制上面的代码粘贴到代码编辑器

### 步骤 2: 配置输入变量

在代码节点的"输入变量"配置中，添加：

**生成问题后保存会话**:
- `job_title` → 从用户输入获取
- `generated_questions` → 从前一个 LLM 节点输出获取
- `standard_answer` → 从前一个 LLM 节点输出获取

**评分前加载会话**:
- `session_id` → 从用户输入获取
- `candidate_answer` → 从用户输入获取
- `comprehensive_evaluation` → 从 LLM 评分节点获取
- `overall_score` → 从 LLM 评分节点获取

### 步骤 3: 配置输出变量

输出变量会自动根据 `return` 字典的键创建：
- `session_id`
- `success`
- `generated_questions`
- `comprehensive_evaluation`
- `overall_score`
- `message`

### 步骤 4: 连接节点

**生成问题流程**:
```
[开始] → [生成问题LLM] → [保存会话代码节点] → [结束]
```

**评分流程**:
```
[开始] → [加载会话代码节点] → [评分LLM] → [更新会话代码节点] → [结束]
```

---

## 🔧 环境要求

### Python 依赖

确保 Dify 环境已安装以下 Python 包：

```bash
pip install requests
```

Dify v1.6.0+ 默认已包含 `requests` 包。

---

## 🌐 API 端点说明

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/interview/sessions` | 保存会话数据 |
| GET | `/api/interview/sessions/:id` | 加载会话数据 |
| DELETE | `/api/interview/sessions/:id` | 删除会话数据 |
| PUT | `/api/interview/sessions/:id/touch` | 更新会话TTL |
| GET | `/api/interview/sessions` | 获取所有会话ID |

---

## 💡 最佳实践

### 1. 生成唯一会话ID

使用 `uuid` 模块生成唯一ID：

```python
import uuid
session_id = f"session-{uuid.uuid4()}"
```

### 2. 错误处理

始终使用 try-except 捕获网络错误：

```python
try:
    response = requests.post(...)
    # 处理响应
except Exception as e:
    return {"success": False, "message": str(e)}
```

### 3. 超时设置

设置合理的超时时间避免长时间等待：

```python
response = requests.get(url, timeout=10)  # 10秒超时
```

### 4. 会话数据结构

保持一致的会话数据结构：

```json
{
  "jobTitle": "职位名称",
  "generatedQuestions": "生成的问题",
  "standardAnswer": "标准答案",
  "candidateAnswer": "候选人答案",
  "comprehensiveEvaluation": "综合评价",
  "overallScore": 85,
  "createdAt": "2025-10-10T10:00:00Z",
  "evaluatedAt": "2025-10-10T10:15:00Z"
}
```

---

## 🐛 故障排除

### 问题1: 连接被拒绝

**错误**: `Connection refused`

**原因**: 后端服务未启动

**解决**: 启动后端服务器

```bash
"C:\Program Files\nodejs\node.exe" "D:\code7\interview-system\backend\mock-server.js"
```

### 问题2: Redis 不可用

**错误**: Redis 连接失败

**影响**: 自动降级到内存存储

**解决**:
1. 检查 Redis 是否已安装并启动
2. 验证 Redis 配置（host, port）
3. 如果不需要 Redis，系统会自动使用内存存储

### 问题3: 会话已过期

**错误**: 404 会话不存在

**原因**: 会话已超过 TTL（默认7天）

**解决**:
1. 使用 `/touch` 端点延长会话
2. 调整 `REDIS_SESSION_TTL` 环境变量

---

## 📚 相关文档

- **完整实施报告**: `P0-P1-IMPLEMENTATION-COMPLETE.md`
- **工作流分析**: `DIFY-WORKFLOW-ANALYSIS-AND-SOLUTIONS.md`
- **快速修复指南**: `QUICK-FIX-GUIDE.md`

---

**创建时间**: 2025-10-10
**状态**: ✅ 已完成
**适用于**: Dify v1.6.0+
**Python版本**: 3.8+
