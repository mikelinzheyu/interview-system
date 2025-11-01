# 📚 Storage Service 部署资源索引

## 🎯 按场景快速查找

### 我想快速启动服务
→ **[快速启动指南](./STORAGE_SERVICE_QUICK_REF.md)** (5分钟)

```bash
./deploy-storage-service.sh start
```

### 我需要详细的部署步骤
→ **[完整部署指南](./STORAGE_SERVICE_DEPLOYMENT_GUIDE.md)**

包含:
- 系统要求
- 详细的逐步指令
- 配置说明
- 故障排查

### 我想了解部署的全貌
→ **[最终部署总结](./STORAGE_SERVICE_FINAL_SUMMARY.md)**

包含:
- 工作完成清单
- 架构图
- 验证清单
- 性能优化

### 我需要部署脚本
→ **[部署脚本](./deploy-storage-service.ps1)** (Windows)
→ **[部署脚本](./deploy-storage-service.sh)** (Linux/Mac)

使用方法:
```bash
# Windows PowerShell
.\deploy-storage-service.ps1 -Action start

# Linux/Mac
./deploy-storage-service.sh start
```

### 我需要配置环境变量
→ **[.env.prod.example](./.env.prod.example)**

```bash
cp .env.prod.example .env.prod
# 编辑 .env.prod，修改敏感信息
```

### 我需要验证部署
→ **[验证脚本](./verify-storage-deployment.sh)**

```bash
./verify-storage-deployment.sh
```

## 📖 文档导航

### 核心文档

| 文档 | 用途 | 阅读时间 |
|------|------|---------|
| [README](./STORAGE_SERVICE_README.md) | 项目概述和快速导航 | 10 min |
| [快速参考](./STORAGE_SERVICE_QUICK_REF.md) | 快速启动 (5分钟部署) | 5 min |
| [完整指南](./STORAGE_SERVICE_DEPLOYMENT_GUIDE.md) | 详细部署和配置 | 30 min |
| [最终总结](./STORAGE_SERVICE_FINAL_SUMMARY.md) | 部署总结和优化建议 | 15 min |

### 脚本工具

| 脚本 | 功能 | 平台 |
|------|------|------|
| `deploy-storage-service.ps1` | 部署管理 | Windows |
| `deploy-storage-service.sh` | 部署管理 | Linux/Mac |
| `verify-storage-deployment.sh` | 部署验证 | Linux/Mac |

### 配置文件

| 文件 | 说明 |
|------|------|
| `.env.prod.example` | 环境变量模板 |
| `docker-compose.yml` | Docker 编排配置 |
| `storage-service/Dockerfile.prod` | 优化的 Docker 镜像 |
| `storage-service/src/main/resources/application-prod.properties` | Spring Boot 配置 |

## 🚀 部署流程

```
1. 准备环境
   ↓
2. 创建目录和配置
   ↓
3. 构建镜像
   ↓
4. 启动容器
   ↓
5. 验证部署
   ↓
6. 监控和优化
```

## 📋 常用命令速查

### 启动和停止

```bash
# 启动所有服务
docker-compose -f docker-compose.yml up -d

# 停止所有服务
docker-compose -f docker-compose.yml down

# 重启 Storage Service
docker-compose restart storage-service
```

### 查看日志

```bash
# 实时日志
docker-compose logs -f storage-service

# 最后 100 行
docker logs --tail 100 interview-storage-service

# 容器内日志文件
docker exec interview-storage-service tail -f /app/logs/storage-service.log
```

### 状态检查

```bash
# 容器状态
docker-compose ps

# 容器详细信息
docker inspect interview-storage-service

# 资源使用
docker stats interview-storage-service
```

### 健康检查

```bash
# 测试 API
curl http://localhost:8081/api/sessions

# 检查 Redis
docker exec interview-redis redis-cli ping

# 完整健康检查
./verify-storage-deployment.sh
```

## 🔒 安全检查清单

在生产环境部署前:

- [ ] 修改 Redis 密码
- [ ] 修改 API Key
- [ ] 修改 Dify 密钥
- [ ] 启用 HTTPS/SSL
- [ ] 配置防火墙
- [ ] 设置访问日志
- [ ] 配置备份
- [ ] 设置监控告警

## 💡 常见问题

### 启动很慢？
这是正常的。Java 应用启动需要 30-40 秒。查看日志以确认没有错误。

### Redis 连接失败？
检查 `.env.prod` 中的 `REDIS_PASSWORD` 是否与 Redis 配置匹配。

### 如何修改端口？
编辑 `.env.prod` 中的 `STORAGE_PORT` 或修改 `docker-compose.yml`。

### 如何升级？
```bash
docker-compose down
docker-compose build --no-cache storage-service
docker-compose up -d
```

### 日志文件在哪里？
- 容器内: `/app/logs/storage-service.log`
- 主机: `./logs/storage/storage-service.log`

## 🎓 学习资源

### 官方文档
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Spring Boot 文档](https://spring.io/projects/spring-boot)
- [Redis 文档](https://redis.io/docs/)

### 本项目文档
- [README](./STORAGE_SERVICE_README.md) - 项目概述
- [快速参考](./STORAGE_SERVICE_QUICK_REF.md) - 快速启动
- [完整指南](./STORAGE_SERVICE_DEPLOYMENT_GUIDE.md) - 详细步骤
- [最终总结](./STORAGE_SERVICE_FINAL_SUMMARY.md) - 深入理解

## 🛠️ 故障排查步骤

1. **检查日志**
   ```bash
   docker logs interview-storage-service
   ```

2. **验证连接**
   ```bash
   curl http://localhost:8081/api/sessions
   ```

3. **检查依赖**
   ```bash
   docker exec interview-redis redis-cli ping
   ```

4. **运行诊断脚本**
   ```bash
   ./verify-storage-deployment.sh
   ```

5. **查看详细信息**
   ```bash
   docker inspect interview-storage-service
   ```

## 📞 获取帮助

- 查看对应的文档
- 运行诊断脚本
- 检查应用日志
- 查看 Docker 事件

## ✨ 最后的话

**已完成的工作:**
- ✅ 优化了 Dockerfile 和 Spring Boot 配置
- ✅ 集成到 Docker Compose
- ✅ 创建了部署脚本
- ✅ 编写了完整文档
- ✅ 提供了验证工具

**现在您可以:**
1. 快速启动服务
2. 安全地部署到生产环境
3. 监控和优化性能
4. 解决常见问题

---

## 📌 快速链接

| 需要什么 | 点击这里 |
|---------|---------|
| 快速启动 | [5分钟指南](./STORAGE_SERVICE_QUICK_REF.md) |
| 详细步骤 | [完整指南](./STORAGE_SERVICE_DEPLOYMENT_GUIDE.md) |
| 脚本帮助 | `./deploy-storage-service.sh --help` |
| 验证部署 | `./verify-storage-deployment.sh` |
| 环境配置 | [.env.prod.example](./.env.prod.example) |

---

**祝您部署顺利！** 🎉

*最后更新: 2025-10-27*
*版本: 1.0.0*
