import json
import urllib.request
import urllib.error
import ssl

def main(session_id: str, question_id: str, generated_answer: str) -> dict:
    """
    工作流2 - 保存标准答案

    该函数从存储API获取当前会话数据，更新指定问题的答案，然后保存回存储API。
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
                    "save_status": "失败",
                    "generated_answer": generated_answer,
                    "error": f"获取会话失败，状态码: {response_code}"
                }

            response_body = response.read().decode('utf-8')
            session_data = json.loads(response_body)

        # ============ 第2步: 找到并更新问题的答案 ============
        found = False

        if 'questions' in session_data and isinstance(session_data['questions'], list):
            for question in session_data['questions']:
                if question.get('id') == question_id:
                    question['answer'] = generated_answer
                    question['hasAnswer'] = True
                    found = True
                    break

        if not found:
            return {
                "save_status": "失败",
                "generated_answer": generated_answer,
                "error": f"未找到问题: {question_id}"
            }

        # ============ 第3步: 保存更新后的会话 ============
        json_data = json.dumps(session_data, ensure_ascii=False).encode('utf-8')

        post_req = urllib.request.Request(
            api_base_url,
            data=json_data,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method='POST'
        )

        with urllib.request.urlopen(post_req, context=ctx, timeout=30) as response:
            response_code = response.getcode()
            if response_code in [200, 201]:
                return {
                    "save_status": "成功",
                    "generated_answer": generated_answer,
                    "error": ""
                }
            else:
                return {
                    "save_status": "失败",
                    "generated_answer": generated_answer,
                    "error": f"保存失败，状态码: {response_code}"
                }

    except urllib.error.HTTPError as e:
        error_msg = f"HTTP错误 {e.code}: {e.reason}"
        try:
            error_body = e.read().decode('utf-8')
            error_msg += f" - {error_body}"
        except:
            pass

        return {
            "save_status": "失败",
            "generated_answer": generated_answer,
            "error": error_msg
        }

    except Exception as e:
        return {
            "save_status": "失败",
            "generated_answer": generated_answer,
            "error": f"异常: {str(e)}"
        }
