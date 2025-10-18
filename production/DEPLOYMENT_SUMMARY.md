# AI面试系统 - Docker生产环境部署总结

## 已完成的工作

### 1. 项目结构重组

```
interview-system/
├── backend/                    # Node.js后端服务（Mock + WebSocket）
├── backend-java/              # Java后端服务（新建）
│   ├── src/main/java/        # Java源码（从backend/main/java复制）
│   ├── src/main/resources/   # 配置文件（从backend/main/resources复制）
│   ├── Dockerfile            # Java服务Dockerfile
│   └── pom.xml               # Maven配置
├── frontend/                  # Vue.js前端
├── storage-service/          # 存储服务API（已更新支持新工作流）
└── production/               # 生产环境配置（重点）
    ├── docker-compose.production.yml  # Docker Compose配置
    ├── .env.production                # 环境变量配置
    ├── init-db.sql                    # 数据库初始化脚本
    ├── deploy.sh                      # Linux/Mac部署脚本
    ├── deploy.ps1                     # Windows部署脚本
    ├── README.md                      # 部署文档
    └── nginx/nginx.conf              # Nginx配置
```

### 2. Docker配置文件

#### A. docker-compose.production.yml
包含6个服务的完整配置：
- **mysql**: MySQL 8.0数据库
- **redis**: Redis 7缓存
- **storage-api**: 存储服务API
- **backend-java**: Java Spring Boot后端
- **backend-node**: Node.js Express后端
- **frontend**: Vue.js + Nginx前端

#### B. 环境变量配置 (.env.production)
包含所有服务的配置参数：
- 数据库密码
- Redis密码
- JWT密钥
- OpenAI API密钥
- Dify工作流配置
- 端口映射

### 3. 后端服务更新

#### A. Java后端整合
- 创建了 `backend-java/` 目录结构
- 配置了pom.xml（包含所有依赖）
- 创建了Dockerfile（多阶段构建）
- 支持Dify工作流集成

#### B. Storage Service更新
已在之前的对话中完成：
- 支持新的QuestionData数据结构
- 保持向后兼容
- 支持生成问题工作流

### 4. 数据库初始化

创建了 `init-db.sql`，包含：
- 用户表 (users)
- 面试会话表 (interview_sessions)
- 面试对话表 (interview_dialogues)
- 题目库表 (questions)
- 类别表 (categories)
- 默认示例数据

### 5. 部署脚本

#### Linux/Mac (deploy.sh)
- 自动检查Docker环境
- 准备Java后端源码
- 创建必要目录
- 构建Docker镜像
- 启动所有服务
- 健康检查

#### Windows (deploy.ps1)
- PowerShell脚本
- 支持 -Build, -NoBuild, -Down, -Restart 参数
- 完整的错误检查
- 彩色输出

## 部署流程

### 准备阶段

1. **准备Java后端源码**
```bash
cd production
# 脚本会自动将 backend/main/java 复制到 backend-java/src/main/java
# 脚本会自动将 backend/main/resources 复制到 backend-java/src/main/resources
```

2. **配置环境变量**
```bash
cp .env.production .env.production.local
vim .env.production.local  # 修改密码和API密钥
```

### 执行部署

