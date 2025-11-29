# AI面试系统 - Docker生产部署总结

**部署日期**: 2025-11-29
**部署状态**: ✅ **成功**
**环境**: Docker容器化生产环境

---

## 📋 部署概览

已在全Docker生产环境中成功部署AI面试系统，包含以下核心服务：

| 服务 | 镜像 | 状态 | 端口 | 说明 |
|------|------|------|------|------|
| **Frontend** | production-frontend | ✅ Healthy | 80 | Vue.js + Nginx Web应用 |
| **Backend (Node.js)** | production-backend | ✅ Healthy | 3001 | Express API + WebSocket |
| **MySQL** | mysql:8.0 | ✅ Healthy | 3307 | 数据库服务 |
| **Redis** | redis:7-alpine | ✅ Healthy | 6380 | 缓存和会话存储 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    生产网络 (interview-network)         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   Frontend       │      │    Backend       │        │
│  │  (Nginx:80)      │◄────►│  (Express:3001)  │        │
│  │                  │      │   + WebSocket    │        │
│  └──────────────────┘      └──────────────────┘        │
│           │                          │                  │
│           ▼                          ▼                  │
│  ┌──────────────────────────────────────────┐          │
│  │          共享Redis缓存 (6380)              │          │
│  └──────────────────────────────────────────┘          │
│           │                          │                  │
│           ▼                          ▼                  │
│  ┌──────────────────────────────────────────┐          │
│  │        MySQL数据库 (3307)                 │          │
│  │    - interview_system DB                 │          │
│  │    - 用户表、会话表、对话表               │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 部署目录结构

```
production/
├── docker-compose.simple.yml          # 简化生产配置（当前使用）
├── docker-compose.production.yml      # 完整生产配置（支持Java后端）
├── .env                               # 生产环境变量
├── init-db.sql                        # 数据库初始化脚本
├── nginx/                             # Nginx配置
│   └── nginx.conf                     # 反向代理配置
├── logs/                              # 服务日志目录
│   ├── mysql/                         # MySQL日志
│   ├── redis/                         # Redis日志
│   ├── backend/                       # 后端日志
│   └── nginx/                         # Nginx日志
├── uploads/                           # 文件上传存储
├── data/                              # 数据卷存储
└── mysql/                             # MySQL数据目录
```

---

## 🚀 快速启动/停止命令

### 启动所有服务
```bash
cd production
docker-compose -f docker-compose.simple.yml up -d
```

### 查看容器状态
```bash
docker-compose -f docker-compose.simple.yml ps
```

### 查看实时日志
```bash
# 所有服务
docker-compose -f docker-compose.simple.yml logs -f

# 特定服务
docker-compose -f docker-compose.simple.yml logs -f backend
docker-compose -f docker-compose.simple.yml logs -f frontend
docker-compose -f docker-compose.simple.yml logs -f mysql
```

### 停止所有服务
```bash
docker-compose -f docker-compose.simple.yml down
```

### 重启特定服务
```bash
docker-compose -f docker-compose.simple.yml restart backend
```

---

## 🔍 服务验证

### 前端应用
- **URL**: http://localhost/
- **健康检查**: `curl http://localhost/`
- **预期响应**: HTTP 200

### Node.js后端 API
- **Base URL**: http://localhost:3001/api
- **健康检查**: `curl http://localhost:3001/api/health`
- **预期响应**: HTTP 200 + JSON健康状态

### 数据库连接
```bash
# MySQL
docker exec interview-mysql mysql -u interview_user -p interview_system
# 密码: Interview2025!UserP@ssw0rd#MySQL

# Redis CLI
docker exec -it interview-redis redis-cli -a Redis2025!SecureP@ssw0rd#Interview
```

---

## 📊 配置详情

### MySQL配置
```
HOST: interview-mysql (Docker网络内)
PORT: 3307 (主机访问)
Database: interview_system
User: interview_user
Password: Interview2025!UserP@ssw0rd#MySQL
Root Password: MySQL2025!SecureRootP@ssw0rd#Interview
```

### Redis配置
```
HOST: interview-redis (Docker网络内)
PORT: 6380 (主机访问)
Password: Redis2025!SecureP@ssw0rd#Interview
Max Memory: 512MB
Eviction Policy: allkeys-lru
```

