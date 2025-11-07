# 🎯 AI面试系统 - Docker部署 快速入门

欢迎！👋 这个文件将帮助您快速找到所需的文档和资源。

---

## ⚡ 5秒钟的选择

### 我只想启动应用
→ 执行: `./docker-deploy-prod.sh start` (或选择您的平台)
→ 然后访问: http://localhost

### 我需要帮助
→ 查看: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) (最常用命令)

### 我需要完整指南
→ 查看: [DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md)

### 我遇到问题了
→ 查看: [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md)

---

## 🆕 工作流集成 (新功能)

### 快速验证工作流

```bash
cd interview-system
node test-correct-api.js
```

**期望输出**: ✅ Workflow1: 成功 & ✅ Workflow2: 成功

### 工作流文档
| 文档 | 内容 |
|------|------|
| [WORKFLOWS_COMPLETE_SUMMARY.md](./WORKFLOWS_COMPLETE_SUMMARY.md) | 工作流概览和架构 |
| [WORKFLOW_QUICK_START.md](./WORKFLOW_QUICK_START.md) | 快速参考和代码示例 |
| [WORKFLOW_API_INTEGRATION_GUIDE.md](./WORKFLOW_API_INTEGRATION_GUIDE.md) | API完整参考 |
| [BACKEND_WORKFLOW_INTEGRATION.md](./BACKEND_WORKFLOW_INTEGRATION.md) | 后端实现指南 |
| [DELIVERABLES.md](./DELIVERABLES.md) | 所有交付物清单 |

---

## 📚 文档导航 (按使用场景)

### 🟢 新手入门 (推荐按顺序)

1. **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** (5分钟)
   - 最常用的命令
   - 常见地址
   - 快速排查

2. **[DOCKER-QUICK-START.md](./DOCKER-QUICK-START.md)** (10分钟)
   - 5分钟快速部署
   - 基本操作
   - 常见问题

3. **执行部署**
   ```bash
   ./docker-deploy-prod.sh start
   ```

---

### 🟡 日常使用

| 需求 | 文档 |
|------|------|
| 部署到生产 | [DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md) |
| 配置环境变量 | [.env.docker](./.env.docker) |
| 常见命令 | [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) |
| 查看日志 | `./docker-deploy-prod.sh logs` |
| 检查状态 | `./docker-deploy-prod.sh status` |

---

### 🔴 故障排查

| 问题 | 查看文档 |
|------|--------|
| 服务启动失败 | [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md) - 启动问题 |
| 无法访问应用 | [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md) - 连接问题 |
| 响应缓慢 | [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md) - 性能问题 |
| 快速诊断 | `./docker-deploy-prod.sh status` |

---

## 🚀 立即开始

### Linux/macOS

```bash
cd interview-system
cp .env.docker .env
chmod +x docker-deploy-prod.sh
./docker-deploy-prod.sh start
# 等待30-60秒...
# 访问 http://localhost
```

### Windows PowerShell

```powershell
cd interview-system
Copy-Item .env.docker -Destination .env
.\docker-deploy-prod.ps1 -Action start
# 等待30-60秒...
# 访问 http://localhost
```

### Windows CMD

```batch
cd interview-system
copy .env.docker .env
docker-deploy-prod.bat start
REM 等待30-60秒...
REM 访问 http://localhost
```

---

## 📍 部署完成后

✅ 服务应该在运行 - 检查: `./docker-deploy-prod.sh status`
✅ 前端应该可访问 - 打开: http://localhost
✅ API应该响应 - 测试: http://localhost:8080/api/health
✅ 日志应该正常 - 查看: `./docker-deploy-prod.sh logs`

---

## 💡 常见问题速查

**Q: 怎么查看日志?**
A: `./docker-deploy-prod.sh logs`

**Q: 怎么重启服务?**
A: `./docker-deploy-prod.sh restart`

**Q: 怎么停止服务?**
A: `./docker-deploy-prod.sh stop`

**Q: 更多命令?**
A: `./docker-deploy-prod.sh help` 或查看 [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)

**Q: 遇到问题?**
A: 查看 [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md)

---

## 📚 完整文档清单

### 📖 指南文档

| 文档 | 时间 | 内容 |
|------|------|------|
| [DOCKER-QUICK-START.md](./DOCKER-QUICK-START.md) | 10分钟 | 快速开始指南 |
| [DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md) | 30分钟 | 完整部署指南 |
| [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md) | 按需 | 故障排查指南 |

### 📋 参考文档

| 文档 | 内容 |
|------|------|
| [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | 最常用命令和地址 |
| [DOCKER-FILES-SUMMARY.md](./DOCKER-FILES-SUMMARY.md) | 所有文件的说明 |
| [PROJECT-COMPLETION-SUMMARY.md](./PROJECT-COMPLETION-SUMMARY.md) | 项目完善总结 |

---

## 🎯 根据您的时间选择

### ⏰ 5分钟

1. 执行: `./docker-deploy-prod.sh start`
2. 访问: http://localhost
3. 完成！

### ⏰ 30分钟

1. 读: [DOCKER-QUICK-START.md](./DOCKER-QUICK-START.md) (10分钟)
2. 部署: `./docker-deploy-prod.sh start` (5分钟)
3. 测试: 访问应用，查看日志 (15分钟)

### ⏰ 1小时+

1. 详读: [DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md) (30分钟)
2. 配置: 编辑 `.env.docker`  (15分钟)
3. 部署: `./docker-deploy-prod.sh start` (10分钟)
4. 验证: 运行验证命令 (5分钟)

---

## 🆘 获取帮助

**快速问题** → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
**详细问题** → [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md)
**深度了解** → [DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md)
**不知道有什么** → [DOCKER-FILES-SUMMARY.md](./DOCKER-FILES-SUMMARY.md)

---

## ✨ 核心特性

✅ 一键部署 (三平台)
✅ 自动化脚本
✅ 生产级配置
✅ 完整文档
✅ 故障诊断

---

**准备好了？** 🚀

执行: `./docker-deploy-prod.sh start`

或选择上面的一个文档开始！
