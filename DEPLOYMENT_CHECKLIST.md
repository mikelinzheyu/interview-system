# 生产部署检查清单

## ✅ 文件准备完成

### 核心Docker配置
- ✅ docker-compose.prod.yml - 完整生产编排文件
- ✅ backend/Dockerfile.prod - Node.js后端多阶段构建
- ✅ frontend/Dockerfile.prod - Vue 3前端多阶段构建
- ✅ storage-service/Dockerfile.prod - Java存储服务多阶段构建

### Nginx配置
- ✅ nginx/prod.conf - 生产级反向代理和负载均衡
- ✅ frontend/conf/server.conf - 前端Nginx配置
- ✅ nginx/ssl/ - SSL证书目录(需创建证书)

### 环境和配置
- ✅ .env.prod - 生产环境变量文件
- ✅ monitoring/prometheus.yml - Prometheus监控配置

### 部署脚本
- ✅ deploy-prod.sh - Linux/macOS自动部署脚本
- ✅ deploy-prod.bat - Windows自动部署脚本
- ✅ health-check.sh - 系统健康检查脚本

### 文档
- ✅ PRODUCTION_DEPLOYMENT.md - 完整部署指南(40KB)
- ✅ DEPLOYMENT_SUMMARY.md - 部署总结和概览
- ✅ QUICK_DEPLOYMENT_REFERENCE.md - 快速参考卡片
- ✅ DEPLOYMENT_CHECKLIST.md - 本清单

---

## 📋 部署前准备 (按优先级)

### 🔴 关键 - 必须完成

- [ ] **检查系统要求**
  - [ ] Docker版本 ≥ 20.10
    ```bash
    docker --version
    ```
  - [ ] docker-compose版本 ≥ 2.0
    ```bash
    docker-compose --version
    ```
  - [ ] 磁盘空间 ≥ 50GB
    ```bash
    df -h
    ```
  - [ ] 可用内存 ≥ 8GB
    ```bash
    free -h  # Linux
    wmic OS get TotalVisibleMemorySize  # Windows
    ```

- [ ] **配置环境变量**
  - [ ] 复制 `.env.docker` 到 `.env.prod`
    ```bash
    cp .env.docker .env.prod
    ```
  - [ ] 编辑 `.env.prod` 修改以下项:
    - [ ] `DB_PASSWORD` - PostgreSQL密码 (强密码)
    - [ ] `REDIS_PASSWORD` - Redis密码 (强密码)
    - [ ] `JWT_SECRET` - JWT签名密钥 (≥32字符)
    - [ ] `DIFY_API_KEY` - Dify API密钥
    - [ ] `DIFY_API_BASE_URL` - Dify API地址
    - [ ] 其他根据实际情况修改的项

- [ ] **生成SSL证书**
  - [ ] 创建证书目录
    ```bash
    mkdir -p nginx/ssl
    ```
  - [ ] 选择证书方案:
    - [ ] 自签证书(开发/测试)
      ```bash
      openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem
      ```
    - [ ] Let's Encrypt证书(生产推荐)
      - [ ] 安装certbot
      - [ ] 运行certbot获取证书
      - [ ] 复制证书到nginx/ssl/
    - [ ] 商业证书
      - [ ] 获取PEM格式证书和私钥
      - [ ] 放置到nginx/ssl/

- [ ] **创建数据目录结构**
  ```bash
  mkdir -p data/db/{init,backups}
  mkdir -p data/redis
  mkdir -p data/backend/uploads
  mkdir -p data/storage
  mkdir -p data/frontend/cache
  mkdir -p data/proxy/cache
  mkdir -p logs/{db,redis,backend,storage,frontend,proxy}
  ```

### 🟠 重要 - 强烈建议

- [ ] **验证防火墙配置**
  - [ ] 允许入站端口80 (HTTP)
  - [ ] 允许入站端口443 (HTTPS)
  - [ ] 限制其他端口访问

