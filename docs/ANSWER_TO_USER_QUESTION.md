# 用户提问的直接回答

## 提问
"工作流2、3的加载标准答案和加载问题信息是否需要改变？"

---

## 直接答案

### ✅ 是的，需要改变！

---

## 具体改动

### Workflow 2 需要新增一个节点

**节点1: 加载问题信息** (在生成答案之前)

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str) -> dict:
    api_url = f"https://YOUR_NGROK_URL/api/sessions/{session_id}"

    try:
        req = urllib.request.Request(api_url, method='GET')
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if response.getcode() == 200:
                session_data = json.loads(response.read().decode('utf-8'))
                job_title = session_data.get("job_title", "")

                for q in session_data.get("questions", []):
                    if q.get("id") == question_id:
                        return {
                            "job_title": job_title,
                            "question_text": q.get("text", ""),
                            "error": ""
                        }

                return {
                    "job_title": job_title,
                    "question_text": "",
                    "error": "问题未找到"
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

**作用**: 获取问题文本，提供给 LLM 生成答案

**输入参数**: session_id, question_id
**输出参数**: job_title, question_text, error

---

### Workflow 3 需要新增一个节点

**节点: 加载标准答案** (在评分之前)

```python
import json
import urllib.request
import ssl

def main(session_id: str, question_id: str) -> dict:
    api_url = f"https://YOUR_NGROK_URL/api/sessions/{session_id}"

    try:
        req = urllib.request.Request(api_url, method='GET')
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if response.getcode() == 200:
                session_data = json.loads(response.read().decode('utf-8'))

                for q in session_data.get("questions", []):
                    if q.get("id") == question_id:
                        return {
                            "standard_answer": q.get("answer", ""),
                            "error": ""
                        }

                return {
                    "standard_answer": "",
                    "error": "问题或答案未找到"
                }
            else:
                return {
                    "standard_answer": "",
                    "error": f"HTTP {response.getcode()}"
                }
    except Exception as e:
        return {
            "standard_answer": "",
            "error": str(e)
        }
```

**作用**: 获取之前保存的标准答案，用于与用户答案对比评分

**输入参数**: session_id, question_id
**输出参数**: standard_answer, error

---

## 原因

### Workflow 2 为什么需要加载问题？
- LLM 需要看到完整的问题信息才能生成更高质量的标准答案
- 问题信息来自 Workflow1 创建的会话，保存在 Redis 中

### Workflow 3 为什么需要加载答案？
- 需要与用户的答案进行对比，才能进行有效的评分
- 标准答案在 Workflow2 中保存到 Redis

---

## 需要的后端支持

✅ **已实现！**

新增的 GET 端点:
```
GET https://YOUR_NGROK_URL/api/sessions/{session_id}
```

返回完整的会话数据，包括所有问题和答案。

后端代码已在 `backend/mock-server.js` 中实现 (lines 2710-2742)，容器已重启。

---

## 完整的数据流

```
Workflow1: 创建会话
  └─ POST /api/sessions/create
  └─ 保存: session_id, questions[].text, questions[].answer=""

Workflow2: 生成答案
  ├─ GET /api/sessions/{session_id} ← 加载问题
  ├─ LLM 生成标准答案
  └─ POST /api/sessions/save ← 保存答案

Workflow3: 评分
  ├─ GET /api/sessions/{session_id} ← 加载标准答案
  ├─ LLM 对比评分
  └─ 返回评分结果
```

---

## 要做的事

1. **启动 ngrok**: `ngrok http 8080`
2. **更新 Workflow2**: 添加上面的节点1代码
3. **更新 Workflow3**: 添加上面的节点代码
4. **替换 YOUR_NGROK_URL** 为实际的 ngrok URL
5. **运行测试**: `node test-workflows-docker-prod.js`

---

## 详细文档

完整的实现指南和代码见:
- `WORKFLOWS_COMPLETE_SOLUTION.md` (包含所有三个 workflow 的完整代码)
- `WORKFLOW2_LOAD_AND_SAVE_CODE.md` (Workflow2 详解)
- `WORKFLOW3_LOAD_ANSWER_CODE.md` (Workflow3 详解)
- `WORKFLOWS_QUICK_START.md` (快速开始)

---

**总结**: 是的，需要改变！Workflow2 和 Workflow3 都需要添加新的节点来加载数据。后端 API 已准备好，所有代码和文档都已生成。
