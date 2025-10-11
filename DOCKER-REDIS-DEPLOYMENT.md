# 🐳 Docker 生产环境 Redis 部署指南

## 📋 概述

本指南将帮助您在现有的 Docker Compose 生产环境中部署 Redis 会话存储服务。

---

## ✅ 已完成的准备工作

您的项目已经包含：

1. ✅ **Docker Compose 配置** - `production/docker-compose.yml` 中已定义 Redis 服务
2. ✅ **Redis 配置文件** - `production/redis/redis.conf` 已创建
3. ✅ **环境变量配置** - `production/.env` 已更新
4. ✅ **后端 Redis 客户端** - `backend/redis-client.js` 已实现
5. ✅ **会话存储 API** - 5个 REST API 端点已实现

---

## 🚀 部署步骤

### 步骤 1: 启动 Docker Desktop

**必须先启动 Docker Desktop**，否则无法运行 docker-compose 命令。

**启动方法**:
- Windows: 开始菜单 → Docker Desktop
- 或双击: `C:\Program Files\Docker\Docker\Docker Desktop.exe`

**等待**: 右下角 Docker 图标变为正常状态（约 30-60 秒）

---

### 步骤 2: 启动 Redis 服务

打开命令提示符或 PowerShell，进入项目目录：

```bash
cd D:\code7\interview-system\production
```

**仅启动 Redis 服务**:
```bash
docker-compose up -d redis
```

**或启动所有服务**（包括 MySQL、后端、前端、Redis）:
```bash
docker-compose up -d
```

**查看启动日志**:
```bash
docker-compose logs -f redis
```

**预期输出**:
```
redis_1  | * Ready to accept connections
```

---

### 步骤 3: 验证 Redis 运行

#### 方法 1: 使用 docker-compose ps

```bash
docker-compose ps
```

**预期输出**:
```
Name                   Command               State    Ports
----------------------------------------------------------------
interview-redis     docker-entrypoint.sh ...   Up     0.0.0.0:6379->6379/tcp
```

#### 方法 2: 使用 Redis CLI

```bash
# 进入 Redis 容器
docker-compose exec redis redis-cli

# 测试连接
127.0.0.1:6379> ping
PONG

# 查看信息
127.0.0.1:6379> info server

# 退出
127.0.0.1:6379> exit
```

#### 方法 3: 使用 healthcheck

```bash
docker inspect interview-redis --format='{{.State.Health.Status}}'
```

**预期输出**: `healthy`

---

### 步骤 4: 配置后端连接 Redis

#### 更新后端环境变量

如果您使用 `backend/.env` 文件（开发环境），添加以下配置：

```env
# Redis 配置（Docker 环境）
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_SESSION_TTL=604800
```

**注意**:
- 在 Docker Compose 网络中，使用服务名 `redis` 而不是 `localhost`
- 如果后端不在 Docker 中运行，使用 `localhost`

#### 重启后端服务

**如果后端在 Docker 中**:
```bash
docker-compose restart backend
```

**如果后端在本地运行**（当前情况）:

1. 停止当前后端（Ctrl+C 或 kill 进程）
2. 更新 `backend/.env`:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```
3. 重新启动:
   ```bash
   "C:\Program Files\nodejs\node.exe" "D:\code7\interview-system\backend\mock-server.js"
   ```

---

### 步骤 5: 验证后端连接 Redis

#### 查看后端日志

启动后端后，应该看到：

```
🔄 正在初始化 Redis 客户端...
✅ Redis 连接成功
🟢 Redis 客户端就绪
🔧 Redis 配置: {
  host: 'localhost',
  port: 6379,
  db: 0,
  sessionTTL: '604800秒 (7天)'
}
```

#### 运行连接测试

```bash
"C:\Program Files\nodejs\node.exe" "D:\code7\interview-system\test-redis-connection.js"
```

**预期输出**:
```
✅ Redis 连接成功!
✅ PING 测试通过
✅ 写入测试数据成功
✅ 读取测试数据成功，数据一致
✅ TTL 设置成功
✅ 清理测试数据完成
🎉 所有测试通过! Redis 服务器工作正常!
```

---

### 步骤 6: 测试会话存储功能

运行会话存储集成测试：

```bash
"C:\Program Files\nodejs\node.exe" "D:\code7\interview-system\test-redis-session.js"
```

**预期变化**:

**之前（内存模式）**:
```
💾 会话已保存到内存: session-xxx (Redis不可用)
```

**现在（Redis 模式）**:
```
💾 会话已保存到 Redis: session-xxx
```

---

## 🔧 Docker Compose 管理命令

### 基本命令

```bash
# 进入 production 目录
cd D:\code7\interview-system\production

