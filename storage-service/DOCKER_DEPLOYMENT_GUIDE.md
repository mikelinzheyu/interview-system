# Storage Service Docker 生产环境部署指南

## 📋 目录
1. [快速开始](#快速开始)
2. [系统要求](#系统要求)
3. [部署步骤](#部署步骤)
4. [配置说明](#配置说明)
5. [运维管理](#运维管理)
6. [故障排查](#故障排查)

---

## 🚀 快速开始

### 一键启动（Linux/Mac）
```bash
cd storage-service
docker-compose -f docker-compose-prod.yml up -d
```

### 查看服务状态
```bash
docker-compose -f docker-compose-prod.yml ps
```

### 查看日志
```bash
docker-compose -f docker-compose-prod.yml logs -f interview-storage-service
```

### 停止服务
```bash
docker-compose -f docker-compose-prod.yml down
```

---

## 💻 系统要求

### 硬件要求
- **CPU**: 2核 或更高
- **内存**: 4GB 或更高 (建议 8GB+)
- **磁盘**: 20GB 或更高 (SSD 推荐)
- **网络**: 稳定的网络连接

### 软件要求
- **Docker**: 20.10 或更高
- **Docker Compose**: 1.29 或更高
- **操作系统**: Linux (推荐 Ubuntu 20.04+) / macOS / Windows with WSL2

### 安装 Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# macOS
brew install docker docker-compose

# Windows (使用 WSL2)
# 从 Microsoft Store 安装 Ubuntu
# 然后运行上面的 Ubuntu 命令
```

---

## 📦 部署步骤

### 步骤 1: 准备环境

```bash
# 克隆或进入项目目录
cd /path/to/interview-system/storage-service

# 创建必要的目录
mkdir -p logs data
chmod 755 logs data
```

### 步骤 2: 配置生产环境

编辑 `.env.prod` 文件，修改关键配置：

```bash
# 更改 Redis 密码 (重要！)
SPRING_REDIS_PASSWORD=your-secure-password

# 更改 API Key (重要！)
SESSION_STORAGE_API_KEY=ak_prod_your_secure_key_here

# 根据需要调整 JVM 内存
JAVA_OPTS=-Xms1024m -Xmx2048m -XX:+UseG1GC
```

### 步骤 3: 构建 Docker 镜像

```bash
# 构建镜像
docker build -f Dockerfile.prod -t interview-storage-service:latest .

# 或使用 docker-compose 自动构建
docker-compose -f docker-compose-prod.yml build
```

### 步骤 4: 启动服务

```bash
# 启动所有服务（Redis + Storage Service）
docker-compose -f docker-compose-prod.yml up -d

# 等待服务完全启动 (约 40-60 秒)
sleep 60
```

### 步骤 5: 验证部署

```bash
# 检查容器运行状态
docker-compose -f docker-compose-prod.yml ps

# 测试健康检查
curl http://localhost:8081/api/sessions

# 应该返回 200 OK 和空的会话列表
```

---

## ⚙️ 配置说明

### docker-compose-prod.yml 关键部分

#### Redis 服务
```yaml
interview-redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes --requirepass redis-password-prod
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "redis-password-prod", "ping"]
```

**配置项**:
- `redis-password-prod`: Redis 访问密码 (生产环境必须更改)
- `appendonly yes`: 启用 AOF 持久化
- `healthcheck`: 健康检查配置

#### Storage Service
```yaml
interview-storage-service:
  ports:
    - "8081:8081"
  depends_on:
    interview-redis:
      condition: service_healthy
  environment:
    SPRING_REDIS_HOST: interview-redis
    SPRING_REDIS_PASSWORD: redis-password-prod
```

**关键环境变量**:
- `SPRING_REDIS_HOST`: Redis 主机 (Docker 网络中使用服务名)
- `SPRING_REDIS_PASSWORD`: Redis 密码 (必须与 Redis 配置一致)
- `SESSION_STORAGE_API_KEY`: API 密钥 (用于认证)

### .env.prod 配置详解

#### Redis 配置
```
SPRING_REDIS_HOST=interview-redis        # 主机名
SPRING_REDIS_PORT=6379                   # 端口
SPRING_REDIS_PASSWORD=redis-password     # 密码
SPRING_REDIS_TIMEOUT=3000ms              # 超时时间
```

#### JVM 内存配置
```
# 根据服务器内存调整
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC
# -Xms: 初始堆大小
# -Xmx: 最大堆大小
# -XX:+UseG1GC: 使用 G1 垃圾回收器
```

#### 日志配置
```
LOGGING_LEVEL_COM_EXAMPLE_INTERVIEWSTORAGE=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=WARN
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_DATA_REDIS=INFO
```

---

## 🛠️ 运维管理

### 查看日志

```bash
# 查看 Storage Service 日志
docker-compose -f docker-compose-prod.yml logs -f interview-storage-service

# 查看 Redis 日志
docker-compose -f docker-compose-prod.yml logs -f interview-redis

# 查看最后 100 行日志
docker-compose -f docker-compose-prod.yml logs --tail=100 interview-storage-service
```

### 进入容器

```bash
# 进入 Storage Service 容器
docker-compose -f docker-compose-prod.yml exec interview-storage-service bash

# 进入 Redis 容器
docker-compose -f docker-compose-prod.yml exec interview-redis redis-cli -a redis-password-prod
```

### 查看资源使用

```bash
# 查看容器资源使用情况
docker stats

# 持续监控
docker stats --no-stream
```

### 备份数据

```bash
# 备份 Redis 数据
docker cp interview-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb

# 备份应用日志
docker cp interview-storage-service:/app/logs ./logs-backup-$(date +%Y%m%d)
```

### 恢复数据

```bash
# 恢复 Redis 数据
docker cp ./redis-backup-20250101.rdb interview-redis:/data/dump.rdb

# 重启容器
docker-compose -f docker-compose-prod.yml restart interview-redis
```

### 更新应用

```bash
# 1. 重新构建镜像
docker-compose -f docker-compose-prod.yml build

# 2. 重新启动服务
docker-compose -f docker-compose-prod.yml up -d

# 3. 验证新版本
curl http://localhost:8081/api/sessions
```

### 扩展存储

如果 Redis 数据增长，需要扩展卷：

```bash
# 检查卷使用情况
docker volume ls
docker volume inspect interview-system_redis-data

# 创建更大的卷
# 修改 docker-compose-prod.yml 中的卷配置
# 然后重新启动
docker-compose -f docker-compose-prod.yml down -v
docker-compose -f docker-compose-prod.yml up -d
```

---

## 🔍 故障排查

### 问题 1: 容器无法启动

**症状**: `docker-compose up -d` 后容器立即退出

**原因**:
- Java 版本不兼容
- 内存不足
- 配置文件错误

**解决**:
```bash
# 查看错误日志
docker-compose -f docker-compose-prod.yml logs interview-storage-service

# 增加内存
# 修改 .env.prod 中的 JAVA_OPTS
# 降低 -Xmx 值，例如: -Xmx512m
```

### 问题 2: Redis 连接失败

**症状**:
```
[错误] Redis 连接失败: Connection refused
```

**原因**:
- Redis 还未启动 (检查 healthcheck)
- 密码错误
- 网络隔离

**解决**:
```bash
# 检查 Redis 状态
docker-compose -f docker-compose-prod.yml ps interview-redis

# 检查 Redis 日志
docker-compose -f docker-compose-prod.yml logs interview-redis

# 测试 Redis 连接
docker-compose -f docker-compose-prod.yml exec interview-redis \
  redis-cli -a redis-password-prod ping
```

### 问题 3: API 端点无响应

**症状**:
```
curl: (7) Failed to connect to localhost port 8081
```

**原因**:
- 服务还未完全启动
- 端口被其他进程占用
- 防火墙阻止

**解决**:
```bash
# 等待服务启动
sleep 60

# 检查端口占用
lsof -i :8081

# 检查防火墙
sudo ufw status
sudo ufw allow 8081
```

### 问题 4: 内存泄漏

**症状**:
- 容器内存使用持续增长
- 服务变得缓慢

**解决**:
```bash
# 查看 JVM 内存使用
docker-compose -f docker-compose-prod.yml exec interview-storage-service \
  jps -lmv

# 重启服务
docker-compose -f docker-compose-prod.yml restart interview-storage-service

# 增加堆内存
# 修改 .env.prod 中的 JAVA_OPTS
# 例如: -Xmx2048m
```

### 问题 5: 磁盘空间不足

**症状**:
```
No space left on device
```

**解决**:
```bash
# 检查磁盘使用
df -h

# 清理 Docker 系统
docker system prune -a --volumes

# 或清理特定卷
docker volume prune
```

### 问题 6: 连接超时

**症状**:
```
[错误] 请求超时
```

**原因**:
- 网络不稳定
- Redis 性能下降
- 应用程序性能问题

**解决**:
```bash
# 增加超时时间
# 修改 .env.prod 中的 SPRING_REDIS_TIMEOUT
SPRING_REDIS_TIMEOUT=5000ms

# 监控 Redis 性能
docker-compose -f docker-compose-prod.yml exec interview-redis \
  redis-cli -a redis-password-prod info stats
```

---

## 📊 监控和告警

### 启用容器监控

```bash
# 安装 cAdvisor (Google 容器监控工具)
docker run \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8080:8080 \
  --name=cadvisor \
  gcr.io/cadvisor/cadvisor:latest
```

### 查看性能指标

```bash
# 实时性能监控
docker stats --no-stream interview-storage-service interview-redis

# 或在浏览器中访问
# http://localhost:8080
```

### 配置日志轮转

Docker Compose 配置已包含日志轮转：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "5"
```

这意味着：
- 单个日志文件最大 100MB
- 最多保留 5 个日志文件
- 旧日志自动删除

---

## 🔐 安全建议

### 1. 更改默认密码

```bash
# 编辑 .env.prod
SPRING_REDIS_PASSWORD=your-very-secure-password-here
SESSION_STORAGE_API_KEY=ak_prod_generate-strong-key
```

### 2. 限制网络访问

```bash
# 仅允许本地网络
firewall-cmd --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" port protocol="tcp" port="8081" accept'

# 或使用 ufw
ufw allow from 192.168.1.0/24 to any port 8081
```

### 3. 启用 HTTPS

修改 docker-compose-prod.yml 添加 SSL:

```yaml
environment:
  SERVER_SSL_ENABLED: "true"
  SERVER_SSL_KEY_STORE: "/app/keystore.p12"
  SERVER_SSL_KEY_STORE_PASSWORD: "keystore-password"
```

### 4. 定期备份

```bash
# 创建备份脚本
#!/bin/bash
BACKUP_DIR="/backup/storage-service"
mkdir -p $BACKUP_DIR

# 备份 Redis
docker cp interview-redis:/data/dump.rdb \
  $BACKUP_DIR/redis-$(date +%Y%m%d-%H%M%S).rdb

# 备份配置
cp .env.prod $BACKUP_DIR/.env.prod-$(date +%Y%m%d)
```

---

## 📈 性能优化

### 优化 JVM

```bash
# 针对高流量场景
JAVA_OPTS=-Xms2048m -Xmx4096m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+ParallelRefProcEnabled

# 针对低内存环境
JAVA_OPTS=-Xms256m -Xmx512m -XX:+UseSerialGC
```

### 优化 Redis

修改 docker-compose-prod.yml:

```yaml
command: >
  redis-server
  --appendonly yes
  --requirepass redis-password-prod
  --maxmemory 512mb
  --maxmemory-policy allkeys-lru
```

### 优化连接池

修改 .env.prod:

```bash
SPRING_REDIS_LETTUCE_POOL_MAX_ACTIVE=20
SPRING_REDIS_LETTUCE_POOL_MAX_IDLE=10
SPRING_REDIS_LETTUCE_POOL_MIN_IDLE=5
```

---

## 📞 获取帮助

- 查看应用日志: `docker-compose -f docker-compose-prod.yml logs interview-storage-service`
- 查看 Redis 日志: `docker-compose -f docker-compose-prod.yml logs interview-redis`
- 查看 Docker 文档: https://docs.docker.com

---

**最后更新**: 2025-10-27
**版本**: 1.0
**状态**: ✅ 生产就绪

