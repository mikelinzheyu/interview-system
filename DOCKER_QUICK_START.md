# Docker 生产环境前后端联调测试 - 快速开始指南

## 🚀 一句话快速开始

```bash
# 在项目根目录
bash quick-docker-test.sh
```

## 📋 前置条件

### 本地环境要求

#### Windows/Mac/Linux 上确保已安装:
- ✅ Docker Desktop (最新版)
- ✅ Docker Compose (通常包含在 Docker Desktop 中)
- ✅ 至少 4GB RAM 可用于 Docker
- ✅ 至少 10GB 磁盘空间

#### 验证环境:
```bash
# 检查 Docker 版本
docker --version
# 期望: Docker version 24.0+

# 检查 Docker Compose 版本
docker-compose --version
# 期望: Docker Compose version 2.20+

# 检查 Docker daemon 运行状态
docker ps
# 期望: 列出现有的容器 (可能为空)
```

### 启动 Docker (如果未启动)

#### 在 Windows 上:
```bash
# 打开 PowerShell (管理员)
# 或直接启动 Docker Desktop 应用
```

#### 在 Mac 上:
```bash
# 启动 Docker
open /Applications/Docker.app
```

#### 在 Linux 上:
```bash
# 启动 Docker 服务
sudo systemctl start docker
```

## 🔧 第一次运行准备

### 第 1 步: 加载环境变量

```bash
# Windows (PowerShell)
$env:DIFY_INTERVIEW_INIT_KEY="app-tbxpV6bDyAYab4qqRYSavxH3"
$env:DIFY_INTERVIEW_CHAT_KEY="app-4wtUAIUlZDoohTFfjN2T6WNk"
$env:DIFY_INTERVIEW_VERDICT_KEY="app-7g0QiWpxu9ASO2f7U3VccK16"

# 或在 Bash (Windows Git Bash / Mac / Linux)
export DIFY_INTERVIEW_INIT_KEY="app-tbxpV6bDyAYab4qqRYSavxH3"
export DIFY_INTERVIEW_CHAT_KEY="app-4wtUAIUlZDoohTFfjN2T6WNk"
export DIFY_INTERVIEW_VERDICT_KEY="app-7g0QiWpxu9ASO2f7U3VccK16"

# 或创建 .env 文件 (推荐)
cat > .env.docker.local << 'EOF'
DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3
DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk
DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16
EOF

# 然后在运行 docker-compose 时加载:
set -a
source .env.docker.local
set +a
```

### 第 2 步: 运行快速测试脚本

```bash
# 方法1: 使用自动脚本 (推荐)
bash quick-docker-test.sh

# 方法2: 手动命令
docker-compose -f docker-compose.prod.yml down -v  # 清理旧容器
docker-compose -f docker-compose.prod.yml up -d   # 启动全栈
sleep 30                                          # 等待就绪
docker-compose -f docker-compose.prod.yml ps      # 检查状态
```

## ✅ 验收检查表

按顺序检查以下项目:

### 容器运行状态
```bash
docker-compose -f docker-compose.prod.yml ps
```

期望输出:
```
NAME                 STATUS
interview-db         Up (healthy)
interview-redis      Up (healthy)
interview-backend    Up
interview-frontend   Up
interview-nginx      Up (healthy)
```

### 后端日志检查
```bash
docker logs interview-backend

# ❌ 查找这些错误:
# - "Cannot find module '../data/abilityProfiles'" → 需要 git add 文件
# - "DIFY_INTERVIEW_INIT_KEY 未配置" → 需要设置环境变量
# - "Cannot find module '../services/userDbService'" → 需要 git add 文件
# - "Cannot get http://interview-redis:6379" → Redis 未启动

# ✅ 应该看到:
# - "Server running on port 3001"
# - "Redis connected"
# - 没有 error 日志
```

### Nginx 日志检查
```bash
docker logs interview-nginx

# ❌ 查找这些错误:
# - "cannot load certificate" → SSL 证书配置问题
# - "host not found in upstream" → 后端容器未启动
# - "connection refused" → 后端服务不响应

# ✅ 应该看到:
# - "Configuration complete; ready for start up"
# - 没有 error 日志
```

### 前端日志检查
```bash
docker logs interview-frontend

# ✅ 应该看到:
# - 没有 error 日志
# - 容器运行中
```

