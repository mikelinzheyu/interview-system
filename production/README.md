# AI面试系统 - 生产环境Docker部署指南

## 快速开始

### 1. 配置环境变量

编辑 `.env.production` 文件，修改必要的配置：

```env
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_PASSWORD=your_secure_password
REDIS_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_at_least_64_characters
OPENAI_API_KEY=your_openai_api_key
```

### 2. 部署系统

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**
```powershell
.\deploy.ps1
```

### 3. 访问服务

- 前端: http://localhost
- Java后端: http://localhost:8080
- Node后端: http://localhost:3001

## 系统架构

- **MySQL 8.0**: 关系数据库
- **Redis 7**: 缓存和会话存储
- **Spring Boot**: Java后端服务 + 存储API
- **Express**: Node.js后端服务
- **Vue.js + Nginx**: 前端服务

## 服务管理

```bash
# 查看服务状态
docker-compose -f docker-compose.production.yml ps

# 查看日志
docker-compose -f docker-compose.production.yml logs -f

# 停止服务
docker-compose -f docker-compose.production.yml down

# 重启服务
docker-compose -f docker-compose.production.yml restart
```

详细文档请参考项目Wiki。
