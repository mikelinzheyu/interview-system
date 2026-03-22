# Docker 生产环境联调测试 - 故障排查指南

## 🆘 快速诊断流程

如果启动失败，按以下步骤逐一排查:

### 步骤1: 验证 Docker 环境

```bash
# 检查 Docker 运行
docker ps

# 预期: 显示正在运行的容器列表

# 如果显示 "Cannot connect to Docker daemon"
# ❌ Docker 未启动
# ✅ 启动 Docker Desktop / systemctl start docker
```

### 步骤2: 检查环境变量

```bash
# 验证环境变量已设置
echo $DIFY_INTERVIEW_INIT_KEY
echo $DIFY_INTERVIEW_CHAT_KEY
echo $DIFY_INTERVIEW_VERDICT_KEY

# 预期: 显示三个 API 密钥

# 如果为空:
# ❌ 环境变量未设置
# ✅ export DIFY_INTERVIEW_INIT_KEY="app-tbxpV6bDyAYab4qqRYSavxH3" 等

# 或使用 .env 文件
cat > .env << 'EOF'
DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3
DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk
DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16
EOF
```

### 步骤3: 启动 Docker Compose

```bash
# 启动 (显示详细日志)
docker-compose -f docker-compose.prod.yml up

# 或后台启动
docker-compose -f docker-compose.prod.yml up -d

# 等待 30 秒让所有服务启动
sleep 30

# 检查状态
docker-compose -f docker-compose.prod.yml ps
```

### 步骤4: 诊断失败的容器

```bash
# 找到失败的容器
docker-compose -f docker-compose.prod.yml ps | grep -E "Exit|Exited"

# 查看失败原因
docker logs <container-name>

# 例如:
docker logs interview-backend    # 查看后端错误
docker logs interview-nginx      # 查看 Nginx 错误
docker logs interview-frontend   # 查看前端错误
```

---

## 🔴 按错误类型排查

### 错误类型 1: MODULE_NOT_FOUND

**完整错误信息**:
```
Error: Cannot find module '../data/abilityProfiles'
Require stack:
- /app/routes/api.js
- /app/server.js
```

**原因**:
- 文件在 .gitignore 中，未被 Git 跟踪
- Docker 镜像中缺少该文件

**检查步骤**:
```bash
# 1. 验证本地文件是否存在
ls -la backend/data/abilityProfiles.js
ls -la backend/services/userDbService.js
ls -la backend/routes/auth.js

# 2. 验证文件是否在 Git 中
git ls-files | grep abilityProfiles
git ls-files | grep userDbService
git ls-files | grep "routes/auth"

# 3. 如果不在 Git 中，添加
git add backend/data/abilityProfiles.js
git add backend/services/userDbService.js
git add backend/routes/auth.js
git commit -m "fix: include missing backend modules"
git push origin main

# 4. 重新创建 Docker 镜像
docker-compose -f docker-compose.prod.yml down -v
docker system prune -f
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

**预防措施**:
```bash
# 更新 .gitignore，确保这些文件不被忽略
grep -E "abilityProfiles|userDbService" .gitignore
# 如果找到，需要删除这些行
```

---

### 错误类型 2: DIFY_INTERVIEW_*_KEY 未配置

**完整错误信息**:
```
Error: DIFY_INTERVIEW_INIT_KEY 未配置
Error: DIFY_INTERVIEW_CHAT_KEY 未配置
Error: DIFY_INTERVIEW_VERDICT_KEY 未配置
```

**原因**:
- 环境变量未设置
- docker-compose.prod.yml 未正确传递环境变量
- .env 文件不存在或格式错误

**检查步骤**:
```bash
# 1. 检查后端容器的环境变量
docker exec interview-backend env | grep DIFY_INTERVIEW

# 预期输出:
# DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3
# DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk
# DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16

# 2. 如果为空，检查 .env 文件
test -f .env && cat .env || echo ".env 文件不存在"

# 3. 如果 .env 不存在，创建它
cat > .env << 'EOF'
DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3
DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk
DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16
EOF

# 4. 检查 docker-compose.prod.yml 配置
grep -A 10 "DIFY_INTERVIEW" docker-compose.prod.yml

