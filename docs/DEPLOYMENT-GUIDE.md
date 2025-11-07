# 🚀 项目部署和运行指南

> **项目**: 智能面试系统 - 多专业题库
> **版本**: Phase 3 完整版
> **更新日期**: 2025-10-03

---

## 📋 目录

- [系统要求](#系统要求)
- [快速启动](#快速启动)
- [开发环境配置](#开发环境配置)
- [生产环境部署](#生产环境部署)
- [测试指南](#测试指南)
- [常见问题](#常见问题)

---

## 🖥️ 系统要求

### 必需软件

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | >= 16.0.0 | 运行环境 |
| npm | >= 8.0.0 | 包管理器 |

### 可选软件

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Git | >= 2.0.0 | 版本控制 |
| VS Code | 最新版 | 开发工具 |

---

## ⚡ 快速启动

### 1. 克隆项目

```bash
git clone <repository-url>
cd interview-system
```

### 2. 安装依赖

```bash
# 前端依赖
cd frontend
npm install

# 后端无需安装（Mock服务器使用Node.js原生模块）
```

### 3. 启动后端服务

```bash
cd backend
node mock-server.js
```

**后端服务地址**: http://localhost:3001

**可用接口**:
- 健康检查: http://localhost:3001/api/health
- API 文档: 查看 `backend/mock-server.js` 中的路由定义

### 4. 启动前端服务

```bash
cd frontend
npm run dev
```

**前端访问地址**: http://localhost:5173

### 5. 验证安装

打开浏览器访问 http://localhost:5173，应该看到登录页面。

**测试账号**:
- 用户名: `testuser`
- 密码: `password123`

---

## 🔧 开发环境配置

### 前端开发

#### 安装依赖

```bash
cd frontend
npm install
```

#### 开发模式

```bash
npm run dev
```

特性:
- ✅ 热重载（HMR）
- ✅ 自动刷新
- ✅ 源码映射
- ✅ 开发工具集成

#### 构建生产版本

```bash
npm run build
```

输出目录: `frontend/dist/`

#### 预览生产构建

```bash
npm run preview
```

### 后端开发

#### 启动 Mock 服务器

```bash
cd backend
node mock-server.js
```

#### 修改端口

编辑 `backend/mock-server.js`:

```javascript
const PORT = 3001  // 修改为你想要的端口
```

#### 添加新的 API 端点

在 `backend/mock-server.js` 中的 `routes` 对象添加:

```javascript
routes: {
  // ... 现有路由

  'GET:/api/your-new-endpoint': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query

    // 你的逻辑
    const data = { message: 'Hello' }

    sendResponse(res, 200, data, '成功')
  }
}
```

### 环境变量配置

#### 前端环境变量

创建 `.env.development`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=智能面试系统
```

创建 `.env.production`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=智能面试系统
```

---

## 🌐 生产环境部署

### 方式 1: 传统部署

#### 1. 构建前端

```bash
cd frontend
npm run build
```

#### 2. 部署前端静态文件

将 `frontend/dist/` 目录部署到:
- Nginx
- Apache
- CDN (如 Cloudflare, AWS S3)

#### 3. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/interview-system/frontend/dist;
    index index.html;

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. 启动后端服务

使用 PM2 管理 Node.js 进程:

```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd backend
pm2 start mock-server.js --name "interview-backend"

# 设置开机自启
pm2 startup
pm2 save
```

### 方式 2: Docker 部署

#### 1. 创建 Dockerfile (前端)

`frontend/Dockerfile`:

```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. 创建 Dockerfile (后端)

`backend/Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY mock-server.js .
COPY package*.json ./
RUN npm install --production

EXPOSE 3001
CMD ["node", "mock-server.js"]
```

#### 3. Docker Compose

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

#### 4. 部署命令

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 🧪 测试指南

### 后端 API 测试

#### Phase 3 后端测试

```bash
node test-phase3.js
```

**预期结果**: 16/17 测试通过 (94.1%)

测试覆盖:
- ✅ 社区贡献系统 (8/9)
- ✅ 跨专业能力分析 (4/4)
- ✅ AI 自动出题 (4/4)

#### Phase 3 前端集成测试

```bash
node test-phase3-frontend.js
```

**预期结果**: 10/10 测试通过

测试覆盖:
- ✅ 贡献排行榜 API
- ✅ 我的提交列表 API
- ✅ 贡献者资料 API
- ✅ 徽章列表 API
- ✅ 用户能力画像 API
- ✅ 雷达图数据 API
- ✅ T型人才排行榜 API
- ✅ 跨专业推荐 API
- ✅ AI 生成历史 API
- ✅ 提交题目 API

### 手动测试

#### 1. 健康检查

```bash
# 后端健康检查
curl http://localhost:3001/api/health

# 前端访问检查
curl http://localhost:5173
```

#### 2. 功能测试清单

**Phase 3.1: 社区贡献系统**
- [ ] 提交题目页面 (`/contributions/submit`)
  - [ ] 表单验证正常
  - [ ] 动态字段根据领域显示
  - [ ] 预览功能正常
  - [ ] 提交成功跳转
- [ ] 我的提交列表 (`/contributions/my-submissions`)
  - [ ] 统计卡片显示正确
  - [ ] 状态筛选工作正常
  - [ ] 分页功能正常
- [ ] 贡献者资料 (`/contributions/profile/1`)
  - [ ] 徽章墙正常显示
  - [ ] 统计数据准确
- [ ] 贡献排行榜 (`/contributions/leaderboard`)
  - [ ] 排名显示正确
  - [ ] 我的排名高亮

**Phase 3.2: 跨专业能力分析**
- [ ] 能力画像 (`/ability/profile`)
  - [ ] T型指数显示正确
  - [ ] 雷达图渲染正常
  - [ ] 推荐列表显示
- [ ] T型人才排行榜 (`/ability/leaderboard`)
  - [ ] 排行榜数据正确
  - [ ] 我的排名卡片显示

**Phase 3.3: AI 自动出题**
- [ ] AI生成题目 (`/ai/generate`)
  - [ ] 配置表单正常
  - [ ] 生成功能工作
  - [ ] 质量评估显示
  - [ ] 批量操作正常

---

## ❓ 常见问题

### Q1: 端口被占用

**错误信息**: `Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Q2: 前端无法连接后端

**检查步骤**:

1. 确认后端服务已启动
```bash
curl http://localhost:3001/api/health
```

2. 检查前端 API 配置
```javascript
// frontend/src/api/request.js
const baseURL = 'http://localhost:3001'
```

3. 检查 CORS 配置
```javascript
// backend/mock-server.js
'Access-Control-Allow-Origin': '*'
```

### Q3: npm install 失败

**解决方案**:

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 或使用 yarn
yarn install
```

### Q4: 页面空白或报错

**检查步骤**:

1. 打开浏览器控制台查看错误
2. 检查路由配置是否正确
3. 确认所有依赖已安装
4. 清除浏览器缓存
5. 重新启动开发服务器

### Q5: ECharts 图表不显示

**解决方案**:

1. 确认 echarts 依赖已安装
```bash
npm install echarts
```

2. 检查容器元素有高度
```vue
<div ref="chartRef" style="width: 100%; height: 400px"></div>
```

3. 在组件挂载后初始化
```javascript
onMounted(() => {
  initChart()
})
```

### Q6: 测试失败

**常见原因**:

1. 后端服务未启动
2. 端口配置不正确
3. 数据格式不匹配
4. 网络延迟

**解决方案**:

```bash
# 确保后端运行
node backend/mock-server.js

# 等待几秒后运行测试
sleep 2 && node test-phase3.js
```

---

## 📚 相关文档

- [README.md](./README.md) - 项目说明
- [QUICK-START-GUIDE.md](./QUICK-START-GUIDE.md) - 快速开始
- [PHASE3-BACKEND-COMPLETE.md](./PHASE3-BACKEND-COMPLETE.md) - 后端完成报告
- [PHASE3-FRONTEND-IMPLEMENTATION-GUIDE.md](./PHASE3-FRONTEND-IMPLEMENTATION-GUIDE.md) - 前端实现指南
- [COMPLETE-IMPLEMENTATION-SUMMARY.md](./COMPLETE-IMPLEMENTATION-SUMMARY.md) - 完整总结

---

## 🆘 获取帮助

如遇到问题:

1. 查看本文档的常见问题部分
2. 查看项目 Issues
3. 查看相关文档
4. 提交新的 Issue

---

## 📝 维护和更新

### 更新依赖

```bash
# 检查过时的包
npm outdated

# 更新所有依赖到最新版本
npm update

# 或使用 npm-check-updates
npx npm-check-updates -u
npm install
```

### 日志管理

```bash
# PM2 日志
pm2 logs interview-backend

# Docker 日志
docker-compose logs -f backend
```

### 备份

定期备份:
- Mock 数据 (`backend/mock-server.js` 中的 mockData)
- 配置文件
- 用户上传的文件

---

<div align="center">

**🚀 部署成功！**

Made with ❤️ by Claude Code

[返回主页](./README.md) · [查看文档](./DOCUMENTATION-INDEX.md)

</div>
