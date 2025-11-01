# Workflow2 Python代码更新 - 使用Backend API保存答案

## 问题总结

Storage Service 无法正常启动，workflow2 无法保存答案到外部 API。

## 解决方案

改为通过 ngrok 隧道调用 backend 的新 API 端点 `/api/sessions/save`，backend 内部会访问 Redis 保存数据。

## Dify 中的修改步骤

### 1. 打开 workflow2

登录 Dify，打开 "AI面试官-工作流2-生成答案"

### 2. 编辑 "保存标准答案" 节点

找到该节点，进入 Python 代码编辑器

### 3. 替换为以下代码

**重要**: 将 `YOUR_NGROK_URL` 替换为您的实际 ngrok URL（例如: `phrenologic-preprandial-jesica.ngrok-free.dev`）

```python
import json
import urllib.request
import urllib.error
import ssl

def main(session_id: str, question_id: str, standard_answer: str) -> dict:
    # 通过 ngrok 隧道调用 backend 的会话保存 API
    # Backend 地址 (ngrok 暴露的)
    api_url = "https://YOUR_NGROK_URL/api/sessions/save"
    
    try:
        # 准备请求数据
        data = {
            "session_id": session_id,
            "question_id": question_id,
            "answer": standard_answer
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

### 4. 替换 YOUR_NGROK_URL

在上面的代码中，找到这一行:
```python
api_url = "https://YOUR_NGROK_URL/api/sessions/save"
```

替换为您的实际 ngrok URL，例如:
```python
api_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions/save"
```

### 5. 保存 workflow

点击 "保存" 或 "发布" 按钮

## 工作流程说明

1. **Dify workflow2** 调用此 Python 代码
2. 代码通过 **ngrok 隧道**调用 **backend API** (`/api/sessions/save`)
3. **Backend** (Node.js 运行在 Docker) 访问 **Redis**
4. **Redis** 存储会话数据，包括答案
5. Backend 返回成功响应给 Dify
6. Workflow2 的 `save_status` 显示 "成功" ✅

## 架构图

```
┌──────────────┐
│   Dify       │ (workflow2)
└──────┬───────┘
       │ HTTP POST
       │ (通过 ngrok)
       │
    ┌──┴───────────────────────────────┐
    │  ngrok 隧道                       │
    │  https://xxx.ngrok-free.dev      │
    └──┬───────────────────────────────┘
       │
       │ HTTP POST /api/sessions/save
       │
┌──────▼───────────────────────┐
│   Backend (Node.js)          │
│   运行在 Docker              │
│   端口: 3001 → 8080 (ngrok)  │
└──────┬───────────────────────┘
       │ 访问 Redis
       │
┌──────▼──────────────┐
│   Redis            │
│   interview-redis  │
│   端口: 6379       │
└───────────────────┘
```

## 测试修改

完成 Dify 中的修改后，运行测试:

```bash
cd D:\code7\interview-system
node test-workflows-docker-prod.js
```

在输出中查找 `save_status` 字段：
- ✅ "成功" - 修复成功！
- ❌ "失败" - 查看错误消息进行故障排查

## 常见问题

### Q: 如何获取 ngrok URL?

A: 运行 `ngrok http 8080` 命令，输出中的 "Forwarding" 行显示 URL:
```
Forwarding: https://abc123xyz789.ngrok-free.dev -> http://localhost:8080
```

URL 是: `abc123xyz789.ngrok-free.dev`

### Q: ngrok URL 经常变化怎么办?

A: 每次重启 ngrok，URL 都会变化（免费版特性）。需要在 Dify 中重新更新 API URL。

如果想保持相同的 URL，可以：
- 升级到 ngrok Pro ($5/月)
- 使用 Cloudflare Tunnel (免费)

### Q: Backend 无法访问 Redis?

A: Backend 和 Redis 都在同一个 Docker 网络中，应该可以访问。检查：
```bash
docker logs interview-backend -f --tail=50
```

查看是否有 Redis 连接错误。

### Q: API 返回 404 错误?

A: 确保：
1. Backend 已重启并运行
2. ngrok 隧道仍在运行
3. API URL 正确（后缀是 `/api/sessions/save`）

