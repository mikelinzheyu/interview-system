# 云端部署修复指南 - 网络异常问题

## 问题诊断

**根本原因**：前端硬编码了 `localhost:8080` 和 `localhost:3001`，但在云端ECS部署时无法连接到这些地址。

**错误表现**：
- 浏览器控制台显示 `ERR_CONNECTION_REFUSED`
- WebSocket 连接失败，重试5次后放弃
- 用户界面显示"网络异常，请检查您的网络连接"

## 已完成的修复

✅ **更新了前端配置** (`frontend/.env.production`)：
```env
VITE_API_BASE_URL=http://iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com/api
VITE_WS_BASE_URL=ws://iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com
```

✅ **提交了代码** (Commit: 77c7187)

## 云端部署步骤

### 1️⃣ SSH 连接到 ECS

```bash
ssh ubuntu@iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com
```

### 2️⃣ 进入项目目录

```bash
cd /home/ubuntu/interview-system
```

### 3️⃣ 拉取最新代码

```bash
git pull origin main
```

如果网络问题导致拉取失败，可以尝试：
```bash
git fetch origin
git reset --hard origin/main
```

### 4️⃣ 重新构建并部署

```bash
# 停止现有容器
docker-compose -f docker-compose.prod.yml down

# 重新构建并启动（包括前端）
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5️⃣ 验证部署

```bash
# 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 检查健康状态
curl http://iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com/health

# 查看前端日志
docker-compose -f docker-compose.prod.yml logs frontend

# 查看后端日志
docker-compose -f docker-compose.prod.yml logs backend
```

### 6️⃣ 测试前端连接

在浏览器中打开：
```
http://iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com
```

打开开发者工具 (F12)，检查：
- **Console** 标签：应该看不到网络错误
- **Network** 标签：API 请求应该返回 200 状态码
- **WebSocket** 连接应该成功建立

## 预期结果

部署完成后，你应该看到：

✅ 前端成功加载
✅ API 请求返回 200 状态码
✅ WebSocket 连接成功
✅ 用户界面正常显示，没有"网络异常"错误

## 如果仍然有问题

### 检查后端是否运行

```bash
docker-compose -f docker-compose.prod.yml logs backend | tail -50
```

### 检查 Nginx 配置

```bash
docker exec interview-nginx nginx -t
```

### 检查网络连接

```bash
# 从容器内测试后端连接
docker exec interview-frontend curl http://interview-backend:3001/health

# 检查 Nginx 代理
docker exec interview-nginx curl http://localhost/api/users/me
```

### 查看完整日志

```bash
# 前端日志
docker-compose -f docker-compose.prod.yml logs -f frontend

# 后端日志
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx 日志
docker-compose -f docker-compose.prod.yml logs -f nginx
```

## 关键配置文件

- **前端配置**：`frontend/.env.production`
- **Docker 配置**：`docker-compose.prod.yml`
- **Nginx 配置**：`nginx/prod.conf`
- **后端配置**：`.env.prod`

## 提交信息

```
Commit: 77c7187
Message: fix: update frontend API URLs for cloud ECS deployment
```

---

**需要帮助？** 检查以下文件获取更多信息：
- `FULL_DOCKER_INTEGRATION_TEST.md` - 完整测试指南
- `DOCKER_TROUBLESHOOTING.md` - 常见问题解决
