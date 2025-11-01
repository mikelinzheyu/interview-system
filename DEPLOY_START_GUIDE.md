# 🚀 AI面试系统 - 生产环境一键启动指南

## 📍 当前状态

✅ **已完成的准备工作：**
- Docker 和 Docker Compose 已安装并验证
- SSL证书已生成在 `nginx/ssl/` 目录
- 环境配置文件 `.env.docker` 已准备
- Docker镜像正在构建中...

---

## ⚡ 快速启动 (3步)

### 步骤1：等待镜像构建完成

如果您看到此消息，镜像构建正在进行。请等待以下完成：

```bash
# 后端镜像构建 - 大约2-3分钟
# 前端镜像构建 - 大约3-5分钟
```

### 步骤2：验证镜像构建成功

```bash
# 检查已构建的镜像
docker images | grep interview-system
```

**预期输出：**
```
REPOSITORY                        TAG       IMAGE ID
interview-system/backend          latest    xxxxx
interview-system/frontend         latest    xxxxx
```

如果看不到这两个镜像，请查看构建日志：
```bash
docker-compose --env-file .env.docker build backend
docker-compose --env-file .env.docker build frontend
```

### 步骤3：启动所有服务

#### 选项A：使用部署脚本 (推荐)
```bash
./docker-deploy-prod.sh start
```

#### 选项B：使用Docker Compose直接启动
```bash
docker-compose --env-file .env.docker up -d
```

#### 选项C：启动并查看日志
```bash
docker-compose --env-file .env.docker up
```

---

## ⏱️ 预期启动时间

| 服务 | 启动时间 | 健康检查 |
|------|---------|---------|
| Redis | 5-10秒 | PING |
| 后端 | 15-30秒 | GET /api/health |
| 前端 | 10-20秒 | GET / |
| **总计** | **30-60秒** | **全部就绪** |

---

## ✅ 验证服务已启动

### 检查容器状态
```bash
docker-compose --env-file .env.docker ps
```

**所有容器应该显示 "healthy" 状态：**
```
NAME                    STATUS              PORTS
interview-backend       Up ... (healthy)    0.0.0.0:8080->3001/tcp
interview-frontend      Up ... (healthy)    0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
interview-redis         Up ... (healthy)    0.0.0.0:6379->6379/tcp
```

### 验证服务连接

```bash
# 1. 测试后端API
curl http://localhost:8080/api/health

# 预期响应 (HTTP 200):
# {"status":"ok"}
```

```bash
# 2. 测试前端健康检查
curl http://localhost/health

# 预期响应 (HTTP 200):
# healthy
```

```bash
# 3. 测试Redis连接
docker-compose --env-file .env.docker exec -T redis redis-cli ping

# 预期响应:
# PONG
```

---

## 🌐 访问应用

### 地址清单

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://localhost | 主应用 (HTTP) |
| **前端应用** | https://localhost | 主应用 (HTTPS) |
| **后端API** | http://localhost:8080/api | API基础URL |
| **API健康检查** | http://localhost:8080/api/health | 后端状态 |
| **前端健康检查** | http://localhost/health | 前端状态 |
| **Redis** | localhost:6379 | 缓存服务 |

### 首次访问

打开浏览器访问：**http://localhost**

您应该看到：
- Vue3应用的首页加载
- 前端能够连接后端API
- 所有页面和功能正常工作

**注意：** 首次加载可能较慢，因为需要编译Vue应用。之后会很快。

---

## 📊 实时监控

### 查看日志

```bash
# 所有服务的日志（实时）
docker-compose --env-file .env.docker logs -f

# 特定服务的日志
docker-compose --env-file .env.docker logs -f backend
docker-compose --env-file .env.docker logs -f frontend
docker-compose --env-file .env.docker logs -f redis

# 最后100行日志
docker-compose --env-file .env.docker logs --tail=100
```

### 资源使用情况

```bash
# 实时监控
docker stats

# 特定容器
docker stats interview-backend interview-frontend interview-redis
```

### 调试模式

如果遇到问题，查看详细日志：
```bash
# 显示更多日志上下文
docker-compose --env-file .env.docker logs backend 2>&1 | head -50
```

---

## 🛑 服务管理

### 停止服务

```bash
# 优雅停止（保留容器和数据）
docker-compose --env-file .env.docker stop

# 或使用脚本
./docker-deploy-prod.sh stop
```

### 重启服务

```bash
# 方法1：使用脚本
./docker-deploy-prod.sh restart

# 方法2：使用Docker Compose
docker-compose --env-file .env.docker restart

# 方法3：完全重启（重建）
docker-compose --env-file .env.docker up -d --force-recreate
```

### 完全清理（删除所有容器和数据）

```bash
# 警告：这会删除所有数据！
docker-compose --env-file .env.docker down -v
```

---

## 🔍 故障排查快速参考

### 问题：服务无法启动

```bash
# 1. 检查镜像是否存在
docker images | grep interview-system

# 2. 查看启动日志
docker-compose --env-file .env.docker logs

# 3. 检查磁盘空间
docker system df

# 4. 如果磁盘满，清理：
docker system prune -a
```

### 问题：无法访问应用

