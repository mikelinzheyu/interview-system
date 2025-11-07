# 🚀 AI面试系统 - 生产环境部署启动指南

## 📌 重要提示

**在开始部署前，请确保您已经：**
1. ✅ 阅读了 `PRODUCTION_DEPLOYMENT.md` 完整指南
2. ✅ 准备好了生产环境的所有资源
3. ✅ 通知了相关团队成员
4. ✅ 完成了数据备份

---

## 🎯 部署目标

部署完整的AI面试系统生产环境，包括：
- PostgreSQL数据库
- Redis缓存服务
- Node.js后端API
- Java存储服务
- Vue 3前端应用
- Nginx反向代理
- 可选的监控和日志堆栈

---

## ⏱️ 预计时间

| 任务 | 时间 |
|------|------|
| 环境准备 | 5分钟 |
| Docker镜像构建 | 15-30分钟 |
| 服务启动 | 3-5分钟 |
| 系统验证 | 5分钟 |
| **总计** | **30-45分钟** |

---

## 📋 快速启动步骤

### 步骤 1️⃣ : 环境准备 (5分钟)

```bash
# 进入项目目录
cd /path/to/interview-system

# 复制环境文件
cp .env.docker .env.prod

# 创建必要的目录
mkdir -p data/db/{init,backups}
mkdir -p data/redis
mkdir -p data/backend/uploads
mkdir -p data/storage
mkdir -p data/frontend/cache
mkdir -p data/proxy/cache
mkdir -p logs/{db,redis,backend,storage,frontend,proxy}
mkdir -p nginx/ssl
mkdir -p monitoring/{prometheus,grafana}

echo "✓ 目录结构创建完成"
```

### 步骤 2️⃣ : 配置环境变量 (5分钟)

打开 `.env.prod` 并修改**以下必须项**：

```env
# 1. 数据库密码 - 修改为强密码
DB_PASSWORD=YourStrongPassword123!@#

# 2. Redis密码 - 修改为强密码
REDIS_PASSWORD=YourRedisPassword123!@#

# 3. JWT安全密钥 - 生成强密钥 (至少32字符)
JWT_SECRET=your-very-long-random-secret-key-at-least-32-characters

# 4. Dify API密钥 - 从 https://dify.ai 获取
DIFY_API_KEY=app-your-actual-api-key

# 5. Dify API地址
DIFY_API_BASE_URL=https://api.dify.ai/v1

# 6. Dify工作流URL
DIFY_WORKFLOW_URL=https://udify.app/workflow/your-workflow-id
```

**验证配置：**
```bash
# 检查关键配置是否已修改
grep -E "^(DB_PASSWORD|REDIS_PASSWORD|JWT_SECRET|DIFY_API_KEY)" .env.prod | head -4
# 应该显示您修改后的值，而非默认值
```

### 步骤 3️⃣ : 生成SSL证书 (2分钟)

```bash
# 生成自签证书 (开发/测试环境)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"

# 验证证书文件
ls -la nginx/ssl/
# 应该显示:
# -rw-r--r-- cert.pem
# -rw-r--r-- key.pem

echo "✓ SSL证书生成完成"
```

**生产环境建议：** 
- 使用Let's Encrypt免费证书，或
- 购买商业SSL证书并替换上述文件

### 步骤 4️⃣ : 启动部署 (15-30分钟)

#### 选项A: 使用自动部署脚本 (推荐)

**Linux/macOS:**
```bash
chmod +x deploy-prod.sh
./deploy-prod.sh
```

**Windows PowerShell:**
```powershell
.\deploy-prod.bat
```

#### 选项B: 手动Docker命令

```bash
# 1. 构建镜像
echo "[1/3] 构建Docker镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 2. 启动服务
echo "[2/3] 启动所有服务..."
docker-compose -f docker-compose.prod.yml up -d

# 3. 等待服务就绪
echo "[3/3] 等待服务就绪..."
sleep 30
docker-compose -f docker-compose.prod.yml ps
```

### 步骤 5️⃣ : 验证部署 (5分钟)

```bash
# 方式1: 运行自动检查脚本 (推荐)
chmod +x health-check.sh
./health-check.sh

# 方式2: 手动验证关键服务
echo "检查前端..."
curl -k https://localhost/health

echo "检查后端API..."
curl -k https://localhost/api/health

echo "检查数据库..."
docker exec interview-db psql -U admin -d interview_system -c "SELECT 1"

echo "检查Redis..."
docker exec interview-redis redis-cli ping
```

---

## 🎉 部署成功标志

如果您看到以下结果，说明部署成功：

✅ 所有容器状态为 `Up`
```bash
docker-compose -f docker-compose.prod.yml ps
# 所有容器都应该显示 Up
```

✅ 前端可访问
```bash
curl -k https://localhost/health
# 应该返回 200 OK 和 "healthy"
```

✅ 后端API响应正常
```bash
curl -k https://localhost/api/health
# 应该返回 200 OK
```

✅ 数据库连接成功
```bash
docker exec interview-db psql -U admin -d interview_system -c "SELECT 1"
# 应该返回 1
```

✅ 日志目录已创建
```bash
ls -la logs/
# 应该显示 db, redis, backend, storage, frontend, proxy 目录
```

---

## 🌐 访问应用

部署完成后，您可以访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | https://localhost | 主应用界面 |
| 后端API | https://localhost/api | API文档/健康检查 |
| 存储服务 | https://localhost/storage | 存储API |
| Prometheus* | http://localhost:9090 | 可选监控 |
| Grafana* | http://localhost/grafana | 可选仪表板 |

