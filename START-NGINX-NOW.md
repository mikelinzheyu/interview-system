# 🚀 立即开始：Windows 本地 nginx 安装指南

## ⏱️ 总耗时：15 分钟

---

## 📋 步骤 1: 安装 nginx (3 分钟)

### 选项 A: 使用 Chocolatey（推荐）

#### 检查 Chocolatey 是否已安装
```powershell
# 打开 PowerShell (管理员模式)
# Win + X，选择 "Windows PowerShell (管理员)"

choco --version
```

如果显示版本号，说明已安装，跳到下一步。

如果没有安装，执行：
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072); iex (New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1')
```

#### 安装 nginx
```powershell
choco install nginx -y
```

等待安装完成，应该看到：
```
nginx 1.x.x [Approved]
Installation successful
```

---

### 选项 B: 手动安装（如果 Chocolatey 安装失败）

1. 下载 nginx：http://nginx.org/en/download.html
   - 下载 Windows 版本 (nginx-1.xx.x.zip)

2. 解压到：`C:\nginx`
   - 最终路径应该是：`C:\nginx\nginx.exe`

3. 验证：
```powershell
C:\nginx\nginx.exe -v
```

---

## 📝 步骤 2: 配置 nginx (5 分钟)

### 查找配置文件位置
```powershell
# 从项目目录找到配置文件
cd D:\code7\interview-system
dir nginx-windows.conf
```

### 复制配置文件

**方法 1: 使用 PowerShell 复制**
```powershell
copy "D:\code7\interview-system\nginx-windows.conf" "C:\nginx\conf\nginx.conf"
```

**方法 2: 手动复制**
1. 打开 `D:\code7\interview-system\nginx-windows.conf`
2. 全选所有内容 (`Ctrl+A`)
3. 复制 (`Ctrl+C`)
4. 打开 `C:\nginx\conf\nginx.conf`
5. 清空原内容
6. 粘贴 (`Ctrl+V`)
7. 保存 (`Ctrl+S`)

### 验证配置
```powershell
cd C:\nginx
nginx.exe -t
```

应该看到：
```
nginx: the configuration file C:\nginx\conf\nginx.conf syntax is ok
nginx: configuration file C:\nginx\conf\nginx.conf test is successful
```

---

## 🚀 步骤 3: 启动 nginx (2 分钟)

### 启动 nginx
```powershell
cd C:\nginx
nginx.exe
```

### 验证运行
```powershell
# 打开新的 PowerShell 窗口 (不关闭上一个)

# 测试健康检查
curl http://localhost/health

# 应该看到: OK
```

### 检查是否在运行
```powershell
# 检查进程
tasklist | findstr nginx

# 应该看到类似:
# nginx.exe        1234
# nginx.exe        5678
```

---

## 🔧 步骤 4: 启动存储服务 (2 分钟)

### 打开新的 PowerShell 窗口

```powershell
# 进入项目目录
cd D:\code7\interview-system

# 启动存储服务
node mock-storage-service.js

# 应该看到:
# Storage service listening on port 8080
```

---

## 🧪 步骤 5: 测试 API (2 分钟)

### 打开第三个 PowerShell 窗口

#### 测试健康检查
```powershell
curl http://localhost/health

# 返回: OK
```

#### 测试 API 端点
```powershell
$body = @{
    "sessionId" = "test-session-1"
    "jobTitle" = "Python开发工程师"
    "questions" = @("问题1", "问题2")
    "createdAt" = [System.DateTime]::Now.ToString()
    "status" = "test"
} | ConvertTo-Json

curl -X POST http://localhost/api/sessions `
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" `
  -H "Content-Type: application/json" `
  -Body $body

# 应该返回: {"id":"test-session-1", ...}
```

---

## 📝 步骤 6: 更新 Dify 工作流 (3 分钟)

### 工作流 1 - 生成问题

1. 打开: https://udify.app/workflow/sNkeofwLHukS3sC2
2. 点击: "编辑" 按钮
3. 打开: "保存问题列表" 节点
4. 修改 Python 代码中的 URL：

**原代码：**
```python
api_url = "http://localhost:8080/api/sessions"
```

**改为：**
```python
api_url = "http://localhost/api/sessions"
```

5. 点击: "保存"
6. 点击: "发布"
7. 等待 30 秒

### 工作流 2 和 3

重复相同步骤，修改 URL 为 `http://localhost/api/sessions`

---

## ✅ 步骤 7: 验证工作流 (1 分钟)

### 测试工作流 1

```powershell
# 在第一个 PowerShell 窗口中 (nginx 运行的位置)
# 打开新窗口

cd D:\code7\interview-system
node test-workflow1-simple.js

# 应该看到:
# ✅ HTTP 状态: 200
# ✅ session_id: uuid-xxxxx (有值)
# ✅ questions: [...] (有问题)
# ✅ job_title: 正确值
```

成功标志：
- session_id 不为空 ✅
- questions 不是 [] ✅
- job_title 正确 ✅

---

## 🎉 完成！

现在你的本地环境已经准备好了！

### 运行中的服务概览

```
终端 1: nginx 反向代理 (localhost:80)
    命令: cd C:\nginx && nginx.exe
    状态: 运行中

终端 2: 存储服务 (localhost:8080)
    命令: node mock-storage-service.js
    状态: 运行中

终端 3: 测试和开发
    命令: 各种测试命令
    状态: 按需使用
```

---

## 📊 架构验证

```
Dify 工作流 (云)
    ↓
http://localhost/api/sessions
    ↓
nginx 反向代理 (localhost:80)
    ↓
http://localhost:8080/api/sessions
    ↓
Node.js 存储服务 (localhost:8080)
    ↓
响应数据 ✅
```

---

## 🔧 常用命令速查

### nginx 命令
```powershell
# 启动
cd C:\nginx && nginx.exe

# 重新加载配置
nginx.exe -s reload

# 停止
nginx.exe -s stop

# 优雅退出
nginx.exe -s quit

# 验证配置
nginx.exe -t
```

### 查看日志
```powershell
# nginx 错误日志
type C:\nginx\logs\error.log

# nginx 访问日志
type C:\nginx\logs\access.log

# 或使用 tail (如果安装了 Git Bash)
tail -f C:\nginx\logs\error.log
```

### 检查端口
```powershell
# 检查 80 端口
netstat -ano | findstr :80

# 检查 8080 端口
netstat -ano | findstr :8080
```

---

## 🚨 故障排除

### 问题 1: nginx 启动失败

```powershell
# 验证配置
nginx.exe -t

# 查看错误
type C:\nginx\logs\error.log

# 常见原因:
# - 80 端口被占用
#   解决: 改 nginx.conf 中的 listen 为 8888
# - 配置文件有语法错误
#   解决: 检查 nginx.conf 的格式
```

### 问题 2: 无法访问 API

```powershell
# 检查 nginx 是否运行
tasklist | findstr nginx

# 检查存储服务是否运行
netstat -ano | findstr :8080

# 测试 nginx
curl http://localhost/health

# 检查 nginx 日志
type C:\nginx\logs\error.log
```

### 问题 3: 工作流返回 502 或 503

```powershell
# 1. 检查存储服务
node mock-storage-service.js

# 2. 检查 nginx 访问日志
type C:\nginx\logs\access.log

# 3. 检查防火墙是否阻止了连接
# Windows 防火墙 → 允许应用通过 → nginx
```

---

## 📚 下一步

### 立即验证
- [x] nginx 已安装
- [x] 配置已应用
- [x] 存储服务已启动
- [x] Dify 工作流已更新
- [x] 工作流测试通过

### 将来迁移到云（参考文档）
- 📖 CLOUD-MIGRATION-CHECKLIST.md
- 📖 NGROK-TO-NGINX-MIGRATION.md

---

## 💡 重要提示

✅ **备份原配置**
```powershell
copy C:\nginx\conf\nginx.conf C:\nginx\conf\nginx.conf.bak
```

✅ **保持终端打开**
- 不要关闭 nginx 和存储服务终端
- 它们需要持续运行

✅ **重启计算机时**
```powershell
# 需要重新启动这两个服务:
cd C:\nginx && nginx.exe
node D:\code7\interview-system\mock-storage-service.js
```

✅ **定期查看日志**
- 监控错误日志确保没有问题
- 记录 API 调用统计

---

## ✨ 成功检查清单

完成所有这些后，你就成功了：

- [ ] nginx 已安装 (`nginx.exe -v` 有输出)
- [ ] 配置文件已复制到 `C:\nginx\conf\nginx.conf`
- [ ] nginx 已启动 (`tasklist | findstr nginx` 有输出)
- [ ] 存储服务已启动 (看到 "listening on port 8080")
- [ ] 健康检查成功 (`curl http://localhost/health` 返回 OK)
- [ ] API 测试成功 (POST 请求有响应)
- [ ] Dify 工作流 URL 已更新
- [ ] 工作流 1 测试通过 (`node test-workflow1-simple.js`)
- [ ] 没有错误日志 (检查 `C:\nginx\logs\error.log`)

---

🎉 **现在你可以开始开发了！**

需要帮助？查看相关文档或运行测试脚本！

