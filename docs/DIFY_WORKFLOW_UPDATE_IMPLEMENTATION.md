# Dify 工作流更新 - 实施指南

**状态**: 现已可实施
**存储API**: ✅ 5/5 测试通过
**日期**: 2025-10-23

---

## 📋 概览

根据已完成的存储API测试，现在可以更新Dify工作流来集成本地存储系统。

### 关键信息

| 项目 | 值 |
|------|-----|
| 存储API URL | http://localhost:8090/api/sessions |
| 认证方式 | Bearer Token |
| API密钥 | ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0 |
| Redis主机 | 172.25.0.5 (Docker网络) |
| 数据过期时间 | 7天 |

---

## 🔄 工作流1: 生成问题

### 目标
接收职位名称 → 生成问题 → 保存到存储系统

### 需要更新的节点
**节点名**: "保存问题列表"

### 当前配置
```python
# 旧配置 (ngrok隧道)
api_url = "https://chestier-unremittently-willis.ngrok-free.dev/api/sessions"
```

### 新配置

#### Python代码更新:
```python
import requests
import json
import uuid
from datetime import datetime

# 存储API配置
STORAGE_API_URL = "http://localhost:8090/api/sessions"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

# 生成会话ID (使用UUID + 时间戳确保唯一性)
session_id = f"{uuid.uuid4().hex[:12]}-{int(datetime.now().timestamp())}"

# 构建问题列表数据
questions = []
for i, q in enumerate(question_items):  # 假设question_items来自Dify
    questions.append({
        "id": f"{session_id}-q{i+1}",
        "question": q["content"],
        "hasAnswer": False,
        "answer": None
    })

# 构建会话数据
session_data = {
    "sessionId": session_id,
    "jobTitle": job_title,
    "questions": questions,
    "status": "questions_generated"
}

# 发送API请求
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(
        STORAGE_API_URL,
        json=session_data,
        headers=headers,
        timeout=10
    )
    response.raise_for_status()

    result = response.json()

    # 返回结果供下一步使用
    return {
        "session_id": session_id,
        "questions_count": len(questions),
        "job_title": job_title,
        "api_response": result,
        "success": True
    }
except Exception as e:
    return {
        "success": False,
        "error": str(e),
        "session_id": None
    }
```

#### 工作流输出变量
```
session_id          # 用于后续工作流引用
questions_count     # 问题数量
api_response        # API响应
success             # 是否成功
```

---

## 🔄 工作流2: 生成标准答案

### 目标
获取问题 → 生成答案 → 保存到存储系统

### 需要更新的节点

#### 节点1: "加载问题信息" (GET操作)
```python
import requests
import json

# 输入变量: session_id (来自工作流1)
STORAGE_API_URL = "http://localhost:8090/api/sessions"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    # 获取完整会话数据
    response = requests.get(
        f"{STORAGE_API_URL}/{session_id}",
        headers=headers,
        timeout=10
    )
    response.raise_for_status()

    session = response.json()

    # 提取问题列表
    questions = session.get("questions", [])

    return {
        "questions": questions,
        "job_title": session.get("jobTitle"),
        "session_id": session.get("sessionId"),
        "success": True
    }
except Exception as e:
    return {
        "success": False,
        "error": str(e),
        "questions": []
    }
```

#### 节点2: "生成答案" (LLM调用)
```python
# 这个节点已经存在，只需确保:
# 输入: question (来自"加载问题信息"节点)
# 输出: generated_answer
# 不需要修改此节点
```

#### 节点3: "保存标准答案" (POST操作)
```python
import requests
import json

# 输入变量:
# - session_id (来自工作流1)
# - question_id (从questions数组中获取)
# - generated_answer (来自LLM节点)

STORAGE_API_URL = "http://localhost:8090/api/sessions"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    # 第1步: 获取完整会话
    get_response = requests.get(
        f"{STORAGE_API_URL}/{session_id}",
        headers=headers,
        timeout=10
    )
    get_response.raise_for_status()
    session = get_response.json()

    # 第2步: 找到要更新的问题并添加答案
    for q in session["questions"]:
        if q["id"] == question_id:
            q["answer"] = generated_answer
            q["hasAnswer"] = True
            break

    # 第3步: 将更新的会话发回存储系统
    put_response = requests.post(
        STORAGE_API_URL,
        json=session,
        headers=headers,
        timeout=10
    )
    put_response.raise_for_status()

    result = put_response.json()

    return {
        "save_status": "成功",
        "session_id": session_id,
        "question_id": question_id,
        "api_response": result,
        "success": True
    }
except Exception as e:
    return {
        "success": False,
        "error": str(e),
        "save_status": "失败"
    }
```

---

## 🔄 工作流3: 评分和反馈

### 目标
获取标准答案 → 对比用户答案 → 评分

### 需要更新的节点

