# 快速部署参考

## 🚀 3分钟快速启动

```bash
# 1. 进入项目目录
cd /path/to/interview-system

# 2. 配置环境 (只需修改关键项)
cp .env.docker .env.prod
# 编辑以下项:
# DB_PASSWORD=YourPassword123!
# REDIS_PASSWORD=YourPassword123!
# JWT_SECRET=your-long-secret-key-min-32-chars

# 3. 生成SSL证书
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"

# 4. 启动
./deploy-prod.sh  # 或 deploy-prod.bat

# 5. 访问
# 前端: https://localhost
# API: https://localhost/api
```

---

## 📋 服务清单

| 服务 | 容器 | 端口 | 状态 |
|------|------|------|------|
| 前端 | interview-frontend | 80,443 | 🟢 |
| 后端API | interview-backend | 3001 | 🟢 |
| 存储服务 | interview-storage | 8081 | 🟢 |
| 数据库 | interview-db | 5432 | 🟢 |
| Redis | interview-redis | 6379 | 🟢 |
| 反向代理 | interview-proxy | 80,443 | 🟢 |

---

## 🔧 常用命令

```bash
# 查看所有容器
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 进入容器
docker exec -it interview-backend sh

# 健康检查
./health-check.sh

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 重启单个服务
docker-compose -f docker-compose.prod.yml restart backend

# 查看容器内存/CPU
docker stats
```

---

## 🔐 必须配置的安全项

| 配置 | 位置 | 优先级 |
|------|------|--------|
| DB密码 | .env.prod:DB_PASSWORD | 🔴 必须 |
| Redis密码 | .env.prod:REDIS_PASSWORD | 🔴 必须 |
| JWT密钥 | .env.prod:JWT_SECRET | 🔴 必须 |
| API密钥 | .env.prod:DIFY_API_KEY | 🟠 重要 |
| SSL证书 | nginx/ssl/ | 🔴 必须 |

---

## 📊 检查清单

部署前:
- [ ] Docker已安装 (`docker --version`)
- [ ] docker-compose已安装 (`docker-compose --version`)
- [ ] 磁盘空间>50GB (`df -h`)
- [ ] 修改了.env.prod中的密码
- [ ] SSL证书已生成

部署后:
- [ ] 所有容器都在运行 (`docker ps`)
- [ ] 前端可访问 (`curl https://localhost`)
- [ ] 后端API可用 (`curl https://localhost/api/health`)
- [ ] 数据库已初始化
- [ ] Redis已连接
- [ ] 日志目录已创建

---

## 🆘 紧急故障排查

### 服务无法启动
```bash
# 查看错误
docker-compose -f docker-compose.prod.yml logs backend

# 检查磁盘/内存
df -h && free -h

# 重新启动
docker-compose -f docker-compose.prod.yml restart backend
```

### 无法连接到服务
```bash
# 检查容器网络
docker network inspect interview-network

# 测试DNS
docker exec interview-backend nslookup interview-db

# 检查Nginx配置
docker exec interview-proxy nginx -t
```

### 数据库连接失败
```bash
# 检查数据库容器
docker-compose -f docker-compose.prod.yml logs db

# 测试连接
docker exec interview-db psql -U admin -d interview_system -c "SELECT 1"
```

---

## 📈 性能监控

```bash
# 实时资源使用
docker stats

# 容器日志大小
du -sh logs

# 数据库大小
docker exec interview-db psql -U admin -c "\l+"

# Redis内存使用
docker exec interview-redis redis-cli info memory
```

---

## 🔄 更新升级

```bash
# 更新镜像
docker-compose -f docker-compose.prod.yml pull

# 重新启动
docker-compose -f docker-compose.prod.yml up -d

# 验证更新
docker-compose -f docker-compose.prod.yml ps
```

---

## 💾 备份恢复

```bash
# 备份数据库
docker exec interview-db pg_dump -U admin interview_system > db_backup.sql

# 恢复数据库
docker exec -i interview-db psql -U admin interview_system < db_backup.sql

# 备份文件
tar -czf data_backup.tar.gz data/

# 恢复文件
tar -xzf data_backup.tar.gz
```

---

## 📞 获取帮助

1. **查看日志**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

2. **运行健康检查**
   ```bash
   ./health-check.sh
   ```

3. **查看详细文档**
   - PRODUCTION_DEPLOYMENT.md
   - DEPLOYMENT_SUMMARY.md

4. **检查配置**
   ```bash
   cat .env.prod | grep -v "^#"
   ```

---

**最后更新**: 2024-10-27  
**版本**: 1.0.0
