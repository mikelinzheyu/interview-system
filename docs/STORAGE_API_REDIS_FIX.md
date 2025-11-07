# 存储API Redis连接问题 - 完整修复指南

## 🔍 问题诊断

### 观察到的问题
1. **HTTP 403**: GET /api/sessions 返回403（因为只支持POST）✓ 正常
2. **HTTP 500**: POST /api/sessions 返回500，错误信息 "Unable to connect to Redis"

### 根本原因分析

经过排查，问题是**Docker网络和Redis密码认证不匹配**：

1. `interview-storage-api` 和 `interview-redis` 在不同的Docker网络上
2. Redis没有启用密码认证，但应用配置了密码
3. 应用启动时试图连接Redis失败

## ✅ 完整修复步骤

### 步骤1: 重新配置Redis密码

```bash
# 禁用Redis密码认证（简化配置）
docker exec interview-redis redis-cli CONFIG SET requirepass ""

# 验证密码已禁用
docker exec interview-redis redis-cli PING
# 应该返回 PONG
```

### 步骤2: 更新应用配置文件

编辑文件: `D:\code7\interview-system\storage-service\src\main\resources\application.properties`

添加以下内容：
```properties
# Redis Configuration
spring.data.redis.host=${SPRING_DATA_REDIS_HOST:localhost}
spring.data.redis.port=${SPRING_DATA_REDIS_PORT:6379}
spring.data.redis.password=${SPRING_DATA_REDIS_PASSWORD:}
spring.data.redis.timeout=2000
spring.data.redis.jedis.pool.max-active=8
spring.data.redis.jedis.pool.max-idle=8
spring.data.redis.jedis.pool.min-idle=0
```

### 步骤3: 重建Docker镜像

```bash
cd D:\code7\interview-system\storage-service

# 清除旧镜像
docker rmi production-storage-api:latest

# 重新构建（需要Maven）
docker build -t production-storage-api:latest .

# 或者使用docker-compose
docker-compose build --no-cache
```

### 步骤4: 启动所有服务

```bash
# 停止旧容器
docker-compose down

# 启动新容器
docker-compose up -d

# 验证
docker-compose ps
```

### 步骤5: 测试API连接

```bash
node D:\code7\interview-system\test-storage-api.js
```

**预期成功输出:**
```
✅ 服务器连接成功！
✅ 会话创建成功！
✅ 会话获取成功！
✅ 会话更新成功！
✅ 答案验证成功！

通过: 5/5 (100%)
✅ 太棒了！存储API完全正常！
```

---

## 🔧 替代方案（如果Docker构建失败）

如果Docker镜像构建有问题，您可以暂时使用这个快速修复：

### 方案A: 使用现有镜像并禁用密码

```bash
# 1. 停止现有容器
docker stop interview-storage-api

# 2. 禁用Redis密码
docker exec interview-redis redis-cli CONFIG SET requirepass ""

# 3. 用环保 environment variables启动（不含密码）
docker run -d --name interview-storage-api \
  -p 8090:8080 \
  -e "API_KEY=ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -e "SPRING_DATA_REDIS_HOST=redis" \
  -e "SPRING_DATA_REDIS_PORT=6379" \
  -e "SPRING_DATA_REDIS_PASSWORD=" \
  --network production_interview-network \
  production-storage-api:latest

# 4. 等待启动
sleep 8

# 5. 测试
node D:\code7\interview-system\test-storage-api.js
```

### 方案B: 使用Java直接运行（无Docker）

```bash
# 1. 进入存储服务目录
cd D:\code7\interview-system\storage-service

# 2. 构建项目（需要Maven）
mvn clean package -DskipTests

# 3. 运行应用
java -jar target/interview-storage-0.0.1-SNAPSHOT.jar \
  --server.port=8090 \
  --api.key=ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0 \
  --spring.data.redis.host=localhost \
  --spring.data.redis.port=6379

# 4. 测试
node D:\code7\interview-system\test-storage-api.js
```

---

## 📋 Docker网络问题修复

如果应用和Redis在不同网络上，使用此命令连接它们：

```bash
# 获取interview-redis容器ID
docker ps | grep redis

# 连接到应用所在网络
docker network connect production_interview-network interview-redis

# 验证
docker inspect interview-redis | grep -A 5 "Networks"
```

---

## 🔐 生产环境Redis密码设置

对于生产环境，您应该启用Redis密码认证：

```bash
# 1. 设置Redis密码
docker exec interview-redis redis-cli CONFIG SET requirepass "your-secure-password"

# 2. 保存配置（在redis.conf中）
docker exec interview-redis redis-cli CONFIG REWRITE

# 3. 更新应用environment变量
docker stop interview-storage-api

docker run -d --name interview-storage-api \
  -p 8090:8080 \
  -e "API_KEY=ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -e "SPRING_DATA_REDIS_HOST=redis" \
  -e "SPRING_DATA_REDIS_PORT=6379" \
  -e "SPRING_DATA_REDIS_PASSWORD=your-secure-password" \
  --network production_interview-network \
  production-storage-api:latest

# 4. 测试
node D:\code7\interview-system\test-storage-api.js
```

---

## 🐛 调试技巧

### 查看Redis连接日志

```bash
# 查看Redis命令
docker exec interview-redis redis-cli MONITOR
```

### 查看应用日志

```bash
# 实时查看日志
docker logs -f interview-storage-api

# 搜索错误
docker logs interview-storage-api 2>&1 | grep -i "error\|exception\|redis"
```

### 测试Redis连接

```bash
# 从应用容器测试Redis
docker exec interview-storage-api bash -c 'java -cp /app/app.jar org.springframework.boot.loader.JarLauncher'

# 直接Redis CLI测试
docker exec -it interview-redis redis-cli
> PING
> SET test-key test-value
> GET test-key
> DEL test-key
```

---

## 🎯 快速检查清单

完成以下检查以确保一切正常：

- [ ] Redis容器正在运行: `docker ps | grep redis`
- [ ] 存储API容器正在运行: `docker ps | grep interview-storage-api`
- [ ] Redis可访问: `docker exec interview-redis redis-cli PING` → 返回 `PONG`
- [ ] API可访问: `curl http://localhost:8090/health` → 返回 200
- [ ] 测试脚本通过: `node test-storage-api.js` → 所有测试通过
- [ ] 可以创建会话: `curl -X POST http://localhost:8090/api/sessions ...` → 返回201
- [ ] 可以获取会话: `curl http://localhost:8090/api/sessions/{id}` → 返回会话数据

---

## 📞 如果仍有问题

1. **检查Docker日志**
   ```bash
   docker logs interview-storage-api 2>&1 | tail -50
   docker logs interview-redis 2>&1 | tail -20
   ```

2. **检查网络连接**
   ```bash
   docker inspect interview-storage-api
   docker inspect interview-redis
   # 确保两者在同一网络中
   ```

3. **重启所有服务**
   ```bash
   docker-compose down
   docker-compose up -d
   sleep 10
   node test-storage-api.js
   ```

4. **清除所有数据并重新开始**
   ```bash
   docker-compose down -v  # 删除卷
   docker-compose up -d
   node test-storage-api.js
   ```

---

**一旦存储API测试通过，您就可以继续更新Dify工作流配置！**