- [ ] **准备备份方案**
  - [ ] 创建备份脚本
  - [ ] 配置备份计划
  - [ ] 测试恢复流程

- [ ] **配置日志收集**
  - [ ] 创建logs目录
  - [ ] 配置日志轮转
  - [ ] 可选：启用监控profile

- [ ] **DNS和域名配置**
  - [ ] 获取域名(如有)
  - [ ] 配置DNS A记录指向服务器
  - [ ] 验证DNS解析

### 🟡 建议 - 生产最佳实践

- [ ] **启用监控服务**
  ```bash
  docker-compose -f docker-compose.prod.yml --profile monitoring up -d
  ```

- [ ] **配置日志堆栈**
  ```bash
  docker-compose -f docker-compose.prod.yml --profile logging up -d
  ```

- [ ] **设置系统告警**
  - [ ] CPU使用率告警 (>80%)
  - [ ] 内存使用率告警 (>90%)
  - [ ] 磁盘使用率告警 (>85%)
  - [ ] 服务宕机告警

- [ ] **准备文档**
  - [ ] 保存管理员凭证
  - [ ] 记录API密钥
  - [ ] 文档系统架构
  - [ ] 准备运维手册

---

## 🚀 部署执行

### 阶段1: 验证和准备 (5分钟)

```bash
# 1. 进入项目目录
cd /path/to/interview-system

# 2. 验证配置
echo "检查.env.prod存在..."
test -f .env.prod && echo "✓ .env.prod存在" || echo "✗ 错误: .env.prod不存在"

# 3. 验证Dockerfile
for f in backend/Dockerfile.prod frontend/Dockerfile.prod storage-service/Dockerfile.prod; do
  test -f "$f" && echo "✓ $f存在" || echo "✗ 错误: $f不存在"
done

# 4. 验证目录结构
mkdir -p logs/{db,redis,backend,storage,frontend,proxy}
mkdir -p data/{db/init,db/backups,redis,backend/uploads,storage,frontend/cache,proxy/cache}
mkdir -p nginx/ssl
echo "✓ 目录结构创建完成"
```

### 阶段2: 构建镜像 (10-30分钟)

```bash
# 显示构建进度
docker-compose -f docker-compose.prod.yml build --no-cache

# 验证镜像
docker images | grep interview-system

# 应该看到:
# interview-system/backend          latest
# interview-system/frontend         latest
# interview-system/storage-service  latest
```

### 阶段3: 启动服务 (3-5分钟)

```bash
# 启动所有核心服务
docker-compose -f docker-compose.prod.yml up -d

# 查看启动进度
docker-compose -f docker-compose.prod.yml logs -f

# 等待所有服务就绪 (约30-60秒)
sleep 30
docker-compose -f docker-compose.prod.yml ps
```

### 阶段4: 验证部署 (5分钟)

```bash
# 运行健康检查脚本
./health-check.sh

# 手动验证关键服务
echo "检查前端..." && curl -k https://localhost/health
echo "检查后端API..." && curl -k https://localhost/api/health  
echo "检查数据库..." && docker exec interview-db psql -U admin -d interview_system -c "SELECT 1"
echo "检查Redis..." && docker exec interview-redis redis-cli ping

# 所有应该都返回成功
```

---

## 🔍 部署后检查

### 立即验证 (1小时内)

- [ ] **访问应用**
  - [ ] 打开 https://localhost 检查前端
  - [ ] 访问 https://localhost/api/health 检查后端
  - [ ] 查看浏览器控制台，确认无错误

