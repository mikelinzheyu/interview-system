# 全Docker生产环境前后端联调测试计划

## 📋 当前环境分析

### 环境变量问题
- **backend/.env** 使用旧的 Dify API 密钥 (旧的应用ID)
- **test4/8.txt** 提供了新的三个 Dify 工作流密钥
- **docker-compose.prod.yml** 需要使用正确的环境变量名称

### 所需环境变量映射
```
后端代码需要：DIFY_INTERVIEW_CHAT_KEY / DIFY_INTERVIEW_INIT_KEY / DIFY_INTERVIEW_VERDICT_KEY
我们有的新密钥：
  - 初始化: app-tbxpV6bDyAYab4qqRYSavxH3 (工作流3)
  - 面试官: app-4wtUAIUlZDoohTFfjN2T6WNk (工作流1/Chat)
  - 裁决: app-7g0QiWpxu9ASO2f7U3VccK16 (工作流2)
```

## 🚀 测试步骤

### Phase 1: 前置准备 (本地)

#### 1.1 更新环境变量配置
```bash
# 更新 .env.prod 中的 Dify 密钥为新值
DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3
DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk
DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16
```

#### 1.2 验证配置文件
- ✅ nginx/nginx.conf (已配置完成)
- ✅ frontend/index.html (已添加CSP)
- ✅ frontend/nginx.conf (已配置后端代理)
- ✅ docker-compose.prod.yml (需验证)

#### 1.3 提交代码
```bash
git add -A
git commit -m "config: Update Dify API keys to production values"
git push origin main
```

### Phase 2: Docker 本地集成测试 (使用 docker-compose.prod.yml)

#### 2.1 启动 Docker Compose 全栈
```bash
# 清理旧容器和卷
docker-compose -f docker-compose.prod.yml down -v

# 启动全栈 (PostgreSQL + Redis + Backend + Frontend + Nginx)
docker-compose -f docker-compose.prod.yml up -d

# 等待所有服务就绪 (约30-60秒)
sleep 30
```

#### 2.2 验证所有容器状态
```bash
# 检查容器运行状态
docker-compose -f docker-compose.prod.yml ps

# 期望输出:
# - interview-db (healthy)
# - interview-redis (healthy)
# - interview-backend (running)
# - interview-frontend (running)
# - interview-nginx (healthy)
```

#### 2.3 检查各服务日志

**后端日志** (最关键)
```bash
docker logs interview-backend

# ✅ 成功标志:
# - 'Server running on port 3001'
# - 没有 'Cannot find module' 错误
# - 没有 'DIFY_INTERVIEW_INIT_KEY 未配置' 错误
# - Redis 连接成功

# ❌ 失败标志:
# - 'Cannot find module ../data/abilityProfiles'
# - 'Cannot find module ../services/userDbService'
# - 'DIFY_INTERVIEW_INIT_KEY 未配置'
# - 'Connection refused' (Redis)
```

**Nginx 日志**
```bash
docker logs interview-nginx

# ✅ 成功标志:
# - 'Configuration complete; ready for start up'
# - 没有 'SSL certificate' 错误
# - 没有 'host not found in upstream'

# ❌ 失败标志:
# - 'cannot load certificate'
# - 'host not found in upstream'
# - 'Connection refused'
```

**Redis 日志**
```bash
docker logs interview-redis

# ✅ 成功标志: 'Ready to accept connections'
```

**数据库日志**
```bash
docker logs interview-db

# ✅ 成功标志: 'database system is ready to accept connections'
```

**前端日志**
```bash
docker logs interview-frontend

# ✅ 成功标志: 'Nginx 成功启动' 或无错误输出
```

### Phase 3: 网络连通性测试

#### 3.1 测试 Nginx 健康检查
```bash
# 从宿主机访问 Nginx 健康检查端点
curl -v http://localhost/health

# 期望响应: 200 OK
```

#### 3.2 测试后端 API 端点
```bash
# 测试后端健康检查
curl -v http://localhost:3001/api/health

# 期望响应: 200 OK (健康)

# 或通过 Nginx 转发访问
curl -v http://localhost/api/health

# 期望响应: 200 OK
```

#### 3.3 测试 WebSocket 连接
```bash
# 通过 socket.io 测试
curl -v http://localhost/socket.io/?EIO=4&transport=polling

# 或使用 websocat (如已安装)
websocat ws://localhost/socket.io/?EIO=4&transport=websocket
```

### Phase 4: 前端应用测试

#### 4.1 访问前端应用
```bash
# 在浏览器打开
http://localhost

# 或通过 Nginx
https://localhost (self-signed cert 需要忽略)
```

#### 4.2 浏览器开发者工具检查 (DevTools > Console)

**检查 CSP 错误**
```javascript
// ❌ 应该 NO CSP 错误
// ✅ 如果有错误，说明前端 CSP 配置有问题
```

**检查网络请求**
- DevTools > Network 选项卡
- 所有 /api/... 请求应该返回 2xx 或 4xx (不应该 5xx)
- WebSocket 连接应该显示为 101 Switching Protocols

**检查Console消息**
```
✅ 应该看到:
- [App] 用户已登录，初始化 WebSocket 连接
- [Socket] 正在连接 WebSocket 服务

❌ 不应该看到:
- CSP 违规错误
- Module not found
- DIFY_INTERVIEW_INIT_KEY 未配置
```

### Phase 5: 前后端集成功能测试

#### 5.1 用户认证流程
```bash
# 1. 注册用户 (如果没有)
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "username": "testuser"
  }'

# 2. 登录
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'

# 响应应包含 token
```

