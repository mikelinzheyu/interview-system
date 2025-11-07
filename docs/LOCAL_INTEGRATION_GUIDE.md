# 🎯 本地前后端联调指南

## ✅ 当前状态

### 服务运行状况
- **后端服务** ✅ 运行中 (Port: 3001)
  - 健康检查: `curl http://127.0.0.1:3001/api/health`
  - 状态: UP
  - 响应时间: ~1ms

- **前端开发服务** ✅ 运行中 (Port: 5174)
  - 访问: http://127.0.0.1:5174 或 http://localhost:5174
  - Vite配置: 已更新为 `host: '0.0.0.0'`
  - 代理配置: `/api` → `http://localhost:3001`

- **Mock Server** ✅ 运行中
  - 完整的API模拟
  - WebSocket支持
  - Redis缓存(可选)

---

## 📖 快速开始

### 1️⃣ 启动后端服务
```bash
cd backend
node mock-server.js
```
或在另一个终端:
```bash
cd D:\code7\interview-system\backend
"C:\Program Files\nodejs\node.exe" mock-server.js
```

### 2️⃣ 启动前端开发服务
```bash
cd frontend
npm run dev
```
或用Node直接运行:
```bash
cd D:\code7\interview-system\frontend
"C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5174
```

### 3️⃣ 打开浏览器
访问: http://127.0.0.1:5174 或 http://localhost:5174

---

## 🔍 验证连接

### 检查后端
```bash
curl http://127.0.0.1:3001/api/health
```

预期响应:
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "status": "UP",
    "timestamp": "...",
    "version": "1.0.0"
  }
}
```

### 检查前端
```bash
curl http://127.0.0.1:5174
```

预期: HTML页面

### 检查代理
```bash
curl http://127.0.0.1:5174/api/health
```

预期: 同后端响应

### 运行验证脚本
```bash
node verify-local-setup.js
```

---

## 🛠️ 配置说明

### Vite配置 (`frontend/vite.config.js`)
```javascript
server: {
  host: '0.0.0.0',      // 绑定到所有网卡
  port: 5174,           // 前端端口
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // 后端地址
      changeOrigin: true
    }
  }
}
```

### API路由
- 前端请求: `/api/something`
- 代理转发: → `http://localhost:3001/api/something`
- 后端处理: Mock Server或真实后端

---

## 🌐 网络地址

### 本地访问
- **前端**: http://localhost:5174
- **后端**: http://localhost:3001
- **IP访问**: http://127.0.0.1:5174

### 局域网访问
根据网络配置:
- http://192.168.106.167:5174 (示例IP)
- http://192.168.58.1:5174

---

## 📊 API测试

### 在浏览器控制台测试
```javascript
// 测试API调用
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log(d))

// 测试WebSocket
const socket = io('/socket.io')
socket.on('connect', () => console.log('Connected'))
```

### 使用curl测试
```bash
# GET请求
curl http://127.0.0.1:5174/api/health

# POST请求
curl -X POST http://127.0.0.1:5174/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

## 🐛 常见问题

### Q: 前端无法连接后端
**A:**
1. 确认后端运行: `curl http://127.0.0.1:3001/api/health`
2. 检查Vite配置中的proxy target
3. 查看浏览器Network标签中的请求错误

### Q: 端口已被占用
**A:**
```bash
# 查找占用端口的进程
netstat -ano | findstr ":5174"

# 杀死进程 (Windows)
taskkill /PID [PID] /F
```

### Q: 模块找不到
**A:**
```bash
cd frontend
npm install
# 或
npm ci
```

### Q: Vite启动失败
**A:**
1. 检查Node版本: `node --version` (需要12+)
2. 清除缓存: `rm -rf node_modules/.vite`
3. 重新安装: `npm install`

---

## 📝 测试API列表

### 示例后端API
```
GET  /api/health                    # 健康检查
GET  /api/user/list                 # 获取用户列表
GET  /api/chat/messages?limit=20    # 获取聊天消息
POST /api/chat/send                 # 发送消息
GET  /api/interview/start            # 开始面试
```

**注意**: 实际API取决于后端实现

---

## 🔧 进阶配置

### 切换后端地址
编辑 `frontend/.env` 或在启动时设置:
```bash
VITE_API_BASE_URL=http://example.com:8080 npm run dev
```

### 启用HTTPS
创建证书后修改Vite配置:
```javascript
server: {
  https: {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  }
}
```

### 跨域调试
如果有CORS问题，检查后端的CORS配置:
```javascript
// 后端应该返回这些头
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Allow-Headers: Content-Type
```

---

## 📋 完整启动脚本

### Windows CMD
```batch
@echo off
echo Starting Backend...
start cmd /k "cd /d D:\code7\interview-system\backend && node mock-server.js"

echo Starting Frontend...
start cmd /k "cd /d D:\code7\interview-system\frontend && npm run dev"

echo.
echo Services starting...
echo Frontend: http://localhost:5174
echo Backend: http://localhost:3001
```

### Windows PowerShell
```powershell
$backend = Start-Process -PassThru -NoNewWindow -FilePath "C:\Program Files\nodejs\node.exe" `
  -ArgumentList "mock-server.js" `
  -WorkingDirectory "D:\code7\interview-system\backend"

$frontend = Start-Process -PassThru -NoNewWindow -FilePath "C:\Program Files\nodejs\node.exe" `
  -ArgumentList "node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5174" `
  -WorkingDirectory "D:\code7\interview-system\frontend"

Write-Host "Services started"
Write-Host "Frontend: http://localhost:5174"
Write-Host "Backend: http://localhost:3001"
```

### Linux/macOS
```bash
#!/bin/bash
cd "$(dirname "$0")"

echo "Starting Backend..."
cd backend && node mock-server.js &

echo "Starting Frontend..."
cd ../frontend && npm run dev &

echo "Services starting..."
echo "Frontend: http://localhost:5174"
echo "Backend: http://localhost:3001"

wait
```

---

## ✨ 关键要点

1. ✅ **后端和前端已经分别部署**
2. ✅ **Vite代理配置已正确**
3. ✅ **可以通过 http://127.0.0.1:5174 访问前端**
4. ✅ **前端会自动转发API请求到后端**
5. ✅ **支持实时WebSocket通信**

---

## 📞 获取帮助

运行验证脚本检查状态:
```bash
node verify-local-setup.js
```

查看服务日志:
```bash
tail -f backend/backend.log
tail -f frontend/frontend.log
```

---

**准备好开始联调了吗?** 🚀

打开浏览器访问: **http://127.0.0.1:5174**
