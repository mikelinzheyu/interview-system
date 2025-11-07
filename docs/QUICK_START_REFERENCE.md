# ⚡ AI面试系统 - 快速开始参考卡

**打印这个页面放在桌面！**

---

## 🚀 最快启动 (5秒)

### Windows用户
```
双击这个文件:
D:\code7\interview-system\START-ALL.bat
```

**就这么简单！** ✨

然后在浏览器打开: **http://localhost:5174**

---

## 📍 关键服务地址

```
前端应用:   http://localhost:5174
后端API:    http://localhost:3001
API健康检查: http://localhost:3001/api/health
WebSocket:  ws://localhost:3001/ws
```

---

## 🆘 常见问题 - 1分钟速解

### ❌ 显示"无法访问http://localhost:5174"

**3步解决**:
```bash
# 1. 打开命令窗口，运行:
taskkill /F /IM node.exe

# 2. 等3秒

# 3. 再次双击 START-ALL.bat
```

---

### ❌ 显示"无法连接到服务器"或404错误

**检查后端**:
```bash
# 在浏览器打开这个地址，应该看到 {"code":200,...}
http://localhost:3001/api/health

# 如果不行，重启后端:
# 双击 D:\code7\interview-system\start-backend.bat
```

---

### ❌ 启动时报错"端口被占用"

**快速修复**:
```bash
# 杀死所有占用端口的进程
taskkill /F /IM node.exe

# 清理缓存
npm cache clean --force

# 重新启动
START-ALL.bat
```

---

### ❌ "npm命令找不到"或"npm不是有效命令"

**需要安装Node.js**:
1. 打开 https://nodejs.org
2. 下载LTS版本
3. **重要**: 安装时勾选 "Add to PATH"
4. 安装完成后 **重启电脑**
5. 重新尝试 `START-ALL.bat`

---

## 🔧 手动启动（如果脚本不工作）

### 打开3个命令窗口

**窗口1 - 启动后端**:
```bash
cd D:\code7\interview-system\backend
npm start
```
预期看到: `服务器已启动 http://localhost:3001`

**窗口2 - 启动前端**:
```bash
cd D:\code7\interview-system\frontend
npm run dev
```
预期看到: `Local: http://localhost:5174`

**窗口3 - 运行测试（可选）**:
```bash
cd D:\code7\interview-system
node test-integration.js
```

---

## 📊 验证系统正常工作

### 检查1: 后端响应
```bash
# 在命令行运行:
curl http://localhost:3001/api/health

# 应该看到这样的响应:
{
  "code": 200,
  "message": "Success",
  "data": { "status": "UP" }
}
```

### 检查2: 前端显示
```bash
# 在浏览器打开:
http://localhost:5174

# 应该看到一个网页（不是空白）
```

### 检查3: WebSocket连接
```javascript
// 在浏览器F12控制台粘贴运行:
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => console.log('✓ WebSocket已连接');
ws.onerror = (e) => console.error('✗ 连接失败:', e);
```

---

## 🎮 快捷键速查

| 按键 | 功能 |
|------|------|
| `Ctrl+C` | 停止服务（在命令窗口中） |
| `Ctrl+Shift+R` | 浏览器强制刷新 |
| `F12` | 打开浏览器开发者工具 |
| `Alt+Tab` | 在窗口间切换 |

---

## 📁 重要文件位置

```
D:\code7\interview-system\
├── START-ALL.bat              ← 👈 主要启动脚本（双击就行）
├── start-backend.bat          ← 只启动后端
├── start-frontend.bat         ← 只启动前端
├── START_GUIDE.md             ← 详细启动指南
├── TROUBLESHOOTING.md         ← 问题诊断
├── backend\                   ← 后端代码
│   ├── mock-server.js         ← 后端主文件
│   └── package.json
├── frontend\                  ← 前端代码
│   ├── src\                   ← 源代码
│   ├── vite.config.js         ← Vite配置
│   └── package.json
└── test-integration.js        ← 自动化测试
```

---

## 🚨 紧急排查清单

**如果什么都不工作，按顺序执行**:

