# 生产环境问题诊断 - 错题复盘功能

**问题**: 在 https://viewself.cn/interview/report-v2 点击"错题复盘"时显示"未找到面试记录"

**环境**: 生产环境 (Docker + Nginx + PostgreSQL)

---

## 🔍 问题诊断

### 可能的原因

1. **后端 API 服务未运行或无法访问**
   - Docker 容器未启动
   - 后端服务崩溃
   - Nginx 代理配置错误

2. **数据库连接失败**
   - PostgreSQL 容器未启动
   - 数据库凭证错误
   - 数据库表未创建

3. **API 端点未正确部署**
   - `/api/interview/save-report` 端点不存在
   - 路由未正确挂载
   - 代码版本不匹配

4. **前端 API 调用失败**
   - CORS 配置错误
   - API 基础 URL 配置错误
   - 网络连接问题

---

## 🔧 生产环境诊断步骤

### Step 1: 检查 Docker 容器状态

```bash
# SSH 连接到服务器
ssh ubuntu@47.76.110.106

# 检查所有容器状态
docker ps -a

# 预期输出应该包含:
# - interview-db (PostgreSQL)
# - interview-redis (Redis)
# - interview-backend (Node.js 后端)
# - interview-frontend (Vue 前端)
# - nginx (Nginx 反向代理)
```

### Step 2: 检查后端服务日志

```bash
# 查看后端容器日志
docker logs interview-backend

# 查看最后 100 行日志
docker logs --tail 100 interview-backend

# 实时查看日志
docker logs -f interview-backend

# 查找错误信息
docker logs interview-backend | grep -i error
```

### Step 3: 检查数据库连接

```bash
# 进入数据库容器
docker exec -it interview-db psql -U admin -d interview_system

# 在 PostgreSQL 中执行:
# 检查表是否存在
\dt

# 查看 interview_records 表
SELECT * FROM interview_records LIMIT 1;

# 查看 wrong_answer_reviews 表
SELECT * FROM wrong_answer_reviews LIMIT 1;

# 退出
\q
```

### Step 4: 测试 API 端点

```bash
# 测试后端是否响应
curl -v http://localhost:3001/health

# 测试 API 端点 (需要有效的 userId)
curl -X GET http://localhost:3001/api/interview/records \
  -H "Authorization: Bearer 1"

# 测试保存报告端点
curl -X POST http://localhost:3001/api/interview/save-report \
  -H "Authorization: Bearer 1" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "jobTitle": "测试",
    "difficulty": "中级",
    "duration": 600,
    "answers": [],
    "overallScore": 80,
    "technicalScore": 80,
    "communicationScore": 80,
    "logicalScore": 80,
    "summary": "测试",
    "suggestions": []
  }'
```

### Step 5: 检查 Nginx 配置

```bash
# 查看 Nginx 配置
docker exec interview-nginx cat /etc/nginx/conf.d/default.conf

# 检查 Nginx 日志
docker logs interview-nginx

# 测试 Nginx 反向代理
curl -v https://viewself.cn/api/health
```

### Step 6: 检查浏览器控制台

在生产环境中：
1. 打开 https://viewself.cn/interview/report-v2
2. 按 F12 打开开发者工具
3. 查看 Console 标签中的错误信息
4. 查看 Network 标签中的 API 请求

---

## 🚀 常见问题和解决方案

### 问题 1: 后端容器未运行

**症状**: `docker ps` 中看不到 interview-backend

**解决**:
```bash
# 查看容器状态
docker ps -a | grep interview-backend

# 查看容器日志
docker logs interview-backend

# 重启容器
docker restart interview-backend

# 或重新启动所有服务
cd /path/to/docker-compose
docker compose -f docker-compose.prod.yml restart backend
```

---

### 问题 2: 数据库连接失败

**症状**: 后端日志显示 "Error: connect ECONNREFUSED"

**解决**:
```bash
# 检查数据库容器
docker ps | grep interview-db

# 查看数据库日志
docker logs interview-db

# 检查数据库是否健康
docker exec interview-db pg_isready -U admin

# 重启数据库
docker restart interview-db

# 等待数据库启动后重启后端
sleep 10
docker restart interview-backend
```

