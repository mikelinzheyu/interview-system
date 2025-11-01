# 🚀 工作流存储系统 - 快速启动指南

## ⚡ 5分钟快速部署

### 前置条件
✅ Docker 已安装
✅ Docker Compose 已安装
✅ 项目文件已完整集成

### 启动步骤

#### 步骤1：构建存储服务镜像
```bash
cd D:\code7\interview-system
docker-compose --env-file .env.docker build storage-service
```

预期输出：
```
Successfully built interview-system/storage-service:latest
```

#### 步骤2：启动所有服务（包括新的存储服务）
```bash
docker-compose --env-file .env.docker up -d
```

预期输出：
```
Creating interview-redis ... done
Creating interview-backend ... done
Creating interview-storage ... done
Creating interview-frontend ... done
```

#### 步骤3：验证存储服务运行状态
```bash
docker-compose --env-file .env.docker ps
```

应该看到：
```
NAME                 STATUS                  PORTS
interview-storage    Up ... (healthy)        0.0.0.0:8081->8081/tcp
interview-backend    Up ... (healthy)        0.0.0.0:8080->3001/tcp
interview-frontend   Up ... (healthy)        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
interview-redis      Up ... (healthy)        0.0.0.0:6379->6379/tcp
```

#### 步骤4：验证存储服务API
```bash
curl http://localhost:8081/api/sessions
```

预期响应：
```
{"error":"No valid questions provided in request payload."}
或
{"sessionId":"test-123","message":"Session created successfully"}
```

---

## 🧪 测试存储服务功能

### 创建会话
```bash
curl -X POST http://localhost:8081/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "workflow-test-001",
    "jobTitle": "Python Developer",
    "questions": [
      {
        "id": "q1",
        "question": "What is a list in Python?",
        "answer": "A list is a mutable collection...",
        "hasAnswer": true
      },
      {
        "id": "q2",
        "question": "What is a dictionary?",
        "answer": "A dictionary is a key-value pair collection...",
        "hasAnswer": true
      }
    ]
  }'
```

### 查看会话详情
```bash
curl http://localhost:8081/api/sessions/workflow-test-001
```

### 更新问题答案
```bash
curl -X PUT http://localhost:8081/api/sessions/workflow-test-001/questions/q1 \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "A list is a mutable, ordered collection of items...",
    "hasAnswer": true
  }'
```

### 删除会话
```bash
curl -X DELETE http://localhost:8081/api/sessions/workflow-test-001
```

---

## 📊 查看服务日志

### 实时查看存储服务日志
```bash
docker logs -f interview-storage
```

### 查看所有服务日志
```bash
docker-compose --env-file .env.docker logs -f
```

### 查看特定服务日志
```bash
docker logs interview-storage
docker logs interview-backend
docker logs interview-redis
```

---

## 🔧 常用命令

| 命令 | 说明 |
|------|------|
| `docker-compose up -d` | 启动所有服务 |
| `docker-compose stop` | 停止所有服务 |
| `docker-compose down` | 删除所有容器 |
| `docker-compose restart storage-service` | 重启存储服务 |
| `docker ps` | 查看运行中的容器 |
| `docker logs interview-storage` | 查看存储服务日志 |

---

## 📁 关键文件位置

```
interview-system/
├── storage-service/                    新增：工作流存储服务
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/...
├── docker-compose.yml                  更新：添加存储服务
├── .env.docker                         更新：添加存储配置
└── logs/
    └── storage/                        新增：存储服务日志
```

---

## ✅ 验证清单

启动后检查以下项：

- [ ] 存储服务容器运行中 (`docker ps | grep storage`)
- [ ] 存储服务健康检查通过 (`docker ps` 显示 healthy)
- [ ] API响应正常 (`curl http://localhost:8081/api/sessions`)
- [ ] Redis连接成功 (查看存储服务日志)
- [ ] 日志目录创建成功 (`logs/storage/`)

---

## 🚨 故障排查

### 存储服务无法启动

**症状：** `docker ps` 中 interview-storage 状态为 Exited