# 启动所有服务
docker-compose up -d

# 仅启动 Redis
docker-compose up -d redis

# 停止 Redis
docker-compose stop redis

# 重启 Redis
docker-compose restart redis

# 查看 Redis 日志
docker-compose logs -f redis

# 查看所有服务状态
docker-compose ps

# 停止所有服务
docker-compose down

# 停止并删除数据卷（慎用！会删除所有数据）
docker-compose down -v
```

### Redis 管理命令

```bash
# 进入 Redis CLI
docker-compose exec redis redis-cli

# 查看 Redis 信息
docker-compose exec redis redis-cli info

# 查看内存使用
docker-compose exec redis redis-cli info memory

# 查看所有会话键
docker-compose exec redis redis-cli keys "interview:session:*"

# 查看特定会话
docker-compose exec redis redis-cli get "interview:session:xxx"

# 删除所有会话（慎用）
docker-compose exec redis redis-cli DEL interview:session:*
```

---

## 📊 Redis 数据持久化

### RDB 快照

配置在 `production/redis/redis.conf`:

```conf
save 900 1      # 900秒内至少1个key改变
save 300 10     # 300秒内至少10个key改变
save 60 10000   # 60秒内至少10000个key改变
```

**数据位置**: Docker 卷 `redis_data` → `/data/dump.rdb`

### AOF 日志

```conf
appendonly yes
appendfsync everysec
```

**数据位置**: Docker 卷 `redis_data` → `/data/appendonly.aof`

### 备份数据

```bash
# 手动触发 RDB 保存
docker-compose exec redis redis-cli SAVE

# 复制 RDB 文件到主机
docker cp interview-redis:/data/dump.rdb ./backup/

# 查看 AOF 文件
docker-compose exec redis cat /data/appendonly.aof
```

### 恢复数据

```bash
# 1. 停止 Redis
docker-compose stop redis

# 2. 复制备份文件到容器
docker cp ./backup/dump.rdb interview-redis:/data/

# 3. 重启 Redis
docker-compose start redis
```

---

## 🔐 可选：配置 Redis 密码

### 1. 更新 Redis 配置

编辑 `production/redis/redis.conf`:

```conf
# 取消注释并设置密码
requirepass your_strong_password_here
```

### 2. 更新环境变量

编辑 `production/.env`:

```env
REDIS_PASSWORD=your_strong_password_here
```

### 3. 重启 Redis

```bash
docker-compose restart redis
```

### 4. 测试连接

```bash
# 使用密码连接
docker-compose exec redis redis-cli -a your_strong_password_here ping
```

---

## 📈 监控和维护

### 查看实时统计

```bash
# 实时监控命令
docker-compose exec redis redis-cli monitor

# 查看慢查询日志
docker-compose exec redis redis-cli slowlog get 10

# 查看客户端连接
docker-compose exec redis redis-cli client list
```

### 内存使用监控

```bash
# 查看内存信息
docker-compose exec redis redis-cli info memory

# 查看键数量
docker-compose exec redis redis-cli DBSIZE

# 查看大键
docker-compose exec redis redis-cli --bigkeys
```

### 性能优化建议

1. **内存限制** (已配置): 256MB
2. **淘汰策略** (已配置): allkeys-lru
3. **持久化**: AOF + RDB 双重保障
4. **连接池**: 后端已实现

---

## 🐛 故障排除

### 问题 1: Docker Desktop 未运行

**错误信息**:
```
error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

**解决方案**:
1. 启动 Docker Desktop
2. 等待右下角图标变为正常
3. 重新运行 docker-compose 命令

### 问题 2: 端口 6379 被占用

**检查占用**:
```bash
netstat -ano | findstr :6379
```

**解决方案A - 停止占用进程**:
```bash
taskkill /PID <进程ID> /F
```

**解决方案B - 修改端口**:

编辑 `production/docker-compose.yml`:
```yaml
ports:
  - "6380:6379"  # 主机端口改为 6380
```

编辑 `production/.env`:
```env
REDIS_PORT=6380
```