---

### 问题 3: API 端点返回 404

**症状**: `POST /api/interview/save-report` 返回 404

**解决**:
```bash
# 检查后端代码是否正确部署
docker exec interview-backend ls -la /app/backend/routes/

# 检查 interview.js 是否存在
docker exec interview-backend ls -la /app/backend/routes/interview.js

# 查看 api.js 中是否挂载了 interviewRouter
docker exec interview-backend grep -n "interviewRouter" /app/backend/routes/api.js

# 如果文件不存在，需要重新构建镜像
docker build -t ai_interview_backend:latest -f backend/Dockerfile.prod .
docker push your-registry/ai_interview_backend:latest
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d backend
```

---

### 问题 4: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决**:
```bash
# 检查后端 CORS 配置
docker exec interview-backend grep -A 5 "cors" /app/backend/app.js

# 检查 Nginx 代理配置
docker exec interview-nginx grep -A 10 "proxy_pass" /etc/nginx/conf.d/default.conf

# 确保 Nginx 正确转发 API 请求
# 应该有类似的配置:
# location /api {
#   proxy_pass http://interview-backend:3001;
# }
```

---

## 📋 完整的部署检查清单

- [ ] PostgreSQL 容器正在运行
- [ ] Redis 容器正在运行
- [ ] 后端容器正在运行
- [ ] 前端容器正在运行
- [ ] Nginx 容器正在运行
- [ ] 数据库表已创建 (interview_records, wrong_answer_reviews)
- [ ] 后端 API 端点可访问 (http://localhost:3001/health)
- [ ] Nginx 反向代理正常工作 (https://viewself.cn/api/health)
- [ ] 浏览器控制台没有错误
- [ ] Network 标签中 POST /api/interview/save-report 返回 201

---

## 🔄 重新部署步骤

如果以上诊断发现代码版本不匹配，需要重新部署：

```bash
# 1. 进入服务器
ssh ubuntu@47.76.110.106

# 2. 进入项目目录
cd /path/to/interview-system

# 3. 拉取最新代码
git pull origin main

# 4. 重新构建镜像
docker build -t ai_interview_backend:latest -f backend/Dockerfile.prod .
docker build -t ai_interview_frontend:latest -f frontend/Dockerfile.prod .

# 5. 推送到镜像仓库 (如果使用私有仓库)
docker push your-registry/ai_interview_backend:latest
docker push your-registry/ai_interview_frontend:latest

# 6. 重新启动服务
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# 7. 验证服务
docker ps
docker logs interview-backend
```

---

## 📊 快速诊断命令

```bash
# 一键诊断脚本
#!/bin/bash

echo "=== Docker 容器状态 ==="
docker ps -a | grep interview

echo ""
echo "=== 后端日志 (最后 20 行) ==="
docker logs --tail 20 interview-backend

echo ""
echo "=== 数据库连接测试 ==="
docker exec interview-db pg_isready -U admin

echo ""
echo "=== API 端点测试 ==="
curl -s http://localhost:3001/health | jq .

echo ""
echo "=== Nginx 状态 ==="
docker logs --tail 10 interview-nginx
```

---

## 🆘 获取帮助

如果问题仍未解决，请收集以下信息：

1. **后端日志** (最后 100 行):
   ```bash
   docker logs --tail 100 interview-backend > backend.log
   ```

2. **数据库日志** (最后 50 行):
   ```bash
   docker logs --tail 50 interview-db > db.log
   ```

3. **Nginx 日志** (最后 50 行):
   ```bash
   docker logs --tail 50 interview-nginx > nginx.log
   ```

4. **浏览器控制台错误**:
   - 打开 https://viewself.cn/interview/report-v2
   - 按 F12，查看 Console 标签
   - 截图或复制所有错误信息

5. **Network 请求详情**:
   - 在 Network 标签中查找 POST /api/interview/save-report
   - 查看 Response 标签中的错误信息

---

**最后更新**: 2026-03-26
**环境**: 生产环境 (Docker)
**状态**: 诊断指南已提供
