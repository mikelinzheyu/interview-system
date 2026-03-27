# 🐳 Docker 全量部署清单

## 📋 部署内容清单

✅ **已创建的部署相关文件**:

### 配置文件
- `docker-compose.local.yml` - 本地开发部署配置 (PostgreSQL, Redis, Node.js, Nginx)
- `.env` - 环境变量配置文件

### 部署脚本
- `deploy-docker.sh` - Linux/Mac 一键部署脚本
- `deploy-docker.ps1` - Windows PowerShell 一键部署脚本
- `verify-deployment.sh` - 部署验证脚本

### 文档
- `DOCKER_DEPLOYMENT_GUIDE.md` - 完整部署指南 (900+ 行)
- `DOCKER_QUICK_START.md` - 快速入门指南
- `DOCKER_DEPLOYMENT_CHECKLIST.md` - 本文件

### Dockerfile
- `backend/Dockerfile.prod` - 后端镜像
- `frontend/Dockerfile.prod` - 前端镜像

---

## 🚀 部署流程

### 1️⃣ 前置条件检查

```bash
# 检查 Docker 版本
docker --version
# 需要: Docker 20.10+

# 检查 Docker Compose 版本
docker-compose --version
# 需要: Docker Compose 2.0+

# 检查 Docker 是否运行
docker ps
# 应该能列出容器
```

### 2️⃣ 启动部署

**Linux/Mac**:
```bash
# 给脚本执行权限
chmod +x deploy-docker.sh

# 运行部署脚本
bash deploy-docker.sh
```

**Windows** (需要管理员权限):
```powershell
# 在 PowerShell 中运行
.\deploy-docker.ps1
```

### 3️⃣ 验证部署

```bash
# 运行验证脚本
bash verify-deployment.sh

# 或手动检查
docker-compose -f docker-compose.local.yml ps
```

---

## 📦 部署的容器和服务

| # | 容器名 | 服务 | 端口 | 镜像 | 状态 |
|---|--------|------|------|------|------|
| 1 | interview-db | PostgreSQL | 5432 | postgres:15-alpine | ✅ 自动部署 |
| 2 | interview-redis | Redis | 6379 | redis:7-alpine | ✅ 自动部署 |
| 3 | interview-backend | Node.js API | 3001 | 本地构建 | ✅ 自动部署 |
| 4 | interview-frontend | Nginx | 80→8080 | 本地构建 | ✅ 自动部署 |

---

## 🔍 验证检查项

运行部署后，验证脚本会检查:

### ✅ 系统检查
- [ ] Docker daemon 运行正常
- [ ] Docker Compose 可用
- [ ] 磁盘空间充足 (10GB+)
- [ ] 内存充足 (8GB+)

### ✅ 容器检查
- [ ] 所有 4 个容器启动成功
- [ ] 容器健康检查通过
- [ ] 容器能相互通信

