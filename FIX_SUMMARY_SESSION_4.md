# Session 4 修复总结 - 数据库和环境配置

## 问题分析

从 test3/7.txt 中的后端日志发现了关键问题：

### 问题1: 数据库连接失败 ❌
```
❌ 数据库连接失败: ConnectionRefusedError [SequelizeConnectionRefusedError]:
   connect ECONNREFUSED ::1:3306
```

**根本原因**:
- 后端代码 (`backend/config/database.js`) 配置使用 **MySQL** (dialect: 'mysql', port: 3306)
- Docker Compose (`docker-compose.prod.yml`) 配置使用 **PostgreSQL** (postgres:15)
- 数据库类型不匹配导致连接失败

### 问题2: Dify API 密钥未配置 ⚠️
```
[WARN] [Dify] Workflow API Key or Workflow ID not configured.
Error: DIFY_INTERVIEW_INIT_KEY 未配置
```

**原因**:
- 环境变量没有正确配置到后端容器

### 问题3: CSP 安全策略阻止连接 🔒
```
Connecting to 'http://localhost:8080/api/users/me' violates the following
Content Security Policy directive: "default-src 'self'"
```

**已在 Session 3 修复** ✅

---

## 修复内容

### 修复1: 数据库配置更新 (Commit 6e72955)

#### 1.1 后端配置 (`backend/config/database.js`)
```javascript
// 改前:
dialect: 'mysql',
port: process.env.DB_PORT || 3306,
host: process.env.DB_HOST || 'localhost',

// 改后:
dialect: 'postgres',
port: process.env.DB_PORT || 5432,
host: process.env.DB_HOST || 'interview-db',
```

**关键变更**:
- 驱动程序: MySQL → PostgreSQL
- 默认端口: 3306 → 5432
- 默认主机: localhost → interview-db (Docker 服务名)
- 默认用户: root → admin
- 默认密码: root → SecurePassword123!

#### 1.2 Docker Compose 配置 (`docker-compose.prod.yml`)
添加数据库环境变量到后端服务:
```yaml
environment:
  # 数据库配置 (PostgreSQL)
  DB_HOST: interview-db
  DB_PORT: 5432
  DB_NAME: ${DB_NAME:-interview_system}
  DB_USER: ${DB_USER:-admin}
  DB_PASSWORD: ${DB_PASSWORD:-SecurePassword123!}
```

添加依赖关系:
```yaml
depends_on:
  db:
    condition: service_healthy
  redis:
    condition: service_healthy
```

**效果**:
- 后端等待数据库完全启动后再连接
- 环境变量与 PostgreSQL 服务配置一致

#### 1.3 环境配置文件更新

**`.env` 文件**:
```bash
# 改前 (MySQL):
MYSQL_ROOT_PASSWORD=root123456
MYSQL_PORT=3307

# 改后 (PostgreSQL):
POSTGRES_DB=interview_system
POSTGRES_USER=admin
POSTGRES_PASSWORD=SecurePassword123!
DB_PORT=5432
```

**`.env.prod` 文件**:
```bash
# 改前:
DB_TYPE=mysql
DB_PORT=3306
DB_USER=interview_user

# 改后:
DB_TYPE=postgres
DB_PORT=5432
DB_USER=admin
```

---

## 修复2: Dify API 密钥配置 (Commit 6e72955)

更新 `.env` 和 `.env.prod` 文件，添加三个 Dify 工作流 API 密钥:

```bash
# ⚠️ 三个工作流的 API 密钥
DIFY_API_BASE_URL=https://api.dify.ai/v1

# 工作流1: 面试初始化
DIFY_INTERVIEW_INIT_KEY=app-tbxpV6bDyAYab4qqRYSavxH3

# 工作流2: 模拟面试官
DIFY_INTERVIEW_CHAT_KEY=app-4wtUAIUlZDoohTFfjN2T6WNk

# 工作流3: 面试裁决
DIFY_INTERVIEW_VERDICT_KEY=app-7g0QiWpxu9ASO2f7U3VccK16
```

这些变量会通过 `docker-compose.prod.yml` 传递到后端容器，解决"密钥未配置"的错误。

---

## 修复3: CSP 安全策略 (Commit 38fefa9)

前端 CSP 元标签已添加 `http://localhost:8080`:

```html
<!-- 改后: -->
<meta http-equiv="Content-Security-Policy"
      content="... connect-src 'self' ws: wss: ... http://localhost:8080 ...">
```