### Node.js后端
```
PORT: 3001
Environment: production
Node Version: 18-alpine
Memory Limit: 设置在构建时
```

### Nginx前端
```
Port: 80 (HTTP)
Base Image: nginx:1.27-alpine
SSL: 需要手动配置
```

---

## 🔐 安全建议

1. **修改默认密码**（重要！）
   - ✓ 已更改MySQL密码
   - ✓ 已更改Redis密码
   - ✓ 已设置JWT密钥
   - 修改位置: `production/.env`

2. **防火墙配置**
   ```bash
   # 仅允许内部访问某些端口
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS (如果配置)
   sudo ufw deny 3307/tcp   # MySQL
   sudo ufw deny 6380/tcp   # Redis
   ```

3. **HTTPS配置**
   - 当前: HTTP only
   - 建议: 使用Let's Encrypt配置HTTPS
   - 参考: `nginx/nginx.conf` 中的HTTPS注释部分

4. **备份策略**
   ```bash
   # MySQL备份
   docker exec interview-mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} interview_system > backup.sql

   # Redis备份
   docker exec interview-redis redis-cli -a ${REDIS_PASSWORD} BGSAVE
   docker cp interview-redis:/data/dump.rdb ./redis_backup.rdb
   ```

---

## 📈 性能优化

### 资源限制建议
在`docker-compose.simple.yml`中添加资源限制：
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
```

### 缓存配置
- Redis: 512MB内存限制，LRU驱逐策略
- MySQL: Buffer pool 256MB
- Node.js: 1.5GB max heap size

---

## 🐛 常见问题排查

### 1. 容器启动失败
```bash
# 查看具体错误日志
docker-compose -f docker-compose.simple.yml logs backend
docker-compose -f docker-compose.simple.yml logs mysql

# 重建容器
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.simple.yml up -d --build
```

### 2. 数据库连接错误
```bash
# 验证MySQL状态
docker exec interview-mysql mysqladmin ping -u root -p${MYSQL_ROOT_PASSWORD}

# 检查MySQL日志
docker-compose -f docker-compose.simple.yml logs mysql
```

### 3. 前端无法访问后端API
```bash
# 验证后端健康状态
curl http://localhost:3001/api/health

# 检查Nginx配置
docker exec interview-frontend cat /etc/nginx/conf.d/default.conf

# 查看Nginx日志
docker-compose -f docker-compose.simple.yml logs frontend
```

### 4. Redis连接失败
```bash
# 测试Redis连接
docker exec interview-redis redis-cli -a Redis2025!SecureP@ssw0rd#Interview ping

# 查看Redis日志
docker-compose -f docker-compose.simple.yml logs redis
```

---

## 🔄 升级到完整部署 (Java后端)

当解决镜像源问题后，可升级到完整的生产部署：

```bash
# 使用完整配置
docker-compose -f docker-compose.production.yml up -d --build

# 包含服务:
# - MySQL 数据库
# - Redis 缓存
# - Storage API (存储服务)
# - Backend Java (Spring Boot)
# - Backend Node (Express)
# - Frontend (Nginx)
```

---

## 📝 日志管理

### 日志位置
```
logs/
├── mysql/          # MySQL slow query logs
├── redis/          # Redis logs
├── backend/        # Node.js应用日志
└── nginx/          # Nginx access/error logs
```

### 日志轮转配置
所有服务配置了日志轮转：
- Max size: 10MB per file
- Max files: 3 files per service
- Driver: json-file

### 查看日志
```bash
# 实时查看
docker-compose -f docker-compose.simple.yml logs -f --tail=100

# 查看特定服务
docker-compose -f docker-compose.simple.yml logs -f backend --tail=50

# 保存日志到文件
docker-compose -f docker-compose.simple.yml logs > deployment.log
```

---

## 🔗 相关文档

- [Docker部署指南](./DOCKER_PRODUCTION_DEPLOYMENT.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
- [故障排除指南](./DOCKER-TROUBLESHOOTING.md)
- [Nginx配置](./nginx/nginx.conf)

---

## 📞 支持信息

- **Docker文档**: https://docs.docker.com/
- **Docker Compose文档**: https://docs.docker.com/compose/
- **项目Repository**: 查看项目README.md

---

**最后更新**: 2025-11-29 15:44 UTC+8
**部署工具**: Claude Code + Docker
