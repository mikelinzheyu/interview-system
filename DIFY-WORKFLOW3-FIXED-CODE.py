import json
import urllib.request
import urllib.error
import ssl

def main(session_id: str, question_id: str, comprehensive_evaluation: str = "", overall_score: int = 0) -> dict:
    """
    工作流3 - 评分和反馈

    该函数从存储API获取标准答案，用于评分对比
    """

    # ============ 配置 ============
    api_base_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
    api_key = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

    # SSL上下文配置（忽略自签名证书）
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        # ============ 第1步: 获取会话数据 ============
        get_url = f"{api_base_url}/{session_id}"

        get_req = urllib.request.Request(
            get_url,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            method='GET'
        )

        with urllib.request.urlopen(get_req, context=ctx, timeout=30) as response:
            response_code = response.getcode()
            if response_code != 200:
                return {
                    "overall_score": 0,
                    "comprehensive_evaluation": f"获取会话失败，状态码: {response_code}",
                    "standard_answer": "",
                    "error": f"HTTP {response_code}"
                }

            response_body = response.read().decode('utf-8')
            session_data = json.loads(response_body)

        # ============ 第2步: 查找问题的标准答案 ============
        standard_answer = ""
        found = False

        if 'questions' in session_data and isinstance(session_data['questions'], list):
            for question in session_data['questions']:
                if question.get('id') == question_id:
                    standard_answer = question.get('answer', '')
                    found = True
                    break

        if not found:
            return {
                "overall_score": 0,
                "comprehensive_evaluation": f"问题未找到: {question_id}",
                "standard_answer": "",
                "error": f"Question {question_id} not found"
            }

        # ============ 第3步: 返回评分结果 ============
        return {
            "overall_score": overall_score if overall_score > 0 else 75,
            "comprehensive_evaluation": comprehensive_evaluation if comprehensive_evaluation else "无评价",
            "standard_answer": standard_answer,
            "error": ""
        }

    except urllib.error.HTTPError as e:
        error_msg = f"HTTP错误 {e.code}: {e.reason}"
        try:
            error_body = e.read().decode('utf-8')
            error_msg += f" - {error_body}"
        except:
            pass

        return {
            "overall_score": 0,
            "comprehensive_evaluation": f"错误: {error_msg}",
            "standard_answer": "",
            "error": error_msg
        }

    except Exception as e:
        return {
            "overall_score": 0,
            "comprehensive_evaluation": f"异常: {str(e)}",
            "standard_answer": "",
            "error": f"异常: {str(e)}"
        }
