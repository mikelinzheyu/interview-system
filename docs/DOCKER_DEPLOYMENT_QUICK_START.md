# Docker 生产环境部署 - 快速启动指南

## 🚀 5分钟快速部署

### 前置条件

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ 内存
- 10GB+ 磁盘空间

### 快速部署步骤

#### 1️⃣ **准备环境变量**

```bash
# 复制环境配置文件
cp .env.docker.example .env.docker

# 编辑关键配置
nano .env.docker
```

**必须修改的项目：**
```env
DIFY_API_KEY=app-your-api-key-here
JWT_SECRET=your-super-strong-secret-key
FRONTEND_PORT=80
BACKEND_PORT=8080
```

#### 2️⃣ **创建目录结构**

```bash
# Linux/Mac
mkdir -p logs/{backend,frontend,redis,proxy} \
         data/{redis,uploads} \
         nginx/ssl \
         monitoring/{grafana/provisioning,grafana/dashboards}

# Windows PowerShell
mkdir logs/backend, logs/frontend, logs/redis, logs/proxy
mkdir data/redis, data/uploads
mkdir nginx/ssl
mkdir monitoring/grafana/provisioning, monitoring/grafana/dashboards
```

#### 3️⃣ **一键部署**

**Linux/Mac:**
```bash
chmod +x deploy-prod.sh
./deploy-prod.sh
```

**Windows:**
```batch
# 以管理员身份运行
deploy-prod.bat
```

**或手动部署：**
```bash
docker-compose up -d
```

#### 4️⃣ **验证部署**

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试服务
curl http://localhost:80          # 前端
curl http://localhost:8080/api/health  # 后端

# 测试Redis
docker-compose exec redis redis-cli ping
```

---

## 📊 监控和日志

### 启用监控（可选）

```bash
# 使用monitoring compose配置
docker-compose -f docker-compose.yml \
               -f docker-compose-monitoring.yml \
               up -d

# 访问监控面板
# Grafana: http://localhost:3000  (admin/admin123)
# Prometheus: http://localhost:9090
# Alertmanager: http://localhost:9093
```

### 查看日志

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis

# 查看最近100行
docker-compose logs --tail=100 backend
```

### 日志位置

```
logs/
├── backend/      # 后端应用日志
├── frontend/     # Nginx日志
├── redis/       # Redis日志
└── proxy/       # 反向代理日志
```

---

## 💾 备份和恢复

### 自动备份

```bash
# 执行备份
chmod +x backup-prod.sh
./backup-prod.sh

# 定时备份（每天凌晨2点）
# 编辑crontab
crontab -e

# 添加以下行：
0 2 * * * /path/to/interview-system/backup-prod.sh >> /var/log/interview-backup.log 2>&1
```

### 恢复数据

```bash
# 从最新备份恢复
chmod +x restore-backup.sh
./restore-backup.sh

# 从特定备份恢复
./restore-backup.sh backup_20240101_120000.tar.gz

# 列出所有可用备份
./restore-backup.sh -h
```

---

## ⚙️ 常用命令

### 容器管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart backend

# 查看容器状态
docker-compose ps

# 查看容器资源使用
docker stats
```

### 进入容器调试

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入Redis容器
docker-compose exec redis sh

# 进入前端容器
docker-compose exec frontend sh
```

### 日志和监控

```bash
# 查看实时日志
docker-compose logs -f

# 清除日志
docker-compose exec backend rm -f /app/logs/*

# 检查容器健康状态
docker-compose exec backend curl http://localhost:3001/api/health
```

### 数据管理

```bash
# 进入Redis
docker-compose exec redis redis-cli

# 查看Redis统计信息
docker-compose exec redis redis-cli INFO

# 清空Redis（仅用于测试）
docker-compose exec redis redis-cli FLUSHALL
```

---

## 🔧 配置调整

### 修改端口

编辑 `.env.docker`:
```env
FRONTEND_PORT=8080      # 修改前端端口
BACKEND_PORT=3001       # 修改后端端口
REDIS_PORT=6380         # 修改Redis端口
```

然后重启：
```bash
docker-compose down
docker-compose up -d
```

### 调整资源限制

编辑 `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4'      # 最多使用4个CPU
          memory: 2G     # 最多使用2GB内存
```

### 增加Redis缓存

编辑 `docker-compose.yml`:
```yaml
redis:
  command: >
    redis-server
    --maxmemory 1gb      # 增加缓存大小
    --maxmemory-policy allkeys-lru
```

---

## 🚨 故障排查

### 容器无法启动

```bash
# 查看错误日志
docker-compose logs backend

# 检查端口占用
netstat -tlnp | grep 8080  # Linux
lsof -i :8080              # Mac

# 解决方案：修改端口或杀死占用进程
# kill -9 <PID>
```

### Redis连接失败

```bash
# 检查Redis状态
docker-compose ps redis

# 测试连接
docker-compose exec redis redis-cli ping

# 重启Redis
docker-compose restart redis

# 查看Redis日志
docker-compose logs redis
```

### 内存不足

```bash
# 查看内存使用
docker stats

# 清理未使用的镜像和卷
docker system prune -a

# 清理日志
truncate -s 0 logs/*/*.log
```

### 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 查看Docker占用空间
docker system df

# 清理旧备份
rm -rf backups/backup_*.tar.gz  # 保留最新的几个
```

---

## 🔐 安全配置

### 1. 修改默认密钥

```env
# .env.docker

# 修改JWT密钥（使用强密钥）
JWT_SECRET=$(openssl rand -base64 32)

# 修改Redis密码
REDIS_PASSWORD=your-strong-password

# 修改Grafana密码
GRAFANA_PASSWORD=your-strong-password
```

### 2. 启用SSL/TLS

```bash
# 生成自签名证书（用于测试）
cd nginx/ssl
openssl req -x509 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj "/C=CN/ST=Beijing/O=Interview/CN=your-domain.com"

# 使用Let's Encrypt（推荐）
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

### 3. 限制网络访问

编辑 `docker-compose.yml`:
```yaml
services:
  redis:
    expose:           # 仅暴露给内部网络
      - "6379"
    # 不要使用 ports，避免外网访问
```

### 4. 定期更新镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重新构建
docker-compose build --no-cache

# 重启服务
docker-compose up -d
```

---

## 📈 性能优化

### Redis 优化

```bash
# 查看Redis配置
docker-compose exec redis redis-cli CONFIG GET maxmemory

# 设置最大内存策略
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 数据库连接池优化

编辑 `backend/.env`:
```
DB_POOL_MIN=5
DB_POOL_MAX=20
```

### CDN 集成

在 `nginx/proxy.conf` 中配置缓存：
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
proxy_cache_valid 200 1h;
```

---

## 📚 更多资源

- [完整部署指南](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Docker官方文档](https://docs.docker.com)
- [Docker最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Dify文档](https://docs.dify.ai)

---

## 💬 支持

遇到问题？查看以下资源：

1. **日志**: `docker-compose logs -f`
2. **状态**: `docker-compose ps`
3. **健康检查**: `docker-compose exec backend curl http://localhost:3001/api/health`

---

## 版本信息

| 项目 | 版本 |
|------|------|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| Node.js | 18+ |
| Redis | 7.0+ |
| Nginx | 1.25+ |

---

**最后更新**: 2024年01月
**维护者**: AI面试系统团队
