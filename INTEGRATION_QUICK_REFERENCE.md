# 前后端联调集成 - 快速参考卡

**打印或保存此页面以供快速参考**

---

## 🚀 快速启动（一键式）

```bash
# 终端 1：启动后端
cd interview-system && node backend/mock-server.js

# 终端 2：启动 Redis（如果需要）
docker-compose up redis -d

# 终端 3：启动前端
cd frontend && npm run dev

# 浏览器打开
http://localhost:5173
```

---

## 📋 关键工作流 ID

| 工作流 | ID | 用途 |
|--------|-----|------|
| **Workflow1** | `560EB9DDSwOFc8As` | 生成问题 |
| **Workflow2** | `5X6RBtTFMCZr0r4R` | 生成答案 |
| **Workflow3** | `7C4guOpDk2GfmIFy` | 评分 |

---

## 🔧 API 端点

### 后端
```
POST /api/ai/dify-workflow
Content-Type: application/json

请求体：
{
  "requestType": "generate_questions|generate_answer|score_answer",
  "jobTitle": "职位名称",           // W1 需要
  "sessionId": "xxx",                // W2/W3 需要
  "questionId": "xxx",               // W2/W3 需要
  "question": "问题文本",            // W2/W3 需要
  "candidateAnswer": "候选答案"      // W3 需要
}
```

---

## 📝 文档导航

| 文档 | 用途 | 何时阅读 |
|------|------|---------|
| `FRONTEND_BACKEND_INTEGRATION_GUIDE.md` | 详细集成指南 | 首次集成时 |
| `FRONTEND_BACKEND_INTEGRATION_STATUS.md` | 当前状态 | 遇到问题时 |
| `INTEGRATION_SESSION_SUMMARY.md` | 会话摘要 | 了解进度时 |
| 本文档 | 快速参考 | 日常使用 |

---

## ⚠️ 常见问题速查

### Q: 后端无法启动？
```bash
# 检查端口占用
netstat -ano | findstr :3001

# 杀死占用进程
powershell -Command "Stop-Process -Id <PID> -Force"

# 重新启动
node backend/mock-server.js
```

### Q: Redis 连接失败？
```bash
# 选项1：启动 Docker Redis
docker-compose up redis -d

# 选项2：修改后端使用内存存储（开发用）
# 在 backend/mock-server.js 中找到 Redis 调用并替换为内存缓存
```

### Q: Workflow1 返回空数据？
```
→ 验证 Dify Workflow1 的输出变量名
→ 修改 backend/mock-server.js 中的解析逻辑
→ 检查 outputs.session_id 和 outputs.questions
```

### Q: 前端无法连接后端？
```bash
# 检查后端是否运行
curl http://localhost:3001/api/health

# 检查前端 API 配置
# 在 frontend/src/api/index.js 中确认基础 URL
```

---

## 🧪 快速测试命令

```bash
# 测试后端是否运行
curl http://localhost:3001/api/health

# 测试 Workflow1
curl -X POST http://localhost:3001/api/ai/dify-workflow \
  -H "Content-Type: application/json" \
  -d '{"requestType":"generate_questions","jobTitle":"Python开发"}'

# 查看后端日志
tail -f backend-server.log

# 检查特定端口
netstat -ano | findstr :3001
```

---

## 🔍 关键文件位置

```
interview-system/
├── backend/
│   └── mock-server.js ✅ (第 20-40 行配置，第 2371 行工作流函数)
├── frontend/
│   ├── src/views/interview/AIInterviewSession.vue
│   ├── src/services/difyService.js
│   └── src/api/ai.js
├── storage-service/
│   └── src/main/java/...
└── INTEGRATION_SESSION_SUMMARY.md (阅读此文件了解进度)
```

---

## 📊 系统状态检查清单

启动服务前检查：
- [ ] Redis 运行中（如需要）
- [ ] ngrok 隧道活跃
- [ ] 后端文件已修改（配置 + 工作流 ID）
- [ ] 前端环境变量正确
- [ ] Dify 工作流都已激活

启动后验证：
- [ ] 后端监听 3001 端口
- [ ] 前端可访问 http://localhost:5173
- [ ] 浏览器控制台无错误
- [ ] 后端日志无红色错误

---

## 💡 性能优化建议

| 优化项 | 方法 |
|--------|------|
| 减少 Dify 延迟 | 使用专线/VPN，或在靠近 API 的区域运行 |
| 加快响应 | 启用 Redis 缓存 |
| 减少错误 | 添加重试机制和超时处理 |
| 监控系统 | 添加日志和性能监控 |

---

## 🚨 紧急调试

系统完全卡顿或无响应时：

```bash
# 1. 杀死所有 Node 进程
taskkill /F /IM node.exe

# 2. 清理 Redis（如使用）
redis-cli FLUSHALL

# 3. 删除前端缓存
rm -rf frontend/.nuxt frontend/dist

# 4. 重新启动
# 按上面的"快速启动"步骤
```

---

## 📞 技术支持流程

1. **查看日志**
   ```bash
   tail -f backend-server.log
   # 检查浏览器 DevTools > Network 标签
   ```

2. **验证连接**
   ```bash
   curl http://localhost:3001/api/health
   curl https://api.dify.ai/v1/workflows/560EB9DDSwOFc8As/info
   ```

3. **检查配置**
   - 后端：第 20-40 行的 DIFY_CONFIG
   - 前端：frontend/src/api/index.js 的 baseURL

4. **查看相关文档**
   - `FRONTEND_BACKEND_INTEGRATION_STATUS.md` 的"常见问题"部分
   - `INTEGRATION_SESSION_SUMMARY.md` 的"问题诊断"部分

---

## ✅ 成功指标

测试通过标志：
- ✅ 页面加载无错误
- ✅ 能输入职位名称
- ✅ 显示 5 个生成的问题
- ✅ 能输入答案
- ✅ 显示评分和反馈
- ✅ 所有数据正确完整

---

## 🎯 下一步

1. **立即**
   - [ ] 验证 Workflow1 输出映射
   - [ ] 修复数据解析（如需要）

2. **今天内**
   - [ ] 完成端到端测试
   - [ ] 修复所有测试中的问题

3. **本周内**
   - [ ] 优化前端 UI
   - [ ] 增强错误处理
   - [ ] 准备部署

---

## 快速提示

- **记住这三个工作流 ID**：W1=560EB9DD..., W2=5X6RBtTF..., W3=7C4guOpD...
- **常用命令**：`node backend/mock-server.js`, `npm run dev`, `curl http://localhost:3001/api/health`
- **遇到问题先看日志**：`tail -f backend-server.log`
- **前端在 localhost:5173，后端在 3001**：记住这个端口配置
- **三个主要文档**：INTEGRATION_SESSION_SUMMARY（总结），INTEGRATION_GUIDE（详细），INTEGRATION_STATUS（现状）

---

**Print this page for quick reference!**
**最后更新：2025-10-24**

