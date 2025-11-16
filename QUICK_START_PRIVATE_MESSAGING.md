# 🚀 快速启动指南

## 一键启动前后端

### Windows 用户

#### 方式 1：使用 PowerShell（推荐）
```powershell
# 右键 PowerShell，选择"以管理员身份运行"
# 或在当前目录打开 PowerShell，执行：
.\start-dev.ps1
```

#### 方式 2：使用 CMD
```cmd
start-dev.bat
```

#### 方式 3：手动启动
```cmd
# 终端 1：启动后端
cd backend
npm install
npm start

# 终端 2：启动前端
cd frontend
npm install
npm run dev
```

---

### Linux / Mac 用户

```bash
# 给脚本添加执行权限（首次使用）
chmod +x start-dev.sh

# 执行脚本
./start-dev.sh
```

或者手动启动：
```bash
# 终端 1：启动后端
cd backend
npm install
npm start

# 终端 2：启动前端
cd frontend
npm install
npm run dev
```

---

## ✅ 启动完成标志

### 后端启动成功
```
🚀 Backend Server 已启动
HTTP API  : http://localhost:3001/api
WebSocket : ws://localhost:3001
Health    : http://localhost:3001/health
```

### 前端启动成功
```
➜  Local:   http://localhost:5174/
➜  Press h to show help
```

---

## 🧪 测试私信功能

1. **打开浏览器**
   - 访问：http://localhost:5174/community/posts/20

2. **进行私信操作**
   - 在左侧找到作者卡片
   - 点击私信按钮（消息图标）
   - 应该看到对话框弹出

3. **发送测试消息**
   - 在对话框中输入消息
   - 按 Ctrl+Enter（或 Cmd+Enter on Mac）发送
   - 消息应该立即显示

---

## 📊 验证服务状态

### 后端健康检查
```bash
curl http://localhost:3001/api/health
# 应该返回 200 OK
```

### 前端访问测试
```bash
curl http://localhost:5174/
# 应该返回 HTML 页面
```

### API 端点测试
```bash
# 获取对话列表
curl http://localhost:3001/api/messages/conversations \
  -H "x-user-id: 1"
```

---

## 🐛 故障排除

### 端口已占用
```bash
# 查看 3001 端口占用情况
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001

# 关闭占用的进程后重新启动
```

### 依赖安装失败
```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 前端无法连接后端
```bash
# 确保后端正在运行
curl http://localhost:3001/api/health

# 检查前端 .env.development 中的 API 地址
# 应该是：VITE_API_BASE_URL=http://localhost:3001/api
```

---

## 📖 更多信息

- **测试指南**：`FRONTEND_BACKEND_TESTING_GUIDE.md`
- **问题总结**：`PRIVATE_MESSAGING_FIX_SUMMARY.md`
- **WebSocket 文档**：`WEBSOCKET_IMPLEMENTATION.md`
- **最佳实践**：`MESSAGING_BEST_PRACTICE.md`

---

## 🎯 下一步

完成启动后：
1. ✅ 打开浏览器访问前端
2. ✅ 点击私信功能进行测试
3. ✅ 打开浏览器开发者工具（F12）查看日志
4. ✅ 检查 Network 标签确保 API 调用成功

祝测试顺利！🚀
