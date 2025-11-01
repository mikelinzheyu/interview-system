# Storage Service 独立部署指南

## 概述

本指南介绍如何将 `storage-service` 作为独立 Docker 容器部署到完整的 Docker 生产环境中。

## 系统架构

```
┌─────────────────────────────────────────────┐
│         Docker Production Environment        │
├─────────────────────────────────────────────┤
│                                               │
│  ┌──────────────┐   ┌──────────────┐         │
│  │  Frontend    │   │  Backend     │         │
│  │  (Nginx)     │   │  (Node.js)   │         │
│  └──────────────┘   └──────────────┘         │
│         │                   │                 │
│         └───────────┬───────┘                 │
│                     │                         │
│  ┌──────────────────┴──────────────────┐    │
│  │    Storage Service (Java/Spring)    │    │
│  │  (interview-storage-service)        │    │
│  └──────────────────┬──────────────────┘    │
│                     │                         │
│  ┌──────────────────┴──────────────────┐    │
│  │         Redis Cache Service         │    │
│  │    (interview-redis)                │    │
│  └──────────────────────────────────────┘    │
│                                               │
└─────────────────────────────────────────────┘
```

## 前置要求

- Docker & Docker Compose (推荐版本: 20.10+)
- 4GB+ 内存
- 20GB+ 磁盘空间
- 网络连接

## 文件结构

```
interview-system/
├── storage-service/                          # Java 存储服务
│   ├── Dockerfile.prod                       # 生产级 Dockerfile
│   ├── docker-compose-prod.yml               # 独立部署配置
│   ├── pom.xml                               # Maven 配置
│   ├── src/
│   │   └── main/resources/
│   │       ├── application.properties        # 默认配置
│   │       └── application-prod.properties   # 生产配置
│   └── QUICK_REFERENCE.txt                   # 快速参考
├── docker-compose.yml                        # 主生产环境配置
├── .env.prod                                 # 生产环境变量
└── logs/
    └── storage/                              # 存储服务日志
```

## 快速部署 (完整系统)

### 1. 准备环境变量

创建或编辑 `.env.prod` 文件:

```bash
# 生产环境配置
NODE_ENV=production
TZ=Asia/Shanghai

# Redis 配置
REDIS_HOST=interview-redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=your-secure-password

# Storage Service 配置
SESSION_STORAGE_API_KEY=ak_live_your_secure_key_here
STORAGE_PORT=8081

# Backend 配置
DIFY_API_KEY=your_dify_api_key
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_URL=https://api.dify.ai/v1/workflows
BACKEND_PORT=8080

# Frontend 配置
FRONTEND_PORT=80
FRONTEND_HTTPS_PORT=443
```

### 2. 创建必要的目录

```bash
# 创建日志和数据目录
mkdir -p logs/storage logs/backend logs/frontend logs/redis
mkdir -p data/storage data/redis
chmod -R 777 logs data
```

### 3. 构建并启动容器

```bash
# 构建所有镜像
docker-compose -f docker-compose.yml build

# 启动完整系统
docker-compose -f docker-compose.yml up -d

# 查看启动日志
docker-compose -f docker-compose.yml logs -f storage-service

# 检查服务状态
docker-compose -f docker-compose.yml ps
```

### 4. 验证部署

```bash
# 检查 Storage Service 健康状态
curl -f http://localhost:8081/api/sessions && echo "✓ Storage Service 正常"

# 检查 Redis 连接
docker exec interview-redis redis-cli ping

# 查看 Storage Service 日志
docker logs interview-storage-service

# 检查容器详细信息
docker inspect interview-storage-service
```

## 独立部署 (仅 Storage Service)

如果您只想部署 Storage Service，使用专门的配置:

```bash
cd storage-service

# 构建镜像
docker build -f Dockerfile.prod -t interview-system/storage-service:latest .

# 使用专门的 docker-compose 启动
docker-compose -f docker-compose-prod.yml up -d

# 验证
curl -f http://localhost:8081/api/sessions
```

## 配置说明

### storage-service 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `SERVER_PORT` | 8081 | 应用服务端口 |
| `SPRING_PROFILES_ACTIVE` | prod | Spring 活跃配置文件 |
| `JAVA_OPTS` | 见下 | JVM 启动参数 |
| `SPRING_REDIS_HOST` | interview-redis | Redis 主机 |
| `SPRING_REDIS_PORT` | 6379 | Redis 端口 |
| `SPRING_REDIS_PASSWORD` | (空) | Redis 密码 |
| `SPRING_REDIS_DATABASE` | 0 | Redis 数据库编号 |
| `SESSION_STORAGE_API_KEY` | ak_live_... | API 密钥 |
| `TZ` | Asia/Shanghai | 时区设置 |

### JVM 启动参数 (JAVA_OPTS)

