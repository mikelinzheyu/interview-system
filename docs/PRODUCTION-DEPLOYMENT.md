# AI面试系统 - 生产环境部署指南

## 概述

本文档描述如何在生产环境中使用Docker部署完整的AI面试系统，包括：
- 前端服务 (Vue.js + Nginx)
- 后端服务 (Node.js Mock API)
- 存储服务 (Spring Boot + Redis)
- Redis缓存

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                   Nginx Proxy                       │
│                  (可选, with-proxy)                 │
│                   Port 80/443                       │
└───────────────────┬─────────────────────────────────┘
                    │
      ┌─────────────┼─────────────┬───────────────┐
      │             │             │               │
┌─────▼─────┐ ┌────▼────┐  ┌─────▼──────┐  ┌────▼────┐
│  Frontend │ │ Backend │  │  Storage   │  │  Redis  │
│   (Vue)   │ │(Node.js)│  │   API      │  │         │
│ Port: 80  │ │Port:3001│  │(Spring Boot│  │Port:6379│
│           │ │         │  │Port: 8090) │  │         │
└───────────┘ └────┬────┘  └─────┬──────┘  └────┬────┘
                   │             │              │
                   └─────────────┴──────────────┘
                          Redis Connection
```

## 快速开始

### 前置条件

1. **安装Docker和Docker Compose**
   - Docker 20.10+
   - Docker Compose 2.0+

2. **系统要求**
   - CPU: 2核以上
   - 内存: 4GB以上
   - 磁盘: 20GB以上可用空间

3. **网络要求**
   - 开放端口: 80 (前端), 3001 (后端), 8090 (存储API), 6379 (Redis)

### 部署步骤

#### 1. 克隆项目
```bash
git clone https://github.com/mikelinzheyu/interview-systerm.git
cd interview-systerm
```

#### 2. 配置环境变量
```bash
cd production
cp .env.example .env.production
```

编辑 `.env.production` 并设置以下必需的配置：
```bash
# Redis密码 (必须修改)
REDIS_PASSWORD=your_strong_password_here

# 存储API密钥 (必须修改)
STORAGE_API_KEY=your_32_character_api_key_here
```

#### 3. 一键部署

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```bash
deploy.bat
```

#### 4. 验证部署
部署完成后，访问以下地址验证：
- 前端: http://localhost
- 后端API: http://localhost:3001/api/health
- 存储API: http://localhost:8090/actuator/health

## 详细配置

### 环境变量说明

| 变量名 | 默认值 | 说明 | 必须修改 |
|--------|--------|------|----------|
| REDIS_PORT | 6379 | Redis端口 | ❌ |
| REDIS_PASSWORD | - | Redis密码 | ✅ |
| STORAGE_API_PORT | 8090 | 存储API端口 | ❌ |
| STORAGE_API_KEY | - | 存储API密钥 | ✅ |
| BACKEND_PORT | 3001 | 后端端口 | ❌ |
| FRONTEND_PORT | 80 | 前端HTTP端口 | ❌ |
| FRONTEND_HTTPS_PORT | 443 | 前端HTTPS端口 | ❌ |
| VITE_API_BASE_URL | /api | API基础URL | ❌ |
| TZ | Asia/Shanghai | 时区 | ❌ |
| LOG_LEVEL | INFO | 日志级别 | ❌ |

### 服务配置

#### Redis配置
```yaml
redis:
  image: redis:7-alpine
  command: >
    redis-server
    --appendonly yes
    --requirepass ${REDIS_PASSWORD}
    --maxmemory 512mb
    --maxmemory-policy allkeys-lru
```

#### 存储API配置
```yaml
storage-api:
  build: ../storage-service
  environment:
    API_KEY: ${STORAGE_API_KEY}
    spring.data.redis.host: redis
    spring.data.redis.password: ${REDIS_PASSWORD}
  ports:
    - "8090:8080"
```

## 管理命令

### 查看服务状态
```bash
cd production
docker-compose -f docker-compose.production.yml ps
```

### 查看日志
```bash
# 查看所有日志
docker-compose -f docker-compose.production.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.production.yml logs -f frontend
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f storage-api
docker-compose -f docker-compose.production.yml logs -f redis
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.production.yml restart

# 重启特定服务
docker-compose -f docker-compose.production.yml restart backend
```

### 停止服务
```bash
docker-compose -f docker-compose.production.yml down
```

### 停止并清除数据
```bash
docker-compose -f docker-compose.production.yml down -v
```

### 更新服务
```bash
# 拉取最新代码
git pull

