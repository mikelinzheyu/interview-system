# 🚀 前后端联调测试 - 一页纸快速参考

## ⚡ 最快的启动方式

### Windows
```batch
cd D:\code7\interview-system
start-integration-test.bat
```

### Linux/Mac
```bash
cd /path/to/interview-system
chmod +x start-integration-test.sh
./start-integration-test.sh
```

**预期**: 自动启动后端 → 前端 → 运行测试 ✅

---

## 📋 手动启动 (3个终端)

### 终端 1: 后端
```bash
cd backend && npm start
# 看到: 🚀 Mock API服务器已启动
# 地址: http://localhost:3001
```

### 终端 2: 前端
```bash
cd frontend && npm run dev
# 看到: Local: http://localhost:5174
```

### 终端 3: 测试
```bash
node test-integration.js
# 看到: 成功率 100%
```

---

## 🧪 核心API快速测试

```bash
# 1. 健康检查
curl http://localhost:3001/api/health

# 2. 启动面试
curl -X POST http://localhost:3001/api/interviews/start \
  -H "Content-Type: application/json" \
  -d '{"jobPosition":"前端","difficulty":"intermediate"}'

# 3. 获取问题
curl http://localhost:3001/api/interviews/{interviewId}/question

# 4. 提交答案
curl -X POST http://localhost:3001/api/interviews/submit-answer \
  -H "Content-Type: application/json" \
  -d '{"interviewId":"xxx","questionId":"q1","answer":"回答内容"}'

# 5. 结束面试
curl -X POST http://localhost:3001/api/interviews/end \
  -H "Content-Type: application/json" \
  -d '{"interviewId":"xxx"}'
```

---

## 🌐 浏览器测试

### 访问前端
```
http://localhost:5174
```

### 浏览器控制台测试
```javascript
// 测试API连接
fetch('/api/health').then(r => r.json()).then(console.log);

// 查看API基址
console.log(import.meta.env.VITE_API_BASE_URL);
```

---

## 🐛 常见问题 5分钟解决

| 问题 | 原因 | 解决 |
|------|------|------|
| CORS错误 | 代理配置 | 检查vite.config.js |
| 404错误 | API不存在 | 确认后端路由 |
| 超时 | 后端未启 | `npm start` |
| WebSocket失败 | 地址错误 | 用 `ws://` 不是 `wss://` |
| 连接拒绝 | 端口占用 | 改.env中的端口号 |

---

## 📊 测试环境快速表

| 组件 | 地址 | 验证方式 |
|------|------|--------|
| 前端 | http://localhost:5174 | 能访问页面 |
| 后端 | http://localhost:3001 | curl /api/health → 200 |
| WebSocket | ws://localhost:3001/ws | 浏览器DevTools查看 |

---

## 📁 关键文件速查

| 文件 | 用途 |
|------|------|
| `test-integration.js` | 自动化测试脚本 |
| `FRONTEND_BACKEND_INTEGRATION_TEST.md` | 详细指南 (230行) |
| `INTEGRATION_TEST_SUMMARY.md` | 完整总结 (360行) |
| `vite.config.js` | 前端代理配置 |
| `mock-server.js` | 后端主文件 |

---

## ⏱️ 预期时间

| 操作 | 时间 |
|------|------|
| 启动后端 | 3秒 |
| 启动前端 | 5秒 |
| 运行测试 | 2秒 |
| 查看结果 | 1秒 |
| **总计** | **< 1分钟** |

---

## ✅ 成功标志

```
✓ 后端健康检查通过
✓ 前端页面加载成功
✓ API请求成功
✓ WebSocket连接成功
✓ 自动化测试成功率 100%
```

---

## 📞 需要帮助?

1. **快速查询** → 本文件
2. **详细指南** → `FRONTEND_BACKEND_INTEGRATION_TEST.md`
3. **完整参考** → `INTEGRATION_TEST_SUMMARY.md`
4. **查看日志** → `backend.log`, `frontend.log`

---

**下一步**: 运行 `start-integration-test.sh/bat` 开始测试！🎯