*需要启用 `--profile monitoring`

---

## 📊 实时监控

### 查看实时日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f storage-service
docker-compose -f docker-compose.prod.yml logs -f nginx-proxy

# 只显示最近100行
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 监控系统资源

```bash
# 实时CPU和内存使用
docker stats

# 查看容器详情
docker ps

# 查看所有容器的状态
docker-compose -f docker-compose.prod.yml ps
```

---

## ⚠️ 常见问题和解决方案

### Q: 构建时速度很慢？
**A:** 这是正常的，因为是首次构建。可以：
- 检查网络连接
- 等待构建完成（通常15-30分钟）
- 检查磁盘空间是否充足

### Q: 某个服务无法启动？
**A:** 
```bash
# 查看具体错误
docker-compose -f docker-compose.prod.yml logs [service-name]

# 例如：
docker-compose -f docker-compose.prod.yml logs backend

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps
```

### Q: 无法连接到API？
**A:**
```bash
# 检查容器网络
docker network inspect interview-network

# 验证DNS解析
docker exec interview-backend nslookup interview-db

# 重启服务
docker-compose -f docker-compose.prod.yml restart backend
```

### Q: SSL/HTTPS出错？
**A:**
```bash
# 检查证书文件
ls -la nginx/ssl/

# 验证证书有效性
openssl x509 -in nginx/ssl/cert.pem -text -noout

# 检查Nginx配置
docker exec interview-proxy nginx -t
```

---

## 🔒 部署后安全检查

部署完成后，请立即进行以下安全检查：

- [ ] HTTP自动重定向到HTTPS
- [ ] SSL证书正确配置
- [ ] 所有默认密码已更改
- [ ] JWT密钥已设置强值
- [ ] API密钥已配置
- [ ] 防火墙只开放必要的端口
- [ ] 定期备份已配置
- [ ] 监控告警已启用

---

## 📈 启用监控（可选但推荐）

```bash
# 启用监控服务（Prometheus + Grafana）
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# 启用日志堆栈（ELK）
docker-compose -f docker-compose.prod.yml --profile logging up -d

# 访问监控面板
# Prometheus: http://localhost:9090
# Grafana: http://localhost/grafana (默认密码: admin)
```

---

## 💾 数据备份

部署完成后，建议立即备份数据：

```bash
# 创建备份目录
mkdir -p backups

# 备份数据库
docker exec interview-db pg_dump -U admin interview_system > backups/db_backup.sql

# 备份Redis数据
docker exec interview-redis redis-cli BGSAVE
docker cp interview-redis:/data/dump.rdb backups/

# 备份上传文件
cp -r data/backend/uploads backups/

# 压缩备份
tar -czf backups_$(date +%Y%m%d_%H%M%S).tar.gz backups/

echo "✓ 备份完成"
```

---

## 🆘 紧急故障排查

如果部署失败，按以下步骤排查：

### 1. 检查Docker状态
```bash
docker ps -a
# 查看所有容器，包括已停止的
```

### 2. 查看错误日志
```bash
docker-compose -f docker-compose.prod.yml logs
# 查看最后的错误信息
```

### 3. 检查系统资源
```bash
df -h    # 磁盘空间
free -h  # 内存使用
```

### 4. 重新部署
```bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 清理卷（谨慎！会删除数据）
# docker volume prune

# 重新启动
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 后续文档

完整指南：
- [`PRODUCTION_DEPLOYMENT.md`](PRODUCTION_DEPLOYMENT.md) - 详细的部署指南
- [`QUICK_DEPLOYMENT_REFERENCE.md`](QUICK_DEPLOYMENT_REFERENCE.md) - 快速参考卡片
- [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) - 完整检查清单

日常运维：
- 查看实时日志
- 监控系统资源
- 定期备份数据
- 监控性能指标
- 处理告警和故障

---

## ✅ 部署完成确认

部署完成后，请填写以下信息：

```
部署环境: ☐ 开发 ☐ 测试 ☐ 生产
部署日期: __________
部署人员: __________
服务器IP/域名: __________

所有检查:
☐ 前端可访问
☐ 后端API正常
☐ 数据库已初始化
☐ Redis已连接
☐ 日志已配置
☐ 备份已完成
☐ 监控已启用

部署状态: ✅ 生产就绪
```

---

## 🎯 下一步

1. **监控系统** - 使用Prometheus和Grafana监控系统状态
2. **配置告警** - 设置CPU、内存、磁盘告警
3. **定期维护** - 制定定期备份和更新计划
4. **性能优化** - 监控性能指标并进行优化
5. **团队培训** - 培训运维团队处理常见问题

---

## 📞 获取帮助

| 问题类型 | 查看文档 | 命令 |
|---------|--------|------|
| 部署步骤 | PRODUCTION_DEPLOYMENT.md | 完整指南 |
| 快速参考 | QUICK_DEPLOYMENT_REFERENCE.md | 常用命令 |
| 故障排查 | DEPLOYMENT_CHECKLIST.md | 问题排查 |
| 系统状态 | 运行 health-check.sh | `./health-check.sh` |
| 实时日志 | Docker日志 | `docker-compose logs -f` |

---

**祝部署顺利！** 🎉

如有任何问题，请查阅相关文档或运行诊断脚本。

---

**版本**: 1.0.0  
**创建日期**: 2024-10-27  
**最后更新**: 2024-10-27