# 重新构建并启动
cd production
docker-compose -f docker-compose.production.yml up -d --build
```

## 高级配置

### 启用Nginx反向代理

如果需要使用统一的反向代理（支持SSL、负载均衡等），可以启用nginx-proxy服务：

```bash
docker-compose -f docker-compose.production.yml --profile with-proxy up -d
```

需要配置以下文件：
- `production/nginx/proxy.conf` - Nginx配置
- `production/nginx/ssl/` - SSL证书目录

### 配置SSL证书

1. 将SSL证书放入 `production/nginx/ssl/` 目录：
   - `cert.pem` - 证书文件
   - `key.pem` - 私钥文件

2. 修改 `production/nginx/proxy.conf` 配置SSL

3. 重启服务：
```bash
docker-compose -f docker-compose.production.yml restart nginx-proxy
```

### 数据备份

#### 备份Redis数据
```bash
# 创建备份目录
mkdir -p backup/redis

# 备份Redis数据
docker-compose -f docker-compose.production.yml exec redis redis-cli --raw SAVE
docker cp interview-redis:/data/dump.rdb backup/redis/dump-$(date +%Y%m%d).rdb
```

#### 恢复Redis数据
```bash
# 停止Redis
docker-compose -f docker-compose.production.yml stop redis

# 复制备份文件
docker cp backup/redis/dump-YYYYMMDD.rdb interview-redis:/data/dump.rdb

# 启动Redis
docker-compose -f docker-compose.production.yml start redis
```

## 监控和日志

### 查看资源使用
```bash
docker stats interview-frontend interview-backend interview-storage-api interview-redis
```

### 日志文件位置
- 前端日志: `production/logs/nginx/`
- 后端日志: `production/logs/backend/`
- 存储API日志: `production/logs/storage-api/`
- Redis日志: `production/logs/redis/`

### 设置日志轮转

创建 `production/logrotate.conf`:
```
/path/to/production/logs/*/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
```

## 故障排查

### 问题1: 服务无法启动

**检查Docker状态:**
```bash
docker info
```

**查看服务日志:**
```bash
docker-compose -f docker-compose.production.yml logs
```

**检查端口占用:**
```bash
# Linux/Mac
lsof -i :80
lsof -i :3001
lsof -i :8090

# Windows
netstat -ano | findstr :80
netstat -ano | findstr :3001
netstat -ano | findstr :8090
```

### 问题2: Redis连接失败

**检查Redis状态:**
```bash
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

**检查密码配置:**
确保 `.env.production` 中的 `REDIS_PASSWORD` 正确设置

### 问题3: 存储API无法访问

**检查健康状态:**
```bash
curl http://localhost:8090/actuator/health
```

**查看API日志:**
```bash
docker-compose -f docker-compose.production.yml logs storage-api
```

### 问题4: 前端无法访问后端

**检查网络连接:**
```bash
docker network inspect production_interview-network
```

**验证API配置:**
检查前端环境变量 `VITE_API_BASE_URL` 是否正确

## 安全最佳实践

### 1. 修改默认密码
- Redis密码
- 存储API密钥
- 所有默认凭证

### 2. 使用HTTPS
- 配置SSL证书
- 强制HTTPS跳转
- 启用HSTS

### 3. 限制端口访问
- 只开放必要的端口
- 使用防火墙规则
- 配置安全组

### 4. 定期更新
- 更新Docker镜像
- 更新依赖包
- 应用安全补丁

### 5. 监控和日志
- 设置日志级别
- 启用审计日志
- 配置告警

## 性能优化

### 1. Redis优化
```yaml
# 增加内存限制
--maxmemory 1024mb

# 调整LRU策略
--maxmemory-policy allkeys-lru
```

### 2. Nginx优化
```nginx
# 启用gzip压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 设置缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
}
```

### 3. 容器资源限制
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

## 扩展部署

### 多实例部署
```bash
# 扩展后端服务到3个实例
docker-compose -f docker-compose.production.yml up -d --scale backend=3
```

### 负载均衡
配置Nginx upstream:
```nginx
upstream backend {
    server backend:3001;
    server backend:3001;
    server backend:3001;
}
```

## 常见问题

**Q: 如何更改端口?**
A: 修改 `.env.production` 中的端口配置，然后重启服务。

**Q: 如何查看容器内部?**
A: 使用 `docker-compose -f docker-compose.production.yml exec <service> sh` 进入容器。

**Q: 如何清理未使用的镜像?**
A: 运行 `docker system prune -a` 清理所有未使用的镜像。

**Q: 如何设置自动启动?**
A: 服务配置中已包含 `restart: always`，Docker重启时会自动启动服务。

## 支持

如遇到问题，请：
1. 查看本文档的故障排查章节
2. 查看项目Issues: https://github.com/mikelinzheyu/interview-systerm/issues
3. 查看服务日志获取详细错误信息

## 版本历史

- v1.0.0 (2025-10-11) - 初始生产环境配置
  - Docker全容器化部署
  - 集成Redis存储服务
  - 完整的部署脚本和文档

---

**部署完成后，请确保:**
✅ 修改所有默认密码
✅ 配置SSL证书
✅ 设置防火墙规则
✅ 配置数据备份
✅ 启用监控告警
