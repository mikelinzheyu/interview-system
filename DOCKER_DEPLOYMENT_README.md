# 🐳 AI面试系统 - Docker生产环境部署指南

## 📖 文档导航

本次部署生成了三个核心文档，根据需求选择查看：

### 1. **PRODUCTION_DEPLOYMENT_REPORT.md** ⭐ 推荐首先查看
- **用途**: 完整的部署报告
- **内容**:
  - 详细的系统架构图
  - 所有核心服务的配置说明
  - 功能验证结果
  - 安全建议和最佳实践
  - 故障排查指南
  - 性能优化建议
- **适合**: 需要了解整个系统的人员

### 2. **DOCKER_QUICK_REFERENCE.md** ⭐ 推荐日常查看
- **用途**: 快速参考指南
- **内容**:
  - 最常用的Docker命令
  - 容器管理操作
  - 日志查看和诊断
  - 常见问题排查
  - 性能监控方法
- **适合**: 需要快速查找命令的运维人员

### 3. **DEPLOYMENT_SUMMARY.txt**
- **用途**: 部署总结
- **内容**:
  - 部署统计
  - 服务状态汇总
  - 验证结果
  - 后续步骤
- **适合**: 快速了解部署状态

---

## 🚀 快速开始

### 访问应用

```
前端应用:     http://localhost/
后端API:      http://localhost:3001/api
MySQL:        localhost:3307
Redis:        localhost:6380
```

### 常用命令

```bash
# 进入生产目录
cd D:\code7\interview-system\production

# 查看容器状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看后端日志
docker-compose logs -f backend
```

---

## 🐛 故障排查

### 问题：容器无法启动

**解决步骤**:
1. 查看具体错误: `docker-compose logs backend`
2. 清理重启:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### 问题：无法访问前端

**检查清单**:
- [ ] 前端容器是否运行: `docker ps | grep frontend`
- [ ] 端口是否被占用: `netstat -an | grep 80`
- [ ] Nginx是否配置正确: `docker exec interview-frontend cat /etc/nginx/conf.d/default.conf`

### 问题：后端API返回500错误

**检查步骤**:
1. 查看后端日志: `docker-compose logs -f backend`
2. 检查数据库连接: `docker exec interview-backend env | grep DB`
3. 检查Redis连接: `docker exec interview-redis redis-cli ping`

### 问题：数据库连接失败

**排查方法**:
```bash
# 检查MySQL状态
docker exec interview-mysql mysqladmin ping -u root -p

# 查看MySQL日志
docker-compose logs mysql

# 验证MySQL是否可访问
docker exec interview-backend curl -s http://interview-mysql:3306/
```

---

## 🔧 常见操作

### 查看日志

```bash
# 所有服务的日志
docker-compose logs

# 特定服务的日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
docker-compose logs redis

# 实时日志流
docker-compose logs -f backend

# 显示最后100行
docker-compose logs --tail 100
```

### 管理容器

```bash
# 重启特定容器
docker-compose restart backend
docker-compose restart frontend

# 删除所有容器（会清除数据）
docker-compose down -v

# 重建镜像
docker-compose build --no-cache

# 更新并重启
docker-compose pull
docker-compose up -d
```

### 数据库操作

```bash
# 进入MySQL容器
docker exec -it interview-mysql bash
mysql -u interview_user -p interview_system

# MySQL备份
docker exec interview-mysql mysqldump \
  -u root \
  -pMySQL2025!SecureRootP@ssw0rd#Interview \
  interview_system > backup.sql

# 进入Redis
docker exec -it interview-redis redis-cli
```

### 监控系统

```bash
# 查看容器资源使用
docker stats

# 查看特定容器信息
docker inspect interview-backend

# 查看网络
docker network ls
docker network inspect production_interview-network
```

---

## 📊 部署架构

```
┌─────────────────────────────────────────────────────┐
│                  Docker Bridge Network              │
│              (production_interview-network)         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐           ┌──────────────┐      │
│  │  Frontend    │           │   Backend    │      │
│  │  (Nginx:80)  │◄─────────►│ (Node:3001)  │      │
│  └──────────────┘           └──────────────┘      │
│         │                         │                │
│         └────────────┬────────────┘                │
│                      ▼                             │
│          ┌─────────────────────┐                  │
│          │   Redis (Cache)     │                  │
│          │   (6380)            │                  │
│          └─────────────────────┘                  │
│                      │                             │
│                      ▼                             │
│          ┌─────────────────────┐                  │
│          │  MySQL (Database)   │                  │
│          │  (3307)             │                  │
│          └─────────────────────┘                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 安全配置

### 环境变量

所有敏感信息存储在 `production/.env`:
```
MYSQL_ROOT_PASSWORD=MySQL2025!SecureRootP@ssw0rd#Interview
MYSQL_PASSWORD=Interview2025!UserP@ssw0rd#MySQL
REDIS_PASSWORD=Redis2025!SecureP@ssw0rd#Interview
JWT_SECRET=...
```

### 防火墙规则

```bash
# 允许HTTP
ufw allow 80/tcp

