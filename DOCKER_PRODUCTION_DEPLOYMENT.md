# 🚀 AI面试系统 - 全Docker生产环境部署指南

## 📋 目录
1. [系统要求](#系统要求)
2. [快速开始](#快速开始)
3. [详细部署步骤](#详细部署步骤)
4. [配置说明](#配置说明)
5. [监控和维护](#监控和维护)
6. [故障排查](#故障排查)

---

## 系统要求

### 硬件要求
- **CPU**: 最少2核，建议4核+
- **内存**: 最少4GB，建议8GB+
- **磁盘**: 最少20GB可用空间
- **网络**: 稳定的网络连接

### 软件要求
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **操作系统**: Linux/macOS/Windows (WSL2)

### 安装验证
```bash
docker --version       # Docker version 20.10.0 或更高
docker-compose --version  # Docker Compose version 2.0.0 或更高
```

---

## 快速开始

### 一键部署 (仅需5分钟)

**Linux/macOS:**
```bash
cd interview-system
cp .env.docker .env
chmod +x docker-deploy-prod.sh
./docker-deploy-prod.sh start
```

**Windows PowerShell:**
```powershell
cd interview-system
Copy-Item .env.docker -Destination .env
.\docker-deploy-prod.ps1 -Action start
```

**Windows CMD:**
```batch
cd interview-system
copy .env.docker .env
docker-deploy-prod.bat start
```

### 部署完成后验证

访问以下地址确认部署成功：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端应用 | http://localhost | Vue3 应用界面 |
| 后端API | http://localhost:8080/api/health | 健康检查端点 |
| Redis | localhost:6379 | Redis缓存服务 |

---

## 详细部署步骤

### 步骤1：准备环境配置

#### 1.1 复制环境配置文件
```bash
cp .env.docker .env
```

#### 1.2 编辑生产环境配置
编辑 `.env` 文件，修改以下关键配置：

```bash
# 应用信息
APP_ENV=production
COMPOSE_PROJECT_NAME=interview-system

# 端口配置 (根据需要修改)
FRONTEND_PORT=80
FRONTEND_HTTPS_PORT=443
BACKEND_PORT=8080
REDIS_PORT=6379

# API配置
VITE_API_BASE_URL=http://interview-backend:3001/api

# Dify AI配置 (必须配置)
DIFY_API_KEY=your-actual-dify-api-key
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_URL=your-workflow-url

# 安全配置 (生产环境必须修改)
JWT_SECRET=your-strong-jwt-secret-key-here
JWT_EXPIRATION=86400000

# 时区
TZ=Asia/Shanghai
```

**⚠️ 安全提示：**
- 生成强密码用于 `JWT_SECRET`：
  ```bash
  openssl rand -base64 32
  ```
- 不要在版本控制中提交 `.env` 文件
- 定期轮换密钥

### 步骤2：配置SSL证书 (可选但推荐)

#### 2.1 使用自签名证书 (开发/测试)
```bash
mkdir -p nginx/ssl
openssl req -x509 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -days 365 -nodes \
  -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Interview/CN=localhost"
```

#### 2.2 使用真实证书 (生产环境推荐)
1. 从证书颁发机构获取证书
2. 将证书放到 `nginx/ssl/cert.pem`
3. 将私钥放到 `nginx/ssl/key.pem`
4. 更新 `docker-compose.yml` 中的 SSL 配置

### 步骤3：检查项目结构

验证以下文件和目录存在：
```
interview-system/
├── docker-compose.yml          ✓ 必须
├── .env.docker                 ✓ 必须
├── backend/
│   ├── Dockerfile              ✓ 必须
│   ├── package.json            ✓ 必须
│   └── mock-server.js          ✓ 必须
├── frontend/
│   ├── Dockerfile              ✓ 必须
│   ├── package.json            ✓ 必须
│   └── vite.config.js          ✓ 必须
├── nginx/
│   ├── proxy.conf              ✓ 必须
│   └── ssl/                    # 创建 (证书文件)
└── logs/                        # 自动创建 (日志目录)
```

### 步骤4：构建Docker镜像

#### 4.1 构建所有镜像
```bash
./docker-deploy-prod.sh build
# 或使用Docker Compose直接
docker-compose --env-file .env build
```

**镜像构建时间预期：**
- 后端镜像：2-3分钟
- 前端镜像：3-5分钟
- 总计：5-8分钟

#### 4.2 验证镜像构建
```bash
docker images | grep interview-system
# 输出应该包含：
# interview-system/backend:latest
# interview-system/frontend:latest
```

### 步骤5：启动所有服务

#### 5.1 启动容器
```bash
./docker-deploy-prod.sh start
# 或
docker-compose --env-file .env up -d
```

#### 5.2 等待服务启动
```bash
# 实时查看服务日志
./docker-deploy-prod.sh logs

# 或只看特定服务
./docker-deploy-prod.sh logs backend
./docker-deploy-prod.sh logs frontend
```

**启动顺序和预期时间：**
1. Redis 容器启动 (5-10秒)
2. 后端容器启动 (15-30秒)
3. 前端容器启动 (10-20秒)
4. **总计：30-60秒**

### 步骤6：验证部署

#### 6.1 检查容器状态
```bash
./docker-deploy-prod.sh status
# 所有容器应该显示 "Up" 和 "healthy"
```

#### 6.2 验证健康检查
```bash
# 后端健康检查
curl http://localhost:8080/api/health

# 前端健康检查
curl http://localhost/health

# Redis连接
docker-compose --env-file .env exec -T redis redis-cli ping
```

#### 6.3 访问应用
- 打开浏览器访问: http://localhost
- 应该看到Vue应用的首页
- 打开开发者工具检查API请求
- API请求应该返回 HTTP 200

#### 6.4 完整验证脚本
```bash
./docker-deploy-prod.sh verify
```

---

## 配置说明

### Docker Compose 服务配置

#### 后端服务 (Node.js Mock API)
```yaml
backend:
  image: interview-system/backend:latest
  ports:
    - "8080:3001"  # 宿主机:容器
  environment:
    NODE_ENV: production
    PORT: 3001
    DIFY_API_KEY: ${DIFY_API_KEY}
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
    interval: 30s
    timeout: 10s
    retries: 5
```

**说明：**
- 端口映射：外部访问 8080 → 容器内 3001
- 健康检查：每30秒检查一次
- 日志路径：`logs/backend/`
- 重启策略：除非停止，否则自动重启

#### 前端服务 (Nginx + Vue3)
```yaml
frontend:
  image: interview-system/frontend:latest
  ports:
    - "80:80"      # HTTP
    - "443:443"    # HTTPS
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost"]
```

**说明：**
- 多阶段构建：Node编译 → Nginx部署
- 静态资源优化：Gzip压缩、缓存处理
- SSL支持：配置SSL证书后自动启用HTTPS

#### Redis缓存服务
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data  # 数据持久化
```

**说明：**
- 使用Alpine版本以减小镜像大小
- 配置持久化：RDB + AOF
- 内存限制：256MB
- 淘汰策略：LRU

### 网络配置

所有容器连接到 `interview-network` 网络：
```
interview-network (bridge)
├── interview-backend (3001)
├── interview-frontend (80/443)
├── interview-redis (6379)
└── interview-proxy (80/443) [可选]
```

**网络访问：**
- 容器内部通信：使用服务名 (如 `http://interview-backend:3001`)
- 外部访问：使用宿主机IP和映射端口 (如 `http://localhost:8080`)

### 卷 (Volumes) 配置

| 卷名 | 挂载点 | 用途 | 持久化 |
|------|--------|------|--------|
| `redis_data` | Redis `/data` | 缓存数据 | ✓ 是 |
| `logs/backend` | 后端日志 | 应用日志 | ✓ 是 |
| `logs/frontend` | Nginx日志 | 访问日志 | ✓ 是 |
| `logs/redis` | Redis日志 | 日志输出 | ✓ 是 |

---

## 监控和维护

### 日志管理

#### 查看实时日志
```bash
# 所有服务日志
./docker-deploy-prod.sh logs

# 特定服务日志
./docker-deploy-prod.sh logs backend
./docker-deploy-prod.sh logs frontend
./docker-deploy-prod.sh logs redis

# 最后N行日志
./docker-deploy-prod.sh logs --tail=100
```

#### 日志位置
```
logs/
├── backend/          # Node.js应用日志
├── frontend/         # Nginx访问日志
└── redis/            # Redis日志
```

#### 日志级别配置
编辑 `.env` 修改日志级别：
```bash
LOG_LEVEL=INFO      # INFO, DEBUG, WARN, ERROR
```

### 性能监控

#### 容器资源使用
```bash
# 实时监控
docker stats

# 查看特定容器
docker stats interview-backend interview-frontend interview-redis
```

#### 查看容器信息
```bash
docker ps -a
docker inspect interview-backend
```

### 定期维护

#### 备份数据
```bash
# 备份Redis数据
docker cp interview-redis:/data ./backup/redis_backup_$(date +%Y%m%d)

# 备份日志
tar -czf backup/logs_$(date +%Y%m%d).tar.gz logs/
```

#### 清理过期数据
```bash
# 删除未使用的镜像
docker image prune -a

# 删除未使用的卷
docker volume prune

# 清理日志
truncate -s 0 logs/*/*.log
```

#### 更新镜像
```bash
# 重新构建镜像
docker-compose --env-file .env build --no-cache

# 使用新镜像重启
docker-compose --env-file .env up -d
```

---

## 故障排查

### 常见问题

#### 问题1：服务无法启动

**症状：** 容器启动后立即退出

**排查步骤：**
```bash
# 查看容器日志
docker logs interview-backend
docker logs interview-frontend

# 检查容器状态
docker ps -a

# 完整诊断
./docker-deploy-prod.sh logs
```

**常见原因和解决方案：**
1. **环境变量配置错误**
   - 检查 `.env` 文件是否存在
   - 检查必要的环境变量是否设置

2. **端口被占用**
   ```bash
   # 检查端口
   netstat -tuln | grep -E ':(80|443|8080|6379)'
   # 修改 .env 中的端口
   ```

3. **磁盘空间不足**
   ```bash
   df -h
   # 清理：docker system prune -a
   ```

#### 问题2：后端API无法访问

**症状：** 访问 http://localhost:8080/api/health 返回连接被拒绝

**排查步骤：**
```bash
# 检查后端容器状态
docker ps | grep interview-backend

# 查看后端日志
./docker-deploy-prod.sh logs backend

# 测试容器内部连接
docker-compose --env-file .env exec backend curl http://localhost:3001/api/health

# 检查网络连接
docker network inspect interview-network
```

**常见原因：**
1. **后端启动失败** → 查看日志找错误信息
2. **健康检查失败** → 等待更长时间，增加 `start_period`
3. **网络问题** → 重启容器：`./docker-deploy-prod.sh restart`

#### 问题3：前端无法访问

**症状：** 访问 http://localhost 无响应

**排查步骤：**
```bash
# 检查Nginx容器
docker ps | grep interview-frontend

# 查看Nginx日志
./docker-deploy-prod.sh logs frontend

# 测试Nginx响应
docker-compose --env-file .env exec frontend curl -I http://localhost

# 检查前端构建
docker images | grep interview-system/frontend
```

**常见原因：**
1. **前端构建失败** → 检查构建日志中的错误
2. **Nginx配置错误** → 检查 `nginx.conf` 语法
3. **依赖安装失败** → 清理并重建：`docker-compose build --no-cache frontend`

#### 问题4：Redis连接失败

**症状：** 后端日志中显示 Redis 连接错误

**排查步骤：**
```bash
# 检查Redis容器
docker ps | grep interview-redis

# 测试Redis连接
docker-compose --env-file .env exec -T redis redis-cli ping

# 查看Redis日志
./docker-deploy-prod.sh logs redis

# 检查Redis内存使用
docker-compose --env-file .env exec -T redis redis-cli info memory
```

**常见原因：**
1. **Redis未启动** → `./docker-deploy-prod.sh restart`
2. **内存满** → 清理过期数据：`redis-cli FLUSHDB`
3. **连接字符串错误** → 检查 `.env` 中的 `REDIS_HOST`

#### 问题5：API请求返回CORS错误

**症状：** 浏览器控制台显示 CORS 错误

**解决方案：**
```bash
# 检查后端是否配置CORS
docker logs interview-backend | grep -i cors

# 更新后端的CORS配置
# 编辑 backend/mock-server.js，添加允许的来源
```

### 诊断命令速查

```bash
# 检查所有容器状态
docker-compose --env-file .env ps

# 查看网络配置
docker network inspect interview-network

# 查看卷配置
docker volume ls | grep interview

# 完整系统诊断
docker system df

# 容器日志导出
docker-compose --env-file .env logs > container_logs.txt

# 查看容器进程
docker top interview-backend
docker top interview-frontend

# 测试服务连接
docker-compose --env-file .env exec backend curl http://interview-frontend/health
```

### 重置和恢复

#### 软重启 (保留数据)
```bash
./docker-deploy-prod.sh restart
```

#### 硬重启 (清除容器，保留数据)
```bash
./docker-deploy-prod.sh stop
docker-compose --env-file .env up -d
```

#### 完全重置 (删除所有数据)
```bash
./docker-deploy-prod.sh clean
./docker-deploy-prod.sh start
```

---

## 性能优化建议

### Docker配置优化
1. **增加Docker内存限制**
   - Windows Docker: Settings → Resources → Memory 调到 4GB+

2. **启用BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   ```

3. **使用本地镜像源**
   ```bash
   # 编辑 /etc/docker/daemon.json
   {
     "registry-mirrors": [
       "https://mirror.aliyuncs.com"
     ]
   }
   ```

### 应用优化
1. **Redis内存优化**
   - 定期清理过期数据
   - 调整 `maxmemory-policy`

2. **Nginx性能优化**
   - 启用 Gzip 压缩 ✓ (已配置)
   - 配置缓存策略 ✓ (已配置)
   - 调整工作进程数

3. **后端优化**
   - 设置合理的连接池大小
   - 优化数据库查询

### 扩展性考虑
1. **负载均衡**
   ```bash
   # 使用Docker Swarm或Kubernetes
   # 根据需要扩展容器实例
   ```

2. **数据库持久化**
   ```bash
   # 添加PostgreSQL/MySQL容器
   # 配置数据卷持久化
   ```

3. **外部监控**
   ```bash
   # 集成Prometheus + Grafana
   # 设置告警和通知
   ```

---

## 生产环境检查清单

部署前请确保所有项目都已完成：

- [ ] Docker和Docker Compose已安装并验证版本
- [ ] `.env` 文件已配置所有必需的变量
- [ ] `DIFY_API_KEY` 和其他API密钥已正确设置
- [ ] `JWT_SECRET` 已修改为强密钥
- [ ] SSL证书已配置 (如需要HTTPS)
- [ ] 系统资源充足 (CPU、内存、磁盘)
- [ ] 网络配置正确，所需端口已开放
- [ ] 备份计划已制定
- [ ] 监控告警已设置
- [ ] 文档和维护手册已准备

---

## 获取帮助

如遇到问题，请按以下顺序排查：

1. **查看日志** → `./docker-deploy-prod.sh logs`
2. **检查状态** → `./docker-deploy-prod.sh status`
3. **查看此文档** → 故障排查章节
4. **重建镜像** → `docker-compose build --no-cache`
5. **完全重置** → `./docker-deploy-prod.sh clean && ./docker-deploy-prod.sh start`

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | Docker Compose配置 |
| `.env.docker` | 环境变量模板 |
| `docker-deploy-prod.sh` | 部署脚本 (Linux/macOS) |
| `docker-deploy-prod.ps1` | 部署脚本 (Windows PowerShell) |
| `docker-deploy-prod.bat` | 部署脚本 (Windows CMD) |
| `nginx/proxy.conf` | Nginx代理配置 |
| `backend/Dockerfile` | 后端镜像定义 |
| `frontend/Dockerfile` | 前端镜像定义 |

---

**最后更新：** 2025-10-26
**版本：** 1.0.0