#### 5.2 面试初始化测试
```bash
# 初始化一次面试
curl -X POST http://localhost/api/interview-ai/init \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "jobTitle": "Senior Software Engineer",
    "jobDescription": "Design and develop scalable systems",
    "resume": "5+ years experience in distributed systems"
  }'

# 期望响应:
# {
#   "code": 200,
#   "data": {
#     "questions": [...],
#     "sessionContext": "..."
#   }
# }
```

#### 5.3 面试对话测试 (SSE 流式)
```bash
# 模拟面试官提问
curl -X POST http://localhost/api/interview-ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "message": "Tell me about your experience with microservices",
    "conversationId": "conv_123",
    "inputs": {
      "job_title": "Senior Software Engineer"
    }
  }'

# 应该看到 SSE 流式数据
# 每条消息以 data: 开头
```

#### 5.4 面试裁决测试
```bash
# 评估用户回答
curl -X POST http://localhost/api/interview-ai/verdict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "question": "Tell me about your experience",
    "answer": "I have 5 years in distributed systems...",
    "sessionContext": "{}",
    "jobTitle": "Senior Software Engineer"
  }'

# 期望响应:
# {
#   "decision": "next" or "follow_up",
#   "score": 85,
#   "follow_up_question": "..."
# }
```

### Phase 6: 完整用户场景测试 (通过前端UI)

#### 6.1 浏览器自动化测试流程
```bash
# 1. 打开 http://localhost
# 2. 如果未登录，注册或登录一个测试账户
# 3. 进入面试页面
# 4. 点击"开始面试"
# 5. 输入岗位信息
#    - 岗位名称: "Senior Software Engineer"
#    - 职位描述: (可选)
#    - 简历: (可选)
# 6. 点击"初始化面试" → 应该看到面试题目加载
# 7. 阅读第一道题
# 8. 在文本框输入答案
# 9. 点击"提交答案" → 应该看到 AI 裁决结果
# 10. 根据结果继续或结束面试
```

#### 6.2 观察关键指标
```javascript
// 在 DevTools Console 执行以检查状态
// 1. WebSocket 连接状态
window.socket?.connected // 应该为 true

// 2. API 响应时间
// 在 Network 选项卡查看每个请求的时间

// 3. 前端状态
// 在 Redux DevTools (如已安装) 检查全局状态
```

## 🔍 常见问题排查

### 问题1: Backend 返回 500 "DIFY_INTERVIEW_INIT_KEY 未配置"
```
解决方案:
1. 检查 .env.prod 是否设置了正确的环境变量
2. 检查 docker-compose.prod.yml 中 backend service 是否传递了环境变量
3. 重启 backend 容器: docker restart interview-backend
4. 检查日志: docker logs interview-backend | grep DIFY
```

### 问题2: 前端 CSP 错误阻止 WebSocket
```
解决方案:
1. 检查 frontend/index.html 中 CSP meta 标签
2. 确保 connect-src 包含 ws: wss: 和所有后端地址
3. 刷新浏览器并检查 DevTools Console
```

### 问题3: 前端无法连接后端 API
```
解决方案:
1. 检查 frontend/nginx.conf 中 /api/ 代理配置
2. 检查后端容器是否运行: docker ps | grep interview-backend
3. 测试容器内部连通性: docker exec interview-frontend curl http://interview-backend:3001/api/health
```

### 问题4: Redis 连接失败
```
解决方案:
1. 检查 Redis 容器状态: docker ps | grep interview-redis
2. 检查 backend 环境变量: REDIS_HOST=interview-redis REDIS_PORT=6379
3. 测试 Redis 连通性: docker exec interview-backend redis-cli -h interview-redis ping
```

### 问题5: Nginx SSL 错误
```
解决方案:
1. 检查 nginx/ssl 目录中是否存在证书: ls nginx/ssl/
2. 检查 nginx.conf 中证书路径配置
3. 对于生产环境，使用 Let's Encrypt 证书
4. 临时禁用 HTTPS 用于测试: 只在 http://localhost 上测试
```

## ✅ 验收标准

测试完成后，确保以下所有项目都通过:

- [ ] 所有 Docker 容器正常运行 (docker-compose ps)
- [ ] 后端日志无错误，成功启动
- [ ] Nginx 日志无错误，配置成功
- [ ] 前端页面加载成功 (http://localhost)
- [ ] 前端 Console 无 CSP 错误
- [ ] WebSocket 连接成功建立
- [ ] API 健康检查通过 (GET /api/health)
- [ ] 用户认证流程正常 (注册/登录)
- [ ] 面试初始化成功 (POST /api/interview-ai/init)
- [ ] 面试对话正常工作 (POST /api/interview-ai/chat)
- [ ] 面试裁决正常工作 (POST /api/interview-ai/verdict)
- [ ] 完整用户场景可以从开始到结束运行
- [ ] 没有出现 MODULE_NOT_FOUND 错误
- [ ] 没有出现 DIFY_INTERVIEW_*_KEY 配置缺失错误

## 📊 性能基准

在完整测试时，记录以下指标:

| 指标 | 目标值 | 实际值 |
|-----|-------|--------|
| 前端首页加载时间 | < 2s | ___ |
| API 健康检查响应时间 | < 100ms | ___ |
| 面试初始化时间 | < 5s | ___ |
| 面试对话 SSE 首字节时间 | < 1s | ___ |
| WebSocket 连接时间 | < 500ms | ___ |
| 内存使用 (Backend) | < 300MB | ___ |
| 内存使用 (Frontend) | < 200MB | ___ |

## 🎯 下一步

- [ ] 在 Ubuntu ECS 上重复此测试 (使用真实域名 viewself.cn)
- [ ] 配置真实 SSL 证书 (Let's Encrypt)
- [ ] 设置监控和告警 (Prometheus + Grafana)
- [ ] 进行压力测试 (负载1000+ 并发用户)
- [ ] 配置自动备份和恢复策略
