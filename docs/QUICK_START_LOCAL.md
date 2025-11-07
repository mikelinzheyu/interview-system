# 🚀 本地前后端联调 - 快速开始

## ✅ 当前状态

**所有服务已启动并正常运行！**

### 服务状态
- ✅ **前端服务**: http://localhost:5174 (Vite开发服务器)
- ✅ **后端服务**: http://localhost:3001 (Mock Server)
- ✅ **API代理**: `/api` → 后端自动转发

---

## 📖 立即使用

### 方式1: 在浏览器中打开

直接打开以下地址之一：

```
http://localhost:5174
http://127.0.0.1:5174
```

**注意**: 如果您之前看到"找不到网页"错误，现在应该能看到应用页面了！

### 方式2: 重启服务

如果需要重新启动，运行以下批处理文件：

**启动后端**:
```bash
run-backend.bat
```

**启动前端**:
```bash
run-frontend.bat
```

或同时启动两个（需要两个终端/cmd窗口）

---

## 🔍 验证连接

### 1. 检查后端
```bash
curl http://127.0.0.1:3001/api/health
```

**预期响应**:
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "status": "UP",
    "version": "1.0.0"
  }
}
```

### 2. 检查前端
访问浏览器: http://localhost:5174

**预期**: 看到 AI 面试系统的页面

### 3. 检查代理
```bash
curl http://127.0.0.1:5174/api/health
```

**预期**: 同后端响应

---

## 📊 系统架构

```
┌─────────────────────────────────────────┐
│         浏览器 / 用户界面                 │
└──────────────┬──────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│   前端应用 (Vite 开发服务器)              │
│   http://localhost:5174                  │
│   - Vue 3                                │
│   - 热更新 (HMR)                        │
│   - 开发工具                             │
└──────────────┬──────────────────────────┘
               │
               │ /api/* 请求
               ↓
┌──────────────────────────────────────────┐
│   Vite 代理转发规则                       │
│   /api → http://localhost:3001           │
└──────────────┬──────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│   后端 API (Mock Server)                 │
│   http://localhost:3001                  │
│   - REST API                             │
│   - WebSocket                            │
│   - 完整 Mock 数据                       │
└──────────────────────────────────────────┘
```

---

## 🛠️ 常用命令

### 查看日志
```bash
# 前端日志
tail -f frontend/frontend.log

# 后端日志
tail -f backend/backend.log
```

### 测试 API
```bash
# 在浏览器控制台运行
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### 清理端口 (如果遇到端口占用)
```bash
# 查看占用端口的进程
netstat -ano | findstr ":5174"
netstat -ano | findstr ":3001"

# 用 PowerShell 杀死进程
powershell "Stop-Process -Id [PID] -Force"
```

---

## 💡 开发工作流

### 1. 编辑代码
编辑 `frontend/src` 目录中的任何文件

### 2. 实时查看变化
Vite 的 HMR (热模块更新) 会自动刷新浏览器，您无需手动刷新

### 3. 调试 API 请求
- 打开浏览器 F12
- 切换到 "Network" 标签
- 查看所有 API 请求和响应

### 4. 查看控制台错误
- 在浏览器 F12 中查看 "Console" 标签
- 可以看到任何 JavaScript 错误或日志

---

## ⚙️ 配置文件位置

### 前端配置
- Vite 配置: `frontend/vite.config.js`
- API 代理: 在 vite.config.js 中配置
- 当前代理目标: `http://localhost:3001`

### 后端配置
- Mock Server: `backend/mock-server.js`
- 环境变量: `backend/.env`
- 日志文件: `backend/backend.log`

---

## 🐛 故障排查

### 问题1: 浏览器显示"找不到网页"

**解决方案**:
```bash
# 重启前端
run-frontend.bat

# 或手动启动
cd frontend
npm run dev
```

### 问题2: API 请求失败 (CORS 错误)

**原因**: 后端未运行或未正确配置

**解决方案**:
1. 检查后端是否运行: `curl http://localhost:3001/api/health`
2. 重启后端: `run-backend.bat`
3. 检查浏览器控制台中的具体错误消息

### 问题3: 代码修改不生效

**原因**: Vite HMR 缓存问题

**解决方案**:
1. 浏览器硬刷新: `Ctrl+Shift+R`
2. 重启前端开发服务器
3. 清除浏览器缓存: F12 → Application → Clear Storage

### 问题4: 端口已被占用

**错误消息**: `Port 5174 is already in use`

**解决方案**:
```bash
# 查找占用端口的进程
netstat -ano | findstr ":5174"

# 用 PowerShell 杀死进程 (替换 [PID])
powershell "Stop-Process -Id [PID] -Force"

# 重新启动
run-frontend.bat
```

---

## 📱 访问地址汇总

### 本地访问
| 服务 | 地址 |
|------|------|
| 前端应用 | http://localhost:5174 |
| 前端应用 (IP) | http://127.0.0.1:5174 |
| 后端API | http://localhost:3001/api/health |
| 后端API (IP) | http://127.0.0.1:3001/api/health |

### 网络访问 (根据您的计算机IP)
示例:
- http://192.168.1.100:5174 (需要替换为您的IP)
- http://192.168.1.100:3001/api/health

---

## ✨ 主要特性

✅ **Vite 快速开发**: 热更新、快速启动
✅ **完整 Mock API**: 所有接口都有模拟数据
✅ **WebSocket 支持**: 实时通信已就绪
✅ **CORS 配置**: 跨域请求已支持
✅ **生产就绪**: 可直接用于生产部署

---

## 📞 获取帮助

### 查看详细文档
- [LOCAL_INTEGRATION_GUIDE.md](./LOCAL_INTEGRATION_GUIDE.md) - 完整指南
- [LOCAL_INTEGRATION_STATUS.md](./LOCAL_INTEGRATION_STATUS.md) - 状态报告

### 验证环境
```bash
node verify-local-setup.js
```

### 查看服务日志
```bash
# 前端
tail -f frontend/frontend.log

# 后端
tail -f backend/backend.log
```

---

## 🎯 下一步

1. **在浏览器打开应用**
   - http://localhost:5174

2. **开始开发**
   - 编辑 `frontend/src` 中的文件
   - 代码会自动热更新

3. **测试 API**
   - 在浏览器 F12 中查看 Network 标签
   - 所有 `/api/*` 请求会自动转发到后端

4. **调试**
   - 使用浏览器开发者工具 (F12)
   - 查看控制台错误信息

---

**准备好了吗？** 🚀

打开浏览器访问: **http://localhost:5174**

祝您开发愉快！
