# Dify 工作流2 代码更新指南

**日期**: 2025-10-24
**目的**: 修复工作流2中的保存答案功能（save_status 显示 "失败"）

---

## 📊 当前状态

### 工作流2 测试结果
```
✅ 工作流2 API 响应成功 (HTTP 200)
📝 生成答案长度: 1186 字符
❌ 保存状态: 失败 (save_status: "失败")
❌ 存储验证: HTTP 403 Forbidden
```

**问题**: 虽然工作流2成功调用API并生成答案，但答案未能保存到存储API。

---

## 🔧 修复步骤

### 步骤1: 打开Dify工作流编辑器

1. 访问: **https://cloud.dify.ai**
2. 登录你的账户
3. 找到 **工作流2** (通常命名为 "生成答案" 或 "标准答案生成")
4. 点击 **编辑** 按钮

---

### 步骤2: 定位Python代码节点

在工作流编辑界面中：

1. 找到 **"保存标准答案"** 或类似名称的Python代码节点
2. 该节点应该包含：
   - **输入变量**: session_id, question_id, generated_answer
   - **输出变量**: save_status, generated_answer, error

---

### 步骤3: 替换Python代码

**完整替换代码** (复制以下所有代码):

```python
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
```

---

### 步骤4: 验证输出变量

确保Dify中的Python节点输出变量定义正确：

| 输出变量名 | 类型 | 说明 |
|-----------|------|------|
| `save_status` | String | "成功" 或 "失败" |
| `generated_answer` | String | 生成的答案内容 |
| `error` | String | 错误信息（如有） |

---

### 步骤5: 保存并发布

1. **保存代码**:
   - 点击 **保存** 按钮（通常在编辑器顶部）

2. **发布工作流**:
   - 点击 **发布** 或 **Publish** 按钮
   - 等待 2-3 秒让 Dify 完成发布

3. **验证发布成功**:
   - 确保看到 "发布成功" 或类似提示
   - 页面应显示工作流状态为 "已发布"

---

## 🧪 验证修复

### 测试1: 直接运行测试脚本

```bash
cd D:\code7\interview-system
node test-workflows-complete.js
```

### 预期输出

**工作流1** ✅
```
✅ 工作流1完成！
   - Session ID: 8068c6bb-92ac-4016-8876-622cb18d9c4a
   - 生成问题数: 5
```

**工作流2** ✅ (修复后)
```
✅ 工作流2完成！
   - 保存状态: 成功  ← 应该显示 "成功" 而不是 "失败"
   - 生成答案长度: 1186 字符

✅ 答案存储验证成功！
```

### 关键指标

| 检查项 | 当前状态 | 修复后预期 |
|-------|--------|---------|
| Workflow2 API 响应 | ✅ HTTP 200 | ✅ HTTP 200 |
| save_status | ❌ "失败" | ✅ "成功" |
| 存储验证 HTTP 状态 | ❌ 403 | ✅ 200 |
| 答案是否保存 | ❌ 否 | ✅ 是 |

---

## 🔍 故障排除

### 问题1: 保存仍然失败

**症状**: save_status 仍显示 "失败"

**原因**:
- Dify 中的代码未正确保存或发布
- ngrok 隧道连接中断
- 存储 API 服务未运行

**解决方案**:
1. 确保你完整复制了代码（包括所有 import 和函数体）
2. 再次点击**发布**按钮
3. 等待 3-5 秒后再运行测试
4. 检查 ngrok 隧道是否运行：`curl http://localhost:4040/api/tunnels`

### 问题2: HTTP 403 错误

**症状**: 错误信息显示 "HTTP错误 403: Forbidden"

**原因**: 存储 API 认证或权限问题

**解决方案**:
1. 检查 API 密钥是否正确：`ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`
2. 确保请求头中包含 `Authorization: Bearer {api_key}`
3. 验证存储 API 是否仍在运行：`docker ps | grep interview-storage-api`

### 问题3: 连接超时

**症状**: "Request timeout" 或类似错误

**原因**: ngrok 隧道响应缓慢或网络延迟

**解决方案**:
1. 重启 ngrok 隧道：
```bash
taskkill /F /IM ngrok.exe
sleep 2
ngrok http 8090
```

2. 重新运行测试：
```bash
node test-workflows-complete.js
```

---

## 📝 代码改进点

本次更新的代码改进包括：

1. **更好的错误处理**:
   - 在 GET 和 POST 请求前都添加状态码检查
   - HTTPError 异常捕获并读取错误响应体
   - 通用异常捕获提供错误信息

2. **数据验证**:
   - 检查 questions 是否存在且为列表
   - 验证问题 ID 是否找到
   - 确保答案在返回前被正确更新

3. **响应格式**:
   - 统一的输出结构
   - 详细的错误信息（包括 HTTP 状态码）
   - 便于调试和日志记录

---

## ✅ 完成检查清单

- [ ] 打开 Dify 工作流编辑器
- [ ] 找到工作流2的"保存标准答案"Python 节点
- [ ] 完整复制上面的代码
- [ ] 粘贴到 Dify 编辑器中
- [ ] 验证输出变量名称（save_status, generated_answer, error）
- [ ] 点击保存
- [ ] 点击发布
- [ ] 等待 2-3 秒
- [ ] 运行 `node test-workflows-complete.js` 测试
- [ ] 验证 save_status 显示 "成功"
- [ ] 检查存储验证返回 HTTP 200

---

## 📞 需要帮助？

如果修复后仍然有问题：

1. 检查 `WORKFLOW_TESTING_TROUBLESHOOTING.md` 中的故障排除指南
2. 查看存储 API 日志：`docker logs interview-storage-api`
3. 验证 ngrok 隧道状态：`curl http://localhost:4040/api/tunnels`

---

**最后更新**: 2025-10-24
**版本**: v2.0 - 改进的错误处理和验证
