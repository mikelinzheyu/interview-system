# 🐳 Docker 生产环境部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [服务架构](#服务架构)
- [环境配置](#环境配置)
- [运维管理](#运维管理)
- [故障排查](#故障排查)
- [性能优化](#性能优化)

## 系统要求

### 硬件要求

- CPU: 4核心及以上
- 内存: 8GB及以上
- 硬盘: 50GB可用空间

### 软件要求

- Docker 20.10+
- Docker Compose 2.0+
- Git 2.0+

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/mikelinzheyu/interview-system.git
cd interview-system
```

### 2. 配置环境变量

复制环境变量模板并根据实际情况修改：

```bash
cd production
cp .env.production .env.production.local
```

编辑 `.env.production` 文件，修改以下关键配置：

```env
# 数据库密码（必须修改）
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_PASSWORD=your_secure_password

# Redis密码（必须修改）
REDIS_PASSWORD=your_secure_password

# JWT密钥（必须修改，至少64字符）
JWT_SECRET=your_jwt_secret_at_least_64_characters

# 加密密钥（用于OAuth token加密）
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# AI服务配置（如需使用AI功能）
DIFY_WORKFLOW_API_KEY=your_dify_api_key
DIFY_CHAT_API_KEY=your_dify_chat_api_key
```

### 3. 部署系统

**Linux/Mac:**

```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**

```powershell
.\deploy.ps1
```

### 4. 访问服务

部署完成后，访问以下地址：

- 🌐 **前端应用**: http://localhost
- 📡 **Java后端API**: http://localhost:8080
- 🔌 **Node.js后端**: http://localhost:3001
- 🗄️ **MySQL数据库**: localhost:3307
- 🔴 **Redis缓存**: localhost:6380

## 详细部署步骤

### 步骤1: 环境检查

```bash
# 检查Docker版本
docker --version

# 检查Docker Compose版本
docker-compose --version

# 检查Docker服务状态
docker info
```

### 步骤2: 准备配置文件

1. **数据库初始化脚本**: `production/init-db.sql`
2. **Nginx配置**: `production/nginx/nginx.conf`
3. **环境变量**: `production/.env.production`

### 步骤3: 构建镜像

```bash
cd production
docker-compose -f docker-compose.production.yml build --no-cache
```

### 步骤4: 启动服务

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 步骤5: 验证部署

```bash
# 查看服务状态
docker-compose -f docker-compose.production.yml ps

# 查看服务日志
docker-compose -f docker-compose.production.yml logs -f

# 测试健康检查
curl http://localhost/health
curl http://localhost:8080/actuator/health
curl http://localhost:3001/api/health
```

## 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (80)                          │
│                    反向代理 + 负载均衡                        │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
    ┌─────────▼─────────┐         ┌─────────▼─────────┐
    │   Frontend (80)   │         │  Backend APIs     │
    │   Vue.js + Nginx  │         │                   │
    └───────────────────┘         ├───────────────────┤
                                  │ Java Backend      │
                                  │ (Spring Boot)     │
                                  │ Port: 8080        │
                                  ├───────────────────┤
                                  │ Node.js Backend   │
                                  │ (Express)         │
                                  │ Port: 3001        │
                                  └─────────┬─────────┘
                                            │
              ┌─────────────────────────────┼─────────────────┐
              │                             │                 │
    ┌─────────▼─────────┐       ┌─────────▼─────────┐  ┌────▼────┐
    │   MySQL (3306)    │       │   Redis (6379)    │  │ Storage │
    │   主数据库         │       │   缓存 + 会话      │  │  API    │
    └───────────────────┘       └───────────────────┘  └─────────┘
```

### 服务说明

| 服务 | 容器名 | 端口 | 说明 |
|-----|-------|------|-----|
| MySQL | interview-mysql | 3307:3306 | 主数据库 |
| Redis | interview-redis | 6380:6379 | 缓存和会话 |
| Storage API | interview-storage-api | 8090:8080 | 文件存储服务 |
| Java Backend | interview-backend-java | 8080:8080 | 主后端API |
| Node Backend | interview-backend-node | 3001:3001 | WebSocket服务 |
| Frontend | interview-frontend | 80:80 | 前端应用 |

## 环境配置

### 必需配置项

```env
# 数据库配置
MYSQL_ROOT_PASSWORD=          # MySQL root密码
MYSQL_USER=interview          # MySQL用户名
MYSQL_PASSWORD=               # MySQL密码
MYSQL_PORT=3307               # 外部访问端口

# Redis配置
REDIS_PASSWORD=               # Redis密码
REDIS_PORT=6380               # 外部访问端口

# JWT配置
JWT_SECRET=                   # JWT签名密钥
JWT_EXPIRY=7d                 # Token过期时间

# 加密配置
ENCRYPTION_KEY=               # 32字节十六进制密钥
```

### 可选配置项

```env
# AI服务配置
DIFY_WORKFLOW_API_KEY=        # Dify工作流API密钥
DIFY_CHAT_API_KEY=            # Dify对话API密钥

# OAuth配置
WECHAT_APP_ID=                # 微信AppID
WECHAT_APP_SECRET=            # 微信AppSecret
QQ_APP_ID=                    # QQ AppID
QQ_APP_KEY=                   # QQ AppKey

# 服务端口配置
FRONTEND_PORT=80              # 前端端口
BACKEND_JAVA_PORT=8080        # Java后端端口
BACKEND_NODE_PORT=3001        # Node后端端口
STORAGE_API_PORT=8090         # 存储API端口
```

### 生成安全密钥

```bash
# 生成JWT密钥（64字符）
openssl rand -base64 48

# 生成加密密钥（32字节十六进制）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 运维管理

### 常用命令

```bash
# 查看服务状态
docker-compose -f docker-compose.production.yml ps

# 查看所有日志
docker-compose -f docker-compose.production.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.production.yml logs -f backend-java

# 重启服务
docker-compose -f docker-compose.production.yml restart

# 重启特定服务
docker-compose -f docker-compose.production.yml restart backend-java

# 停止服务
docker-compose -f docker-compose.production.yml down

# 停止并删除数据卷（危险操作）
docker-compose -f docker-compose.production.yml down -v
```

### 数据备份

**MySQL数据备份:**

```bash
# 备份数据库
docker exec interview-mysql mysqldump -u root -p'password' interview_system > backup.sql

# 恢复数据库
docker exec -i interview-mysql mysql -u root -p'password' interview_system < backup.sql
```

**Redis数据备份:**

```bash
# 备份Redis
docker exec interview-redis redis-cli -a 'password' SAVE
docker cp interview-redis:/data/dump.rdb ./redis-backup.rdb

# 恢复Redis
docker cp ./redis-backup.rdb interview-redis:/data/dump.rdb
docker-compose -f docker-compose.production.yml restart redis
```

**文件上传备份:**

```bash
# 备份上传文件
docker cp interview-backend-java:/app/uploads ./uploads-backup

# 恢复上传文件
docker cp ./uploads-backup interview-backend-java:/app/uploads
```

### 日志管理

日志存储位置：`production/logs/`

```bash
# 查看Nginx日志
tail -f production/logs/nginx/access.log
tail -f production/logs/nginx/error.log

# 查看Java后端日志
tail -f production/logs/backend-java/application.log

# 查看Node后端日志
tail -f production/logs/backend-node/app.log

# 清理旧日志（保留最近7天）
find production/logs -name "*.log" -mtime +7 -delete
```

## 故障排查

### 服务无法启动

1. **检查端口占用:**

```bash
# Linux/Mac
netstat -tlnp | grep -E '80|3001|8080|3306|6379'

# Windows
netstat -ano | findstr "80 3001 8080 3306 6379"
```

2. **检查Docker资源:**

```bash
docker system df
docker system prune -a  # 清理未使用的资源
```

3. **查看详细错误:**

```bash
docker-compose -f docker-compose.production.yml logs
```

### 数据库连接失败

1. 检查MySQL容器状态
2. 验证环境变量配置
3. 查看数据库日志

```bash
docker logs interview-mysql
docker exec -it interview-mysql mysql -u root -p
```

### Redis连接失败

1. 检查Redis容器状态
2. 测试Redis连接

```bash
docker exec -it interview-redis redis-cli -a 'password' ping
```

### 前端无法访问后端

1. 检查Nginx配置
2. 验证后端服务状态
3. 检查网络连接

```bash
# 测试服务连通性
curl http://localhost:8080/actuator/health
curl http://localhost:3001/api/health
```

## 性能优化

### 数据库优化

1. **配置优化** (docker-compose.production.yml):

```yaml
command:
  - --max_connections=500
  - --innodb_buffer_pool_size=512M
  - --query_cache_size=32M
```

2. **索引优化**: 定期分析慢查询日志

### Redis优化

1. **内存管理**:

```yaml
command:
  - --maxmemory 1gb
  - --maxmemory-policy allkeys-lru
```

2. **持久化策略**: 根据业务需求选择RDB或AOF

### Nginx优化

1. **启用缓存**
2. **Gzip压缩**
3. **连接池优化**

### 应用优化

1. **JVM参数调优**:

```yaml
environment:
  JAVA_OPTS: "-Xms1g -Xmx2g -XX:+UseG1GC"
```

2. **Node.js优化**:

```yaml
environment:
  NODE_OPTIONS: "--max-old-space-size=2048"
```

## 安全加固

### 1. 网络安全

- 使用防火墙限制端口访问
- 配置HTTPS证书
- 启用rate limiting

### 2. 数据库安全

- 使用强密码
- 限制远程访问
- 定期更新数据库版本

### 3. 应用安全

- 定期更新依赖包
- 启用安全headers
- 配置CORS策略

### 4. 容器安全

- 使用非root用户运行
- 扫描镜像漏洞
- 限制容器资源

## 监控告警

### 健康检查端点

- Frontend: http://localhost/health
- Java Backend: http://localhost:8080/actuator/health
- Node Backend: http://localhost:3001/api/health

### 建议监控指标

1. **系统指标**: CPU、内存、磁盘、网络
2. **应用指标**: 响应时间、错误率、吞吐量
3. **数据库指标**: 连接数、查询性能、死锁
4. **缓存指标**: 命中率、内存使用、驱逐率

## 扩展部署

### 水平扩展

```yaml
# 扩展后端服务
docker-compose -f docker-compose.production.yml up -d --scale backend-java=3
```

### 负载均衡

配置Nginx upstream实现负载均衡：

```nginx
upstream backend {
    server backend-java-1:8080;
    server backend-java-2:8080;
    server backend-java-3:8080;
}
```

## 更新升级

### 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose -f docker-compose.production.yml build

# 滚动更新（零停机）
docker-compose -f docker-compose.production.yml up -d --no-deps --build backend-java
```

### 数据库迁移

```bash
# 执行迁移脚本
docker exec -i interview-mysql mysql -u root -p'password' interview_system < migration.sql
```

## 常见问题

### Q: 如何修改服务端口？

A: 修改 `.env.production` 文件中的端口配置，然后重启服务。

### Q: 如何添加HTTPS支持？

A: 配置SSL证书并更新Nginx配置，参考 `production/nginx/nginx-ssl.conf.example`。

### Q: 如何进行数据迁移？

A: 使用mysqldump导出数据，在新环境导入后重启服务。

### Q: 如何扩展存储空间？

A: 修改数据卷挂载路径，迁移数据后重启服务。

## 技术支持

- 📧 Email: support@example.com
- 💬 Issues: https://github.com/mikelinzheyu/interview-system/issues
- 📖 Wiki: https://github.com/mikelinzheyu/interview-system/wiki

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

Made with ❤️ for production deployment
