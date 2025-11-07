# 🚀 Dify 工作流快速启动（方案A）

## 📝 3 步启动

### 第 1 步：修改配置（⏱️ 1分钟）

根据您的操作系统，编辑对应的启动脚本：

| 操作系统 | 文件 | 修改位置 |
|---------|------|---------|
| Windows (CMD) | `start-with-dify.bat` | 第 15-19 行 |
| Windows (PowerShell) | `start-with-dify.ps1` | 第 15-19 行 |
| Linux/Mac | `start-with-dify.sh` | 第 15-19 行 |

**需要修改的内容：**
```bash
# 替换为您的实际值
DIFY_WORKFLOW_URL=https://api.dify.ai/v1/workflows/run
DIFY_APP_ID=app-你的应用ID
```

### 第 2 步：启动后端（⏱️ 1分钟）

**Windows (PowerShell)：**
```powershell
.\start-with-dify.ps1
```

**Windows (CMD)：**
```cmd
start-with-dify.bat
```

**Linux/Mac：**
```bash
chmod +x start-with-dify.sh
./start-with-dify.sh
```

### 第 3 步：启动前端 + 测试（⏱️ 1分钟）

**新开一个终端窗口：**
```bash
cd frontend
npm run dev
```

**打开浏览器：**
```
http://localhost:5174/interview/ai
```

**测试功能：**
1. 输入专业：`Python后端开发工程师`
2. 点击：`智能生成题目`
3. 查看生成的题目 ✨

---

## 🔑 获取 Dify 配置信息

### Workflow URL（工作流地址）

**格式：**
```
https://api.dify.ai/v1/workflows/run
```
或
```
https://your-dify-instance.com/v1/workflows/run
```

### App ID（应用密钥）

**位置：** Dify 控制台 → 工作流设置 → API 访问

**格式：**
```
app-xxxxxxxxxxxxxxxxxx
```

---

## ✅ 验证是否成功

### 后端启动成功的标志：

```
========================================
 正在启动 Spring Boot 应用...
========================================

提示：
 - 后端服务地址: http://localhost:8080/api
 - 日志级别: DEBUG
```

### API 调用成功的标志：

在后端日志中看到：
```
Calling Dify workflow with params: {...}
Dify workflow response status: 200
```

### 前端生成成功的标志：

- ✅ 页面显示生成进度
- ✅ 显示 5 道面试题目
- ✅ 每道题目都有标准答案
- ✅ 显示 session ID

---

## ❌ 遇到问题？

| 问题 | 检查项 | 解决方案 |
|-----|--------|---------|
| **404 Not Found** | 后端是否启动？<br>URL 是否正确？ | 重启后端服务<br>检查控制台日志 |
| **401 Unauthorized** | App ID 是否正确？ | 重新复制 Dify App ID |
| **超时** | 网络是否正常？<br>工作流是否太慢？ | 检查网络连接<br>优化工作流 |
| **500 错误** | Dify URL 是否正确？ | 检查后端日志<br>验证 Dify 配置 |

---

## 📚 完整文档

- **配置详解：** `DIFY_CONFIG.md`
- **集成指南：** `DIFY_INTEGRATION_GUIDE.md`
- **生产部署：** `production/README.md`

---

## 🎯 已完成的配置

✅ 后端配置文件已添加 Dify 配置项
✅ API 路径已统一为 `/api`
✅ 创建了 3 个启动脚本（.bat / .ps1 / .sh）
✅ 环境变量自动加载
✅ 错误检测和友好提示

**现在只需：修改配置 → 启动 → 测试！**

---

## 💡 临时测试其他工作流

**PowerShell：**
```powershell
$env:DIFY_WORKFLOW_URL = "https://test-url"
$env:DIFY_APP_ID = "test-app-id"
cd backend
mvn spring-boot:run
```

**Bash：**
```bash
export DIFY_WORKFLOW_URL="https://test-url"
export DIFY_APP_ID="test-app-id"
cd backend
mvn spring-boot:run
```

---

## 🔗 API 请求流程

```
用户输入专业
    ↓
前端发送请求: POST /api/ai/dify-workflow
    ↓
Vite 代理转发: http://localhost:8080/api/ai/dify-workflow
    ↓
后端接收处理: AiController
    ↓
调用 Dify API: AiServiceImpl
    ↓
返回生成结果
    ↓
前端展示题目 ✨
```

---

**需要帮助？** 查看完整文档：`DIFY_CONFIG.md`
