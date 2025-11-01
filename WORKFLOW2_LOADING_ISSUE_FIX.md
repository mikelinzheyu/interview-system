# Workflow2 - 加载问题信息失败问题诊断与解决

## 🔴 问题症状

```
加载问题信息节点返回错误:
{
  "error": "问题 q-1761642705888-1 未找到",
  "job_title": "",
  "question_text": ""
}
```

## 🔍 根本原因分析

### 问题代码位置
File: `D:\code7\test11\AI面试官-工作流2-生成答案\ (10).yml`
Node: `load_question_info` (加载问题信息)

### 核心问题

Python代码正在调用后端API来获取问题数据：
```python
api_url = f"https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions/{session_id}"
```

**问题**：
1. ❌ ngrok URL是临时的，很可能已经下线
2. ❌ 代码查找问题的逻辑有bug：
   ```python
   for q in session_data["questions"]:
       if q.get("id") == question_id:  # ← 问题在这里
           question_text = q.get("text", "")  # ← 应该是"question"而不是"text"
   ```

3. ❌ Workflow1生成的问题结构中，字段名是`"text"`而不是`"question"`

### 验证：Workflow1输出的问题结构

根据之前的测试结果，Workflow1返回的问题格式是：
```javascript
{
  "id": "q-1761642289221-0",
  "text": "请描述您过去在Python后端开发中使用的最具挑战性的项目..."
}
```

**注意**: 字段名是 `"text"` ✅

## ✅ 解决方案

### 方案 A: 修复Workflow2的Python代码（推荐）

修改 `load_question_info` 节点的Python代码，使其正确处理后端返回的数据。

#### 问题1: 更正字段名映射

```python
# ❌ 错误的
question_text = q.get("text", "")  # 从"text"字段读取

# ✅ 正确的
question_text = q.get("text", "")  # 确保与Workflow1的输出字段一致
```

实际上这个不是问题 - `text`字段是对的。真正的问题是：

#### 问题2: 处理来自Workflow1的直接数据

问题来自：**Workflow1本身就是内存数据，不应该再去后端查询**

Workflow2应该：
1. 接收Workflow1返回的完整questions数据
2. 从本地数据中查找，而不是重新查询后端

### 推荐修复代码

将 `load_question_info` 节点修改为：

```python
import json

def main(session_id: str, question_id: str, questions_data: str = None) -> dict:
    """
    从工作流1传入的问题数据中查找对应问题

    Args:
        session_id: 会话ID
        question_id: 问题ID
        questions_data: JSON字符串格式的问题数据（可选）

    Returns:
        {
            "job_title": "职位名称",
            "question_text": "问题文本",
            "error": "错误信息（成功时为空）"
        }
    """

    try:
        # 如果提供了问题数据，直接使用
        if questions_data:
            try:
                questions = json.loads(questions_data) if isinstance(questions_data, str) else questions_data

                # 查找匹配的问题
                for q in questions:
                    if q.get("id") == question_id:
                        return {
                            "job_title": q.get("job_title", ""),
                            "question_text": q.get("text", ""),
                            "error": ""
                        }

                return {
                    "job_title": "",
                    "question_text": "",
                    "error": f"问题 {question_id} 未找到"
                }
            except json.JSONDecodeError as e:
                # 数据无法解析，尝试从后端查询
                pass

        # 备选方案：从后端查询（如果后端可用）
        # 注意：这里的URL应该指向您的实际后端，而不是ngrok临时URL
        # api_url = f"https://your-actual-backend.com/api/sessions/{session_id}"

        return {
            "job_title": "",
            "question_text": "",
            "error": f"问题 {question_id} 未找到 - 后端不可用"
        }

    except Exception as e:
        return {
            "job_title": "",
            "question_text": "",
            "error": f"错误: {str(e)}"
        }
```

## 🔧 具体修复步骤

### 步骤1: 在Workflow1输出中添加questions_json

确保Workflow1输出包含可序列化的问题数据：