### 网络连通性测试

```bash
# 测试1: 后端健康检查
curl -v http://localhost:3001/api/health
# 期望: 200 OK

# 测试2: 通过 Nginx 访问后端
curl -v http://localhost/api/health
# 期望: 200 OK

# 测试3: 前端首页
curl -v http://localhost/
# 期望: 200 OK, HTML 内容

# 测试4: 检查 CSP 头
curl -i http://localhost/ | grep -i "content-security-policy"
# 期望: 包含正确的 CSP 策略
```

### 浏览器测试

```bash
# 打开浏览器访问
http://localhost

# 按 F12 打开开发者工具
# 检查 Console 标签:

# ❌ 应该 NO 看到:
# - CSP 错误 "violates the following Content Security Policy"
# - "Cannot find module"
# - "DIFY_INTERVIEW_INIT_KEY 未配置"

# ✅ 应该看到:
# - Network 请求都返回 2xx 或 3xx
# - WebSocket 连接显示为 101 Switching Protocols
# - 应用正常加载和交互
```

## 🔍 常见问题和解决方案

### 问题1: "Variable is not set. Defaulting to a blank string"

**症状**: 启动时显示多个环境变量警告

**原因**: 环境变量未加载到 docker-compose 运行的进程中

**解决方案**:

```bash
# 方案1: 使用 .env 文件 (最简单)
cat > .env << 'EOF'
DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3
DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk
DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16
DIFY_API_BASE_URL=https://api.dify.ai/v1
EOF

# docker-compose 会自动加载项目目录中的 .env 文件

# 方案2: 显式指定环境文件
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 方案3: 导出环境变量然后运行
export DIFY_INTERVIEW_INIT_KEY="app-tbxpV6bDyAYab4qqRYSavxH3"
export DIFY_INTERVIEW_CHAT_KEY="app-4wtUAIUlZDoohTFfjN2T6WNk"
export DIFY_INTERVIEW_VERDICT_KEY="app-7g0QiWpxu9ASO2f7U3VccK16"
docker-compose -f docker-compose.prod.yml up -d
```

### 问题2: "Cannot connect to Docker daemon"

**症状**: docker 命令报错，Docker daemon 未运行

**解决方案**:

```bash
# Windows: 启动 Docker Desktop
# Mac: open /Applications/Docker.app
# Linux: sudo systemctl start docker

# 验证 Docker 运行
docker ps
```

### 问题3: "Error response from daemon: port 80 is already in use"

**症状**: 端口 80 或 443 已被占用

**解决方案**:

```bash
# 方案1: 查看谁占用了端口 80
# Windows:
netstat -ano | findstr :80

# Mac/Linux:
lsof -i :80

# 方案2: 修改 docker-compose.prod.yml 中的端口映射
# 将 "80:80" 改为 "8080:80"
# 将 "443:443" 改为 "8443:443"

# 方案3: 停止占用该端口的应用
# Windows 10/11: 关闭 Hyper-V / IIS
```

### 问题4: "Cannot find module '../data/abilityProfiles'"

**症状**: 后端容器启动失败，无法找到文件

**原因**: 文件未被 Git 跟踪（在 .gitignore 中）

**解决方案**:

```bash
# 检查文件是否在 git 中
git ls-files | grep abilityProfiles
git ls-files | grep userDbService

# 如果不在，需要添加到 git
git add backend/data/abilityProfiles.js
git add backend/services/userDbService.js
git commit -m "fix: include missing backend modules"
git push origin main

# 然后重新拉取镜像或重新构建
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### 问题5: "DIFY_INTERVIEW_INIT_KEY 未配置"

**症状**: 后端返回 500 错误，日志显示密钥未配置

**原因**: 后端容器没有收到正确的环境变量

**解决方案**:

```bash
# 1. 检查 .env 文件中是否设置了密钥
cat .env | grep DIFY_INTERVIEW

# 2. 检查 docker-compose.prod.yml 中是否正确引用
cat docker-compose.prod.yml | grep DIFY_INTERVIEW

# 3. 重新启动后端容器以加载新环境变量
docker-compose -f docker-compose.prod.yml restart backend