这允许前端调用端口 8080 上的 API 和 WebSocket 连接。

---

## 预期效果

### ✅ 修复后:
1. 后端成功连接到 PostgreSQL 数据库
2. 数据库表自动同步成功
3. Dify API 密钥正确加载到环境变量
4. 前端 CSP 策略不再阻止 API 和 WebSocket 连接
5. WebSocket 连接建立成功
6. API 调用成功

### ❌ 修复前的错误:
- `connect ECONNREFUSED ::1:3306` - 数据库连接失败
- `DIFY_INTERVIEW_INIT_KEY 未配置` - 环境变量缺失
- CSP violations 阻止网络请求

---

## 提交信息

### Commit 38fefa9 (Session 3)
```
fix: Add localhost:8080 to CSP connect-src directive to allow API and WebSocket connections
```
- 修复前端 CSP 策略
- 允许前端连接到 API 端口

### Commit 6e72955 (Session 4)
```
fix: Update database configuration from MySQL to PostgreSQL and fix environment variables

- Change backend database dialect from mysql to postgres (port 5432)
- Update default DB credentials to match docker-compose.prod.yml PostgreSQL service
- Add database connection variables to docker-compose.prod.yml backend service
- Add db service dependency to backend service with health check condition
- Update .env and .env.prod files with PostgreSQL configuration
- Update Dify API key environment variables (DIFY_INTERVIEW_*_KEY)
- Ensures backend can connect to PostgreSQL in Docker environment
```

---

## 验证步骤

### 本地 Docker 测试:
```bash
# 1. 清理旧容器
docker-compose -f docker-compose.prod.yml down -v

# 2. 启动新容器
docker-compose -f docker-compose.prod.yml up -d

# 3. 等待启动
sleep 30

# 4. 检查状态
docker-compose -f docker-compose.prod.yml ps

# 5. 查看后端日志 (应该看到"Server running on port 3001")
docker logs interview-backend

# 6. 测试 API
curl http://localhost:3001/api/health
```

### 预期日志输出:
```
✅ 数据库连接成功
[DataService] 所有控制器已初始化
╔════════════════════════════════════════════════════════════╗
║          🚀 Backend Server 已启动                          ║
╠════════════════════════════════════════════════════════════╣
║  HTTP API  : http://localhost:3001/api                    ║
║  WebSocket : ws://localhost:3001                         ║
```

---

## Ubuntu ECS 部署

推送到 GitHub 后，可以在 ECS 服务器上部署:

```bash
# 1. SSH 连接
ssh ubuntu@iZf8z86rqtrm82udlv5zcqZ.cn-hongkong.aliyuncs.com

# 2. 更新代码
cd /path/to/interview-system
git pull origin main

# 3. 启动容器
sudo docker-compose -f docker-compose.prod.yml up -d

# 4. 验证
docker-compose -f docker-compose.prod.yml ps
docker logs interview-backend
```

---

## 文件修改总结

| 文件 | 修改内容 | 影响 |
|------|---------|------|
| `backend/config/database.js` | MySQL → PostgreSQL | 数据库连接 |
| `docker-compose.prod.yml` | 添加数据库环境变量和依赖 | 容器启动顺序 |
| `.env` | MySQL → PostgreSQL 配置 | 本地环境变量 |
| `.env.prod` | MySQL → PostgreSQL 配置 | 生产环境变量 |
| `frontend/index.html` (Session 3) | 添加 localhost:8080 到 CSP | 前端网络请求 |

---

## 关键配置对应关系

**Docker Compose PostgreSQL 服务:**
```yaml
db:
  POSTGRES_DB: interview_system      ← DB_NAME
  POSTGRES_USER: admin               ← DB_USER
  POSTGRES_PASSWORD: SecurePassword123!  ← DB_PASSWORD
  port: 5432                         ← DB_PORT
```

**后端连接参数:**
```javascript
DB_NAME=interview_system          ✓ 匹配
DB_USER=admin                     ✓ 匹配
DB_PASSWORD=SecurePassword123!    ✓ 匹配
DB_HOST=interview-db              ✓ Docker 服务名
DB_PORT=5432                      ✓ PostgreSQL 端口
dialect='postgres'                ✓ Sequelize 驱动
```

---

**状态**: ✅ 本地提交完成，等待推送到 GitHub
**下一步**: 网络恢复后执行 `git push origin main`
