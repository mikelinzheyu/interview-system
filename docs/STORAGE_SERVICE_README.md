# 🚀 Storage Service 生产部署完整指南

## 📌 快速导航

| 需求 | 文档 |
|------|------|
| **快速启动** | [5分钟快速指南](./STORAGE_SERVICE_QUICK_REF.md) |
| **详细部署** | [完整部署指南](./STORAGE_SERVICE_DEPLOYMENT_GUIDE.md) |
| **部署概览** | [最终总结](./STORAGE_SERVICE_FINAL_SUMMARY.md) |
| **配置模板** | [.env.prod.example](./.env.prod.example) |

## 🎯 项目概述

### 什么是 Storage Service?

**Storage Service** 是基于 Java Spring Boot 的独立微服务，用于:
- 存储和管理工作流会话数据
- 提供 RESTful API 接口
- 与 Redis 集成实现高性能缓存
- 支持分布式部署和高可用

### 系统架构

```
┌──────────────────────────────────────────────┐
│           Interview System (Docker)           │
├──────────────────────────────────────────────┤
│                                               │
│  Frontend    Backend    ↔  Storage Service   │
│  (Nginx)     (Node.js)       (Java Spring)   │
│  :80         :3001           :8081           │
│    ↓           ↓               ↓             │
│    └───────────┴───────────────┘             │
│                 ↓                             │
│            Redis Cache                       │
│            :6379                             │
│                                               │
└──────────────────────────────────────────────┘
```

## ✨ 新增特性

### 1. 优化的 Dockerfile

```dockerfile
# 多阶段构建
FROM maven:3.8-openjdk-17-alpine AS builder  # 编译阶段
FROM openjdk:17-jdk-alpine                   # 运行阶段

# 特点:
✓ 使用 Alpine Linux (小巧、安全)
✓ 多阶段构建 (减小镜像大小)
✓ 非 root 用户运行 (安全最佳实践)
✓ JVM G1GC 优化 (低延迟垃圾回收)
✓ 健康检查配置
```

### 2. 生产级配置

**application-prod.properties** 包含:
- Redis 连接池优化 (20 max, 5 min)
- Tomcat 线程池配置 (200 max)
- 日志级别和轮转
- Jackson 序列化优化
- 时区和地域配置

### 3. Docker Compose 集成

Storage Service 已完全集成到主 docker-compose.yml:
```yaml
services:
  storage-service:
    build:
      context: ./storage-service
      dockerfile: Dockerfile.prod
    image: interview-system/storage-service:latest
    container_name: interview-storage-service
    # ... 完整配置
```

### 4. 部署脚本

**两个平台的部署脚本:**
- `deploy-storage-service.ps1` (Windows PowerShell)
- `deploy-storage-service.sh` (Linux/Mac Bash)

**支持的操作:**
```bash
build      # 构建镜像
start      # 启动服务
stop       # 停止服务
restart    # 重启服务
logs       # 查看日志
status     # 查看状态
health     # 健康检查
rebuild    # 完全重建
```

## 🚀 快速启动 (3步)

### 第一步: 准备环境

```bash
# 创建必要目录
mkdir -p logs/storage data/storage
```

### 第二步: 配置环境变量

```bash
# 复制模板
cp .env.prod.example .env.prod

# 编辑配置 (修改关键信息)
# - REDIS_PASSWORD
# - SESSION_STORAGE_API_KEY
# - DIFY_API_KEY
```

### 第三步: 启动

```bash
# Windows
.\deploy-storage-service.ps1 -Action start

# Linux/Mac
./deploy-storage-service.sh start
```

## 📊 性能指标

| 指标 | 值 | 说明 |
|------|-----|------|
| 启动时间 | 30-40s | Java 应用启动时间 |
| 内存占用 | 256-512MB | 取决于配置 |
| 响应时间 | <100ms | 缓存命中情况 |
| 并发连接 | 200+ | Tomcat 线程池 |
| Redis 连接 | 20+ | 连接池大小 |

## 🔧 配置说明

### 环境变量

**核心配置:**
```env
# Redis 连接
REDIS_HOST=interview-redis
REDIS_PORT=6379
REDIS_PASSWORD=your_password        # ⚠️ 必须修改

# API 密钥
SESSION_STORAGE_API_KEY=ak_live_... # ⚠️ 必须修改

# 应用配置
SERVER_PORT=8081
SPRING_PROFILES_ACTIVE=prod
TZ=Asia/Shanghai
```

**JVM 优化:**
```env
JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
```

### Docker Compose 端口映射

```yaml
ports:
  - "${STORAGE_PORT:-8081}:8081"
```