- [ ] **检查容器状态**
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  # 所有容器状态应为 Up
  ```

- [ ] **验证数据库**
  ```bash
  docker exec interview-db psql -U admin -d interview_system -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public'"
  ```

- [ ] **检查日志**
  ```bash
  docker-compose -f docker-compose.prod.yml logs --tail=100
  # 不应有ERROR或CRITICAL信息
  ```

### 功能测试 (部署后第一天)

- [ ] **API测试**
  - [ ] 测试健康检查端点
  - [ ] 测试主要API功能
  - [ ] 检查错误处理

- [ ] **数据库测试**
  - [ ] 创建测试数据
  - [ ] 验证持久化
  - [ ] 测试查询性能

- [ ] **前端测试**
  - [ ] 导航各页面
  - [ ] 测试API集成
  - [ ] 检查资源加载

### 性能测试 (部署后第一周)

- [ ] **负载测试**
  ```bash
  # 使用Apache Bench或wrk
  ab -n 1000 -c 10 https://localhost/
  ```

- [ ] **资源监控**
  ```bash
  # 监控CPU和内存
  docker stats
  ```

- [ ] **日志分析**
  ```bash
  # 检查日志中的性能指标
  docker-compose -f docker-compose.prod.yml logs backend | grep response_time
  ```

---

## 📊 部署后监控指标

### 关键性能指标 (KPI)

| 指标 | 目标 | 告警值 |
|------|------|--------|
| API响应时间 | <500ms | >1s |
| 数据库查询时间 | <100ms | >500ms |
| Redis延迟 | <10ms | >50ms |
| 前端加载时间 | <3s | >5s |
| CPU使用率 | <60% | >80% |
| 内存使用率 | <70% | >90% |
| 磁盘使用率 | <60% | >85% |
| 可用性 | 99.9% | <99% |

---

## 🔐 安全检查清单

部署后必须验证:

- [ ] **HTTPS/SSL**
  - [ ] 访问HTTP自动重定向到HTTPS
  - [ ] SSL证书有效期>30天
  - [ ] 没有SSL警告

- [ ] **身份验证**
  - [ ] 默认凭证已更改
  - [ ] API密钥配置正确
  - [ ] JWT令牌功能正常

- [ ] **访问控制**
  - [ ] 数据库不可从外部访问
  - [ ] Redis不可从外部访问
  - [ ] 只有必要的端口开放

- [ ] **数据保护**
  - [ ] 数据加密传输
  - [ ] 敏感数据未暴露在日志中
  - [ ] 备份数据已加密

---

## 📝 部署记录

部署完成后填写:

```
部署日期: __________
部署人员: __________
部署环境: ☐ 开发 ☐ 测试 ☐ 生产
服务器IP: __________
域名: __________
数据库版本: __________
Redis版本: __________
Node.js版本: __________
Java版本: __________
总部署时间: __________分钟
问题和解决: ____________________________
签名: __________
```

---

## 🆘 故障快速修复

### 问题: 容器无法启动
```bash
docker-compose -f docker-compose.prod.yml logs backend
# 查看具体错误信息
```

### 问题: 无法连接API
```bash
# 1. 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 2. 检查网络
docker network inspect interview-network

# 3. 检查日志
docker exec interview-backend cat logs/*.log
```

### 问题: 数据库连接失败
```bash
# 1. 检查数据库容器
docker-compose -f docker-compose.prod.yml logs db

# 2. 验证连接
docker exec interview-db psql -U admin -d interview_system -c "\dt"

# 3. 重启数据库
docker-compose -f docker-compose.prod.yml restart db
```

---

## ✅ 最终确认

所有项目完成后，在下方签名:

- [ ] 所有前置检查已完成
- [ ] 所有部署步骤已执行
- [ ] 所有验证测试已通过
- [ ] 所有安全检查已完成
- [ ] 监控告警已配置
- [ ] 文档已更新
- [ ] 团队已培训
- [ ] 备份已验证

**部署状态**: ✅ 生产就绪

**负责人**: ________________  
**确认时间**: ________________  
**计划维护窗口**: ________________  

---

**文档版本**: 1.0.0  
**最后更新**: 2024-10-27  
**有效期**: 至2025-10-27
