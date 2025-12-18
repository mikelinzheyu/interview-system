# 📖 Docker生产环境 - 快速参考指南

## 🎯 最常用的命令

### 启动和停止

```bash
# 启动所有容器
cd D:\code7\interview-system\production
docker-compose -f docker-compose.simple.yml up -d

# 停止所有容器
docker-compose -f docker-compose.simple.yml down

# 重启特定容器
docker-compose -f docker-compose.simple.yml restart backend
docker-compose -f docker-compose.simple.yml restart frontend
```

### 查看状态

```bash
# 查看所有容器状态
docker-compose -f docker-compose.simple.yml ps

# 查看特定容器状态
docker ps | grep interview

# 查看容器详细信息
docker inspect interview-backend
```

### 查看日志

```bash
# 查看所有日志（实时）
docker-compose -f docker-compose.simple.yml logs -f

# 查看后端日志
docker-compose -f docker-compose.simple.yml logs -f backend

# 查看前端日志
docker-compose -f docker-compose.simple.yml logs -f frontend

# 查看最后100行日志
docker-compose -f docker-compose.simple.yml logs --tail 100
```

---

## 🧪 服务验证

### 前端应用
```bash
# 检查前端是否运行
curl http://localhost/

# 预期: HTTP 200 + HTML内容
```

### 后端API
```bash
# 健康检查
curl http://localhost:3001/api/health

# 预期响应:
# {
#   "code": 200,
#   "message": "Success",
#   "data": {
#     "status": "UP",
#     "timestamp": "2025-12-18T15:53:35.528Z",
#     "version": "1.0.0"
#   }
# }
```

### 数据库
```bash
# 进入MySQL容器
docker exec -it interview-mysql bash

# 在容器内连接MySQL
mysql -u interview_user -p interview_system
# 密码: Interview2025!UserP@ssw0rd#MySQL
```

### 缓存
```bash
# 进入Redis容器
docker exec -it interview-redis redis-cli

# 输入密码
> AUTH Redis2025!SecureP@ssw0rd#Interview

# 检查Redis状态
> PING
# 返回: PONG
```

---

## 🔧 常见操作

### 重建镜像

```bash
# 重建所有镜像
docker-compose -f docker-compose.simple.yml build

# 重建特定服务
docker-compose -f docker-compose.simple.yml build backend
docker-compose -f docker-compose.simple.yml build frontend
```

### 清理资源

```bash
# 清理所有停止的容器
docker container prune

# 清理所有未使用的镜像
docker image prune

# 清理所有未使用的卷
docker volume prune

# 深度清理（谨慎）
docker system prune -a
```

### 数据操作

```bash
# MySQL备份
docker exec interview-mysql mysqldump \
  -u root \
  -pMySQL2025!SecureRootP@ssw0rd#Interview \
  interview_system > backup-$(date +%Y%m%d).sql

# Redis备份
docker exec interview-redis redis-cli \
  -a Redis2025!SecureP@ssw0rd#Interview \
  BGSAVE

# 复制Redis备份到本地
docker cp interview-redis:/data/dump.rdb ./redis-backup.rdb
```

---

## 📊 监控和诊断

### 实时监控
```bash
# 监控容器资源使用
docker stats

# 监控特定容器
docker stats interview-backend interview-mysql

# 监控输出
# CONTAINER     CPU %   MEM USAGE / LIMIT
# interview-... 0.1%    150MiB / 512MiB
```

### 网络诊断
```bash
# 检查容器网络
docker network ls

# 检查特定网络
docker network inspect production_interview-network

# 从容器内测试连接
docker exec interview-backend ping interview-mysql
docker exec interview-backend ping interview-redis
```

### 日志收集
```bash
# 导出所有日志
docker-compose logs > deployment-logs.txt

# 导出特定服务日志
docker-compose logs backend > backend-logs.txt

# 实时输出日志到文件
docker-compose logs -f backend > backend-realtime.log &
```

---

## 🔐 安全操作

### 环境变量管理
```bash
# 查看容器环境变量
docker exec interview-backend env

# 检查敏感信息（已脱敏显示）
grep PASSWORD D:\code7\interview-system\production\.env

# 生成强密码
# Linux/Mac:
openssl rand -base64 32

# Windows PowerShell:
$([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))) -replace '[/+]', ''
```

