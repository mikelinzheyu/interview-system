# AI面试系统 Docker 生产环境部署指南

## 📋 准备工作

### 1. 系统要求
- **操作系统**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **内存**: 至少 4GB RAM
- **存储**: 至少 10GB 可用空间
- **网络**: 良好的互联网连接

### 2. 软件依赖
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (推荐最新版本)
- [Git](https://git-scm.com/) (用于代码管理)

## 🚀 快速开始

### 方法一: 一键部署 (推荐)

#### Windows 用户
```cmd
# 双击运行或在命令行执行
docker-deploy.cmd
```

#### Mac/Linux 用户
```bash
# 赋予执行权限
chmod +x docker-deploy.sh

# 运行部署脚本
./docker-deploy.sh
```

### 方法二: 手动部署

#### 1. 环境配置
```bash
# 复制环境配置文件
cp .env.example .env.production

# 编辑配置文件 (重要！)
# 修改以下关键配置:
# - DIFY_API_KEY: 您的Dify API密钥
# - JWT_SECRET: 生产环境JWT密钥
# - 其他必要的安全配置
```

#### 2. 构建镜像
```bash
# 构建所有服务
docker-compose --env-file .env.production build --no-cache

# 或者分别构建
docker-compose --env-file .env.production build backend
docker-compose --env-file .env.production build frontend
```

#### 3. 启动服务
```bash
# 启动所有服务
docker-compose --env-file .env.production up -d

# 查看服务状态
docker-compose --env-file .env.production ps
```

## 🏗️ 服务架构

### 容器服务
- **interview-frontend**: Nginx + Vue.js 前端应用 (端口 80)
- **interview-backend**: Node.js Mock API 服务 (端口 8080)
- **interview-redis**: Redis 缓存服务 (端口 6379)

### 网络配置
- **内部网络**: interview-network
- **外部访问**: 通过 80 和 8080 端口

### 数据持久化
- **Redis数据**: ./data/redis
- **应用日志**: ./logs/
- **Nginx日志**: ./logs/frontend/

## 🔧 配置说明

### 环境变量配置 (.env.production)

```env
# 核心配置
APP_NAME=AI面试系统
APP_ENV=production

# 端口配置
FRONTEND_PORT=80
BACKEND_PORT=8080

# Dify AI配置 (必须配置！)
DIFY_API_KEY=your-dify-api-key-here
DIFY_API_BASE_URL=https://api.dify.ai/v1

# 安全配置 (必须修改！)
JWT_SECRET=your-production-jwt-secret-key
```

### 重要安全提醒 ⚠️
1. **必须修改 JWT_SECRET** - 使用至少32位的随机字符串
2. **配置真实的 DIFY_API_KEY** - 获取有效的Dify API密钥
3. **HTTPS配置** - 生产环境建议配置SSL证书

## 📱 访问应用

部署成功后，您可以通过以下地址访问:

- **🎨 前端应用**: http://localhost
- **🔧 API服务**: http://localhost:8080
- **❤️ 健康检查**: http://localhost/health

### 主要功能页面
- **首页统计**: http://localhost/
- **AI面试**: http://localhost/interview/ai
- **用户登录**: http://localhost/auth/login

## 🔍 故障排除

### 常见问题

#### 1. Docker 连接失败
```bash
# 错误: Cannot connect to the Docker daemon
# 解决: 启动 Docker Desktop
```

#### 2. 端口被占用
```bash
# 错误: Port 80 is already in use
# 解决: 修改 .env.production 中的端口配置
FRONTEND_PORT=8081
BACKEND_PORT=8082
```

#### 3. 内存不足
```bash
# 错误: Build failed due to memory limit
# 解决: 增加 Docker Desktop 的内存分配
# Docker Desktop -> Settings -> Resources -> Memory
```

#### 4. 前端无法访问API
```bash
# 检查网络连接
docker network ls
docker network inspect interview-network

# 检查服务状态
docker-compose --env-file .env.production logs backend
```

### 日志查看
```bash
# 查看所有服务日志
docker-compose --env-file .env.production logs -f

# 查看特定服务日志
docker-compose --env-file .env.production logs -f backend
docker-compose --env-file .env.production logs -f frontend

# 查看容器状态
docker-compose --env-file .env.production ps
```

## 🛠️ 管理命令

### 基本操作
```bash
# 启动服务
docker-compose --env-file .env.production up -d

# 停止服务
docker-compose --env-file .env.production down

# 重启服务
docker-compose --env-file .env.production restart

# 查看状态
docker-compose --env-file .env.production ps
```

### 维护操作
```bash
# 重新构建并启动
docker-compose --env-file .env.production up -d --build

# 清理未使用的镜像
docker system prune -a

# 备份数据
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/

# 更新应用
git pull
docker-compose --env-file .env.production down
docker-compose --env-file .env.production build --no-cache
docker-compose --env-file .env.production up -d
```

## 🔒 安全建议

### 生产环境配置
1. **修改默认密码和密钥**
2. **配置防火墙规则**
3. **启用HTTPS**
4. **定期备份数据**
5. **监控资源使用**

### HTTPS 配置 (可选)
```bash
# 将SSL证书放置到 nginx/ssl/ 目录
# 修改 docker-compose.yml 启用 nginx-proxy 服务
docker-compose --env-file .env.production --profile proxy up -d
```

## 📞 技术支持

如果您在部署过程中遇到问题:

1. 检查本文档的故障排除部分
2. 查看应用日志寻找错误信息
3. 确保网络连接正常
4. 验证配置文件格式正确

## 🎉 部署完成

恭喜！您已成功部署AI面试系统的Docker生产环境。

现在您可以:
- ✅ 访问前端应用进行面试练习
- ✅ 使用AI智能问题生成功能
- ✅ 体验语音识别和答案分析
- ✅ 查看个人统计和排行榜

祝您使用愉快！🎊