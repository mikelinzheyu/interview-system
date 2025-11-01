# Workflow2 加载问题修复 - 快速参考

## 🎯 问题

```
错误: "问题 q-1761642705888-1 未找到"
```

## ✅ 根本原因

Workflow2从不可用的ngrok URL查询问题，应该从Workflow1接收JSON数据

## 🚀 快速修复 (3步)

### 第1步: 在Dify中编辑Workflow2的start节点

**添加变量**:
```
变量名: questions_json
标签: 问题数据JSON
类型: text-input
必需: 否
```

### 第2步: 替换load_question_info的Python代码

```python
import json

def main(session_id: str, question_id: str, questions_json: str = "") -> dict:
    try:
        if not questions_json:
            return {"job_title": "", "question_text": "", "error": "未提供问题数据"}

        questions = json.loads(questions_json) if isinstance(questions_json, str) else questions_json

        for q in questions:
            if q.get("id") == question_id:
                return {
                    "job_title": q.get("job_title", ""),
                    "question_text": q.get("text", ""),
                    "error": ""
                }

        return {"job_title": "", "question_text": "", "error": f"问题 {question_id} 未找到"}

    except Exception as e:
        return {"job_title": "", "question_text": "", "error": f"错误: {str(e)}"}
```

### 第3步: 调用时传入questions_json

```javascript
// 调用Workflow2时：
const response = await fetch('https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: {
      session_id: "session-123",
      question_id: "q-123",
      user_answer: "答案",
      job_title: "职位",
      questions_json: JSON.stringify([  // ← 关键！传入JSON字符串
        {"id": "q-123", "text": "问题文本", "job_title": "职位"}
      ])
    },
    response_mode: "blocking",
    user: "user-123"
  })
});
```

---

## 📋 检查清单

- [ ] 在start节点添加了questions_json变量
- [ ] 替换了load_question_info的Python代码
- [ ] 调用代码已更新，传入questions_json参数
- [ ] 测试脚本运行成功
- [ ] 返回数据中error字段为空

---

## 🧪 测试

```bash
# 使用JSON格式的问题列表调用Workflow2
curl -X POST "https://api.dify.ai/v1/workflows/run?workflow_id=5X6RBtTFMCZr0r4R" \
  -H "Authorization: Bearer app-TEw1j6rBUw0ZHHlTdJvJFfPB" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "session_id": "test-123",
      "question_id": "q-test-0",
      "questions_json": "[{\"id\": \"q-test-0\", \"text\": \"测试问题\", \"job_title\": \"职位\"}]",
      "user_answer": "测试答案",
      "job_title": "职位"
    },
    "response_mode": "blocking",
    "user": "test-user"
  }'
```

**期望**: error字段为空，question_text返回 "测试问题"

---

## ❌ 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| "JSON解析错误" | questions_json格式不对 | 确保是JSON字符串，用JSON.stringify() |
| "问题未找到" | question_id不匹配 | 检查id是否正确，大小写敏感 |
| "未提供问题数据" | 没有传入questions_json | 确保调用时传入此参数 |

---

## 📚 详细文档

- 诊断报告: `WORKFLOW2_LOADING_ISSUE_FIX.md`
- 完整指南: `WORKFLOW2_LOADING_FIX_IMPLEMENTATION.md`
- 问题总结: `WORKFLOW2_ISSUE_SUMMARY.md`

---

**预计时间**: 15-30分钟
**难度**: 简单
**风险**: 低