# 预期看到:
# DIFY_INTERVIEW_INIT_KEY: ${DIFY_INTERVIEW_INIT_KEY}
# DIFY_INTERVIEW_CHAT_KEY: ${DIFY_INTERVIEW_CHAT_KEY}
# DIFY_INTERVIEW_VERDICT_KEY: ${DIFY_INTERVIEW_VERDICT_KEY}

# 5. 重新启动后端
docker-compose -f docker-compose.prod.yml restart backend

# 6. 验证环境变量已加载
docker exec interview-backend env | grep DIFY_INTERVIEW
```

**长期解决方案**:
```bash
# 在 docker-compose.prod.yml 中 hard-code 值 (不推荐,仅用于开发)
# 或使用 .env 文件 (推荐)
# 或使用 docker-compose --env-file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

### 错误类型 3: port already in use

**完整错误信息**:
```
Bind for 0.0.0.0:80 failed: port is already allocated
```

**原因**:
- 端口 80 或 443 已被其他应用占用
- 旧容器仍在运行

**检查步骤**:
```bash
# 1. 列出正在使用端口 80 的进程
# Windows:
netstat -ano | findstr :80

# Mac/Linux:
sudo lsof -i :80

# 2. 停止占用该端口的应用
# 例如: sudo kill -9 <PID>

# 3. 或修改 docker-compose.prod.yml 中的端口映射
# 从 "80:80" 改为 "8080:80"
# 从 "443:443" 改为 "8443:443"

# 4. 重新启动
docker-compose -f docker-compose.prod.yml restart nginx-proxy
```

**快速解决**:
```bash
# 清理所有 Docker 容器和卷
docker-compose -f docker-compose.prod.yml down -v

# 等待几秒
sleep 5

# 重新启动
docker-compose -f docker-compose.prod.yml up -d
```

---

### 错误类型 4: Connection refused (Redis/Database)

**完整错误信息**:
```
Error: connect ECONNREFUSED 127.0.0.1:6379
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**原因**:
- Redis 或 PostgreSQL 容器未启动
- 网络配置不正确
- 容器间通信被阻止

**检查步骤**:
```bash
# 1. 检查 Redis 容器状态
docker ps | grep interview-redis

# 预期: 显示正在运行的 interview-redis 容器

# 2. 如果未运行，检查日志
docker logs interview-redis

# 3. 测试 Redis 连接
docker exec interview-backend redis-cli -h interview-redis ping

# 预期: PONG

# 4. 检查网络
docker inspect interview-redis | grep Networks

# 预期: "interview-network"

# 5. 验证后端的 REDIS_HOST 设置
docker exec interview-backend env | grep REDIS

# 预期:
# REDIS_HOST=interview-redis
# REDIS_PORT=6379

# 6. 如果还是连接失败，重新启动 Redis
docker-compose -f docker-compose.prod.yml restart redis
```

---

### 错误类型 5: nginx: [emerg] host not found in upstream

**完整错误信息**:
```
nginx: [emerg] host not found in upstream "backend:3001"
```

**原因**:
- 后端容器未启动
- Nginx 容器与后端容器不在同一网络中
- DNS 解析失败

**检查步骤**:
```bash
# 1. 验证后端容器运行
docker ps | grep interview-backend

# 预期: 正在运行

# 2. 从 Nginx 容器测试连接
docker exec interview-nginx ping interview-backend

# 预期: 收到响应

# 3. 验证网络配置
docker network inspect interview-network

# 预期: 看到后端和 Nginx 都连接到该网络

# 4. 检查 Nginx 配置中的上游地址
cat nginx/nginx.conf | grep -A 2 "upstream backend"

# 预期: server backend:3001

# 5. 重启所有容器确保网络就绪
docker-compose -f docker-compose.prod.yml restart
```

---

### 错误类型 6: SSL certificate error

**完整错误信息**:
```
nginx: [emerg] cannot load certificate "/etc/nginx/ssl/cert.pem"
```

**原因**:
- SSL 证书文件不存在
- 证书路径配置错误
- 证书挂载失败

**检查步骤**:
```bash
# 1. 检查本地证书文件
ls -la nginx/ssl/

