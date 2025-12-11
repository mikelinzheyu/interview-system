# 生产环境部署指南

## 前置要求

### 1. 启动 Docker Desktop

**重要：** 在运行任何部署命令前，必须先启动 Docker Desktop！

1. 打开 Windows 开始菜单
2. 搜索 "Docker Desktop"
3. 点击启动 Docker Desktop
4. 等待 Docker Desktop 完全启动（系统托盘图标显示为绿色）
5. 确认 Docker 引擎状态为 "Running"

### 2. 验证 Docker 状态

```cmd
docker ps
```

如果显示容器列表（即使是空的），说明 Docker 正常运行。

## 快速部署（推荐）

### 方法一：使用批处理脚本

```cmd
cd D:\code4\interview-system\production
deploy-simple.bat
```

### 方法二：使用 PowerShell 脚本

```powershell
cd D:\code4\interview-system\production
.\deploy.ps1
```

## 手动部署

如果自动脚本无法运行，可以手动执行以下步骤：

### 步骤 1: 进入 production 目录

```cmd
cd D:\code4\interview-system\production
```

### 步骤 2: 停止旧服务（如果有）

```cmd
docker-compose -f docker-compose.production.yml down
```

### 步骤 3: 构建镜像

```cmd
docker-compose -f docker-compose.production.yml build --no-cache
```

这一步可能需要 5-10 分钟，请耐心等待。

### 步骤 4: 启动服务

```cmd
docker-compose -f docker-compose.production.yml up -d
```

### 步骤 5: 查看服务状态

```cmd
docker-compose -f docker-compose.production.yml ps
```

所有服务应该显示为 "Up" 状态。

### 步骤 6: 查看服务日志

```cmd
docker-compose -f docker-compose.production.yml logs -f
```

按 Ctrl+C 退出日志查看。

## 验证部署

### 检查服务状态

```cmd
docker-compose -f docker-compose.production.yml ps
```

预期输出（所有服务都应该是 Up 状态）：

```
NAME                     STATUS                   PORTS
interview-mysql          Up (healthy)             0.0.0.0:3307->3306/tcp
interview-redis          Up (healthy)             0.0.0.0:6380->6379/tcp
interview-storage-api    Up (healthy)             0.0.0.0:8090->8080/tcp
interview-backend-java   Up (healthy)             0.0.0.0:8080->8080/tcp
interview-backend-node   Up (healthy)             0.0.0.0:3001->3001/tcp
interview-frontend       Up (healthy)             0.0.0.0:80->80/tcp
```

### 访问应用

打开浏览器访问：

- **前端应用**: http://localhost
- **Java 后端 API**: http://localhost:8080/actuator/health
- **Node 后端 API**: http://localhost:3001/api/health

### 查看日志

查看所有服务日志：
```cmd
docker-compose -f docker-compose.production.yml logs -f
```

查看特定服务日志：
```cmd
docker-compose -f docker-compose.production.yml logs -f backend-java
docker-compose -f docker-compose.production.yml logs -f frontend
docker-compose -f docker-compose.production.yml logs -f mysql
```

## 常见问题

### Q1: Docker Desktop 启动失败

**解决方法：**
1. 重启 Docker Desktop
2. 如果还是失败，重启计算机
3. 确保 WSL 2 已正确安装和配置

### Q2: 端口被占用

**错误信息：** "port is already allocated"

**解决方法：**
```cmd
# 查看占用端口的进程
netstat -ano | findstr :80
netstat -ano | findstr :3001
netstat -ano | findstr :8080

# 根据 PID 终止进程
taskkill /PID <进程ID> /F
```

或者修改 `.env.production` 文件中的端口配置。

### Q3: 服务启动失败

**解决方法：**
1. 查看日志找出错误原因：
   ```cmd
   docker-compose -f docker-compose.production.yml logs
   ```

2. 重新构建并启动：
   ```cmd
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml up -d --build
   ```

### Q4: 镜像构建失败

**解决方法：**
1. 清理 Docker 缓存：
   ```cmd
   docker system prune -a
   ```

2. 重新构建：
   ```cmd
   docker-compose -f docker-compose.production.yml build --no-cache
   ```

### Q5: 数据库连接失败

**解决方法：**
1. 确认 MySQL 容器正在运行：
   ```cmd
   docker-compose -f docker-compose.production.yml ps mysql
   ```

2. 查看 MySQL 日志：
   ```cmd
   docker-compose -f docker-compose.production.yml logs mysql
   ```

3. 等待 MySQL 完全启动（健康检查通过）

## 服务管理

### 启动服务

```cmd
docker-compose -f docker-compose.production.yml up -d
```

### 停止服务

```cmd
docker-compose -f docker-compose.production.yml down
```

### 重启服务

```cmd
docker-compose -f docker-compose.production.yml restart
```

### 重启特定服务

```cmd
docker-compose -f docker-compose.production.yml restart backend-java
```

### 查看服务资源使用

```cmd
docker stats
```

### 进入容器

```cmd
# 进入 MySQL 容器
docker exec -it interview-mysql bash

# 进入 Redis 容器
docker exec -it interview-redis sh

# 进入 Java 后端容器
docker exec -it interview-backend-java bash
```

## 更新部署

当代码更新后，执行以下步骤：

```cmd
# 1. 拉取最新代码
git pull

# 2. 重新构建并启动
cd production
docker-compose -f docker-compose.production.yml up -d --build

# 3. 查看日志确认
docker-compose -f docker-compose.production.yml logs -f
```

## 数据备份

### 备份 MySQL 数据

```cmd
docker exec interview-mysql mysqldump -u root -p"MySQL2025!SecureRootP@ssw0rd#Interview" interview_system > backup.sql
```

### 备份 Redis 数据

```cmd
docker exec interview-redis redis-cli -a "Redis2025!SecureP@ssw0rd#Interview" SAVE
docker cp interview-redis:/data/dump.rdb ./redis-backup.rdb
```

### 备份上传文件

```cmd
docker cp interview-backend-java:/app/uploads ./uploads-backup
```

## 完全清理

如果需要完全清理并重新开始：

```cmd
# 停止并删除所有容器、网络和卷
docker-compose -f docker-compose.production.yml down -v

# 清理 Docker 系统
docker system prune -a --volumes

# 重新部署
docker-compose -f docker-compose.production.yml up -d --build
```

**警告：** 这将删除所有数据！

## 性能优化建议

### 1. 调整 Docker Desktop 资源

Docker Desktop → Settings → Resources:
- CPU: 分配至少 4 核心
- Memory: 分配至少 8GB
- Swap: 2GB
- Disk image size: 至少 50GB

### 2. 调整服务资源限制

编辑 `docker-compose.production.yml`，为每个服务添加资源限制：

```yaml
services:
  backend-java:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 3. 启用 BuildKit

```cmd
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1
```

## 监控和日志

### 实时监控资源使用

```cmd
docker stats
```

### 导出日志到文件

```cmd
docker-compose -f docker-compose.production.yml logs > deployment.log
```

### 查看特定时间的日志

```cmd
docker-compose -f docker-compose.production.yml logs --since 30m
docker-compose -f docker-compose.production.yml logs --until 2023-12-11T15:00:00
```

## 技术支持

如有问题，请：

1. 查看日志文件：`production/logs/`
2. 查看 Docker 日志：`docker-compose logs`
3. 提交 Issue: https://github.com/mikelinzheyu/interview-system/issues

---

祝部署顺利！🚀
