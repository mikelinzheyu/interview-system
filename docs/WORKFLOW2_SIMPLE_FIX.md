# Workflow2 简单修复 - 只用问题ID和会话ID

## 🎯 简化方案

不传递questions_json，只用 `session_id` 和 `question_id`，从后端直接查询。

## 🔧 修复方法

### 修改Workflow2的load_question_info节点

将Python代码替换为：

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str) -> dict:
    """
    使用session_id和question_id从后端查询问题信息
    """

    # 改用您的实际后端URL（而不是ngrok临时URL）
    api_url = f"http://localhost:8080/api/sessions/{session_id}/questions/{question_id}"

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
            if response.getcode() == 200:
                data = json.loads(response.read().decode('utf-8'))
                return {
                    "job_title": data.get("job_title", ""),
                    "question_text": data.get("text", "") or data.get("question", ""),
                    "error": ""
                }
            else:
                return {
                    "job_title": "",
                    "question_text": "",
                    "error": f"HTTP {response.getcode()}"
                }

    except Exception as e:
        return {
            "job_title": "",
            "question_text": "",
            "error": str(e)
        }
```

## 🔑 关键改动

1. **只用两个参数**: `session_id` 和 `question_id`
2. **修改后端API地址**: 将ngrok URL替换为您的实际后端地址
3. **start节点无需添加questions_json变量**

## 📝 后端API要求

后端需要提供此API端点：

```
GET /api/sessions/{session_id}/questions/{question_id}

返回示例：
{
  "id": "q-123",
  "text": "问题文本",
  "question": "问题文本",  // 或这个字段
  "job_title": "Python 后端开发工程师"
}
```

## ⚙️ 您的后端需要添加

如果您的后端还没有这个API，需要添加：

### Java Spring Boot示例

```java
@GetMapping("/api/sessions/{sessionId}/questions/{questionId}")
public ResponseEntity<Map<String, Object>> getQuestion(
    @PathVariable String sessionId,
    @PathVariable String questionId
) {
    // 从数据库查询session数据
    SessionData session = sessionService.getSession(sessionId);

    // 查找对应的question
    for (Question q : session.getQuestions()) {
        if (q.getId().equals(questionId)) {
            return ResponseEntity.ok(Map.of(
                "id", q.getId(),
                "text", q.getText(),
                "job_title", session.getJobTitle()
            ));
        }
    }

    return ResponseEntity.notFound().build();
}
```

## ✅ 调用方式

还是同样的调用方式，不需要修改：

```javascript
const response = await callWorkflow2({
  session_id: "session-123",
  question_id: "q-123",
  user_answer: "用户答案",
  job_title: "职位"
  // ← 不需要questions_json
});
```

## 🔗 API地址配置

在Dify工作流中修改的关键URL：

```
# 改这行：
api_url = f"https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions/{session_id}"

# 为这样：
api_url = f"http://localhost:8080/api/sessions/{session_id}/questions/{question_id}"

# 或您的实际后端地址：
api_url = f"https://your-backend.com/api/sessions/{session_id}/questions/{question_id}"
```

## 📋 修复步骤

1. 在Dify中打开Workflow2
2. 编辑load_question_info节点的Python代码
3. 复制上面的新代码
4. 修改api_url为您的实际后端地址
5. 保存并测试

## ⚠️ 重要

- 确保后端API在工作流执行时可访问
- 如果用localhost，需要保证Dify可以访问您的本地机器
- 考虑使用固定的后端地址，而不是临时的ngrok URL

---

**这是最简单的方法** - 只用session_id和question_id，后端负责查询
