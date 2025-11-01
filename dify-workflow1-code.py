import requests
import json
import uuid
from datetime import datetime

# ============ 配置 ============
STORAGE_API_URL = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

# ============ 生成会话ID ============
session_id = f"{uuid.uuid4().hex[:12]}-{int(datetime.now().timestamp())}"

# ============ 构建问题列表 ============
questions = []
# 假设 question_items 来自Dify的前面节点
if isinstance(generated_questions, list):
    for i, q in enumerate(generated_questions):
        questions.append({
            "id": f"{session_id}-q{i+1}",
            "question": q if isinstance(q, str) else q.get("content", q.get("question", str(q))),
            "hasAnswer": False,
            "answer": None
        })
elif isinstance(generated_questions, str):
    try:
        questions_data = json.loads(generated_questions)
        for i, q in enumerate(questions_data):
            questions.append({
                "id": f"{session_id}-q{i+1}",
                "question": q if isinstance(q, str) else q.get("content", q.get("question", str(q))),
                "hasAnswer": False,
                "answer": None
            })
    except:
        pass

# ============ 构建会话数据 ============
session_data = {
    "sessionId": session_id,
    "jobTitle": job_title,
    "questions": questions,
    "status": "questions_generated"
}

# ============ 发送请求 ============
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(
        STORAGE_API_URL,
        json=session_data,
        headers=headers,
        timeout=10,
        verify=False  # ngrok自签名证书
    )
    response.raise_for_status()

    result = response.json()

    # ============ 返回结果 ============
    return {
        "session_id": session_id,
        "questions": json.dumps(questions),
        "job_title": job_title,
        "question_count": len(questions),
        "api_response": result,
        "success": True
    }
except Exception as e:
    return {
        "session_id": "",
        "questions": "[]",
        "job_title": job_title,
        "question_count": 0,
        "error": str(e),
        "success": False
    }