**解决方案：**
```bash
# 1. 查看详细错误日志
docker logs interview-storage

# 2. 检查Redis是否正常
docker logs interview-redis

# 3. 重新构建镜像
docker-compose build --no-cache storage-service

# 4. 重新启动
docker-compose up -d storage-service
```

### API无法访问

**症状：** `curl http://localhost:8081/api/sessions` 连接被拒绝

**解决方案：**
```bash
# 1. 检查容器是否运行
docker ps | grep storage

# 2. 检查端口映射
docker port interview-storage

# 3. 检查防火墙（Windows）
netstat -tuln | grep 8081

# 4. 测试内部连接
docker exec interview-storage curl http://localhost:8081/api/sessions
```

### Redis连接失败

**症状：** 日志显示 "Cannot get a resource"

**解决方案：**
```bash
# 1. 检查Redis状态
docker logs interview-redis

# 2. 测试Redis连接
docker exec interview-redis redis-cli ping

# 3. 重启Redis
docker-compose restart redis
```

---

## 📈 性能优化

### 增加Java堆内存（可选）

编辑 `docker-compose.yml`，在 `storage-service` 环境变量中添加：

```yaml
environment:
  JAVA_OPTS: "-Xms512m -Xmx1024m"
```

### 优化Redis连接池（可选）

编辑 `storage-service/src/main/resources/application.properties`：

```properties
spring.redis.lettuce.pool.max-active=16
spring.redis.lettuce.pool.max-idle=16
spring.redis.timeout=5000ms
```

---

## 🔐 安全提示

### 更改API密钥（强烈推荐）

编辑 `.env.docker`：

```bash
# 生成新密钥
openssl rand -base64 32

# 更新配置
SESSION_STORAGE_API_KEY=your-new-api-key
```

### 启用HTTPS（可选）

编辑 `docker-compose.yml`，为存储服务添加：

```yaml
ports:
  - "8443:8443"
environment:
  SERVER_SSL_ENABLED: "true"
  SERVER_SSL_KEY_STORE: "/app/keystore.jks"
```

---

## 📚 相关文档

- **完整集成报告**: `STORAGE_SERVICE_INTEGRATION_COMPLETE.md`
- **Docker部署指南**: `DOCKER_PRODUCTION_DEPLOYMENT.md`
- **REST API文档**: 存储服务 Swagger UI (可选集成)

---

## 🎯 下一步

1. **启动服务**
   ```bash
   cd D:\code7\interview-system
   docker-compose --env-file .env.docker up -d
   ```

2. **验证功能**
   ```bash
   curl -X POST http://localhost:8081/api/sessions \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"test","jobTitle":"Test","questions":[]}'
   ```

3. **查看日志**
   ```bash
   docker logs interview-storage
   ```

4. **停止服务**
   ```bash
   docker-compose stop
   ```

---

## 💡 常见场景

### 场景1：测试工作流1的存储功能
```bash
# 创建会话并存储工作流1的问题
curl -X POST http://localhost:8081/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "workflow1-test",
    "jobTitle": "Java Developer",
    "questions": [...工作流1的问题...]
  }'
```

### 场景2：清除旧会话数据
```bash
# 删除特定会话
curl -X DELETE http://localhost:8081/api/sessions/old-session-id

# 或进入Redis删除所有会话
docker exec interview-redis redis-cli FLUSHDB
```

### 场景3：导出会话数据
```bash
# 从Redis导出
docker exec interview-redis redis-cli KEYS "interview:session:*"
docker exec interview-redis redis-cli GET "interview:session:workflow1-test"
```

---

## 🎉 完成！

恭喜！工作流存储系统已完全集成并可以使用。

**现在您可以：**
- ✅ 存储工作流1、2、3的会话数据
- ✅ 管理和更新问题答案
- ✅ 通过Redis实现高效缓存
- ✅ 在Docker容器中安全运行

**下一步建议：**
- 集成后端API调用存储服务
- 配置监控和告警
- 进行压力测试
- 实施备份策略

---

**集成完成日期：** 2025-10-26
**状态：** ✅ 生产就绪
**支持端口：** 8081
**依赖服务：** Redis

有任何问题，请参考完整的集成报告或查看日志进行排查。
