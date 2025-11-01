# ⚡ 5分钟快速启动指南

## 🎯 目标
在5分钟内启动并验证整个系统

---

## ⏱️ 倒计时开始！

### 0-1分钟：等待镜像完成

```bash
# 监控构建进度
docker images | grep interview-system
```

**等待看到这两个镜像：**
```
interview-system/backend:latest
interview-system/frontend:latest
```

### 1-2分钟：启动所有服务

一旦镜像就绪，执行：

```bash
# 方法1：使用脚本（推荐）
./docker-deploy-prod.sh start

# 方法2：使用Docker Compose
docker-compose --env-file .env.docker up -d

# 方法3：启动并查看日志（不退出）
docker-compose --env-file .env.docker up
```

### 2-4分钟：等待服务启动

```bash
# 查看启动进度
docker-compose --env-file .env.docker logs -f
```

**看到这些日志说明已就绪：**
- Backend: `Server running on port 3001`
- Frontend: `Nginx started`
- Redis: 已启动

### 4-5分钟：验证访问

```bash
# 打开浏览器访问
http://localhost

# 或者命令行测试
curl http://localhost
curl http://localhost:8080/api/health
curl http://localhost/health
```

---

## ✅ 成功标志

看到以下任何一个就说明成功了：

1. **浏览器**: 访问 http://localhost 看到应用界面
2. **命令行**:
   ```bash
   curl http://localhost
   # HTTP/1.1 200 OK
   ```
3. **Docker**:
   ```bash
   docker ps
   # 看到所有容器都显示 "Up" 且 "healthy"
   ```

---

## 🔧 快速命令

```bash
# 启动
./docker-deploy-prod.sh start
docker-compose --env-file .env.docker up -d

# 停止
./docker-deploy-prod.sh stop
docker-compose --env-file .env.docker stop

# 查看日志
./docker-deploy-prod.sh logs
docker-compose --env-file .env.docker logs -f

# 重启
./docker-deploy-prod.sh restart

# 查看状态
./docker-deploy-prod.sh status
docker ps

# 清理
./docker-deploy-prod.sh clean
docker-compose --env-file .env.docker down -v
```

---

## 🌐 应用地址

| 应用 | 地址 |
|------|------|
| 前端应用 | http://localhost |
| 后端API | http://localhost:8080/api |
| 健康检查 | http://localhost/health |

---

## ⚠️ 如果构建失败

### 方案A：使用现有的后端镜像

如果前端镜像无法构建，可以先用后端启动：

```bash
# 检查现有镜像
docker images | grep interview-system

# 如果只有后端镜像，可以用Nginx镜像作为前端的临时替代
# （虽然这样无法访问Vue应用，但后端API可以工作）
```

### 方案B：调整Dockerfile

如果构建仍然失败，编辑前端Dockerfile：

```bash
# 编辑frontend/Dockerfile
# 尝试以下修改：
# 1. 增加内存: NODE_OPTIONS="--max-old-space-size=4096"
# 2. 更新Node版本: FROM node:22-alpine
# 3. 清理缓存: npm cache clean --force
```

### 方案C：检查日志

```bash
# 查看详细构建日志
docker buildx build --file frontend/Dockerfile --progress=plain . 2>&1 | tail -100

# 或者保存到文件
docker-compose --env-file .env.docker build frontend 2>&1 > build.log
tail -100 build.log
```

---

## 📊 实时监控

```bash
# 监控容器资源使用
docker stats

# 监听日志
docker-compose --env-file .env.docker logs -f backend
docker-compose --env-file .env.docker logs -f frontend
docker-compose --env-file .env.docker logs -f redis
```

---

## 🚨 故障排查

| 问题 | 解决方案 |
|------|---------|
| 镜像构建失败 | 见上方"如果构建失败" |
| 容器无法启动 | `docker logs <container>` 查看日志 |
| 无法访问应用 | `curl -v http://localhost` 测试连接 |
| API无响应 | `curl -v http://localhost:8080/api/health` |
| 端口被占用 | `netstat -tuln \| grep :80` 检查端口 |
| 内存不足 | 关闭其他应用，`docker system prune` 清理 |

---

## 📞 获取帮助

- **快速参考**: `./docker-deploy-prod.sh help`
- **详细日志**: `docker-compose --env-file .env.docker logs`
- **完整指南**: `DOCKER_PRODUCTION_DEPLOYMENT.md`
- **故障排查**: `DOCKER-TROUBLESHOOTING.md`
- **验证脚本**: `./verify-deployment.sh all`

---

## ⏳ 时间预估

| 步骤 | 时间 |
|------|------|
| 检查环境 | < 10秒 |
| 等待镜像 | 5-10分钟（第一次） |
| 启动容器 | 30-60秒 |
| 健康检查 | 1-2分钟 |
| **总计** | **10-15分钟**（包括镜像构建） |
| **总计** | **2-3分钟**（镜像已存在） |

---

## 🎉 现在就启动！

```bash
# 一行命令启动所有
./docker-deploy-prod.sh start

# 或者
docker-compose --env-file .env.docker up -d

# 等待1-2分钟，然后访问：
# http://localhost
```

**祝您使用愉快！** 🚀
