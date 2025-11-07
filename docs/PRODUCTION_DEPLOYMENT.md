# AI面试系统 - 完整Docker生产部署指南

## 目录
1. [系统要求](#系统要求)
2. [前置准备](#前置准备)
3. [环境配置](#环境配置)
4. [SSL证书配置](#ssl证书配置)
5. [部署步骤](#部署步骤)
6. [监控和维护](#监控和维护)
7. [故障排查](#故障排查)
8. [安全最佳实践](#安全最佳实践)

---

## 系统要求

### 硬件要求
- CPU: 4核以上
- 内存: 8GB以上
- 存储: 50GB以上SSD
- 带宽: 10Mbps以上

### 软件要求
- Docker: 20.10+
- docker-compose: 2.0+
- OpenSSL: 1.1.1+ (用于SSL证书)
- 操作系统: Linux (Ubuntu 20.04+) 或 macOS 或 Windows Server 2019+

### 网络要求
- 开放端口: 80 (HTTP), 443 (HTTPS)
- 允许内部通信的Docker网络

---

## 前置准备

### 1. 验证Docker安装
```bash
docker --version
docker-compose --version
```

### 2. 获取项目代码
```bash
git clone <repository-url>
cd interview-system
```

### 3. 检查磁盘空间
```bash
# Linux/macOS
df -h /

# Windows
wmic logicaldisk get name,freespace
```

---

## 环境配置

### 1. 复制并编辑.env.prod文件

```bash
cp .env.docker .env.prod
```

### 2. 修改重要配置项

打开 `.env.prod` 并修改以下内容:

```env
# 数据库配置 (必须修改)
DB_PASSWORD=YourStrongPassword123!@#

# Redis配置 (必须修改)
REDIS_PASSWORD=YourRedisPassword123!@#

# JWT安全密钥 (必须修改)
JWT_SECRET=your-very-long-random-secret-key-at-least-32-characters

# Dify AI配置 (从https://dify.ai获取)
DIFY_API_KEY=app-your-actual-api-key
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_URL=https://udify.app/workflow/your-workflow-id

# 域名配置 (根据实际情况修改)
# 如果有域名: app.yourdomain.com
# 如果只有IP: 使用IP地址
```

### 3. 验证所有环境变量

```bash
grep -E "^[A-Z_]+=" .env.prod | wc -l
# 应该显示30+个配置项
```

---

## SSL证书配置

### 选项A: 使用自签证书（开发/测试）

```bash
mkdir -p nginx/ssl

# 生成自签证书（有效期365天）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=yourdomain.com/O=Interview System/C=CN"
```

### 选项B: 使用Let's Encrypt证书（推荐生产）

```bash
# 安装certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 复制证书到nginx目录
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/*.pem
```

### 选项C: 使用商业证书

1. 从证书提供商获取PEM格式证书和私钥
2. 放置到 `nginx/ssl/` 目录:
   - 证书: `nginx/ssl/cert.pem`
   - 私钥: `nginx/ssl/key.pem`

---

## 部署步骤

### Linux/macOS 快速部署

```bash
# 1. 进入项目目录
cd /path/to/interview-system

# 2. 复制并配置环境文件
cp .env.docker .env.prod
nano .env.prod  # 编辑必要的配置

# 3. 创建数据目录
mkdir -p data/{db/init,db/backups,redis,backend/uploads,storage,frontend/cache,proxy/cache}
mkdir -p logs/{db,redis,backend,storage,frontend,proxy}
mkdir -p nginx/ssl

# 4. 生成SSL证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# 5. 运行部署脚本
chmod +x deploy-prod.sh
./deploy-prod.sh
```

### Windows PowerShell 部署

```powershell
# 1. 进入项目目录
cd C:\path\to\interview-system

# 2. 复制并配置环境文件
Copy-Item .env.docker .env.prod
# 编辑 .env.prod

# 3. 创建数据目录
New-Item -ItemType Directory -Path data\db\init, data\redis, logs\db, nginx\ssl -Force

# 4. 运行部署脚本
.\deploy-prod.bat
```

### Docker Compose 直接命令

```bash
# 1. 构建镜像
docker-compose -f docker-compose.prod.yml build --no-cache

# 2. 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 3. 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 服务验证

### 检查所有服务运行状态

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 应该显示以下容器都在运行:
# - interview-db (PostgreSQL)
# - interview-redis (Redis)
# - interview-backend (Node.js API)
# - interview-storage (Java服务)
# - interview-frontend (Nginx前端)
# - interview-proxy (Nginx反向代理)
```

### 健康检查

```bash
# 检查前端
curl -k https://localhost/health

# 检查后端API
curl -k https://localhost/api/health

# 检查存储服务
curl -k https://localhost/storage/api/sessions

# 应该都返回200状态码
```

### 访问应用

- 前端: https://localhost
- 后端API: https://localhost/api
- 存储服务: https://localhost/storage

---

## 监控和维护

### 启用监控服务 (Prometheus + Grafana)

```bash
# 使用monitoring profile启动服务
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

访问地址:
- Prometheus: http://localhost:9090
- Grafana: http://localhost/grafana (密码见.env.prod中的GRAFANA_PASSWORD)

### 查看日志

```bash
# 查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f storage-service
docker-compose -f docker-compose.prod.yml logs -f redis

# 查看日志文件
tail -f logs/backend/*.log
tail -f logs/storage/*.log
```

### 备份数据

```bash
# 创建备份脚本
cat > backup-prod.sh << 'BACKUP'
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份数据库
docker exec interview-db pg_dump -U admin interview_system > "$BACKUP_DIR/db.sql"

# 备份Redis
docker exec interview-redis redis-cli BGSAVE
docker cp interview-redis:/data/dump.rdb "$BACKUP_DIR/"

# 备份上传文件
cp -r data/backend/uploads "$BACKUP_DIR/"

# 压缩备份
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "备份完成: $BACKUP_DIR.tar.gz"
BACKUP

chmod +x backup-prod.sh
./backup-prod.sh
```

---

## 故障排查

### 1. 容器无法启动

```bash
# 查看错误日志
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs storage-service

# 检查磁盘空间
df -h

# 检查内存
free -h
```

### 2. 无法连接到服务

```bash
# 检查容器网络
docker network ls
docker network inspect interview-network

# 验证DNS解析
docker exec interview-backend nslookup interview-redis
docker exec interview-backend nslookup interview-db
```

### 3. 数据库连接失败

```bash
# 检查数据库容器
docker-compose -f docker-compose.prod.yml ps db

# 验证数据库连接
docker exec interview-backend \
  psql -h interview-db -U admin -d interview_system -c "SELECT 1"
```

### 4. Redis连接失败

```bash
# 检查Redis密码
grep REDIS_PASSWORD .env.prod

# 测试Redis连接
docker exec interview-redis \
  redis-cli -a "YOUR_PASSWORD" ping
```

### 5. SSL/HTTPS错误

```bash
# 检查证书文件
ls -la nginx/ssl/

# 验证证书有效性
openssl x509 -in nginx/ssl/cert.pem -text -noout

# 检查Nginx配置
docker exec interview-proxy nginx -t
```

---

## 安全最佳实践

### 1. 密钥管理

✅ **必须做**:
- 修改所有默认密码
- 使用强密码(至少16字符，包含大小写和特殊字符)
- 定期轮换密钥
- 使用环境变量而不是硬编码

```bash
# 生成强随机密钥
openssl rand -base64 32
```

❌ **不要做**:
- 提交.env.prod到版本控制
- 使用简单密码
- 在日志中暴露敏感信息

### 2. 网络安全

```bash
# 限制外部访问某些端口
# 只允许必要的端口访问(80, 443)

# 使用防火墙
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 6379/tcp  # Redis
sudo ufw deny 5432/tcp  # PostgreSQL
sudo ufw deny 9090/tcp  # Prometheus
```

### 3. 定期更新

```bash
# 更新Docker镜像
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 检查安全漏洞
docker scan interview-system/backend
docker scan interview-system/frontend
docker scan interview-system/storage-service
```

### 4. 访问控制

```bash
# 创建非root用户
sudo useradd -m docker-user
sudo usermod -aG docker docker-user

# 限制文件权限
sudo chmod 600 .env.prod
sudo chmod 600 nginx/ssl/key.pem
sudo chown docker-user:docker-user data/ logs/
```

### 5. 审计和监控

```bash
# 启用Docker日志驱动
docker logs <container-id> | grep ERROR

# 监控系统资源
docker stats

# 审计容器变更
docker inspect <container-id>
```

---

## 扩展和优化

### 使用Docker Swarm进行扩展

```bash
# 初始化Swarm
docker swarm init

# 部署stack
docker stack deploy -c docker-compose.prod.yml interview-system

# 扩展服务
docker service scale backend=3
```

### 使用Kubernetes部署

见 `k8s-deployment.yaml` 文件

### 性能调优

```env
# .env.prod 中的性能配置
REDIS_MAXMEMORY=512mb
DB_MAX_CONNECTIONS=200
NODE_WORKER_THREADS=4
JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
```

---

## 故障恢复

### 快速恢复步骤

```bash
# 1. 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 2. 检查数据卷
docker volume ls

# 3. 恢复备份
tar -xzf backups/backup.tar.gz -C .

# 4. 重新启动服务
docker-compose -f docker-compose.prod.yml up -d

# 5. 验证服务
curl -k https://localhost/health
```

---

## 联系支持

- 文档: [GitHub Wiki](https://github.com/yourorg/interview-system/wiki)
- 问题: [GitHub Issues](https://github.com/yourorg/interview-system/issues)
- 安全问题: security@yourdomain.com

---

**最后更新**: 2024-10-27
**版本**: 1.0.0
