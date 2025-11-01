# 生产部署 - 快速参考卡片

## ⚡ 一页纸快速启动

### 🔴 首次部署（新服务器）

```bash
# 1. 准备 (2分钟)
mkdir -p logs/{backend,frontend,redis,proxy} data/{redis,uploads}
cp .env.docker.example .env.docker
nano .env.docker  # 改 DIFY_API_KEY 和 JWT_SECRET

# 2. 部署 (3分钟)
./deploy-prod.sh  # Linux/Mac
# 或
deploy-prod.bat   # Windows

# 3. 验证 (1分钟)
docker-compose ps
curl http://localhost:80
```

---

## 🟢 日常运维命令

### 容器管理
```bash
docker-compose ps              # 查看状态
docker-compose logs -f         # 看日志
docker-compose restart backend # 重启服务
docker-compose down            # 停止
docker-compose up -d           # 启动
```

### 故障处理
```bash
docker-compose exec redis redis-cli ping                    # 测试Redis
docker-compose exec backend curl http://localhost:3001/api/health # 测试后端
docker-compose logs backend | grep ERROR                   # 看错误
```

### 数据备份/恢复
```bash
./backup-prod.sh              # 备份
./restore-backup.sh           # 恢复最新
./restore-backup.sh <file>    # 恢复指定
```

---

## 🟡 常见问题速查

| 问题 | 解决方案 |
|------|--------|
| 端口被占用 | 改`.env.docker`的端口，重启 |
| Redis连接失败 | `docker-compose restart redis` |
| 内存爆满 | `docker system prune -a` |
| 日志过大 | `truncate -s 0 logs/*/*.log` |
| 容器无法启动 | `docker-compose logs <service>` 看日志 |
| 前端无法访问 | 检查Nginx配置和防火墙 |

---

## 📊 监控访问

| 服务 | 地址 | 用户 | 密码 |
|------|------|------|------|
| 前端 | http://localhost:80 | - | - |
| API | http://localhost:8080/api | - | - |
| Grafana | http://localhost:3000 | admin | admin123 |
| Prometheus | http://localhost:9090 | - | - |
| Alertmanager | http://localhost:9093 | - | - |

---

## 🔧 配置速查

### 关键环境变量 (.env.docker)
```env
DIFY_API_KEY=app-xxxxx              # 从Dify获取
JWT_SECRET=strong-secret-here       # 生成: openssl rand -base64 32
FRONTEND_PORT=80                     # 前端端口
BACKEND_PORT=8080                    # 后端端口
REDIS_PORT=6379                      # Redis端口
TZ=Asia/Shanghai                     # 时区
```

### 资源限制 (docker-compose.yml)
```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # 最多2个CPU
      memory: 2G     # 最多2GB内存
```

---

## 📈 健康检查

```bash
# 前端
curl http://localhost:80

# 后端
curl http://localhost:8080/api/health

# Redis
docker-compose exec redis redis-cli ping

# 所有容器
docker-compose ps
```

---

## 💾 备份计划

```bash
# 立即备份
./backup-prod.sh

# Linux: 每天凌晨2点自动备份
# 编辑: crontab -e
0 2 * * * /path/to/backup-prod.sh

# Windows: 用任务计划程序设置每天2:00运行
# 命令: powershell -File backup-prod.ps1
```

---

## 🔐 安全检查清单

- [ ] 修改 JWT_SECRET
- [ ] 修改 Redis 密码
- [ ] 修改 Grafana 密码
- [ ] 配置防火墙
- [ ] 启用 HTTPS/TLS
- [ ] 定期更新镜像：`docker-compose pull && docker-compose up -d`

---

## 📚 完整文档

| 需求 | 文档 |
|------|------|
| 5分钟快速部署 | `DOCKER_DEPLOYMENT_QUICK_START.md` |
| 详细部署指南 | `PRODUCTION_DEPLOYMENT_GUIDE.md` |
| 完整总结 | `DOCKER_DEPLOYMENT_SUMMARY.md` |
| 部署完成 | `DEPLOYMENT_COMPLETE.md` |

---

## 🆘 紧急处理

```bash
# 容器崩溃
docker-compose restart

# 内存溢出
docker system prune -a
docker volume prune

# 无法访问
# 1. 检查防火墙
# 2. 检查端口: netstat -tlnp | grep :80
# 3. 检查DNS

# 数据丢失
./restore-backup.sh <backup_file>
```

---

## 📞 一分钟诊断

```bash
#!/bin/bash
echo "=== 容器状态 ==="
docker-compose ps

echo "=== 资源使用 ==="
docker stats --no-stream

echo "=== 错误日志 ==="
docker-compose logs --tail=20 | grep -i error

echo "=== 服务连接 ==="
echo "前端: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:80)"
echo "后端: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/health)"
docker-compose exec redis redis-cli ping 2>/dev/null || echo "Redis: Failed"

echo "=== 磁盘使用 ==="
df -h | grep -E '/$|/data'
```

---

## 🎯 优先级处理流程

### P1（关键）- 立即处理
- [ ] 前端无法访问 → 检查Nginx和防火墙
- [ ] API无响应 → 重启后端，查看日志
- [ ] Redis连接失败 → 重启Redis

### P2（重要）- 1小时内处理
- [ ] 错误率升高 → 查看日志，检查资源
- [ ] 响应慢 → 检查CPU/内存，优化查询
- [ ] 磁盘接近满 → 清理日志，删除备份

### P3（低）- 1天内处理
- [ ] 日志过大 → 配置轮转
- [ ] 需要更新 → 计划维护窗口
- [ ] 性能优化 → 分析指标，调整配置

---

## 📋 巡检清单（每周）

- [ ] 检查容器状态：`docker-compose ps`
- [ ] 检查磁盘使用：`df -h`
- [ ] 查看错误日志：`docker-compose logs | grep ERROR`
- [ ] 验证备份：`ls -la backups/`
- [ ] 检查监控：访问 http://localhost:3000
- [ ] 测试恢复：`./restore-backup.sh -h`
- [ ] 更新镜像：`docker-compose pull`
- [ ] 测试API：`curl http://localhost:8080/api/health`

---

## 🚀 性能优化快招

```bash
# 增加Redis内存
# 编辑docker-compose.yml中Redis部分
--maxmemory 1gb

# 调整Nginx连接数
worker_connections 2048;

# 增加后端实例（如果使用Docker Swarm）
docker service scale backend=3

# 启用Gzip压缩
gzip on;
gzip_types text/plain application/json;
```

---

**保存这个文件到你的手机或便签，每次遇到问题都能快速查询！**

最后更新：2024年01月
