# Docker部署 - 快速参考卡片

## 🚀 30秒快速启动

### Linux/macOS
```bash
cd interview-system
cp .env.docker .env
chmod +x docker-deploy-prod.sh
./docker-deploy-prod.sh start
```

### Windows PowerShell
```powershell
cd interview-system
Copy-Item .env.docker .env
.\docker-deploy-prod.ps1 -Action start
```

### Windows CMD
```batch
cd interview-system
copy .env.docker .env
docker-deploy-prod.bat start
```

---

## 📍 常用地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost | 主应用 |
| 前端HTTPS | https://localhost | 需要真实证书 |
| 后端API | http://localhost:8080/api | API基础路径 |
| 健康检查 | http://localhost:8080/api/health | 服务状态 |
| Redis | localhost:6379 | 缓存数据库 |

---

## ⚡ 最常用命令

```bash
# 查看所有命令
./docker-deploy-prod.sh help

# 启动所有服务
./docker-deploy-prod.sh start

# 查看服务状态
./docker-deploy-prod.sh status

# 查看日志
./docker-deploy-prod.sh logs

# 查看特定服务日志
./docker-deploy-prod.sh logs backend
./docker-deploy-prod.sh logs frontend
./docker-deploy-prod.sh logs redis

# 重启服务
./docker-deploy-prod.sh restart

# 停止服务
./docker-deploy-prod.sh stop

# 验证部署
./docker-deploy-prod.sh verify

# 清理所有数据
./docker-deploy-prod.sh clean
```

---

## 🔍 故障快速排查

### 问题: 无法访问应用

```bash
# 1. 检查服务状态
./docker-deploy-prod.sh status

# 2. 查看错误日志
./docker-deploy-prod.sh logs

# 3. 检查端口占用
lsof -i :80          # Linux/macOS
netstat -ano | findstr :80  # Windows
```

### 问题: 后端连接失败

```bash
# 1. 查看后端日志
./docker-deploy-prod.sh logs backend

# 2. 测试后端API
curl http://localhost:8080/api/health

# 3. 重启后端
docker-compose --env-file .env.docker restart backend
```

### 问题: Redis连接失败

```bash
# 1. 查看Redis日志
./docker-deploy-prod.sh logs redis

# 2. 测试Redis连接
docker-compose --env-file .env.docker exec redis redis-cli ping

# 3. 重启Redis
docker-compose --env-file .env.docker restart redis
```

---

## 📝 环境配置 (.env.docker)

### 关键配置

```ini
# 应用环境
APP_ENV=production

# 端口 (根据需要修改)
FRONTEND_PORT=80
BACKEND_PORT=8080
REDIS_PORT=6379

# API基础URL
VITE_API_BASE_URL=http://interview-backend:3001/api

# Dify AI (如需要)
DIFY_API_KEY=your-api-key-here

# 安全密钥 (生产环境务必修改)
JWT_SECRET=your-secret-key-32-chars
```

### 生成安全密钥

```bash
# Linux/macOS
openssl rand -base64 32

# Windows PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

---

## 🛠️ Docker命令

### 查看服务

```bash
# 查看所有容器
docker ps -a

# 查看特定容器
docker ps | grep interview

# 查看容器日志
docker logs <container-id>

# 进入容器
docker exec -it <container-id> sh
```

### 查看资源使用

```bash
# 实时监控
docker stats

# 查看镜像
docker images | grep interview-system

# 查看网络
docker network ls
```

### 清理资源

```bash
# 删除容器
docker rm <container-id>

# 删除镜像
docker rmi <image-id>

# 清理未使用资源
docker system prune -a
```

---

## 📊 监控和性能

### 查看资源使用

```bash
# CPU和内存使用
docker stats --no-stream

# 查看日志大小
du -sh logs/

# 查看磁盘使用
df -h
```

### 优化建议

| 问题 | 解决方案 |
|------|---------|
| 响应慢 | 检查logs，查看是否有错误 |
| 内存溢出 | 增加内存限制或重启 |
| 磁盘满 | 清理logs和Redis数据 |
| 连接超时 | 检查防火墙和网络 |

---

## 🔐 安全检查清单

### 生产环境必做

- [ ] 修改 `JWT_SECRET`
- [ ] 修改 `DIFY_API_KEY`
- [ ] 配置真实SSL证书
- [ ] 设置 `REDIS_PASSWORD`
- [ ] 配置防火墙
- [ ] 启用日志监控
- [ ] 设置自动备份
- [ ] 配置监控告警

### 安全命令

```bash
# 生成强密钥
openssl rand -base64 32