```
-Xms256m -Xmx512m          # 堆内存: 初始256MB, 最大512MB
-XX:+UseG1GC               # 使用 G1 垃圾回收器
-XX:MaxGCPauseMillis=200   # 最大 GC 暂停时间 200ms
-XX:+ParallelRefProcEnabled # 并行引用处理
```

### Spring 配置优化

查看 `application-prod.properties`:
- Redis 连接池优化 (20 最大连接, 5 最小连接)
- 日志级别配置 (INFO/WARN)
- Jackson 序列化配置
- Tomcat 线程池配置

## 常见问题

### Q: Storage Service 无法连接 Redis

**A:** 检查以下内容:

```bash
# 1. 验证 Redis 容器是否运行
docker ps | grep redis

# 2. 检查 Redis 健康状态
docker-compose exec redis redis-cli ping

# 3. 验证网络连接
docker-compose exec storage-service curl -f http://interview-redis:6379

# 4. 检查环境变量
docker inspect interview-storage-service | grep REDIS
```

### Q: 容器启动很慢

**A:** 这是正常的，Java 应用启动需要时间:

```bash
# 查看详细启动日志
docker logs -f interview-storage-service

# 查看健康检查状态
docker ps -a | grep storage

# 等待至少 40 秒后再进行请求
```

### Q: 端口被占用

**A:** 修改 `.env.prod` 中的端口配置，或停止占用端口的服务:

```bash
# 查找占用 8081 端口的进程
netstat -ano | findstr :8081  # Windows
lsof -i :8081                 # Linux/Mac

# 修改 docker-compose.yml 中的端口映射
ports:
  - "8081:8081"  # 改为其他端口，如 8082:8081
```

### Q: 如何查看 Storage Service 日志

**A:**

```bash
# 实时日志
docker logs -f interview-storage-service

# 查看最后 100 行
docker logs --tail 100 interview-storage-service

# 查看容器内日志文件
docker exec interview-storage-service tail -f /app/logs/storage-service.log
```

## 生产环境最佳实践

### 1. 安全配置

```bash
# 修改 Redis 密码
REDIS_PASSWORD=your_strong_password_here

# 修改 API Key
SESSION_STORAGE_API_KEY=ak_live_generate_new_key

# 启用 SSL/TLS (生产环境推荐)
# 更新 nginx 反向代理配置
```

### 2. 性能优化

```yaml
# 增加 JVM 内存 (根据实际情况)
JAVA_OPTS: "-Xms512m -Xmx1024m -XX:+UseG1GC"

# 增加 Redis 连接池
SPRING_REDIS_LETTUCE_POOL_MAX_ACTIVE: "30"
```

### 3. 监控和日志

```bash
# 配置日志级别为 INFO (生产环境)
LOGGING_LEVEL_COM_EXAMPLE_INTERVIEWSTORAGE: INFO

# 配置日志轮转
# 默认: 最大 100MB, 保留 5 个文件

# 监控容器资源使用
docker stats interview-storage-service
```

### 4. 备份策略

```bash
# 定期备份 Redis 数据
docker exec interview-redis redis-cli BGSAVE

# 备份存储数据
tar -czf storage-backup-$(date +%Y%m%d).tar.gz data/storage/

# 备份日志
tar -czf storage-logs-$(date +%Y%m%d).tar.gz logs/storage/
```

## 故障排查

### 启动失败检查列表

1. ✓ 检查磁盘空间: `df -h`
2. ✓ 检查内存: `free -h` 或 Windows 任务管理器
3. ✓ 检查 Docker 状态: `docker ps`
4. ✓ 检查网络: `docker network ls`
5. ✓ 查看详细日志: `docker logs interview-storage-service`

### 重新启动服务

```bash
# 重启 Storage Service
docker-compose restart storage-service

# 完整重启 (所有服务)
docker-compose down
docker-compose up -d

# 强制重建
docker-compose up -d --force-recreate
```

## 升级指南

### 升级 Storage Service

```bash
# 1. 停止旧容器
docker-compose stop storage-service

# 2. 备份数据
cp -r data/storage data/storage.bak

# 3. 重建镜像
docker-compose build --no-cache storage-service

# 4. 启动新容器
docker-compose up -d storage-service

# 5. 验证
docker logs -f interview-storage-service
```

## 卸载

```bash
# 停止所有容器
docker-compose down

# 移除所有镜像
docker-compose down --rmi all

# 删除数据卷 (谨慎操作!)
docker volume prune
```

## 支持和反馈

如遇到问题，请检查:
1. 系统日志: `docker logs <container-name>`
2. 应用日志: `logs/storage/storage-service.log`
3. Docker 事件: `docker events --filter type=container`

---

**最后更新**: 2025-10-27
**版本**: 1.0.0
**作者**: Interview System Team
