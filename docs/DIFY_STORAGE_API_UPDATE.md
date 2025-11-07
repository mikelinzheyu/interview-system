# Dify工作流 - 存储API端点更新指南

## 📍 您的存储API信息

### 基础URL
```
http://localhost:8090
```

### API端点

| 用途 | HTTP方法 | 路径 | 完整URL |
|------|---------|------|--------|
| 创建会话 (工作流1) | POST | /api/sessions | http://localhost:8090/api/sessions |
| 获取会话 (工作流2/3) | GET | /api/sessions/{sessionId} | http://localhost:8090/api/sessions/{sessionId} |
| 删除会话 | DELETE | /api/sessions/{sessionId} | http://localhost:8090/api/sessions/{sessionId} |

---

## 🔧 工作流更新说明

### 工作流1: 生成问题 - 需要更新

**保存问题的Python代码需要改为:**

```python
import json
import urllib.request
import urllib.error
import ssl

def main(questions: dict, job_title: str) -> dict:
    """
    保存问题列表到存储服务
    """
    import uuid

    # 生成会话ID
    session_id = str(uuid.uuid4())

    # 为每个问题分配唯一ID
    questions_with_ids = []

    for idx, question in enumerate(questions):
        questions_with_ids.append({
            "id": f"{session_id}-q{idx+1}",
            "question": question,
            "hasAnswer": False,
            "answer": None
        })

    # 构建存储数据 (符合您的存储API格式)
    session_data = {
        "sessionId": session_id,
        "jobTitle": job_title,
        "questions": questions_with_ids,
        "status": "questions_generated",
        "createdAt": str(__import__('datetime').datetime.now()),
        "updatedAt": str(__import__('datetime').datetime.now())
    }

    # 保存到存储服务
    api_url = "http://localhost:8090/api/sessions"

    try:
        json_data = json.dumps(session_data, ensure_ascii=False).encode('utf-8')

        req = urllib.request.Request(
            api_url,
            data=json_data,
            headers={
                'Content-Type': 'application/json; charset=utf-8'
            },
            method='POST'
        )

        # 如果是HTTPS且需要忽略证书验证
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if 200 <= response.status < 300:
                response_data = json.loads(response.read().decode('utf-8'))
                return {
                    "session_id": session_id,
                    "questions_json": json.dumps(questions_with_ids, ensure_ascii=False),
                    "job_title": job_title,
                    "question_count": len(questions_with_ids),
                    "error": ""
                }
            else:
                error_body = response.read().decode('utf-8')
                return {
                    "session_id": "",
                    "questions_json": "[]",
                    "job_title": job_title,
                    "question_count": 0,
                    "error": f"API返回错误: {response.status} - {error_body}"
                }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            "session_id": "",
            "questions_json": "[]",
            "job_title": job_title,
            "question_count": 0,
            "error": f"HTTP错误 {e.code}: {error_body}"
        }
    except Exception as e:
        return {
            "session_id": "",
            "questions_json": "[]",
            "job_title": job_title,
            "question_count": 0,
            "error": f"保存失败: {str(e)}"
        }
```

---

### 工作流2: 生成答案 - 需要更新

**加载问题信息的Python代码:**

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str) -> dict:
    """
    从存储服务加载问题文本和职位名称
    """
    api_url = f"http://localhost:8090/api/sessions/{session_id}"

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
            if response.status == 200:
                session_data = json.loads(response.read().decode('utf-8'))
                job_title = session_data.get("jobTitle", "")
                questions = session_data.get("questions", [])

                # 根据question_id找到对应的问题
                for q in questions:
                    if q.get("id") == question_id:
                        return {
                            "job_title": job_title,
                            "question_text": q.get("question", ""),
                            "error": ""
                        }

                return {
                    "job_title": "",
                    "question_text": "",
                    "error": f"未找到问题ID: {question_id}"
                }
            else:
                error_body = response.read().decode('utf-8')
                return {
                    "job_title": "",
                    "question_text": "",
                    "error": f"HTTP错误 {response.status}: {error_body}"
                }

    except Exception as e:
        return {
            "job_title": "",
            "question_text": "",
            "error": f"加载失败: {str(e)}"
        }
```

**保存答案的Python代码:**

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str, standard_answer: str) -> dict:
    """
    通过GET-修改-POST的方式更新答案
    """
    try:
        # 第一步: 获取完整的session数据
        get_url = f"http://localhost:8090/api/sessions/{session_id}"
        req = urllib.request.Request(
            get_url,
            headers={'Content-Type': 'application/json'},
            method='GET'
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            session_data = json.loads(response.read().decode('utf-8'))

        # 第二步: 更新指定问题的答案
        if "questions" in session_data:
            for q in session_data["questions"]:
                if q.get("id") == question_id:
                    q["answer"] = standard_answer
                    q["hasAnswer"] = True

        # 第三步: 更新updatedAt时间戳
        session_data["updatedAt"] = str(__import__('datetime').datetime.now())

        # 第四步: 保存更新后的数据
        post_url = "http://localhost:8090/api/sessions"
        json_data = json.dumps(session_data, ensure_ascii=False).encode('utf-8')

        req = urllib.request.Request(
            post_url,
            data=json_data,
            headers={'Content-Type': 'application/json; charset=utf-8'},
            method='POST'
        )

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if 200 <= response.status < 300:
                return {
                    "status": "成功",
                    "error_message": ""
                }
            else:
                return {
                    "status": "失败",
                    "error_message": f"HTTP错误 {response.status}"
                }

    except Exception as e:
        return {
            "status": "失败",
            "error_message": f"保存失败: {str(e)}"
        }
```

