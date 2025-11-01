import requests
import json

# ============ 配置 ============
STORAGE_API_URL = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
API_KEY = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

# ============ 获取会话和问题 ============
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    # 获取会话
    response = requests.get(
        f"{STORAGE_API_URL}/{session_id}",
        headers=headers,
        timeout=10,
        verify=False  # ngrok自签名证书
    )
    response.raise_for_status()
    session = response.json()

    # 找到对应的问题
    question = next(
        (q for q in session.get("questions", []) if q["id"] == question_id),
        None
    )

    if not question:
        return {
            "save_status": "失败",
            "error": "问题未找到",
            "success": False
        }

    # ============ 更新问题的答案 ============
    question["answer"] = generated_answer
    question["hasAnswer"] = True

    # ============ 保存到存储API ============
    update_response = requests.post(
        STORAGE_API_URL,
        json=session,
        headers=headers,
        timeout=10,
        verify=False
    )
    update_response.raise_for_status()

    return {
        "save_status": "成功",
        "generated_answer": generated_answer,
        "success": True
    }

except Exception as e:
    return {
        "save_status": "失败",
        "error": str(e),
        "success": False
    }