#### 节点: "加载标准答案" (GET操作)
```python
import requests
import json

# 输入变量:
# - session_id (来自工作流1)
# - question_id (用户回答的问题ID)

STORAGE_API_URL = "http://localhost:8090/api/sessions"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    # 获取完整会话
    response = requests.get(
        f"{STORAGE_API_URL}/{session_id}",
        headers=headers,
        timeout=10
    )
    response.raise_for_status()

    session = response.json()

    # 查找指定问题的标准答案
    standard_answer = None
    question_text = None

    for q in session.get("questions", []):
        if q["id"] == question_id:
            standard_answer = q.get("answer", "")
            question_text = q.get("question", "")
            break

    if not standard_answer:
        return {
            "success": False,
            "error": f"问题 {question_id} 未找到或没有标准答案",
            "standard_answer": None
        }

    return {
        "standard_answer": standard_answer,
        "question_text": question_text,
        "question_id": question_id,
        "success": True
    }
except Exception as e:
    return {
        "success": False,
        "error": str(e),
        "standard_answer": None
    }
```

#### 节点: "评分" (已存在)
```
输入:
- standard_answer (来自上一个节点)
- candidate_answer (用户提交的答案)
- question_text (问题内容)

输出:
- overall_score (0-100)
- comprehensive_evaluation (评价文本)

无需修改，这个节点已经配置正确
```

---

## 🧪 测试计划

### 测试清单

```
✅ 存储API基础功能
  ✅ 会话创建 (POST /api/sessions)
  ✅ 会话检索 (GET /api/sessions/{id})
  ✅ 会话更新 (POST /api/sessions)
  ✅ 数据持久化验证
  ✅ API认证验证

⏳ Dify工作流测试
  - [ ] 工作流1: 生成问题并保存
  - [ ] 工作流2: 生成答案并保存
  - [ ] 工作流3: 评分和反馈
  - [ ] 完整端到端流程
```

### 逐步测试过程

#### 测试1: 工作流1 (生成问题)
```
输入: job_title = "Java开发工程师"
预期输出:
  - session_id: 有效的UUID
  - questions_count: > 0
  - success: true
  - api_response.message: "Session saved successfully"
```

#### 测试2: 工作流2 (生成答案)
```
输入:
  - session_id: (来自测试1)
  - question_items: (来自工作流1输出)
预期输出:
  - save_status: "成功"
  - success: true
  - api_response.message: "Session saved successfully"
```

#### 测试3: 工作流3 (评分)
```
输入:
  - session_id: (来自测试1)
  - question_id: (来自questions数组)
  - candidate_answer: "用户的测试答案"
预期输出:
  - overall_score: 0-100
  - comprehensive_evaluation: (包含反馈文本)
  - success: true
```

---

## 🚀 实施步骤

### 步骤1: 访问Dify工作流编辑器
1. 访问 Dify Dashboard: https://cloud.dify.ai
2. 选择对应的工作流
3. 进入编辑模式

### 步骤2: 更新Python代码节点
1. 找到需要更新的节点
2. 删除现有的Python代码
3. 复制上面提供的新代码
4. 粘贴到节点中
5. 点击"保存"

### 步骤3: 验证变量连接
1. 确保所有输入变量正确连接
2. 检查输出变量定义
3. 验证节点间的数据流

### 步骤4: 运行测试
```bash
cd D:\code7\interview-system

# 运行自动化测试脚本
node test-workflows-complete.js

# 或在Dify界面中手动测试每个工作流
```

---

## 🔍 数据模型参考

### SessionData (会话数据)
```json
{
  "sessionId": "unique-session-id",
  "jobTitle": "职位名称",
  "questions": [
    {
      "id": "session-id-q1",
      "question": "问题内容",
      "hasAnswer": true,
      "answer": "标准答案内容"
    }
  ],
  "status": "questions_generated",
  "createdAt": "2025-10-23T12:00:00Z",
  "updatedAt": "2025-10-23T12:05:00Z"
}
```

### API响应格式
```json
{
  "success": true,
  "sessionId": "unique-session-id",
  "jobTitle": "职位名称",
  "question_count": 5,
  "message": "Session saved successfully",
  "expires_in_days": 7
}
```

---

## 🐛 故障排除

### 问题1: 401 Unauthorized
**原因**: API密钥错误或认证头格式不对
**解决**: 检查 `Authorization: Bearer {API_KEY}`

### 问题2: 404 Not Found
**原因**: session_id不存在或格式错误
**解决**: 确保session_id来自工作流1并且格式正确

### 问题3: 500 Internal Server Error
**原因**: Redis连接问题
**解决**: 检查存储API日志 `docker logs interview-storage-api`

### 问题4: 超时 (Timeout)
**原因**: 网络连接问题或服务未响应
**解决**: 检查存储API是否运行 `docker ps | grep storage-api`

---

## 📞 支持

- **API文档**: 查看 `STORAGE_API_FIX_COMPLETE.md`
- **测试脚本**: 运行 `test-storage-api.js` 验证基础功能
- **Docker**: 查看 `DOCKER_NETWORK_FIX_QUICK_REFERENCE.md`

---

**下一步**: 按上述步骤更新Dify工作流，然后运行完整集成测试。