# 允许HTTPS（如配置）
ufw allow 443/tcp

# 禁止外部访问MySQL
ufw deny 3307/tcp

# 禁止外部访问Redis
ufw deny 6380/tcp
```

### SSL/HTTPS配置

参考 `production/nginx/nginx.conf` 中的SSL部分配置。

---

## 📈 性能指标

### 推荐配置

| 项目 | 值 | 说明 |
|------|-----|------|
| MySQL连接 | 500 | 最大并发连接数 |
| Redis内存 | 512MB | 内存限制 |
| Node.js堆 | 1.5GB | 最大堆大小 |
| Nginx工作进程 | auto | 自动配置 |

### 监控关键指标

- CPU使用率: < 70%
- 内存使用率: < 80%
- 磁盘空间: > 10GB
- 数据库查询时间: < 100ms
- API响应时间: < 500ms

---

## 🎯 部署检查清单

### 初始部署检查

- [ ] Docker Desktop已安装并运行
- [ ] 所有容器已启动 (`docker-compose ps`)
- [ ] 前端应用可访问 (`http://localhost/`)
- [ ] 后端API正常 (`curl http://localhost:3001/api/health`)
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] 所有日志输出正常

### 定期维护检查

每周检查:
- [ ] 容器状态 (`docker-compose ps`)
- [ ] 磁盘空间
- [ ] 日志文件大小
- [ ] 系统性能 (`docker stats`)

每月检查:
- [ ] 执行数据库备份
- [ ] 检查安全更新
- [ ] 验证备份恢复流程
- [ ] 审查日志文件

---

## 📞 获取帮助

### 文档资源

- **Docker官方文档**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Nginx**: https://nginx.org/
- **MySQL**: https://dev.mysql.com/
- **Redis**: https://redis.io/

### 项目文档

- `PRODUCTION_DEPLOYMENT_REPORT.md` - 完整部署报告
- `DOCKER_QUICK_REFERENCE.md` - 快速参考
- `DEPLOYMENT_SUMMARY.txt` - 部署总结
- `production/PRODUCTION_DEPLOYMENT.md` - 详细部署指南

### 常用命令快速查询

```bash
# Docker相关
docker --version
docker-compose --version
docker ps
docker logs
docker exec

# 查看帮助
docker --help
docker-compose --help

# 故障排除
docker inspect <container>
docker stats
docker system df
```

---

## 🚀 升级和更新

### 升级Docker镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重建镜像
docker-compose build --no-cache

# 启动更新后的容器
docker-compose up -d
```

### 回滚到之前版本

```bash
# 停止当前服务
docker-compose down

# 切换到之前的配置
git checkout HEAD~1

# 重新启动
docker-compose up -d
```

---

## 💾 备份和恢复

### 备份

```bash
# MySQL备份
docker exec interview-mysql mysqldump \
  -u root \
  -pMySQL2025!SecureRootP@ssw0rd#Interview \
  interview_system > backup-$(date +%Y%m%d).sql

# 完整系统备份
docker-compose down
tar -czf interview-backup-$(date +%Y%m%d).tar.gz production/
```

### 恢复

```bash
# 恢复MySQL
docker exec -i interview-mysql mysql \
  -u root \
  -pMySQL2025!SecureRootP@ssw0rd#Interview \
  interview_system < backup-20251218.sql

# 恢复完整系统
tar -xzf interview-backup-20251218.tar.gz
docker-compose up -d
```

---

## 🎓 学习资源

### Docker基础

- Docker官方入门教程
- Docker best practices
- Docker安全指南

### 微服务架构

- 容器化最佳实践
- 微服务部署模式
- 分布式系统设计

### 运维管理

- 日志聚合
- 性能监控
- 告警配置

---

## 📝 更新日志

**2025-12-18** - 初次部署
- 完成全Docker生产环境部署
- 所有核心服务启动成功
- 生成完整部署文档

---

## ⚖️ 许可和声明

本部署配置和文档为AI面试系统项目专用。

---

**部署完成日期**: 2025-12-18
**最后更新**: 2025-12-18
**维护者**: AI Interview System Team

---

*如有任何问题，请参考PRODUCTION_DEPLOYMENT_REPORT.md或DOCKER_QUICK_REFERENCE.md*