# 预期: cert.pem 和 key.pem 存在

# 2. 如果不存在，创建自签名证书
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Interview/CN=localhost"

# 3. 验证 docker-compose.prod.yml 中的卷挂载
grep -A 10 "volumes:" docker-compose.prod.yml | grep "ssl"

# 预期: ./nginx/ssl:/etc/nginx/ssl:ro

# 4. 重启 Nginx
docker-compose -f docker-compose.prod.yml restart nginx-proxy

# 5. 验证证书已挂载
docker exec interview-nginx ls -la /etc/nginx/ssl/

# 预期: cert.pem 和 key.pem
```

---

### 错误类型 7: Frontend CSP 错误 (浏览器)

**浏览器控制台错误**:
```
Connecting to 'ws://localhost:3001/...' violates the following
Content Security Policy directive: "default-src 'self'"
```

**原因**:
- HTML 中的 CSP 不允许 WebSocket 连接
- 或不允许连接到特定的 API 地址

**检查步骤**:
```bash
# 1. 检查 frontend/index.html 中的 CSP 设置
grep "Content-Security-Policy" frontend/index.html

# 预期: 看到 connect-src 'self' ws: wss: ...

# 2. 如果没有或不完整，更新 index.html
# 应该包含:
# <meta http-equiv="Content-Security-Policy"
#       content="... connect-src 'self' ws: wss: https://api.dify.ai ...">

# 3. 重建前端镜像
docker-compose -f docker-compose.prod.yml rebuild frontend
docker-compose -f docker-compose.prod.yml up -d frontend

# 4. 刷新浏览器并清除缓存 (Ctrl+Shift+R)

# 5. 检查 DevTools > Application > Cache Storage
# 清除所有缓存
```

---

## 🧪 验证修复

修复每个问题后，运行以下验证:

```bash
# 1. 重新启动相关容器
docker-compose -f docker-compose.prod.yml restart

# 2. 等待就绪
sleep 30

# 3. 检查所有容器状态
docker-compose -f docker-compose.prod.yml ps

# 4. 查看日志
docker logs interview-backend
docker logs interview-nginx

# 5. 测试 API
curl -v http://localhost/api/health

# 6. 浏览器测试
# 打开 http://localhost
# 按 F12 检查 Console
```

---

## 📋 完整检查清单

修复前，确保检查:

- [ ] Docker daemon 运行中
- [ ] 环境变量已设置 (DIFY_INTERVIEW_* 三个密钥)
- [ ] .env 文件存在于项目根目录
- [ ] docker-compose.prod.yml 文件语法正确
- [ ] backend/data/abilityProfiles.js 在 Git 中
- [ ] backend/services/userDbService.js 在 Git 中
- [ ] nginx/ssl/ 目录存在并包含证书文件
- [ ] nginx/nginx.conf 配置正确
- [ ] frontend/index.html 包含正确的 CSP
- [ ] 没有其他应用占用端口 80/443
- [ ] 至少有 4GB RAM 可用
- [ ] 至少有 10GB 磁盘空间

---

## 🆘 如果还是不行

1. **完全重新开始**:
   ```bash
   docker-compose -f docker-compose.prod.yml down -v
   docker system prune -af
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **查看完整日志** (前100行):
   ```bash
   docker logs interview-backend | head -100
   docker logs interview-nginx | head -100
   ```

3. **检查 Docker 容器日志写入文件**:
   ```bash
   # 导出日志用于分析
   docker logs interview-backend > backend.log 2>&1
   docker logs interview-nginx > nginx.log 2>&1
   docker logs interview-frontend > frontend.log 2>&1
   cat backend.log | grep -i "error"
   ```

4. **参考完整指南**:
   - `FULL_DOCKER_INTEGRATION_TEST.md` - 完整的 6 阶段测试指南
   - `DOCKER_QUICK_START.md` - 快速开始和常见问题
   - `docker-compose.prod.yml` - 配置文件注释

---

**记住**: 90% 的问题都是由环境变量或文件缺失引起的！仔细检查这两点通常能解决问题。
