# Workflow1 Python代码 - 保存生成的问题

## 说明

workflow1 生成问题后，需要保存会话数据和问题到 Redis。

## 修改步骤

在 Dify 中找到 workflow1 中保存问题的 Python 节点，替换为以下代码：

## Python 代码

```python
import json
import urllib.request
import urllib.error
import ssl
import uuid
import time

def main(job_title: str, difficulty_level: str, question: str) -> dict:
    # 通过 ngrok 隧道调用 backend 的会话创建 API
    api_url = "https://YOUR_NGROK_URL/api/sessions/create"
    
    try:
        # 生成会话 ID 和问题 ID
        session_id = f"session-{int(time.time() * 1000)}"
        question_id = f"q-{int(time.time() * 1000)}"
        
        # 准备会话数据
        data = {
            "session_id": session_id,
            "job_title": job_title,
            "difficulty_level": difficulty_level,
            "questions": [
                {
                    "id": question_id,
                    "text": question,
                    "answer": "",
                    "hasAnswer": False
                }
            ]
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

## 关键点

1. **生成 session_id 和 question_id**
   - 使用时间戳保证唯一性
   - 格式: `session-{时间戳}`, `q-{时间戳}`

2. **返回值包含**
   - `session_id` - 供后续 workflow2、workflow3 使用
   - `question_id` - 对应的问题 ID
   - `question` - 生成的问题文本
   - `save_status` - "成功" 或 "失败"
   - `error_message` - 错误信息（成功时为空）

3. **替换 YOUR_NGROK_URL**
   - 将其替换为你的实际 ngrok URL
   - 例如: `phrenologic-preprandial-jesica.ngrok-free.dev`

4. **API 端点**
   - `POST https://YOUR_NGROK_URL/api/sessions/create`
   - 接收: { session_id, job_title, difficulty_level, questions }
   - 返回: { status: "success" }

## 在 Dify 中的配置

1. 打开 workflow1
2. 找到生成问题后、输出前的节点
3. 添加一个 Python 代码节点，使用上面的代码
4. 输入参数: job_title, difficulty_level, question
5. 输出参数: session_id, question_id, question, job_title, difficulty_level, save_status, error_message

