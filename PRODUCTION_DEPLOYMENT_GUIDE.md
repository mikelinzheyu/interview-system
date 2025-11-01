# AI面试系统 - 生产环境全Docker部署指南

## 📋 目录

1. [快速开始](#快速开始)
2. [前置条件](#前置条件)
3. [部署架构](#部署架构)
4. [详细部署步骤](#详细部署步骤)
5. [配置指南](#配置指南)
6. [监控和日志](#监控和日志)
7. [备份和恢复](#备份和恢复)
8. [故障排查](#故障排查)
9. [安全最佳实践](#安全最佳实践)
10. [性能优化](#性能优化)

---

## 快速开始

### Linux/Mac (使用Bash脚本)

```bash
# 1. 确保有执行权限
chmod +x deploy-prod.sh

# 2. 运行部署脚本
./deploy-prod.sh

# 3. 等待部署完成
# 脚本会自动：
# - 检查前置条件
# - 创建必要目录
# - 备份现有数据
# - 构建镜像
# - 启动容器
# - 验证服务
```

### Windows (使用Batch脚本)

```batch
# 1. 右键单击 deploy-prod.bat
# 2. 选择 "以管理员身份运行"
# 或在命令行执行：
deploy-prod.bat
```

### 手动部署

```bash
# 1. 进入项目目录
cd /path/to/interview-system

# 2. 复制环境配置（如果还没有）
cp .env.docker.example .env.docker

# 3. 编辑环境变量
# 修改 .env.docker 中的敏感信息

# 4. 创建必要的目录
mkdir -p logs/{backend,frontend,redis,proxy}
mkdir -p data/{redis,uploads}

# 5. 启动Docker服务
docker-compose up -d

# 6. 验证服务
docker-compose ps
docker-compose logs -f
```

---

## 前置条件

### 系统要求

- **操作系统**: Linux, macOS, 或 Windows 10/11 (with WSL2)
- **Docker**: v20.10.0 或更高
- **Docker Compose**: v2.0.0 或更高
- **磁盘空间**: 至少 10GB
- **内存**: 建议 4GB 或以上
- **网络**: 能访问 Docker Hub 和 Dify API

### 软件安装

#### Docker 安装

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 设置稳定版仓库
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 添加当前用户到docker组
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker-compose --version
```

**CentOS/RHEL:**
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

**macOS:**
```bash
# 使用Homebrew
brew install docker docker-compose

# 或下载 Docker Desktop for Mac
# https://www.docker.com/products/docker-desktop
```

**Windows:**
- 下载 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- 安装并启用 WSL2 后端

### 验证安装

```bash
# 检查Docker
docker --version
docker run hello-world

# 检查Docker Compose
docker-compose --version

# 检查网络连接
curl -I https://api.dify.ai
```

---

## 部署架构

### 容器组成

```
┌─────────────────────────────────────────────────────┐
│                   生产环境架构                        │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │        Nginx 反向代理 (可选)                   │   │
│  │  - SSL/TLS 终止                              │   │
│  │  - 负载均衡                                  │   │
│  │  - 日志记录                                  │   │
│  └─────────────────────────────────────────────┘   │
│                      ↓                              │
│  ┌───────────────────────────────────────────────┐ │
│  │          Docker Network (Bridge)               │ │
│  │                                                │ │
│  │  ┌──────────────┐  ┌──────────────────────┐  │ │
│  │  │   Frontend   │  │   Backend API        │  │ │
│  │  │   (Nginx)    │  │   (Node.js)          │  │ │
│  │  │              │  │                      │  │ │
│  │  │  - 页面服务  │  │  - Mock API          │  │ │
│  │  │  - 静态文件  │  │  - WebSocket         │  │ │
│  │  │  - 反向代理  │  │  - 业务逻辑          │  │ │
│  │  │              │  │  - 数据处理          │  │ │
│  │  └──────────────┘  └──────────────────────┘  │ │
│  │         ↓                    ↓                │ │
│  │  ┌──────────────────────────────────┐        │ │
│  │  │         Redis Cache              │        │ │
│  │  │  - 会话存储                       │        │ │
│  │  │  - 缓存数据                       │        │ │
│  │  │  - 消息队列                       │        │ │
│  │  └──────────────────────────────────┘        │ │
│  │                                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │            数据卷 (Volumes)                   │  │
│  │  - data/redis (Redis 持久化数据)             │  │
│  │  - data/uploads (用户上传文件)               │  │
│  │  - logs/* (应用日志)                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 网络拓扑

```
┌─────────────────────────────────────────┐
│          互联网 / 用户                    │
└────────────────┬────────────────────────┘
                 │
         [80/443] 端口
                 │
        ┌────────▼────────┐
        │  Nginx 代理    │
        │ (可选)         │
        └────────┬────────┘
                 │
        [Docker Bridge Network]
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼──┐  ┌─────▼──┐  ┌─────▼───┐
│前端  │  │后端API │  │ Redis  │
│:80  │  │:3001  │  │:6379   │
└──────┘  └────────┘  └────────┘
```

---

## 详细部署步骤

### 步骤 1: 环境准备

```bash
# 创建项目目录
mkdir -p /opt/interview-system
cd /opt/interview-system

# 克隆或拷贝项目文件
git clone <your-repo-url> .
# 或
cp -r /path/to/local/project .

# 验证必要文件存在
ls -la docker-compose.yml
ls -la .env.docker
ls -la backend/Dockerfile
ls -la frontend/Dockerfile
```

### 步骤 2: 环境配置

```bash
# 编辑环境配置文件
nano .env.docker

# 关键配置项（必须修改）：
# 1. DIFY_API_KEY: 替换为实际的Dify API密钥
# 2. DIFY_API_BASE_URL: 确认Dify API地址
# 3. JWT_SECRET: 修改为强密钥
# 4. FRONTEND_PORT: 前端端口（默认80）
# 5. BACKEND_PORT: 后端端口（默认8080）
```

### 步骤 3: 创建必要目录和文件

```bash
# 创建日志目录
mkdir -p logs/{backend,frontend,redis,proxy}

# 创建数据目录
mkdir -p data/{redis,uploads}

# 创建nginx配置目录
mkdir -p nginx/ssl

# 设置权限
chmod -R 755 logs/
chmod -R 755 data/
```

### 步骤 4: SSL证书配置（可选但推荐）

```bash
# 生成自签名证书（用于测试）
cd nginx/ssl
openssl req -x509 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Interview/CN=localhost"
cd ../..

# 或使用Let's Encrypt（推荐用于生产）
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com
# 复制证书到 nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

### 步骤 5: 构建并启动容器

```bash
# 方式1: 使用部署脚本（推荐）
chmod +x deploy-prod.sh
./deploy-prod.sh

# 方式2: 手动操作
# 1. 停止现有容器
docker-compose down

# 2. 构建镜像
docker-compose build --no-cache

# 3. 启动容器
docker-compose up -d

# 4. 验证容器状态
docker-compose ps
```

### 步骤 6: 验证部署

```bash
# 检查容器运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试前端服务
curl http://localhost:80

# 测试后端API
curl http://localhost:8080/api/health

# 测试Redis
docker-compose exec redis redis-cli ping
```

---

## 配置指南

### 环境变量详解

```env
# 应用信息
APP_NAME=AI面试系统                    # 应用名称
APP_VERSION=1.0.0                      # 版本
APP_ENV=production                     # 环境标识
COMPOSE_PROJECT_NAME=interview-system  # Docker项目名

# 端口配置（宿主机端口）
FRONTEND_PORT=80                       # 前端端口
FRONTEND_HTTPS_PORT=443                # HTTPS端口
BACKEND_PORT=8080                      # 后端API端口
REDIS_PORT=6379                        # Redis端口

# API配置（容器内部网络）
VITE_API_BASE_URL=http://interview-backend:3001/api
# 说明：这是前端应用内部访问后端的URL，必须能通过Docker网络解析

# Dify AI配置
DIFY_API_KEY=app-xxxxxxxxxxxx          # 从Dify获取
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_URL=https://udify.app/workflow/xxx
DIFY_WORKFLOW_SCORE_ID=xxx
DIFY_WORKFLOW_GENERATE_ID=xxx

# Redis配置
REDIS_HOST=interview-redis             # Redis主机（容器内部）
REDIS_PASSWORD=                        # 密码（如果有）
REDIS_DB=0                             # 数据库编号
REDIS_PORT=6379                        # 端口

# 日志配置
LOG_LEVEL=INFO                         # 日志级别：DEBUG, INFO, WARN, ERROR
LOG_DIR=/app/logs

# 安全配置
JWT_SECRET=your-super-secret-key       # JWT签名密钥（改为强密码）
JWT_EXPIRATION=86400000                # JWT过期时间（毫秒）

# 性能配置
MAX_UPLOAD_SIZE=10MB                   # 最大上传文件大小
RATE_LIMIT_WINDOW=15                   # 限流时间窗口（分钟）
RATE_LIMIT_MAX=100                     # 时间窗口内最大请求数

# 时区配置
TZ=Asia/Shanghai                       # 时区
```

### Docker Compose 配置调优

```yaml
# 根据服务器配置调整以下参数：

services:
  backend:
    # CPU和内存限制
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M

  redis:
    command: >
      redis-server
      --maxmemory 512mb        # 增加缓存大小
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --appendonly yes

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## 监控和日志

### 实时日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis

# 查看最后100行日志
docker-compose logs --tail=100 backend

# 查看特定时间范围的日志
docker-compose logs --since 10m backend
```

### 日志存储位置

```
logs/
├── backend/          # 后端应用日志
│   ├── access.log
│   ├── error.log
│   └── app.log
├── frontend/         # Nginx日志
│   ├── access.log
│   └── error.log
├── redis/           # Redis日志
│   └── redis.log
└── proxy/           # 反向代理日志
    ├── access.log
    └── error.log
```

### 日志转发设置（ELK Stack）

```yaml
# docker-compose.yml 中的日志驱动配置

services:
  backend:
    logging:
      driver: "splunk"
      options:
        splunk-token: "your-splunk-token"
        splunk-url: "https://your-splunk-host:8088"
        splunk-insecureskipverify: "true"
        splunk-sourcetype: "docker:backend"
```

### 健康检查监控

```bash
# 检查容器健康状态
docker-compose ps

# 查看健康检查日志
docker inspect interview-backend --format='{{json .State.Health}}' | jq

# 手动触发健康检查
docker-compose exec backend curl -f http://localhost:3001/api/health
```

---

## 备份和恢复

### 自动备份策略

```bash
# 创建备份脚本
cat > backup-prod.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/interview-system/backups"
BACKUP_TIME=$(date +'%Y%m%d_%H%M%S')
BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIME"

# 创建备份目录
mkdir -p "$BACKUP_PATH"

# 备份Redis数据
docker-compose exec redis redis-cli BGSAVE
docker cp interview-redis:/data/dump.rdb "$BACKUP_PATH/"

# 备份上传文件
cp -r backend/uploads "$BACKUP_PATH/"

# 备份数据库（如果有）
# docker-compose exec postgres pg_dump ... > "$BACKUP_PATH/database.sql"

# 压缩备份
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "backup_$BACKUP_TIME"

# 清理7天前的备份
find "$BACKUP_DIR" -name "backup_*" -mtime +7 -delete

echo "备份完成: $BACKUP_PATH.tar.gz"
EOF

chmod +x backup-prod.sh
```

### 定时备份（Cron）

```bash
# 编辑crontab
crontab -e

# 添加每天凌晨2点执行备份
0 2 * * * /opt/interview-system/backup-prod.sh >> /opt/interview-system/backup.log 2>&1

# 查看已配置的定时任务
crontab -l
```

### 恢复数据

```bash
# 1. 停止容器
docker-compose down

# 2. 恢复Redis数据
docker cp ./backup_20240101_020000/dump.rdb interview-redis:/data/

# 3. 恢复上传文件
rm -rf backend/uploads
cp -r ./backup_20240101_020000/uploads backend/

# 4. 重启容器
docker-compose up -d

# 5. 验证数据
docker-compose logs -f
```

### 跨主机迁移

```bash
# 源主机：创建完整备份
tar -czf interview-system-backup.tar.gz \
  docker-compose.yml \
  .env.docker \
  nginx/ \
  logs/ \
  data/ \
  backend/uploads

# 传输到目标主机
scp interview-system-backup.tar.gz user@target-host:/tmp/

# 目标主机：解压备份
cd /opt/
tar -xzf /tmp/interview-system-backup.tar.gz

# 启动容器
docker-compose up -d
```

---

## 故障排查

### 常见问题

#### 1. 容器无法启动

```bash
# 查看错误日志
docker-compose logs backend

# 检查镜像是否构建成功
docker images | grep interview

# 重新构建镜像
docker-compose build --no-cache

# 检查端口是否被占用
netstat -tlnp | grep 8080
lsof -i :8080

# 解决方案：修改端口或杀死占用进程
kill -9 <PID>
```

#### 2. Redis连接失败

```bash
# 检查Redis容器状态
docker-compose ps redis

# 查看Redis日志
docker-compose logs redis

# 测试Redis连接
docker-compose exec redis redis-cli ping

# 如果失败，重启Redis
docker-compose restart redis
```

#### 3. 后端无法访问数据库

```bash
# 检查网络连接
docker-compose exec backend ping interview-redis

# 检查Redis认证
docker-compose exec redis redis-cli -a <PASSWORD> ping

# 查看环境变量
docker-compose exec backend env | grep REDIS
```

#### 4. 前端无法连接后端

```bash
# 检查后端服务状态
docker-compose exec backend curl -f http://localhost:3001/api/health

# 检查网络连接
docker-compose exec frontend curl http://interview-backend:3001/api/health

# 查看Nginx配置
docker-compose exec frontend cat /etc/nginx/nginx.conf

# 检查CORS配置
docker-compose logs backend | grep -i cors
```

#### 5. 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 查看Docker占用空间
docker system df

# 清理未使用的镜像和容器
docker system prune -a

# 清理未使用的数据卷
docker volume prune

# 清理日志
truncate -s 0 logs/*/*.log
```

### 调试技巧

```bash
# 进入容器调试
docker-compose exec backend sh
docker-compose exec frontend sh

# 查看容器详细信息
docker inspect interview-backend

# 实时监控容器资源
docker stats

# 查看容器网络
docker network inspect interview-network

# 抓取网络包（需要tcpdump）
docker run --rm --net container:interview-backend \
  -v /tmp:/tmp \
  nicolaka/netshoot tcpdump -i eth0 -w /tmp/backend.pcap
```

---

## 安全最佳实践

### 1. 环境变量安全

```bash
# ❌ 不要做这样的事
export DIFY_API_KEY="app-xxxxxxxxxxxx"  # 明文暴露
git push secrets.env                     # 提交敏感信息

# ✅ 正确做法
# 1. 使用 .env.docker 文件（添加到 .gitignore）
echo ".env.docker" >> .gitignore

# 2. 使用强密钥
openssl rand -base64 32  # 生成强密钥
JWT_SECRET=$(openssl rand -base64 32)

# 3. 使用密钥管理服务
# - HashiCorp Vault
# - AWS Secrets Manager
# - Azure Key Vault
```

### 2. 镜像安全

```bash
# 扫描镜像漏洞
docker scan interview-system/backend
docker scan interview-system/frontend

# 使用最小镜像
# ✓ alpine (5-50MB)
# ✓ distroless (10-50MB)
# ✗ ubuntu (77MB)
# ✗ centos (200MB)

# 定期更新基础镜像
docker-compose pull

# 使用特定版本（而不是latest）
FROM node:18.17.0-alpine
FROM nginx:1.25.1-alpine
FROM redis:7.0.12-alpine
```

### 3. 网络安全

```yaml
# docker-compose.yml - 隔离网络

services:
  frontend:
    networks:
      - frontend-only

  backend:
    networks:
      - frontend-backend
      - backend-redis

  redis:
    networks:
      - backend-redis

networks:
  frontend-only:
    driver: bridge
  frontend-backend:
    driver: bridge
  backend-redis:
    driver: bridge
```

### 4. 访问控制

```bash
# Redis密码保护
# 在 docker-compose.yml 中：
redis:
  command: redis-server --requirepass "your-strong-password"

# 连接时使用密码
docker-compose exec redis redis-cli -a "your-strong-password" ping
```

### 5. 日志审计

```bash
# 启用Docker日志驱动
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service=backend,env=production"

# 定期审查日志
docker-compose logs backend | grep ERROR
docker-compose logs backend | grep -i "unauthorized"
```

### 6. 容器用户权限

```dockerfile
# 以非root用户运行
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

USER nodeuser
```

### 7. 定期更新

```bash
# 每月更新基础镜像
docker pull node:18-alpine
docker pull nginx:alpine
docker pull redis:7-alpine

# 重新构建并测试
docker-compose build --no-cache
docker-compose up -d

# 检查变更日志
docker images --digests
```

---

## 性能优化

### 1. Redis优化

```conf
# 最大内存管理
maxmemory 512mb              # 根据可用内存调整
maxmemory-policy allkeys-lru # LRU驱逐策略

# 持久化优化
save 900 1                   # 900秒内至少1个key变化则保存
save 300 10                  # 300秒内至少10个key变化则保存
save 60 10000                # 60秒内至少10000个key变化则保存

appendonly yes               # 启用AOF持久化
appendfsync everysec         # 每秒同步一次
```

### 2. Nginx优化

```nginx
# 连接优化
worker_connections 2048;
keepalive_timeout 65;
keepalive_requests 100;

# 缓存优化
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
proxy_cache_valid 200 1h;
proxy_cache_valid 404 1m;

# 压缩优化
gzip on;
gzip_min_length 1000;
gzip_types text/plain text/css text/javascript application/json;

# 负载均衡
upstream backend {
    least_conn;
    server interview-backend-1:3001;
    server interview-backend-2:3001;
    server interview-backend-3:3001;
}
```

### 3. Node.js 优化

```javascript
// 设置环境变量
process.env.NODE_ENV = 'production';

// 使用集群模式
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
}

// 内存优化
--max-old-space-size=2048
--enable-source-maps
```

### 4. 数据库连接池

```javascript
// 连接池配置
const pool = {
  max: 20,              // 最大连接数
  min: 5,               // 最小连接数
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000
};
```

### 5. CDN集成

```nginx
# 在Nginx中配置CDN源站
upstream cdn {
    server cdn.example.com;
}

location /static/ {
    proxy_pass http://cdn;
    proxy_cache_valid 200 30d;
    add_header X-Cache-Status $upstream_cache_status;
}
```

---

## 监控和告警

### Prometheus监控设置

```yaml
# docker-compose.yml 添加

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - interview-network

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports:
      - "3000:3000"
    networks:
      - interview-network
    depends_on:
      - prometheus
```

### 关键指标监控

```yaml
# prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']

  - job_name: 'backend'
    static_configs:
      - targets: ['interview-backend:3001']

  - job_name: 'redis'
    static_configs:
      - targets: ['interview-redis:6379']
```

---

## 升级和回滚

### 安全升级流程

```bash
# 1. 创建完整备份
./backup-prod.sh

# 2. 在测试环境验证新版本
docker-compose -f docker-compose.test.yml up

# 3. 拉取新镜像
docker-compose pull

# 4. 停止旧容器
docker-compose down

# 5. 启动新容器
docker-compose up -d

# 6. 验证新版本
docker-compose ps
docker-compose logs -f

# 7. 健康检查
curl http://localhost:80
curl http://localhost:8080/api/health
```

### 快速回滚

```bash
# 如果出现问题，快速回滚
docker-compose down

# 恢复备份
cp -r ./backup_20240101_020000/* ./

# 重启服务
docker-compose up -d
```

---

## 成本优化

### 镜像大小优化

```dockerfile
# 多阶段构建，减小最终镜像大小

# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# 生产阶段
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["npm", "start"]
```

### 资源限制

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'      # 限制CPU使用
          memory: 1G     # 限制内存使用
        reservations:
          cpus: '1'
          memory: 512M
```

---

## 文档和支持

- 官方文档：https://docs.docker.com
- Docker最佳实践：https://docs.docker.com/develop/dev-best-practices/
- Dify文档：https://docs.dify.ai

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2024-01-01 | 初始版本 |

---

## 许可证

MIT License

---

**最后更新**: 2024-01-01
**维护者**: AI面试系统团队