```bash
# 1. 杀死所有旧进程
taskkill /F /IM node.exe
timeout /t 3

# 2. 清理npm缓存
npm cache clean --force

# 3. 删除旧的依赖（可选，耗时3-5分钟）
cd backend && rmdir /s /q node_modules
cd ../frontend && rmdir /s /q node_modules

# 4. 重新安装
cd backend && npm install
cd ../frontend && npm install

# 5. 启动
cd ..
START-ALL.bat
```

---

## 💡 常用命令速查

```bash
# 启动所有服务
START-ALL.bat

# 只启动后端
start-backend.bat

# 只启动前端
start-frontend.bat

# 运行自动化测试
node test-integration.js

# 检查后端是否运行
curl http://localhost:3001/api/health

# 杀死所有node进程
taskkill /F /IM node.exe

# 清理npm缓存
npm cache clean --force

# 重装所有依赖
npm install

# 启用npm的淘宝镜像（如果npm install太慢）
npm config set registry https://registry.npmmirror.com
```

---

## 📞 需要帮助？

### 查看这些文件:
- 📖 `START_GUIDE.md` - 完整启动步骤
- 🐛 `TROUBLESHOOTING.md` - 8个常见问题的解决方案
- 🚀 `PRODUCTION_DEPLOYMENT_GUIDE.md` - 生产部署

### 查看日志:
- 后端日志: 在后端命令窗口中查看
- 前端日志: 在浏览器F12 → Console中查看
- 网络请求: 在浏览器F12 → Network中查看

---

## 🎯 工作流程

```
1️⃣ 双击 START-ALL.bat
   ↓
2️⃣ 等待10秒，浏览器自动打开
   ↓
3️⃣ 看到前端页面 ✓
   ↓
4️⃣ 打开浏览器F12检查Console
   ↓
5️⃣ 如果有错误，参考TROUBLESHOOTING.md
   ↓
6️⃣ 一切正常 → 开始开发！
```

---

## ⏱️ 预期启动时间

| 步骤 | 耗时 | 说明 |
|------|------|------|
| 双击脚本 | < 1秒 | 立即执行 |
| npm install (首次) | 2-3分钟 | 只在首次执行 |
| 启动后端 | 3-5秒 | 显示"服务器已启动" |
| 启动前端 | 5-10秒 | 显示"Local: http://..." |
| 浏览器打开 | < 1秒 | 自动打开 |
| **总耗时** | **< 15秒** (之后) | 之后每次启动更快 |

---

## 🔍 系统要求检查

```bash
# 检查Node.js (需要 >= 18.0.0)
node --version

# 检查npm (需要 >= 9.0.0)
npm --version

# 如果版本太旧，从https://nodejs.org下载最新版本
```

---

## 🌐 生产部署（可选）

```bash
# Linux/Mac
./deploy-prod.sh

# Windows
deploy-prod.bat
```

需要 Docker 和 Docker Compose

---

## 📝 完整文档导航

| 文档 | 用途 | 阅读时间 |
|------|------|---------|
| 本文档 | ⚡快速参考 | 5分钟 |
| START_GUIDE.md | 详细启动步骤 | 15分钟 |
| TROUBLESHOOTING.md | 问题诊断和解决 | 30分钟 |
| INTEGRATION_TEST_SUMMARY.md | 自动化测试参考 | 20分钟 |
| PRODUCTION_DEPLOYMENT_GUIDE.md | 生产部署详细指南 | 1小时 |
| SESSION_SUMMARY_COMPLETE.md | 完整会话总结 | 30分钟 |

---

## ✨ 成功标志

启动成功的标志 ✓ :
```
[1] ✅ 看到后端窗口显示 "服务器已启动"
[2] ✅ 看到前端窗口显示 "Local: http://localhost:5174"
[3] ✅ 浏览器自动打开并显示网页
[4] ✅ 浏览器F12 Console没有红色错误
[5] ✅ 能点击页面上的按钮或输入框
```

如果全部 ✅ 显示，说明系统运行正常！

---

**最后更新**: 2025-10-24
**版本**: 1.0
**状态**: ✅ 立即可用

🎉 **现在就开始吧！** 双击 `START-ALL.bat` 👉 🚀

