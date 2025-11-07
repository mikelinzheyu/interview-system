# 🚀 前后端快速启动指南

## 📋 概述

本指南提供了最简单的前后端启动方式。按照以下步骤，3分钟内即可启动完整系统。

---

## ⚡ 最快的启动方式

### 方式1: 使用启动脚本（推荐 ✅）

**Windows用户**，使用我们为你创建的启动脚本：

#### 第一步：启动后端
```
双击运行: start-backend.bat
```

**预期输出：**
```
========================================
启动后端Mock API服务器
========================================

启动Mock API服务器...
访问地址: http://localhost:3001
健康检查: http://localhost:3001/api/health
WebSocket: ws://localhost:3001/ws

按 Ctrl+C 停止服务器
```

#### 第二步：启动前端
```
新打开一个命令窗口，双击运行: start-frontend.bat
```

**预期输出：**
```
========================================
启动前端开发服务器 (Vite)
========================================

启动Vite开发服务器...
访问地址: http://localhost:5174

按 Ctrl+C 停止服务器
```

#### 第三步：访问系统
```
在浏览器打开: http://localhost:5174
```

---

## 🔧 手动启动（如果脚本不工作）

### 方式2: 使用命令行

**打开3个终端窗口**

**终端1 - 启动后端：**
```bash
cd D:\code7\interview-system\backend
npm install      # 首次需要
npm start
```

**终端2 - 启动前端：**
```bash
cd D:\code7\interview-system\frontend
npm install      # 首次需要
npm run dev
```

**终端3 - 运行测试（可选）：**
```bash
cd D:\code7\interview-system
node test-integration.js
```

---

## 🌐 验证系统

### 检查后端是否运行

```bash
# 方式1：在浏览器打开
http://localhost:3001/api/health

# 预期看到：
{
  "code": 200,
  "message": "Success",
  "data": {
    "status": "UP",
    "version": "1.0.0"
  }
}
```

### 检查前端是否运行

```bash
# 在浏览器打开
http://localhost:5174

# 预期：看到前端页面
```

### 检查WebSocket连接

```bash
# 在浏览器控制台执行
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => console.log('WebSocket已连接');
```

---

## 📊 服务地址速查表

| 服务 | 地址 | 用途 |
|------|------|------|
| 前端 | http://localhost:5174 | 用户界面 |
| 后端API | http://localhost:3001/api | 后端接口 |
| 健康检查 | http://localhost:3001/api/health | 服务状态 |
| WebSocket | ws://localhost:3001/ws | 实时通信 |

---

## 🐛 常见问题速解

### 问题1：端口已被占用

**症状：**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决方案：**
```bash
# Windows - 杀死所有node进程
taskkill /F /IM node.exe

# 然后重新启动
```

---

### 问题2：前端无法访问 localhost:5174

**症状：**
```
无法访问 http://localhost:5174
或显示空白页面
```

**解决方案：**

1. **检查前端是否运行**
   - 查看前端终端窗口是否有错误信息
   - 应该看到 `Local: http://localhost:5174`

2. **清除浏览器缓存**
   ```
   F12 → Application → Clear site data
   ```

3. **重新加载页面**
   ```
   Ctrl+Shift+R (强制刷新)
   ```

4. **检查防火墙**
   - Windows防火墙可能阻止了5174端口
   - 允许 node.exe 通过防火墙

---

### 问题3：API连接失败

**症状：**
```
CORS error 或 API 404
```

**解决方案：**

1. **检查后端是否运行**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **检查API代理配置**
   ```
   vite.config.js 中的 proxy 设置是否正确
   ```

3. **重启后端**
   ```bash
   Ctrl+C 停止后端
   npm start 重新启动
   ```

---

### 问题4：npm 命令找不到

**症状：**
```
'npm' 不是内部或外部命令
```

**解决方案：**

1. **检查Node.js安装**
   ```bash
   node --version
   npm --version
   ```

2. **重新安装Node.js**
   - 从 https://nodejs.org 下载最新版本
   - 安装时勾选"Add to PATH"

3. **重启电脑**
   - 安装后需要重启才能生效

---

## ✅ 完整的启动检查清单

### 启动前检查
- [ ] Node.js 已安装 (`node --version`)
- [ ] npm 已安装 (`npm --version`)
- [ ] 端口 3001 未被占用
- [ ] 端口 5174 未被占用

### 启动后检查
- [ ] 后端终端显示 "服务器已启动"
- [ ] 后端可以访问 http://localhost:3001/api/health (200 OK)
- [ ] 前端终端显示 "Local: http://localhost:5174"
- [ ] 前端可以访问 http://localhost:5174 (显示页面)
- [ ] 浏览器控制台没有错误信息

### 功能检查
- [ ] 能看到前端界面
- [ ] 能点击页面上的按钮
- [ ] 控制台能看到API请求
- [ ] 没有CORS错误

---

## 🔗 重要文件位置

```
D:\code7\interview-system\
├── start-backend.bat        ← 点击启动后端
├── start-frontend.bat       ← 点击启动前端
├── backend\
│   ├── mock-server.js       ← 后端主文件
│   └── package.json
├── frontend\
│   ├── src\                 ← 前端源代码
│   ├── vite.config.js       ← Vite配置
│   └── package.json
└── test-integration.js      ← 自动化测试
```

---

## 📞 获得帮助

### 快速参考
- 📖 快速参考: `INTEGRATION_TEST_QUICK_START.md`
- 📊 详细指南: `FRONTEND_BACKEND_INTEGRATION_TEST.md`
- 🚀 部署指南: `PRODUCTION_DEPLOYMENT_GUIDE.md`

### 查看日志

```bash
# 查看后端日志
# 在后端终端窗口查看输出

# 查看前端日志
# 在浏览器 F12 → Console 查看

# 查看网络请求
# 在浏览器 F12 → Network 查看
```

---

## 🎯 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+C | 停止服务器 |
| Ctrl+Shift+R | 浏览器强制刷新 |
| F12 | 打开浏览器开发者工具 |
| Ctrl+Shift+I | 打开浏览器检查器 |

---

## 🚀 下一步

### 快速验证系统（5分钟）
1. 启动后端：`start-backend.bat`
2. 启动前端：`start-frontend.bat`
3. 访问 http://localhost:5174
4. 打开浏览器 F12，检查是否有错误

### 运行自动化测试（可选）
```bash
node test-integration.js
```

### 查看详细文档（学习更多）
- 阅读 `INTEGRATION_TEST_SUMMARY.md`
- 阅读 `FRONTEND_BACKEND_INTEGRATION_TEST.md`

---

## 💡 提示

✅ **推荐做法**：
- 使用提供的 `start-backend.bat` 和 `start-frontend.bat` 脚本
- 使用3个终端窗口分别运行后端、前端和测试
- 保持终端窗口打开以查看日志

❌ **不推荐做法**：
- 不要同时运行多个后端实例
- 不要关闭终端窗口（会停止服务）
- 不要修改 vite.config.js 中的端口配置（除非有特殊原因）

---

## 📊 系统要求

| 项目 | 要求 |
|------|------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |
| 内存 | >= 512MB |
| 磁盘 | >= 1GB |
| 网络 | 无需（本地运行） |

---

**现在就开始吧！👉 双击 `start-backend.bat` 启动后端！** 🚀

---

**版本**: 1.0
**日期**: 2024年01月
**状态**: ✅ 已验证
