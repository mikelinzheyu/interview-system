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
            "overall_score": 0,
            "comprehensive_evaluation": "问题未找到",
            "success": False
        }

    standard_answer = question.get("answer", "")

    # ============ 评分逻辑 (由Dify AI模型处理) ============
    # 这部分应该由Dify的AI评分节点处理
    # 这里只是格式化返回结果

    return {
        "overall_score": overall_score,
        "comprehensive_evaluation": comprehensive_evaluation,
        "success": True
    }

except Exception as e:
    return {
        "overall_score": 0,
        "comprehensive_evaluation": f"错误: {str(e)}",
        "success": False
    }