```bash
# 1. 检查容器是否运行
docker ps | grep interview

# 2. 检查端口是否正确映射
docker port interview-frontend
docker port interview-backend

# 3. 测试本地连接
curl -v http://localhost

# 4. 如果还是不行，查看日志：
docker-compose --env-file .env.docker logs frontend
```

### 问题：后端API无响应

```bash
# 1. 检查后端容器
docker ps | grep interview-backend

# 2. 查看后端日志
docker-compose --env-file .env.docker logs backend

# 3. 测试容器内部连接
docker-compose --env-file .env.docker exec backend curl http://localhost:3001/api/health

# 4. 检查网络
docker network inspect interview-network
```

### 问题：Redis连接失败

```bash
# 1. 检查Redis容器
docker ps | grep redis

# 2. 测试Redis连接
docker-compose --env-file .env.docker exec -T redis redis-cli ping

# 3. 查看Redis日志
docker-compose --env-file .env.docker logs redis

# 4. 检查Redis内存
docker-compose --env-file .env.docker exec -T redis redis-cli info memory
```

---

## 📁 重要文件位置

| 文件/目录 | 说明 |
|----------|------|
| `.env.docker` | 环境变量配置 |
| `docker-compose.yml` | Docker Compose定义 |
| `nginx/ssl/` | SSL证书 |
| `logs/` | 所有日志文件 |
| `data/redis/` | Redis持久化数据 |
| `backend/` | 后端应用源代码 |
| `frontend/` | 前端应用源代码 |

---

## 🔐 安全建议

### 生产环境必做事项

- [ ] 修改 `.env` 中的 `JWT_SECRET` 为强密码
- [ ] 配置真实的SSL证书（而不是自签名）
- [ ] 设置安全的Redis密码
- [ ] 定期备份Redis数据
- [ ] 启用Docker日志轮转
- [ ] 配置防火墙允许80和443端口
- [ ] 定期更新Docker镜像和基础镜像

### 生成强密钥

```bash
# 生成新的JWT密钥
openssl rand -base64 32

# 生成Redis密码
openssl rand -base64 16
```

然后更新 `.env` 文件。

---

## 📈 性能优化建议

### 确保充足资源

**最低要求：**
- CPU: 2核
- 内存: 4GB
- 磁盘: 20GB

**推荐配置：**
- CPU: 4核+
- 内存: 8GB+
- 磁盘: 50GB+

### 调整Docker资源限制

编辑 `docker-compose.yml`，为每个服务添加资源限制：

```yaml
services:
  backend:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 启用BuildKit加速构建

```bash
export DOCKER_BUILDKIT=1
docker-compose --env-file .env.docker build
```

---

## 📞 获取帮助

### 查看详细文档

```bash
# 完整部署指南
cat DOCKER_PRODUCTION_DEPLOYMENT.md

# 快速参考
cat QUICK-REFERENCE.md

# 故障排查
cat DOCKER-TROUBLESHOOTING.md
```

### 常用命令

```bash
# 查看所有可用命令
./docker-deploy-prod.sh help

# 查看完整状态
./docker-deploy-prod.sh status

# 验证部署
./docker-deploy-prod.sh verify
```

---

## ✨ 下一步

部署成功后，您可以：

1. **测试应用功能**
   - 访问 http://localhost
   - 测试所有业务流程
   - 检查API响应

2. **配置监控告警**
   - 设置容器监控
   - 配置日志聚合
   - 设置性能告警

3. **备份和恢复**
   - 定期备份Redis数据
   - 制定恢复计划
   - 测试恢复流程

4. **性能调优**
   - 监控资源使用
   - 优化缓存策略
   - 调整日志级别

5. **更新和升级**
   - 更新应用代码
   - 重建Docker镜像
   - 灰度发布新版本

---

## 🎯 快速命令速查

```bash
# 启动
docker-compose --env-file .env.docker up -d

# 停止
docker-compose --env-file .env.docker stop

# 重启
docker-compose --env-file .env.docker restart

# 查看日志
docker-compose --env-file .env.docker logs -f

# 查看状态
docker ps -a

# 进入容器
docker exec -it interview-backend sh
docker exec -it interview-frontend sh

# 查看资源
docker stats

# 清理
docker system prune -a
```

---

## 📋 部署检查清单

启动前，确保：

- [ ] Docker已安装并运行
- [ ] Docker Compose版本 >= 2.0
- [ ] `.env.docker` 文件存在且配置正确
- [ ] 镜像已构建（`docker images | grep interview-system`）
- [ ] SSL证书已生成在 `nginx/ssl/`
- [ ] 端口80、443、8080未被占用
- [ ] 磁盘空间充足 (至少20GB)
- [ ] 内存充足 (至少4GB可用)

启动后，确保：

- [ ] 所有容器运行中 (`docker ps`)
- [ ] 所有容器健康 (状态显示 "healthy")
- [ ] 前端可访问 (http://localhost)
- [ ] API可响应 (http://localhost:8080/api/health)
- [ ] Redis连接正常 (redis-cli ping)
- [ ] 没有错误日志

---

**准备好了？执行 `docker-compose --env-file .env.docker up -d` 启动！** 🚀

或查看完整指南：[DOCKER_PRODUCTION_DEPLOYMENT.md](./DOCKER_PRODUCTION_DEPLOYMENT.md)