---

### 工作流3: 评分 - 需要更新

**加载标准答案的Python代码:**

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str) -> dict:
    """
    从存储服务加载问题和标准答案
    """
    api_url = f"http://localhost:8090/api/sessions/{session_id}"

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
            if response.status == 200:
                session_data = json.loads(response.read().decode('utf-8'))
                questions = session_data.get("questions", [])

                # 查找对应的问题
                for q in questions:
                    if q.get("id") == question_id:
                        return {
                            "question": q.get("question", ""),
                            "standard_answer": q.get("answer", ""),
                            "error": ""
                        }

                return {
                    "question": "",
                    "standard_answer": "",
                    "error": f"未找到问题ID: {question_id}"
                }
            else:
                return {
                    "question": "",
                    "standard_answer": "",
                    "error": f"HTTP错误 {response.status}"
                }

    except Exception as e:
        return {
            "question": "",
            "standard_answer": "",
            "error": f"加载失败: {str(e)}"
        }
```

---

## 🔄 更新步骤

### 对于每个工作流 (1, 2, 3):

1. **进入Dify工作流编辑界面**
   - 工作流1: https://cloud.dify.ai/app/55a6e3e9-ead2-43c9-af1b-6b0d6a3643f1/workflow
   - 工作流2: [您的工作流2地址]
   - 工作流3: [您的工作流3地址]

2. **找到Python代码节点**
   - 工作流1: "保存问题列表" 节点
   - 工作流2: "加载问题信息" 和 "保存标准答案" 节点
   - 工作流3: "加载标准答案" 节点

3. **替换代码**
   - 删除旧的代码
   - 粘贴上面提供的新代码

4. **保存并测试**
   - 点击"保存"
   - 点击"发布"
   - 在界面上测试工作流

---

## ✅ 验证步骤

### 测试工作流1: 生成问题

1. 输入职位名称: "Python后端开发工程师"
2. 运行工作流
3. 验证输出:
   - ✅ `session_id` 已生成
   - ✅ `question_count` = 5
   - ✅ `questions` 返回JSON数组

### 测试工作流2: 生成答案

1. 使用工作流1返回的 `session_id`
2. 使用第一个问题的ID (格式: `{session_id}-q1`)
3. 运行工作流
4. 验证输出:
   - ✅ `save_status` = "成功"
   - ✅ 返回生成的答案

### 测试工作流3: 评分

1. 使用相同的 `session_id` 和 `question_id`
2. 输入候选人的回答
3. 运行工作流
4. 验证输出:
   - ✅ `overall_score` 是0-100之间的数字
   - ✅ `comprehensive_evaluation` 返回评价文本

---

## 🚨 常见问题

### 问题1: HTTP 405 Method Not Allowed

**原因**: 发送了错误的HTTP方法

**解决方案**:
- 工作流1: 必须使用 **POST** 保存会话
- 工作流2/3: 必须使用 **GET** 读取会话

### 问题2: HTTP 400 Bad Request

**原因**: 请求体格式不正确

**解决方案**:
- 确保JSON格式正确
- 检查必需字段: `sessionId`, `jobTitle`, `questions`

### 问题3: Connection Refused

**原因**: 存储服务未运行或地址错误

**解决方案**:
```bash
# 启动存储服务
docker-compose -f D:\code7\interview-system\storage-service\docker-compose.yml up -d

# 验证服务是否运行
curl http://localhost:8090/api/sessions -X GET
```

### 问题4: 答案无法保存

**原因**: 需要获取完整的session数据，修改后重新保存

**解决方案**:
- 工作流2使用了GET-修改-POST的模式
- 这是因为您的API没有单独的UPDATE端点
- 代码已处理此问题

---

## 📝 数据格式示例

### 工作流1 - POST请求体

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "jobTitle": "Python后端开发工程师",
  "questions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000-q1",
      "question": "请简述Python中的装饰器是什么？",
      "hasAnswer": false,
      "answer": null
    }
  ],
  "status": "questions_generated",
  "createdAt": "2024-10-23T10:30:00",
  "updatedAt": "2024-10-23T10:30:00"
}
```

### 工作流2 - POST请求体 (更新答案)

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "jobTitle": "Python后端开发工程师",
  "questions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000-q1",
      "question": "请简述Python中的装饰器是什么？",
      "hasAnswer": true,
      "answer": "装饰器是一种在Python中..."
    }
  ],
  "status": "questions_generated",
  "createdAt": "2024-10-23T10:30:00",
  "updatedAt": "2024-10-23T10:35:00"
}
```

---

## 🎯 总结

| 工作流 | 操作 | HTTP方法 | URL | 状态 |
|--------|------|---------|-----|------|
| 工作流1 | 保存会话 | POST | /api/sessions | ⏳ 需更新 |
| 工作流2 | 加载问题 | GET | /api/sessions/{sessionId} | ⏳ 需更新 |
| 工作流2 | 更新答案 | POST | /api/sessions | ⏳ 需更新 |
| 工作流3 | 加载答案 | GET | /api/sessions/{sessionId} | ⏳ 需更新 |

---

**下一步**: 使用上面的代码更新您的三个Dify工作流，然后运行测试脚本验证功能。