# 4. 验证环境变量已加载
docker exec interview-backend env | grep DIFY_INTERVIEW
```

### 问题6: "host not found in upstream 'backend:3001'"

**症状**: Nginx 启动失败，无法找到后端服务

**原因**: 后端容器未启动或未加入网络

**解决方案**:

```bash
# 1. 检查后端容器状态
docker ps | grep interview-backend

# 2. 检查网络连通性
docker exec interview-nginx ping interview-backend

# 3. 如果后端未启动，查看日志
docker logs interview-backend

# 4. 重新启动所有容器
docker-compose -f docker-compose.prod.yml restart
```

### 问题7: WebSocket 连接失败 (浏览器 CSP 错误)

**症状**: 浏览器控制台出现 CSP 违规错误

**原因**: HTML 中的 CSP 策略不允许 WebSocket 连接

**解决方案**:

```bash
# 1. 检查 frontend/index.html 是否包含正确的 CSP meta 标签
grep "Content-Security-Policy" frontend/index.html

# 2. 确保 CSP 中包含 ws: 和 wss:
# 应该看到: connect-src 'self' ws: wss: ...

# 3. 如果没有，更新 frontend/index.html
# 添加或更新 meta 标签为:
# <meta http-equiv="Content-Security-Policy"
#       content="default-src 'self'; ... connect-src 'self' ws: wss: ...">

# 4. 重建前端镜像
docker-compose -f docker-compose.prod.yml rebuild frontend
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 性能监控

在测试过程中监控以下指标:

### 实时日志跟踪

```bash
# 后端实时日志 (用于调试)
docker logs -f interview-backend

# Nginx 实时日志
docker logs -f interview-nginx

# 数据库日志
docker logs -f interview-db

# Redis 日志
docker logs -f interview-redis
```

### 容器资源使用

```bash
# 实时监控所有容器
docker stats

# 期望值:
# - Backend: < 300MB 内存
# - Frontend: < 200MB 内存
# - Nginx: < 50MB 内存
# - Database: < 500MB 内存
# - Redis: < 100MB 内存
```

### 网络连接质量

```bash
# 测试延迟
time curl -s http://localhost/api/health -o /dev/null

# 测试吞吐量
ab -n 100 -c 10 http://localhost/

# 期望: 平均响应时间 < 100ms
```

## 🎯 完整测试流程

### 时间: 约 5-10 分钟

1. **准备环境** (1 分钟)
   - 设置环境变量
   - 验证 Docker 运行

2. **启动全栈** (2 分钟)
   - 运行 quick-docker-test.sh
   - 等待所有容器就绪

3. **验证服务** (2 分钟)
   - 检查容器状态
   - 查看日志
   - 测试健康检查

4. **网络测试** (1 分钟)
   - API 端点测试
   - Nginx 转发测试
   - 前端加载测试

5. **浏览器测试** (3 分钟)
   - 访问前端应用
   - 检查 Console 无错误
   - 验证 WebSocket 连接

6. **功能测试** (2 分钟)
   - 测试登录
   - 测试面试初始化
   - 测试 AI 对话

## 🚀 部署到生产环境 (Ubuntu ECS)

完成本地 Docker 测试后，可以部署到 Ubuntu:

```bash
# 1. SSH 连接到 ECS
ssh ubuntu@iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com

# 2. 进入项目目录
cd /path/to/interview-system

# 3. 拉取最新代码
git pull origin main

# 4. 创建 .env 文件 (使用生产环境值)
cat > .env << 'EOF'
DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3
DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk
DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16
DOMAIN=viewself.cn
TZ=Asia/Shanghai
EOF

# 5. 启动生产环境
sudo docker-compose -f docker-compose.prod.yml up -d

# 6. 验证部署
docker-compose -f docker-compose.prod.yml ps
docker logs interview-backend

# 7. 测试生产环境
curl -v https://viewself.cn/api/health
```

## 📞 需要帮助?

如果遇到问题:

1. 检查 `FULL_DOCKER_INTEGRATION_TEST.md` 中的完整测试指南
2. 查看上面的 "常见问题和解决方案" 部分
3. 检查 Docker 和后端日志
4. 确保所有环境变量已正确设置

---

**下一步**: 完成本地 Docker 测试后，在 Ubuntu ECS 上执行相同的测试流程。
