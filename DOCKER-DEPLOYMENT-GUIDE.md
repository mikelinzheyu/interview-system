# AI面试系统 - Docker生产部署完整指南

## 目录

1. [系统要求](#系统要求)
2. [快速开始](#快速开始)
3. [详细配置](#详细配置)
4. [部署步骤](#部署步骤)
5. [监控和维护](#监控和维护)
6. [故障排查](#故障排查)
7. [性能优化](#性能优化)
8. [安全加固](#安全加固)

---

## 系统要求

### 硬件要求

| 组件 | 最小要求 | 推荐配置 | 说明 |
|------|---------|--------|------|
| CPU | 2核心 | 4核心+ | Docker容器需要充足的计算能力 |
| 内存 | 2GB | 8GB+ | Redis、Nginx、Node.js各需要内存 |
| 磁盘 | 10GB | 50GB+ | 包括镜像、容器、数据和日志 |
| 网络 | 100Mbps | 1Gbps | 建议有稳定的网络连接 |

### 软件要求

- **Docker**: v20.10+ (推荐 v24.0+)
- **Docker Compose**: v2.0+ 或 v1.29+
- **操作系统**:
  - Linux: Ubuntu 20.04 LTS+ / CentOS 7+ / Debian 10+
  - Windows: Windows Server 2016+ 或 Windows 10/11 Pro/Enterprise (Docker Desktop)
  - macOS: macOS 11+

### 依赖项

```bash
# Linux 系统依赖
- curl
- wget
- openssl (用于生成SSL证书)
- git

# Docker 相关
- Docker Engine
- Docker Compose
```

---

## 快速开始

### Linux/macOS 快速部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd interview-system

# 2. 配置环境
cp .env.docker .env  # 或使用 .env.production

# 3. 使用部署脚本
chmod +x docker-deploy-prod.sh
./docker-deploy-prod.sh start

# 4. 验证部署
./docker-deploy-prod.sh status
```

### Windows (PowerShell) 快速部署

```powershell
# 1. 克隆项目
git clone <repository-url>
cd interview-system

# 2. 配置环境
Copy-Item .env.docker -Destination .env

# 3. 运行部署脚本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\docker-deploy-prod.ps1 -Action start

# 4. 验证部署
.\docker-deploy-prod.ps1 -Action status
```

### Windows (CMD) 快速部署

```batch
# 1. 克隆项目
git clone <repository-url>
cd interview-system

# 2. 配置环境
copy .env.docker .env

# 3. 运行部署脚本
docker-deploy-prod.bat start

# 4. 验证部署
docker-deploy-prod.bat status
```

---

## 详细配置

### 环境变量配置 (.env.docker)

```ini
# 应用信息
APP_NAME=AI面试系统
APP_VERSION=1.0.0
APP_ENV=production

# 端口配置
FRONTEND_PORT=80                    # 前端访问端口
BACKEND_PORT=8080                   # 后端API端口
REDIS_PORT=6379                     # Redis端口

# API配置 (容器内部网络地址)
VITE_API_BASE_URL=http://interview-backend:3001/api

# Dify AI配置
DIFY_API_KEY=your-api-key           # 需要配置
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_URL=https://udify.app/workflow/your-id

# Redis配置
REDIS_HOST=interview-redis
REDIS_PASSWORD=                     # 如需密码，请配置
REDIS_DB=0

# 安全配置
JWT_SECRET=your-secret-key-32-chars # 生成强密钥
JWT_EXPIRATION=86400000              # 24小时

# 时区
TZ=Asia/Shanghai
```

### 生成安全的JWT密钥

```bash
# Linux/macOS
openssl rand -base64 32

# Windows PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

### Docker Compose 配置说明

```yaml
# docker-compose.yml 中的关键配置

services:
  backend:
    # 后端服务配置
    - 端口: 3001 (内部), 8080 (宿主机)
    - 健康检查: /api/health
    - 日志: ./logs/backend

  frontend:
    # 前端服务配置
    - 端口: 80 (HTTP), 443 (HTTPS)
    - 基础镜像: nginx:alpine
    - 日志: ./logs/frontend

  redis:
    # Redis缓存配置
    - 端口: 6379
    - 内存限制: 256MB
    - 持久化: RDB + AOF

  nginx-proxy:
    # 反向代理配置 (可选profile)
    - 启用: docker-compose up --profile proxy
    - 端口: 80, 443
    - SSL支持: 已配置
```

---

## 部署步骤

### 第1步：环境检查和准备

```bash
# 检查Docker是否正确安装
docker --version
docker-compose --version

# 检查磁盘空间
df -h

# 检查内存
free -h  # Linux
vm_stat  # macOS
```

### 第2步：获取并配置代码

```bash
# 克隆项目
git clone <repository-url>
cd interview-system

# 查看当前状态
ls -la
git status

# 配置环境变量
# 方式1: 使用已有的.env.production
cp .env.production .env.docker

# 方式2: 编辑配置文件
nano .env.docker  # 或 code .env.docker
```

### 第3步：创建必要的目录和SSL证书

```bash
# 创建目录结构
mkdir -p logs/{backend,frontend,redis,proxy}
mkdir -p data/redis
mkdir -p backend/uploads
mkdir -p nginx/ssl

# 生成自签名SSL证书 (开发/测试环境)
openssl req -x509 -newkey rsa:2048 -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem -days 365 -nodes \
  -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Interview/CN=localhost"

# 生产环境：使用真实证书
# 将证书文件放在 nginx/ssl/ 目录下
# - cert.pem (证书文件)
# - key.pem (密钥文件)
```

### 第4步：构建Docker镜像

```bash
# 构建所有镜像
docker-compose --env-file .env.docker build

# 或者只构建特定服务
docker-compose --env-file .env.docker build backend
docker-compose --env-file .env.docker build frontend

# 查看构建结果
docker images | grep interview-system
```

### 第5步：启动服务

```bash
# 启动所有服务
docker-compose --env-file .env.docker up -d

# 查看启动进程
docker-compose --env-file .env.docker ps

# 查看日志
docker-compose --env-file .env.docker logs -f

# 等待服务健康检查通过 (通常30-60秒)
```

### 第6步：验证部署

```bash
# 检查所有容器状态
docker-compose --env-file .env.docker ps

# 检查后端API健康状态
curl -f http://localhost:8080/api/health

# 检查前端
curl -f http://localhost/health

# 检查Redis连接
docker-compose --env-file .env.docker exec redis redis-cli ping

# 访问应用
# 浏览器打开: http://localhost
```

---

## 监控和维护

### 查看日志

```bash
# 查看所有服务日志
docker-compose --env-file .env.docker logs -f

# 查看特定服务日志 (最后100行)
docker-compose --env-file .env.docker logs --tail=100 backend
docker-compose --env-file .env.docker logs --tail=100 frontend
docker-compose --env-file .env.docker logs --tail=100 redis

# 将日志保存到文件
docker-compose --env-file .env.docker logs > deployment.log
```

### 监控容器资源使用

```bash
# 实时监控
docker stats

# 查看容器详细信息
docker-compose --env-file .env.docker exec backend docker stats

# 检查容器内存使用
docker-compose --env-file .env.docker ps -a
docker inspect <container-id> | grep -i memory
```

### 数据备份

```bash
# 备份Redis数据
docker-compose --env-file .env.docker exec redis redis-cli \
  --rdb /data/dump.rdb
cp data/redis/dump.rdb ./backup/redis-dump-$(date +%Y%m%d).rdb

# 备份日志
tar -czf backup/logs-$(date +%Y%m%d).tar.gz logs/

# 备份配置
cp .env.docker backup/.env.docker-$(date +%Y%m%d)
```

### 定期维护任务

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的网络
docker network prune

# 清理未使用的卷
docker volume prune

# 重新启动所有服务
docker-compose --env-file .env.docker restart

# 更新镜像并重启
docker-compose --env-file .env.docker pull
docker-compose --env-file .env.docker up -d
```

---

## 故障排查

### 常见问题和解决方案

#### 问题1: 端口已被占用

```bash
# 查看端口占用情况
lsof -i :80     # Linux/macOS
lsof -i :3001
netstat -ano | findstr :80  # Windows

# 解决方案1: 修改.env中的端口配置
# FRONTEND_PORT=8080
# BACKEND_PORT=8081

# 解决方案2: 停止占用端口的程序
kill -9 <PID>
```

#### 问题2: 服务无法启动

```bash
# 查看详细日志
docker-compose --env-file .env.docker logs backend

# 检查镜像是否正确构建
docker images | grep interview-system

# 重新构建镜像
docker-compose --env-file .env.docker build --no-cache backend

# 检查磁盘空间
df -h
```

#### 问题3: 内存不足

```bash
# 查看容器内存使用
docker stats

# 限制容器内存
# 在docker-compose.yml中添加:
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           memory: 512M

# 清理不需要的镜像和容器
docker system prune -a
```

#### 问题4: Redis连接失败

```bash
# 检查Redis容器是否运行
docker-compose --env-file .env.docker ps redis

# 测试Redis连接
docker-compose --env-file .env.docker exec redis redis-cli ping

# 查看Redis日志
docker-compose --env-file .env.docker logs redis

# 重启Redis
docker-compose --env-file .env.docker restart redis
```

#### 问题5: HTTPS/SSL证书问题

```bash
# 检查证书文件
ls -la nginx/ssl/

# 验证证书有效性
openssl x509 -in nginx/ssl/cert.pem -text -noout

# 重新生成自签名证书
rm -rf nginx/ssl/*
openssl req -x509 -newkey rsa:2048 -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem -days 365 -nodes \
  -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Interview/CN=localhost"
```

### 调试技巧

```bash
# 进入容器内部调试
docker-compose --env-file .env.docker exec backend sh
docker-compose --env-file .env.docker exec frontend sh

# 查看容器网络
docker network inspect interview-network

# 测试容器间通信
docker-compose --env-file .env.docker exec backend \
  curl http://interview-frontend/health

# 查看Docker日志 (系统级)
journalctl -u docker -f  # Linux systemd
```

---

## 性能优化

### 1. 后端优化

```javascript
// backend/mock-server.js 中的优化

// 启用HTTP/2推送
// 配置连接池
const POOL_SIZE = 10;

// 优化缓存策略
const CACHE_TTL_MS = 5000;  // 可根据需要调整

// 启用Gzip压缩
app.use(compression());
```

### 2. 前端优化

```javascript
// frontend/vite.config.js

export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    },
    rollupOptions: {
      output: {
        // 代码分割
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia', 'axios']
        }
      }
    }
  }
}
```

### 3. Docker优化

```yaml
# docker-compose.yml 性能优化

services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 512M
        reservations:
          cpus: '1'
          memory: 256M

  redis:
    command: redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru  # 自动淘汰策略
```

### 4. Nginx优化

```nginx
# nginx/proxy.conf

# 启用缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
proxy_cache_valid 200 5m;

# 启用连接复用
keepalive_timeout 65;
keepalive_requests 100;

# 启用Gzip
gzip on;
gzip_comp_level 6;
```

---

## 安全加固

### 1. 环境安全

```bash
# 设置强密钥
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env.docker

# 限制文件权限
chmod 600 .env.docker
chmod 700 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem
```

### 2. 容器安全

```yaml
# docker-compose.yml 安全配置

services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /run
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### 3. 网络安全

```bash
# 启用防火墙
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp  # 后端API (可选)
sudo ufw enable

# 使用反向代理隐藏内部服务
# docker-compose up --profile proxy
```

### 4. 定期安全检查

```bash
# 检查镜像安全漏洞
docker scan interview-system/backend
docker scan interview-system/frontend

# 更新基础镜像
docker pull node:18-alpine
docker pull nginx:alpine

# 定期扫描依赖
npm audit
npm audit fix
```

---

## 常用命令参考

### 基础命令

```bash
# 启动服务
docker-compose --env-file .env.docker up -d

# 停止服务
docker-compose --env-file .env.docker down

# 查看状态
docker-compose --env-file .env.docker ps

# 查看日志
docker-compose --env-file .env.docker logs -f

# 重启服务
docker-compose --env-file .env.docker restart

# 删除服务和数据
docker-compose --env-file .env.docker down -v
```

### 使用部署脚本 (推荐)

```bash
# Linux/macOS
./docker-deploy-prod.sh start     # 启动
./docker-deploy-prod.sh stop      # 停止
./docker-deploy-prod.sh restart   # 重启
./docker-deploy-prod.sh logs      # 查看日志
./docker-deploy-prod.sh status    # 查看状态
./docker-deploy-prod.sh verify    # 验证部署
./docker-deploy-prod.sh clean     # 清理数据

# Windows PowerShell
.\docker-deploy-prod.ps1 -Action start
.\docker-deploy-prod.ps1 -Action status
.\docker-deploy-prod.ps1 -Action logs -Service backend

# Windows CMD
docker-deploy-prod.bat start
docker-deploy-prod.bat status
```

---

## 访问地址

部署完成后，可以访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端应用 | http://localhost | 浏览器访问 |
| 前端应用 (HTTPS) | https://localhost | 需要配置真实证书 |
| 后端API | http://localhost:8080/api | API基础路径 |
| 后端健康检查 | http://localhost:8080/api/health | 服务健康状态 |
| Redis | localhost:6379 | Redis数据库 |

---

## 支持和帮助

- 查看项目文档: `README.md`
- 查看API文档: `API_DOCUMENTATION.md`
- 查看部署日志: `logs/` 目录
- 提交问题: GitHub Issues

---

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

---

**最后更新**: 2025-10-21
**文档版本**: 1.0.0
**维护者**: Interview System Team
