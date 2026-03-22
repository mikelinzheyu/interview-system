# 🎯 全 Docker 生产环境前后端联调测试 - 完整指南索引

## 📚 文档导航

本次测试包含以下完整文档：

| 文档 | 用途 | 阅读时间 |
|-----|------|--------|
| **DOCKER_QUICK_START.md** | ⭐ **从这里开始** - 5分钟快速入门 | 5分钟 |
| **FULL_DOCKER_INTEGRATION_TEST.md** | 完整的6阶段测试流程和验收标准 | 15分钟 |
| **DOCKER_TROUBLESHOOTING.md** | 故障排查指南 - 遇到问题查这里 | 按需 |
| **quick-docker-test.sh** | 自动化启动脚本 - 一键启动全栈 | - |

## 🚀 5分钟快速开始

### 前置条件
```bash
# 确保已安装和运行
✅ Docker Desktop 或 Docker + Docker Compose
✅ 4GB+ RAM 和 10GB+ 磁盘空间
```

### 完整流程 (一共5步)

#### 第1步: 设置环境变量 (1分钟)
```bash
# 选择一种方式:

# 方式A: 创建 .env 文件 (推荐)
cat > .env << 'EOF'
DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3
DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk
DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16
EOF

# 方式B: 导出环境变量
export DIFY_INTERVIEW_INIT_KEY="app-tbxpV6bDyAYab4qqRYSavxH3"
export DIFY_INTERVIEW_CHAT_KEY="app-4wtUAIUlZDoohTFfjN2T6WNk"
export DIFY_INTERVIEW_VERDICT_KEY="app-7g0QiWpxu9ASO2f7U3VccK16"
```

#### 第2步: 启动全栈 (2分钟)
```bash
# 使用自动脚本 (推荐)
bash quick-docker-test.sh

# 或手动命令
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
sleep 30
docker-compose -f docker-compose.prod.yml ps
```

#### 第3步: 验证所有容器运行 (1分钟)
```bash
# 检查状态 - 应该所有容器都显示 "Up"
docker-compose -f docker-compose.prod.yml ps

# 检查日志 - 应该没有 ERROR
docker logs interview-backend | grep -i error || echo "✅ 后端无错误"
docker logs interview-nginx | grep -i error || echo "✅ Nginx无错误"
```

#### 第4步: 网络测试 (1分钟)
```bash
# 测试后端健康检查
curl -v http://localhost:3001/api/health

# 测试通过 Nginx 的转发
curl -v http://localhost/api/health

# 测试前端
curl -s http://localhost/ | head -20
```

#### 第5步: 浏览器测试 (完整验收)
```bash
# 打开浏览器
http://localhost

# 检查:
# 1. DevTools > Console 无 CSP 错误
# 2. Network 请求都返回 2xx
# 3. WebSocket 连接成功 (101 Switching Protocols)
# 4. 应用正常加载和交互
```

---

## ✅ 验收标准

测试**全部通过**的标志:

```
☑️ 所有5个容器正常运行 (docker-compose ps)
  - interview-db (healthy)
  - interview-redis (healthy)
  - interview-backend (running)
  - interview-frontend (running)
  - interview-nginx (healthy)

☑️ 后端日志无错误
  ✅ 显示: "Server running on port 3001"
  ❌ 不应该看到: MODULE_NOT_FOUND, DIFY_INTERVIEW_*_KEY 未配置

☑️ Nginx 日志无错误
  ✅ 显示: "Configuration complete; ready for start up"
  ❌ 不应该看到: SSL certificate error, host not found

☑️ API 响应正确
  ✅ GET /api/health → HTTP 200
  ✅ GET / (前端) → HTTP 200

☑️ 浏览器无错误
  ✅ Console 无 CSP 错误
  ✅ Network 请求正常
  ✅ WebSocket 连接成功
```

---

## 🔄 主要改进点

本次前后端联调测试修复了以下关键问题：

### 🔧 配置和环境变量
| 问题 | 原因 | 解决方案 |
|------|------|---------|
| DIFY_INTERVIEW_*_KEY 未配置 | 环境变量缺失 | 添加到 .env.prod 和 docker-compose.prod.yml |
| 后端收不到环境变量 | docker-compose 未传递 | 更新 docker-compose.prod.yml 中的 environment 配置 |
| 变量名不匹配 | 使用了错误的变量名 | 后端期望 DIFY_INTERVIEW_* 而非 DIFY_WORKFLOW_* |

### 🔐 安全和网络
| 问题 | 原因 | 解决方案 |
|------|------|---------|
| CSP 阻止 WebSocket | HTML 中缺少 CSP meta 标签 | 添加到 frontend/index.html |
| 前端无法连接后端 | Nginx 代理配置不完整 | 更新 frontend/nginx.conf 中的代理 |
| SSL 证书错误 | 证书文件缺失 | 生成自签名证书或使用 Let's Encrypt |

### 📦 模块和文件
| 问题 | 原因 | 解决方案 |
|------|------|---------|
| MODULE_NOT_FOUND | 文件在 .gitignore 中 | 添加文件到 Git 并提交 |
| 旧的 Dify API 密钥 | 使用了过期的工作流ID | 更新为新的三个工作流密钥 |

---