#### 方式一：使用部署脚本（推荐）

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
.\deploy.ps1
```

#### 方式二：手动部署

```bash
# 1. 准备后端代码
mkdir -p ../backend-java/src/main/java
mkdir -p ../backend-java/src/main/resources
cp -r ../backend/main/java/* ../backend-java/src/main/java/
cp -r ../backend/main/resources/* ../backend-java/src/main/resources/

# 2. 构建镜像
docker-compose -f docker-compose.production.yml build

# 3. 启动服务
docker-compose -f docker-compose.production.yml up -d

# 4. 查看状态
docker-compose -f docker-compose.production.yml ps
```

## 服务端口映射

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|---------|---------|------|
| Frontend | 80 | 80 | 前端Web服务 |
| Backend Java | 8080 | 8080 | Java API |
| Backend Node | 3001 | 3001 | Node.js API + WebSocket |
| Storage API | 8080 | 8090 | 存储服务 |
| MySQL | 3306 | 3307 | 数据库 |
| Redis | 6379 | 6380 | 缓存 |

## 验证部署

### 1. 检查容器状态
```bash
docker-compose -f docker-compose.production.yml ps
```

所有服务状态应该为 "Up" 或 "healthy"。

### 2. 健康检查
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

### 3. 查看日志
```bash
# 所有服务
docker-compose -f docker-compose.production.yml logs -f

# 特定服务
docker-compose -f docker-compose.production.yml logs -f backend-java
```

## 常见问题

### 1. Java后端构建失败

**原因**: 源码路径不正确或pom.xml缺失

**解决**:
```bash
# 确保目录结构正确
ls -la ../backend-java/
ls -la ../backend-java/src/main/java/
ls -la ../backend-java/pom.xml

# 手动复制源码
cp -r ../backend/main/java/* ../backend-java/src/main/java/
cp -r ../backend/main/resources/* ../backend-java/src/main/resources/
```

### 2. MySQL连接失败

**原因**: MySQL未完全启动或密码错误

**解决**:
```bash
# 查看MySQL日志
docker-compose -f docker-compose.production.yml logs mysql

# 等待MySQL完全启动（约30秒）
docker-compose -f docker-compose.production.yml ps

# 测试连接
docker exec -it interview-mysql mysql -uroot -p
```

### 3. 前端无法访问后端

**原因**: Nginx配置错误或后端未启动

**解决**:
```bash
# 检查Nginx配置
docker exec interview-frontend cat /etc/nginx/nginx.conf

# 检查后端状态
curl http://localhost:8080/actuator/health
curl http://localhost:3001/api/health

# 查看Nginx日志
docker-compose -f docker-compose.production.yml logs frontend
```

## 服务管理命令

### 启动/停止/重启
```bash
# 启动所有服务
docker-compose -f docker-compose.production.yml up -d

# 停止所有服务
docker-compose -f docker-compose.production.yml down

# 重启服务
docker-compose -f docker-compose.production.yml restart

# 重启特定服务
docker-compose -f docker-compose.production.yml restart backend-java
```

### 更新服务
```bash
# 重新构建并启动
docker-compose -f docker-compose.production.yml up -d --build

# 只重新构建Java后端
docker-compose -f docker-compose.production.yml build backend-java
docker-compose -f docker-compose.production.yml up -d backend-java
```

### 查看日志
```bash
# 实时查看所有日志
docker-compose -f docker-compose.production.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.production.yml logs -f backend-java

# 查看最近100行
docker-compose -f docker-compose.production.yml logs --tail=100 frontend
```

### 清理
```bash
# 停止并删除容器（保留数据卷）
docker-compose -f docker-compose.production.yml down

# 停止、删除容器和数据卷
docker-compose -f docker-compose.production.yml down -v

# 清理未使用的镜像
docker image prune -a
```

## 数据备份

### MySQL备份
```bash
# 备份
docker exec interview-mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} interview_system > backup.sql

# 恢复
docker exec -i interview-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} interview_system < backup.sql
```

### Redis备份
```bash
# 触发保存
docker exec interview-redis redis-cli -a ${REDIS_PASSWORD} BGSAVE

# 复制备份文件
docker cp interview-redis:/data/dump.rdb ./redis_backup.rdb
```

## 性能优化建议

### 1. 资源限制
在 `docker-compose.production.yml` 中设置合理的资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

### 2. JVM优化
调整Java服务的JVM参数：

```yaml
environment:
  JAVA_OPTS: "-Xms512m -Xmx1024m -XX:+UseG1GC"
```

### 3. MySQL优化
```yaml
command:
  - --max_connections=500
  - --innodb_buffer_pool_size=512M
```

### 4. Redis优化
```yaml
command:
  - redis-server
  - --maxmemory 1gb
  - --maxmemory-policy allkeys-lru
```

## 安全建议

1. **修改所有默认密码**
2. **使用强密码**（至少16位，包含大小写字母、数字、特殊字符）
3. **限制端口访问**（使用防火墙）
4. **启用HTTPS**（配置SSL证书）
5. **定期备份数据**
6. **定期更新依赖**
7. **监控日志和访问**

## 下一步

1. **配置域名和SSL**: 使用Let's Encrypt获取免费SSL证书
2. **设置监控**: 使用Prometheus + Grafana监控系统
3. **配置CI/CD**: 使用GitHub Actions或Jenkins自动化部署
4. **负载均衡**: 使用Nginx或Traefik进行负载均衡
5. **日志聚合**: 使用ELK Stack或Grafana Loki

---

**部署完成日期**: 2025-01-13
**版本**: 1.0.0