### 问题 3: Redis 容器启动失败

**查看日志**:
```bash
docker-compose logs redis
```

**常见原因**:
- 配置文件语法错误
- 内存不足
- 磁盘空间不足

**解决方案**:
```bash
# 删除容器重新创建
docker-compose rm -f redis
docker-compose up -d redis
```

### 问题 4: 后端无法连接 Redis

**检查网络**:
```bash
# 查看 Docker 网络
docker network ls

# 检查 Redis 在哪个网络
docker inspect interview-redis | findstr NetworkMode
```

**确保后端使用正确的主机名**:
- Docker 内: `REDIS_HOST=redis`
- 本地运行: `REDIS_HOST=localhost`

### 问题 5: 数据丢失

**原因**:
- 使用 `docker-compose down -v` 删除了数据卷
- AOF/RDB 未启用

**预防**:
- 使用 `docker-compose stop` 而不是 `down`
- 定期备份数据
- 启用 AOF + RDB（已配置）

---

## 📚 完整的 Docker 架构

```
interview-system/
├── production/
│   ├── docker-compose.yml         # 服务编排
│   ├── .env                        # 环境变量
│   ├── redis/
│   │   └── redis.conf             # Redis 配置 ✅ 新增
│   ├── nginx/
│   │   └── nginx.conf             # Nginx 配置
│   └── logs/                       # 日志目录
├── backend/
│   ├── Dockerfile                  # 后端镜像
│   ├── redis-client.js            # Redis 客户端 ✅ 新增
│   └── mock-server.js             # 后端服务（含会话API）✅ 已更新
├── frontend/
│   └── Dockerfile                  # 前端镜像
└── test-redis-connection.js       # Redis 测试脚本 ✅ 新增
```

---

## 🎯 生产环境最佳实践

### 1. 安全配置

- ✅ 设置 Redis 密码
- ✅ 限制网络访问（仅 Docker 内部网络）
- ✅ 禁用危险命令（FLUSHDB, FLUSHALL）

### 2. 性能配置

- ✅ 设置最大内存限制
- ✅ 配置淘汰策略
- ✅ 启用 AOF 持久化

### 3. 监控和备份

- ⏸️ 配置监控告警
- ⏸️ 设置自动备份
- ⏸️ 定期测试恢复流程

### 4. 高可用性

- ⏸️ Redis Sentinel（主从复制）
- ⏸️ Redis Cluster（分片集群）
- ⏸️ 负载均衡

---

## 📋 部署检查清单

完成以下检查后，Redis 即可投入生产使用：

- [ ] Docker Desktop 已启动
- [ ] Redis 服务已运行（`docker-compose ps`）
- [ ] Redis 健康检查通过（`docker inspect`）
- [ ] 后端成功连接 Redis（查看日志）
- [ ] 连接测试通过（`test-redis-connection.js`）
- [ ] 会话存储测试通过（`test-redis-session.js`）
- [ ] 数据持久化已启用（AOF + RDB）
- [ ] 设置了 Redis 密码（推荐）
- [ ] 配置了备份策略（推荐）
- [ ] 监控已就绪（推荐）

---

## 🚀 快速开始脚本

创建 `production/start-redis.bat`（Windows）:

```batch
@echo off
echo 🐳 启动 Redis 服务...
cd D:\code7\interview-system\production
docker-compose up -d redis
echo.
echo ✅ Redis 服务已启动
echo 📝 查看日志: docker-compose logs -f redis
echo 🧪 测试连接: node ..\test-redis-connection.js
pause
```

创建 `production/start-redis.sh`（Linux/Mac）:

```bash
#!/bin/bash
echo "🐳 启动 Redis 服务..."
cd "$(dirname "$0")"
docker-compose up -d redis
echo ""
echo "✅ Redis 服务已启动"
echo "📝 查看日志: docker-compose logs -f redis"
echo "🧪 测试连接: node ../test-redis-connection.js"
```

---

## 📞 需要帮助？

1. **查看日志**: `docker-compose logs redis`
2. **运行测试**: `node test-redis-connection.js`
3. **检查状态**: `docker-compose ps`
4. **查看文档**: 本文件

---

**创建时间**: 2025-10-10
**适用环境**: Docker Compose 生产环境
**Redis 版本**: 7-alpine
**状态**: ✅ 准备就绪，等待 Docker Desktop 启动
