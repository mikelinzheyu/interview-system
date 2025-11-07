# Storage Service 快速启动指南

## 一句话启动

```bash
# Windows (PowerShell)
.\deploy-storage-service.ps1

# Linux/Mac
chmod +x deploy-storage-service.sh
./deploy-storage-service.sh
```

## 5分钟快速部署

### 第1步: 准备环境 (1分钟)

```bash
# 创建必要的目录
mkdir -p logs/storage data/storage logs/backend logs/frontend logs/redis
```

### 第2步: 配置环境变量 (1分钟)

编辑 `.env.prod` 文件:

```env
REDIS_HOST=interview-redis
REDIS_PORT=6379
REDIS_DB=0
SESSION_STORAGE_API_KEY=ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
STORAGE_PORT=8081
TZ=Asia/Shanghai
```

### 第3步: 启动 (3分钟)

```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

## 验证部署

```bash
# 查看状态
docker-compose ps

# 测试连接
curl http://localhost:8081/api/sessions

# 查看日志
docker-compose logs -f storage-service
```

## 常见命令

```bash
# 查看实时日志
docker-compose logs -f storage-service

# 重启服务
docker-compose restart storage-service

# 停止所有服务
docker-compose down

# 检查 Redis 连接
docker exec interview-redis redis-cli ping

# 进入容器调试
docker exec -it interview-storage-service /bin/bash
```

## 故障排查

| 问题 | 解决方案 |
|------|---------|
| 容器无法启动 | `docker logs interview-storage-service` |
| Redis 连接失败 | `docker exec interview-redis redis-cli ping` |
| 端口被占用 | 修改 `.env.prod` 中的 `STORAGE_PORT` |
| 启动很慢 | 正常现象，等待 30-40 秒 |

## 服务地址

```
Storage Service: http://localhost:8081
Storage API:     http://localhost:8081/api/sessions
Backend:         http://localhost:8080
Frontend:        http://localhost
Redis:           localhost:6379
```

## 部署脚本用法

### Windows PowerShell

```powershell
.\deploy-storage-service.ps1                    # 启动
.\deploy-storage-service.ps1 -Action logs      # 查看日志
.\deploy-storage-service.ps1 -Action status    # 查看状态
.\deploy-storage-service.ps1 -Action health    # 健康检查
.\deploy-storage-service.ps1 -Action restart   # 重启
.\deploy-storage-service.ps1 -Action rebuild   # 完整重建
```

### Linux/Mac Bash

```bash
./deploy-storage-service.sh                     # 启动
./deploy-storage-service.sh logs                # 查看日志
./deploy-storage-service.sh status              # 查看状态
./deploy-storage-service.sh health              # 健康检查
./deploy-storage-service.sh restart             # 重启
./deploy-storage-service.sh rebuild             # 完整重建
```

## 生产环境安全检查清单

- [ ] 修改 `SESSION_STORAGE_API_KEY` 为安全值
- [ ] 设置 `REDIS_PASSWORD` 为强密码
- [ ] 增加 JVM 内存配置 (如需)
- [ ] 启用 Nginx SSL/TLS
- [ ] 配置日志轮转
- [ ] 设置定期备份
- [ ] 配置监控告警

---

详细文档: 查看 `STORAGE_SERVICE_DEPLOYMENT_GUIDE.md`
