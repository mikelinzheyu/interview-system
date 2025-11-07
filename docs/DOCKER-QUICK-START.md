# AI面试系统 - Docker快速开始指南

## 🚀 5分钟快速部署

### Linux/macOS

```bash
# 1. 进入项目目录
cd interview-system

# 2. 复制环境配置
cp .env.docker .env

# 3. 使用部署脚本启动
chmod +x docker-deploy-prod.sh
./docker-deploy-prod.sh start

# 4. 访问应用
# 前端: http://localhost
# API: http://localhost:8080/api
```

### Windows (PowerShell)

```powershell
# 1. 进入项目目录
cd interview-system

# 2. 复制环境配置
Copy-Item .env.docker -Destination .env

# 3. 使用部署脚本启动
.\docker-deploy-prod.ps1 -Action start

# 4. 访问应用
# 前端: http://localhost
# API: http://localhost:8080/api
```

### Windows (CMD)

```batch
# 1. 进入项目目录
cd interview-system

# 2. 复制环境配置
copy .env.docker .env

# 3. 使用部署脚本启动
docker-deploy-prod.bat start

# 4. 访问应用
# 前端: http://localhost
# API: http://localhost:8080/api
```

---

## 📋 服务状态检查

### 查看所有服务

```bash
# 部署脚本方式
./docker-deploy-prod.sh status

# Docker命令方式
docker-compose --env-file .env.docker ps
```

### 预期输出

```
NAME                    STATUS          PORTS
interview-backend       Up (healthy)    0.0.0.0:8080->3001/tcp
interview-frontend      Up (healthy)    0.0.0.0:80->80/tcp
interview-redis         Up (healthy)    0.0.0.0:6379->6379/tcp
interview-proxy         Up (healthy)    (profile: proxy)
```

---

## 🔍 快速测试API

### 使用curl测试

```bash
# 健康检查
curl http://localhost:8080/api/health

# 查询用户
curl http://localhost:8080/api/users

# 发送消息
curl -X POST http://localhost:8080/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello","userId":1}'
```

### 使用浏览器测试

```
# 前端应用
http://localhost

# 后端健康检查 (在浏览器中)
http://localhost:8080/api/health
```

---

## 🛠️ 常用操作

### 查看日志

```bash
# 所有服务日志
./docker-deploy-prod.sh logs

# 特定服务日志
./docker-deploy-prod.sh logs backend
./docker-deploy-prod.sh logs frontend
./docker-deploy-prod.sh logs redis

# 直接Docker命令
docker-compose --env-file .env.docker logs -f backend
```

### 停止服务

```bash
# 使用脚本
./docker-deploy-prod.sh stop

# 或直接使用Docker
docker-compose --env-file .env.docker down
```

### 重启服务

```bash
# 使用脚本
./docker-deploy-prod.sh restart

# 或直接使用Docker
docker-compose --env-file .env.docker restart
```

### 完全清理

```bash
# 使用脚本 (交互式)
./docker-deploy-prod.sh clean

# 或直接使用Docker
docker-compose --env-file .env.docker down -v
```

---

## ⚙️ 环境配置

### 修改配置文件

编辑 `.env.docker` 文件中的关键配置：

```ini
# 应用信息
APP_ENV=production

# 端口配置 (可根据需要修改)
FRONTEND_PORT=80
BACKEND_PORT=8080
REDIS_PORT=6379

# API基础URL
VITE_API_BASE_URL=http://interview-backend:3001/api

# Dify AI配置 (如使用)
DIFY_API_KEY=your-api-key-here
DIFY_API_BASE_URL=https://api.dify.ai/v1

# 安全密钥
JWT_SECRET=your-secret-key-32-chars

# 时区
TZ=Asia/Shanghai
```

### 应用新配置

```bash
# 修改后，重启服务
./docker-deploy-prod.sh restart

# 或使用Docker命令
docker-compose --env-file .env.docker up -d --force-recreate
```

---

## 🐛 常见问题快速解决

### 问题1: 端口已被占用

```bash
# 修改端口配置
# 编辑 .env.docker
# FRONTEND_PORT=8080    # 改为其他端口
# BACKEND_PORT=8081     # 改为其他端口

# 重启服务
./docker-deploy-prod.sh restart
```

### 问题2: 服务启动失败

```bash
# 查看详细错误日志
./docker-deploy-prod.sh logs

# 查看特定服务
./docker-deploy-prod.sh logs backend

# 重新构建镜像
docker-compose --env-file .env.docker build --no-cache backend
docker-compose --env-file .env.docker up -d
```

### 问题3: 无法访问应用

```bash
# 检查服务状态
./docker-deploy-prod.sh status

# 检查防火墙
# Linux
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp

# 测试连接
curl http://localhost/health
curl http://localhost:8080/api/health
```