# 生成自签名证书
openssl req -x509 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -days 365 -nodes

# 检查证书有效期
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

---

## 📚 文档导航

| 需求 | 文档 | 时间 |
|------|------|------|
| 快速开始 | DOCKER-QUICK-START.md | 5分钟 |
| 完整指南 | DOCKER-DEPLOYMENT-GUIDE.md | 30分钟 |
| 问题排查 | DOCKER-TROUBLESHOOTING.md | 按需 |
| 文件说明 | DOCKER-FILES-SUMMARY.md | 10分钟 |
| 项目总结 | PROJECT-COMPLETION-SUMMARY.md | 15分钟 |

---

## ✅ 部署验证清单

启动后检查以下项:

- [ ] `./docker-deploy-prod.sh status` 显示所有服务为"Up"
- [ ] 访问 http://localhost 看到前端应用
- [ ] 访问 http://localhost:8080/api/health 得到200响应
- [ ] `./docker-deploy-prod.sh logs` 没有ERROR
- [ ] Redis可以连接: `docker-compose exec redis redis-cli ping`

---

## 🎯 常见场景

### 场景1: 开发环境快速启动

```bash
./docker-deploy-prod.sh start
# 开发代码...
# 自动hot-reload (如果配置了)
./docker-deploy-prod.sh stop
```

### 场景2: 生产环境部署

```bash
# 1. 配置
cp .env.docker .env
# 编辑 .env 配置生产参数

# 2. 部署
./docker-deploy-prod.sh start

# 3. 验证
./docker-deploy-prod.sh verify

# 4. 监控
./docker-deploy-prod.sh logs
```

### 场景3: 问题诊断

```bash
# 1. 查看状态
./docker-deploy-prod.sh status

# 2. 查看日志
./docker-deploy-prod.sh logs

# 3. 特定服务诊断
./docker-deploy-prod.sh logs backend

# 4. 重启服务
./docker-deploy-prod.sh restart
```

### 场景4: 数据备份和恢复

```bash
# 备份Redis数据
docker-compose exec redis redis-cli --rdb /data/dump.rdb.bak

# 备份所有日志
tar -czf backup-$(date +%Y%m%d).tar.gz logs/

# 清空Redis (谨慎)
docker-compose exec redis redis-cli FLUSHALL
```

---

## 🔄 更新和升级

### 更新镜像

```bash
# 更新所有镜像
docker-compose pull

# 重建容器
docker-compose up -d --force-recreate

# 清理旧镜像
docker image prune -a
```

### 回滚到之前版本

```bash
# 停止并删除容器
docker-compose down

# 重新构建旧版本
docker-compose build backend
docker-compose up -d
```

---

## 📞 获取帮助

### 快速问题

查看: `DOCKER-QUICK-START.md` -> 常见问题快速解决

### 深度问题

查看: `DOCKER-TROUBLESHOOTING.md` -> 按问题类型查找

### 部署问题

查看: `DOCKER-DEPLOYMENT-GUIDE.md` -> 对应章节

### 文件问题

查看: `DOCKER-FILES-SUMMARY.md` -> 文件说明

---

## 🎓 学习路径

### 初学者 (1小时)
1. 本文档 (5分钟)
2. DOCKER-QUICK-START.md (10分钟)
3. 执行部署 (20分钟)
4. 测试功能 (15分钟)
5. 查看日志 (10分钟)

### 中级用户 (2小时)
1. 本文档 (5分钟)
2. DOCKER-DEPLOYMENT-GUIDE.md (45分钟)
3. 配置生产环境 (30分钟)
4. 性能优化 (20分钟)
5. 安全加固 (20分钟)

### 高级用户 (3小时)
1. 本文档 (5分钟)
2. 所有文档 (60分钟)
3. 研究脚本代码 (30分钟)
4. 自定义配置 (30分钟)
5. 性能调优 (34分钟)

---

## 💾 快速命令复制

### 启动部署
```bash
./docker-deploy-prod.sh start
```

### 查看日志
```bash
./docker-deploy-prod.sh logs backend
```

### 检查状态
```bash
./docker-deploy-prod.sh status
```

### 重启服务
```bash
./docker-deploy-prod.sh restart
```

### 停止所有
```bash
./docker-deploy-prod.sh stop
```

---

**最后更新**: 2025-10-21
**版本**: 1.0.0
**快速参考完成**: ✅ 100%
