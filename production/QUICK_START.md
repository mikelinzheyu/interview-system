# AI面试系统 - 快速开始指南

## 一键部署

### Linux/Mac
```bash
cd production
chmod +x deploy.sh
./deploy.sh
```

### Windows
```powershell
cd production
.\deploy.ps1
```

## 部署前准备

### 1. 修改环境变量（必须）
```bash
# 编辑 .env.production 文件
vim .env.production
```

**必改项**:
- `MYSQL_ROOT_PASSWORD` - MySQL root密码
- `MYSQL_PASSWORD` - MySQL用户密码
- `REDIS_PASSWORD` - Redis密码
- `JWT_SECRET` - JWT密钥（至少64字符）
- `OPENAI_API_KEY` - OpenAI API密钥（如需AI功能）

### 2. 准备Java源码（自动）
部署脚本会自动复制 `backend/main/*` 到 `backend-java/src/main/`

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost |
| Java后端 | http://localhost:8080 |
| Node后端 | http://localhost:3001 |
| 存储API | http://localhost:8090 |
| MySQL | localhost:3307 |
| Redis | localhost:6380 |

## 常用命令

### 查看状态
```bash
docker-compose -f docker-compose.production.yml ps
```

### 查看日志
```bash
# 所有服务
docker-compose -f docker-compose.production.yml logs -f

# 特定服务
docker-compose -f docker-compose.production.yml logs -f backend-java
```

### 停止服务
```bash
docker-compose -f docker-compose.production.yml down
```

### 重启服务
```bash
# 所有服务
docker-compose -f docker-compose.production.yml restart

# 特定服务
docker-compose -f docker-compose.production.yml restart backend-java
```

### 更新代码后重新部署
```bash
# 重新构建并启动
docker-compose -f docker-compose.production.yml up -d --build

# 或使用脚本
./deploy.sh  # Linux/Mac
.\deploy.ps1 -Build  # Windows
```

## 健康检查

```bash
# Java后端
curl http://localhost:8080/actuator/health

# Node后端
curl http://localhost:3001/api/health

# 存储API
curl http://localhost:8090/actuator/health

# 前端
curl http://localhost
```

## 故障排查

### 服务启动失败
```bash
# 查看日志定位问题
docker-compose -f docker-compose.production.yml logs [service-name]

# 重启问题服务
docker-compose -f docker-compose.production.yml restart [service-name]
```

### MySQL连接失败
```bash
# 检查MySQL是否就绪
docker-compose -f docker-compose.production.yml logs mysql

# 等待30秒让MySQL完全启动
sleep 30
```

### 内存不足
```bash
# 查看资源使用
docker stats

# 调整docker-compose.yml中的内存限制
# 或增加系统内存
```

## 备份数据

### MySQL
```bash
docker exec interview-mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} interview_system > backup.sql
```

### Redis
```bash
docker exec interview-redis redis-cli -a ${REDIS_PASSWORD} BGSAVE
docker cp interview-redis:/data/dump.rdb ./redis_backup.rdb
```

## 完全清理

```bash
# 停止并删除所有容器和数据卷
docker-compose -f docker-compose.production.yml down -v

# 清理未使用的镜像
docker image prune -a
```

---

详细文档请参考 `DEPLOYMENT_SUMMARY.md` 和 `README.md`