### 访问控制
```bash
# 限制容器端口暴露
# 只允许本地访问
docker run --expose 3307 ...

# 允许特定IP访问
docker run -p 127.0.0.1:3307:3306 ...
```

---

## ❌ 故障排除

### 容器启动失败

```bash
# 查看错误日志
docker logs interview-backend

# 尝试前台运行（查看详细输出）
docker-compose up backend

# 清理重启
docker-compose down -v
docker-compose up -d --build
```

### 端口冲突

```bash
# 检查占用的端口
netstat -an | grep 3001
lsof -i :3001  # Mac/Linux

# 查看Docker分配的端口
docker-compose ps

# 修改.env中的端口设置
BACKEND_NODE_PORT=3002
```

### 内存不足

```bash
# 检查容器内存使用
docker stats interview-mysql

# 查看Docker总资源使用
docker system df

# 减少容器内存限制
# 编辑docker-compose.simple.yml
# 添加: memory: 256m
```

### 网络连接问题

```bash
# 检查容器DNS
docker exec interview-backend cat /etc/resolv.conf

# 测试容器间通信
docker exec interview-backend nslookup interview-mysql

# 重建网络
docker-compose down
docker network prune
docker-compose up -d
```

---

## 📈 性能优化

### 缓存优化
```bash
# 查看Redis内存使用
docker exec interview-redis redis-cli -a PASSWORD INFO memory

# 查看MySQL缓冲池
docker exec interview-mysql mysql -u root -p -e "SHOW ENGINE INNODB STATUS\G"
```

### 日志轮转
```bash
# 配置Docker日志驱动
# 在docker-compose.yml中添加:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 备份和恢复
```bash
# 完整系统备份
docker-compose down
tar -czf interview-system-backup.tar.gz production/

# 完整系统恢复
tar -xzf interview-system-backup.tar.gz
docker-compose up -d
```

---

## 🚀 部署流程

### 首次部署
1. 克隆项目到 `D:\code7\interview-system`
2. 进入 `production/` 目录
3. 检查 `.env` 文件配置
4. 运行: `docker-compose -f docker-compose.simple.yml up -d --build`
5. 等待所有容器启动 (30秒左右)
6. 验证: `curl http://localhost/`

### 日常维护
```bash
# 每日检查
docker-compose ps
docker stats

# 定期更新
git pull
docker-compose pull
docker-compose up -d

# 备份
docker exec interview-mysql mysqldump -u root -p interview_system > daily-backup.sql
```

### 升级部署
```bash
# 构建新镜像
docker-compose build

# 灰度升级（逐个容器）
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend

# 回滚（如有问题）
docker-compose down
git checkout .
docker-compose up -d
```

---

## 📱 访问地址

| 服务 | 地址 | 端口 | 说明 |
|------|------|------|------|
| 前端应用 | http://localhost/ | 80 | Web应用 |
| 后端API | http://localhost:3001/api | 3001 | API服务 |
| MySQL | localhost:3307 | 3307 | 数据库 |
| Redis | localhost:6380 | 6380 | 缓存 |

---

## 📞 获取帮助

### 查看容器进程
```bash
docker top interview-backend
docker top interview-mysql
```

### 进入容器交互
```bash
docker exec -it interview-backend /bin/bash
docker exec -it interview-mysql /bin/bash
```

### 查看Docker配置
```bash
docker inspect interview-backend
docker network inspect production_interview-network
```

---

## 💾 文件位置

| 文件 | 位置 |
|------|------|
| Docker Compose | `production/docker-compose.simple.yml` |
| 环境变量 | `production/.env` |
| Nginx配置 | `production/nginx/nginx.conf` |
| 数据库初始化 | `production/init-db.sql` |
| 日志目录 | `production/logs/` |
| 上传目录 | `production/uploads/` |
| 部署报告 | `PRODUCTION_DEPLOYMENT_REPORT.md` |

---

## 🔗 相关文档

- 完整部署报告: `PRODUCTION_DEPLOYMENT_REPORT.md`
- 生产部署指南: `production/PRODUCTION_DEPLOYMENT.md`
- Docker官方文档: https://docs.docker.com/
- Docker Compose参考: https://docs.docker.com/compose/compose-file/

---

*最后更新: 2025-12-18*
*由Claude Code生成*
