# Dify 工作流配置指南（方案A - 环境变量）

## 快速开始

### 1️⃣ 获取您的 Dify 工作流信息

登录 Dify 控制台，获取以下信息：

#### Workflow URL（工作流运行地址）
- **格式**：`https://api.dify.ai/v1/workflows/run`
- **或**：`https://your-dify-instance.com/v1/workflows/run`

#### App ID / API Token（应用密钥）
- 在 Dify 工作流设置中找到 "API 访问"
- 复制 App ID 或 API Token
- **示例**：`app-xxxxxxxxxxxxxxxxxx`

### 2️⃣ 修改启动脚本

我已经为您创建了三个启动脚本：

#### Windows (CMD)
编辑 `start-with-dify.bat` 文件的第 15-19 行：

```batch
REM 修改这两行为您的实际值
set DIFY_WORKFLOW_URL=https://api.dify.ai/v1/workflows/run
set DIFY_APP_ID=app-vZlc0w5Dio2gnrTkdlblcPXG
```

#### Windows (PowerShell)
编辑 `start-with-dify.ps1` 文件的第 15-19 行：

```powershell
# 修改这两行为您的实际值
$env:DIFY_WORKFLOW_URL = "https://api.dify.ai/v1/workflows/run"
$env:DIFY_APP_ID = "app-vZlc0w5Dio2gnrTkdlblcPXG"
```

#### Linux/Mac
编辑 `start-with-dify.sh` 文件的第 15-19 行：

```bash
# 修改这两行为您的实际值
export DIFY_WORKFLOW_URL="https://api.dify.ai/v1/workflows/run"
export DIFY_APP_ID="app-vZlc0w5Dio2gnrTkdlblcPXG"
```

### 3️⃣ 启动后端服务

#### Windows (推荐使用 PowerShell)

**方式1：双击运行**
```
双击 start-with-dify.bat 或 start-with-dify.ps1
```

**方式2：命令行运行**
```powershell
# PowerShell
.\start-with-dify.ps1

# 或 CMD
start-with-dify.bat
```

#### Linux/Mac

```bash
# 添加执行权限
chmod +x start-with-dify.sh

# 运行脚本
./start-with-dify.sh
```

### 4️⃣ 启动前端服务

在新的终端窗口中：

```bash
cd frontend
npm run dev
```

### 5️⃣ 测试功能

1. 访问：`http://localhost:5174/interview/ai`
2. 输入专业名称：如 "Python后端开发工程师"
3. 点击"智能生成题目"
4. 打开浏览器 F12 查看网络请求

## 脚本说明

### 启动脚本功能

✅ 自动设置 Dify 工作流环境变量
✅ 自动设置数据库连接信息
✅ 检测 Java 和 Maven 是否安装
✅ 启动 Spring Boot 应用
✅ 显示清晰的启动日志

### 脚本中的配置项

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `DIFY_WORKFLOW_URL` | Dify 工作流运行地址 | https://api.dify.ai/v1/workflows/run |
| `DIFY_APP_ID` | Dify 应用 ID / API Token | app-vZlc0w5Dio2gnrTkdlblcPXG |
| `DB_PASSWORD` | MySQL 数据库密码 | 123456 |
| `REDIS_PASSWORD` | Redis 密码（可选） | （空） |
| `JWT_SECRET` | JWT 密钥（可选） | （使用配置文件默认值） |

## 验证配置是否生效

### 1. 查看启动日志

启动后端服务后，查看控制台输出：

```
========================================
 正在启动 Spring Boot 应用...
========================================

提示：
 - 后端服务地址: http://localhost:8080/api
 - API 文档: http://localhost:8080/api/doc.html
 - 日志级别: DEBUG
```

### 2. 查看 Spring Boot 日志

在日志中搜索：

```
Calling Dify workflow with params
```

如果看到这行日志，说明：
- ✅ Dify 配置已加载
- ✅ 环境变量设置成功
- ✅ 请求已发送到 Dify

### 3. 测试 API 调用

使用 curl 或 Postman 测试：

```bash
curl -X POST http://localhost:8080/api/ai/dify-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "generate_questions",
    "jobTitle": "前端开发工程师"
  }'
```

成功响应示例：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "session_id": "uuid-here",
    "questions": [...]
  }
}
```

## 常见问题

### Q1: 启动脚本报错 "未检测到 Java"

**解决方案：**
1. 安装 JDK 17 或更高版本
2. 配置 JAVA_HOME 环境变量
3. 确保 `java -version` 能正常运行

### Q2: 启动脚本报错 "未检测到 Maven"

**解决方案：**
1. 安装 Apache Maven
2. 配置 Maven 环境变量
3. 确保 `mvn -version` 能正常运行

### Q3: Dify 返回 401 Unauthorized

**原因：** App ID 不正确

**解决方案：**
1. 检查 Dify 控制台中的 App ID
2. 确保复制了完整的 App ID
3. 重新编辑启动脚本，更新 App ID
4. 重启后端服务

### Q4: Dify 返回 404 Not Found

**原因：** Workflow URL 不正确

**解决方案：**
1. 检查 Dify 工作流 URL 格式
2. 确认工作流已发布并可访问
3. 更新启动脚本中的 URL
4. 重启后端服务

### Q5: 请求超时

**原因：**
- 网络连接问题
- Dify 工作流执行时间过长

**解决方案：**
1. 检查网络连接
2. 前端已设置 90 秒超时（`frontend/src/api/index.js:7`）
3. 后端已设置 60 秒超时（`AiServiceImpl.java:174`）
4. 如需调整，修改相应配置

### Q6: 如何临时测试不同的 Dify 工作流？

**方案1：直接在终端设置环境变量（Windows PowerShell）**
```powershell
$env:DIFY_WORKFLOW_URL = "https://test-workflow-url"
$env:DIFY_APP_ID = "test-app-id"
cd backend
mvn spring-boot:run
```

**方案2：修改启动脚本后运行**

## 其他配置选项

### 自定义数据库密码

编辑启动脚本：
```bash
# 修改为您的数据库密码
set DB_PASSWORD=your-password
```

### 自定义 Redis 密码

如果 Redis 设置了密码：
```bash
# 修改为您的 Redis 密码
set REDIS_PASSWORD=your-redis-password
```

### 自定义 JWT 密钥

如果需要自定义 JWT 密钥：
```bash
# 取消注释并设置您的密钥
set JWT_SECRET=your-custom-jwt-secret-key-here
```

## 下一步

配置完成后：

1. ✅ 确保 MySQL 和 Redis 服务已启动
2. ✅ 运行启动脚本启动后端
3. ✅ 启动前端开发服务器
4. ✅ 访问 `http://localhost:5174/interview/ai` 测试功能

## 生产环境部署

如需在生产环境使用，建议：

1. **使用专门的环境变量管理工具**
   - Linux: systemd environment files
   - Docker: docker-compose.yml 的 environment 配置
   - Kubernetes: ConfigMap 和 Secret

2. **保护敏感信息**
   - 不要在代码中硬编码密钥
   - 使用密钥管理服务（如 HashiCorp Vault）
   - 限制环境变量的访问权限

3. **使用生产级配置**
   - 参考 `production/docker-compose.production.yml`
   - 使用独立的配置文件
   - 启用 HTTPS

## 相关文档

- 完整集成指南: `DIFY_INTEGRATION_GUIDE.md`
- 生产部署文档: `production/README.md`
- 快速开始: `production/QUICK_START.md`
