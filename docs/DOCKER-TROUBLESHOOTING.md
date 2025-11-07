# Docker部署故障排查指南

## 目录

1. [启动问题](#启动问题)
2. [连接问题](#连接问题)
3. [性能问题](#性能问题)
4. [数据问题](#数据问题)
5. [日志分析](#日志分析)

---

## 启动问题

### 症状1: 容器立即退出

**错误消息:**
```
interview-backend exited with code 1
```

**可能原因:**
- 依赖服务未就绪
- 环境变量配置错误
- 端口冲突

**解决步骤:**

```bash
# 1. 查看容器日志
docker-compose --env-file .env.docker logs backend

# 2. 检查环境变量
docker-compose --env-file .env.docker config | grep -A 10 "services"

# 3. 查看是否有运行时错误
docker-compose --env-file .env.docker up backend  # 不使用-d，查看实时输出

# 4. 检查依赖
docker-compose --env-file .env.docker logs redis  # Redis是否启动
```

### 症状2: 构建失败

**错误消息:**
```
failed to solve: rpc error: code = Unknown desc = failed to fetch remote
```

**可能原因:**
- 网络连接问题
- 镜像源不可用

**解决步骤:**

```bash
# 1. 检查网络连接
ping docker.io

# 2. 清空Docker缓存
docker system prune -a

# 3. 重新构建 (添加详细输出)
docker-compose --env-file .env.docker build --verbose backend

# 4. 检查DNS
docker run --rm alpine nslookup registry-1.docker.io

# 5. 配置国内镜像源 (如需要)
# 编辑 ~/.docker/daemon.json
{
  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn/"]
}
sudo systemctl restart docker
```

### 症状3: 端口已被占用

**错误消息:**
```
bind: address already in use
Error response from daemon: driver failed to program VXLAN endpoints into the kernel
```

**解决步骤:**

```bash
# 1. Linux/macOS - 查找占用端口的进程
lsof -i :80
lsof -i :3001
lsof -i :6379

# 2. Windows - 查找占用端口的进程
netstat -ano | findstr :80
netstat -ano | findstr :3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 80).OwningProcess

# 3. 停止占用进程
kill -9 <PID>        # Linux/macOS
taskkill /PID <PID> /F  # Windows

# 4. 或修改配置文件中的端口
# 编辑 .env.docker
FRONTEND_PORT=8080
BACKEND_PORT=8081
REDIS_PORT=6380

# 5. 重启服务
./docker-deploy-prod.sh restart
```

### 症状4: 健康检查失败

**错误消息:**
```
container name "interview-backend" is unhealthy
failed health check
```

**解决步骤:**

```bash
# 1. 查看容器详细信息
docker inspect interview-backend | grep -A 10 "Health"

# 2. 手动测试健康检查端点
docker-compose --env-file .env.docker exec backend \
  curl -f http://localhost:3001/api/health

# 3. 查看详细日志
docker-compose --env-file .env.docker logs --tail=50 backend

# 4. 检查后端是否正确启动
docker-compose --env-file .env.docker exec backend ps aux

# 5. 增加等待时间 (在docker-compose.yml中)
# healthcheck:
#   start_period: 60s  # 增加为60秒

docker-compose --env-file .env.docker up -d --force-recreate
```

---

## 连接问题

### 症状1: 前端无法连接后端

**错误信息在前端控制台:**
```
GET http://localhost:8080/api/... net::ERR_CONNECTION_REFUSED
```

**解决步骤:**

```bash
# 1. 检查后端是否运行
docker-compose --env-file .env.docker ps backend

# 2. 测试后端连接
curl http://localhost:8080/api/health

# 3. 检查API基础URL配置
docker-compose --env-file .env.docker config | grep "VITE_API_BASE_URL"

# 4. 检查网络连接
docker-compose --env-file .env.docker exec frontend \
  curl http://interview-backend:3001/api/health

# 5. 查看Nginx日志
docker-compose --env-file .env.docker logs frontend

# 6. 检查防火墙
sudo ufw status
sudo ufw allow 8080/tcp
```

### 症状2: 前端无法加载

**错误:**
```
Connection refused
HTTP 502 Bad Gateway
```

**解决步骤:**

```bash
# 1. 检查前端容器
docker-compose --env-file .env.docker ps frontend

# 2. 测试前端HTTP端口
curl -v http://localhost/health

# 3. 查看前端日志
docker-compose --env-file .env.docker logs frontend

# 4. 验证Nginx配置
docker-compose --env-file .env.docker exec frontend nginx -t

# 5. 检查distfiles是否存在
docker-compose --env-file .env.docker exec frontend \
  ls -la /usr/share/nginx/html

# 6. 重建前端镜像
docker-compose --env-file .env.docker build --no-cache frontend
docker-compose --env-file .env.docker up -d frontend
```

### 症状3: Redis连接失败

**错误:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
Could not connect to Redis
```

**解决步骤:**

```bash
# 1. 检查Redis容器
docker-compose --env-file .env.docker ps redis

# 2. 测试Redis连接
docker-compose --env-file .env.docker exec redis redis-cli ping

# 3. 检查Redis日志
docker-compose --env-file .env.docker logs redis

# 4. 验证Redis配置
docker-compose --env-file .env.docker exec redis \
  redis-cli CONFIG GET '*'

# 5. 检查后端Redis连接
docker-compose --env-file .env.docker exec backend \
  node -e "const redis = require('redis'); const client = redis.createClient({host: 'interview-redis'}); client.ping((err, reply) => { console.log(err, reply); process.exit(); })"

# 6. 重启Redis
docker-compose --env-file .env.docker restart redis
```

### 症状4: 容器间通信问题

**错误:**
```
getaddrinfo ENOTFOUND interview-backend
```

**解决步骤:**

```bash
# 1. 检查网络
docker network ls
docker network inspect interview-network

# 2. 检查容器是否在同一网络
docker inspect interview-backend | grep NetworkMode
docker inspect interview-frontend | grep NetworkMode

# 3. 测试容器间连通性
docker-compose --env-file .env.docker exec frontend \
  ping interview-backend

# 4. 测试DNS解析
docker-compose --env-file .env.docker exec frontend \
  nslookup interview-backend

# 5. 重建网络
docker-compose --env-file .env.docker down
docker network rm interview-network
docker-compose --env-file .env.docker up -d
```

---

## 性能问题

### 症状1: 响应缓慢

**表现:**
```
API响应时间超过5秒
前端加载缓慢
```

**排查步骤:**

```bash
# 1. 检查容器资源使用
docker stats

# 2. 查看CPU使用
docker stats --no-stream | grep -E "interview-backend|interview-frontend"

# 3. 查看内存使用
docker inspect interview-backend --format='{{.State.Pid}}' | xargs ps aux | grep node

# 4. 检查磁盘I/O
iostat -x 1

# 5. 查看Redis性能
docker-compose --env-file .env.docker exec redis \
  redis-cli --stat

# 6. 查看数据库查询时间
docker-compose --env-file .env.docker logs --tail=100 backend | grep "duration"
```

**解决方案:**

```bash
# 1. 增加资源限制 (在docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G

# 2. 重启服务
docker-compose --env-file .env.docker restart

# 3. 优化缓存策略
# 编辑 backend/.env
CACHE_TTL=10000  # 增加缓存时间

# 4. 清理旧数据
docker-compose --env-file .env.docker exec redis \
  redis-cli FLUSHALL
```

### 症状2: 内存溢出

**错误:**
```
JavaScript heap out of memory
OOMKilled (容器被系统杀死)
```

**解决步骤:**

```bash
# 1. 检查内存使用
docker stats

# 2. 查看可用内存
free -h

# 3. 查看容器内存限制
docker inspect interview-backend | grep Memory

# 4. 增加Node.js内存
# 编辑 backend/Dockerfile
ENV NODE_OPTIONS="--max-old-space-size=1024"

# 5. 或在docker-compose中限制
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M

# 6. 清理未使用的数据
docker-compose --env-file .env.docker exec redis \
  redis-cli KEYS "*" | xargs redis-cli DEL

# 7. 重建镜像
docker-compose --env-file .env.docker build --no-cache backend
docker-compose --env-file .env.docker up -d backend
```

---

## 数据问题

### 症状1: 数据丢失

**问题:**
```
重启后数据消失
Redis数据不持久化
```

**解决步骤:**

```bash
# 1. 检查Redis持久化配置
docker-compose --env-file .env.docker exec redis \
  redis-cli CONFIG GET save

# 2. 检查数据文件
docker-compose --env-file .env.docker exec redis \
  ls -la /data/

# 3. 启用AOF持久化
docker-compose --env-file .env.docker exec redis \
  redis-cli CONFIG SET appendonly yes

# 4. 查看Redis命令日志
docker-compose --env-file .env.docker exec redis \
  tail -f /var/log/redis/redis-server.log

# 5. 手动触发保存
docker-compose --env-file .env.docker exec redis \
  redis-cli SAVE
```

### 症状2: 数据损坏

**错误:**
```
ERR Bad RESP protocol
WRONGTYPE Operation against a key holding the wrong kind of value
```

**解决步骤:**

```bash
# 1. 备份现有数据
docker-compose --env-file .env.docker exec redis \
  redis-cli --rdb /data/dump.rdb.bak

# 2. 检查数据完整性
docker-compose --env-file .env.docker exec redis \
  redis-cli DEBUG OBJECT key_name

# 3. 清理损坏的key
docker-compose --env-file .env.docker exec redis \
  redis-cli DEL corrupted_key

# 4. 重新启动Redis
docker-compose --env-file .env.docker restart redis

# 5. 从备份恢复
cp data/redis/dump.rdb.bak data/redis/dump.rdb
docker-compose --env-file .env.docker restart redis
```

---

## 日志分析

### 查看不同级别的日志

```bash
# 查看错误日志
docker-compose --env-file .env.docker logs backend | grep -i error

# 查看警告日志
docker-compose --env-file .env.docker logs backend | grep -i warning

# 查看特定时间的日志
docker-compose --env-file .env.docker logs --since 5m backend

# 查看实时日志
docker-compose --env-file .env.docker logs -f backend

# 导出日志到文件
docker-compose --env-file .env.docker logs > full-logs.txt
docker-compose --env-file .env.docker logs backend > backend.log
docker-compose --env-file .env.docker logs frontend > frontend.log
docker-compose --env-file .env.docker logs redis > redis.log
```

### 常见错误信息解析

| 错误信息 | 可能原因 | 解决方案 |
|---------|---------|--------|
| `ECONNREFUSED` | 连接被拒绝 | 检查服务是否启动，端口是否正确 |
| `ENOTFOUND` | DNS解析失败 | 检查主机名，检查网络连接 |
| `ETIMEDOUT` | 连接超时 | 增加超时时间，检查网络 |
| `OOMKilled` | 内存溢出 | 增加内存限制，优化代码 |
| `Health check failed` | 健康检查失败 | 检查服务是否正常响应 |

### 日志格式示例

```
[2024-01-15T10:30:45.123Z] INFO Backend started on port 3001
[2024-01-15T10:30:46.456Z] DEBUG Connected to Redis
[2024-01-15T10:30:47.789Z] WARN Slow query detected (duration: 1234ms)
[2024-01-15T10:30:48.012Z] ERROR Database connection failed
```

---

## 快速诊断脚本

### 创建诊断脚本

```bash
#!/bin/bash
# diagnose.sh - Docker部署诊断脚本

echo "=== Docker诊断开始 ==="
echo ""

echo "1. 检查Docker"
docker --version
docker-compose --version
echo ""

echo "2. 检查容器状态"
docker-compose --env-file .env.docker ps
echo ""

echo "3. 检查网络"
docker network ls
echo ""

echo "4. 检查资源使用"
docker stats --no-stream
echo ""

echo "5. 检查日志错误"
echo "Backend错误:"
docker-compose --env-file .env.docker logs backend | grep -i error | tail -5
echo "Frontend错误:"
docker-compose --env-file .env.docker logs frontend | grep -i error | tail -5
echo "Redis错误:"
docker-compose --env-file .env.docker logs redis | grep -i error | tail -5
echo ""

echo "6. 健康检查"
echo "后端API:"
curl -f http://localhost:8080/api/health || echo "FAILED"
echo "前端:"
curl -f http://localhost/health || echo "FAILED"
echo "Redis:"
docker-compose --env-file .env.docker exec -T redis redis-cli ping || echo "FAILED"
echo ""

echo "=== 诊断完成 ==="
```

### 运行诊断

```bash
chmod +x diagnose.sh
./diagnose.sh

# 或保存输出到文件
./diagnose.sh > diagnosis.txt 2>&1
```

---

## 获取帮助

### 收集诊断信息

部分提交问题前，请收集以下信息：

```bash
# 保存系统信息
uname -a > system-info.txt

# 保存Docker版本
docker version > docker-version.txt

# 保存容器日志
docker-compose --env-file .env.docker logs > all-logs.txt

# 保存容器配置
docker-compose --env-file .env.docker config > compose-config.txt

# 打包所有诊断信息
tar -czf diagnostics.tar.gz system-info.txt docker-version.txt all-logs.txt compose-config.txt
```

### 常用资源

- [Docker文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [项目README](./README.md)
- [完整部署指南](./DOCKER-DEPLOYMENT-GUIDE.md)

---

**更新时间**: 2025-10-21
**版本**: 1.0.0