```yaml
# end节点输出应该包括：
- value_selector:
  - generate_questions  # 或其他节点ID
  - questions_json
  variable: questions_json
```

### 步骤2: 在Workflow2输入中接收questions_json

```yaml
start:
  variables:
    - variable: session_id
      label: 会话ID
      required: true
    - variable: question_id
      label: 问题ID
      required: true
    - variable: questions_json  # ← 新增
      label: 问题数据JSON
      required: false
```

### 步骤3: 修改load_question_info节点

替换Python代码为上面提供的推荐代码。

### 步骤4: 连接Workflow1和Workflow2

在您的后端调用中：

```javascript
// 第1步：调用Workflow1获取问题
const workflow1Result = await callWorkflow1(jobTitle);

// 第2步：调用Workflow2，传入问题数据
const workflow2Result = await callWorkflow2({
  session_id: workflow1Result.sessionId,
  question_id: selectedQuestionId,
  questions_json: JSON.stringify(workflow1Result.questions),  // ← 新增
  user_answer: userAnswer,
  job_title: jobTitle
});
```

## 📋 更简单的解决方案

如果您想要一个更简洁的解决方案，可以完全跳过后端查询：

```python
import json

def main(question_id: str, questions_json: str) -> dict:
    """
    直接从传入的问题JSON中查找问题
    """
    try:
        # 解析问题数据
        if isinstance(questions_json, str):
            questions = json.loads(questions_json)
        else:
            questions = questions_json

        # 查找问题
        for q in questions:
            if q.get("id") == question_id:
                return {
                    "job_title": q.get("job_title", ""),
                    "question_text": q.get("text", ""),
                    "error": ""
                }

        return {
            "job_title": "",
            "question_text": "",
            "error": f"问题 {question_id} 未找到"
        }

    except Exception as e:
        return {
            "job_title": "",
            "question_text": "",
            "error": f"解析错误: {str(e)}"
        }
```

## 🎯 建议的架构改进

### 当前有问题的架构
```
Workflow1 → 生成问题并保存到后端
           ↓
Workflow2 → 从后端重新读取问题数据
           ↗（后端可能不可用或URL错误）
```

### 推荐的改进架构
```
Workflow1 → 生成问题并输出questions_json
           ↓
Backend  → 接收Workflow1输出，保存到数据库
           ↓
Workflow2 → 接收questions_json作为输入（不重新查询）
           ↓
Backend  → 保存生成的答案
```

## 🔑 关键要点

1. ✅ Workflow1已经可以生成并返回问题数据
2. ✅ 无需在Workflow2中再次查询后端
3. ✅ 直接传递questions_json给Workflow2
4. ✅ 修改Python代码以接收和处理JSON数据

## 🧪 测试修复

修复后，调用Workflow2应该能成功：

```javascript
{
  "inputs": {
    "session_id": "session-1761642289221",
    "question_id": "q-1761642289221-1",
    "questions_json": "[{\"id\": \"q-1761642289221-0\", \"text\": \"...\", \"job_title\": \"...\"}, ...]",
    "user_answer": "用户的答案",
    "job_title": "Python 后端开发工程师"
  },
  "response_mode": "blocking",
  "user": "user-123"
}
```

应该返回：
```javascript
{
  "data": {
    "outputs": {
      "session_id": "session-1761642289221",
      "question_id": "q-1761642289221-1",
      "job_title": "Python 后端开发工程师",
      "question_text": "问题文本...",
      "generated_answer": "...生成的答案...",
      "error": ""
    },
    "status": "succeeded"
  }
}
```

## ✨ 总结

**问题**: Workflow2试图从不可用的ngrok后端查询问题数据
**解决**: 让Workflow1直接传递问题JSON给Workflow2，Workflow2从JSON中查找而不是查询后端
**修改**: 更新load_question_info节点的Python代码和Workflow2的输入定义

---

**状态**: 诊断完成，有3种解决方案可选
**难度**: 低 - 主要是Python代码修改
**时间**: 15-30分钟完成修复和测试
