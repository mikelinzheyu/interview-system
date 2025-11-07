# 🚀 快速参考卡

## 立即可用配置

### 存储API
```
URL: https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions
API密钥: ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
认证: Bearer {API_KEY}
```

### 在Python中使用
```python
import requests

url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
headers = {
    "Authorization": "Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
}

# 创建会话
response = requests.post(url, json=data, headers=headers, verify=False)

# 获取会话
response = requests.get(f"{url}/session-id", headers=headers, verify=False)
```

## Dify工作流配置

### 工作流1 - 保存问题列表
```python
api_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
api_key = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
```

### 工作流2 - 加载问题
```python
api_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
response = requests.get(f"{api_url}/{session_id}", ...)
```

### 工作流3 - 加载答案
```python
api_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
response = requests.get(f"{api_url}/{session_id}", ...)
```

## 测试命令

```bash
# 测试存储API
node test-storage-api.js

# 查看ngrok状态
curl http://localhost:4040/api/tunnels

# 重启ngrok
taskkill /F /IM ngrok.exe
ngrok http 8090
```

## 重要文件

- NGROK_TUNNEL_READY.md (⭐最重要)
- DIFY_WORKFLOW_UPDATE_IMPLEMENTATION.md
- test-storage-api.js (验证脚本)

## 状态检查

✅ 存储API: http://localhost:8090 (正常)
✅ ngrok隧道: 运行中
✅ Redis: 正常
✅ 所有测试: 5/5通过