## 📊 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                            │
│              (http://localhost)                          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Nginx (interview-nginx:443)                    │
│    ┌──────────────────────────────────────────┐         │
│    │ 反向代理                                 │         │
│    │ - /api/* → http://backend:3001          │         │
│    │ - /ws/* → ws://backend:3001             │         │
│    │ - /* → http://frontend:80               │         │
│    └──────────────────────────────────────────┘         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐   ┌────────────────────┐
│ Frontend         │   │ Backend            │
│ (frontend:80)    │   │ (backend:3001)     │
│                  │   │                    │
│ - Vue 3          │   │ - Node.js 18       │
│ - Vite           │   │ - Express.js       │
│ - TailwindCSS    │   │ - WebSocket        │
└──────────────────┘   │ - Dify API Client  │
                       └────────┬───────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
                  ▼                           ▼
            ┌──────────────┐        ┌──────────────────┐
            │ PostgreSQL   │        │ Redis Cache      │
            │ (db:5432)    │        │ (redis:6379)     │
            │              │        │                  │
            │ - Users      │        │ - Sessions       │
            │ - Posts      │        │ - Cache          │
            │ - History    │        │ - Real-time      │
            └──────────────┘        └──────────────────┘
                   │
                   │ (可选)
                   ▼
            ┌──────────────────────┐
            │   Dify AI API        │
            │ (api.dify.ai:443)    │
            │                      │
            │ - 面试初始化 Workflow│
            │ - 面试官 Chat App    │
            │ - 面试裁决 Workflow  │
            └──────────────────────┘
```

---

## 🎯 关键指标

### 网络延迟 (毫秒)
| 操作 | 目标 | 实际 |
|-----|------|------|
| API 健康检查 | < 100ms | ___ |
| 前端首页加载 | < 2s | ___ |
| 面试初始化 | < 5s | ___ |
| WebSocket 连接 | < 500ms | ___ |

### 资源使用
| 服务 | 内存 | CPU |
|-----|------|-----|
| Backend | < 300MB | < 10% |
| Frontend | < 200MB | < 5% |
| Nginx | < 50MB | < 1% |
| Database | < 500MB | < 5% |
| Redis | < 100MB | < 1% |

---

## 🚀 后续步骤

### 阶段1: 本地验证 ✅ (你现在的位置)
```bash
# 在本机 Docker 上完成测试
bash quick-docker-test.sh
```

### 阶段2: Ubuntu ECS 部署 (下一步)
```bash
# 在生产 Ubuntu 服务器上部署
ssh ubuntu@iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com
cd /path/to/interview-system
git pull origin main
docker-compose -f docker-compose.prod.yml up -d
```

### 阶段3: 真实域名测试
```bash
# 使用生产域名 viewself.cn
https://viewself.cn
```

### 阶段4: 负载测试和优化
```bash
# 使用 Apache Bench 进行压力测试
ab -n 1000 -c 100 http://localhost/

# 监控实时性能
docker stats
```

---

## 🆘 快速问题排查

| 症状 | 可能原因 | 快速修复 |
|------|---------|--------|
| "Variable not set" 警告 | 环境变量未加载 | 创建 .env 文件 |
| "Cannot find module" | 文件未在 Git 中 | `git add <file>; git commit; git push` |
| "DIFY_INTERVIEW_*_KEY 未配置" | 后端收不到环保变量 | 重启容器: `docker-compose restart backend` |
| "port already in use" | 端口被占用 | 修改映射或关闭占用应用 |
| "host not found in upstream" | 后端未启动 | 检查日志: `docker logs interview-backend` |
| "CSP error in browser" | HTML 中缺少 CSP | 更新 `frontend/index.html` |

**详细故障排查**: 见 `DOCKER_TROUBLESHOOTING.md`

---

## 📞 需要帮助?

1. **快速问题**: 查看上面的 "快速问题排查" 表格
2. **详细排查**: 阅读 `DOCKER_TROUBLESHOOTING.md`
3. **完整测试**: 查看 `FULL_DOCKER_INTEGRATION_TEST.md`
4. **自动化启动**: 运行 `bash quick-docker-test.sh`

---

## ✨ 完成清单

完成本次联调测试后，你将拥有:

- ✅ **运行中的完整系统** - 5 个容器协同工作
- ✅ **验证的网络连通性** - 所有服务可互相通信
- ✅ **通过的集成测试** - 前后端协作正常
- ✅ **已知的问题清单** - 故障排查指南
- ✅ **可重复的部署流程** - 快速启动脚本
- ✅ **充分的文档** - 4份详细指南

---

## 🎓 学习资源

了解每个组件:

- **Docker & Docker Compose**: https://docs.docker.com/compose/
- **Nginx 反向代理**: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- **Node.js WebSocket**: https://socket.io/docs/
- **Vue 3 & Vite**: https://vitejs.dev/
- **Dify API**: https://docs.dify.ai/

---

## 📈 下次改进点

基于本次测试反馈:

- [ ] 添加自动健康检查脚本
- [ ] 配置 Prometheus 监控
- [ ] 设置 ELK 日志聚合
- [ ] 实现自动备份策略
- [ ] 配置 CI/CD 流水线
- [ ] 性能基准测试

---

**最后更新**: 2026-03-22
**测试环境**: Docker Compose
**下一站**: Ubuntu ECS 生产部署