### ✅ 服务检查
- [ ] 后端 API (http://localhost:3001/health)
- [ ] 前端 UI (http://localhost:8080)
- [ ] PostgreSQL 连接正常
- [ ] Redis 连接正常

### ✅ 功能检查
- [ ] 用户信息 API 可用
- [ ] 隐私设置 API 可用
- [ ] 界面偏好 API 可用

---

## 🌐 访问地址

部署成功后，可访问:

```
┌──────────────────────────────────────┐
│ 应用访问地址                         │
├──────────────────────────────────────┤
│ 前端应用                             │
│ http://localhost:8080                │
│                                      │
│ 后端 API (基础地址)                  │
│ http://localhost:3001/api            │
│                                      │
│ 后端健康检查                         │
│ http://localhost:3001/health         │
│                                      │
│ 数据库 (内部访问)                    │
│ Host: localhost                      │
│ Port: 5432                           │
│ User: admin                          │
│ Database: interview_system           │
│                                      │
│ Redis (内部访问)                     │
│ Host: localhost                      │
│ Port: 6379                           │
└──────────────────────────────────────┘
```

---

## 📊 部署时间预估

| 阶段 | 耗时 | 说明 |
|------|------|------|
| Docker 启动 | 1-2 min | 如需启动 Docker Desktop |
| 镜像下载 | 2-3 min | 下载基础镜像 (postgres, redis, nginx, node) |
| 镜像构建 | 3-5 min | 构建后端和前端镜像 |
| 容器启动 | 1-2 min | 启动所有容器 |
| 数据库初始化 | 1-2 min | 运行 SQL 迁移脚本 |
| **总计** | **8-14 min** | 首次部署，视网络速度而定 |

---

## 🔧 常见操作

### 查看日志

```bash
# 实时查看所有容器日志
docker-compose -f docker-compose.local.yml logs -f

# 查看特定容器日志
docker-compose -f docker-compose.local.yml logs -f backend
docker-compose -f docker-compose.local.yml logs -f frontend
docker-compose -f docker-compose.local.yml logs -f db

# 查看最后 100 行日志
docker-compose -f docker-compose.local.yml logs --tail=100 backend
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.local.yml restart

# 重启特定服务
docker-compose -f docker-compose.local.yml restart backend
docker-compose -f docker-compose.local.yml restart frontend

# 重启后等待服务就绪
docker-compose -f docker-compose.local.yml restart && sleep 10
```

### 进入容器调试

```bash
# 进入后端容器
docker exec -it interview-backend sh

# 进入前端容器
docker exec -it interview-frontend sh

# 进入数据库容器
docker exec -it interview-db psql -U admin interview_system

# 进入 Redis 容器
docker exec -it interview-redis redis-cli
```

### 代码更改后重新部署

```bash
# 方式1: 重建并重启单个服务
docker-compose -f docker-compose.local.yml up -d --build backend

# 方式2: 重建所有服务
docker-compose -f docker-compose.local.yml up -d --build

# 方式3: 完全清理后重新部署
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build
```

---

## ⚠️ 故障排查

### 问题 1: Docker Daemon 未运行
```
症状: error during connect: this error may indicate that the docker daemon is not running
解决: 启动 Docker Desktop
```

### 问题 2: 端口被占用
```
症状: port is already allocated
解决: 修改 docker-compose.local.yml 中的端口或关闭占用的进程
```

### 问题 3: 内存不足
```
症状: OOMKilled 或容器不断重启
解决: 增加系统内存或修改容器内存限制
```

### 问题 4: 数据库连接失败
```
症状: Failed to connect to database
解决:
1. 检查 DB 容器是否运行
2. 查看数据库日志
3. 等待数据库初始化完成
```

### 问题 5: 前端无法访问
```
症状: 502 Bad Gateway
解决:
1. 检查后端是否运行
2. 检查 nginx 配置
3. 查看前端和后端日志
```

更多故障排查见: `DOCKER_DEPLOYMENT_GUIDE.md`

---

## 💾 数据管理

### 备份数据库

```bash
# 备份到文件
docker exec interview-db pg_dump -U admin interview_system > backup.sql

# 备份指定表
docker exec interview-db pg_dump -U admin interview_system -t users > users_backup.sql
```

### 恢复数据库

```bash
# 从备份文件恢复
cat backup.sql | docker exec -i interview-db psql -U admin interview_system
```

### 查看数据卷

```bash
# 列出所有数据卷
docker volume ls

# 查看特定数据卷信息
docker volume inspect db_data

# 清理未使用的数据卷
docker volume prune
```

---

## 🔐 安全建议

### 1. 环境变量管理

```bash
# 不要在代码中硬编码敏感信息
# 使用 .env 文件
cat > .env << EOF
JWT_SECRET=your-secure-random-key
DB_PASSWORD=your-strong-password
EOF

# 确保 .env 在 .gitignore 中
echo ".env" >> .gitignore
```

### 2. 密码安全

```bash
# 使用强密码
# 避免使用默认密码 (SecurePassword123!)
# 生成随机密码
openssl rand -base64 32
```

### 3. 容器隔离

```bash
# 容器运行在专用网络中
# 只有必要的端口对外暴露
# 查看网络配置
docker network inspect interview-network
```

---

## 📈 性能优化

### 内存优化

```bash
# 查看容器内存占用
docker stats

# 限制容器内存使用
# 编辑 docker-compose.local.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

### 磁盘空间优化

```bash
# 查看 Docker 磁盘使用
docker system df

# 清理未使用的资源
docker system prune -a --volumes

# 删除具体镜像
docker image rm image_name
```

### 日志大小控制

```bash
# 在 docker-compose 中配置日志大小
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
```

---

## 📚 相关文档

- `DOCKER_DEPLOYMENT_GUIDE.md` - 详细部署指南 (900+ 行)
  - 前置条件详解
  - 故障排查详细步骤
  - 优化建议
  - 监控和日志

- `DOCKER_QUICK_START.md` - 快速入门
  - 3 步快速开始
  - 常用命令速查
  - 基本操作

- `README.md` - 项目概述
  - 功能说明
  - 技术栈
  - 贡献指南

---

## ✅ 部署完成检查

完成以下步骤即可确认部署成功:

- [ ] 运行 `verify-deployment.sh` 所有检查通过
- [ ] 访问 http://localhost:8080 看到前端界面
- [ ] 访问 http://localhost:3001/health 看到正常的 JSON 响应
- [ ] 可以登录系统
- [ ] 可以修改个人信息
- [ ] 可以修改隐私设置和界面偏好
- [ ] 数据能正确保存

---

## 🎯 下一步

部署完成后可以:

1. **功能测试** - 运行 `test-settings.js` 测试 Settings 功能
2. **负载测试** - 模拟多用户并发测试
3. **备份配置** - 建立定期备份策略
4. **监控设置** - 配置日志收集和告警
5. **文档更新** - 根据实际环境更新部署文档
6. **性能优化** - 基于监控数据进行优化

---

## 📞 获取帮助

遇到问题时:

1. 首先查看 `DOCKER_DEPLOYMENT_GUIDE.md` 中的故障排查部分
2. 运行验证脚本获取诊断信息: `bash verify-deployment.sh`
3. 查看容器日志获取错误信息: `docker-compose logs -f`
4. 查看 Docker 系统状态: `docker system df`

---

**部署版本**: 1.0
**最后更新**: 2026-03-27
**维护者**: AI 面试系统开发团队

✨ **Happy Deploying!** ✨