### 问题4: Redis连接错误

```bash
# 查看Redis日志
./docker-deploy-prod.sh logs redis

# 测试Redis连接
docker-compose --env-file .env.docker exec redis redis-cli ping

# 重启Redis
docker-compose --env-file .env.docker restart redis
```

---

## 📊 监控命令

### 实时资源监控

```bash
# 查看容器资源使用
docker stats

# 查看容器内存使用
docker-compose --env-file .env.docker ps

# 查看磁盘使用
df -h
du -sh logs/
```

### 检查容器详细信息

```bash
# 查看网络
docker network inspect interview-network

# 查看卷
docker volume ls

# 查看镜像
docker images | grep interview-system
```

---

## 🔐 安全建议

### 生产环境必做事项

- [ ] 修改 `JWT_SECRET` 为强密钥
- [ ] 修改 `REDIS_PASSWORD` (如需要)
- [ ] 配置真实SSL证书 (替换nginx/ssl中的文件)
- [ ] 设置防火墙规则
- [ ] 定期备份数据
- [ ] 定期更新镜像和依赖

### 生成强密钥

```bash
# 生成32字符的随机密钥
openssl rand -base64 32

# 在.env.docker中配置
JWT_SECRET=<生成的密钥>
```

---

## 📁 项目结构

```
interview-system/
├── backend/                      # 后端服务
│   ├── Dockerfile               # 后端Docker镜像
│   ├── mock-server.js           # Mock API服务器
│   ├── websocket-server.js      # WebSocket服务器
│   ├── redis-client.js          # Redis客户端
│   └── package.json             # 依赖配置
├── frontend/                     # 前端应用
│   ├── Dockerfile               # 前端Docker镜像
│   ├── vite.config.js           # Vite配置
│   ├── nginx.conf               # Nginx配置
│   ├── src/                     # 源代码
│   └── package.json             # 依赖配置
├── nginx/                        # Nginx配置
│   ├── proxy.conf               # 反向代理配置
│   └── ssl/                     # SSL证书 (生产环境需要)
├── logs/                         # 应用日志
│   ├── backend/
│   ├── frontend/
│   ├── redis/
│   └── proxy/
├── data/                         # 数据存储
│   └── redis/                   # Redis持久化数据
├── docker-compose.yml           # Docker Compose配置
├── .env.docker                  # 环境变量配置
├── docker-deploy-prod.sh        # Linux/macOS部署脚本
├── docker-deploy-prod.ps1       # PowerShell部署脚本
├── docker-deploy-prod.bat       # CMD部署脚本
└── DOCKER-DEPLOYMENT-GUIDE.md   # 完整部署指南
```

---

## 📞 获取帮助

### 查看完整文档

- **完整部署指南**: [DOCKER-DEPLOYMENT-GUIDE.md](./DOCKER-DEPLOYMENT-GUIDE.md)
- **API文档**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **项目README**: [README.md](./README.md)

### 查看日志诊断

```bash
# 保存完整日志供分析
docker-compose --env-file .env.docker logs > debug.log

# 查看特定时间范围的日志
docker-compose --env-file .env.docker logs --since 10m
docker-compose --env-file .env.docker logs --until 2m
```

### 常用命令快速查询

| 操作 | 命令 |
|------|------|
| 启动 | `./docker-deploy-prod.sh start` |
| 停止 | `./docker-deploy-prod.sh stop` |
| 重启 | `./docker-deploy-prod.sh restart` |
| 日志 | `./docker-deploy-prod.sh logs` |
| 状态 | `./docker-deploy-prod.sh status` |
| 验证 | `./docker-deploy-prod.sh verify` |
| 清理 | `./docker-deploy-prod.sh clean` |

---

## ✅ 验证清单

部署完成后，请检查以下项目：

- [ ] 所有容器都在运行 (`docker-compose ps`)
- [ ] 前端可访问 (http://localhost)
- [ ] 后端API响应 (http://localhost:8080/api/health)
- [ ] Redis连接正常 (docker-compose exec redis redis-cli ping)
- [ ] 日志文件正常生成 (logs/目录)
- [ ] 没有错误信息 (检查日志)

---

## 🎯 下一步

部署完成后，建议：

1. **配置域名** (如已有): 修改nginx配置指向您的域名
2. **配置SSL证书** (生产环境): 使用真实证书替换自签名证书
3. **设置监控** (可选): 配置日志聚合和监控系统
4. **定期备份** (重要): 设置自动备份脚本
5. **性能优化** (可选): 根据实际使用情况调整资源限制

---

**快速开始完毕！祝您使用愉快！** 🎉

有任何问题，请参考[完整部署指南](./DOCKER-DEPLOYMENT-GUIDE.md)。