可通过 `.env.prod` 修改端口:
```env
STORAGE_PORT=8081
```

## 📋 文件清单

**新创建/修改的文件:**

```
interview-system/
├── 📄 STORAGE_SERVICE_README.md              ← 本文档
├── 📄 STORAGE_SERVICE_DEPLOYMENT_GUIDE.md   ← 详细指南
├── 📄 STORAGE_SERVICE_QUICK_REF.md          ← 快速参考
├── 📄 STORAGE_SERVICE_FINAL_SUMMARY.md      ← 部署总结
├── 📄 .env.prod.example                     ← 环境变量模板
├── 🔧 deploy-storage-service.ps1            ← Windows 脚本
├── 🔧 deploy-storage-service.sh             ← Linux 脚本
├── 🔧 verify-storage-deployment.sh          ← 验证脚本
│
├── ✏️ docker-compose.yml                    ← 已更新
│
└── storage-service/
    ├── ✏️ Dockerfile.prod                   ← 已优化
    └── 📄 src/main/resources/
        └── 📄 application-prod.properties   ← 新增
```

## ✅ 验证部署

### 快速验证

```bash
# 检查容器状态
docker-compose ps

# 测试 API
curl http://localhost:8081/api/sessions

# 查看日志
docker logs interview-storage-service
```

### 完整验证

```bash
# 运行验证脚本
./verify-storage-deployment.sh

# 执行健康检查
.\deploy-storage-service.ps1 -Action health  # Windows
./deploy-storage-service.sh health            # Linux
```

## 🛡️ 安全建议

### 生产环境必须

1. **修改密钥**
   ```env
   SESSION_STORAGE_API_KEY=ak_live_your_secure_key
   REDIS_PASSWORD=your_strong_password
   DIFY_API_KEY=your_actual_key
   ```

2. **启用 HTTPS**
   - 配置 Nginx SSL 证书
   - 更新 docker-compose.yml

3. **限制访问**
   - 防火墙规则
   - 只开放必要端口

4. **定期备份**
   ```bash
   docker exec interview-redis redis-cli BGSAVE
   ```

### 推荐实践

- [ ] 不要在 git 中提交 `.env.prod`
- [ ] 定期轮换 API 密钥
- [ ] 启用访问日志
- [ ] 配置监控告警
- [ ] 定期更新依赖

## 📈 性能优化

### 根据规模调整

**开发环境:**
```env
JAVA_OPTS="-Xms128m -Xmx256m"
```

**小型生产 (<100 QPS):**
```env
JAVA_OPTS="-Xms256m -Xmx512m"
```

**中型生产 (100-500 QPS):**
```env
JAVA_OPTS="-Xms512m -Xmx1024m"
SPRING_REDIS_LETTUCE_POOL_MAX_ACTIVE=25
```

**大型生产 (>500 QPS):**
```env
JAVA_OPTS="-Xms1024m -Xmx2048m"
SPRING_REDIS_LETTUCE_POOL_MAX_ACTIVE=30
```

## 🔍 常见问题

### Q: 容器启动失败？

```bash
# 查看详细日志
docker logs -f interview-storage-service

# 检查 Redis 连接
docker exec interview-redis redis-cli ping

# 检查环境变量
docker inspect interview-storage-service | grep REDIS
```

### Q: 如何修改端口？

编辑 `.env.prod`:
```env
STORAGE_PORT=9081  # 改为其他端口
```

### Q: 日志文件在哪里？

- 容器内: `/app/logs/storage-service.log`
- 主机: `./logs/storage/storage-service.log`

### Q: 如何备份数据？

```bash
# 备份 Redis
docker exec interview-redis redis-cli BGSAVE

# 备份应用数据
tar -czf backup-$(date +%Y%m%d).tar.gz data/storage/
```

## 📞 支持资源

- 📖 [Docker 官方文档](https://docs.docker.com/)
- 🍃 [Spring Boot 文档](https://spring.io/projects/spring-boot)
- 🔴 [Redis 文档](https://redis.io/docs/)
- 👨‍💼 [项目维护团队](mailto:support@example.com)

## 🎓 学习路径

1. **入门** → 快速启动指南
2. **深入** → 完整部署指南
3. **优化** → 最终总结中的性能优化章节
4. **运维** → 监控告警和备份策略

## 📝 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2025-10-27 | 初始发布 |

## 🤝 贡献

欢迎提交改进建议和 Bug 报告！

---

**准备好开始了吗？**

👉 [快速启动指南](./STORAGE_SERVICE_QUICK_REF.md)

或者

👉 运行: `.\deploy-storage-service.ps1` (Windows) / `./deploy-storage-service.sh` (Linux)

祝您部署顺利！🎉
