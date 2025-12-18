# 🚀 Docker 生产环境完整部署指南

**AI面试系统** - Docker化生产环境部署方案

## 📋 目录

1. [系统架构](#系统架构)
2. [前置要求](#前置要求)
3. [部署步骤](#部署步骤)
4. [配置管理](#配置管理)
5. [常见问题](#常见问题)
6. [监控和日志](#监控和日志)
7. [维护和更新](#维护和更新)

---

## 系统架构

### 整体拓扑

```
互联网
   ↓
[Nginx反向代理] (80/443)
   ├── → [前端应用] (Vue + Nginx, 80)
   ├── → [Java后端] (Spring Boot, 8080)
   └── → [Node.js服务] (WebSocket, 3001)

[后端依赖]
├── MySQL (3307)
├── Redis (6380)
├── Storage API (8090)
└── [共享网络] interview-network
```

### 服务清单

| 服务名 | 类型 | 端口 | 用途 |
|--------|------|------|------|
| **Nginx** | 反向代理 | 80/443 | 统一入口、负载均衡 |
| **Frontend** | Web应用 | 80 | Vue.js前端应用 |
| **Backend-Java** | API服务 | 8080 | 核心业务逻辑 |
| **Backend-Node** | WebSocket | 3001 | 实时通信 |
| **MySQL** | 数据库 | 3307 | 持久化存储 |
| **Redis** | 缓存 | 6380 | 会话/缓存 |
| **Storage API** | 存储服务 | 8090 | 文件存储 |

---

## 前置要求

### 硬件需求

- **CPU**: 最少 2核，推荐 4核+
- **内存**: 最少 4GB，推荐 8GB+
- **磁盘**: 最少 10GB，推荐 20GB+
- **网络**: 100Mbps+，支持 IPv4

### 软件需求

```bash
# 检查版本
docker --version      # 需要 20.10+
docker-compose --version  # 需要 2.0+
```

### 访问权限

- 需要在生产服务器上有 root 或 sudo 权限
- 需要能够开放 80/443 端口
- 需要能够访问 Docker Hub（或配置私有仓库）

---

## 部署步骤

### 第1步：准备部署环境

```bash
# 1.1 上传项目文件到生产服务器
# 建议使用 Git Clone 或 SCP
cd /opt/interview-system
# 或
git clone <your-repo-url> /opt/interview-system
cd /opt/interview-system

# 1.2 检查项目结构
ls -la production/
# 应该看到：
# - docker-compose.production.yml
# - .env.production
# - init-db.sql
# - nginx/nginx.conf
# - logs/ (需要创建)
```

### 第2步：配置环境变量

```bash
# 2.1 复制环境变量模板
cp production/.env.example production/.env

# 2.2 编辑生产环境变量（重要！）
vi production/.env
```

**必需修改的配置项：**

```bash
# === 数据库 ===
MYSQL_ROOT_PASSWORD=your_strong_root_password_here
MYSQL_USER=interview_user
MYSQL_PASSWORD=your_strong_db_password_here

# === Redis ===
REDIS_PASSWORD=your_strong_redis_password_here

# === 密钥和API ===
STORAGE_API_KEY=your_unique_storage_api_key
JWT_SECRET=your_long_random_jwt_secret_key

# === AI服务（如果使用）===
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com

# === 域名配置 ===
VITE_API_BASE_URL=/api
```

⚠️ **安全提示**：
- 使用强密码（至少16个字符，包含大小写、数字、特殊符号）
- 不要使用默认密码
- 不要将 `.env` 文件提交到版本控制
- 定期轮换密钥

### 第3步：创建日志目录

```bash
# 3.1 创建日志目录结构
mkdir -p production/logs/{mysql,redis,nginx,backend-java,backend-node,storage-api}

# 3.2 设置权限
chmod 755 production/logs/*
```

### 第4步：构建 Docker 镜像

```bash
# 4.1 进入生产目录
cd production

# 4.2 构建所有镜像（需要5-15分钟）
docker-compose -f docker-compose.production.yml build --no-cache

# 4.3 查看构建结果
docker images | grep interview
```

**预期输出示例：**
```
interview-frontend           latest    abc123def456   2 hours ago   156MB
interview-backend-java       latest    def456ghi789   2 hours ago   512MB
interview-backend-node       latest    ghi789jkl012   2 hours ago   256MB
interview-storage-api        latest    jkl012mno345   2 hours ago   384MB
```

### 第5步：启动容器服务

```bash
# 5.1 启动所有服务
docker-compose -f docker-compose.production.yml up -d

# 5.2 查看服务状态
docker-compose -f docker-compose.production.yml ps

# 5.3 查看服务日志
docker-compose -f docker-compose.production.yml logs -f
```

**预期输出：**
```
NAME                    STATUS      PORTS
interview-mysql         Up 2 min    0.0.0.0:3307->3306/tcp
interview-redis         Up 1 min    0.0.0.0:6380->6379/tcp
interview-storage-api   Up 1 min    0.0.0.0:8090->8080/tcp
interview-backend-java  Up 30s      0.0.0.0:8080->8080/tcp
interview-backend-node  Up 30s      0.0.0.0:3001->3001/tcp
interview-frontend      Up 20s      0.0.0.0:80->80/tcp
```

### 第6步：初始化数据库

```bash
# 6.1 等待MySQL完全启动（约30秒）
sleep 30

# 6.2 检查MySQL健康状态
docker-compose -f docker-compose.production.yml exec mysql \
  mysqladmin -u root -p${MYSQL_ROOT_PASSWORD} ping

# 6.3 初始化数据库（init-db.sql 会自动执行）
# 如果需要手动初始化：
docker-compose -f docker-compose.production.yml exec mysql \
  mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} interview_system \
  < init-db.sql
```

### 第7步：验证服务健康状态

```bash
# 7.1 检查容器健康状态
docker-compose -f docker-compose.production.yml exec frontend curl -f http://localhost

# 7.2 检查API健康状态
docker-compose -f docker-compose.production.yml exec backend-java \
  curl -f http://localhost:8080/actuator/health

# 7.3 检查Node.js服务健康状态
docker-compose -f docker-compose.production.yml exec backend-node \
  curl -f http://localhost:3001/api/health

# 7.4 检查Redis连接
docker-compose -f docker-compose.production.yml exec redis \
  redis-cli -a ${REDIS_PASSWORD} ping
```

### 第8步：配置反向代理（可选 - 已配置）

Nginx 已在 `nginx/nginx.conf` 中配置，提供：
- ✅ 反向代理
- ✅ 速率限制
- ✅ 缓存策略
- ✅ WebSocket 支持
- ✅ GZIP 压缩
- ✅ 安全头部

---

## 配置管理

### 环境变量详解

#### MySQL 配置
```bash
MYSQL_PORT=3307              # 外部访问端口
MYSQL_ROOT_PASSWORD=***      # root密码
MYSQL_USER=interview_user    # 应用用户
MYSQL_PASSWORD=***           # 应用用户密码
```

#### Redis 配置
```bash
REDIS_PORT=6380              # 外部访问端口
REDIS_PASSWORD=***           # Redis密码
```

#### 后端服务配置
```bash
STORAGE_API_PORT=8090        # 存储服务端口
STORAGE_API_KEY=***          # API密钥
BACKEND_JAVA_PORT=8080       # Java后端端口
BACKEND_NODE_PORT=3001       # Node.js端口
```

#### AI服务配置
```bash
JWT_SECRET=***               # JWT签名密钥
OPENAI_API_KEY=sk-***        # OpenAI API密钥
DIFY_WORKFLOW_URL=https://***  # Dify工作流地址
DIFY_APP_ID=app-***          # Dify应用ID
```

### 密钥安全最佳实践

1. **使用强密码生成工具**
   ```bash
   # 生成随机密码
   openssl rand -base64 32
   ```

2. **定期轮换密钥**
   - 每3-6个月轮换一次
   - 更新 `.env` 文件后，重新启动服务
   - ```bash
     docker-compose -f docker-compose.production.yml restart
     ```

3. **保护敏感文件**
   ```bash
   chmod 600 production/.env
   chown root:root production/.env
   ```

---

## 常见问题

### Q1: 如何查看服务日志？

```bash
# 查看所有服务日志
docker-compose -f docker-compose.production.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.production.yml logs -f backend-java

# 查看最后100行日志
docker-compose -f docker-compose.production.yml logs --tail=100
```

### Q2: 如何停止/重启服务？

```bash
# 停止所有服务
docker-compose -f docker-compose.production.yml stop

# 启动所有服务
docker-compose -f docker-compose.production.yml start

# 重启特定服务
docker-compose -f docker-compose.production.yml restart backend-java

# 完全清理（谨慎！会删除容器但保留卷）
docker-compose -f docker-compose.production.yml down
```

### Q3: 数据库连接失败怎么办？

```bash
# 1. 检查MySQL容器状态
docker-compose -f docker-compose.production.yml ps mysql

# 2. 查看MySQL日志
docker-compose -f docker-compose.production.yml logs mysql

# 3. 检查网络连接
docker-compose -f docker-compose.production.yml exec backend-java \
  nc -zv mysql 3306

# 4. 重启MySQL（最后手段）
docker-compose -f docker-compose.production.yml restart mysql
```

### Q4: 端口已被占用怎么办？

```bash
# 查看哪个进程占用了端口
netstat -tlnp | grep :3307

# 修改 .env 文件中的端口
MYSQL_PORT=3308  # 改为其他端口

# 重新启动
docker-compose -f docker-compose.production.yml up -d
```

### Q5: 如何更新应用代码？

```bash
# 1. 更新代码（从Git或其他源）
git pull origin main

# 2. 重新构建镜像
docker-compose -f docker-compose.production.yml build --no-cache

# 3. 重新启动服务
docker-compose -f docker-compose.production.yml up -d

# 4. 查看日志确认正常启动
docker-compose -f docker-compose.production.yml logs -f
```

---

## 监控和日志

### 查看系统资源使用

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用
df -h
du -sh production/

# 查看日志目录大小
du -sh production/logs/*
```

### 日志轮转配置

创建 `production/logrotate.conf`：

```bash
/opt/interview-system/production/logs/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    postrotate
        docker-compose -f /opt/interview-system/production/docker-compose.production.yml exec nginx nginx -s reload
    endscript
}
```

使用 logrotate：
```bash
# 测试
logrotate -d production/logrotate.conf

# 添加到cron（每天2点执行）
2 2 * * * logrotate -f /opt/interview-system/production/logrotate.conf
```

### 监控检查清单

```bash
# 每天检查这些指标
docker-compose -f docker-compose.production.yml ps        # 服务状态
docker-compose -f docker-compose.production.yml logs | tail -50  # 最新日志
df -h                                      # 磁盘使用
docker stats --no-stream                  # 资源使用
```

---

## 维护和更新

### 备份策略

```bash
# 备份数据库
docker-compose -f docker-compose.production.yml exec mysql \
  mysqldump -u root -p${MYSQL_ROOT_PASSWORD} interview_system > backup-$(date +%Y%m%d).sql

# 备份Redis数据
docker-compose -f docker-compose.production.yml exec redis \
  redis-cli -a ${REDIS_PASSWORD} BGSAVE

# 备份卷数据
docker run --rm -v interview_mysql_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mysql_backup_$(date +%Y%m%d).tar.gz -C /data .
```

### 灾难恢复

```bash
# 恢复数据库
docker-compose -f docker-compose.production.yml exec mysql \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} interview_system < backup-YYYYMMDD.sql

# 恢复Redis
docker-compose -f docker-compose.production.yml exec redis \
  redis-cli -a ${REDIS_PASSWORD} BGREWRITEAOF
```

### 升级流程

```bash
# 1. 备份数据
# （执行上面的备份命令）

# 2. 停止服务
docker-compose -f docker-compose.production.yml stop

# 3. 更新代码和配置
git pull origin main
# 编辑 .env 如需要

# 4. 构建新镜像
docker-compose -f docker-compose.production.yml build --no-cache

# 5. 启动服务
docker-compose -f docker-compose.production.yml up -d

# 6. 监控日志
docker-compose -f docker-compose.production.yml logs -f

# 7. 如果出问题，回滚
docker-compose -f docker-compose.production.yml down
# （恢复前一个版本）
```

---

## 常用命令参考

```bash
# 启动/停止/重启
docker-compose -f docker-compose.production.yml up -d
docker-compose -f docker-compose.production.yml stop
docker-compose -f docker-compose.production.yml restart

# 查看状态
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f

# 进入容器
docker-compose -f docker-compose.production.yml exec mysql bash
docker-compose -f docker-compose.production.yml exec backend-java bash

# 清理
docker system prune -a  # 删除未使用的镜像
docker volume prune     # 删除未使用的卷

# 检查资源
docker stats
df -h
```

---

## 部署清单

使用此清单确保所有步骤都已完成：

- [ ] Docker 和 Docker Compose 已安装且版本满足要求
- [ ] 项目文件已上传到生产服务器
- [ ] `.env` 文件已创建并配置所有必需的值
- [ ] 日志目录已创建
- [ ] Docker 镜像已成功构建
- [ ] 所有容器已启动
- [ ] 数据库已初始化
- [ ] 健康检查全部通过
- [ ] 应用程序在浏览器中可以访问
- [ ] 日志表明没有错误
- [ ] 备份策略已制定

---

## 获取帮助

如遇到问题，请检查：

1. **容器日志**：`docker-compose logs -f <service-name>`
2. **Docker 事件**：`docker events`
3. **系统日志**：`journalctl -xe`
4. **DNS 解析**：`docker-compose exec <service> nslookup <hostname>`
5. **网络连接**：`docker-compose exec <service> nc -zv <host> <port>`

---

**最后更新**: 2025-12-15
**维护者**: AI Interview System Team
