# 工作流 1 和 2 - 快速开始指南

## 📌 5 分钟快速实现

### 1️⃣ 启动 ngrok 隧道 (如果未启动)
```bash
ngrok http 8080
```
记下 URL（例如: `abc123xyz789.ngrok-free.dev`）

### 2️⃣ 在 Dify 中更新 Workflow1

**打开**: AI面试官-工作流1-生成问题
**找到**: 保存问题的 Python 节点
**替换代码**（见下面完整代码）
**关键**: 将 `YOUR_NGROK_URL` 替换为你的实际 ngrok URL
**保存**

### 3️⃣ 在 Dify 中更新 Workflow2

**打开**: AI面试官-工作流2-生成答案
**找到**: 保存标准答案的 Python 节点
**替换代码**（见下面完整代码）
**关键**: 将 `YOUR_NGROK_URL` 替换为你的实际 ngrok URL
**保存**

### 4️⃣ 测试

```bash
cd D:\code7\interview-system
node test-workflows-docker-prod.js
```

**检查输出**:
- Workflow1 应该包含: `"save_status": "成功"`
- Workflow2 应该包含: `"status": "成功"`

## 📝 Workflow1 完整代码

```python
import json
import urllib.request
import urllib.error
import ssl
import time

def main(job_title: str, difficulty_level: str, question: str) -> dict:
    api_url = "https://YOUR_NGROK_URL/api/sessions/create"

    try:
        session_id = f"session-{int(time.time() * 1000)}"
        question_id = f"q-{int(time.time() * 1000)}"

        data = {
            "session_id": session_id,
            "job_title": job_title,
            "difficulty_level": difficulty_level,
            "questions": [{
                "id": question_id,
                "text": question,
                "answer": "",
                "hasAnswer": False
            }]
        }

        json_data = json.dumps(data, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=json_data,
            headers={'Content-Type': 'application/json; charset=utf-8'},
            method='POST'
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

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

## 📝 Workflow2 完整代码

```python
import json
import urllib.request
import urllib.error
import ssl

def main(session_id: str, question_id: str, standard_answer: str) -> dict:
    api_url = "https://YOUR_NGROK_URL/api/sessions/save"

    try:
        data = {
            "session_id": session_id,
            "question_id": question_id,
            "answer": standard_answer
        }

        json_data = json.dumps(data, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=json_data,
            headers={'Content-Type': 'application/json; charset=utf-8'},
            method='POST'
        )

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

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

## ✅ 完成！

如果两个工作流都返回 "成功"，说明实现成功！

## 🆘 快速排查

| 问题 | 解决 |
|------|------|
| 404 错误 | 检查 ngrok 是否运行、URL 是否正确 |
| 400 错误 | 检查参数是否完整和格式是否正确 |
| 500 错误 | 查看后端日志: `docker logs interview-backend -f` |
| 超时错误 | 检查网络连接、重启 ngrok |

## 📁 相关文件

- `WORKFLOWS_IMPLEMENTATION_GUIDE.md` - 完整实现指南
- `WORKFLOW1_PYTHON_CODE.md` - Workflow1 代码详解
- `WORKFLOW2_PYTHON_CODE_UPDATE.md` - Workflow2 代码详解

---

**预计时间**: 5-10 分钟

**难度**: ⭐ 简单 (仅需复制代码和修改 URL)

祝你实现顺利！✨
