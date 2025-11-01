# Docker 网络DNS问题 - 快速参考

## 问题
容器无法通过主机名 (例如 `redis`) 连接到其他容器，导致连接超时或DNS解析失败。

## 根本原因
某些Docker网络配置不支持自动DNS解析。

## 快速修复

### 方法1: 使用IP地址（推荐，最可靠）

```bash
# 1. 获取目标容器的IP
docker inspect TARGET_CONTAINER | grep -A 30 "NETWORK_NAME" | grep "IPAddress"

# 2. 使用该IP启动容器
docker run -d \
  --name MY_APP \
  -e "TARGET_HOST=<IP_ADDRESS>" \
  --network NETWORK_NAME \
  MY_IMAGE
```

**对于我们的场景**:
```bash
# 获取Redis IP
docker inspect interview-redis | grep -A 30 "production_interview-network" | grep "IPAddress"
# 输出: "IPAddress": "172.25.0.5"

# 启动存储API，使用Redis IP而非主机名
docker run -d \
  --name interview-storage-api \
  -p 8090:8080 \
  -e "SPRING_DATA_REDIS_HOST=172.25.0.5" \
  -e "SPRING_DATA_REDIS_PORT=6379" \
  --network production_interview-network \
  production-storage-api:latest
```

### 方法2: 使用Docker Compose（生产推荐）

**docker-compose.yml**:
```yaml
version: '3.9'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - interview-network

  storage-api:
    image: production-storage-api:latest
    ports:
      - "8090:8080"
    environment:
      SPRING_DATA_REDIS_HOST: redis  # DNS自动工作
      SPRING_DATA_REDIS_PORT: 6379
    depends_on:
      - redis
    networks:
      - interview-network

networks:
  interview-network:
    driver: bridge
```

然后运行:
```bash
docker-compose up -d
```

## 验证修复

```bash
# 检查容器是否可以连接
docker exec interview-storage-api \
  curl -i http://172.25.0.5:6379

# 如果收到Redis协议错误（而非DNS错误），说明连接成功
# 运行应用测试
node test-storage-api.js
```

## 常见错误及解决

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `Could not resolve host: redis` | DNS失败 | 使用IP地址 |
| `Connection refused` | 端口错误 | 检查目标容器端口 |
| `Network not found` | 网络不存在 | `docker network ls` 确认 |
| `timeout` | 容器未启动 | `docker logs` 检查 |

## 预防措施

1. **始终使用 docker-compose** 进行多容器应用
2. **避免硬编码IP** 在环境变量中（使用主机名或docker-compose）
3. **检查网络连接**: `docker network inspect NETWORK_NAME`
4. **使用 `depends_on`** 确保启动顺序
5. **查看日志**: `docker logs -f CONTAINER_NAME`

---

**记住**: Docker Compose会自动为您处理DNS，这是生产环境的最佳实践。只在必要时使用IP地址。
